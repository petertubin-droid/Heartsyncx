import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ConsentProvider, useConsentContext } from '../ConsentProvider';
import { AdPlacement } from '../AdPlacement';
import { heartsync } from '../../store';

const ConsentProbe = ({ children }: { children: React.ReactNode }) => {
  const { acceptAll, savePreferences } = useConsentContext();
  return (
    <div>
      <button onClick={acceptAll} data-testid="grant">grant</button>
      <button onClick={() => savePreferences({ necessary: true, analytics: false, marketing: false, functional: false })} data-testid="npa">reject-marketing</button>
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

describe('AdPlacement (policy-honest ad rendering)', () => {
  beforeEach(() => {
  // The store mirrors localStorage in an in-memory virtualStorageMap that
  // survives localStorage.clear()  - clear consent keys through the store so
  // consent state never leaks between tests.
  heartsync.setLocalStorage('heartsync_cookie_consent', null);
  heartsync.setLocalStorage('heartsync_cookie_preferences', null);
    localStorage.clear();
    (window as any).adsbygoogle = undefined;
    document.querySelectorAll('script[data-adsense="true"]').forEach(el => el.remove());
    heartsync.site_settings.adsense_client_id = '';
    heartsync.site_settings.adsense_active = true;
    heartsync.site_settings.adsense_slot_header = '';
    heartsync.site_settings.adsense_slot_sidebar = '';
    heartsync.site_settings.adsense_slot_in_article = '';
    heartsync.site_settings.banner_header_enabled = undefined;
    heartsync.site_settings.adsterra_key_header = '';
    heartsync.site_settings.adsterra_active = false;
  });

  it('renders crawler-visible slot markup before consent (AdSense review: slots must be visible to the crawler)', () => {
    heartsync.site_settings.adsense_client_id = 'ca-pub-3404100134534192';
    heartsync.site_settings.adsense_slot_header = '1234567890';
    const { container } = renderPlacement();
    // Markup exists for the crawler...
    expect(container.querySelector('[data-ad-slot-family="header"]')).not.toBeNull();
    const ins = container.querySelector('ins.adsbygoogle');
    expect(ins?.getAttribute('data-ad-client')).toBe('ca-pub-3404100134534192');
    expect(ins?.getAttribute('data-ad-slot')).toBe('1234567890');
    // ...but the unit is not ACTIVATED (no adsbygoogle push) until consent.
    expect(window.adsbygoogle ?? []).toEqual([]);
  });

  it('renders a labelled AdSense unit after consent with client + slot set', () => {
    heartsync.site_settings.adsense_client_id = 'ca-pub-3404100134534192';
    heartsync.site_settings.adsense_slot_header = '1234567890';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const unit = container.querySelector('[data-ad-slot-family="header"]');
    expect(unit).not.toBeNull();
    expect(unit?.getAttribute('aria-label')).toBe('Advertisement');
    expect(container.querySelector('span')?.textContent).toBe('Advertisement');
    const ins = container.querySelector('ins.adsbygoogle');
    expect(ins?.getAttribute('data-ad-client')).toBe('ca-pub-3404100134534192');
    expect(ins?.getAttribute('data-ad-slot')).toBe('1234567890');
  });

  it('survives the consent flip without a hook-order crash (regression: hooks ran after early returns)', () => {
    heartsync.site_settings.adsense_client_id = 'ca-pub-3404100134534192';
    heartsync.site_settings.adsense_slot_header = '1234567890';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    // If the hook order had been conditional, this re-render would have thrown
    // "Rendered more hooks than during the previous render".
    expect(container.querySelector('ins.adsbygoogle')).not.toBeNull();
    act(() => { screen.getByTestId('npa').click(); });
    expect(container.querySelector('ins.adsbygoogle')).not.toBeNull();
  });

  it('requests non-personalized ads when marketing consent is denied (Google NPA policy)', () => {
    heartsync.site_settings.adsense_client_id = 'ca-pub-3404100134534192';
    heartsync.site_settings.adsense_slot_header = '1234567890';
    renderPlacement();
    (window as any).adsbygoogle = []; // isolate this unit's push from any earlier render noise
    act(() => { screen.getByTestId('npa').click(); }); // consent given, marketing denied
    const pushes = (window.adsbygoogle || []);
    expect(pushes.length).toBeGreaterThan(0);
    const last = pushes[pushes.length - 1] as any;
    expect(last.requestNonPersonalizedAds).toBe(1);
  });

  it('pushes a plain personalization request when marketing is granted', () => {
    heartsync.site_settings.adsense_client_id = 'ca-pub-3404100134534192';
    heartsync.site_settings.adsense_slot_header = '1234567890';
    renderPlacement();
    (window as any).adsbygoogle = []; // isolate this unit's push
    act(() => { screen.getByTestId('grant').click(); });
    const pushes = (window.adsbygoogle || []);
    expect(pushes).toHaveLength(1);
    expect(pushes[0]).toEqual({}); // personalization request  - no NPA flag
  });

  it('renders nothing at all when no provider is configured (no reserved blank area)', () => {
    // No provider for the slot: the placement must collapse completely
    // instead of reserving a blank rectangle (no-fill collapse rule).
    const { container } = renderPlacement();
    expect(container.querySelector('[data-ad-slot-family]')).toBeNull();
    expect(container.querySelector('[data-ad-slot-reserved="true"]')).toBeNull();
    expect(container.textContent).not.toContain('Reserved ad space');
  });

  it('honors the per-slot visibility toggle (banner_header_enabled=false)', () => {
    heartsync.site_settings.adsense_client_id = 'ca-pub-3404100134534192';
    heartsync.site_settings.adsense_slot_header = '1234567890';
    heartsync.site_settings.banner_header_enabled = false;
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    expect(container.querySelector('[data-ad-slot-family]')).toBeNull();
  });

  it('falls back to a sandboxed Adsterra banner when AdSense is unconfigured but an Adsterra key exists', () => {
    heartsync.site_settings.adsterra_active = true; // master switch now honored by AdPlacement
    heartsync.site_settings.adsterra_key_header = 'a1b2c3d4e5f60718293a';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('sandbox')).toContain('allow-scripts');
    const src = (iframe as HTMLIFrameElement).getAttribute('srcdoc') || '';
    expect(src).toContain("atOptions = { 'key' : 'a1b2c3d4e5f60718293a'");
    expect(src).toContain("'format' : '728x90'");
    expect(src).toContain('highperformanceformat.com/a1b2c3d4e5f60718293a/invoke.js');
  });

  it('extracts the key from a pasted full Adsterra snippet (publishers paste the whole snippet, not the bare key)', () => {
    heartsync.site_settings.adsterra_active = true; // master switch now honored by AdPlacement
    heartsync.site_settings.adsterra_key_article_bottom =
      `<script> atOptions = { 'key' : 'cc0e07aff6cf4787d7a8d08e2b12278c', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} }; </script>` +
      `<script src="https://www.highrevenueformat.com/cc0e07aff6cf4787d7a8d08e2b12278c/invoke.js"></script>`;
    const { container } = renderPlacement('article_bottom');
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]');
    expect(iframe).not.toBeNull();
    const src = (iframe as HTMLIFrameElement).getAttribute('srcdoc') || '';
    expect(src).toContain("atOptions = { 'key' : 'cc0e07aff6cf4787d7a8d08e2b12278c'");
    expect(src).toContain('highrevenueformat.com/cc0e07aff6cf4787d7a8d08e2b12278c/invoke.js');
  });

  it('extracts the key from an invoke.js-only snippet paste', () => {
    heartsync.site_settings.adsterra_active = true; // master switch now honored by AdPlacement
    heartsync.site_settings.adsterra_key_header = '<script src="https://www.highperformanceformat.com/deadbeefdeadbeefdeadbeefdeadbeef/invoke.js"></script>';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]');
    expect(iframe).not.toBeNull();
    expect((iframe as HTMLIFrameElement).getAttribute('srcdoc')).toContain('highperformanceformat.com/deadbeefdeadbeefdeadbeefdeadbeef/invoke.js');
  });

  it('honors the per-slot URL field: a full invoke.js URL overrides the serving domain', () => {
    heartsync.site_settings.adsterra_active = true; // master switch now honored by AdPlacement
    heartsync.site_settings.adsterra_key_header = 'a1b2c3d4e5f60718293a';
    heartsync.site_settings.adsterra_url_header = 'https://www.effectivegatecpm.com/a1b2c3d4e5f60718293a/invoke.js';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]');
    expect(iframe).not.toBeNull();
    expect((iframe as HTMLIFrameElement).getAttribute('srcdoc')).toContain('effectivegatecpm.com/a1b2c3d4e5f60718293a/invoke.js');
    heartsync.site_settings.adsterra_url_header = '';
  });

  it('accepts a bare domain in the per-slot URL field', () => {
    heartsync.site_settings.adsterra_active = true; // master switch now honored by AdPlacement
    heartsync.site_settings.adsterra_key_header = 'a1b2c3d4e5f60718293a';
    heartsync.site_settings.adsterra_url_header = 'highrevenueformat.com';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]');
    expect((iframe as HTMLIFrameElement).getAttribute('srcdoc')).toContain('//www.highrevenueformat.com/a1b2c3d4e5f60718293a/invoke.js');
    heartsync.site_settings.adsterra_url_header = '';
  });

  it('renders from the URL field alone when the key field is empty (full invoke URL carries the key)', () => {
    heartsync.site_settings.adsterra_active = true; // master switch now honored by AdPlacement
    heartsync.site_settings.adsterra_key_header = '';
    heartsync.site_settings.adsterra_url_header = 'https://www.highperformanceformat.com/cc0e07aff6cf4787d7a8d08e2b12278c/invoke.js';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]');
    expect(iframe).not.toBeNull();
    const src = (iframe as HTMLIFrameElement).getAttribute('srcdoc') || '';
    expect(src).toContain("atOptions = { 'key' : 'cc0e07aff6cf4787d7a8d08e2b12278c'");
    heartsync.site_settings.adsterra_url_header = '';
  });

  it('collapses the slot when a pasted value contains no valid key', () => {
    heartsync.site_settings.adsterra_key_header = '<script>alert("no key here")</script>';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('[data-ad-slot-reserved="true"]')).toBeNull();
    expect(container.querySelector('[data-ad-slot-family]')).toBeNull();
  });

  it('ignores an invalid Adsterra key (wrong shape = no ad, not a broken iframe)', () => {
    heartsync.site_settings.adsterra_key_header = 'not-a-valid-key';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('uses the in-article AdSense layout for in_article slots', () => {
    heartsync.site_settings.adsense_client_id = 'ca-pub-3404100134534192';
    heartsync.site_settings.adsense_slot_in_article = '9876543210';
    const { container } = render(
      <ConsentProvider>
        <ConsentProbe><AdPlacement slot="in_article" /></ConsentProbe>
      </ConsentProvider>
    );
    act(() => { screen.getByTestId('grant').click(); });
    const ins = container.querySelector('ins.adsbygoogle');
    expect(ins?.getAttribute('data-ad-layout')).toBe('in-article');
    expect(ins?.getAttribute('data-ad-format')).toBe('fluid');
  });

  it('suppresses the Adsterra banner when the adsterra_active master switch is off', () => {
    heartsync.site_settings.adsterra_key_header = 'a1b2c3d4e5f60718293a';
    heartsync.site_settings.adsterra_active = false;
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    expect(container.querySelector('iframe[title="Advertisement"]')).toBeNull();
    // No other provider configured: the whole slot collapses, no reserved box.
    expect(container.querySelector('[data-ad-slot-reserved="true"]')).toBeNull();
    expect(container.querySelector('[data-ad-slot-family]')).toBeNull();
  });

  it('honors a pasted snippet with non-default dimensions (native banner size, e.g. 320x50)', () => {
    heartsync.site_settings.adsterra_active = true;
    heartsync.site_settings.adsterra_key_header = `atOptions = { 'key' : 'a1b2c3d4e5f60718293a', 'format' : 'iframe', 'height' : 50, 'width' : 320, 'params' : {} };`;
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcdoc') || '';
    expect(srcDoc).toContain("'height' : 50");
    expect(srcDoc).toContain("'width' : 320");
    expect(srcDoc).toContain("'format' : 'iframe'");
    expect(iframe.getAttribute('style') || '').toContain('height: 50px');
  });

  it('falls back to a Monetag native banner zone when AdSense and Adsterra are unconfigured', () => {
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_zone_header = '284167';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcdoc') || '';
    expect(srcDoc).toContain('alwingulla.com/284167/tag.min.js');
    expect(srcDoc).toContain('data-zone="284167"');
    heartsync.site_settings.monetag_zone_header = '';
  });

  it('does NOT lay the Monetag native banner out as a flex row (regression: title/description clipped, only the image showed)', () => {
    // Root cause reproduced from a live-phone screenshot: Monetag's
    // tag.min.js appends the image, headline and description as SEPARATE
    // sibling elements straight into <body> - it does not wrap them in one
    // container. `display:flex` (row) laid those siblings out SIDE BY SIDE,
    // each shrunk to its own content width, so the headline/description
    // were pushed outside the frame and sliced off by overflow:hidden -
    // only the image (the widest sibling) stayed visible. Plain block flow
    // stacks every appended sibling full-width, which is what a native ad
    // card needs.
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_zone_header = '284167';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const srcDoc = (container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement)?.getAttribute('srcdoc') || '';
    expect(srcDoc).not.toContain('display:flex');
    expect(srcDoc).not.toMatch(/justify-content/);
    expect(srcDoc).not.toMatch(/align-items/);
    // Guard so a single wide creative element still can't force overflow.
    expect(srcDoc).toContain('max-width:100%');
    heartsync.site_settings.monetag_zone_header = '';
  });

  it('uses the account domain from the Monetag MultiTag snippet for bare zone ids', () => {
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_script_code = '<script src="https://alwingulla.com/284167/tag.min.js" data-zone="284167" async data-cfasync="false"></script>';
    heartsync.site_settings.monetag_zone_header = '555123';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const srcDoc = (container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement)?.getAttribute('srcdoc') || '';
    expect(srcDoc).toContain('alwingulla.com/555123/tag.min.js');
    heartsync.site_settings.monetag_zone_header = '';
  });

  it('suppresses the Monetag banner when the monetag_active master switch is off', () => {
    heartsync.site_settings.monetag_active = false;
    heartsync.site_settings.monetag_zone_header = '284167';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    expect(container.querySelector('iframe[title="Advertisement"]')).toBeNull();
    heartsync.site_settings.monetag_zone_header = '';
  });
});

describe('Adsterra Native Banner units (configured via admin per-slot fields)', () => {
  beforeEach(() => {
    heartsync.setLocalStorage('heartsync_cookie_consent', null);
    heartsync.setLocalStorage('heartsync_cookie_preferences', null);
    localStorage.clear();
    heartsync.site_settings.adsense_client_id = '';
    heartsync.site_settings.adsterra_key_header = '';
    heartsync.site_settings.adsterra_url_header = '';
    heartsync.site_settings.adsterra_active = true;
  });

  it('renders a classic native banner (invoke.js + container-<key>) into its container on the snippet domain', () => {
    // Exact shape Adsterra issues for the classic Native Banner format.
    heartsync.site_settings.adsterra_key_header =
      '<script async="async" data-cfasync="false" src="//pl31453269.profitableratecpmnetwork.com/a1b2c3d4e5f60718293a/invoke.js"></script><div id="container-a1b2c3d4e5f60718293a"></div>';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcdoc') || '';
    // Native banner: container div + invoke.js served from the snippet's
    // own account subdomain (never the banner default domain).
    expect(srcDoc).toContain('id="container-a1b2c3d4e5f60718293a"');
    expect(srcDoc).toContain('https://pl31453269.profitableratecpmnetwork.com/a1b2c3d4e5f60718293a/invoke.js');
    expect(srcDoc).not.toContain('highperformanceformat.com');
    expect(srcDoc).not.toContain('atOptions');
  });

  it('renders the newer native.js tag without a container div', () => {
    heartsync.site_settings.adsterra_key_header =
      '<script async data-cfasync="false" src="https://pl31453269.profitableratecpmnetwork.com/a1b2c3d4e5f60718293a/native.js"></script>';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcdoc') || '';
    expect(srcDoc).toContain('https://pl31453269.profitableratecpmnetwork.com/a1b2c3d4e5f60718293a/native.js');
    expect(srcDoc).not.toContain('container-');
    expect(srcDoc).not.toContain('atOptions');
  });

  it('still renders a banner snippet through the atOptions path (native detection does not swallow banners)', () => {
    heartsync.site_settings.adsterra_key_header =
      "atOptions = { 'key' : 'a1b2c3d4e5f60718293a', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };";
    heartsync.site_settings.adsterra_url_header = 'https://www.highrevenueformat.com/a1b2c3d4e5f60718293a/invoke.js';
    const { container } = renderPlacement();
    act(() => { screen.getByTestId('grant').click(); });
    const iframe = container.querySelector('iframe[title="Advertisement"]') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    const srcDoc = iframe.getAttribute('srcdoc') || '';
    expect(srcDoc).toContain('atOptions');
    expect(srcDoc).toContain("'height' : 90");
    expect(srcDoc).toContain('www.highrevenueformat.com/a1b2c3d4e5f60718293a/invoke.js');
    expect(srcDoc).not.toContain('container-');
  });

  it('exposes native units to the connectivity checker with the right probe URL', async () => {
    const { normalizeAdsterraUnit } = await import('../AdPlacement');
    const unit = normalizeAdsterraUnit(
      '<script async="async" data-cfasync="false" src="//pl31453269.profitableratecpmnetwork.com/a1b2c3d4e5f60718293a/invoke.js"></script><div id="container-a1b2c3d4e5f60718293a"></div>'
    );
    expect(unit?.native).toBe('invoke');
    expect(unit?.domain).toBe('pl31453269.profitableratecpmnetwork.com');
    const bannerUnit = normalizeAdsterraUnit(
      "atOptions = { 'key' : 'a1b2c3d4e5f60718293a', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };"
    );
    expect(bannerUnit?.native).toBeUndefined();
    expect(bannerUnit?.height).toBe(90);
  });
});
