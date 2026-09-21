import React, { useState } from 'react';
import { 
  Heart, BookOpen, Folder, TrendingUp, HelpCircle, 
  Users, Mail, Shield, Scroll, ChevronDown, Bookmark 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { heartsync } from '../store';
import { Language, getTranslation } from '../utils/i18n';
import { getCategoryIcon } from '../utils/categoryIcons';

import { HeaderMenuItem } from '../types';

interface NavigationLinksProps {
  currentTab: string;
  onNavigate: (tab: string, arg?: string) => void;
  onLinkClick?: () => void;
  isMobile?: boolean;
  lang: Language;
  menuItems?: HeaderMenuItem[];
  textColor?: string;
}

const getMenuIcon = (url: string) => {
  switch (url) {
    case 'home': return Heart;
    case 'articles': return BookOpen;
    case 'trending': return TrendingUp;
    case 'faq': return HelpCircle;
    case 'about': return Users;
    case 'contact': return Mail;
    case 'privacy': return Shield;
    case 'terms': return Scroll;
    default: return Folder;
  }
};

export default function NavigationLinks({ 
  currentTab, 
  onNavigate, 
  onLinkClick, 
  isMobile = false,
  lang = 'en',
  menuItems,
  textColor
}: NavigationLinksProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categories = heartsync.categories;

  const mainLinks = [
    { label: getTranslation('home', lang), tab: 'home', icon: Heart },
    { label: getTranslation('articles', lang), tab: 'articles', icon: BookOpen },
    { label: getTranslation('trendingTitle', lang), tab: 'trending', icon: TrendingUp },
    { label: getTranslation('faq', lang), tab: 'faq', icon: HelpCircle },
    { label: getTranslation('about', lang), tab: 'about', icon: Users },
    { label: getTranslation('contact', lang), tab: 'contact', icon: Mail },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', tab: 'privacy', icon: Shield },
    { label: 'Terms of Service', tab: 'terms', icon: Scroll },
  ];

  const CustomMenuLinks = menuItems && menuItems.length > 0
    ? menuItems.filter(item => item.enabled).map(item => ({
        label: item.label,
        tab: item.url,
        icon: getMenuIcon(item.url)
      }))
    : mainLinks;

  const handleLinkNavigate = (tab: string, arg?: string) => {
    onNavigate(tab, arg);
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const isActive = (tab: string) => {
    return currentTab === tab;
  };

  // Base styling for links
  const baseLinkClass = isMobile
    ? "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-sans font-medium transition-all duration-200 active:scale-[0.98]"
    : "text-sm font-medium transition-colors cursor-pointer";

  const getLinkStyleAndColor = (tab: string): { className: string, style?: React.CSSProperties } => {
    const isTabActive = isActive(tab);
    if (isMobile) {
      if (isTabActive) {
        return { 
          className: `${baseLinkClass} font-semibold shadow-xs bg-rose-500/10`, 
          style: textColor ? { color: textColor } : { color: '#f43f5e' } 
        };
      }
      return { 
        className: `${baseLinkClass} text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 hover:text-rose-500 dark:hover:text-rose-400`
      };
    } else {
      if (isTabActive) {
        return { 
          className: `${baseLinkClass} font-semibold px-3 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 dark:shadow-[0_0_14px_rgba(244,63,94,0.22)]`,
          style: textColor ? { color: textColor } : { color: '#f43f5e' }
        };
      }
      return { 
        className: `${baseLinkClass} text-zinc-600 dark:text-zinc-350 hover:text-rose-500 px-3 py-1.5 rounded-full hover:bg-rose-500/5 dark:hover:bg-rose-500/10`,
        style: textColor ? { color: textColor + 'cc' } : undefined
      };
    }
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col gap-1.5' : 'items-center gap-6'} ${isMobile ? 'w-full' : ''}`} id="navigation-links-list">
      {CustomMenuLinks.map((link) => {
        const Icon = link.icon;
        const styleInfo = getLinkStyleAndColor(link.tab);
        return (
          <button
            key={link.tab}
            onClick={() => handleLinkNavigate(link.tab)}
            className={styleInfo.className}
            style={styleInfo.style}
            id={`nav-link-${link.tab}`}
          >
            {isMobile && <Icon className="w-5 h-5 opacity-80 shrink-0" />}
            <span>{link.label}</span>
          </button>
        );
      })}

      {/* Categories Multi-Level dropdown item */}
      {isMobile ? (
        <div className="w-full flex flex-col" id="mobile-categories-dropdown-wrapper">
          <button
            onClick={() => setCategoriesOpen(!categoriesOpen)}
            className={`${getLinkStyleAndColor('categories').className} flex items-center justify-between w-full`}
            style={getLinkStyleAndColor('categories').style}
            aria-expanded={categoriesOpen}
            aria-controls="mobile-categories-dropdown"
            id="nav-link-categories-toggle"
          >
            <span className="flex items-center gap-3.5">
              <Folder className="w-5 h-5 opacity-80 shrink-0" />
              <span>Categories</span>
            </span>
            <motion.div
              animate={{ rotate: categoriesOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            </motion.div>
          </button>

          <AnimatePresence>
            {categoriesOpen && (
              <motion.div
                id="mobile-categories-dropdown"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden pl-7 mt-1 flex flex-col gap-1.5 border-l-2 border-rose-100 dark:border-zinc-800 ml-4 py-1"
              >
                {/* Link to all categories */}
                <button
                  onClick={() => handleLinkNavigate('categories')}
                  className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-sans font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/25 hover:text-rose-500 transition-all text-left w-full active:scale-[0.98]"
                  id="nav-link-all-categories"
                >
                  <BookOpen className="w-4 h-4 text-rose-450 shrink-0" />
                  <span>Browse All Categories</span>
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleLinkNavigate('category', cat.slug)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-sans font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/25 hover:text-rose-500 transition-all text-left w-full active:scale-[0.98]"
                    id={`nav-link-cat-${cat.slug}`}
                  >
                    <span 
                      className="shrink-0"
                      style={{ color: cat.color }}
                    >
                      {getCategoryIcon(cat.slug, "w-4 h-4")}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <button
          onClick={() => handleLinkNavigate('categories')}
          className={getLinkStyleAndColor('categories').className}
          style={getLinkStyleAndColor('categories').style}
          id="nav-link-categories"
        >
          Categories
        </button>
      )}

      {/* Legal & Policy sections on mobile inside menu */}
      {isMobile && (
        <>
          <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800/60 my-2 mx-4" aria-hidden="true" />
          
          <div className="flex flex-col gap-1 w-full" id="mobile-legal-links-list">
            {legalLinks.map((link) => {
              const Icon = link.icon;
              const linkStyleInfo = getLinkStyleAndColor(link.tab);
              return (
                <button
                  key={link.tab}
                  onClick={() => handleLinkNavigate(link.tab)}
                  className={linkStyleInfo.className}
                  style={linkStyleInfo.style}
                  id={`nav-link-legal-${link.tab}`}
                >
                  <Icon className="w-5 h-5 opacity-70 shrink-0" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
