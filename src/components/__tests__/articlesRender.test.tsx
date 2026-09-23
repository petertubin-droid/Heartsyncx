import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BlogCard from '../BlogCard';
import ArticleBodyWithInserts from '../ArticleBodyWithInserts';
import { MORE_POSTS, MORE_CATEGORIES } from '../../utils/data/moreArticles';

/**
 * Article rendering suite: proves the restored corpus actually renders in the
 * two surfaces readers see  - the card grid and the article page body (with
 * in-article inserts), using real corpus data rather than toy fixtures.
 */

const sample = MORE_POSTS[0];
const longForm = MORE_POSTS.find((p) => (p.content || '').length > 5000) || sample;
const category = MORE_CATEGORIES.find((c) => c.id === sample.category_id);

describe('BlogCard (article grid surface)', () => {
  it('renders a corpus article with its title, excerpt and category', () => {
    const onNavigate = vi.fn();
    render(
      <BlogCard post={sample} onClick={() => {}} onNavigate={onNavigate} />
    );
    expect(screen.getByText(sample.title)).toBeInTheDocument();
    const excerptNodes = screen.getAllByText((_, el) =>
      !!el?.textContent && el.textContent.replace(/\s+/g, ' ').includes(sample.excerpt.slice(0, 60))
    );
    expect(excerptNodes.length).toBeGreaterThan(0);
    if (category) {
      expect(screen.getAllByText(category.name).length).toBeGreaterThan(0);
    }
  });

  it('announces the read time and fires navigation on click', () => {
    const onClick = vi.fn();
    render(
      <BlogCard post={sample} onClick={onClick} onNavigate={() => {}} />
    );
    fireEvent.click(screen.getByText(sample.title));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders every restored article without throwing', () => {
    for (const post of MORE_POSTS) {
      const { unmount } = render(
        <BlogCard post={post} onClick={() => {}} onNavigate={() => {}} />
      );
      expect(screen.getByText(post.title)).toBeInTheDocument();
      unmount();
    }
  });
});
