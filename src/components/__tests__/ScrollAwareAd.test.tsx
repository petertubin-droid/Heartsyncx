import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import ScrollAwareAd from '../ScrollAwareAd';
import { ConsentProvider } from '../ConsentProvider';
import { heartsync } from '../../store';

describe('ScrollAwareAd (footer unit)', () => {
  beforeEach(() => {
    heartsync.setLocalStorage('heartsync_cookie_consent', null);
    heartsync.setLocalStorage('heartsync_cookie_preferences', null);
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the wrapper geometry intact while hidden (layout-stable hide)', () => {
    // Regression for the footer glitch: the first implementation collapsed
    // the wrapper with maxHeight:0 + overflow:hidden, which (a) stopped the
    // lazy IntersectionObserver from ever firing while scrolling and
    // (b) resized the document on every toggle, jittering the page.
    const { container } = render(
      <ConsentProvider>
        <ScrollAwareAd slot="footer" />
      </ConsentProvider>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).not.toBeNull();
    // Before any scroll: visible, geometry untouched.
    expect(wrapper.style.opacity).toBe('1');
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    // Hidden, but ONLY via opacity/visibility - no height collapse, so
    // the ad unit keeps its box and can still lazy-load.
    expect(wrapper.style.opacity).toBe('0');
    expect(wrapper.style.visibility).toBe('hidden');
    expect(wrapper.style.pointerEvents).toBe('none');
    expect(wrapper.style.maxHeight).toBe('');
    expect(wrapper.style.overflow).toBe('');
  });

  it('reveals again after the user stops scrolling', () => {
    const { container } = render(
      <ConsentProvider>
        <ScrollAwareAd slot="footer" />
      </ConsentProvider>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(wrapper.style.opacity).toBe('0');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(wrapper.style.opacity).toBe('1');
    expect(wrapper.style.visibility).toBe('visible');
  });

  it('stays hidden while scrolling continues (debounced reveal)', () => {
    const { container } = render(
      <ConsentProvider>
        <ScrollAwareAd slot="footer" />
      </ConsentProvider>
    );
    const wrapper = container.firstElementChild as HTMLElement;
    for (let i = 0; i < 5; i++) {
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });
      act(() => {
        vi.advanceTimersByTime(300);
      });
    }
    expect(wrapper.style.opacity).toBe('0');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(wrapper.style.opacity).toBe('1');
  });
});
