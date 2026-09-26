// @vitest-environment jsdom
// GA4 (Google Analytics 4) injection tests: analytics is consent-gated
// through Consent Mode v2, and the measurement ID comes from site settings
// (set via AdminConsole > Ad Networks) or the build env var.
import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { ConsentProvider, useConsentContext } from '../ConsentProvider';
import { heartsync } from '../../store';

const Probe = () => {
  const ctx = useConsentContext();
  return <div data-testid="has-consented">{String(ctx.hasConsented)}</div>;
};

describe('ConsentProvider GA4 injection', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'heartsync_cookie_consent=; max-age=0; path=/';
    document.querySelectorAll('script[id^="heartsync-"]').forEach((el) => el.remove());
    heartsync.site_settings.ga_measurement_id = '';
    heartsync.site_settings.monetag_active = false;
    heartsync.site_settings.adsterra_active = false;
    heartsync.site_settings.meta_pixel_id = '';
  });

  it('injects the gtag library + init with the settings measurement ID once analytics consent is granted', () => {
    heartsync.site_settings.ga_measurement_id = 'G-TEST1234';
    let ctx: any;
    render(
      <ConsentProvider>
        <Probe />
      </ConsentProvider>,
    );
    const banner = screen.queryByText(/accept/i, { selector: 'button' });
    void banner;
    // Reach in via the context by re-rendering with a probe that can act.
    const { container } = render(
      <ConsentProvider>
        <ProbeToggle onReady={(c: any) => (ctx = c)} />
      </ConsentProvider>,
    );
    void container;
    act(() => ctx?.acceptAll());
    const gtag = document.getElementById('heartsync-gtag-script') as HTMLScriptElement;
    expect(gtag).not.toBeNull();
    expect(gtag.src).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST1234');
    const init = document.getElementById('heartsync-gtag-init')!;
    expect(init.textContent).toContain("gtag('config', 'G-TEST1234'");
  });

  it('injects NOTHING when no measurement ID is configured (no demo IDs)', () => {
    heartsync.site_settings.ga_measurement_id = '';
    let ctx: any;
    render(
      <ConsentProvider>
        <ProbeToggle onReady={(c: any) => (ctx = c)} />
      </ConsentProvider>,
    );
    act(() => ctx?.acceptAll());
    expect(document.getElementById('heartsync-gtag-script')).toBeNull();
    expect(document.getElementById('heartsync-gtag-init')).toBeNull();
  });

  it('does not inject GA when consent denies analytics', () => {
    heartsync.site_settings.ga_measurement_id = 'G-TEST1234';
    let ctx: any;
    render(
      <ConsentProvider>
        <ProbeToggle onReady={(c: any) => (ctx = c)} />
      </ConsentProvider>,
    );
    act(() => ctx?.rejectAll());
    expect(document.getElementById('heartsync-gtag-script')).toBeNull();
  });
});

const ProbeToggle = ({ onReady }: { onReady: (c: any) => void }) => {
  const ctx = useConsentContext();
  useEffect(() => {
    onReady(ctx);
  }, [ctx.hasConsented]);
  return null;
};
