import React, { useState, useEffect } from 'react';
import { Post, Category } from '../types';
import { heartsync } from '../store';
import { Heart, Bookmark, Eye, BookOpen, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { HeartsyncImage } from './LoadingSystem';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MotionCard = motion(Card);

interface BlogCardProps {
  post: Post;
  onClick: () => void;
  onNavigate: (tab: string, arg?: string) => void;
  layout?: 'vertical' | 'horizontal';
}

export default function BlogCard({ post, onClick, onNavigate, layout = 'vertical' }: BlogCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(heartsync.bookmarks.includes(post.id));
  const [likesCount, setLikesCount] = useState(post.likes);
  const [category, setCategory] = useState<Category | undefined>(
    heartsync.categories.find(c => c.id === post.category_id)
  );

  useEffect(() => {
    const unsubscribe = heartsync.subscribe(() => {
      setIsBookmarked(heartsync.bookmarks.includes(post.id));
      const updatedPost = heartsync.posts.find(p => p.id === post.id);
      if (updatedPost) {
        setLikesCount(updatedPost.likes);
        setCategory(heartsync.categories.find(c => c.id === updatedPost.category_id));
      }
    });
    return unsubscribe;
  }, [post.id]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    heartsync.toggleBookmark(post.id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    heartsync.likePost(post.id);
  };

  const cardStyleSetting = heartsync.site_settings.card_style || 'standard';

  const styleClasses = {
    standard: "bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-500/40 dark:hover:shadow-[0_0_30px_-8px_rgba(244,63,94,0.35)] hover:shadow-lg transition-all duration-300",
    minimal: "bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-900 dark:hover:border-rose-500/25 transition-all duration-300",
    glass: "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 dark:hover:border-rose-500/35 dark:hover:shadow-[0_0_30px_-8px_rgba(244,63,94,0.35)] shadow-sm transition-all duration-300",
    borderless: "bg-transparent rounded-none border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 transition-all duration-300"
  };

  const activeCardClass = styleClasses[cardStyleSetting as keyof typeof styleClasses] || styleClasses.standard;

  if (layout === 'horizontal') {
    return (
      <MotionCard 
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-30px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4 }}
        onClick={onClick}
        className={`group flex flex-col md:flex-row h-full overflow-hidden cursor-pointer transition-all duration-300 ${activeCardClass}`}
      >
        {/* Content body on the left, stacked on mobile */}
        <div className="p-5 flex-1 flex flex-col justify-between order-2 md:order-1">
          <div className="space-y-2">
            {/* Category Label */}
            {category && (
              <div className="flex items-center gap-1.5">
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('category', category.slug);
                  }}
                  className="text-[10px] sm:text-[11px] font-sans font-extrabold uppercase tracking-widest text-[#CE2B5E] hover:underline inline-flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 dark:shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                    style={{ backgroundColor: category.color || '#CE2B5E' }}
                    aria-hidden="true"
                  />
                  {category.name}
                </span>
              </div>
            )}

            <h3 className="font-sans font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>

            <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          {/* Author/Date Row */}
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60 select-none">
            {(() => {
              const author = heartsync.authors.find(a => a.id === post.author_id) || {
                name: 'Elena Voss',
                avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'
              };
              const avatarUrl = (author as any).avatar_url || (author as any).avatar;
              return (
                <>
                  <img 
                    src={avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'} 
                    alt={author.name}
                    className="w-5 h-5 rounded-full object-cover border border-zinc-100 dark:border-zinc-800"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100';
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-1 text-[9px] sm:text-[10px] font-sans text-zinc-500 dark:text-zinc-400 font-medium">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{author.name}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span>{post.read_time} min read</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Image Frame on the right, top on mobile */}
        <div className="relative w-full md:w-[150px] lg:w-[180px] shrink-0 aspect-video md:aspect-auto bg-zinc-100 dark:bg-zinc-800 overflow-hidden order-1 md:order-2">
          <HeartsyncImage 
            src={post.featured_image || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600'} 
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600';
            }}
          />
          {category && (
            <Badge 
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('category', category.slug);
              }}
              className="absolute top-3 left-3 z-10 text-[8px] font-sans font-bold uppercase tracking-wider text-white shadow-sm hover:scale-105 transition-transform border-none cursor-pointer md:hidden"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </Badge>
          )}
          {(post.is_premium || post.access_level === 'premium' || post.access_level === 'gold' || post.access_level === 'platinum') && (
            <Badge className="absolute bottom-3 left-3 z-10 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-sans font-bold text-[7px] tracking-widest uppercase border-none">
              GOLD
            </Badge>
          )}
          {/* Floating Bookmark Trigger */}
          <button 
            onClick={handleBookmark}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xs flex items-center justify-center text-zinc-500 hover:text-rose-500 dark:text-zinc-400 active:scale-90 transition-transform shadow-md"
            title={isBookmarked ? "Delete Archive" : "Save Archive"}
          >
            <Bookmark fill={isBookmarked ? '#F43F5E' : 'none'} className={`w-3.5 h-3.5 ${isBookmarked ? 'text-rose-500' : ''}`} />
          </button>
        </div>
      </MotionCard>
    );
  }

  return (
    <MotionCard 
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      className={`group flex flex-col h-full overflow-hidden cursor-pointer transition-all duration-300 ${activeCardClass}`}
    >
      {/* Featured Image Frame */}
      <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <HeartsyncImage 
          src={post.featured_image || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600'} 
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // Soft abstract placeholder if image URL fails
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600';
          }}
        />
        
        {/* Category Bag over Image */}
        {category && (
          <Badge 
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('category', category.slug);
            }}
            className="absolute top-4 left-4 z-10 text-[10px] font-sans font-bold uppercase tracking-wider text-white shadow-sm hover:scale-105 transition-transform border-none cursor-pointer"
            style={{ backgroundColor: category.color }}
          >
            {category.name}
          </Badge>
        )}

        {(post.is_premium || post.access_level === 'premium' || post.access_level === 'gold' || post.access_level === 'platinum') && (
          <Badge className="absolute bottom-4 left-4 z-10 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-sans font-bold text-[8px] tracking-widest uppercase border-none">
            GOLD RESERVE
          </Badge>
        )}

        {/* Floating Bookmark Trigger */}
        <button 
          onClick={handleBookmark}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xs flex items-center justify-center text-zinc-500 hover:text-rose-500 dark:text-zinc-400 active:scale-90 transition-transform shadow-md"
          title={isBookmarked ? "Delete Archive" : "Save Archive"}
        >
          <Bookmark fill={isBookmarked ? '#F43F5E' : 'none'} className={`w-4.5 h-4.5 ${isBookmarked ? 'text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Card Information body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Category Label above Title */}
          {category && (
            <div className="flex items-center gap-1.5">
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('category', category.slug);
                }}
                className="text-[10px] sm:text-[11px] font-sans font-extrabold uppercase tracking-widest text-[#CE2B5E] hover:underline inline-flex items-center gap-1.5"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 dark:shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                  style={{ backgroundColor: category.color || '#CE2B5E' }}
                  aria-hidden="true"
                />
                {category.name}
              </span>
            </div>
          )}

          <h3 className="font-sans font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-tight">
            {post.title}
          </h3>

          <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Professional Author & Date metadata row */}
        <div className="flex items-center gap-2.5 border-t border-zinc-100 dark:border-zinc-800/60 pt-4 mt-4 select-none">
          {(() => {
            const author = heartsync.authors.find(a => a.id === post.author_id) || {
              name: 'Elena Voss',
              avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'
            };
            const avatarUrl = (author as any).avatar_url || (author as any).avatar;
            return (
              <>
                <img 
                  src={avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'} 
                  alt={author.name}
                  className="w-6 h-6 rounded-full object-cover border border-zinc-100 dark:border-zinc-800"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100';
                  }}
                />
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-sans text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{author.name}</span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span>{post.read_time} min read</span>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span>{new Date(post.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </MotionCard>
  );
}
