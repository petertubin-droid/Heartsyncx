import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ConsentProvider, useConsentContext } from '../ConsentProvider';
import { heartsync } from '../../store';

const Probe = ({ onChange }: { onChange?: (s: any) => void }) => {
  const ctx = useConsentContext();
  useEffect(() => { onChange?.(ctx); }, [ctx.hasConsented, ctx.preferences.marketing]);
  return <div data-testid="has-consented">{String(ctx.hasConsented)}</div>;
};

describe('ConsentProvider (cookie consent + ad script gating)', () => {
  beforeEach(() => {
  // The store mirrors localStorage in an in-memory virtualStorageMap that
  // survives localStorage.clear()  - clear consent keys through the store so
  // consent state never leaks between tests.
  heartsync.setLocalStorage('heartsync_cookie_consent', null);
  heartsync.setLocalStorage('heartsync_cookie_preferences', null);
    localStorage.clear();
    document.cookie = 'heartsync_cookie_consent=; max-age=0; path=/';
    document.querySelectorAll('script[id^="heartsync-"]').forEach(el => el.remove());
    // reset store settings to honest defaults
    heartsync.site_settings.adsense_active = true;
    heartsync.site_settings.adsense_client_id = '';
    heartsync.site_settings.ga_measurement_id = '';
    heartsync.site_settings.monetag_active = false;
    heartsync.site_settings.monetag_zone_id = '';
    heartsync.site_settings.adsterra_active = false;
    heartsync.site_settings.adsterra_key_id = '';
    heartsync.site_settings.meta_pixel_id = '';
  });

  it('starts in default-DENIED consent mode when the visitor has not chosen (Consent Mode v2)', () => {
    render(<ConsentProvider><Probe /></ConsentProvider>);
    expect(screen.getByTestId('has-consented').textContent).toBe('false');
    const consentDefaults = (window.dataLayer || []).find((e: any[]) => e[0] === 'consent' && e[1] === 'default');
    expect(consentDefaults).toBeTruthy();
    expect((consentDefaults![2] as any).ad_storage).toBe('denied');
    expect((consentDefaults![2] as any).ad_user_data).toBe('denied');
    expect((consentDefaults![2] as any).ad_personalization).toBe('denied');
  });

  it('injects NO ad network scripts before any consent choice', () => {
    render(<ConsentProvider><Probe /></ConsentProvider>);
    expect(document.getElementById('heartsync-adsense-script')).toBeNull();
    expect(document.getElementById('heartsync-monetag-script')).toBeNull();
    expect(document.getElementById('heartsync-adsterra-script')).toBeNull();
    expect(document.getElementById('heartsync-meta-pixel-script')).toBeNull();
  });

  it('acceptAll persists consent + full preferences and grants consent mode', () => {
    let ctx: any;
    render(<ConsentProvider><Probe onChange={c => ctx = c} /></ConsentProvider>);
    act(() => ctx.acceptAll());
    expect(localStorage.getItem('heartsync_cookie_consent')).toBe(JSON.stringify('accepted'));
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_preferences')!)).toEqual({
      necessary: true, analytics: true, marketing: true, functional: true
    });
    const all = (window.dataLayer || []) as any[];
    const update = [...all].reverse().find((e: any[]) => e[0] === 'consent' && e[1] === 'update');
    expect((update![2] as any).ad_storage).toBe('granted');
  });

  it('rejectAll records rejection and NEVER injects Monetag/Adsterra/Meta scripts', () => {
    let ctx: any;
    render(<ConsentProvider><Probe onChange={c => ctx = c} /></ConsentProvider>);
    act(() => ctx.rejectAll());
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_consent')!)).toBe('rejected');
    expect(ctx.preferences.marketing).toBe(false);
    expect(document.getElementById('heartsync-monetag-script')).toBeNull();
    expect(document.getElementById('heartsync-adsterra-script')).toBeNull();
    expect(document.getElementById('heartsync-meta-pixel-script')).toBeNull();
  });

  it('injects Monetag only when active + zone configured + marketing consented, never with fake defaults', () => {
    heartsync.site_settings.monetag_active = true;
    heartsync.site_settings.monetag_zone_id = '987654';
    let ctx: any;
    render(<ConsentProvider><Probe onChange={c => ctx = c} /></ConsentProvider>);
    // reject all first: hasConsented true but marketing false → still nothing
    act(() => ctx.rejectAll());
    expect(document.getElementById('heartsync-monetag-script')).toBeNull();
    // now grant marketing
    act(() => ctx.acceptAll());
    const s = document.getElementById('heartsync-monetag-script');
    expect(s).not.toBeNull();
    expect(s!.getAttribute('src')).toBe('https://alwingulla.com/987654/tag.min.js');
  });

  it('never injects a Monetag/Adsterra script for an unconfigured network (no hardcoded test IDs)', () => {
    heartsync.site_settings.monetag_active = true;   // active but no zone
    heartsync.site_settings.adsterra_active = true;  // active but no key
    let ctx: any;
    render(<ConsentProvider><Probe onChange={c => ctx = c} /></ConsentProvider>);
    act(() => ctx.acceptAll());
    expect(document.getElementById('heartsync-monetag-script')).toBeNull();
    expect(document.getElementById('heartsync-adsterra-script')).toBeNull();
  });

  it('savePreferences stores a custom split and updates consent mode per category', () => {
    let ctx: any;
    render(<ConsentProvider><Probe onChange={c => ctx = c} /></ConsentProvider>);
    act(() => ctx.savePreferences({ necessary: true, analytics: true, marketing: false, functional: false }));
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_consent')!)).toBe('custom');
    expect(ctx.preferences.analytics).toBe(true);
    expect(ctx.preferences.marketing).toBe(false);
    const all = (window.dataLayer || []) as any[];
    const update = [...all].reverse().find((e: any[]) => e[0] === 'consent' && e[1] === 'update');
    expect((update![2] as any).analytics_storage).toBe('granted');
    expect((update![2] as any).ad_storage).toBe('denied');
  });

  it('resetConsent wipes stored state back to not-consented', () => {
    let ctx: any;
    render(<ConsentProvider><Probe onChange={c => ctx = c} /></ConsentProvider>);
    act(() => ctx.acceptAll());
    act(() => ctx.resetConsent());
    expect(localStorage.getItem('heartsync_cookie_consent')).toBeNull();
    expect(ctx.hasConsented).toBe(false);
    expect(ctx.preferences.marketing).toBe(false);
  });

  it('restores a prior accepted choice on mount (consent persistence)', () => {
    localStorage.setItem('heartsync_cookie_consent', JSON.stringify('accepted'));
    localStorage.setItem('heartsync_cookie_preferences', JSON.stringify({ necessary: true, analytics: true, marketing: true, functional: true }));
    render(<ConsentProvider><Probe /></ConsentProvider>);
    expect(screen.getByTestId('has-consented').textContent).toBe('true');
  });

  it('throws honestly when used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/must be used within a ConsentProvider/);
    spy.mockRestore();
  });
});
