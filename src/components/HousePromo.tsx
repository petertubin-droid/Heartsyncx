/** House promo cards: internal cross-article promotion + cross-site promo.
 *
 *  These are NOT ad-network units (no consent gate, no iframe, no zone
 *  keys) - they are first-party content recommendations, so they render
 *  unconditionally, like the "Related Reading" insert cards.
 *
 *  Two variants:
 *   - ArticlePromoCard: advertises another Heartsyncx article inside the
 *     article reading flow (in-article house ads). Clicking navigates
 *     within the SPA, same as any internal link.
 *   - FreluxCrossPromo: a single slot promoting FRELUX PROJECT CALC (the
 *     sister site) inside Heartsyncx article pages. External link,
 *     opens in a new tab.
 */
import React from 'react';
import { ArrowRight, BookOpen, Calculator, Clock, ExternalLink } from 'lucide-react';
import { Post } from '../types';
import { trackEvent } from '../lib/analytics';

/** In-article house ad for another Heartsyncx article. */
export const ArticlePromoCard: React.FC<{
  article: Post;
  onOpen: (slug: string) => void;
  variant?: 'first' | 'second';
}> = ({ article, onOpen, variant = 'first' }) => {
  if (!article?.slug || !article.title) return null;
  return (
    <div className="my-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-50/90 via-amber-50/50 to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 border border-rose-200/70 dark:border-rose-900/40 shadow-xs text-left">
      <div className="flex items-center gap-2 mb-2.5 text-rose-800 dark:text-rose-400 font-bold text-xs uppercase tracking-wider font-sans">
        <BookOpen className="w-4 h-4 text-rose-500 shrink-0" />
        <span>Keep Reading</span>
        <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono px-2 py-0.5 rounded-full ml-auto">
          From Heartsyncx
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          trackEvent('house_promo_click', { promoted_slug: article.slug, variant });
          onOpen(article.slug);
        }}
        className="w-full text-left group block"
      >
        <span className="block font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
          {article.title}
        </span>
        {article.excerpt && (
          <span className="mt-1.5 block text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {article.excerpt}
          </span>
        )}
        <span className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-rose-600 dark:text-rose-400">
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          Read this article
          {typeof article.read_time === 'number' && article.read_time > 0 && (
            <span className="text-zinc-400 dark:text-zinc-500 font-mono font-normal flex items-center gap-1">
              <Clock className="w-3 h-3" /> {article.read_time} min
            </span>
          )}
        </span>
      </button>
    </div>
  );
};

/** Single cross-site slot advertising the SISTER SITE (Frelux) to
 *  Heartsyncx readers. One component, but it promotes multiple parts of
 *  Frelux simultaneously: the calculator suite, the cost estimator, the
 *  color world, the learn hub and Pro-Connect - pages, sections and
 *  features, not just the homepage. */
export const FRELUX_PROMO_DESTINATIONS: { label: string; path: string; blurb: string }[] = [
  { label: 'Construction calculators', path: '/calculators', blurb: 'Free paint, screeding, POP ceiling and tile calculators' },
  { label: 'Cost estimator', path: '/cost-estimator', blurb: 'Budget your build with real Nigerian material prices' },
  { label: 'Color world', path: '/colors', blurb: 'Browse paint colors and preview them on real walls' },
  { label: 'Learn hub', path: '/learn', blurb: 'Practical, no-fluff construction guides' },
  { label: 'Pro-Connect', path: '/pro-connect', blurb: 'Hire verified building pros near you' },
];

export const FreluxCrossPromo: React.FC = () => (
  <div className="my-8 p-5 sm:p-6 rounded-2xl bg-zinc-900 dark:bg-zinc-950 text-white border border-zinc-800 shadow-lg text-left relative overflow-hidden">
    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="flex items-center gap-2 mb-2.5 text-emerald-400 font-bold text-xs uppercase tracking-widest font-sans border-b border-zinc-800 pb-2.5">
      <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>From our sister site</span>
    </div>
    <a
      href="https://freluxtools.netlify.app/"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('cross_promo_click', { target_site: 'frelux', source: 'heartsyncx_article', destination: 'home' })}
      className="group block"
    >
      <span className="block font-serif text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
        FRELUX PROJECT CALC: know exactly what your building project needs
      </span>
      <span className="mt-1.5 block text-xs sm:text-sm text-zinc-300 leading-relaxed">
        Free Nigerian construction tools and guides for your next build or renovation.
      </span>
    </a>
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {FRELUX_PROMO_DESTINATIONS.map((d) => (
        <a
          key={d.path}
          href={`https://freluxtools.netlify.app${d.path}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('cross_promo_click', { target_site: 'frelux', source: 'heartsyncx_article', destination: d.path })}
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
  </div>
);
