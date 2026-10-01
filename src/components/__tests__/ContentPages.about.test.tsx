// @vitest-environment jsdom
// About page (2026-10-01): the default About page is the page Google lifts
// to describe the whole site, so it must render its mission, coverage,
// editorial-principles, and CTA sections, link the live categories, and
// stay overridable by a custom admin page.
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContentPages from '../ContentPages';
import { ConsentProvider } from '../ConsentProvider';
import { heartsync } from '../../store';
import type { Post } from '../../types';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const baseProps = {
  currentTab: 'about',
  tabArg: '',
  lang: 'en',
  categories: [
    { id: 'cat-dating', name: 'Dating', slug: 'dating', description: 'First dates and modern courtship.' },
    { id: 'cat-relationships', name: 'Relationships', slug: 'relationships', description: 'Trust, attachment, and everyday love.' },
  ],
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

describe('ContentPages > About', () => {
  it('renders the mission, coverage, and editorial sections', async () => {
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    expect(screen.getByRole('heading', { name: 'About Heartsync' })).toBeDefined();
    expect(screen.getByText('Our Mission')).toBeDefined();
    expect(screen.getByText('What We Cover')).toBeDefined();
    expect(screen.getByText('How We Write')).toBeDefined();
    expect(screen.getByText('More Than Articles')).toBeDefined();
    // The site summary Google lifts must mention the research foundations.
    expect(screen.getAllByText(/attachment theory/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gottman method/i).length).toBeGreaterThan(0);
  });

  it('links the live categories from the coverage grid', async () => {
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    fireEvent.click(screen.getByText('Dating'));
    expect(baseProps.navigateTo).toHaveBeenCalledWith('category', 'dating');
  });

  it('navigates from the CTA buttons', async () => {
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    fireEvent.click(screen.getByText('Browse Articles'));
    expect(baseProps.navigateTo).toHaveBeenCalledWith('articles');
    fireEvent.click(screen.getByText('Premium Membership'));
    expect(baseProps.navigateTo).toHaveBeenCalledWith('subscription');
  });

  it('prefers a custom admin About page when one exists', async () => {
    const previousPages = heartsync.pages;
    heartsync.pages = [
      { id: 'pg-1', title: 'Custom About', slug: 'about', page_type: 'about', content: 'Custom about body content.' },
    ] as any;
    render(<ConsentProvider><ContentPages {...baseProps} /></ConsentProvider>);
    expect(screen.getByText('Custom About')).toBeDefined();
    expect(screen.queryByText('Our Mission')).toBeNull();
    heartsync.pages = previousPages;
  });
});
