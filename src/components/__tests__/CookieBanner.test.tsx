import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ConsentProvider } from '../ConsentProvider';
import { CookieBanner } from '../CookieBanner';
import { heartsync } from '../../store';

const renderBanner = (onLearnMore = () => {}) =>
  render(
    <ConsentProvider>
      <CookieBanner onLearnMore={onLearnMore} />
    </ConsentProvider>
  );

const BANNER = '[aria-label="Heartsync Cookie Consent"]';

describe('CookieBanner (GDPR consent UI)', () => {
  beforeEach(() => {
    localStorage.clear();
    heartsync.setLocalStorage('heartsync_cookie_consent', null);
    heartsync.setLocalStorage('heartsync_cookie_preferences', null);
  });

  it('shows the banner when no consent choice has been made', () => {
    renderBanner();
    expect(document.querySelector(BANNER)).not.toBeNull();
    expect(screen.getByRole('button', { name: /accept all/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /reject all/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /customize cookie options/i })).toBeTruthy();
  });

  it('records an accepted choice with full preferences (persisted for the next visit)', () => {
    renderBanner();
    act(() => { screen.getByRole('button', { name: /accept all/i }).click(); });
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_consent')!)).toBe('accepted');
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_preferences')!)).toEqual({
      necessary: true, analytics: true, marketing: true, functional: true
    });
  });

  it('records a rejected choice with necessary-only preferences', () => {
    renderBanner();
    act(() => { screen.getByRole('button', { name: /reject all/i }).click(); });
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_consent')!)).toBe('rejected');
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_preferences')!)).toEqual({
      necessary: true, analytics: false, marketing: false, functional: false
    });
  });

  it('does not re-show the banner after a stored accepted choice', () => {
    heartsync.setLocalStorage('heartsync_cookie_consent', 'accepted');
    heartsync.setLocalStorage('heartsync_cookie_preferences', { necessary: true, analytics: true, marketing: true, functional: true });
    renderBanner();
    expect(document.querySelector(BANNER)).toBeNull();
  });

  it('does not re-show the banner after a stored rejected choice', () => {
    heartsync.setLocalStorage('heartsync_cookie_consent', 'rejected');
    heartsync.setLocalStorage('heartsync_cookie_preferences', { necessary: true, analytics: false, marketing: false, functional: false });
    renderBanner();
    expect(document.querySelector(BANNER)).toBeNull();
  });

  it('opens the preferences modal and saves a custom analytics-only split', async () => {
    renderBanner();
    act(() => { screen.getByRole('button', { name: /customize cookie options/i }).click(); });
    // the modal opens on top of the banner (both expose role=dialog)
    await waitFor(() => expect(screen.getAllByRole('dialog').length).toBeGreaterThan(1));
    const analyticsSwitch = screen.getByRole('switch', { name: /analytics cookies/i });
    expect(analyticsSwitch.getAttribute('aria-checked')).toBe('false');
    act(() => { analyticsSwitch.click(); });
    act(() => { screen.getByRole('switch', { name: /marketing cookies/i }).click(); });
    act(() => { screen.getByRole('switch', { name: /functional cookies/i }).click(); });
    act(() => { screen.getByRole('button', { name: /save settings/i }).click(); });
    const prefs = JSON.parse(localStorage.getItem('heartsync_cookie_preferences')!);
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(true);
    expect(JSON.parse(localStorage.getItem('heartsync_cookie_consent')!)).toBe('accepted');
  });

  it('the modal switches reflect the stored preferences on reopen (consistency)', async () => {
    heartsync.setLocalStorage('heartsync_cookie_consent', 'custom');
    heartsync.setLocalStorage('heartsync_cookie_preferences', { necessary: true, analytics: true, marketing: false, functional: false });
    renderBanner();
    act(() => { screen.getByRole('button', { name: /manage cookie consent preferences/i }).click(); });
    await waitFor(() => expect(screen.getAllByRole('dialog').length).toBeGreaterThan(0));
    expect(screen.getByRole('switch', { name: /analytics cookies/i }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('switch', { name: /marketing cookies/i }).getAttribute('aria-checked')).toBe('false');
  });

  it('surfaces the Cookie Policy link via onLearnMore', () => {
    const onLearnMore = vi.fn();
    renderBanner(onLearnMore);
    act(() => { screen.getByRole('button', { name: /cookie policy/i }).click(); });
    expect(onLearnMore).toHaveBeenCalledOnce();
  });
});
