// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticleShareRow } from '../ArticleShareRow';

describe('ArticleShareRow (share intent tracking)', () => {
  beforeEach(() => {
    const w = window as any;
    delete w.gtag;
    w.dataLayer = [];
  });

  it('fires a GA4 share event with the platform method when a network link is clicked', () => {
    render(<ArticleShareRow title="T" url="https://hsx.app/a" />);
    const x = screen.getByRole('link', { name: 'Share on X' });
    expect(x.getAttribute('href')).toContain('twitter.com');
    fireEvent.click(x);
    const dl = (window as any).dataLayer as any[];
    expect(dl.some((e) => e.event === 'share' && e.method === 'x')).toBe(true);
  });

  it('tracks the TikTok copy-link share (growth channel attribution)', () => {
    render(<ArticleShareRow title="T" url="https://hsx.app/a" compact />);
    const tiktokBtn = screen.getByRole('button', { name: /tiktok/i });
    fireEvent.click(tiktokBtn);
    const dl = (window as any).dataLayer as any[];
    expect(dl.some((e) => e.event === 'share' && e.method === 'tiktok')).toBe(true);
  });
});
