// @vitest-environment jsdom
// Admin login gate: renders the master-admin access form and hands off to
// the console when an authorized role is already logged in.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminLogin from '../AdminLogin';
import { heartsync } from '../../store';

describe('AdminLogin (master admin access)', () => {
  let previous: any;
  beforeEach(() => {
    previous = heartsync.current_user;
    heartsync.current_user = null;
  });
  afterEach(() => {
    heartsync.current_user = previous;
  });

  it('renders the gated access form - email and password inputs with a submit action', async () => {
    render(<AdminLogin onNavigate={() => {}} onSuccess={() => {}} />);
    // The component shows a brief initializing spinner first - wait for
    // the real form.
    const email = await screen.findByPlaceholderText('admin@heartsync.com', {}, { timeout: 4000 });
    expect(email).toBeDefined();
    const pw = screen.getAllByPlaceholderText('••••••••');
    expect(pw.length).toBeGreaterThan(0);
  });

  it('hands off to the console when an authorized role is already logged in', async () => {
    heartsync.current_user = { id: 'u1', name: 'Admin', email: 'admin@heartsync.com', role: 'admin' };
    const onSuccess = vi.fn();
    render(<AdminLogin onNavigate={() => {}} onSuccess={onSuccess} />);
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('does NOT hand off for an unauthorized role', async () => {
    heartsync.current_user = { id: 'u2', name: 'Guest', email: 'g@x.com', role: 'visitor' };
    const onSuccess = vi.fn();
    render(<AdminLogin onNavigate={() => {}} onSuccess={onSuccess} />);
    await new Promise((r) => setTimeout(r, 700));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
