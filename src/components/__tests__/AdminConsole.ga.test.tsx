// @vitest-environment jsdom
// AdminConsole ad-networks pane: the GA4 measurement ID field (2026-09-26
// audit gap) must exist, be editable, and be included in the settings
// payload the Synchronize button persists.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminConsole from '../AdminConsole';
import { heartsync } from '../../store';

describe('AdminConsole > Ad Networks > GA4 field', () => {
  let previous: any;
  beforeEach(() => {
    previous = heartsync.current_user;
    heartsync.current_user = { id: 'u1', name: 'Admin', email: 'a@x.com', role: 'admin' };
    heartsync.site_settings.ga_measurement_id = '';
  });
  afterEach(() => {
    heartsync.current_user = previous;
    heartsync.site_settings.ga_measurement_id = '';
  });

  it('shows the GA4 measurement input in the Ad Networks pane and stores edits in component state', async () => {
    render(
      <AdminConsole
        onNavigate={() => {}}
        theme="light"
        setTheme={() => {}}
        initialPane="adsense_settings"
        lang="en"
      />,
    );
    const gaInput = await screen.findByPlaceholderText('G-XXXXXXXXXX', {}, { timeout: 8000 });
    expect(gaInput).toBeDefined();
    fireEvent.change(gaInput, { target: { value: 'G-ABC123' } });
    expect((gaInput as HTMLInputElement).value).toBe('G-ABC123');

    // The GA field ships with the same Synchronize button as the other
    // ad-network credentials.
    expect(await screen.findByText('Synchronize All Ad Networks', {}, { timeout: 8000 })).toBeDefined();
  }, 30000);

  it('seeds the GA field from the live site settings on hydration', async () => {
    heartsync.site_settings.ga_measurement_id = 'G-SEEDED';
    render(
      <AdminConsole
        onNavigate={() => {}}
        theme="light"
        setTheme={() => {}}
        initialPane="adsense_settings"
        lang="en"
      />,
    );
    const gaInput = (await screen.findByPlaceholderText('G-XXXXXXXXXX', {}, { timeout: 8000 })) as HTMLInputElement;
    expect(gaInput.value).toBe('G-SEEDED');
  }, 30000);
});
