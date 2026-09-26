// ============================================================================
// CODE SENTRY - in-repo error watchdog (2026-09-24). No third-party service,
// no external account: errors are captured in the browser, batched, deduped,
// and POSTed to our own /api/sentry/capture endpoint, which keeps a
// rate-limited ring buffer viewable by the admin via GET /api/sentry/events.
// Deliberately dependency-free so it can never itself be the cause of a
// bundle failure - a monitoring tool that can crash is worse than none.
// ============================================================================

interface SentryEvent {
  fingerprint: string;
  type: 'error' | 'rejection' | 'fatal';
  severity: 'error' | 'fatal';
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  url: string;
  userAgent: string;
  viewport: string;
  session: string;
  timestamp: string;
  release: string;
}

const MAX_QUEUE = 25;            // hard cap on captured events per page load
const MAX_STACK = 2000;          // stacks are truncated before transmission
const DEDUPE_WINDOW_MS = 10_000; // identical fingerprint inside this window is dropped
const FLUSH_INTERVAL_MS = 8_000;
const ENDPOINT = '/api/sentry/capture';

let queue: SentryEvent[] = [];
let seen = new Map<string, number>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let session = '';
let installed = false;

function fingerprint(msg: string, source?: string, line?: number): string {
  return `${msg}|${source || ''}|${line ?? 0}`;
}

function truncate(s: string | undefined, max: number): string | undefined {
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}

function getSession(): string {
  if (session) return session;
  // Browser storage removal (2026-09-26): per-page-load session id in memory.
  session = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return session;
}

function push(event: SentryEvent) {
  // Dedupe: the same crash firing 40 times a second (common with render loops)
  // must produce ONE report, not 40. One report, one admin alert.
  const last = seen.get(event.fingerprint);
  const now = Date.now();
  if (last && now - last < DEDUPE_WINDOW_MS) {
    seen.set(event.fingerprint, now);
    return;
  }
  seen.set(event.fingerprint, now);
  if (seen.size > 100) seen = new Map(); // memory guard

  if (queue.length >= MAX_QUEUE) return; // a page drowning in errors reports once, not endlessly
  queue.push(event);
  if (event.severity === 'fatal') {
    flush(); // fatal (ErrorBoundary) events leave immediately
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

function flush() {
  flushTimer && clearTimeout(flushTimer);
  flushTimer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, 20);
  const payload = JSON.stringify({ events: batch });
  try {
    // sendBeacon survives page unload; keepalive fetch is the fallback.
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      if (navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }))) return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => { /* the sentry must never throw */ });
  } catch {
    /* never let monitoring break the app */
  }
}

function baseEvent(type: SentryEvent['type'], message: string, stack?: string, source?: string, line?: number, column?: number): SentryEvent {
  return {
    fingerprint: fingerprint(message, source, line),
    type,
    severity: type === 'fatal' ? 'fatal' : 'error',
    message: truncate(message, 500) || 'Unknown error',
    stack: truncate(stack, MAX_STACK),
    source: truncate(source, 300),
    line,
    column,
    url: truncate(typeof location !== 'undefined' ? location.href : '', 300) || 'unknown',
    userAgent: truncate(typeof navigator !== 'undefined' ? navigator.userAgent : '', 300) || 'unknown',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    session: getSession(),
    timestamp: new Date().toISOString(),
    release: (typeof document !== 'undefined' && document.querySelector('meta[name="release"]')?.getAttribute('content')) || 'unknown'
  };
}

/** Install the global capture hooks. Idempotent - safe to call multiple times. */
export function initCodeSentry(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (ev) => {
    if (ev.error) {
      push(baseEvent('error', ev.error.message || String(ev.error), ev.error.stack, ev.filename, ev.lineno, ev.colno));
    } else {
      // Resource load failures (image/script/css) arrive with a target, no error.
      const target = ev.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        push(baseEvent('error', `Resource failed to load: ${(target as HTMLImageElement).src || (target as HTMLLinkElement).href || target.tagName}`));
      } else {
        push(baseEvent('error', ev.message, undefined, ev.filename, ev.lineno, ev.colno));
      }
    }
  }, true);

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = (ev as any).reason;
    push(baseEvent('rejection', reason?.message || String(reason), reason?.stack));
  });

  window.addEventListener('pagehide', flush);
}

/** Manual capture hook, used by the React ErrorBoundary for fatal render errors. */
export function reportFatal(error: Error, context?: string): void {
  push(baseEvent('fatal', `${context ? context + ': ' : ''}${error.message || String(error)}`, error.stack));
}

// Expose for the admin console / debugging without a bundler import.
if (typeof window !== 'undefined') {
  (window as any).__hsSentry = { reportFatal, flush, queueSize: () => queue.length };
}
