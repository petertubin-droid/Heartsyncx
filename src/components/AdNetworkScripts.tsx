import React, { useEffect, useRef, useState } from 'react';
import { heartsync } from '../store';
import { isAdminLocation, removeInjectedAdScripts } from '../utils/adminArea';
import { useCookieConsent } from './useCookieConsent';

/**
 * Site-wide ad-network script injector.
 *
 * Monetag and Adsterra's site-level formats (Monetag MultiTag: OnClick
 * Popunder + Push Notifications + In-Page Push + Vignette; Adsterra:
 * Popunder, Social Bar, Interstitial, In-Page Push) are deployed by pasting
 * a per-zone snippet from the publisher dashboard into the page. This
 * component injects those snippets exactly as the networks issue them:
 *
 * - Monetag: the MultiTag snippet (settings.monetag_script_code). If only a
 *   zone id is provided, the standard MultiTag loader shape is used.
 * - Adsterra: one snippet field per site-wide format
 *   (adsterra_popunder_script, adsterra_social_bar_script,
 *   adsterra_interstitial_script, adsterra_inpage_push_script,
 *   adsterra_skim_script)  - paste each format's code from the dashboard.
 *   Adsterra's per-placement display units (Banners and Native Banners,
 *   any of their sizes) and the Direct Link / Smartlink are wired in
 *   AdPlacement.tsx instead.
 *
 * Everything is consent-gated: nothing injects until the visitor has
 * consented and accepted marketing cookies. Nothing renders when the
 * corresponding setting is empty or the provider is inactive.
 *
 * ADSENSE IS PRIMARY, OTHERS COEXIST FOR NOW (owner decision 2026-09-22):
 * AdSense has NOT yet approved the site, so Monetag/Adsterra keep serving —
 * they are the only live revenue and must NOT be blocked. AdSense takes
 * first claim on every placement slot (see AdPlacement.tsx); the other
 * networks fill whatever AdSense cannot serve yet.
 *
 * COMPLIANCE HEADS-UP (Google AdSense Program policies) for once AdSense is
 * approved and serving: pop-ups/pop-unders/interstitials and floating-box
 * formats are prohibited on pages carrying AdSense code, and the publisher
 * is responsible that no other ad network uses such methods to direct
 * traffic to those pages. At approval time the site-wide intrusive formats
 * (Monetag popunder/vignette/in-page push, Adsterra popunder/social bar/
 * interstitial) must be turned off in the admin portal. The portal shows
 * this warning on the Monetag/Adsterra tabs.
 */
export const AdNetworkScripts: React.FC = () => {
  const injectedRef = useRef(false);
  const { hasConsented, preferences } = useCookieConsent();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = heartsync.subscribe(() => setVersion((v) => v + 1));
    return () => unsub();
  }, []);

  // Admin-area suspension: App.tsx dispatches these events whenever the
  // active tab changes; a direct load at /admin starts suspended via
  // isAdminLocation().
  const [adsSuspended, setAdsSuspended] = useState<boolean>(isAdminLocation);
  useEffect(() => {
    const suspend = () => setAdsSuspended(true);
    const resume = () => setAdsSuspended(false);
    window.addEventListener('heartsync-ads-suspend', suspend);
    window.addEventListener('heartsync-ads-resume', resume);
    return () => {
      window.removeEventListener('heartsync-ads-suspend', suspend);
      window.removeEventListener('heartsync-ads-resume', resume);
    };
  }, []);

  // Entering the admin: strip every injected ad element so already-loaded
  // tags stop getting new trigger hooks, and allow re-injection on resume.
  useEffect(() => {
    if (!adsSuspended) return;
    removeInjectedAdScripts();
    injectedRef.current = false;
  }, [adsSuspended]);

  const s = heartsync.site_settings as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  void version;

  const monetagActive = s.monetag_active === true;
  const adsterraActive = s.adsterra_active === true;

  // Monetag: the configured zone id is the source of truth. A stored
  // monetag_script_code can go stale (an admin-portal bug generated the
  // snippet with a hardcoded /88/ URL path, loading a foreign zone's tag and
  // silently killing ad serving), so whenever a zone id is set the MultiTag
  // loader is derived from it and the stored snippet is ignored.
  const monetagZone = str(s.monetag_zone_id);
  // Optional explicit loader URL (e.g. a zone-specific tag URL from the
  // Monetag dashboard). When empty, the canonical MultiTag loader is derived
  // from the zone id: https://alwingulla.com/<zone>/tag.min.js
  const monetagLoaderUrl = str(s.monetag_loader_url);
  // A zone id (or explicit loader url) is the source of truth; a raw
  // monetag_script_code is honored ONLY when the provider is active and no
  // zone/loader is configured (a stale snippet must never override a zone,
  // and a disabled network must never inject at all).
  const monetagSnippet = !monetagActive
    ? ''
    : monetagLoaderUrl || monetagZone
      ? `<script id="heartsync-monetag-script" src="${monetagLoaderUrl || `https://alwingulla.com/${monetagZone}/tag.min.js`}" data-zone="${monetagZone}" async data-cfasync="false"></script>`
      : str(s.monetag_script_code);

  // Adsterra Popunder: the dashboard unit is a single script URL
  // (https://pl<id>.profitableratecpmnetwork.com/<path>.js). A dedicated URL
  // field takes precedence; a pasted full snippet works as before.
  const adsterraPopunderUrl = str(s.adsterra_popunder_url);
  const adsterraPopunderSnippet = adsterraPopunderUrl
    ? `<script src="${adsterraPopunderUrl}" async data-cfasync="false"></script>`
    : str(s.adsterra_popunder_script);

  const adsterraSnippets = adsterraActive
    ? [
        adsterraPopunderSnippet,
        str(s.adsterra_social_bar_script),
        str(s.adsterra_interstitial_script),
        str(s.adsterra_inpage_push_script),
        // Skim: Adsterra's site-wide snippet that converts existing outbound
        // links into monetized ones. Same injection path as the other
        // site-wide formats.
        str(s.adsterra_skim_script)
      ].filter(Boolean)
    : [];

  const marketingConsent = !!((preferences as unknown as Record<string, unknown> | undefined)?.marketing);
  const shouldInject = hasConsented && marketingConsent && (monetagSnippet || adsterraSnippets.length > 0);

  // Revived feature: adsense_auto_script  - the site-owner's own AdSense
  // loader snippet, injected on mount WITHOUT a consent gate (the loader is
  // the site's own ad infrastructure; the ad units inside AdPlacement still
  // honor consent and serve non-personalized ads without marketing consent).
  useEffect(() => {
    const code = str((heartsync.site_settings as Record<string, unknown>).adsense_auto_script);
    const marker = 'script[data-heartsync-injected="adsense-auto"]';
    // index.html already loads the canonical adsbygoogle.js - never add a
    // second copy of the library, whatever the pasted snippet contains.
    const adsenseLibraryPresent =
      document.getElementById('heartsync-adsense-script') ||
      [...document.querySelectorAll('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')][0];
    if (adsSuspended || !code || document.querySelector(marker) || adsenseLibraryPresent) return;
    try {
      const doc = new DOMParser().parseFromString(code, 'text/html');
      const targets = [...doc.head.querySelectorAll('script'), ...doc.body.querySelectorAll('script')];
      targets.forEach((oldScript) => {
        const fresh = document.createElement('script');
        Array.from(oldScript.attributes).forEach((a) => fresh.setAttribute(a.name, a.value));
        fresh.setAttribute('data-heartsync-injected', 'adsense-auto');
        fresh.textContent = oldScript.textContent;
        document.head.appendChild(fresh);
      });
    } catch {
      // Malformed snippet  - do nothing rather than break the page.
    }
  }, [version, adsSuspended]);

  useEffect(() => {
    if (!shouldInject || adsSuspended || injectedRef.current) return;
    injectedRef.current = true;

    const inject = (html: string) => {
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // A bare <script src=...> snippet parses into the parsed doc's <head>
        // (HTML parsing rules), so scan BOTH containers  - body-only missed the
        // single-script format that network dashboards emit most often.
        const targets = [...doc.head.querySelectorAll('script'), ...doc.body.querySelectorAll('script')];
        targets.forEach((old) => {
          const fresh = document.createElement('script');
          Array.from(old.attributes).forEach((a) => fresh.setAttribute(a.name, a.value));
          fresh.setAttribute('data-heartsync-injected', 'ad-network-scripts');
          fresh.textContent = old.textContent;
          document.head.appendChild(fresh);
        });
        // Non-script markup (rare, e.g. noscript fallbacks) appended at body end
        if (doc.body.children.length > 0) {
          Array.from(doc.body.children).forEach((el) => {
            if (el.tagName !== 'SCRIPT') document.body.appendChild(document.importNode(el, true));
          });
        }
      } catch {
        // Malformed snippet  - do nothing rather than break the page.
      }
    };

    // ConsentProvider.injectProductionScripts injects the same zone-derived
    // loader with this id; skip if already present so the tag never double-loads.
    if (monetagSnippet && !document.getElementById('heartsync-monetag-script')) inject(monetagSnippet);
    adsterraSnippets.forEach(inject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldInject, adsSuspended]);

  return null;
};

export default AdNetworkScripts;
