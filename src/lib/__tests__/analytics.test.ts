import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackEvent, trackPageView } from '../analytics';

describe('GA4 analytics helper (consent-gated, crash-proof)', () => {
  beforeEach(() => {
    const w = window as any;
    delete w.gtag;
    delete w.dataLayer;
  });

  it('is a silent no-op when GA4 is not configured (no gtag, no dataLayer)', () => {
    expect(() => trackEvent('share', { method: 'x' })).not.toThrow();
    expect((window as any).dataLayer).toBeUndefined();
  });

  it('uses window.gtag when GA4 injected (consent-granted, ID configured)', () => {
    const gtag = vi.fn();
    (window as any).gtag = gtag;
    trackEvent('share', { method: 'x' });
    expect(gtag).toHaveBeenCalledWith('event', 'share', { method: 'x' });
  });

  it('falls back to a raw dataLayer push when only the layer exists', () => {
    (window as any).dataLayer = [];
    trackEvent('share', { method: 'whatsapp' });
    expect((window as any).dataLayer).toEqual([{ event: 'share', method: 'whatsapp' }]);
  });

  it('trackPageView sends the SPA page_path', () => {
    const gtag = vi.fn();
    (window as any).gtag = gtag;
    trackPageView('/article/some-slug', 'Some Slug');
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', { page_path: '/article/some-slug', page_title: 'Some Slug' });
  });

  it('never throws even if dataLayer push throws (analytics must not break the page)', () => {
    (window as any).dataLayer = { push: () => { throw new Error('frozen'); } } as any;
    expect(() => trackEvent('boom')).not.toThrow();
  });
});
