/** Tests for the cross-promo house-ad system: configurable base URL and
 *  external partner promos (site_settings.external_promos). */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import CrossPromoSlot, {
  buildPromoItems,
  buildDisplayPromoItems,
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

  it('builds ONE site-level Frelux item for the Display format, with the real logo and real description', () => {
    const items = buildDisplayPromoItems({ ...baseSettings, cross_promo_base_url: 'https://frelux.com' });
    const frelux = items.filter((i) => i.site === 'frelux');
    // Exactly one Frelux item — the site itself, not five feature links.
    expect(frelux.length).toBe(1);
    expect(frelux[0].id).toBe('frelux-site');
    expect(frelux[0].label).toBe('Frelux');
    expect(frelux[0].url).toBe('https://frelux.com');
    expect(frelux[0].logo).toBe('https://frelux.com/logo-mark.png');
    // The real site description from Frelux's own index.html.
    expect(frelux[0].blurb).toContain('construction estimation');
    // External partners follow with their own logos.
    const items2 = buildDisplayPromoItems({
      ...baseSettings,
      external_promos: [
        { id: 'ext-1', enabled: true, label: 'Partner', url: 'https://partner.example', blurb: 'B', logo_url: 'https://partner.example/logo.png' },
      ],
    });
    expect(items2.length).toBe(2);
    expect(items2[1].logo).toBe('https://partner.example/logo.png');
    // Disabled/incomplete partners stay out.
    const items3 = buildDisplayPromoItems({
      ...baseSettings,
      external_promos: [{ id: 'ext-x', enabled: false, label: 'X', url: 'https://x.example' }],
    });
    expect(items3.length).toBe(1);
  });

  it('renders the Display format as a SINGLE unit with the Frelux logo image, not a 3-row grid', () => {
    const prev = heartsync.site_settings;
    heartsync.site_settings = { cross_promo_enabled: true, cross_promo_format: 'display' } as unknown as typeof heartsync.site_settings;
    const { container } = render(<CrossPromoSlot slotIndex={0} />);
    // The "Advertisement" label of the single-unit format.
    expect(container.textContent).toContain('Advertisement');
    // The real Frelux logo is rendered as an image against the default base URL.
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe(`${DEFAULT_CROSS_PROMO_BASE_URL}/logo-mark.png`);
    // Real site description is present.
    expect(container.textContent).toContain('construction estimation');
    // One unit, not the recommendation-card grid of three tiles.
    expect(container.querySelectorAll('[class*="grid"]').length).toBe(0);
    heartsync.site_settings = prev;
  });

  it('defaults to the single Display format when no format is set', () => {
    const prev = heartsync.site_settings;
    heartsync.site_settings = { cross_promo_enabled: true } as unknown as typeof heartsync.site_settings;
    const { container } = render(<CrossPromoSlot slotIndex={0} />);
    expect(container.textContent).toContain('Advertisement');
    expect(container.querySelector('img')).not.toBeNull();
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
