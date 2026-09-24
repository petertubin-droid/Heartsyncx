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
  // The canonical loader lives in index.html (id="heartsync-adsense-script",
  // data-adsense="true"). Detect it by EITHER marker or by its adsbygoogle.js
  // src so a second copy of the library can never load regardless of which
  // component asks first.
  const existing =
    document.querySelector('script[data-adsense="true"]') ||
    document.querySelector('script#heartsync-adsense-script') ||
    [...document.querySelectorAll('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')][0];
  if (existing) return;
  const s = document.createElement('script');
  s.id = 'heartsync-adsense-script';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-adsense', 'true');
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  document.head.appendChild(s);
}

/**
 * Adsterra unit keys are bare hex ids, but publishers routinely paste the
 * WHOLE dashboard snippet (an atOptions block or an invoke.js <script> tag)
 * into the per-slot key fields. Extract the key from either form so pasted
 * snippets work without manual data surgery. When the snippet names a
 * specific Adsterra banner serving domain (they have several mirrors),
 * honor it instead of the default.
 */
interface AdsterraUnitRef {
  key: string;
  domain: string;
  /** Banner/native-banner dimensions pasted inside the snippet's atOptions.
   *  Adsterra issues native banners in many sizes (160x300, 160x600, 320x50,
   *  468x60, 728x90, 300x250...) - when the admin pastes the whole snippet we
   *  honor ITS dimensions instead of forcing the slot default, so ANY
   *  Adsterra banner or native-banner unit renders at its native size. */
  width?: number;
  height?: number;
}

const ADSTERRA_DEFAULT_DOMAIN = 'www.highperformanceformat.com';
const ADSTERRA_BANNER_DOMAINS = /(highperformanceformat|highrevenueformat)\.[a-z]+/i;

/**
 * The per-slot "URL" field may hold the unit's full invoke.js URL
 * (https://<domain>/<key>/invoke.js) or just the serving domain
 * (e.g. www.highperformanceformat.com). Resolve it to a domain; null when
 * the field is empty or malformed (the key's own snippet domain is then used).
 *
 * BUG FIX (verified live 2026-09-24): this used to unconditionally force a
 * "www." prefix onto whatever hostname it found. That is correct for
 * highperformanceformat.com/highrevenueformat.com (they really do serve
 * under www), but Adsterra's per-account banner subdomains  - e.g.
 * pl31453269.profitableratecpmnetwork.com, the exact live in-article unit
 * here  - have NO www record at all; forcing it produced
 * www.pl31453269.profitableratecpmnetwork.com, which does not resolve
 * (confirmed via a live DNS/HTTP check), silently killing the ad. Now the
 * hostname is returned exactly as it appears in the URL  - www. only when
 * the admin's own pasted URL actually had it.
 */
function adsterraDomainFromUrlField(raw: string): string | null {
  const v = raw.trim().replace(/\s+/g, '');
  if (!v) return null;
  // A full invoke.js URL names its own host explicitly  - honor it exactly
  // as given, www. or not (see bug-fix note above).
  const full = v.match(/^https?:\/\/((?:www\.)?[a-z0-9.-]+\.[a-z]+)\/[a-f0-9]{20,}\/invoke\.js/i);
  if (full) return full[1].toLowerCase();
  // A bare domain (no path) is only ever used for Adsterra's two known
  // static formats (highperformanceformat.com / highrevenueformat.com),
  // which really are served under www  - keep defaulting to www. here,
  // where it's actually correct, for typing convenience.
  const bare = v.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(bare)) return null;
  return `www.${bare.toLowerCase()}`;
}

function normalizeAdsterraUnit(raw: string): AdsterraUnitRef | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^[a-f0-9]{20,}$/i.test(v)) return { key: v.toLowerCase(), domain: ADSTERRA_DEFAULT_DOMAIN };
  const fromAtOptions = v.match(/['"]key['"]\s*:\s*['"]([a-f0-9]{20,})['"]/i);
  const fromInvokeUrl = v.match(/([a-f0-9]{20,})\/invoke\.js/i);
  const key = (fromAtOptions?.[1] || fromInvokeUrl?.[1] || '').toLowerCase();
  if (!key) return null;
  const domMatch = v.match(new RegExp(`https?://(?:www\.)?(${ADSTERRA_BANNER_DOMAINS.source})/${key}/invoke\.js`, 'i'));
  const domain = domMatch ? `www.${domMatch[1].toLowerCase().replace(/^www\./, '')}` : ADSTERRA_DEFAULT_DOMAIN;
  const h = v.match(/['"]height['"]\s*:\s*(\d{2,4})\b/i);
  const w = v.match(/['"]width['"]\s*:\s*(\d{2,4})\b/i);
  const dims =
    h && w && +h[1] >= 50 && +h[1] <= 1200 && +w[1] >= 120 && +w[1] <= 1600
      ? { width: +w[1], height: +h[1] }
      : undefined;
  return { key, domain, ...dims };
}

/**
 * Monetag per-slot tag (Native Banner zones). Monetag zones of type Native
 * Banner (and Interstitial) are VISIBLE, in-content display units - unlike
 * the MultiTag zone, whose formats (popunder, vignette, in-page push) are
 * non-display by design. The zone tag is a single script:
 *   <script src="https://<account-domain>/<zone>/tag.min.js" data-zone="<zone>" async data-cfasync="false"></script>
 * Admins may paste that whole snippet or just the zone id; the account's
 * serving domain is taken from the configured MultiTag loader/snippet so a
 * bare zone id alone is enough.
 */
interface MonetagTagRef {
  src: string;
  zone: string;
}

const MONETAG_DEFAULT_DOMAIN = 'alwingulla.com';

function monetagAccountDomain(): string {
  const loader = str(settings().monetag_loader_url);
  const fromLoader = loader.match(/^https?:\/\/([a-z0-9.-]+\.[a-z]+)/i);
  if (fromLoader) return fromLoader[1].toLowerCase();
  const snippet = str(settings().monetag_script_code);
  const fromSnippet = snippet.match(/https?:\/\/([a-z0-9.-]+\.[a-z]+)\/[a-z0-9._-]+\/[a-z0-9._-]+\.js/i);
  if (fromSnippet) return fromSnippet[1].toLowerCase();
  return MONETAG_DEFAULT_DOMAIN;
}

function normalizeMonetagTag(raw: string): MonetagTagRef | null {
  const v = raw.trim();
  if (!v) return null;
  const srcMatch = v.match(/https?:\/\/[^"'\s\\]+\/tag\.min\.js/i);
  const zoneMatch = v.match(/data-zone=["']?(\d{4,12})/i) || v.match(/\/(\d{4,12})\/tag\.min\.js/i);
  if (srcMatch) {
    // Extract the account domain so the admin can see it in the health table.
    return { src: srcMatch[0], zone: (zoneMatch?.[1] || '').trim() };
  }
  if (/^\d{4,12}$/.test(v)) {
    return { src: `https://${monetagAccountDomain()}/${v}/tag.min.js`, zone: v };
  }
  return null;
}

/** Adsterra banner / native-banner snippet, isolated in a sandboxed iframe.
 *  Renders at the pasted snippet's own size when it carries one (native
 *  banners come in 160x300, 160x600, 320x50, 468x60, 728x90, 300x250...),
 *  otherwise at the slot's default display-banner size. */
const AdsterraBanner: React.FC<{ slot: SlotFamily }> = ({ slot }) => {
  const fallback = ADSTERRA_FORMAT[slot];
  // The unit key may live in the key field OR inside the URL field (when the
  // admin pasted the full invoke.js URL). Prefer an explicit key field.
  const unit =
    normalizeAdsterraUnit(str(settings()[`adsterra_key_${slot}`])) ||
    normalizeAdsterraUnit(str(settings()[`adsterra_url_${slot}`]));
  if (!unit) return null;
  const { key } = unit;
  const domain = adsterraDomainFromUrlField(str(settings()[`adsterra_url_${slot}`])) || unit.domain;
  // atOptions 'format' must be the literal banner size Adsterra issued for
  // the unit (e.g. 'iframe' for native banners) - when the admin pasted a
  // full snippet we repeat ITS exact format string, else the slot default.
  const pastedFormat = str(settings()[`adsterra_key_${slot}`]).match(/['"]format['"]\s*:\s*['"]([^'"]+)['"]/i)?.[1];
  const width = unit.width || fallback.width;
  const height = unit.height || fallback.height;
  const format = pastedFormat || `${width}x${height}`;
  const srcDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:flex;justify-content:center;align-items:flex-start;overflow:hidden}</style></head><body>
<script type="text/javascript">
	atOptions = { 'key' : '${key}', 'format' : '${format}', 'height' : ${height}, 'width' : ${width}, 'params' : {} };
</script>
<script type="text/javascript" src="//${domain}/${key}/invoke.js"></script>
</body></html>`;
  return (
    <iframe
      title="Advertisement"
      srcDoc={srcDoc}
      style={{ border: 0, width: '100%', maxWidth: width, height }}
      scrolling="no"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
    />
  );
};

/**
 * Monetag Native Banner zone tag, isolated in a sandboxed iframe so it stays
 * inside the slot it was placed in. Visible display unit (unlike the
 * site-wide MultiTag). Zone configured per slot via monetag_zone_<slot>.
 */
const MonetagBanner: React.FC<{ slot: SlotFamily }> = ({ slot }) => {
  const tag = normalizeMonetagTag(str(settings()[`monetag_zone_${slot}`]));
  if (!tag) return null;
  const fallback = ADSTERRA_FORMAT[slot];
  const srcDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:flex;justify-content:center;align-items:flex-start;overflow:hidden}</style></head><body>
<script type="text/javascript" src="${tag.src}" data-zone="${tag.zone}" async data-cfasync="false"></script>
</body></html>`;
  return (
    <iframe
      title="Advertisement"
      srcDoc={srcDoc}
      style={{ border: 0, width: '100%', maxWidth: fallback.width, height: fallback.height, minHeight: 90 }}
      scrolling="no"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
    />
  );
};

/**
 * Adsterra Direct Link / Smartlink unit. A Direct Link is not a script - it
 * is a plain URL from the dashboard ("Websites > Ad Units > Direct Link")
 * that earns per click. Rendered as a clearly labelled, rel=sponsored text
 * link under the footer ad slot; gated on the Adsterra master switch,
 * marketing consent, and a configured URL.
 */
export const AdsterraDirectLink: React.FC = () => {
  const { hasConsented, preferences } = useCookieConsent();
  const marketingConsent = !!((preferences as unknown as Record<string, unknown> | undefined)?.marketing);
  const s = settings();
  const url = str(s.adsterra_direct_link_url);
  const label = str(s.adsterra_direct_link_label) || 'Sponsored: check out this offer';
  if (!url || s.adsterra_active === false || !hasConsented || !marketingConsent) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return (
    <div className="flex justify-center py-1 select-none" data-ad-slot-family="direct_link" aria-label="Advertisement">
      <a
        href={url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="text-[10px] text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 underline underline-offset-2"
      >
        {label}
      </a>
    </div>
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
    in_article: 'banner_in_article_enabled',
    homepage: 'banner_homepage_enabled',
    article_bottom: 'banner_article_bottom_enabled'
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
  const adsterraKey = !!(
    normalizeAdsterraUnit(str(settings()[`adsterra_key_${slot}`])) ||
    normalizeAdsterraUnit(str(settings()[`adsterra_url_${slot}`]))
  );
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
    // No AdSense config for this slot  - provider chain per slot:
    // Adsterra banner/native banner -> Monetag native banner -> reserved.
    // Every network honors its master switch; everything is consent-gated.
    const fmt = ADSTERRA_FORMAT[slot];
    const adsterraMasterOn = settings().adsterra_active !== false;
    const monetagMasterOn = settings().monetag_active !== false;
    const monetagZone = normalizeMonetagTag(str(settings()[`monetag_zone_${slot}`]));
    const showAdsterra = adsterraKey && adsterraMasterOn && hasConsented;
    const showMonetag = !!monetagZone && monetagMasterOn && hasConsented;
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
          ? (showAdsterra
              ? <AdsterraBanner slot={slot} />
              : showMonetag
                ? <MonetagBanner slot={slot} />
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
