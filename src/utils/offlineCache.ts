import { useState, useEffect } from 'react';
import { Post } from '../types';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the Service Worker for offline article caching and cozy reading.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = registration;

    console.log('[Heartsync SW] Registered successfully with scope:', registration.scope);

    // Listen for updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Heartsync SW] New offline reader content available; please refresh.');
          }
        };
      }
    };

    return registration;
  } catch (error) {
    console.warn('[Heartsync SW] Registration failed:', error);
    return null;
  }
}

/**
 * Send a message to the active service worker with MessageChannel response handling.
 */
function sendMessageToSW<T = any>(message: any): Promise<T | null> {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
      resolve(null);
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
  });
}

/**
 * Sync bookmarked articles with the service worker cache for offline reading.
 */
export async function syncBookmarksWithSW(allPosts: Post[], bookmarkIds: string[]): Promise<boolean> {
  if (!Array.isArray(allPosts) || !Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
    return false;
  }

  const bookmarkedPosts = allPosts.filter(p => p && bookmarkIds.includes(p.id));
  if (bookmarkedPosts.length === 0) return false;

  const result = await sendMessageToSW({
    type: 'CACHE_BOOKMARKED_ARTICLES',
    payload: { posts: bookmarkedPosts },
  });

  return result?.status === 'SUCCESS';
}

/**
 * Remove an article from the service worker cache when unbookmarked.
 */
export async function uncacheArticleFromSW(postId: string): Promise<boolean> {
  if (!postId) return false;
  const result = await sendMessageToSW({
    type: 'UNCACHE_ARTICLE',
    payload: { postId },
  });
  return result?.status === 'DELETED';
}

/**
 * Fetch list of post IDs currently present in the offline service worker cache.
 */
export async function getCachedPostIdsFromSW(): Promise<string[]> {
  const result = await sendMessageToSW<{ cachedIds?: string[] }>({
    type: 'CHECK_CACHED_POST_IDS',
  });
  return result?.cachedIds || [];
}

/**
 * React hook to track real-time online/offline network status.
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}
