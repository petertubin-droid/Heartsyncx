// @vitest-environment jsdom
// CODE SENTRY capture-lib tests: the watchdog must capture the three error
// channels, dedupe render-loop storms, batch non-fatal events, send fatal
// events immediately, and survive a dead reporting endpoint without ever
// throwing into the host page.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCodeSentry, reportFatal } from '../codeSentry';

function fireErrorEvent(message: string, filename = 'https://heartsyncx.netlify.app/assets/app.js', lineno = 42) {
  const ev = new ErrorEvent('error', { message, filename, lineno, colno: 7, error: new Error(message) });
  window.dispatchEvent(ev);
}

function fireRejection(reason: Error) {
  const ev = new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason });
  window.dispatchEvent(ev);
}

describe('codeSentry capture lib', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    // Fresh module state per test: re-import with a cache-busting query.
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function loadSentry() {
    const mod = await import('../codeSentry');
    mod.initCodeSentry();
    return mod;
  }

  it('captures window errors and flushes them as a batch to /api/sentry/capture', async () => {
    await loadSentry();
    fireErrorEvent('boom one');
    fireErrorEvent('boom two');
    expect(fetchMock).not.toHaveBeenCalled(); // batched, not immediate

    await vi.advanceTimersByTimeAsync(9000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/sentry/capture');
    const body = JSON.parse(init.body);
    expect(body.events).toHaveLength(2);
    expect(body.events[0].message).toBe('boom one');
    expect(body.events[0].source).toContain('app.js');
    expect(body.events[0].line).toBe(42);
  });

  it('captures unhandled promise rejections with stack', async () => {
    await loadSentry();
    const reason = new Error('async disaster');
    fireRejection(reason);
    await vi.advanceTimersByTimeAsync(9000);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.events[0].type).toBe('rejection');
    expect(body.events[0].message).toBe('async disaster');
    expect(body.events[0].stack).toBeTruthy();
  });

  it('dedupes an identical error storm inside the window (one report, not forty)', async () => {
    await loadSentry();
    for (let i = 0; i < 40; i++) fireErrorEvent('render loop', 'app.js', 100);
    await vi.advanceTimersByTimeAsync(9000);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.events).toHaveLength(1);
  });

  it('sends fatal events immediately without waiting for the batch timer', async () => {
    const mod = await loadSentry();
    fetchMock.mockClear();
    reportFatal(new Error('entire app dead'), 'react-fatal');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.events[0].severity).toBe('fatal');
    expect(body.events[0].message).toContain('react-fatal');
    expect(mod).toBeTruthy();
  });

  it('never throws when the reporting endpoint is unreachable', async () => {
    await loadSentry();
    fetchMock.mockRejectedValue(new TypeError('network down'));
    expect(() => reportFatal(new Error('x'), 'react-fatal')).not.toThrow();
    fireErrorEvent('after outage');
    await vi.advanceTimersByTimeAsync(9000);
    // The failure was swallowed; the page keeps running.
    expect(document.body).toBeTruthy();
  });

  it('initCodeSentry is idempotent (double install never double-reports)', async () => {
    const mod = await loadSentry();
    mod.initCodeSentry(); // second call must be a no-op
    fireErrorEvent('only once');
    await vi.advanceTimersByTimeAsync(9000);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.events).toHaveLength(1);
  });
});
