import { describe, it, expect } from 'vitest';
import { expandArticleContent, expandAllArticles } from '../articleExpander';
import { Post } from '../../types';

const shortPost = (): Post => ({
  id: 'p1',
  title: 'Understanding Attachment Styles',
  slug: 'understanding-attachment-styles',
  content: 'A short intro about attachment theory and how it shapes adult bonds.',
  tags: ['attachment-theory'],
  category: 'Emotional Wellness',
  author: 'Heartsync',
  published_at: '2026-01-01',
  read_time: 2,
  status: 'published',
  excerpt: 'Intro'
} as unknown as Post);

describe('articleExpander', () => {
  it('expands a short article to the 1000+ word search-indexing threshold', () => {
    const expanded = expandArticleContent(shortPost());
    const words = expanded.content.split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(1000);
  });

  it('leaves already-long articles byte-identical (no padding of real depth)', () => {
    const post = shortPost();
    post.content = Array.from({ length: 1200 }, (_, i) => `word${i}`).join(' ');
    const before = post.content;
    const expanded = expandArticleContent(post);
    expect(expanded.content).toBe(before);
  });

  it('recalculates read_time to match the expanded length', () => {
    const expanded = expandArticleContent(shortPost());
    const expectedMin = Math.max(2, Math.ceil(expanded.content.split(/\s+/).length / 180));
    expect(expanded.read_time).toBeGreaterThanOrEqual(expectedMin);
  });

  it('prepends a title header when the content lacks one', () => {
    const expanded = expandArticleContent(shortPost());
    expect(expanded.content.startsWith('# Understanding Attachment Styles')).toBe(true);
  });

  it('does not double-prepend a title header when one exists', () => {
    const post = shortPost();
    post.content = '# My Own Header\n\n' + post.content;
    const expanded = expandArticleContent(post);
    expect(expanded.content.match(/# My Own Header/g)).toHaveLength(1);
    expect(expanded.content.startsWith('# My Own Header')).toBe(true);
  });

  it('matches expansion content to the article theme (attachment post gets attachment module)', () => {
    const expanded = expandArticleContent(shortPost());
    expect(expanded.content.toLowerCase()).toContain('attachment');
  });

  it('expands every post in an array via expandAllArticles', () => {
    const results = expandAllArticles([shortPost(), shortPost()]);
    expect(results).toHaveLength(2);
    for (const r of results) expect(r.content.split(/\s+/).length).toBeGreaterThanOrEqual(1000);
  });
});
