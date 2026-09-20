-- ============================================================================
-- HEARTSYNC / WELLNESS COUPLES SUPABASE PRODUCTION DATABASE SCHEMA
-- ============================================================================
-- Fully compliant with Supabase Auth (auth.users), Row Level Security (RLS),
-- Security Definer helper functions, automated user profile triggers, and Storage.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & SCHEMAS
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS & AUTOMATED TRIGGERS
-- ----------------------------------------------------------------------------

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Definer function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  user_role text;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check service_role JWT
  IF (auth.jwt() ->> 'role') = 'service_role' THEN
    RETURN true;
  END IF;

  -- Check profiles table role
  SELECT role INTO user_role FROM public.profiles WHERE id = current_user_id;
  IF user_role IN ('admin', 'superadmin', 'Administrator', 'Editor', 'Super Admin') THEN
    RETURN true;
  END IF;

  -- Check admin_users table
  IF EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id::text = current_user_id::text 
       OR email = (SELECT email FROM auth.users WHERE id = current_user_id)
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.role() = 'authenticated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. USER PROFILES & AUTH SYNCHRONIZATION
-- ----------------------------------------------------------------------------

-- Public User Profiles Table (Maps directly to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  bio TEXT,
  website TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger function to handle new auth.users signup
-- SECURITY FIX: is_suspended is read by the admin middleware
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    'user' -- SECURITY: role is NEVER taken from client signup metadata
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'Administrator',
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Mapping Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'en',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action TEXT NOT NULL,
  user_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. SITE CONFIGURATION & BRANDING
-- ----------------------------------------------------------------------------

-- Site Settings Singleton Table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  site_name TEXT DEFAULT 'Heartsync Wellness',
  tagline TEXT DEFAULT 'Scientific Relationship Guidance & Emotional Alignment',
  logo_url TEXT,
  favicon_url TEXT,
  header_style TEXT DEFAULT 'blur',
  layout_width TEXT DEFAULT 'contained',
  primary_color TEXT DEFAULT '#ec4899',
  secondary_color TEXT DEFAULT '#8b5cf6',
  font_family TEXT DEFAULT 'Plus Jakarta Sans',
  brand_animation TEXT DEFAULT 'fade',
  custom_css TEXT,
  footer_text TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. CONTENT MANAGEMENT & BLOG
-- ----------------------------------------------------------------------------

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#ec4899',
  icon TEXT,
  parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authors Table
CREATE TABLE IF NOT EXISTS public.authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'Author',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts / Articles Table
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id TEXT REFERENCES public.authors(id) ON DELETE SET NULL,
  featured_image TEXT,
  status TEXT DEFAULT 'published',
  is_featured BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  reading_time INT DEFAULT 5,
  tags JSONB DEFAULT '[]'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Pages Table
CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  page_type TEXT DEFAULT 'custom',
  is_deleted BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  parent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactive Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. SUBSCRIPTIONS, MONETIZATION & BILLING
-- ----------------------------------------------------------------------------

-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  plan_id TEXT REFERENCES public.plans(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  cancel_at_period_end BOOLEAN DEFAULT false,
  gateway TEXT DEFAULT 'stripe',
  gateway_subscription_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed',
  payment_method TEXT DEFAULT 'credit_card',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorship Campaigns Table
CREATE TABLE IF NOT EXISTS public.sponsorship_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Zones Table
CREATE TABLE IF NOT EXISTS public.ad_zones (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  code_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Providers Table
CREATE TABLE IF NOT EXISTS public.ad_providers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Direct',
  status TEXT DEFAULT 'Active',
  fill_rate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. ENGAGEMENT & COMMUNICATIONS
-- ----------------------------------------------------------------------------

-- Subscribers Table (Newsletter Leads)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'website',
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  category TEXT DEFAULT 'transactional',
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  target_audience TEXT DEFAULT 'all',
  sent_count INT DEFAULT 0,
  open_rate NUMERIC DEFAULT 0,
  click_rate NUMERIC DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. INTEGRATIONS & APIS
-- ----------------------------------------------------------------------------

-- Integrations Catalog Table
CREATE TABLE IF NOT EXISTS public.integrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'connected',
  endpoint_url TEXT,
  api_key_masked TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Settings Table
-- Code-accurate key/value integration settings store (matches /api/admin/integrations/*)
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_integration_settings_integration
  ON public.integration_settings (integration_id);

-- Integration Categories Table
CREATE TABLE IF NOT EXISTS public.integration_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Integration Logs Table
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id TEXT PRIMARY KEY,
  integration_id TEXT,
  action TEXT,
  status TEXT DEFAULT 'success',
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  webhook_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  response_status INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. RSS FEEDS & AI GENERATIONS
-- ----------------------------------------------------------------------------

-- RSS Feeds Table
CREATE TABLE IF NOT EXISTS public.rss_feeds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  last_sync TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. MEDIA & ANALYTICS
-- ----------------------------------------------------------------------------

-- Media Uploads Table
CREATE TABLE IF NOT EXISTS public.media (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT,
  size INT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic Analytics Table
CREATE TABLE IF NOT EXISTS public.analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  path TEXT NOT NULL,
  views INT DEFAULT 1,
  unique_visitors INT DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE
);

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Function to enable RLS across all tables in public schema
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.table_name);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- POLICIES: PUBLIC CATALOG READ ACCESS
-- Allow anonymous & authenticated visitors to view published site content
-- ----------------------------------------------------------------------------

-- Profiles: Public select
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

-- Posts
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (status = 'published' OR public.is_admin());

-- Authors, Tags, Featured & Trending
DROP POLICY IF EXISTS "Public read authors" ON public.authors;
CREATE POLICY "Public read authors" ON public.authors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tags" ON public.tags;
CREATE POLICY "Public read tags" ON public.tags FOR SELECT USING (true);

-- Pages & Banners
DROP POLICY IF EXISTS "Public read pages" ON public.pages;
CREATE POLICY "Public read pages" ON public.pages FOR SELECT USING (is_deleted = false OR public.is_admin());

-- Site & SEO Settings
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

-- Plans & Sponsorships
DROP POLICY IF EXISTS "Public read plans" ON public.plans;
CREATE POLICY "Public read plans" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sponsorship_campaigns" ON public.sponsorship_campaigns;
CREATE POLICY "Public read sponsorship_campaigns" ON public.sponsorship_campaigns FOR SELECT USING (true);

-- Media
DROP POLICY IF EXISTS "Public read media" ON public.media;
CREATE POLICY "Public read media" ON public.media FOR SELECT USING (true);

-- Subscribers
DROP POLICY IF EXISTS "Public insert subscribers" ON public.subscribers;
CREATE POLICY "Public insert subscribers" ON public.subscribers FOR INSERT WITH CHECK (true);

-- Comments
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (is_approved = true OR public.is_admin());

DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" ON public.comments FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- POLICIES: AUTHENTICATED USER DATA ACCESS
-- Restrict personal settings, subscriptions, and usage data to respective users
-- ----------------------------------------------------------------------------

-- Subscriptions
DROP POLICY IF EXISTS "Users select own subscriptions" ON public.subscriptions;
CREATE POLICY "Users select own subscriptions" ON public.subscriptions 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- User Settings
DROP POLICY IF EXISTS "Users select own settings" ON public.user_settings;
CREATE POLICY "Users select own settings" ON public.user_settings 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own settings" ON public.user_settings;
CREATE POLICY "Users update own settings" ON public.user_settings 
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: ADMINISTRATOR FULL MANAGEMENT BYPASS
-- Grant full ALL privileges to administrators or service_role across all tables
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Admin full access %I" ON public.%I;
      CREATE POLICY "Admin full access %I" ON public.%I 
      FOR ALL 
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
    ', rec.table_name, rec.table_name, rec.table_name, rec.table_name);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- SECURITY HARDENING: profiles PII column protection
-- Row policies stay as-is, but the email/metadata columns are no longer
-- readable by the public anon role (or other authenticated users).
-- ----------------------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, bio, website, role, is_suspended, created_at, updated_at)
  ON public.profiles TO anon, authenticated;
REVOKE UPDATE ON public.profiles FROM anon;
GRANT UPDATE (full_name, avatar_url, bio, website) ON public.profiles TO authenticated;

-- ----------------------------------------------------------------------------
-- SECURITY FIX: users must be able to create their own user_settings rows
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own settings" ON public.user_settings;
CREATE POLICY "Users insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- DIGITAL PRODUCTS (H-06): fully DB-backed catalog + order ledger. Orders are
-- created ONLY by verified payment webhooks (service role). The download RPC
-- is the single anonymous access path (token = capability).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.digital_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  cover_image TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  file_type TEXT DEFAULT 'pdf',
  category TEXT DEFAULT 'E-Books & Workbooks',
  tags JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  total_sales INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.digital_product_orders (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  download_token TEXT NOT NULL UNIQUE,
  download_count INT DEFAULT 0,
  status TEXT DEFAULT 'completed',
  gateway TEXT,
  transaction_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active digital products" ON public.digital_products;
CREATE POLICY "Public read active digital products" ON public.digital_products
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin full access digital products" ON public.digital_products;
CREATE POLICY "Admin full access digital products" ON public.digital_products
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin full access digital product orders" ON public.digital_product_orders;
CREATE POLICY "Admin full access digital product orders" ON public.digital_product_orders
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.digital_product_download(p_token TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o RECORD;
  p RECORD;
BEGIN
  SELECT * INTO o FROM public.digital_product_orders
    WHERE download_token = p_token AND status = 'completed'
    LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF o.expires_at IS NOT NULL AND o.expires_at < NOW() THEN
    RETURN NULL;
  END IF;
  SELECT file_url INTO p FROM public.digital_products WHERE id = o.product_id LIMIT 1;
  UPDATE public.digital_product_orders
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = o.id;
  RETURN jsonb_build_object(
    'product_title', o.product_title,
    'file_url', p.file_url,
    'user_email', o.user_email,
    'expires_at', o.expires_at
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- SCHEMA DRIFT FIX: site_settings columns the server actually writes
-- (ads sync + TTS settings singletons from /api/state and /api/admin/tts/save)
-- ----------------------------------------------------------------------------
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS ads_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsense_publisher_id TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS raw_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS ad_slots JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_global_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_default_voice TEXT DEFAULT 'female';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_default_speed NUMERIC DEFAULT 1.0;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_player_position TEXT DEFAULT 'top';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_player_style TEXT DEFAULT 'button';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_voice_gender TEXT DEFAULT 'female';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_selected_voice TEXT DEFAULT 'Rachel';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_provider TEXT DEFAULT 'elevenlabs';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_selected_voice_id TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_stability NUMERIC DEFAULT 0.55;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_similarity_boost NUMERIC DEFAULT 0.75;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_style NUMERIC DEFAULT 0.0;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_last_voice_sync TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_default_pitch NUMERIC DEFAULT 1.0;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_default_volume NUMERIC DEFAULT 1.0;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_pronunciation_rules TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tts_voice_cache JSONB DEFAULT '[]'::jsonb;

-- ----------------------------------------------------------------------------
-- ENGAGEMENT COUNTERS: anonymous readers may ONLY increment likes/views/reactions
-- through this SECURITY DEFINER RPC — they have no direct UPDATE access to posts.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_post_engagement(
  p_post_id TEXT,
  p_likes_delta INT DEFAULT 0,
  p_views_delta INT DEFAULT 0,
  p_reaction_key TEXT DEFAULT NULL
)
RETURNS SETOF public.posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_likes_delta < 0 OR p_likes_delta > 1 THEN
    RAISE EXCEPTION 'invalid likes delta';
  END IF;
  IF p_views_delta < 0 OR p_views_delta > 100 THEN
    RAISE EXCEPTION 'invalid views delta';
  END IF;

  RETURN QUERY UPDATE public.posts SET
    likes = likes + p_likes_delta,
    views = views + p_views_delta,
    reactions = CASE
      WHEN p_reaction_key IS NULL THEN reactions
      ELSE jsonb_set(
        COALESCE(reactions, '{"love":0,"insightful":0,"support":0,"warmth":0}'::jsonb),
        ARRAY[p_reaction_key],
        to_jsonb(COALESCE((COALESCE(reactions, '{}'::jsonb) ->> p_reaction_key)::int, 0) + 1),
        true
      )
    END
  WHERE id = p_post_id
  RETURNING *;
END;
$$;

-- ----------------------------------------------------------------------------
-- SECURITY CLEANUP: API keys must NEVER live in site_settings (publicly readable).
-- Keys are server-environment-only (see .env.example). Scrub legacy values if the
-- columns exist from an older deployment.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  key_col TEXT;
BEGIN
  FOREACH key_col IN ARRAY ARRAY['gemini_api_key','elevenlabs_api_key','supabase_key','recaptcha_secret_key','extra_api_keys']
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'site_settings' AND column_name = key_col
    ) THEN
      EXECUTE format('UPDATE public.site_settings SET %I = %L WHERE id = %L', key_col, CASE WHEN key_col = 'extra_api_keys' THEN '{}'::text ELSE '' END, 'singleton');
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 12. STORAGE BUCKET CREATION & POLICIES
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for media objects
DROP POLICY IF EXISTS "Public Media View" ON storage.objects;
CREATE POLICY "Public Media View" ON storage.objects 
FOR SELECT USING (bucket_id = 'media');

-- Authenticated and Admin upload access for media objects
DROP POLICY IF EXISTS "Admin & User Media Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Media Upload" ON storage.objects;
CREATE POLICY "Admin Media Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media' AND public.is_admin());


-- ------------------------------------------------------------------------
-- LEGACY LIVE-DB RECONCILIATION (idempotent)
-- The live project predates this schema; existing tables drifted. Add every
-- column the current app code and RLS policies require. Types mirror the
-- CREATE TABLE definitions above exactly.
-- ------------------------------------------------------------------------
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS path TEXT NOT NULL;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS views INT DEFAULT 1;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS unique_visitors INT DEFAULT 1;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id TEXT;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS content TEXT NOT NULL;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all';
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS sent_count INT DEFAULT 0;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS open_rate NUMERIC DEFAULT 0;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS click_rate NUMERIC DEFAULT 0;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS body_html TEXT NOT NULL;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'transactional';
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.email_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.integration_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.integration_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success';
ALTER TABLE public.integration_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.integration_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'connected';
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS endpoint_url TEXT;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS api_key_masked TEXT;
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS url TEXT NOT NULL;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS size INT;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS page_type TEXT DEFAULT 'custom';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reading_time INT DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT 'Scientific Relationship Guidance & Emotional Alignment';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS header_style TEXT DEFAULT 'blur';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS layout_width TEXT DEFAULT 'contained';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Plus Jakarta Sans';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS custom_css TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS footer_text TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'stripe';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS gateway_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS id TEXT DEFAULT gen_random_uuid()::text;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS webhook_id TEXT;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS response_status INT;


-- ----------------------------------------------------------------------------
-- 13. SEED INITIAL SINGLETON & ESSENTIAL DATA
-- ----------------------------------------------------------------------------

INSERT INTO public.site_settings (id, site_name, tagline) 
VALUES ('singleton', 'Heartsync Wellness', 'Scientific Relationship Guidance & Emotional Alignment')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plans (id, name, price, billing_cycle, features)
SELECT gen_random_uuid(), v.name, v.price, 'monthly', v.features::jsonb
FROM (VALUES
  ('Free Explorer', 0, '["Access to public articles", "Basic relationship quizzes"]'),
  ('Pro Couple', 19, '["Full premium article library", "Unlimited Gottman quizzes", "AI Relationship Copilot"]'),
  ('VIP Clinical Retreat', 49, '["1-on-1 therapist sessions", "Customized intimacy routines", "Priority support"]')
) AS v(name, price, features)
WHERE NOT EXISTS (SELECT 1 FROM public.plans);

-- ----------------------------------------------------------------------------
-- HEARTSYNC LOVEVAULT — private reader storage (vault items + journal entries)
-- Own-row access only; admins do not read private vault data.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.love_vault_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  kind TEXT DEFAULT 'memory',
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.love_vault_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner full access love vault" ON public.love_vault_items;
CREATE POLICY "Owner full access love vault" ON public.love_vault_items
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  prompt TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner full access journal" ON public.journal_entries;
CREATE POLICY "Owner full access journal" ON public.journal_entries
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ----------------------------------------------------------------------------
-- GDPR COMPLIANCE + DIAGNOSTICS PERSISTENCE (H-08): the GDPR DSR request ledger,
-- the privacy audit trail, and the diagnostic quiz results were in-memory
-- arrays in server.ts — real user GDPR requests vanished on every serverless
-- cold start. All three are now database-backed. Public inserts ride explicit
-- public INSERT policies (same pattern as subscribers/comments); ALL admin
-- management goes through is_admin() RLS policies. No anon SELECT ever.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id TEXT PRIMARY KEY,
  quiz_id TEXT,
  quiz_title TEXT NOT NULL,
  user_email TEXT NOT NULL,
  score INT,
  category_scores JSONB DEFAULT '{}'::jsonb,
  recommendation TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  session_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gdpr_audit_log (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  user_email TEXT,
  ip_hash TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gdpr_dsr_requests (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  reason TEXT,
  sla_deadline TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  certificate_id TEXT
);
ALTER TABLE public.gdpr_dsr_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert diagnostic results" ON public.diagnostic_results;
CREATE POLICY "Public insert diagnostic results" ON public.diagnostic_results
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public insert gdpr audit log" ON public.gdpr_audit_log;
CREATE POLICY "Public insert gdpr audit log" ON public.gdpr_audit_log
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public insert gdpr dsr requests" ON public.gdpr_dsr_requests;
CREATE POLICY "Public insert gdpr dsr requests" ON public.gdpr_dsr_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access diagnostic_results" ON public.diagnostic_results;
CREATE POLICY "Admin full access diagnostic_results" ON public.diagnostic_results
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin full access gdpr_audit_log" ON public.gdpr_audit_log;
CREATE POLICY "Admin full access gdpr_audit_log" ON public.gdpr_audit_log
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Admin full access gdpr_dsr_requests" ON public.gdpr_dsr_requests;
CREATE POLICY "Admin full access gdpr_dsr_requests" ON public.gdpr_dsr_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- H-08 COMPLETION: analytics page-view logging + feature-module registry.
-- POST /api/analytics previously incremented an in-memory object whose sync
-- silently dropped it — page views reset on every serverless cold start and
-- the analytics table stayed empty. Views now go through the SECURITY DEFINER
-- RPC log_page_view() (atomic UPSERT per day+path, anon-callable like
-- increment_post_engagement). The admin Feature Manager registry moves from a
-- module-scope array (lost on cold start) to the feature_modules table.
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS analytics_date_path_key
  ON public.analytics (date, path);

CREATE OR REPLACE FUNCTION public.log_page_view(p_path TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  IF p_path IS NULL OR length(trim(p_path)) = 0 OR length(p_path) > 512 THEN
    RAISE EXCEPTION 'invalid path';
  END IF;
  INSERT INTO public.analytics (path, views, unique_visitors, date)
  VALUES (p_path, 1, 1, CURRENT_DATE)
  ON CONFLICT (date, path) DO UPDATE
    SET views = public.analytics.views + 1
  RETURNING views INTO v_new_count;
  RETURN v_new_count;
END;
$$;
REVOKE ALL ON FUNCTION public.log_page_view(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_page_view(TEXT) TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.feature_modules (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feature_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin full access feature_modules" ON public.feature_modules;
CREATE POLICY "Admin full access feature_modules" ON public.feature_modules
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- ADSENSE SLOT CONFIGURATION (Monetization settings)
-- Per-placement AdSense unit ids, editable in Admin → Monetization.
-- ----------------------------------------------------------------------------
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsense_slot_header TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsense_slot_sidebar TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsense_slot_in_article TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsense_slot_footer TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsense_slot_homepage TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsense_slot_article_bottom TEXT;

-- ----------------------------------------------------------------------------
-- AD NETWORK PROVIDER CONFIGURATION (Monetag / Adsterra)
-- Site-wide snippets + per-slot Adsterra banner keys, admin-configurable.
-- ----------------------------------------------------------------------------
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS monetag_script_code TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_key_id TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_key_header TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_key_sidebar TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_key_in_article TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_key_footer TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_key_homepage TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_key_article_bottom TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_popunder_script TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_social_bar_script TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_interstitial_script TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS adsterra_inpage_push_script TEXT;
