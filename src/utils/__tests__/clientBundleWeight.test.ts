// @vitest-environment jsdom
// PERF REGRESSION TEST (2026-09-24): the client bundle must never ship
// article bodies. Bodies ship once per article via GET /api/posts/:slug and
// are cached by the Service Worker; carrying 350KB of seed text in the entry
// chunk cost every visitor of every page. This test fails the moment someone
// pastes a body back into MORE_POSTS.
import { describe, it, expect } from 'vitest';
import { MORE_POSTS } from '../data/moreArticles';
import { HEARTSYNC_ARTICLES } from '../data/articles';

describe('client bundle weight: article bodies stay out of MORE_POSTS', () => {
  it('MORE_POSTS carries metadata only - no non-empty content strings', () => {
    expect(MORE_POSTS.length).toBeGreaterThan(30);
    for (const post of MORE_POSTS) {
      // '' (fetch on demand) is the only allowed value.
      expect(post.content ?? '').toBe('');
    }
  });

  it('the seed archive itself is intact for server-side sync (30 full bodies)', () => {
    expect(HEARTSYNC_ARTICLES.length).toBe(30);
    for (const a of HEARTSYNC_ARTICLES) {
      expect((a.content || '').trim().length).toBeGreaterThan(500);
    }
  });
});
