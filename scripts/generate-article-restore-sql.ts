/**
 * RESTORE ARTICLE BODIES (2026-09-24)
 *
 * The phase-5 boot-state projection (list columns only) combined with the
 * full-state posts upsert in syncStateToSupabase wiped `posts.content` in
 * the live database: every admin save upserted all in-memory posts with
 * `content: ''`. The code paths are fixed (server.ts no longer syncs
 * content in the bulk upsert; store.ts updatePost no longer pushes an
 * empty body). This script regenerates the article bodies from the
 * authoritative in-repo corpus.
 *
 * Usage:
 *   npx tsx scripts/generate-article-restore-sql.ts
 *
 * Emits scripts/restore-article-content.sql — paste it into the Supabase
 * Dashboard SQL editor (or run via the Management API) against the
 * Heartsyncx project. Every statement is a guarded UPDATE keyed on slug:
 * it only fills EMPTY bodies, never overwrites an existing one.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MORE_POSTS } from '../src/utils/data/moreArticles';

const here = dirname(fileURLToPath(import.meta.url));

// Dollar-quote tag that cannot appear in the article bodies.
const TAG = '$hx_body$';
const sqlStr = (v: string) => `'${v.replace(/'/g, "''")}'`;
const posts = (MORE_POSTS as any[]).filter(p => p && p.slug && typeof p.content === 'string' && p.content.trim().length > 0);

const stmts: string[] = [];
for (const p of posts) {
  const body = p.content as string;
  if (body.includes(TAG)) throw new Error(`Body of "${p.slug}" contains the dollar-quote tag; pick another tag.`);
  stmts.push(
    `UPDATE public.posts SET\n  content = ${TAG}${body}${TAG}\nWHERE slug = ${sqlStr(p.slug)}\n  AND (content IS NULL OR btrim(content) = '');`
  );
}

const sql = [
  '-- ==========================================================',
  '-- Heartsyncx: restore article bodies wiped by the phase-5',
  '-- bulk-sync content bug (2026-09-24). Guarded: fills EMPTY',
  '-- bodies only, never overwrites an existing one.',
  '-- ==========================================================',
  'BEGIN;',
  ...stmts,
  'COMMIT;',
  '',
  `-- Restored ${posts.length} article bodies.`,
  ''
].join('\n\n');

const out = resolve(here, 'restore-article-content.sql');
mkdirSync(here, { recursive: true });
writeFileSync(out, sql, 'utf8');
console.log(`Wrote ${stmts.length} guarded UPDATE statements to ${out}`);
console.log('Slugs:', posts.map(p => p.slug).join(', '));
