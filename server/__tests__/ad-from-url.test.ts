// @vitest-environment node
// CONTRACT TESTS (2026-09-26) for the Cross-Site Promo admin "AI Assistant":
// POST /api/gemini/ad-from-url — paste a partner URL, get a filled-in
// external-partner ad row (real title/description/logo extracted
// server-side, copy left as the raw meta when Gemini is unconfigured).
//
// Same harness shape as publish-author-fk.test.ts: the Express app runs
// for real on an ephemeral port with @supabase/supabase-js mocked. The
// external page fetch is stubbed with a wrapper around the real fetch so
// requests to the test server itself still work.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const supabase = vi.hoisted(() => {
  const state = {
    users: {} as Record<string, { id: string; email: string }>,
    tables: {} as Record<string, any[]>
  };
  function makeChain(table: string) {
    const filters: [string, any][] = [];
    const tableRows = () => (state.tables[table] = state.tables[table] || []);
    const filtered = () => tableRows().filter((r: any) => filters.every(([c, v]) => r[c] === v));
    const chain: any = {};
    chain.eq = (c: string, v: any) => { filters.push([c, v]); return chain; };
    chain.select = () => chain;
    chain.maybeSingle = () => Promise.resolve(
      filtered().length ? { data: { ...filtered()[0] }, error: null } : { data: null, error: null });
    chain.then = (res: any, rej: any) => Promise.resolve({ data: null, error: null }).then(res, rej);
    return chain;
  }
  const createClient = () => ({
    auth: {
      getUser: async (token: string) => {
        const u = state.users[token];
        return u
          ? { data: { user: { id: u.id, email: u.email } }, error: null }
          : { data: { user: null }, error: { message: 'invalid JWT' } };
      }
    },
    from: (table: string) => makeChain(table)
  });
  return { createClient, state };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: supabase.createClient }));

vi.hoisted(() => {
  process.env.VERCEL = '1';
  process.env.VITE_SUPABASE_URL = 'https://heartsync-test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  // No GEMINI_API_KEY: the endpoint must still work via meta-tag fallback.
  delete process.env.GEMINI_API_KEY;
});

import { app } from '../../server';

let base = '';
let srv: any;
let stubbedPages: Record<string, { status?: number; html?: string }> = {};
const realFetch = global.fetch;

// Only the fake partner domains are stubbed; everything else (the test
// server itself) goes through the real fetch.
beforeAll(async () => {
  vi.stubGlobal('fetch', (async (url: any, init?: any) => {
    const target = String(url);
    // new URL('https://host') stringifies with a trailing slash; the stubs
    // are keyed without it. Normalize both sides of the lookup.
    const key = target.replace(/\/$/, '');
    const page = stubbedPages[key] !== undefined ? stubbedPages[key] : stubbedPages[key + '/'];
    if (page !== undefined) {
      if (page.status && page.status !== 200) {
        return new Response('gone', { status: page.status });
      }
      return new Response(page.html || '', { status: 200 });
    }
    return realFetch(target, init);
  }) as typeof fetch);

  supabase.state.users['admin-token'] = { id: 'u-admin', email: 'admin@heartsync.app' };
  supabase.state.tables['profiles'] = [{ id: 'u-admin', role: 'admin', is_suspended: false }];

  srv = (app as any).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}`;
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await new Promise((r) => srv.close(r));
});

function req(method: string, route: string, body?: any, headers?: Record<string, string>) {
  return fetch(base + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}
const generate = (url: string) =>
  req('POST', '/api/gemini/ad-from-url', { url }, { Authorization: 'Bearer admin-token' });

describe('POST /api/gemini/ad-from-url (Cross-Site Promo AI Assistant)', () => {
  it('extracts the real og:title, og:description and absolute og:image for a partner URL', async () => {
    stubbedPages['https://cementmart.example/'] = {
      html: `<html><head>
        <meta property="og:title" content="CementMart — building materials delivered" />
        <meta property="og:description" content="Order cement, blocks and rods online with nationwide delivery." />
        <meta property="og:image" content="https://cdn.cementmart.example/logo.png" />
      </head><body>shop</body></html>`
    };
    const res = await generate('https://cementmart.example');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.label).toBe('CementMart — building materials delivered');
    expect(body.blurb).toBe('Order cement, blocks and rods online with nationwide delivery.');
    expect(body.url).toBe('https://cementmart.example/');
    expect(body.owner_name).toBe('cementmart.example');
    expect(body.logo_url).toBe('https://cdn.cementmart.example/logo.png');
  });

  it('resolves a RELATIVE og:image against the page URL', async () => {
    stubbedPages['https://tiles.example/deals'] = {
      html: `<head><meta property="og:title" content="Tile Deals" />
        <meta name="description" content="Wall tiles at wholesale prices." />
        <meta property="og:image" content="/assets/brand.png" /></head>`
    };
    const res = await generate('https://tiles.example/deals');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logo_url).toBe('https://tiles.example/assets/brand.png');
  });

  it('falls back to <title>, meta description and the favicon when og tags are absent', async () => {
    stubbedPages['https://plain.example'] = {
      html: `<head><title>Plain Hardware</title>
        <meta name="description" content="Tools for every job." />
        <link rel="icon" href="/favicon-32.png" /></head><body>ok</body>`
    };
    const res = await generate('https://plain.example');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.label).toBe('Plain Hardware');
    expect(body.blurb).toBe('Tools for every job.');
    expect(body.logo_url).toBe('https://plain.example/favicon-32.png');
  });

  it('rejects loopback/private targets (SSRF guard)', async () => {
    for (const bad of ['http://localhost:3000', 'http://127.0.0.1:5432', 'http://10.0.0.5/admin', 'https://intranet.internal/panel']) {
      const res = await generate(bad);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/cannot be fetched|not a valid/i);
    }
  });

  it('requires a URL and a valid protocol', async () => {
    const noUrl = await req('POST', '/api/gemini/ad-from-url', {}, { Authorization: 'Bearer admin-token' });
    expect(noUrl.status).toBe(400);
    const badProto = await generate('ftp://files.example');
    expect(badProto.status).toBe(400);
  });

  it('reports a clear error when the partner site is unreachable or errors', async () => {
    stubbedPages['https://down.example'] = { status: 503 };
    const res = await generate('https://down.example');
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/503|reach/i);
  });

  it('is admin-only: rejects anonymous callers', async () => {
    const res = await req('POST', '/api/gemini/ad-from-url', { url: 'https://cementmart.example' });
    expect([401, 403]).toContain(res.status);
  });
});
