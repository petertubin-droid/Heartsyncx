// @vitest-environment jsdom
// Cross-promo ad system, Oct 2026 upgrade: slot registry, per-slot format
// overrides, ad schedules (auto start/expire), custom CTA labels, and the
// admin panel (Slot Manager + Ad Campaign manager) that drives them.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  buildPromoItems,
  isSlotActive,
  slotFormat,
  isPromoScheduled,
  CROSS_PROMO_SLOT_CATALOG,
  type ExternalPromo,
} from '../houseAds/CrossPromoSlot';
import { CrossPromoSlotManager, AdCampaignManager } from '../admin/CrossPromoAdmin';
import { heartsync } from '../../store';

vi.mock('../../lib/analytics', () => ({ trackEvent: vi.fn() }));

const partner = (over: Partial<ExternalPromo> = {}): ExternalPromo => ({
  id: 'ext-1',
  enabled: true,
  label: 'Couples therapy app',
  url: 'https://therapy.example.com',
  blurb: 'Licensed therapists, from your phone.',
  owner_name: 'TherapyCo',
  ...over,
});

describe('slot registry', () => {
  it('the original 4 placements default on, new positions default off', () => {
    const settings: Record<string, unknown> = { cross_promo_enabled: true };
    expect(isSlotActive(settings, 'article_mid')).toBe(true);
    expect(isSlotActive(settings, 'article_end')).toBe(true);
    expect(isSlotActive(settings, 'home_after_about')).toBe(true);
    expect(isSlotActive(settings, 'home_after_newsletter')).toBe(true);
    expect(isSlotActive(settings, 'article_top')).toBe(false);
    expect(isSlotActive(settings, 'home_after_hero')).toBe(false);
    expect(isSlotActive(settings, 'home_before_footer')).toBe(false);
  });

  it('per-slot overrides beat the catalog defaults, and the master switch wins overall', () => {
    const settings: Record<string, unknown> = {
      cross_promo_enabled: true,
      cross_promo_slots: { article_top: { enabled: true }, article_mid: { enabled: false } },
    };
    expect(isSlotActive(settings, 'article_top')).toBe(true);
    expect(isSlotActive(settings, 'article_mid')).toBe(false);
    expect(isSlotActive({ ...settings, cross_promo_enabled: false }, 'article_top')).toBe(false);
  });

  it('per-slot format overrides the global format', () => {
    const settings: Record<string, unknown> = {
      cross_promo_format: 'display',
      cross_promo_slots: { article_top: { format: 'native' } },
    };
    expect(slotFormat(settings, 'article_top')).toBe('native');
    expect(slotFormat(settings, 'article_mid')).toBe('display');
    expect(slotFormat({ cross_promo_slots: { article_top: { format: 'global' } } }, 'article_top')).toBe('display');
  });

  it('the catalog ids are unique and every id has a label', () => {
    const ids = CROSS_PROMO_SLOT_CATALOG.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of CROSS_PROMO_SLOT_CATALOG) expect(d.label.length).toBeGreaterThan(0);
  });
});

describe('ad schedules', () => {
  const now = new Date('2026-10-01T12:00:00Z');

  it('shows an ad inside its window and hides it outside', () => {
    expect(isPromoScheduled({ start_date: '2026-09-30', end_date: '2026-10-15' }, now)).toBe(true);
    expect(isPromoScheduled({ start_date: '2026-10-02' }, now)).toBe(false);
    expect(isPromoScheduled({ end_date: '2026-09-30' }, now)).toBe(false);
    expect(isPromoScheduled({}, now)).toBe(true);
  });

  it('invalid dates are ignored rather than hiding the ad', () => {
    expect(isPromoScheduled({ start_date: 'not-a-date' }, now)).toBe(true);
  });

  it('buildPromoItems filters out ads outside their schedule and passes CTA labels through', () => {
    const settings = {
      cross_promo_enabled: true,
      external_promos: [
        partner({ id: 'live', cta_label: 'Book a session' }),
        partner({ id: 'expired', end_date: '2026-09-01' }),
        partner({ id: 'future', start_date: '2027-01-01' }),
      ],
    };
    const items = buildPromoItems(settings);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('live');
    expect(ids).not.toContain('expired');
    expect(ids).not.toContain('future');
    expect(items.find((i) => i.id === 'live')?.ctaLabel).toBe('Book a session');
  });
});

const mockUpdateSettings = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  heartsync.site_settings = {
    cross_promo_enabled: true,
    cross_promo_format: 'display',
  } as any;
  (heartsync as any).updateSettings = mockUpdateSettings;
});

describe('CrossPromoSlotManager (admin)', () => {
  it('lists every catalog slot with its live state', () => {
    render(<CrossPromoSlotManager />);
    for (const def of CROSS_PROMO_SLOT_CATALOG) {
      expect(screen.getByText(def.label)).toBeDefined();
    }
  });

  it('toggling a new slot on and saving persists the override', async () => {
    render(<CrossPromoSlotManager />);
    // "Article - Top" defaults off; flip it on via its checkbox.
    const card = screen.getByText('Article - Top').closest('div')!.parentElement!;
    const checkbox = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText('Save slots'));
    await vi.waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        cross_promo_slots: expect.objectContaining({ article_top: expect.objectContaining({ enabled: true }) }),
      });
    });
  });
});

describe('AdCampaignManager (admin)', () => {
  it('creates a blank ad, fills it, and saves the campaign', async () => {
    render(<AdCampaignManager />);
    fireEvent.click(screen.getByText('+ Create ad'));
    const headline = screen.getByPlaceholderText('e.g. Couples therapy, from your phone');
    fireEvent.change(headline, { target: { value: 'Therapy for couples' } });
    fireEvent.change(screen.getByPlaceholderText('https://partner-site.com'), { target: { value: 'https://therapy.example.com' } });
    fireEvent.click(screen.getByText('Save ads'));
    await vi.waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        external_promos: expect.arrayContaining([
          expect.objectContaining({ label: 'Therapy for couples', url: 'https://therapy.example.com' }),
        ]),
      });
    });
  });

  it('shows the AI assistant with both generation modes', () => {
    render(<AdCampaignManager />);
    expect(screen.getByText('AI Ad Assistant')).toBeDefined();
    expect(screen.getByPlaceholderText(/Create from a URL/)).toBeDefined();
    expect(screen.getByPlaceholderText(/describe the business/)).toBeDefined();
  });

  it('duplicates an existing ad as a reviewable copy', () => {
    heartsync.site_settings = {
      cross_promo_enabled: true,
      external_promos: [partner()],
    } as any;
    render(<AdCampaignManager />);
    const row = screen.getByText('Couples therapy app').closest('div')!;
    const dupBtn = row.querySelector('button[title="Duplicate ad"]') as HTMLButtonElement;
    fireEvent.click(dupBtn);
    expect(screen.getByText('Couples therapy app (copy)')).toBeDefined();
  });
});
