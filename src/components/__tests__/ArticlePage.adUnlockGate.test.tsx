// @vitest-environment jsdom
// Reader-side ad unlock gate (ArticlePage locked panel): the "Watch Ad to
// Unlock" CTA must appear ONLY for articles configured as ad-unlockable, and
// it must show the article's own unlock duration.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArticlePage from '../ArticlePage';
import { ConsentProvider } from '../ConsentProvider';
import { heartsync } from '../../store';
import type { Post } from '../../types';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const noop = () => {};
const makeProps = (post: Post) => ({
  activeArticle: post,
  articleBody: 'First paragraph of the article body. ' + 'Filler sentence to pad the teaser. '.repeat(20),
  headings: [] as any[],
  markdownComponents: {},
  siteSettings: heartsync.site_settings,
  navigateTo: noop,
  showToast: noop,
  renderSidebar: () => null,
  handleReaction: noop,
  submitComment: noop,
  checkIsArticleLocked: () => true,
  unlockArticleInState: noop,
  paragraphCountRef: { current: 0 } as any,
  publishedArticles: [post],
  posts: [post],
  categories: [] as any[],
  setActiveArticle: noop,
  setCurrentTab: noop,
  setTabArg: noop,
  setLightboxImage: noop,
  setAdTarget: vi.fn(),
  setAdStep: vi.fn(),
  setAdSecondsLeft: vi.fn(),
  scrollPercent: 0,
  activeHeadingId: '',
  newsletterSubscribed: false,
  setNewsletterSubscribed: noop,
  newsletterEmail: '',
  setNewsletterEmail: noop,
  copyFeedbackToast: '',
  setCopyFeedbackToast: noop,
  shareMenuOpen: false,
  setShareMenuOpen: noop,
  hasLiked: false,
  setHasLiked: noop,
  comments: [] as any[],
  commentInput: '',
  setCommentInput: noop,
  commentAuthorName: '',
  setCommentAuthorName: noop,
  commentAuthorEmail: '',
  setCommentAuthorEmail: noop,
  activeQuizIndex: 0,
  setActiveQuizIndex: noop,
  selectedAnswerIndex: null,
  setSelectedAnswerIndex: noop,
  quizAnswerSubmitted: false,
  setQuizAnswerSubmitted: noop,
  quizScore: 0,
  setQuizScore: noop,
  quizSessionFinished: false,
  setQuizSessionFinished: noop,
  articlePaymentPortal: 'stripe' as const,
  setArticlePaymentPortal: noop,
  isPayingArticle: false,
  setIsPayingArticle: noop,
  payCardNum: '',
  setPayCardNum: noop,
  payEmail: '',
  setPayEmail: noop,
  payExpiry: '',
  setPayExpiry: noop,
  payCvc: '',
  setPayCvc: noop,
});

const article = (overrides: Partial<Post>): Post => ({
  id: 'post-reader-1',
  title: 'Attachment Styles Decoded',
  slug: 'attachment-styles-decoded',
  excerpt: 'Reader fixture',
  content: 'Full body.',
  status: 'published',
  category_id: 'cat-1',
  author_id: 'auth-1',
  publish_date: new Date().toISOString(),
  likes: 0,
  views: 0,
  is_premium: true,
  ...overrides,
} as unknown as Post);

describe('ArticlePage > watch-ad unlock gate', () => {
  let previousUser: any;
  beforeEach(() => {
    previousUser = heartsync.current_user;
    heartsync.current_user = undefined;
  });
  afterEach(() => {
    heartsync.current_user = previousUser;
  });

  it('shows the watch-ad CTA with the article duration for ad_unlock articles', async () => {
    const props = makeProps(article({ premium_access_type: 'ad_unlock', unlock_duration: 24 }));
    render(<ConsentProvider><ArticlePage {...(props as any)} /></ConsentProvider>);
    expect(await screen.findByText('Watch Ad to Unlock for 24 Hrs', {}, { timeout: 15000 })).toBeDefined();
  }, 30000);

  it('shows minutes when the duration is fractional', async () => {
    const props = makeProps(article({ premium_access_type: 'ad_unlock', unlock_duration: 0.5 }));
    render(<ConsentProvider><ArticlePage {...(props as any)} /></ConsentProvider>);
    expect(await screen.findByText('Watch Ad to Unlock for 30 Mins', {}, { timeout: 15000 })).toBeDefined();
  }, 30000);

  it('hides the watch-ad CTA for subscribers-only articles', async () => {
    const props = makeProps(article({ premium_access_type: 'subscribers_only' }));
    render(<ConsentProvider><ArticlePage {...(props as any)} /></ConsentProvider>);
    // The paywall panel still renders...
    expect(await screen.findByText(/Unlock: Attachment Styles Decoded/, {}, { timeout: 15000 })).toBeDefined();
    // ...but no ad path is offered.
    expect(screen.queryByText(/Watch Ad to Unlock/)).toBeNull();
  }, 30000);

  it('clicking the CTA opens the ad flow for the right article', async () => {
    const props = makeProps(article({ premium_access_type: 'ad_unlock', unlock_duration: 24 }));
    render(<ConsentProvider><ArticlePage {...(props as any)} /></ConsentProvider>);
    const cta = await screen.findByText('Watch Ad to Unlock for 24 Hrs', {}, { timeout: 15000 });
    fireEvent.click(cta);
    expect(props.setAdTarget).toHaveBeenCalledWith({ type: 'article', id: 'post-reader-1', title: 'Attachment Styles Decoded' });
    expect(props.setAdSecondsLeft).toHaveBeenCalledWith(15);
    expect(props.setAdStep).toHaveBeenCalledWith('intro');
  }, 30000);

  it('falls back to 3 hours when the article carries no duration', async () => {
    const props = makeProps(article({ premium_access_type: 'ad_unlock' }));
    render(<ConsentProvider><ArticlePage {...(props as any)} /></ConsentProvider>);
    expect(await screen.findByText('Watch Ad to Unlock for 3 Hrs', {}, { timeout: 15000 })).toBeDefined();
  }, 30000);
});
