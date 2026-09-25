import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regression tests for the 2026-09-25 state-sync audit:
 * every store action must ship ONLY the server sections it actually
 * owns, and reader actions must be flagged as reader saves so the
 * server applies engagement-only merges. A stale tab (reader or admin)
 * can no longer revert settings/content saved from another tab.
 */

type CapturedCall = { url: string; method: string; headers: Record<string, string>; body: any };

let calls: CapturedCall[] = [];

const jsonResponse = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true })
  } as Response);

const mockedFetch = vi.fn((url: any, init: any = {}) => {
  let body: any = null;
  try {
    body = init?.body ? JSON.parse(init.body) : null;
  } catch {
    body = init?.body;
  }
  calls.push({
    url: String(url),
    method: init?.method || 'GET',
    headers: (init?.headers as Record<string, string>) || {},
    body
  });
  return jsonResponse();
});

vi.stubGlobal('fetch', mockedFetch);

beforeEach(() => {
  calls = [];
});

describe('scoped section saves', () => {
  it('recordView ships ONLY analytics, marked as a reader save', async () => {
    const { heartsync } = await import('../../store');
    await heartsync.recordView('post-1');
    // recordView fires its own save; wait for any pending microtasks
    await new Promise((r) => setTimeout(r, 0));
    const post = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(post).toBeTruthy();
    expect(Object.keys(post!.body).sort()).toEqual(['analytics']);
    expect(post!.headers['X-Save-Mode']).toBe('reader');
    expect(post!.body.site_settings).toBeUndefined();
    expect(post!.body.posts).toBeUndefined();
  });

  it('addComment ships ONLY comments, marked as a reader save', async () => {
    const { heartsync } = await import('../../store');
    heartsync.addComment('post-1', 'hello', undefined, 'Reader', 'r@x.com');
    await new Promise((r) => setTimeout(r, 0));
    const post = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(post).toBeTruthy();
    expect(Object.keys(post!.body).sort()).toEqual(['comments']);
    expect(post!.headers['X-Save-Mode']).toBe('reader');
  });

  it('recordAdClick ships ONLY ad_zones, marked as a reader save', async () => {
    const { heartsync } = await import('../../store');
    // ensure a zone exists so the click is recorded
    heartsync.ad_zones = [{ id: 'zone-1', name: 'Skyscraper', active: true, clicks: 0 } as any];
    heartsync.recordAdClick('zone-1');
    await new Promise((r) => setTimeout(r, 0));
    const post = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(post).toBeTruthy();
    expect(Object.keys(post!.body).sort()).toEqual(['ad_zones']);
    expect(post!.headers['X-Save-Mode']).toBe('reader');
  });

  it('updateSettings ships ONLY site_settings (the 4424b92 regression)', async () => {
    const { heartsync } = await import('../../store');
    await heartsync.updateSettings({ site_name: 'Heartsyncx' });
    await new Promise((r) => setTimeout(r, 0));
    const post = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(post).toBeTruthy();
    expect(Object.keys(post!.body).sort()).toEqual(['site_settings']);
    expect(post!.body.site_settings).toBeTruthy();
    // admin save: must NOT carry the reader flag
    expect(post!.headers['X-Save-Mode']).toBeUndefined();
    // and must not ship any other section
    expect(post!.body.posts).toBeUndefined();
    expect(post!.body.media_library).toBeUndefined();
  });

  it('likePost and reactToPost never POST the full state (RPC/engagement path)', async () => {
    const { heartsync } = await import('../../store');
    const before = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').length;
    heartsync.likePost('post-1');
    heartsync.reactToPost('post-1', 'love');
    await new Promise((r) => setTimeout(r, 50));
    const after = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').length;
    expect(after).toBe(before); // localOnly: zero new POSTs
  });

  it('logAction is local-only and never triggers a server sync', async () => {
    const { heartsync } = await import('../../store');
    const before = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').length;
    heartsync.logAction('Test', 'nothing');
    await new Promise((r) => setTimeout(r, 50));
    const after = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').length;
    expect(after).toBe(before);
    expect(heartsync.audit_logs.length).toBeGreaterThan(0);
  });

  it('admin CRUD ships its own section only (addCategory)', async () => {
    const { heartsync } = await import('../../store');
    await heartsync.addCategory('Audited', 'from test', '#123456');
    await new Promise((r) => setTimeout(r, 0));
    const post = calls.filter((c) => c.url.includes('/api/state') && c.method === 'POST').pop();
    expect(post).toBeTruthy();
    expect(Object.keys(post!.body).sort()).toEqual(['categories']);
    expect(post!.body.categories).toBeTruthy();
    expect(post!.body.site_settings).toBeUndefined();
  });
});
