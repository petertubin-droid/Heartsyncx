/** Cross-site house-ad system: FRELUX promoted across Heartsyncx.
 *
 *  ONE admin-configurable unit (Admin > Ad Monetization > Cross-Site
 *  Promo) rendered in the visual language of real programmatic ad
 *  networks (AdSense display, AdSense link units, Adsterra native,
 *  content-recommendation widgets) so visitors cannot tell house ads
 *  apart from network inventory:
 *   - 'card'         content-recommendation widget ("Recommended for you")
 *   - 'banner'       responsive display ad + link-unit row
 *   - 'native'       native ad with thumbnail, headline, body and CTA
 *   - 'interstitial' full-screen overlay ad, once per browser session
 *
 *  Every unit carries standard ad chrome: the "Ad" badge, an AdChoices
 *  info glyph, blue headline link, green display URL, neutral ad
 *  container and a pill CTA. Slots rotate destinations (by slotIndex)
 *  so two units on one page advertise different parts of Frelux.
 *  Clicks fire cross_promo_click GA4 events with the destination path.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info, Calculator, Coins, Palette, BookOpen, HardHat, ExternalLink, X } from 'lucide-react';
import { heartsync } from '../../store';
import { trackEvent } from '../../lib/analytics';
import { FRELUX_PROMO_DESTINATIONS } from '../HousePromo';

const FRELUX_BASE = 'https://freluxtools.netlify.app';
const FRELUX_DOMAIN = 'freluxtools.netlify.app';
const INTERSTITIAL_FLAG = 'hs_cross_promo_interstitial_shown';
export type CrossPromoFormat = 'card' | 'banner' | 'native' | 'interstitial';

/* Standard programmatic-ad chrome colors (AdSense conventions):
   blue headline, green display URL, neutral container. */
const HEADLINE = 'text-[#1a0dab] dark:text-[#8ab4f8] visited:text-[#681da8]';
const DISPLAY_URL = 'text-[#006629]/90 dark:text-[#7ee787]/80';
const AD_CONTAINER = 'bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-lg';
const AD_BODY = 'text-[#3c4043] dark:text-[#9aa0a6]';

/** Per-destination creative assets for thumbnails. */
const DEST_CREATIVES: { icon: React.ElementType; gradient: string }[] = [
  { icon: Calculator, gradient: 'from-emerald-500 to-teal-600' },
  { icon: Coins, gradient: 'from-teal-500 to-cyan-600' },
  { icon: Palette, gradient: 'from-sky-500 to-blue-600' },
  { icon: BookOpen, gradient: 'from-amber-500 to-orange-600' },
  { icon: HardHat, gradient: 'from-lime-600 to-emerald-600' },
];

interface Dest {
  label: string;
  path: string;
  blurb: string;
}

function trackClick(dest: Dest, source: string) {
  trackEvent('cross_promo_click', { target_site: 'frelux', source, destination: dest.path });
}

function go(dest: Dest, source: string) {
  trackClick(dest, source);
  window.open(`${FRELUX_BASE}${dest.path}`, '_blank', 'noopener,noreferrer');
}

/** AdSense-style "Ad" badge with AdChoices info glyph. */
const AdBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    title={`Ads by Frelux · Sponsored`}
    className={`inline-flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-bold leading-none text-[#5f6368] dark:text-[#9aa0a6] bg-[#f1f3f4] dark:bg-[#3c4043] cursor-help ${className}`}
  >
    Ad
    <Info className="w-2 h-2" />
  </span>
);

/** Standalone AdChoices glyph (top-right corner of a unit). */
const AdChoices: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    title="Why this ad? Ads by Frelux"
    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] cursor-help ${className}`}
  >
    <Info className="w-2.5 h-2.5" />
  </span>
);

/** Pill CTA button, network-ad style. */
const CtaButton: React.FC<{ dest: Dest; source: string; label?: string; big?: boolean }> = ({ dest, source, label = 'Visit site', big = false }) => (
  <button
    type="button"
    onClick={() => go(dest, source)}
    className={`shrink-0 ${big ? 'px-6 py-2.5 text-sm' : 'px-4 py-1.5 text-xs'} rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-white font-bold shadow-sm cursor-pointer transition-colors`}
  >
    {label}
  </button>
);

/** Banner: responsive display ad (headline + URL + body + CTA) with an
 *  AdSense-style link-unit row of 3 rotating destinations underneath. */
const Banner: React.FC<{ slotIndex: number; source: string }> = ({ slotIndex, source }) => {
  const featured = FRELUX_PROMO_DESTINATIONS[slotIndex % FRELUX_PROMO_DESTINATIONS.length];
  const links = FRELUX_PROMO_DESTINATIONS.filter((_, i) => i !== slotIndex % FRELUX_PROMO_DESTINATIONS.length).slice(0, 3);
  return (
    <div className={`my-6 overflow-hidden ${AD_CONTAINER}`}>
      <div className="flex items-start justify-between px-4 pt-2">
        <AdBadge />
        <AdChoices />
      </div>
      <div className="px-4 pb-3 pt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => go(featured, source)}
            className={`text-left text-sm sm:text-base font-bold ${HEADLINE} hover:underline cursor-pointer block`}
          >
            {featured.label} — free Nigerian construction tools
          </button>
          <span className={`text-[11px] ${DISPLAY_URL}`}>{FRELUX_DOMAIN}{featured.path}</span>
          <p className={`mt-0.5 text-xs ${AD_BODY} truncate`}>{featured.blurb}. Fast, accurate, no sign-up needed.</p>
        </div>
        <CtaButton dest={featured} source={source} />
      </div>
      {/* Link-unit row (AdSense link ads style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#dadce0] dark:border-[#3c4043] divide-y sm:divide-y-0 sm:divide-x divide-[#dadce0] dark:divide-[#3c4043]">
        {links.map((d) => (
          <button
            key={d.path}
            type="button"
            onClick={() => go(d, source)}
            className="px-4 py-2.5 text-left hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] cursor-pointer"
          >
            <span className={`block text-xs font-bold ${HEADLINE} truncate`}>{d.label}</span>
            <span className={`block text-[10px] ${DISPLAY_URL} truncate`}>{FRELUX_DOMAIN}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/** Native: Adsterra/AdSense native unit — thumbnail, headline, body,
 *  domain line and inline CTA. */
const NativeUnit: React.FC<{ slotIndex: number; source: string }> = ({ slotIndex, source }) => {
  const d = FRELUX_PROMO_DESTINATIONS[slotIndex % FRELUX_PROMO_DESTINATIONS.length];
  const creative = DEST_CREATIVES[slotIndex % DEST_CREATIVES.length];
  return (
    <div className={`my-6 p-3 flex items-stretch gap-3 ${AD_CONTAINER}`}>
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => go(d, source)}
        className={`relative w-24 h-20 sm:w-28 sm:h-[5.5rem] shrink-0 rounded-md overflow-hidden bg-gradient-to-br ${creative.gradient} cursor-pointer`}
        aria-label={d.label}
      >
        <creative.icon className="absolute inset-0 m-auto w-8 h-8 text-white/90" />
        <span className="absolute bottom-1 left-1.5 text-[8px] font-black tracking-widest text-white/80 uppercase">Frelux</span>
        <AdBadge className="absolute top-1 right-1 !bg-black/30 !text-white" />
      </button>
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => go(d, source)}
            className={`text-left text-sm font-bold leading-snug line-clamp-2 ${HEADLINE} hover:underline cursor-pointer`}
          >
            {d.label} — {d.blurb}
          </button>
          <AdChoices className="-mt-0.5" />
        </div>
        <p className={`mt-1 text-[11px] leading-relaxed line-clamp-2 ${AD_BODY}`}>
          Plan your build with real Nigerian prices. Free tools from the Frelux team.
        </p>
        <div className="mt-auto pt-1 flex items-center gap-2">
          <button type="button" onClick={() => go(d, source)} className={`text-[10px] font-bold ${DISPLAY_URL} hover:underline cursor-pointer truncate`}>
            {FRELUX_DOMAIN}
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
const RecCard: React.FC<{ slotIndex: number; source: string }> = ({ slotIndex, source }) => {
  const rotated = FRELUX_PROMO_DESTINATIONS.map((_, i) => FRELUX_PROMO_DESTINATIONS[(i + slotIndex) % FRELUX_PROMO_DESTINATIONS.length]);
  return (
    <div className={`my-8 overflow-hidden ${AD_CONTAINER}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#dadce0] dark:border-[#3c4043]">
        <span className={`text-xs font-bold uppercase tracking-wide ${AD_BODY}`}>Recommended for you</span>
        <AdChoices />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 md:divide-y-0 sm:divide-x divide-[#dadce0] dark:divide-[#3c4043]">
        {rotated.slice(0, 3).map((d, i) => {
          const creative = DEST_CREATIVES[(i + slotIndex) % DEST_CREATIVES.length];
          return (
            <button
              key={d.path}
              type="button"
              onClick={() => go(d, source)}
              className="group flex items-stretch gap-3 p-3 text-left hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] cursor-pointer"
            >
              <span className={`relative w-20 h-14 shrink-0 rounded-md overflow-hidden bg-gradient-to-br ${creative.gradient}`}>
                <creative.icon className="absolute inset-0 m-auto w-6 h-6 text-white/90" />
              </span>
              <span className="min-w-0">
                <span className={`block text-xs font-bold leading-snug line-clamp-2 ${HEADLINE}`}>{d.label}</span>
                <span className={`block text-[10px] mt-1 ${DISPLAY_URL} truncate`}>{FRELUX_DOMAIN}</span>
                <span className="block text-[10px] mt-0.5 text-[#5f6368] dark:text-[#9aa0a6]">Sponsored</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Interstitial overlay ad: standard chrome ("Advertisement" label,
 *  AdChoices, close X), shown once per browser session. */
const Interstitial: React.FC<{ source: string }> = ({ source }) => {
  const [open, setOpen] = useState(false);
  const featured = FRELUX_PROMO_DESTINATIONS[0];
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
            Advertisement <AdBadge />
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
            Building in Nigeria? Know exactly what your project needs.
          </button>
          <span className={`text-xs ${DISPLAY_URL}`}>{FRELUX_DOMAIN}</span>
          <p className={`mt-2 text-sm leading-relaxed ${AD_BODY}`}>
            Free construction calculators, cost estimates and practical guides from the Frelux team.
          </p>
          <div className="mt-4">
            <CtaButton big dest={featured} source={source} label="Visit site" />
          </div>
          <div className="mt-4 space-y-1.5 border-t border-[#dadce0] dark:border-[#3c4043] pt-3">
            {FRELUX_PROMO_DESTINATIONS.slice(1, 4).map((d) => (
              <button
                key={d.path}
                type="button"
                onClick={() => go(d, source)}
                className="flex items-center justify-between gap-2 w-full text-left group cursor-pointer"
              >
                <span className="min-w-0">
                  <span className={`block text-xs font-bold ${HEADLINE} group-hover:underline truncate`}>{d.label}</span>
                  <span className={`block text-[10px] ${DISPLAY_URL} truncate`}>{FRELUX_DOMAIN}{d.path}</span>
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

/** The slot component. Place anywhere; format comes from admin settings. */
const CrossPromoSlot: React.FC<{
  /** Used for destination rotation so slots on the same page differ. */
  slotIndex?: number;
  source?: string;
}> = ({ slotIndex = 0, source = 'heartsyncx' }) => {
  const s = (heartsync.site_settings || {}) as Record<string, unknown>;
  if (s.cross_promo_enabled === false) return null;
  const format = (s.cross_promo_format as CrossPromoFormat) || 'card';

  if (format === 'interstitial') return <Interstitial source={`${source}_interstitial`} />;
  if (format === 'banner') return <Banner slotIndex={slotIndex} source={`${source}_banner_${slotIndex}`} />;
  if (format === 'native') return <NativeUnit slotIndex={slotIndex} source={`${source}_native_${slotIndex}`} />;
  return <RecCard slotIndex={slotIndex} source={`${source}_card_${slotIndex}`} />;
};

export default CrossPromoSlot;
