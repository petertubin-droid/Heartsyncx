-- 2026-09-25 · Activate the previously-blank admin panes with real
-- database backing. Run once in the Supabase SQL editor.
-- Tables: translation_overrides, tenant_domains, sentiment_scans.
-- (Page builder drafts, acoustic presets and AI feature toggles persist
--  inside site_settings JSONB, so they need no new tables.)

CREATE TABLE IF NOT EXISTS public.translation_overrides (
  id TEXT PRIMARY KEY,
  language_code TEXT NOT NULL,
  string_key TEXT NOT NULL,
  custom_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (language_code, string_key)
);

CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  site_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sentiment_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,           -- 'post' | 'comment'
  target_id TEXT,                      -- FK-less reference to posts/comments
  target_title TEXT DEFAULT '',
  sentiment TEXT NOT NULL DEFAULT 'neutral',  -- positive | neutral | negative | crisis
  risk_level TEXT NOT NULL DEFAULT 'low',     -- low | moderate | high
  summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- The server writes these tables with the service role; anonymous reads
-- are limited to translation overrides (needed to localize the public UI).
ALTER TABLE public.translation_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY translation_overrides_public_read ON public.translation_overrides
  FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_scans ENABLE ROW LEVEL SECURITY;
