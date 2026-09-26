// Client-side payload contract tests (2026-09-26) for the publish foreign-key
// incident: the browser must send posts.author_id as the PLAIN TEXT id of a
// public.authors row - never a hashed fake UUID (the old toDbUUID mapping
// violated posts_author_id_fkey on every publish and blocked publishing).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { heartsync } from '../../store';

const okResponse = (body: unknown = { success: true }) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const stubFetch = () =>
  vi.stubGlobal('fetch', vi.fn(async () => okResponse()));

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sentPayload = (): any => {
  const call = (fetch as any).mock.calls.find((c: any) => String(c[0]).startsWith('/api/posts'));
  expect(call).toBeTruthy();
  return JSON.parse(call[1].body);
};

describe('publish payload author_id contract (plain text, never hashed)', () => {
  beforeEach(() => {
    stubFetch();
    heartsync.posts = [];
    heartsync.current_user = null;
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends the selected author id through as plain text', async () => {
    await heartsync.addPost({
      title: 'Author Contract Article',
      content: 'Real body text',
      category_id: 'cat-1',
      author_id: 'peter-tubin'
    });
    const sent = sentPayload();
    expect(sent.author_id).toBe('peter-tubin');
    expect(sent.author_id).not.toMatch(UUID_RE);
  });

  it('sends null (not a hashed empty id) when no author is set', async () => {
    await heartsync.addPost({ title: 'No Author', content: 'Body text', category_id: 'cat-1' });
    const sent = sentPayload();
    expect(sent.author_id === null || sent.author_id === undefined).toBe(true);
  });

  it('carries the admin display name for server-side author provisioning', async () => {
    heartsync.current_user = { id: 'u-admin', name: 'Peter Tubin' } as any;
    try {
      await heartsync.addPost({
        title: 'Provisioning Name',
        content: 'Body text',
        category_id: 'cat-1',
        author_id: 'new-author'
      });
      const sent = sentPayload();
      expect(sent.author_name).toBe('Peter Tubin');
    } finally {
      heartsync.current_user = null;
    }
  });

  it('updatePost edits keep author_id plain text when supplied', async () => {
    await heartsync.addPost({ title: 'Edit Target', content: 'Original body', category_id: 'cat-1' });
    const stored = heartsync.posts.find(p => p.title === 'Edit Target')!;
    (fetch as any).mockClear();
    await heartsync.updatePost(stored.id, { title: 'Edited', author_id: 'jane-doe' });
    const sent = sentPayload();
    expect(sent.author_id).toBe('jane-doe');
    expect(sent.author_id).not.toMatch(UUID_RE);
  });
});
