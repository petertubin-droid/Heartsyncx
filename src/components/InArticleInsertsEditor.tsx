import React, { useState, useMemo } from 'react';
import { Brain, Heart, CheckCircle2, BookOpen, RefreshCw, Eye, EyeOff, Plus, Trash2, Sliders, Layers, HelpCircle, Check, ArrowRight, Wand2 } from 'lucide-react';
import { InArticleInsertsConfig, InArticleInsertItem, InArticleInsertType } from '../types';
import { RenderInsertCard } from './ArticleBodyWithInserts';

interface InArticleInsertsEditorProps {
  inserts: InArticleInsertsConfig;
  onChange: (updatedInserts: InArticleInsertsConfig) => void;
  articleTitle: string;
  articleContent: string;
  articleExcerpt?: string;
  tags?: string[];
}

const INSERT_DEFINITIONS: {
  id: InArticleInsertType;
  title: string;
  defaultPercent: number;
  recommendedRange: string;
  description: string;
  icon: any;
  accentColor: string;
}[] = [
  {
    id: 'insight',
    title: 'In-Article Insight',
    defaultPercent: 12,
    recommendedRange: '10–15%',
    description: 'Contextual cognitive or relational insight placed early to deepen engagement.',
    icon: Brain,
    accentColor: 'border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'reflection',
    title: 'Reflection Note',
    defaultPercent: 50,
    recommendedRange: '45–55%',
    description: 'Somatic check-in or journaling prompt centered midway through reading.',
    icon: Brain,
    accentColor: 'border-rose-500/50 bg-rose-50/30 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400',
  },
  {
    id: 'tip',
    title: 'Relationship Tip',
    defaultPercent: 75,
    recommendedRange: '70–80%',
    description: 'Actionable micro-step or communication advice near the latter portion of the guide.',
    icon: Heart,
    accentColor: 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'summary',
    title: 'Post Summary',
    defaultPercent: 92,
    recommendedRange: '90–95%',
    description: 'Executive bullet summary capturing key takeaways right before final conclusion.',
    icon: CheckCircle2,
    accentColor: 'border-zinc-800 bg-zinc-900 text-rose-400 dark:bg-zinc-950',
  },
  {
    id: 'related',
    title: 'Related Reading',
    defaultPercent: 94,
    recommendedRange: 'After Summary',
    description: 'Hand-curated companion guides placed directly after summary & before final CTA.',
    icon: BookOpen,
    accentColor: 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
  },
];

export default function InArticleInsertsEditor({
  inserts,
  onChange,
  articleTitle,
  articleContent,
  articleExcerpt = '',
  tags = []
}: InArticleInsertsEditorProps) {
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState('');
  const [previewMap, setPreviewMap] = useState<Record<string, boolean>>({
    insight: true,
    reflection: true,
    tip: true,
    summary: true,
    related: true,
  });

  // Calculate paragraph & word statistics
  const { totalWords, totalParagraphs } = useMemo(() => {
    if (!articleContent) return { totalWords: 0, totalParagraphs: 1 };
    const words = articleContent.trim().split(/\s+/).filter(Boolean).length;
    const paragraphs = articleContent.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    return { totalWords: words, totalParagraphs: Math.max(1, paragraphs) };
  }, [articleContent]);

  // Compute calculated paragraph placement for an insert item
  const getComputedParagraph = (percent: number, overrideIndex?: number) => {
    if (overrideIndex !== undefined && overrideIndex >= 0) {
      return Math.min(totalParagraphs - 1, overrideIndex);
    }
    return Math.max(0, Math.min(totalParagraphs - 1, Math.floor(totalParagraphs * (percent / 100))));
  };

  const handleToggleEnable = (id: InArticleInsertType) => {
    const current = inserts[id] || {
      id,
      title: INSERT_DEFINITIONS.find(d => d.id === id)?.title || '',
      enabled: true,
      content: '',
      placementPercent: INSERT_DEFINITIONS.find(d => d.id === id)?.defaultPercent || 50,
    };
    onChange({
      ...inserts,
      [id]: {
        ...current,
        enabled: !current.enabled,
      },
    });
  };

  const handleUpdateItem = (id: InArticleInsertType, patch: Partial<InArticleInsertItem>) => {
    const current = inserts[id] || {
      id,
      title: INSERT_DEFINITIONS.find(d => d.id === id)?.title || '',
      enabled: true,
      content: '',
      placementPercent: INSERT_DEFINITIONS.find(d => d.id === id)?.defaultPercent || 50,
    };
    onChange({
      ...inserts,
      [id]: {
        ...current,
        ...patch,
      },
    });
  };

  const togglePreview = (id: string) => {
    setPreviewMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerateAi = async (targetType: 'all' | InArticleInsertType) => {
    setGeneratingType(targetType);
    try {
      const response = await fetch('/api/gemini/generate-inserts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: articleTitle || 'Untitled Article',
          content: articleContent || 'Content placeholder',
          excerpt: articleExcerpt,
          keywords: tags,
          insertType: targetType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setGenerationError(data.error || 'AI insert generation failed. Check the Gemini key in Integrations.');
        return;
      }
      setGenerationError('');
      if (data && data.inserts) {
        const nextInserts = { ...inserts };

        if (targetType === 'all') {
          INSERT_DEFINITIONS.forEach(def => {
            const generated = data.inserts[def.id];
            const existing = nextInserts[def.id] || {
              id: def.id,
              title: def.title,
              enabled: true,
              content: '',
              placementPercent: def.defaultPercent,
            };

            if (generated) {
              nextInserts[def.id] = {
                ...existing,
                enabled: true,
                content: generated.content || existing.content,
                links: generated.links || existing.links,
              };
            }
          });
        } else {
          const generated = data.inserts[targetType];
          const existing = nextInserts[targetType] || {
            id: targetType,
            title: INSERT_DEFINITIONS.find(d => d.id === targetType)?.title || targetType,
            enabled: true,
            content: '',
            placementPercent: INSERT_DEFINITIONS.find(d => d.id === targetType)?.defaultPercent || 50,
          };

          if (generated) {
            nextInserts[targetType] = {
              ...existing,
              enabled: true,
              content: generated.content || existing.content,
              links: generated.links || existing.links,
            };
          }
        }

        onChange(nextInserts);
      }
    } catch (err) {
      console.error('Failed to generate AI inserts:', err);
      setGenerationError('Could not reach the AI insert generator. Verify the server is running.');
    } finally {
      setGeneratingType(null);
    }
  };

  // Helper to add/remove links for Related Reading
  const handleAddRelatedLink = () => {
    const related = inserts.related || {
      id: 'related',
      title: 'Related Reading',
      enabled: true,
      content: 'Explore these companion guides:',
      placementPercent: 94,
      links: [],
    };
    const currentLinks = related.links || [];
    handleUpdateItem('related', {
      links: [
        ...currentLinks,
        { title: 'New Related Article Title', url: '/articles/sample-guide', readTime: '5 min read' },
      ],
    });
  };

  const handleUpdateRelatedLink = (index: number, field: string, value: string) => {
    const related = inserts.related;
    if (!related || !related.links) return;
    const updatedLinks = [...related.links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    handleUpdateItem('related', { links: updatedLinks });
  };

  const handleDeleteRelatedLink = (index: number) => {
    const related = inserts.related;
    if (!related || !related.links) return;
    const updatedLinks = related.links.filter((_, i) => i !== index);
    handleUpdateItem('related', { links: updatedLinks });
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 shadow-xs text-left space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Wand2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              AI In-Article Inserts
            </h3>
            <span className="text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-full">
              Dynamic Auto-Scaling
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Automatically inserts 5 AI-powered contextual blocks based on article word count scaling (10-15%, 45-55%, 70-80%, 90-95%, & Related Reading).
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleGenerateAi('all')}
          disabled={generatingType !== null}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {generatingType === 'all' ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating 5 Inserts...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              <span>Generate All 5 AI Inserts</span>
            </>
          )}
        </button>
      </div>

      {generationError && (
        <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{generationError}</p>
      )}

      {/* Word Count Scaling Indicator */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-850 rounded-2xl border border-zinc-200/70 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300 font-sans">
          <Layers className="w-4 h-4 text-rose-500 shrink-0" />
          <div>
            <span className="font-bold">Article Scale: </span>
            <span className="font-mono text-zinc-900 dark:text-white font-bold">{totalWords.toLocaleString()} Words</span>
            <span className="text-zinc-400 dark:text-zinc-500 ml-1">({totalParagraphs} Paragraphs)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-zinc-500">
          <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">Insight ~12%</span>
          <span>→</span>
          <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md">Reflection ~50%</span>
          <span>→</span>
          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">Tip ~75%</span>
          <span>→</span>
          <span className="bg-zinc-800 text-rose-300 px-2 py-0.5 rounded-md">Summary ~92%</span>
          <span>→</span>
          <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">Related ~94%</span>
        </div>
      </div>

      {/* Insert Editors List */}
      <div className="space-y-6">
        {INSERT_DEFINITIONS.map(def => {
          const item = inserts[def.id] || {
            id: def.id,
            title: def.title,
            enabled: true,
            content: '',
            placementPercent: def.defaultPercent,
          };

          const isEnabled = item.enabled !== false;
          const isGeneratingThis = generatingType === def.id;
          const isPreviewing = previewMap[def.id] ?? true;
          const computedPara = getComputedParagraph(item.placementPercent ?? def.defaultPercent, item.overrideParagraphIndex);

          const IconComponent = def.icon;

          return (
            <div
              key={def.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isEnabled
                  ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs'
                  : 'bg-zinc-50/60 dark:bg-zinc-950/40 border-zinc-200/50 dark:border-zinc-850 opacity-60'
              }`}
            >
              {/* Card Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-150 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${def.accentColor}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                        {def.title}
                      </h4>
                      <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md">
                        Target {def.recommendedRange}
                      </span>
                      <span className="text-[10px] font-mono bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-bold">
                        Inserts after Para #{computedPara + 1}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {def.description}
                    </p>
                  </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGenerateAi(def.id)}
                    disabled={isGeneratingThis || generatingType !== null}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-[11px] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-rose-500 ${isGeneratingThis ? 'animate-spin' : ''}`} />
                    <span>{item.content ? 'Regenerate AI' : 'AI Generate'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePreview(def.id)}
                    className={`px-3 py-1.5 font-bold text-[11px] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                      isPreviewing
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {isPreviewing ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isPreviewing ? 'Hide Preview' : 'Live Preview'}</span>
                  </button>

                  {/* Enable / Disable Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleEnable(def.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-zinc-600 peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              </div>

              {/* Editor controls if enabled */}
              {isEnabled && (
                <div className="space-y-4 pt-1">
                  {/* Placement Controls Row */}
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-850/50 rounded-xl border border-zinc-200/60 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                    <div className="sm:col-span-7 flex items-center gap-3">
                      <Sliders className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 text-[11px] shrink-0">
                        Target Position ({item.placementPercent ?? def.defaultPercent}%):
                      </span>
                      <input
                        type="range"
                        min="5"
                        max="98"
                        value={item.placementPercent ?? def.defaultPercent}
                        onChange={(e) => handleUpdateItem(def.id, { placementPercent: Number(e.target.value) })}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>

                    <div className="sm:col-span-5 flex items-center gap-2 sm:justify-end">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
                        Override Paragraph Index:
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={totalParagraphs - 1}
                        placeholder={`Auto (${computedPara + 1})`}
                        value={item.overrideParagraphIndex !== undefined ? item.overrideParagraphIndex + 1 : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            handleUpdateItem(def.id, { overrideParagraphIndex: undefined });
                          } else {
                            handleUpdateItem(def.id, { overrideParagraphIndex: Math.max(0, Number(val) - 1) });
                          }
                        }}
                        className="w-20 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-center focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Main Text Content Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="font-bold text-zinc-600 dark:text-zinc-400">
                        {def.title} Content (Markdown & Text formatting supported)
                      </label>
                      <span className="text-zinc-400 font-mono text-[10px]">
                        {item.content ? item.content.length : 0} chars
                      </span>
                    </div>

                    <textarea
                      value={item.content || ''}
                      onChange={(e) => handleUpdateItem(def.id, { content: e.target.value })}
                      placeholder={`Enter custom ${def.title.toLowerCase()} content or click "AI Generate" above to generate contextually...`}
                      rows={3}
                      className="w-full p-3.5 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-rose-500 transition-all font-sans"
                    />
                  </div>

                  {/* Special Link Manager for Related Reading */}
                  {def.id === 'related' && (
                    <div className="p-4 bg-zinc-50/80 dark:bg-zinc-850/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                          Curated Related Reading Links
                        </span>
                        <button
                          type="button"
                          onClick={handleAddRelatedLink}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Link</span>
                        </button>
                      </div>

                      {item.links && item.links.length > 0 ? (
                        <div className="space-y-2">
                          {item.links.map((link, lIdx) => (
                            <div key={lIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 text-xs">
                              <input
                                type="text"
                                value={link.title}
                                onChange={(e) => handleUpdateRelatedLink(lIdx, 'title', e.target.value)}
                                placeholder="Article Title"
                                className="sm:col-span-5 p-1.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-semibold"
                              />
                              <input
                                type="text"
                                value={link.url}
                                onChange={(e) => handleUpdateRelatedLink(lIdx, 'url', e.target.value)}
                                placeholder="/articles/slug or https://..."
                                className="sm:col-span-4 p-1.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono"
                              />
                              <input
                                type="text"
                                value={link.readTime || '5 min read'}
                                onChange={(e) => handleUpdateRelatedLink(lIdx, 'readTime', e.target.value)}
                                placeholder="5 min read"
                                className="sm:col-span-2 p-1.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteRelatedLink(lIdx)}
                                className="sm:col-span-1 p-1.5 text-zinc-400 hover:text-rose-500 rounded text-center flex items-center justify-center cursor-pointer"
                                title="Delete link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-400 italic">No companion links added yet. Click "Add Link" or use AI Generate.</p>
                      )}
                    </div>
                  )}

                  {/* Live Card Preview */}
                  {isPreviewing && (
                    <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                        Live Reader Preview State
                      </span>
                      <RenderInsertCard insert={item} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
