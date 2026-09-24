import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import App from './App.tsx';
import './utils/index.css';
import {ConsentProvider} from './components/ConsentProvider.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {registerServiceWorker} from './utils/offlineCache.ts';
import {clearUnauthorizedStorageKeys} from './utils/storageAudit.ts';
import {initCodeSentry} from './lib/codeSentry.ts';

// Code sentry first: capture every crash from the first possible moment.
initCodeSentry();

// Safely audit and clean unauthorized storage keys without wiping user preferences (bookmarks, themes)
try {
  if (typeof window !== 'undefined') {
    clearUnauthorizedStorageKeys({ verbose: false });
  }
} catch (e) {
  // Ignore storage access restrictions
}

// Register Service Worker for cozy offline article caching
if (typeof window !== 'undefined') {
  registerServiceWorker();
}

// Viewport integrity guard: some mobile browsers can enter a "desktop
// layout" state after OAuth redirect chains (e.g. Google sign-in) when the
// viewport meta is missing, malformed, or replaced. Ensure the app ALWAYS
// renders with a proper mobile viewport so phone users stay in mobile
// layout, no matter which HTML entry point (CDN static, serverless HTML,
// or service-worker fallback) served the shell.
if (typeof window !== 'undefined') {
  try {
    const REQUIRED = 'width=device-width, initial-scale=1.0';
    const ensureViewport = () => {
      let meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        (meta as HTMLMetaElement).name = 'viewport';
        document.head.appendChild(meta);
      }
      const content = meta.getAttribute('content') || '';
      if (!/width\s*=\s*device-width/.test(content) || !/initial-scale/.test(content)) {
        meta.setAttribute('content', REQUIRED);
      }
    };
    ensureViewport();
    // Re-assert after OAuth redirects and async DOM mutations.
    window.addEventListener('load', ensureViewport);
    document.addEventListener('DOMContentLoaded', ensureViewport);
    setTimeout(ensureViewport, 1000);
  } catch (_) { /* non-fatal */ }
}

// Attach the active Supabase session token to same-origin API requests so
// admin-gated server endpoints can verify real authenticated sessions.
if (typeof window !== 'undefined') {
  const nativeFetch = window.fetch.bind(window);
  (window as any).fetch = async (input: any, init?: any) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith('/api/')) {
        const { heartsync } = await import('./store.ts');
        const { data: sessionData } = (await heartsync.supabase?.auth?.getSession?.()) ?? { data: null };
        const accessToken = (sessionData as any)?.session?.access_token;
        if (accessToken) {
          const headers = new Headers(init?.headers || {});
          headers.set('Authorization', `Bearer ${accessToken}`);
          init = { ...init, headers };
        }
      }
    } catch (_) {
      // Fall through to native fetch when no session can be resolved
    }
    return nativeFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsentProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ConsentProvider>
  </StrictMode>,
);


