/**
 * LocalStorage Audit & Security Cleanup Utility
 * Safely audits and clears unsupported, stale, or unauthorized 'hs_*' state keys from localStorage,
 * preserving ONLY valid user UI preferences (theme, language, reading settings, bookmarks, session unlocks, domain configs).
 */

export interface StorageAuditReport {
  scannedCount: number;
  preservedKeys: string[];
  removedKeys: string[];
  unauthorizedCount: number;
  timestamp: string;
}

// Explicit set of permitted hs_* keys for valid UI preferences, user settings, and client session state
const ALLOWED_EXACT_KEYS = new Set([
  // Language & Internationalization preferences
  'hs_lang',
  'hs_admin_lang',
  'hs_default_language',
  'hs_enabled_languages',

  // Appearance & Theme preferences
  'hs_frontend_theme',
  'hs_theme',
  'hs_admin_theme',
  'hs_reading_theme',

  // User engagement & Reading preferences
  'hs_bookmarked_articles',
  'hs_bookmarks',
  'hs_unlocked_articles',
  'hs_unlocked_categories',
  'hs_temp_unlocked_articles',
  'hs_temp_unlocked_categories',

  // Active user session identifiers
  'hs_current_user',
  'hs_chat_visitor_id',
  'hs_chat_visitor_name',
  'hs_chat_visitor_email'
]);

// Allowed key prefixes (e.g. translation caches, localized article content)
const ALLOWED_PREFIXES = [
  'hs_v2_cat_',
  'hs_v2_post_',
  'hs_trans_',
  'hs_translations'
];

// Explicit list of unauthorized or deprecated database-bypass storage keys
const KNOWN_UNAUTHORIZED_KEYS = new Set([
  'hs_posts',
  'hs_categories',
  'hs_comments',
  'hs_ad_zones',
  'hs_subscribers',
  'hs_quizzes',
  'hs_site_settings',
  'hs_pn_settings',
  'hs_media_library',
  'hs_authors',
  'hs_pages',
  'hs_tags',
  'hs_podcasts',
  'hs_rss_feeds',
  'hs_ad_providers',
  'hs_sponsorship_campaigns',
  'pn_campaigns',
  'hs_digital_products',
  'hs_rewarded_ad_config',
  'pn_ad_providers',
  'pn_tags',
  'pn_podcasts',
  'pn_rss_feeds',
  'pn_moder_comments',
  'pn_generated_sitemaps',
  'pn_metadata_list',
  'hs_webhook_targets',
  'hs_webhook_logs',
  'hs_email_campaigns',
  'hs_email_templates',
  'hs_plans',
  'hs_subscriptions',
  'hs_payments',
  'hs_all_users',
  'hs_global_premium_locked',
  'hs_analytics',
  'hs_audit_logs',
  'hs_workspace_bypass_user',
  'hs_num_sentiment',
  'pn_staff_users'
]);

/**
 * Checks whether a given key is a protected UI preference or legitimate client-session state.
 */
export function isAllowedStorageKey(key: string): boolean {
  if (ALLOWED_EXACT_KEYS.has(key)) {
    return true;
  }
  return ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix));
}

/**
 * Performs a non-destructive audit of localStorage keys.
 */
export function auditLocalStorage(): StorageAuditReport {
  const preservedKeys: string[] = [];
  const removedKeys: string[] = [];

  if (typeof window === 'undefined' || !window.localStorage) {
    return { scannedCount: 0, preservedKeys, removedKeys, unauthorizedCount: 0, timestamp: new Date().toISOString() };
  }

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }

  keys.forEach(key => {
    // Audit 'hs_*' keys, 'pn_*' keys, or bypass keys
    if (key.startsWith('hs_') || key.startsWith('pn_') || key.includes('bypass') || KNOWN_UNAUTHORIZED_KEYS.has(key)) {
      if (isAllowedStorageKey(key)) {
        preservedKeys.push(key);
      } else {
        removedKeys.push(key);
      }
    }
  });

  return {
    scannedCount: keys.length,
    preservedKeys,
    removedKeys,
    unauthorizedCount: removedKeys.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Clears unauthorized or unsupported 'hs_*' state keys from localStorage while preserving valid UI preferences.
 */
export function clearUnauthorizedStorageKeys(options?: { verbose?: boolean }): StorageAuditReport {
  const report = auditLocalStorage();

  if (typeof window === 'undefined' || !window.localStorage) {
    return report;
  }

  report.removedKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      if (options?.verbose) {
        console.log(`🧹 [Storage Audit] Removed unauthorized/legacy key: "${key}"`);
      }
    } catch (err) {
      console.warn(`⚠️ [Storage Audit] Failed to remove key "${key}":`, err);
    }
  });

  if (options?.verbose && report.removedKeys.length > 0) {
    console.log(`✅ [Storage Audit] Storage audit complete. Cleared ${report.removedKeys.length} unauthorized key(s). Preserved ${report.preservedKeys.length} UI preference(s).`);
  }

  return report;
}
