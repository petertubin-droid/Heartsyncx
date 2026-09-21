/**
 * Stamps __SW_VERSION__ in dist/sw.js with the deploy commit sha (or a UTC
 * timestamp for local builds) so every deploy publishes fresh service-worker
 * cache names automatically  - the manual 'v2' bump process is gone.
 */
import { readFileSync, writeFileSync } from 'fs';

const sha = (process.env.VERCEL_GIT_COMMIT_SHA || '').trim();
const version = sha ? sha.slice(0, 10) : `local-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 12)}`;

const path = new URL('../dist/sw.js', import.meta.url);
let src = readFileSync(path, 'utf8');
src = src.replace(/__SW_VERSION__/g, version);
writeFileSync(path, src);
console.log(`stamp-sw-version: service worker caches stamped with ${version}`);
