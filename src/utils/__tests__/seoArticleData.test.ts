import { describe, it, expect } from 'vitest';
import { getArticleSeoData } from '../seoArticleData';

describe('article SEO data generator', () => {
  it('routes attachment-themed slugs to the attachment FAQ family', () => {
    const d = getArticleSeoData('healing-avoidant-attachment', 'Any title');
    expect(d.faq.length).toBeGreaterThanOrEqual(3);
    expect(d.faq[0].question.toLowerCase()).toContain('attachment');
    expect(d.takeaways.length).toBeGreaterThanOrEqual(3);
  });

  it('routes dating-themed slugs to the dating FAQ family', () => {
    const d = getArticleSeoData('slow-dating-guide', 'Any title');
    expect(d.faq[0].question.toLowerCase()).toContain('slow dating');
  });

  it('routes somatic-themed slugs to the grounding FAQ family', () => {
    const d = getArticleSeoData('somatic-grounding-for-couples', 'Any title');
    expect(d.faq[0].question.toLowerCase()).toContain('somatic');
  });

  it('routes communication/boundary slugs to the boundaries FAQ family', () => {
    const d = getArticleSeoData('setting-boundaries-that-stick', 'Any title');
    expect(d.faq[0].question.toLowerCase()).toContain('boundary');
  });

  it('routes gottman-themed slugs to the Gottman FAQ family', () => {
    const d = getArticleSeoData('gottman-four-horsemen', 'Any title');
    expect(d.faq[0].question.toLowerCase()).toContain('horsemen');
  });

  it('falls back to a general family for unmatched slugs', () => {
    const d = getArticleSeoData('some-random-unmatched-slug', 'A title about nothing matched');
    expect(d.faq.length).toBeGreaterThanOrEqual(3);
    expect(d.takeaways.length).toBeGreaterThanOrEqual(3);
    expect(d.faq[0].question.length).toBeGreaterThan(10);
  });

  it('always returns well-formed, non-empty answers (AdSense thin-content guard)', () => {
    const slugs = ['attachment-x', 'dating-x', 'somatic-x', 'boundary-x', 'gottman-x', 'unmatched-x'];
    for (const slug of slugs) {
      const d = getArticleSeoData(slug, 'T');
      for (const item of d.faq) {
        expect(item.question.trim().length).toBeGreaterThan(8);
        expect(item.answer.trim().length).toBeGreaterThan(30);
      }
      for (const t of d.takeaways) expect(t.trim().length).toBeGreaterThan(20);
    }
  });

  it('handles empty slug/title inputs safely', () => {
    const d = getArticleSeoData('', '');
    expect(d.faq.length).toBeGreaterThan(0);
  });
});
