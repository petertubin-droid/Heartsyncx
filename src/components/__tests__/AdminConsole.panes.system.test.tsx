// @vitest-environment jsdom
// ADMIN SECTION INVENTORY (System & Configuration group): every pane in this
// group must render its signature header.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AdminConsole from '../AdminConsole';
import { heartsync } from '../../store';

vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response)));

const CASES: [string, string][] = [
  ['settings', 'Global Blog Settings'],
  ['integrations', 'Platform Integrations & API Hub'],
  ['ai_copilot', 'AI Writer Co-pilot'],
  ['ai_features', 'AI Intelligence Suite'],
  ['feature_manager', 'Feature Manager & Module System'],
  ['autopilot_rss', 'Autopilot RSS Pipelines'],
  ['tts_settings', 'Audio Text-to-Speech (TTS) Settings'],
  ['page_builder', 'Visual Layout Builder'],
  ['homepage_content', 'Homepage content manager'],
  ['multi_site', 'Tenant Domains Router'],
  ['site_branding', 'Design Studio (Advanced Elite Theme)'],
  ['localization', 'Translation & Multilingual Center'],
  ['security', 'Administrative Security Console'],
  ['sentiment_guard', 'Clinical Sentiment Guard & Tone Analyzer'],
  ['acoustic_pulse', 'Heartsync Clinical Sensory Focus Synth'],
  ['roles_permissions', 'Administrative Permission Matrix'],
  ['cicd', 'CI/CD Pipeline & DevOps Quality Desk'],
];

describe('AdminConsole > System & Configuration panes render', () => {
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
