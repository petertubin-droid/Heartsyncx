// @vitest-environment node
// CONTRACT + REGRESSION TESTS (2026-09-24) for article-content safety.
//
// Covers the three things that the Sep 2026 posts.content wipe made critical:
//
//   1. REGRESSION: POST /api/state must never write `content` (or a
//      destructive replacement of ad `raw_settings`) into the posts /
//      site_settings upserts. The original wipe was caused by the boot-state
//      sync carrying `content: post.content || ''` for posts whose client
//      state legitimately has no body; the fix deliberately omits the column.
//      These tests pin that contract so a future refactor cannot reintroduce
//      the wipe.
//
//   2. CONTRACT: POST /api/recover-articles - token-gated cache harvest.
//      Must only fill EMPTY bodies, never overwrite, and count
//      restored/skipped/missing accurately.
//
//   3. CONTRACT: POST /api/maint/articles - unpublish_empty and
//      restore_batch actions with the same never-overwrite guarantee, plus
//      the tooShort floor so a truncated paste cannot publish a stub.
//
// Same harness shape as server-security.test.ts: the Express app runs for
// real on an ephemeral port with @supabase/supabase-js fully mocked. This
// mock is a small in-memory database: filters actually filter, updates
// actually mutate, and every upsert payload is recorded for assertions.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase mock: an in-memory Postgres-ish table store with real filtering.
// Hoisted so it exists before server.ts is imported.
// ---------------------------------------------------------------------------
const supabase = vi.hoisted(() => {
  const state = {
    users: {} as Record<string, { id: string; email: string }>,
    tables: {} as Record<string, any[]>,
    upserts: {} as Record<string, any[]>,
    updates: [] as Array<{ table: string; id: string; patch: any }>
  };

  type Filter = [string, any]; // [column, scalar | array(meaning IN)]
  function matches(row: any, filters: Filter[]) {
    return filters.every(([col, val]) => {
      if (Array.isArray(val)) return val.includes(row[col]);
      return row[col] === val;
    });
  }

  function makeChain(table: string, _clientToken: string | null) {
    const filters: Filter[] = [];
    let selected: string[] | null = null;
    let pendingPatch: any;

    const tableRows = () => (state.tables[table] = state.tables[table] || []);
    const filtered = () => tableRows().filter((r) => matches(r, filters));
    const project = (row: any) => {
      if (!selected || selected.includes('*')) return { ...row };
      const out: any = {};
      for (const col of selected) out[col] = row[col];
      return out;
    };

    const chain: any = {};
    for (const m of ['insert', 'delete']) {
      chain[m] = () => chain;
    }
    for (const m of ['select', 'eq', 'neq', 'in', 'lt', 'gt', 'gte', 'lte', 'order',
      'limit', 'range', 'ilike', 'like', 'or', 'not', 'is', 'contains', 'onConflict']) {
      chain[m] = (...args: any[]) => {
        if (m === 'select' && args[0]) {
          selected = String(args[0]).split(',').map((s) => s.trim());
        }
        if (m === 'eq') filters.push([args[0], args[1]]);
        if (m === 'in') filters.push([args[0], args[1]]);
        return chain;
      };
    }

    chain.update = (patch: any) => { pendingPatch = patch; return chain; };

    chain.upsert = (payload: any) => {
      const rows = Array.isArray(payload) ? payload : [payload];
      (state.upserts[table] = state.upserts[table] || []).push(...rows.map((r) => JSON.parse(JSON.stringify(r))));
      const arr = tableRows();
      for (const r of rows) {
        const i = arr.findIndex((x) => x.id === r.id);
        if (i >= 0) arr[i] = { ...arr[i], ...r };
        else arr.push({ ...r });
      }
      return Promise.resolve({ data: rows, error: null });
    };

    const rowOutcome = () => {
      const m = filtered();
      return m.length ? { data: project(m[0]), error: null } : { data: null, error: null };
    };
    const listOutcome = () => ({ data: filtered().map(project), error: null });

    chain.single = () => Promise.resolve(rowOutcome());
    chain.maybeSingle = () => Promise.resolve(rowOutcome());
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve((() => {
        if (pendingPatch !== undefined) {
          const hits = filtered();
          for (const row of hits) {
            Object.assign(row, JSON.parse(JSON.stringify(pendingPatch)));
            state.updates.push({ table, id: row.id, patch: { ...pendingPatch } });
          }
          return { data: null, error: null };
        }
        return listOutcome();
      })()).then(resolve, reject);
    chain.catch = (cb: any) => chain.then(() => { }, cb);
    return chain;
  }

  const createClient = (_url: any, _key: any, opts?: any) => {
    const clientToken = (opts?.global?.headers?.Authorization || '').split(' ')[1] || null;
    return {
      auth: {
        getUser: async (token: string) => {
          const u = state.users[token];
          return u
            ? { data: { user: { id: u.id, email: u.email, user_metadata: { full_name: 'Test User' } } }, error: null }
            : { data: { user: null }, error: { message: 'invalid JWT' } };
        }
      },
      from: (table: string) => makeChain(table, clientToken),
      rpc: () => Promise.resolve({ data: null, error: null })
    };
  };

  return { createClient, state };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: supabase.createClient }));

// ---------------------------------------------------------------------------
// Environment bootstrap. Same contract as ./env-setup but WITHOUT deleting
// SUPABASE_SERVICE_ROLE_KEY: the maint/recover endpoints require a valid
// service_role JWT, so we mint a deterministic one before server.ts loads.
// vi.hoisted runs before any import, so server.ts sees the full config.
// ---------------------------------------------------------------------------
const svcKey = vi.hoisted(() => {
  const enc = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return [
    enc({ alg: 'HS256', typ: 'JWT' }),
    enc({ role: 'service_role', iss: 'https://heartsync-test.supabase.co/auth/v1', ref: 'test' }),
    'test-signature'
  ].join('.');
});
vi.hoisted(() => {
  process.env.VERCEL = '1';
  process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://heartsync-test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || svcKey;
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_tests';
  process.env.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_dummy_key_for_tests';
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dummy_test_key';
  delete process.env.GEMINI_API_KEY;
});

// NOTE: importing the server app AFTER the mock + env bootstrap above.
import { app } from '../../server';

const RECOVERY_TOKEN = 'hxrec_b39c975dadf0569aa37d099035f0a91b';
const MAINT_TOKEN = 'hxmaint_c378fe6d8c395f60905dd1b4b03aeb88';

let base = '';
let srv: any;

function req(method: string, route: string, body?: any, headers?: Record<string, string>) {
  return fetch(base + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}
const recover = (body: any, token?: string) =>
  req('POST', '/api/recover-articles', body, token ? { 'x-recovery-token': token } : {});
const maint = (body: any, token?: string) =>
  req('POST', '/api/maint/articles', body, token ? { 'x-maint-token': token } : {});

function seedPosts() {
  supabase.state.tables['posts'] = [
    { id: 'p-empty', slug: 'empty-post', title: 'Empty Post', status: 'published', content: '' },
    { id: 'p-full', slug: 'full-post', title: 'Full Post', status: 'published', content: 'PREEXISTING BODY' },
    { id: 'p-draft-empty', slug: 'draft-empty-post', title: 'Draft Empty', status: 'draft', content: '' },
    { id: 'p-space', slug: 'whitespace-post', title: 'Whitespace', status: 'published', content: '   \n\t  ' }
  ];
}

function postRow(slug: string) {
  return supabase.state.tables['posts'].find((p: any) => p.slug === slug);
}

beforeAll(async () => {
  // Admin identity for POST /api/state (profiles table drives the role check).
  supabase.state.users['admin-token'] = { id: 'u-admin', email: 'admin@heartsync.app' };
  supabase.state.tables['profiles'] = [{ id: 'u-admin', role: 'admin', is_suspended: false }];
  supabase.state.tables['site_settings'] = [{
    id: 'singleton',
    site_name: 'Heartsync',
    raw_settings: { adsterra_key_id: 'KEEP-ME', monetag_zone_id: 'KEEP-ZONE' }
  }];
  seedPosts();

  srv = (app as any).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}`;

  // Warm the state cache so memory-backed routes have a state object.
  const warm = await fetch(`${base}/api/state`);
  expect(warm.ok).toBe(true);
});

afterAll(async () => {
  await new Promise((r) => srv.close(r));
});

// ===========================================================================
// 1. WIPE REGRESSION - POST /api/state must not touch article bodies
// ===========================================================================
describe('POST /api/state content-safety regression (the 2026-09 wipe)', () => {
  it('never upserts a `content` column for posts, even when client posts carry none', async () => {
    supabase.state.upserts['posts'] = [];
    seedPosts();

    // Boot-state shape: list columns only, NO content field (bodies are
    // fetched per-article). This exact payload used to wipe every body.
    const res = await req('POST', '/api/state', {
      posts: [
        { id: 'p-full', title: 'Full Post', slug: 'full-post', status: 'published' },
        { id: 'p-empty', title: 'Empty Post', slug: 'empty-post', status: 'published' }
      ],
      site_settings: { site_name: 'Heartsync' }
    }, { Authorization: 'Bearer admin-token' });
    expect(res.ok).toBe(true);

    const upserted = supabase.state.upserts['posts'] || [];
    expect(upserted.length).toBeGreaterThan(0);
    for (const row of upserted) {
      expect(row).not.toHaveProperty('content');
    }

    // The database rows themselves must keep their bodies untouched.
    expect(postRow('full-post').content).toBe('PREEXISTING BODY');
    expect(postRow('empty-post').content).toBe('');
  });

  it('merges ad raw_settings instead of replacing them (2026-09-22 ad-config incident)', async () => {
    supabase.state.upserts['site_settings'] = [];

    const res = await req('POST', '/api/state', {
      posts: [],
      site_settings: { site_name: 'Heartsync', adsense_client_id: 'ca-pub-NEW' }
    }, { Authorization: 'Bearer admin-token' });
    expect(res.ok).toBe(true);

    const upserted = supabase.state.upserts['site_settings'] || [];
    expect(upserted.length).toBe(1);
    const raw = upserted[0].raw_settings || {};
    // New key wins, surviving ad keys are preserved, not destroyed.
    expect(raw.adsense_client_id).toBe('ca-pub-NEW');
    expect(raw.adsterra_key_id).toBe('KEEP-ME');
    expect(raw.monetag_zone_id).toBe('KEEP-ZONE');
  });

  it('rejects non-admin callers (401 anonymous, 403 reader)', async () => {
    const anon = await req('POST', '/api/state', { posts: [] });
    expect(anon.status).toBe(401);

    supabase.state.users['reader-token'] = { id: 'u-reader', email: 'reader@heartsync.app' };
    supabase.state.tables['profiles'].push({ id: 'u-reader', role: 'user', is_suspended: false });
    const reader = await req('POST', '/api/state', { posts: [] }, { Authorization: 'Bearer reader-token' });
    expect(reader.status).toBe(403);
  });
});

// ===========================================================================
// 2. RECOVERY CONTRACT - POST /api/recover-articles
// ===========================================================================
describe('POST /api/recover-articles (cache-harvest contract)', () => {
  it('rejects missing, wrong, and cross-endpoint tokens', async () => {
    expect((await recover({ articles: {} })).status).toBe(401);
    expect((await recover({ articles: {} }, 'wrong-token')).status).toBe(401);
    // The MAINT token must not unlock the recovery endpoint.
    expect((await recover({ articles: {} }, MAINT_TOKEN)).status).toBe(401);
  });

  it('rejects malformed articles payloads', async () => {
    expect((await recover({ articles: 'nope' }, RECOVERY_TOKEN)).status).toBe(400);
    expect((await recover({ articles: ['nope'] }, RECOVERY_TOKEN)).status).toBe(400);
    expect((await recover({}, RECOVERY_TOKEN)).status).toBe(400);
  });

  it('fills only empty bodies, never overwrites, and counts accurately', async () => {
    seedPosts();
    const goodBody = 'R'.repeat(200);
    const res = await recover({
      articles: {
        'empty-post': goodBody,                    // empty in DB -> restored
        'whitespace-post': 'W'.repeat(120),        // whitespace-only -> restored
        'full-post': 'ATTACK ATTEMPT'.repeat(10),  // has a body -> skipped, NOT overwritten
        'ghost-post': 'G'.repeat(80),              // unknown slug -> missing
        'BAD_SLUG': 'x'.repeat(80),                // invalid slug -> skipped
        'short-one': 'tiny'                         // under 50 chars -> skipped
      }
    }, RECOVERY_TOKEN);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.restored).toBe(2);
    expect(body.skipped).toBe(3);
    expect(body.missing).toBe(1);
    expect(body.slugs).toEqual(expect.arrayContaining(['empty-post', 'whitespace-post']));
    expect(body.slugs).toHaveLength(2);

    // State verification: filled, untouched, timestamps bumped.
    expect(postRow('empty-post').content).toBe(goodBody);
    expect(postRow('whitespace-post').content).toBe('W'.repeat(120));
    expect(postRow('full-post').content).toBe('PREEXISTING BODY');
    expect(postRow('empty-post').updated_at).toBeTruthy();
  });
});

// ===========================================================================
// 3. MAINTENANCE CONTRACT - POST /api/maint/articles
// ===========================================================================
describe('POST /api/maint/articles (unpublish_empty + restore_batch)', () => {
  it('rejects missing, wrong, and cross-endpoint tokens', async () => {
    expect((await maint({ action: 'unpublish_empty' })).status).toBe(401);
    expect((await maint({ action: 'unpublish_empty' }, 'nope')).status).toBe(401);
    // The RECOVERY token must not unlock the maint endpoint.
    expect((await maint({ action: 'unpublish_empty' }, RECOVERY_TOKEN)).status).toBe(401);
  });

  it('rejects unknown actions and malformed restore payloads', async () => {
    expect((await maint({ action: 'nuke_all' }, MAINT_TOKEN)).status).toBe(400);
    expect((await maint({ action: 'restore_batch', articles: 'nope' }, MAINT_TOKEN)).status).toBe(400);
    expect((await maint({ action: 'restore_batch', articles: [] }, MAINT_TOKEN)).status).toBe(400);
  });

  it('unpublish_empty drafts ONLY published posts with truly empty bodies', async () => {
    seedPosts();
    const res = await maint({ action: 'unpublish_empty' }, MAINT_TOKEN);
    expect(res.ok).toBe(true);
    const body = await res.json();

    expect(body.unpublished).toBe(2); // empty-post + whitespace-post
    expect(body.slugs).toEqual(expect.arrayContaining(['empty-post', 'whitespace-post']));

    // Published-with-body untouched; already-draft untouched (no duplicate update).
    expect(postRow('full-post').status).toBe('published');
    expect(postRow('draft-empty-post').status).toBe('draft');
    expect(postRow('empty-post').status).toBe('draft');
    expect(postRow('whitespace-post').status).toBe('draft');
  });

  it('restore_batch fills empty bodies, republishes them, and never overwrites', async () => {
    seedPosts();
    const goodBody = 'B'.repeat(600); // above the 500-char floor

    const res = await maint({
      action: 'restore_batch',
      articles: {
        'empty-post': goodBody,                   // empty -> restored + published
        'draft-empty-post': goodBody,             // draft + empty -> restored + published
        'full-post': 'OVERWRITE ATTEMPT'.repeat(50), // has body -> skipped
        'ghost-post': 'G'.repeat(600),            // unknown -> missing
        'stub-post': 'too short',                  // under 500 -> tooShort
        'BAD_SLUG': 'z'.repeat(600)               // invalid slug -> tooShort
      }
    }, MAINT_TOKEN);
    expect(res.ok).toBe(true);
    const body = await res.json();

    expect(body.restored).toBe(2);
    expect(body.skipped).toBe(1);
    expect(body.missing).toBe(1);
    expect(body.tooShort).toBe(2);
    expect(body.slugs).toEqual(expect.arrayContaining(['empty-post', 'draft-empty-post']));

    // Never-overwrite is the security invariant of both endpoints.
    expect(postRow('full-post').content).toBe('PREEXISTING BODY');
    expect(postRow('full-post').status).toBe('published');
    // Restored articles went live with the new body.
    expect(postRow('empty-post').content).toBe(goodBody);
    expect(postRow('empty-post').status).toBe('published');
    expect(postRow('draft-empty-post').status).toBe('published');
  });

  it('enforces the 500-char floor: a stub cannot be published via restore_batch', async () => {
    seedPosts();
    const res = await maint({
      action: 'restore_batch',
      articles: { 'empty-post': 'x'.repeat(499) }
    }, MAINT_TOKEN);
    const body = await res.json();
    expect(body.restored).toBe(0);
    expect(body.tooShort).toBe(1);
    expect(postRow('empty-post').content).toBe('');
  });
});

// ===========================================================================
// 4. PUBLIC READ CONTRACT - GET /api/posts/:slug
// ===========================================================================
describe('GET /api/posts/:slug (public read contract)', () => {
  it('serves published articles with content and parsed in_article_inserts', async () => {
    seedPosts();
    supabase.state.tables['posts'][1] = {
      ...postRow('full-post'),
      status: 'published',
      in_article_inserts: JSON.stringify([{ position: 'middle', provider: 'monetag' }])
    };
    const res = await req('GET', '/api/posts/full-post');
    expect(res.status).toBe(200);
    const post = await res.json();
    expect(post.content).toBe('PREEXISTING BODY');
    expect(Array.isArray(post.in_article_inserts)).toBe(true);
    expect(post.in_article_inserts[0].provider).toBe('monetag');
  });

  it('hides drafts and unknown slugs (404, no body leak)', async () => {
    seedPosts();
    expect((await req('GET', '/api/posts/draft-empty-post')).status).toBe(404);
    expect((await req('GET', '/api/posts/ghost-post')).status).toBe(404);
  });
});

// ===========================================================================
// 5. CODE SENTRY CONTRACT - POST /api/sentry/capture + admin reads
// ===========================================================================
describe('POST /api/sentry/capture (code watchdog contract)', () => {
  it('accepts valid events and reports the buffered count', async () => {
    const res = await req('POST', '/api/sentry/capture', {
      events: [
        { type: 'error', message: 'boom', url: 'https://heartsyncx.netlify.app/', session: 'sess_x', fingerprint: 'f' },
        { type: 'fatal', message: 'react died', stack: 'at Render', fingerprint: 'g' }
      ]
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.stored).toBe(2);
    expect(body.buffered).toBeGreaterThanOrEqual(2);
  });

  it('rejects malformed payloads (no events array, empty array, oversized batch)', async () => {
    expect((await req('POST', '/api/sentry/capture', {})).status).toBe(400);
    expect((await req('POST', '/api/sentry/capture', { events: [] })).status).toBe(400);
    expect((await req('POST', '/api/sentry/capture', { events: new Array(25).fill({ message: 'x' }) })).status).toBe(400);
  });

  it('sanitizes hostile event fields (oversized + unknown types clamped)', async () => {
    const res = await req('POST', '/api/sentry/capture', {
      events: [{ type: 'sql-injection-attempt', message: 'A'.repeat(5000), stack: 'S'.repeat(9000) }]
    });
    expect(res.ok).toBe(true);
    const read = await req('GET', '/api/sentry/events?limit=5', undefined, { Authorization: 'Bearer admin-token' });
    expect(read.ok).toBe(true);
    const data = await read.json();
    const ev = data.events.find((e: any) => e.message.startsWith('A'));
    expect(ev).toBeTruthy();
    expect(ev.type).toBe('error');            // unknown type clamped
    expect(ev.message.length).toBeLessThanOrEqual(500);
    expect(ev.stack.length).toBeLessThanOrEqual(2000);
    // Privacy: only an IP hash is stored, never the raw IP.
    expect(ev.ip_hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('rate-limits a flooding source (429 after the per-IP budget)', async () => {
    // Budget is 30 per 5 min; the two tests above consumed some of it.
    let saw429 = false;
    for (let i = 0; i < 32; i++) {
      const res = await req('POST', '/api/sentry/capture', {
        events: [{ type: 'error', message: `flood ${i}`, fingerprint: `flood-${i}` }]
      });
      if (res.status === 429) { saw429 = true; break; }
    }
    expect(saw429).toBe(true);
  });

  it('guards admin reads: 401 anonymous, 403 reader, 200 admin', async () => {
    expect((await req('GET', '/api/sentry/events')).status).toBe(401);
    expect((await req('GET', '/api/sentry/events', undefined, { Authorization: 'Bearer reader-token' })).status).toBe(403);
    const res = await req('GET', '/api/sentry/events', undefined, { Authorization: 'Bearer admin-token' });
    expect(res.ok).toBe(true);
    expect((await res.json()).events).toBeInstanceOf(Array);
  });
});
