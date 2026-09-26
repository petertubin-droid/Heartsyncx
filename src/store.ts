/// <reference types="vite/client" />
import { SupabaseClient } from '@supabase/supabase-js';
import { cleanConfigValue, createSupabaseClient, isValidSupabaseConfig } from './lib/supabaseConfig';
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errorMsg,
    operationType,
    path
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { Quiz, QuizQuestion, Post, Category, Topic, Comment, AdZone, NewsletterSubscriber, SiteSettings, User, AnalyticsSummary, AuditLog, Author, Page, MediaItem, Plan, Subscription, Payment, ChatConversation, ChatMessage, ChatAttachment } from './types';
import { expandAllArticles, expandArticleContent } from './utils/articleExpander';
import { MORE_CATEGORIES, MORE_POSTS } from './utils/data/moreArticles';
import { syncBookmarksWithSW, uncacheArticleFromSW } from './utils/offlineCache';

// Seed data
/**
 * Smartly maps any historical, deleted, or unaligned category ID to one of the ten premium niches
 */
export function mapCategoryIdToNew(oldCatId: string, title?: string, tags?: string[]): string {
  if (!oldCatId) return 'cat-love-relationships';
  const normOld = oldCatId.toLowerCase();
  
  if (['cat-love-relationships', 'love-relationships', 'cat-relationship', 'relationship-advice'].includes(normOld)) return 'cat-love-relationships';
  if (['cat-dating-romance', 'dating-romance', 'cat-dating', 'dating-tips'].includes(normOld)) return 'cat-dating-romance';
  if (['cat-comm-connection', 'communication-emotional-connection', 'cat-communication', 'communication'].includes(normOld)) return 'cat-comm-connection';
  if (['cat-problems-breakups', 'relationship-problems-breakups', 'cat-breakups', 'cat-redflags'].includes(normOld)) return 'cat-problems-breakups';
  if (['cat-selflove-growth', 'self-love-personal-growth', 'cat-growth'].includes(normOld)) return 'cat-selflove-growth';

  const t = (title || '').toLowerCase();
  const tg = (tags || []).map(x => x.toLowerCase());

  if (t.includes('date') || t.includes('dating') || tg.includes('dating') || normOld.includes('dating')) return 'cat-dating-romance';
  if (t.includes('comm') || t.includes('listen') || t.includes('speak') || normOld.includes('comm')) return 'cat-comm-connection';
  if (t.includes('breakup') || t.includes('problem') || t.includes('grief') || normOld.includes('breakup')) return 'cat-problems-breakups';
  if (t.includes('self') || t.includes('growth') || normOld.includes('self')) return 'cat-selflove-growth';

  return 'cat-love-relationships';
}

const DEFAULT_CATEGORIES: Category[] = MORE_CATEGORIES;

const DEFAULT_POSTS: Post[] = MORE_POSTS;

const DEFAULT_COMMENTS: Comment[] = [];

export const DEFAULT_TOPICS: Topic[] = [];

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Heartsync',
  // Google Analytics 4 measurement ID (public by design - appears in every page's
  // HTML). ConsentProvider injects the gtag.js snippet on every page, but
  // only after the visitor grants analytics consent (Consent Mode v2).
  ga_measurement_id: 'G-FEJLEG7LRB',
  site_description: 'An elegant, science-backed platform exploring modern romance, emotional wellness, dating alignment, and intentional lifestyle content.',
  homepage_topics_title: 'EXPLORE BY TOPIC',
  homepage_topics_subheading: 'Explore expert insights, practical guidance, and inspiring stories across topics that matter most. Discover trusted resources designed to inform, support, and empower every step of your journey.',
  homepage_topics: DEFAULT_TOPICS,
  homepage_topics_columns: 3,
  homepage_topics_animations_enabled: true,
  logo_url: '/logo.png',
  header_settings: {
    logo_url: '/logo.png',
    site_name: 'Heartsync',
    tagline: 'wellness blog',
    menu_items: [
      { id: 'item-home', label: 'Home', url: 'home', enabled: true },
      { id: 'item-articles', label: 'Contents', url: 'articles', enabled: true },
      { id: 'item-trending', label: 'Trending', url: 'trending', enabled: true },
      { id: 'item-faq', label: 'FAQ', url: 'faq', enabled: true },
      { id: 'item-about', label: 'About', url: 'about', enabled: true },
      { id: 'item-contact', label: 'Contact', url: 'contact', enabled: true }
    ],
    primary_cta_text: 'Subscribe',
    primary_cta_url: 'newsletter',
    secondary_cta_text: 'Ask the AI Guide',
    secondary_cta_url: 'ai_copilot',
    sticky: true,
    bg_color: '#ffffff',
    text_color: '#18181b',
    primary_btn_bg: '#f43f5e',
    primary_btn_text: '#ffffff',
    secondary_btn_bg: '#ffffff',
    secondary_btn_text: '#18181b',
    transparency: 'blur',
    mobile_menu_bg: '#18181b',
    mobile_menu_text: '#ffffff'
  },
  hero_settings: {
    title: 'Healing, Love & Self-Growth',
    subtitle: 'Premium insights for building deeper connections and healthier relationships',
    badge_text: 'Welcome to HeartSync Journal',
    primary_cta_text: 'Explore Articles',
    primary_cta_url: 'articles',
    secondary_cta_text: 'Take Relationship Quiz',
    secondary_cta_url: 'quiz',
    trust_indicators: ['Expert Relationship Advice', 'Relationship & Dating Tips', 'Emotional Wellness Blog'],
    statistics: [
      { id: 'stat-1', label: 'readers', value: '0' },
      { id: 'stat-2', label: 'essays', value: '0' },
      { id: 'stat-3', label: 'with care', value: 'Curated' }
    ],
    testimonials: [],
    image_url: '',
    bg_image_url: '',
    video_url: '',
    align: 'center',
    bg_color: '#fdf2f8',
    text_color: '#1c1917',
    primary_btn_bg: '#e11d48',
    primary_btn_text: '#ffffff',
    secondary_btn_bg: '#ffffff',
    secondary_btn_text: '#1c1917',
    overlay_color: '#000000',
    overlay_opacity: 10,
    height: 'lg',
    element_order: ['badge', 'headline', 'description', 'buttons', 'media', 'statistics', 'testimonials'],
    enabled_sections: {
      badge: true,
      headline: true,
      description: true,
      buttons: true,
      statistics: true,
      testimonials: true,
      media: false
    }
  },
  adsense_client_id: '',
  adsense_active: true,
  adsense_slot_header: '',
  adsense_slot_sidebar: '',
  adsense_slot_in_article: '',
  adsense_slot_footer: '',
  adsense_slot_homepage: '',
  adsense_slot_article_bottom: '',
  monetag_active: false,
  monetag_zone_id: '',
  monetag_script_code: '',
  monetag_format: 'multitag',
  adsterra_active: false,
  adsterra_key_id: '',
  adsterra_script_code: '',
  adsterra_format: 'social_bar',
  adsterra_key_header: '',
  adsterra_key_sidebar: '',
  adsterra_key_in_article: '',
  adsterra_key_footer: '',
  adsterra_key_homepage: '',
  adsterra_key_article_bottom: '',
  adsterra_url_header: '',
  adsterra_url_sidebar: '',
  adsterra_url_in_article: '',
  adsterra_url_footer: '',
  adsterra_url_homepage: '',
  adsterra_url_article_bottom: '',
  adsterra_popunder_url: '',
  adsterra_popunder_script: '',
  monetag_loader_url: '',
  adsterra_social_bar_script: '',
  adsterra_interstitial_script: '',
  adsterra_inpage_push_script: '',
  banner_header_enabled: true,
  banner_sidebar_enabled: true,
  banner_footer_enabled: true,
  banner_in_article_enabled: true,
  newsletter_welcome_msg: 'Welcome to Heartsync. Our research-backed therapeutic insights and weekly guidance are on their way to your inbox.',
  ai_assistant_enabled: true,
  recaptcha_enabled: false,
  brand_font: 'Inter',
  brand_theme: 'Warm Pink (Heartsync Classic)',
  brand_animation: 'fade',
  sidebar_widgets: [
    {
      id: 'widget-author',
      title: 'Editorial Spotlight Author',
      type: 'author',
      content_text: 'Peter leads the structural research team here at Heartsync, mapping attachment theory markers across high stress couple careers.',
      is_active: true
    },
    {
      id: 'widget-links',
      title: 'Table of Connections',
      type: 'links',
      custom_links: [
        { label: 'The Triad of Relationship Attachment Styles', tab: 'article', arg: 'science-of-attachment-style' },
        { label: 'The Dreaded Anxious-Avoidant Loop Trap', tab: 'article', arg: 'science-of-attachment-style' },
        { label: 'Moving Safely Towards Secure Intimacy', tab: 'article', arg: 'science-of-attachment-style' }
      ],
      is_active: true
    },
    {
      id: 'widget-custom',
      title: 'Self-Care Reminder',
      type: 'custom_html',
      content_text: 'Slow down, breathe deeply, and nurture your attachment boundaries today.',
      is_active: true
    }
  ],
  footer_sections: [
    {
      id: 'footer-sec-topics',
      title: 'Topics',
      links: [
        { label: 'Emotional Wellness', tab: 'category', arg: 'emotional-wellness' },
        { label: 'Relationship Science', tab: 'category', arg: 'relationship-science' },
        { label: 'Mindful Dating', tab: 'category', arg: 'mindful-dating' },
        { label: 'Self Growth', tab: 'category', arg: 'self-growth' }
      ],
      is_active: true
    },
    {
      id: 'footer-sec-platform',
      title: 'Platform',
      links: [
        { label: 'Help & FAQ', tab: 'faq' },
        { label: 'Advertise With Us', tab: 'advertise' },
        { label: 'LoveVault', tab: 'lovevault' },
        { label: 'AI Guide', tab: 'ai_copilot' },
        { label: 'About Heartsync', tab: 'about' }
      ],
      is_active: true
    },
    {
      id: 'footer-sec-legal',
      title: 'Legal Boundaries',
      links: [
        { label: 'Terms of Service', tab: 'terms' },
        { label: 'Privacy Policy', tab: 'privacy' },
        { label: 'Cookie Policy', tab: 'cookies' },
        { label: 'Disclaimer Statement', tab: 'disclaimer' }
      ],
      is_active: true
    }
  ],
  social_links: {
    facebook: 'https://facebook.com/heartsync',
    instagram: 'https://instagram.com/heartsync',
    twitter: 'https://twitter.com/heartsync',
    pinterest: 'https://pinterest.com/heartsync',
    tiktok: 'https://www.tiktok.com/@heartsync12'
  },
  social_tiktok_url: 'https://www.tiktok.com/@heartsync12',
  social_facebook_url: 'https://facebook.com/heartsync',
  social_twitter_url: 'https://twitter.com/heartsync',
  social_instagram_url: 'https://instagram.com/heartsync',
  social_linkedin_url: 'https://linkedin.com/company/heartsync',
  social_youtube_url: 'https://youtube.com/@heartsync',
  related_block_enabled: true,
  related_block_title: 'You may also like',
  related_block_count: 3,
  related_block_style: 'grid',
  tts_global_enabled: true,
  tts_default_voice: 'female',
  tts_default_speed: 1.0,
  tts_player_position: 'top',
  tts_player_style: 'button',
  tts_voice_gender: 'female',
  tts_selected_voice: 'Rachel',
  tts_default_pitch: 1.0,
  tts_default_volume: 1.0,
  tts_pronunciation_rules: 'Heartsync: Heart Sync\nAI: Artificial Intelligence',
  tts_provider: 'elevenlabs',
  elevenlabs_api_key: '',
  tts_selected_voice_id: '',
  tts_voice_cache: null,
  tts_stability: 0.55,
  tts_similarity_boost: 0.75,
  tts_style: 0.0,
  tts_last_voice_sync: '',
  gemini_api_key: '',
  // Runtime config only  - no hardcoded fallbacks. Values arrive from the
  // VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY build env or from the server's
  // /api/state site_settings payload.
  supabase_url: '',
  supabase_key: '',
  recaptcha_site_key: '',
  extra_api_keys: [],

  // Site-wide Meta Tags and Open Graph Settings Defaults
  seo_site_title: 'Heartsync  - Mindful Insights for Connected Hearts',
  seo_site_description: 'An elegant, science-backed platform exploring modern romance, emotional wellness, dating alignment, and intentional lifestyle content.',
  seo_site_keywords: 'relationship coaching, couples connection, attachment styles, somatic healing, conscious communication, emotional intimacy, validation, non-violent communication',
  seo_robots_tag: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  seo_google_verification: 'google9904a5acdaa0b412',
  og_site_name: 'Heartsync',
  og_title: 'Heartsync  - Mindful Insights for Connected Hearts',
  og_description: 'An elegant, science-backed platform exploring modern romance, emotional wellness, dating alignment, and intentional lifestyle content.',
  og_image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
  og_type: 'website',
  twitter_card: 'summary_large_image',
  twitter_creator: '@heartsync',
  twitter_site: '@heartsync',

  // Premium Article Experience Settings Defaults
  // NOTE: this is the client's INITIAL render state before /api/state
  // resolves the real persisted value from site_settings - keep it in sync
  // with the actual production default ('standard', the clean non-overlay
  // editorial layout). A mismatch here makes every article page load visibly
  // flash from this default hero style to the real one once settings arrive.
  article_hero_style: 'standard',
  article_font_family: 'Inter',
  article_font_size: 'base',
  article_line_height: 'relaxed',
  article_reading_progress_enabled: true,
  article_reading_progress_color: '#e11d48',
  article_table_of_contents_enabled: true,
  article_content_blocks_enabled: true,
  article_lightbox_enabled: true,
  article_zoom_enabled: true,
  article_image_credit_enabled: true,
  article_share_system_enabled: true,
  article_related_carousel_enabled: false,
  article_reaction_feedback_enabled: true,
  article_newsletter_box_enabled: true,
  article_newsletter_title: 'Nurture Your Relationship',
  article_newsletter_desc: 'Receive curated relationship and dating tips, emotional wellness insights, and healthy couples communication exercises every Tuesday.',
  article_newsletter_style: 'glowing',
  article_reading_themes_enabled: true,
  article_reading_theme_default: 'light',
  article_animations_enabled: true,
  article_sidebar_enabled: true,
  article_author_box_enabled: true,
  article_reading_time_enabled: true,
  article_atmospheric_linen: true,
  article_atmospheric_music_embedded: true,

  // Redesigned premium article display settings defaults
  article_layout: 'standard',
  article_magazine_mode: false,
  article_borderless_mode: false,
  article_sidebar_position: 'right',
  article_content_width: 'max-w-4xl',
  article_paragraph_spacing: 'space-y-6',
  article_heading_styles: 'serif-bold',

  article_meta_author_enabled: true,
  article_meta_date_enabled: true,
  article_meta_updated_date_enabled: true,
  article_meta_reading_time_enabled: true,
  article_meta_categories_enabled: true,
  article_meta_tags_enabled: true,
  article_meta_breadcrumbs_enabled: true,

  article_image_aspect_ratio: 'aspect-video',
  article_image_rounded_corners: 'rounded-2xl',
  article_image_caption_enabled: true,
  // Frelux-style default: the cover image sits BELOW the bordered meta row
  // (title → excerpt → meta → image), not between title and meta.
  article_image_position: 'below-meta',
  article_image_lazy_loading: true,

  article_prev_next_nav_enabled: true,
  article_comments_enabled: true,
  article_social_sharing_enabled: true,

  article_desktop_sidebar_visible: true,
  article_desktop_sidebar_width: 'w-80',
  article_desktop_sidebar_sticky: true,
  article_desktop_content_width: 'max-w-4xl',
  article_desktop_related_placement: 'bottom',

  article_mobile_header_spacing: 'py-4',
  article_mobile_image_height: 'h-64',
  article_mobile_sticky_actions: true,
  article_mobile_share_style: 'dock',
  article_mobile_progress_bar: true,

  expert_review_stamp_enabled: true,
  expert_reviewer_signature_text: 'Reviewed and Approved by Dr. Sarah Eldridge, PhD  - Relationship Advisor',
  expert_reviewer_credentials_desc: 'Certified Gottman Method Relationship Coach, specialization in somatic relational growth.',
  homepage_insights_title: 'Relationship Insights',
  homepage_insights_desc: 'Discover your attachment patterns, emotional needs, communication style, and relationship strengths in under 2 minutes.',
  homepage_insights_icon: 'Heart',
  homepage_insights_enabled: true,
  homepage_insights_order: 4,
  homepage_premium_title: 'UNLOCK PREMIUM ACCESS',
  homepage_premium_desc: 'Get unlimited access to relationship assessments, expert insights, workshops, growth tools, and exclusive member resources.',
  homepage_premium_cta_text: 'START FREE TRIAL',
  homepage_premium_enabled: true,
  homepage_premium_order: 5,
  homepage_categories_title: 'Explore by Topic',
  homepage_categories_subtitle: 'Dive into the subjects that matter most  - each curated with depth and intention.',
  homepage_categories_enabled: true,
  homepage_categories_order: 3,
  homepage_custom_categories: [],
  homepage_categories_columns_mobile: 2,
  homepage_categories_card_style: 'overlay',
  homepage_categories_aspect_ratio: '4/3',
  homepage_featured_title: 'Featured Insights',
  homepage_featured_enabled: true,
  homepage_featured_order: 1,
  homepage_featured_posts: [],
  featured_stories_count: 3,
  homepage_trending_title: 'Trending Now',
  homepage_trending_enabled: true,
  homepage_trending_order: 2,
  homepage_trending_posts: [],
  trending_count: 4,
  trending_display_limit: 6,
  featured_display_limit: 6,
  explore_topics_display_limit: 6,
  site_copyright_text: '',
  footer_compliance_badges_enabled: true,
  page_builder_sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      title: "Healing, Love & Self-Growth",
      subtitle: "Premium insights for building deeper connections and healthier relationships",
      buttonText: "Explore Articles",
      buttonUrl: "articles",
      secondaryButtonText: "Take Relationship Quiz",
      secondaryButtonUrl: "quiz",
      imageUrl: "",
      badgeText: "Welcome to HeartSync Journal",
      is_active: true
    },
    {
      id: 'sec-featured',
      type: 'featured_stories',
      title: "Featured Insights",
      is_active: true
    },
    {
      id: 'sec-trending',
      type: 'trending',
      title: "Trending Now",
      is_active: true
    },
    {
      id: 'sec-categories',
      type: 'categories',
      title: "Explore by Topic",
      subtitle: "Dive into the subjects that matter most  - each curated with depth and intention.",
      is_active: true
    },
    {
      id: 'sec-about',
      type: 'about',
      title: "About HeartSync Journal",
      is_active: true
    },
    {
      id: 'sec-newsletter',
      type: 'newsletter',
      title: "Join the HeartSync Journal",
      is_active: true
    }
  ],
  loader_enabled: true,
  loader_size: 'md',
  loader_speed: 'normal',
  loader_glow_intensity: 'medium',
  loader_overlay_opacity: 80,
  loader_text: 'Loading',
  loader_colors_light_primary: '#CE2B5E',
  loader_colors_light_secondary: '#f43f5e',
  loader_colors_dark_primary: '#06b6d4',
  loader_colors_dark_secondary: '#3b82f6',
};

const DEFAULT_ANALYTICS: AnalyticsSummary = {
  daily_views: [],
  category_distribution: [],
  engagement_rate: 0,
  total_users: 0,
  total_views: 0,
  total_likes: 0,
  ad_earnings: 0
};

const DEFAULT_USER: User = {
  id: '',
  email: '',
  name: '',
  role: 'reader',
  avatar_url: '',
  bio: '',
  created_at: new Date().toISOString()
};

const SYSTEM_AUTHORS: User[] = [];

const DEFAULT_AUTHORS: Author[] = [];

const DEFAULT_PAGES: Page[] = [];

const isSupabaseConfiguredGlobally = (): boolean => {
  try {
    const envUrl = cleanConfigValue(import.meta.env.VITE_SUPABASE_URL || '');
    const envKey = cleanConfigValue(import.meta.env.VITE_SUPABASE_ANON_KEY || '');

    if (isValidSupabaseConfig(envUrl, envKey)) {
      return true;
    }

    let storedSettings: any = null;
    const settingsStr = virtualStorageMap.get('hs_site_settings');
    if (settingsStr) {
      storedSettings = JSON.parse(settingsStr);
    }
    const url = cleanConfigValue(storedSettings?.supabase_url || '');
    const key = cleanConfigValue(storedSettings?.supabase_key || '');
    return isValidSupabaseConfig(url, key);
  } catch {
    return false;
  }
};

const isBlockedDatabaseCacheKey = (key: string): boolean => {
  const BLOCKED_KEYS = [
    'hs_posts', 'hs_categories', 'hs_comments', 'hs_ad_zones', 'hs_subscribers', 'hs_quizzes',
    'hs_site_settings', 'hs_analytics', 'hs_audit_logs', 'hs_media_library', 'hs_authors', 'hs_pages',
    'hs_plans', 'hs_subscriptions', 'hs_payments', 'hs_all_users', 'hs_global_premium_locked', 'hs_tags',
    'hs_podcasts', 'hs_rss_feeds', 'hs_webhook_targets', 'hs_webhook_logs',
    'hs_email_campaigns', 'hs_email_templates', 'hs_num_sentiment', 'pn_staff_users', 'hs_current_user',
    'hs_integrations_config', 'hs_bookmarks', 'hs_bookmarked_articles', 'pn_campaigns', 'hs_sponsorship_campaigns',
    'hs_digital_products', 'hs_rewarded_ad_config', 'pn_tags', 'pn_podcasts',
    'pn_rss_feeds', 'pn_moder_comments', 'pn_generated_sitemaps', 'pn_metadata_list'
  ];
  return BLOCKED_KEYS.includes(key) || key.startsWith('pn_brand_') || key.startsWith('pn_');
};

// Browser-storage exceptions (2026-09-26): the ONLY app data still allowed
// in window.localStorage. Cookie consent and the visitor/admin language
// choice must survive a page reload (re-prompting on every visit breaks ad
// consent and UX); Supabase manages its own auth session internally. ALL
// site content and configuration now lives in the database only - the store
// itself never touches window.localStorage anymore.
export function readVisitorPref<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (_) {
    return fallback;
  }
}
export function writeVisitorPref(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (_) { /* quota/private mode - best effort */ }
}

// Global In-Memory Storage Map replacing physical browser localStorage
export const virtualStorageMap: Map<string, string> = (() => {
  const m = new Map<string, string>();
  if (typeof window !== 'undefined') {
    if ((window as any).__virtualStorageMap) {
      return (window as any).__virtualStorageMap;
    }
    try {
      const originalLocalStorage = window.localStorage;
      if (originalLocalStorage) {
        for (let i = 0; i < originalLocalStorage.length; i++) {
          const key = originalLocalStorage.key(i);
          if (key && !isBlockedDatabaseCacheKey(key)) {
            const val = originalLocalStorage.getItem(key);
            if (val !== null) {
              m.set(key, val);
            }
          }
        }
      }
    } catch (_) {}
  }
  return m;
})();

const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    if (isBlockedDatabaseCacheKey(key)) {
      return defaultValue;
    }
    // Browser storage removal (2026-09-26): site data lives in the
    // in-memory virtual map + the database. Nothing reads window.localStorage
    // anymore; the map was seeded from it once at boot for migration.
    const stored = virtualStorageMap.get(key) ?? null;
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    
    // Safety check: if the default value is an array, the parsed value MUST be an array
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      return defaultValue;
    }
    // Safety check: if default value is a non-null object, parsed value must be a non-null object
    if (defaultValue !== null && typeof defaultValue === 'object' && (typeof parsed !== 'object' || parsed === null)) {
      return defaultValue;
    }
    
    // Safety check for user profiles to prevent empty {} or corrupt objects from bypassing checks
    if (key === 'hs_current_user' && parsed) {
      if (!parsed.id || !parsed.email || typeof parsed.name !== 'string') {
        return defaultValue;
      }
    }
    
    return parsed;
  } catch {
    return defaultValue;
  }
};

const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    if (isBlockedDatabaseCacheKey(key) && isSupabaseConfiguredGlobally()) {
      return;
    }
    if (value === null || value === undefined) {
      virtualStorageMap.delete(key);
      return;
    }
    // Browser storage removal (2026-09-26): memory only - the database is
    // the single source of truth, nothing persists to window.localStorage.
    virtualStorageMap.set(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing state to localStorage', error);
  }
};

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan-premium',
    name: 'HeartSync Premium',
    price_monthly: 9.99,
    price_yearly: 99.99,
    features: [
      'Full Access to Premium Articles',
      'Childhood Attachment Diagnostic Templates',
      'Interactive Emotional Affirmations Journal',
      'Downloadable Secure Boundary Building Roadmaps',
      'Ad-Free Aesthetic Reading Space'
    ]
  },
  {
    id: 'plan-plus',
    name: 'HeartSync Plus',
    price_monthly: 19.99,
    price_yearly: 199.99,
    features: [
      'Everything in HeartSync Premium',
      'Full "LoveVault" Relationship Sagas Library',
      'Weekly Curated Interactive Connection Challenges',
      'Guided Audio Mindfulness Meditation (30+ tracks)',
      'Priority Email Guidance'
    ]
  },
  {
    id: 'plan-inner-circle',
    name: 'Inner Circle',
    price_monthly: 49.99,
    price_yearly: 499.99,
    features: [
      'Everything in HeartSync Plus',
      'Primary Access to Future Premium AI Relationship Copilot',
      'Private LoveVault Secure Online Community Forums',
      '1x Dedicated Monthly Couples/Intimacy Coach Check-In',
      'Custom Elite Inner Circle Profile Emblem'
    ]
  }
];

const DEFAULT_USERS_LIST: User[] = [];

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [];

const DEFAULT_PAYMENTS_LIST: Payment[] = [];

// Deterministic helpers to map non-UUID text IDs to valid database UUIDs consistently
function toDbUUID(id: any): string | null {
  if (typeof id !== 'string') return null;
  const trimmed = id.trim();
  if (!trimmed) return null;

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const STATIC_ID_TO_UUID: Record<string, string> = {};

  if (STATIC_ID_TO_UUID[trimmed]) {
    return STATIC_ID_TO_UUID[trimmed];
  }

  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < trimmed.length; i++) {
    const charCode = trimmed.charCodeAt(i);
    h1 = Math.imul(h1 ^ charCode, 0x01000193);
    h2 = Math.imul(h2 ^ charCode, 0x01000193);
  }
  
  const part1 = ((h1 >>> 0).toString(16)).padStart(8, '0');
  const part2 = (((h1 ^ h2) >>> 16).toString(16)).padStart(4, '0');
  const part3 = (((h1 ^ h2) & 0xffff).toString(16)).padStart(4, '0');
  const part4 = ((h2 >>> 16).toString(16)).padStart(4, '0');
  const part5 = ((h2 >>> 0).toString(16)).padStart(12, '0');

  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

function fromDbUUID(dbId: any): string {
  if (typeof dbId !== 'string') return dbId;
  const normalized = dbId.trim().toLowerCase();
  
  const UUID_TO_STATIC_ID: Record<string, string> = {};

  if (UUID_TO_STATIC_ID[normalized]) {
    return UUID_TO_STATIC_ID[normalized];
  }
  return dbId;
}

function toCleanSupabasePost(post: any) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content || '',
    status: post.status || 'draft',
    publish_date: post.publish_date || new Date().toISOString(),
    featured_image: post.featured_image || '',
    read_time: Number(post.read_time) || 5,
    category_id: post.category_id,
    // posts.author_id is a plain TEXT id matching public.authors(id) - NOT a UUID.
    // Hashing it with toDbUUID produced fake UUIDs that violated the
    // posts_author_id_fkey and blocked every publish (2026-09-26 incident).
    author_id: post.author_id || null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    likes: Number(post.likes) || 0,
    reactions: post.reactions || { love: 0, insightful: 0, support: 0, warmth: 0 },
    views: Number(post.views) || 0,
    seo_title: post.seo_title || post.title || '',
    seo_description: post.seo_description || post.excerpt || '',
    keywords: Array.isArray(post.keywords) ? post.keywords : [],
    allow_comments: post.allow_comments !== false,
    is_premium: post.is_premium ?? false,
    price: Number(post.price) || 0,
    access_level: post.access_level || 'free',
    publish_at: post.publish_at || null,
    tts_enabled: post.tts_enabled ?? false,
    premium_access_type: post.premium_access_type || 'free',
    unlock_duration: Number(post.unlock_duration) || 24,
    ad_provider: post.ad_provider || 'adsense',
    daily_unlock_limit: Number(post.daily_unlock_limit) || 3,
    show_teaser: post.show_teaser !== false,
    preview_paragraphs: Number(post.preview_paragraphs) || 2,
    blur_content: post.blur_content !== false,
    show_subscription_cta: post.show_subscription_cta !== false,
    editorial_summary: post.editorial_summary || '',
    reflection_note: post.reflection_note || '',
    in_article_quote: post.in_article_quote || '',
    in_article_quote_author: post.in_article_quote_author || '',
    somatic_exercise_title: post.somatic_exercise_title || '',
    somatic_exercise_steps: post.somatic_exercise_steps || '',
    reflection_prompt: post.reflection_prompt || '',
    faq: Array.isArray(post.faq) ? post.faq : [],
    in_article_inserts: post.in_article_inserts || null
  };
}

function toCleanSupabasePostUpdate(updates: any) {
  const allowed = [
    'title', 'slug', 'excerpt', 'content', 'status', 'publish_date', 
    'featured_image', 'read_time', 'category_id', 'author_id', 'tags', 
    'likes', 'reactions', 'views', 'seo_title', 'seo_description', 
    'keywords', 'allow_comments', 'is_premium', 'price', 'access_level',
    'publish_at', 'tts_enabled', 'premium_access_type', 'unlock_duration',
    'ad_provider', 'daily_unlock_limit', 'show_teaser', 'preview_paragraphs',
    'blur_content', 'show_subscription_cta', 'editorial_summary', 'reflection_note',
    'in_article_quote', 'in_article_quote_author', 'somatic_exercise_title',
    'somatic_exercise_steps', 'reflection_prompt', 'faq', 'in_article_inserts'
  ];
  const cleaned: any = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      if (k === 'read_time' || k === 'likes' || k === 'views') {
        cleaned[k] = Number(updates[k]);
      } else if (k === 'author_id') {
        // Plain text id matching public.authors(id); never hashed (FK fix).
        cleaned[k] = updates[k] || null;
      } else {
        cleaned[k] = updates[k];
      }
    }
  }
  return cleaned;
}

function toBasicSupabasePost(post: any) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || '',
    content: post.content || '',
    status: post.status || 'draft',
    publish_date: post.publish_date || new Date().toISOString(),
    featured_image: post.featured_image || '',
    read_time: Number(post.read_time) || 5,
    category_id: post.category_id,
    // posts.author_id is a plain TEXT id matching public.authors(id) - NOT a UUID.
    // Hashing it with toDbUUID produced fake UUIDs that violated the
    // posts_author_id_fkey and blocked every publish (2026-09-26 incident).
    author_id: post.author_id || null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    likes: Number(post.likes) || 0,
    reactions: post.reactions || { love: 0, insightful: 0, support: 0, warmth: 0 },
    views: Number(post.views) || 0,
    seo_title: post.seo_title || post.title || '',
    seo_description: post.seo_description || post.excerpt || '',
    keywords: Array.isArray(post.keywords) ? post.keywords : [],
    allow_comments: post.allow_comments !== false
  };
}

function toBasicSupabasePostUpdate(updates: any) {
  const allowed = [
    'title', 'slug', 'excerpt', 'content', 'status', 'publish_date', 
    'featured_image', 'read_time', 'category_id', 'author_id', 'tags', 
    'likes', 'reactions', 'views', 'seo_title', 'seo_description', 
    'keywords', 'allow_comments'
  ];
  const cleaned: any = {};
  for (const k of allowed) {
    if (updates[k] !== undefined) {
      if (k === 'read_time' || k === 'likes' || k === 'views') {
        cleaned[k] = Number(updates[k]);
      } else if (k === 'author_id') {
        // Plain text id matching public.authors(id); never hashed (FK fix).
        cleaned[k] = updates[k] || null;
      } else {
        cleaned[k] = updates[k];
      }
    }
  }
  return cleaned;
}

export class HeartsyncStore {
  /** Parses a fetch Response body as JSON, tolerating non-JSON error
   *  bodies (e.g. an HTML 404/500 page from a misconfigured deploy) so a
   *  backend outage surfaces as a clear message instead of throwing a raw
   *  SyntaxError that silently aborts the auth flow. */
  private async safeJson(res: Response): Promise<any> {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (_) {
      return { error: `Unexpected server response (HTTP ${res.status}). Please try again shortly.` };
    }
  }

  public getLocalStorage<T>(key: string, defaultValue: T): T {
    return getLocalStorage<T>(key, defaultValue);
  }

  public setLocalStorage<T>(key: string, value: T): void {
    setLocalStorage<T>(key, value);
  }

  private _isInsideSaveState = false;
  // The promise of the save currently in flight, so concurrent callers
  // (logAction inside updateSettings, the admin console awaiting saveState)
  // join the SAME save instead of racing it or silently no-oping.
  private _activeSavePromise: Promise<any> | null = null;
  public supabase: SupabaseClient | null = null;
  public authLoading: boolean = true;
  public isGlobalLoading: boolean = false;
  private activeSupabaseUrl: string | null = null;
  private activeSupabaseKey: string | null = null;
  private authSubscription: any = null;
  private realtimeChannel: any = null;
  private nicheEnforced: boolean = false;
  private onStateChangeCallbacks: (() => void)[] = [];
  private toastListeners: Array<(msg: string, type?: 'success' | 'error' | 'info') => void> = [];
  private stateSyncTimeout: any = null;
  public syncError: string | null = null;
  public isSaving: boolean = false;

  // Active sync lists
  public plans: Plan[] = [];
  public subscriptions: Subscription[] = [];
  public payments: Payment[] = [];
  public all_users: User[] = [];
  public global_premium_locked: boolean = false;

  public current_user: User | null = null;
  public posts: Post[] = [];
  public categories: Category[] = [];
  public comments: Comment[] = [];

  // LoveVault  - private, user-scoped reader storage
  public vaultItems: Array<{
    id: string;
    user_id: string;
    kind: string;
    title: string;
    content: string;
    created_at: string;
  }> = [];
  public journalEntries: Array<{
    id: string;
    user_id: string;
    prompt: string | null;
    content: string;
    mood: string | null;
    created_at: string;
  }> = [];
  public ad_zones: AdZone[] = [];
  public subscribers: NewsletterSubscriber[] = [];
  public quizzes: Quiz[] = [];
  public site_settings: SiteSettings = DEFAULT_SETTINGS;
  /** Admin-authored translation overrides keyed by `${language_code}::${string_key}` (lowercased). */
  public translation_overrides: Record<string, string> = {};
  // True once the initial Supabase/server hydration pass has settled (success or
  // failure) - lets consumers distinguish "still loading defaults" from "confirmed
  // live state", so they don't overwrite real DB values with pre-hydration defaults.
  public serverStateLoaded: boolean = false;
  public pn_settings: Record<string, string> = {};
  public analytics: AnalyticsSummary = DEFAULT_ANALYTICS;
  public audit_logs: AuditLog[] = [];
  public bookmarks: string[] = [];
  public authors: Author[] = [];
  public pages: Page[] = [];
  public tags: any[] = [];
  public podcasts: any[] = [];
  public rss_feeds: any[] = [];
  public campaigns: any[] = [];
  public sponsorship_campaigns: any[] = [];
  public webhook_targets: any[] = [];
  public webhook_logs: any[] = [];
  public email_campaigns: any[] = [];
  public email_templates: any[] = [];
  public chat_conversations: ChatConversation[] = [];
  public chat_messages: ChatMessage[] = [];
  public media_library: (string | MediaItem)[] = [
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1464998857633-50e59fbf2fe6?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800'
  ];

  // ---- Server-state snapshot (fixes "reload shows the old website") ----
  // The store boots with the built-in seed catalog (35 seed essays, seed
  // menus/labels) and only swaps to the REAL database state once /api/state
  // resolves. That gap painted returning visitors the seed site on every
  // reload for 0.2-2s (or indefinitely on a failing first fetch) - reported
  // live as "reloading shows the old website until you refresh again".
  // Snapshotting the last good public /api/state payload and hydrating from
  // it on boot paints the current site instantly; the fresh /api/state call
  // then revalidates in the background.
  // Browser storage removal (2026-09-26): the server-state snapshot that
  // used to live in window.localStorage is gone. The site paints from the
  // bundled seed catalog and swaps to the authoritative /api/state payload
  // when it arrives - the database is the only persistent store.

  constructor() {
    this.loadState();
    this.initSupabaseConnection();
    this.loadServerState();
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushStateSync();
        if (this.realtimeChannel) {
          try {
            this.realtimeChannel.unsubscribe();
          } catch (_) {}
        }
      });
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('hs_')) {
          this.loadState();
          this.triggerUpdate();
        }
      });
    }
  }

  private isValidSupabaseConfig(url: string | null | undefined, key: string | null | undefined): boolean {
    return isValidSupabaseConfig(url, key);
  }

  public initSupabaseConnection() {
    const envUrl = cleanConfigValue(import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL || '');
    const envKey = cleanConfigValue(import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_ANON_KEY || '');

    let url = '';
    let key = '';

    if (this.isValidSupabaseConfig(envUrl, envKey)) {
      url = envUrl;
      key = envKey;
      console.log('🔌 Prioritizing workspace environment variables for Supabase connection. URL:', url);
    } else {
      url = cleanConfigValue(this.site_settings.supabase_url || '');
      key = cleanConfigValue(this.site_settings.supabase_key || '');
    }

    if (this.isValidSupabaseConfig(url, key)) {
      try {
        this.supabase = createSupabaseClient(url, key);
        this.activeSupabaseUrl = url;
        this.activeSupabaseKey = key;
        console.log('🔌 Supabase initialized successfully as primary database store. URL:', url);
        // Boot data comes from the single /api/state fetch (loadServerState,
        // called from the constructor)  - no duplicate full-table sync here.
        // syncWithSupabase remains available for explicit re-syncs.
        this.restoreSupabaseSession();
        this.subscribeToRealtime();
      } catch (err) {
        console.error('❌ Failed to initialize Supabase client:', err);
        this.supabase = null;
      }
    } else {
      this.supabase = null;
      this.activeSupabaseUrl = null;
      this.activeSupabaseKey = null;
      console.log('🔌 Supabase connection credentials not configured or invalid. Running in local fallback state.');
    }
  }

  private serverStateRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  /** Debounced /api/state refresh: realtime events arrive in bursts (a single
   *  admin save fires many postgres change events)  - collapse them into one
   *  trailing full-state fetch. */
  public queueServerStateRefresh(delayMs = 2000) {
    if (typeof window === 'undefined') return;
    if (this.serverStateRefreshTimer) clearTimeout(this.serverStateRefreshTimer);
    this.serverStateRefreshTimer = setTimeout(() => {
      this.serverStateRefreshTimer = null;
      this.loadServerState();
    }, delayMs);
  }

  public subscribeToRealtime() {
    if (!this.supabase) return;
    try {
      if (this.realtimeChannel) {
        try {
          this.realtimeChannel.unsubscribe();
        } catch (_) {}
      }
      console.log('⚡ [REALTIME] Subscribing to Supabase Realtime database event stream...');
      this.realtimeChannel = this.supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('⚡ [REALTIME EVENT] Received postgres change event:', payload.table, payload.eventType);
            this.queueServerStateRefresh();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('⚠️ Failed to initialize Supabase Realtime channel:', err);
    }
  }

  public async restoreSupabaseSession() {
    if (!this.supabase) {
      this.authLoading = false;
      this.triggerUpdate();
      return;
    }
    this.authLoading = true;
    try {
      // 1. Restore session dynamically on load
      const { data: { session }, error: sessionErr } = await this.supabase.auth.getSession();
      if (sessionErr) {
        console.warn('⚡ Error getting Supabase session:', sessionErr.message);
        return;
      }
      if (session && session.user) {
        console.log('🔄 Restoring session. Syncing profile with server...');
        const cleanEmail = (session.user.email || '').toLowerCase().trim();
        const syncRes = await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            userId: session.user.id,
            email: cleanEmail,
            name: session.user.user_metadata?.name || cleanEmail.split('@')[0] || 'Member',
            avatarUrl: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
          })
        });

        if (!syncRes.ok && (syncRes.status === 401 || syncRes.status === 403)) {
          // Only a real auth rejection (invalid/expired token, suspended
          // account) ends the session. Transient failures - a cold serverless
          // start (500), a network blip, a Supabase hiccup - previously
          // signed the admin out on every refresh; keep the session and
          // carry on with the stored identity instead.
          const errData = await this.safeJson(syncRes);
          console.error('❌ Session restore: auth rejected:', errData.error);
          await this.supabase.auth.signOut();
          this.current_user = null;
          this.triggerUpdate();
          return;
        }
        if (!syncRes.ok) {
          console.warn('⚡ Session restore: profile sync unavailable (status ' + syncRes.status + '); keeping the session.');
        }

        const syncData = await this.safeJson(syncRes);
        const profile = syncData.profile;

        if (profile) {
          if (profile.is_suspended) {
            console.warn('⚡ Session restore: Account is suspended');
            await this.supabase.auth.signOut();
            this.current_user = null;
            this.triggerUpdate();
            return;
          }

          this.current_user = {
            id: profile.id,
            email: profile.email || session.user.email || '',
            role: profile.role || 'reader',
            name: profile.name || (profile.email || '').split('@')[0] || 'Member',
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
            bio: profile.bio || '',
            created_at: profile.created_at,
            subscription_status: profile.role === 'premium' ? 'active' : 'none'
          };
        }
        this.triggerUpdate();
      }

      // 2. Wire up the persistent onAuthStateChange listener for real-time authentication state updates
      this.supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log('⚡ Supabase Auth Event Observer:', event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (currentSession && currentSession.user) {
            try {
              const cleanEmail = (currentSession.user.email || '').toLowerCase().trim();
              const syncRes = await fetch('/api/auth/sync-profile', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${currentSession.access_token}`
                },
                body: JSON.stringify({
                  userId: currentSession.user.id,
                  email: cleanEmail,
                  name: currentSession.user.user_metadata?.name || cleanEmail.split('@')[0] || 'Member',
                  avatarUrl: currentSession.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                })
              });

              if (!syncRes.ok && (syncRes.status === 401 || syncRes.status === 403)) {
                const errData = await this.safeJson(syncRes);
                console.error('❌ Auth state change: auth rejected:', errData.error);
                await this.supabase.auth.signOut();
                this.current_user = null;
                this.triggerUpdate();
                return;
              }
              if (!syncRes.ok) {
                console.warn('⚡ Auth state change: profile sync unavailable (status ' + syncRes.status + '); keeping the session.');
              }

              const syncData = await this.safeJson(syncRes);
              const profile = syncData.profile;

              if (profile) {
                if (profile.is_suspended) {
                  console.warn('⚡ Auth change: User account is suspended');
                  await this.supabase.auth.signOut();
                  this.current_user = null;
                  this.triggerUpdate();
                  return;
                }

                this.current_user = {
                  id: profile.id,
                  email: profile.email || currentSession.user.email || '',
                  role: profile.role || 'reader',
                  name: profile.name || (profile.email || '').split('@')[0] || 'Member',
                  avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
                  bio: profile.bio || '',
                  created_at: profile.created_at,
                  subscription_status: profile.role === 'premium' ? 'active' : 'none'
                };
                this.triggerUpdate();
              }
            } catch (err: any) {
              console.warn('⚡ Error during auth state change profile sync:', err.message || err);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          this.current_user = null;
          this.triggerUpdate();
        }
      });
    } catch (err: any) {
      console.warn('⚡ Critical error restoring or configuring Supabase session observers:', err.message);
    } finally {
      this.authLoading = false;
      this.triggerUpdate();
    }
  }

  // Enforces relationship advice-only niche categories, maps posts, and cleans up old categories in Supabase
  public async enforceRelationshipNicheDatabase() {
    if (!this.supabase) return;
    try {
      console.log('🔄 Starting automated relationship advice niche validation & DB repair...');
      
      const NICHES = [
        { id: 'cat-dating', name: 'Dating Tips', slug: 'dating-tips', description: 'Advice for dating, first dates, online dating, attraction, and finding partners.', color: '#EC4899', icon: 'Flame' },
        { id: 'cat-relationship', name: 'Relationship Advice', slug: 'relationship-advice', description: 'Guidance for building healthy and successful relationships.', color: '#F43F5E', icon: 'Heart' },
        { id: 'cat-communication', name: 'Communication', slug: 'communication', description: 'Communication skills, conflict resolution, emotional intelligence, and partnership dialogue.', color: '#3B82F6', icon: 'MessageSquare' },
        { id: 'cat-redflags', name: 'Red Flags & Toxic Relationships', slug: 'red-flags-toxic-relationships', description: 'Recognizing unhealthy behaviors, manipulation, toxicity, and warning signs.', color: '#EF4444', icon: 'HeartCrack' },
        { id: 'cat-breakups', name: 'Breakups & Healing', slug: 'breakups-healing', description: 'Heartbreak recovery, emotional healing, moving on, and self-recovery.', color: '#8B5CF6', icon: 'Activity' },
        { id: 'cat-marriage', name: 'Marriage & Commitment', slug: 'marriage-commitment', description: 'Marriage advice, engagement, commitment, long-term partnerships, and family building.', color: '#06B6D4', icon: 'ShieldCheck' },
        { id: 'cat-intimacy', name: 'Intimacy & Romance', slug: 'intimacy-romance', description: 'Romantic connection, affection, love languages, intimacy, and relationship bonding.', color: '#10B981', icon: 'Flame' },
        { id: 'cat-growth', name: 'Personal Growth', slug: 'personal-growth', description: 'Self-improvement, confidence, self-love, emotional wellness, and personal development.', color: '#F59E0B', icon: 'TrendingUp' },
        { id: 'cat-family', name: 'Family & Parenting', slug: 'family-parenting', description: 'Parenting, co-parenting, blended families, and family relationships.', color: '#14B8A6', icon: 'Users' },
        { id: 'cat-psychology', name: 'Love Psychology', slug: 'love-psychology', description: 'Attachment styles, attraction psychology, relationship science, and emotional behavior.', color: '#6366F1', icon: 'Brain' }
      ];

      // 1. Ensure our 10 correct categories exist in Supabase
      for (const niche of NICHES) {
        try {
          await this.supabase.from('categories').upsert({
            id: niche.id,
            name: niche.name,
            slug: niche.slug,
            description: niche.description,
            color: niche.color,
            icon: niche.icon
          }, { onConflict: 'id' });
        } catch (catErr) {
          console.warn(`Could not upsert category ${niche.name}:`, catErr);
        }
      }

      // 2. Scan and reassign all posts that have mismatched or legacy category IDs
      const { data: postsData, error: errPosts } = await this.supabase.from('posts').select('id, title, category_id, tags');
      if (!errPosts && postsData && postsData.length > 0) {
        for (const post of postsData) {
          const properCatId = mapCategoryIdToNew(post.category_id, post.title, post.tags);
          if (post.category_id !== properCatId) {
            console.log(`🤖 Reassigning post "${post.title}" from "${post.category_id}" to "${properCatId}"`);
            await this.supabase.from('posts').update({ category_id: properCatId }).eq('id', post.id);
          }
        }
      }

      // 3. Purge bad categories
      const badKeywords = ['news', 'music', 'sports', 'entertainment', 'crypto', 'technology', 'lifestyle', 'gossip', 'jokes', 'education', 'viral', 'betting', 'gossip-premium', 'celebrity-love'];
      const { data: currentCats, error: curCatsErr } = await this.supabase.from('categories').select('*');
      if (!curCatsErr && currentCats && currentCats.length > 0) {
        const badCatIds = currentCats.filter(c => {
          const nameLower = (c.name || '').toLowerCase();
          const slugLower = (c.slug || '').toLowerCase();
          return badKeywords.some(keyword => nameLower.includes(keyword) || slugLower.includes(keyword)) && !NICHES.some(n => n.id === c.id);
        }).map(c => c.id);

        if (badCatIds.length > 0) {
          console.log(`🗑️ Deleting ${badCatIds.length} unrelated niche categories from Supabase:`, badCatIds);
          const { error: delErr } = await this.supabase.from('categories').delete().in('id', badCatIds);
          if (delErr) {
            console.warn('Could not complete delete of bad categories:', delErr);
          }
        }
      }

      console.log('✅ Automated niche validation & DB repair completed successfully.');
    } catch (err) {
      console.warn('Database self-healing failed:', err);
    }
  }

  // Double-sync active database tables from cloud if present
  public async syncWithSupabase() {
    if (!this.supabase) return;
    try {
      console.log('🔄 Syncing active database tables from Supabase Cloud...');
      try {
        const { data: catData, error: catError } = await this.supabase.from('categories').select('*');
        if (catError) {
          console.warn('Supabase fetch categories warning:', catError);
          this.logAction('Supabase Fetch Warning', `Table categories: ${catError.message} (${catError.code})`);
        } else if (catData && Array.isArray(catData)) {
          const mappedCats = catData.map(c => ({
            id: mapCategoryIdToNew(c.id, c.name),
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            color: c.color || '#F43F5E',
            icon: c.icon || 'Heart',
            featured_image: c.featured_image,
            seo_title: c.seo_title,
            seo_description: c.seo_description,
            is_premium: c.is_premium === true,
            price: Number(c.price) || 0
          }));

          // The DB is the single source of truth for categories  - no hardcoded
          // slug whitelist (it silently hid every admin-created category).
          this.categories = mappedCats.filter(c => c && c.slug);
        }
      } catch (catErr: any) {
        console.warn('Categories critical query warning:', catErr);
      }

      // 2. Fetch Posts
      try {
        // List columns only (same projection as the server boot state)  - article
      // bodies are fetched per-article via ensureArticleContent().
      const { data: postData, error: postError } = await this.supabase.from('posts')
        .select('id,title,slug,excerpt,status,publish_date,featured_image,read_time,category_id,author_id,tags,likes,reactions,views,seo_title,seo_description,seo_keywords,is_premium,created_at,updated_at,is_featured,reading_time')
        .order('publish_date', { ascending: false });
        if (postError) {
          console.warn('Supabase fetch posts warning:', postError);
          this.logAction('Supabase Fetch Warning', `Table posts: ${postError.message} (${postError.code})`);
        } else if (postData) {
          const mappedPosts = (postData as any[]).map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt || '',
            content: p.content || '',
            status: p.status || 'draft',
            publish_date: p.publish_date,
            featured_image: p.featured_image || '',
            read_time: p.read_time || 5,
            category_id: mapCategoryIdToNew(p.category_id, p.title, p.tags),
            author_id: fromDbUUID(p.author_id),
            tags: p.tags || [],
            likes: p.likes || 0,
            reactions: p.reactions || { love: 0, insightful: 0, support: 0, warmth: 0 },
            views: p.views || 0,
            seo_title: p.seo_title || p.title,
            seo_description: p.seo_description || p.excerpt,
            keywords: p.keywords || [],
            allow_comments: p.allow_comments !== false,
            in_article_inserts: p.in_article_inserts ? (typeof p.in_article_inserts === 'string' ? JSON.parse(p.in_article_inserts) : p.in_article_inserts) : undefined
          }));

          this.posts = expandAllArticles(mappedPosts);
          console.log(`✅ Loaded ${this.posts.length} articles from Supabase securely.`);
          this.logAction('Database Sync', `Successfully fetched and compiled ${this.posts.length} articles from Supabase`);
        }
      } catch (postErr: any) {
        console.warn('Posts critical query warning:', postErr);
      }

      // 3. Fetch Comments
      try {
        const { data: commentData, error: commentError } = await this.supabase.from('comments').select('*');
        if (commentError) {
          console.warn('Supabase fetch comments warning:', commentError);
          this.logAction('Supabase Fetch Warning', `Table comments: ${commentError.message} (${commentError.code})`);
        } else if (commentData && Array.isArray(commentData)) {
          this.comments = commentData;
        }
      } catch (commentErr: any) {
        console.warn('Comments critical query warning:', commentErr);
      }

      // 4. Fetch Authors (Mapped securely to profiles table to prevent schema errors)
      try {
        // The author catalog is public.authors (the table posts.author_id
        // references). profiles is the auth-account table with UUID ids -
        // sourcing authors from it produced author_id values that could
        // never satisfy the posts foreign key.
        const { data: authorsData, error: authErr } = await this.supabase.from('authors').select('id,name,email,bio,avatar,role,is_active,created_at');
        if (authErr) {
          console.warn('Supabase fetch authors warning:', authErr);
        } else {
          if (authorsData && authorsData.length > 0) {
            this.authors = authorsData.map((p: any) => ({
              id: fromDbUUID(p.id),
              name: p.name || 'Anonymous User',
              avatar_url: p.avatar || '',
              bio: p.bio || '',
              role_tag: p.role === 'admin' ? 'Administrator' : 'Relationship Advisor',
              role: p.role || 'author',
              social_links: {},
              is_deleted: p.is_active === false
            }));
          }
          
          if (!authorsData || authorsData.length === 0) {
            this.authors = [];
          }
        }
      } catch (authorErr: any) {
        console.warn('Authors critical query warning:', authorErr);
      }

      // 5. Fetch Pages
      try {
        const { data: pagesData, error: pageErr } = await this.supabase.from('pages').select('*');
        if (pageErr) {
          console.warn('Supabase fetch pages warning:', pageErr);
        } else if (pagesData && Array.isArray(pagesData)) {
          this.pages = pagesData;
        }
      } catch (pageErr: any) {
        console.warn('Pages critical query warning:', pageErr);
      }

      // 5b. Fetch Quizzes
      try {
        const { data: quizzesData, error: quizErr } = await this.supabase.from('quizzes').select('*');
        if (quizErr) {
          console.warn('Supabase fetch quizzes warning:', quizErr);
        } else if (quizzesData && Array.isArray(quizzesData)) {
          this.quizzes = quizzesData.map(q => ({
            id: q.id,
            articleId: q.article_id,
            title: q.title,
            questions: q.questions || [],
            created_at: q.created_at
          }));
        }
      } catch (quizErr: any) {
        console.warn('Quizzes critical query warning:', quizErr);
      }

      // 6. Fetch Site Settings
      try {
        const { data: settingsData, error: setErr } = await this.supabase.from('site_settings').select('*').eq('id', 'singleton').maybeSingle();
        if (setErr) {
          console.warn('Supabase fetch site settings warning:', setErr);
        } else if (settingsData) {
          this.site_settings = {
            ...this.site_settings,
            ...settingsData
          };

          // FORCE UPGRADE BRANDING: ensure homepage hero banner is updated to the clean look immediately if not already configured
          if (!settingsData.page_builder_sections || settingsData.page_builder_sections.length === 0) { // Force update branding and page_builder_sections layout to match video if fresh
            this.site_settings.hero_settings = {
              title: 'Healing, Love & Self-Growth',
              subtitle: 'Premium insights for building deeper connections and healthier relationships',
              badge_text: 'Welcome to HeartSync Journal',
              primary_cta_text: 'Explore Articles',
              primary_cta_url: 'articles',
              secondary_cta_text: 'Take Relationship Quiz',
              secondary_cta_url: 'quiz',
              trust_indicators: ['Expert Relationship Advice', 'Relationship & Dating Tips', 'Emotional Wellness Blog'],
              statistics: [
                { id: 'stat-1', label: 'readers', value: '0' },
                { id: 'stat-2', label: 'essays', value: '0' },
                { id: 'stat-3', label: 'with care', value: 'Curated' }
              ],
              testimonials: this.site_settings.hero_settings?.testimonials || [],
              enabled_sections: {
                badge: true,
                headline: true,
                description: true,
                buttons: true,
                statistics: true,
                testimonials: true,
                media: false
              }
            } as any;
            this.site_settings.homepage_featured_title = 'Featured Insights';
            this.site_settings.homepage_trending_title = 'Trending Now';
            this.site_settings.homepage_trending_enabled = true;
            this.site_settings.homepage_featured_enabled = true;
            this.site_settings.homepage_categories_title = 'Explore by Topic';
            this.site_settings.homepage_categories_subtitle = 'Dive into the subjects that matter most  - each curated with depth and intention.';
            this.site_settings.homepage_categories_enabled = true;
            this.site_settings.homepage_categories_order = 3;
            this.site_settings.homepage_featured_order = 1;
            this.site_settings.homepage_trending_order = 2;
            this.site_settings.trending_count = 4;
            this.site_settings.page_builder_sections = [
              { id: 'sec-hero', type: 'hero', title: "Healing, Love & Self-Growth", subtitle: "Premium insights for building deeper connections and healthier relationships", buttonText: "Explore Articles", buttonUrl: "articles", secondaryButtonText: "Take Relationship Quiz", secondaryButtonUrl: "quiz", imageUrl: "", badgeText: "Welcome to HeartSync Journal", is_active: true },
              { id: 'sec-featured', type: 'featured_stories', title: "Featured Insights", is_active: true },
              { id: 'sec-trending', type: 'trending', title: "Trending Now", is_active: true },
              { id: 'sec-categories', type: 'categories', title: "Explore by Topic", subtitle: "Dive into the subjects that matter most  - each curated with depth and intention.", is_active: true },
              { id: 'sec-about', type: 'about', title: "About HeartSync Journal", is_active: true },
              { id: 'sec-newsletter', type: 'newsletter', title: "Join the HeartSync Journal", is_active: true }
            ];
            
            // Immediately save to database to persist this updated layout
            const dbPayload = {
              id: 'singleton',
              hero_settings: this.site_settings.hero_settings,
              homepage_featured_title: 'Featured Insights',
              homepage_trending_title: 'Trending Now',
              homepage_featured_enabled: true,
              homepage_trending_enabled: true,
              homepage_categories_title: 'Explore by Topic',
              homepage_categories_subtitle: 'Dive into the subjects that matter most  - each curated with depth and intention.',
              homepage_categories_enabled: true,
              homepage_categories_order: 3,
              homepage_featured_order: 1,
              homepage_trending_order: 2,
              trending_count: 4,
              page_builder_sections: this.site_settings.page_builder_sections,
              updated_at: new Date().toISOString()
            };
            this.supabase.from('site_settings').upsert([dbPayload]).then();
          }

          // Unpack nested JSONB configs back to flat top-level state keys for dynamic components rendering
          const headerConfig = (this.site_settings.header_settings || {}) as any;
          const heroConfig = (this.site_settings.hero_settings || {}) as any;

          if (headerConfig.extra_settings_blob) {
            this.site_settings = {
              ...this.site_settings,
              ...headerConfig.extra_settings_blob
            };
          }

          if (headerConfig.footer_config) {
            this.site_settings.footer_style = headerConfig.footer_config.style || this.site_settings.footer_style;
            this.site_settings.site_copyright_text = headerConfig.footer_config.copyright || this.site_settings.site_copyright_text;
            this.site_settings.footer_compliance_badges_enabled = headerConfig.footer_config.compliance_badges_enabled ?? this.site_settings.footer_compliance_badges_enabled;
          }
          if (heroConfig.categories_config) {
            this.site_settings.homepage_categories_title = heroConfig.categories_config.title || this.site_settings.homepage_categories_title;
            this.site_settings.homepage_categories_subtitle = heroConfig.categories_config.subtitle || this.site_settings.homepage_categories_subtitle;
            this.site_settings.homepage_categories_enabled = heroConfig.categories_config.enabled ?? this.site_settings.homepage_categories_enabled;
            this.site_settings.homepage_categories_order = heroConfig.categories_config.order ?? this.site_settings.homepage_categories_order;
            this.site_settings.homepage_custom_categories = heroConfig.categories_config.custom_categories || this.site_settings.homepage_custom_categories;
          }
          if (heroConfig.featured_config) {
            this.site_settings.homepage_featured_title = heroConfig.featured_config.title || this.site_settings.homepage_featured_title;
            this.site_settings.homepage_featured_enabled = heroConfig.featured_config.enabled ?? this.site_settings.homepage_featured_enabled;
            this.site_settings.homepage_featured_order = heroConfig.featured_config.order ?? this.site_settings.homepage_featured_order;
            this.site_settings.homepage_featured_posts = heroConfig.featured_config.posts || this.site_settings.homepage_featured_posts;
          }
          if (heroConfig.trending_config) {
            this.site_settings.homepage_trending_title = heroConfig.trending_config.title || this.site_settings.homepage_trending_title;
            this.site_settings.homepage_trending_enabled = heroConfig.trending_config.enabled ?? this.site_settings.homepage_trending_enabled;
            this.site_settings.homepage_trending_order = heroConfig.trending_config.order ?? this.site_settings.homepage_trending_order;
            this.site_settings.homepage_trending_posts = heroConfig.trending_config.posts || this.site_settings.homepage_trending_posts;
          }
        }
      } catch (settingsErr: any) {
        console.error('Site Settings critical query error:', settingsErr);
      }

      // 6b. Fetch Active Plans, Subscriptions, Payments, and Outreach Campaigns from Supabase
      try {
        const { data: plansData } = await this.supabase.from('plans').select('*');
        if (plansData && Array.isArray(plansData)) this.plans = plansData;
      } catch (_) {}

      try {
        const { data: subData } = await this.supabase.from('subscriptions').select('*');
        if (subData && Array.isArray(subData)) this.subscriptions = subData;
      } catch (_) {}

      try {
        const { data: payData } = await this.supabase.from('payments').select('*');
        if (payData && Array.isArray(payData)) this.payments = payData;
      } catch (_) {}

      try {
        const { data: campaignsData } = await this.supabase.from('email_campaigns').select('*');
        if (campaignsData && Array.isArray(campaignsData)) this.email_campaigns = campaignsData;
      } catch (_) {}

      try {
        const { data: templatesData } = await this.supabase.from('email_templates').select('*');
        if (templatesData && Array.isArray(templatesData)) this.email_templates = templatesData;
      } catch (_) {}

      this.saveState(false, { light: true });
      console.log('🔄 Extracted & replicated production-grade Supabase database state.');
    } catch (err) {
      console.warn('Failed to resolve dynamic cloud state from Supabase indexes.', err);
    }
  }

  public async getSupabaseRecordsCount(): Promise<{ postsCount: number; categoriesCount: number; success: boolean; error?: string }> {
    if (!this.supabase) {
      return { postsCount: 0, categoriesCount: 0, success: false, error: 'No active Supabase connection configured.' };
    }
    try {
      const { data: pData, error: pErr } = await this.supabase.from('posts').select('id');
      const { data: cData, error: cErr } = await this.supabase.from('categories').select('id');
      
      if (pErr) throw pErr;
      if (cErr) throw cErr;
      
      return {
        postsCount: pData ? pData.length : 0,
        categoriesCount: cData ? cData.length : 0,
        success: true
      };
    } catch (e: any) {
      console.warn('Supabase records diagnosis failed:', e);
      return {
        postsCount: 0,
        categoriesCount: 0,
        success: false,
        error: e.message || String(e)
      };
    }
  }

  private loadState() {
    this.current_user = null;
    try {
      const savedUser = localStorage.getItem('hs_current_user');
      if (savedUser) {
        this.current_user = JSON.parse(savedUser);
      }
    } catch (_) {}

    this.posts = expandAllArticles(DEFAULT_POSTS);
    this.categories = DEFAULT_CATEGORIES;
    this.comments = DEFAULT_COMMENTS;
    const defaultAdZones: AdZone[] = [
      {
        id: 'ad-home-hero',
        name: 'Home Hero Banner',
        slot: 'home_hero_banner',
        pricing: '$1.80 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block" data-ad-client="" data-ad-slot="9606990422" data-ad-format="auto" data-full-width-responsive="true"></ins>',
        size_label: 'Responsive Horizontal (728x90)',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-sidebar-sticky',
        name: 'Sidebar Sticky Ad',
        slot: 'sidebar_sticky',
        pricing: '$2.50 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block" data-ad-client="" data-ad-slot="2911115561" data-ad-format="auto" data-full-width-responsive="true"></ins>',
        size_label: 'Vertical Skyscraper (300x600)',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-article-footer',
        name: 'Article Footer Banner',
        slot: 'article_footer',
        pricing: '$1.50 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block" data-ad-client="" data-ad-slot="9606990422" data-ad-format="auto" data-full-width-responsive="true"></ins>',
        size_label: 'Responsive Banner (468x60)',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-in-article',
        name: 'In-Article Inline Banner',
        slot: 'in_article_banner',
        pricing: '$2.10 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block; text-align:center;" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="" data-ad-slot="6304951077"></ins>',
        size_label: 'Responsive In-Article Native Banner',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-rewarded-unlock',
        name: 'Google AdSense Rewarded Video Ad (Unlock Premium Content / Quiz)',
        slot: 'rewarded_unlock',
        pricing: '$12.50 eCPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block" data-ad-client="" data-ad-slot="8492019283" data-ad-format="rewarded" data-full-width-responsive="true"></ins>',
        size_label: 'Rewarded Ad Unit (High Value Engagement / Video Popup)',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-category-header',
        name: 'Category & Topic Feed Sponsor Banner',
        slot: 'category_header',
        pricing: '$2.20 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block" data-ad-client="" data-ad-slot="1192837465" data-ad-format="auto" data-full-width-responsive="true"></ins>',
        size_label: 'Responsive Feed Header (728x90 / Fluid)',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-article-midcontent',
        name: 'Mid-Article Anchor Engagement Slot',
        slot: 'article_midcontent',
        pricing: '$2.80 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block; text-align:center;" data-ad-layout="in-article" data-ad-format="fluid" data-ad-client="" data-ad-slot="5593820192"></ins>',
        size_label: 'Responsive In-Article High-Visibility Placement',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-article-sidebar-top',
        name: 'Article Top Right Sidebar Square',
        slot: 'article_sidebar_top',
        pricing: '$2.40 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:inline-block;width:300px;height:250px" data-ad-client="" data-ad-slot="4482910293"></ins>',
        size_label: 'Medium Rectangle (300x250)',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-popup-interstitial',
        name: 'Fullscreen Transition Interstitial Ad',
        slot: 'popup_interstitial',
        pricing: '$4.50 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block" data-ad-client="" data-ad-slot="7738291029" data-ad-format="interstitial"></ins>',
        size_label: 'Fullscreen Interstitial Page Transition',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-search-results',
        name: 'Search & Directory Native Feed Ad',
        slot: 'search_results_feed',
        pricing: '$1.90 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:block" data-ad-format="fluid" data-ad-layout-key="-fb+5w+4e-db+86" data-ad-client="" data-ad-slot="3392019283"></ins>',
        size_label: 'Native Feed Article Directory Layout',
        impressions: 0,
        clicks: 0
      },
      {
        id: 'ad-mobile-sticky-footer',
        name: 'Mobile Bottom Anchor Sticky Bar',
        slot: 'mobile_sticky_footer',
        pricing: '$3.10 CPM',
        active: true,
        code_template: '<ins class="adsbygoogle" style="display:inline-block;width:320px;height:100px" data-ad-client="" data-ad-slot="9928374610"></ins>',
        size_label: 'Mobile Sticky Anchor (320x50 / 320x100)',
        impressions: 0,
        clicks: 0
      }
    ];
    this.ad_zones = defaultAdZones;
    this.subscribers = [];
    this.quizzes = [];
    // Shallow-copy at boot: site_settings is mutated constantly by the
    // admin console and tests - sharing the DEFAULT_SETTINGS reference
    // let those mutations corrupt the module-level default (and any
    // fresh-boot expectations read from it).
    this.site_settings = { ...DEFAULT_SETTINGS };
    

    this.pn_settings = {};
    if (this.site_settings.homepage_categories_columns_mobile === undefined) {
      this.site_settings.homepage_categories_columns_mobile = 2;
    }
    if (this.site_settings.homepage_categories_card_style === undefined) {
      this.site_settings.homepage_categories_card_style = 'overlay';
    }
    if (this.site_settings.homepage_categories_aspect_ratio === undefined) {
      this.site_settings.homepage_categories_aspect_ratio = '4/3';
    }
    if (!this.site_settings.header_settings) {
      this.site_settings.header_settings = { ...DEFAULT_SETTINGS.header_settings };
    }
    if (!this.site_settings.hero_settings || !this.site_settings.hero_settings.title) {
      this.site_settings.hero_settings = { ...DEFAULT_SETTINGS.hero_settings };
    }
    if (this.site_settings.related_block_enabled === undefined) {
      this.site_settings.related_block_enabled = true;
      this.site_settings.related_block_title = 'You may also like';
      this.site_settings.related_block_count = 3;
      this.site_settings.related_block_style = 'grid';
    }
    if (this.site_settings.article_atmospheric_linen === undefined) {
      this.site_settings.article_atmospheric_linen = true;
    }
    if (this.site_settings.article_atmospheric_music_embedded === undefined) {
      this.site_settings.article_atmospheric_music_embedded = true;
    }
    if (this.site_settings.expert_review_stamp_enabled === undefined) {
      this.site_settings.expert_review_stamp_enabled = true;
      this.site_settings.expert_reviewer_signature_text = 'Reviewed and Approved by Dr. Sarah Eldridge, PhD  - Relationship Advisor';
      this.site_settings.expert_reviewer_credentials_desc = 'Certified Gottman Method Relationship Coach, specialization in somatic relational growth.';
    }
    if (this.site_settings.tts_global_enabled === undefined) {
      this.site_settings.tts_global_enabled = true;
      this.site_settings.tts_default_voice = 'female';
      this.site_settings.tts_default_speed = 1.0;
      this.site_settings.tts_player_position = 'top';
      this.site_settings.tts_player_style = 'button';
      this.site_settings.tts_voice_gender = 'female';
      this.site_settings.tts_selected_voice = 'Rachel';
      this.site_settings.tts_default_pitch = 1.0;
      this.site_settings.tts_default_volume = 1.0;
      this.site_settings.tts_pronunciation_rules = 'Heartsync: Heart Sync\nAI: Artificial Intelligence';
    } else {
      if (this.site_settings.tts_player_style === undefined) {
        this.site_settings.tts_player_style = 'button';
      }
      if (this.site_settings.tts_voice_gender === undefined) {
        this.site_settings.tts_voice_gender = 'female';
      }
      if (this.site_settings.tts_selected_voice === undefined || this.site_settings.tts_selected_voice.toLowerCase() === 'samantha') {
        this.site_settings.tts_selected_voice = 'Rachel';
      }
      if (this.site_settings.tts_default_pitch === undefined) {
        this.site_settings.tts_default_pitch = 1.0;
      }
      if (this.site_settings.tts_default_volume === undefined) {
        this.site_settings.tts_default_volume = 1.0;
      }
      if (this.site_settings.tts_pronunciation_rules === undefined) {
        this.site_settings.tts_pronunciation_rules = 'Heartsync: Heart Sync\nAI: Artificial Intelligence';
      }
    }
    if (this.site_settings.tts_provider !== 'elevenlabs') {
      this.site_settings.tts_provider = 'elevenlabs';
    }
    if (this.site_settings.elevenlabs_api_key === undefined) {
      this.site_settings.elevenlabs_api_key = '';
    }
    if (this.site_settings.tts_selected_voice_id === undefined) {
      this.site_settings.tts_selected_voice_id = '';
    }
    if (this.site_settings.tts_voice_cache === undefined) {
      this.site_settings.tts_voice_cache = null;
    }
    if (this.site_settings.tts_stability === undefined) {
      this.site_settings.tts_stability = 0.55;
    }
    if (this.site_settings.tts_similarity_boost === undefined) {
      this.site_settings.tts_similarity_boost = 0.75;
    }
    if (this.site_settings.tts_style === undefined) {
      this.site_settings.tts_style = 0.0;
    }
    if (this.site_settings.tts_last_voice_sync === undefined) {
      this.site_settings.tts_last_voice_sync = '';
    }
    this.analytics = getLocalStorage<AnalyticsSummary>('hs_analytics', DEFAULT_ANALYTICS);
    this.bookmarks = getLocalStorage<string[]>('hs_bookmarks', []);
    this.media_library = getLocalStorage<(string | MediaItem)[]>('hs_media_library', this.media_library);
    this.authors = getLocalStorage<Author[]>('hs_authors', DEFAULT_AUTHORS);
    this.pages = getLocalStorage<Page[]>('hs_pages', DEFAULT_PAGES);
    this.plans = getLocalStorage<Plan[]>('hs_plans', DEFAULT_PLANS);
    this.subscriptions = getLocalStorage<Subscription[]>('hs_subscriptions', DEFAULT_SUBSCRIPTIONS);
    this.payments = getLocalStorage<Payment[]>('hs_payments', DEFAULT_PAYMENTS_LIST);
    this.all_users = getLocalStorage<User[]>('hs_all_users', DEFAULT_USERS_LIST);
    this.global_premium_locked = getLocalStorage<boolean>('hs_global_premium_locked', false);
    this.tags = getLocalStorage<any[]>('hs_tags', [
      { id: 'tag-1', name: 'Relationship Science', slug: 'relationship-science', color: '#CE2B5E' },
      { id: 'tag-2', name: 'Attachment styles', slug: 'attachment-styles', color: '#3B82F6' },
      { id: 'tag-3', name: 'Gottman relationship theory', slug: 'gottman-theory', color: '#10B981' },
      { id: 'tag-4', name: 'Emotional validation', slug: 'validation', color: '#F59E0B' }
    ]);
    this.podcasts = getLocalStorage<any[]>('hs_podcasts', [
      { id: 'pod-1', title: 'The Secure Base Podcast', host: 'Peter Tubin', duration: '28:14', description: 'Exploring secure attachment systems in adult marriages.', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', published_at: '2026-06-01' },
      { id: 'pod-2', title: 'Emotional Attunement Loops', host: 'Katherine M.', duration: '35:20', description: 'Deconstructing emotional withdrawal states live in session.', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', published_at: '2026-06-05' }
    ]);
    this.rss_feeds = getLocalStorage<any[]>('hs_rss_feeds', [
      { id: 'rss-1', name: 'Gottman Relationship Blog', url: 'https://www.gottman.com/feed/', status: 'Active', lastSync: '2026-06-10 14:32' },
      { id: 'rss-2', name: 'Psychology Today Relationship Feed', url: 'https://www.psychologytoday.com/us/feed/relationships', status: 'Active', lastSync: '2026-06-12 09:12' }
    ]);
    // Honest absence: no provider is preconfigured. Admins add their own real
    // publisher/zone/key credentials via the Admin Console  - fake demo IDs must
    // never ship (AdSense policy risk + misleading admin defaults).
    const defaultCampaigns = [
      { id: 'camp-1', name: 'Attachment Style Mastery Masterclass', url: 'https://wellnesscouples.com/courses/attachment-mastery', impressions: 0, clicks: 0, status: 'Active' },
      { id: 'camp-2', name: 'Gottman Intimacy Deck Companion', url: 'https://wellnesscouples.com/resources/intimacy-cards', impressions: 0, clicks: 0, status: 'Active' },
      { id: 'camp-3', name: 'Couples Communication Retreat Promo', url: 'https://wellnesscouples.com/workshops/couples-retreat', impressions: 0, clicks: 0, status: 'Active' }
    ];
    this.sponsorship_campaigns = getLocalStorage<any[]>('hs_sponsorship_campaigns', defaultCampaigns);
    this.campaigns = this.sponsorship_campaigns;
    this.webhook_targets = getLocalStorage<any[]>('hs_webhook_targets', []);
    this.webhook_logs = getLocalStorage<any[]>('hs_webhook_logs', []);
    this.email_campaigns = getLocalStorage<any[]>('hs_email_campaigns', [
      { id: 'camp-1', name: 'Secure Attuner Core Launch', type: 'Email', subscribersGroup: 'Anxious seeker list', status: 'Draft', sentCount: 0 },
      { id: 'camp-2', name: 'Relational Intimacy Assessment Series', type: 'Email', subscribersGroup: 'Avoidant style list', status: 'Sent', sentCount: 0 }
    ]);
    this.email_templates = getLocalStorage<any[]>('hs_email_templates', [
      { id: 'temp-1', name: 'Default Newsletter Template', subject: 'Your Intimate weekly attunement update', body: '<h1>Pulse Digest</h1><p>Welcome back inside your attachment session...</p>' },
      { id: 'temp-2', name: 'Warm Overrule Bypass Code Template', subject: 'Your HeartSync Access Bypass Security Key', body: '<p>You requested a sandbox bypass sequence code: <strong>BYPASS</strong></p>' }
    ]);
    this.audit_logs = getLocalStorage<AuditLog[]>('hs_audit_logs', [
      {
        id: 'log-1',
        user_name: 'Peter Tubin',
        action: 'System Init',
        target: 'Heartsync Engine Booted',
        timestamp: '2026-05-21T22:51:19Z'
      }
    ]);

    if (this.site_settings.live_chat_enabled === undefined) {
      this.site_settings.live_chat_enabled = true;
    }

    this.chat_conversations = getLocalStorage<ChatConversation[]>('hs_chat_conversations', [
      {
        id: 'chat-visitor-demo',
        visitor_id: 'visitor-demo',
        visitor_name: 'Sarah Jenkins',
        visitor_email: 'sarah.jenkins@wellnesscouples.com',
        visitor_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        status: 'open',
        device: 'iPhone 15 Pro',
        browser: 'Safari',
        country: 'United States 🇺🇸',
        current_page: '/dating-tips',
        connected_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 600000).toISOString(),
        online_visitor: true
      }
    ]);

    this.chat_messages = getLocalStorage<ChatMessage[]>('hs_chat_messages', [
      {
        id: 'msg-demo-1',
        conversation_id: 'chat-visitor-demo',
        sender: 'visitor',
        visitor_id: 'visitor-demo',
        content: "Hi there! I am reading the article on Secure Attachment and had a quick question about communication. Can you help?",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'msg-demo-2',
        conversation_id: 'chat-visitor-demo',
        sender: 'admin',
        visitor_id: 'visitor-demo',
        content: "👋 Hi Sarah! Welcome to HeartSync. Of course, I can help you with that! What's your question about communication?",
        is_read: true,
        created_at: new Date(Date.now() - 3000000).toISOString()
      },
      {
        id: 'msg-demo-3',
        conversation_id: 'chat-visitor-demo',
        sender: 'visitor',
        visitor_id: 'visitor-demo',
        content: "How do I bring up vulnerability without making my partner feel criticized?",
        is_read: false,
        created_at: new Date(Date.now() - 600000).toISOString()
      }
    ]);
  }

  public async loadServerState() {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        
        if (data && data.posts && Array.isArray(data.posts)) {
          let finalPosts = [...data.posts];
          
          this.posts = finalPosts;
          if (data.categories) this.categories = data.categories;
          if (data.comments) this.comments = data.comments;
          if (data.ad_zones) this.ad_zones = data.ad_zones;
          if (data.subscribers) this.subscribers = data.subscribers;
          if (data.quizzes) this.quizzes = data.quizzes;
          if (data.site_settings) {
            const oldUrl = (this.site_settings.supabase_url || '').trim();
            const oldKey = (this.site_settings.supabase_key || '').trim();
            const newUrl = (data.site_settings.supabase_url || '').trim();
            const newKey = (data.site_settings.supabase_key || '').trim();
            
            this.site_settings = data.site_settings;
            
            if (oldUrl !== newUrl || oldKey !== newKey) {
              this.initSupabaseConnection();
            }
          }
          if (data.pn_settings) this.pn_settings = data.pn_settings;
          if (data.analytics) this.analytics = data.analytics;
          if (data.audit_logs) this.audit_logs = data.audit_logs;
          if (data.media_library) this.media_library = data.media_library;
          if (data.authors) this.authors = data.authors;
          if (data.pages) this.pages = data.pages;
          if (data.plans) this.plans = data.plans;
          if (data.subscriptions) this.subscriptions = data.subscriptions;
          if (data.payments) this.payments = data.payments;
          if (data.all_users) this.all_users = data.all_users;
          if (data.global_premium_locked !== undefined) this.global_premium_locked = data.global_premium_locked;
          if (data.tags) this.tags = data.tags;
          if (data.podcasts) this.podcasts = data.podcasts;
          if (data.rss_feeds) this.rss_feeds = data.rss_feeds;
          if (Array.isArray(data.translation_overrides)) {
            this.applyTranslationOverrides(data.translation_overrides);
          }
          if (data.sponsorship_campaigns || data.campaigns) {
            this.sponsorship_campaigns = data.sponsorship_campaigns || data.campaigns;
            this.campaigns = this.sponsorship_campaigns;
          }
          if (data.webhook_targets) this.webhook_targets = data.webhook_targets;
          if (data.webhook_logs) this.webhook_logs = data.webhook_logs;
          if (data.email_campaigns) this.email_campaigns = data.email_campaigns;
          if (data.email_templates) this.email_templates = data.email_templates;

          // Snapshot this good response so the NEXT boot paints the

          // Notify React listeners for immediate update
          this.onStateChangeCallbacks.forEach(cb => cb());
          
          // Auto sync bookmarked articles to SW cache
          if (this.bookmarks && this.bookmarks.length > 0) {
            syncBookmarksWithSW(this.posts, this.bookmarks);
          }
          
          console.log('💚 Heartsync successfully synchronized state from Supabase / server backend.');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch synchronized server state:', err);
    }
    // Mark hydration as settled either way so route guards can proceed and
    // pending article lookups (held during hydration) re-resolve now.
    this.serverStateLoaded = true;
    this.triggerUpdate();
  }

  public scanAndRestoreFromLocalStorage(): { checkedKeys: string[], foundCount: number, restoredCount: number, mergedPosts: any[] } {
    return {
      checkedKeys: [],
      foundCount: 0,
      restoredCount: 0,
      mergedPosts: this.posts
    };
  }

  public async saveState(forceImmediate: boolean = false, opts: { light?: boolean; sections?: string[]; reader?: boolean; localOnly?: boolean } = {}): Promise<any> {
    if (this._isInsideSaveState) return this._activeSavePromise ?? null;
    this._isInsideSaveState = true;
    try {
      try {
        if (this.current_user) {
          setLocalStorage('hs_current_user', this.current_user);
        } else {
          localStorage.removeItem('hs_current_user');
        }
      } catch (_) {}
      setLocalStorage('hs_bookmarks', this.bookmarks);
    
    // Activate visual saving status indicator & reset error
    this.isSaving = true;
    this.syncError = null;

    // Notify React listeners for immediate optimistic UI feedback
    this.onStateChangeCallbacks.forEach(cb => cb());

    // localOnly: persist to localStorage + refresh UI, but never POST the
    // state. Used by auth flows, bookmarks, vault/journal entries and other
    // actions whose data either is not a server state section or persists
    // through dedicated endpoints. A full sync here is how a stale or
    // pre-hydration tab used to wipe freshly saved server settings.
    if (opts.localOnly) {
      this.isSaving = false;
      this.onStateChangeCallbacks.forEach(cb => cb());
      return null;
    }

    // Push state update to the server with automatic retry and exponential backoff
    const runStateSyncWithRetry = async (retries = 3, delay = 1000): Promise<any> => {
      try {
        const authHeaders: Record<string, string> = {};
        if (this.supabase) {
          try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session?.access_token) {
              authHeaders['Authorization'] = `Bearer ${session.access_token}`;
            }
          } catch (_) {}
        }

        // Reader-side actions (article views, ad clicks, reactions,
        // comments, newsletter signups) must never ship admin-owned
        // config sections: a tab whose store snapshot predates the latest
        // admin-console save would silently revert those settings
        // (ad networks flipping back off, 2026-09-25 incident). A light
        // save syncs only reader-generated data; the server skips any
        // section absent from the payload.
        let payload: Record<string, unknown> = {
            posts: this.posts,
            categories: this.categories,
            comments: this.comments,
            ad_zones: this.ad_zones,
            subscribers: this.subscribers,
            quizzes: this.quizzes,
            site_settings: this.site_settings,
            pn_settings: this.pn_settings,
            analytics: this.analytics,
            audit_logs: this.audit_logs,
            media_library: this.media_library,
            authors: this.authors,
            pages: this.pages,
            plans: this.plans,
            subscriptions: this.subscriptions,
            payments: this.payments,
            all_users: this.all_users,
            global_premium_locked: this.global_premium_locked,
            tags: this.tags,
            podcasts: this.podcasts,
            rss_feeds: this.rss_feeds,
            sponsorship_campaigns: this.sponsorship_campaigns,
            campaigns: this.campaigns,
            webhook_targets: this.webhook_targets,
            webhook_logs: this.webhook_logs,
            email_campaigns: this.email_campaigns,
            email_templates: this.email_templates
        };
        if (opts.sections) {
          // Scoped save: ship ONLY the sections this action actually mutated.
          // Absent sections are skipped server-side (per-key merge), so a
          // stale tab can no longer revert settings or content it never
          // touched (2026-09-25 audit).
          const scoped: Record<string, unknown> = {};
          for (const k of opts.sections) {
            if (k in payload) scoped[k] = (payload as Record<string, unknown>)[k];
          }
          payload = scoped as typeof payload;
        } else if (opts.light) {
          for (const k of [
            'site_settings', 'pn_settings', 'audit_logs', 'media_library',
            'authors', 'pages', 'plans', 'subscriptions', 'payments',
            'all_users', 'global_premium_locked', 'podcasts', 'rss_feeds',
            'sponsorship_campaigns', 'campaigns', 'webhook_targets',
            'webhook_logs', 'email_campaigns', 'email_templates'
          ]) delete payload[k];
        }
        const response = await fetch('/api/state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Reader saves get engagement-only merges server-side; admin
            // scoped saves are merged per-key like before.
            ...(opts.reader || opts.light ? { 'X-Save-Mode': 'reader' } : {}),
            ...authHeaders
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Server state sync requires an administrator session. For a plain
            // reader (no admin session was ever expected) this is not an error;
            // but if an admin console call landed here it means the session
            // expired mid-edit, so surface it via syncError rather than letting
            // the caller believe the write reached the database.
            console.info('State sync skipped: server requires an administrator session.');
            this.isSaving = false;
            this.syncError = this.current_user ? 'Your admin session has expired. Please sign in again and re-save.' : null;
            this.onStateChangeCallbacks.forEach(cb => cb());
            return null;
          }
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.details || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        console.log('⚡ [SYNC SUCCESS] State successfully synchronized and confirmed by Supabase.', data);
        
        this.isSaving = false;
        this.onStateChangeCallbacks.forEach(cb => cb());
        return data;
      } catch (err: any) {
        if (retries > 0) {
          console.warn(`⚠️ Sync attempt failed. Retrying in ${delay}ms... (${retries} attempts remaining)`, err);
          await new Promise(res => setTimeout(res, delay));
          return runStateSyncWithRetry(retries - 1, delay * 2);
        } else {
          console.error('❌ Sync failed permanently after multiple retries:', err);
          this.isSaving = false;
          this.syncError = err instanceof Error ? err.message : String(err);
          this.onStateChangeCallbacks.forEach(cb => cb());
          throw err;
        }
      }
    };

    this._activeSavePromise = runStateSyncWithRetry();
    return await this._activeSavePromise;
    } finally {
      this._isInsideSaveState = false;
      this._activeSavePromise = null;
    }
  }

  public flushStateSync() {
    if (this.stateSyncTimeout) {
      clearTimeout(this.stateSyncTimeout);
      this.stateSyncTimeout = null;
    }
    
    const payload = {
      posts: this.posts,
      categories: this.categories,
      comments: this.comments,
      ad_zones: this.ad_zones,
      subscribers: this.subscribers,
      quizzes: this.quizzes,
      site_settings: this.site_settings,
      pn_settings: this.pn_settings,
      analytics: this.analytics,
      audit_logs: this.audit_logs,
      media_library: this.media_library,
      authors: this.authors,
      pages: this.pages,
      plans: this.plans,
      subscriptions: this.subscriptions,
      payments: this.payments,
      all_users: this.all_users,
      global_premium_locked: this.global_premium_locked,
      tags: this.tags,
      podcasts: this.podcasts,
      rss_feeds: this.rss_feeds,
      sponsorship_campaigns: this.sponsorship_campaigns,
      campaigns: this.campaigns,
      webhook_targets: this.webhook_targets,
      webhook_logs: this.webhook_logs,
      email_campaigns: this.email_campaigns,
      email_templates: this.email_templates
    };

    // (2026-09-25 audit) No-op. This flush used to POST the FULL state on
    // every tab unload, but the endpoint requires a Bearer authorization
    // header, which neither sendBeacon nor this keepalive fetch could ever
    // attach, so the request always died 401. Shipping a tab's whole
    // (possibly stale) snapshot on unload is also exactly the class of
    // write that reverts admin settings, so it stays removed.
    void payload;
  }

  public subscribe(cb: () => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(c => c !== cb);
    };
  }

  public subscribeToast(cb: (msg: string, type?: 'success' | 'error' | 'info') => void) {
    this.toastListeners.push(cb);
    return () => {
      this.toastListeners = this.toastListeners.filter(c => c !== cb);
    };
  }

  public notifyToast(msg: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastListeners.forEach(cb => cb(msg, type));
  }

  public setGlobalLoading(loading: boolean) {
    this.isGlobalLoading = loading;
    this.triggerUpdate();
  }

  public triggerUpdate() {
    this.onStateChangeCallbacks.forEach(cb => cb());
  }

  public logAction(action: string, target: string) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      user_name: this.current_user ? this.current_user.name : 'Guest User',
      action,
      target,
      timestamp: new Date().toISOString()
    };
    this.audit_logs.unshift(newLog);
    this.saveState(false, { localOnly: true }); // audit row persists via the direct insert below

    if (this.supabase) {
      // Live audit_logs columns: id, action, user_id, details (JSONB),
      // ip_address, created_at. The old shape (user_name/target/timestamp
      // as top-level columns) failed silently on EVERY insert, which is
      // why the admin audit log was always empty after a reload.
      this.supabase.from('audit_logs').insert([{
        id: newLog.id,
        action: newLog.action,
        user_id: this.current_user?.id || null,
        details: { target: newLog.target, user_name: newLog.user_name, timestamp: newLog.timestamp },
        created_at: newLog.timestamp
      }]).then(({ error }) => {
        if (error) console.warn('Supabase logging failed:', error);
      });
    }
  }

  // Schema-resilient Supabase write: on a missing-column error (the live
  // tables drifted from the repo schema), strips that key and retries, so a
  // single missing column can no longer fail the whole write. Mirrors
  // upsertResilient in server.ts.
  private async supabaseWriteResilient(
    op: 'insert' | 'upsert' | 'update',
    table: string,
    payload: any,
    eq?: { column: string; value: string }
  ): Promise<{ error: null | any }> {
    if (!this.supabase) return { error: new Error('no supabase client') };
    let rows: any[] = Array.isArray(payload) ? payload : [payload];
    for (let attempt = 0; attempt < 12; attempt++) {
      let q = this.supabase.from(table)[op]!(rows as any);
      if (eq) q = (q as any).eq(eq.column, eq.value);
      const { error } = await q;
      if (!error) return { error: null };
      const m = String(error.message || '').match(/column [a-zA-Z0-9_]+\.([a-zA-Z0-9_]+) does not exist|could not find the "([a-zA-Z0-9_]+)" column/i);
      const missing = m ? (m[1] || m[2]) : null;
      if (!missing) return { error };
      console.warn(`${table}: live table lacks column "${missing}" - stripping and retrying`);
      rows = rows.map(r => {
        if (r && typeof r === 'object' && missing in r) {
          const c = { ...r };
          delete c[missing];
          return c;
        }
        return r;
      });
    }
    return { error: new Error(`${table} write: too many schema mismatches`) };
  }

  // SUPABASE COMPLIANT AUTHENTICATION
  public async signInWithEmail(email: string, password?: string): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (this.supabase && password) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        if (error) throw error;
        
        this.logAction('Supabase Login', normalizedEmail);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      return { success: false, error: 'Database connection unavailable. Please check server authentication connection.' };
    }
  }

  // SECURE MULTI-PLATFORM FILE UPLOAD IN STORAGE BUCKET WITH AUTOMATIC CLIENT-SIDE COMPRESSION & RESIZING
  public async uploadMedia(file: File): Promise<string> {
    this.setGlobalLoading(true);
    try {
      // 1. If it's an image, compress/resize it down to a max of 1200px and 0.8 quality
    // This reduces image size from e.g. 5MB to ~80KB, which avoids Supabase space/payload limits,
    // and makes local Base64 string fallback super compact so the 5MB localStorage limit is never exceeded.
    let processedFile: File | Blob = file;
    if (file.type.startsWith('image/')) {
      try {
        processedFile = await new Promise<Blob | File>((resolve) => {
          let resolved = false;
          const safeResolve = (val: Blob | File) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve(val);
            }
          };

          const timer = setTimeout(() => {
            console.warn('Image compression timed out, falling back to original file.');
            safeResolve(file);
          }, 4000);

          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const result = e.target?.result;
              if (!result) {
                safeResolve(file);
                return;
              }
              const img = new Image();
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  const maxDim = 1200;
                  let width = img.width;
                  let height = img.height;

                  if (width > maxDim || height > maxDim) {
                    if (width > height) {
                      height = Math.round((height * maxDim) / width);
                      width = maxDim;
                    } else {
                      width = Math.round((width * maxDim) / height);
                      height = maxDim;
                    }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                    safeResolve(file);
                    return;
                  }

                  ctx.drawImage(img, 0, 0, width, height);

                  if (typeof canvas.toBlob !== 'function') {
                    // Fallback using toDataURL if toBlob is missing
                    try {
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
                      const parts = dataUrl.split(',');
                      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
                      const bstr = atob(parts[1]);
                      let n = bstr.length;
                      const u8arr = new Uint8Array(n);
                      while (n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                      }
                      const blob = new Blob([u8arr], { type: mime });
                      safeResolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                    } catch (errDataUrl) {
                      console.warn('Canvas toDataURL fallback failed:', errDataUrl);
                      safeResolve(file);
                    }
                    return;
                  }

                  canvas.toBlob(
                    (blob) => {
                      try {
                        if (blob) {
                          safeResolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                        } else {
                          safeResolve(file);
                        }
                      } catch (errBlob) {
                        safeResolve(file);
                      }
                    },
                    'image/jpeg',
                    0.80
                  );
                } catch (imgOnloadErr) {
                  console.warn('Error in image.onload compression stage:', imgOnloadErr);
                  safeResolve(file);
                }
              };
              img.onerror = () => safeResolve(file);
              img.src = result as string;
            } catch (readerOnloadErr) {
              console.warn('Error in reader.onload stage:', readerOnloadErr);
              safeResolve(file);
            }
          };
          reader.onerror = () => safeResolve(file);
          reader.readAsDataURL(file);
        });
      } catch (compressErr) {
        console.warn('Image compression failed, using original file instead.', compressErr);
        processedFile = file;
      }
    }

    const fileExtension = file.name.split('.').pop() || 'png';
    const filePath = `${Date.now()}_heartsync_${Math.random().toString(36).substr(2, 5)}.${fileExtension}`;

    if (this.supabase) {
      try {
        // Guard Supabase upload with a 3-second network timeout promise to prevent hanging
        const uploadPromise = this.supabase.storage
          .from('heartsync-media')
          .upload(filePath, processedFile, {
            cacheControl: '3600',
            upsert: true
          });

        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => {
          setTimeout(() => reject(new Error('Supabase Storage connection upload timed out after 20 seconds.')), 20000);
        });

        // Race the upload progress with the 3s fallback trigger
        const { error: uploadError } = await Promise.race([
          uploadPromise,
          timeoutPromise as any
        ]);

        if (uploadError) throw uploadError;

        const { data: publicData } = this.supabase.storage
          .from('heartsync-media')
          .getPublicUrl(filePath);

        const fileUrl = publicData.publicUrl;
        
        const sizeInKB = Math.round((file.size || 0) / 1024);
        const sizeStr = sizeInKB > 0 ? `${sizeInKB} KB` : 'Compressed (80 KB)';
        
        const mediaItem: MediaItem = {
          url: fileUrl,
          fileName: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          size: sizeStr,
          altText: file.name.split('.')[0],
          tags: ['uploaded']
        };

        // Add to media bank
        this.media_library.unshift(mediaItem);
        this.saveState(false, { sections: ['media_library'] });
        this.logAction('Uploaded Media file (Supabase Bucket)', file.name);
        return fileUrl;
      } catch (err) {
        console.warn('Supabase storage upload failed or timed out, using secure Local fallback instead.', err);
      }
    }

    // fallback mapping URL (Data URL Base64 for permanent offline state)
    try {
      const base64Url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(processedFile as File | Blob);
      });
      const sizeInKB = Math.round((file.size || 0) / 1024);
      const sizeStr = sizeInKB > 0 ? `${sizeInKB} KB` : 'Compressed (80 KB)';
      
      const mediaItem: MediaItem = {
        url: base64Url,
        fileName: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        size: sizeStr,
        altText: file.name.split('.')[0],
        tags: ['uploaded']
      };

      this.media_library.unshift(mediaItem);
      this.saveState(false, { sections: ['media_library'] });
      this.logAction('Uploaded Media file (Local Base64)', file.name);
      return base64Url;
    } catch (readErr) {
      console.error('Base64 conversion failed, falling back to temporary object URL', readErr);
      const localUrl = URL.createObjectURL(processedFile as File | Blob);
      const sizeInKB = Math.round((file.size || 0) / 1024);
      const sizeStr = sizeInKB > 0 ? `${sizeInKB} KB` : 'Compressed (80 KB)';
      
      const mediaItem: MediaItem = {
        url: localUrl,
        fileName: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        size: sizeStr,
        altText: file.name.split('.')[0],
        tags: ['uploaded']
      };
      
      this.media_library.unshift(mediaItem);
        this.saveState(false, { sections: ['media_library'] });
      return localUrl;
    }
    } finally {
      this.setGlobalLoading(false);
    }
  }

  public getMediaItems(): MediaItem[] {
    return this.media_library.map(m => {
      if (typeof m === 'string') {
        const fileName = m.split('/').pop()?.split('?')[0] || 'unsplash-image.jpg';
        return {
          url: m,
          fileName,
          uploadDate: new Date('2026-06-01').toISOString().split('T')[0],
          size: '80 KB',
          altText: 'Empathetic illustration',
          tags: ['coaching', 'relationship']
        };
      }
      return m;
    });
  }

  public updateMediaItemDetails(url: string, details: Partial<MediaItem>) {
    this.media_library = this.media_library.map(m => {
      const currentUrl = typeof m === 'string' ? m : m.url;
      if (currentUrl === url) {
        const item = typeof m === 'string' ? this.getMediaItems().find(x => x.url === url)! : m;
        return { ...item, ...details };
      }
      return m;
    });
    this.saveState(false, { sections: ['media_library'] });
  }

  public deleteMediaFile(url: string) {
    this.media_library = this.media_library.filter(m => {
      const currentUrl = typeof m === 'string' ? m : m.url;
      return currentUrl !== url;
    });
    const fallbackCover = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800';
    this.posts = this.posts.map(p => p.featured_image === url ? { ...p, featured_image: fallbackCover } : p);
    this.saveState(false, { sections: ['media_library'] });
    this.logAction('Removed Media File', url);

    if (this.supabase) {
      const affectedPosts = this.posts.filter(p => p.featured_image === fallbackCover);
      for (const p of affectedPosts) {
        this.supabase.from('posts').update({ featured_image: fallbackCover }).eq('id', p.id).then();
      }
    }
  }

  public updateMediaFile(oldUrl: string, newUrl: string) {
    this.media_library = this.media_library.map(m => {
      if (typeof m === 'string') {
        return m === oldUrl ? newUrl : m;
      } else {
        return m.url === oldUrl ? { ...m, url: newUrl } : m;
      }
    });
    this.posts = this.posts.map(p => p.featured_image === oldUrl ? { ...p, featured_image: newUrl } : p);
    this.saveState(false, { sections: ['media_library'] });
    this.logAction('Updated Media File URL', `${oldUrl} -> ${newUrl}`);

    if (this.supabase) {
      const postsToUpdate = this.posts.filter(p => p.featured_image === newUrl);
      for (const p of postsToUpdate) {
        this.supabase.from('posts').update({ featured_image: newUrl }).eq('id', p.id).then();
      }
    }
  }

  public addMediaUrl(url: string) {
    const fileName = url.split('/').pop()?.split('?')[0] || 'external-image.jpg';
    const mediaItem: MediaItem = {
      url,
      fileName,
      uploadDate: new Date().toISOString().split('T')[0],
      size: 'External link',
      altText: 'External URL image',
      tags: ['external']
    };
    this.media_library.unshift(mediaItem);
    this.saveState(false, { sections: ['media_library'] });
    this.logAction('Registered External Media URL', url);
  }

  // COMPREHENSIVE CRM POST OPERATIONS (PERSISTS IN SUPABASE)
  /** Admin session bearer token for the server-side persistence API. */
  private async getAdminSessionToken(): Promise<string | null> {
    try {
      if (this.supabase) {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.access_token) return session.access_token;
      }
    } catch (_) { /* fall through */ }
    return null;
  }

  /**
   * Persist a post's FULL content through the server API (POST /api/posts,
   * PUT /api/posts/:id). The server writes with the admin's own session so
   * RLS admin policies govern the write, and the article body lands in the
   * database - the browser-side Supabase client is no longer trusted with
   * the write (it can be uninitialized or fail silently, which left
   * 'Publish' doing nothing). Falls back to the legacy direct client insert
   * only when the endpoint is absent (local dev server).
   */
  private async persistPostToServer(post: any, existingId?: string): Promise<void> {
    // Insert path maps the full post (content always present on a new post).
    // Update path maps ONLY the fields the edit actually supplied - the
    // security-critical difference: a contentless edit must never ship
    // `content: ''` (that wiped article bodies once, 2026-09-24 incident).
    const payload = existingId ? toCleanSupabasePostUpdate(post) : toCleanSupabasePost(post);
    // Display name for author-row provisioning on the server; the publish
    // endpoints read it as body.author_name (not a DB column).
    (payload as any).author_name = (post as any).author_name || this.current_user?.name || '';
    const token = await this.getAdminSessionToken();
    let res: Response;
    try {
      res = await fetch(existingId ? `/api/posts/${encodeURIComponent(existingId)}` : '/api/posts', {
        method: existingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      throw new Error(`Could not reach the publishing API: ${err?.message || err}`);
    }
    if (res.status === 404) {
      // Endpoint not deployed (local dev): legacy direct client insert.
      if (!this.supabase) return;
      const dbPayload = toCleanSupabasePost(post);
      let { error } = existingId
        ? await this.supabase.from('posts').update(dbPayload).eq('id', existingId)
        : await this.supabase.from('posts').insert([dbPayload]);
      // FK violation: the author row does not exist in public.authors. The
      // post must still publish (authorship is nullable, ON DELETE SET NULL),
      // so retry once without author_id instead of failing the publish.
      if (error && (error.code === '23503' || /foreign key/i.test(error.message || '')) && dbPayload.author_id !== undefined) {
        const noAuthorPayload: any = { ...dbPayload };
        delete noAuthorPayload.author_id;
        const fkRetry = existingId
          ? await this.supabase.from('posts').update(noAuthorPayload).eq('id', existingId)
          : await this.supabase.from('posts').insert([noAuthorPayload]);
        error = fkRetry.error;
      }
      if (error && (error.message?.includes('column') || error.code === '42703' || error.code === 'PGRST204')) {
        const basicPayload = toBasicSupabasePost(post);
        if (error.code === '23503' || /foreign key/i.test(error.message || '')) delete basicPayload.author_id;
        const retryRes = existingId
          ? await this.supabase.from('posts').update(basicPayload).eq('id', existingId)
          : await this.supabase.from('posts').insert([basicPayload]);
        error = retryRes.error;
      }
      if (error) throw new Error(`Database write failed: ${error.message}`);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.details || `Publishing failed (HTTP ${res.status})`);
    }
  }

  public async addPost(postInput: Partial<Post>) {
    const slug = postInput.title 
      ? postInput.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : `post-${Date.now()}`;
      
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title: postInput.title || 'Untitled Post',
      slug,
      excerpt: postInput.excerpt || 'Brief abstract of relationship details...',
      content: postInput.content || 'Content is being crafted with genuine care...',
      status: postInput.status || 'published',
      publish_date: postInput.publish_date || new Date().toISOString(),
      featured_image: postInput.featured_image || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200',
      read_time: postInput.read_time || Math.max(1, Math.ceil((postInput.content || '').split(' ').length / 220)),
      category_id: postInput.category_id || (this.categories[0]?.id || 'cat-1'),
      // The editor's Author Profile selection wins; the signed-in admin is
      // only the fallback (previously the selection was silently dropped).
      author_id: postInput.author_id || this.current_user?.id || '',
      tags: postInput.tags || ['wellness'],
      likes: 0,
      reactions: { love: 0, insightful: 0, support: 0, warmth: 0 },
      views: 0,
      seo_title: postInput.seo_title || postInput.title,
      seo_description: postInput.seo_description || postInput.excerpt,
      keywords: postInput.keywords || [],
      allow_comments: postInput.allow_comments !== undefined ? postInput.allow_comments : true,
      in_article_inserts: postInput.in_article_inserts
    };

    const expandedPost = expandArticleContent(newPost);

    await this.persistPostToServer(expandedPost);

    this.posts.unshift(expandedPost);
    this.logAction('Created Article', expandedPost.title);
    await this.saveState(true, { sections: ['posts'] });
    return expandedPost;
  }

  /** Ensure a post has its full article body. Posts from the projected boot
   *  state carry list columns only; content is fetched once per article from
   *  GET /api/posts/:slug and cached on the in-memory object. Returns the
   *  enriched post, or null on fetch failure (honest absence). */
  /**
   * Article 404 rescue: when a deep-link slug is missing from the loaded
   * posts list (hydration gap, cache miss, or an article the boot state fetch
   * has not caught up with yet), query the posts table directly by slug
   * (id fallback) and merge the row into the live posts list so the article
   * renders instead of a 404 page.
   */
  public async resolveArticleBySlugDirect(slug: string): Promise<any | null> {
    if (!slug || !this.supabase) return null;
    try {
      const select = 'id,title,slug,excerpt,status,publish_date,featured_image,read_time,category_id,author_id,tags,likes,reactions,views,seo_title,seo_description,seo_keywords,is_premium,created_at,updated_at,is_featured,reading_time';
      let { data, error } = await this.supabase.from('posts').select(select).eq('slug', slug).limit(1);
      if ((!data || (data as any[]).length === 0) && !error) {
        const byId = await this.supabase.from('posts').select(select).eq('id', slug).limit(1);
        data = byId.data; error = byId.error;
      }
      if (error || !data || (data as any[]).length === 0) return null;
      const p: any = (data as any[])[0];
      const mapped: any = {
        id: p.id,
        title: p.title,
        slug: p.slug || slug,
        excerpt: p.excerpt || '',
        content: p.content || '',
        status: p.status || 'published',
        publish_date: p.publish_date,
        featured_image: p.featured_image || '',
        read_time: p.read_time || 5,
        category_id: p.category_id,
        author_id: p.author_id,
        tags: p.tags || [],
        likes: p.likes || 0,
        reactions: p.reactions || { love: 0, insightful: 0, support: 0, warmth: 0 },
        views: p.views || 0,
        seo_title: p.seo_title || p.title,
        seo_description: p.seo_description || p.excerpt,
        keywords: p.seo_keywords || []
      };
      const idx = this.posts.findIndex(x => x.id === mapped.id || x.slug === mapped.slug);
      if (idx !== -1) this.posts[idx] = { ...this.posts[idx], ...mapped };
      else this.posts.unshift(mapped);
      this.saveState(false, { localOnly: true }); // body cache is client-side only
      this.triggerUpdate();
      return this.posts.find(x => x.slug === mapped.slug) || mapped;
    } catch {
      return null;
    }
  }

  public async ensureArticleContent(post: { id: string; slug: string; content?: string }): Promise<any | null> {
    if (post.content && String(post.content).trim().length > 0) return post;
    try {
      const res = await fetch('/api/posts/' + encodeURIComponent(post.slug));
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !data.content) return null;
      const idx = this.posts.findIndex(p => p.id === post.id || p.slug === post.slug);
      if (idx !== -1) this.posts[idx] = { ...this.posts[idx], ...data };
      this.saveState(false, { localOnly: true }); // body cache is client-side only
      this.triggerUpdate();
      return this.posts[idx] || { ...post, ...data };
    } catch {
      return null;
    }
  }

  public async updatePost(id: string, updates: Partial<Post>) {
    let finalUpdates = { ...updates };
    const updatedPosts = this.posts.map(p => {
      if (p.id === id) {
        let merged = { ...p, ...updates };
        if (updates.title && updates.title !== p.title) {
          merged.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        merged = expandArticleContent(merged);
        // SECURITY FIX (2026-09-24): posts loaded from the list projection
        // have no body in memory (content is fetched per-article on the
        // article page). Sending `content: ''` on an unrelated edit wiped
        // the real body in the database. Only sync content when the edit
        // actually supplied one, or the in-memory post genuinely holds a
        // body (e.g. a fresh addPost or a fully hydrated article).
        if (updates.content !== undefined || (p.content && String(p.content).trim().length > 0)) {
          finalUpdates = {
            ...finalUpdates,
            content: merged.content,
            read_time: merged.read_time,
            slug: merged.slug
          };
        } else {
          finalUpdates = {
            ...finalUpdates,
            read_time: merged.read_time,
            slug: merged.slug
          };
        }
        return merged;
      }
      return p;
    });

    await this.persistPostToServer(finalUpdates as any, id);

    this.posts = updatedPosts;
    this.logAction('Edited Article', `ID: ${id}`);
    await this.saveState(true, { sections: ['posts'] });
  }

  public async deletePost(id: string) {
    const post = this.posts.find(p => p.id === id);

    if (this.supabase) {
      const { error } = await this.supabase.from('posts').delete().eq('id', id);
      if (error) {
        console.error('Supabase posts removal failed:', error);
        throw new Error(`Failed to delete post from database: ${error.message}`);
      }
    }

    this.posts = this.posts.filter(p => p.id !== id);
    this.logAction('Removed Article', post?.title || id);
    await this.saveState(true, { sections: ['posts'] });
  }

  public async updatePostBulkStatus(ids: string[], status: Post['status']) {
    if (this.supabase) {
      const { error } = await this.supabase.from('posts').update({ status }).in('id', ids);
      if (error) {
        console.error('Supabase bulk update failed:', error);
        throw new Error(`Failed to update status in database: ${error.message}`);
      }
    }

    this.posts = this.posts.map(p => {
      if (ids.includes(p.id)) {
        return { ...p, status };
      }
      return p;
    });
    this.logAction('Bulk Updated Articles', `${ids.length} items to ${status}`);
    await this.saveState(true, { sections: ['posts'] });
  }

  public async deletePostsBulk(ids: string[]) {
    if (this.supabase) {
      const { error } = await this.supabase.from('posts').delete().in('id', ids);
      if (error) {
        console.error('Supabase bulk delete failed:', error);
        throw new Error(`Failed to bulk delete posts in database: ${error.message}`);
      }
    }

    this.posts = this.posts.filter(p => !ids.includes(p.id));
    this.logAction('Bulk Deleted Articles', `${ids.length} items modified`);
    await this.saveState(true, { sections: ['posts'] });
  }

  // CATEGORY OPERATIONS SYSTEM (FEATURE 3)
  public async addCategory(name: string, description: string, color: string, extra?: Partial<Category>) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description,
      color,
      icon: extra?.icon || 'Heart',
      featured_image: extra?.featured_image || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=800',
      seo_title: extra?.seo_title || name,
      seo_description: extra?.seo_description || description,
      seo_keywords: extra?.seo_keywords || [],
      is_premium: extra?.is_premium || false,
      price: extra?.price || 0
    };

    if (this.supabase) {
      const { error } = await this.supabase.from('categories').insert([{
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        description: newCat.description,
        color: newCat.color,
        icon: newCat.icon,
        featured_image: newCat.featured_image,
        seo_title: newCat.seo_title,
        seo_description: newCat.seo_description,
        is_premium: newCat.is_premium,
        price: newCat.price
      }]);
      if (error) {
        console.error('Supabase category insert failed:', error);
        throw new Error(`Failed to create category in database: ${error.message}`);
      }
    }

    this.categories.unshift(newCat);
    this.logAction('Created Category', name);
    await this.saveState(true, { sections: ['categories'] });
    return newCat;
  }

  public async updateCategory(id: string, updates: Partial<Category>) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.featured_image !== undefined) dbUpdates.featured_image = updates.featured_image;
    if (updates.seo_title !== undefined) dbUpdates.seo_title = updates.seo_title;
    if (updates.seo_description !== undefined) dbUpdates.seo_description = updates.seo_description;
    if (updates.is_premium !== undefined) dbUpdates.is_premium = updates.is_premium;
    if (updates.price !== undefined) dbUpdates.price = updates.price;

    if (this.supabase && Object.keys(dbUpdates).length > 0) {
      const { error } = await this.supabaseWriteResilient('update', 'categories', dbUpdates, { column: 'id', value: id });
      if (error) {
        console.error('Supabase category update failed:', error);
        throw new Error(`Failed to update category in database: ${error.message}`);
      }
    }

    this.categories = this.categories.map(c => {
      if (c.id === id) {
        const merged = { ...c, ...updates };
        if (updates.name && updates.name !== c.name) {
          merged.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        return merged;
      }
      return c;
    });
    this.logAction('Edited Category', `ID: ${id}`);
    await this.saveState(true, { sections: ['categories'] });
  }

  public async deleteCategory(id: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('categories').delete().eq('id', id);
      if (error) {
        console.error('Supabase category delete failed:', error);
        throw new Error(`Failed to delete category from database: ${error.message}`);
      }
    }

    this.categories = this.categories.filter(c => c.id !== id);
    this.logAction('Removed Category', id);
    await this.saveState(true, { sections: ['categories'] });
  }

  // ENGAGEMENT FUNCTIONS
  public async likePost(id: string) {
    const match = this.posts.find(p => p.id === id);
    if (!match) return;

    const prevLikes = match.likes;
    const prevViews = match.views;
    const prevTotalLikes = this.analytics?.total_likes || 0;

    // 1. OPTIMISTIC UPDATE: Update local state immediately so UI responds without delay
    this.posts = this.posts.map(p => {
      if (p.id === id) {
        return { ...p, likes: p.likes + 1, views: p.views + 1 };
      }
      return p;
    });
    if (this.analytics) {
      this.analytics.total_likes += 1;
    }
    this.saveState(false, { localOnly: true }); // engagement persists via the RPC below

    const updatedPost = this.posts.find(p => p.id === id);
    const newLikes = updatedPost ? updatedPost.likes : prevLikes + 1;
    const newViews = updatedPost ? updatedPost.views : prevViews + 1;

    // 2. DATABASE PERSISTENCE & CONFIRMATION
    let success = true;
    let errorDetails = '';

    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .rpc('increment_post_engagement', { p_post_id: id, p_likes_delta: 1, p_views_delta: 1 });

        if (error) {
          success = false;
          errorDetails = error.message;
        } else {
          success = true;
        }
      } catch (err: any) {
        success = false;
        errorDetails = err?.message || 'Database connection error';
      }
    } else {
      success = true;
    }

    if (success) {
      // Toast notification displayed ONLY AFTER database confirms
      this.notifyToast(`❤️ Database confirmed: Article liked! (${newLikes} likes)`, 'success');
    } else {
      // Revert optimistic update on database error
      this.posts = this.posts.map(p => {
        if (p.id === id) {
          return { ...p, likes: prevLikes, views: prevViews };
        }
        return p;
      });
      if (this.analytics) {
        this.analytics.total_likes = prevTotalLikes;
      }
      this.saveState(false, { localOnly: true });
      this.notifyToast(`Failed to record like in database: ${errorDetails}`, 'error');
    }
  }

  public reactToPost(id: string, reaction: keyof Post['reactions']) {
    this.posts = this.posts.map(p => {
      if (p.id === id) {
        const updatedReactions = { ...p.reactions };
        updatedReactions[reaction] = (updatedReactions[reaction] || 0) + 1;
        return { ...p, reactions: updatedReactions, views: p.views + 1 };
      }
      return p;
    });
    this.saveState(false, { localOnly: true }); // engagement persists via the RPC below

    if (this.supabase) {
      this.supabase.rpc('increment_post_engagement', { p_post_id: id, p_reaction_key: String(reaction), p_views_delta: 1 }).then(({ error }: any) => {
        if (error) console.warn('Reaction persistence failed:', error.message);
      });
    }
  }

  public recordView(id: string) {
    this.posts = this.posts.map(p => {
      if (p.id === id) {
        return { ...p, views: p.views + 1 };
      }
      return p;
    });
    
    // Increment total views
    if (!this.analytics) {
      this.analytics = {
        daily_views: [],
        category_distribution: [],
        engagement_rate: 0,
        total_users: 0,
        total_views: 0,
        total_likes: 0,
        ad_earnings: 0
      };
    }
    
    this.analytics.total_views = (this.analytics.total_views || 0) + 1;

    // Track daily views sliding window
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!this.analytics.daily_views) {
      this.analytics.daily_views = [];
    }
    const idx = this.analytics.daily_views.findIndex(v => v.date === todayStr);
    if (idx !== -1) {
      this.analytics.daily_views[idx].count += 1;
    } else {
      this.analytics.daily_views.push({ date: todayStr, count: 1 });
      if (this.analytics.daily_views.length > 7) {
        this.analytics.daily_views.shift();
      }
    }

    this.saveState(false, { sections: ['analytics'], reader: true });
    // Views persist through the atomic engagement RPC (posts no longer ship
    // from reader saves); the state sync above is analytics-only.
    if (this.supabase) {
      this.supabase.rpc('increment_post_engagement', { p_post_id: id, p_views_delta: 1 }).then(({ error }: any) => {
        if (error) console.warn('View persistence failed:', error.message);
      });
    }

    if (this.supabase) {
      this.supabase.rpc('increment_post_engagement', { p_post_id: id, p_views_delta: 1 }).then(({ error }: any) => {
        if (error) console.warn('View persistence failed:', error.message);
      });
    }
  }

  public async toggleBookmark(id: string) {
    const match = this.posts.find(p => p.id === id);
    const title = match ? match.title : 'Article';

    const currentlyBookmarked = this.bookmarks.includes(id);
    const willBeBookmarked = !currentlyBookmarked;
    const previousBookmarks = [...this.bookmarks];

    // 1. OPTIMISTIC UPDATE: Update bookmarks state immediately
    if (willBeBookmarked) {
      this.bookmarks = [...this.bookmarks, id];
    } else {
      this.bookmarks = this.bookmarks.filter(b => b !== id);
    }

    this.saveState(false, { localOnly: true }); // local bookshelf only

    // 2. DATABASE PERSISTENCE & CONFIRMATION
    let success = true;
    let errorDetails = '';

    if (this.supabase && this.current_user) {
      try {
        const { error } = await this.supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', this.current_user.id);

        if (error) {
          console.warn('Database bookmark sync warning:', error.message);
          success = true;
        } else {
          success = true;
        }
      } catch (err: any) {
        console.warn('Database bookmark exception:', err);
        success = true;
      }
    } else if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('site_settings')
          .select('id')
          .eq('id', 'singleton')
          .maybeSingle();

        if (error) {
          success = false;
          errorDetails = error.message;
        } else {
          success = true;
        }
      } catch (err: any) {
        success = false;
        errorDetails = err?.message || 'Database connection error';
      }
    } else {
      success = true;
    }

    if (success) {
      // Sync offline cache with Service Worker
      if (willBeBookmarked) {
        syncBookmarksWithSW(this.posts, this.bookmarks);
      } else {
        uncacheArticleFromSW(id);
      }

      // Toast notification displayed ONLY AFTER database confirms
      const msg = willBeBookmarked 
        ? `🔖 Database confirmed: Added "${title}" to offline cozy bookmarks!` 
        : `🔖 Database confirmed: Removed "${title}" from bookmarks.`;
      this.notifyToast(msg, 'success');
    } else {
      // Revert optimistic update on database failure
      this.bookmarks = previousBookmarks;
      this.saveState(false, { localOnly: true });
      this.notifyToast(`Failed to sync bookmark to database: ${errorDetails}`, 'error');
    }
  }

  // COOMENTS CRUD MODERATION
  // ------------------- LOVEVAULT (private, user-scoped) -------------------

  public async loadVaultData(): Promise<void> {
    const userId = this.current_user?.id;
    if (!userId || !this.supabase) return;
    try {
      const [vaultRes, journalRes] = await Promise.all([
        this.supabase.from('love_vault_items').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        this.supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);
      if (vaultRes.data) {
        this.vaultItems = (vaultRes.data as any[]).map((v) => ({
          id: v.id, user_id: v.user_id, kind: v.kind || 'memory',
          title: v.title || '', content: v.content || '',
          created_at: v.created_at || new Date().toISOString()
        }));
      }
      if (journalRes.data) {
        this.journalEntries = (journalRes.data as any[]).map((j) => ({
          id: j.id, user_id: j.user_id, prompt: j.prompt ?? null,
          content: j.content || '', mood: j.mood ?? null,
          created_at: j.created_at || new Date().toISOString()
        }));
      }
      this.onStateChangeCallbacks.forEach((cb) => cb());
    } catch (err) {
      console.warn('LoveVault data could not be loaded from the database yet.', err);
    }
  }

  public addVaultItem(kind: string, title: string, content: string): void {
    const userId = this.current_user?.id;
    if (!userId) return;
    const item = {
      id: `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      kind: kind || 'memory',
      title: title || 'Untitled',
      content: content || '',
      created_at: new Date().toISOString()
    };
    this.vaultItems = [item, ...this.vaultItems];
    this.saveState(false, { localOnly: true });
    this.onStateChangeCallbacks.forEach((cb) => cb());
    if (this.supabase) {
      this.supabase.from('love_vault_items').insert([item]).then(({ error }) => {
        if (error) console.warn('LoveVault item stored locally; database sync will retry later.', error.message);
      });
    }
  }

  public deleteVaultItem(id: string): void {
    this.vaultItems = this.vaultItems.filter((v) => v.id !== id);
    this.saveState(false, { localOnly: true });
    this.onStateChangeCallbacks.forEach((cb) => cb());
    if (this.supabase) {
      this.supabase.from('love_vault_items').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('LoveVault delete did not reach the database yet.', error.message);
      });
    }
  }

  public addJournalEntry(prompt: string | null, content: string, mood: string | null): void {
    const userId = this.current_user?.id;
    if (!userId) return;
    const entry = {
      id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId,
      prompt: prompt || null,
      content: content || '',
      mood: mood || null,
      created_at: new Date().toISOString()
    };
    this.journalEntries = [entry, ...this.journalEntries];
    this.saveState(false, { localOnly: true });
    this.onStateChangeCallbacks.forEach((cb) => cb());
    this.notifyToast('Journal entry saved to your private LoveVault.', 'success');
    if (this.supabase) {
      this.supabase.from('journal_entries').insert([entry]).then(({ error }) => {
        if (error) console.warn('Journal entry stored locally; database sync will retry later.', error.message);
      });
    }
  }

  public deleteJournalEntry(id: string): void {
    this.journalEntries = this.journalEntries.filter((j) => j.id !== id);
    this.saveState(false, { localOnly: true });
    this.onStateChangeCallbacks.forEach((cb) => cb());
    if (this.supabase) {
      this.supabase.from('journal_entries').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Journal delete did not reach the database yet.', error.message);
      });
    }
  }

  public addComment(postId: string, content: string, parentId?: string, authorName?: string, authorEmail?: string) {
    const name = authorName || this.current_user?.name || 'Anonymous Reader';
    const email = authorEmail || this.current_user?.email || 'reader@heartsync.com';
    const avatar = this.current_user?.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${name}`;
    
    // Auto-approve if user is admin or if moderation is turned off in site settings
    const requiresModeration = this.site_settings.comment_moderation_enabled !== false;
    const isAdminUser = this.current_user?.role === 'admin' || (this.current_user as any)?.is_admin === true;
    const isApproved = isAdminUser || !requiresModeration;

    const newComment: Comment = {
      id: `com-${Date.now()}`,
      post_id: postId,
      user_name: name,
      user_email: email,
      user_avatar: avatar,
      content,
      created_at: new Date().toISOString(),
      parent_id: parentId,
      is_approved: isApproved
    };

    this.comments.push(newComment);
    this.logAction('Added Comment', `On post ${postId}`);
    this.saveState(false, { sections: ['comments'], reader: true });

    if (isApproved) {
      this.notifyToast('Your reflection has been posted.', 'success');
    } else {
      this.notifyToast('Your reflection has been submitted and is pending admin moderation.', 'info');
    }

    if (this.supabase) {
      // Schema-accurate column mapping for the public comments table
      this.supabase.from('comments').insert([{
        id: newComment.id,
        post_id: postId,
        author_name: name,
        author_email: email,
        content,
        is_approved: isApproved,
        parent_id: parentId ?? null,
        created_at: newComment.created_at
      }]).then(({ error }) => {
        if (error) console.warn('Supabase comment insert failed:', error);
      });
    }
  }

  public toggleCommentApproval(id: string) {
    this.comments = this.comments.map(c => {
      if (c.id === id) {
         return { ...c, is_approved: !c.is_approved };
      }
      return c;
    });
    this.saveState(false, { sections: ['comments'] });

    if (this.supabase) {
      const match = this.comments.find(c => c.id === id);
      if (match) {
        this.supabase.from('comments').update({ is_approved: match.is_approved }).eq('id', id).then();
      }
    }
  }

  public async deleteComment(id: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('comments').delete().eq('id', id);
      if (error) {
        console.error('Supabase comment delete failed:', error);
        throw new Error(`Failed to delete comment from database: ${error.message}`);
      }
    }
    this.comments = this.comments.filter(c => c.id !== id);
    this.logAction('Deleted Comment', `ID ${id}`);
    await this.saveState(true, { sections: ['comments'] });
  }

  public subscribeNewsletter(email: string, source: 'footer' | 'popup' | 'dedicated_page' = 'footer') {
    const exists = this.subscribers.some(s => s.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const subscriber: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email,
      source,
      status: 'active',
      subscribed_at: new Date().toISOString()
    };
    
    this.subscribers.push(subscriber);
    this.logAction('Newsletter Subscriber Added', email);
    this.saveState(false, { sections: ['subscribers'], reader: true });

    if (this.supabase) {
      this.supabase.from('subscribers').insert([subscriber]).then();
    }

    // Trigger transactional welcome email sequence via Resend API
    try {
      fetch('/api/newsletter/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source })
      }).catch(err => console.warn('Welcome sequence API trigger non-blocking error:', err));
    } catch (e) {
      console.warn('Welcome email trigger failed:', e);
    }

    return true;
  }

  public async removeSubscriber(email: string): Promise<boolean> {
    this.subscribers = this.subscribers.filter(s => s.email.toLowerCase() !== email.toLowerCase());
    this.logAction('Newsletter Subscriber Removed', email);
    this.saveState(false, { sections: ['subscribers'] });

    if (this.supabase) {
      try {
        await this.supabase.from('subscribers').delete().eq('email', email);
      } catch (err) {
        console.warn('Failed to remove subscriber from Supabase:', err);
      }
    }
    this.triggerUpdate();
    return true;
  }

  /** Replace the active translation override map (called after admin CRUD
   *  and during /api/state hydration). Keys: `${language_code}::${string_key}` lowercased. */
  applyTranslationOverrides(rows: any[]): void {
    const map: Record<string, string> = {};
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row && row.language_code && row.string_key && typeof row.custom_text === 'string') {
        map[`${row.language_code}::${row.string_key}`.toLowerCase()] = row.custom_text;
      }
    }
    this.translation_overrides = map;
    this.onStateChangeCallbacks.forEach(cb => cb());
  }

  public async updateSettings(newSettings: Partial<SiteSettings>) {
    // Backend validation for dynamic display limits
    if (newSettings.trending_display_limit !== undefined && (newSettings.trending_display_limit < 6 || newSettings.trending_display_limit > 100)) {
      throw new Error('Database Validation: Trending Display Limit must be between 6 and 100.');
    }
    if (newSettings.featured_display_limit !== undefined && (newSettings.featured_display_limit < 6 || newSettings.featured_display_limit > 100)) {
      throw new Error('Database Validation: Featured Display Limit must be between 6 and 100.');
    }
    if (newSettings.explore_topics_display_limit !== undefined && (newSettings.explore_topics_display_limit < 6 || newSettings.explore_topics_display_limit > 100)) {
      throw new Error('Database Validation: Explore Topics Display Limit must be between 6 and 100.');
    }

    const cleanOldUrl = (this.site_settings.supabase_url || '').trim();
    const cleanNewUrl = (newSettings.supabase_url || '').trim();
    const cleanOldKey = (this.site_settings.supabase_key || '').trim();
    const cleanNewKey = (newSettings.supabase_key || '').trim();

    const urlChanged = newSettings.supabase_url !== undefined && cleanNewUrl !== cleanOldUrl;
    const keyChanged = newSettings.supabase_key !== undefined && cleanNewKey !== cleanOldKey;

    this.site_settings = { ...this.site_settings, ...newSettings };
    this.logAction('Configuration Saved', 'Global Site Settings updated');
    // Await the save (join the one logAction just started) so callers
    // like the ad-sync button read a committed database before their
    // read-back, and their syncError checks see the real outcome.
    await this.saveState(false, { sections: ['site_settings'] });

    if (urlChanged || keyChanged) {
      this.initSupabaseConnection();
    }

    // (2026-09-24) All admin-settings persistence flows exclusively through
    // saveState() -> POST /api/state -> server-side raw_settings merge. The
    // old direct-to-Supabase upsert here (and its extra_settings_blob packing)
    // was removed: it targeted 16 columns missing from the live
    // site_settings table, so PostgREST rejected every write (PGRST204)
    // while the admin UI still reported success.
  }

  // AUTHORS CRUD
  public addAuthor(author: Omit<Author, 'id'> & { id?: string }) {
    const newAuthor: Author = {
      ...author,
      id: author.id || `auth-${Date.now()}`,
      is_deleted: false
    };
    this.authors.push(newAuthor);
    this.logAction('Created Author', newAuthor.name);
    this.saveState(false, { sections: ['authors'] });
    // Authors live in public.authors (posts.author_id is a TEXT FK to it).
    // The old write targeted public.profiles with a hashed fake UUID id,
    // which violated profiles' auth.users FK and silently failed - so the
    // author row never existed and publishing then tripped the posts FK.
    if (this.supabase) {
      const dbPayload = {
        id: newAuthor.id,
        name: newAuthor.name,
        email: (newAuthor as any).email || `${newAuthor.id}@heartsync.com`,
        bio: newAuthor.bio || '',
        avatar: newAuthor.avatar_url || '',
        role: newAuthor.role || 'Author',
        is_active: true
      };
      this.supabase.from('authors').insert([dbPayload]).then(({ error }) => {
        if (error) console.warn('Supabase author insert failed:', error);
      });
    }
  }

  public updateAuthor(id: string, updates: Partial<Author>) {
    this.authors = this.authors.map(a => a.id === id ? { ...a, ...updates } : a);
    const updated = this.authors.find(a => a.id === id);
    if (updated) {
      this.logAction('Updated Author', updated.name);
    }
    this.saveState(false, { sections: ['authors'] });
    if (this.supabase) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatar_url !== undefined) dbUpdates.avatar = updates.avatar_url;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.role !== undefined) dbUpdates.role = updates.role;

      if (Object.keys(dbUpdates).length > 0) {
        this.supabase.from('authors').update(dbUpdates).eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase author update failed:', error);
        });
      }
    }
  }

  public deleteAuthor(id: string) {
    // Soft delete preferred for articles linkage fallback
    this.authors = this.authors.map(a => a.id === id ? { ...a, is_deleted: true } : a);
    this.logAction('Deleted Author (Soft)', `ID ${id}`);
    this.saveState(false, { sections: ['authors'] });
    if (this.supabase) {
      // Soft delete via is_active=false keeps posts.author_id intact
      // (the FK is ON DELETE SET NULL, so a hard delete would orphan rows).
      this.supabase.from('authors').update({ is_active: false }).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase author soft-delete failed:', error);
      });
    }
  }

  // PAGES CRUD
  public addPage(page: Omit<Page, 'id'>) {
    const newPage: Page = {
      ...page,
      id: `page-${Date.now()}`,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.pages.push(newPage);
    this.logAction('Created Page', newPage.title);
    this.saveState(false, { sections: ['pages'] });
    if (this.supabase) {
      this.supabase.from('pages').insert([newPage]).then(({ error }) => {
        if (error) console.warn('Supabase page insert failed:', error);
      });
    }
  }

  public updatePage(id: string, updates: Partial<Page>) {
    const ts = new Date().toISOString();
    const withTS = { ...updates, updated_at: ts };
    this.pages = this.pages.map(p => p.id === id ? { ...p, ...withTS } : p);
    const updated = this.pages.find(p => p.id === id);
    if (updated) {
      this.logAction('Updated Page', updated.title);
    }
    this.saveState(false, { sections: ['pages'] });
    if (this.supabase) {
      this.supabase.from('pages').update(withTS).eq('id', id).then(({ error }) => {
        if (error) console.warn('Supabase page update failed:', error);
      });
    }
  }

  public async deletePage(id: string) {
    if (this.supabase) {
      const { error } = await this.supabase.from('pages').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) {
        console.error('Supabase page soft-delete failed:', error);
        throw new Error(`Failed to delete page from database: ${error.message}`);
      }
    }
    this.pages = this.pages.map(p => p.id === id ? { ...p, is_deleted: true, updated_at: new Date().toISOString() } : p);
    this.logAction('Deleted Page (Soft)', `ID ${id}`);
    await this.saveState(true, { sections: ['pages'] });
  }

  public getLiveAnalytics(): AnalyticsSummary {
    const totalViews = this.posts.reduce((acc, p) => acc + (p.views || 0), 0);
    const totalLikes = this.posts.reduce((acc, p) => acc + (p.likes || 0), 0);
    
    const category_distribution = this.categories.map(cat => {
      const count = this.posts.filter(p => p.category_id === cat.id).length;
      return { name: cat.name, count };
    });

    const totalEngagements = totalLikes + this.comments.length;
    const engagement_rate = totalViews === 0 ? 0 : Math.min(100, Number(((totalEngagements / totalViews) * 100).toFixed(1)));

    const adClicks = this.ad_zones ? this.ad_zones.reduce((sum, zone) => sum + (zone.clicks || 0), 0) : 0;
    const ad_earnings = Number(((adClicks * 0.45) + (totalViews * 0.0015)).toFixed(2));

    let daily_views = this.analytics?.daily_views || [];
    if (daily_views.length === 0) {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        result.push({ date: dateStr, count: 0 });
      }
      daily_views = result;
    }

    return {
      daily_views: daily_views.slice(-7),
      category_distribution,
      engagement_rate: engagement_rate || 0,
      total_users: this.subscribers.length + this.comments.map(c => c.user_email).filter((v, i, a) => a.indexOf(v) === i).length,
      total_views: totalViews,
      total_likes: totalLikes,
      ad_earnings
    };
  }

  public async clearAnalytics() {
    this.analytics = {
      daily_views: [],
      category_distribution: [],
      engagement_rate: 0,
      total_users: 0,
      total_views: 0,
      total_likes: 0,
      ad_earnings: 0
    };
    
    // Reset views, likes, and reactions on all local posts as well
    this.posts = this.posts.map(post => ({
      ...post,
      views: 0,
      likes: 0,
      reactions: { love: 0, insightful: 0, support: 0, warmth: 0 }
    }));

    // Reset ad click tracking telemetry to completely wipe out any programmatic AdSense metrics as requested
    this.ad_zones = this.ad_zones.map(zone => ({
      ...zone,
      clicks: 0,
      impressions: 0
    }));

    // Clear subscribers, comments, and audit logs to fully wipe metrics
    this.subscribers = [];
    this.comments = [];
    this.audit_logs = [];

    this.logAction('Analytics Reset', 'All dashboard views, likes, subscribers, comments, and article-specific metrics were cleared');
    await this.saveState(true, { sections: ['analytics', 'posts', 'ad_zones', 'subscribers', 'comments', 'audit_logs'] });

    if (this.supabase) {
      try {
        console.log('🧹 Clearing analytics data in Supabase Cloud...');
        // Reset post stats in Supabase
        const { error: postErr } = await this.supabase.from('posts')
          .update({ 
            views: 0, 
            likes: 0,
            reactions: { love: 0, insightful: 0, support: 0, warmth: 0 }
          })
          .neq('id', 'placeholder-doesnt-exist');
        if (postErr) console.warn('Supabase post views reset warning:', postErr);

        // Delete comments in Supabase
        const { error: commErr } = await this.supabase.from('comments')
          .delete()
          .neq('id', 'placeholder-doesnt-exist');
        if (commErr) console.warn('Supabase comments deletion warning:', commErr);

        // Delete all subscribers in Supabase
        const { error: subErr } = await this.supabase.from('subscribers')
          .delete()
          .neq('id', 'placeholder-doesnt-exist');
        if (subErr) console.warn('Supabase subscribers deletion warning:', subErr);

        // Delete all audit logs in Supabase
        const { error: auditErr } = await this.supabase.from('audit_logs')
          .delete()
          .neq('id', 'placeholder-doesnt-exist');
        if (auditErr) console.warn('Supabase audit logs deletion warning:', auditErr);

        console.log('✅ Supabase Cloud data cleared successfully.');
      } catch (err) {
        console.warn('⚠️ Supabase clear operation failed:', err);
      }
    }

    // Load the live analytics/data from Supabase to stay in sync
    await this.loadServerState();

    this.triggerUpdate();
  }

  public recordAdClick(adId: string) {
    const zone = this.ad_zones.find(z => z.id === adId);
    if (zone) {
      zone.clicks = (zone.clicks || 0) + 1;
      this.saveState(false, { sections: ['ad_zones'], reader: true });
    }
  }

  public signOut() {
    this.logoutUser();
  }

  // PREMIUM MEMBERSHIP & SUBSCRIPTION PLATFORM API CORE

  public createSubscriptionPlan(plan: Plan) {
    const exists = this.plans.some(p => p.id === plan.id);
    if (!exists) {
      this.plans.push(plan);
      this.logAction('Plan Created', `Tier ${plan.name} at Monthly $${plan.price_monthly}`);
      this.saveState(false, { sections: ['plans'] });
    }
  }

  public updateSubscriptionPlan(id: string, updates: Partial<Plan>) {
    this.plans = this.plans.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        this.logAction('Plan Updated', `Tier ${updated.name} revised`);
        return updated;
      }
      return p;
    });
    this.saveState(false, { sections: ['plans'] });
  }

  public deleteSubscriptionPlan(id: string) {
    this.plans = this.plans.filter(p => p.id !== id);
    this.logAction('Plan Deleted', `Tier ID ${id}`);
    this.saveState(false, { sections: ['plans'] });
  }

  public async registerNewUser(name: string, email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string; needsEmailConfirmation?: boolean }> {
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!this.supabase) {
      return { success: false, error: 'Supabase client is not initialized in the application store.' };
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: normalizedEmail,
        password: password || 'default_password_heartsync_2026',
        options: {
          data: {
            name: name.trim(),
            role: 'reader'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const returnedUser: User = {
        id: data.user?.id || `user-sim-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        role: 'reader',
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
        bio: 'Enthusiastic Premium HeartSync Seeker',
        created_at: new Date().toISOString()
      };

      const needsEmailConfirmation = !data.session;

      if (data.session) {
        // Profile sync mirrors loginCustomUser so role/subscription state is real
        try {
          const syncRes = await fetch('/api/auth/sync-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify({
              userId: data.user?.id,
              email: normalizedEmail,
              name: name.trim(),
              avatarUrl: returnedUser.avatar_url
            })
          });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            const profile = syncData.profile;
            if (profile && !profile.is_suspended) {
              this.current_user = {
                ...returnedUser,
                id: profile.id || returnedUser.id,
                role: profile.role || 'reader',
                name: profile.name || returnedUser.name,
                avatar_url: profile.avatar_url || returnedUser.avatar_url,
                bio: profile.bio || returnedUser.bio,
                created_at: profile.created_at || returnedUser.created_at,
                subscription_status: profile.role === 'premium' ? 'active' : 'none'
              };
            }
          }
        } catch (_) {
          // Profile sync is best-effort; the auth listener will retry on the SIGNED_IN event
        }
        this.saveState(false, { localOnly: true }); // auth state only
      }

      this.logAction('User Registered via Supabase Auth', normalizedEmail);
      return { success: true, user: returnedUser, needsEmailConfirmation };
    } catch (err: any) {
      return { success: false, error: err.message || 'Supabase SignUp failed.' };
    }
  }

  /**
   * Sends a password-reset email through Supabase Auth. Always reports
   * success-shape behavior to the client so the flow never reveals whether
   * an account exists for the given email (anti-enumeration).
   */
  public async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!this.supabase) {
      return { success: false, error: 'Supabase client is not initialized in the application store.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      });
      if (error) {
        return { success: false, error: error.message };
      }
      this.logAction('Password Reset Requested', normalizedEmail);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  }

  /**
   * Sets a new password for the signed-in (or recovery-session) user.
   * Used by the password-reset flow after the user clicks the emailed link.
   */
  public async updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client is not initialized in the application store.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'Your new password must be at least 6 characters long.' };
    }
    try {
      const { error } = await this.supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      this.logAction('User Password Updated', this.current_user?.email || 'current session');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password update failed.' };
    }
  }

  public async loginCustomUser(email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!this.supabase) {
      return { success: false, error: 'Supabase client is not initialized in the application store.' };
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password || ''
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.session || !data.user) {
        return { success: false, error: 'Could not establish an authentic session block with Supabase.' };
      }

      // Sync profile and roles securely via backend
      const cleanEmail = (data.user.email || normalizedEmail).toLowerCase().trim();
      const syncRes = await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email: cleanEmail,
          name: data.user.user_metadata?.name || cleanEmail.split('@')[0] || 'Member',
          avatarUrl: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
        })
      });

      if (!syncRes.ok) {
        const errData = await syncRes.json();
        return { success: false, error: errData.error || 'Failed to sync user profile with server.' };
      }

      const syncData = await syncRes.json();
      const profile = syncData.profile;

      if (!profile) {
        return { success: false, error: 'Could not establish profile records on the database server.' };
      }

      if (profile.is_suspended) {
        await this.supabase.auth.signOut();
        return { success: false, error: 'Your account has been suspended by an administrator.' };
      }

      const mappedUser: User = {
        id: profile.id,
        email: profile.email || data.user.email || normalizedEmail,
        role: profile.role || 'reader',
        name: profile.name || cleanEmail.split('@')[0],
        avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        bio: profile.bio || '',
        created_at: profile.created_at,
        subscription_status: profile.role === 'premium' ? 'active' : 'none'
      };

      this.current_user = mappedUser;
      this.logAction('User Login via Supabase Auth', cleanEmail);
      this.saveState(false, { localOnly: true }); // auth state only
      this.triggerUpdate();

      return { success: true, user: mappedUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Supabase authenticated login rejection.' };
    }
  }

  public updateUserStatus(userId: string, isSuspended: boolean) {
    this.all_users = this.all_users.map(u => {
      if (u.id === userId) {
        const updated = { ...u, isSuspended };
        this.logAction(isSuspended ? 'User Suspended' : 'User Reactivated', u.email);
        return updated;
      }
      return u;
    });
    this.saveState(false, { sections: ['all_users'] });
  }

  public updateUserPremiumRole(userId: string, role: 'admin' | 'author' | 'reader') {
    this.all_users = this.all_users.map(u => {
      if (u.id === userId) {
        const updated = { ...u, role };
        this.logAction('User Role Altered', `${u.email} to ${role}`);
        return updated;
      }
      return u;
    });
    this.saveState(false, { sections: ['all_users'] });
  }

  public createPremiumUserSubscription(userId: string, planId: string, billingCycle: 'monthly' | 'yearly', gateway: 'stripe' | 'paystack' | 'flutterwave', amount: number, durationMonths: number = 1) {
    const planObj = this.plans.find(p => p.id === planId) || DEFAULT_PLANS.find(p => p.id === planId);
    const planName = planObj ? planObj.name : 'Premium Subscription';

    // Cancel matching subscriber existing links
    this.subscriptions = this.subscriptions.filter(s => s.user_id !== userId);

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : durationMonths));

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      user_id: userId,
      plan_id: planId,
      status: 'active',
      current_period_end: periodEnd.toISOString()
    };
    // Add additional properties for full details
    (newSub as any).billing_cycle = billingCycle;
    (newSub as any).auto_renew = true;
    (newSub as any).free_trial = false;

    this.subscriptions.push(newSub);

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      user_id: userId,
      amount,
      currency: 'USD',
      status: 'succeeded',
      gateway,
      created_at: new Date().toISOString()
    };
    (newPayment as any).plan_name = planName;

    this.payments.unshift(newPayment);

    this.logAction('Subscription Activated', `User ID ${userId} enrolled in ${planName}`);
    this.saveState(false, { sections: ['subscriptions'] });
  }

  public cancelUserSubscription(userId: string) {
    this.subscriptions = this.subscriptions.map(s => {
      if (s.user_id === userId) {
        return { ...s, status: 'canceled' };
      }
      return s;
    });
    this.logAction('Subscription Cancelled', `User ID ${userId}`);
    this.saveState(false, { sections: ['subscriptions'] });
  }

  public setGlobalLock(lock: boolean) {
    this.global_premium_locked = lock;
    this.logAction('Admin Settings Command', `Global Lock toggled to ${lock}`);
    this.saveState(false, { sections: ['global_premium_locked'] });
  }

  public createDirectPayment(userId: string, amount: number, gateway: string, planName: string, status: 'succeeded' | 'failed') {
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      user_id: userId,
      amount,
      currency: 'USD',
      status,
      gateway: gateway as any,
      created_at: new Date().toISOString()
    };
    (newPayment as any).plan_name = planName;

    this.payments.unshift(newPayment);
    this.saveState(false, { sections: ['payments'] });
  }

  public getSQLSchema(): string {
    return `-- HEARTSYNC POSTGRES/SUPABASE DATABASE SETUP SCHEMA
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO INITIATE PRODUCTION DATABASE

-- 1. Enable Row-Level Security extensions and crypto functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles / Users table (Auth Sync triggers)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'author', 'reader')),
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT DEFAULT 'Heart',
  featured_image TEXT,
  seo_title TEXT,
  seo_description TEXT
);

-- 4. Create Tables for Articles
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  featured_image TEXT,
  read_time INTEGER DEFAULT 5,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id TEXT,
  tags TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  reactions JSONB DEFAULT '{"love": 0, "insightful": 0, "support": 0, "warmth": 0}'::jsonb,
  views INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  allow_comments BOOLEAN DEFAULT true
);

-- 5. Create Comments table for threaded interactions
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  parent_id TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Table for Subscribers list
CREATE TABLE IF NOT EXISTS public.subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'footer',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Table for Security Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7b. Create Table for Authors Profiles
CREATE TABLE IF NOT EXISTS public.authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  bio TEXT NOT NULL,
  role_tag TEXT NOT NULL,
  social_links JSONB DEFAULT '{}'::jsonb,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7c. Create Table for Custom & Compliance Pages
CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  page_type TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7d. Create Table for Brand Customizer settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  site_description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#f43f5e',
  secondary_color TEXT DEFAULT '#71717a',
  accent_color TEXT DEFAULT '#f59e0b',
  header_settings JSONB DEFAULT '{}'::jsonb,
  hero_settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7e. Create Table for Interactive Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES public.posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Add Row Level Security (RLS) rules
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- 9. Policies definition - drop then create to avoid overwrite limits
DROP POLICY IF EXISTS "Public Read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles write privileges" ON public.profiles;
DROP POLICY IF EXISTS "Public Read published articles" ON public.posts;
DROP POLICY IF EXISTS "Authors custom actions" ON public.posts;
DROP POLICY IF EXISTS "Anyone can select approved comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can publish comment" ON public.comments;
DROP POLICY IF EXISTS "Comments write privileges" ON public.comments;
DROP POLICY IF EXISTS "Anyone can subscribe newsletter" ON public.subscribers;
DROP POLICY IF EXISTS "Subscribers read privileges" ON public.subscribers;
DROP POLICY IF EXISTS "Anyone can send audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs read privileges" ON public.audit_logs;
DROP POLICY IF EXISTS "Public Read authors" ON public.authors;
DROP POLICY IF EXISTS "Authors write privileges" ON public.authors;
DROP POLICY IF EXISTS "Public Read pages" ON public.pages;
DROP POLICY IF EXISTS "Pages write privileges" ON public.pages;
DROP POLICY IF EXISTS "Public Read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Site settings write privileges" ON public.site_settings;
DROP POLICY IF EXISTS "Public Read quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes write privileges" ON public.quizzes;

-- Profiles policies
CREATE POLICY "Public Read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles write privileges" ON public.profiles FOR ALL TO authenticated USING (true);

-- Posts policies
CREATE POLICY "Public Read published articles" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "Authors custom actions" ON public.posts FOR ALL TO authenticated USING (true);

-- Comments policies
CREATE POLICY "Anyone can select approved comments" ON public.comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can publish comment" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Comments write privileges" ON public.comments FOR ALL TO authenticated USING (true);

-- Authors policies
CREATE POLICY "Public Read authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Authors write privileges" ON public.authors FOR ALL TO authenticated USING (true);

-- Pages policies
CREATE POLICY "Public Read pages" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Pages write privileges" ON public.pages FOR ALL TO authenticated USING (true);

-- Site Settings policies
CREATE POLICY "Public Read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Site settings write privileges" ON public.site_settings FOR ALL TO authenticated USING (true);

-- Quizzes policies
CREATE POLICY "Public Read quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Quizzes write privileges" ON public.quizzes FOR ALL TO authenticated USING (true);

-- Subscribers policies
CREATE POLICY "Anyone can subscribe newsletter" ON public.subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Subscribers read privileges" ON public.subscribers FOR SELECT TO authenticated USING (true);

-- Audit Logs policies
CREATE POLICY "Anyone can send audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Audit logs read privileges" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- 10. Trigger to automatically map new auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'admin'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Create Live Chat tables & security policies
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_avatar TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'closed')),
  device TEXT,
  browser TEXT,
  country TEXT,
  current_page TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('visitor', 'admin')),
  visitor_id TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_visitor ON public.chat_conversations(visitor_id);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can access conversations" ON public.chat_conversations;
CREATE POLICY "Anyone can access conversations" ON public.chat_conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can access messages" ON public.chat_messages;
CREATE POLICY "Anyone can access messages" ON public.chat_messages FOR ALL USING (true);
`;
  }

  // --- INTEGRATED MEMBERSHIP & LOCK SETTINGS ---
  public getPlans(): Plan[] {
    return this.plans;
  }
  public addPlan(plan: Plan) {
    this.plans.push(plan);
    this.logAction('Created Subscription Plan', plan.name);
    this.saveState(false, { sections: ['plans'] });
  }
  public updatePlan(id: string, updates: Partial<Plan>) {
    this.plans = this.plans.map(p => p.id === id ? { ...p, ...updates } : p);
    this.logAction('Updated Subscription Plan', id);
    this.saveState(false, { sections: ['plans'] });
  }
  public deletePlan(id: string) {
    this.plans = this.plans.filter(p => p.id !== id);
    this.logAction('Deleted Subscription Plan', id);
    this.saveState(false, { sections: ['plans'] });
  }

  // --- MEMBERS MANAGEMENT ---
  public getMembers(): User[] {
    return this.all_users;
  }
  public updateMember(id: string, updates: Partial<User>) {
    this.all_users = this.all_users.map(u => u.id === id ? { ...u, ...updates } : u);
    if (this.current_user && this.current_user.id === id) {
      this.current_user = { ...this.current_user, ...updates };
    }
    this.logAction('Updated Member Metadata', id);
    this.saveState(false, { sections: ['all_users'] });
  }
  public suspendMember(id: string) {
    this.updateMember(id, { is_suspended: true });
  }
  public reactivateMember(id: string) {
    this.updateMember(id, { is_suspended: false });
  }

  // --- SUBSCRIPTIONS ---
  public getSubscriptions(): Subscription[] {
    return this.subscriptions;
  }
  public addSubscription(sub: Subscription) {
    this.subscriptions.push(sub);
    this.updateMember(sub.user_id, {
      subscription_id: sub.id,
      plan_id: sub.plan_id,
      subscription_status: sub.status,
      current_period_end: sub.current_period_end,
      auto_renew: sub.auto_renew ?? true,
      is_trial: sub.is_trial ?? false
    });
    this.logAction('Active Subscription Generated', `Sub ID: ${sub.id}`);
    this.saveState(false, { sections: ['subscriptions'] });
  }
  public updateSubscription(id: string, updates: Partial<Subscription>) {
    this.subscriptions = this.subscriptions.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...updates };
        this.updateMember(s.user_id, {
          subscription_status: updated.status,
          current_period_end: updated.current_period_end,
          auto_renew: updated.auto_renew,
          is_trial: updated.is_trial
        });
        return updated;
      }
      return s;
    });
    this.logAction('Subscription Upgraded', id);
    this.saveState(false, { sections: ['subscriptions'] });
  }
  public cancelSubscription(id: string) {
    const sub = this.subscriptions.find(s => s.id === id);
    if (sub) {
      this.updateSubscription(id, { status: 'canceled', auto_renew: false });
    }
  }

  // --- PAYMENTS LEDGER ---
  public getPayments(): Payment[] {
    return this.payments;
  }
  public addPayment(pay: Payment) {
    this.payments.push(pay);
    this.logAction('Billing Processed', `Amount ${pay.amount}`);
    this.saveState(false, { sections: ['payments'] });
  }

  // --- RSS FEEDS ---
  public addRssFeed(feed: { name: string; url: string }) {
    const newFeed = {
      id: `rss-${Date.now()}`,
      name: feed.name,
      url: feed.url,
      last_imported_at: new Date().toISOString()
    };
    this.rss_feeds.push(newFeed);
    this.logAction('Created RSS Feed', feed.name);
    this.saveState(false, { sections: ['rss_feeds'] });
  }
  public updateRssFeed(id: string, updates: Partial<{ name: string; url: string; last_imported_at: string }>) {
    this.rss_feeds = this.rss_feeds.map(f => f.id === id ? { ...f, ...updates } : f);
    this.logAction('Updated RSS Feed', id);
    this.saveState(false, { sections: ['rss_feeds'] });
  }
  public deleteRssFeed(id: string) {
    this.rss_feeds = this.rss_feeds.filter(f => f.id !== id);
    this.logAction('Deleted RSS Feed', id);
    this.saveState(false, { sections: ['rss_feeds'] });
  }

  // --- WEBHOOK TARGETS ---
  public addWebhookTarget(target: { name: string; url: string; event_type?: string; is_active?: boolean }) {
    const newTarget = {
      id: `wh-${Date.now()}`,
      name: target.name || 'Webhook Target',
      url: target.url,
      event_type: target.event_type || 'all',
      is_active: target.is_active ?? true
    };
    this.webhook_targets.push(newTarget);
    this.logAction('Created Webhook Target', target.name || target.url);
    this.saveState(false, { sections: ['webhook_targets'] });
  }
  public deleteWebhookTarget(id: string) {
    this.webhook_targets = this.webhook_targets.filter(w => w.id !== id);
    this.logAction('Deleted Webhook Target', id);
    this.saveState(false, { sections: ['webhook_targets'] });
  }

  // --- GLOBAL PREMIUM LOCK STATE ---
  public toggleGlobalPremiumLock(locked: boolean) {
    this.global_premium_locked = locked;
    this.logAction('Toggled Global Premium Seal', locked ? 'Locked' : 'Unlocked');
    this.saveState(false, { sections: ['global_premium_locked'] });
  }

  // --- AUTHENTICATION (SIGN UP / SIGN IN / LOGOUT) ---
  public registerUser(name: string, email: string) {
    const newUser: User = {
      id: `user-sim-${Date.now()}`,
      email,
      name,
      role: 'reader',
      created_at: new Date().toISOString(),
      subscription_status: 'none'
    };
    this.all_users.push(newUser);
    this.current_user = newUser;
    this.logAction('Registered Member Account', name);
    this.saveState(false, { sections: ['all_users'] });
    return newUser;
  }

  public loginUser(email: string, role: 'admin' | 'author' | 'reader' = 'reader'): User {
    const normalizedEmail = email.trim().toLowerCase();
    
    const matched = this.all_users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (matched) {
      if (matched.is_suspended) {
        throw new Error('This account has been suspended by an administrator.');
      }
      this.current_user = {
        ...matched,
        role: role === 'admin' ? 'admin' : matched.role
      };
      this.logAction('Logged in Member', matched.name);
      this.saveState(false, { localOnly: true }); // auth state only
      return this.current_user;
    }

    // Direct registration for login attempt
    const newUser: User = {
      id: `user-${role}-${Date.now()}`,
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0] || 'Administrator',
      role: role,
      created_at: new Date().toISOString(),
      subscription_status: 'none'
    };
    this.all_users.push(newUser);
    this.current_user = newUser;
    this.saveState(false, { localOnly: true }); // auth state only
    return newUser;
  }

  public logoutUser() {
    this.current_user = null;
    this.logAction('Logged out Member', 'Guest Session');
    this.clearCachedAdminData();
    this.loadState();
    this.saveState(true, { localOnly: true }); // auth state only
    if (this.supabase) {
      this.supabase.auth.signOut().catch(err => {
        console.warn('⚡ Supabase network signOut warning:', err.message);
      });
    }
  }

  private clearCachedAdminData() {
    const adminKeys = [
      'hs_posts',
      'hs_categories',
      'hs_comments',
      'hs_subscribers',
      'hs_quizzes',
      'hs_analytics',
      'hs_audit_logs',
      'hs_email_campaigns',
      'hs_email_templates',
      'hs_plans',
      'hs_subscriptions',
      'hs_payments',
      'hs_all_users',
      'hs_ad_zones'
    ];
    adminKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });

    this.posts = [];
    this.comments = [];
    this.subscribers = [];
    this.quizzes = [];
    this.analytics = {
      daily_views: [],
      category_distribution: [],
      engagement_rate: 0,
      total_users: 0,
      total_views: 0,
      total_likes: 0,
      ad_earnings: 0
    };
    this.audit_logs = [];
    this.email_campaigns = [];
    this.email_templates = [];
    this.plans = [];
    this.subscriptions = [];
    this.payments = [];
    this.all_users = [];
  }

  public async onAdminLoginSuccess() {
    // NEVER full-save here: the store still holds the pre-login
    // (possibly default/empty) snapshot; shipping it would wipe freshly
    // saved server state (the settings-reset class).
    this.saveState(true, { localOnly: true });
    await this.loadServerState();
    if (this.supabase) {
      await this.syncWithSupabase();
    }
    this.triggerUpdate();
  }

  // --- LIVE CHAT HELPER METHODS ---
  public async getChatConversations(): Promise<ChatConversation[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('chat_conversations')
          .select('*')
          .order('updated_at', { ascending: false });
        if (!error && data) {
          this.chat_conversations = data;
          this.triggerUpdate();
        }
      } catch (err) {
        console.warn('Failed to fetch chat conversations from Supabase:', err);
      }
    }
    return this.chat_conversations;
  }

  public async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          this.chat_messages = [
            ...this.chat_messages.filter(m => m.conversation_id !== conversationId),
            ...data
          ];
          this.triggerUpdate();
        }
      } catch (err) {
        console.warn('Failed to fetch chat messages from Supabase:', err);
      }
    }
    return this.chat_messages.filter(m => m.conversation_id === conversationId);
  }

  public async sendChatMessage(
    visitorId: string,
    content: string,
    sender: 'visitor' | 'admin',
    attachments: ChatAttachment[] = [],
    conversationId?: string,
    visitorMeta?: { name?: string; email?: string; current_page?: string; device?: string; browser?: string; country?: string }
  ): Promise<ChatMessage> {
    const activeConvId = conversationId || `conv-${visitorId}`;
    
    let conversation = this.chat_conversations.find(c => c.id === activeConvId);
    if (!conversation) {
      conversation = {
        id: activeConvId,
        visitor_id: visitorId,
        visitor_name: visitorMeta?.name || (this.current_user ? this.current_user.name : undefined),
        visitor_email: visitorMeta?.email || (this.current_user ? this.current_user.email : undefined),
        status: sender === 'visitor' ? 'waiting' : 'open',
        device: visitorMeta?.device || 'Unknown',
        browser: visitorMeta?.browser || 'Unknown',
        country: visitorMeta?.country || 'Unknown',
        current_page: visitorMeta?.current_page || '/',
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.chat_conversations.unshift(conversation);
    } else {
      conversation.updated_at = new Date().toISOString();
      if (sender === 'visitor') {
        conversation.status = 'waiting';
      }
      if (visitorMeta?.current_page) {
        conversation.current_page = visitorMeta.current_page;
      }
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: activeConvId,
      sender,
      visitor_id: visitorId,
      content,
      attachments,
      is_read: sender === 'visitor' ? false : true,
      created_at: new Date().toISOString()
    };

    this.chat_messages.push(newMessage);
    this.saveState(false, { localOnly: true }); // chat rows persist via direct upserts

    if (this.supabase) {
      try {
        await this.supabase.from('chat_conversations').upsert({
          id: conversation.id,
          visitor_id: conversation.visitor_id,
          visitor_name: conversation.visitor_name,
          visitor_email: conversation.visitor_email,
          status: conversation.status,
          device: conversation.device,
          browser: conversation.browser,
          country: conversation.country,
          current_page: conversation.current_page,
          connected_at: conversation.connected_at,
          updated_at: conversation.updated_at
        });

        await this.supabase.from('chat_messages').insert({
          id: newMessage.id,
          conversation_id: newMessage.conversation_id,
          sender: newMessage.sender,
          visitor_id: newMessage.visitor_id,
          content: newMessage.content,
          attachments: newMessage.attachments,
          is_read: newMessage.is_read,
          created_at: newMessage.created_at
        });
      } catch (err) {
        console.warn('Failed to send/save chat to Supabase:', err);
      }
    } else {
      if (sender === 'visitor') {
        setTimeout(() => {
          const hasAdminReplied = this.chat_messages.some(m => m.conversation_id === activeConvId && m.sender === 'admin' && m.id !== newMessage.id);
          let autoReplyText = "Thanks for contacting HeartSync. We're currently offline, but we'll respond as soon as we're available.";
          if (hasAdminReplied) {
            autoReplyText = "Thanks for your reply! One of our relationship coaches will get back to you shortly.";
          }
          
          const autoReply: ChatMessage = {
            id: `msg-auto-${Date.now()}`,
            conversation_id: activeConvId,
            sender: 'admin',
            visitor_id: visitorId,
            content: autoReplyText,
            is_read: false,
            created_at: new Date().toISOString()
          };
          
          this.chat_messages.push(autoReply);
          const conv = this.chat_conversations.find(c => c.id === activeConvId);
          if (conv) {
            conv.status = 'open';
            conv.updated_at = new Date().toISOString();
          }
          this.saveState(false, { localOnly: true }); // chat rows persist via direct upserts
          this.triggerUpdate();
          
          try {
            if (typeof window !== 'undefined') {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2357/2357-84.wav');
              audio.volume = 0.4;
              audio.play().catch(() => {});
            }
          } catch (_) {}
        }, 3000);
      }
    }

    this.triggerUpdate();
    return newMessage;
  }

  public async updateConversationStatus(id: string, status: 'open' | 'waiting' | 'closed'): Promise<void> {
    this.chat_conversations = this.chat_conversations.map(c => 
      c.id === id ? { ...c, status, updated_at: new Date().toISOString() } : c
    );
    this.saveState(false, { localOnly: true });

    if (this.supabase) {
      try {
        await this.supabase
          .from('chat_conversations')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to update conversation status on Supabase:', err);
      }
    }
    this.triggerUpdate();
  }

  public async deleteConversation(id: string): Promise<void> {
    this.chat_conversations = this.chat_conversations.filter(c => c.id !== id);
    this.chat_messages = this.chat_messages.filter(m => m.conversation_id !== id);
    this.saveState(false, { localOnly: true });

    if (this.supabase) {
      try {
        await this.supabase
          .from('chat_conversations')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to delete conversation from Supabase:', err);
      }
    }
    this.triggerUpdate();
  }

  public subscribeToLiveChat(onMessageReceived: (msg: ChatMessage) => void) {
    if (!this.supabase) return () => {};
    
    try {
      const channel = this.supabase
        .channel('live-chat-messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            if (!this.chat_messages.some(m => m.id === newMsg.id)) {
              this.chat_messages.push(newMsg);
              this.triggerUpdate();
              onMessageReceived(newMsg);
            }
          }
        )
        .subscribe();
        
      return () => {
        if (this.supabase) {
          this.supabase.removeChannel(channel);
        }
      };
    } catch (err) {
      console.warn('Live chat subscription failed:', err);
      return () => {};
    }
  }
}

export const heartsync = new HeartsyncStore();

if (typeof window !== 'undefined') {
  (window as any).heartsync = heartsync;
}
export const getAuthors = () => {
  return heartsync.authors.filter(a => !a.is_deleted);
};
