// FULL-PIPELINE crawler-accessibility test (Sep 27, 2026): boots the real
// Express app with Supabase mocked as an in-memory database, seeds a
// published post WITH markdown content, and asserts what a non-JavaScript
// crawler actually receives from GET /article/<slug>:
//   - exactly ONE canonical/description/OG set (no homepage duplicates)
//   - server-rendered <noscript> article text (AI crawlers cannot run JS)
//   - articleBody in the BlogPosting JSON-LD
//   - no accidental noindex on public content, and noindex on private pages
// Same harness shape as article-content-safety.test.ts.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

const supabase = vi.hoisted(() => {
  const state = {
    users: {} as Record<string, { id: string; email: string }>,
    tables: {} as Record<string, any[]>
  };
  type Filter = [string, any];
  const matches = (row: any, filters: Filter[]) =>
    filters.every(([col, val]) => (Array.isArray(val) ? val.includes(row[col]) : row[col] === val));
  function makeChain(table: string) {
    const filters: Filter[] = [];
    let selected: string[] | null = null;
    const rows = () => (state.tables[table] = state.tables[table] || []);
    const filtered = () => rows().filter((r) => matches(r, filters));
    const project = (row: any) => {
      if (!selected || selected.includes('*')) return { ...row };
      const out: any = {};
      for (const c of selected) out[c] = row[c];
      return out;
    };
    const chain: any = {};
    for (const m of ['insert', 'update', 'delete', 'upsert', 'select', 'eq', 'neq', 'in',
      'order', 'limit', 'range', 'ilike', 'like', 'or', 'not', 'is', 'contains', 'onConflict']) {
      chain[m] = (...args: any[]) => {
        if (m === 'select' && args[0]) selected = String(args[0]).split(',').map((s) => s.trim());
        if (m === 'eq' || m === 'in') filters.push([args[0], args[1]]);
        return chain;
      };
    }
    const rowOutcome = () => {
      const m = filtered();
      return m.length ? { data: project(m[0]), error: null } : { data: null, error: null };
    };
    chain.single = () => Promise.resolve(rowOutcome());
    chain.maybeSingle = () => Promise.resolve(rowOutcome());
    chain.then = (resolve: any, reject: any) =>
      Promise.resolve({ data: filtered().map(project), error: null }).then(resolve, reject);
    chain.catch = (cb: any) => chain.then(() => {}, cb);
    return chain;
  }
  const createClient = () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: { message: 'no session' } }) },
    from: (t: string) => makeChain(t),
    rpc: () => Promise.resolve({ data: null, error: null })
  });
  return { createClient, state };
});
vi.mock('@supabase/supabase-js', () => ({ createClient: supabase.createClient }));

vi.hoisted(() => {
  process.env.VERCEL = '1';
  process.env.VITE_SUPABASE_URL = 'https://heartsync-test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_URL = 'https://heartsync-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_dummy';
  process.env.RESEND_API_KEY = 're_dummy';
  delete process.env.GEMINI_API_KEY;
});

// NOTE: importing the app AFTER the mock + env bootstrap above.
import { app, registerProductionRoutes } from '../../server';

let base = '';
let srv: any;
const SLUG = 'the-repair-conversation';
const MD = [
  '## Why repair matters',
  '',
  'Conflict is **not** the danger. The danger is the *slow drift*.',
  'You can read more in [the guide](https://example.com/guide).'
].join('\n');

beforeAll(async () => {
  supabase.state.tables['categories'] = [{ id: 'cat-1', name: 'Attachment Science', slug: 'attachment-styles' }];
  supabase.state.tables['posts'] = [
    {
      id: 'p-1',
      slug: SLUG,
      title: 'The Repair Conversation',
      status: 'published',
      category_id: 'cat-1',
      excerpt: 'How couples return to each other after conflict.',
      content: MD,
      publish_date: '2026-09-20T10:00:00Z'
    }
  ];
  // With VERCEL=1 the module skips startServer(), so the catch-all
  // dynamic-HTML routes must be registered explicitly (same as the
  // serverless entrypoint does).
  await registerProductionRoutes();
  srv = (app as any).listen(0, '127.0.0.1');
  await new Promise((r: any) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}`;
  // Warm the server state cache from the mocked Supabase tables, exactly as
  // the production serverless handler does on cold start, so article
  // resolution sees the seeded post.
  const warm = await fetch(`${base}/api/state`);
  expect(warm.status).toBeLessThan(500);
});
afterAll(async () => {
  await new Promise((r: any) => srv ? srv.close(r) : r());
});

describe('dynamic HTML served to non-JS crawlers (full pipeline)', () => {
  it('serves the article with exactly one canonical and the article-specific URL', async () => {
    const res = await fetch(`${base}/article/${SLUG}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect((html.match(/rel="canonical"/g) || []).length).toBe(1);
    expect(html).toContain(`rel="canonical" href="${base}/article/${SLUG}"`);
    expect((html.match(/<meta name="description"/g) || []).length).toBe(1);
    expect((html.match(/<meta property="og:title"/g) || []).length).toBe(1);
    expect((html.match(/name="twitter:card"/g) || []).length).toBe(1);
  });

  it('server-renders the article text inside <noscript> for non-JS agents', async () => {
    const res = await fetch(`${base}/article/${SLUG}`);
    const html = await res.text();
    expect(html).toContain('<noscript><article>');
    // Scope the markdown-conversion assertions to the noscript block itself:
    // the page ALSO carries the raw markdown in the JSON-LD articleBody
    // (deliberate: schema.org consumers get the untruncated source text).
    const nos = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'));
    expect(nos).toContain('<h1>The Repair Conversation</h1>');
    // Markdown converted: heading marker, bold, italic and link all plain text.
    expect(nos).toContain('<p>Why repair matters</p>');
    expect(nos).toContain('Conflict is not the danger. The danger is the slow drift.');
    expect(nos).toContain('the guide');
    expect(nos).not.toContain('[the guide]');
    expect(nos).not.toContain('**');
  });

  it('includes the full text in the BlogPosting JSON-LD articleBody', async () => {
    const res = await fetch(`${base}/article/${SLUG}`);
    const html = await res.text();
    expect(html).toContain('"articleBody"');
    expect(html).toContain('Conflict is not the danger');
  });

  it('keeps public pages indexable and private pages noindex', async () => {
    const pub = await (await fetch(`${base}/article/${SLUG}`)).text();
    expect(pub).not.toContain('name="robots"');
    const priv = await (await fetch(`${base}/login`)).text();
    expect(priv).toContain('<meta name="robots" content="noindex, nofollow"');
    const admin = await (await fetch(`${base}/admin`)).text();
    expect(admin).toContain('<meta name="robots" content="noindex, nofollow"');
  });
});
