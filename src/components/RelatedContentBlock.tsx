import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Post, Category } from '../types';
import { heartsync } from '../store';
import { BookOpen, Calendar, HelpCircle, Eye, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface RelatedContentBlockProps {
  currentPost: Post;
  onNavigate: (tab: string, arg?: string) => void;
  onPostClick: (post: Post) => void;
}

// Global cache to optimize lookup performance across views
const relatedPostsCache = new Map<string, Post[]>();

export default function RelatedContentBlock({ currentPost, onNavigate, onPostClick }: RelatedContentBlockProps) {
  const [siteSettings, setSiteSettings] = useState(heartsync.site_settings);
  const [categories, setCategories] = useState(heartsync.categories);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const unsubscribe = heartsync.subscribe(() => {
      setSiteSettings({ ...heartsync.site_settings });
      setCategories([...heartsync.categories]);
    });
    return unsubscribe;
  }, []);

  // Determine configuration settings based on active theme/SaaS configuration
  const isEnabled = siteSettings.related_block_enabled !== false;
  const blockTitle = siteSettings.related_block_title || 'You may also like';
  const blockCount = siteSettings.related_block_count || 3;
  const layoutStyle = siteSettings.related_block_style || 'grid';

  // Compute related articles securely with caching built-in
  const relatedPosts = useMemo(() => {
    if (!isEnabled || !currentPost) return [];

    const cacheKey = `${currentPost.id}-${blockCount}-${heartsync.posts.length}`;
    if (relatedPostsCache.has(cacheKey)) {
      return relatedPostsCache.get(cacheKey) || [];
    }

    const allPosts = heartsync.posts.filter(p => p.id !== currentPost.id && p.status === 'published');
    
    // Score based on similarity algorithms (same category id, overlapping tags)
    const scored = allPosts.map(p => {
      let score = 0;
      
      // Category match yields primary points
      if (p.category_id === currentPost.category_id) {
        score += 15;
      }

      // Tag similarity yields supplemental points
      if (p.tags && currentPost.tags) {
        const common = p.tags.filter(t => currentPost.tags.includes(t));
        score += common.length * 5;
      }

      // Recency tie-breaker
      const ageTimestamp = new Date(p.publish_date).getTime();

      return { post: p, score, ageTimestamp };
    });

    // Sort by descending score first, then recency
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.ageTimestamp - a.ageTimestamp;
    });

    const result = scored.slice(0, blockCount).map(item => item.post);
    relatedPostsCache.set(cacheKey, result);
    return result;
  }, [currentPost, isEnabled, blockCount, siteSettings]);

  if (!isEnabled || relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12 pt-10 border-t border-zinc-100 dark:border-zinc-800/80">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="font-sans font-bold text-xl sm:text-2xl text-zinc-900 dark:text-zinc-100 tracking-tight">
              {blockTitle}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-sans">
            Hand-selected publications and expert guidelines specifically tailored to support somatic grounding and relationship growth.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          <BookOpen className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Editor's Selection</span>
        </div>
      </div>

      {layoutStyle === 'carousel' ? (
        /* Polished Horizontal Scroll on Mobile, Flex on Desktop */
        <div className="relative group/carousel">
          {/* Slide left button */}
          <button
            type="button"
            onClick={() => scrollCarousel('left')}
            aria-label="Scroll Carousel Left"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-200 shadow-lg hover:text-rose-500 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          {/* Slide right button */}
          <button
            type="button"
            onClick={() => scrollCarousel('right')}
            aria-label="Scroll Carousel Right"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-200 shadow-lg hover:text-rose-500 hover:scale-105 transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div 
            ref={carouselRef}
            className="flex overflow-x-auto snap-x snap-mandatory pb-4 gap-5 -mx-4 px-4 scrollbar-none scroll-smooth"
          >
            {relatedPosts.map((post) => {
              const matchedCat = categories.find(c => c.id === post.category_id);
              return (
                <div 
                  key={post.id} 
                  className="min-w-[280px] sm:min-w-[320px] max-w-[360px] snap-start shrink-0 flex-1"
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    onClick={() => onPostClick(post)}
                    className="group bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-900 overflow-hidden cursor-pointer flex flex-col h-full hover:border-rose-200/70 dark:hover:border-rose-950/40 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                      <img 
                        src={post.featured_image || undefined} 
                        alt={post.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {matchedCat && (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('category', matchedCat.slug);
                          }}
                          className="absolute top-3 left-3 text-[9px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ backgroundColor: matchedCat.color }}
                        >
                          {matchedCat.name}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3 text-[9px] font-mono uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{post.read_time} Min</span>
                          <span>•</span>
                          <span>{new Date(post.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <h4 className="font-sans font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-tight">
                          {post.title}
                        </h4>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-50 dark:border-zinc-900/60 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="group-hover:text-rose-500 transition-colors flex items-center gap-1">Read Article <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /></span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      ) : layoutStyle === 'list' ? (
        /* High-Density Minimalist Stack Row layout style */
        <div className="grid grid-cols-1 gap-3.5">
          {relatedPosts.map((post) => {
            const matchedCat = categories.find(c => c.id === post.category_id);
            return (
              <motion.div
                key={post.id}
                whileHover={{ x: 6 }}
                onClick={() => onPostClick(post)}
                className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/65 dark:border-zinc-900 cursor-pointer hover:border-rose-150/80 dark:hover:border-rose-955/40 hover:shadow-sm transition-all duration-300"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {matchedCat && (
                    <span 
                      className="text-[8px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                      style={{ backgroundColor: matchedCat.color }}
                    >
                      {matchedCat.name}
                    </span>
                  )}
                  <h4 className="font-sans font-bold text-xs sm:text-sm text-zinc-905 dark:text-zinc-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors truncate">
                    {post.title}
                  </h4>
                </div>
                <div className="flex items-center gap-3.5 shrink-0 text-xs font-mono text-zinc-400 dark:text-zinc-500">
                  <span className="hidden sm:inline">{new Date(post.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {post.read_time}m</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-350 dark:text-zinc-650 group-hover:text-rose-500 transition-all group-hover:translate-x-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : layoutStyle === 'list_details' ? (
        /* Premium List view with structural Left-aligned image & Excerpts details */
        <div className="grid grid-cols-1 gap-4.5">
          {relatedPosts.map((post) => {
            const matchedCat = categories.find(c => c.id === post.category_id);
            return (
              <motion.div
                key={post.id}
                whileHover={{ x: 4 }}
                onClick={() => onPostClick(post)}
                className="group flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-900 cursor-pointer hover:border-rose-150 dark:hover:border-rose-955/40 hover:shadow-md transition-all duration-300 animate-fade-in"
              >
                <div className="relative w-full sm:w-36 md:w-44 aspect-video sm:aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850">
                  <img 
                    src={post.featured_image || undefined} 
                    alt={post.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {matchedCat && (
                    <span 
                      className="absolute top-2 left-2 text-[8px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ backgroundColor: matchedCat.color }}
                    >
                      {matchedCat.name}
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 text-[9px] font-mono tracking-wide uppercase text-zinc-400 dark:text-zinc-550">
                      <span>{new Date(post.publish_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {post.read_time} Min read</span>
                    </div>
                    <h4 className="font-sans font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-1 leading-snug">
                      {post.title}
                    </h4>
                    <p className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    <span className="group-hover:text-rose-500 transition-colors flex items-center gap-1 font-semibold">Read Blueprint Alignment &rarr;</span>
                    <span className="flex items-center gap-3">
                       <span>Likes: {post.likes}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* High-Density Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {relatedPosts.map((post) => {
            const matchedCat = categories.find(c => c.id === post.category_id);
            return (
              <motion.article
                key={post.id}
                whileHover={{ y: -5 }}
                onClick={() => onPostClick(post)}
                className="group bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-110 dark:border-zinc-900 overflow-hidden cursor-pointer flex flex-col h-full hover:border-rose-100 dark:hover:border-rose-950 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                  <img 
                    src={post.featured_image || undefined} 
                    alt={post.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {matchedCat && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('category', matchedCat.slug);
                      }}
                      className="absolute top-3 left-3 text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest"
                      style={{ backgroundColor: matchedCat.color }}
                    >
                      {matchedCat.name}
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 text-[9px] font-mono uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                      <span className="flex items-center gap-1"><BookOpen className="w-3" />{post.read_time} Min Read</span>
                      <span>•</span>
                      <span>{new Date(post.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <h4 className="font-sans font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h4>
                    <p className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-normal">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="group-hover:text-rose-500 transition-colors flex items-center gap-1">Read Article <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
