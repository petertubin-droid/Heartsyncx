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
  if (!readyPromise) {
    readyPromise = registerProductionRoutes().catch((err) => {
      // Reset so a cold-start failure doesn't poison the instance
      readyPromise = null;
      throw err;
    });
  }
  await readyPromise;
  return app(req, res, next);
}
