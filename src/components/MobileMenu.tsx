import React, { useState, useEffect } from 'react';
import { 
  Heart, Bookmark, Search, Moon, Sun, ArrowRight,
  Facebook, Instagram, Twitter, Globe, Compass, BookOpen, User, Settings, HelpCircle, Shield, X, MessageSquare, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { heartsync } from '../store';
import NavigationLinks from './NavigationLinks';
import SidebarOverlay from './SidebarOverlay';
import { Language, saveLanguage, getEnabledLanguages } from '../utils/i18n';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onNavigate: (tab: string, arg?: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onOpenBookmarks?: () => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  currentTab,
  onNavigate,
  searchQuery,
  setSearchQuery,
  theme,
  setTheme,
  onOpenBookmarks,
  lang,
  setLang
}: MobileMenuProps) {
  const [mobileSearch, setMobileSearch] = useState('');
  const [siteSettings, setSiteSettings] = useState({ ...heartsync.site_settings });
  const [currentUser, setCurrentUser] = useState(heartsync.current_user);
  
  const bookmarks = heartsync.bookmarks;
  
  const facebookUrl = siteSettings.social_facebook_url || siteSettings.social_links?.facebook;
  const twitterUrl = siteSettings.social_twitter_url || siteSettings.social_links?.twitter;
  const instagramUrl = siteSettings.social_instagram_url || siteSettings.social_links?.instagram;

  useEffect(() => {
    const unsub = heartsync.subscribe(() => {
      setSiteSettings({ ...heartsync.site_settings });
      setCurrentUser(heartsync.current_user);
    });
    return unsub;
  }, []);

  // Prevent background body scroll, catch ESC key, and manage focus trapping
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const menuEl = document.getElementById('mobile-navigation-menu');
    if (menuEl) {
      const focusableEls = menuEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableEls.length > 0) {
        const firstEl = focusableEls[0] as HTMLElement;
        const lastEl = focusableEls[focusableEls.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;
          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              lastEl.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastEl) {
              firstEl.focus();
              e.preventDefault();
            }
          }
        };

        menuEl.addEventListener('keydown', handleTabKey);

        // Focus search input or close button on open
        setTimeout(() => {
          const searchInput = menuEl.querySelector('input');
          if (searchInput) {
            searchInput.focus();
          } else {
            firstEl.focus();
          }
        }, 80);

        return () => {
          document.body.style.overflow = '';
          window.removeEventListener('keydown', handleKeyDown);
          menuEl.removeEventListener('keydown', handleTabKey);
        };
      }
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearch.trim()) {
      setSearchQuery(mobileSearch);
      onNavigate('search');
      setMobileSearch('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. BACKDROP OVERLAY WITH SOFT BLUR */}
          <SidebarOverlay isOpen={isOpen} onClose={onClose} />

          {/* 2. DRAWER SIDEBAR - 80-85% Screen Width, Elegant Slide Out from Left with Google Rounded Edges */}
          <motion.div
            id="mobile-navigation-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Heartsync Navigation Menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="fixed inset-y-0 left-0 w-[84vw] max-w-[340px] bg-white/98 dark:bg-zinc-950/98 backdrop-blur-lg border-r border-zinc-200/50 dark:border-zinc-900/50 rounded-r-[28px] shadow-2xl z-50 flex flex-col justify-between overflow-hidden lg:hidden"
          >
            {/* Header branding block */}
            <div className="p-4 pt-5 border-b border-zinc-150 dark:border-zinc-900 flex justify-between items-center shrink-0">
              <div 
                onClick={() => {
                  onNavigate('home');
                  onClose();
                }}
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                {siteSettings.logo_url ? (
                  <img 
                    src={siteSettings.logo_url} 
                    alt={siteSettings.site_name || 'Heartsync'} 
                    className="w-8 h-8 rounded-xl object-cover border border-zinc-100 dark:border-zinc-800 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md shadow-rose-500/10">
                    <Heart className="w-4 h-4" fill="white" />
                  </div>
                )}
                <span className="font-sans font-black text-base bg-gradient-to-r from-rose-600 via-rose-500 to-fuchsia-600 bg-clip-text text-transparent tracking-tight">
                  {siteSettings.site_name || 'Heartsync'}
                </span>
              </div>
              
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable navigation body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-none">
              {/* Google Pill Quick Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search articles & guides..."
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full text-xs font-sans font-medium outline-none border border-zinc-200/60 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/50 focus:border-rose-500 dark:focus:border-rose-500 focus:ring-1 focus:ring-rose-500/10 dark:focus:ring-rose-500/20 transition-all text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 min-h-[46px]"
                  aria-label="Search articles"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </form>

              {/* SECTION: MAIN NAVIGATION */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide pl-3">
                  Explore
                </h4>
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-900/30 p-1 bg-zinc-50/20 dark:bg-zinc-950/10">
                  <NavigationLinks
                    currentTab={currentTab}
                    onNavigate={onNavigate}
                    onLinkClick={onClose}
                    isMobile={true}
                    lang={lang}
                  />
                </div>
              </div>

              {/* SECTION: LIBRARY & SAVED MATERIAL */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide pl-3">
                  Library
                </h4>
                <div className="space-y-1">
                  {/* Saved bookmarks list items */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBookmarks) onOpenBookmarks();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-full hover:bg-zinc-150/40 dark:hover:bg-zinc-900/60 hover:text-[#CE2B5E] dark:hover:text-[#CE2B5E] transition-all text-left group min-h-[44px] cursor-pointer"
                  >
                    <span className="flex items-center gap-3.5 text-[14px] text-zinc-700 dark:text-zinc-300 font-medium">
                      <Bookmark className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-[#CE2B5E] transition-colors" />
                      <span>Saved expert guides</span>
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {bookmarks.length}
                    </span>
                  </button>

                  {/* Account detail row */}
                  {currentUser ? (
                    <div className="mx-1 mt-2 p-3 rounded-[20px] bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-850 flex items-center gap-3">
                      {currentUser.avatar_url ? (
                        <img 
                          src={currentUser.avatar_url} 
                          alt="User avatar" 
                          className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-3xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-zinc-800 text-rose-500 flex items-center justify-center font-sans font-bold text-xs shadow-3xs">
                          {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{currentUser.name}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* SECTION: PREFERENCES & UTILITIES */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide pl-3">
                  Settings & preferences
                </h4>
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-900/30 p-2.5 bg-zinc-50/20 dark:bg-zinc-950/10 space-y-1">


                  {/* Theme Selector */}
                  <div className="flex justify-between items-center text-sm px-3.5 py-2 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 rounded-full transition-colors">
                    <span className="text-zinc-750 dark:text-zinc-300 flex items-center gap-3.5 font-medium">
                      {theme === 'dark' ? <Moon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" /> : <Sun className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
                      <span>Dark theme</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        theme === 'dark' ? 'bg-rose-500' : 'bg-zinc-200 dark:bg-zinc-850'
                      }`}
                      aria-label="Toggle visual theme"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Section with CTA and Social Handles */}
            <div className="p-4 border-t border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0 space-y-4">
              {/* Premium Call-to-action */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('newsletter');
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-500 via-rose-600 to-fuchsia-600 active:scale-[0.98] text-white font-sans text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all hover:opacity-95 min-h-[48px]"
              >
                <span>Subscribe to Insights</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Social URLs handles list */}
              <div className="flex items-center justify-center gap-3">
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:scale-105 active:scale-95 transition-all bg-white dark:bg-zinc-900 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:scale-105 active:scale-95 transition-all bg-white dark:bg-zinc-900 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {twitterUrl && (
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:scale-105 active:scale-95 transition-all bg-white dark:bg-zinc-900 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
              </div>
              
              <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 tracking-wide font-sans">
                {siteSettings.site_name || 'Heartsync'} Wellness • {new Date().getFullYear()}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
