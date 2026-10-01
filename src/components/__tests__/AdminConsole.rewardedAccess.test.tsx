// @vitest-environment jsdom
// Rewarded Ad Unlock pane (built 2026-10-01): the pane must load the live
// rewarded_ad_config from site settings, let the admin edit it, and persist
// BOTH rewarded_ad_config and rewarded_access_default_duration through
// heartsync.updateSettings plus the /api/admin/settings endpoint.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConsole from '../AdminConsole';
import { heartsync } from '../../store';

type CapturedCall = { url: string; method: string; body: any };
let calls: CapturedCall[] = [];

vi.stubGlobal('fetch', vi.fn((url: any, init: any = {}) => {
  let body: any = null;
  try { body = init?.body ? JSON.parse(init.body) : null; } catch { body = init?.body; }
  calls.push({ url: String(url), method: init?.method || 'GET', body });
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) } as Response);
}));

describe('AdminConsole > Rewarded Ad Unlock pane', () => {
  let previous: any;
  let updateSettingsSpy: any;

  beforeEach(() => {
    previous = heartsync.current_user;
    heartsync.current_user = { id: 'u1', name: 'Admin', email: 'a@x.com', role: 'admin', created_at: new Date().toISOString() };
    heartsync.site_settings.rewarded_ad_config = {
      enabled: true,
      paragraphThreshold: 5,
      adDurationSeconds: 20,
      passValidityHours: 12,
      cpmRate: 30,
      totalViews: 1000,
      totalEarnings: 30,
      activeUnlockedReaders: 4,
    };
    heartsync.site_settings.rewarded_access_default_duration = '1h';
    calls = [];
  });
  afterEach(() => {
    heartsync.current_user = previous;
    delete heartsync.site_settings.rewarded_ad_config;
    heartsync.site_settings.rewarded_access_default_duration = undefined;
    vi.restoreAllMocks();
  });

  it('seeds the form from the live site settings config', async () => {
    render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="rewarded_access" lang="en" />,
    );
    await screen.findAllByText('Rewarded Ad Unlock Configuration', {}, { timeout: 20000 }); // header h1 + pane body copy
    expect((screen.getByDisplayValue('5') as HTMLInputElement).value).toBe('5');
    expect((screen.getByDisplayValue('20') as HTMLInputElement).value).toBe('20');
    expect((screen.getByDisplayValue('30') as HTMLInputElement).value).toBe('30');
  }, 40000);

  it('persists edits through updateSettings AND the admin settings endpoint', async () => {
    updateSettingsSpy = vi.spyOn(heartsync, 'updateSettings').mockResolvedValue(undefined as any);
    const { container } = render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="rewarded_access" lang="en" />,
    );
    await screen.findAllByText('Rewarded Ad Unlock Configuration', {}, { timeout: 20000 }); // header h1 + pane body copy

    // Disable the feature with the top toggle
    const toggle = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(toggle);

    // Switch the default unlock duration to 6h. Identify the select by its
    // seeded value ('1h'), not by DOM order — the console has many selects.
    const durationSelect = Array.from(container.querySelectorAll('select')).find(
      (el) => (el as HTMLSelectElement).value === '1h'
    ) as HTMLSelectElement;
    expect(durationSelect).toBeTruthy();
    fireEvent.change(durationSelect, { target: { value: '6h' } });

    fireEvent.click(screen.getByText('Save Configuration'));

    await waitFor(() => expect(updateSettingsSpy).toHaveBeenCalled());
    const arg = updateSettingsSpy.mock.calls[0][0];
    expect(arg.rewarded_ad_config.enabled).toBe(false);
    expect(arg.rewarded_ad_config.paragraphThreshold).toBe(5);
    expect(arg.rewarded_access_default_duration).toBe('6h');

    // The same payload ships to the durable admin settings endpoint.
    const settingsPost = calls.find((c) => c.url.includes('/api/admin/settings') && c.method === 'POST');
    expect(settingsPost).toBeTruthy();
    expect(settingsPost!.body.rewarded_ad_config.enabled).toBe(false);
    expect(settingsPost!.body.rewarded_access_default_duration).toBe('6h');
  }, 40000);

  it('shows the disabled warning banner when the feature is toggled off', async () => {
    heartsync.site_settings.rewarded_ad_config.enabled = false;
    const { container } = render(
      <AdminConsole onNavigate={() => {}} theme="light" setTheme={() => {}} initialPane="rewarded_access" lang="en" />,
    );
    await screen.findAllByText('Rewarded Ad Unlock Configuration', {}, { timeout: 20000 }); // header h1 + pane body copy
    expect(await screen.findByText(/Rewarded unlocks are disabled/, {}, { timeout: 5000 })).toBeDefined();
    expect(container.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0);
  }, 40000);
});
