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
RETURNS TRIGGER AS 845
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
845 LANGUAGE plpgsql SECURITY DEFINER;

-- Security Definer function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS 845
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
  IF user_role IN ('admin', 'superadmin', 'Administrator', 'Editor') THEN
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
845 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean AS 845
BEGIN
  RETURN (auth.role() = 'authenticated');
END;
845 LANGUAGE plpgsql SECURITY DEFINER;

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
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS 845
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
845 LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Legacy/Compatibility Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'user',
  avatar TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
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

-- SEO Settings Table
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  meta_title TEXT,
  meta_description TEXT,
  keywords JSONB DEFAULT '[]'::jsonb,
  og_image TEXT,
  twitter_card TEXT DEFAULT 'summary_large_image',
  canonical_url TEXT,
  robots_txt TEXT,
  sitemap_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Settings Table
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  default_provider TEXT DEFAULT 'gemini',
  default_model TEXT DEFAULT 'gemini-2.1-pro',
  system_prompt TEXT,
  api_keys JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Navigation Menu Table
CREATE TABLE IF NOT EXISTS public.navigation (
  id TEXT PRIMARY KEY DEFAULT 'main_header',
  items JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Footer Menu Table
CREATE TABLE IF NOT EXISTS public.footer (
  id TEXT PRIMARY KEY DEFAULT 'main_footer',
  sections JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotional Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  position TEXT DEFAULT 'top',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cookie Preferences Table
CREATE TABLE IF NOT EXISTS public.cookie_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  essential BOOLEAN DEFAULT true,
  analytics BOOLEAN DEFAULT false,
  marketing BOOLEAN DEFAULT false,
  functional BOOLEAN DEFAULT false,
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

-- Featured Posts Junction / Position Table
CREATE TABLE IF NOT EXISTS public.featured_posts (
  post_id TEXT PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trending Posts Table
CREATE TABLE IF NOT EXISTS public.trending_posts (
  post_id TEXT PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Related Posts Mapping Table
CREATE TABLE IF NOT EXISTS public.related_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  related_post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article Revisions Table
CREATE TABLE IF NOT EXISTS public.article_revisions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  revised_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_name TEXT NOT NULL,
  author_role TEXT,
  avatar_url TEXT,
  quote TEXT NOT NULL,
  rating INT DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redirects Table
CREATE TABLE IF NOT EXISTS public.redirects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_path TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  redirect_type INT DEFAULT 301,
  is_active BOOLEAN DEFAULT true,
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

-- Subscription History Table
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'paid',
  pdf_url TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'success',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Access Grants Table
CREATE TABLE IF NOT EXISTS public.premium_access (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  granted_by TEXT,
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

-- Advertisement Logs Table
CREATE TABLE IF NOT EXISTS public.advertisement_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewarded Unlock Sessions Table
CREATE TABLE IF NOT EXISTS public.rewarded_unlock_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  article_id TEXT,
  ad_watched BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewarded Unlock History Table
CREATE TABLE IF NOT EXISTS public.rewarded_unlock_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  article_id TEXT,
  reward_type TEXT,
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

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Email History Table
CREATE TABLE IF NOT EXISTS public.email_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Events Table
CREATE TABLE IF NOT EXISTS public.email_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  webhooks_enabled BOOLEAN DEFAULT true,
  zapier_key TEXT,
  slack_webhook_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Categories Table
CREATE TABLE IF NOT EXISTS public.integration_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Integration Logs Table
CREATE TABLE IF NOT EXISTS public.integration_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  integration_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  user_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Logs Table
CREATE TABLE IF NOT EXISTS public.api_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key_id TEXT,
  endpoint TEXT NOT NULL,
  status_code INT NOT NULL,
  response_time_ms INT,
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

-- RSS Imported Articles Table
CREATE TABLE IF NOT EXISTS public.rss_imported_articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feed_id TEXT REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSS Import History Table
CREATE TABLE IF NOT EXISTS public.rss_import_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feed_id TEXT,
  articles_imported INT DEFAULT 0,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Providers Catalog
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Content Generations History
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used TEXT,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Prompt History
CREATE TABLE IF NOT EXISTS public.ai_prompt_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  prompt TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Media Usage Junction Table
CREATE TABLE IF NOT EXISTS public.media_usage (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  media_id TEXT REFERENCES public.media(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
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

-- Dashboard Aggregated Stats Table
CREATE TABLE IF NOT EXISTS public.dashboard_stats (
  id TEXT PRIMARY KEY DEFAULT 'current',
  total_users INT DEFAULT 0,
  active_subscribers INT DEFAULT 0,
  monthly_revenue NUMERIC DEFAULT 0,
  total_articles INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Statistics Table
CREATE TABLE IF NOT EXISTS public.reading_statistics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT,
  post_id TEXT REFERENCES public.posts(id) ON DELETE CASCADE,
  time_spent_seconds INT DEFAULT 0,
  scroll_percentage INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Function to enable RLS across all tables in public schema
DO 845
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
END 845;

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

DROP POLICY IF EXISTS "Public read featured_posts" ON public.featured_posts;
CREATE POLICY "Public read featured_posts" ON public.featured_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read trending_posts" ON public.trending_posts;
CREATE POLICY "Public read trending_posts" ON public.trending_posts FOR SELECT USING (true);

-- Pages & Banners
DROP POLICY IF EXISTS "Public read pages" ON public.pages;
CREATE POLICY "Public read pages" ON public.pages FOR SELECT USING (is_deleted = false OR public.is_admin());

DROP POLICY IF EXISTS "Public read banners" ON public.banners;
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (is_active = true OR public.is_admin());

-- Site & SEO Settings
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read seo_settings" ON public.seo_settings;
CREATE POLICY "Public read seo_settings" ON public.seo_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read navigation" ON public.navigation;
CREATE POLICY "Public read navigation" ON public.navigation FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read footer" ON public.footer;
CREATE POLICY "Public read footer" ON public.footer FOR SELECT USING (true);

-- Plans & Sponsorships
DROP POLICY IF EXISTS "Public read plans" ON public.plans;
CREATE POLICY "Public read plans" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sponsorship_campaigns" ON public.sponsorship_campaigns;
CREATE POLICY "Public read sponsorship_campaigns" ON public.sponsorship_campaigns FOR SELECT USING (true);

-- Media
DROP POLICY IF EXISTS "Public read media" ON public.media;
CREATE POLICY "Public read media" ON public.media FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- POLICIES: PUBLIC FORM SUBMISSIONS
-- Allow visitors to subscribe, submit contact forms, and post approved comments
-- ----------------------------------------------------------------------------

-- Contact Messages
DROP POLICY IF EXISTS "Public insert contact_messages" ON public.contact_messages;
CREATE POLICY "Public insert contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

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
FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

-- User Settings
DROP POLICY IF EXISTS "Users select own settings" ON public.user_settings;
CREATE POLICY "Users select own settings" ON public.user_settings 
FOR SELECT USING (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own settings" ON public.user_settings;
CREATE POLICY "Users update own settings" ON public.user_settings 
FOR UPDATE USING (auth.uid()::text = user_id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- POLICIES: ADMINISTRATOR FULL MANAGEMENT BYPASS
-- Grant full ALL privileges to administrators or service_role across all tables
-- ----------------------------------------------------------------------------

DO 845
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
END 845;

-- ----------------------------------------------------------------------------
-- 12. STORAGE BUCKET CREATION & POLICIES
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true), ('heartsync-media', 'heartsync-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for media objects
DROP POLICY IF EXISTS "Public Media View" ON storage.objects;
CREATE POLICY "Public Media View" ON storage.objects 
FOR SELECT USING (bucket_id IN ('media', 'heartsync-media'));

-- Authenticated and Admin upload access for media objects
DROP POLICY IF EXISTS "Admin & User Media Upload" ON storage.objects;
CREATE POLICY "Admin & User Media Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id IN ('media', 'heartsync-media') AND (auth.role() = 'authenticated' OR public.is_admin()));

-- ----------------------------------------------------------------------------
-- 13. SEED INITIAL SINGLETON & ESSENTIAL DATA
-- ----------------------------------------------------------------------------

INSERT INTO public.site_settings (id, site_name, tagline) 
VALUES ('singleton', 'Heartsync Wellness', 'Scientific Relationship Guidance & Emotional Alignment')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.seo_settings (id, meta_title, meta_description) 
VALUES ('singleton', 'Heartsync - Clinical Relationship Insights', 'Discover evidence-based research on adult attachment, intimacy, and romantic communication.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_settings (id, default_provider, default_model) 
VALUES ('singleton', 'gemini', 'gemini-2.1-pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plans (id, name, price, billing_cycle, features) 
VALUES 
  ('plan-free', 'Free Explorer', 0, 'monthly', '["Access to public articles", "Basic relationship quizzes"]'::jsonb),
  ('plan-pro', 'Pro Couple', 19, 'monthly', '["Full premium article library", "Unlimited Gottman quizzes", "AI Relationship Copilot"]'::jsonb),
  ('plan-vip', 'VIP Clinical Retreat', 49, 'monthly', '["1-on-1 therapist sessions", "Customized intimacy routines", "Priority support"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

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
