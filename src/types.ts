export interface User {
  id: string;
  email: string;
  role: 'admin' | 'author' | 'reader';
  name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  
  // Premium/Membership status indicators
  is_suspended?: boolean;
  subscription_id?: string;
  plan_id?: string;
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'none';
  current_period_end?: string;
  auto_renew?: boolean;
  trial_end?: string;
  is_trial?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string; // Tailwind hex or class mapping
  icon?: string; // Standard Lucide icon identifier (over 70 options)
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  is_premium?: boolean;
  price?: number;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  image: string;
  button_text: string;
  destination_url: string;
  display_order: number;
  status: 'Published' | 'Draft';
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'scheduled';
  publish_date: string;
  featured_image: string;
  read_time: number; // in minutes
  category_id: string;
  author_id: string;
  tags: string[]; // Tag slugs or names
  likes: number;
  reactions: {
    love: number;
    insightful: number;
    support: number;
    warmth: number;
  };
  views: number;
  seo_title?: string;
  seo_description?: string;
  keywords?: string[];
  allow_comments: boolean;
  is_premium?: boolean;
  price?: number;
  access_level?: 'free' | 'premium' | 'gold' | 'platinum';
  publish_at?: string;
  tts_enabled?: boolean;
  premium_access_type?: 'free' | 'subscribers_only' | 'watch_ad' | 'premium_and_ad' | 'scheduled_premium' | 'members_only';
  unlock_duration?: string | number;
  ad_provider?: string;
  daily_unlock_limit?: number;
  show_teaser?: boolean;
  preview_paragraphs?: number;
  blur_content?: boolean;
  show_subscription_cta?: boolean;
  editorial_summary?: string;
  reflection_note?: string;
  in_article_quote?: string;
  in_article_quote_author?: string;
  somatic_exercise_title?: string;
  somatic_exercise_steps?: string;
  reflection_prompt?: string;
  faq?: { question: string; answer: string }[];
  in_article_inserts?: InArticleInsertsConfig;
}

export type InArticleInsertType = 'insight' | 'reflection' | 'tip' | 'summary' | 'related';

export interface InArticleInsertItem {
  id: InArticleInsertType;
  title: string;
  enabled: boolean;
  content: string;
  placementPercent: number; // e.g. 12 (10-15%), 50 (45-55%), 75 (70-80%), 92 (90-95%), 94 (after summary)
  overrideParagraphIndex?: number;
  links?: { title: string; url: string; readTime?: string }[];
}

export interface InArticleInsertsConfig {
  insight?: InArticleInsertItem;
  reflection?: InArticleInsertItem;
  tip?: InArticleInsertItem;
  summary?: InArticleInsertItem;
  related?: InArticleInsertItem;
}

export interface Comment {
  id: string;
  post_id: string;
  user_name: string;
  user_email: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  parent_id?: string; // For nested comments
  is_approved: boolean;
}

export interface AdZone {
  id: string;
  name: string;
  slot: string;
  pricing: string;
  active: boolean;
  code_template: string;
  size_label: string;
  impressions: number;
  clicks: number;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: 'footer' | 'popup' | 'dedicated_page';
  status: 'active' | 'unsubscribed';
  subscribed_at: string;
}

export interface SidebarWidget {
  id: string;
  title: string;
  type: 'author' | 'links' | 'newsletter' | 'custom_html';
  content_text?: string;
  custom_links?: { label: string; tab: string; arg?: string }[];
  is_active: boolean;
}

export interface FooterSection {
  id: string;
  title: string;
  links: { label: string; tab: string; arg?: string }[];
  is_active: boolean;
}

export interface HeaderMenuItem {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
}

export interface HeaderSettings {
  logo_url: string;
  site_name: string;
  tagline: string;
  menu_items: HeaderMenuItem[];
  primary_cta_text: string;
  primary_cta_url: string;
  secondary_cta_text: string;
  secondary_cta_url: string;
  sticky: boolean;
  bg_color: string;
  text_color: string;
  primary_btn_bg: string;
  primary_btn_text: string;
  secondary_btn_bg: string;
  secondary_btn_text: string;
  transparency: 'solid' | 'blur' | 'transparent';
  mobile_menu_bg: string;
  mobile_menu_text: string;
}

export interface HeroStatistic {
  id: string;
  label: string;
  value: string;
}

export interface HeroTestimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar: string;
}

export interface HeroSettings {
  title: string;
  subtitle: string;
  badge_text: string;
  primary_cta_text: string;
  primary_cta_url: string;
  secondary_cta_text: string;
  secondary_cta_url: string;
  trust_indicators: string[];
  statistics: HeroStatistic[];
  testimonials: HeroTestimonial[];
  image_url: string;
  bg_image_url: string;
  video_url?: string;
  align: 'left' | 'center' | 'right';
  bg_color: string;
  text_color: string;
  primary_btn_bg: string;
  primary_btn_text: string;
  secondary_btn_bg: string;
  secondary_btn_text: string;
  overlay_color: string;
  overlay_opacity: number; // 0 to 100
  height: 'sm' | 'md' | 'lg' | 'screen';
  element_order: ('badge' | 'headline' | 'description' | 'buttons' | 'statistics' | 'testimonials' | 'media')[];
  enabled_sections?: {
    badge?: boolean;
    headline?: boolean;
    description?: boolean;
    buttons?: boolean;
    statistics?: boolean;
    testimonials?: boolean;
    media?: boolean;
  };
  bg_type?: 'solid' | 'gradient' | 'image' | 'overlay';
  bg_gradient_start?: string;
  bg_gradient_end?: string;
  bg_gradient_angle?: string;
  heading_color?: string;
  subheading_color?: string;
  badge_color?: string;
  badge_bg_color?: string;
  stat_card_bg_color?: string;
  stat_card_text_color?: string;
  theme_preset?: string;
  bg_position?: string;
  bg_size?: string;
  bg_repeat?: string;
  bg_parallax?: boolean;
  content_bg_type?: 'transparent' | 'semi' | 'solid';
  content_bg_color?: string;
  content_bg_opacity?: number;
}

export interface SiteSettings {
  [key: string]: any;
  site_name: string;
  site_description: string;
  adsense_client_id: string;
  adsense_active: boolean;
  adsense_auto_script?: string;
  monetag_active?: boolean;
  monetag_zone_id?: string;
  monetag_script_code?: string;
  monetag_format?: string;
  adsterra_active?: boolean;
  adsterra_key_id?: string;
  adsterra_script_code?: string;
  adsterra_format?: string;
  banner_header_enabled?: boolean;
  banner_sidebar_enabled?: boolean;
  banner_footer_enabled?: boolean;
  banner_in_article_enabled?: boolean;
  newsletter_welcome_msg: string;
  ai_assistant_enabled: boolean;
  recaptcha_enabled: boolean;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  brand_font?: string;
  brand_theme?: string;
  brand_animation?: string;
  brand_heading_transform?: 'normal' | 'uppercase' | 'capitalize' | 'lowercase';
  brand_heading_weight?: 'font-normal' | 'font-medium' | 'font-semibold' | 'font-bold' | 'font-extrabold' | 'font-black';
  brand_heading_tracking?: 'tracking-tighter' | 'tracking-tight' | 'tracking-normal' | 'tracking-wide' | 'tracking-wider' | 'tracking-widest';
  brand_heading_leading?: 'leading-none' | 'leading-tight' | 'leading-snug' | 'leading-normal' | 'leading-relaxed' | 'leading-loose';
  brand_body_size?: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg';
  brand_button_radius?: 'rounded-none' | 'rounded-md' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full';
  brand_glow_accent?: boolean;
  brand_hover_animation?: 'none' | 'scale' | 'lift' | 'fade-shift' | 'shimmer' | 'bounce-micro';
  sidebar_widgets?: SidebarWidget[];
  footer_sections?: FooterSection[];
  social_links: {
    facebook: string;
    instagram: string;
    twitter: string;
    pinterest: string;
    tiktok?: string;
};
  social_facebook_url?: string;
  social_twitter_url?: string;
  social_instagram_url?: string;
  social_linkedin_url?: string;
  social_youtube_url?: string;
  /** TikTok profile URL shown in the footer social row and the article-page follow card. */
  social_tiktok_url?: string;
  /** Google Analytics 4 measurement ID (G-XXXXXXXXXX). Consent-gated in ConsentProvider. */
  ga_measurement_id?: string;
  related_block_enabled?: boolean;
  related_block_title?: string;
  related_block_count?: number;
  related_block_style?: 'grid' | 'carousel' | 'list' | 'list_details';
  tts_global_enabled?: boolean;
  tts_default_voice?: string;
  tts_default_speed?: number;
  tts_player_position?: 'top' | 'middle' | 'bottom';
  tts_player_style?: 'banner' | 'button' | 'card_minimal' | 'glowing_glass' | 'neon_floating';
  tts_voice_gender?: 'male' | 'female';
  tts_selected_voice?: string;
  tts_default_pitch?: number;
  tts_default_volume?: number;
  tts_pronunciation_rules?: string;
  tts_provider?: 'elevenlabs';
  elevenlabs_api_key?: string;
  tts_selected_voice_id?: string;
  tts_voice_cache?: string | Record<string, any>[] | any;
  tts_stability?: number;
  tts_similarity_boost?: number;
  tts_style?: number;
  tts_last_voice_sync?: string;
  gemini_api_key?: string;
  supabase_url?: string;
  supabase_key?: string;
  recaptcha_site_key?: string;
  extra_api_keys?: any;
  header_settings?: HeaderSettings;
  hero_settings?: HeroSettings;

  // Dynamic Homepage Content Management
  homepage_insights_title?: string;
  homepage_insights_desc?: string;
  homepage_insights_icon?: string;
  homepage_insights_enabled?: boolean;
  homepage_insights_order?: number;

  homepage_premium_title?: string;
  homepage_premium_desc?: string;
  homepage_premium_cta_text?: string;
  homepage_premium_enabled?: boolean;
  homepage_premium_order?: number;

  // Premium Article Experience Settings
  article_hero_style?: 'standard' | 'overlay' | 'parallax' | 'minimalist';
  article_font_family?: 'Inter' | 'DM Sans' | 'Plus Jakarta Sans' | 'Playfair Display' | 'JetBrains Mono';
  article_font_size?: 'sm' | 'base' | 'lg' | 'xl';
  article_line_height?: 'normal' | 'relaxed' | 'loose';
  article_reading_progress_enabled?: boolean;
  article_reading_progress_color?: string;
  article_table_of_contents_enabled?: boolean;
  article_content_blocks_enabled?: boolean;
  article_lightbox_enabled?: boolean;
  article_zoom_enabled?: boolean;
  article_image_credit_enabled?: boolean;
  article_share_system_enabled?: boolean;
  article_related_carousel_enabled?: boolean;
  article_reaction_feedback_enabled?: boolean;
  article_newsletter_box_enabled?: boolean;
  article_newsletter_title?: string;
  article_newsletter_desc?: string;
  article_newsletter_style?: 'minimal' | 'glowing' | 'warm';
  article_reading_themes_enabled?: boolean;
  article_reading_theme_default?: 'light' | 'dark' | 'sepia';
  article_animations_enabled?: boolean;
  article_sidebar_enabled?: boolean;
  article_author_box_enabled?: boolean;
  article_reading_time_enabled?: boolean;
  article_atmospheric_linen?: boolean;
  article_atmospheric_music_embedded?: boolean;

  // Redesigned premium publication details
  article_layout?: 'full-width' | 'standard' | 'narrow' | 'magazine';
  article_magazine_mode?: boolean;
  article_borderless_mode?: boolean;
  article_sidebar_position?: 'left' | 'right';
  article_content_width?: string;
  article_paragraph_spacing?: string;
  article_heading_styles?: string;
  
  // Metadata toggles
  article_meta_author_enabled?: boolean;
  article_meta_date_enabled?: boolean;
  article_meta_updated_date_enabled?: boolean;
  article_meta_reading_time_enabled?: boolean;
  article_meta_categories_enabled?: boolean;
  article_meta_tags_enabled?: boolean;
  article_meta_breadcrumbs_enabled?: boolean;

  // Featured Image configurations
  article_image_aspect_ratio?: string;
  article_image_rounded_corners?: string;
  article_image_caption_enabled?: boolean;
  article_image_position?: 'top' | 'below-title' | 'below-meta';
  article_image_lazy_loading?: boolean;

  // Reading experience details
  article_prev_next_nav_enabled?: boolean;
  article_comments_enabled?: boolean;
  article_social_sharing_enabled?: boolean;

  // Desktop settings
  article_desktop_sidebar_visible?: boolean;
  article_desktop_sidebar_width?: string;
  article_desktop_sidebar_sticky?: boolean;
  article_desktop_content_width?: string;
  article_desktop_related_placement?: 'bottom' | 'sidebar';

  // Mobile settings
  article_mobile_header_spacing?: string;
  article_mobile_image_height?: string;
  article_mobile_sticky_actions?: boolean;
  article_mobile_share_style?: 'dock' | 'inline' | 'floating';
  article_mobile_progress_bar?: boolean;

  expert_review_stamp_enabled?: boolean;
  expert_reviewer_signature_text?: string;
  expert_reviewer_credentials_desc?: string;
  layout_width?: 'contained' | 'wide';
  card_style?: 'standard' | 'minimal' | 'glass' | 'borderless';
  footer_style?: 'luxury' | 'cream' | 'minimalist' | 'triple';
  header_style?: 'blur' | 'solid' | 'transparent' | 'banner';
  page_builder_sections?: any[];
  draft_page_builder_sections?: any[];

  // Dynamic Homepage Extra Section Management
  site_copyright_text?: string;
  footer_compliance_badges_enabled?: boolean;
  homepage_categories_title?: string;
  homepage_categories_subtitle?: string;
  homepage_categories_enabled?: boolean;
  homepage_categories_order?: number;
  homepage_custom_categories?: any[];
  homepage_categories_columns_mobile?: number;
  homepage_categories_card_style?: 'overlay' | 'bordered' | 'glass' | 'flat';
  homepage_categories_aspect_ratio?: '4/3' | '1:1' | '16:9';
  
  // Dynamic Homepage Topics Management
  homepage_topics_title?: string;
  homepage_topics_subheading?: string;
  homepage_topics?: Topic[];
  homepage_topics_columns?: number;
  homepage_topics_animations_enabled?: boolean;
  homepage_about_enabled?: boolean;
  homepage_newsletter_enabled?: boolean;
  homepage_featured_title?: string;
  homepage_featured_enabled?: boolean;
  homepage_featured_order?: number;
  homepage_featured_posts?: string[];
  featured_stories_count?: number;
  homepage_trending_title?: string;
  homepage_trending_enabled?: boolean;
  homepage_trending_order?: number;
  homepage_trending_posts?: string[];
  trending_count?: number;
  trending_display_limit?: number;
  featured_display_limit?: number;
  explore_topics_display_limit?: number;

  // Site-wide Meta Tags and Open Graph Settings
  seo_site_title?: string;
  seo_site_description?: string;
  seo_site_keywords?: string;
  seo_robots_tag?: string;
  seo_google_verification?: string;
  og_site_name?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  og_type?: string;
  twitter_card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitter_creator?: string;
  twitter_site?: string;

  // Premium Animated Global Loading Screen Configurations
  loader_enabled?: boolean;
  loader_size?: 'sm' | 'md' | 'lg' | 'xl';
  loader_speed?: 'slow' | 'normal' | 'fast';
  loader_glow_intensity?: 'none' | 'low' | 'medium' | 'high';
  loader_overlay_opacity?: number; // 0 to 100
  loader_text?: string;
  loader_colors_light_primary?: string;
  loader_colors_light_secondary?: string;
  loader_colors_dark_primary?: string;
  loader_colors_dark_secondary?: string;

  // Rewarded access configurations
  rewarded_access_enabled?: boolean;
  rewarded_access_default_duration?: string;
  rewarded_access_max_unlocks_per_day?: number;
  rewarded_access_cooldown_minutes?: number;
  rewarded_access_guest_policy?: 'allowed' | 'login_required';
  rewarded_access_user_policy?: 'allowed' | 'free_only';
  rewarded_access_premium_bypass?: boolean;
  rewarded_access_daily_limits?: number;
  rewarded_access_expiration_behavior?: 'lock_immediately' | 'allow_finish_reading';
}

export interface Author {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  role_tag: string;
  role?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  is_deleted?: boolean;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  page_type: 'privacy' | 'terms' | 'cookie' | 'about' | 'disclaimer' | 'contact' | 'custom';
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsSummary {
  daily_views: { date: string; count: number }[];
  category_distribution: { name: string; count: number }[];
  engagement_rate: number;
  total_users: number;
  total_views: number;
  total_likes: number;
  ad_earnings: number;
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  target: string;
  timestamp: string;
}

// --------------------------------------------------------
// SAAS GRADE ADDITIONS DEFINITIONS
// --------------------------------------------------------

export interface AiGeneration {
  id: string;
  user_id: string;
  prompt: string;
  generated_content: string;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  title: string;
  subject: string;
  content: string;
  template_id?: string;
  status: 'draft' | 'sending' | 'sent';
  sent_at?: string;
  recipients_count: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  badge?: string;
  trial_days?: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  user_email?: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
  current_period_start?: string;
  auto_renew?: boolean;
  is_trial?: boolean;
  billing_cycle?: 'monthly' | 'yearly';
}

export interface Payment {
  id: string;
  user_id: string;
  user_email?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  gateway: 'stripe' | 'paystack' | 'flutterwave';
  created_at: string;
  plan_name?: string;
  subscription_id?: string;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'text' | 'cta' | 'images' | 'testimonials' | 'faq';
  content: any; // section specific fields
}

export interface Site {
  id: string;
  domain: string;
  subdomain: string;
  name: string;
  status: 'active' | 'suspended';
  created_at: string;
}

export interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  permissions: string[];
  created_at: string;
  status: 'active' | 'revoked';
}

export interface ApiLog {
  id: string;
  api_key_id: string;
  route: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  timestamp: string;
}

export interface MediaItem {
  url: string;
  fileName: string;
  uploadDate: string;
  size: string;
  altText?: string;
  tags?: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  articleId: string;
  title: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface ChatAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ChatConversation {
  id: string;
  visitor_id: string;
  visitor_name?: string;
  visitor_email?: string;
  visitor_avatar?: string;
  status: 'open' | 'waiting' | 'closed';
  device?: string;
  browser?: string;
  country?: string;
  current_page?: string;
  connected_at: string;
  updated_at: string;
  typing_admin?: boolean;
  typing_visitor?: boolean;
  online_visitor?: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'visitor' | 'admin';
  visitor_id: string;
  content: string;
  attachments?: ChatAttachment[];
  is_read: boolean;
  created_at: string;
}

export interface DigitalProduct {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  price: number;
  salePrice?: number;
  coverImage: string;
  fileUrl: string;
  fileType: 'pdf' | 'audio' | 'video' | 'zip' | 'toolkit';
  category: string;
  rating?: number;
  totalSales?: number;
  isFeatured?: boolean;
  tags?: string[];
  created_at: string;
}

export interface DigitalOrder {
  id: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  amount: number;
  currency: string;
  downloadToken: string;
  downloadUrl: string;
  expiresAt: string;
  status: 'completed' | 'refunded' | 'pending';
  gateway: 'stripe' | 'paystack' | 'flutterwave' | 'paypal';
  createdAt: string;
}

export interface AdProviderConfig {
  id: string;
  name: string;
  type: 'adsense' | 'monetag' | 'adsterra' | 'ezoic' | 'mediavine' | 'custom' | string;
  pubId: string;
  scriptCode: string;
  slot: 'all' | 'header' | 'sidebar' | 'footer' | 'in_articles' | 'homepage' | string;
  active: boolean;
  cpmEstimate?: string;
  lazyLoadDelay?: string;
  geoTarget?: string;
  isConsentCompliant?: boolean;
  customSize?: string;
  format?: string;
}



