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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConsentProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ConsentProvider>
  </StrictMode>,
);


