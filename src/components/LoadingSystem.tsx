import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Lock, ShieldCheck, Cpu, Database, RefreshCw } from 'lucide-react';
import { heartsync } from '../store';

// 1. Rotating authentic messages to enhance perceived performance and enterprise trust
const PRE_AUTH_MESSAGES = [
  'Preparing your workspace...',
  'Restoring your secure session...',
  'Signing you in securely...',
  'Loading your wellness dashboard...',
  'Syncing your account details...',
  'Establishing secure encryption keys...',
  'Optimizing emotional resonance indexes...',
  'Getting everything ready for you...'
];

interface HeartsyncLoaderProps {
  message?: string;
  isFullScreen?: boolean;
}

export const HeartsyncLoader: React.FC<HeartsyncLoaderProps> = ({ message, isFullScreen = true }) => {
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const [dots, setDots] = useState('');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Track prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Track theme changes dynamically
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Dot animation interval
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  // Rotating messages interval (only used if static message is not provided and custom text is not set)
  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % PRE_AUTH_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [message]);

  const settings: any = heartsync.site_settings || {};
  const loaderEnabled = settings.loader_enabled !== false;

  // Don't render anything if disabled by admin controls
  if (!loaderEnabled) {
    return null;
  }

  const loaderSize = settings.loader_size || 'md';
  const loaderSpeed = settings.loader_speed || 'normal';
  const loaderGlowIntensity = settings.loader_glow_intensity || 'medium';
  const loaderOverlayOpacity = settings.loader_overlay_opacity !== undefined ? settings.loader_overlay_opacity : 80;
  
  // Resolve colors based on current active theme
  const primaryColor = isDark 
    ? (settings.loader_colors_dark_primary || '#06b6d4') 
    : (settings.loader_colors_light_primary || '#CE2B5E');
  
  const secondaryColor = isDark 
    ? (settings.loader_colors_dark_secondary || '#3b82f6') 
    : (settings.loader_colors_light_secondary || '#f43f5e');

  const sizePx = {
    sm: 60,
    md: 100,
    lg: 140,
    xl: 180
  }[loaderSize] || 100;

  const activeMessage = message || settings.loader_text || PRE_AUTH_MESSAGES[currentMsgIndex];

  const content = (
    <div className="relative flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center font-sans z-50">
      {/* 60FPS Circular Glowing SVG Loader Ring */}
      <div className="relative flex items-center justify-center" style={{ width: sizePx, height: sizePx }}>
        {/* Neon Glow Ambient Aura (Only if enabled) */}
        {loaderGlowIntensity !== 'none' && (
          <div 
            className="absolute rounded-full transition-all duration-500 blur-xl opacity-60 pointer-events-none animate-pulse"
            style={{
              width: `${sizePx - 10}px`,
              height: `${sizePx - 10}px`,
              backgroundColor: primaryColor,
              filter: `blur(${loaderGlowIntensity === 'low' ? '8px' : loaderGlowIntensity === 'high' ? '24px' : '16px'})`,
              boxShadow: `0 0 ${loaderGlowIntensity === 'low' ? '12px' : loaderGlowIntensity === 'high' ? '45px' : '24px'} ${secondaryColor}`,
            }}
          />
        )}

        {/* Hardware-Accelerated SVG circle gradient spinner */}
        <svg
          width={sizePx}
          height={sizePx}
          viewBox="0 0 100 100"
          className="animate-spin relative z-10"
          style={{
            animationDuration: prefersReducedMotion 
              ? '4s' 
              : loaderSpeed === 'slow' 
                ? '2.5s' 
                : loaderSpeed === 'fast' 
                  ? '0.8s' 
                  : '1.5s',
            animationTimingFunction: 'linear',
          }}
        >
          <defs>
            <linearGradient id="premiumLoaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
          </defs>
          {/* Subtle elegant background trace ring */}
          <circle
            cx="50"
            cy="50"
            r="41"
            stroke={isDark ? '#27272a' : '#e4e4e7'}
            strokeWidth="5.5"
            fill="none"
            opacity="0.35"
          />
          {/* Active Gradient Ring Segment */}
          <circle
            cx="50"
            cy="50"
            r="41"
            stroke="url(#premiumLoaderGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="257.6"
            strokeDashoffset="75"
          />
        </svg>

        {/* Central Floating Branding Brand mark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <motion.div
            animate={prefersReducedMotion ? {} : {
              scale: [1, 1.05, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            }}
            className="rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-150/50 dark:border-zinc-800/50 shadow-md transition-colors duration-300"
            style={{
              width: `${sizePx * 0.46}px`,
              height: `${sizePx * 0.46}px`,
            }}
          >
            <img 
              src="/logo.svg" 
              alt="Heartsync Logo"
              className="drop-shadow-sm transition-transform"
              style={{
                width: `${sizePx * 0.36}px`,
                height: `${sizePx * 0.36}px`,
                objectFit: 'contain'
              }}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </div>

      {/* Branded Identity Text */}
      <div className="flex items-center gap-1.5 mt-8 mb-5 select-none justify-center">
        <span className="font-serif font-black text-xl tracking-tight text-zinc-900 dark:text-white transition-colors duration-300">
          Heart
        </span>
        <span 
          className="font-sans font-bold text-xl tracking-tight transition-colors duration-300"
          style={{ color: primaryColor }}
        >
          Sync
        </span>
      </div>

      {/* Message Stage Transition with AnimatePresence for super premium feel */}
      <div className="h-8 flex items-center justify-center mb-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMessage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold tracking-widest font-mono uppercase"
          >
            {activeMessage.includes('secure') && <Lock className="w-3.5 h-3.5" style={{ color: primaryColor }} />}
            {activeMessage.includes('workspace') && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
            {activeMessage.includes('Sync') && <Cpu className="w-3.5 h-3.5 text-indigo-500" />}
            {activeMessage.includes('account') && <Database className="w-3.5 h-3.5 text-amber-500" />}
            {!activeMessage.includes('secure') && 
             !activeMessage.includes('workspace') && 
             !activeMessage.includes('Sync') && 
             !activeMessage.includes('account') && 
              <RefreshCw className="w-3 h-3 animate-spin" style={{ color: primaryColor }} />
            }
            <span className="flex items-center">
              {activeMessage}
              <span className="inline-block w-6 text-left">{dots}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Elite minimal progress outline */}
      <div className="w-40 h-1 bg-zinc-150 dark:bg-zinc-800/60 rounded-full overflow-hidden relative">
        <div 
          className="absolute top-0 bottom-0 left-0 rounded-full h-full animate-infinite-loading" 
          style={{ 
            width: '45%', 
            backgroundColor: primaryColor,
            backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
          }} 
        />
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center transition-colors duration-300 backdrop-blur-md"
          style={{
            backgroundColor: isDark 
              ? `rgba(9, 9, 11, ${loaderOverlayOpacity / 100})` 
              : `rgba(252, 249, 249, ${loaderOverlayOpacity / 100})`,
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Content is loading, please wait"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="w-full py-16 flex items-center justify-center">
      {content}
    </div>
  );
};

// 2. High-fidelity Shimmer Style Placeholder
export const Shimmer: React.FC<{ className?: string }> = ({ className = 'h-4 w-full rounded-md' }) => {
  return (
    <div 
      className={`relative overflow-hidden bg-zinc-200/60 dark:bg-zinc-800/50 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-shimmer" />
    </div>
  );
};

// 3. Homepage high-fidelity skeleton preview
export const SkeletonHome: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full font-sans">
      {/* 1. Hero Area Skeleton (Apple style) */}
      <div className="rounded-3xl bg-zinc-100/70 dark:bg-zinc-900/40 p-8 sm:p-12 mb-12 relative overflow-hidden border border-zinc-200/40 dark:border-zinc-800/40">
        <div className="max-w-2xl relative z-10">
          <Shimmer className="h-6 w-32 rounded-full mb-6 bg-rose-200/20 dark:bg-rose-500/10" />
          <Shimmer className="h-12 w-full max-w-lg mb-4" />
          <Shimmer className="h-12 w-3/4 mb-6" />
          <Shimmer className="h-5 w-full max-w-md mb-8" />
          <div className="flex gap-4">
            <Shimmer className="h-11 w-36 rounded-2xl" />
            <Shimmer className="h-11 w-36 rounded-2xl" />
          </div>
        </div>
        <div className="hidden lg:block absolute right-12 bottom-0 top-0 w-1/3 my-auto h-72 rounded-2xl bg-zinc-200/40 dark:bg-zinc-800/30 overflow-hidden">
          <Shimmer className="h-full w-full" />
        </div>
      </div>

      {/* 2. Responsive Content Layout (Main feed + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Main Grid Feed (8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex justify-between items-center mb-2">
            <Shimmer className="h-7 w-48" />
            <Shimmer className="h-4 w-20" />
          </div>

          {/* Cards Grid Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-150 dark:border-zinc-850 shadow-xs flex flex-col h-full"
              >
                <div className="rounded-2xl h-48 bg-zinc-150 dark:bg-zinc-800/50 mb-4 overflow-hidden relative">
                  <Shimmer className="h-full w-full" />
                </div>
                <div className="flex gap-2 mb-3">
                  <Shimmer className="h-5 w-16 rounded-full" />
                  <Shimmer className="h-5 w-24 rounded-full" />
                </div>
                <Shimmer className="h-6 w-full mb-2" />
                <Shimmer className="h-4 w-4/5 mb-4" />
                <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Shimmer className="w-7 h-7 rounded-full" />
                    <Shimmer className="h-3 w-16" />
                  </div>
                  <Shimmer className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Widget Placements (4 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Shimmer className="h-6 w-32 mb-2" />
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className="bg-zinc-100/50 dark:bg-zinc-900/30 rounded-3xl p-6 border border-zinc-200/40 dark:border-zinc-800/40"
            >
              <Shimmer className="h-5 w-28 mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <Shimmer className="w-12 h-12 rounded-full" />
                <div>
                  <Shimmer className="h-4 w-24 mb-1.5" />
                  <Shimmer className="h-3 w-16" />
                </div>
              </div>
              <Shimmer className="h-3 w-full mb-2" />
              <Shimmer className="h-3 w-11/12 mb-4" />
              <Shimmer className="h-8 w-full rounded-xl" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

// 4. Article detailed page skeleton preview
export const SkeletonArticle: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full font-sans">
      {/* Category Tag & Reading stats */}
      <div className="flex items-center gap-3 mb-6">
        <Shimmer className="h-6 w-24 rounded-full" />
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-12" />
      </div>

      {/* Main Title Heading */}
      <Shimmer className="h-11 w-full mb-3" />
      <Shimmer className="h-11 w-4/5 mb-6" />

      {/* Author & Timestamp layout */}
      <div className="flex items-center gap-3 mb-8 pb-8 border-b border-zinc-150 dark:border-zinc-850">
        <Shimmer className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Shimmer className="h-4 w-32 mb-1.5" />
          <Shimmer className="h-3 w-20" />
        </div>
        <Shimmer className="h-8 w-24 rounded-full" />
      </div>

      {/* Hero Featured Image */}
      <div className="rounded-3xl h-96 bg-zinc-200/50 dark:bg-zinc-800/40 mb-8 overflow-hidden relative">
        <Shimmer className="h-full w-full" />
      </div>

      {/* Expert Review Badge Shimmer if applicable */}
      <div className="mb-8 p-4 bg-rose-500/5 rounded-2xl border border-rose-100/50 dark:border-zinc-800/50 flex gap-3">
        <Shimmer className="w-10 h-10 rounded-full shrink-0" />
        <div className="w-full">
          <Shimmer className="h-4 w-40 mb-1.5" />
          <Shimmer className="h-3 w-full max-w-lg" />
        </div>
      </div>

      {/* Detailed Body Paragraphs */}
      <div className="space-y-6">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-11/12" />
        <Shimmer className="h-4 w-10/12" />
        <Shimmer className="h-4 w-full" />
        
        {/* Inline Subheading Block */}
        <Shimmer className="h-7 w-64 mt-10 mb-4" />
        
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
      </div>

      {/* Bottom Likes & Interactions block */}
      <div className="mt-12 pt-8 border-t border-zinc-150 dark:border-zinc-850 flex justify-between items-center">
        <div className="flex gap-2">
          <Shimmer className="h-9 w-16 rounded-full" />
          <Shimmer className="h-9 w-16 rounded-full" />
        </div>
        <Shimmer className="h-9 w-32 rounded-full" />
      </div>
    </div>
  );
};

// 5. Admin Dashboard widget/console skeleton preview
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="w-full font-sans">
      {/* Top dashboard title & utility bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <Shimmer className="h-8 w-56 mb-2" />
          <Shimmer className="h-4 w-72" />
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-10 w-28 rounded-xl" />
          <Shimmer className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Four metric statistic boxes (Enterprise Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 flex flex-col shadow-xs"
          >
            <div className="flex justify-between items-center mb-3">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="w-8 h-8 rounded-lg" />
            </div>
            <Shimmer className="h-8 w-28 mb-2" />
            <Shimmer className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Interactive content grid: Charts & lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Visual Analytics Chart Widget (2/3 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-850">
          <div className="flex justify-between items-center mb-6">
            <Shimmer className="h-5 w-36" />
            <div className="flex gap-2">
              <Shimmer className="h-6 w-12 rounded-md" />
              <Shimmer className="h-6 w-12 rounded-md" />
            </div>
          </div>
          {/* Mock Chart Area */}
          <div className="h-64 flex items-end justify-between gap-2.5 px-2 pt-4 relative overflow-hidden">
            {[35, 60, 45, 80, 55, 90, 75, 40, 85, 70, 65, 80].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full rounded-t bg-rose-500/10 dark:bg-rose-500/5 hover:bg-rose-500/20 transition-all duration-300 relative overflow-hidden" 
                  style={{ height: `${h}%` }}
                >
                  <Shimmer className="h-full w-full" />
                </div>
                <div className="h-3 w-5 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed Widget (1/3 column) */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-850">
          <Shimmer className="h-5 w-32 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-850 last:border-0 last:pb-0">
                <Shimmer className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <Shimmer className="h-3.5 w-full mb-1" />
                  <Shimmer className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Data Grid Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-850 overflow-hidden">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="h-8 w-24 rounded-lg" />
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-4 w-12 justify-self-end" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-4 items-center">
              <div className="flex items-center gap-2.5">
                <Shimmer className="w-6 h-6 rounded-md" />
                <Shimmer className="h-3.5 w-32" />
              </div>
              <Shimmer className="h-3.5 w-24" />
              <Shimmer className="h-3.5 w-16" />
              <Shimmer className="h-5 w-12 rounded-full justify-self-end" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. Profile & Settings detailed card shimmer layout
export const SkeletonProfile: React.FC = () => {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm max-w-2xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
        <Shimmer className="w-24 h-24 rounded-full" />
        <div className="flex-1 text-center sm:text-left">
          <Shimmer className="h-7 w-48 mb-2 mx-auto sm:mx-0" />
          <Shimmer className="h-4 w-32 mb-4 mx-auto sm:mx-0" />
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <Shimmer className="h-6 w-20 rounded-full" />
            <Shimmer className="h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <Shimmer className="h-4 w-24 mb-2" />
          <Shimmer className="h-10 w-full rounded-xl" />
        </div>
        <div>
          <Shimmer className="h-4 w-24 mb-2" />
          <Shimmer className="h-10 w-full rounded-xl" />
        </div>
        <div>
          <Shimmer className="h-4 w-24 mb-2" />
          <Shimmer className="h-20 w-full rounded-xl" />
        </div>
        
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <Shimmer className="h-10 w-28 rounded-xl" />
          <Shimmer className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

// 7. General grid categories/cards list skeleton preview
export const SkeletonGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full py-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div 
          key={i} 
          className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-150 dark:border-zinc-850 shadow-xs flex flex-col h-full"
        >
          <div className="rounded-2xl h-44 bg-zinc-150 dark:bg-zinc-800/50 mb-4 overflow-hidden relative">
            <Shimmer className="h-full w-full" />
          </div>
          <Shimmer className="h-5 w-20 mb-3" />
          <Shimmer className="h-6 w-full mb-2" />
          <Shimmer className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
};

// 8. Progressive Loading Image wrapper with elegant blur-up / shimmer placeholder and automatic responsive WebP optimization
interface HeartsyncImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
}

export const HeartsyncImage: React.FC<HeartsyncImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  wrapperClassName = '',
  priority = false,
  width,
  height,
  sizes,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Detect Unsplash source for real-time edge optimization parameters
  const isUnsplash = src && src.includes('images.unsplash.com');

  const getUnsplashUrl = (baseUrl: string, w: number, q: number = 80) => {
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('fm', 'webp'); // Target modern WebP format
      url.searchParams.set('q', String(q));
      url.searchParams.set('w', String(w));
      return url.toString();
    } catch (_) {
      return baseUrl;
    }
  };

  let finalSrc = src;
  let computedSrcset = undefined;
  let computedSizes = undefined;

  if (isUnsplash) {
    const targetWidth = typeof width === 'number' ? width : (width ? parseInt(String(width), 10) : 800);
    finalSrc = getUnsplashUrl(src, targetWidth);
    
    computedSrcset = [
      `${getUnsplashUrl(src, 320)} 320w`,
      `${getUnsplashUrl(src, 640)} 640w`,
      `${getUnsplashUrl(src, 960)} 960w`,
      `${getUnsplashUrl(src, 1280)} 1280w`,
      `${getUnsplashUrl(src, 1920)} 1920w`,
    ].join(', ');

    computedSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Background shimmer placeholder displayed until primary source loads */}
      {!isLoaded && (
        <div className="absolute inset-0 z-10 bg-zinc-150 dark:bg-zinc-850">
          <Shimmer className="h-full w-full" />
        </div>
      )}
      <img
        src={finalSrc}
        srcSet={computedSrcset}
        sizes={computedSizes}
        alt={alt}
        width={width}
        height={height}
        className={`transition-all duration-700 ease-out ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
        } ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setIsLoaded(true)}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};

// 9. Interactive Global top loading progress bar (Linear style)
export const LoadingProgressBar: React.FC<{ isAnimating: boolean }> = ({ isAnimating }) => {
  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-rose-100/30 dark:bg-zinc-900"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ 
              width: ['0%', '30%', '60%', '90%', '90%'],
              transition: {
                duration: 4,
                times: [0, 0.2, 0.4, 0.8, 1],
                ease: 'easeInOut'
              }
            }}
            className="h-full bg-gradient-to-r from-rose-500 via-[#CE2B5E] to-pink-500 rounded-r-md"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 10. Simple custom loading wrapper (Route Suspense wrapper style)
interface SuspenseWrapperProps {
  isLoading: boolean;
  type?: 'home' | 'article' | 'dashboard' | 'profile' | 'grid';
  children: React.ReactNode;
}

export const HeartsyncSuspense: React.FC<SuspenseWrapperProps> = ({ 
  isLoading, 
  type = 'home', 
  children 
}) => {
  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key={`${type}-skeleton`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full"
          >
            {type === 'home' && <SkeletonHome />}
            {type === 'article' && <SkeletonArticle />}
            {type === 'dashboard' && <SkeletonDashboard />}
            {type === 'profile' && <SkeletonProfile />}
            {type === 'grid' && <SkeletonGrid />}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
