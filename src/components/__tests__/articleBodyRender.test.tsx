import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ArticleBodyWithInserts from '../ArticleBodyWithInserts';
import { ConsentProvider } from '../ConsentProvider';
import { MORE_POSTS } from '../../utils/data/moreArticles';

/**
 * Article body suite (article page surface). Kept in its own file, separate
 * from the BlogCard suite: importing the BlogCard module graph (motion/store)
 * alongside this suite makes jsdom load a second React copy, which breaks
 * rendering of these components. Production is unaffected - single bundle.
 */

const sample = MORE_POSTS[0];
const longForm = MORE_POSTS.find(p => (p.content || '').length > 5000) || sample;

describe('ArticleBodyWithInserts (article page surface)', () => {
  it('renders long-form markdown with its section headings', () => {
    render(<ConsentProvider><ArticleBodyWithInserts content={longForm.content} /></ConsentProvider>);
    const headings = longForm.content.match(/^## (.+)$/gm) || [];
    for (const h of headings.slice(0, 3)) {
      expect(screen.getByText(h.replace(/^## /, '').trim())).toBeInTheDocument();
    }
  });

  it('renders in-article insight and reflection inserts at their configured depth', () => {
    render(
      <ConsentProvider>
        <ArticleBodyWithInserts
          content={longForm.content}
          inserts={{
            insight: { id: 'insight', enabled: true, title: 'Why This Matters', content: 'Secure bonds are built in small moments of repair.', placementPercent: 10 },
            reflection: { id: 'reflection', enabled: true, title: 'Sit With This', content: 'Which small bid did you miss this week?', placementPercent: 50 },
          }}
        />
      </ConsentProvider>
    );
    expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    expect(screen.getByText('Secure bonds are built in small moments of repair.')).toBeInTheDocument();
    expect(screen.getByText('Sit With This')).toBeInTheDocument();
  });

  it('keeps rendering the article when an insert is disabled', () => {
    render(
      <ConsentProvider>
        <ArticleBodyWithInserts
          content={sample.content}
          inserts={{
            insight: { id: 'insight', enabled: false, title: 'Hidden', content: 'Should not appear', placementPercent: 10 },
          }}
        />
      </ConsentProvider>
    );
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });
});
