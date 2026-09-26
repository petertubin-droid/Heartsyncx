/** Cross-site house-ad system: FRELUX promoted across Heartsyncx.
 *
 *  ONE admin-configurable unit (Admin > Ad Monetization > Cross-Site
 *  Promo) that renders in four formats:
 *   - 'card'         rich card: headline + grid of destination links
 *   - 'banner'       slim horizontal strip with 3 rotating destination links
 *   - 'native'       in-feed text unit with 1 rotating destination
 *   - 'interstitial' full-screen overlay, shown ONCE per browser session
 *                   (5s after the first slot mounts), inline slots render
 *                   nothing while this format is active
 *
 *  Every destination deep-links to the section/feature it names, and
 *  each click fires a cross_promo_click GA4 event with the path.
 *  Slots rotate destinations (by slotIndex) so two units on the same
 *  page advertise different parts of Frelux simultaneously.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, ExternalLink, X } from 'lucide-react';
import { heartsync } from '../../store';
import { trackEvent } from '../../lib/analytics';
import { FRELUX_PROMO_DESTINATIONS, FreluxCrossPromo } from '../HousePromo';

const FRELUX_BASE = 'https://freluxtools.netlify.app';
const INTERSTITIAL_FLAG = 'hs_cross_promo_interstitial_shown';
export type CrossPromoFormat = 'card' | 'banner' | 'native' | 'interstitial';

function link(dest: { path: string }) {
  return `${FRELUX_BASE}${dest.path}`;
}

function trackClick(dest: { path: string }, source: string) {
  trackEvent('cross_promo_click', { target_site: 'frelux', source, destination: dest.path });
}

function DestLink({ dest, source, className = '' }: { dest: typeof FRELUX_PROMO_DESTINATIONS[number]; source: string; className?: string }) {
  return (
    <a
      href={link(dest)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick(dest, source)}
      className={className}
    >
      {dest.label}
    </a>
  );
}

/** Banner: slim strip, headline + up to 3 rotating destination links. */
const Banner: React.FC<{ slotIndex: number; source: string }> = ({ slotIndex, source }) => {
  const picks = FRELUX_PROMO_DESTINATIONS.filter((_, i) => i !== (slotIndex % FRELUX_PROMO_DESTINATIONS.length))
    .slice(0, 3);
  return (
    <div className="my-6 rounded-xl bg-zinc-900 dark:bg-zinc-950 text-white border border-zinc-800 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 shadow-lg">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
        <Calculator className="w-3.5 h-3.5" /> From our sister site
      </span>
      <a
        href={FRELUX_BASE}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick({ path: '/' }, source)}
        className="text-sm font-bold hover:text-emerald-300 transition-colors"
      >
        FRELUX PROJECT CALC: free Nigerian construction calculators & cost estimates
      </a>
      <span className="hidden sm:flex items-center gap-3 ml-auto">
        {picks.map((d) => (
          <DestLink key={d.path} dest={d} source={source} className="text-[11px] font-semibold text-zinc-300 hover:text-emerald-300 flex items-center gap-1 transition-colors" />
        ))}
      </span>
    </div>
  );
};

/** Native: quiet in-feed text unit, single rotating destination. */
const NativeUnit: React.FC<{ slotIndex: number; source: string }> = ({ slotIndex, source }) => {
  const d = FRELUX_PROMO_DESTINATIONS[slotIndex % FRELUX_PROMO_DESTINATIONS.length];
  return (
    <div className="my-6 flex items-center gap-2 text-sm">
      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 shrink-0">Sponsored</span>
      <a
        href={link(d)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(d, source)}
        className="text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 min-w-0"
      >
        <span className="font-semibold">FRELUX</span>
        <span className="truncate">— {d.blurb}</span>
        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
      </a>
    </div>
  );
};

/** Interstitial overlay: full-screen, once per session. */
const Interstitial: React.FC<{ source: string }> = ({ source }) => {
  const [open, setOpen] = useState(false);
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
      <div className="max-w-lg w-full bg-zinc-900 text-white rounded-2xl border border-zinc-700 shadow-2xl p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-xs uppercase tracking-widest font-sans">
          <Calculator className="w-4 h-4" /> From our sister site
        </div>
        <a
          href={FRELUX_BASE}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick({ path: '/' }, source)}
          className="group block"
        >
          <span className="block font-serif text-xl font-bold group-hover:text-emerald-300 transition-colors">
            FRELUX PROJECT CALC: know exactly what your building project needs
          </span>
          <span className="mt-2 block text-sm text-zinc-300 leading-relaxed">
            Free Nigerian construction tools and guides for your next build or renovation.
          </span>
        </a>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FRELUX_PROMO_DESTINATIONS.map((d) => (
            <a
              key={d.path}
              href={link(d)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(d, source)}
              className="group flex items-start gap-2 p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 hover:border-emerald-500/50 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">{d.label}</span>
                <span className="block text-[11px] text-zinc-400 leading-snug mt-0.5">{d.blurb}</span>
              </span>
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-4 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-bold text-zinc-200"
        >
          Continue to Heartsyncx
        </button>
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
  return <FreluxCrossPromo />;
};

export default CrossPromoSlot;
