import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerServiceWorker, syncBookmarksWithSW, uncacheArticleFromSW, getCachedPostIdsFromSW, useOfflineStatus } from '../offlineCache';
import { renderHook, act } from '@testing-library/react';

describe('offline cache helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns null when service workers are unsupported (jsdom has none)', async () => {
    const reg = await registerServiceWorker();
    expect(reg).toBeNull();
  });

  it('returns null when SW unsupported rather than throwing', async () => {
    const result = await registerServiceWorker();
    expect(result).toBeNull();
  });

  it('syncBookmarksWithSW rejects invalid input without messaging the SW', async () => {
    expect(await syncBookmarksWithSW([], ['a'])).toBe(false);
    expect(await syncBookmarksWithSW([] as any, 'not-an-array' as any)).toBe(false);
    expect(await syncBookmarksWithSW([{ id: 'x' }] as any, [])).toBe(false);
  });

  it('routes messages through the controller and resolves its reply', async () => {
    const postMessage = vi.fn((_msg: unknown, ports: any[]) => {
      // Simulate the SW replying: message posted on the transferred port is
      // delivered to the sender's port1.onmessage (real MessagePort semantics)
      ports[0].postMessage({ status: 'SUCCESS' });
    });
    (navigator as any).serviceWorker = { controller: { postMessage } };
    const posts = [{ id: 'p1', title: 'A', content: 'c' }] as any;
    expect(await syncBookmarksWithSW(posts, ['p1'])).toBe(true);
    expect(postMessage).toHaveBeenCalledOnce();

    const failPost = vi.fn((_msg: unknown, ports: any[]) => {
      ports[0].postMessage({ status: 'ERROR' });
    });
    (navigator as any).serviceWorker = { controller: { postMessage: failPost } };
    expect(await uncacheArticleFromSW('p1')).toBe(false); // status !== DELETED
  });

  it('returns an empty list when no controller exists', async () => {
    (navigator as any).serviceWorker = undefined;
    expect(await getCachedPostIdsFromSW()).toEqual([]);
  });

  it('useOfflineStatus reflects online/offline events', () => {
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current).toBe(!navigator.onLine);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(false);
  });
});
