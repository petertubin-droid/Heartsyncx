/**
 * Netlify serverless bridge for the Heartsync Express app.
 *
 * The same server (server.ts) that runs on Vercel (api/index.ts) and Cloud
 * Run also backs this function. Netlify redirects /api/*, /article/* and
 * /category/* here with status 200; static assets are served straight from
 * the publish directory (dist/) by Netlify's CDN and never hit this
 * function (redirects are skipped for paths that match existing files).
 *
 * Path handling: Netlify v1 events carry rawUrl (the ORIGINAL public URL).
 * serverless-http routes on event.path, which for internal redirects can
 * be the /.netlify/functions/... path — so we restore the public path from
 * rawUrl before handing the event over. A fallback normalizing middleware
 * in server.ts strips the internal prefix if rawUrl is ever absent.
 */
import serverless from 'serverless-http';
import { app, registerProductionRoutes } from '../../server';

let readyPromise: Promise<void> | null = null;
let bridge: ReturnType<typeof serverless> | null = null;

async function ensureReady() {
  if (!readyPromise) {
    readyPromise = registerProductionRoutes().catch((err) => {
      // Reset so a cold-start failure doesn't poison the instance
      readyPromise = null;
      throw err;
    });
    bridge = serverless(app);
  }
  await readyPromise;
}

export async function handler(
  event: any,
  context: any,
): Promise<any> {
  try {
    await ensureReady();
    if (!bridge) {
      return { statusCode: 500, body: JSON.stringify({ error: 'server bridge not initialized' }) };
    }
    // Restore the original public path (e.g. /api/state, /article/my-post)
    // so Express routes match the public URLs exactly.
    if (event && event.rawUrl) {
      try {
        event.path = new URL(event.rawUrl).pathname;
      } catch (_) { /* keep the platform-provided path */ }
    }
    return await bridge(event, context);
  } catch (err: any) {
    console.error('[netlify api] boot failure:', err);
    const detail = String((err && (err.stack || err.message)) || err);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'server boot failure', detail }),
    };
  }
}
