import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Post, Category } from '../types';
import { heartsync, getAuthors } from '../store';
import { 
  FileText, Eye, Brain, Send, Library, AlertCircle, CheckCircle2,
  Heading1, Heading2, Bold, Type, Italic, List, ListOrdered, Quote, Table, Image as ImageIcon, Video, Link, Trash,
  ChevronRight, Calendar, Bookmark, Heart, RefreshCw, Upload, Search, Settings, Sliders, Globe,
  Plus, X, EyeOff, Layout, Clipboard, Trash2, HelpCircle, ShieldCheck, Folder,
  ArrowLeft, Lock, DollarSign, Check, ChevronDown, Wand2, BookOpen, Volume2, Maximize2, Clock
} from 'lucide-react';
import WidgetizedMarkdown from './WidgetizedMarkdown';
import InArticleInsertsEditor from './InArticleInsertsEditor';
import { InArticleInsertsConfig } from '../types';

export interface ContentBlock {
  id?: string;
  type?: string;
  value?: string;
  content?: string;
  imageUrl?: string;
  caption?: string;
  alt?: string;
  aspectRatio?: string;
  borderRadius?: string;
  [key: string]: any;
}

export interface RichTextEditorProps {
  post?: Post;
  isEditMode?: boolean;
  categories?: Category[];
  onClose?: () => void;
  onSave?: (updatedPost?: Post) => void;
  onCancel?: () => void;
}

export default function RichTextEditor({ post, isEditMode = !!post, categories = heartsync.categories || [], onClose, onSave, onCancel }: RichTextEditorProps) {
  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  // --- CORE POST STATES ---
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [categoryId, setCategoryId] = useState(post?.category_id || (categories[0] && categories[0].id) || '');
  const [authorId, setAuthorId] = useState(post?.author_id || 'peter-tubin');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status as any || 'draft');
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image || '');
  const [tags, setTags] = useState<string[]>(Array.isArray(post?.tags) ? post.tags : []);
  const [newTag, setNewTag] = useState('');
  const [allowComments, setAllowComments] = useState(post?.allow_comments !== false);
  const [ttsEnabled, setTtsEnabled] = useState(post?.tts_enabled ?? false);

  // --- ACCESS & MONETIZATION STATES ---
  const [isPremium, setIsPremium] = useState(post?.is_premium ?? false);
  const [price, setPrice] = useState(post?.price || 0);
  const [premiumAccessType, setPremiumAccessType] = useState<'free' | 'coins' | 'ad_unlock' | 'subscription'>(post?.premium_access_type as any || 'free');
  const [unlockDuration, setUnlockDuration] = useState(post?.unlock_duration || 24);
  const [adProvider, setAdProvider] = useState<'adsense' | 'adcolony' | 'unity' | 'custom'>(post?.ad_provider as any || 'adsense');
  const [dailyUnlockLimit, setDailyUnlockLimit] = useState(post?.daily_unlock_limit || 3);
  const [showTeaser, setShowTeaser] = useState(post?.show_teaser !== false);
  const [previewParagraphs, setPreviewParagraphs] = useState(post?.preview_paragraphs || 2);
  const [blurContent, setBlurContent] = useState(post?.blur_content !== false);
  const [showSubscriptionCta, setShowSubscriptionCta] = useState(post?.show_subscription_cta !== false);

  // --- CUSTOM ARTICLE CLINICAL & EDITORIAL SECTIONS ---
  const [editorialSummary, setEditorialSummary] = useState(post?.editorial_summary || '');
  const [reflectionNote, setReflectionNote] = useState(post?.reflection_note || '');
  const [inArticleQuote, setInArticleQuote] = useState(post?.in_article_quote || '');
  const [inArticleQuoteAuthor, setInArticleQuoteAuthor] = useState(post?.in_article_quote_author || '');
  const [somaticExerciseTitle, setSomaticExerciseTitle] = useState(post?.somatic_exercise_title || '');
  const [somaticExerciseSteps, setSomaticExerciseSteps] = useState(post?.somatic_exercise_steps || '');
  const [reflectionPrompt, setReflectionPrompt] = useState(post?.reflection_prompt || '');

  // --- AI IN-ARTICLE INSERTS STATE ---
  const [inArticleInserts, setInArticleInserts] = useState<InArticleInsertsConfig>(() => {
    return {
      insight: {
        id: 'insight',
        title: 'In-Article Insight',
        enabled: post?.in_article_inserts?.insight?.enabled ?? true,
        content: post?.in_article_inserts?.insight?.content || '',
        placementPercent: post?.in_article_inserts?.insight?.placementPercent || 12,
        overrideParagraphIndex: post?.in_article_inserts?.insight?.overrideParagraphIndex,
      },
      reflection: {
        id: 'reflection',
        title: 'Reflection Note',
        enabled: post?.in_article_inserts?.reflection?.enabled ?? true,
        content: post?.in_article_inserts?.reflection?.content || '',
        placementPercent: post?.in_article_inserts?.reflection?.placementPercent || 50,
        overrideParagraphIndex: post?.in_article_inserts?.reflection?.overrideParagraphIndex,
      },
      tip: {
        id: 'tip',
        title: 'Relationship Tip',
        enabled: post?.in_article_inserts?.tip?.enabled ?? true,
        content: post?.in_article_inserts?.tip?.content || '',
        placementPercent: post?.in_article_inserts?.tip?.placementPercent || 75,
        overrideParagraphIndex: post?.in_article_inserts?.tip?.overrideParagraphIndex,
      },
      summary: {
        id: 'summary',
        title: 'Post Summary',
        enabled: post?.in_article_inserts?.summary?.enabled ?? true,
        content: post?.in_article_inserts?.summary?.content || '',
        placementPercent: post?.in_article_inserts?.summary?.placementPercent || 92,
        overrideParagraphIndex: post?.in_article_inserts?.summary?.overrideParagraphIndex,
      },
      related: {
        id: 'related',
        title: 'Related Reading',
        enabled: post?.in_article_inserts?.related?.enabled ?? true,
        content: post?.in_article_inserts?.related?.content || 'Explore these hand-curated companion guides to deepen your understanding:',
        placementPercent: post?.in_article_inserts?.related?.placementPercent || 94,
        overrideParagraphIndex: post?.in_article_inserts?.related?.overrideParagraphIndex,
        links: post?.in_article_inserts?.related?.links || [
          { title: "Building Emotional Safety & Secure Attachment", url: "/post/secure-attachment", readTime: "6 min read" },
          { title: "The Somatic Intimacy & Co-Regulation Playbook", url: "/post/somatic-intimacy", readTime: "8 min read" }
        ]
      }
    };
  });

  // --- FAQ BUILDER STATE ---
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(Array.isArray(post?.faq) ? post.faq : []);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // --- SEO CONTROL PANEL STATES ---
  const [seoTitle, setSeoTitle] = useState(post?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(post?.seo_description || '');
  const [focusKeyword, setFocusKeyword] = useState('');

  // --- AI COMPANION DRAWER STATES ---
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'expand' | 'tone' | 'summarize' | 'seo'>('expand');

  // --- TOOLBAR INSERT POPUPS ---
  const [insertType, setInsertType] = useState<string | null>(null); // 'image' | 'gallery' | 'quote' | 'related' | 'author' | 'custom-section' | 'callout'
  const [insertData, setInsertData] = useState<any>({});
  
  // --- MEDIA BANK SELECTOR MODAL ---
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState<'featured' | 'imageBlock' | 'galleryBlock'>('featured');
  const [mediaUploading, setMediaUploading] = useState(false);
  
  // --- COMPILATION & UI HELPERS ---
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark' | 'sepia'>('light');

  // Generate URL slug from title automatically
  useEffect(() => {
    if (!isEditMode && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [title, isEditMode]);

  // Sync state stats
  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const charCount = useMemo(() => content ? content.length : 0, [content]);
  const estimatedReadTime = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);

  // Insert format helper at cursor
  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const beforePart = text.substring(0, start);
    const selectedPart = text.substring(start, end);
    const afterPart = text.substring(end);

    const replacement = prefix + (selectedPart || '') + suffix;
    const newContent = beforePart + replacement + afterPart;
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(beforePart.length + prefix.length, beforePart.length + prefix.length + selectedPart.length);
    }, 50);
  };

  // Confirm insert visual block
  const handleInsertBlock = () => {
    if (!insertType) return;
    let blockText = '';

    if (insertType === 'image') {
      const url = insertData.url || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2';
      const alt = insertData.alt || 'Therapeutic practice artwork';
      const caption = insertData.caption || '';
      blockText = `![${alt}](${url} "${caption}")\n`;
    } 
    else if (insertType === 'gallery') {
      const urls = insertData.urls || '';
      blockText = `<image-gallery urls="${urls}" />\n`;
    } 
    else if (insertType === 'quote') {
      const text = insertData.text || '';
      const author = insertData.author || '';
      blockText = `> ${text}\n> -- ${author}\n`;
    } 
    else if (insertType === 'related') {
      const articleSlug = insertData.slug || '';
      const articleTitle = insertData.title || '';
      blockText = `<related-article slug="${articleSlug}" title="${articleTitle}" />\n`;
    } 
    else if (insertType === 'author') {
      const name = insertData.name || '';
      const text = insertData.text || '';
      blockText = `<author-insight author="${name}" insight="${text}" />\n`;
    } 
    else if (insertType === 'custom-section') {
      const heading = insertData.title || '';
      const body = insertData.text || '';
      blockText = `<custom-section title="${heading}" text="${body}" />\n`;
    } 
    else if (insertType === 'callout') {
      const style = insertData.style || 'NOTE'; // NOTE, TIP, WARNING, TAKEAWAY
      const text = insertData.text || '';
      blockText = `[!${style}] ${text}\n`;
    }

    insertFormat(blockText);
    setInsertType(null);
    setInsertData({});
  };

  // Add FAQ item
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setFaqs([...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]);
    setNewFaqQ('');
    setNewFaqA('');
  };

  // Insert FAQ component tag to body
  const handleInsertFaqTag = () => {
    insertFormat('<faq-section />\n');
  };

  // Auto-Save action
  const handleFormSubmit = async (forcedStatus?: 'draft' | 'published') => {
    if (!title.trim() || !content.trim()) {
      alert('Articles require both a Title and Markdown Body Content.');
      return;
    }

    setSaveStatus('saving');

    const finalStatus = forcedStatus || status;

    const postData: Partial<Post> = {
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category_id: categoryId,
      author_id: authorId,
      excerpt: excerpt || (content.substring(0, 150) + '...'),
      content: content,
      status: finalStatus,
      featured_image: featuredImage || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=800',
      tags,
      seo_title: seoTitle || title,
      seo_description: seoDescription || excerpt,
      allow_comments: allowComments,
      tts_enabled: ttsEnabled,
      is_premium: isPremium,
      price: price,
      premium_access_type: premiumAccessType as any,
      unlock_duration: Number(unlockDuration) || 24,
      ad_provider: adProvider,
      daily_unlock_limit: dailyUnlockLimit,
      show_teaser: showTeaser,
      preview_paragraphs: previewParagraphs,
      blur_content: blurContent,
      show_subscription_cta: showSubscriptionCta,
      editorial_summary: editorialSummary,
      reflection_note: reflectionNote,
      in_article_quote: inArticleQuote,
      in_article_quote_author: inArticleQuoteAuthor,
      somatic_exercise_title: somaticExerciseTitle,
      somatic_exercise_steps: somaticExerciseSteps,
      reflection_prompt: reflectionPrompt,
      faq: faqs,
      in_article_inserts: inArticleInserts
    };

    try {
      if (isEditMode && post) {
        await heartsync.updatePost(post.id, postData);
      } else {
        await heartsync.addPost(postData);
      }
      if (onSave) {
        onSave(postData as Post);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // AI Assistant trigger using server-side Gemini API proxy
  const handleTriggerAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse('');

    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          mode: aiMode,
          context: content.substring(0, 2000)
        })
      });
      const data = await response.json();
      if (data.success && data.text) {
        setAiResponse(data.text);
      } else {
        setAiResponse(data.error || 'The AI clinical architect was unable to synthesize a response. Check your API key.');
      }
    } catch (err) {
      setAiResponse('Connection failed. Verify server-side proxy endpoint.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-100 dark:bg-zinc-950 flex flex-col overflow-hidden font-sans text-sm select-none antialiased">
      
      {/* 1. CMS STUDIO HEADER WORKSPACE */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between shadow-xs shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Premium CMS Suite</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-955 text-[9px] font-bold text-rose-600 dark:text-rose-400">Hybrid Article Architect</span>
            </div>
            <h1 className="text-base font-black text-zinc-900 dark:text-white tracking-tight">
              {isEditMode ? `Redesigning: ${post?.title}` : 'Draft Relational Masterpiece'}
            </h1>
          </div>
        </div>

        {/* Action Controls & Autosave states */}
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-550 font-bold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" /> Auto-saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Changes Persisted
            </span>
          )}
          
          <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-850">
            <button 
              onClick={() => setStatus('draft')}
              className={`px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${status === 'draft' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100' : 'bg-white dark:bg-zinc-900 text-zinc-400'}`}
            >
              Draft
            </button>
            <button 
              onClick={() => setStatus('published')}
              className={`px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${status === 'published' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-400'}`}
            >
              Published
            </button>
          </div>

          <button 
            onClick={() => handleFormSubmit()} 
            className="px-4 py-2 bg-rose-550 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all shadow-md hover:scale-[1.01] cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </header>

      {/* 2. DUAL-PANE FULL-SCREEN CMS WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: THE CONTINUOUS EDITING CANVAS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-50 dark:bg-zinc-950 select-text">
          
          {/* A. TITLE & ESSENTIAL METADATA */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs space-y-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4.5 h-4.5 text-rose-500" />
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">Primary Article Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Article Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Relational Calibration and Safe Bonding Index..." 
                  className="w-full bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-black focus:outline-none focus:border-rose-500 text-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">URL Slug</label>
                <input 
                  type="text" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="relational-calibration-safe-bonding" 
                  className="w-full bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-zinc-700 dark:text-zinc-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Category</label>
                <select 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-zinc-700 dark:text-zinc-300"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Author Profile</label>
                <select 
                  value={authorId} 
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-zinc-700 dark:text-zinc-300"
                >
                  {getAuthors().map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Cover/Featured Art URL</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMediaModalTarget('featured');
                        setShowMediaModal(true);
                      }}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Folder className="w-3 h-3" /> Pick from Media Bank
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={featuredImage} 
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..." 
                    className="flex-1 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-500 text-zinc-700 dark:text-zinc-300"
                  />
                  <label className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-750 transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 text-rose-500" />
                    <span>Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setMediaUploading(true);
                            const url = await heartsync.uploadMedia(file);
                            setFeaturedImage(url);
                          } catch (err) {
                            alert('Upload failed');
                          } finally {
                            setMediaUploading(false);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Tags section */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Subject Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold flex items-center gap-1">
                    #{t}
                    <button onClick={() => setTags(tags.filter(tag => tag !== t))} className="hover:text-rose-550"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input 
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add relational tag..." 
                  className="flex-1 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-rose-500 text-zinc-700 dark:text-zinc-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newTag.trim() && !tags.includes(newTag.trim())) {
                        setTags([...tags, newTag.trim()]);
                        setNewTag('');
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (newTag.trim() && !tags.includes(newTag.trim())) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }} 
                  className="px-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955 hover:text-rose-550 transition-colors text-xs"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* B. VISUAL MARKDOWN BODY EDITOR */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl shadow-xs overflow-hidden text-left relative">
            
            {/* Formatting Actions & Components Inserter */}
            <div className="flex flex-wrap items-center gap-1 p-3 bg-zinc-50/50 dark:bg-zinc-850/20 border-b border-zinc-200 dark:border-zinc-800 select-none">
              <button onClick={() => insertFormat('# ', '\n')} className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
              <button onClick={() => insertFormat('## ', '\n')} className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
              <button onClick={() => insertFormat('**', '**')} className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer font-bold" title="Bold"><Bold className="w-4 h-4" /></button>
              <button onClick={() => insertFormat('*', '*')} className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer" title="Italic"><Italic className="w-4 h-4" /></button>
              <button onClick={() => insertFormat('> ')} className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer" title="Block Quote"><Quote className="w-4 h-4" /></button>
              <button onClick={() => insertFormat('- ')} className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer" title="Bullet List"><List className="w-4 h-4" /></button>
              <button onClick={() => insertFormat('1. ')} className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-800 transition-all cursor-pointer" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>

              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

              {/* Intuitive "Insert Element" drop control */}
              <div className="relative group">
                <button className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-955/45 text-rose-550 dark:text-rose-450 text-xs font-black rounded-lg border border-rose-200/50 dark:border-rose-900/40 transition-all flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Insert Component <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-full left-0 mt-1 z-40 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 hidden group-hover:block space-y-0.5">
                  <button onClick={() => setInsertType('image')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">📷 Single Image & Caption</button>
                  <button onClick={() => setInsertType('gallery')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">🖼️ Multi-Image Grid Gallery</button>
                  <button onClick={() => setInsertType('quote')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">💬 Supporting Block Quote</button>
                  <button onClick={() => setInsertType('callout')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">💡 Dynamic Clinical Callout</button>
                  <button onClick={() => insertFormat('<table-of-contents />\n')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">📖 Table of Contents (TOC)</button>
                  <button onClick={() => setInsertType('related')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">🧭 Related Article Link</button>
                  <button onClick={() => insertFormat('<newsletter-signup />\n')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">✉️ Newsletter Subscription Card</button>
                  <button onClick={() => setInsertType('author')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">✨ Expert Author Signature</button>
                  <button onClick={() => setInsertType('custom-section')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-zinc-700 dark:text-zinc-300 block font-bold">🎨 Styled Magazine Section</button>
                  <button onClick={() => insertFormat('<premium-divider />\n')} className="w-full text-left p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs text-rose-500 block font-bold">🔒 Premium Content Split</button>
                </div>
              </div>
            </div>

            {/* Insert Setup Forms / Modals inline inside the editor block for simplicity */}
            {insertType && (
              <div className="p-4 bg-rose-50/50 dark:bg-rose-955/10 border-b border-rose-100 dark:border-rose-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Configure Insertable Block: {insertType}</span>
                  <button onClick={() => setInsertType(null)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {insertType === 'image' && (
                    <>
                      <div className="sm:col-span-2 flex justify-between items-center bg-white/50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <span className="font-bold text-[11px] text-zinc-600 dark:text-zinc-300">Quick Media Selection:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaModalTarget('imageBlock');
                            setShowMediaModal(true);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Folder className="w-3.5 h-3.5" /> Select from Media Bank
                        </button>
                      </div>
                      <div>
                        <label className="block mb-1 font-bold">Image URL</label>
                        <input type="text" placeholder="https://..." value={insertData.url || ''} onChange={(e) => setInsertData({ ...insertData, url: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold">Alternative Alt Text</label>
                        <input type="text" placeholder="Description..." value={insertData.alt || ''} onChange={(e) => setInsertData({ ...insertData, alt: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block mb-1 font-bold">Caption Signature</label>
                        <input type="text" placeholder="Copyright or description..." value={insertData.caption || ''} onChange={(e) => setInsertData({ ...insertData, caption: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                    </>
                  )}

                  {insertType === 'gallery' && (
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex justify-between items-center bg-white/50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <span className="font-bold text-[11px] text-zinc-600 dark:text-zinc-300">Gallery Assets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaModalTarget('galleryBlock');
                            setShowMediaModal(true);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Folder className="w-3.5 h-3.5" /> + Add Media Bank Image
                        </button>
                      </div>
                      <label className="block mb-1 font-bold">Comma-Separated Image URLs</label>
                      <textarea placeholder="https://image1.jpg, https://image2.jpg, ..." value={insertData.urls || ''} onChange={(e) => setInsertData({ ...insertData, urls: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" rows={2} />
                    </div>
                  )}

                  {insertType === 'quote' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block mb-1 font-bold">Quote content</label>
                        <textarea placeholder="Enter quotes..." value={insertData.text || ''} onChange={(e) => setInsertData({ ...insertData, text: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" rows={2} />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold">Author Attribution</label>
                        <input type="text" placeholder="Dr. John Gottman" value={insertData.author || ''} onChange={(e) => setInsertData({ ...insertData, author: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                    </>
                  )}

                  {insertType === 'callout' && (
                    <>
                      <div>
                        <label className="block mb-1 font-bold">Style/Vibe</label>
                        <select value={insertData.style || 'NOTE'} onChange={(e) => setInsertData({ ...insertData, style: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700">
                          <option value="NOTE">💡 Relational Insight</option>
                          <option value="TIP">🌟 Expert Clinical Suggestion</option>
                          <option value="WARNING">⚠️ Important Caution</option>
                          <option value="TAKEAWAY">🎯 Core Lesson Takeaway</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 mt-2">
                        <label className="block mb-1 font-bold">Callout Message</label>
                        <textarea placeholder="Write guidance note..." value={insertData.text || ''} onChange={(e) => setInsertData({ ...insertData, text: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" rows={2} />
                      </div>
                    </>
                  )}

                  {insertType === 'related' && (
                    <>
                      <div>
                        <label className="block mb-1 font-bold">Target Slug</label>
                        <input type="text" placeholder="relational-calibration-and-somatic-bonding" value={insertData.slug || ''} onChange={(e) => setInsertData({ ...insertData, slug: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold">Article Visual Title</label>
                        <input type="text" placeholder="Relational Calibration Masterclass" value={insertData.title || ''} onChange={(e) => setInsertData({ ...insertData, title: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                    </>
                  )}

                  {insertType === 'author' && (
                    <>
                      <div>
                        <label className="block mb-1 font-bold">Author Name</label>
                        <input type="text" placeholder="Dr. Sue Johnson" value={insertData.name || ''} onChange={(e) => setInsertData({ ...insertData, name: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                      <div className="sm:col-span-2 mt-2">
                        <label className="block mb-1 font-bold">Clinical Insight Message</label>
                        <textarea placeholder="Insight text..." value={insertData.text || ''} onChange={(e) => setInsertData({ ...insertData, text: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" rows={2} />
                      </div>
                    </>
                  )}

                  {insertType === 'custom-section' && (
                    <>
                      <div>
                        <label className="block mb-1 font-bold">Section Heading</label>
                        <input type="text" placeholder="Mindful Validation" value={insertData.title || ''} onChange={(e) => setInsertData({ ...insertData, title: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" />
                      </div>
                      <div className="sm:col-span-2 mt-2">
                        <label className="block mb-1 font-bold">Content Text</label>
                        <textarea placeholder="Write section details..." value={insertData.text || ''} onChange={(e) => setInsertData({ ...insertData, text: e.target.value })} className="w-full p-2 bg-white dark:bg-zinc-800 rounded-lg border dark:border-zinc-700" rows={2} />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setInsertType(null)} className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-300">Cancel</button>
                  <button onClick={handleInsertBlock} className="px-4 py-1.5 bg-rose-550 hover:bg-rose-600 text-white rounded-lg text-xs font-black shadow-xs">Insert Block</button>
                </div>
              </div>
            )}

            {/* Natural Writing Area */}
            <textarea 
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin writing your attachment guidelines using rich Markdown syntax... Type any HTML visual widget to style."
              className="w-full min-h-[500px] bg-transparent text-zinc-800 dark:text-zinc-100 p-6 font-sans text-sm focus:outline-none border-none resize-y placeholder-zinc-350 leading-relaxed"
            />

            {/* Dynamic Footnotes & Character Limits stats bar */}
            <div className="flex justify-between items-center px-6 py-3 bg-zinc-50 dark:bg-zinc-850/30 border-t border-zinc-150 dark:border-zinc-800 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider select-none shrink-0">
              <div className="flex gap-4">
                <span>{wordCount} words</span>
                <span>{charCount} characters</span>
                <span>{estimatedReadTime} min read</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Auto-saves active</span>
              </div>
            </div>
          </section>

          {/* C. GENERAL EXCERPT SUMMARY */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-left">
            <label className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-2 block">
              Excerpt Briefing Summary
            </label>
            <textarea 
              value={excerpt} 
              onChange={(e) => setExcerpt(e.target.value)} 
              placeholder="Brief summary used in catalog, lists, and teaser feeds..." 
              rows={2} 
              className="w-full bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-rose-500 transition-all resize-none" 
            />
          </section>

          {/* D. CLINICAL MAG-STYLE EDITORIAL FEATURES */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-left space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Wand2 className="w-4.5 h-4.5 text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Clinical Somatic & Editorial Features</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Preface / Editorial Executive Summary</label>
                <textarea 
                  value={editorialSummary} 
                  onChange={(e) => setEditorialSummary(e.target.value)} 
                  placeholder="Appears in a beautifully framed box before the article content..." 
                  rows={2} 
                  className="w-full p-3 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">In-Article Supporting Quote</label>
                  <textarea 
                    value={inArticleQuote} 
                    onChange={(e) => setInArticleQuote(e.target.value)} 
                    placeholder="Elegantly rendered as a large magazine-style callout quote..." 
                    rows={2} 
                    className="w-full p-3 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Quote Author/Attribution</label>
                  <input 
                    type="text" 
                    value={inArticleQuoteAuthor} 
                    onChange={(e) => setInArticleQuoteAuthor(e.target.value)} 
                    placeholder="e.g., Dr. Sue Johnson, Clinical Founder" 
                    className="w-full p-3 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl mt-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Reflection Pause Note</label>
                <textarea 
                  value={reflectionNote} 
                  onChange={(e) => setReflectionNote(e.target.value)} 
                  placeholder="Interactive visual box for readers to pause and consider a relational concept..." 
                  rows={2} 
                  className="w-full p-3 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                />
              </div>

              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850/40 rounded-2xl border dark:border-zinc-800 space-y-3">
                <span className="font-bold block text-[#CE2B5E] text-[10px] uppercase tracking-widest">Active Clinical Somatic Practice Builder</span>
                <div>
                  <label className="block mb-1 font-medium text-zinc-500">Somatic Centering Practice Title</label>
                  <input 
                    type="text" 
                    value={somaticExerciseTitle} 
                    onChange={(e) => setSomaticExerciseTitle(e.target.value)} 
                    placeholder="e.g., Three-Part Vulnerability Calibration" 
                    className="w-full p-2.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-zinc-500 font-sans">Somatic Instructions / Steps (Separate with periods)</label>
                  <textarea 
                    value={somaticExerciseSteps} 
                    onChange={(e) => setSomaticExerciseSteps(e.target.value)} 
                    placeholder="1. Close your eyes. 2. Breathe jointly for 4 cycles. 3. Squeeze hands gently..." 
                    rows={3} 
                    className="w-full p-2.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-zinc-500 uppercase tracking-widest text-[10px]">Active Reflection Board Prompt</label>
                <input 
                  type="text" 
                  value={reflectionPrompt} 
                  onChange={(e) => setReflectionPrompt(e.target.value)} 
                  placeholder="A question or statement displayed in the active comments/board section..." 
                  className="w-full p-3 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                />
              </div>
            </div>
          </section>

          {/* D.5. AI IN-ARTICLE INSERTS SECTION */}
          <InArticleInsertsEditor
            inserts={inArticleInserts}
            onChange={setInArticleInserts}
            articleTitle={title}
            articleContent={content}
            articleExcerpt={excerpt}
            tags={tags}
          />

          {/* E. ACCESS CONTROL & PREMIUM SUPPORT PANEL */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-left space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4.5 h-4.5 text-rose-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-sans">Access Control & Paywall Settings</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isPremium} 
                  onChange={(e) => setIsPremium(e.target.checked)} 
                  className="w-4.5 h-4.5 text-rose-550 border-zinc-300 rounded focus:ring-rose-500 cursor-pointer" 
                />
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">PAYWALL ACTIVE</span>
              </label>
            </div>

            {isPremium && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-fadeIn">
                
                <div>
                  <label className="block mb-1 font-bold">Premium Price (Coins/Currency)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(Number(e.target.value))} 
                      className="w-full pl-9 pr-4 py-2 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-bold">Access Monetization Strategy</label>
                  <select 
                    value={premiumAccessType} 
                    onChange={(e) => setPremiumAccessType(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl focus:outline-none"
                  >
                    <option value="free">🔓 Open Teaser with Ad Unlock</option>
                    <option value="coins">🪙 Coins/Individual Purchase</option>
                    <option value="subscription">👑 Elite Circle Subscription Only</option>
                    <option value="ad_unlock">📺 Watch Ad Video to Unlock</option>
                  </select>
                </div>

                {premiumAccessType === 'ad_unlock' && (
                  <>
                    <div>
                      <label className="block mb-1 font-bold">Ad Provider Network</label>
                      <select value={adProvider} onChange={(e) => setAdProvider(e.target.value as any)} className="w-full p-2.5 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl">
                        <option value="adsense">Google AdSense Inline Reward</option>
                        <option value="adcolony">AdColony SDK Network</option>
                        <option value="unity">Unity Interstitial Video Ads</option>
                        <option value="custom">Heartsync Internal Promotion ad</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">Daily Unlock Limits per Reader</label>
                      <input type="number" value={dailyUnlockLimit} onChange={(e) => setDailyUnlockLimit(Number(e.target.value))} className="w-full p-2.5 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl" />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">Unlock Validity Duration (Hours)</label>
                      <input type="number" value={unlockDuration} onChange={(e) => setUnlockDuration(Number(e.target.value))} className="w-full p-2.5 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl" />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2 space-y-3">
                  <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest block">Teaser Content Configuration</span>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={showTeaser} onChange={(e) => setShowTeaser(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                      <span>Show Teaser Preview paragraphs</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={blurContent} onChange={(e) => setBlurContent(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                      <span>Display Blur fading overlay representing locked block</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={showSubscriptionCta} onChange={(e) => setShowSubscriptionCta(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                      <span>Show Elite subscription CTA card</span>
                    </label>
                  </div>

                  {showTeaser && (
                    <div className="max-w-sm mt-1">
                      <label className="block mb-1 font-medium">Teaser preview paragraphs count</label>
                      <input type="number" min={1} max={10} value={previewParagraphs} onChange={(e) => setPreviewParagraphs(Number(e.target.value))} className="w-full p-2 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-lg text-xs" />
                    </div>
                  )}
                </div>

              </div>
            )}
          </section>

          {/* F. GOOGLE SEO CONTROL PANEL WITH GOOGLE SERP PREVIEWER */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-left space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Globe className="w-4.5 h-4.5 text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-sans">SEO Meta Configurations</h3>
            </div>

            {/* Google Search Snippet Live Preview */}
            <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 text-left space-y-1.5 select-none">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Google SERP Item Mockup</span>
              <div className="flex items-center gap-2 text-xs text-[#202124] dark:text-zinc-400">
                <span className="w-4.5 h-4.5 rounded-full bg-rose-50 flex items-center justify-center text-[10px] font-bold text-rose-500 border border-rose-100">H</span>
                <span className="font-sans">Heartsync</span>
                <span className="text-zinc-400 font-mono text-[10px]">/posts/{slug || 'article-slug'}</span>
              </div>
              <h3 className="text-[#1a0dab] dark:text-blue-400 hover:underline text-lg font-medium leading-snug cursor-pointer font-sans">
                {seoTitle || title || 'Masterpiece Title...'}
              </h3>
              <p className="text-xs text-[#4d5156] dark:text-zinc-400 font-sans leading-relaxed">
                {seoDescription || excerpt || 'Draft summary of therapeutic and relational connection guidelines...'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1 font-bold">SEO Custom Title</label>
                <input 
                  type="text" 
                  value={seoTitle} 
                  onChange={(e) => setSeoTitle(e.target.value)} 
                  placeholder="e.g., Safe Attachment Bonding Guide" 
                  className="w-full p-2.5 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">Primary Focus Keyword</label>
                <input 
                  type="text" 
                  value={focusKeyword} 
                  onChange={(e) => setFocusKeyword(e.target.value)} 
                  placeholder="e.g., safe attachment" 
                  className="w-full p-2.5 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-bold">SEO Meta Description</label>
                <textarea 
                  value={seoDescription} 
                  onChange={(e) => setSeoDescription(e.target.value)} 
                  placeholder="Recommended 120-160 characters describing the safe therapeutic bonding module..." 
                  rows={2} 
                  className="w-full p-2.5 bg-zinc-50/50 dark:bg-zinc-850 border dark:border-zinc-800 rounded-xl"
                />
              </div>
            </div>
          </section>

          {/* G. FAQ BUILDER BOT */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-rose-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-sans">Frequently Asked Questions (FAQ)</h3>
              </div>
              
              <button 
                onClick={handleInsertFaqTag}
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-955/20 text-rose-550 border border-rose-200 dark:border-rose-900 rounded-lg cursor-pointer"
              >
                + Insert FAQ Anchor to Body
              </button>
            </div>

            {faqs.length > 0 && (
              <div className="space-y-3">
                {faqs.map((faqItem, fidx) => (
                  <div key={fidx} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-850 border dark:border-zinc-800 text-xs flex gap-3 justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">Q: {faqItem.question}</p>
                      <p className="text-zinc-500 italic">A: {faqItem.answer}</p>
                    </div>
                    <button 
                      onClick={() => setFaqs(faqs.filter((_, i) => i !== fidx))}
                      className="p-1 text-zinc-400 hover:text-rose-550 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-850/40 border dark:border-zinc-800 space-y-3 text-xs">
              <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest block">Add New FAQ Item</span>
              <div>
                <label className="block mb-1 text-zinc-500">Question Text</label>
                <input 
                  type="text" 
                  value={newFaqQ} 
                  onChange={(e) => setNewFaqQ(e.target.value)} 
                  placeholder="How can partners synchronize breathing cycles?" 
                  className="w-full p-2.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block mb-1 text-zinc-500">Expert Clinical Answer</label>
                <textarea 
                  value={newFaqA} 
                  onChange={(e) => setNewFaqA(e.target.value)} 
                  placeholder="Partners can utilize co-regulation anchors to match breathing cycles..." 
                  rows={2} 
                  className="w-full p-2.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded-xl"
                />
              </div>
              <button 
                onClick={handleAddFaq} 
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-550 hover:text-white rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all"
              >
                Add to List
              </button>
            </div>
          </section>

          {/* H. AI ASSISTANT PANEL */}
          <section className="bg-gradient-to-r from-rose-500/[0.02] to-fuchsia-500/[0.02] dark:from-rose-955/10 dark:to-fuchsia-955/10 border border-rose-500/15 dark:border-rose-900/40 rounded-3xl p-6 text-left space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-rose-100 dark:border-rose-950">
              <Brain className="w-5 h-5 text-rose-550 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Gemini Clinical Refinement Engine</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="md:col-span-3 space-y-3">
                <textarea 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)} 
                  placeholder="Ask the bot to draft clinical steps, rewrite quotes, optimize for SEO keywords, or generate related advice blocks..." 
                  rows={2} 
                  className="w-full p-3 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs"
                />
                
                <div className="flex flex-wrap gap-2">
                  {(['expand', 'tone', 'summarize', 'seo'] as any[]).map((mode) => (
                    <button 
                      key={mode} 
                      onClick={() => setAiMode(mode)} 
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${aiMode === mode ? 'bg-rose-500 text-white shadow-xs' : 'bg-white dark:bg-zinc-900 border dark:border-zinc-850 hover:bg-rose-50 dark:hover:bg-rose-955 text-zinc-500 hover:text-rose-600'}`}
                    >
                      {mode === 'expand' && '✨ Expand Draft'}
                      {mode === 'tone' && '🎙️ Clinical Tone Calibration'}
                      {mode === 'summarize' && '📝 Exec Summary Draft'}
                      {mode === 'seo' && '🔍 SEO Optimization'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-start">
                <button 
                  onClick={handleTriggerAi} 
                  disabled={aiLoading} 
                  className="px-5 py-3 w-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white rounded-xl font-black shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 cursor-pointer text-xs"
                >
                  {aiLoading ? 'Calibrating...' : 'Trigger Refine'}
                </button>
              </div>
            </div>

            {aiResponse && (
              <div className="p-4 bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-950/40 rounded-2xl text-xs space-y-2 select-text animate-fadeIn">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
                  <span className="font-bold text-rose-600">Gemini Response Insight</span>
                  <button 
                    onClick={() => {
                      insertFormat(aiResponse);
                      setAiResponse('');
                    }} 
                    className="text-[10px] font-black uppercase text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5" /> Append Response at Cursor
                  </button>
                </div>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-300 italic whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </section>

          {/* I. BENTO LAB IMAGE STUDIO FOR COVERS */}
          {/* COVER IMAGE SECTION */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/85 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xs text-left space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <ImageIcon className="w-4.5 h-4.5 text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-sans">Cover Image URL</h3>
            </div>
            <input 
              type="text" 
              value={featuredImage} 
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-rose-500"
            />
            {featuredImage && (
              <img src={featuredImage} alt="Featured preview" className="w-full h-32 object-cover rounded-xl border border-zinc-200 dark:border-zinc-800" />
            )}
          </section>

        </div>

        {/* RIGHT COLUMN: REAL-TIME PREMIUM ARTICLE PREVIEW (PERMANENT LIVE-PREVIEW) */}
        <div className="w-1/2 border-l border-zinc-200 dark:border-zinc-850 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden hidden lg:flex select-text">
          
          {/* Theme/Viewing Toggles for Preview */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Eye className="w-4.5 h-4.5 text-rose-500" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-300">Continuous Live Preview</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPreviewTheme('light')} 
                className={`p-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${previewTheme === 'light' ? 'bg-white text-zinc-850 border-zinc-200 shadow-xs' : 'text-zinc-400 border-transparent hover:text-zinc-650'}`}
              >
                Light
              </button>
              <button 
                onClick={() => setPreviewTheme('dark')} 
                className={`p-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${previewTheme === 'dark' ? 'bg-zinc-800 text-white border-zinc-700 shadow-xs' : 'text-zinc-400 border-transparent hover:text-zinc-300'}`}
              >
                Dark
              </button>
              <button 
                onClick={() => setPreviewTheme('sepia')} 
                className={`p-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${previewTheme === 'sepia' ? 'bg-[#f4eccf] text-[#433422] border-[#ebdca9] shadow-xs' : 'text-zinc-400 border-transparent hover:text-[#433422]'}`}
              >
                Sepia
              </button>
            </div>
          </div>

          {/* Premium Preview canvas matching public layouts exactly */}
          <div className={`flex-1 overflow-y-auto p-8 space-y-6 transition-all duration-300 ${
            previewTheme === 'light' ? 'bg-white text-zinc-800' :
            previewTheme === 'dark' ? 'bg-zinc-950 text-zinc-100' :
            'bg-[#FAF6E9] text-[#433422]'
          }`}>
            
            {/* Header elements mockup */}
            <div className="border-b border-zinc-200/40 dark:border-zinc-800/40 pb-6 text-left space-y-3 font-sans">
              
              {/* Category tag */}
              <span className="text-[10px] font-black uppercase tracking-widest text-[#CE2B5E] dark:text-rose-400 block">
                {categories.find(c => c.id === categoryId)?.name || 'Connection Category'}
              </span>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: '"Playfair Display", "Lora", Georgia, serif' }}>
                {title || 'Article Title'}
              </h1>

              {/* Sub-header meta row */}
              <div className="flex items-center gap-4 text-xs text-zinc-400 font-semibold pt-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Draft Date</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {estimatedReadTime} min read</span>
                {isPremium && (
                  <span className="flex items-center gap-1 text-amber-500 font-black"><Lock className="w-3.5 h-3.5" /> Premium</span>
                )}
              </div>
            </div>

            {/* Cover art image mockup */}
            {featuredImage && (
              <div className="rounded-3xl overflow-hidden aspect-video border border-zinc-200/30 shadow-sm relative group">
                <img src={featuredImage} alt="Cover layout" className="w-full h-full object-cover" />
              </div>
            )}

            {/* In-article preface or editorial summary block */}
            {editorialSummary && (
              <div className="p-6 rounded-2xl bg-zinc-500/[0.02] dark:bg-zinc-900/10 border border-rose-500/10 dark:border-rose-950/40 text-left font-serif space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#CE2B5E] dark:text-rose-400 font-sans block mb-1">In-Article Preface</span>
                <p className="text-sm italic leading-relaxed text-zinc-700 dark:text-zinc-300">{editorialSummary}</p>
              </div>
            )}

            {/* MAIN ARTICLE BODY USING FULLY RE-ENGINEERED WIDGETIZED RENDERER */}
            <div className="pt-2">
              <WidgetizedMarkdown 
                content={content || '*Start writing to live render typography insights...*'} 
                faqItems={faqs} 
                categories={categories}
              />
            </div>

            {/* In-article quote block */}
            {inArticleQuote && (
              <div className="my-10 p-6 sm:p-8 border-t border-b border-rose-100 dark:border-zinc-800 text-center relative max-w-2xl mx-auto font-sans">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-950 px-4 font-serif text-3xl text-rose-300 dark:text-rose-900 leading-none">“</span>
                <p className="font-serif italic text-base sm:text-lg text-rose-800 dark:text-rose-200 leading-relaxed">
                  {inArticleQuote}
                </p>
                {inArticleQuoteAuthor && (
                  <cite className="block mt-3 text-xs font-sans not-italic font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest">
                    — {inArticleQuoteAuthor}
                  </cite>
                )}
              </div>
            )}

            {/* Reflection Note block */}
            {reflectionNote && (
              <div className="my-8 p-6 rounded-3xl bg-rose-500/[0.03] dark:bg-rose-955/10 border border-rose-500/10 dark:border-rose-500/15 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Reflection Note</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-750 dark:text-zinc-350 leading-relaxed font-serif italic">
                  {reflectionNote}
                </p>
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">
                  Suggested Pause Time: 2 Minutes
                </div>
              </div>
            )}

            {/* Somatic clinical practice exercise block */}
            {somaticExerciseTitle && (
              <div className="my-8 p-6 rounded-3xl bg-zinc-900 text-white border border-zinc-800 text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Clinical Somatic Practice</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Somatic Centering Guide</span>
                </div>
                <h4 className="text-base font-serif font-black tracking-tight">{somaticExerciseTitle}</h4>
                {somaticExerciseSteps && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-400 font-medium">Follow these step-by-step instructions with your partner:</p>
                    <ul className="space-y-2">
                      {somaticExerciseSteps.split('. ').map((step, idx) => {
                        if (!step.trim()) return null;
                        const cleanStep = step.replace(/^\d+\.\s*/, '');
                        return (
                          <li key={idx} className="flex gap-3 text-xs text-zinc-300">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center font-mono text-[9px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{cleanStep}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MEDIA BANK SELECTOR MODAL */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto text-left shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Select Image from Media Bank</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMediaModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold px-2 py-1"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {heartsync.getMediaItems().map((item, i) => (
                <div 
                  key={item.url + i}
                  onClick={() => {
                    if (mediaModalTarget === 'featured') {
                      setFeaturedImage(item.url);
                    } else if (mediaModalTarget === 'imageBlock') {
                      setInsertData((prev: any) => ({ ...prev, url: item.url }));
                    } else if (mediaModalTarget === 'galleryBlock') {
                      setInsertData((prev: any) => ({
                        ...prev,
                        urls: prev.urls ? `${prev.urls}, ${item.url}` : item.url
                      }));
                    }
                    setShowMediaModal(false);
                  }}
                  className="group relative aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 cursor-pointer transition-all bg-zinc-900"
                >
                  <img src={item.url} alt={item.fileName || 'Media file'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-rose-600/80 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    Select Image
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
