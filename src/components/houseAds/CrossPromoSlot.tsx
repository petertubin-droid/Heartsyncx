/** Cross-site house-ad system with admin-configurable destinations.
 *
 *  Admin > Ad Monetization > Cross-Site Promo controls:
 *   - cross_promo_enabled    master switch
 *   - cross_promo_format     'display' | 'card' | 'banner' | 'native' | 'interstitial'
 *   - cross_promo_base_url   the FRELUX origin. CHANGEABLE: when Frelux
 *                             moves to its custom domain the admin edits
 *                             one field here and every unit follows.
 *   - external_promos[]      third-party partner promos. External web
 *                             owners can buy a slot on this site: each
 *                             entry carries its own absolute URL, label,
 *                             blurb and owner name, and is mixed into the
 *                             same rotation as the Frelux destinations.
 *
 *  Units render in the visual language of real programmatic ad networks
 *  (AdSense display, AdSense link units, Adsterra native, content-
 *  recommendation widgets) so visitors cannot tell house ads apart from
 *  network inventory. Slots rotate items (by slotIndex) so two units on
 *  one page advertise different destinations. Every unit carries standard
 *  ad chrome: the "Ad" badge, an AdChoices info glyph, blue headline
 *  link, green display URL and a pill CTA. Clicks fire cross_promo_click
 *  GA4 events with the destination and partner.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, Calculator, Coins, Palette, BookOpen, HardHat, Globe, ExternalLink, X } from 'lucide-react';
import { heartsync } from '../../store';
import { trackEvent } from '../../lib/analytics';
import { FRELUX_PROMO_DESTINATIONS } from '../HousePromo';

export const DEFAULT_CROSS_PROMO_BASE_URL = 'https://freluxtools.netlify.app';

/** Frelux's real site identity, used by the single-image Display format:
 *  its own logo (not a per-feature icon) and the actual description from
 *  Frelux's own index.html <meta name="description"> - one honest,
 *  site-level ad instead of a rotating grid of feature links. */
const FRELUX_SITE = {
  name: 'Frelux',
  logoPath: '/logo-mark.png',
  description: 'Free online construction estimation platform: paint, screeding, tile and POP ceiling calculators, plus cost estimators and an AI color assistant for Nigerian building projects.',
};
const INTERSTITIAL_FLAG = 'hs_cross_promo_interstitial_shown';
export type CrossPromoFormat = 'display' | 'card' | 'banner' | 'native' | 'interstitial';

/** A third-party partner promo, admin-managed (External Partner Promos in
 *  the Cross-Site Promo admin tab). Stored in site_settings.external_promos. */
export interface ExternalPromo {
  id: string;
  enabled: boolean;
  label: string;
  url: string;
  blurb: string;
  owner_name?: string;
  /** Absolute logo/og:image URL, shown in the single-image Display
   *  format. The admin "AI Assistant" (Generate from URL) fills this
   *  automatically from the target page's og:image. */
  logo_url?: string;
}

/* Standard programmatic-ad chrome colors (AdSense conventions):
   blue headline, green display URL, neutral container. */
const HEADLINE = 'text-[#1a0dab] dark:text-[#8ab4f8] visited:text-[#681da8]';
const DISPLAY_URL = 'text-[#006629]/90 dark:text-[#7ee787]/80';
const AD_CONTAINER = 'bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-lg';
const AD_BODY = 'text-[#3c4043] dark:text-[#9aa0a6]';

/** Per-destination creative assets for thumbnails (Frelux destinations). */
const DEST_CREATIVES: { icon: React.ElementType; gradient: string }[] = [
  { icon: Calculator, gradient: 'from-emerald-500 to-teal-600' },
  { icon: Coins, gradient: 'from-teal-500 to-cyan-600' },
  { icon: Palette, gradient: 'from-sky-500 to-blue-600' },
  { icon: BookOpen, gradient: 'from-amber-500 to-orange-600' },
  { icon: HardHat, gradient: 'from-lime-600 to-emerald-600' },
];
const EXTERNAL_CREATIVE = { icon: Globe, gradient: 'from-indigo-500 to-purple-600' };

/** One linkable house-ad item, Frelux or external partner. */
export interface PromoItem {
  id: string;
  /** Headline text (what the visitor clicks). */
  label: string;
  /** Absolute destination URL. */
  url: string;
  /** Green display-URL text, derived from the URL host. */
  domain: string;
  /** GA4 destination label. */
  path: string;
  /** Supporting copy under the headline. */
  blurb: string;
  site: 'frelux' | 'external';
  /** Who the ad is by ("Ads by X"). */
  owner: string;
  icon: React.ElementType;
  gradient: string;
  /** One-line marketing sentence (Frelux destinations only). */
  pitch: string;
  /** Interstitial headline. */
  bigHeadline: string;
  /** Interstitial body. */
  bigBody: string;
  /** Absolute logo/creative image URL for the single-image Display
   *  format. Falls back to the icon+gradient tile when absent. */
  logo?: string;
}

/** Normalize an admin-entered origin: add https:// when missing, strip a
 *  trailing slash so base+path concatenation is always well-formed. */
export function normalizeBaseUrl(raw: string | undefined): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return DEFAULT_CROSS_PROMO_BASE_URL;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProto.replace(/\/+$/, '');
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Build the full rotation of promo items from settings: the Frelux
 *  destinations (against the configured base URL) plus every enabled
 *  external partner promo. Exported for tests and the admin editor. */
export function buildPromoItems(settings: Record<string, unknown> = {}): PromoItem[] {
  const base = normalizeBaseUrl(settings.cross_promo_base_url as string | undefined);
  const frelux: PromoItem[] = FRELUX_PROMO_DESTINATIONS.map((d, i) => ({
    id: `frelux-${d.path}`,
    label: d.label,
    url: `${base}${d.path}`,
    domain: hostOf(base),
    path: d.path,
    blurb: d.blurb,
    site: 'frelux' as const,
    owner: 'Frelux',
    ...(DEST_CREATIVES[i % DEST_CREATIVES.length] || DEST_CREATIVES[0]),
    pitch: 'Fast, accurate, no sign-up needed.',
    bigHeadline: 'Building in Nigeria? Know exactly what your project needs.',
    bigBody: 'Free construction calculators, cost estimates and practical guides from the Frelux team.',
    logo: `${base}${FRELUX_SITE.logoPath}`,
  }));

  const rawList = Array.isArray(settings.external_promos) ? (settings.external_promos as ExternalPromo[]) : [];
  const external: PromoItem[] = rawList
    .filter((p) => p && p.enabled !== false && (p.url || '').trim() && (p.label || '').trim())
    .map((p) => {
      const url = (p.url || '').trim().match(/^https?:\/\//i) ? (p.url || '').trim() : `https://${(p.url || '').trim()}`;
      return {
        id: p.id || `ext-${hostOf(url)}`,
        label: p.label,
        url,
        domain: hostOf(url),
        path: url,
        blurb: p.blurb || '',
        site: 'external' as const,
        owner: (p.owner_name || '').trim() || hostOf(url),
        ...EXTERNAL_CREATIVE,
        pitch: `Sponsored by ${((p.owner_name || '').trim() || hostOf(url))}.`,
        bigHeadline: p.label,
        bigBody: p.blurb || `A message from our partner ${((p.owner_name || '').trim() || hostOf(url))}.`,
        logo: (p.logo_url || '').trim() || undefined,
      };
    });

  return [...frelux, ...external];
}

/** Build the rotation for the single-image Display format: ONE
 *  site-level Frelux item (real logo, real site description, links to
 *  the homepage) instead of the 5 per-feature destinations, plus every
 *  enabled external partner (each shown with its own logo when the
 *  admin/AI-assistant supplied one, otherwise a neutral globe tile).
 *  Exported for tests and the admin preview. */
export function buildDisplayPromoItems(settings: Record<string, unknown> = {}): PromoItem[] {
  const base = normalizeBaseUrl(settings.cross_promo_base_url as string | undefined);
  const freluxSite: PromoItem = {
    id: 'frelux-site',
    label: FRELUX_SITE.name,
    url: base,
    domain: hostOf(base),
    path: '/',
    blurb: FRELUX_SITE.description,
    site: 'frelux',
    owner: 'Frelux',
    ...DEST_CREATIVES[0],
    pitch: 'Fast, accurate, no sign-up needed.',
    bigHeadline: 'Building in Nigeria? Know exactly what your project needs.',
    bigBody: FRELUX_SITE.description,
    logo: `${base}${FRELUX_SITE.logoPath}`,
  };

  const rawList = Array.isArray(settings.external_promos) ? (settings.external_promos as ExternalPromo[]) : [];
  const external: PromoItem[] = rawList
    .filter((p) => p && p.enabled !== false && (p.url || '').trim() && (p.label || '').trim())
    .map((p) => {
      const url = (p.url || '').trim().match(/^https?:\/\//i) ? (p.url || '').trim() : `https://${(p.url || '').trim()}`;
      return {
        id: p.id || `ext-${hostOf(url)}`,
        label: p.label,
        url,
        domain: hostOf(url),
        path: url,
        blurb: p.blurb || `Sponsored partner: ${hostOf(url)}.`,
        site: 'external' as const,
        owner: (p.owner_name || '').trim() || hostOf(url),
        ...EXTERNAL_CREATIVE,
        pitch: `Sponsored by ${((p.owner_name || '').trim() || hostOf(url))}.`,
        bigHeadline: p.label,
        bigBody: p.blurb || `A message from our partner ${((p.owner_name || '').trim() || hostOf(url))}.`,
        logo: (p.logo_url || '').trim() || undefined,
      };
    });

  return [freluxSite, ...external];
}

function trackClick(dest: PromoItem, source: string) {
  trackEvent('cross_promo_click', {
    target_site: dest.site === 'external' ? 'external' : 'frelux',
    source,
    destination: dest.path,
    ...(dest.site === 'external' ? { partner: dest.owner } : {}),
  });
}

function go(dest: PromoItem, source: string) {
  trackClick(dest, source);
  window.open(dest.url, '_blank', 'noopener,noreferrer');
}

/** AdSense-style "Ad" badge with AdChoices info glyph. */
const AdBadge: React.FC<{ className?: string; by?: string }> = ({ className = '', by = 'Frelux' }) => (
  <span
    title={`Ads by ${by} · Sponsored`}
    className={`inline-flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-bold leading-none text-[#5f6368] dark:text-[#9aa0a6] bg-[#f1f3f4] dark:bg-[#3c4043] cursor-help ${className}`}
  >
    Ad
    <Info className="w-2 h-2" />
  </span>
);

/** Standalone AdChoices glyph (top-right corner of a unit). */
const AdChoices: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    title="Why this ad? AdChoices"
    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] cursor-help ${className}`}
  >
    <Info className="w-2.5 h-2.5" />
  </span>
);

/** Pill CTA button, network-ad style. */
const CtaButton: React.FC<{ dest: PromoItem; source: string; label?: string; big?: boolean }> = ({ dest, source, label = 'Visit site', big = false }) => (
  <button
    type="button"
    onClick={() => go(dest, source)}
    className={`shrink-0 ${big ? 'px-6 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'} rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-white font-bold shadow-sm cursor-pointer transition-colors`}
  >
    {label}
  </button>
);

/** Display: a single, honest image-style ad unit — small "Advertisement"
 *  label, one real logo/creative image, one headline + real description,
 *  one CTA. No grid, no rotating link rows: exactly ONE destination per
 *  render, matching how a real AdSense/Adsterra image ad looks. */
const DisplayAd: React.FC<{ items: PromoItem[]; slotIndex: number; source: string }> = ({ items, slotIndex, source }) => {
  const d = items[slotIndex % items.length];
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(d.logo) && !logoFailed;
  return (
    <div className={`my-6 overflow-hidden ${AD_CONTAINER}`}>
      <div className="flex items-center justify-center gap-1.5 pt-2 pb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6]">Advertisement</span>
        <AdChoices />
      </div>
      <button
        type="button"
        onClick={() => go(d, source)}
        aria-label={d.label}
        className={`relative w-full h-36 sm:h-44 flex items-center justify-center cursor-pointer ${showLogo ? 'bg-zinc-50 dark:bg-zinc-950' : `bg-gradient-to-br ${d.gradient}`}`}
      >
        {showLogo ? (
          <img
            src={d.logo}
            alt={d.label}
            loading="lazy"
            onError={() => setLogoFailed(true)}
            className="max-h-16 sm:max-h-20 max-w-[70%] w-auto object-contain"
          />
        ) : (
          <d.icon className="w-10 h-10 text-white/90" />
        )}
        <AdBadge by={d.owner} className="absolute top-2 right-2" />
      </button>
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#dadce0] dark:border-[#3c4043]">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => go(d, source)}
            className={`text-left text-sm sm:text-base font-bold ${HEADLINE} hover:underline cursor-pointer block`}
          >
            {d.label}
          </button>
          <span className={`text-[11px] ${DISPLAY_URL}`}>{d.domain}</span>
          <p className={`mt-0.5 text-xs ${AD_BODY} line-clamp-2`}>{d.blurb}</p>
        </div>
        <CtaButton dest={d} source={source} />
      </div>
    </div>
  );
};

/** Banner: responsive display ad (headline + URL + body + CTA) with an
 *  AdSense-style link-unit row of 3 rotating destinations underneath. */
const Banner: React.FC<{ items: PromoItem[]; slotIndex: number; source: string }> = ({ items, slotIndex, source }) => {
  const featured = items[slotIndex % items.length];
  const links = items.filter((_, i) => i !== slotIndex % items.length).slice(0, 3);
  return (
    <div className={`my-6 overflow-hidden ${AD_CONTAINER}`}>
      <div className="flex items-start justify-between px-4 pt-2">
        <AdBadge by={featured.owner} />
        <AdChoices />
      </div>
      <div className="px-4 pb-3 pt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => go(featured, source)}
            className={`text-left text-sm sm:text-base font-bold ${HEADLINE} hover:underline cursor-pointer block`}
          >
            {featured.label}{featured.site === 'frelux' ? ' — free Nigerian construction tools' : ''}
          </button>
          <span className={`text-[11px] ${DISPLAY_URL}`}>{featured.domain}{featured.site === 'frelux' ? featured.path : ''}</span>
          <p className={`mt-0.5 text-xs ${AD_BODY} truncate`}>{featured.blurb}. {featured.pitch}</p>
        </div>
        <CtaButton dest={featured} source={source} />
      </div>
      {/* Link-unit row (AdSense link ads style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#dadce0] dark:border-[#3c4043] divide-y sm:divide-y-0 sm:divide-x divide-[#dadce0] dark:divide-[#3c4043]">
        {links.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => go(d, source)}
            className="px-4 py-2.5 text-left hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] cursor-pointer"
          >
            <span className={`block text-xs font-bold ${HEADLINE} truncate`}>{d.label}</span>
            <span className={`block text-[10px] ${DISPLAY_URL} truncate`}>{d.domain}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/** Native: Adsterra/AdSense native unit — thumbnail, headline, body,
 *  domain line and inline CTA. */
const NativeUnit: React.FC<{ items: PromoItem[]; slotIndex: number; source: string }> = ({ items, slotIndex, source }) => {
  const d = items[slotIndex % items.length];
  return (
    <div className={`my-6 p-3 flex items-stretch gap-3 ${AD_CONTAINER}`}>
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => go(d, source)}
        className={`relative w-24 h-20 sm:w-28 sm:h-[5.5rem] shrink-0 rounded-md overflow-hidden bg-gradient-to-br ${d.gradient} cursor-pointer`}
        aria-label={d.label}
      >
        <d.icon className="absolute inset-0 m-auto w-8 h-8 text-white/90" />
        <span className="absolute bottom-1 left-1.5 text-[8px] font-black tracking-widest text-white/80 uppercase">{d.owner}</span>
        <AdBadge by={d.owner} className="absolute top-1 right-1 !bg-black/30 !text-white" />
      </button>
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => go(d, source)}
            className={`text-left text-sm font-bold leading-snug line-clamp-2 ${HEADLINE} hover:underline cursor-pointer`}
          >
            {d.label}
          </button>
          <AdChoices className="-mt-0.5" />
        </div>
        <p className={`mt-1 text-[11px] leading-relaxed line-clamp-2 ${AD_BODY}`}>
          {d.blurb}. {d.pitch}
        </p>
        <div className="mt-auto pt-1 flex items-center gap-2">
          <button type="button" onClick={() => go(d, source)} className={`text-[10px] font-bold ${DISPLAY_URL} hover:underline cursor-pointer truncate`}>
            {d.domain}
          </button>
          <button
            type="button"
            onClick={() => go(d, source)}
            className="ml-auto text-[11px] font-bold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
          >
            Read more »
          </button>
        </div>
      </div>
    </div>
  );
};

/** Card: content-recommendation widget — "Recommended for you" header
 *  with rotating sponsored tiles, like Outbrain/Adsterra widgets. */
const RecCard: React.FC<{ items: PromoItem[]; slotIndex: number; source: string }> = ({ items, slotIndex, source }) => {
  const rotated = items.map((_, i) => items[(i + slotIndex) % items.length]);
  return (
    <div className={`my-8 overflow-hidden ${AD_CONTAINER}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#dadce0] dark:border-[#3c4043]">
        <span className={`text-xs font-bold uppercase tracking-wide ${AD_BODY}`}>Recommended for you</span>
        <AdChoices />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 md:divide-y-0 sm:divide-x divide-[#dadce0] dark:divide-[#3c4043]">
        {rotated.slice(0, 3).map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => go(d, source)}
            className="group flex items-stretch gap-3 p-3 text-left hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] cursor-pointer"
          >
            <span className={`relative w-20 h-14 shrink-0 rounded-md overflow-hidden bg-gradient-to-br ${d.gradient}`}>
              <d.icon className="absolute inset-0 m-auto w-6 h-6 text-white/90" />
            </span>
            <span className="min-w-0">
              <span className={`block text-xs font-bold leading-snug line-clamp-2 ${HEADLINE}`}>{d.label}</span>
              <span className={`block text-[10px] mt-1 ${DISPLAY_URL} truncate`}>{d.domain}</span>
              <span className="block text-[10px] mt-0.5 text-[#5f6368] dark:text-[#9aa0a6]">Sponsored</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/** Interstitial overlay ad: standard chrome ("Advertisement" label,
 *  AdChoices, close X), shown once per browser session. */
const Interstitial: React.FC<{ items: PromoItem[]; source: string }> = ({ items, source }) => {
  const [open, setOpen] = useState(false);
  const featured = items[0];
  useEffect(() => {
    try {
      if (sessionStorage.getItem(INTERSTITIAL_FLAG) === '1') return;
    } catch { /* storage unavailable - still show, degrade gracefully */ }
    const t = setTimeout(() => {
      setOpen(true);
      try { sessionStorage.setItem(INTERSTITIAL_FLAG, '1'); } catch { /* ignore */ }
    }, 5000);
    return () => clearTimeout(t);
  }, []);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className={`max-w-md w-full ${AD_CONTAINER} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 pt-2">
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#5f6368] dark:text-[#9aa0a6]">
            Advertisement <AdBadge by={featured.owner} />
          </span>
          <div className="flex items-center gap-1">
            <AdChoices />
            <button
              type="button"
              aria-label="Close ad"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <button
            type="button"
            onClick={() => go(featured, source)}
            className={`text-left text-lg font-bold leading-snug block cursor-pointer ${HEADLINE} hover:underline`}
          >
            {featured.bigHeadline}
          </button>
          <span className={`text-xs ${DISPLAY_URL}`}>{featured.domain}</span>
          <p className={`mt-2 text-sm leading-relaxed ${AD_BODY}`}>{featured.bigBody}</p>
          <div className="mt-4">
            <CtaButton big dest={featured} source={source} label="Visit site" />
          </div>
          <div className="mt-4 space-y-1.5 border-t border-[#dadce0] dark:border-[#3c4043] pt-3">
            {items.slice(1, 4).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => go(d, source)}
                className="flex items-center justify-between gap-2 w-full text-left group cursor-pointer"
              >
                <span className="min-w-0">
                  <span className={`block text-xs font-bold ${HEADLINE} group-hover:underline truncate`}>{d.label}</span>
                  <span className={`block text-[10px] ${DISPLAY_URL} truncate`}>{d.domain}{d.site === 'frelux' ? d.path : ''}</span>
                </span>
                <ExternalLink className="w-3 h-3 shrink-0 text-[#5f6368] dark:text-[#9aa0a6] opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/** The slot component. Place anywhere; format and destinations come from
 *  admin settings. */
const CrossPromoSlot: React.FC<{
  /** Used for destination rotation so slots on the same page differ. */
  slotIndex?: number;
  source?: string;
}> = ({ slotIndex = 0, source = 'heartsyncx' }) => {
  const s = (heartsync.site_settings || {}) as Record<string, unknown>;
  if (s.cross_promo_enabled === false) return null;
  const format = (s.cross_promo_format as CrossPromoFormat) || 'display';

  if (format === 'display') {
    const displayItems = buildDisplayPromoItems(s);
    if (displayItems.length === 0) return null;
    return <DisplayAd items={displayItems} slotIndex={slotIndex} source={`${source}_display_${slotIndex}`} />;
  }

  const items = buildPromoItems(s);
  if (items.length === 0) return null;

  if (format === 'interstitial') return <Interstitial items={items} source={`${source}_interstitial`} />;
  if (format === 'banner') return <Banner items={items} slotIndex={slotIndex} source={`${source}_banner_${slotIndex}`} />;
  if (format === 'native') return <NativeUnit items={items} slotIndex={slotIndex} source={`${source}_native_${slotIndex}`} />;
  return <RecCard items={items} slotIndex={slotIndex} source={`${source}_card_${slotIndex}`} />;
};

export default CrossPromoSlot;
