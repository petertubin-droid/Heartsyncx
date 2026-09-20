// @vitest-environment node
// PHASE 3 TEST SUITE — security contract, auth matrix, and persistence behaviors
// for the HeartSync XHub backend. The Express app runs for real on an ephemeral
// port with @supabase/supabase-js fully mocked; everything else executes as-is.
import './env-setup';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase mock: configurable identities + table data, chainable query builder
// ---------------------------------------------------------------------------
const supabase = vi.hoisted(() => {
  const state = {
    users: {} as Record<string, { id: string; email: string }>,
    profiles: {} as Record<string, any>,
    tables: {} as Record<string, any[]>,
    insertErrByTable: {} as Record<string, any>,
    rpcOutcome: null as any,
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
    const writeOutcome = () => {
      state.calls.push(`${clientToken}:${table}:write`);
      return { data: null, error: state.insertErrByTable[table] || null };
    };
    const listOutcome = () => {
      state.calls.push(`${clientToken}:${table}:list`);
      return { data: (state.tables[table] || []).slice(), error: null };
    };
    const kind = { write: false };
    for (const m of ['insert', 'update', 'delete', 'upsert']) {
      chain[m] = () => { kind.write = true; return chain; };
    }
    for (const m of ['select', 'eq', 'neq', 'in', 'lt', 'gt', 'gte', 'lte', 'order',
      'limit', 'range', 'ilike', 'like', 'or', 'not', 'is', 'contains']) {
      chain[m] = () => chain;
    }
    chain.single = () => Promise.resolve(rowOutcome());
    chain.maybeSingle = () => Promise.resolve(rowOutcome());
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve(kind.write ? writeOutcome() : listOutcome()).then(resolve, reject);
    chain.catch = (cb: any) =>
      Promise.resolve(kind.write ? writeOutcome() : listOutcome()).catch(cb);
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
      rpc: (name: string, _args?: any) => {
        state.calls.push(`rpc:${name}`);
        return Promise.resolve(
          name === 'digital_product_download'
            ? (state.rpcOutcome ? { data: state.rpcOutcome, error: null } : { data: null, error: { message: 'not found' } })
            : { data: null, error: null }
        );
      }
    };
  };

  return { createClient, state };
});

vi.mock('@supabase/supabase-js', () => ({ createClient: supabase.createClient }));

// NOTE: importing the server app AFTER the mock + env setup above.
import { app, stripSecretFields } from '../../server';

const serverSrc = fs.readFileSync(path.resolve(__dirname, '../../server.ts'), 'utf8');
const schemaSrc = fs.readFileSync(path.resolve(__dirname, '../../supabase/schema.sql'), 'utf8');
const storeSrc = fs.readFileSync(path.resolve(__dirname, '../../src/store.ts'), 'utf8');

const ADMIN = 'Bearer admin-token';
const READER = 'Bearer reader-token';
const EDITOR = 'Bearer editor-token';
const SUSPENDED = 'Bearer suspended-token';

let base = '';
let srv: any;

beforeAll(async () => {
  srv = (app as any).listen(0, '127.0.0.1');
  await new Promise((r) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}`;

  supabase.state.users['admin-token'] = { id: 'u-admin', email: 'admin@heartsync.app' };
  supabase.state.profiles['admin-token'] = { role: 'admin', is_suspended: false };
  supabase.state.users['reader-token'] = { id: 'u-reader', email: 'reader@heartsync.app' };
  supabase.state.profiles['reader-token'] = { role: 'user', is_suspended: false };
  supabase.state.users['editor-token'] = { id: 'u-editor', email: 'editor@heartsync.app' };
  supabase.state.profiles['editor-token'] = { role: 'Editor', is_suspended: false };
  supabase.state.users['suspended-token'] = { id: 'u-sus', email: 'sus@heartsync.app' };
  supabase.state.profiles['suspended-token'] = { role: 'admin', is_suspended: true };

  supabase.state.tables['site_settings'] = [{ id: 'singleton', site_name: 'Heartsync' }];
  supabase.state.tables['digital_products'] = [{
    id: 'prod-1', title: 'Test Workbook', is_active: true, sale_price: 19, price: 29, total_sales: 0
  }];

  // Warm the state cache so memory-backed routes have a state object.
  const warm = await fetch(`${base}/api/state`);
  expect(warm.ok).toBe(true);
});

afterAll(async () => {
  await new Promise((r) => srv.close(r));
});

function req(method: string, route: string, body?: any, auth?: string) {
  return fetch(base + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

const PROTECTED_ROUTES: Array<[string, string]> = [
  ['post', '/api/state'],
  ['post', '/api/webhooks/dispatch'],
  ['post', '/api/dns/diagnostics'],
  ['post', '/api/seo/index-submit'],
  ['post', '/api/cicd/check'],
  ['post', '/api/gemini/translate'],
  ['post', '/api/ai/draft'],
  ['post', '/api/admin/settings'],
  ['get', '/api/admin/modules'],
  ['post', '/api/admin/modules/install'],
  ['post', '/api/admin/modules/x/toggle'],
  ['get', '/api/gdpr/audit-log'],
  ['get', '/api/gdpr/dsr-requests'],
  ['patch', '/api/gdpr/dsr-requests/req-1'],
  ['post', '/api/gdpr/export'],
  ['post', '/api/gdpr/purge'],
  ['post', '/api/digital-products'],
  ['put', '/api/digital-products/prod-1'],
  ['delete', '/api/digital-products/prod-1'],
  ['get', '/api/digital-products/orders']
];

// ===========================================================================
// 1. LIVE AUTH MATRIX — every protected route, three identities
// ===========================================================================
describe('auth matrix (live app, mocked Supabase)', () => {
  it.each(PROTECTED_ROUTES)('%s %s -> 401 for anonymous callers', async (method, route) => {
    const res = await req(method.toUpperCase(), route, method === 'get' || method === 'delete' ? undefined : {});
    expect(res.status).toBe(401);
  });

  it.each(PROTECTED_ROUTES)('%s %s -> 403 for non-admin users', async (method, route) => {
    const res = await req(method.toUpperCase(), route, method === 'get' || method === 'delete' ? undefined : {}, READER);
    expect(res.status).toBe(403);
  });

  it.each(PROTECTED_ROUTES)('%s %s admits an admin session (no 401/403)', async (method, route) => {
    const res = await req(method.toUpperCase(), route, method === 'get' || method === 'delete' ? undefined : {}, ADMIN);
    expect([401, 403]).not.toContain(res.status);
  });

  it('admits the Editor role from the shared ADMIN_ROLES vocabulary', async () => {
    const res = await req('POST', '/api/state', { site_settings: { site_name: 'X' } }, EDITOR);
    expect([401, 403]).not.toContain(res.status);
  });

  it('blocks suspended admin accounts', async () => {
    const res = await req('POST', '/api/state', { site_settings: { site_name: 'X' } }, SUSPENDED);
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 2. PUBLIC ROUTES STAY PUBLIC
// ===========================================================================
describe('public route contract', () => {
  it('GET /api/digital-products serves the active catalog without auth', async () => {
    const res = await req('GET', '/api/digital-products');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.products[0].title).toBe('Test Workbook');
  });

  it('POST /api/digital-products/checkout validates input without requiring auth', async () => {
    const res = await req('POST', '/api/digital-products/checkout', {});
    expect(res.status).toBe(400); // honest validation, not an auth rejection
  });

  it('GET /api/digital-products/download/:token redeems via the RPC', async () => {
    let res = await req('GET', '/api/digital-products/download/dl_tok_missing');
    expect(res.status).toBe(404);

    supabase.state.rpcOutcome = {
      product_title: 'Test Workbook',
      file_url: 'https://cdn.example.com/file.pdf',
      user_email: 'buyer@example.com',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    };
    res = await req('GET', '/api/digital-products/download/dl_tok_valid');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.downloadUrl).toBe('https://cdn.example.com/file.pdf');
    supabase.state.rpcOutcome = null;
  });
});

// ===========================================================================
// 3. STATE SYNC SANITIZATION (end-to-end)
// ===========================================================================
describe('state sync sanitization', () => {
  it('stripSecretFields removes credential-like fields but keeps public config', () => {
    const cleaned: any = stripSecretFields({
      site_name: 'Heartsync',
      supabase_url: 'https://ok.supabase.co',
      supabase_key: 'anon-key-is-public-config',
      elevenlabs_api_key: 'sk_SECRET',
      gemini_api_key: 'AIza_SECRET',
      recaptcha_secret_key: 'SECRET',
      extra_api_keys: ['a', 'b'],
      stripe_secret_key: 'sk_live_SECRET',
      password: 'hunter2',
      oauth_token: 'tok'
    });
    expect(cleaned.site_name).toBe('Heartsync');
    expect(cleaned.supabase_url).toBe('https://ok.supabase.co');
    expect(cleaned.supabase_key).toBe('anon-key-is-public-config');
    expect(cleaned.elevenlabs_api_key).toBeUndefined();
    expect(cleaned.gemini_api_key).toBeUndefined();
    expect(cleaned.recaptcha_secret_key).toBeUndefined();
    expect(cleaned.extra_api_keys).toBeUndefined();
    expect(cleaned.stripe_secret_key).toBeUndefined();
    expect(cleaned.password).toBeUndefined();
    expect(cleaned.oauth_token).toBeUndefined();
  });

  it('POST /api/state strips leaked credentials from site_settings', async () => {
    const res = await req('POST', '/api/state', {
      site_settings: {
        site_name: 'Leak Test',
        elevenlabs_api_key: 'LEAKED',
        gemini_api_key: 'LEAKED',
        recaptcha_secret_key: 'LEAKED',
        extra_api_keys: ['LEAKED']
      }
    }, ADMIN);
    expect(res.status).toBe(200);

    const getRes = await req('GET', '/api/state');
    const st: any = (await getRes.json()) as any;
    const settings = st.site_settings || {};
    expect(settings.site_name).toBe('Leak Test');
    expect(settings.elevenlabs_api_key).toBeUndefined();
    expect(settings.gemini_api_key).toBeUndefined();
    expect(settings.recaptcha_secret_key).toBeUndefined();
    expect(settings.extra_api_keys).toBeUndefined();
  });
});

// ===========================================================================
// 4. ADMIN FLOWS
// ===========================================================================
describe('admin flows', () => {
  it('admin settings save merges and acknowledges (was a 404 stub)', async () => {
    const res = await req('POST', '/api/admin/settings', { homepage_hero_title: 'Test Hero' }, ADMIN);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('integrations save surfaces upsert errors instead of faking success', async () => {
    supabase.state.insertErrByTable['integration_settings'] = { message: 'RLS violation' };
    const failRes = await req('POST', '/api/admin/integrations/save',
      { integrationId: 'payments', settings: { public_key: 'pk_test_123' } }, ADMIN);
    expect(failRes.status).toBe(500);
    const failBody = await failRes.json();
    expect(failBody.error).toMatch(/RLS violation/);

    delete supabase.state.insertErrByTable['integration_settings'];
    const okRes = await req('POST', '/api/admin/integrations/save',
      { integrationId: 'payments', settings: { public_key: 'pk_test_123' } }, ADMIN);
    expect(okRes.status).toBe(200);
  });

  it('integrations catalog read requires an admin session', async () => {
    const res = await req('GET', '/api/admin/integrations');
    expect(res.status).toBe(401);
    const adminRes = await req('GET', '/api/admin/integrations', undefined, ADMIN);
    expect(adminRes.status).toBe(200);
  });

  it('setup wizard fails honestly without a service-role key', async () => {
    const res = await req('POST', '/api/setup/register',
      { email: 'first.admin@heartsync.app', name: 'First Admin', password: 'SuperSecret123!' });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/SUPABASE_SERVICE_ROLE_KEY/i);
  });
});

// ===========================================================================
// 5. SUBSCRIBERS (M-08 regression)
// ===========================================================================
describe('subscribe persistence', () => {
  it('persists a new subscriber and confirms', async () => {
    const res = await req('POST', '/api/subscribe', { email: 'fresh.reader@example.com', source: 'footer' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('treats a UNIQUE-violation duplicate as idempotent success', async () => {
    supabase.state.insertErrByTable['subscribers'] = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "subscribers_email_key"'
    };
    const res = await req('POST', '/api/subscribe', { email: 'existing.reader@example.com' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/already subscribed/i);
    delete supabase.state.insertErrByTable['subscribers'];
  });

  it('rejects invalid emails', async () => {
    const res = await req('POST', '/api/subscribe', { email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 6. SOURCE-LEVEL SECURITY CONTRACT (regression locks)
// ===========================================================================
describe('source-level security contract', () => {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  it.each(PROTECTED_ROUTES)('%s %s is gated by adminAuthMiddleware in source', (method, route) => {
    const sourceRoute = route.split('/').map((seg) => ['x', 'req-1', 'prod-1'].includes(seg) ? ':id' : seg).join('/');
    const m = serverSrc.match(new RegExp(`app\\.${method}\\('${esc(sourceRoute)}',\\s*adminAuthMiddleware`));
    expect(m).not.toBeNull();
  });

  it('the reader-facing catalog, checkout, download, subscribe and DSR-create routes stay unauthenticated', () => {
    expect(serverSrc).toMatch(/app\.get\('\/api\/digital-products',\s*async/);
    expect(serverSrc).toMatch(/app\.post\('\/api\/digital-products\/checkout',\s*async/);
    expect(serverSrc).toMatch(/app\.get\('\/api\/digital-products\/download\/:token',\s*async/);
    expect(serverSrc).toMatch(/app\.post\('\/api\/subscribe',\s*async/);
    expect(serverSrc).toMatch(/app\.post\('\/api\/gdpr\/dsr-requests',\s*rateLimiter/);
  });

  it('never deletes documented environment keys at boot', () => {
    expect(serverSrc).not.toMatch(/delete process\.env\.ELEVENLABS_API_KEY/);
    expect(serverSrc).not.toMatch(/delete process\.env\.ELEVENLABS_VOICE_ID/);
  });

  it('both payment webhooks fulfil digital_product metadata through the service role', () => {
    expect((serverSrc.match(/md\.kind === 'digital_product'/g) || []).length).toBe(2);
    expect(serverSrc).toMatch(/async function createDigitalProductOrder/);
    expect(serverSrc).toMatch(/getServiceRoleSupabase\(\)/);
  });

  it('gateway secrets are never propagated into site_settings', () => {
    expect(serverSrc).not.toMatch(/extraApiKeys\[`?\$\{provider\}_secret`?\]/);
  });

  it('client engagement goes through the SECURITY DEFINER RPC, never direct UPDATEs', () => {
    expect((storeSrc.match(/rpc\('increment_post_engagement'/g) || []).length).toBeGreaterThanOrEqual(3);
    // The exact pre-fix reader write patterns must stay gone (admin bulk resets
    // like resetAnalytics legitimately write post stats via the admin session).
    expect(storeSrc).not.toMatch(/update\(\{\s*likes:\s*newLikes/);
    expect(storeSrc).not.toMatch(/update\(\{\s*reactions:\s*match\.reactions/);
    expect(storeSrc).not.toMatch(/update\(\{\s*views:\s*match\.views/);
  });
});

// ===========================================================================
// 7. SCHEMA CONTRACT (live RLS/policy verification happens after migration)
// ===========================================================================
describe('schema contract', () => {
  it('the signup trigger never trusts client metadata for roles', () => {
    expect(schemaSrc).not.toMatch(/COALESCE\(NEW\.raw_user_meta_data->>'role'/);
    expect(schemaSrc).toMatch(/'user' -- SECURITY: role is NEVER taken from client signup metadata/);
  });

  it('is_admin() recognizes the full ADMIN_ROLES vocabulary', () => {
    expect(schemaSrc).toMatch(/IN \('admin', 'superadmin', 'Administrator', 'Editor', 'Super Admin'\)/);
  });

  it('profiles PII is column-protected', () => {
    expect(schemaSrc).toMatch(/REVOKE SELECT ON public\.profiles FROM anon, authenticated;/);
    expect(schemaSrc).toMatch(/GRANT SELECT \(id, full_name, avatar_url, bio, website, role, is_suspended, created_at, updated_at\)/);
  });

  it('the engagement RPC exists and is SECURITY DEFINER with delta guards', () => {
    expect(schemaSrc).toMatch(/CREATE OR REPLACE FUNCTION public\.increment_post_engagement/);
    expect(schemaSrc).toMatch(/SECURITY DEFINER/);
    expect(schemaSrc).toMatch(/invalid likes delta/);
  });

  it('digital product tables, policies, and the token-download RPC exist', () => {
    expect(schemaSrc).toMatch(/CREATE TABLE IF NOT EXISTS public\.digital_products/);
    expect(schemaSrc).toMatch(/CREATE TABLE IF NOT EXISTS public\.digital_product_orders/);
    expect(schemaSrc).toMatch(/CREATE POLICY "Public read active digital products"/);
    expect(schemaSrc).toMatch(/CREATE OR REPLACE FUNCTION public\.digital_product_download/);
  });

  it('subscribers keep a UNIQUE email constraint', () => {
    expect(schemaSrc).toMatch(/CREATE TABLE IF NOT EXISTS public\.subscribers[\s\S]*?email TEXT NOT NULL UNIQUE/);
  });

  it('integration storage matches the key/value API model', () => {
    expect(schemaSrc).toMatch(/CREATE TABLE IF NOT EXISTS public\.integration_settings[\s\S]*?integration_id TEXT NOT NULL[\s\S]*?key TEXT NOT NULL/);
  });

  it('legacy API keys are scrubbed from site_settings by the cleanup block', () => {
    expect(schemaSrc).toMatch(/SECURITY CLEANUP: API keys must NEVER live in site_settings/);
    expect(schemaSrc).toMatch(/FOREACH key_col IN ARRAY ARRAY\['gemini_api_key','elevenlabs_api_key','supabase_key','recaptcha_secret_key','extra_api_keys'\]/);
  });
});

// ===========================================================================
// Public per-article endpoint (projected boot state counterpart)
// ===========================================================================
describe('GET /api/posts/:slug (public article body)', () => {
  it('serves the full published article to anonymous callers', async () => {
    supabase.state.tables['posts'] = [{
      id: 'post-1', slug: 'attachment-styles', status: 'published',
      title: 'Attachment Styles', content: '## Full article body',
      author_id: '11111111-1111-1111-1111-111111111111'
    }];
    const res = await req('GET', '/api/posts/attachment-styles');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toBe('## Full article body');
    expect(body.slug).toBe('attachment-styles');
  });

  it('returns 404 when no published article matches', async () => {
    supabase.state.tables['posts'] = [];
    const res = await req('GET', '/api/posts/nope');
    expect(res.status).toBe(404);
  });

  it('rejects malformed slugs without touching the database', async () => {
    supabase.state.calls = [];
    const res = await req('GET', '/api/posts/');
    expect([400, 404]).toContain(res.status);
    expect(supabase.state.calls.length).toBe(0);
  });
});
