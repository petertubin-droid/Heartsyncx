// @vitest-environment jsdom
// Posts pane: the per-article watch-ad unlock toggle (2026-10-01), the
// premium badge quick toggle, and the Launch New Draft flow into the
// RichTextEditor.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConsole from '../AdminConsole';
import { heartsync } from '../../store';
import type { Post } from '../../types';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const premiumPost = {
  id: 'post-ad-1',
  title: 'Subscribers Only Love Letter',
  slug: 'subscribers-only-love-letter',
  excerpt: 'Premium fixture',
  content: 'Some content body for the fixture.',
  status: 'published',
  category_id: 'cat-1',
  author_id: 'auth-1',
  publish_date: new Date().toISOString(),
  likes: 0,
  views: 10,
  is_premium: true,
  premium_access_type: 'subscribers_only',
  unlock_duration: 24,
} as unknown as Post;

const freePost = {
  id: 'post-free-1',
  title: 'Free Open Heart Guide',
  slug: 'free-open-heart-guide',
  excerpt: 'Free fixture',
  content: 'Free content.',
  status: 'published',
  category_id: 'cat-1',
  author_id: 'auth-1',
  publish_date: new Date().toISOString(),
  likes: 0,
  views: 5,
  is_premium: false,
} as unknown as Post;

describe('AdminConsole > Posts pane', () => {
  let previous: any;
  let previousPosts: Post[];
  let updatePostSpy: any;

  beforeEach(() => {
    previous = heartsync.current_user;
    previousPosts = heartsync.posts;
    heartsync.current_user = { id: 'u1', name: 'Admin', email: 'a@x.com', role: 'admin', created_at: new Date().toISOString() };
    heartsync.posts = [premiumPost, freePost];
    updatePostSpy = vi.spyOn(heartsync, 'updatePost').mockResolvedValue(undefined as any);
  });
  afterEach(() => {
    heartsync.current_user = previous;
    heartsync.posts = previousPosts;
    vi.restoreAllMocks();
  });

  it('shows the AD OFF badge on a premium, non-ad-unlockable article and AD UNLOCK after enabling', async () => {
    render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="posts" lang="en" />,
    );
    await screen.findByText('Subscribers Only Love Letter', {}, { timeout: 20000 });
    const adBtn = await screen.findByText('AD OFF', {}, { timeout: 5000 });
    fireEvent.click(adBtn);
    await waitFor(() => expect(updatePostSpy).toHaveBeenCalled());
    const [id, updates] = updatePostSpy.mock.calls[0];
    expect(id).toBe('post-ad-1');
    expect(updates.premium_access_type).toBe('ad_unlock');
  }, 40000);

  it('toggles an ad-unlockable article back to subscribers-only from the row badge', async () => {
    heartsync.posts = [{ ...premiumPost, premium_access_type: 'ad_unlock' } as Post, freePost];
    render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="posts" lang="en" />,
    );
    await screen.findByText('Subscribers Only Love Letter', {}, { timeout: 20000 });
    const adBtn = await screen.findByText(/AD UNLOCK/, {}, { timeout: 5000 }); // rendered as '📺 AD UNLOCK'
    fireEvent.click(adBtn);
    await waitFor(() => expect(updatePostSpy).toHaveBeenCalled());
    const [, updates] = updatePostSpy.mock.calls[0];
    expect(updates.premium_access_type).toBe('subscribers_only');
  }, 40000);

  it('hides the ad badge entirely on free (non-premium) articles', async () => {
    heartsync.posts = [freePost];
    render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="posts" lang="en" />,
    );
    // Only the free article is on the board, so ANY premium/ad badge at all
    // means the gate leaked.
    await screen.findByText('Free Open Heart Guide', {}, { timeout: 20000 });
    expect(screen.queryByText('AD OFF')).toBeNull();
    expect(screen.queryByText(/AD UNLOCK/)).toBeNull();
    expect(screen.queryByText('👑 PREMIUM')).toBeNull();
  }, 40000);

  it('flips premium status from the PREMIUM row badge', async () => {
    render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="posts" lang="en" />,
    );
    await screen.findByText('Subscribers Only Love Letter', {}, { timeout: 20000 });
    fireEvent.click(screen.getByText('👑 PREMIUM'));
    await waitFor(() => expect(updatePostSpy).toHaveBeenCalled());
    const [id, updates] = updatePostSpy.mock.calls[0];
    expect(id).toBe('post-ad-1');
    expect(updates.is_premium).toBe(false);
  }, 40000);

  it('Launch New Draft opens the RichTextEditor workspace', async () => {
    render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="posts" lang="en" />,
    );
    fireEvent.click(await screen.findByText('Launch New Draft', {}, { timeout: 20000 }));
    // The editor header shows the save button and the AI Article Writer section.
    expect(await screen.findByText('AI Article Writer', {}, { timeout: 20000 })).toBeDefined();
    expect(screen.getByText('Save Draft')).toBeDefined();
  }, 40000);
});
