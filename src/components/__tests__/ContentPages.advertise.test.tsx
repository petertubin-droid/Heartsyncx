// @vitest-environment jsdom
// Advertise page (2026-10-01): the page sells Heartsyncx's real ad system,
// so it must show the audience, the five ad formats, the live placement
// slots (from the slot catalog), what a partnership includes, and a
// contact CTA.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContentPages from '../ContentPages';
import { ConsentProvider } from '../ConsentProvider';
import { CROSS_PROMO_SLOT_CATALOG } from '../houseAds/CrossPromoSlot';
import { heartsync } from '../../store';
import type { Post } from '../../types';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const baseProps = {
  currentTab: 'advertise',
  tabArg: '',
  lang: 'en',
  categories: [],
  posts: [] as unknown as Post[],
  publishedArticles: [] as unknown as Post[],
  navigateTo: vi.fn(),
  showToast: vi.fn(),
  renderSidebar: () => <aside>sidebar</aside>,
  searchQuery: '',
  submittingContact: false,
  setSubmittingContact: vi.fn(),
  contactSuccess: false,
  setContactSuccess: vi.fn(),
  checkIsCategoryLocked: () => false,
  unlockCategoryInState: vi.fn(),
  articlePaymentPortal: 'stripe' as const,
  setArticlePaymentPortal: vi.fn(),
  isPayingArticle: false,
  setIsPayingArticle: vi.fn(),
  payCardNum: '',
  setPayCardNum: vi.fn(),
  payEmail: '',
  setPayEmail: vi.fn(),
  payExpiry: '',
  setPayExpiry: vi.fn(),
  payCvc: '',
  setPayCvc: vi.fn(),
  setAdTarget: vi.fn(),
  setAdStep: vi.fn(),
  setAdSecondsLeft: vi.fn(),
};

describe('ContentPages > Advertise', () => {
  it('renders the audience, formats, and partnership sections', async () => {
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    expect(screen.getByRole('heading', { name: 'Advertise With Heartsync' })).toBeDefined();
    expect(screen.getByText('Who reads Heartsync')).toBeDefined();
    expect(screen.getByText('Ad formats we offer')).toBeDefined();
    expect(screen.getByText('What a partnership includes')).toBeDefined();
    expect(screen.getByText('Start a campaign')).toBeDefined();
  });

  it('lists all five ad formats', async () => {
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    for (const name of ['Display Ad', 'Native In-Feed', 'Banner Strip', 'Content Card', 'Interstitial']) {
      expect(screen.getByText(name)).toBeDefined();
    }
  });

  it('shows every live placement slot from the catalog', async () => {
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    for (const slot of CROSS_PROMO_SLOT_CATALOG) {
      expect(screen.getByText(slot.label)).toBeDefined();
    }
  });

  it('the contact CTA navigates to the contact form', async () => {
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    fireEvent.click(screen.getByText('Contact us about advertising'));
    expect(baseProps.navigateTo).toHaveBeenCalledWith('contact');
  });
});
