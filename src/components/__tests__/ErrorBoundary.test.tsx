import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const Exploder = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('catches a child crash and shows the safe fallback UI instead of a white page', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Exploder message="kaboom" />
      </ErrorBoundary>
    );
    expect(screen.getByText(/unexpected interface error/i)).toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  it('captures the error object for logging (componentDidCatch path)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Exploder message="specific-crash-reason" />
      </ErrorBoundary>
    );
    const logged = spy.mock.calls.flat(2).join(' ');
    expect(logged).toContain('specific-crash-reason');
  });
});
