-- Heartsyncx admin-sync migration (2026-09-24)
-- Run once in the Supabase SQL editor (Dashboard -> SQL Editor -> paste -> Run).
-- All statements are safe to re-run (IF NOT EXISTS).
--
-- Why: the live database drifted from the repo's schema.sql. The 2026-09-24
-- audit found admin writes targeting columns the live tables never had.
-- The code has been made schema-resilient (it strips missing columns and
-- retries), so the site now works WITHOUT this migration. Running it
-- additionally restores the few settings that currently have no DB home:
--   * categories.is_premium / price -> premium category gating survives reloads
--   * posts.allow_comments / price -> per-article comment toggle + premium price survive
--   * quizzes.article_id -> quiz-to-article link survives reloads
--   * webhook_targets table -> admin webhook configuration persists
-- Once these exist, the resilient writes automatically start populating them.

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS article_id TEXT;

CREATE TABLE IF NOT EXISTS public.webhook_targets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  event_type TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keep the anon read grant consistent with the 2026-09-22 incident fix.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
