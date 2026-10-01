// @vitest-environment jsdom
// ADMIN SECTION INVENTORY (Content Management group): every pane in this
// group must render its signature header. If a pane crashes on mount or its
// header disappears, this suite catches it before deploy.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AdminConsole from '../AdminConsole';
import { heartsync } from '../../store';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const CASES: [string, string][] = [
  ['dashboard', 'Dashboard Analytics'],
  ['posts', 'CRM Relationship Posts'],
  ['categories', 'CMS Category Management'],
  ['media', 'Media & Storage Library'],
  ['comments', 'Comment Moderation Desk'],
  ['live_chat', 'Live Support Chat Desk'],
  ['quiz_manager', 'Interactive Quizzes & Audience Engagement'],
  ['tags', 'Topic Tags Registry'],
  ['pages', 'Create New Document'],
  ['podcasts', 'Podcast Episodes Studio'],
  ['upload_manager', 'Asset Upload Hub'],
  ['moderation', 'Anti-Spam Comments Filter'],
  ['users', 'Staff Accounts'],
  ['seo', 'Search Rankings Control'],
  ['sitemap', 'SEO XML Sitemap Registry'],
  ['metadata_manager', 'Custom Route Overrides'],
  ['article_display_settings', 'Premium Article Display Settings'],
];

describe('AdminConsole > Content Management panes render', () => {
  let previous: any;
  beforeEach(() => {
    previous = heartsync.current_user;
    heartsync.current_user = { id: 'u1', name: 'Admin', email: 'a@x.com', role: 'admin', created_at: new Date().toISOString() };
  });
  afterEach(() => {
    heartsync.current_user = previous;
    cleanup();
  });

  it.each(CASES)('pane "%s" renders signature: %s', async (pane, header) => {
    render(
      <AdminConsole
        onNavigate={() => {}}
        theme="light"
        setTheme={() => {}}
        initialPane={pane}
        lang="en"
      />,
    );
    expect(await screen.findAllByText(header, {}, { timeout: 20000 }).then((r) => r.length > 0)).toBe(true);
  }, 40000);
});
