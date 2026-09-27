// Regression tests for the in-article ad height clipping repair (Sep 27, 2026).
//
// Two independent defects combined to clip every in-article ad:
//   1. CSS: #heartsync-premium-article-reading-body iframe{height:auto
//      !important} overrode the ad frame's measured inline height and pinned
//      it to the browser's 150px default iframe height.
//   2. The native srcDocs carried a min-height:300px body pin that floored
//      every measurement, so short creatives kept dead space and no-fills
//      kept a 300px blank box.
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ConsentProvider, useConsentContext } from '../ConsentProvider';
import { AdPlacement } from '../AdPlacement';
import { heartsync } from '../../store';

const ConsentProbe = ({ children }: { children: React.ReactNode }) => {
  const { acceptAll } = useConsentContext();
  return (
    <div>
      <button onClick={acceptAll} data-testid="grant">grant</button>
      {children}
    </div>
  );
};

function renderPlacement(slot: any = 'header') {
  return render(
    <ConsentProvider>
      <ConsentProbe>
        <AdPlacement slot={slot} />
      </ConsentProbe>
    </ConsentProvider>
  );
}

const NATIVE_SNIPPET_INVOKE =
  '<script src="https://pl31453269.profitableratecpmnetwork.com/a1b2c3d4e5f60718293a0b4c5d6e7f8/invoke.js"></script>' +
  '<div id="container-a1b2c3d4e5f60718293a0b4c5d6e7f8"></div>';

describe('Ad frame height (no clipping, no permanent reservations)', () => {
  beforeEach(() => {
    heartsync.setLocalStorage('heartsync_cookie_consent', null);
    heartsync.setLocalStorage('heartsync_cookie_preferences', null);
    localStorage.clear();
    heartsync.site_settings.adsense_client_id = '';
    heartsync.site_settings.adsense_active = true;
    heartsync.site_settings.banner_header_enabled = undefined;
    heartsync.site_settings.adsterra_key_header = '';
    heartsync.site_settings.adsterra_active = true;
    heartsync.site_settings.adsterra_url_header = '';
  });

  it('never forces height:auto on iframes inside the article reading body (the 150px clipping bug)', () => {
    const css = readFileSync(join(__dirname, '../../utils/index.css'), 'utf8');
    // The img/video group keeps height:auto; the iframe rule must only
    // constrain width. Any iframe selector carrying height:auto !important
    // inside the reading body re-creates the clipping bug.
    const m = css.match(/#heartsync-premium-article-reading-body iframe\s*{([^}]*)}/);
    expect(m).not.toBeNull();
    expect(m![1]).toContain('max-width: 100% !important');
    expect(m![1]).not.toContain('height');
    // And the img/video rule must no longer list iframe at all.
    const imgVideo = css.match(/#heartsync-premium-article-reading-body img,\s*#heartsync-premium-article-reading-body video\s*{/);
    expect(imgVideo).not.toBeNull();
  });

  it('native ad srcDoc carries no min-height pin yet still starts at the roomy initial height', () => {
    heartsync.site_settings.adsterra_key_in_article = NATIVE_SNIPPET_INVOKE;
    const { container } = renderPlacement('in_article');
    act(() => {
      document.querySelectorAll('[data-testid="grant"]').forEach((b) => (b as HTMLElement).click());
    });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    const src = iframe.getAttribute('srcdoc') || '';
    // No fixed document pin: the measured creative height defines the frame.
    expect(src).not.toContain('min-height');
    // Roomy initial viewport for the provider's layout (300px), not a fixed
    // 90/100px, and not zero.
    expect(iframe.style.height).toBe('300px');
  });

  it('Monetag native srcDoc carries no min-height pin either', () => {
    heartsync.site_settings.adsterra_active = false;
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_loader_url = 'https://alwingulla.com/1a2b3c4d5e/loader.min.js';
    heartsync.site_settings.monetag_zone_in_article = '<script src="https://alwingulla.com/88990011/tag.min.js" data-zone="88990011" async data-cfasync="false"></script>';
    const { container } = renderPlacement('in_article');
    act(() => {
      document.querySelectorAll('[data-testid="grant"]').forEach((b) => (b as HTMLElement).click());
    });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    const src = iframe.getAttribute('srcdoc') || '';
    expect(src).not.toContain('min-height');
    expect(src).toContain('tag.min.js');
    expect(iframe.style.height).toBe('300px');
  });

  it('classic Adsterra banner starts at its declared creative height (no universal fixed height)', () => {
    heartsync.site_settings.adsterra_key_header =
      `<script> atOptions = { 'key' : 'cc0e07aff6cf4787d7a8d08e2b12278c', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} }; </script>` +
      `<script src="https://www.highrevenueformat.com/cc0e07aff6cf4787d7a8d08e2b12278c/invoke.js"></script>`;
    const { container } = renderPlacement('header');
    act(() => {
      document.querySelectorAll('[data-testid="grant"]').forEach((b) => (b as HTMLElement).click());
    });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    expect(iframe.style.height).toBe('90px');
    const src = iframe.getAttribute('srcdoc') || '';
    expect(src).not.toContain('min-height');
  });
});
