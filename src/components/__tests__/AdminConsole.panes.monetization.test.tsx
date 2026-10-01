// @vitest-environment jsdom
// ADMIN SECTION INVENTORY (Monetization & Growth group): every pane in this
// group must render its signature header.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AdminConsole from '../AdminConsole';
import { heartsync } from '../../store';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const CASES: [string, string][] = [
  ['ads', 'Ad Monetization'],
  ['adsense_settings', 'Synchronize All Ad Networks'],
  ['ads_manager', 'Sponsorships & Ads Leaderboard'],
  ['banner_slots', 'Frontend Banner Slots'],
  ['billing', 'Group 1: Membership Tiers & E-Commerce Digital Products'],
  ['rewarded_access', 'Rewarded Ad Unlock Configuration'],
  ['email_marketing', 'Email Marketing Console'],
  ['newsletter', 'Newsletter Design Lab'],
  ['subscribers', 'Newsletter Subscribers Directory'],
  ['webhooks', 'Webhook Outreach & Analytics Console'],
];

describe('AdminConsole > Monetization & Growth panes render', () => {
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
