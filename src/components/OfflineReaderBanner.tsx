import React, { useState, useEffect } from 'react';
import { WifiOff, Bookmark, DownloadCloud, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { useOfflineStatus, syncBookmarksWithSW, getCachedPostIdsFromSW } from '../utils/offlineCache';
import { heartsync } from '../store';

export default function OfflineReaderBanner() {
  const isOffline = useOfflineStatus();
  const [cachedIds, setCachedIds] = useState<string[]>([]);
  const [isCaching, setIsCaching] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const bookmarks = heartsync.bookmarks || [];
  const bookmarkedPosts = (heartsync.posts || []).filter(p => bookmarks.includes(p.id));

  useEffect(() => {
    // Check which post IDs are currently cached in Service Worker
    getCachedPostIdsFromSW().then(ids => {
      setCachedIds(ids);
    });
  }, [bookmarks, isOffline]);

  const handlePrecacheAll = async () => {
    setIsCaching(true);
    try {
      await syncBookmarksWithSW(heartsync.posts, bookmarks);
      const updatedIds = await getCachedPostIdsFromSW();
      setCachedIds(updatedIds);
      heartsync.notifyToast('🌿 All saved articles pre-cached for cozy offline reading!', 'success');
    } catch (err) {
      console.warn('Precache error:', err);
    } finally {
      setIsCaching(false);
    }
  };

  // If online and not caching, don't show full banner unless bookmarks exist and user wants to precache
  if (!isOffline && isDismissed) {
    return null;
  }

  if (isOffline) {
    return (
      <div className="bg-gradient-to-r from-zinc-900 via-rose-950 to-zinc-900 text-white px-4 py-3 border-b border-rose-500/30 shadow-md relative overflow-hidden transition-all text-left">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase tracking-wider text-rose-300 text-[11px]">
                  Cozy Reader Offline Mode
                </span>
                <span className="bg-rose-500/20 text-rose-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold border border-rose-500/40">
                  {bookmarks.length} Saved {bookmarks.length === 1 ? 'Guide' : 'Guides'} Ready
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] mt-0.5">
                Your internet connection is resting. You can read all your saved relationship guides seamlessly from local offline cache.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                // Focus or open bookmarks dropdown
                const bookmarkBtn = document.getElementById('bookmark-drawer-trigger');
                if (bookmarkBtn) bookmarkBtn.click();
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>View Saved Articles</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // When Online: Show subtle pre-cache status bar if there are bookmarked articles not yet cached
  const uncachedCount = bookmarks.filter(id => !cachedIds.includes(id)).length;
  if (bookmarks.length === 0 || uncachedCount === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900/90 backdrop-blur-md text-zinc-200 px-4 py-2 border-b border-zinc-800 text-xs text-left">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          <Bookmark className="w-3.5 h-3.5 text-rose-400" />
          <span>
            You have <strong className="text-white font-mono">{bookmarks.length}</strong> bookmarked {bookmarks.length === 1 ? 'article' : 'articles'}. Pre-cache them for instant offline reading!
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrecacheAll}
            disabled={isCaching}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] rounded-lg transition-all border border-rose-500/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isCaching ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Pre-caching...</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-3 h-3 text-rose-400" />
                <span>Download for Offline</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-md cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
