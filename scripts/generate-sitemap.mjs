#!/usr/bin/env node
/**
 * Build-time sitemap + robots generation for the static (Vercel) deployment.
 *
 * The Express server generates these dynamically on Cloud Run, but on Vercel
 * only the static Vite build is served  - so this script regenerates them in
 * dist/ with the production base URL and the FULL article corpus, including
 * articles that live in the codebase (src/utils/data/articles) and never
 * touch the database.
 *
 * Base URL resolution: SITE_URL env var wins (useful for preview deploys),
 * otherwise https://heartsyncx.netlify.app.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const BASE_URL = (process.env.SITE_URL || 'https://heartsyncx.netlify.app').replace(/\/+$/, '');
const TODAY = new Date().toISOString().split('T')[0];

// Static top-level pages (mirrors the Express sitemap route list)
const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/articles', changefreq: 'daily', priority: '0.9' },
  { loc: '/categories', changefreq: 'weekly', priority: '0.8' },
  { loc: '/trending', changefreq: 'daily', priority: '0.8' },
  { loc: '/ai-copilot', changefreq: 'weekly', priority: '0.7' },
  { loc: '/subscription', changefreq: 'monthly', priority: '0.7' },
  { loc: '/lovevault', changefreq: 'weekly', priority: '0.6' },
  { loc: '/about', changefreq: 'monthly', priority: '0.6' },
  { loc: '/faq', changefreq: 'monthly', priority: '0.5' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
  { loc: '/newsletter', changefreq: 'monthly', priority: '0.4' },
  { loc: '/privacy', changefreq: 'monthly', priority: '0.3' },
  { loc: '/disclaimer', changefreq: 'monthly', priority: '0.3' },
  { loc: '/terms', changefreq: 'monthly', priority: '0.3' },
  { loc: '/cookies', changefreq: 'monthly', priority: '0.3' },
  { loc: '/advertise', changefreq: 'monthly', priority: '0.3' }
];

// Category slugs  - the real site categories from src/utils/data/moreArticles.ts
const CATEGORY_SLUGS = [
  'love-relationships',
  'dating-romance',
  'communication-emotional-connection',
  'relationship-problems-breakups',
  'self-love-personal-growth'
];

/** Extract published article slugs from the TS data files (source of truth). */
function extractArticleSlugs(dir) {
  const slugs = [];
  if (!existsSync(dir)) return slugs;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.ts')) continue;
    const content = readFileSync(path.join(dir, file), 'utf8');
    for (const match of content.matchAll(/slug:\s*'([^']+)'/g)) {
      slugs.push(match[1]);
    }
  }
  return slugs;
}

const srcData = path.join(process.cwd(), 'src', 'utils', 'data');
const articleSlugs = extractArticleSlugs(path.join(srcData, 'articles'));
const moreArticleSlugs = (() => {
  const file = path.join(srcData, 'moreArticles.ts');
  if (!existsSync(file)) return [];
  const content = readFileSync(file, 'utf8');
  // moreArticles.ts contains BOTH category objects and post objects with slug
  // fields  - filter the category slugs out so only real article URLs ship.
  const slugs = [];
  for (const match of content.matchAll(/slug:\s*'([^']+)'/g)) {
    if (!CATEGORY_SLUGS.includes(match[1])) {
      slugs.push(match[1]);
    }
  }
  return slugs;
})();

// Live database articles: the DB is the runtime source of truth (admin-created
// and restored posts never exist in code). Fetch published slugs with the
// public anon key (read is allowed by RLS policy + grants). On any failure we
// fall back to code slugs alone so a DB hiccup can never break the build.
async function fetchDatabaseSlugs() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    console.warn('generate-sitemap: no Supabase env vars; using code slugs only');
    return [];
  }
  try {
    const res = await fetch(`${url}/rest/v1/posts?select=slug,status&status=eq.published&limit=1000`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    console.log(`generate-sitemap: fetched ${rows.length} published slugs from database`);
    return rows.map((r) => r.slug).filter(Boolean);
  } catch (err) {
    console.warn(`generate-sitemap: database fetch failed (${err.message}); using code slugs only`);
    return [];
  }
}

const dbSlugs = await fetchDatabaseSlugs();

const allSlugs = [...new Set([...articleSlugs, ...moreArticleSlugs, ...dbSlugs])].sort();
console.log(`generate-sitemap: ${allSlugs.length} article URLs, ${STATIC_PAGES.length} static pages, base ${BASE_URL}`);

const urls = [];

for (const page of STATIC_PAGES) {
  urls.push({ loc: `${BASE_URL}${page.loc}`, changefreq: page.changefreq, priority: page.priority });
}

for (const slug of CATEGORY_SLUGS) {
  urls.push({ loc: `${BASE_URL}/category/${slug}`, changefreq: 'weekly', priority: '0.7' });
}

for (const slug of allSlugs) {
  if (CATEGORY_SLUGS.includes(slug)) continue; // slug collision with a category  - article URLs win below
  urls.push({ loc: `${BASE_URL}/article/${slug}`, changefreq: 'monthly', priority: '0.6' });
}

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const robotsTxt = `# Algolia-Crawler-Verif: 104EB7F2B1A59F2A
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /search
Disallow: /access-denied

Sitemap: ${BASE_URL}/sitemap.xml
`;

// Write into dist/ (Vercel serves the static build) and public/ (dev parity)
const outputs = [
  { dir: path.join(process.cwd(), 'dist'), name: 'dist' },
  { dir: path.join(process.cwd(), 'public'), name: 'public' }
];
for (const out of outputs) {
  if (!existsSync(out.dir)) {
    if (out.name === 'public') continue; // public/ must exist; dist may not pre-build
    mkdirSync(out.dir, { recursive: true });
  }
  writeFileSync(path.join(out.dir, 'sitemap.xml'), sitemapXml);
  writeFileSync(path.join(out.dir, 'robots.txt'), robotsTxt);
  console.log(`generate-sitemap: wrote sitemap.xml + robots.txt to ${out.name}/`);
}
