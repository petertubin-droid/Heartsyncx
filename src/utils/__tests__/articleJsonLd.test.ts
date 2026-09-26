import { describe, it, expect } from 'vitest';
import { buildArticleJsonLd } from '../articleJsonLd';

const base = {
  article: {
    id: 'post-1',
    title: 'How to Repair After a Fight',
    slug: 'how-to-repair-after-a-fight',
    excerpt: '<p>A guide to coming back together after conflict.</p>',
    content: 'body',
    publish_date: '2026-09-20T10:00:00.000Z',
    updated_date: '2026-09-25T10:00:00.000Z',
    featured_image: 'https://img.example.com/hero.jpg',
    author_name: 'Dr. Heart',
  },
  siteName: 'Heartsyncx',
  siteUrl: 'https://heartsyncx.netlify.app/',
  logoUrl: '/logo.png',
  faq: [
    { question: 'How long should repair take?', answer: 'Usually within 24 hours - <b>sooner is better</b>.' },
    { question: 'What if my partner refuses?', answer: 'Give space, then re-approach gently.' },
  ],
};

describe('article JSON-LD builder', () => {
  it('returns null without a title (never ships a broken entity)', () => {
    expect(buildArticleJsonLd({ ...base, article: { id: 'x' } })).toBeNull();
  });

  it('builds a NewsArticle with headline, dates, author, publisher and canonical url', () => {
    const g = buildArticleJsonLd(base)!;
    const news = g['@graph'][0];
    expect(news['@type']).toBe('NewsArticle');
    expect(news.headline).toBe('How to Repair After a Fight');
    expect(news.datePublished).toBe('2026-09-20T10:00:00.000Z');
    expect(news.dateModified).toBe('2026-09-25T10:00:00.000Z');
    expect(news.author.name).toBe('Dr. Heart');
    expect(news.publisher.name).toBe('Heartsyncx');
    expect(news.mainEntityOfPage['@id']).toBe('https://heartsyncx.netlify.app/article/how-to-repair-after-a-fight');
    expect(news.image).toEqual(['https://img.example.com/hero.jpg']);
  });

  it('strips HTML from the description', () => {
    const g = buildArticleJsonLd(base)!;
    expect(g['@graph'][0].description).toBe('A guide to coming back together after conflict.');
  });

  it('emits a FAQPage entity with sanitized Q&A text', () => {
    const g = buildArticleJsonLd(base)!;
    const faq = g['@graph'].find((e: any) => e['@type'] === 'FAQPage');
    expect(faq).toBeDefined();
    expect(faq.mainEntity[0].name).toBe('How long should repair take?');
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe('Usually within 24 hours - sooner is better.');
  });

  it('drops the FAQ entity when no valid items exist', () => {
    const g = buildArticleJsonLd({ ...base, faq: [{ question: '', answer: 'x' }, undefined as any] })!;
    expect(g['@graph'].some((e: any) => e['@type'] === 'FAQPage')).toBe(false);
  });

  it('falls back to the site name for author and omits missing optional fields', () => {
    const g = buildArticleJsonLd({
      article: { id: 'post-2', title: 'Lonely in a crowd', slug: 'lonely-in-a-crowd' },
      siteName: 'Heartsyncx',
      siteUrl: 'https://hsx.app',
      logoUrl: '/logo.png',
      faq: [],
    })!;
    const news = g['@graph'][0];
    expect(news.author.name).toBe('Heartsyncx');
    expect(news.image).toBeUndefined();
    expect(news.datePublished).toBeUndefined();
    expect(news.description).toBeUndefined();
  });

  it('caps headline at 110 characters', () => {
    const g = buildArticleJsonLd({ ...base, article: { ...base.article, title: 'T'.repeat(140) } })!;
    expect(g['@graph'][0].headline.length).toBeLessThanOrEqual(110);
  });
});
