import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, Heart, CheckCircle2, BookOpen, ArrowRight, Lightbulb, Compass, Share2 } from 'lucide-react';
import { InArticleInsertsConfig, InArticleInsertItem } from '../types';
import { preprocessMarkdownImages } from '../utils/markdownImage';
import { AdPlacement } from './AdPlacement';

interface ArticleBodyWithInsertsProps {
  content: string;
  inserts?: InArticleInsertsConfig;
  markdownComponents?: any;
  className?: string;
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

  if (!blocks || blocks.length === 0) {
    return (
      <div className={className}>
        <ReactMarkdown urlTransform={(url) => url} components={markdownComponents}>
          {preprocessMarkdownImages(content || '')}
        </ReactMarkdown>
      </div>
    );
  }

  const adInsertIndex = useMemo(() => {
    if (blocks.length <= 1) return 0;
    if (blocks.length <= 3) return 1;
    return Math.floor(blocks.length / 2);
  }, [blocks.length]);

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
            {idx === adInsertIndex && (
              <AdPlacement slot="in_article" className="my-6" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
