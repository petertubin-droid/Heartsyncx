/** ArticlePage: the full article reading experience.
 *  Extracted verbatim from App.tsx (2026-09-24 App.tsx split, phase 1) to
 *  shrink the 5,970-line App component and keep the article surface
 *  independently maintainable. The JSX body is unchanged; outer-scope values
 *  arrive as typed props.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import ArticleShareRow from './ArticleShareRow';
import RelatedContentBlock from './RelatedContentBlock';
import ArticleBodyWithInserts from './ArticleBodyWithInserts';
import { AdPlacement } from './AdPlacement';
import CrossPromoSlot from './houseAds/CrossPromoSlot';
import ArticleTTS from './ArticleTTS';
import { heartsync, getAuthors } from '../store';
import { trackEvent } from '../lib/analytics';
import { Post, Author, Topic } from '../types';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  Heart, BookOpen, MessageSquare, Copy, ArrowLeft, Send,
  HelpCircle, RefreshCw, Twitter, Facebook, Link as LinkIcon, Calendar, Clock,
  Lock, Play, Maximize2, ArrowRight, Share2, Music2
} from 'lucide-react';

export interface ArticlePageProps {
    activeArticle: Post | null;
    articleBody: string;
    headings: { id: string; text: string; level: number }[];
    markdownComponents: Record<string, any>;
    siteSettings: any;
    navigateTo: (tab: any, arg?: string, skipScroll?: boolean) => void;
    showToast: (msg: string) => void;
    renderSidebar: () => React.ReactNode;
    handleReaction: (postId: string, reactType: "love" | "insightful" | "support" | "warmth") => void;
    submitComment: (e: React.FormEvent, postId: string) => void;
    checkIsArticleLocked: (articleId: string) => boolean;
    unlockArticleInState: (id: string) => void;
    paragraphCountRef: React.MutableRefObject<number>;
    publishedArticles: Post[];
    posts: Post[];
    categories: any[];
    setActiveArticle: (p: Post | null) => void;
    setCurrentTab: (t: any) => void;
    setTabArg: (s: string) => void;
    setLightboxImage: (v: { src: string; alt?: string; caption?: string } | null) => void;
  setAdTarget: (v: { type: 'article' | 'category'; id: string; title: string } | null) => void;
  setAdStep: (s: 'intro' | 'watching' | 'completed') => void;
  setAdSecondsLeft: (n: number) => void;
    scrollPercent: any;
    activeHeadingId: any;
    newsletterSubscribed: any;
    setNewsletterSubscribed: React.Dispatch<React.SetStateAction<any>>;
    newsletterEmail: any;
    setNewsletterEmail: React.Dispatch<React.SetStateAction<any>>;
    copyFeedbackToast: any;
    setCopyFeedbackToast: React.Dispatch<React.SetStateAction<any>>;
    shareMenuOpen: any;
    setShareMenuOpen: React.Dispatch<React.SetStateAction<any>>;
    hasLiked: any;
    setHasLiked: React.Dispatch<React.SetStateAction<any>>;
    comments: any;
    commentInput: any;
    setCommentInput: React.Dispatch<React.SetStateAction<any>>;
    commentAuthorName: any;
    setCommentAuthorName: React.Dispatch<React.SetStateAction<any>>;
    commentAuthorEmail: any;
    setCommentAuthorEmail: React.Dispatch<React.SetStateAction<any>>;
    activeQuizIndex: number;
    setActiveQuizIndex: React.Dispatch<React.SetStateAction<number>>;
    selectedAnswerIndex: number | null;
    setSelectedAnswerIndex: React.Dispatch<React.SetStateAction<number | null>>;
    quizAnswerSubmitted: boolean;
    setQuizAnswerSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
    quizScore: number;
    setQuizScore: React.Dispatch<React.SetStateAction<number>>;
    quizSessionFinished: boolean;
    setQuizSessionFinished: React.Dispatch<React.SetStateAction<boolean>>;
    articlePaymentPortal: 'stripe' | 'paystack' | 'paypal';
    setArticlePaymentPortal: React.Dispatch<React.SetStateAction<'stripe' | 'paystack' | 'paypal'>>;
    isPayingArticle: any;
    setIsPayingArticle: React.Dispatch<React.SetStateAction<any>>;
    payCardNum: any;
    setPayCardNum: React.Dispatch<React.SetStateAction<any>>;
    payEmail: any;
    setPayEmail: React.Dispatch<React.SetStateAction<any>>;
    payExpiry: any;
    setPayExpiry: React.Dispatch<React.SetStateAction<any>>;
    payCvc: any;
    setPayCvc: React.Dispatch<React.SetStateAction<any>>;
}

export default function ArticlePage({
activeArticle, articleBody, headings, markdownComponents, siteSettings, navigateTo, showToast, renderSidebar, handleReaction, submitComment, checkIsArticleLocked, unlockArticleInState, paragraphCountRef, publishedArticles, posts, categories, setActiveArticle, setCurrentTab, setTabArg, setLightboxImage, setAdTarget, setAdSecondsLeft, setAdStep, scrollPercent, activeHeadingId, newsletterSubscribed, setNewsletterSubscribed, newsletterEmail, setNewsletterEmail, copyFeedbackToast, setCopyFeedbackToast, shareMenuOpen, setShareMenuOpen, hasLiked, setHasLiked, comments, commentInput, setCommentInput, commentAuthorName, setCommentAuthorName, commentAuthorEmail, setCommentAuthorEmail, activeQuizIndex, setActiveQuizIndex, selectedAnswerIndex, setSelectedAnswerIndex, quizAnswerSubmitted, setQuizAnswerSubmitted, quizScore, setQuizScore, quizSessionFinished, setQuizSessionFinished, articlePaymentPortal, setArticlePaymentPortal, isPayingArticle, setIsPayingArticle, payCardNum, setPayCardNum, payEmail, setPayEmail, payExpiry, setPayExpiry, payCvc, setPayCvc
}: ArticlePageProps) {
              // Wired article design settings (AdminConsole > Article Design)  - previously dead
              const artLayout = siteSettings.article_layout || 'standard';
              // Hero style drives both the header design and whether the legacy
              // social-share row renders (the Frelux-style 'standard' header folds
              // Like + Share into its meta row instead).
              const heroStyle = siteSettings.article_hero_style || 'standard';
              const sidebarWidthRaw = siteSettings.article_desktop_sidebar_width || 'w-80';
              const sidebarSpanClass = sidebarWidthRaw === 'w-96' ? 'lg:col-span-5'
                : (sidebarWidthRaw === 'w-64' || sidebarWidthRaw === 'w-72') ? 'lg:col-span-3'
                : 'lg:col-span-4';
              const showArtSidebar = artLayout !== 'narrow' && siteSettings.article_desktop_sidebar_visible !== false;
              const mainSpanClass = !showArtSidebar ? 'lg:col-span-12'
                : sidebarSpanClass === 'lg:col-span-5' ? 'lg:col-span-7'
                : sidebarSpanClass === 'lg:col-span-3' ? 'lg:col-span-9'
                : 'lg:col-span-8';
              const sidebarLeft = (siteSettings.article_sidebar_position || 'right') === 'left';
              const relatedInSidebar = (siteSettings.article_desktop_related_placement || 'bottom') === 'sidebar';
              // HOUSE AD TARGETS: two OTHER published articles to promote
              // inside this article's body. Same-category picks first
              // (most relevant continuation), then most recent others.
              const promoPicks = useMemo(() => {
                const others = (publishedArticles || []).filter(
                  (p) => p.id !== activeArticle?.id && p.status === 'published' && p.slug
                );
                const sameCat = others.filter((p) => p.category_id === activeArticle?.category_id);
                const rest = others.filter((p) => p.category_id !== activeArticle?.category_id);
                return [...sameCat, ...rest].slice(0, 2);
              }, [publishedArticles, activeArticle?.id, activeArticle?.category_id]);
              const mobileShareStyle = siteSettings.article_mobile_share_style || 'dock';
              const showMobileDock = mobileShareStyle === 'dock' && siteSettings.article_mobile_sticky_actions !== false;
              const bodyWidthClass = siteSettings.article_desktop_content_width || siteSettings.article_content_width || 'max-w-none';
              const lineHeightMap: Record<string, string> = { normal: 'leading-normal', relaxed: 'leading-relaxed', loose: 'leading-loose', snug: 'leading-snug' };
              const lineHeightClass = lineHeightMap[siteSettings.article_line_height || 'relaxed'] || 'leading-relaxed';
              const spacingClass = siteSettings.article_paragraph_spacing || 'space-y-5';
              const headingsClass = (siteSettings.article_heading_styles || 'serif-bold') === 'sans-black'
                ? 'article-headings-sans' : 'article-headings-serif';

              return (
              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${siteSettings.article_atmospheric_linen ? 'article-linen rounded-2xl' : ''} ${siteSettings.article_magazine_mode ? 'article-magazine-mode' : ''} ${siteSettings.article_borderless_mode ? 'article-borderless-mode' : ''}`}>
                <div className={`col-span-12 ${mainSpanClass} ${sidebarLeft && showArtSidebar ? 'lg:order-2' : ''} space-y-6 min-w-0`}>
                
                {/* 1. Sticky Reading Progress Indicator Bar */}
                {/* Portalled straight to document.body: the page-transition wrapper above
                    applies `transform: translateZ(0)` for GPU-accelerated animation, and any
                    ancestor transform creates a NEW containing block for `position: fixed`
                    descendants (CSS spec). Left in place, this bar would be fixed relative to
                    that animated wrapper instead of the viewport, so it scrolls away with the
                    page instead of staying pinned to the top. Portalling escapes that ancestor
                    entirely and restores true viewport-fixed behavior. */}
                {(siteSettings.article_reading_progress_enabled ?? true) && createPortal(
                  <div 
                    className={`fixed top-0 left-0 h-1.5 z-50 w-full transition-all duration-300 ${siteSettings.article_mobile_progress_bar === false ? 'hidden md:block' : ''}`} 
                    style={{ 
                      width: `${scrollPercent}%`, 
                      backgroundColor: siteSettings.article_reading_progress_color || '#e11d48' 
                    }}
                  />,
                  document.body
                )}

                {mobileShareStyle === 'inline' && (
                  <div className="md:hidden flex items-center justify-center py-3 border-b border-zinc-150 dark:border-zinc-800/60">
                    <ArticleShareRow title={activeArticle.title} />
                  </div>
                )}

                {/* Article header bar: back control + reader settings */}
                <div className="pb-4 border-b border-zinc-200/70 dark:border-zinc-800/60 font-sans">
                  <button 
                    onClick={() => navigateTo('articles')}
                    className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors duration-200 w-fit"
                    aria-label="Back to journal feed"
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700 group-hover:border-rose-400 dark:group-hover:border-rose-500/50 group-hover:bg-rose-50 dark:group-hover:bg-rose-500/10 transition-all duration-200">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                    All Articles
                  </button>

                </div>

                {/* Reading Comfort & Theme Context Outer Wrapper */}
                <div id="heartsync-premium-article-reading-body" className="space-y-5 bg-transparent text-zinc-850 dark:text-zinc-100">
                  {/* 2. DYNAMIC HERO DESIGNS & CONTEXT HEADERS */}
                  {(() => {
                    const matchedCat = categories.find(c => c.id === activeArticle.category_id);
                    const authorObj: Author = getAuthors().find(a => a.id === activeArticle.author_id) || getAuthors()[0] || {
                      id: activeArticle.author_id || 'editorial',
                      name: 'Editorial Board',
                      avatar_url: '',
                      bio: 'Heartsync Editorial Team',
                      role_tag: 'Editorial Staff',
                      role: 'author'
                    };
                    const articleHeroStyle = siteSettings.article_hero_style || 'standard';
                    const imgPos = siteSettings.article_image_position || 'below-meta';
                    const aspectClass = siteSettings.article_image_aspect_ratio === '21/9' ? 'aspect-[21/9]' :
                                        siteSettings.article_image_aspect_ratio === '16/9' ? 'aspect-video' :
                                        siteSettings.article_image_aspect_ratio === '4/3' ? 'aspect-[4/3]' :
                                        siteSettings.article_image_aspect_ratio === '1:1' ? 'aspect-square' :
                                        'aspect-[16/10] sm:aspect-[21/9] lg:aspect-[2.4]';
                    const roundClass = siteSettings.article_image_rounded_corners === 'none' ? 'rounded-none' :
                                       siteSettings.article_image_rounded_corners === 'xl' ? 'rounded-xl' :
                                       siteSettings.article_image_rounded_corners === 'rounded-2xl' ? 'rounded-2xl' :
                                       siteSettings.article_image_rounded_corners === '2rem' ? 'rounded-[2rem]' :
                                       'rounded-[2rem] md:rounded-[2.5rem]';

                    // Handler to open image in lightbox
                    const handleImageClick = (src: string, alt: string) => {
                      if (siteSettings.article_lightbox_enabled !== false) {
                        setLightboxImage({
                          src,
                          alt,
                          caption: activeArticle.excerpt || "Therapeutic conscious reflection workflow detail."
                        });
                      }
                    };

                    // Sub-component: Breadcrumbs
                    const renderBreadcrumbs = () => {
                      if (siteSettings.article_meta_breadcrumbs_enabled === false) return null;
                      return (
                        <nav className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-sans tracking-wide uppercase font-semibold mb-4 select-none">
                          <button onClick={() => navigateTo('home')} className="hover:text-rose-600 transition-colors">Home</button>
                          <span>/</span>
                          <button onClick={() => navigateTo('articles')} className="hover:text-rose-600 transition-colors">Journal</button>
                          {matchedCat && (
                            <>
                              <span>/</span>
                              <button onClick={() => navigateTo('category', matchedCat.slug)} className="hover:text-rose-600 transition-colors">
                                {matchedCat.name}
                              </button>
                            </>
                          )}
                        </nav>
                      );
                    };

                    // Sub-component: Author Profile & Metadata Box
                    const renderMetadataAndAuthorRow = () => {
                      return (
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-zinc-200/70 dark:border-zinc-800/70 pb-5 font-sans">
                          {/* Left cluster: author, read time, date, freshness, category */}
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-zinc-500 dark:text-zinc-400 text-xs">
                            {(siteSettings.article_meta_author_enabled !== false) && (
                              <span className="flex items-center gap-2">
                                <img
                                  src={authorObj.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
                                  alt={authorObj.name}
                                  className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{authorObj.name}</span>
                              </span>
                            )}
                            {(siteSettings.article_meta_reading_time_enabled !== false) && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {activeArticle.read_time} min read
                              </span>
                            )}
                            {(siteSettings.article_meta_date_enabled !== false) && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(activeArticle.publish_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            )}
                            {(siteSettings.article_meta_updated_date_enabled === true) && (activeArticle as any).updated_date && (
                              <span className="flex items-center gap-1.5" title="Content actively vetted and revised">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Updated {new Date((activeArticle as any).updated_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            {(siteSettings.article_meta_categories_enabled === true) && matchedCat && (
                              <button
                                type="button"
                                onClick={() => navigateTo('category', matchedCat.slug)}
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                              >
                                {matchedCat.name}
                              </button>
                            )}
                          </div>

                          {/* Right cluster: compact Like + Listen + Share (Frelux-style
                              trailing actions, never touching the body) */}
                          <div className="flex items-center gap-2 shrink-0 ml-auto">
                            {articleHeroStyle === 'standard' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!hasLiked) {
                                    heartsync.likePost(activeArticle.id);
                                    setHasLiked(true);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 text-xs font-semibold hover:border-rose-400 dark:hover:border-rose-500/60 hover:text-rose-500 transition-all cursor-pointer shadow-sm"
                                aria-label="Like this article"
                              >
                                <Heart fill={hasLiked ? '#CE2B5E' : 'none'} className={`w-3.5 h-3.5 ${hasLiked ? 'text-rose-600' : ''}`} />
                                {activeArticle.likes || 0}
                              </button>
                            )}
                            <Suspense fallback={null}><ArticleTTS content={articleBody} compact /></Suspense>
                            <button
                              type="button"
                              onClick={() => setShareMenuOpen((v) => !v)}
                              className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 text-xs font-semibold hover:border-rose-400 dark:hover:border-rose-500/60 hover:text-rose-500 transition-all cursor-pointer shadow-sm"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              Share
                              {shareMenuOpen && (
                                <div
                                  className="absolute right-0 top-full mt-2 z-20 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ArticleShareRow title={activeArticle.title} compact />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    };

                    // Sub-component: Configurable Featured Image Card
                    const renderFeaturedImage = () => {
                      const imgSrc = activeArticle.featured_image || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200';
                      return (
                        <div className="space-y-2">
                          <div 
                            className={`relative overflow-hidden ${aspectClass} ${roundClass} shadow-2xl shadow-black/15 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/10 group ${
                              siteSettings.article_lightbox_enabled !== false ? 'cursor-zoom-in' : ''
                            }`}
                            onClick={() => handleImageClick(imgSrc, activeArticle.title)}
                          >
                            <img 
                              src={imgSrc} 
                              alt={activeArticle.title} 
                              loading={siteSettings.article_image_lazy_loading !== false ? "lazy" : "eager"}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=1200';
                              }}
                            />
                            
                            {/* Backdrop shadow gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                            {/* Click to zoom badge */}
                            {siteSettings.article_lightbox_enabled !== false && (
                              <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          {/* Image Caption & Credit line */}
                          {siteSettings.article_image_caption_enabled === true && (
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic px-2 font-sans flex justify-between">
                              <span>{activeArticle.excerpt || "Figure 1: Relational bonding session workflow description."}</span>
                              {siteSettings.article_image_credit_enabled !== false && (
                                <span className="opacity-80">Photo credit: Conscious Counsel / Unsplash</span>
                              )}
                            </p>
                          )}
                        </div>
                      );
                    };

                    /* COMPILING CORRESPONDING VISUAL STYLES */

                    if (articleHeroStyle === 'overlay') {
                      return (
                        <div className="space-y-4">
                          {renderBreadcrumbs()}
                          <div className={`relative rounded-2xl md:rounded-[2rem] overflow-hidden ${siteSettings.article_mobile_image_height && siteSettings.article_mobile_image_height !== 'h-auto' ? siteSettings.article_mobile_image_height : 'aspect-[4/3]'} sm:aspect-[2.1] mb-4 group shadow-xl`}>
                            <img 
                              src={activeArticle.featured_image || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200'} 
                              alt={activeArticle.title} 
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700 cursor-zoom-in"
                              onClick={() => handleImageClick(activeArticle.featured_image || '', activeArticle.title)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white space-y-3 pointer-events-none">
                              <div className="flex flex-wrap gap-2 items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-200">
                                {matchedCat && (
                                  <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-sans text-[8px] font-black uppercase tracking-widest">
                                    {matchedCat.name}
                                  </span>
                                )}
                                <span>•</span>
                                <span className="font-mono flex items-center gap-1"><BookOpen className="w-3 h-3" />{activeArticle.read_time} Min</span>
                              </div>
                              <h1 className="font-serif font-black text-xl sm:text-3xl md:text-4xl lg:text-[2.6rem] text-white leading-tight drop-shadow-sm">
                                {activeArticle.title}
                              </h1>
                              <p className="text-zinc-300 italic text-[11px] sm:text-xs max-w-2xl line-clamp-2">
                                {activeArticle.excerpt}
                              </p>
                            </div>
                          </div>
                          {renderMetadataAndAuthorRow()}
                        </div>
                      );
                    }

                    if (articleHeroStyle === 'parallax') {
                      return (
                        <div className="space-y-6">
                          {renderBreadcrumbs()}
                          <div className="space-y-4">
                            <h1 className="font-serif font-black text-3xl sm:text-5xl leading-tight tracking-tight text-zinc-900 dark:text-white">
                              {activeArticle.title}
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 italic text-sm border-l-2 border-rose-500 pl-4 py-1 leading-relaxed">
                              {activeArticle.excerpt}
                            </p>
                            {renderMetadataAndAuthorRow()}
                          </div>
                          
                          {/* Giant Blurred/Lush background feature header */}
                          <div className="relative overflow-hidden rounded-[2.5rem] shadow-xl group border border-zinc-200 dark:border-zinc-800">
                            <div 
                              className="w-full aspect-[21/9] bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.01]"
                              style={{ backgroundImage: `url(${activeArticle.featured_image || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200'})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                          </div>
                        </div>
                      );
                    }

                    if (articleHeroStyle === 'minimalist') {
                      return (
                        <div className={`${siteSettings.article_mobile_header_spacing || 'py-6'} md:py-6 border-b border-zinc-200/50 dark:border-zinc-800/50 space-y-4 max-w-4xl border-dashed`}>
                          {renderBreadcrumbs()}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              {matchedCat && (
                                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-rose-600">
                                  // {matchedCat.name}
                                </span>
                              )}
                              <span className="text-zinc-300 dark:text-zinc-750 select-none">•</span>
                              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-wider">
                                Read Time: {activeArticle.read_time} Min
                              </span>
                            </div>
                            <h1 className="font-serif font-black text-3xl sm:text-5xl leading-tight tracking-tight text-zinc-900 dark:text-white">
                              {activeArticle.title}
                            </h1>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-3xl">
                              {activeArticle.excerpt}
                            </p>
                          </div>
                          {renderMetadataAndAuthorRow()}
                        </div>
                      );
                    }

                    // DEFAULT STYLE: 'standard' — Frelux-inspired premium editorial
                    // header: refined category pill → display-scale serif title →
                    // muted excerpt → Frelux-style bordered meta row with trailing
                    // Like / Listen / Share actions → rounded, shadowed cover image.
                    // Clean paper-first layout: no text-over-image overlay.
                    // Incorporates Image Positions: top | below-title | below-meta
                    return (
                      <div className="space-y-6">
                        {renderBreadcrumbs()}

                        {imgPos === 'top' && renderFeaturedImage()}

                        <header className="space-y-4 sm:space-y-5">
                          {/* Category pill badge */}
                          <span
                            className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-sans font-semibold uppercase tracking-widest"
                            style={{
                              color: matchedCat?.color || '#e11d48',
                              backgroundColor: matchedCat?.color ? `${matchedCat.color}14` : 'rgba(225,29,72,0.08)'
                            }}
                          >
                            {matchedCat ? matchedCat.name : 'Heartsync Journal'}
                          </span>
                          <h1
                            className="font-serif font-bold text-[1.85rem] sm:text-4xl lg:text-[2.6rem] leading-[1.15] sm:leading-[1.12] tracking-[-0.012em] text-zinc-900 dark:text-white"
                            style={{ textWrap: 'balance' }}
                          >
                            {activeArticle.title}
                          </h1>
                          <p
                            className="text-zinc-500 dark:text-zinc-400 text-[15px] sm:text-lg leading-relaxed max-w-3xl"
                            style={{ textWrap: 'pretty' }}
                          >
                            {activeArticle.excerpt}
                          </p>
                        </header>

                        {imgPos === 'below-title' && renderFeaturedImage()}

                        {renderMetadataAndAuthorRow()}

                        {imgPos === 'below-meta' && renderFeaturedImage()}
                      </div>
                    );
                  })()}

                  {/* 3. Social Share Actions under the header.
                      Only for non-'standard' hero styles: the Frelux-style standard
                      header folds Like into its bordered meta row and hides this
                      extra cluster (the sticky rail/dock still covers sharing). */}
                  {heroStyle !== 'standard' && (
                  <div className="flex flex-wrap items-center gap-3 pb-2 pt-1 border-b border-zinc-150/20 dark:border-zinc-850/20 font-sans">
                    <button 
                      onClick={() => {
                        if (!hasLiked) {
                          heartsync.likePost(activeArticle.id);
                          setHasLiked(true);
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-500 font-bold cursor-pointer transition-all bg-transparent border-none py-1.5 px-3 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-900"
                    >
                      <Heart fill={hasLiked ? '#CE2B5E' : 'none'} className={`w-4 h-4 ${hasLiked ? 'text-rose-600' : ''}`} />
                      <span>Like ({activeArticle.likes || 0})</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(window.location.href);
                          setCopyFeedbackToast(true);
                          setTimeout(() => setCopyFeedbackToast(false), 2000);
                        } catch (_) {}
                      }}
                      className="relative flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-500 font-bold cursor-pointer transition-all bg-transparent border-none py-1.5 px-3 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-900"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>Copy Link</span>
                      {copyFeedbackToast && (
                        <span className="absolute left-1/2 -translate-x-1/2 -top-10 bg-zinc-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap animate-bounce leading-none">
                          Copied Link!
                        </span>
                      )}
                    </button>

                    <a 
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activeArticle.title)}&url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#1DA1F2] font-bold cursor-pointer transition-all py-1.5 px-3 rounded-lg hover:bg-zinc-100/50 dark:hover:bg-zinc-900"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Tweet</span>
                    </a>
                  </div>
                  )}



                  {/* 4. MAIN ARTICLE GRID: Floating Share Rail, Body, and Sidebar */}
                  {(() => {
                    const showLeftRail = (siteSettings.article_share_system_enabled !== false) || (siteSettings.article_table_of_contents_enabled !== false && headings.length > 0);
                    const showRightSidebar = (siteSettings.article_sidebar_enabled !== false);
                    
                    let bodyColSpan = "lg:col-span-2";
                    if (!showLeftRail && !showRightSidebar) {
                      bodyColSpan = `lg:col-span-4 ${siteSettings.article_desktop_content_width || siteSettings.article_content_width || 'max-w-4xl'} mx-auto w-full`;
                    } else if (!showLeftRail) {
                      bodyColSpan = "lg:col-span-3";
                    } else if (!showRightSidebar) {
                      bodyColSpan = "lg:col-span-3";
                    }

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        
                        {/* A. FLOATING SOCIAL SHARE RAIL (DESKTOP STICKY, MOBILE STICKY BOTTOM DOCK) */}
                        {showLeftRail && (
                          <div className="lg:col-span-1 lg:block hidden">
                            <div className="sticky top-24 space-y-5 text-center p-4 bg-zinc-100/40 dark:bg-zinc-900/20 border border-zinc-200/40 dark:border-zinc-800/20 rounded-2xl">
                              {siteSettings.article_share_system_enabled !== false && (
                                <>
                                  <span className="text-[10px] font-mono tracking-widest text-zinc-400 dark:text-zinc-500 uppercase block font-bold">Share Guide</span>
                                  
                                  <div className="flex flex-col gap-3.5 items-center">
                                    {/* Copy Link Button */}
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          try {
                                            navigator.clipboard.writeText(window.location.href);
                                            setCopyFeedbackToast(true);
                                            setTimeout(() => setCopyFeedbackToast(false), 2000);
                                          } catch (_) {}
                                        }}
                                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:text-rose-500 hover:scale-110 active:scale-95 transition-all text-zinc-650 dark:text-zinc-350 cursor-pointer shadow-sm shadow-black/5"
                                        title="Copy URL"
                                      >
                                        <LinkIcon className="w-4.5 h-4.5" />
                                      </button>
                                      {copyFeedbackToast && (
                                        <span className="absolute left-1/2 -translate-x-1/2 -top-10 bg-zinc-900 text-white text-[9px] font-sans font-bold px-2 py-1 rounded shadow-md whitespace-nowrap animate-bounce leading-none">
                                          Copied Link!
                                        </span>
                                      )}
                                    </div>

                                    {/* Full social share row (X, Facebook, LinkedIn, WhatsApp, Reddit, Instagram, TikTok, email, native share) */}
                                    <ArticleShareRow title={activeArticle.title} compact />
                                  </div>
                                </>
                              )}

                              {/* Contents (TOC) Widget embedded in sticky region  - Frelux-style */}
                              {siteSettings.article_table_of_contents_enabled !== false && headings.length > 0 && (
                                <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 text-left">
                                  <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Contents
                                  </div>
                                  <nav className="space-y-1 border-l border-zinc-200 dark:border-white/10">
                                    {headings.map((h) => (
                                      <a
                                        key={h.id}
                                        href={`#${h.id}`}
                                        className={`mt-2 block border-l-2 py-1.5 pl-3 text-xs transition-colors hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 ${
                                          h.level === 3 ? 'text-zinc-400 dark:text-zinc-500' : 'font-semibold'
                                        } ${
                                          activeHeadingId === h.id
                                            ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                                            : 'border-transparent text-zinc-500 dark:text-zinc-400'
                                        }`}
                                      >
                                        {h.text}
                                      </a>
                                    ))}
                                  </nav>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* B. MIDDLE POSITIONED MAIN MARKDOWN BODY */}
                        <div className={`${bodyColSpan} space-y-6`}>

                      {/* DYNAMIC ARTICLE AUTHOR PROFILE STRIP (Requirement: display before start of content, screenshot format) */}
                      {(() => {
                        if (siteSettings.article_author_box_enabled === false) return null;
                        const articleAuthor = getAuthors().find(a => a.id === activeArticle.author_id) || getAuthors()[0];
                        const spotlight = (articleAuthor || { id: activeArticle.author_id || 'editorial', name: 'Editorial Board', role_tag: 'Editorial Staff', bio: 'Heartsync Editorial Team', avatar_url: '' }) as any;
                        
                        // Parse and format the UTC date and time nicely
                        const formatDate = (dateStr?: string) => {
                          if (!dateStr) return 'Jun 19, 2026 @ 08:05 UTC';
                          try {
                            const d = new Date(dateStr);
                            if (isNaN(d.getTime())) return dateStr;
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const monthObj = months[d.getUTCMonth()];
                            const dayVal = d.getUTCDate();
                            const yearVal = d.getUTCFullYear();
                            const pad = (num: number) => num.toString().padStart(2, '0');
                            const hours = pad(d.getUTCHours());
                            const minutes = pad(d.getUTCMinutes());
                            return `${monthObj} ${dayVal}, ${yearVal} @ ${hours}:${minutes} UTC`;
                          } catch {
                            return dateStr || 'Jun 19, 2026 @ 08:05 UTC';
                          }
                        };

                        const formattedPublishDate = formatDate(activeArticle.publish_date);

                        return (
                          <div 
                            id="article-author-profile-strip"
                            className="border-t border-b border-zinc-200 dark:border-zinc-800 py-3 mt-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans text-zinc-500 dark:text-zinc-400"
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={spotlight.avatar_url || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150"} 
                                alt={spotlight.name}
                                className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-800 shadow-xs cursor-pointer" 
                                onClick={() => navigateTo('author', spotlight.id)}
                              />
                              <div className="leading-none text-zinc-605 dark:text-zinc-395">
                                <span className="text-zinc-500 dark:text-zinc-400">By </span>
                                <button
                                  type="button"
                                  onClick={() => navigateTo('author', spotlight.id)}
                                  className="font-bold text-zinc-900 dark:text-white underline decoration-1 underline-offset-3 hover:text-[#CE2B5E] dark:hover:text-rose-450 hover:decoration-[#CE2B5E] dark:hover:decoration-rose-450 transition-colors cursor-pointer inline-block"
                                >
                                  {spotlight.name}
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:text-right leading-none sm:justify-end text-zinc-500 dark:text-zinc-400">
                              <span>Published on:</span>
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {formattedPublishDate}
                              </span>
                            </div>
                          </div>
                        );
                      })()}



                      {(() => {
                        paragraphCountRef.current = 0;
                        const isLocked = checkIsArticleLocked(activeArticle.id);

                        if (isLocked) {
                          const itemPrice = activeArticle.price !== undefined ? activeArticle.price : 4.99;
                          const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);

                          const handleArticlePurchaseSubmit = (e: React.FormEvent) => {
                            e.preventDefault();
                            if (!payEmail) {
                              showToast('Please specify a valid email to receive your secure receipt and keys');
                              return;
                            }
                            setIsPayingArticle(true);
                            setTimeout(() => {
                              setIsPayingArticle(false);
                              unlockArticleInState(activeArticle.id);
                              showToast(`Access Approved! Unlocked '${activeArticle.title}' safely with ${articlePaymentPortal.toUpperCase()}!`);
                              heartsync.logAction('Single Article Purchase', `'${activeArticle.title}' was unlocked for ${formattedPrice} via ${articlePaymentPortal.toUpperCase()}`);
                            }, 1500);
                          };

                          return (
                            <div className="space-y-6 relative" id="article-paylocked-panel">
                              {/* Locked Teaser Paragraph Preview */}
                              <div className="opacity-80 dark:opacity-75 blur-[0.2px] select-none pointer-events-none line-clamp-4 leading-relaxed text-zinc-500">
                                <ReactMarkdown urlTransform={(url) => url} components={markdownComponents}>
                                  {articleBody.substring(0, 320) + '...'}
                                </ReactMarkdown>
                              </div>
                              
                              {/* Rich luxury premium micro-checkout card */}
                              <div className="relative pt-8 pb-10 px-6 sm:px-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-xl overflow-hidden mt-8 text-left">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 blur-[40px] rounded-full pointer-events-none" />
                                
                                <div className="flex items-center gap-4 border-b border-zinc-200/60 dark:border-zinc-800 pb-4">
                                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                    <Lock className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-mono uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-bold tracking-wider">
                                      PREMIUM ARTICLE BLOCK
                                    </span>
                                    <h3 className="font-serif font-extrabold text-base text-zinc-900 dark:text-white mt-1">
                                      Unlock: {activeArticle.title}
                                    </h3>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                  {/* Left: Benefits & Information */}
                                  <div className="md:col-span-5 space-y-3">
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                                      <span className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider">Single Article Price</span>
                                      <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-2xl font-serif font-black text-rose-500">{formattedPrice}</span>
                                        <span className="text-[10px] text-zinc-400">USD</span>
                                      </div>
                                    </div>

                                    <div className="text-[11px] text-zinc-500 space-y-2 leading-relaxed">
                                      <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                        You get lifetime access to this expert workflow:
                                      </p>
                                      <ul className="list-disc list-inside space-y-1">
                                        <li>Full readable PDF & workbook format</li>
                                        <li>Somatic stress relief activities inside</li>
                                        <li>Listen with high-vibe AI Speech reader</li>
                                        <li>Digital certificate & receipt details</li>
                                      </ul>
                                    </div>
                                    
                                    <hr className="border-dashed border-zinc-200 dark:border-zinc-800" />

                                    <div className="pt-1">
                                      <span className="text-[10px] text-zinc-400 block mb-1">OR JOIN THE PLATFORM:</span>
                                      <button
                                        type="button"
                                        onClick={() => navigateTo('pricing')}
                                        className="w-full text-left p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 hover:bg-rose-50/10 transition-all text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center justify-between cursor-pointer"
                                      >
                                        <span>Join full Premium Pass ($0.80/wk)</span>
                                        <span>➔</span>
                                      </button>
                                    </div>

                                    {/* WATCH SPONSOR AD OPTION */}
                                    <div className="pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-2">
                                      <span className="text-[10px] text-zinc-400 block mb-1">FREE TEMPORARY ACCESS:</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAdTarget({ type: 'article', id: activeArticle.id, title: activeArticle.title });
                                          setAdSecondsLeft(15);
                                          setAdStep('intro');
                                        }}
                                        className="w-full text-left p-2.5 rounded-xl border border-dashed border-rose-300 dark:border-rose-900/50 hover:bg-rose-50/10 hover:border-rose-500 transition-all text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center justify-between cursor-pointer bg-rose-50/5"
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <Play className="w-3 h-3 fill-current" />
                                          Watch Ad to Unlock for 3 Hrs
                                        </span>
                                        <span className="bg-rose-105 dark:bg-rose-955/40 px-1.5 py-0.5 rounded text-[8.5px] font-mono">15 Secs</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Right: Payment Gateways & Secure Form */}
                                  <div className="md:col-span-7 bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
                                    <div>
                                      <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-2">
                                        Choose Dollar-Supported & Local Gateways:
                                      </span>
                                      
                                      <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                                        <button
                                          type="button"
                                          onClick={() => setArticlePaymentPortal('stripe')}
                                          className={`py-1.5 rounded-lg text-[9px] font-mono tracking-tighter uppercase font-bold text-center cursor-pointer transition-all ${articlePaymentPortal === 'stripe' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                          Stripe (Global)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setArticlePaymentPortal('paystack')}
                                          className={`py-1.5 rounded-lg text-[9px] font-mono tracking-tighter uppercase font-bold text-center cursor-pointer transition-all ${articlePaymentPortal === 'paystack' ? 'bg-white dark:bg-zinc-900 text-[#3bb75e] shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                          Paystack (USD/NGN)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setArticlePaymentPortal('paypal')}
                                          className={`py-1.5 rounded-lg text-[9px] font-mono tracking-tighter uppercase font-bold text-center cursor-pointer transition-all ${articlePaymentPortal === 'paypal' ? 'bg-white dark:bg-zinc-900 text-[#003087] dark:text-[#0079C1] shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}
                                        >
                                          PayPal / Card
                                        </button>
                                      </div>
                                    </div>

                                    <form onSubmit={handleArticlePurchaseSubmit} className="space-y-3">
                                      <div className="space-y-1">
                                        <label htmlFor="hs-pay-1" className="text-[9px] uppercase font-mono text-zinc-450 block">Your Receipt Email</label>
                                        <input
                                          type="email"
                                          required
                                          id="hs-pay-1"
                                          value={payEmail}
                                          onChange={(e) => setPayEmail(e.target.value)}
                                          placeholder="you@domain.com"
                                          className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label htmlFor="hs-pay-2" className="text-[9px] uppercase font-mono text-zinc-450 block">Card Number</label>
                                        <input
                                          id="hs-pay-2"
                                          type="text"
                                          value={payCardNum}
                                          onChange={(e) => setPayCardNum(e.target.value)}
                                          placeholder="4242 4242 4242 4242"
                                          className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                          <label htmlFor="hs-pay-3" className="text-[9px] uppercase font-mono text-zinc-450 block">Expiry</label>
                                          <input
                                            id="hs-pay-3"
                                            type="text"
                                            value={payExpiry}
                                            onChange={(e) => setPayExpiry(e.target.value)}
                                            placeholder="MM/YY"
                                            className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500 text-center"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label htmlFor="hs-pay-4" className="text-[9px] uppercase font-mono text-zinc-450 block">CVV</label>
                                          <input
                                            id="hs-pay-4"
                                            type="password"
                                            value={payCvc}
                                            onChange={(e) => setPayCvc(e.target.value)}
                                            placeholder="123"
                                            className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500 text-center"
                                          />
                                        </div>
                                      </div>

                                      <button
                                        type="submit"
                                        disabled={isPayingArticle}
                                        className={`w-full py-2.5 mt-2 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                          articlePaymentPortal === 'paystack'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : articlePaymentPortal === 'paypal'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-rose-500 hover:bg-rose-600'
                                        }`}
                                      >
                                        {isPayingArticle ? (
                                          <span className="flex items-center gap-1.5">
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Authorizing via TLS Secure Pipeline...
                                          </span>
                                        ) : (
                                          <span>🔒 Securely Unlock with {articlePaymentPortal.toUpperCase()} ({formattedPrice})</span>
                                        )}
                                      </button>
                                      
                                      <p className="text-[9px] text-center text-zinc-400 mt-1.5 leading-snug">
                                        ✓ 256-Bit Encrypted Link • Refund Protection Guaranteed via Stripe Connect & Paystack Sandbox networks.
                                      </p>
                                    </form>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          /* Configurable typography wrapper styling */
                          <div 
                            style={{
                              fontFamily: siteSettings.article_font_family === 'DM Sans' ? '"DM Sans", sans-serif' :
                                          siteSettings.article_font_family === 'Plus Jakarta Sans' ? '"Plus Jakarta Sans", sans-serif' :
                                          siteSettings.article_font_family === 'Playfair Display' ? '"Playfair Display", Georgia, serif' :
                                          siteSettings.article_font_family === 'JetBrains Mono' ? '"JetBrains Mono", monospace' :
                                          '"Inter", sans-serif'
                            }}
                            className={`markdown-body prose dark:prose-invert ${bodyWidthClass}${bodyWidthClass !== 'max-w-none' ? ' mx-auto' : ''} text-zinc-850 dark:text-zinc-200 ${lineHeightClass} ${spacingClass} ${headingsClass} ${
                              siteSettings.article_font_size === 'sm' ? 'text-xs sm:text-sm' :
                              siteSettings.article_font_size === 'lg' ? 'text-sm sm:text-lg leading-extra-relaxed' :
                              siteSettings.article_font_size === 'xl' ? 'text-sm sm:text-xl leading-extra-relaxed' :
                              'text-sm sm:text-base'
                            }`}
                          >
                            <ArticleBodyWithInserts
                              content={articleBody}
                              inserts={siteSettings.article_inserts_enabled !== false ? activeArticle.in_article_inserts : undefined}
                              markdownComponents={markdownComponents}
                              promoArticles={promoPicks}
                              onOpenPromoArticle={(slug) => navigateTo('article', slug)}
                              crossPromoNodes={[
                                <CrossPromoSlot key="cp-mid" slotIndex={2} source="article_mid" />,
                                <CrossPromoSlot key="cp-end" slotIndex={3} source="article_end" />
                              ]}
                              className={`markdown-body prose dark:prose-invert ${bodyWidthClass}${bodyWidthClass !== 'max-w-none' ? ' mx-auto' : ''} text-zinc-850 dark:text-zinc-200 ${lineHeightClass} ${spacingClass} ${headingsClass} ${
                                siteSettings.article_font_size === 'sm' ? 'text-xs sm:text-sm' :
                                siteSettings.article_font_size === 'lg' ? 'text-sm sm:text-lg leading-extra-relaxed' :
                                siteSettings.article_font_size === 'xl' ? 'text-sm sm:text-xl leading-extra-relaxed' :
                                'text-sm sm:text-base'
                              }`}
                            />
                          </div>
                        );
                      })()}

                      {/* C. POST-LEVEL DYNAMIC NEWSLETTER SIGN-UP BOX */}
                      {siteSettings.article_newsletter_box_enabled !== false && (
                        <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-rose-50 to-zinc-50/60 dark:from-zinc-900/60 dark:to-zinc-950 border border-rose-100/30 dark:border-zinc-800 space-y-4">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500 font-bold block">Relationship Insights</span>
                          </div>
                          
                          <div className="space-y-1 font-sans">
                            <h4 className="font-serif font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                              {siteSettings.article_newsletter_title || "Nurture Your Relationship"}
                            </h4>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal max-w-xl">
                              {siteSettings.article_newsletter_desc || "Receive curated relationship and dating tips, emotional wellness insights, and healthy couples communication exercises every Tuesday."}
                            </p>
                          </div>

                          {!newsletterSubscribed ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (newsletterEmail.trim().includes('@')) {
                                  setNewsletterSubscribed(true);
                                  trackEvent('newsletter_signup', { location: 'article_end' });
                                }
                              }} 
                              className="flex gap-2 max-w-md"
                            >
                              <input 
                                type="email" 
                                required
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                aria-label="Email address for newsletter subscription"
                                placeholder="name@domain.com"
                                className="flex-1 p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs font-sans outline-none text-zinc-800 dark:text-zinc-200 focus:border-rose-300 focus:ring-1 focus:ring-rose-300"
                              />
                              <button 
                                type="submit"
                                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-sans text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
                              >
                                Join Letters
                              </button>
                            </form>
                          ) : (
                            <div className="p-3 bg-emerald-50/60 dark:bg-zinc-900/60 border border-emerald-100 dark:border-zinc-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              <strong className="font-sans">Subscription Verified! Look out for your first relationship diagnostic guide shortly.</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. PREMIUM POST FEEDBACK REVIEW COMPONENT (From Screenshot layout) */}
                      {(siteSettings.article_reaction_feedback_enabled ?? true) && (
                        <div className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-rose-100/35 dark:border-zinc-800 text-center space-y-6 max-w-md mx-auto my-6 font-sans relative overflow-hidden shadow-xs">
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-300 via-rose-300 to-emerald-300" />
                          <div className="space-y-1.5">
                            <h4 className="font-serif font-black text-xl text-zinc-950 dark:text-white leading-tight">
                              How did you like the article?
                            </h4>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-sans max-w-xs mx-auto">
                              Co-reflect on this therapeutic guide. Share anonymous emotional reaction ratings.
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-center gap-5 pt-1">
                            {[
                              { emoji: '😊', label: 'love' as const, title: 'Loved the guide' },
                              { emoji: '😐', label: 'insightful' as const, title: 'Found it insightful' },
                              { emoji: '🙁', label: 'support' as const, title: 'Felt challenging' }
                            ].map((item) => (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => {
                                  handleReaction(activeArticle.id, item.label);
                                }}
                                className="w-13 h-13 rounded-full border border-zinc-200/50 dark:border-zinc-800 bg-[#FFFFFF] dark:bg-zinc-900 hover:border-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center text-2xl transition-all cursor-pointer active:scale-95 relative group shadow-xs select-none"
                                title={item.title}
                              >
                                <span>{item.emoji}</span>
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-zinc-900 text-white text-[9px] font-sans font-bold px-1.5 py-0.5 rounded leading-none transition-transform pointer-events-none whitespace-nowrap z-50 animate-fade-in">
                                  {activeArticle.reactions?.[item.label] || 0}
                                </span>
                              </button>
                            ))}
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                showToast("Diagnostic feedback stored. Thank you for your review.");
                              }}
                              className="w-full sm:w-auto px-7 py-2.5 bg-zinc-950 dark:bg-zinc-100 hover:scale-[1.01] active:scale-[0.98] text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center justify-center"
                            >
                              Submit Review
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Topic Tag Registry (article_meta_tags_enabled) */}
                      {siteSettings.article_meta_tags_enabled === true && (activeArticle.tags?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Topics</span>
                          {activeArticle.tags.slice(0, 8).map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/60 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                              #{String(tag).replace(/\s+/g, '-').toLowerCase()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* TikTok follow card - placed at the end of the
                          article body: the reader has just finished, the
                          highest-intent moment to convert them into a
                          follower. Quiet, on-brand, dismissible by scroll. */}
                      {(() => {
                        const tiktokUrl = siteSettings.social_tiktok_url || (siteSettings.social_links as any)?.tiktok || 'https://www.tiktok.com/@heartsync12';
                        if (siteSettings.article_tiktok_cta_enabled === false) return null;
                        return (
                          <a
                            href={tiktokUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('engage_tiktok', { location: 'article_end' })}
                            className="mt-10 mb-2 group flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-rose-50 to-zinc-50 dark:from-rose-950/20 dark:to-zinc-900/60 p-5 sm:p-6 transition-all hover:border-rose-300 dark:hover:border-rose-500/40 hover:shadow-md cursor-pointer"
                            aria-label="Follow Heartsync on TikTok"
                          >
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 transition-transform group-hover:scale-105">
                              <Music2 className="h-5 w-5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                                Keep the spark alive
                              </span>
                              <span className="mt-1 block font-serif text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Follow @heartsync12 on TikTok
                              </span>
                              <span className="mt-0.5 block text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                                Daily relationship insights, couple challenges and real talk about modern love.
                              </span>
                            </span>
                          </a>
                        );
                      })()}

                      {/* Previous / Next Article Navigation  - Frelux-style */}
                      {(() => {
                        if (siteSettings.article_prev_next_nav_enabled === false) return null;
                        const sorted = [...publishedArticles].sort((a, b) =>
                          new Date(a.publish_date || 0).getTime() -
                          new Date(b.publish_date || 0).getTime());
                        const idx = sorted.findIndex(a => a.id === activeArticle.id);
                        if (idx === -1 || sorted.length < 2) return null;
                        const prev = idx > 0 ? sorted[idx - 1] : null;
                        const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
                        if (!prev && !next) return null;
                        const go = (slugOrId: string) => {
                          navigateTo('article', slugOrId);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        };
                        const cardCls = "group flex-1 min-w-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 text-left transition-all hover:border-rose-300 dark:hover:border-rose-500/40 hover:shadow-md";
                        return (
                          <div className="flex flex-col sm:flex-row items-stretch gap-4">
                            {prev ? (
                              <button onClick={() => go(prev.slug || prev.id)} className={cardCls}>
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                                </span>
                                <span className="mt-2 block truncate font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                  {prev.title}
                                </span>
                              </button>
                            ) : <div className="flex-1 hidden sm:block" />}
                            {next ? (
                              <button onClick={() => go(next.slug || next.id)} className={`${cardCls} sm:text-right`}>
                                <span className="flex sm:justify-end items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                  Next <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                                <span className="mt-2 block truncate font-serif text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                  {next.title}
                                </span>
                              </button>
                            ) : <div className="flex-1 hidden sm:block" />}
                          </div>
                        );
                      })()}

                      {/* Related Content Auto-Injected Block (or in sidebar per article_desktop_related_placement) */}
                      {siteSettings.article_related_carousel_enabled !== false && !relatedInSidebar && (
                      <RelatedContentBlock 
                        currentPost={activeArticle}
                        onNavigate={(tab, arg) => {
                          setCurrentTab(tab as any);
                          setTabArg(arg || '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onPostClick={(post) => {
                          setActiveArticle(post);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                      )}

                      {/* Article-bottom ad slot (Google AdSense, lazy) */}
                      <AdPlacement slot="article_bottom" className="my-8" lazy />

                      {/* INTERACTIVE COMPREHENSION QUIZ CHALLENGE */}
                      {(() => {
                        const activeQuiz = (heartsync.quizzes || []).find(q => q.articleId === activeArticle.id);
                        if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) return null;

                        return (
                          <div id={`quiz-widget-${activeQuiz.id}`} className="p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 space-y-6 my-8 font-sans max-w-2xl mx-auto shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-400 via-rose-350 to-amber-300" />
                            
                            <div className="flex justify-between items-center border-b pb-3.5">
                              <div className="flex items-center gap-1.5 animate-fade-in">
                                <HelpCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">Interactive Insight Challenge</span>
                              </div>
                              <span className="text-[10px] text-rose-600 dark:text-rose-450 font-mono font-bold bg-rose-50 dark:bg-zinc-855 p-1 px-2.5 rounded-lg leading-none">
                                {quizSessionFinished ? 'Completed' : `Step ${activeQuizIndex + 1} of ${activeQuiz.questions.length}`}
                              </span>
                            </div>

                            {!quizSessionFinished ? (
                              <div className="space-y-5">
                                <div className="space-y-1.5">
                                  <h4 className="font-serif font-black text-lg text-zinc-950 dark:text-white leading-snug">
                                    {activeQuiz.questions[activeQuizIndex].question}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Select the option that aligns with your therapeutic self-awareness:</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                  {activeQuiz.questions[activeQuizIndex].options.map((option: string, idx: number) => {
                                    const isSelected = selectedAnswerIndex === idx;
                                    const isCorrect = activeQuiz.questions[activeQuizIndex].correctAnswerIndex === idx;
                                    
                                    let btnStyle = "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-955/20 dark:hover:bg-zinc-955/40 border border-zinc-150 dark:border-zinc-850 text-zinc-850 dark:text-zinc-200";
                                    if (isSelected && !quizAnswerSubmitted) {
                                      btnStyle = "bg-rose-50/70 border-rose-300 text-rose-800 dark:bg-rose-955/25 dark:border-rose-900 dark:text-rose-200";
                                    } else if (quizAnswerSubmitted) {
                                      if (isCorrect) {
                                        btnStyle = "bg-emerald-50 border-emerald-350 text-emerald-800 dark:bg-emerald-950/25 dark:border-emerald-900 dark:text-emerald-200";
                                      } else if (isSelected) {
                                        btnStyle = "bg-rose-50 border-rose-350 text-rose-800 dark:bg-rose-950/25 dark:border-rose-900 dark:text-rose-200 opacity-90";
                                      } else {
                                        btnStyle = "bg-zinc-50 dark:bg-zinc-950/10 border-zinc-100 dark:border-zinc-850 text-zinc-400 dark:text-zinc-650 opacity-60";
                                      }
                                    }

                                    return (
                                      <button
                                        id={`quiz-opt-${idx}`}
                                        key={idx}
                                        type="button"
                                        disabled={quizAnswerSubmitted}
                                        onClick={() => setSelectedAnswerIndex(idx)}
                                        className={`p-3.5 px-4 rounded-2xl border text-left text-xs font-bold leading-relaxed cursor-pointer transition-all flex items-start gap-4 ${btnStyle}`}
                                      >
                                        <span className="p-1 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border text-[10px] font-mono leading-none">
                                          {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 pt-0.5">{option}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {quizAnswerSubmitted && (
                                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/25 border text-xs leading-relaxed space-y-2">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      {selectedAnswerIndex === activeQuiz.questions[activeQuizIndex].correctAnswerIndex ? (
                                        <span className="text-emerald-600 font-mono">✓ Correct Reflection</span>
                                      ) : (
                                        <span className="text-rose-500 font-mono">✗ Incorrect Calibration</span>
                                      )}
                                    </div>
                                    <p className="text-zinc-600 dark:text-zinc-400 italic">
                                      {activeQuiz.questions[activeQuizIndex].explanation || "Reflect on this solution as part of your comprehensive connection journey."}
                                    </p>
                                  </motion.div>
                                )}

                                <div className="pt-2 flex justify-end">
                                  {!quizAnswerSubmitted ? (
                                    <button
                                      id="quiz-submit-btn"
                                      type="button"
                                      disabled={selectedAnswerIndex === null}
                                      onClick={() => {
                                        setQuizAnswerSubmitted(true);
                                        if (selectedAnswerIndex === activeQuiz.questions[activeQuizIndex].correctAnswerIndex) {
                                          setQuizScore(quizScore + 1);
                                        }
                                      }}
                                      className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-850 disabled:text-zinc-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                                    >
                                      Submit Answer
                                    </button>
                                  ) : (
                                    <button
                                      id="quiz-next-btn"
                                      type="button"
                                      onClick={() => {
                                        if (activeQuizIndex + 1 < activeQuiz.questions.length) {
                                          setActiveQuizIndex(activeQuizIndex + 1);
                                          setSelectedAnswerIndex(null);
                                          setQuizAnswerSubmitted(false);
                                        } else {
                                          setQuizSessionFinished(true);
                                        }
                                      }}
                                      className="px-6 py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                                    >
                                      {activeQuizIndex + 1 < activeQuiz.questions.length ? 'Next Question' : 'Finish Challenge'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 pt-2">
                                <div className="space-y-1.5">
                                  <h4 className="font-serif font-black text-2xl text-rose-500 leading-tight">Insight Challenge Completed!</h4>
                                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    Your Score: <span className="text-rose-500">{quizScore}</span> / {activeQuiz.questions.length} Correct
                                  </p>
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto">
                                    {quizScore === activeQuiz.questions.length 
                                      ? "Prismatic mastery! Your emotional calibration and theory comprehension is completely secure."
                                      : "Wonderful reflection. Connection is an iterative loop of growth and calibration."}
                                  </p>
                                </div>

                                <div className="pt-2">
                                  <button
                                    id="quiz-retry-btn"
                                    type="button"
                                    onClick={() => {
                                      setActiveQuizIndex(0);
                                      setSelectedAnswerIndex(null);
                                      setQuizAnswerSubmitted(false);
                                      setQuizScore(0);
                                      setQuizSessionFinished(false);
                                    }}
                                    className="px-7 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
                                  >
                                    Try Challenge Again
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Threaded Nested Comments Frame */}
                      {activeArticle.allow_comments && siteSettings.article_comments_enabled !== false && (
                        <div className="space-y-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                          <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-rose-500" />
                            Relational Reflection Desk
                          </h3>

                          {/* Comment submission form */}
                          <form onSubmit={(e) => submitComment(e, activeArticle.id)} className="p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-850 space-y-3.5 dark:neon-card">
                            <span className="text-[10px] font-bold text-zinc-400 block uppercase font-mono">Draft Reflection Statement</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in">
                              <input 
                                type="text" 
                                aria-label="Display name (optional)"
                                placeholder="My Display Name (Optional)" 
                                value={commentAuthorName}
                                onChange={(e) => setCommentAuthorName(e.target.value)}
                                className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-sans outline-none text-zinc-800 dark:text-zinc-200 focus:border-rose-300 dark:neon-input"
                              />
                              <input 
                                type="email" 
                                aria-label="Email address (kept private, never published)"
                                placeholder="My Email (Secure, unpublished)" 
                                value={commentAuthorEmail}
                                onChange={(e) => setCommentAuthorEmail(e.target.value)}
                                className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-sans outline-none text-zinc-800 dark:text-zinc-200 focus:border-rose-300 dark:neon-input"
                              />
                            </div>
                            <textarea 
                              rows={3}
                              aria-label="Your reflection statement"
                              placeholder="Share your personal reflection, diagnostic perspective, or warm question respectfully..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-sans outline-none text-zinc-800 dark:text-zinc-200 focus:border-rose-300 resize-none dark:neon-input"
                            />
                            <button 
                              type="submit"
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-sans text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ml-auto block dark:neon-button-rose"
                            >
                              Submit Reflection Statement
                            </button>
                          </form>

                          {/* Listed approvals */}
                          <div className="space-y-4">
                            {comments.filter(c => c.post_id === activeArticle.id && c.is_approved).map(comment => (
                              <div key={comment.id} className="p-4 bg-zinc-50/60 dark:bg-zinc-900/30 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex gap-3 font-sans text-left dark:neon-card-cyan">
                                <img 
                                  src={comment.user_avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(comment.user_name)}`} 
                                  alt={comment.user_name} 
                                  className="w-9 h-9 rounded-full object-cover shrink-0 animate-fade-in" 
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/micah/svg?seed=${comment.user_name}`;
                                  }}
                                />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <strong className="text-xs text-zinc-850 dark:text-zinc-200">{comment.user_name}</strong>
                                    <span className="text-[9px] font-mono text-zinc-400">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                        </div>
                      )}

                    </div>

                     {/* C. RIGHT POSITIONED ADVANCED SIDEBAR WIDGETS */}
                     {showRightSidebar && (
                       <aside className="space-y-6 relative lg:col-span-1">

                      {siteSettings.sidebar_widgets && siteSettings.sidebar_widgets.length > 0 ? (
                        siteSettings.sidebar_widgets.filter(w => w.is_active).map(w => {
                          if (w.type === 'author') {
                            const articleAuthor = getAuthors().find(a => a.id === activeArticle.author_id) || getAuthors()[0];
                            const spotlight = (articleAuthor || { id: activeArticle.author_id || 'editorial', name: 'Editorial Board', role_tag: 'Editorial Staff', bio: 'Heartsync Editorial Team', avatar_url: '' }) as any;
                            return (
                              <div key={w.id} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150/40 dark:border-zinc-805 text-center space-y-4 font-sans border-dashed">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block pb-1 border-b border-zinc-50 dark:border-zinc-800">
                                  {w.title}
                                </span>
                                <img 
                                  src={spotlight.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                                  alt="Spotlight Editor"
                                  className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-rose-300/30" 
                                />
                                <div>
                                  <h4 className="font-bold text-sm text-zinc-855 dark:text-zinc-100">{spotlight.name}</h4>
                                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">{spotlight.role_tag || spotlight.role || 'Contributor'}</p>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-xs mx-auto">
                                  {w.content_text || spotlight.bio}
                                </p>
                                <button 
                                  type="button"
                                  onClick={() => navigateTo('author', spotlight.id)}
                                  className="text-[10px] font-sans font-bold text-rose-600 dark:text-rose-400 hover:underline inline-block block mt-1 cursor-pointer"
                                >
                                  Browse Archives
                                </button>
                              </div>
                            );
                          }

                          if (w.type === 'links' && w.custom_links) {
                            return (
                              <div key={w.id} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150/40 dark:border-zinc-805 space-y-3 font-sans text-xs">
                                <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] pb-1 border-b border-zinc-50 dark:border-zinc-800">{w.title}</h4>
                                <ul className="space-y-2 text-zinc-650 dark:text-zinc-350">
                                  {w.custom_links.map((link, idx) => (
                                    <li 
                                      key={idx} 
                                      onClick={() => navigateTo(link.tab as any, link.arg)}
                                      className="flex gap-2 items-center hover:text-rose-500 cursor-pointer text-left font-sans"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-450 shrink-0" />
                                      <span className="transition-colors hover:underline">{link.label}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }

                          if (w.type === 'custom_html') {
                            return (
                              <div key={w.id} className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150/40 dark:border-zinc-800 space-y-2.5 font-sans">
                                <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] pb-1 border-b border-zinc-50 dark:border-zinc-800">{w.title}</h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap block text-left">
                                  {w.content_text}
                                </p>
                              </div>
                            );
                          }

                          return null;
                        })
                      ) : (
                        <>
                          {/* Original Static Sidebar Items */}
                          {(() => {
                            const activeAuthor = getAuthors().find(a => a.id === activeArticle.author_id) || getAuthors()[0];
                            if (!activeAuthor) return null;
                            return (
                              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150/40 dark:border-zinc-800 text-center space-y-4 font-sans">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block pb-1 border-b border-zinc-50 dark:border-zinc-800 animate-pulse">
                                  Editorial Spotlight Author
                                </span>
                                <img 
                                  src={activeAuthor.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} 
                                  alt="Spotlight Editor"
                                  className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-rose-300/30" 
                                />
                                <div>
                                  <h4 className="font-bold text-sm text-zinc-850 dark:text-zinc-100">{activeAuthor.name}</h4>
                                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wide">{activeAuthor.role_tag || activeAuthor.role || 'Contributor'}</p>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-xs mx-auto">
                                  {activeAuthor.bio}
                                </p>
                                <button 
                                  onClick={() => navigateTo('author', activeAuthor.id)}
                                  className="text-[10px] font-sans font-bold text-rose-600 dark:text-rose-400 hover:underline inline-block block mt-1 cursor-pointer"
                                >
                                  Browse {activeAuthor.name.split(' ')[0]}'s Archives
                                </button>
                              </div>
                            );
                          })()}

                          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150/40 dark:border-zinc-800 space-y-3 font-sans text-xs">
                            <h4 className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] block pb-1 border-b border-zinc-50 dark:border-zinc-800">Table of Connections</h4>
                            <ul className="space-y-2 text-zinc-650 dark:text-zinc-350 text-left">
                              <li
                                className="flex gap-2 items-center hover:text-rose-500 cursor-pointer"
                                title="Read: The Triad of Relationship Attachment Styles"
                                onClick={() => {
                                  const target = posts.find(p => p.status === 'published' && p.title === 'The Triad of Relationship Attachment Styles');
                                  if (target) navigateTo('article', target.slug);
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                <span>The Triad of Relationship Attachment Styles</span>
                              </li>
                            </ul>
                          </div>
                        </>
                      )}

                      {/* Right Sidebar Ad Slot (Google AdSense 300x250, Monetag, Adsterra Native) */}
                      <AdPlacement slot="sidebar" className="mt-4" />

                    </aside>
                     )}
                  </div>
                  );
                })()}

                  {/* 5. STICKY MOBILE SOCIAL SHARE DOCK (COLLAPSED AT THE BOTTOM OF PORT FOR SMOOTH REACH WHILE TOUCH SCROLLING) */}
                  {/* Portalled to document.body for the same reason as the reading-progress bar
                      above: the page-transition wrapper's `transform: translateZ(0)` creates a new
                      containing block for `position: fixed` descendants, which made this dock fixed
                      relative to the animated page wrapper instead of the viewport -- so it scrolled
                      away with the article instead of staying pinned to the bottom of the screen. */}
                  {showMobileDock && createPortal(
                  <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200/80 dark:border-zinc-850 p-1 z-40 flex items-center justify-around md:hidden shadow-2xl backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => navigateTo('articles')}
                      className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-500 cursor-pointer flex flex-col items-center gap-0.5"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-wider">Back</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(window.location.href);
                          setCopyFeedbackToast(true);
                          setTimeout(() => setCopyFeedbackToast(false), 2000);
                        } catch (_) {}
                      }}
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 cursor-pointer relative flex flex-col items-center gap-0.5"
                    >
                      <LinkIcon className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-wider">Copy URL</span>
                      {copyFeedbackToast && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                    </button>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 flex flex-col items-center gap-0.5"
                    >
                      <Facebook className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-wider">Share</span>
                    </a>

                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activeArticle.title)}&url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 flex flex-col items-center gap-0.5"
                    >
                      <Twitter className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-wider">Post</span>
                    </a>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${activeArticle.title} ${window.location.href}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 flex flex-col items-center gap-0.5"
                    >
                      <Send className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-wider">Send</span>
                    </a>
                  </div>,
                  document.body
                  )}

                  {/* Floating share bubble (article_mobile_share_style = floating) */}
                  {mobileShareStyle === 'floating' && siteSettings.article_mobile_sticky_actions !== false && createPortal(
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          if (navigator.share) {
                            navigator.share({ title: activeArticle.title, url: window.location.href });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            setCopyFeedbackToast(true);
                            setTimeout(() => setCopyFeedbackToast(false), 2000);
                          }
                        } catch (_) {}
                      }}
                      className="fixed bottom-20 right-4 z-40 md:hidden w-12 h-12 rounded-full bg-rose-600 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                      aria-label="Share article"
                    >
                      <Send className="w-5 h-5" />
                    </button>,
                    document.body
                  )}

                </div>
                </div>

                {showArtSidebar && (
                <div className={`col-span-12 ${sidebarSpanClass} ${sidebarLeft ? 'lg:order-1 lg:pr-6 lg:border-r' : 'lg:order-2 lg:pl-6 lg:border-l'} border-t lg:border-t-0 border-rose-100/30 dark:border-zinc-850 pt-8 lg:pt-0`}>
                  <div className={siteSettings.article_desktop_sidebar_sticky ? 'lg:sticky lg:top-24' : ''}>
                    {relatedInSidebar && siteSettings.article_related_carousel_enabled !== false && (
                      <div className="mb-6">
                      {/* Related Content Auto-Injected Block */}
                      <RelatedContentBlock 
                        currentPost={activeArticle}
                        onNavigate={(tab, arg) => {
                          setCurrentTab(tab as any);
                          setTabArg(arg || '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onPostClick={(post) => {
                          setActiveArticle(post);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      />
                      </div>
                    )}
                    {renderSidebar()}
                  </div>
                </div>
                )}
              </div>
              );

}
