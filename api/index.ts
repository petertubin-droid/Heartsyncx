/**
 * Vercel serverless entrypoint for the Heartsync Express app.
 *
 * vercel.json rewrites /api/*, /article/*, and /category/* here, so the
 * Express runtime (API routes, auth profile sync, payment webhooks, dynamic
 * SEO meta injection) runs on the same Vercel deployment as the static
 * build. Static assets and generated sitemap.xml/robots.txt are served
 * straight from the filesystem by Vercel's CDN and never hit this function.
 */
import type { Request, Response, NextFunction } from 'express';
import { app, registerProductionRoutes } from '../server';

let readyPromise: Promise<void> | null = null;

export default async function handler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!readyPromise) {
      readyPromise = registerProductionRoutes().catch((err) => {
        // Reset so a cold-start failure doesn't poison the instance
        readyPromise = null;
        throw err;
      });
    }
    await readyPromise;
    return app(req, res, next);
  } catch (err: any) {
    // Never let the boot failure reject the handler promise: Vercel renders
    // an opaque FUNCTION_INVOCATION_FAILED for that. Respond with a visible,
    // diagnosable 500 instead.
    readyPromise = null;
    console.error('[api] boot failure:', err);
    const detail = String((err && (err.stack || err.message)) || err);
    try {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'server boot failure', detail }));
      } else {
        res.end();
      }
    } catch (_) {
      // response already gone; nothing more we can do
    }
  }
}
