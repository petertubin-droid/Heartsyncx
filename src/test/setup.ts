import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount React trees after each test so components don't leak between specs.
afterEach(() => {
  cleanup();
});

// jsdom has no matchMedia implementation; several components (theme, layout,
// responsive hooks) call it on mount and would throw without this stub.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })) as unknown as typeof window.matchMedia;
}

// jsdom doesn't implement IntersectionObserver, used by lazy ad slots and
// scroll-triggered UI.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  (window as any).IntersectionObserver = MockIntersectionObserver;
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
}

// jsdom doesn't implement ResizeObserver either.
class MockResizeObserver implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  (window as any).ResizeObserver = MockResizeObserver;
  (globalThis as any).ResizeObserver = MockResizeObserver;
}

// MessageChannel polyfill: jsdom does not implement it, and offlineCache's
// SW messaging depends on paired ports. port.postMessage(data) delivers to
// the linked port's onmessage, mirroring the real MessagePort contract.
class MockMessagePort {
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  linked: MockMessagePort | null = null;
  postMessage(data: unknown) {
    this.linked?.onmessage({ data });
  }
}
class MockMessageChannel {
  port1: MockMessagePort;
  port2: MockMessagePort;
  constructor() {
    this.port1 = new MockMessagePort();
    this.port2 = new MockMessagePort();
    this.port1.linked = this.port2;
    this.port2.linked = this.port1;
  }
}
if (typeof (globalThis as any).MessageChannel === 'undefined') {
  (globalThis as any).MessageChannel = MockMessageChannel;
}
