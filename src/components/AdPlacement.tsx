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

type SlotFamily = AdPlacementProps['slot'];

const SLOT_DIMENSIONS: Record<SlotFamily, { minHeight: number; label: string }> = {
  header: { minHeight: 90, label: 'Advertisement' },
  sidebar: { minHeight: 250, label: 'Advertisement' },
  in_article: { minHeight: 250, label: 'Advertisement' },
  footer: { minHeight: 60, label: 'Advertisement' },
  homepage: { minHeight: 250, label: 'Advertisement' },
  article_bottom: { minHeight: 250, label: 'Advertisement' }
};

/** AdSense unit-id settings field + build-time env fallback, per slot. */
const ADSENSE_FIELD: Record<SlotFamily, string> = {
  header: 'adsense_slot_header',
  sidebar: 'adsense_slot_sidebar',
  in_article: 'adsense_slot_in_article',
  footer: 'adsense_slot_footer',
  homepage: 'adsense_slot_homepage',
  article_bottom: 'adsense_slot_article_bottom'
};
const ADSENSE_ENV: Record<SlotFamily, string | undefined> = {
  header: import.meta.env.VITE_SLOT_HERO as string | undefined,
  sidebar: import.meta.env.VITE_SLOT_SIDEBAR as string | undefined,
  in_article: import.meta.env.VITE_SLOT_INLINE as string | undefined,
  footer: import.meta.env.VITE_SLOT_FOOTER as string | undefined,
  homepage: import.meta.env.VITE_SLOT_CONTENT as string | undefined,
  article_bottom: import.meta.env.VITE_SLOT_CONTENT as string | undefined
};

/**
 * Adsterra display/banner format per placement (their documented native
 * banner sizes: 728x90, 468x60, 300x250, 320x50, 160x300).
 */
const ADSTERRA_FORMAT: Record<SlotFamily, { format: string; width: number; height: number }> = {
  header: { format: '728x90', width: 728, height: 90 },
  sidebar: { format: '300x250', width: 300, height: 250 },
  in_article: { format: '300x250', width: 300, height: 250 },
  footer: { format: '468x60', width: 468, height: 60 },
  homepage: { format: '300x250', width: 300, height: 250 },
  article_bottom: { format: '300x250', width: 300, height: 250 }
};

function settings(): Record<string, unknown> {
  return heartsync.site_settings as Record<string, unknown>;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function resolvePublisherId(): string | null {
  const candidate = str(settings().adsense_client_id) || (import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string) || '';
  if (!/^ca-pub-\d{10,}$/.test(candidate)) return null; // honest absence until a real publisher id exists
  return candidate;
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

/** Adsterra's documented native-banner snippet, isolated in a sandboxed iframe. */
const AdsterraBanner: React.FC<{ slot: SlotFamily }> = ({ slot }) => {
  const dims = ADSTERRA_FORMAT[slot];
  const key = str(settings()[`adsterra_key_${slot}`]);
  if (!/^[a-f0-9]{20,}$/i.test(key)) return null;
  const srcDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:flex;justify-content:center;align-items:flex-start;overflow:hidden}</style></head><body>
<script type="text/javascript">
	atOptions = { 'key' : '${key}', 'format' : '${dims.format}', 'height' : ${dims.height}, 'width' : ${dims.width}, 'params' : {} };
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/${key}/invoke.js"></script>
</body></html>`;
  return (
    <iframe
      title="Advertisement"
      srcDoc={srcDoc}
      style={{ border: 0, width: '100%', maxWidth: dims.width, height: dims.height }}
      scrolling="no"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
    />
  );
};

/**
 * A real, policy-honest display ad unit.
 * Provider precedence per slot: Google AdSense → Adsterra banner → nothing.
 * - Renders nothing at all until a genuine configuration exists.
 * - Honors the site's per-slot visibility toggles and the cookie consent
 *   state (ads load only after consent; marketing opt-out serves
 *   non-personalized AdSense).
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

  const toggleField: Partial<Record<SlotFamily, string>> = {
    header: 'banner_header_enabled',
    sidebar: 'banner_sidebar_enabled',
    footer: 'banner_footer_enabled',
    in_article: 'banner_in_article_enabled'
  };
  void settingsVersion;
  const toggle = toggleField[slot];
  const slotHiddenByToggle = !!(toggle && settings()[toggle] === false);

  // AdSense is the PRIMARY ad provider. adsense_active === false is the one
  // switch that hands slots to the fallback networks (Adsterra banners) —
  // while AdSense is active it always takes precedence per slot.
  const adsenseActive = settings().adsense_active !== false;

  const publisherId = resolvePublisherId();
  const adsenseSlotId = str(settings()[ADSENSE_FIELD[slot]]) || (ADSENSE_ENV[slot] || '').trim();
  const adsterraKey = str(settings()[`adsterra_key_${slot}`]);
  const adsenseConfigured = !!(adsenseActive && publisherId && /^\d{9,16}$/.test(adsenseSlotId));
  const marketingConsent = !!((preferences as unknown as Record<string, unknown> | undefined)?.marketing);

  // All hooks must run before any early return so the hook order stays
  // stable across consent / toggle changes (conditional hooks corrupt
  // React's hook index and crash re-renders).
  useEffect(() => {
    if (!inView || pushedRef.current || !hasConsented || slotHiddenByToggle || !adsenseConfigured) return;
    pushedRef.current = true;
    ensureAdsenseLibrary(publisherId!);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push(
        marketingConsent
          ? {}
          : { google_ad_client: publisherId, google_reactive_ad_format: 0, requestNonPersonalizedAds: 1 }
      );
    } catch {
      // AdSense library not ready yet; the unit will fill when it loads.
    }
  }, [inView, publisherId, marketingConsent, hasConsented, slotHiddenByToggle, adsenseConfigured]);

  if (slotHiddenByToggle) return null;
  // NOTE: the slot container + <ins> markup ALWAYS render (except when the
  // admin toggle hides the slot) so Google's review crawler can see every ad
  // slot. Consent only gates the adsbygoogle *activation push*, not the markup;
  // non-personalized ads are requested when marketing consent is absent.

  const dims = SLOT_DIMENSIONS[slot];

  if (!adsenseConfigured) {
    // No AdSense config for this slot  - Adsterra banner if configured, else a
    // visible, labelled reserved ad space (crawlable, no layout shift).
    const fmt = ADSTERRA_FORMAT[slot];
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center ${className}`}
        style={{ minHeight: Math.max(dims.minHeight, fmt.height) }}
        data-ad-slot-family={slot}
        aria-label="Advertisement"
      >
        <span className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 select-none mb-1">{dims.label}</span>
        {inView
          ? (adsterraKey && hasConsented
              ? <AdsterraBanner slot={slot} />
              : <div
                  className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-300 dark:text-zinc-600 select-none"
                  style={{ width: fmt.width, height: fmt.height }}
                  data-ad-slot-reserved="true"
                >
                  Reserved ad space
                </div>)
          : <div style={{ width: fmt.width, height: fmt.height }} />}
      </div>
    );
  }

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
        data-ad-slot={adsenseSlotId}
        data-ad-format={slot === 'in_article' || slot === 'article_bottom' ? 'fluid' : 'auto'}
        {...(slot === 'in_article' || slot === 'article_bottom' ? { 'data-ad-layout': 'in-article' } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdPlacement;
