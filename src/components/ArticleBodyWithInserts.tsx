import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Heart, CheckCircle2, BookOpen, ArrowRight, Lightbulb, Compass, Share2 } from 'lucide-react';
import { InArticleInsertsConfig, InArticleInsertItem } from '../types';
import { preprocessMarkdownImages } from '../utils/markdownImage';
import { AdPlacement } from './AdPlacement';
import { ArticlePromoCard, FreluxCrossPromo } from './HousePromo';
import { heartsync } from '../store';
import { Post } from '../types';

interface ArticleBodyWithInsertsProps {
  content: string;
  inserts?: InArticleInsertsConfig;
  markdownComponents?: any;
  className?: string;
  /** House ads: in-article promotion of OTHER Heartsyncx articles.
   *  First-party recommendations, not ad-network units - no consent gate.
   *  Expects up to 2 picked articles (caller excludes the current one). */
  promoArticles?: Post[];
  /** Opens a promo article by slug (SPA navigation). */
  onOpenPromoArticle?: (slug: string) => void;
  /** Single cross-site slot: FRELUX PROJECT CALC advertised here. */
  showFreluxPromo?: boolean;
}

export function RenderInsertCard({ insert }: { insert: InArticleInsertItem }) {
  if (!insert || !insert.enabled || !insert.content) return null;

  switch (insert.id) {
    case 'insight':
      return (
        <div className="my-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-rose-50/40 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-zinc-900 border border-indigo-200/60 dark:border-indigo-800/50 shadow-sm relative overflow-hidden text-left">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2.5 text-indigo-800 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider font-sans">
            <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{insert.title || 'In-Article Insight'}</span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded-full ml-auto">
              AI Insight ~{insert.placementPercent || 12}%
            </span>
          </div>
          <div className="text-sm font-serif italic text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-2">
            <ReactMarkdown urlTransform={(u) => u}>{insert.content}</ReactMarkdown>
          </div>
        </div>
      );

    case 'reflection':
      return (
        <div className="my-8 p-6 rounded-2xl bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-l-4 border-l-rose-500 border border-zinc-200/80 dark:border-zinc-800 shadow-xs text-left">
          <div className="flex items-center gap-2 mb-2.5 text-rose-800 dark:text-rose-400 font-bold text-xs uppercase tracking-wider font-sans">
            <Brain className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{insert.title || 'Reflection Note'}</span>
            <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono px-2 py-0.5 rounded-full ml-auto">
              Somatic Check-In ~{insert.placementPercent || 50}%
            </span>
          </div>
          <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans space-y-2">
            <ReactMarkdown urlTransform={(u) => u}>{insert.content}</ReactMarkdown>
          </div>
        </div>
      );

    case 'tip':
      return (
        <div className="my-8 p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs text-left">
          <div className="flex items-center gap-2 mb-2.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider font-sans">
            <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600/20 shrink-0" />
            <span>{insert.title || 'Relationship Tip'}</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono px-2 py-0.5 rounded-full ml-auto">
              Actionable ~{insert.placementPercent || 75}%
            </span>
          </div>
          <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-2">
            <ReactMarkdown urlTransform={(u) => u}>{insert.content}</ReactMarkdown>
          </div>
        </div>
      );

    case 'summary':
      return (
        <div className="my-8 p-6 sm:p-7 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-950 border border-zinc-800 shadow-lg text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3.5 text-rose-400 font-bold text-xs uppercase tracking-widest font-sans border-b border-zinc-800 pb-2.5">
            <CheckCircle2 className="w-4.5 h-4.5 text-rose-400 shrink-0" />
            <span>{insert.title || 'Post Summary & Key Takeaways'}</span>
            <span className="text-[10px] bg-zinc-800 text-rose-300 font-mono px-2 py-0.5 rounded-full ml-auto">
              Executive Brief ~{insert.placementPercent || 92}%
            </span>
          </div>
          <div className="text-sm text-zinc-200 leading-relaxed space-y-2 font-sans">
            <ReactMarkdown urlTransform={(u) => u}>{insert.content}</ReactMarkdown>
          </div>
        </div>
      );

    case 'related':
      return (
        <div className="my-8 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xs text-left space-y-4">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-xs uppercase tracking-wider font-sans border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <BookOpen className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{insert.title || 'Related Reading'}</span>
            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono px-2 py-0.5 rounded-full ml-auto">
              Curated Flow
            </span>
          </div>
          {insert.content && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <ReactMarkdown urlTransform={(u) => u}>{insert.content}</ReactMarkdown>
            </div>
          )}
          {insert.links && insert.links.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {insert.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url || '#'}
                  className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500/60 transition-all block group shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 transition-colors line-clamp-2">
                      {link.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                  {link.readTime && (
                    <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                      {link.readTime}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default function ArticleBodyWithInserts({
  content,
  inserts,
  markdownComponents,
  promoArticles,
  onOpenPromoArticle,
  showFreluxPromo,
  className = "markdown-body prose dark:prose-invert max-w-none text-zinc-850 dark:text-zinc-200 leading-relaxed space-y-5"
}: ArticleBodyWithInsertsProps) {
  // Split content into paragraph blocks
  const { blocks, insertPositions } = useMemo(() => {
    if (!content) return { blocks: [], insertPositions: new Map<number, InArticleInsertItem[]>() };

    const rawBlocks = content.split(/\n\s*\n/).filter(b => b.trim().length > 0);
    const totalBlocks = rawBlocks.length;
    const posMap = new Map<number, InArticleInsertItem[]>();

    if (!inserts || totalBlocks === 0) {
      return { blocks: rawBlocks, insertPositions: posMap };
    }

    const insertList: InArticleInsertItem[] = [];
    if (inserts.insight?.enabled && inserts.insight.content) insertList.push({ ...inserts.insight, id: 'insight' });
    if (inserts.reflection?.enabled && inserts.reflection.content) insertList.push({ ...inserts.reflection, id: 'reflection' });
    if (inserts.tip?.enabled && inserts.tip.content) insertList.push({ ...inserts.tip, id: 'tip' });
    if (inserts.summary?.enabled && inserts.summary.content) insertList.push({ ...inserts.summary, id: 'summary' });
    if (inserts.related?.enabled && (inserts.related.content || (inserts.related.links && inserts.related.links.length > 0))) {
      insertList.push({ ...inserts.related, id: 'related' });
    }

    insertList.forEach(item => {
      let targetIndex = 0;
      if (item.overrideParagraphIndex !== undefined && item.overrideParagraphIndex >= 0) {
        targetIndex = Math.min(totalBlocks - 1, item.overrideParagraphIndex);
      } else {
        const percent = item.placementPercent ?? 50;
        targetIndex = Math.max(0, Math.min(totalBlocks - 1, Math.floor(totalBlocks * (percent / 100))));
      }

      if (!posMap.has(targetIndex)) {
        posMap.set(targetIndex, []);
      }
      posMap.get(targetIndex)!.push(item);
    });

    return { blocks: rawBlocks, insertPositions: posMap };
  }, [content, inserts]);

  // AUTOMATIC IN-ARTICLE AD DENSITY (admin toggle: in_article_ads_auto_enabled).
  // Word-count-driven density, deliberately conservative because in-article
  // units are TALL (an Adsterra native banner is ~600px at article width -
  // a wall of 4-5 of them reads as spam and buries the writing):
  //   < 1200 words -> 2 units | 1200-3000 -> 3 units | > 3000 -> 4 units
  // Units are spaced evenly through the MIDDLE 60% of the article (between
  // 20% and 80% of blocks). The old clamp (blocks.length - 2) let short
  // articles stack units in the last two paragraphs right next to the
  // article_bottom slot - the reported "too many ad slots at the bottom".
  // NOTE: this hook MUST run unconditionally, before the empty-content early
  // return below. It previously sat after that return, so an article that
  // renders with zero content blocks skipped this useMemo entirely while a
  // later render (once blocks were non-empty) called it - a hook-count
  // mismatch between renders, i.e. React error #310 ("Rendered more hooks
  // than during the previous render"), crashing the whole article page.
  const adInsertIndices = useMemo(() => {
    if (!blocks || blocks.length <= 1) return [] as number[];
    const autoEnabled = (heartsync.site_settings as Record<string, unknown>).in_article_ads_auto_enabled !== false;
    const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
    const count = !autoEnabled ? 1 : words > 3000 ? 4 : words >= 1200 ? 3 : 2;
    const firstAllowed = Math.max(1, Math.floor(blocks.length * 0.2));
    const lastAllowed = Math.max(firstAllowed, Math.floor(blocks.length * 0.8));
    const out: number[] = [];
    for (let i = 1; i <= count; i++) {
      // Even spacing inside the allowed middle zone.
      const idx = Math.floor(firstAllowed + ((lastAllowed - firstAllowed) * i) / (count + 1));
      // Never stack two units back-to-back (possible on very short articles
      // where the middle zone is only a few blocks wide).
      if (!out.includes(idx) && (out.length === 0 || idx - out[out.length - 1] >= 2)) out.push(idx);
    }
    return out;
  }, [blocks, content]);

  // HOUSE PROMO POSITIONS: the two internal article-promo slots sit in the
  // front and back stretches of the article (~12% and ~88% of blocks), i.e.
  // OUTSIDE the 20-80% middle zone the ad units occupy, so a promo never
  // stacks against a network ad. Each index is nudged forward until it
  // avoids the block's ad index (and, on very short articles, stays in
  // range).
  const promoIndices = useMemo(() => {
    const out: number[] = [];
    const picks = (promoArticles || []).slice(0, 2);
    if (!picks.length || !onOpenPromoArticle || blocks.length <= 2) return out;
    const taken = new Set(adInsertIndices);
    insertPositions.forEach((_, blockIdx) => taken.add(blockIdx));
    [0.12, 0.88].forEach((frac, slot) => {
      let idx = Math.max(1, Math.min(blocks.length - 2, Math.floor(blocks.length * frac)));
      let guard = 0;
      while (taken.has(idx) && guard < 3 && idx < blocks.length - 1) { idx += 1; guard += 1; }
      if (!taken.has(idx)) {
        taken.add(idx);
        out[slot] = idx;
      }
    });
    return out.filter((i) => i !== undefined);
  }, [blocks, adInsertIndices, insertPositions, promoArticles, onOpenPromoArticle]);

  if (!blocks || blocks.length === 0) {
    return (
      <div className={className}>
        <ReactMarkdown urlTransform={(url) => url} components={markdownComponents}>
          {preprocessMarkdownImages(content || '')}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={className}>
      {blocks.map((block, idx) => {
        const matchingInserts = insertPositions.get(idx);
        return (
          <React.Fragment key={idx}>
            <ReactMarkdown urlTransform={(url) => url} components={markdownComponents}>
              {preprocessMarkdownImages(block)}
            </ReactMarkdown>

            {matchingInserts && matchingInserts.map((insItem) => (
              <RenderInsertCard key={insItem.id} insert={insItem} />
            ))}

            {/* Seamless In-Article Ad Placement (Google AdSense, Monetag, or Adsterra) */}
            {adInsertIndices.includes(idx) && (
              <AdPlacement slot="in_article" className="my-6" />
            )}

            {/* House ad: promote another Heartsyncx article (2 slots) */}
            {promoIndices.indexOf(idx) !== -1 && promoArticles && onOpenPromoArticle && (
              <ArticlePromoCard
                article={promoArticles[promoIndices.indexOf(idx)]}
                onOpen={onOpenPromoArticle}
                variant={promoIndices.indexOf(idx) === 0 ? 'first' : 'second'}
              />
            )}

            {/* Cross-site promo AFTER the last content block: the single
                FRELUX slot. Skipped when the last block already carries an
                ad or insert to avoid a stacked wall at the article end. */}
            {showFreluxPromo && idx === blocks.length - 1 && !adInsertIndices.includes(idx) && !insertPositions.has(idx) && (
              <FreluxCrossPromo />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
