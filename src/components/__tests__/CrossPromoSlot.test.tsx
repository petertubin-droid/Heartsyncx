/** Tests for the cross-promo house-ad system: configurable base URL and
 *  external partner promos (site_settings.external_promos). */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import CrossPromoSlot, {
  buildPromoItems,
  normalizeBaseUrl,
  DEFAULT_CROSS_PROMO_BASE_URL,
} from '../houseAds/CrossPromoSlot';
import { heartsync } from '../../store';

// trackEvent must not blow up on the missing GA4 layer in tests.
vi.mock('../../lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

const baseSettings = {
  cross_promo_enabled: true,
  cross_promo_format: 'card',
};

describe('normalizeBaseUrl', () => {
  it('falls back to the default origin when empty', () => {
    expect(normalizeBaseUrl(undefined)).toBe(DEFAULT_CROSS_PROMO_BASE_URL);
    expect(normalizeBaseUrl('   ')).toBe(DEFAULT_CROSS_PROMO_BASE_URL);
  });

  it('adds the protocol and strips trailing slashes', () => {
    expect(normalizeBaseUrl('frelux.com')).toBe('https://frelux.com');
    expect(normalizeBaseUrl('https://frelux.com/')).toBe('https://frelux.com');
    expect(normalizeBaseUrl('https://www.frelux.com///')).toBe('https://www.frelux.com');
  });
});

describe('buildPromoItems', () => {
  it('builds Frelux items against the configured custom domain', () => {
    const items = buildPromoItems({ ...baseSettings, cross_promo_base_url: 'https://frelux.com' });
    const calc = items.find((i) => i.path === '/calculators');
    expect(calc).toBeDefined();
    expect(calc!.url).toBe('https://frelux.com/calculators');
    expect(calc!.domain).toBe('frelux.com');
    expect(calc!.site).toBe('frelux');
  });

  it('uses the default origin when no custom URL is set', () => {
    const items = buildPromoItems(baseSettings);
    expect(items[0].url.startsWith(DEFAULT_CROSS_PROMO_BASE_URL)).toBe(true);
  });

  it('mixes enabled external partner promos into the rotation with absolute URLs', () => {
    const items = buildPromoItems({
      ...baseSettings,
      external_promos: [
        { id: 'ext-1', enabled: true, label: 'Buy cement online', url: 'https://cementmart.example', blurb: 'Delivered nationwide', owner_name: 'CementMart' },
        { id: 'ext-2', enabled: false, label: 'Hidden partner', url: 'https://hidden.example', blurb: '' },
        { id: 'ext-3', enabled: true, label: '', url: 'https://incomplete.example', blurb: '' },
      ],
    });
    const ext = items.filter((i) => i.site === 'external');
    expect(ext).toHaveLength(1);
    expect(ext[0].url).toBe('https://cementmart.example');
    expect(ext[0].domain).toBe('cementmart.example');
    expect(ext[0].owner).toBe('CementMart');
    // Rotation keeps the Frelux destinations plus the partner.
    expect(items.length).toBeGreaterThan(ext.length);
  });

  it('protocols relative partner URLs', () => {
    const items = buildPromoItems({
      ...baseSettings,
      external_promos: [{ id: 'ext-1', enabled: true, label: 'Partner', url: 'partner.example', blurb: '' }],
    });
    expect(items.find((i) => i.site === 'external')!.url).toBe('https://partner.example');
  });
});

describe('CrossPromoSlot rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when the master switch is off', () => {
    const prev = heartsync.site_settings;
    heartsync.site_settings = { cross_promo_enabled: false } as unknown as typeof heartsync.site_settings;
    const { container } = render(<CrossPromoSlot slotIndex={0} />);
    expect(container.innerHTML).toBe('');
    heartsync.site_settings = prev;
  });

  it('features an external partner promo in the banner slot with its own headline and domain', () => {
    const prev = heartsync.site_settings;
    heartsync.site_settings = {
      cross_promo_enabled: true,
      cross_promo_format: 'banner',
      cross_promo_base_url: 'https://frelux.com',
      external_promos: [
        { id: 'ext-1', enabled: true, label: 'Buy cement online', url: 'https://cementmart.example', blurb: 'Delivered nationwide', owner_name: 'CementMart' },
      ],
    } as unknown as typeof heartsync.site_settings;
    // Rotation: 5 Frelux items then the partner at index 5.
    const { container } = render(<CrossPromoSlot slotIndex={5} />);
    expect(container.textContent).toContain('Buy cement online');
    expect(container.textContent).toContain('cementmart.example');
    // Ad badge attributes the unit to the partner, not Frelux.
    expect(container.querySelector('[title*="CementMart"]')).not.toBeNull();
    // Frelux display URLs now show the custom domain (absolute link URLs
    // are covered by the buildPromoItems tests above).
    expect(container.textContent).toContain('frelux.com');
    heartsync.site_settings = prev;
  });

  it('renders the Frelux rotation with default settings (smoke)', () => {
    const prev = heartsync.site_settings;
    heartsync.site_settings = { cross_promo_enabled: true, cross_promo_format: 'native' } as unknown as typeof heartsync.site_settings;
    const { container } = render(<CrossPromoSlot slotIndex={1} />);
    expect(container.textContent).toContain('Frelux');
    heartsync.site_settings = prev;
  });
});
