/**
 * Consent-gated GA4 event tracking.
 *
 * The gtag/dataLayer global only exists after ConsentProvider injected the
 * GA4 library with an analytics-consented visitor, so every call here is a
 * no-op until both conditions hold (Consent Mode v2 then governs what the
 * GA4 tag actually sends). Analytics must never break the page: all calls
 * are wrapped and silent-fail.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  try {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, params);
      return;
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...params });
    }
  } catch {
    /* analytics must never break the page */
  }
}

export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    page_path: path,
    ...(title ? { page_title: title } : {}),
  });
}
