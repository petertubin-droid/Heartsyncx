// @vitest-environment node
// REGRESSION TEST (2026-09-22): /api/auth/sync-profile must recognize an
// existing administrator from the DATABASE, not only from the in-memory
// cache. Cold serverless instances start with an EMPTY cache, and the
// anon-key state loader can never populate profiles (anon grants on
// profiles are deliberately revoked in schema.sql). Before the fix every
// DB admin signing in looked like a 'subscriber' and was locked out of
// the admin portal with "Access denied: This portal is reserved for
// administrators only."
import './env-setup';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Same Supabase mock contract as server-security.test.ts: profiles rows
// resolve per client Bearer token (own-row RLS semantics), other tables per
// seeded array.
const supabase = vi.hoisted(() => {
  const state = {
    users: {} as Record<string, { id: string; email: string }>,
    profiles: {} as Record<string, any>,
    tables: {} as Record<string, any[]>,
    calls: [] as string[],
  };

  function makeChain(table: string, clientToken: string | null) {
    const chain: any = {};
    const rowOutcome = () => {
      state.calls.push(`${clientToken}:${table}:row`);
      if (table === 'profiles' && clientToken) {
        const p = state.profiles[clientToken];
        return p ? { data: p, error: null } : { data: null, error: { message: 'no profile row' } };
      }
      const arr = state.tables[table] || [];
      return arr.length ? { data: arr[0], error: null } : { data: null, error: null };
    };
    const listOutcome = () => {
      state.calls.push(`${clientToken}:${table}:list`);
      return { data: (state.tables[table] || []).slice(), error: null };
    };
    for (const m of ['insert', 'update', 'delete', 'upsert']) chain[m] = () => chain;
    for (const m of ['select', 'eq', 'neq', 'in', 'lt', 'gt', 'gte', 'lte', 'order',
      'limit', 'range', 'ilike', 'like', 'or', 'not', 'is', 'contains', 'onConflict']) {
      chain[m] = () => chain;
    }
    chain.single = () => Promise.resolve(rowOutcome());
    chain.maybeSingle = () => Promise.resolve(rowOutcome());
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve(listOutcome()).then(resolve, reject);
    chain.catch = (cb: any) => Promise.resolve(listOutcome()).catch(cb);
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

import { app } from '../../server';

let srv: any;
let base = '';

beforeAll(async () => {
  srv = (app as any).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}`;

  // The signed-in administrator: EXISTS in the DB (profiles keyed by their
  // auth token, i.e. readable via own-row RLS), but the server memory cache
  // is NOT seeded with any profile row - exactly a cold instance.
  supabase.state.users['tok-admin'] = { id: 'u-admin', email: 'owner@heartsync.app' };
  supabase.state.profiles['tok-admin'] = {
    id: 'u-admin',
    email: 'owner@heartsync.app',
    full_name: 'Owner',
    role: 'admin',
    status: 'active',
    is_suspended: false
  };

  // A regular subscriber signing in.
  supabase.state.users['tok-sub'] = { id: 'u-sub', email: 'sub@heartsync.app' };
  supabase.state.profiles['tok-sub'] = {
    id: 'u-sub',
    role: 'subscriber',
    status: 'active',
    is_suspended: false
  };

  // A suspended admin.
  supabase.state.users['tok-sus'] = { id: 'u-sus', email: 'sus@heartsync.app' };
  supabase.state.profiles['tok-sus'] = {
    id: 'u-sus',
    role: 'admin',
    status: 'active',
    is_suspended: true
  };
});

afterAll(async () => {
  await new Promise((r) => srv.close(r));
});

function syncProfile(token: string) {
  return fetch(`${base}/api/auth/sync-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
}

describe('sync-profile admin recognition (cold-cache regression)', () => {
  it('recognizes an existing DB admin even when the memory cache is empty', async () => {
    const res = await syncProfile('tok-admin');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // THE regression: before the DB lookup this came back as 'subscriber'.
    expect(body.profile.role).toBe('admin');
    expect(body.profile.id).toBe('u-admin');
    expect(body.profile.email).toBe('owner@heartsync.app');
  });

  it('keeps a subscriber a subscriber (no auto-promotion when admins exist)', async () => {
    const res = await syncProfile('tok-sub');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.role).toBe('subscriber');
  });

  it('reports a suspended admin truthfully so the client can block login', async () => {
    const res = await syncProfile('tok-sus');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.role).toBe('admin');
    expect(body.profile.is_suspended).toBe(true);
  });

  it('rejects requests without a bearer token', async () => {
    const res = await fetch(`${base}/api/auth/sync-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    expect(res.status).toBe(401);
  });

  it('rejects an invalid bearer token', async () => {
    const res = await syncProfile('bogus-token');
    expect(res.status).toBe(401);
  });
});
