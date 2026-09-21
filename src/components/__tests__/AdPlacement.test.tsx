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
  // survives localStorage.clear() — clear consent keys through the store so
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
    expect(pushes[0]).toEqual({}); // personalization request — no NPA flag
  });

  it('renders a visible reserved ad space when no provider is configured (crawlable slot, no layout shift)', () => {
    const { container } = renderPlacement();
    const slot = container.querySelector('[data-ad-slot-family="header"]');
    expect(slot).not.toBeNull();
    expect(slot?.getAttribute('aria-label')).toBe('Advertisement');
    expect(container.querySelector('[data-ad-slot-reserved="true"]')).not.toBeNull();
    expect(container.textContent).toContain('Reserved ad space');
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
});
