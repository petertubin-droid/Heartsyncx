// Publishing flow regression tests (2026-09-26): article create/update
// must go through the server API with the FULL payload, surface real
// errors, and never touch window.localStorage.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { heartsync } from '../../store';

const okResponse = (body: unknown = { success: true }) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const errResponse = (status: number, body: unknown) =>
  ({ ok: false, status, json: async () => body }) as Response;

/** URL-aware fetch stub: posts endpoints get `postsResponse`, every other
 *  URL (e.g. the /api/state sync saveState fires) gets a plain OK so the
 *  store's 1s/2s/4s sync retry loop never delays a test. */
const stubFetch = (postsResponse: Response) =>
  vi.stubGlobal('fetch', vi.fn(async (url: any) =>
    String(url).startsWith('/api/posts') ? postsResponse : okResponse()));

describe('store publishing API (server-authoritative, 2026-09-26)', () => {
  beforeEach(() => {
    stubFetch(okResponse());
    heartsync.posts = [];
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('addPost POSTs the clean payload to /api/posts', async () => {
    await heartsync.addPost({ title: 'Test Article', content: 'Real body text', category_id: 'cat-1' });
    const call = (fetch as any).mock.calls[0];
    expect(call[0]).toBe('/api/posts');
    expect(call[1].method).toBe('POST');
    const sent = JSON.parse(call[1].body);
    expect(sent.title).toBe('Test Article');
    // expandArticleContent decorates the raw body with the article scaffold;
    // the payload must carry the FULL body (the publishing fix), which
    // includes the author's original text.
    expect(sent.content).toContain('Real body text');
    expect(sent.content.length).toBeGreaterThan('Real body text'.length);
    expect(sent.slug).toBe('test-article');
  });

  it('addPost keeps the created post in state and never writes localStorage', async () => {
    await heartsync.addPost({ title: 'Keep Me', content: 'Body' });
    expect(heartsync.posts.some(p => p.title === 'Keep Me')).toBe(true);
    expect(Object.keys(localStorage).length).toBe(0);
  });

  it('addPost surfaces the server error message on failure', async () => {
    stubFetch(errResponse(500, { error: 'Database insert failed: RLS violation' }));
    await expect(
      heartsync.addPost({ title: 'Boom', content: 'x' }),
    ).rejects.toThrow(/RLS violation/);
  });

  it('addPost does not throw when the endpoint is absent (404 local-dev fallback, no supabase client)', async () => {
    stubFetch(errResponse(404, {}));
    await expect(heartsync.addPost({ title: 'Fallback', content: 'x' })).resolves.toBeDefined();
  });

  it('updatePost PUTs the edit and NEVER wipes the stored body (2026-09-24 incident class)', async () => {
    await heartsync.addPost({ title: 'Original Title', content: 'Original body', category_id: 'cat-1' });
    const stored = heartsync.posts.find(p => p.title === 'Original Title')!;
    const id = stored.id;
    (fetch as any).mockClear();
    await heartsync.updatePost(id, { title: 'New Title' });
    const call = (fetch as any).mock.calls[0];
    expect(String(call[0])).toBe(`/api/posts/${encodeURIComponent(id)}`);
    expect(call[1].method).toBe('PUT');
    const sent = JSON.parse(call[1].body);
    expect(sent.title).toBe('New Title');
    // A contentless edit on a hydrated post carries the in-memory body (the
    // designed 2026-09-24 behavior) - the regression to guard against is
    // ever shipping an empty body, which wiped live articles.
    if (Object.prototype.hasOwnProperty.call(sent, 'content')) {
      expect(sent.content).toBe(stored.content);
      expect(String(sent.content).trim().length).toBeGreaterThan(0);
    }
  });

  it('updatePost rejects when the server reports failure', async () => {
    await heartsync.addPost({ title: 'Will Fail', content: 'x', category_id: 'cat-1' });
    const id = heartsync.posts.find(p => p.title === 'Will Fail')!.id;
    stubFetch(errResponse(500, { error: 'update denied' }));
    await expect(heartsync.updatePost(id, { status: 'draft' })).rejects.toThrow(/update denied/);
  });
});
