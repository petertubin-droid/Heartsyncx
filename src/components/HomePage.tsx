/** HomePage: the home reading experience.
 *  Extracted verbatim from App.tsx (2026-09-24 App.tsx split, phase 2).
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HeroSection from './HeroSection';
import BlogCard from './BlogCard';
import RelatedContentBlock from './RelatedContentBlock';
import { AdPlacement, AdsterraDirectLink } from './AdPlacement';
import CrossPromoSlot from './houseAds/CrossPromoSlot';
import { heartsync, getAuthors } from '../store';
import { Post, Author, Topic, Category } from '../types';
import { getTranslation, formatTranslation, Language } from '../utils/i18n';
import { HeartsyncImage } from './LoadingSystem';
import { motion } from 'motion/react';
import {
  Heart, BookOpen, HelpCircle, ChevronRight, Settings, Brain, Lock, Users, TrendingUp
} from 'lucide-react';

export interface HomePageProps {
  currentTab: string;
  theme: 'light' | 'dark';
  lang: string;
  siteSettings: any;
  categories: any[];
  categoriesState: Category[];
  publishedArticles: Post[];
  navigateTo: (tab: any, arg?: string, skipScroll?: boolean) => void;
  showToast: (msg: string) => void;
  homeNewsletterEmail: string;
  setHomeNewsletterEmail: (s: string) => void;
  homeNewsletterSubscribed: boolean;
  setHomeNewsletterSubscribed: (b: boolean) => void;
  quizStep: number;
  setQuizStep: React.Dispatch<React.SetStateAction<number>>;
  quizAnswers: number[];
  setQuizAnswers: React.Dispatch<React.SetStateAction<number[]>>;
  quizOutcome: 'secure' | 'anxious' | 'avoidant' | null;
  setQuizOutcome: (o: 'secure' | 'anxious' | 'avoidant' | null) => void;
}

export default function HomePage({
  currentTab,
  theme,
  lang, siteSettings, categories, categoriesState, publishedArticles, navigateTo, showToast,
  homeNewsletterEmail, setHomeNewsletterEmail, homeNewsletterSubscribed, setHomeNewsletterSubscribed,
  quizStep, setQuizStep, quizAnswers, setQuizAnswers, quizOutcome, setQuizOutcome
}: HomePageProps) {
              // Decoupled Draft vs Production Layout mapping
              const isAdmin = heartsync.current_user && heartsync.current_user.role === 'admin';
              const isBuilderMode = typeof window !== 'undefined' && (
                window.location.search.includes('builder=true') ||
                window.location.search.includes('preview=true') ||
                (isAdmin && (
                  window.location.hostname.includes('web-sandbox') ||
                  window.location.hostname.includes('ais-preview') ||
                  // If they are on localhost/127.0.0.1/3000 and the live parameter is not present, use staging draft for easier local editing,
                  // but if they are on a real deployed endpoint (Cloud Run, custom domain, etc.), default to live visitor mode.
                  ((window.location.hostname.includes('localhost') || 
                    window.location.hostname.includes('127.0.0.1') || 
                    window.location.hostname.includes('3000')) && 
                    !window.location.search.includes('live=true'))
                ))
              );

              const rawSections = isBuilderMode
                ? (siteSettings.draft_page_builder_sections || siteSettings.page_builder_sections)
                : siteSettings.page_builder_sections;

              const homeSectionsListRaw = (rawSections && rawSections.length > 0)
                ? rawSections
                : [
                    { id: 'sec-hero', type: 'hero', title: "Build Healthier Relationships Through Psychology and Emotional Wellness", subtitle: "Discover expert relationship advice, dating insights, emotional wellness resources, and premium relationship guides that help people build stronger, healthier, and happier relationships.", buttonText: "Read Articles", buttonUrl: "articles", secondaryButtonText: "Join Premium", secondaryButtonUrl: "subscription", imageUrl: "", badgeText: "Welcome to Heartsync", is_active: true },
                    { id: 'sec-featured', type: 'featured_stories', title: "Featured Insights", is_active: true },
                    { id: 'sec-trending', type: 'trending', title: "Trending Now", is_active: true },
                    { id: 'sec-categories', type: 'categories', title: "Explore by Topic", subtitle: "Dive into the subjects that matter most  - each curated with depth and intention.", is_active: true },
                    { id: 'sec-about', type: 'about', title: "About HeartSync", is_active: true },
                    { id: 'sec-newsletter', type: 'newsletter', title: "Join the HeartSync Newsletter", is_active: true }
                  ];

              // Runtime safety: Deduplicate sections by type to prevent any duplicate rendering glitches on homepage
              const homeSectionsList: any[] = [];
              const seenTypes = new Set<string>();
              for (const sec of homeSectionsListRaw) {
                if (sec && sec.type && !seenTypes.has(sec.type)) {
                  seenTypes.add(sec.type);
                  homeSectionsList.push(sec);
                }
              }

              // Redesign requirements: Inject Latest Articles and Premium Articles sections if not already present
              if (!seenTypes.has('latest_articles')) {
                homeSectionsList.push({ id: 'sec-latest-articles', type: 'latest_articles', title: getTranslation('latestPublications', lang as Language), is_active: true });
                seenTypes.add('latest_articles');
              }
              if (!seenTypes.has('premium_articles')) {
                homeSectionsList.push({ id: 'sec-premium-articles', type: 'premium_articles', title: "Premium Styled Insights", is_active: true });
                seenTypes.add('premium_articles');
              }

              return (
                <div className="space-y-12 pb-16">
                  {isBuilderMode && (
                    <div className="bg-rose-50/75 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-rose-100 dark:border-zinc-800 text-xs font-sans text-rose-650 dark:text-rose-450 flex items-center justify-between shadow-xs">
                      <span className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                        <Heart className="w-4 h-4 animate-spin text-rose-550" />
                        Staging View: Sandbox Draft layout is active.
                      </span>
                      <span className="font-mono text-[9px] bg-white dark:bg-zinc-950 px-2.5 py-1 rounded-lg border text-zinc-500">
                        Isolated from live visitors
                      </span>
                    </div>
                  )}

                  {(() => {
                    const sortedSections = [...homeSectionsList].sort((a, b) => {
                      const getOrder = (sec: any) => {
                        if (sec.type === 'hero') return 0;
                        if (sec.type === 'featured_stories') return 1;
                        if (sec.type === 'trending') return 2;
                        if (sec.type === 'categories') return 3;
                        if (sec.type === 'premium_articles') return 4;
                        if (sec.type === 'newsletter') return 5;
                        if (sec.type === 'latest_articles') return 6;
                        if (sec.type === 'about') return 7;
                        return 10;
                      };
                      return getOrder(a) - getOrder(b);
                    });

                    return sortedSections
                      .filter(sec => {
                        const allowedTypes = ['hero', 'featured_stories', 'categories', 'latest_articles', 'premium_articles', 'trending', 'about', 'newsletter'];
                        if (!allowedTypes.includes(sec.type)) {
                          return false;
                        }
                        if (sec.type === 'categories' && siteSettings?.homepage_categories_enabled === false) {
                          return false;
                        }
                        if (sec.type === 'featured_stories' && siteSettings?.homepage_featured_enabled === false) {
                          return false;
                        }
                        if (sec.type === 'trending' && siteSettings?.homepage_trending_enabled === false) {
                          return false;
                        }
                        if (sec.type === 'about' && siteSettings?.homepage_about_enabled === false) {
                          return false;
                        }
                        if (sec.type === 'newsletter' && siteSettings?.homepage_newsletter_enabled === false) {
                          return false;
                        }
                        return sec.is_active !== false;
                      })
                      .map((sec) => {
                        const sectionNode = (() => {
                        switch (sec.type) {
                    case 'hero': {
                      const finalBadgeText = sec.badgeText || siteSettings?.hero_settings?.badge_text || "RELATIONSHIP ADVICE";
                      const finalTitle = sec.title && sec.title !== "Helping Hearts Heal, Connect & Thrive" && sec.title !== "Healing, Love & Self-Growth" ? (sec.title || "Build Healthier Relationships Through Psychology and Emotional Wellness") : (siteSettings?.hero_settings?.title || "Build Healthier Relationships Through Psychology and Emotional Wellness");
                      const finalSubtitle = sec.subtitle || siteSettings?.hero_settings?.subtitle || "Discover expert relationship advice, dating insights, emotional wellness resources, and premium relationship guides that help people build stronger, healthier, and happier relationships.";
                      const finalButtonText = sec.buttonText || siteSettings?.hero_settings?.primary_cta_text || "Read Articles";
                      const finalButtonUrl = sec.buttonUrl || siteSettings?.hero_settings?.primary_cta_url || "articles";
                      const finalSecondaryButtonText = sec.secondaryButtonText || siteSettings?.hero_settings?.secondary_cta_text || "Join Premium";
                      const finalSecondaryButtonUrl = sec.secondaryButtonUrl || siteSettings?.hero_settings?.secondary_cta_url || "subscription";
                      const finalImageUrl = sec.imageUrl && !sec.imageUrl.includes("unsplash") ? sec.imageUrl : (siteSettings?.hero_settings?.image_url || sec.imageUrl || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800");

                      const heroSettings = (siteSettings?.hero_settings || {}) as any;
                      // DARK MODE FIX: the admin hero background is configured for
                      // light mode (default #FAF5F5 / white gradients). Applying it
                      // in dark mode kept a near-white surface under white hero text,
                      // making the hero unreadable. In dark mode the section keeps
                      // its own dark surface classes and the text uses the dark:
                      // color utilities, so custom light-mode-only colors are
                      // ignored rather than layering light-on-light.
                      const isDarkHero = theme === 'dark';
                      const bgType = heroSettings.bg_type || 'solid';
                      const heroBgStyle: React.CSSProperties = {};
                      
                      if (bgType === 'solid') {
                        if (!isDarkHero) heroBgStyle.backgroundColor = heroSettings.bg_color || '#FAF5F5';
                      } else if (bgType === 'gradient') {
                        const start = heroSettings.bg_gradient_start || heroSettings.bg_color || '#ffffff';
                        const end = heroSettings.bg_gradient_end || '#ffe4e6';
                        const angle = heroSettings.bg_gradient_angle || '135deg';
                        if (!isDarkHero) heroBgStyle.backgroundImage = `linear-gradient(${angle}, ${start}, ${end})`;
                      } else if (bgType === 'image' || bgType === 'overlay') {
                        if (heroSettings.bg_image_url) {
                          heroBgStyle.backgroundImage = `url(${heroSettings.bg_image_url})`;
                          
                          const posMap: Record<string, string> = {
                            'Center Center': 'center center',
                            'Top Center': 'top center',
                            'Bottom Center': 'bottom center',
                            'Left Center': 'left center',
                            'Right Center': 'right center'
                          };
                          heroBgStyle.backgroundPosition = posMap[heroSettings.bg_position || ''] || 'center';

                          const sizeMap: Record<string, string> = {
                            'Cover': 'cover',
                            'Contain': 'contain',
                            'Auto': 'auto'
                          };
                          heroBgStyle.backgroundSize = sizeMap[heroSettings.bg_size || ''] || 'cover';

                          const repeatMap: Record<string, string> = {
                            'No Repeat': 'no-repeat',
                            'Repeat': 'repeat',
                            'Repeat X': 'repeat-x',
                            'Repeat Y': 'repeat-y'
                          };
                          heroBgStyle.backgroundRepeat = repeatMap[heroSettings.bg_repeat || ''] || 'no-repeat';
                          
                          if (heroSettings.bg_parallax) {
                            heroBgStyle.backgroundAttachment = 'fixed';
                          }
                        } else if (!isDarkHero) {
                          heroBgStyle.backgroundColor = heroSettings.bg_color || '#FAF5F5';
                        }
                      }

                      // Adjust custom coloring details from the theme settings
                      // (light mode only - see the DARK MODE FIX note above; in
                      // dark mode the dark: utilities below own the colors).
                      const textOverrideStyle: React.CSSProperties = isDarkHero ? {} : {
                        color: heroSettings.text_color || undefined
                      };
                      const headingStyle: React.CSSProperties = isDarkHero ? {} : {
                        color: heroSettings.heading_color || heroSettings.text_color || undefined
                      };
                      const subheadingStyle: React.CSSProperties = isDarkHero ? {} : {
                        color: heroSettings.subheading_color || heroSettings.text_color || undefined
                      };
                      const badgeStyle: React.CSSProperties = isDarkHero ? {} : {
                        color: heroSettings.badge_color || undefined,
                        backgroundColor: heroSettings.badge_bg_color || undefined
                      };

                      // Check if standard right illustration represents a media section (can be toggled on/off to hide image)
                      const isMediaEnabled = heroSettings.enabled_sections?.media !== false;

                      return (
                        <React.Fragment key={sec.id}>
                          {/* DESKTOP HERO VIEW (TOUCHLESS BASELINE) */}
                          <div className="hidden lg:block">
                            <motion.section 
                              key={sec.id + "-desktop"} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                              className="premium-card relative overflow-hidden rounded-[2.5rem] border border-rose-100/20 dark:border-rose-500/25 dark:bg-zinc-950 dark:shadow-[0_0_60px_-14px_rgba(244,63,94,0.28)] p-5 sm:p-12 lg:p-16 transition-all duration-300 shadow-sm"
                              style={{
                                ...heroBgStyle,
                                ...textOverrideStyle
                              }}
                            >

                              {/* Ambient neon orbs (dark mode only) */}
                              <div className="hidden dark:block absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
                                <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-rose-500/12 blur-3xl animate-float-soft" />
                                <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-rose-700/10 blur-3xl animate-float-soft-slow" />
                              </div>
                                                          {/* Absolute Overlay layer under the content */}
                              {(bgType === 'overlay' || bgType === 'image') && heroSettings.bg_image_url && (
                                <div 
                                  className="absolute inset-0 z-0 pointer-events-none transition-all duration-200"
                                  style={{
                                    backgroundColor: heroSettings.overlay_color || '#000000',
                                    opacity: (heroSettings.overlay_opacity !== undefined ? heroSettings.overlay_opacity : 10) / 100
                                  }}
                                />
                              )}

                              {/* Grid alignment based on whether media column is enabled */}
                              <div className={`relative z-10 grid grid-cols-1 ${isMediaEnabled ? 'lg:grid-cols-12 gap-8 lg:gap-12' : 'max-w-4xl mx-auto'} items-center`}>
                                {/* Left Column content */}
                                <div className={`${isMediaEnabled ? 'col-span-12 lg:col-span-7' : 'col-span-12 text-center flex flex-col items-center'} space-y-6`}>
                                  
                                  {/* Heart Announcement Badge */}
                                  {heroSettings.enabled_sections?.badge !== false && finalBadgeText && (
                                    <div 
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF0F2] dark:bg-rose-500/10 text-[#CE2B5E] text-xs font-bold tracking-wider uppercase rounded-full shadow-xs dark:border dark:border-rose-500/30 dark:shadow-[0_0_16px_rgba(244,63,94,0.35)]"
                                      style={badgeStyle}
                                    >
                                      <Heart className="w-3.5 h-3.5" />
                                      <span>{finalBadgeText}</span>
                                    </div>
                                  )}
                                  
                                  {/* Headline Title */}
                                  {heroSettings.enabled_sections?.headline !== false && finalTitle && (
                                    <h1 
                                      className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl text-zinc-900 dark:text-white leading-[1.1] tracking-tight"
                                      style={headingStyle}
                                    >
                                      {finalTitle.includes("Hearts") ? (
                                        <>
                                          Helping <span className="text-[#CE2B5E] dark:text-rose-400 underline decoration-rose-300 decoration-wavy underline-offset-4 dark:neon-text">Hearts</span><br className="hidden sm:inline" />
                                          {finalTitle.replace("Helping Hearts", "").trim()}
                                        </>
                                      ) : (
                                        finalTitle
                                      )}
                                    </h1>
                                  )}
                                  
                                  {/* Subtitle description */}
                                  {heroSettings.enabled_sections?.description !== false && finalSubtitle && (
                                    <p 
                                      className="font-sans text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed"
                                      style={subheadingStyle}
                                    >
                                      {finalSubtitle}
                                    </p>
                                  )}
                                  
                                  {/* Action Row buttons */}
                                  {heroSettings.enabled_sections?.buttons !== false && (finalButtonText || finalSecondaryButtonText) && (
                                    <div className={`flex flex-col sm:flex-row items-center gap-3.5 pt-2 ${!isMediaEnabled ? 'justify-center w-full' : ''}`}>
                                      {finalButtonText && (
                                        <button 
                                          onClick={() => navigateTo(finalButtonUrl)}
                                          className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-white text-[10px] sm:text-xs font-extrabold font-sans tracking-wide uppercase shadow-lg shadow-rose-250/20 hover:scale-102 hover:shadow-[0_0_28px_rgba(244,63,94,0.55)] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                                          style={{
                                            backgroundColor: heroSettings.primary_btn_bg || '#CE2B5E',
                                            color: heroSettings.primary_btn_text || '#ffffff'
                                          }}
                                        >
                                          {finalButtonText}
                                          <ChevronRight className="w-4 h-4" />
                                        </button>
                                      )}
                                      {finalSecondaryButtonText && (
                                        <button 
                                          onClick={() => {
                                            if (finalSecondaryButtonUrl?.includes('quiz') || finalSecondaryButtonUrl?.includes('diagnostic') || finalSecondaryButtonUrl?.includes('assessment') || finalSecondaryButtonUrl?.includes('attachment-quiz-section')) {
                                              setQuizStep(0);
                                              setQuizAnswers([]);
                                              const elem = document.getElementById('attachment-quiz-section');
                                              if (elem) {
                                                elem.scrollIntoView({ behavior: 'smooth' });
                                              } else {
                                                navigateTo('home', '', true);
                                                setTimeout(() => {
                                                  const e = document.getElementById('attachment-quiz-section');
                                                  if (e) e.scrollIntoView({ behavior: 'smooth' });
                                                }, 200);
                                              }
                                            } else {
                                              navigateTo(finalSecondaryButtonUrl || 'about');
                                            }
                                          }}
                                          className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 text-[10px] sm:text-xs font-extrabold font-sans tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                                          style={{
                                            backgroundColor: heroSettings.secondary_btn_bg || '#ffffff',
                                            color: heroSettings.secondary_btn_text || '#CE2B5E',
                                            borderColor: heroSettings.secondary_btn_text || 'rgba(244, 63, 94, 0.2)'
                                          }}
                                        >
                                          <Heart className="w-4.5 h-4.5 fill-current" />
                                          {finalSecondaryButtonText}
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* Horizontal statistics row from the video */}
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-sans pt-6 select-none">
                                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-rose-500" /> {publishedArticles.length * 15 + 12000}+ readers</span>
                                    <span className="text-zinc-300 dark:text-zinc-800 hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-rose-500" /> {publishedArticles.length || 200}+ essays</span>
                                    <span className="text-zinc-300 dark:text-zinc-800 hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Curated with care</span>
                                  </div>
                                </div>

                                {/* Right Column illustration: only rendered if isMediaEnabled === true */}
                                {isMediaEnabled && (
                                  <div className="col-span-12 lg:col-span-5 relative">
                                    <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#CE2B5E]/20 to-[#FFA5B5]/20 rounded-[3rem] blur-lg opacity-80" />
                                    <div className="relative overflow-hidden aspect-[4/5] rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900 w-full shadow-xl dark:border dark:border-rose-500/30 dark:shadow-[0_0_45px_-10px_rgba(244,63,94,0.35)]">
                                      <HeartsyncImage 
                                        src={finalImageUrl} 
                                        alt={finalTitle} 
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                        wrapperClassName="w-full h-full"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
                                      <div className="absolute bottom-6 left-6 right-6 text-white p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                        <p className="text-[10px] font-sans uppercase tracking-[0.22em] text-[#FFF0F2] font-bold">The Essay Library</p>
                                        <h4 className="text-xs sm:text-sm font-serif font-bold leading-snug mt-0.5">
                                          {publishedArticles.length} curated essays on love, dating &amp; emotional wellness
                                        </h4>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Premium Trust Section and Dynamic Statistics Bar */}
                              <div className="mt-12 sm:mt-16 pt-8 border-t border-zinc-200/10 dark:border-zinc-800/60 w-full relative z-10 text-zinc-900 dark:text-zinc-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left sm:text-center lg:text-left select-none">
                                  {/* Stat 1 */}
                                  <div className="space-y-1">
                                    <p className="text-2xl sm:text-3xl font-serif font-black text-[#CE2B5E] dark:text-rose-400">
                                      {publishedArticles.length || 200}+
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-wider">
                                      Psychology Essays
                                    </p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                      Expertly-authored & peer-reviewed guides.
                                    </p>
                                  </div>
                                  {/* Stat 2 */}
                                  <div className="space-y-1">
                                    <p className="text-2xl sm:text-3xl font-serif font-black text-[#CE2B5E] dark:text-rose-400">
                                      {heartsync.authors.length || 15}+
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-wider">
                                      Wellness Authors
                                    </p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                      Expert authors and relationship coaches.
                                    </p>
                                  </div>
                                  {/* Stat 3 */}
                                  <div className="space-y-1">
                                    <p className="text-2xl sm:text-3xl font-serif font-black text-[#CE2B5E] dark:text-rose-400">
                                      {heartsync.categories.length || 4} Core
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-wider">
                                      Wellness Domains
                                    </p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                      Curated connection dimensions.
                                    </p>
                                  </div>
                                  {/* Stat 4 */}
                                  <div className="space-y-1">
                                    <p className="text-2xl sm:text-3xl font-serif font-black text-[#CE2B5E] dark:text-rose-400">
                                      Weekly
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-wider">
                                      Updated Insights
                                    </p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                      Fresh connection content published weekly.
                                    </p>
                                  </div>
                                </div>

                                {/* Trust Pillars Row */}
                                <div className="mt-8 pt-6 border-t border-zinc-200/5 dark:border-zinc-800/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans text-zinc-550 dark:text-zinc-400">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    </div>
                                    <span className="font-semibold">Relationship Psychology Articles</span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    </div>
                                    <span className="font-semibold">Evidence Based Wellness Content</span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    </div>
                                    <span className="font-semibold">Expert Inspired Resources</span>
                                  </div>
                                </div>
                              </div>
                            </motion.section>
                          </div>

                          {/* NEW PREMIUM EDITORIAL MOBILE HERO VIEW */}
                          <div className="block lg:hidden">
                            <motion.div
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className="premium-card relative overflow-hidden rounded-[2rem] border border-rose-100/10 dark:border-rose-500/25 dark:shadow-[0_0_45px_-12px_rgba(244,63,94,0.30)] p-6 sm:p-10 text-left bg-gradient-to-b from-[#FAF5F5] to-white dark:from-zinc-900/60 dark:to-zinc-950 shadow-sm space-y-8"
                              style={{ ...heroBgStyle }}
                            >
                              {/* Absolute Overlay layer under the content */}
                              {(bgType === 'overlay' || bgType === 'image') && heroSettings.bg_image_url && (
                                <div 
                                  className="absolute inset-0 z-0 pointer-events-none transition-all duration-200"
                                  style={{
                                    backgroundColor: heroSettings.overlay_color || '#000000',
                                    opacity: (heroSettings.overlay_opacity !== undefined ? heroSettings.overlay_opacity : 10) / 100
                                  }}
                                />
                              )}

                              {/* Floating subtle ambient glow */}
                              <div className="absolute top-0 right-0 w-36 h-36 bg-[#CE2B5E]/8 rounded-full blur-2xl pointer-events-none animate-float-soft" />
                              <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-rose-500/8 rounded-full blur-3xl pointer-events-none dark:block hidden animate-float-soft-slow" />

                              {/* Heart Announcement Badge */}
                              {heroSettings.enabled_sections?.badge !== false && finalBadgeText && (
                                <div 
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF0F2] dark:bg-rose-500/10 text-[#CE2B5E] text-[10px] font-bold tracking-wider uppercase rounded-full shadow-xs w-fit dark:border dark:border-rose-500/30 dark:shadow-[0_0_16px_rgba(244,63,94,0.35)]"
                                  style={badgeStyle}
                                >
                                  <Heart className="w-3 h-3 fill-[#CE2B5E]" />
                                  <span>{finalBadgeText}</span>
                                </div>
                              )}

                              {/* Headline & Paragraph */}
                              <div className="space-y-4">
                                {heroSettings.enabled_sections?.headline !== false && finalTitle && (
                                  <h1 
                                    className="font-serif font-black text-3xl sm:text-4.5xl text-zinc-900 dark:text-white leading-[1.15] tracking-tight"
                                    style={headingStyle}
                                  >
                                    {finalTitle.includes("Hearts") ? (
                                      <>
                                        Helping <span className="text-[#CE2B5E] dark:text-rose-400 underline decoration-rose-300 decoration-wavy underline-offset-4 dark:neon-text">Hearts</span><br />
                                        {finalTitle.replace("Helping Hearts", "").trim()}
                                      </>
                                    ) : (
                                      finalTitle
                                    )}
                                  </h1>
                                )}
                                
                                {heroSettings.enabled_sections?.description !== false && finalSubtitle && (
                                  <p 
                                    className="font-sans text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm"
                                    style={subheadingStyle}
                                  >
                                    {finalSubtitle}
                                  </p>
                                )}
                              </div>

                              {/* Hero Image / Spotlight with aspect ratio */}
                              {isMediaEnabled && (
                                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-md dark:border dark:border-rose-500/30 dark:shadow-[0_0_35px_-10px_rgba(244,63,94,0.35)]">
                                  <HeartsyncImage 
                                    src={finalImageUrl} 
                                    alt={finalTitle} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    wrapperClassName="w-full h-full"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                                  <div className="absolute bottom-4 left-4 right-4 text-white p-3.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-between">
                                    <div>
                                      <p className="text-[8px] font-mono uppercase tracking-widest text-rose-200 font-bold">Featured Spotlight</p>
                                      <h4 className="text-[11px] font-sans font-bold leading-none mt-1">Wellness & Emotional Co-Regulation</h4>
                                    </div>
                                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                                      <Heart className="w-3.5 h-3.5 text-rose-300" />
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Action Row buttons */}
                              {heroSettings.enabled_sections?.buttons !== false && (finalButtonText || finalSecondaryButtonText) && (
                                <div className="flex flex-col gap-3 w-full">
                                  {finalButtonText && (
                                    <button 
                                      onClick={() => navigateTo(finalButtonUrl)}
                                      className="w-full h-12 rounded-xl text-white text-xs font-extrabold font-sans tracking-wide uppercase shadow-lg shadow-rose-250/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                                      style={{
                                        backgroundColor: heroSettings.primary_btn_bg || '#CE2B5E',
                                        color: heroSettings.primary_btn_text || '#ffffff'
                                      }}
                                    >
                                      <span>{finalButtonText}</span>
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  )}
                                  {finalSecondaryButtonText && (
                                    <button 
                                      onClick={() => {
                                        if (finalSecondaryButtonUrl?.includes('quiz') || finalSecondaryButtonUrl?.includes('diagnostic') || finalSecondaryButtonUrl?.includes('assessment') || finalSecondaryButtonUrl?.includes('attachment-quiz-section')) {
                                          setQuizStep(0);
                                          setQuizAnswers([]);
                                          const elem = document.getElementById('attachment-quiz-section');
                                          if (elem) {
                                            elem.scrollIntoView({ behavior: 'smooth' });
                                          } else {
                                            navigateTo('home', '', true);
                                            setTimeout(() => {
                                              const e = document.getElementById('attachment-quiz-section');
                                              if (e) e.scrollIntoView({ behavior: 'smooth' });
                                            }, 200);
                                          }
                                        } else {
                                          navigateTo(finalSecondaryButtonUrl || 'about');
                                        }
                                      }}
                                      className="w-full h-12 rounded-xl border-2 text-xs font-extrabold font-sans tracking-wide uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-white dark:bg-zinc-900"
                                      style={{
                                        color: heroSettings.secondary_btn_text || '#CE2B5E',
                                        borderColor: heroSettings.secondary_btn_text || 'rgba(244, 63, 94, 0.2)'
                                      }}
                                    >
                                      <Heart className="w-4 h-4 fill-current text-rose-500" />
                                      <span>{finalSecondaryButtonText}</span>
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Swipable Pillars / Small Stats Cards */}
                              <div className="pt-4 border-t border-zinc-150/50 dark:border-zinc-800/60 w-full">
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-6 px-6">
                                  {[
                                    { num: `${publishedArticles.length || 200}+`, label: "Psychology Essays", desc: "Expertly-authored guides." },
                                    { num: `${heartsync.authors.length || 15}+`, label: "Wellness Authors", desc: "Expert coaches." },
                                    { num: `${heartsync.categories.length || 4} Core`, label: "Wellness Domains", desc: "Curated connections." },
                                    { num: "Weekly", label: "Updated Insights", desc: "Fresh expert content." }
                                  ].map((stat, sIdx) => (
                                    <div 
                                      key={sIdx} 
                                      className="snap-start shrink-0 w-[140px] p-3.5 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-850/40 space-y-1 text-left"
                                    >
                                      <p className="text-lg font-serif font-black text-[#CE2B5E] dark:text-rose-400 leading-none">
                                        {stat.num}
                                      </p>
                                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 leading-none">
                                        {stat.label}
                                      </p>
                                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-snug">
                                        {stat.desc}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </React.Fragment>
                      );
                    }

                    case 'categories': {
                      const finalTopicsTitle = siteSettings?.homepage_topics_title || getTranslation('exploreByTopic', lang as Language).toUpperCase();
                      const finalTopicsSubheading = siteSettings?.homepage_topics_subheading || getTranslation('exploreByTopicSubtitle', lang as Language);
                      const animationsEnabled = siteSettings?.homepage_topics_animations_enabled !== false;
                      const columnsDesktop = siteSettings?.homepage_topics_columns ?? 3;

                      const rawTopics = siteSettings?.homepage_topics && siteSettings.homepage_topics.length > 0
                        ? siteSettings.homepage_topics
                        : (heartsync.site_settings.homepage_topics || []);

                      // Filter to only display Published topics
                      const adminPublishedTopics = (rawTopics && rawTopics.length > 0 ? rawTopics : [])
                        .filter((t: any) => t.status === 'Published');

                      const exploreTopicsLimit = siteSettings?.explore_topics_display_limit ?? 6;

                      // No admin-authored topics yet: derive real topic cards from the
                      // site's actual categories + published article counts (never
                      // fabricated copy). Ranked by real published-article volume so the
                      // most substantial topics surface first. Disappears automatically
                      // the moment an admin publishes topics in Settings > Homepage > Categories.
                      // NOTE: plain computation, not useMemo - this branch runs inside
                      // a .map()/switch callback (not a component top level), so hooks
                      // are not valid here. The inputs are small (<=13 categories, <=72
                      // articles) so recomputing per render is cheap.
                      const autoTopicsFromCategories = (() => {
                        if (adminPublishedTopics.length > 0) return [] as any[];
                        const countsByCategory = new Map<string, number>();
                        publishedArticles.forEach((a: any) => {
                          countsByCategory.set(a.category_id, (countsByCategory.get(a.category_id) || 0) + 1);
                        });
                        return [...categoriesState]
                          .filter((c) => (countsByCategory.get(c.id) || 0) > 0)
                          .sort((a, b) => (countsByCategory.get(b.id) || 0) - (countsByCategory.get(a.id) || 0))
                          .slice(0, exploreTopicsLimit)
                          .map((c) => {
                            const articleCount = countsByCategory.get(c.id) || 0;
                            return {
                              id: `auto-${c.id}`,
                              title: c.name,
                              description: c.description || formatTranslation(articleCount === 1 ? 'articlesExploringOne' : 'articlesExploringMany', lang as Language, { count: articleCount, topic: c.name.toLowerCase() }),
                              image: c.featured_image,
                              button_text: getTranslation('exploreBtn', lang as Language),
                              destination_url: `category/${c.slug}`,
                              display_order: 0,
                              status: 'Published',
                              created_at: '',
                              updated_at: ''
                            };
                          });
                      })();

                      const rawPublishedTopics = adminPublishedTopics.length > 0 ? adminPublishedTopics : autoTopicsFromCategories;
                      let publishedTopics = [...rawPublishedTopics];

                      if (publishedTopics.length > 0 && publishedTopics.length < exploreTopicsLimit) {
                        // Pad the list to reach the dynamic display limit using random published topics
                        while (publishedTopics.length < exploreTopicsLimit) {
                          const randomIndex = Math.floor(Math.random() * rawPublishedTopics.length);
                          const randomTopic = rawPublishedTopics[randomIndex];
                          publishedTopics.push({
                            ...randomTopic,
                            id: `${randomTopic.id}-fill-${publishedTopics.length}`
                          });
                        }
                      }
                      publishedTopics = publishedTopics.slice(0, exploreTopicsLimit);

                      const handleCardClick = (destUrl: string) => {
                        if (destUrl.startsWith('http://') || destUrl.startsWith('https://')) {
                          window.open(destUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          // Extract category slug if destUrl contains category/slug
                          const slugMatch = destUrl.match(/category\/([^/]+)/);
                          if (slugMatch && slugMatch[1]) {
                            navigateTo('category', slugMatch[1]);
                          } else {
                            navigateTo('articles');
                          }
                        }
                      };

                      // Grid cols classes - Mobile: 2 per row, Tablet: 3 per row, Desktop: 6 per row to match video
                      const getGridColsClass = (cols: number) => {
                        return "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 pt-4";
                      };
                      const gridColsClass = getGridColsClass(columnsDesktop);

                      return (
                        <section key={sec.id} className="space-y-12 py-16 border-t border-rose-100/10" id="homepage-topics-section">
                          {/* DESKTOP CATEGORY CONTAINER (TOUCHLESS BASELINE) */}
                          <div className="hidden lg:block space-y-12">
                            {/* Premium Centered Section Header */}
                            <div className="text-center space-y-4 max-w-3xl mx-auto">
                              <span className="text-xs uppercase tracking-widest font-extrabold text-rose-500 block">
                                Discover Your Path
                              </span>
                              <h2 className="font-serif font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight text-zinc-900 dark:text-white">
                                {finalTopicsTitle}
                              </h2>
                              <div className="w-12 h-1 bg-rose-500/30 mx-auto rounded-full" />
                              <p className="text-xs sm:text-sm lg:text-base text-zinc-500 dark:text-zinc-400 font-sans max-w-xl mx-auto leading-relaxed">
                                {finalTopicsSubheading}
                              </p>
                            </div>

                            {/* Standard Category Pills */}
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 max-w-4xl mx-auto">
                              {categoriesState.map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => navigateTo('category', cat.slug)}
                                  className="px-5 py-2.5 rounded-full font-sans text-xs font-bold tracking-wide uppercase shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer bg-white dark:bg-zinc-900/60 backdrop-blur-sm"
                                  style={{ 
                                    borderColor: `${cat.color || '#F43F5E'}40`,
                                    color: cat.color || '#F43F5E'
                                  }}
                                >
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: cat.color || '#F43F5E' }} 
                                  />
                                  {cat.name}
                                </button>
                              ))}
                            </div>

                            {publishedTopics.length === 0 ? (
                              <div className="text-center p-12 bg-rose-50/10 dark:bg-zinc-900/10 rounded-[2rem] border border-dashed border-rose-150 text-zinc-500 text-sm">
                                No active topics published yet. Visit the Admin Dashboard to customize topics.
                              </div>
                            ) : (
                              <div className={gridColsClass}>
                                {publishedTopics.map((topic: any, index: number) => {
                                  return (
                                    <div
                                      key={topic.id || index}
                                      onClick={() => handleCardClick(topic.destination_url || '')}
                                      className={`bg-white dark:bg-zinc-900/60 backdrop-blur-sm rounded-3xl border border-zinc-150/80 dark:border-zinc-850/70 overflow-hidden flex flex-col group cursor-pointer h-full ${
                                        animationsEnabled 
                                          ? 'hover:shadow-xl hover:shadow-rose-500/5 hover:scale-[1.03] hover:-translate-y-1.5 transition-all duration-300' 
                                          : 'transition-all duration-200'
                                      } shadow-sm`}
                                    >
                                      {/* Image Container with Title Overlay & Gradient */}
                                      <div className="h-40 sm:h-52 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                        <HeartsyncImage
                                          src={topic.image || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600'}
                                          alt={topic.title}
                                          referrerPolicy="no-referrer"
                                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                          wrapperClassName="w-full h-full"
                                          onError={(e: any) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600';
                                          }}
                                        />
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 group-hover:opacity-95" />
                                        
                                        {/* Card Title Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-left">
                                          <h3 className="font-serif font-bold text-sm sm:text-base md:text-lg text-white leading-tight tracking-tight drop-shadow-sm group-hover:text-rose-200 transition-colors line-clamp-2">
                                            {topic.title}
                                          </h3>
                                        </div>
                                      </div>

                                      {/* Card Description & CTA Button */}
                                      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                                        <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2 sm:line-clamp-3">
                                          {topic.description}
                                        </p>

                                        <div className="pt-2 sm:pt-3 border-t border-zinc-100/60 dark:border-zinc-850/40 flex items-center justify-between text-[10px] sm:text-xs font-sans font-bold text-rose-500 group-hover:text-rose-600 transition-colors">
                                          <span className="tracking-wide uppercase">{topic.button_text || 'Read More'}</span>
                                          <span className="p-1 sm:p-1.5 bg-rose-50 dark:bg-rose-950/20 rounded-full group-hover:bg-rose-500 group-hover:text-white transition-all transform group-hover:scale-110">
                                            <svg className="w-3.5 h-3.5 transform -rotate-45 group-hover:rotate-0 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
                                            </svg>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* NEW HANDCRAFTED EDITORIAL MOBILE CATEGORY VIEW */}
                          <div className="block lg:hidden space-y-6">
                            {/* Header */}
                            <div className="text-left space-y-2">
                              <span className="text-[10px] uppercase tracking-widest font-extrabold text-rose-500 block">
                                Discover Your Path
                              </span>
                              <h2 className="font-serif font-black text-2xl tracking-tight text-zinc-900 dark:text-white">
                                {finalTopicsTitle}
                              </h2>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Browse topics that matter most  - curated with depth and intention.
                              </p>
                            </div>

                            {/* Horizontal Scrolling Chips */}
                            <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x -mx-6 px-6">
                              {categoriesState.map((cat) => (
                                <button
                                  key={cat.id}
                                  onClick={() => navigateTo('category', cat.slug)}
                                  className="snap-start shrink-0 px-4 py-2.5 rounded-full font-sans text-[10px] font-bold tracking-wider uppercase border transition-all active:scale-95 flex items-center gap-2 bg-white dark:bg-zinc-900 shadow-xs cursor-pointer"
                                  style={{ 
                                    borderColor: `${cat.color || '#F43F5E'}30`,
                                    color: cat.color || '#F43F5E'
                                  }}
                                >
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full animate-pulse" 
                                    style={{ backgroundColor: cat.color || '#F43F5E' }} 
                                  />
                                  {cat.name}
                                </button>
                              ))}
                            </div>

                            {/* Horizontal Scrollable Swipe Cards for Topics */}
                            {publishedTopics.length === 0 ? (
                              <div className="text-center p-8 bg-rose-50/10 dark:bg-zinc-900/10 rounded-2xl text-zinc-500 text-xs">
                                No active topics published yet.
                              </div>
                            ) : (
                              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory -mx-6 px-6">
                                {publishedTopics.map((topic: any, index: number) => (
                                  <div
                                    key={topic.id || index}
                                    onClick={() => handleCardClick(topic.destination_url || '')}
                                    className="snap-start shrink-0 w-[240px] sm:w-[280px] bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-150/60 dark:border-zinc-850/50 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                  >
                                    {/* Card Image */}
                                    <div className="h-32 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                      <HeartsyncImage
                                        src={topic.image || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600'}
                                        alt={topic.title}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                        wrapperClassName="w-full h-full"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                      <div className="absolute bottom-3 left-3 right-3 text-left">
                                        <h3 className="font-serif font-bold text-xs text-white leading-tight line-clamp-2">
                                          {topic.title}
                                        </h3>
                                      </div>
                                    </div>

                                    {/* Description & Button */}
                                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                                      <p className="text-[10px] sm:text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                        {topic.description}
                                      </p>
                                      <div className="pt-2 border-t border-zinc-100/60 dark:border-zinc-850/40 flex items-center justify-between text-[10px] font-sans font-bold text-rose-500">
                                        <span className="tracking-wide uppercase">{topic.button_text || 'Read More'}</span>
                                        <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </section>
                      );
                    }

                    case 'featured_stories': {
                      const finalFeaturedTitle = siteSettings?.homepage_featured_title || sec.title || "Featured Stories";
                      const resolvedFeaturedPosts: any[] = [];
                      const selectedPostIds = siteSettings?.homepage_featured_posts || sec.selectedPostIds || [];
                      
                      selectedPostIds.forEach((id: string) => {
                        if (id) {
                          const p = publishedArticles.find(item => item.id === id);
                          if (p) resolvedFeaturedPosts.push(p);
                        }
                      });
                               const featuredCount = siteSettings?.featured_display_limit ?? 6;
                      const otherPublished = publishedArticles.filter(item => !resolvedFeaturedPosts.some(fp => fp.id === item.id));
                      while (resolvedFeaturedPosts.length < featuredCount && otherPublished.length > 0) {
                        resolvedFeaturedPosts.push(otherPublished.shift());
                      }
                      
                      // No fabricated fallback cards: show only real published articles.
                      const displayedList = resolvedFeaturedPosts.slice(0, featuredCount);
 
                      return (
                        <section key={sec.id} className="space-y-8 py-10 border-t border-rose-100/10">
                          {/* DESKTOP FEATURED STORIES CONTAINER (TOUCHLESS BASELINE) */}
                          <div className="hidden lg:block space-y-8">
                            {/* Elegant Centered Header from the video */}
                            <div className="text-center space-y-2.5 max-w-2xl mx-auto">
                              <h2 className="font-serif font-black text-3xl sm:text-4xl tracking-tight text-zinc-900 dark:text-white">
                                {finalFeaturedTitle}
                              </h2>
                              <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-sans max-w-lg mx-auto leading-relaxed">
                                Stories our editors love this week
                              </p>
                            </div>

                            {/* Bento Grid layout for Desktop */}
                            <div className="grid grid-cols-12 gap-8 pt-4">
                              {/* Left Side: Big Card (col-span-7) */}
                              <div className="col-span-7">
                                {displayedList[0] && (
                                  <BlogCard 
                                    post={displayedList[0]}
                                    onClick={() => {
                                      if (displayedList[0].slug) {
                                        navigateTo('article', displayedList[0].slug);
                                      } else {
                                        navigateTo('articles');
                                      }
                                    }}
                                    onNavigate={navigateTo}
                                    layout="vertical"
                                  />
                                )}
                              </div>

                              {/* Right Side: Two Stacked Horizontal Cards (col-span-5) */}
                              <div className="col-span-5 flex flex-col gap-6">
                                {displayedList.slice(1, 3).map((post, index) => (
                                  <div key={post.id || index} className="flex-1">
                                    <BlogCard 
                                      post={post}
                                      onClick={() => {
                                        if (post.slug) {
                                          navigateTo('article', post.slug);
                                        } else {
                                          navigateTo('articles');
                                        }
                                      }}
                                      onNavigate={navigateTo}
                                      layout="horizontal"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* NEW PREMIUM HANDCRAFTED EDITORIAL MOBILE VIEW */}
                          <div className="block lg:hidden space-y-8">
                            {/* Header */}
                            <div className="text-left space-y-1">
                              <span className="text-[10px] font-mono tracking-widest text-[#CE2B5E] dark:text-rose-400 uppercase font-bold block">
                                Stories Our Editors Love
                              </span>
                              <h2 className="font-serif font-black text-2xl tracking-tight text-zinc-900 dark:text-white">
                                {finalFeaturedTitle}
                              </h2>
                            </div>

                            {/* Spotlight Featured Article (First article in displayedList) */}
                            {displayedList[0] && (() => {
                              const post = displayedList[0];
                              const category = heartsync.categories.find(c => c.id === post.category_id);
                              const author = heartsync.authors.find(a => a.id === post.author_id) || {
                                name: 'Elena Voss',
                                avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'
                              };
                              return (
                                <div 
                                  onClick={() => post.slug ? navigateTo('article', post.slug) : navigateTo('articles')}
                                  className="group relative bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-150/60 dark:border-zinc-850/40 overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex flex-col"
                                >
                                  {/* Large Image Aspect Ratio */}
                                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                    <HeartsyncImage 
                                      src={post.featured_image || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600'} 
                                      alt={post.title}
                                      className="w-full h-full object-cover"
                                      wrapperClassName="w-full h-full"
                                    />
                                    {category && (
                                      <span 
                                        className="absolute top-4 left-4 z-10 px-2.5 py-1 text-[8px] font-sans font-bold uppercase tracking-wider text-white rounded-md shadow-xs"
                                        style={{ backgroundColor: category.color || '#CE2B5E' }}
                                      >
                                        {category.name}
                                      </span>
                                    )}
                                    {(post.is_premium || post.access_level === 'premium') && (
                                      <span className="absolute bottom-4 left-4 z-10 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white font-sans font-bold text-[7px] tracking-widest uppercase px-2 py-0.5 rounded shadow-xs">
                                        GOLD
                                      </span>
                                    )}
                                  </div>

                                  {/* Content Details */}
                                  <div className="p-5 space-y-3 text-left">
                                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#CE2B5E] dark:text-rose-400 font-bold uppercase">
                                      <span>Editor's Spotlight</span>
                                      <span>•</span>
                                      <span>{post.read_time} min read</span>
                                    </div>

                                    <h3 className="font-serif font-bold text-lg text-zinc-900 dark:text-zinc-100 leading-snug">
                                      {post.title}
                                    </h3>

                                    <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                                      {post.excerpt}
                                    </p>

                                    {/* Author info */}
                                    <div className="flex items-center gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-850/40">
                                      <img 
                                        src={author.avatar_url || (author as any).avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100'} 
                                        alt={author.name}
                                        className="w-6 h-6 rounded-full object-cover border border-zinc-100 dark:border-zinc-850"
                                      />
                                      <div className="flex flex-col text-[10px] text-zinc-500">
                                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{author.name}</span>
                                        <span className="text-[8px]">{new Date(post.publish_date || '2026-06-25').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Other Featured Stories - Horizontal swipe list */}
                            {displayedList.length > 1 && (
                              <div className="space-y-3.5">
                                <h4 className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-left">
                                  More Featured Stories
                                </h4>
                                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory -mx-6 px-6">
                                  {displayedList.slice(1).map((post, index) => {
                                    const category = heartsync.categories.find(c => c.id === post.category_id);
                                    return (
                                      <div
                                        key={post.id || index}
                                        onClick={() => post.slug ? navigateTo('article', post.slug) : navigateTo('articles')}
                                        className="snap-start shrink-0 w-[240px] sm:w-[280px] bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-150/60 dark:border-zinc-850/50 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left"
                                      >
                                        <div className="h-28 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                                          <HeartsyncImage
                                            src={post.featured_image || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600'}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                            wrapperClassName="w-full h-full"
                                          />
                                          {category && (
                                            <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[7px] font-sans font-bold uppercase tracking-wider text-white rounded bg-rose-500" style={{ backgroundColor: category.color }}>
                                              {category.name}
                                            </span>
                                          )}
                                        </div>

                                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                                          <div className="space-y-1">
                                            <span className="text-[8px] font-mono text-[#CE2B5E] dark:text-rose-400 font-bold uppercase">{post.read_time} min read</span>
                                            <h3 className="font-serif font-bold text-xs text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                                              {post.title}
                                            </h3>
                                          </div>
                                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                            {post.excerpt}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      );
                    }

                    case 'latest_articles': {
                      const finalLatestTitle = getTranslation('latestPublications', lang as Language);
                      const latestList = publishedArticles.slice(0, 6);

                      return (
                        <section key={sec.id} className="space-y-8 py-10 border-t border-rose-100/10">
                          {/* DESKTOP LATEST ARTICLES CONTAINER (TOUCHLESS BASELINE) */}
                          <div className="hidden lg:block space-y-8">
                            <div className="text-center space-y-2.5 max-w-2xl mx-auto">
                              <h2 className="font-serif font-black text-3xl sm:text-4xl tracking-tight text-zinc-900 dark:text-white">
                                {finalLatestTitle}
                              </h2>
                              <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-sans max-w-lg mx-auto leading-relaxed">
                                Fresh perspectives, psychological insights, and relationship tools added daily
                              </p>
                            </div>

                            {latestList.length === 0 ? (
                              <div className="text-center p-12 bg-rose-50/10 dark:bg-zinc-900/10 rounded-[2rem] border border-dashed border-rose-150 text-zinc-500 text-sm">
                                No recent articles published yet.
                              </div>
                            ) : (
                              <div className={
                                latestList.length <= 2
                                  ? `grid grid-cols-1 ${latestList.length === 2 ? 'sm:grid-cols-2' : ''} gap-6 sm:gap-8 pt-4 max-w-4xl mx-auto`
                                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4"
                              }>
                                {latestList.map((post, index) => (
                                  <BlogCard 
                                    key={post.id || index}
                                    post={post}
                                    onClick={() => {
                                      if (post.slug) {
                                        navigateTo('article', post.slug);
                                      } else {
                                        navigateTo('articles');
                                      }
                                    }}
                                    onNavigate={navigateTo}
                                    layout="vertical"
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* NEW PREMIUM HANDCRAFTED EDITORIAL MOBILE VIEW */}
                          <div className="block lg:hidden space-y-6">
                            {/* Header */}
                            <div className="text-left space-y-1">
                              <span className="text-[10px] font-mono tracking-widest text-[#CE2B5E] dark:text-rose-400 uppercase font-bold block">
                                Fresh Perspectives & Guides
                              </span>
                              <h2 className="font-serif font-black text-2xl tracking-tight text-zinc-900 dark:text-white">
                                {finalLatestTitle}
                              </h2>
                            </div>

                            {latestList.length === 0 ? (
                              <div className="text-center p-8 bg-rose-50/10 dark:bg-zinc-900/10 rounded-2xl text-zinc-500 text-xs">
                                No recent articles published yet.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {latestList.slice(0, 5).map((post, index) => {
                                  const category = heartsync.categories.find(c => c.id === post.category_id);
                                  const author = heartsync.authors.find(a => a.id === post.author_id) || {
                                    name: 'Dr. Evelyn Voss'
                                  };
                                  return (
                                    <div
                                      key={post.id || index}
                                      onClick={() => post.slug ? navigateTo('article', post.slug) : navigateTo('articles')}
                                      className="flex items-center gap-4 py-3 border-b border-zinc-100 dark:border-zinc-850/50 active:bg-zinc-50/40 dark:active:bg-zinc-950/20 transition-all cursor-pointer text-left"
                                    >
                                      {/* Left side: title, category, meta info */}
                                      <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {category && (
                                            <span 
                                              className="text-[8px] font-sans font-extrabold uppercase tracking-widest"
                                              style={{ color: category.color || '#CE2B5E' }}
                                            >
                                              {category.name}
                                            </span>
                                          )}
                                          <span className="text-[8px] text-zinc-400 dark:text-zinc-500">•</span>
                                          <span className="text-[8px] font-mono text-zinc-500">{post.read_time}m read</span>
                                          {(post.is_premium || post.access_level === 'premium') && (
                                            <span className="text-[7px] font-mono font-bold text-amber-500 tracking-wider bg-amber-500/10 px-1 rounded">GOLD</span>
                                          )}
                                        </div>

                                        <h3 className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                                          {post.title}
                                        </h3>

                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans line-clamp-1">
                                          By {author.name}
                                        </p>
                                      </div>

                                      {/* Right side: Image thumbnail */}
                                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 shrink-0 shadow-xs border border-zinc-100 dark:border-zinc-850">
                                        <HeartsyncImage
                                          src={post.featured_image || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=300'}
                                          alt={post.title}
                                          className="w-full h-full object-cover"
                                          wrapperClassName="w-full h-full"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* View All Button */}
                            <button
                              onClick={() => navigateTo('articles')}
                              className="w-full h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold font-sans tracking-wide uppercase text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>{getTranslation('browseAllPublications', lang as Language)}</span>
                              <ChevronRight className="w-4 h-4 text-zinc-400" />
                            </button>
                          </div>
                        </section>
                      );
                    }

                    case 'premium_articles': {
                      const finalPremiumTitle = "Heartsync Gold Reserve";
                      const premiumList = publishedArticles.filter(
                        post => post.is_premium || post.access_level === 'premium' || post.access_level === 'gold' || post.access_level === 'platinum'
                      ).slice(0, 3);

                      const finalPremiumList = premiumList.length >= 3 
                        ? premiumList 
                        : [
                            ...premiumList,
                            ...publishedArticles.filter(p => !premiumList.some(pl => pl.id === p.id))
                          ].slice(0, 3);

                      return (
                        <React.Fragment key={sec.id}>
                          {/* DESKTOP PREMIUM ARTICLES CONTAINER (TOUCHLESS BASELINE) */}
                          <div className="hidden lg:block">
                            <section key={sec.id} className="py-16 px-12 rounded-[3rem] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden shadow-2xl border border-zinc-800/80 dark:border-rose-950/30">
                              {/* Ambient Gold and Red glows */}
                              <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#CE2B5E]/10 rounded-full blur-[140px] pointer-events-none" />
                              <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
                              
                              {/* Fine grid overlay */}
                              <div className="absolute inset-0 bg-[radial-gradient(rgba(244,63,94,0.04)_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                                
                                {/* Left Side: Premium Benefits & Checklist */}
                                <div className="lg:col-span-5 space-y-6">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold rounded-full tracking-widest uppercase shadow-md">
                                    <Lock className="w-3 h-3 text-amber-400 fill-current" />
                                    <span>GOLD RESERVE ACCESS</span>
                                  </div>

                                  <h2 className="font-serif font-black text-3xl sm:text-4xl text-white leading-tight tracking-tight">
                                    Unlock Deep Relationship Psychology
                                  </h2>

                                  <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
                                    Join our premium circle of readers and gain unlimited, unrestricted access to expert somatic workbooks, attachment profile builders, audio articles, and expert guides.
                                  </p>

                                  {/* Checklist */}
                                  <div className="space-y-3.5 pt-2">
                                    {[
                                      "Unlimited Access to All Premium Articles",
                                      "Interactive Attachment Psychology Workbooks",
                                      "Somatic Co-Regulation Audio Releases",
                                      "Evidence-Based Mindful Dating Blueprints",
                                      "Priority Expert Author Q&As & Live Forums",
                                      "Completely Ad-Free Reading Experience"
                                    ].map((benefit, bIdx) => (
                                      <div key={bIdx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300 font-sans" id={`benefit-${bIdx}`}>
                                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                          </svg>
                                        </div>
                                        <span className="font-medium leading-tight">{benefit}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* CTA Button */}
                                  <div className="pt-4">
                                    <button 
                                      onClick={() => navigateTo('subscription')}
                                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-bold font-mono tracking-widest uppercase rounded-2xl shadow-xl shadow-amber-950/40 hover:scale-102 transition-all cursor-pointer border-none"
                                    >
                                      Unlock Gold Membership
                                    </button>
                                  </div>
                                </div>

                                {/* Right Side: Exclusive Content Preview */}
                                <div className="lg:col-span-7 flex flex-col gap-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-extrabold">Exclusive Publications Preview</p>
                                    <span className="text-zinc-500 text-[10px] font-mono">3 OF {publishedArticles.length * 2 || 200}+ ISSUES</span>
                                  </div>

                                  {finalPremiumList.length === 0 ? (
                                    <div className="text-center p-12 bg-white/5 rounded-[2rem] text-zinc-500 text-sm">
                                      Premium reserve guides are being curated.
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
                                      {finalPremiumList.map((post, index) => {
                                        return (
                                          <div 
                                            key={post.id || index} 
                                            onClick={() => navigateTo('article', post.slug)}
                                            className="group relative rounded-3xl overflow-hidden border border-zinc-800/80 hover:border-amber-500/40 transition-all duration-300 hover:scale-[1.01] shadow-lg flex flex-col lg:flex-row h-full bg-zinc-900/40 backdrop-blur-md cursor-pointer"
                                          >
                                            <div className="absolute top-4 left-4 z-10 bg-amber-500 text-zinc-950 text-[8px] font-mono font-black px-2.5 py-0.5 rounded shadow flex items-center gap-1 uppercase tracking-wider">
                                              <Lock className="w-2.5 h-2.5 fill-current" />
                                              <span>GOLD EXCLUSIVE</span>
                                            </div>

                                            <div className="aspect-video lg:w-[150px] shrink-0 overflow-hidden bg-zinc-950 relative">
                                              <HeartsyncImage 
                                                src={post.featured_image || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600'} 
                                                alt={post.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-103 transition-all duration-500"
                                                wrapperClassName="w-full h-full"
                                                onError={(e: any) => {
                                                  e.target.src = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600';
                                                }}
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 lg:bg-gradient-to-r lg:from-transparent lg:to-zinc-900 via-transparent pointer-events-none" />
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                              <div className="space-y-1.5">
                                                <h3 className="font-serif font-bold text-sm sm:text-base text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                                                  {post.title}
                                                </h3>
                                                <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
                                                  {post.excerpt}
                                                </p>
                                              </div>

                                              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/40 text-[10px] text-zinc-500 select-none">
                                                <span className="font-sans font-medium text-zinc-400">Elena Voss • {post.read_time} min read</span>
                                                <span className="text-amber-400 hover:text-amber-300 font-sans font-bold flex items-center gap-1 bg-transparent border-none text-[10px]">
                                                  UNLOCK INSIGHT
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
                                                  </svg>
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </section>
                          </div>

                          {/* NEW PREMIUM HANDCRAFTED EDITORIAL MOBILE VIEW */}
                          <div className="block lg:hidden">
                            <section key={sec.id} className="py-10 px-6 rounded-[2rem] bg-[#0E0D0D] text-white relative overflow-hidden shadow-xl border border-zinc-900">
                              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#CE2B5E]/10 rounded-full blur-2xl pointer-events-none" />
                              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                              <div className="space-y-6 relative z-10 text-left">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/35 text-amber-400 text-[8px] font-mono font-bold rounded-lg tracking-wider uppercase shadow-xs">
                                  <Lock className="w-2.5 h-2.5 text-amber-400 fill-current" />
                                  <span>GOLD RESERVE ACCESS</span>
                                </div>

                                <h2 className="font-serif font-black text-2xl text-white leading-tight">
                                  Unlock Deep Psychology & Guides
                                </h2>

                                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                                  Join our premium circle to access somatic workbooks, attachment profile builders, and expert relationship insights.
                                </p>

                                {/* Checklist on mobile */}
                                <div className="space-y-2.5 pt-1">
                                  {[
                                    "Unlimited access to all somatic audio workbooks",
                                    "Expert blueprints for secure attachment",
                                    "Completely ad-free reading experience"
                                  ].map((benefit, bIdx) => (
                                    <div key={bIdx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-sans">
                                      <div className="w-4 h-4 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                      </div>
                                      <span className="font-medium text-zinc-300 leading-snug">{benefit}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Content Preview Sliders */}
                                <div className="space-y-3 pt-3">
                                  <p className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-extrabold">Exclusive Preview Issues</p>
                                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x -mx-6 px-6">
                                    {finalPremiumList.map((post, index) => (
                                      <div
                                        key={post.id || index}
                                        onClick={() => navigateTo('article', post.slug)}
                                        className="snap-start shrink-0 w-[220px] bg-zinc-900/60 border border-zinc-850 rounded-2xl p-3.5 space-y-3 cursor-pointer"
                                      >
                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950">
                                          <HeartsyncImage
                                            src={post.featured_image || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600'}
                                            alt={post.title}
                                            className="w-full h-full object-cover opacity-80"
                                            wrapperClassName="w-full h-full"
                                          />
                                          <span className="absolute top-2 left-2 bg-amber-500 text-zinc-950 text-[6px] font-mono font-extrabold px-1.5 py-0.5 rounded shadow uppercase">
                                            GOLD PREVIEW
                                          </span>
                                        </div>
                                        <div className="space-y-1">
                                          <h4 className="font-serif font-bold text-xs text-zinc-100 line-clamp-1">
                                            {post.title}
                                          </h4>
                                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-snug">
                                            {post.excerpt}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Subscription Trigger Button */}
                                <div className="pt-2">
                                  <button 
                                    onClick={() => navigateTo('subscription')}
                                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-rose-600 active:scale-[0.98] text-white text-xs font-bold font-mono tracking-widest uppercase rounded-xl transition-all cursor-pointer border-none"
                                  >
                                    Unlock Gold Membership
                                  </button>
                                </div>
                              </div>
                            </section>
                          </div>
                        </React.Fragment>
                      );
                    }

                    case 'somatic_coherence':
                      if (siteSettings?.homepage_insights_enabled === false) {
                        return null;
                      }
                      return (
                        <section key={sec.id} id="attachment-quiz-section" className="pt-2">
                          {/* Centralized Diagnostic Canvas (Full Width) */}
                          <div className="w-full bg-zinc-950 text-white rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between shadow-xl border border-zinc-900 dark:border-rose-500/20 dark:shadow-[0_0_35px_rgba(244,63,94,0.12)] min-h-[320px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAF5F5]/5 rounded-bl-full pointer-events-none" />
                            
                            {quizStep === 0 && (
                              <div className="space-y-6 h-full flex flex-col justify-between">
                                <div className="space-y-3">
                                  <span className="inline-block px-2.5 py-1 bg-white/10 text-[9px] font-mono rounded-lg tracking-widest uppercase text-rose-300 font-semibold flex items-center gap-1.5 w-fit">
                                    {React.createElement((() => {
                                      const iconStr = (siteSettings?.homepage_insights_icon || 'Heart').toLowerCase();
                                      if (iconStr === 'sparkles' || iconStr === 'sparkle') return Heart;
                                      if (iconStr === 'brain') return Brain;
                                      if (iconStr === 'helpcircle' || iconStr === 'help_circle' || iconStr === 'help') return HelpCircle;
                                      return Heart;
                                    })(), { className: "w-3 h-3 text-rose-450" })}
                                    PHYCHO-SOCIAL EVALUATION
                                  </span>
                                  <h3 className="font-serif font-black text-2xl sm:text-3xl leading-tight dark:neon-text-rose">
                                    {siteSettings?.homepage_insights_title || "Relationship Insights"}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed font-sans">
                                    {siteSettings?.homepage_insights_desc || "Discover your attachment patterns, emotional needs, communication style, and relationship strengths in under 2 minutes."}
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setQuizStep(1);
                                    setQuizAnswers([]);
                                  }}
                                  className="w-full sm:w-fit px-8 py-3.5 bg-rose-600 text-white font-sans text-xs font-extrabold rounded-xl hover:scale-102 active:scale-98 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all shadow-lg uppercase tracking-wider border-none cursor-pointer"
                                >
                                  Begin assessment
                                </button>
                              </div>
                            )}

                            {(quizStep >= 1 && quizStep <= 3) && (
                              <div className="space-y-6 h-full flex flex-col justify-between">
                                <div className="space-y-3.5">
                                  <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold tracking-widest text-[#CE2B5E]">
                                    <span>SCENARIO 0{quizStep} / 03</span>
                                    <span>{Math.round((quizStep - 1) / 3 * 105) / 1.05}% Complete</span>
                                  </div>
                                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full transition-all duration-300" style={{ width: `${((quizStep) / 3) * 100}%` }} />
                                  </div>
                                  <h4 className="font-serif font-bold text-base sm:text-lg text-white mt-1 leading-snug">
                                    {quizStep === 1 && "During sudden romantic disconnect or non-response, your default instinct triggers..."}
                                    {quizStep === 2 && "Giving deep vulnerability or depending completely on your partner makes you feel..."}
                                    {quizStep === 3 && "When facing highly defensive or intimate conflict, you instinctively..."}
                                  </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5">
                                  {(quizStep === 1 ? [
                                    { val: 1, label: "Immediate anxiety and continuous pursuit for validation / safety signals" },
                                    { val: 2, label: "Withdrawal or feeling suffocated, preferring isolation to restore safety" },
                                    { val: 0, label: "Regulated stability, leaving respectful space while setting honest contact times" }
                                  ] : quizStep === 2 ? [
                                    { val: 1, label: "Hyper-vigilant panic of abandonment or rejection schemas" },
                                    { val: 2, label: "Anxiously trapped, as though personal sovereign autonomy is breached" },
                                    { val: 0, label: "Genuinely secure, trusting mutual closeness and sovereignty in equal measures" }
                                  ] : [
                                    { val: 1, label: "Escalating urgency, hyperactive text loops or somatic tension triggers" },
                                    { val: 2, label: "Freezing or stonewalling to protect yourself from feeling emotional engulfment" },
                                    { val: 0, label: "Compassionate hearing, holding self-coherence, and establishing collaborative pathways" }
                                  ]).map((opt, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        const updatedAnswers = [...quizAnswers, opt.val];
                                        setQuizAnswers(updatedAnswers);
                                        if (quizStep <= 2) {
                                          setQuizStep(prev => prev + 1);
                                        } else {
                                          const secureCount = updatedAnswers.filter(v => v === 0).length;
                                          const anxiousCount = updatedAnswers.filter(v => v === 1).length;
                                          const avoidantCount = updatedAnswers.filter(v => v === 2).length;
                                          let outcome: typeof quizOutcome = 'secure';
                                          if (anxiousCount > secureCount && anxiousCount >= avoidantCount) outcome = 'anxious';
                                          else if (avoidantCount > secureCount && avoidantCount >= anxiousCount) outcome = 'avoidant';
                                          setQuizOutcome(outcome);
                                          setQuizStep(4);
                                        }
                                      }}
                                      className="w-full text-left p-3.5 bg-zinc-900/60 hover:bg-zinc-900 hover:border-rose-500/30 rounded-xl text-xs font-sans leading-snug transition-all cursor-pointer border border-zinc-850 text-zinc-200 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {quizStep === 4 && (
                              <div className="space-y-6 h-full flex flex-col justify-between">
                                <div className="space-y-3">
                                  <span className="inline-block px-2 text-white py-0.5 bg-rose-550 text-[9px] font-mono rounded font-bold tracking-widest uppercase">EVALUATION CONCLUDED</span>
                                  <h3 className="font-serif font-black text-xl sm:text-2xl tracking-wide uppercase text-white mt-1">
                                    {quizOutcome === 'secure' && "Intimate Schema: SECURE ATTACHMENT ✅"}
                                    {quizOutcome === 'anxious' && "Intimate Schema: ANXIOUS ATTACHMENT ⚠️"}
                                    {quizOutcome === 'avoidant' && "Intimate Schema: AVOIDANT ATTACHMENT 🛡️"}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-zinc-305 leading-relaxed font-sans mt-1">
                                    {quizOutcome === 'secure' && "You hold mature emotional boundaries and hold validation space warmly. Continue strengthening your relationship architecture with our curated wellness list."}
                                    {quizOutcome === 'anxious' && "You tend to enter high somatic alert when connection feels threat. Somatic pacing can soothe core abandonment fears safely."}
                                    {quizOutcome === 'avoidant' && "You instinctively isolate when relationships demand closeness. Explore slow intimacy expansion to secure trust safely."}
                                  </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const targetedCategory = quizOutcome === 'anxious' ? 'anxiety' : quizOutcome === 'avoidant' ? 'detachment' : 'romance';
                                      const matched = categories.find(c => 
                                        c && 
                                        ((c.slug && c.slug.includes(targetedCategory)) || 
                                         (c.name && c.name.toLowerCase().includes(targetedCategory)))
                                      );
                                      if (matched && matched.slug) navigateTo('category', matched.slug);
                                      else navigateTo('articles');
                                    }}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-white text-zinc-950 text-xs font-extrabold rounded-lg cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors border-none"
                                  >
                                    {getTranslation('exploreCustomGuides', lang as Language)}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuizStep(0);
                                      setQuizAnswers([]);
                                      setQuizOutcome(null);
                                    }}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-transparent border border-zinc-805 hover:bg-zinc-900 rounded-lg text-white font-mono text-[10px] tracking-widest uppercase h-fit cursor-pointer"
                                  >
                                    Restart Test
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      );

                    case 'trending': {
                      const finalTrendingTitle = siteSettings?.homepage_trending_title || sec.title || getTranslation('trendingNow', lang as Language);
                      const resolvedTrendingPosts: any[] = [];
                      const selectedTrendingIds = siteSettings?.homepage_trending_posts || sec.selectedPostIds || [];
                      
                      selectedTrendingIds.forEach((id: string) => {
                        if (id) {
                          const p = publishedArticles.find(item => item.id === id);
                          if (p) resolvedTrendingPosts.push(p);
                        }
                      });
                      const trendingCount = siteSettings?.trending_display_limit ?? 6;
                      const remainingPublished = [...publishedArticles]
                        .sort((a, b) => (b.views || 0) + (b.likes || 0) * 2 - ((a.views || 0) + (a.likes || 0) * 2))
                        .filter(item => !resolvedTrendingPosts.some(tp => tp.id === item.id));
                        
                      while (resolvedTrendingPosts.length < trendingCount && remainingPublished.length > 0) {
                        resolvedTrendingPosts.push(remainingPublished.shift());
                      }
                      
                      // No fabricated fallback cards: show only real published articles.
                      const displayedTrendingList = resolvedTrendingPosts.slice(0, trendingCount);
 
                      return (
                        <section key={sec.id} className="space-y-8 py-10 border-t border-rose-100/10">
                          {/* Elegant Centered Header from the video */}
                          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
                            <h2 className="font-serif font-black text-3xl sm:text-4xl tracking-tight text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                              <TrendingUp className="w-8 h-8 text-[#CE2B5E] animate-pulse shrink-0" />
                              {finalTrendingTitle}
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-sans max-w-lg mx-auto leading-relaxed">
                              What our community is reading most
                            </p>
                          </div>
 
                          <div className={
                            displayedTrendingList.length <= 3 
                              ? "grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-4"
                              : displayedTrendingList.length === 4
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 pt-4"
                                : displayedTrendingList.length === 5
                                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 pt-4"
                                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 sm:gap-8 pt-4"
                          }>
                            {displayedTrendingList.map((item, idx) => {
                              const readText = `${item.read_time || 5} min read`;
                              const formattedDate = item.publish_date ? new Date(item.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Jun 25';
                              const metaText = `${readText} • ${formattedDate}`;
                              
                              const cat = categories.find(c => c.id === item.category_id || c.slug === item.category_id) || { name: 'Love & Relationships' };
                              const categoryName = cat.name.toUpperCase();

                              return (
                                <motion.div 
                                  key={item.id || idx}
                                  initial={{ opacity: 0, y: 18 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true, margin: '-30px' }}
                                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (idx % 6) * 0.05 }}
                                  onClick={() => {
                                    if (item.slug) {
                                      navigateTo('article', item.slug);
                                    } else {
                                      navigateTo('articles');
                                    }
                                  }}
                                  className="group cursor-pointer space-y-3 flex flex-col items-stretch animate-fadeIn text-left h-full"
                                >
                                  {/* Aspect Ratio Box with Hot badge */}
                                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-100/30 dark:border-zinc-850/30 dark:group-hover:border-rose-500/40 dark:group-hover:shadow-[0_0_28px_-8px_rgba(244,63,94,0.4)] shadow-sm shrink-0 transition-all duration-300">
                                    <HeartsyncImage 
                                      src={item.featured_image || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400"} 
                                      alt={item.title}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                      referrerPolicy="no-referrer"
                                      wrapperClassName="w-full h-full"
                                      onError={(e: any) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=400';
                                      }}
                                    />
                                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-[#CE2B5E] text-white text-[9px] font-extrabold uppercase rounded-md flex items-center gap-1 shadow-md tracking-wider">
                                      <TrendingUp className="w-2.5 h-2.5" />
                                      <span>Hot</span>
                                    </div>
                                  </div>

                                  {/* Meta category & bold serif title */}
                                  <div className="space-y-1.5 flex flex-col items-start flex-1 justify-between">
                                    <div className="space-y-1.5 w-full">
                                      <span className="text-[10px] font-sans font-bold tracking-wider text-[#CE2B5E] dark:text-rose-400 uppercase leading-none">
                                        {categoryName}
                                      </span>
                                      <h4 className="font-serif font-black text-sm sm:text-base leading-snug text-zinc-900 dark:text-white group-hover:text-[#CE2B5E] transition-colors line-clamp-2 mt-0.5">
                                        {item.title}
                                      </h4>
                                    </div>
                                    <span className="text-[11px] font-sans text-zinc-400 dark:text-zinc-500 block leading-none pt-1">
                                      {metaText}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    }

                    case 'about': {
                      return (
                        <section key={sec.id} className="space-y-8 py-10 border-t border-rose-100/10">
                          {/* Elegant Centered Header from the video */}
                          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
                            <h2 className="font-serif font-black text-3xl sm:text-4xl tracking-tight text-zinc-900 dark:text-white">
                              Our Research Panel
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-sans max-w-lg mx-auto leading-relaxed">
                              Meet our elite consultants and credentialed clinicians.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                            {getAuthors().slice(0, 3).map((author) => (
                              <div 
                                key={author.id} 
                                onClick={() => navigateTo('author', author.id)} 
                                className="group flex flex-col items-center text-center space-y-4 cursor-pointer p-6 bg-white dark:bg-zinc-900/40 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 hover:border-[#CE2B5E]/30 transition-all duration-300 dark:neon-card"
                              >
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-rose-100/40 dark:border-zinc-850/40 shadow-sm group-hover:scale-105 transition-all duration-300">
                                  <HeartsyncImage 
                                    src={author.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'} 
                                    alt={author.name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    wrapperClassName="w-full h-full"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-serif font-bold text-base text-zinc-900 dark:text-white group-hover:text-[#CE2B5E] transition-colors">
                                    {author.name}
                                  </h4>
                                  <p className="font-sans text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                                    {author.role || author.role_tag || 'Relationship Coach'}
                                  </p>
                                </div>
                                <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-sans max-w-[240px]">
                                  {author.bio || "Certified specialist dedicated to helping you establish secure attachment and resolve trauma schemas."}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    }

                    case 'newsletter': {
                      const finalTitle = siteSettings?.homepage_premium_title || "Unlock Premium Access";
                      const finalDesc = siteSettings?.homepage_premium_desc || "Get unlimited access to relationship assessments, expert insights, workshops, growth tools, and exclusive member resources.";
                      const finalCta = siteSettings?.homepage_premium_cta_text || "START FREE TRIAL";

                      return (
                        <section key={sec.id} className="py-10 border-t border-rose-100/10">
                          <div className="w-full bg-[#D2F57B] dark:bg-zinc-950 text-zinc-950 dark:text-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-zinc-950 dark:border-rose-500/35 shadow-md dark:shadow-[0_0_55px_-12px_rgba(244,63,94,0.35)]">
                            <div className="hidden dark:block absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                              <div className="absolute -top-20 -right-14 w-64 h-64 rounded-full bg-rose-500/15 blur-3xl animate-float-soft" />
                              <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-fuchsia-500/10 blur-3xl animate-float-soft-slow" />
                            </div>
                            <div className="space-y-4 max-w-xl text-left">
                              <span className="inline-block px-2.5 py-1 bg-zinc-950 dark:bg-rose-500/10 text-[#D2F57B] dark:text-rose-400 text-[9px] font-sans font-extrabold rounded uppercase tracking-wider dark:border dark:border-rose-500/20">
                                ANNUAL ACCESS MEMBERSHIP
                              </span>
                              <h3 className="font-serif font-black text-3xl sm:text-4xl leading-tight dark:text-zinc-50 dark:neon-text-rose">
                                {finalTitle}
                              </h3>
                              <p className="text-xs sm:text-sm font-sans font-semibold leading-relaxed opacity-90 text-zinc-800 dark:text-zinc-300">
                                {finalDesc}
                              </p>
                            </div>
                            <div className="w-full md:w-auto shrink-0 min-w-0 max-w-full sm:min-w-[300px] md:min-w-[360px]">
                              {homeNewsletterSubscribed ? (
                                <div className="p-5 bg-zinc-950 text-[#D2F57B] dark:text-rose-400 rounded-2xl text-xs sm:text-sm flex flex-col items-start gap-1.5 shadow-lg border border-zinc-850 dark:border-rose-500/30">
                                  <strong className="font-sans text-xs font-bold">Welcome to Heartsync Pass!</strong>
                                  <span className="text-[11px] leading-snug">Verification link sent to {homeNewsletterEmail}. Let's create secure intimacies together.</span>
                                </div>
                              ) : (
                                <form 
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (homeNewsletterEmail.trim().includes('@')) {
                                      heartsync.subscribeNewsletter(homeNewsletterEmail, 'dedicated_page');
                                      setHomeNewsletterSubscribed(true);
                                      showToast('Heartsync premium pass trial is active!');
                                    }
                                  }}
                                  className="flex flex-col sm:flex-row gap-3 w-full"
                                >
                                  <input 
                                    type="email" 
                                    required
                                    aria-label="Email address for newsletter subscription"
                                    placeholder="name@domain.com"
                                    value={homeNewsletterEmail}
                                    onChange={(e) => setHomeNewsletterEmail(e.target.value)}
                                    className="flex-1 px-4 py-3.5 text-xs font-sans rounded-xl bg-white border border-zinc-950 text-zinc-950 outline-none focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400 font-medium dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800 dark:focus:border-rose-500 dark:focus:ring-rose-500/30 dark:neon-input"
                                  />
                                  <button 
                                    type="submit"
                                    className="px-6 py-3.5 bg-zinc-950 hover:bg-zinc-900 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-sans text-xs font-bold rounded-xl shadow-md border-none cursor-pointer uppercase tracking-widest whitespace-nowrap transition-all duration-200 dark:neon-button-rose"
                                  >
                                    {finalCta}
                                  </button>
                                </form>
                              )}
                            </div>
                          </div>
                        </section>
                      );
                    }
                    
                    default:
                      return null;
                  }
                  })();

                  // Interleave live ad slots after key homepage sections so
                  // the home experience carries real inventory (the old
                  // "mid-feed" slot was dead code that never rendered).
                  // Slot families map to the admin console's per-slot provider
                  // config (AdSense unit id -> Adsterra banner -> Monetag),
                  // each behind its banner_*_enabled toggle, consent-gated.
                  const AD_SLOT_AFTER_SECTION: Record<string, 'header' | 'in_article' | 'homepage' | 'article_bottom' | 'sidebar' | 'footer'> = {
                    hero: 'header',
                    trending: 'in_article',
                    categories: 'homepage',
                    latest_articles: 'article_bottom',
                    // Two more homepage sections now carry inventory too -
                    // 'sidebar' and 'footer' were configurable in the admin
                    // console but never actually placed anywhere on the page.
                    featured_stories: 'sidebar',
                    premium_articles: 'footer'
                  };
                  const adSlotAfter = AD_SLOT_AFTER_SECTION[sec.type];
                  // Cross-site house ads (admin-configured format): two
                  // homepage slots, placed on sections that carry no
                  // network ad so the two systems never stack.
                  const CROSS_PROMO_AFTER_SECTION: Record<string, number> = {
                    about: 0,
                    newsletter: 1
                  };
                  const crossPromoSlotAfter = CROSS_PROMO_AFTER_SECTION[sec.type];
                  return adSlotAfter || crossPromoSlotAfter !== undefined ? (
                    <React.Fragment key={`adwrap-${sec.id}`}>
                      {sectionNode}
                      {adSlotAfter && (
                        <div className="max-w-6xl mx-auto px-4 w-full">
                          <AdPlacement slot={adSlotAfter} className="my-6" lazy />
                        </div>
                      )}
                      {crossPromoSlotAfter !== undefined && (
                        <div className="max-w-6xl mx-auto px-4 w-full">
                          <CrossPromoSlot slotIndex={crossPromoSlotAfter} source={`home_${crossPromoSlotAfter}`} />
                        </div>
                      )}
                    </React.Fragment>
                  ) : sectionNode;
                })})()}
              </div>
            );

}
