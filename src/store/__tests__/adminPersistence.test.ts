import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Admin persistence regression tests (2026-10-01 audit):
 * 1. updatePost must ship the watch-ad unlock fields through BOTH the
 *    /api/posts/:id upsert and the scoped /api/state posts section.
 * 2. addPost (new draft publish) must include the same fields.
 * 3. updateSettings must persist rewarded-ad configuration into the scoped
 *    site_settings section.
 * 4. updateSettings keeps the display-limit validation guards.
 * 5. deletePost removes the article and persists the posts section.
 */

type CapturedCall = { url: string; method: string; body: any };

let calls: CapturedCall[] = [];

const jsonResponse = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true })
  } as Response);

const mockedFetch = vi.fn((url: any, init: any = {}) => {
  let body: any = null;
  try { body = init?.body ? JSON.parse(init.body) : null; } catch { body = init?.body; }
  calls.push({ url: String(url), method: init?.method || 'GET', body });
  return jsonResponse();
});

vi.stubGlobal('fetch', mockedFetch);

const flush = () => new Promise((r) => setTimeout(r, 30));

beforeEach(() => {
  calls = [];
});

describe('admin persistence > updatePost (watch-ad unlock edits)', () => {
  it('PUTs premium_access_type/unlock_duration to /api/posts/:id and syncs the posts section', async () => {
    const { heartsync } = await import('../../store');
    heartsync.posts = [
      {
        id: 'post-persist-1',
        title: 'Old Title',
        slug: 'old-title',
        excerpt: 'e',
        content: 'body text long enough to matter',
        status: 'published',
        category_id: 'cat-1',
        author_id: 'auth-1',
        publish_date: new Date().toISOString(),
        likes: 0,
        views: 0,
        is_premium: true,
        premium_access_type: 'subscribers_only'
      } as any
    ];

    await heartsync.updatePost('post-persist-1', { premium_access_type: 'ad_unlock', unlock_duration: 48 } as any);
    await flush();

    const put = calls.find((c) => c.url.includes('/api/posts/post-persist-1') && c.method === 'PUT');
    expect(put).toBeTruthy();
    expect(put!.body.premium_access_type).toBe('ad_unlock');
    expect(put!.body.unlock_duration).toBe(48);
    // The fixture holds a real body, so the edit legitimately syncs content.
    expect(put!.body.content).toContain('body text long enough');

    // In-memory state reflects the toggle (checked BEFORE the projection
    // fixture below replaces the posts array).
    expect(heartsync.posts.find((p: any) => p.id === 'post-persist-1')!.premium_access_type).toBe('ad_unlock');

    // Same edit against a list-projection post (no body in memory): the
    // payload must NOT ship content at all (2026-09-24 body-wipe incident).
    heartsync.posts = [
      {
        id: 'post-projection-1', title: 'Projection Row', slug: 'projection-row', excerpt: 'e',
        content: '', status: 'published', category_id: 'cat-1', author_id: 'auth-1',
        publish_date: new Date().toISOString(), likes: 0, views: 0,
        is_premium: true, premium_access_type: 'subscribers_only'
      } as any
    ];
    calls = [];
    await heartsync.updatePost('post-projection-1', { premium_access_type: 'ad_unlock' } as any);
    await flush();
    const projectionPut = calls.find((c) => c.url.includes('/api/posts/post-projection-1') && c.method === 'PUT');
    expect(projectionPut!.body.premium_access_type).toBe('ad_unlock');
    expect(projectionPut!.body.content).toBeUndefined();

    const statePost = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(statePost).toBeTruthy();
    expect(statePost!.body.posts).toBeDefined();

  });

  it('regenerates the slug when the title changes', async () => {
    const { heartsync } = await import('../../store');
    heartsync.posts = [
      {
        id: 'post-slug-1', title: 'Old Title', slug: 'old-title', excerpt: 'e', content: 'body',
        status: 'published', category_id: 'cat-1', author_id: 'auth-1',
        publish_date: new Date().toISOString(), likes: 0, views: 0
      } as any
    ];
    await heartsync.updatePost('post-slug-1', { title: 'Brand New Love Language' } as any);
    await flush();
    expect(heartsync.posts.find((p: any) => p.id === 'post-slug-1')!.slug).toBe('brand-new-love-language');
  });
});

describe('admin persistence > addPost (publish-time unlock strategy)', () => {
  it('POSTs the full premium payload to /api/posts', async () => {
    const { heartsync } = await import('../../store');
    await heartsync.addPost({
      title: 'Ad Unlock Debut',
      slug: 'ad-unlock-debut',
      excerpt: 'e',
      content: 'A fresh article body with real content.',
      status: 'published',
      category_id: 'cat-1',
      author_id: 'auth-1',
      publish_date: new Date().toISOString(),
      likes: 0,
      views: 0,
      is_premium: true,
      premium_access_type: 'ad_unlock',
      unlock_duration: 12,
      ad_provider: 'adsense',
      daily_unlock_limit: 3
    } as any);
    await flush();

    const post = calls.find((c) => c.url.includes('/api/posts') && !c.url.includes('/api/posts/') && c.method === 'POST');
    expect(post).toBeTruthy();
    expect(post!.body.premium_access_type).toBe('ad_unlock');
    expect(post!.body.unlock_duration).toBe(12);
    expect(post!.body.ad_provider).toBe('adsense');
    expect(post!.body.daily_unlock_limit).toBe(3);
    expect(heartsync.posts.some((p: any) => p.title === 'Ad Unlock Debut')).toBe(true);
  });
});

describe('admin persistence > updateSettings (rewarded ad config)', () => {
  it('merges rewarded_ad_config into site_settings and ships the scoped section', async () => {
    const { heartsync } = await import('../../store');
    await heartsync.updateSettings({
      rewarded_ad_config: { enabled: false, paragraphThreshold: 4 },
      rewarded_access_default_duration: '12h'
    } as any);
    await flush();

    expect(heartsync.site_settings.rewarded_ad_config).toEqual({ enabled: false, paragraphThreshold: 4 });
    expect(heartsync.site_settings.rewarded_access_default_duration).toBe('12h');

    const statePost = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(statePost).toBeTruthy();
    expect(statePost!.body.site_settings).toBeDefined();
    expect(statePost!.body.site_settings.rewarded_ad_config.enabled).toBe(false);
  });

  it('still enforces the display-limit validation guards', async () => {
    const { heartsync } = await import('../../store');
    await expect(heartsync.updateSettings({ trending_display_limit: 3 } as any)).rejects.toThrow(/Trending Display Limit/);
    await expect(heartsync.updateSettings({ featured_display_limit: 500 } as any)).rejects.toThrow(/Featured Display Limit/);
  });
});

describe('admin persistence > deletePost', () => {
  it('removes the article in memory and persists the posts section', async () => {
    const { heartsync } = await import('../../store');
    heartsync.posts = [
      {
        id: 'post-del-1', title: 'Doomed Draft', slug: 'doomed-draft', excerpt: 'e', content: 'x',
        status: 'draft', category_id: 'cat-1', author_id: 'auth-1',
        publish_date: new Date().toISOString(), likes: 0, views: 0
      } as any
    ];
    await heartsync.deletePost('post-del-1');
    await flush();
    expect(heartsync.posts.some((p: any) => p.id === 'post-del-1')).toBe(false);
    const statePost = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(statePost!.body.posts).toBeDefined();
  });
});
