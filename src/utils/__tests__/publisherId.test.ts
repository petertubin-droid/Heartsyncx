// Publisher-ID normalization: AdSense requires `ca-pub-…`, but the admin
// UI and AdSense's own dashboard show `pub-…` or bare digits. Every
// accepted shape must resolve to the canonical form or the site silently
// serves no ads and the dynamic ads.txt route serves an empty stub.
import { describe, it, expect } from 'vitest';
import { normalizeAdsensePublisherId, adsTxtPublisherId } from '../publisherId';

describe('normalizeAdsensePublisherId', () => {
  it('accepts the strict ca-pub form unchanged', () => {
    expect(normalizeAdsensePublisherId('ca-pub-3404100134534192')).toBe('ca-pub-3404100134534192');
  });

  it('normalizes the pub- form AdSense prints in its dashboard', () => {
    expect(normalizeAdsensePublisherId('pub-3404100134534192')).toBe('ca-pub-3404100134534192');
  });

  it('normalizes bare digits the admin might paste', () => {
    expect(normalizeAdsensePublisherId('3404100134534192')).toBe('ca-pub-3404100134534192');
  });

  it('trims whitespace and ignores case', () => {
    expect(normalizeAdsensePublisherId('  PUB-3404100134534192  ')).toBe('ca-pub-3404100134534192');
  });

  it('rejects absent, empty and too-short garbage', () => {
    expect(normalizeAdsensePublisherId(undefined)).toBeNull();
    expect(normalizeAdsensePublisherId('')).toBeNull();
    expect(normalizeAdsensePublisherId('   ')).toBeNull();
    expect(normalizeAdsensePublisherId('pub-123')).toBeNull();
    expect(normalizeAdsensePublisherId('not an id')).toBeNull();
    expect(normalizeAdsensePublisherId(12345 as unknown)).toBeNull();
  });

  it('ads.txt form strips the ca- prefix', () => {
    expect(adsTxtPublisherId('ca-pub-3404100134534192')).toBe('pub-3404100134534192');
    expect(adsTxtPublisherId('nope')).toBeNull();
  });
});
