/**
 * AdSense publisher-ID normalization (Oct 2026).
 *
 * AdSense requires the client id in the strict `ca-pub-NNNN...` form, but
 * admins have a habit of pasting what AdSense shows them - `pub-NNNN...` or
 * bare digits. A strict regex silently disabled both the ad slots and the
 * dynamic ads.txt route when the id was saved in one of those shapes, which
 * is how a site can pass an ads.txt review yet serve nothing. Normalize
 * every accepted shape into the canonical form in one place.
 */

/** Accepts `ca-pub-…`, `pub-…` or bare digits; returns `ca-pub-…` or null. */
export function normalizeAdsensePublisherId(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return null;
  const digits = s.replace(/^(ca-)?pub-/i, '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 20) return null;
  return `ca-pub-${digits}`;
}

/** The bare digits form for ads.txt (`google.com, pub-…, DIRECT, …`). */
export function adsTxtPublisherId(raw: unknown): string | null {
  const normalized = normalizeAdsensePublisherId(raw);
  return normalized ? normalized.replace('ca-pub-', 'pub-') : null;
}
