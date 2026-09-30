// @vitest-environment jsdom
// HeartSyncX Entry Experience: premium first-visit welcome overlay.
// It must render the brand message, enter the site via the CTA, remember
// the visit locally, and never trap visitors when storage is unavailable.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import EntryExperience, { hasEnteredBefore, markEntered } from '../entry/EntryExperience';

const STORAGE_KEY = 'hs_entry_seen_v1';

describe('EntryExperience (first-visit welcome)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('renders the brand, headline, curiosity line and CTA', () => {
    render(<EntryExperience onComplete={() => {}} />);
    expect(screen.getByRole('dialog', { name: /welcome to heartsyncx/i })).toBeDefined();
    expect(screen.getByText('HeartSyncX')).toBeDefined();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Understand Love.');
    expect(h1.textContent).toContain('Understand Yourself.');
    expect(
      screen.getByText(
        'Real conversations about relationships, dating, connection and the emotions behind them.'
      )
    ).toBeDefined();
    expect(
      screen.getByText('Some relationships need answers. Some need honesty.')
    ).toBeDefined();
    expect(screen.getByTestId('entry-cta').textContent).toContain('Explore HeartSyncX');
  });

  it('is a proper dialog: modal, labelled, with an accessible button', () => {
    render(<EntryExperience onComplete={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByTestId('entry-cta').tagName).toBe('BUTTON');
  });

  it('entering via the CTA marks the visit and completes after the transition', () => {
    const onComplete = vi.fn();
    render(<EntryExperience onComplete={onComplete} />);
    fireEvent.click(screen.getByTestId('entry-cta'));
    // The flag is set immediately so a mid-transition interruption
    // can never trap the visitor.
    expect(hasEnteredBefore()).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(500); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('the Escape key also enters the site', () => {
    const onComplete = vi.fn();
    render(<EntryExperience onComplete={onComplete} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(hasEnteredBefore()).toBe(true);
    act(() => { vi.advanceTimersByTime(500); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('entering twice (double activation) completes only once', () => {
    const onComplete = vi.fn();
    render(<EntryExperience onComplete={onComplete} />);
    const cta = screen.getByTestId('entry-cta');
    fireEvent.click(cta);
    fireEvent.click(cta);
    act(() => { vi.advanceTimersByTime(600); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('hasEnteredBefore reflects the local flag', () => {
    expect(hasEnteredBefore()).toBe(false);
    markEntered();
    expect(hasEnteredBefore()).toBe(true);
    window.localStorage.removeItem(STORAGE_KEY);
    expect(hasEnteredBefore()).toBe(false);
  });

  it('never traps visitors when localStorage is unavailable', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(hasEnteredBefore()).toBe(true); // fails open - immediate access
    spy.mockRestore();
  });
});
