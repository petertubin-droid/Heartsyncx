/**
 * Google AdSense Ad Placements and Network Configuration File
 * Allows central management of ad units, slots, client publisher IDs,
 * and environment-based production flags.
 */

// Retrieve Google AdSense environmental variables with robust fallbacks
export const ADSENSE_CLIENT_ID = 
  import.meta.env.VITE_ADSENSE_PUBLISHER_ID || 
  import.meta.env.VITE_PUBLIC_ADSENSE_CLIENT || 
  import.meta.env.VITE_ADSENSE_CLIENT || 
  ''; // Empty fallback allows dynamic database settings to take precedence

export const DEFAULT_ADSENSE_SLOT = 
  import.meta.env.VITE_PUBLIC_ADSENSE_SLOT || 
  import.meta.env.VITE_ADSENSE_SLOT || 
  'all_responsive_auto';

// Ensure we only render production tags in real live hosted environments to prevent AdSense policy flags
export const IS_PRODUCTION = 
  import.meta.env.PROD || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));

/**
 * Centrally managed ad placements configuration
 */
export interface AdUnitConfig {
  id: string;
  name: string;
  slotId: string;
  layout?: string;
  format: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive: boolean;
  minHeight: string; // To prevent Cumulative Layout Shift (CLS)
  className?: string;
}

export const AD_PLACEMENTS: Record<string, AdUnitConfig> = {
  home_hero_banner: {
    id: 'home_hero_banner',
    name: 'Homepage Header Hero Ad',
    slotId: import.meta.env.VITE_SLOT_HERO || '9606990422',
    format: 'horizontal',
    responsive: true,
    minHeight: '100px',
    className: 'max-w-7xl mx-auto px-4 md:px-8',
  },
  home_content_feed: {
    id: 'home_content_feed',
    name: 'Homepage Content Feed Loop Ad',
    slotId: import.meta.env.VITE_SLOT_CONTENT || '3482209192',
    format: 'auto',
    responsive: true,
    minHeight: '120px',
    className: 'my-6',
  },
  in_article_banner: {
    id: 'in_article_banner',
    name: 'Blog Post Block Inline Ad',
    slotId: import.meta.env.VITE_SLOT_INLINE || '6304951077',
    format: 'fluid',
    layout: 'in-article',
    responsive: true,
    minHeight: '150px',
    className: 'border-y border-zinc-200 dark:border-zinc-800 py-3 bg-zinc-50/10 dark:bg-zinc-950/25 p-2 rounded-2xl my-8',
  },
  sidebar_sticky: {
    id: 'sidebar_sticky',
    name: 'Sidebar Sticky Half-Page Ad',
    slotId: import.meta.env.VITE_SLOT_SIDEBAR || '2911115561',
    format: 'vertical',
    responsive: true,
    minHeight: '450px',
    className: 'max-w-[340px] mx-auto',
  },
  article_footer: {
    id: 'article_footer',
    name: 'Footer Related Block Anchor Ad',
    slotId: import.meta.env.VITE_SLOT_FOOTER || '1120294109',
    format: 'horizontal',
    responsive: true,
    minHeight: '90px',
    className: 'w-full',
  },
  rewarded_unlock: {
    id: 'rewarded_unlock',
    name: 'Google AdSense Rewarded Video Ad (Unlock Premium Content / Quiz)',
    slotId: import.meta.env.VITE_SLOT_REWARDED || '8492019283',
    format: 'auto',
    responsive: true,
    minHeight: '280px',
    className: 'w-full max-w-lg mx-auto bg-zinc-900 border border-amber-500/30 rounded-3xl p-4 shadow-xl',
  },
  category_header: {
    id: 'category_header',
    name: 'Category & Topic Feed Sponsor Banner',
    slotId: import.meta.env.VITE_SLOT_CATEGORY_HEADER || '1192837465',
    format: 'horizontal',
    responsive: true,
    minHeight: '100px',
    className: 'max-w-6xl mx-auto px-4 my-4',
  },
  article_midcontent: {
    id: 'article_midcontent',
    name: 'Mid-Article Anchor Engagement Slot',
    slotId: import.meta.env.VITE_SLOT_MIDCONTENT || '5593820192',
    format: 'fluid',
    layout: 'in-article',
    responsive: true,
    minHeight: '160px',
    className: 'border-y border-zinc-200 dark:border-zinc-800 py-4 my-10 bg-zinc-50/20 dark:bg-zinc-900/40 rounded-2xl',
  },
  article_sidebar_top: {
    id: 'article_sidebar_top',
    name: 'Article Top Right Sidebar Square',
    slotId: import.meta.env.VITE_SLOT_SIDEBAR_TOP || '4482910293',
    format: 'rectangle',
    responsive: true,
    minHeight: '250px',
    className: 'w-full max-w-[300px] mx-auto my-4',
  },
  popup_interstitial: {
    id: 'popup_interstitial',
    name: 'Fullscreen Transition Interstitial Ad',
    slotId: import.meta.env.VITE_SLOT_INTERSTITIAL || '7738291029',
    format: 'auto',
    responsive: true,
    minHeight: '300px',
    className: 'w-full',
  },
  search_results_feed: {
    id: 'search_results_feed',
    name: 'Search & Directory Native Feed Ad',
    slotId: import.meta.env.VITE_SLOT_SEARCH_FEED || '3392019283',
    format: 'fluid',
    responsive: true,
    minHeight: '120px',
    className: 'w-full my-4',
  },
  mobile_sticky_footer: {
    id: 'mobile_sticky_footer',
    name: 'Mobile Bottom Anchor Sticky Bar',
    slotId: import.meta.env.VITE_SLOT_STICKY_FOOTER || '9928374610',
    format: 'horizontal',
    responsive: true,
    minHeight: '50px',
    className: 'fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200 dark:border-zinc-800 shadow-lg',
  }
};

/**
 * Comments & Documentation:
 * To add additional ad slots:
 * 1. Define a new unique placement key in AD_PLACEMENTS above (e.g. `category_sidebar`).
 * 2. Configure its format, slotId, and minHeight (to safeguard your layout from shifts).
 * 3. Mount '<AdPlacement slot="category_sidebar" />' inside the corresponding view layout.
 */
