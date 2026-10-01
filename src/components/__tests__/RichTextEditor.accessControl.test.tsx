// @vitest-environment jsdom
// RichTextEditor Access Control & Paywall Settings: choosing "Unlockable by
// Watching Ad" at publish time must surface the provider/duration controls and
// ship premium_access_type, unlock_duration, ad_provider and
// daily_unlock_limit in the saved payload.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RichTextEditor from '../RichTextEditor';
import { heartsync } from '../../store';
import type { Post } from '../../types';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const findSelectAfter = async (labelText: string) => {
  const label = await screen.findByText(labelText, {}, { timeout: 15000 });
  const wrap = label.closest('div');
  return wrap!.querySelector('select') as HTMLSelectElement;
};
const findInputAfter = async (labelText: string) => {
  const label = await screen.findByText(labelText, {}, { timeout: 15000 });
  const wrap = label.closest('div');
  return wrap!.querySelector('input') as HTMLInputElement;
};

describe('RichTextEditor > Access Control & Paywall (ad unlock at publish time)', () => {
  let updatePostSpy: any;
  let addPostSpy: any;
  let previousPosts: any[];

  const basePost = {
    id: 'post-edit-1',
    title: 'Healing After Ghosting',
    slug: 'healing-after-ghosting',
    excerpt: 'Excerpt',
    content: 'Existing body content for the article being edited.',
    status: 'published',
    category_id: 'cat-1',
    author_id: 'auth-1',
    publish_date: new Date().toISOString(),
    likes: 1,
    views: 2,
    is_premium: true,
    price: 4.99,
    premium_access_type: 'subscription',
  } as unknown as Post;

  beforeEach(() => {
    previousPosts = heartsync.posts;
    updatePostSpy = vi.spyOn(heartsync, 'updatePost').mockResolvedValue(undefined as any);
    addPostSpy = vi.spyOn(heartsync, 'addPost').mockResolvedValue(undefined as any);
  });
  afterEach(() => {
    heartsync.posts = previousPosts;
    vi.restoreAllMocks();
  });

  it('reveals the ad-unlock sub-controls when the strategy is set to watch-ad', async () => {
    render(<RichTextEditor post={basePost} onSave={() => {}} onCancel={() => {}} />);
    // Paywall is active on the fixture and the strategy select is visible.
    const strategySelect = await findSelectAfter('Access Monetization Strategy');
    expect(strategySelect.value).toBe('subscription');
    // Ad-only controls are hidden before the switch.
    expect(screen.queryByText('Ad Provider Network')).toBeNull();

    fireEvent.change(strategySelect, { target: { value: 'ad_unlock' } });
    expect(await screen.findByText('Ad Provider Network', {}, { timeout: 5000 })).toBeDefined();
    expect(screen.getByText('Daily Unlock Limits per Reader')).toBeDefined();
    expect(screen.getByText('Unlock Validity Duration (Hours)')).toBeDefined();
  }, 30000);

  it('publishes the ad-unlock payload with all rewarded fields', async () => {
    render(<RichTextEditor post={basePost} onSave={() => {}} onCancel={() => {}} />);
    const strategySelect = await findSelectAfter('Access Monetization Strategy');
    fireEvent.change(strategySelect, { target: { value: 'ad_unlock' } });

    const durationInput = await findInputAfter('Unlock Validity Duration (Hours)');
    fireEvent.change(durationInput, { target: { value: '48' } });
    const limitInput = await findInputAfter('Daily Unlock Limits per Reader');
    fireEvent.change(limitInput, { target: { value: '5' } });

    // The fixture post is already published status -> "Save Live Changes"
    fireEvent.click(screen.getByText('Save Live Changes'));
    await waitFor(() => expect(updatePostSpy).toHaveBeenCalled());
    const [id, payload] = updatePostSpy.mock.calls[0];
    expect(id).toBe('post-edit-1');
    expect(payload.premium_access_type).toBe('ad_unlock');
    expect(payload.unlock_duration).toBe(48);
    expect(payload.ad_provider).toBe('adsense');
    expect(payload.daily_unlock_limit).toBe(5);
    expect(payload.is_premium).toBe(true);
  }, 30000);

  it('edits an existing ad-unlock article back to subscribers-only', async () => {
    const adPost = { ...basePost, premium_access_type: 'ad_unlock' } as Post;
    render(<RichTextEditor post={adPost} onSave={() => {}} onCancel={() => {}} />);
    const strategySelect = await findSelectAfter('Access Monetization Strategy');
    expect(strategySelect.value).toBe('ad_unlock');
    fireEvent.change(strategySelect, { target: { value: 'subscription' } });
    // Ad-only controls disappear again.
    expect(screen.queryByText('Ad Provider Network')).toBeNull();

    fireEvent.click(screen.getByText('Save Live Changes'));
    await waitFor(() => expect(updatePostSpy).toHaveBeenCalled());
    const [, payload] = updatePostSpy.mock.calls[0];
    expect(payload.premium_access_type).toBe('subscription');
  }, 30000);

  it('hides monetization controls entirely when the paywall is off', async () => {
    render(<RichTextEditor post={{ ...basePost, is_premium: false } as Post} onSave={() => {}} onCancel={() => {}} />);
    const toggle = (await screen.findByText('PAYWALL ACTIVE', {}, { timeout: 15000 })).closest('label')!.querySelector('input') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(screen.queryByText('Access Monetization Strategy')).toBeNull();
    expect(screen.queryByText('Unlock Validity Duration (Hours)')).toBeNull();
  }, 30000);

  it('new-draft mode persists the ad-unlock strategy through addPost', async () => {
    render(<RichTextEditor onSave={() => {}} onCancel={() => {}} />);
    // 'Article Title' matches both the form label and the live-preview h1
    // placeholder; pick the label explicitly.
    const titleLabel = (await screen.findAllByText('Article Title')).find(el => el.tagName === 'LABEL')!;
    const titleInput = titleLabel.parentElement!.querySelector('input') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Brand New Ad Unlock Draft' } });

    // The submit guard requires a Markdown body before it will call addPost.
    const bodyArea = (await screen.findByPlaceholderText(/Begin writing your attachment guidelines/i, {}, { timeout: 15000 })) as HTMLTextAreaElement;
    fireEvent.change(bodyArea, { target: { value: '# Ad Unlock Draft\n\nFull article body text for the new draft.' } });

    // Activate the paywall and pick the ad strategy.
    const toggle = (await screen.findByText('PAYWALL ACTIVE')).closest('label')!.querySelector('input') as HTMLInputElement;
    fireEvent.click(toggle);
    const strategySelect = await findSelectAfter('Access Monetization Strategy');
    fireEvent.change(strategySelect, { target: { value: 'ad_unlock' } });

    fireEvent.click(screen.getByText('Save Draft'));
    await waitFor(() => expect(addPostSpy).toHaveBeenCalled());
    const [payload] = addPostSpy.mock.calls[0];
    expect(payload.title).toBe('Brand New Ad Unlock Draft');
    expect(payload.is_premium).toBe(true);
    expect(payload.premium_access_type).toBe('ad_unlock');
    expect(payload.unlock_duration).toBe(24);
  }, 30000);
});
