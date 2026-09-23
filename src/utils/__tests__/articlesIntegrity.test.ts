import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { HEARTSYNC_ARTICLES } from '../data/articles';
import { MORE_POSTS, MORE_CATEGORIES } from '../data/moreArticles';

/**
 * Article content integrity suite.
 *
 * The DB is the runtime source of truth, but the code corpus is what ships in
 * the fallback seed, the sitemap generator and the SEO metadata. These tests
 * guarantee every published article is substantive, well-formed, crawlable and
 * does not regress into thin/placeholder content (an AdSense policy risk).
 */

const corpus = MORE_POSTS;
const corpusIds = new Set(corpus.map((p) => p.id));
const corpusSlugs = new Set(corpus.map((p) => p.slug));
const categoryIds = new Set(MORE_CATEGORIES.map((c) => c.id));

const wordCount = (s: string) => (s || '').trim().split(/\s+/).filter(Boolean).length;
const h2Count = (s: string) => ((s || '').match(/^## /gm) || []).length;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('article corpus integrity', () => {
  it('has a non-empty corpus of 35 restored articles', () => {
    expect(corpus.length).toBe(35);
  });

  it('contains the 30 long-form HeartSync articles', () => {
    expect(HEARTSYNC_ARTICLES.length).toBe(30);
    for (const a of HEARTSYNC_ARTICLES) {
      expect(corpusIds.has(a.id)).toBe(true);
      expect(corpusSlugs.has(a.slug)).toBe(true);
    }
  });

  it('has unique ids and slugs', () => {
    const ids = corpus.map((p) => p.id);
    const slugs = corpus.map((p) => p.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses clean, URL-safe, SEO-friendly slugs', () => {
    for (const p of corpus) {
      expect(p.slug).toMatch(SLUG_RE);
      expect(p.slug.length).toBeGreaterThanOrEqual(8);
      expect(p.slug.length).toBeLessThanOrEqual(120);
    }
  });

  it('every article has a title and an excerpt', () => {
    for (const p of corpus) {
      expect(p.title.trim().length).toBeGreaterThan(10);
      expect(p.excerpt.trim().length).toBeGreaterThan(40);
    }
  });

  it('every article is substantive (no thin content)', () => {
    for (const p of corpus) {
      const words = wordCount(p.content);
      expect(words, `${p.slug} has only ${words} words`).toBeGreaterThanOrEqual(300);
      expect(h2Count(p.content), `${p.slug} needs >= 3 section headings`).toBeGreaterThanOrEqual(3);
    }
  });

  it('contains no placeholder or lorem marker text', () => {
    const markers = ['lorem ipsum', 'placeholder text', 'TODO:', 'TBD', 'xxx content'];
    for (const p of corpus) {
      const haystack = `${p.title} ${p.excerpt} ${p.content}`.toLowerCase();
      for (const m of markers) {
        expect(haystack.includes(m.toLowerCase()), `${p.slug} contains "${m}"`).toBe(false);
      }
    }
  });

  it('every article references a known category', () => {
    for (const p of corpus) {
      expect(p.category_id, `${p.slug} references unknown category`).toBeTruthy();
      expect(categoryIds.has(p.category_id), `${p.slug} category ${p.category_id} missing`).toBe(true);
    }
  });

  it('every article is published with a valid date and sane read time', () => {
    for (const p of corpus) {
      expect(p.status).toBe('published');
      const d = new Date(p.publish_date);
      expect(Number.isNaN(d.getTime()), `${p.slug} has invalid publish_date`).toBe(false);
      expect(p.read_time).toBeGreaterThanOrEqual(1);
      expect(p.read_time).toBeLessThanOrEqual(90);
    }
  });

  it('carries SEO metadata on every article', () => {
    for (const p of corpus) {
      expect((p.seo_title || '').trim().length).toBeGreaterThan(5);
      expect((p.seo_description || '').trim().length).toBeGreaterThan(30);
    }
  });
});

describe('sitemap contract', () => {
  const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');

  it('commits a sitemap.xml in public/', () => {
    expect(existsSync(sitemapPath)).toBe(true);
  });

  const xml = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : '';
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  it('has a unique, valid set of URLs', () => {
    expect(locs.length).toBeGreaterThan(20);
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) expect(loc.startsWith('https://')).toBe(true);
  });

  it('covers the core static pages', () => {
    const paths = locs.map((l) => l.replace('https://heartsyncx.netlify.app', ''));
    for (const must of ['/', '/articles', '/categories', '/about', '/privacy']) {
      expect(paths, `missing static page ${must}`).toContain(must);
    }
  });

  it('exposes a crawlable URL for every corpus article', () => {
    for (const p of corpus) {
      expect(
        locs.includes(`https://heartsyncx.netlify.app/article/${p.slug}`),
        `${p.slug} missing from sitemap`
      ).toBe(true);
    }
  });
});
