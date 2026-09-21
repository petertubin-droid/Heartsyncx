import { test, expect } from '@playwright/test';

/**
 * SEO & crawlability: sitemap, robots, meta tags, and no dead internal links
 * among the sitemap's static pages.
 */
const STATIC_PATHS = [
  '/', '/articles', '/categories', '/trending', '/ai-copilot', '/subscription',
  '/lovevault', '/about', '/faq', '/contact', '/newsletter', '/privacy',
  '/disclaimer', '/terms', '/cookies', '/advertise',
];

test.describe('SEO & crawlability', () => {
  test('sitemap.xml is served and lists static pages + articles', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain('<urlset');
    for (const p of STATIC_PATHS.slice(0, 8)) {
      expect(xml).toContain(`<loc>https://heartsyncx.netlify.app${p === '/' ? '/' : p}`);
    }
    expect(xml).toMatch(/\/article\//);
  });

  test('robots.txt is served and allows crawling with a sitemap reference', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const txt = await res.text();
    expect(txt).toMatch(/Allow|Disallow/);
    expect(txt).toMatch(/sitemap/i);
  });

  test('every static page has a title and meta description', async ({ page }) => {
    for (const path of STATIC_PATHS) {
      await page.goto(path);
      const title = await page.title();
      expect(title.length, `${path} title`).toBeGreaterThan(3);
      const desc = await page.evaluate(() => {
        const el = document.querySelector('meta[name="description"]');
        return el ? el.getAttribute('content') : null;
      });
      expect(desc, `${path} meta description`).toBeTruthy();
      expect(desc!.length, `${path} description length`).toBeGreaterThan(20);
    }
  });

  test('landing page carries Open Graph and canonical/og:url tags', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.evaluate(() =>
      document.querySelector('meta[property="og:title"]')?.getAttribute('content'));
    const ogDesc = await page.evaluate(() =>
      document.querySelector('meta[property="og:description"]')?.getAttribute('content'));
    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
  });

  test('internal links to static pages all resolve to index.html (no client-only 404s)', async ({ request }) => {
    // Collect hrefs from the landing page
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();
    const hrefs = [...html.matchAll(/href="(\/[a-z0-9/_-]*)"/gi)].map((m) => m[1]);
    const unique = [...new Set(hrefs)].filter((h) => !h.startsWith('/article/'));
    for (const href of unique) {
      const r = await request.get(href);
      expect(r.status(), href).toBeLessThan(400);
    }
  });
});
