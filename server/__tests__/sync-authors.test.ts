// @vitest-environment node
// REGRESSION TEST (2026-09-27): author management from the admin console
// (add / edit / delete on the Authors pane) ships the authors section to
// POST /api/state, but syncStateToSupabase had NO active authors section -
// the only author upsert lived inside the disabled _legacySqlSyncBypass
// block. Author changes therefore landed in the in-memory cache alone and
// resurrected on the next boot, which rebuilds authors from the DB. These
// tests pin the DB leg: a state save must upsert public.authors with the
// soft-delete flag, must never clobber real emails with synthetic
// placeholders (the boot payload omits email), and must leave the table
// untouched when the save ships no authors.
import './env-setup';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const supabase = vi.hoisted(() => {
  const state = {
    users: {} as Record<string, { id: string; email: string }>,
    profiles: {} as Record<string, any>,
    upserts: {} as Record<string, any[]>,
  };

  function makeChain(table: string, clientToken: string | null) {
    const chain: any = {};
    for (const m of ['insert', 'update', 'delete', 'select', 'eq', 'neq', 'in',
      'lt', 'gt', 'gte', 'lte', 'order', 'limit', 'range', 'ilike', 'like',
      'or', 'not', 'is', 'contains', 'onConflict']) {
      chain[m] = () => chain;
    }
    chain.upsert = (rows: any) => {
      if (!state.upserts[table]) state.upserts[table] = [];
      state.upserts[table].push(rows);
      return Promise.resolve({ data: null, error: null });
    };
    chain.single = () => Promise.resolve({ data: null, error: null });
    chain.maybeSingle = () => {
      // profiles resolve per Bearer token, mirroring own-row RLS semantics
      // (same contract as server-security.test.ts / sync-profile-admin.test.ts).
      if (table === 'profiles' && clientToken) {
        const p = state.profiles[clientToken];
        return Promise.resolve(p ? { data: p, error: null } : { data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    };
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve({ data: [], error: null }).then(resolve, reject);
    chain.catch = (cb: any) => Promise.resolve([]).catch(cb);
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

  supabase.state.users['tok-admin'] = { id: 'u-admin', email: 'owner@heartsync.app' };
  supabase.state.profiles['tok-admin'] = {
    id: 'u-admin',
    email: 'owner@heartsync.app',
    full_name: 'Owner',
    role: 'admin',
    status: 'active',
    is_suspended: false
  };
});

afterAll(async () => {
  await new Promise((r) => srv.close(r));
});

function saveState(body: Record<string, unknown>) {
  return fetch(`${base}/api/state`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer tok-admin'
    },
    body: JSON.stringify(body)
  });
}

describe('POST /api/state author persistence (authors sync regression)', () => {
  it('upserts public.authors when the save ships the authors section', async () => {
    const res = await saveState({
      authors: [
        { id: 'auth-1', name: 'Peter Tubin', bio: 'Updated bio', avatar_url: '', role: 'Author', is_deleted: true },
        { id: 'auth-2', name: 'Dr. Katherine Mercer', bio: '', role: 'Author', is_deleted: false },
        { id: 'peter-tubin', name: 'Peter Tubin', bio: 'Founder', role: 'Author', email: 'peter-tubin@heartsync.com' }
      ]
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const upserts = supabase.state.upserts['authors'] || [];
    expect(upserts.length).toBe(1);
    const rows = upserts[0];
    expect(rows).toHaveLength(3);

    const softDeleted = rows.find((r: any) => r.id === 'auth-1');
    expect(softDeleted.is_active).toBe(false);

    const active = rows.find((r: any) => r.id === 'auth-2');
    expect(active.is_active).toBe(true);

    const withEmail = rows.find((r: any) => r.id === 'peter-tubin');
    expect(withEmail.email).toBe('peter-tubin@heartsync.com');
  });

  it('never writes a synthetic email placeholder over the real address', async () => {
    // The boot payload maps authors WITHOUT email, so a round-trip save
    // arrives with no email field. The upsert must omit the column rather
    // than invent id@heartsync.com.
    supabase.state.upserts['authors'] = [];
    const res = await saveState({
      authors: [{ id: 'auth-2', name: 'Dr. Katherine Mercer', bio: '', role: 'Author', is_deleted: false }]
    });
    expect(res.status).toBe(200);
    const rows = supabase.state.upserts['authors'][0];
    expect(rows[0].email).toBeUndefined();
    expect(String(rows[0].id)).not.toContain('@heartsync.com');
  });

  it('skips rows without a usable id and leaves the table untouched when no authors ship', async () => {
    supabase.state.upserts['authors'] = [];
    const res = await saveState({
      authors: [{ id: '', name: 'Broken' }, null]
    });
    expect(res.status).toBe(200);
    expect(supabase.state.upserts['authors']).toHaveLength(0);

    // A save scoped to another section must not touch authors at all.
    await saveState({ site_settings: { site_name: 'Heartsync' } });
    expect(supabase.state.upserts['authors']).toHaveLength(0);
  });
});
