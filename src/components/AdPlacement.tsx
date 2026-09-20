import React, { useEffect, useRef, useState } from 'react';
import { heartsync } from '../store';
import { useCookieConsent } from './useCookieConsent';

export interface AdPlacementProps {
  slot: 'header' | 'sidebar' | 'in_article' | 'footer' | 'homepage' | 'article_bottom';
  className?: string;
  /** Below-the-fold units lazy-load when scrolled near. */
  lazy?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const SLOT_DIMENSIONS: Record<AdPlacementProps['slot'], { minHeight: number; label: string }> = {
  header: { minHeight: 90, label: 'Advertisement' },
  sidebar: { minHeight: 250, label: 'Advertisement' },
  in_article: { minHeight: 250, label: 'Advertisement' },
  footer: { minHeight: 100, label: 'Advertisement' },
  homepage: { minHeight: 250, label: 'Advertisement' },
  article_bottom: { minHeight: 250, label: 'Advertisement' }
};

// Per-slot AdSense unit ids, configured by the admin in Monetization settings
// (site_settings.adsense_slot_<slot>) or via VITE_ADSENSE_PUBLISHER_ID +
// VITE_SLOT_* environment variables at build time.
const SLOT_SETTINGS_FIELD: Record<AdPlacementProps['slot'], string> = {
  header: 'adsense_slot_header',
  sidebar: 'adsense_slot_sidebar',
  in_article: 'adsense_slot_in_article',
  footer: 'adsense_slot_footer',
  homepage: 'adsense_slot_homepage',
  article_bottom: 'adsense_slot_article_bottom'
};

const SLOT_ENV: Record<AdPlacementProps['slot'], string | undefined> = {
  header: import.meta.env.VITE_SLOT_HERO as string | undefined,
  sidebar: import.meta.env.VITE_SLOT_SIDEBAR as string | undefined,
  in_article: import.meta.env.VITE_SLOT_INLINE as string | undefined,
  footer: import.meta.env.VITE_SLOT_FOOTER as string | undefined,
  homepage: import.meta.env.VITE_SLOT_CONTENT as string | undefined,
  article_bottom: import.meta.env.VITE_SLOT_CONTENT as string | undefined
};

function resolvePublisherId(): string | null {
  const fromSettings = (heartsync.site_settings as Record<string, unknown>).adsense_client_id;
  const candidate = (typeof fromSettings === 'string' && fromSettings.trim()) || (import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string) || '';
  const trimmed = candidate.trim();
  if (!/^ca-pub-\d{10,}$/.test(trimmed)) return null; // honest absence until a real publisher id exists
  return trimmed;
}

function ensureAdsenseLibrary(publisherId: string): void {
  if (document.querySelector('script[data-adsense="true"]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-adsense', 'true');
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  document.head.appendChild(s);
}

/**
 * A real, policy-honest AdSense display unit.
 * - Renders nothing at all until a genuine publisher id + slot id exist.
 * - Honors the site's per-slot visibility toggles and the cookie consent
 *   state (ads load only after consent; marketing opt-out serves
 *   non-personalized ads).
 * - Reserves the slot height so ads never cause layout shift.
 * - Always labelled "Advertisement"; never styled to mimic UI elements.
 */
export const AdPlacement: React.FC<AdPlacementProps> = ({ slot, className = '', lazy = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);
  const [inView, setInView] = useState(!lazy);
  const { hasConsented, preferences } = useCookieConsent();
  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    const unsub = heartsync.subscribe(() => setSettingsVersion((v) => v + 1));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!lazy || inView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, inView]);

  // Visibility toggles (admin controls)
  const toggleField: Record<string, string> = {
    header: 'banner_header_enabled',
    sidebar: 'banner_sidebar_enabled',
    footer: 'banner_footer_enabled',
    in_article: 'banner_in_article_enabled'
  };
  const settings = heartsync.site_settings as Record<string, unknown>;
  const toggle = toggleField[slot];
  void settingsVersion;
  if (toggle && settings[toggle] === false) return null;

  const publisherId = resolvePublisherId();
  const slotId = ((settings[SLOT_SETTINGS_FIELD[slot]] as string) || SLOT_ENV[slot] || '').trim();
  if (!publisherId || !/^\d{9,16}$/.test(slotId)) return null;
  if (!hasConsented) return null; // default-denied until the visitor consents

  const marketingConsent = !!(preferences as unknown as Record<string, unknown> | undefined)?.marketing;

  useEffect(() => {
    if (!inView || pushedRef.current) return;
    pushedRef.current = true;
    ensureAdsenseLibrary(publisherId);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push(
        marketingConsent ? {} : { google_ad_client: publisherId, google_reactive_ad_format: 0, requestNonPersonalizedAds: 1 }
      );
    } catch {
      // AdSense library not ready yet; the unit will fill when it loads.
    }
  }, [inView, publisherId, marketingConsent]);

  const dims = SLOT_DIMENSIONS[slot];

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center ${className}`}
      style={{ minHeight: dims.minHeight }}
      data-ad-slot-family={slot}
      aria-label="Advertisement"
    >
      <span className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 select-none mb-1">
        {dims.label}
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: slot === 'sidebar' ? '300px' : '970px' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={slot === 'in_article' || slot === 'article_bottom' ? 'fluid' : 'auto'}
        {...(slot === 'in_article' || slot === 'article_bottom' ? { 'data-ad-layout': 'in-article' } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdPlacement;
