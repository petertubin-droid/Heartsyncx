/* ============================================================================
   HEARTSYNC COZY OFFLINE READER  - SERVICE WORKER
   Provides offline caching, stale-while-revalidate for articles, and instant 
   pre-caching of bookmarked/saved relationship guides.
   ============================================================================ */

// __SW_VERSION__ is stamped at build time by scripts/stamp-sw-version.mjs
// (deploy commit sha, or timestamp locally). Every deploy therefore publishes
// new cache names, and the existing cleanup pass deletes the old caches - 
// no manual 'v2' bumping. Unstamped file (raw dev serve) falls back to 'dev'.
const SW_VERSION = (() => {
  const v = '__SW_VERSION__';
  return v.startsWith('__SW') ? 'dev' : v; // 'dev' when served unstamped
})();

const CACHE_NAMES = {
  STATIC: `heartsync-static-${SW_VERSION}`,
  ARTICLES: `heartsync-articles-${SW_VERSION}`,
  IMAGES: `heartsync-images-${SW_VERSION}`,
  OFFLINE: `heartsync-offline-${SW_VERSION}`,
};

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json',
  '/robots.txt',
];

// 1. INSTALL EVENT  - Pre-cache App Shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Heartsync SW] Pre-cache partial failure:', err);
      });
    })
  );
});

// 2. ACTIVATE EVENT  - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[Heartsync SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT  - Smart Caching Strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and browser extensions
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Navigation / HTML Requests  - Network First, Fallback to Cached SPA Index or Offline Fallback
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAMES.STATIC).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Attempt exact match from static or article cache first
          const cachedPage = await caches.match(req);
          if (cachedPage) return cachedPage;

          // SPA Fallback to /index.html so React client app loads and renders offline bookmarked state
          const indexPage = await caches.match('/index.html');
          if (indexPage) return indexPage;

          // Final Offline HTML Fallback Response
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Heartsync  - Offline Cozy Reader</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
                .card { background: #18181b; border: 1px solid #27272a; padding: 32px; border-radius: 24px; max-width: 480px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .icon { font-size: 48px; margin-bottom: 16px; display: inline-block; }
                h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #fb7185; }
                p { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }
                .btn { display: inline-block; background: #e11d48; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 14px; transition: background 0.2s; }
                .btn:hover { background: #be123c; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">🌿</div>
                <h1>Cozy Reader  - Offline Mode</h1>
                <p>Your internet connection is currently taking a peaceful break. Reconnect or tap below to open your saved relationship guides.</p>
                <a href="/" class="btn">View Saved Bookmarks</a>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // B. Article API Requests (/api/posts, /api/articles, etc.)  - Network First with Article Cache Fallback
  if (url.pathname.includes('/api/posts') || url.pathname.includes('/api/article')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAMES.ARTICLES).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedApi = await caches.match(req);
          if (cachedApi) return cachedApi;
          return new Response(JSON.stringify({ offline: true, message: 'Serving cached articles state' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // C. Image Assets  - Cache First with Stale-While-Revalidate Fallback
  if (req.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp|svg|gif|ico)$/i)) {
    event.respondWith(
      caches.match(req).then((cachedImage) => {
        if (cachedImage) {
          // Revalidate in background
          fetch(req).then((netImage) => {
            if (netImage && netImage.ok) {
              caches.open(CACHE_NAMES.IMAGES).then((cache) => cache.put(req, netImage));
            }
          }).catch(() => {});
          return cachedImage;
        }

        return fetch(req).then((netImage) => {
          if (netImage && netImage.ok) {
            const copy = netImage.clone();
            caches.open(CACHE_NAMES.IMAGES).then((cache) => cache.put(req, copy));
          }
          return netImage;
        }).catch(() => {
          // Fallback SVG placeholder image when completely offline
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
              <rect width="400" height="300" fill="#18181b"/>
              <circle cx="200" cy="130" r="40" fill="#27272a"/>
              <path d="M185 130 C185 115, 200 110, 200 125 C200 110, 215 115, 215 130 C215 142, 200 152, 200 152 C200 152, 185 142, 185 130 Z" fill="#e11d48"/>
              <text x="200" y="210" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="12" font-weight="bold">HEARTSYNC COZY OFFLINE IMAGE</text>
            </svg>`,
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        });
      })
    );
    return;
  }

  // D. Other Static Assets (JS, CSS, Fonts)  - Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAMES.STATIC).then((cache) => cache.put(req, copy));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise || fetch(req);
    })
  );
});

// 4. MESSAGE EVENT  - Manual Pre-caching for Bookmarked Articles
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};

  if (type === 'CACHE_BOOKMARKED_ARTICLES' && Array.isArray(payload?.posts)) {
    console.log(`[Heartsync SW] Pre-caching ${payload.posts.length} bookmarked articles for offline reading...`);
    const articleCache = await caches.open(CACHE_NAMES.ARTICLES);
    const imageCache = await caches.open(CACHE_NAMES.IMAGES);

    for (const post of payload.posts) {
      if (!post || !post.id) continue;

      // 1. Cache synthetic post API payload
      const postUrl = `/post/${post.slug || post.id}`;
      const apiResponse = new Response(JSON.stringify(post), {
        headers: { 'Content-Type': 'application/json', 'X-Heartsync-Cached': 'true' },
      });
      await articleCache.put(`/api/post/${post.id}`, apiResponse.clone());
      await articleCache.put(postUrl, new Response(`<!DOCTYPE html><html><head><title>${post.title}</title></head><body>Offline Cached Post: ${post.title}</body></html>`, { headers: { 'Content-Type': 'text/html' } }));

      // 2. Pre-cache featured image & author image if available
      const imageUrlsToFetch = [post.image, post.featured_image, post.author_avatar, post.author?.avatar].filter(Boolean);
      for (const imgUrl of imageUrlsToFetch) {
        try {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
            const fetchedImg = await fetch(imgUrl, { mode: 'no-cors' });
            if (fetchedImg) {
              await imageCache.put(imgUrl, fetchedImg);
            }
          }
        } catch (_) {
          // Skip individual image fetch errors silently
        }
      }
    }

    // Report completion to client
    event.ports[0]?.postMessage({ status: 'SUCCESS', count: payload.posts.length });
  }

  if (type === 'UNCACHE_ARTICLE' && payload?.postId) {
    const articleCache = await caches.open(CACHE_NAMES.ARTICLES);
    await articleCache.delete(`/api/post/${payload.postId}`);
    event.ports[0]?.postMessage({ status: 'DELETED', postId: payload.postId });
  }

  if (type === 'CHECK_CACHED_POST_IDS') {
    const articleCache = await caches.open(CACHE_NAMES.ARTICLES);
    const keys = await articleCache.keys();
    const cachedIds = keys
      .map(k => {
        const match = k.url.match(/\/api\/post\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    event.ports[0]?.postMessage({ cachedIds });
  }
});
