import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ConsentProvider, useConsentContext } from "../ConsentProvider";
import { AdNetworkScripts } from "../AdNetworkScripts";
import { heartsync } from "../../store";

const Grant = () => {
  const { acceptAll } = useConsentContext();
  return (
    <button onClick={acceptAll} data-testid="grant">
      grant
    </button>
  );
};

function renderWithGrant() {
  return render(
    <ConsentProvider>
      <Grant />
      <AdNetworkScripts />
    </ConsentProvider>,
  );
}

describe("AdNetworkScripts (site-wide Monetag/Adsterra snippet injection)", () => {
  beforeEach(() => {
    // The store mirrors localStorage in an in-memory virtualStorageMap that
    // survives localStorage.clear()  - clear consent keys through the store so
    // consent state never leaks between tests.
    heartsync.setLocalStorage("heartsync_cookie_consent", null);
    heartsync.setLocalStorage("heartsync_cookie_preferences", null);
    localStorage.clear();
    document.head.querySelectorAll("script").forEach((el) => el.remove());
    heartsync.site_settings.monetag_active = false;
    heartsync.site_settings.monetag_zone_id = "";
    heartsync.site_settings.monetag_script_code = "";
    heartsync.site_settings.adsterra_active = false;
    heartsync.site_settings.adsterra_popunder_script = "";
    heartsync.site_settings.adsterra_social_bar_script = "";
    heartsync.site_settings.adsterra_interstitial_script = "";
    heartsync.site_settings.adsterra_inpage_push_script = "";
  });

  it("renders nothing and injects nothing before consent", () => {
    const { container } = renderWithGrant();
    expect(container.textContent).toBe("grant");
    expect(
      document.querySelectorAll('script[src*="alwingulla.com"]').length,
    ).toBe(0);
  });

  it("injects the standard Monetag MultiTag loader from an active zone id after consent", async () => {
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_zone_id = "275352";
    renderWithGrant();
    act(() => {
      screen.getByTestId("grant").click();
    });
    const s = await waitFor(() =>
      document.querySelector(
        'script[data-heartsync-injected][src="https://alwingulla.com/275352/tag.min.js"]',
      ),
    );
    expect(s).not.toBeNull();
    expect(s?.getAttribute("data-zone")).toBe("275352");
    expect(s?.getAttribute("data-cfasync")).toBe("false");
  });

  it("derives the Monetag loader from the zone id when a stale script_code snippet conflicts", async () => {
    // Regression: the admin-portal generator baked a hardcoded /88/ URL path
    // into monetag_script_code while data-zone held the real zone. The stored
    // snippet loaded a foreign zone's tag and ads silently stopped serving.
    // The zone id is the source of truth and must win.
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_zone_id = "284167";
    heartsync.site_settings.monetag_script_code =
      '<script src="https://alwingulla.com/88/tag.min.js" data-zone="284167" async data-cfasync="false"></script>';
    renderWithGrant();
    act(() => {
      screen.getByTestId("grant").click();
    });
    const s = await waitFor(() =>
      document.querySelector(
        'script[data-heartsync-injected][src="https://alwingulla.com/284167/tag.min.js"]',
      ),
    );
    expect(s).not.toBeNull();
    expect(s?.id).toBe("heartsync-monetag-script");
    expect(s?.getAttribute("data-zone")).toBe("284167");
    // the stale /88/ loader must NOT be injected
    expect(
      document.querySelector(
        'script[data-heartsync-injected][src="https://alwingulla.com/88/tag.min.js"]',
      ),
    ).toBeNull();
    heartsync.site_settings.monetag_zone_id = "";
  });

  it("injects custom dashboard snippets exactly (Monetag script_code field)", async () => {
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_script_code =
      '<script src="https://example-monetag.test/tag.js" data-zone="abc" async></script>';
    renderWithGrant();
    act(() => {
      screen.getByTestId("grant").click();
    });
    await waitFor(() =>
      expect(
        document.querySelector(
          'script[data-heartsync-injected][src="https://example-monetag.test/tag.js"]',
        ),
      ).not.toBeNull(),
    );
  });

  it("injects each active Adsterra site-wide format snippet after consent", async () => {
    heartsync.site_settings.adsterra_active = true;
    heartsync.site_settings.adsterra_popunder_script =
      '<script src="https://popunder.example/k1.js"></script>';
    heartsync.site_settings.adsterra_social_bar_script =
      '<script src="https://socialbar.example/k2.js"></script>';
    renderWithGrant();
    act(() => {
      screen.getByTestId("grant").click();
    });
    await waitFor(() =>
      expect(
        document.querySelector(
          'script[data-heartsync-injected][src="https://popunder.example/k1.js"]',
        ),
      ).not.toBeNull(),
    );
    await waitFor(() =>
      expect(
        document.querySelector(
          'script[data-heartsync-injected][src="https://socialbar.example/k2.js"]',
        ),
      ).not.toBeNull(),
    );
  });

  it("injects nothing when providers are inactive even if snippets are present", async () => {
    heartsync.site_settings.adsterra_active = false;
    heartsync.site_settings.adsterra_popunder_script =
      '<script src="https://popunder.example/k1.js"></script>';
    renderWithGrant();
    act(() => {
      screen.getByTestId("grant").click();
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(
      document.querySelector("script[data-heartsync-injected]"),
    ).toBeNull();
  });

  it("never double-injects on repeated consent updates", async () => {
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_zone_id = "275352";
    renderWithGrant();
    act(() => {
      screen.getByTestId("grant").click();
    });
    await waitFor(() =>
      expect(
        document.querySelectorAll("script[data-heartsync-injected]").length,
      ).toBe(1),
    );
    const before = document.querySelectorAll(
      "script[data-heartsync-injected]",
    ).length;
    // re-grant via a second render cycle
    act(() => {
      screen.getByTestId("grant").click();
    });
    expect(
      document.querySelectorAll("script[data-heartsync-injected]").length,
    ).toBe(before);
  });

  it("silently ignores malformed snippet markup instead of crashing", async () => {
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_script_code = "<<<not valid html>>>";
    expect(() => {
      renderWithGrant();
      act(() => {
        screen.getByTestId("grant").click();
      });
    }).not.toThrow();
  });
});
