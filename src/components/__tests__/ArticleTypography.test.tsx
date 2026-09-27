import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildArticleMarkdownComponents } from '../articleMarkdown';

// The shared article typography renderers, exercised exactly as the live
// article renderer uses them: react-markdown + buildArticleMarkdownComponents.
// These tests pin the global weight hierarchy so a future change cannot
// silently re-bold every article body:
//   body p = regular weight (no serif/weight classes)
//   strong = real bold, em = italic
//   h2 = 700 serif section heading, h3 = 600 sans subsection
const SAMPLE = [
  'The first paragraph leads the article and receives the dropcap.',
  '',
  '## Week Two: The Crash',
  '',
  'Normal body text with **intentional bold** and *italic emphasis*.',
  '',
  '### A Subsection Heading',
  '',
  'Another regular paragraph of plain body text.',
  '',
  '- list item one',
  '- list item two',
  '',
  '> A quoted passage in a blockquote.'
].join('\n');

const renderArticle = () => {
  const paragraphCountRef = React.createRef() as React.MutableRefObject<number>;
  paragraphCountRef.current = 0;
  const components = buildArticleMarkdownComponents({ paragraphCountRef });
  return render(
    <div className="markdown-body prose">
      <ReactMarkdown urlTransform={(url) => url} components={components}>
        {SAMPLE}
      </ReactMarkdown>
    </div>
  );
};

const WEIGHT_CLASSES = ['font-serif', 'font-bold', 'font-semibold', 'font-medium', 'font-extrabold', 'font-black'];

describe('global article typography renderers', () => {
  it('renders body paragraphs at regular weight with no serif or bold classes', () => {
    const { container } = renderArticle();
    const paragraphs = Array.from(container.querySelectorAll('p'));
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    for (const p of paragraphs) {
      const cls = p.className;
      for (const w of WEIGHT_CLASSES) {
        expect(cls, `paragraph must not carry ${w}: "${cls}"`).not.toContain(w);
      }
    }
  });

  it('gives the first paragraph the decorative dropcap letter, still regular weight', () => {
    const { container } = renderArticle();
    const first = container.querySelector('p');
    expect(first).toBeTruthy();
    const dropcap = first!.querySelector('span');
    expect(dropcap).toBeTruthy();
    // The dropcap span itself is decorative serif; the paragraph is not.
    expect(first!.className).not.toContain('font-serif');
    expect(dropcap!.className).toContain('font-serif');
  });

  it('keeps H2 section headings at weight 700 (font-bold serif), never extrabold', () => {
    const { container } = renderArticle();
    const h2 = container.querySelector('h2');
    expect(h2).toBeTruthy();
    expect(h2!.className).toContain('font-serif');
    expect(h2!.className).toContain('font-bold');
    expect(h2!.className).not.toContain('font-extrabold');
  });

  it('renders H3 subsection headings at weight 600 (font-semibold), lighter than H2', () => {
    const { container } = renderArticle();
    const h3 = container.querySelector('h3');
    expect(h3).toBeTruthy();
    expect(h3!.className).toContain('font-semibold');
    expect(h3!.className).not.toContain('font-bold');
  });

  it('preserves intentional inline formatting: strong bold, em italic', () => {
    const { container } = renderArticle();
    expect(container.querySelector('strong')?.textContent).toBe('intentional bold');
    expect(container.querySelector('em')?.textContent).toBe('italic emphasis');
  });

  it('renders lists and blockquotes as body-weight structures', () => {
    const { container } = renderArticle();
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
    const quote = container.querySelector('blockquote');
    expect(quote).toBeTruthy();
    expect(quote!.className).toContain('italic');
    expect(quote!.className).toContain('font-serif');
  });
});

// CSS-level guarantees: the .markdown-body rules are the shared backstop
// applied to every article page, so a bold ancestor can never leak weight
// into article paragraphs or list items.
describe('global article typography CSS guarantees', () => {
  const css = readFileSync(join(__dirname, '../../utils/index.css'), 'utf-8');

  it('pins body paragraphs and list items to font-weight 400', () => {
    expect(css).toMatch(/\.markdown-body p, \.prose p \{[^}]*font-weight: 400 !important/s);
    expect(css).toMatch(/\.markdown-body li, \.prose li \{[^}]*font-weight: 400 !important/s);
  });

  it('defines the heading weight hierarchy: h2 700, h3/h4 600', () => {
    expect(css).toMatch(/\.markdown-body h2, \.prose h2 \{[^}]*font-weight: 700;/s);
    expect(css).toMatch(/\.markdown-body h3, \.prose h3,[^.]*\.markdown-body h4, \.prose h4 \{[^}]*font-weight: 600;/s);
  });

  it('keeps H3 headings a distinct size from H2 sections', () => {
    expect(css).toMatch(/\.markdown-body h3, \.prose h3 \{[^}]*font-size: 1\.05rem !important/s);
  });
});
