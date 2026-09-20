import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import App from './App.tsx';
import './utils/index.css';
import {ConsentProvider} from './components/ConsentProvider.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {registerServiceWorker} from './utils/offlineCache.ts';
import {clearUnauthorizedStorageKeys} from './utils/storageAudit.ts';

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


