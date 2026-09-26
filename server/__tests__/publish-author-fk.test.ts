// @vitest-environment node
// REGRESSION TESTS (2026-09-26) for the article-publish foreign-key incident:
// "insert or update on table posts violates foreign key constraint".
//
// public.posts.author_id is a TEXT foreign key -> public.authors(id). The
// old code hashed non-UUID author ids into FAKE UUIDs (deterministic FNV
// hash), which could never match an authors row, so EVERY publish was
// rejected by posts_author_id_fkey. These tests pin the fixed contract:
//
//   1. author_id passes through as PLAIN TEXT (never hashed to a UUID);
//   2. a missing author row is PROVISIONED in public.authors so the FK
//      resolves and publishing is never blocked;
//   3. when provisioning fails, author_id is dropped and the article
//      STILL publishes (the FK is ON DELETE SET NULL / nullable);
//   4. updates resolve authorship the same way.
//
// Same harness shape as article-content-safety.test.ts: the Express app
// runs for real on an ephemeral port with @supabase/supabase-js mocked as
// an in-memory table store where inserts actually insert.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const supabase = vi.hoisted(() => {
  const state = {
    users: {} as Record<string, { id: string; email: string }>,
    tables: {} as Record<string, any[]>,
    insertErrByTable: {} as Record<string, any>
  };

  type Filter = [string, any];
  function matches(row: any, filters: Filter[]) {
    return filters.every(([col, val]) =>
      Array.isArray(val) ? val.includes(row[col]) : row[col] === val);
  }

  function makeChain(table: string, _clientToken: string | null) {
    const filters: Filter[] = [];
    let selected: string[] | null = null;
    let pendingPatch: any;
    let pendingInsert: any[] = [];
    let mode: 'query' | 'insert' | 'update' = 'query';

    const tableRows = () => (state.tables[table] = state.tables[table] || []);
    const filtered = () => tableRows().filter((r: any) => matches(r, filters));
    const project = (row: any) => {
      if (!selected || selected.includes('*')) return { ...row };
      const out: any = {};
      for (const col of selected) out[col] = row[col];
      return out;
    };

    const chain: any = {};
    for (const m of ['eq', 'neq', 'in', 'limit', 'order', 'onConflict']) {
      chain[m] = (...args: any[]) => {
        if (m === 'eq') filters.push([args[0], args[1]]);
        if (m === 'in') filters.push([args[0], args[1]]);
        return chain;
      };
    }
    chain.select = (cols?: string) => {
      if (cols) selected = String(cols).split(',').map((s: string) => s.trim());
      return chain;
    };
    chain.insert = (payload: any) => {
      mode = 'insert';
      pendingInsert = Array.isArray(payload) ? payload : [payload];
      return chain;
    };
    chain.update = (patch: any) => {
      mode = 'update';
      pendingPatch = patch;
      return chain;
    };

    const insertOutcome = () => {
      const err = state.insertErrByTable[table] || null;
      if (err) return { data: null, error: err };
      for (const row of pendingInsert) tableRows().push({ ...row });
      return { data: pendingInsert.map(project), error: null };
    };
    const updateOutcome = () => {
      for (const row of filtered()) Object.assign(row, JSON.parse(JSON.stringify(pendingPatch)));
      return { data: null, error: null };
    };
    const queryOutcome = () => {
      const m = filtered();
      return m.length ? { data: project(m[0]), error: null } : { data: null, error: null };
    };

    const resolve = () => {
      if (mode === 'insert') return insertOutcome();
      if (mode === 'update') return updateOutcome();
      return queryOutcome();
    };
    chain.single = () => Promise.resolve(resolve());
    chain.maybeSingle = () => Promise.resolve(resolve());
    chain.then = (res: any, rej: any) => Promise.resolve(resolve()).then(res, rej);
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
            ? { data: { user: { id: u.id, email: u.email, user_metadata: { full_name: 'Test Admin' } } }, error: null }
            : { data: { user: null }, error: { message: 'invalid JWT' } };
        }
      },
      from: (table: string) => makeChain(table, clientToken)
    };
  };

  return { createClient, state };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: supabase.createClient }));

vi.hoisted(() => {
  process.env.VERCEL = '1';
  process.env.VITE_SUPABASE_URL = 'https://heartsync-test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  delete process.env.GEMINI_API_KEY;
});

// Import the server app AFTER the mock + env bootstrap above.
import { app } from '../../server';

let base = '';
let srv: any;

function req(method: string, route: string, body?: any, headers?: Record<string, string>) {
  return fetch(base + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}
const publish = (body: any) => req('POST', '/api/posts', body, { Authorization: 'Bearer admin-token' });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

beforeAll(async () => {
  supabase.state.users['admin-token'] = { id: 'u-admin', email: 'admin@heartsync.app' };
  supabase.state.tables['profiles'] = [{ id: 'u-admin', role: 'admin', is_suspended: false }];
  supabase.state.tables['authors'] = [
    { id: 'peter-tubin', name: 'Peter Tubin', role: 'Author', is_active: true }
  ];
  supabase.state.tables['posts'] = [];

  srv = (app as any).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}`;
});

afterAll(async () => {
  await new Promise((r) => srv.close(r));
});

describe('POST /api/posts (author FK resolution, 2026-09-26 incident)', () => {
  it('passes a known author id through as PLAIN TEXT - never a hashed UUID', async () => {
    const res = await publish({
      title: 'Known Author Article',
      content: 'A real body for the article. '.repeat(20),
      author_id: 'peter-tubin',
      category_id: 'cat-relationship'
    });
    expect(res.status).toBe(200);
    const row = supabase.state.tables['posts'].find((p: any) => p.title === 'Known Author Article');
    expect(row).toBeTruthy();
    expect(row.author_id).toBe('peter-tubin');
    expect(row.author_id).not.toMatch(UUID_RE); // the regression that broke publishing
  });

  it('provisions a missing author row so publishing is never blocked', async () => {
    const res = await publish({
      title: 'New Author Article',
      content: 'Another real body for the article. '.repeat(20),
      author_id: 'jane-doe',
      author_name: 'Jane Doe',
      category_id: 'cat-communication'
    });
    expect(res.status).toBe(200);
    const row = supabase.state.tables['posts'].find((p: any) => p.title === 'New Author Article');
    expect(row.author_id).toBe('jane-doe');
    const authorRow = supabase.state.tables['authors'].find((a: any) => a.id === 'jane-doe');
    expect(authorRow).toBeTruthy();
    expect(authorRow.name).toBe('Jane Doe');
  });

  it('still publishes when the author row cannot be provisioned (author_id dropped, not hashed)', async () => {
    supabase.state.insertErrByTable['authors'] = { message: 'RLS blocked the insert' };
    try {
      const res = await publish({
        title: 'Ghost Author Article',
        content: 'Body that must still go live. '.repeat(20),
        author_id: 'ghost-author',
        author_name: 'Ghost Author'
      });
      expect(res.status).toBe(200);
      const row = supabase.state.tables['posts'].find((p: any) => p.title === 'Ghost Author Article');
      // Nullable FK: unresolvable authorship is omitted, publish succeeds.
      expect(row.author_id === undefined || row.author_id === null).toBe(true);
    } finally {
      delete supabase.state.insertErrByTable['authors'];
    }
  });

  it('publishes without author_id at all (fresh install, no author chosen)', async () => {
    const res = await publish({
      title: 'No Author Article',
      content: 'Body without an author field. '.repeat(20)
    });
    expect(res.status).toBe(200);
    const row = supabase.state.tables['posts'].find((p: any) => p.title === 'No Author Article');
    expect(row.author_id === undefined || row.author_id === null).toBe(true);
  });

  it('rejects publishing without a real body (validation intact)', async () => {
    const res = await publish({ title: 'Empty', content: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/posts/:id (author FK resolution on update)', () => {
  it('updates authorship to a provisioned author as plain text', async () => {
    supabase.state.tables['posts'].push({
      id: 'p-existing', slug: 'existing-article', title: 'Existing Article',
      status: 'draft', content: 'Existing body', author_id: 'peter-tubin'
    });
    const res = await req('PUT', '/api/posts/p-existing', {
      title: 'Existing Article',
      status: 'published',
      author_id: 'jane-doe',
      author_name: 'Jane Doe'
    }, { Authorization: 'Bearer admin-token' });
    expect(res.status).toBe(200);
    const row = supabase.state.tables['posts'].find((p: any) => p.id === 'p-existing');
    expect(row.author_id).toBe('jane-doe');
    expect(row.status).toBe('published');
  });

  it('keeps the stored author when a new one cannot be provisioned', async () => {
    supabase.state.insertErrByTable['authors'] = { message: 'RLS blocked the insert' };
    try {
      const res = await req('PUT', '/api/posts/p-existing', {
        title: 'Existing Article (edited)',
        author_id: 'unprovisionable-author'
      }, { Authorization: 'Bearer admin-token' });
      expect(res.status).toBe(200);
      const row = supabase.state.tables['posts'].find((p: any) => p.id === 'p-existing');
      // Never nulls out good stored authorship on a failed resolution;
      // the rest of the edit still lands.
      expect(row.author_id).toBe('jane-doe');
      expect(row.title).toBe('Existing Article (edited)');
    } finally {
      delete supabase.state.insertErrByTable['authors'];
    }
  });
});
