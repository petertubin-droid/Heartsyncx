import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

// The 16k-line admin console is split out of the reader bundle — it only
// downloads when an admin actually opens the admin tab.
const AdminConsole = React.lazy(() => import('./components/AdminConsole'));
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import BlogCard from './components/BlogCard';
import RelatedContentBlock from './components/RelatedContentBlock';
import ArticleShareRow from './components/ArticleShareRow';
import AnalyticsPanel from './components/AnalyticsPanel';
import RichTextEditor from './components/RichTextEditor';
import AdminLogin from './components/AdminLogin';
import AiCopilot from './components/AiCopilot';
import LoveVault from './components/LoveVault';
import ImageLightbox from './components/ImageLightbox';
import { CookieBanner } from './components/CookieBanner';
import { useCookieConsent } from './components/useCookieConsent';
import LiveChatWidget from './components/LiveChatWidget';
import SubscriptionPage from './components/SubscriptionPage';
import ArticleBodyWithInserts from './components/ArticleBodyWithInserts';
import ArticleTTS from './components/ArticleTTS';
import OfflineReaderBanner from './components/OfflineReaderBanner';
import { AdPlacement } from './components/AdPlacement';
import { AdNetworkScripts } from './components/AdNetworkScripts';
import { heartsync, getAuthors } from './store';
import { Post, Category, Author, SiteSettings, Topic } from './types';
import { HeartsyncLoader, LoadingProgressBar, HeartsyncSuspense, HeartsyncImage } from './components/LoadingSystem';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { preprocessMarkdownImages, MarkdownImageElement } from './utils/markdownImage';
import { Language, getSavedLanguage, getTranslation } from './utils/i18n';
import { getArticleSeoData } from './utils/seoArticleData';
import { getCategoryIcon } from './utils/categoryIcons';
import { clearUnauthorizedStorageKeys } from './utils/storageAudit';
import { 
  Heart, BookOpen, MessageSquare, Copy, ArrowLeft, Send, 
  HelpCircle, AlertTriangle, User, Smile, PlusCircle, CheckCircle, 
  Trash2, ShieldAlert, BadgeInfo, BellRing, Bookmark, ChevronRight,
  BookmarkX, Award, AlertCircle, RefreshCw, Mail, Settings, Twitter, Facebook, Link as LinkIcon, Calendar, Clock,
  HeartCrack, Brain, Flag, CircleDot, Lock, Play, Tv, Users, TrendingUp, Printer, Maximize2
} from 'lucide-react';

export default function App() {
  const { resetConsent, hasConsented, isInitialLoaded } = useCookieConsent();
  // Authentication Loading State
  const [authLoading, setAuthLoading] = useState(heartsync.authLoading);
  // Global premium animated loader state
  const [globalLoadingState, setGlobalLoadingState] = useState(heartsync.isGlobalLoading);
  // Navigation loading state for premium progressive transitions
  const [isNavigating, setIsNavigating] = useState(false);
  // Navigation State with full routing support
  const [currentTab, setCurrentTab] = useState<'home' | 'articles' | 'article' | 'categories' | 'category' | 'author' | 'search' | 'trending' | 'faq' | 'about' | 'contact' | 'privacy' | 'disclaimer' | 'terms' | 'cookies' | 'advertise' | 'newsletter' | 'error' | 'admin' | 'login' | 'access-denied' | 'subscription' | 'ai_copilot' | 'lovevault'>('home');
  const [tabArg, setTabArg] = useState<string>(''); // Holds slugs/ID arguments
  const [frontendTheme, setFrontendTheme] = useState<'light' | 'dark'>(() => {
    try {
      const existing = heartsync.getLocalStorage<string>('hs_frontend_theme', heartsync.getLocalStorage<string>('hs_theme', 'light'));
      return existing === 'dark' ? 'dark' : 'light';
    } catch (_) {
      return 'light';
    }
  });

  const [adminTheme, setAdminTheme] = useState<'light' | 'dark'>(() => {
    try {
      const existing = heartsync.getLocalStorage<string>('hs_admin_theme', 'light');
      return existing === 'dark' ? 'dark' : 'light';
    } catch (_) {
      return 'light';
    }
  });
  const [lang, setLang] = useState<Language>('en');
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024; // standard 1024px lg:hidden breakpoint
    }
    return false;
  });

  // Load language settings on mount & clean up any device-specific caching/layout storage
  useEffect(() => {
    setLang(getSavedLanguage());

    // Audit and clear any unauthorized or deprecated hs_* localStorage keys, preserving UI preferences
    try {
      clearUnauthorizedStorageKeys({ verbose: true });
    } catch (_) {}

    // Eradicate any old or accidental device-specific layout configurations in localStorage or sessionStorage
    const keysToClobber = ['device', 'deviceType', 'device_type', 'isMobile', 'is_mobile', 'viewport', 'layout_mode'];
    keysToClobber.forEach(k => {
      try {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      } catch (_) {}
    });

    // Delete any cookies containing device-related keywords to prevent view persistent issues
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        if (/device|mobile|viewport/i.test(name)) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      }
    } catch (_) {}

    // Attach viewport observer to listen to instantaneous screen resize events
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Interactive UI Data Metrics
  const [siteSettingsState, setSiteSettings] = useState(heartsync.site_settings);
  const [postsState, setPosts] = useState<Post[]>(heartsync.posts);
  const [categoriesState, setCategories] = useState<Category[]>(heartsync.categories);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Single post content helpers
  const [activeArticleState, setActiveArticle] = useState<Post | null>(null);

  // Premium Comfort Reading, Indicator Metrics & Anchor states
  const [readingTheme, setReadingTheme] = useState<'light' | 'dark' | 'sepia' | 'contrast'>(() => {
    try {
      const saved = heartsync.getLocalStorage('hs_reading_theme', 'light');
      if (saved === 'light' || saved === 'dark' || saved === 'sepia' || saved === 'contrast') {
        return saved as any;
      }
    } catch (_) {}
    return 'light'; // Default cozy book paper feel
  });
  const [scrollPercent, setScrollPercent] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [homeNewsletterEmail, setHomeNewsletterEmail] = useState('');
  const [homeNewsletterSubscribed, setHomeNewsletterSubscribed] = useState(false);
  const [copyFeedbackToast, setCopyFeedbackToast] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>(() => heartsync.bookmarks);

  useEffect(() => {
    const unsubscribeStore = heartsync.subscribe(() => {
      setBookmarkedArticles([...heartsync.bookmarks]);
    });
    const unsubscribeToast = heartsync.subscribeToast((msg) => {
      showToast(msg);
    });
    return () => {
      unsubscribeStore();
      unsubscribeToast();
    };
  }, []);

  const toggleBookmark = (postId: string) => {
    heartsync.toggleBookmark(postId);
  };

  const paragraphCountRef = useRef(0);

  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string; caption?: string } | null>(null);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');


  useEffect(() => {
    setHasLiked(false);
  }, [activeArticleState?.id]);

  // Elite design studio selectors loaders
  const layoutWidthSetting = siteSettingsState.layout_width || heartsync.getLocalStorage('pn_brand_layout_width', 'contained');
  const mainContainerClass = currentTab === 'article'
    ? 'flex-1 w-full max-w-none px-0 py-0'
    : (layoutWidthSetting === 'wide' ? 'flex-1 w-full max-w-none px-4 py-8 sm:px-8 md:px-14 xl:px-20' : 'flex-1 w-full max-w-[1536px] mx-auto px-4 py-8 sm:px-6 lg:px-8');

  const animationSetting = siteSettingsState.brand_animation || heartsync.getLocalStorage('pn_brand_animation', 'fade');
  const pageAnimations = useMemo(() => {
    switch (animationSetting) {
      case 'slide-fade':
        return {
          initial: { opacity: 0, x: -10 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 10 },
          transition: { duration: 0.2, ease: 'easeOut' }
        } as any;
      case 'bounce':
        return {
          initial: { opacity: 0, scale: 0.98 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.98 },
          transition: { type: 'spring', stiffness: 300, damping: 20 }
        } as any;
      case 'zoom':
        return {
          initial: { opacity: 0, scale: 1.01 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.99 },
          transition: { duration: 0.2, ease: 'easeOut' }
        } as any;
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -12 },
          transition: { duration: 0.2, ease: 'easeOut' }
        } as any;
      case 'drift-right':
        return {
          initial: { opacity: 0, x: -15 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 15 },
          transition: { duration: 0.25, ease: 'easeOut' }
        } as any;
      case 'slow-journal':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.5, ease: 'easeInOut' }
        } as any;
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.15, ease: 'easeOut' }
        } as any;
    }
  }, [animationSetting]);

  // Scroll Progress Percentage tracking
  useEffect(() => {
    const handleScroll = () => {
      const selection = document.documentElement;
      const scrollTop = selection.scrollTop || document.body.scrollTop;
      const scrollHeight = selection.scrollHeight || document.body.scrollHeight;
      const clientHeight = selection.clientHeight;
      const totalScrollable = scrollHeight - clientHeight;
      const percent = totalScrollable > 0 ? (scrollTop / totalScrollable) * 100 : 0;
      setScrollPercent(percent);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync localized reading theme preferences
  const handleReadingThemeToggle = (theme: 'light' | 'dark' | 'sepia' | 'contrast') => {
    setReadingTheme(theme);
    try {
      heartsync.setLocalStorage('hs_reading_theme', theme);
    } catch (_) {}
  };

  // Translation engine states
  const [translatedPosts, setTranslatedPosts] = useState<Post[]>([]);
  const [translatedCategories, setTranslatedCategories] = useState<Category[]>([]);
  const [translatedSiteSettings, setTranslatedSiteSettings] = useState<typeof heartsync.site_settings | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // 1. Serialization of translatable content to avoid translation re-triggers on engagement metrics (likes, views, bookmarks)
  const postsKey = useMemo(() => {
    return postsState.map(p => `${p.id}:${p.title}`).join('|');
  }, [postsState]);

  const categoriesKey = useMemo(() => {
    return categoriesState.map(c => `${c.id}:${c.name}`).join('|');
  }, [categoriesState]);

  const settingsKey = useMemo(() => {
    return `${siteSettingsState.site_name}:${siteSettingsState.site_description}:${siteSettingsState.newsletter_welcome_msg}:${siteSettingsState.related_block_title}`;
  }, [siteSettingsState]);

  const activeArticleId = activeArticleState?.id || '';

  // Single language site (English)
  useEffect(() => {
    setTranslatedPosts([]);
    setTranslatedCategories([]);
    setTranslatedSiteSettings(null);
    setIsTranslating(false);
  }, []);

  // Read-only shadowing variables for Reader mode dynamic localization
  const isAdminView = currentTab === 'login' || currentTab === 'admin';
  const siteSettings = (lang === 'en' || isAdminView) ? siteSettingsState : (translatedSiteSettings || siteSettingsState);
  const posts = (lang === 'en' || isAdminView) ? postsState : (translatedPosts.length > 0 ? translatedPosts : postsState);
  const categories = (lang === 'en' || isAdminView) ? categoriesState : (translatedCategories.length > 0 ? translatedCategories : categoriesState);
  const activeArticle = useMemo(() => {
    if (!activeArticleState) return null;
    if (lang === 'en' || isAdminView) return activeArticleState;
    return translatedPosts.find(p => p.id === activeArticleState.id) || activeArticleState;
  }, [activeArticleState, lang, translatedPosts, isAdminView]);
  const splitArticleContent = useMemo(() => {
    if (!activeArticle?.content) return null;
    const sections = activeArticle.content.split(/\n\s*\n/);
    if (sections.length <= 3) {
      return { firstHalf: activeArticle.content, secondHalf: null };
    }
    const midPoint = Math.floor(sections.length / 2);
    const firstHalf = sections.slice(0, midPoint).join('\n\n');
    const secondHalf = sections.slice(midPoint).join('\n\n');
    return { firstHalf, secondHalf };
  }, [activeArticle?.content]);

  // Premium dynamic headings parsing for table of contents
  const headings = useMemo(() => {
    if (!activeArticle?.content) return [];
    const lines = activeArticle.content.split('\n');
    const headingsList: { id: string; text: string; level: number }[] = [];
    lines.forEach(line => {
      const match = line.match(/^(#{2,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].trim();
        // Strip nested markdown annotations
        const text = rawText.replace(/\{[^}]+\}/g, '').replace(/ATTRS:.*/g, '').trim();
        const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
        if (text && text.length < 120) {
          headingsList.push({ id, text, level });
        }
      }
    });
    return headingsList;
  }, [activeArticle?.content]);

  // Sync scroll with active headline ID
  useEffect(() => {
    if (headings.length === 0) return;
    const handleSectionTracking = () => {
      let activeId = headings[0]?.id || '';
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180) {
            activeId = h.id;
          }
        }
      }
      setActiveHeadingId(activeId);
    };
    window.addEventListener('scroll', handleSectionTracking, { passive: true });
    return () => window.removeEventListener('scroll', handleSectionTracking);
  }, [headings]);

  // Dry components config for ReactMarkdown tags mapping
  const markdownComponents = useMemo(() => ({
    img: ({ src, alt, title }: any) => (
      <MarkdownImageElement src={src} alt={alt} title={title} />
    ),
    p: ({ children }: any) => {
      paragraphCountRef.current++;
      const isFirst = paragraphCountRef.current === 1;

      // Dropcap applies to first paragraph
      if (isFirst) {
        // Robust recursive dropcap extraction helper
        const extractFirstLetterFromNode = (node: any): { firstLetter: string; node: any } | null => {
          if (!node) return null;

          if (typeof node === 'string') {
            const trimmed = node.trimStart();
            if (trimmed.length > 0) {
              let firstLetter = trimmed[0];
              let restIndex = node.indexOf(firstLetter) + 1;

              // Smart quote check: if paragraph starts with quotes, combine quote with the first character
              const quotes = ['“', '”', '"', '‘', '’', "'", '«', '»', '「', '」'];
              if (quotes.includes(firstLetter) && trimmed.length > 1) {
                const nextChar = trimmed[1];
                if (/[a-zA-Z\w]/.test(nextChar)) {
                  firstLetter = firstLetter + nextChar;
                  restIndex = node.indexOf(nextChar) + 1;
                }
              }

              const rest = node.slice(restIndex);
              return { firstLetter, node: rest };
            }
            return null;
          }

          if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
              const result = extractFirstLetterFromNode(node[i]);
              if (result) {
                const newArray = [...node];
                newArray[i] = result.node;
                return {
                  firstLetter: result.firstLetter,
                  node: newArray
                };
              }
            }
            return null;
          }

          if (React.isValidElement(node)) {
            const element = node as React.ReactElement<any>;
            const result = extractFirstLetterFromNode(element.props.children);
            if (result) {
              return {
                firstLetter: result.firstLetter,
                node: React.cloneElement(element, { ...element.props }, result.node)
              };
            }
          }

          return null;
        };

        const result = extractFirstLetterFromNode(children);
        if (result) {
          const { firstLetter, node: remainingNode } = result;
          return (
            <p className="font-serif leading-relaxed text-zinc-850 dark:text-zinc-200 mb-6 text-lg sm:text-xl relative">
              <span 
                className="float-left font-serif font-black text-[#CE2B5E] dark:text-rose-400 select-none align-middle font-display mr-3.5 mt-2 block"
                style={{
                  fontSize: '5.2rem',
                  lineHeight: '0.72',
                  transform: 'scale-y(1.22)',
                  transformOrigin: 'top',
                  fontFamily: '"Playfair Display", "Lora", Georgia, serif',
                  marginRight: '0.55rem',
                  display: 'block',
                  float: 'left'
                }}
              >
                {firstLetter}
              </span>
              {remainingNode}
            </p>
          );
        }
      }

      return <p className="font-serif leading-relaxed text-zinc-800 dark:text-zinc-200 mb-6 text-base sm:text-lg">{children}</p>;
    },
    h2: ({ children }: any) => {
      const text = String(children || '');
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h2 id={id} className="scroll-mt-24 font-serif font-extrabold text-xl sm:text-2xl text-zinc-900 dark:text-zinc-50 border-b border-zinc-150/40 dark:border-zinc-800/60 pb-2.5 mt-9 mb-4 group relative flex items-center justify-between">
          <span>{children}</span>
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-rose-500 text-xs ml-2 transition-all font-sans font-bold select-none hover:underline">
            # Anchor Link
          </a>
        </h2>
      );
    },
    h3: ({ children }: any) => {
      const text = String(children || '');
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h3 id={id} className="scroll-mt-24 font-sans font-bold text-sm sm:text-base text-zinc-850 dark:text-zinc-100 mt-7 mb-3.5 group relative flex items-center justify-between">
          <span>{children}</span>
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-rose-400 text-[10px] ml-2 transition-all font-mono select-none hover:underline">
            # Anchor Link
          </a>
        </h3>
      );
    },
    blockquote: ({ children }: any) => {
      // Safely extract the inner text of the children elements
      let rawText = '';
      React.Children.forEach(children, (child) => {
        if (typeof child === 'string') {
          rawText += child;
        } else if (child && child.props) {
          if (typeof child.props.children === 'string') {
            rawText += child.props.children;
          } else if (Array.isArray(child.props.children)) {
            child.props.children.forEach((nested: any) => {
              if (typeof nested === 'string') rawText += nested;
            });
          }
        }
      });

      const text = rawText.trim();
      
      if (text.startsWith('[!NOTE]') || text.includes('[!NOTE]')) {
        const cleanText = text.replace(/\[!NOTE\]\s*/gi, '');
        return (
          <div className="my-6 p-4 bg-sky-50/70 dark:bg-sky-950/20 border-l-4 border-sky-500 rounded-r-2xl font-sans text-[13px] text-sky-800 dark:text-sky-305 space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-sky-500">
              <BadgeInfo className="w-4 h-4" /> Editorial Research Note
            </div>
            <p className="m-0 leading-relaxed font-sans">{cleanText || text}</p>
          </div>
        );
      }
      if (text.startsWith('[!WARNING]') || text.includes('[!WARNING]')) {
        const cleanText = text.replace(/\[!WARNING\]\s*/gi, '');
        return (
          <div className="my-6 p-4 bg-amber-50/70 dark:bg-amber-955/20 border-l-4 border-amber-500 rounded-r-2xl font-sans text-[13px] text-amber-850 dark:text-amber-305 space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-500">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Compliance Precaution Warning
            </div>
            <p className="m-0 leading-relaxed font-sans">{cleanText || text}</p>
          </div>
        );
      }
      if (text.startsWith('[!TIP]') || text.includes('[!TIP]')) {
        const cleanText = text.replace(/\[!TIP\]\s*/gi, '');
        return (
          <div className="my-6 p-4 bg-emerald-50/70 dark:bg-emerald-955/20 border-l-4 border-emerald-500 rounded-r-2xl font-sans text-[13px] text-emerald-855 dark:text-emerald-305 space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-emerald-505">
              <Heart className="w-4 h-4 text-emerald-500 animate-pulse" /> Practical Diagnostic Advice
            </div>
            <p className="m-0 leading-relaxed font-sans">{cleanText || text}</p>
          </div>
        );
      }

      return (
        <blockquote className="border-l-4 border-rose-500 pl-4 py-1.5 my-6 italic text-zinc-650 dark:text-zinc-400 font-serif leading-relaxed text-sm bg-rose-500/5 dark:bg-zinc-950/20 rounded-r-xl">
          {children}
        </blockquote>
      );
    }
  }), []);

  const [comments, setComments] = useState(heartsync.comments);
  const [commentInput, setCommentInput] = useState('');
  const [commentAuthorName, setCommentAuthorName] = useState('');
  const [commentAuthorEmail, setCommentAuthorEmail] = useState('');

  // AI Relationship Companion Chat Coach Widget States
  const [isCoachChatOpen, setIsCoachChatOpen] = useState(false);
  const [coachMessageInput, setCoachMessageInput] = useState('');
  const [coachMessages, setCoachMessages] = useState<Array<{ sender: 'user' | 'coach'; text: string; timestamp: Date }>>([
    {
      sender: 'coach',
      text: "Hi, I'm Katherine Mitchell, your expert AI Relationship Companion. I specialize in somatic co-regulation, Gottman conflict analysis, childhood attachment styles, and boundary calibration. How can I help nurture your connection space today?",
      timestamp: new Date()
    }
  ]);
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const [hasCoachUnread, setHasCoachUnread] = useState(true);

  // Interactive Home Screen Diagnostic state
  const [quizStep, setQuizStep] = useState<number>(0); // 0 = start/splash, 1, 2, 3 = question pages, 4 = score screen
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]); // 0=Secure, 1=Anxious, 2=Avoidant
  const [quizOutcome, setQuizOutcome] = useState<'secure' | 'anxious' | 'avoidant' | null>(null);

  // Reader Interactive Post Quiz session states
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [quizAnswerSubmitted, setQuizAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizSessionFinished, setQuizSessionFinished] = useState<boolean>(false);

  useEffect(() => {
    setActiveQuizIndex(0);
    setSelectedAnswerIndex(null);
    setQuizAnswerSubmitted(false);
    setQuizScore(0);
    setQuizSessionFinished(false);
    setIsPayingArticle(false);
  }, [activeArticle?.id]);

  // Admin and Newsletter popups
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  
  const [unlockedArticles, setUnlockedArticles] = useState<string[]>(() => {
    try {
      return JSON.parse(heartsync.getLocalStorage('hs_unlocked_articles', '[]'));
    } catch {
      return [];
    }
  });

  const [unlockedCategories, setUnlockedCategories] = useState<string[]>(() => {
    try {
      return JSON.parse(heartsync.getLocalStorage('hs_unlocked_categories', '[]'));
    } catch {
      return [];
    }
  });

  const [tempUnlockedArticles, setTempUnlockedArticles] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(heartsync.getLocalStorage('hs_temp_unlocked_articles', '{}'));
    } catch {
      return {};
    }
  });

  const [tempUnlockedCategories, setTempUnlockedCategories] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(heartsync.getLocalStorage('hs_temp_unlocked_categories', '{}'));
    } catch {
      return {};
    }
  });

  const unlockArticleInState = (id: string) => {
    setUnlockedArticles(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      heartsync.setLocalStorage('hs_unlocked_articles', JSON.stringify(next));
      return next;
    });
  };

  const tempUnlockArticle = (id: string, hours: number = 3) => {
    const expiresAt = Date.now() + hours * 60 * 60 * 1000;
    setTempUnlockedArticles(prev => {
      const next = { ...prev, [id]: expiresAt };
      heartsync.setLocalStorage('hs_temp_unlocked_articles', JSON.stringify(next));
      return next;
    });
  };

  const tempUnlockCategory = (id: string, hours: number = 3) => {
    const expiresAt = Date.now() + hours * 60 * 60 * 1000;
    setTempUnlockedCategories(prev => {
      const next = { ...prev, [id]: expiresAt };
      heartsync.setLocalStorage('hs_temp_unlocked_categories', JSON.stringify(next));
      return next;
    });
  };

  const unlockCategoryInState = (id: string) => {
    setUnlockedCategories(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      heartsync.setLocalStorage('hs_unlocked_categories', JSON.stringify(next));
      return next;
    });
  };

  // State variables for ad-watching experience
  const [adTarget, setAdTarget] = useState<{ type: 'article' | 'category'; id: string; title: string } | null>(null);
  const [adSecondsLeft, setAdSecondsLeft] = useState(15);
  const [adStep, setAdStep] = useState<'intro' | 'watching' | 'completed'>('intro');

  const checkIsCategoryLocked = (catId: string) => {
    if (heartsync.current_user?.role === 'admin') {
      return false;
    }
    const cat = categoriesState.find(c => c.id === catId);
    if (!cat || !cat.is_premium) {
      return false;
    }
    if (unlockedCategories.includes(catId)) {
      return false;
    }
    if (heartsync.current_user?.subscription_status === 'active') {
      return false;
    }
    const expiresAt = tempUnlockedCategories[catId];
    if (expiresAt && Date.now() < expiresAt) {
      return false;
    }
    return true;
  };

  const checkIsArticleLocked = (articleId: string) => {
    if (heartsync.current_user?.role === 'admin') {
      return false;
    }
    const article = publishedArticles.find(p => p.id === articleId) || posts.find(p => p.id === articleId);
    if (!article) return false;

    // Check custom premium access type if it exists
    const accessType = article.premium_access_type || (article.is_premium ? 'subscribers_only' : 'free');

    if (accessType === 'free') {
      return false;
    }

    let isLocked = false;
    const isSubscribed = heartsync.current_user?.subscription_status === 'active';
    const isLoggedIn = !!heartsync.current_user;

    if (heartsync.global_premium_locked) {
      isLocked = !isSubscribed;
    } else {
      switch (accessType) {
        case 'subscribers_only':
          isLocked = !isSubscribed;
          break;
        case 'watch_ad':
          isLocked = !isSubscribed;
          break;
        case 'premium_and_ad':
          isLocked = !isSubscribed;
          break;
        case 'members_only':
          isLocked = !isLoggedIn;
          break;
        default:
          isLocked = article.is_premium ? !isSubscribed : false;
      }
    }

    if (isLocked) {
      if (unlockedArticles.includes(articleId)) {
        isLocked = false;
      }
      const expiresAt = tempUnlockedArticles[articleId];
      if (expiresAt && Date.now() < expiresAt) {
        isLocked = false;
      }
    }

    // If still not locked, check if its parent category is locked
    if (!isLocked && article.category_id) {
      if (checkIsCategoryLocked(article.category_id)) {
        isLocked = true;
      }
    }

    return isLocked;
  };

  // Ad countdown timer effect
  useEffect(() => {
    if (adTarget && adStep === 'watching' && adSecondsLeft > 0) {
      const timer = setInterval(() => {
        setAdSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setAdStep('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [adTarget, adStep, adSecondsLeft]);

  // Premium Single Article Checkout State variables
  const [articlePaymentPortal, setArticlePaymentPortal] = useState<'stripe' | 'paystack' | 'paypal'>('stripe');
  const [isPayingArticle, setIsPayingArticle] = useState(false);
  const [payCardNum, setPayCardNum] = useState('4242 4242 4242 4242');
  const [payEmail, setPayEmail] = useState(heartsync.current_user?.email || '');
  const [payExpiry, setPayExpiry] = useState('12/28');
  const [payCvc, setPayCvc] = useState('321');

  // Admin focused CMS selection
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isCreatingNewPost, setIsCreatingNewPost] = useState(false);

  // Sync URL with site tab on mount & handle popstate browser back/forward buttons
  useEffect(() => {
    // H-08: anonymous page-view beacon — persisted server-side via the
    // log_page_view() RPC (fire-and-forget; failures are silent and safe).
    const logPageView = (path: string) => {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      }).catch(() => {});
    };
    logPageView(window.location.pathname);

    // Initial sync
    syncUrlWithTab(window.location.pathname);

    // Watch popstate
    const handlePopState = () => {
      logPageView(window.location.pathname);
      syncUrlWithTab(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update dynamic SEO indexing, meta tags and Open Graph values based on active tab and settings
  useEffect(() => {
    // 1. Determine local title, description, keywords, image, type
    let title = siteSettings.seo_site_title || siteSettings.site_name || 'Heartsync';
    let description = siteSettings.seo_site_description || siteSettings.site_description || '';
    let keywords = siteSettings.seo_site_keywords || '';
    let ogImage = siteSettings.og_image_url || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200';
    let ogType = siteSettings.og_type || 'website';
    let robotsValue = siteSettings.seo_robots_tag || 'index, follow';

    // Block admin pages from search index explicitly
    const isAdminLoc = window.location.pathname.startsWith('/admin') || currentTab === 'login' || currentTab === 'access-denied';
    if (isAdminLoc) {
      robotsValue = 'noindex, nofollow';
    }

    if (currentTab === 'article' && activeArticle) {
      title = activeArticle.seo_title || activeArticle.title || title;
      description = activeArticle.seo_description || activeArticle.excerpt || description;
      if (activeArticle.tags && activeArticle.tags.length > 0) {
        keywords = activeArticle.tags.join(', ');
      } else {
        keywords = 'article, connection, emotional-wellness';
      }
      ogImage = activeArticle.featured_image || ogImage;
      ogType = 'article';
    } else if (currentTab === 'category') {
      const cat = categories.find(c => c.slug === tabArg);
      if (cat) {
        title = cat.seo_title || `${cat.name} | ${siteSettings.site_name || 'Heartsync'}`;
        description = cat.seo_description || cat.description || description;
        keywords = `${cat.slug}, relationships, healing, wellness`;
        ogImage = cat.featured_image || ogImage;
      }
    }

    // 2. Set browser title
    document.title = title;

    // Helper to create or update meta elements
    const setMetaTag = (attrName: string, attrValue: string, contentValue: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${attrValue}"]` : `meta[name="${attrValue}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentValue || '');
    };

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', robotsValue);
    
    if (siteSettings.seo_google_verification) {
      setMetaTag('name', 'google-site-verification', siteSettings.seo_google_verification);
    }
    
    // Open Graph
    setMetaTag('property', 'og:title', siteSettings.og_title || title, true);
    setMetaTag('property', 'og:description', siteSettings.og_description || description, true);
    setMetaTag('property', 'og:image', ogImage, true);
    setMetaTag('property', 'og:type', ogType, true);
    setMetaTag('property', 'og:site_name', siteSettings.og_site_name || siteSettings.site_name || 'Heartsync', true);
    setMetaTag('property', 'og:url', window.location.href, true);

    // Twitter card
    setMetaTag('name', 'twitter:card', siteSettings.twitter_card || 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);
    if (siteSettings.twitter_creator) {
      setMetaTag('name', 'twitter:creator', siteSettings.twitter_creator);
    }
    if (siteSettings.twitter_site) {
      setMetaTag('name', 'twitter:site', siteSettings.twitter_site);
    }

    // Canonical Link Elements (dynamic resolution to support multiple active subdomains)
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', window.location.href);

    // Clean up older JSON-LD structured schema script blocks
    const existingJsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    existingJsonLd.forEach(element => element.remove());

    // Construct comprehensive JSON-LD object for search crawls
    const authorObj = activeArticle ? (heartsync.authors.find(a => a.id === activeArticle.author_id) || { name: 'Heartsync Editorial Board' }) : { name: 'Heartsync Editorial Board' };
    
    const schemasToInject: any[] = [];

    // Base WebPage schema
    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "url": window.location.href,
      "publisher": {
        "@type": "Organization",
        "name": siteSettings.site_name || "Heartsync Relationship Journal",
        "logo": {
          "@type": "ImageObject",
          "url": ogImage
        }
      }
    };
    schemasToInject.push(webPageSchema);

    // If on an article page, inject BlogPosting, BreadcrumbList, and FAQPage schemas
    if (currentTab === 'article' && activeArticle) {
      // 1. BlogPosting Schema
      const blogPostingSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "description": description,
        "image": ogImage,
        "datePublished": activeArticle.publish_date || new Date().toISOString(),
        "dateModified": activeArticle.publish_date || new Date().toISOString(),
        "author": {
          "@type": "Person",
          "name": authorObj.name
        },
        "publisher": {
          "@type": "Organization",
          "name": siteSettings.site_name || "Heartsync Relationship Journal",
          "logo": {
            "@type": "ImageObject",
            "url": ogImage
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        }
      };
      schemasToInject.push(blogPostingSchema);

      // 2. BreadcrumbList Schema
      const matchedCat = categories.find(c => c.id === activeArticle.category_id || c.slug === activeArticle.category_id);
      if (matchedCat) {
        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": window.location.origin
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": matchedCat.name,
              "item": `${window.location.origin}/category/${matchedCat.slug}`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": activeArticle.title,
              "item": window.location.href
            }
          ]
        };
        schemasToInject.push(breadcrumbSchema);
      }

      // 3. FAQPage Schema
      try {
        const seoData = getArticleSeoData(activeArticle.slug || '', activeArticle.title || '');
        if (seoData && seoData.faq && seoData.faq.length > 0) {
          const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": seoData.faq.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          };
          schemasToInject.push(faqSchema);
        }
      } catch (e) {
        console.error("Error generating FAQ schema", e);
      }
    } else if (currentTab === 'category') {
      const cat = categories.find(c => c.slug === tabArg);
      if (cat) {
        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": window.location.origin
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": cat.name,
              "item": window.location.href
            }
          ]
        };
        schemasToInject.push(breadcrumbSchema);
      }
    }

    schemasToInject.forEach(schema => {
      const schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      schemaScript.innerHTML = JSON.stringify(schema);
      document.head.appendChild(schemaScript);
    });
  }, [currentTab, tabArg, activeArticle, siteSettings, categories]);

  // Init Theme and Store subscriptions
  useEffect(() => {
    const unsubscribe = heartsync.subscribe(() => {
      setPosts([...heartsync.posts]);
      setCategories([...heartsync.categories]);
      setComments([...heartsync.comments]);
      setSiteSettings({ ...heartsync.site_settings });
      setAuthLoading(heartsync.authLoading);
      setGlobalLoadingState(heartsync.isGlobalLoading);
    });

    setSiteSettings({ ...heartsync.site_settings });

    // Local storage is authoritative; direct external database synchronization on startup is disabled to protect content and reduce data consumption.
    setSiteSettings({ ...heartsync.site_settings });

    return () => {
      unsubscribe();
    };
  }, []);

  // Re-sync URL with tab once authentication session has finished restoring
  useEffect(() => {
    if (!authLoading) {
      syncUrlWithTab(window.location.pathname);
    }
  }, [authLoading]);

  // Sync dynamic CSS variables color overrides based on brand settings fields
  useEffect(() => {
    const primary = siteSettings.primary_color || '#db2777';
    const secondary = siteSettings.secondary_color || '#be185d';
    const accent = siteSettings.accent_color || '#fda4af';

    let style = document.getElementById('dynamic-branding-vars') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-branding-vars';
      document.head.appendChild(style);
    }
    style.innerHTML = `
      :root {
        --color-rose-600: ${primary} !important;
        --color-rose-700: ${secondary} !important;
        --color-rose-100: ${accent} !important;
        --color-rose-500: ${primary} !important;
      }
    `;
  }, [siteSettings]);

  // Sync index and body classes dynamically based on the active tab and its active theme
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    const activeTheme = currentTab === 'admin' ? adminTheme : frontendTheme;

    if (activeTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [currentTab, frontendTheme, adminTheme]);

  // Sync frontend theme changes
  useEffect(() => {
    heartsync.setLocalStorage('hs_frontend_theme', frontendTheme);
    heartsync.setLocalStorage('hs_theme', frontendTheme); // For backwards compatibility
  }, [frontendTheme]);

  // Sync admin theme changes
  useEffect(() => {
    heartsync.setLocalStorage('hs_admin_theme', adminTheme);
  }, [adminTheme]);

  // Routing Guard Core Logic
  const verifyAndSetTab = async (tab: any, arg: string = '') => {
    if (heartsync.authLoading) {
      return;
    }

    // Admin access requires a signed-in admin account — no auto-provisioned sessions
    if (tab === 'admin' || tab === 'access-denied') {
      if (!heartsync.current_user || heartsync.current_user.role !== 'admin') {
        setCurrentTab('login');
        setTabArg('');
        return;
      }
      setCurrentTab('admin');
      setTabArg(arg);
      return;
    }
    if (tab === 'login') {
      setCurrentTab('login');
      setTabArg(arg);
      return;
    }

    setCurrentTab(tab);
    setTabArg(arg);

    if (tab === 'article') {
      const match = heartsync.posts.find(p => p.slug === arg);
      if (match) {
        setActiveArticle(match);
        heartsync.recordView(match.id);
        // Full body ships per-article (not in the boot payload) — enrich lazily.
        if (!match.content) {
          heartsync.ensureArticleContent(match).then(enriched => {
            if (enriched) setActiveArticle(enriched);
          });
        }
      } else {
        window.history.replaceState(null, '', '/404');
        setCurrentTab('error');
      }
    }
  };

  // Convert browser URL pathname to Heartsync active tab
  const syncUrlWithTab = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    const firstSegment = parts[0] || '';

    if (path === '/' || path === '') {
      verifyAndSetTab('home');
    } else if (path === '/login' || path === '/admin/login' || path === '/access-denied' || path === '/admin' || path.startsWith('/admin/')) {
      verifyAndSetTab('admin');
    } else if (firstSegment === 'articles') {
      verifyAndSetTab('articles');
    } else if (firstSegment === 'categories') {
      verifyAndSetTab('categories');
    } else if (firstSegment === 'subscription') {
      verifyAndSetTab('subscription');
    } else if (firstSegment === 'ai-copilot') {
      verifyAndSetTab('ai_copilot');
    } else if (firstSegment === 'lovevault') {
      verifyAndSetTab('lovevault');
    } else if (firstSegment === 'trending') {
      verifyAndSetTab('trending');
    } else if (firstSegment === 'faq') {
      verifyAndSetTab('faq');
    } else if (firstSegment === 'about') {
      verifyAndSetTab('about');
    } else if (firstSegment === 'contact') {
      verifyAndSetTab('contact');
    } else if (firstSegment === 'privacy') {
      verifyAndSetTab('privacy');
    } else if (firstSegment === 'disclaimer') {
      verifyAndSetTab('disclaimer');
    } else if (firstSegment === 'terms') {
      verifyAndSetTab('terms');
    } else if (firstSegment === 'cookies') {
      verifyAndSetTab('cookies');
    } else if (firstSegment === 'advertise') {
      verifyAndSetTab('advertise');
    } else if (firstSegment === 'newsletter') {
      verifyAndSetTab('newsletter');
    } else if (firstSegment === 'subscription' || firstSegment === 'premium') {
      verifyAndSetTab('subscription');
    } else if (firstSegment === 'category' && parts[1]) {
      verifyAndSetTab('category', parts[1]);
    } else if (firstSegment === 'article' && parts[1]) {
      verifyAndSetTab('article', parts[1]);
    } else if (firstSegment === 'author' && parts[1]) {
      verifyAndSetTab('author', parts[1]);
    } else if (firstSegment === '404' || firstSegment === 'error') {
      verifyAndSetTab('error');
    } else {
      // Fallback for custom tab queries
      const knownTabs = ['home', 'articles', 'article', 'categories', 'category', 'author', 'search', 'trending', 'faq', 'about', 'contact', 'privacy', 'disclaimer', 'terms', 'cookies', 'advertise', 'newsletter', 'error', 'admin', 'login', 'access-denied', 'subscription'];
      if (knownTabs.includes(firstSegment)) {
        verifyAndSetTab(firstSegment as any, parts[1] || '');
      } else {
        verifyAndSetTab('home');
      }
    }
  };

  // Shared Sidebar Component containing Dynamic Trending Insights and Newsletter Subscription
  const renderSidebar = () => {
    return (
      <div className="space-y-8">
        {/* Trending list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-rose-100/40 dark:border-zinc-800/60">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-zinc-850 dark:text-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>Trending contents</span>
            </div>
            <button 
              onClick={() => navigateTo('articles')} 
              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 font-sans uppercase tracking-widest cursor-pointer bg-transparent border-none outline-none"
            >
              View all
            </button>
          </div>

          <div className="flex flex-col gap-4 font-sans">
            {publishedArticles.slice(0, 4).map((post, idx) => {
              const matchedCat = categories.find(c => c.id === post.category_id);
              return (
                <div 
                  key={post.id} 
                  onClick={() => navigateTo('article', post.slug)}
                  className="flex gap-3.5 group items-start cursor-pointer pb-3 border-b border-rose-50/50 dark:border-zinc-900 last:border-b-0"
                >
                  <span className="text-xl font-serif font-black text-zinc-200 dark:text-zinc-800 select-none group-hover:text-rose-500 transition-colors mt-0.5 font-mono">
                    0{idx+1}
                  </span>
                  <div className="space-y-0.5">
                    {matchedCat && (
                      <span className="text-[9px] font-bold uppercase tracking-wider font-sans block" style={{ color: matchedCat.color }}>
                        {matchedCat.name}
                      </span>
                    )}
                    <h5 className="text-[12px] font-sans font-bold leading-snug text-zinc-850 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                      {post.title}
                    </h5>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block">
                      {post.read_time} min read • {new Date(post.publish_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Newsletter Subscription Section */}
        <div className="p-6 bg-[#D9F99D] hover:bg-[#E2FFA1] dark:bg-lime-950/20 dark:hover:bg-lime-950/30 border-2 border-zinc-950 dark:border-lime-500/20 text-zinc-950 dark:text-zinc-100 rounded-3xl space-y-4 transition-all duration-300 relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#BEF264]/20 rounded-bl-full pointer-events-none" />
          <div className="space-y-2">
            <span className="inline-block px-2 py-0.5 bg-zinc-950 text-[#D9F99D] text-[9px] font-bold font-mono rounded uppercase tracking-wider">ANNUAL ACCESS</span>
            <h3 className="font-serif font-black text-2xl lg:text-3xl text-zinc-950 dark:text-white leading-tight">
              SUBSCRIBE TO READ MORE
            </h3>
            <p className="text-xs font-sans font-semibold hover:opacity-100 opacity-90 leading-relaxed text-zinc-800 dark:text-zinc-350">
              Get unbridled access for <strong>80 cents/week</strong> and receive our premium attachment diagnostic bundles, offline relationship planners, and monthly coaching workshops.
            </p>
          </div>
          <div>
            <button 
              onClick={() => navigateTo('newsletter')}
              className="w-full text-center py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:scale-[1.02] active:scale-[0.98] transition-transform font-sans text-xs font-bold rounded-xl shadow-md cursor-pointer uppercase tracking-wider"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Navigates state and synchronizes public URL history states
  const navigateTo = (tab: any, arg: string = '', skipScroll: boolean = false) => {
    setIsNavigating(true);
    setTimeout(() => {
      setIsNavigating(false);
    }, 150); // Fast, snappy progress bar animation

    if (!skipScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    let path = '/';
    if (tab === 'home') path = '/';
    else if (tab === 'articles') path = '/articles';
    else if (tab === 'categories') path = '/categories';
    else if (tab === 'trending') path = '/trending';
    else if (tab === 'faq') path = '/faq';
    else if (tab === 'about') path = '/about';
    else if (tab === 'contact') path = '/contact';
    else if (tab === 'privacy') path = '/privacy';
    else if (tab === 'disclaimer') path = '/disclaimer';
    else if (tab === 'terms') path = '/terms';
    else if (tab === 'cookies') path = '/cookies';
    else if (tab === 'advertise') path = '/advertise';
    else if (tab === 'newsletter') path = '/newsletter';
    else if (tab === 'subscription') path = '/subscription';
    else if (tab === 'ai_copilot') path = '/ai-copilot';
    else if (tab === 'lovevault') path = '/lovevault';
    else if (tab === 'admin') path = '/admin';
    else if (tab === 'login') path = '/login';
    else if (tab === 'access-denied') path = '/access-denied';
    else if (tab === 'category') path = `/category/${arg}`;
    else if (tab === 'article') path = `/article/${arg}`;
    else if (tab === 'author') path = `/author/${arg}`;
    else if (tab === 'error') path = '/404';

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    
    verifyAndSetTab(tab, arg);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleReaction = (postId: string, reactType: 'love' | 'insightful' | 'support' | 'warmth') => {
    heartsync.reactToPost(postId, reactType);
    showToast(`Registered your ${reactType} reaction!`);
  };

  const submitComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    heartsync.addComment(
      postId, 
      commentInput, 
      undefined, 
      commentAuthorName || undefined, 
      commentAuthorEmail || undefined
    );
    setCommentInput('');
    setCommentAuthorName('');
    setCommentAuthorEmail('');
    showToast('Your emotional wellness comment is posted!');
  };

  const handlePremiumReaderCommentSubmit = (
    e: React.FormEvent, 
    postId: string, 
    commentText: string, 
    authorName?: string, 
    authorEmail?: string
  ) => {
    e.preventDefault();
    heartsync.addComment(postId, commentText, undefined, authorName, authorEmail);
    showToast('Your emotional wellness comment is posted!');
  };

  // Filter & Search computation helpers
  const publishedArticles = posts.filter(p => p.status === 'published');

  if (authLoading) {
    return <HeartsyncLoader />;
  }
  
  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 selection:bg-rose-100 selection:text-rose-900 overflow-x-hidden">
      
      {/* Premium Fullscreen Overlay Loader */}
      <AnimatePresence>
        {globalLoadingState && <HeartsyncLoader isFullScreen={true} />}
      </AnimatePresence>

      {/* Dynamic Global Top Progress Route Bar */}
      <LoadingProgressBar isAnimating={isNavigating} />

      {/* Header element & Offline Cozy Reader Banner */}
      <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out ${isInitialLoaded && !hasConsented && currentTab !== 'admin' ? 'blur-md pointer-events-none select-none' : ''}`}>
        <OfflineReaderBanner />
        {currentTab !== 'admin' && (
        <Header 
          currentTab={currentTab} 
          onNavigate={navigateTo} 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={frontendTheme}
          setTheme={setFrontendTheme}
          lang={lang}
          setLang={setLang}
        />
      )}

      {/* Global Header Banner Ad Placement (Google AdSense) — never on admin/auth/error views */}
      {['admin', 'login', 'error', 'access-denied'].every((t) => t !== currentTab) && (
        <div className="max-w-6xl mx-auto px-4 w-full">
          <AdPlacement slot="header" />
        </div>
      )}

      {/* Floating alert notification toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 px-4 py-3 rounded-2xl shadow-xl border border-zinc-850 dark:border-zinc-100 flex items-center gap-2 text-xs font-semibold font-sans"
          >
            <Heart className="w-4 h-4 text-rose-500 animate-spin" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Translation Notice */}
      {isTranslating && (
        <div className="w-full bg-rose-50/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-900/50 py-2.5 px-6 flex items-center justify-center gap-2 text-xs font-sans font-medium text-rose-600 dark:text-rose-400 transition-all">
          <Heart className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
          <span>Heartsync AI is translating site content and articles into {lang.toUpperCase()}...</span>
        </div>
      )}

      {/* Primary Page Canvas */}
      <main className={mainContainerClass}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentTab}-${tabArg}`}
            {...pageAnimations}
            style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)', willChange: 'opacity, transform' }}
          >
            <HeartsyncSuspense isLoading={false} type={
              currentTab === 'home' ? 'home' :
              currentTab === 'article' ? 'article' :
              currentTab === 'admin' ? 'dashboard' :
              currentTab === 'author' ? 'profile' :
              ['categories', 'category', 'articles', 'search', 'trending'].includes(currentTab) ? 'grid' :
              'home'
            }>
              {/* Global breadcrumbs — every page except home/admin/auth keeps a
                  crawlable Home trail; article/category views have their own richer trail. */}
            {(() => {
              const crumbs: { label: string; onClick?: () => void }[] = [{ label: 'Home', onClick: () => navigateTo('home') }];
              const staticLabels: Record<string, string> = {
                articles: 'Journal',
                categories: 'Categories',
                trending: 'Trending',
                faq: 'FAQ',
                about: 'About',
                contact: 'Contact',
                privacy: 'Privacy Policy',
                disclaimer: 'Disclaimer',
                terms: 'Terms of Service',
                cookies: 'Cookie Policy',
                advertise: 'Advertise',
                newsletter: 'Newsletter',
                subscription: 'Premium Membership',
                ai_copilot: 'AI Guide',
                lovevault: 'LoveVault',
                search: 'Search'
              };
              if (currentTab === 'articles') {
                crumbs.push({ label: 'Journal', onClick: () => navigateTo('articles') });
              } else if (currentTab === 'categories') {
                crumbs.push({ label: 'Categories', onClick: () => navigateTo('categories') });
              } else if (currentTab === 'category') {
                crumbs.push({ label: 'Categories', onClick: () => navigateTo('categories') });
                const cat = heartsync.categories.find(c => c.slug === tabArg);
                crumbs.push({ label: cat?.name || tabArg });
              } else if (currentTab === 'author') {
                crumbs.push({ label: 'Authors', onClick: () => navigateTo('articles') });
                const author = heartsync.authors?.find((a: any) => a.slug === tabArg);
                crumbs.push({ label: author?.name || tabArg });
              } else if (staticLabels[currentTab]) {
                crumbs.push({ label: staticLabels[currentTab] });
              }

              const showBreadcrumbs = currentTab !== 'home' && currentTab !== 'admin' && currentTab !== 'login' &&
                currentTab !== 'error' && currentTab !== 'access-denied' && currentTab !== 'article';

              if (!showBreadcrumbs || crumbs.length < 2) return null;
              return (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-sans tracking-wide uppercase font-semibold mb-6 select-none">
                  {crumbs.map((c, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span aria-hidden="true">/</span>}
                      {c.onClick ? (
                        <button onClick={c.onClick} className="hover:text-rose-600 transition-colors">{c.label}</button>
                      ) : (
                        <span aria-current="page" className="text-zinc-600 dark:text-zinc-300">{c.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              );
            })()}

               {/* 1. HOMEPAGE */}
            {currentTab === 'home' && (() => {
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
                    { id: 'sec-categories', type: 'categories', title: "Explore by Topic", subtitle: "Dive into the subjects that matter most — each curated with depth and intention.", is_active: true },
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

              {/* Homepage mid-feed ad slot (Google AdSense, lazy) */}
              {['admin', 'login', 'error', 'access-denied'].every((t) => t !== currentTab) && (
                <div className="max-w-6xl mx-auto px-4 w-full">
                  <AdPlacement slot="homepage" className="my-8" lazy />
                </div>
              )}
              // Redesign requirements: Inject Latest Articles and Premium Articles sections if not already present
              if (!seenTypes.has('latest_articles')) {
                homeSectionsList.push({ id: 'sec-latest-articles', type: 'latest_articles', title: "Latest Publications", is_active: true });
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
                      const bgType = heroSettings.bg_type || 'solid';
                      const heroBgStyle: React.CSSProperties = {};
                      
                      if (bgType === 'solid') {
                        heroBgStyle.backgroundColor = heroSettings.bg_color || '#FAF5F5';
                      } else if (bgType === 'gradient') {
                        const start = heroSettings.bg_gradient_start || heroSettings.bg_color || '#ffffff';
                        const end = heroSettings.bg_gradient_end || '#ffe4e6';
                        const angle = heroSettings.bg_gradient_angle || '135deg';
                        heroBgStyle.backgroundImage = `linear-gradient(${angle}, ${start}, ${end})`;
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
                        } else {
                          heroBgStyle.backgroundColor = heroSettings.bg_color || '#FAF5F5';
                        }
                      }

                      // Adjust custom coloring details from the theme settings
                      const textOverrideStyle: React.CSSProperties = {
                        color: heroSettings.text_color || undefined
                      };
                      const headingStyle: React.CSSProperties = {
                        color: heroSettings.heading_color || heroSettings.text_color || undefined
                      };
                      const subheadingStyle: React.CSSProperties = {
                        color: heroSettings.subheading_color || heroSettings.text_color || undefined
                      };
                      const badgeStyle: React.CSSProperties = {
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
                              className="premium-card relative overflow-hidden rounded-[2.5rem] border border-rose-100/20 dark:border-rose-500/25 dark:shadow-[0_0_60px_-14px_rgba(244,63,94,0.28)] p-5 sm:p-12 lg:p-16 transition-all duration-300 shadow-sm"
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
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                      <div className="absolute bottom-6 left-6 right-6 text-white p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#FFF0F2] font-bold">Spotlight Display</p>
                                        <h4 className="text-xs sm:text-sm font-sans font-extrabold leading-snug truncate mt-0.5">Spotlight Graphic Active</h4>
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
                      const finalTopicsTitle = siteSettings?.homepage_topics_title || "EXPLORE BY TOPIC";
                      const finalTopicsSubheading = siteSettings?.homepage_topics_subheading || "Explore expert insights, practical guidance, and inspiring stories across topics that matter most. Discover trusted resources designed to inform, support, and empower every step of your journey.";
                      const animationsEnabled = siteSettings?.homepage_topics_animations_enabled !== false;
                      const columnsDesktop = siteSettings?.homepage_topics_columns ?? 3;

                      const rawTopics = siteSettings?.homepage_topics && siteSettings.homepage_topics.length > 0
                        ? siteSettings.homepage_topics
                        : (heartsync.site_settings.homepage_topics || []);

                      // Filter to only display Published topics
                      const rawPublishedTopics = (rawTopics && rawTopics.length > 0 ? rawTopics : [])
                        .filter((t: any) => t.status === 'Published');

                      const exploreTopicsLimit = siteSettings?.explore_topics_display_limit ?? 6;
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
                                Browse topics that matter most — curated with depth and intention.
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
                      const finalLatestTitle = "Latest Publications";
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
                              <span>Browse All Publications</span>
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
                                    Explore Custom Guides
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
                      const finalTrendingTitle = siteSettings?.homepage_trending_title || sec.title || "Trending Now";
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
                                <div 
                                  key={item.id || idx}
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
                                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-100/30 dark:border-zinc-850/30 shadow-sm shrink-0">
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
                                </div>
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
                          <div className="w-full bg-[#D2F57B] dark:bg-zinc-950 text-zinc-950 dark:text-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-zinc-950 dark:border-rose-500/20 shadow-md dark:shadow-[0_0_30px_rgba(244,63,94,0.15)]">
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
                })})()}
              </div>
            );
          })()}

            {/* 2. ALL ARTICLES DIRECTORY */}
            {currentTab === 'articles' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <div className="pb-5 border-b border-zinc-150 dark:border-zinc-800 dark:border-rose-500/15">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-sans tracking-widest text-[#CE2B5E] uppercase font-bold">
                      <span className="w-6 h-[2px] bg-rose-500 rounded-full" />
                      The Journal
                    </span>
                    <h1 className="font-serif font-bold text-3xl sm:text-4xl text-zinc-900 dark:text-white mt-2 tracking-tight">Heartsync Wellness Journals</h1>
                    <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-sans mt-1.5 max-w-xl leading-relaxed">Expert essays on emotional resilience, attachment, and relationship wellness — written by clinicians, curated with care.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {publishedArticles.map(post => (
                      <BlogCard 
                        key={post.id} 
                        post={post} 
                        onClick={() => navigateTo('article', post.slug)}
                        onNavigate={navigateTo}
                      />
                    ))}
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 lg:pl-6 border-t lg:border-t-0 lg:border-l border-rose-100/30 dark:border-zinc-850 pt-8 lg:pt-0">
                  {renderSidebar()}
                </div>
              </div>
            )}
            {/* 3. SINGLE ARTICLE DETAIL PAGE VIEW */}
            {currentTab === 'article' && activeArticle && (() => {
              // Wired article design settings (AdminConsole > Article Design) — previously dead
              const artLayout = siteSettings.article_layout || 'standard';
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
              const mobileShareStyle = siteSettings.article_mobile_share_style || 'dock';
              const showMobileDock = mobileShareStyle === 'dock' && siteSettings.article_mobile_sticky_actions !== false;
              const bodyWidthClass = siteSettings.article_desktop_content_width || siteSettings.article_content_width || 'max-w-none';
              const lineHeightMap: Record<string, string> = { normal: 'leading-normal', relaxed: 'leading-relaxed', loose: 'leading-loose', snug: 'leading-snug' };
              const lineHeightClass = lineHeightMap[siteSettings.article_line_height || 'relaxed'] || 'leading-relaxed';
              const spacingClass = siteSettings.article_paragraph_spacing || 'space-y-5';
              const headingsClass = (siteSettings.article_heading_styles || 'serif-bold') === 'sans-black'
                ? 'article-headings-sans' : 'article-headings-serif';

              return (
              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${siteSettings.article_atmospheric_linen ? 'article-linen rounded-2xl' : ''}`}>
                <div className={`col-span-12 ${mainSpanClass} ${sidebarLeft && showArtSidebar ? 'lg:order-2' : ''} space-y-6`}>
                
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

                <ArticleTTS content={activeArticle.content} />

                {mobileShareStyle === 'inline' && (
                  <div className="md:hidden flex items-center justify-center py-3 border-b border-zinc-150 dark:border-zinc-800/60">
                    <ArticleShareRow title={activeArticle.title} />
                  </div>
                )}

                {/* Article header bar: back control + reader settings */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/60 font-sans">
                  <button 
                    onClick={() => navigateTo('articles')}
                    className="inline-flex items-center gap-1.5 hover:text-rose-600 text-xs font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer transition-colors duration-200 w-fit"
                    aria-label="Back to journal feed"
                  >
                    <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    All Articles
                  </button>

                  {/* READER SETTINGS TOOLBAR */}
                  <div className="flex items-center gap-2 sm:gap-3 bg-zinc-50 dark:bg-zinc-900/60 py-1.5 px-2 sm:px-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80">
                    {/* Reading theme swatches */}
                    <div className="flex items-center gap-1.5">
                      {(['light', 'sepia', 'dark', 'contrast'] as const).map((t) => {
                        const swatch = t === 'light' ? 'bg-white border-zinc-300'
                          : t === 'sepia' ? 'bg-amber-100 border-amber-200'
                          : t === 'dark' ? 'bg-zinc-800 border-zinc-700'
                          : 'bg-black border-black';
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setReadingTheme(t);
                              try { heartsync.setLocalStorage('hs_reading_theme', t); } catch (_) {}
                            }}
                            aria-label={`${t} reading theme`}
                            title={`${t[0].toUpperCase()}${t.slice(1)} theme`}
                            className={`w-5 h-5 rounded-full border cursor-pointer transition-all duration-200 ${swatch} ${
                              readingTheme === t 
                                ? 'ring-2 ring-rose-500 ring-offset-1 dark:ring-offset-zinc-900' 
                                : 'opacity-60 hover:opacity-100'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <span className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

                    {/* Text size controls */}
                    <div className="flex items-center gap-1" title="Adjust text size">
                      <button
                        type="button"
                        onClick={() => setTextSize(prev => prev === 'xl' ? 'lg' : prev === 'lg' ? 'base' : 'sm')}
                        disabled={textSize === 'sm'}
                        className="w-6 h-6 grid place-items-center rounded-md text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-default"
                        aria-label="Decrease text size"
                      >
                        A−
                      </button>
                      <button
                        type="button"
                        onClick={() => setTextSize(prev => prev === 'sm' ? 'base' : prev === 'base' ? 'lg' : 'xl')}
                        disabled={textSize === 'xl'}
                        className="w-6 h-6 grid place-items-center rounded-md text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-default"
                        aria-label="Increase text size"
                      >
                        A+
                      </button>
                    </div>

                    <span className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />

                    {/* Bookmark */}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(activeArticle.id)}
                      aria-label={bookmarkedArticles.includes(activeArticle.id) ? "Remove bookmark" : "Bookmark article"}
                      className={`w-6 h-6 grid place-items-center rounded-md transition-all cursor-pointer ${
                        bookmarkedArticles.includes(activeArticle.id)
                          ? 'text-amber-500'
                          : 'text-zinc-400 hover:text-rose-500'
                      }`}
                      title={bookmarkedArticles.includes(activeArticle.id) ? "Remove Bookmark" : "Bookmark / Save Article"}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${bookmarkedArticles.includes(activeArticle.id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Print */}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      aria-label="Print article"
                      className="w-6 h-6 grid place-items-center rounded-md text-zinc-400 hover:text-rose-500 cursor-pointer transition-colors"
                      title="Print / Save as PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Reading Comfort & Theme Context Outer Wrapper */}
                <div id="heartsync-premium-article-reading-body" className="space-y-8 bg-transparent text-zinc-850 dark:text-zinc-100">
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
                    const imgPos = siteSettings.article_image_position || 'top';
                    const aspectClass = siteSettings.article_image_aspect_ratio === '21/9' ? 'aspect-[21/9]' :
                                        siteSettings.article_image_aspect_ratio === '16/9' ? 'aspect-video' :
                                        siteSettings.article_image_aspect_ratio === '4/3' ? 'aspect-[4/3]' :
                                        siteSettings.article_image_aspect_ratio === '1:1' ? 'aspect-square' :
                                        'aspect-[16/10] sm:aspect-[21/9] lg:aspect-[2.4]';
                    const roundClass = siteSettings.article_image_rounded_corners === 'none' ? 'rounded-none' :
                                       siteSettings.article_image_rounded_corners === 'xl' ? 'rounded-xl' :
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-zinc-150/40 dark:border-zinc-850/40 font-sans">
                          {/* Author details */}
                          {(siteSettings.article_meta_author_enabled !== false) && (
                            <div className="flex items-center gap-3">
                              <img 
                                src={authorObj.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                                alt={authorObj.name} 
                                className="w-10 h-10 rounded-full object-cover border border-zinc-200/50 dark:border-zinc-800 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <strong className="block text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-serif font-black leading-tight">
                                  {authorObj.name}
                                </strong>
                                <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5 font-medium leading-none">
                                  {authorObj.role_tag || authorObj.role || 'Relationship & Wellness Expert'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Right: Date and Reading Time */}
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 dark:text-zinc-500 font-bold sm:text-right">
                            {(siteSettings.article_meta_date_enabled !== false) && (
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(activeArticle.publish_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            )}
                            {(siteSettings.article_meta_date_enabled !== false && siteSettings.article_meta_reading_time_enabled !== false) && (
                              <span className="text-zinc-350 dark:text-zinc-700 select-none">•</span>
                            )}
                            {(siteSettings.article_meta_reading_time_enabled !== false) && (
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {activeArticle.read_time} min read
                              </span>
                            )}
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
                            className={`relative overflow-hidden ${aspectClass} ${roundClass} shadow-lg border border-zinc-200/20 dark:border-zinc-800 group ${
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

                            {/* Category Badge - Left Overlaid if standard style */}
                            {matchedCat && articleHeroStyle === 'standard' && (
                              <div className="absolute top-4 left-4 z-10">
                                <span 
                                  className="px-3.5 py-1 rounded-full text-[9px] font-sans font-extrabold tracking-widest text-white uppercase shadow-md backdrop-blur-md"
                                  style={{ backgroundColor: `${matchedCat.color}dd` || '#CE2B5E' }}
                                >
                                  {matchedCat.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Image Caption & Credit line */}
                          {siteSettings.article_image_caption_enabled !== false && (
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
                          <div className={`relative rounded-2xl md:rounded-[2rem] overflow-hidden ${siteSettings.article_mobile_image_height && siteSettings.article_mobile_image_height !== 'h-auto' ? siteSettings.article_mobile_image_height : 'aspect-video'} sm:aspect-[2.4] mb-4 group shadow-xl`}>
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

                    // DEFAULT STYLE: 'standard' (Beautiful Video-Aligned Overlaid Layout)
                    // Incorporates Image Positions: top | below-title | below-meta
                    return (
                      <div className="space-y-6">
                        {renderBreadcrumbs()}

                        {imgPos === 'top' && renderFeaturedImage()}

                        <div className="space-y-4">
                          <h1 className="font-serif font-black text-2xl sm:text-4xl md:text-5xl leading-tight tracking-tight text-zinc-900 dark:text-white">
                            {activeArticle.title}
                          </h1>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-4xl">
                            {activeArticle.excerpt}
                          </p>
                        </div>

                        {imgPos === 'below-title' && renderFeaturedImage()}

                        {renderMetadataAndAuthorRow()}

                        {imgPos === 'below-meta' && renderFeaturedImage()}
                      </div>
                    );
                  })()}

                  {/* 3. Social Share Actions under the header */}
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



                  {/* Editor's review badge (article_editorial_notes_enabled + expert_reviewer_* settings) */}
                  {siteSettings.article_editorial_notes_enabled !== false && (siteSettings.expert_reviewer_signature_text || siteSettings.expert_reviewer_credentials_desc) && (
                    <div className="flex items-start gap-3 p-4 bg-rose-50/60 dark:bg-zinc-900/60 border border-rose-100 dark:border-zinc-800 rounded-2xl">
                      <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                        <span className="font-bold">Editor's review.</span>{' '}
                        {siteSettings.expert_reviewer_signature_text && <>{siteSettings.expert_reviewer_signature_text} — </>}
                        {siteSettings.expert_reviewer_credentials_desc}
                      </div>
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
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
                        
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

                              {/* Indented Table of Contents Widget embedded in sticky region */}
                              {siteSettings.article_table_of_contents_enabled !== false && headings.length > 0 && (
                                <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-805/50 space-y-2 text-left">
                                  <span className="text-[9px] font-mono tracking-widest text-zinc-400 uppercase font-bold block mb-1">Index Map</span>
                                  <ul className="space-y-1.5 text-[11px] font-sans">
                                    {headings.map((h) => (
                                      <li key={h.id} className="leading-tight">
                                        <a
                                          href={`#${h.id}`}
                                          className={`block transition-all hover:text-rose-500 ${
                                            h.level === 3 ? 'pl-2 text-zinc-400 dark:text-zinc-500' : 'font-semibold'
                                          } ${
                                            activeHeadingId === h.id 
                                              ? 'text-rose-505 border-l-2 border-rose-505 pl-1.5 font-bold' 
                                              : 'text-zinc-550 dark:text-zinc-400'
                                          }`}
                                        >
                                          {h.text}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* B. MIDDLE POSITIONED MAIN MARKDOWN BODY */}
                        <div className={`${bodyColSpan} space-y-6`}>

                      {/* DYNAMIC ARTICLE AUTHOR PROFILE STRIP (Requirement: display before start of content, screenshot format) */}
                      {(() => {
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
                            className="border-t border-b border-zinc-200 dark:border-zinc-800 py-3 my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans text-zinc-500 dark:text-zinc-400"
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
                                  {activeArticle.content.substring(0, 320) + '...'}
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
                                          id="hs-pay-3"
                                          <input
                                            type="text"
                                            value={payExpiry}
                                            onChange={(e) => setPayExpiry(e.target.value)}
                                            placeholder="MM/YY"
                                            className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500 text-center"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          id="hs-pay-4"
                                          <label htmlFor="hs-pay-4" className="text-[9px] uppercase font-mono text-zinc-450 block">CVV</label>
                                          <input
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
                              content={activeArticle.content}
                              inserts={activeArticle.in_article_inserts}
                              markdownComponents={markdownComponents}
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

                      {/* Related Content Auto-Injected Block (or in sidebar per article_desktop_related_placement) */}
                      {!relatedInSidebar && (
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
                      {activeArticle.allow_comments && (
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
                  <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200/80 dark:border-zinc-850 p-2.5 z-40 flex items-center justify-around md:hidden shadow-2xl backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => navigateTo('articles')}
                      className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-rose-500 cursor-pointer flex flex-col items-center gap-0.5"
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
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 cursor-pointer relative flex flex-col items-center gap-0.5"
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
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 flex flex-col items-center gap-0.5"
                    >
                      <Facebook className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-wider">Share</span>
                    </a>

                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activeArticle.title)}&url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 flex flex-col items-center gap-0.5"
                    >
                      <Twitter className="w-5 h-5" />
                      <span className="text-[8px] uppercase tracking-wider">Post</span>
                    </a>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${activeArticle.title} ${window.location.href}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 flex flex-col items-center gap-0.5"
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
                    {relatedInSidebar && (
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
            })()}
            
            {/* 4. COMPREHENSIVE CATEGORIES INDEX */}
            {currentTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <div className="pb-4 border-b border-zinc-150 dark:border-zinc-800">
                    <span className="text-[10px] font-mono tracking-widest text-[#F43F5E] block uppercase font-bold">Aesthetic Topic Mapping</span>
                    <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white mt-1">Interpersonal Categories</h1>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-sans mt-0.5">Filter through specialized connection topics to discover practical, research-backed connection steps.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(cat => {
                      const count = posts.filter(p => p.category_id === cat.id && p.status === 'published').length;
                      return (
                        <div 
                          key={cat.id} 
                          onClick={() => navigateTo('category', cat.slug)}
                          className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-955/30 hover:scale-[1.01] hover:shadow-md cursor-pointer transition-all space-y-3 relative group"
                        >
                          <div style={{ color: cat.color }} className="transition-transform duration-305 group-hover:scale-110">
                            {getCategoryIcon(cat.slug, "w-7 h-7")}
                          </div>
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-sans font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-450 transition-colors">{cat.name}</h3>
                              {cat.is_premium && (
                                <span className="text-[8px] font-mono uppercase bg-rose-50 dark:bg-rose-955/30 text-rose-500 px-1.5 py-0.5 rounded-md font-bold tracking-wider flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Premium
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-mono font-bold text-rose-500 uppercase tracking-widest mt-0.5 block">{count} Published Articles</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 lg:pl-6 border-t lg:border-t-0 lg:border-l border-rose-100/30 dark:border-zinc-850 pt-8 lg:pt-0">
                  {renderSidebar()}
                </div>
              </div>
            )}

            {/* 5. FILTERED TOPIC CATEGORIES VIEW */}
            {currentTab === 'category' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                {(() => {
                  const cat = categories.find(c => c.slug === tabArg);
                  if (!cat) return <p>Category Not Found</p>;
                  const catPosts = publishedArticles.filter(p => p.category_id === cat.id);
                  const isCatLocked = checkIsCategoryLocked(cat.id);

                  if (isCatLocked) {
                    const catPriceVal = cat.price !== undefined ? cat.price : 4.99;
                    const formattedCatPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(catPriceVal);

                    const handleCatPurchaseSubmit = (e: React.FormEvent) => {
                      e.preventDefault();
                      if (!payEmail) {
                        showToast('Please specify a valid email to receive your secure receipt and keys');
                        return;
                      }
                      setIsPayingArticle(true);
                      setTimeout(() => {
                        setIsPayingArticle(false);
                        unlockCategoryInState(cat.id);
                        showToast(`Access Approved! Unlocked all guides under '${cat.name}' safely with ${articlePaymentPortal.toUpperCase()}!`);
                        heartsync.logAction('Category Purchase', `'${cat.name}' was unlocked for ${formattedCatPrice} via ${articlePaymentPortal.toUpperCase()}`);
                      }, 1500);
                    };

                    return (
                      <div className="space-y-6 relative" id="category-paylocked-panel">
                        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Topic Pillar Active</span>
                            <h1 className="font-serif font-bold text-2xl text-zinc-950 dark:text-white flex items-center gap-2.5">
                              <span style={{ color: cat.color }}>
                                {getCategoryIcon(cat.slug, "w-7 h-7")}
                              </span>
                              {cat.name}
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans max-w-xl">{cat.description}</p>
                          </div>
                          <button onClick={() => navigateTo('categories')} className="text-xs font-sans font-bold text-rose-500 hover:underline">
                             View All Topics
                          </button>
                        </div>

                        {/* Blurred placeholder cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 blur-[1.5px] select-none pointer-events-none">
                          {[1, 2].map(i => (
                            <div key={i} className="p-6 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-850 space-y-3">
                              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
                              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
                            </div>
                          ))}
                        </div>

                        {/* Rich luxury premium micro-checkout card */}
                        <div className="relative pt-8 pb-10 px-6 sm:px-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-xl overflow-hidden text-left">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/5 blur-[40px] rounded-full pointer-events-none" />
                          
                          <div className="flex items-center gap-4 border-b border-zinc-200/60 dark:border-zinc-800 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono uppercase bg-rose-50 dark:bg-rose-955/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md font-bold tracking-wider">
                                PREMIUM TOPIC BLOCK
                              </span>
                              <h3 className="font-serif font-extrabold text-base text-zinc-900 dark:text-white mt-1">
                                Unlock All Content under: {cat.name}
                              </h3>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Left: Benefits & Information */}
                            <div className="md:col-span-5 space-y-3">
                              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                                <span className="text-[10px] text-zinc-400 block uppercase font-mono tracking-wider">Topic Category Price</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-2xl font-serif font-black text-rose-500">{formattedCatPrice}</span>
                                  <span className="text-[10px] text-zinc-400">USD</span>
                                </div>
                              </div>

                              <div className="text-[11px] text-zinc-500 space-y-2 leading-relaxed font-sans">
                                <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                  You get complete and secure access to all articles under this topic category:
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-500 dark:text-zinc-400">
                                  <li>Unlimited premium articles in this silo</li>
                                  <li>Relationship guides & expert tips</li>
                                  <li>Full translation and text-to-speech audio</li>
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

                              {/* WATCH AD OPTION FOR CATEGORY */}
                              <div className="pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800 mt-2">
                                <span className="text-[10px] text-zinc-400 block mb-1">FREE TEMPORARY ACCESS:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdTarget({ type: 'category', id: cat.id, title: cat.name });
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

                            {/* Right: Payment Form */}
                            <div className="md:col-span-7 bg-white dark:bg-zinc-900/60 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider mb-2">
                                  Choose Dollar-Supported Gateways:
                                </span>
                                
                                <div className="grid grid-cols-3 gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl">
                                  {['stripe', 'paystack', 'paypal'].map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => setArticlePaymentPortal(p as any)}
                                      className={`py-1.5 rounded-lg text-[9px] font-mono tracking-tighter uppercase font-bold text-center cursor-pointer transition-all ${articlePaymentPortal === p ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                      {p.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <form onSubmit={handleCatPurchaseSubmit} className="space-y-3">
                                <div className="space-y-1">
                                  id="hs-pay-5"
                                  <label htmlFor="hs-pay-5" className="text-[9px] uppercase font-mono text-zinc-450 block">Your Receipt Email</label>
                                  <input
                                    type="email"
                                    required
                                    value={payEmail}
                                    onChange={(e) => setPayEmail(e.target.value)}
                                    placeholder="you@domain.com"
                                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500"
                                  />
                                </div>

                                id="hs-pay-6"
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="col-span-2 space-y-1">
                                    <label htmlFor="hs-pay-6" className="text-[9px] uppercase font-mono text-zinc-450 block">Card Number</label>
                                    <input
                                      type="text"
                                      value={payCardNum}
                                      onChange={(e) => setPayCardNum(e.target.value)}
                                      placeholder="4242 4242 4242 4242"
                                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500"
                                    id="hs-pay-7"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label htmlFor="hs-pay-7" className="text-[9px] uppercase font-mono text-zinc-450 block">Expiry</label>
                                    <input
                                      type="text"
                                      value={payExpiry}
                                      onChange={(e) => setPayExpiry(e.target.value)}
                                      placeholder="MM/YY"
                                      id="hs-pay-8"
                                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500 text-center"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label htmlFor="hs-pay-8" className="text-[9px] uppercase font-mono text-zinc-450 block">CVV</label>
                                    <input
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
                                      Authorizing...
                                    </span>
                                  ) : (
                                    <span>🔒 Securely Unlock Category ({formattedCatPrice})</span>
                                  )}
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Topic Pillar Active</span>
                          <h1 className="font-serif font-bold text-2xl text-zinc-950 dark:text-white flex items-center gap-2.5">
                            <span style={{ color: cat.color }}>
                              {getCategoryIcon(cat.slug, "w-7 h-7")}
                            </span>
                            {cat.name}
                          </h1>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans max-w-xl">{cat.description}</p>
                        </div>
                        <button onClick={() => navigateTo('categories')} className="text-xs font-sans font-bold text-rose-500 hover:underline">
                           View All Topics
                        </button>
                      </div>

                      {catPosts.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-zinc-900 border rounded-2xl p-6">
                          <BookmarkX className="w-12 h-12 text-rose-300 dark:text-zinc-800 mx-auto mb-2" />
                          <p className="text-sm font-bold">No Published Contents Found</p>
                          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">Our writers are working with relationship experts to compile articles matching this topic category currently.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {catPosts.map(post => (
                            <BlogCard 
                              key={post.id} 
                              post={post} 
                              onClick={() => navigateTo('article', post.slug)}
                              onNavigate={navigateTo}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
                </div>

                <div className="col-span-12 lg:col-span-4 lg:pl-6 border-t lg:border-t-0 lg:border-l border-rose-100/30 dark:border-zinc-850 pt-8 lg:pt-0">
                  {renderSidebar()}
                </div>
              </div>
            )}

            {/* 6. AUTHOR PROFILES INDEX / DETAILS */}
            {currentTab === 'author' && (
              <div className="space-y-8">
                {(() => {
                  const auth = getAuthors().find(a => a.id === tabArg) || getAuthors()[0];
                  const authPosts = publishedArticles.filter(p => p.author_id === auth.id);

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                      
                      {/* Left Detail bio pane */}
                      <div className="space-y-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl h-fit font-sans text-center lg:text-left">
                        <img 
                          src={auth.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} 
                          alt={auth.name} 
                          className="w-24 h-24 rounded-full object-cover mx-auto lg:mx-0 border-2 border-rose-100/30" 
                        />
                        <div>
                          <h2 className="font-serif font-extrabold text-lg text-zinc-900 dark:text-white">{auth.name}</h2>
                          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest block mt-0.5">{auth.role_tag || auth.role || 'Contributor'}</span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          {auth.bio || 'Heartsync relationship expert editing wellness guides and tips.'}
                        </p>
                        <div className="pt-3 border-t border-zinc-50 dark:border-zinc-800 text-[10px] font-mono text-zinc-400 text-center uppercase tracking-wide">
                          Verified Relationship Advisor
                        </div>
                      </div>

                      {/* Right Post listings */}
                      <div className="lg:col-span-3 space-y-6">
                        <div className="pb-3 border-b border-zinc-100 dark:border-zinc-850">
                          <h3 className="font-serif font-bold text-xl text-zinc-850 dark:text-zinc-100">Articles Authored by {auth.name}</h3>
                          <p className="text-xs text-zinc-400 mt-0.5">Explore relationship tips, emotional wellness guides, and expert dating advice compiled by this author.</p>
                        </div>

                        {authPosts.length === 0 ? (
                          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border p-4">
                            <p className="text-sm font-semibold text-zinc-400">No Articles on Release Found.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {authPosts.map(post => (
                              <BlogCard 
                                key={post.id} 
                                post={post} 
                                onClick={() => navigateTo('article', post.slug)}
                                onNavigate={navigateTo}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}

            {/* 7. DYNAMIC SEARCH RESULTS PAGE */}
            {currentTab === 'search' && (
              <div className="space-y-8">
                <div className="pb-4 border-b border-zinc-150 dark:border-zinc-800">
                  <span className="text-[10px] font-mono tracking-widest text-rose-500 block uppercase font-bold">System Database Query</span>
                  <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white mt-1">Search Results</h1>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-sans mt-0.5">Query matched against keywords, abstracts, or markdown contents.</p>
                </div>

                {(() => {
                  const cleaned = searchQuery.trim().toLowerCase();
                  const matches = publishedArticles.filter(p => 
                    p.title.toLowerCase().includes(cleaned) || 
                    p.excerpt.toLowerCase().includes(cleaned) || 
                    p.content.toLowerCase().includes(cleaned) ||
                    p.tags.some(t => t.toLowerCase().includes(cleaned))
                  );

                  return (
                    <>
                      <div className="text-xs font-sans text-zinc-500 dark:text-zinc-400">
                         Displaying <strong>{matches.length} matches</strong> matching: "<strong className="text-rose-500">{searchQuery}</strong>"
                      </div>

                      {matches.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-zinc-900 border rounded-3xl p-6">
                          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                          <p className="text-sm font-bold font-sans">No Aligned Compatibility Found</p>
                          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">Our algorithm failed to resolve relationship documents matching that string query. Try keywords like "slow", "burnout", or "attachment".</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {matches.map(post => (
                            <BlogCard 
                              key={post.id} 
                              post={post} 
                              onClick={() => navigateTo('article', post.slug)}
                              onNavigate={navigateTo}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* 8. TRENDING POSTS ALGORITHM PAGE */}
            {currentTab === 'trending' && (
              <div className="space-y-8">
                <div className="pb-4 border-b border-zinc-150 dark:border-zinc-800">
                  <span className="text-[10px] font-mono tracking-widest text-rose-500 block uppercase font-bold">Trending Connections</span>
                  <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white mt-1">Highly Resonating Insights</h1>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-sans mt-0.5">Ranking computed on absolute view records combined with heart likes.</p>
                </div>

                {(() => {
                  const sorted = [...publishedArticles].sort((a, b) => b.views + b.likes * 2 - (a.views + a.likes * 2));

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sorted.map((post, idx) => (
                        <div key={post.id} className="relative">
                          {/* Counter overlay floating badge */}
                          <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-rose-500 text-white font-sans text-xs font-bold flex items-center justify-center shadow-lg">
                            #{idx + 1}
                          </div>
                          <BlogCard 
                            post={post} 
                            onClick={() => navigateTo('article', post.slug)}
                            onNavigate={navigateTo}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 9. HELP & FAQ COMPLIANCE */}
            {currentTab === 'faq' && (
              <div className="max-w-3xl mx-auto space-y-6 font-sans">
                <div className="text-center space-y-1 pb-4 border-b">
                  <span className="text-[10px] uppercase font-bold text-rose-500 font-mono tracking-widest">Help Center</span>
                  <h1 className="font-serif font-bold text-2xl text-zinc-950 dark:text-white">Interpersonal FAQs</h1>
                  <p className="text-xs text-zinc-400">Resolving platform queries, pricing frameworks and relationship steps.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-2">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Who writes the articles on Heartsync?</h3>
                    <p className="text-xs leading-relaxed text-zinc-650 dark:text-zinc-350">
                       All articles are authored or reviewed by relationship advisors and dating experts. Our blog posts act as intuitive educational guides and are not direct therapy or professional medical services.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-2">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Are my comment boards anonymous?</h3>
                    <p className="text-xs leading-relaxed text-zinc-650 dark:text-zinc-350">
                       Your emails are processed through strict, secure hashing rules and never displayed publicly or sold. You have complete flexibility to use abstract display initials to maintain complete privacy if needed.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-2">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">How do I whitelist Heartsync on my browser?</h3>
                    <p className="text-xs leading-relaxed text-zinc-650 dark:text-zinc-350">
                       We strictly monitor programmatic display slots so they comply with non-obstructive AdSense parameters. Adding Heartsync to your whitelist supports independent writers to generate insights for thousands of readers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 10. ABOUT US PAGE */}
            {currentTab === 'about' && (
              <div className="max-w-3xl mx-auto space-y-6 font-sans">
                {(() => {
                  const customPage = heartsync.pages.find(p => !p.is_deleted && (p.page_type === 'about' || p.slug === tabArg));
                  if (customPage) {
                    return (
                      <div className="space-y-6 text-xs text-zinc-650 leading-relaxed">
                        <h1 className="font-serif font-extrabold text-3xl text-zinc-950 dark:text-white pb-3 border-b border-zinc-150 dark:border-zinc-800 tracking-tight">
                          {customPage.title}
                        </h1>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-605 dark:text-zinc-350 leading-relaxed markdown-body">
                          <ReactMarkdown
                            urlTransform={(url) => url}
                            components={{
                              img: ({ src, alt, title }) => (
                                <MarkdownImageElement src={src} alt={alt} title={title} />
                              )
                            }}
                          >
                            {preprocessMarkdownImages(customPage.content)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      <h1 className="font-serif font-extrabold text-3xl text-zinc-900 dark:text-white text-center">About Heartsync</h1>
                      <p className="text-xs text-zinc-400 text-center uppercase tracking-wider font-mono">Exploring human connectivity since 2026</p>
                      
                      <img alt="" 
                        src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200" 
                        className="w-full max-h-64 object-cover rounded-3xl" 
                      />

                      <div className="space-y-4 text-xs leading-relaxed text-zinc-650 dark:text-zinc-400">
                        <p>
                          Heartsync was established as an aesthetic response to swipe-culture burnout. We believe modern digital products gamify dating, shortening conversations into instant judgements. This speed leaves individuals with deep relationship anxieties, defense patterns, and decision overload.
                        </p>
                        <p>
                          Our mission is to translate expert psychology concepts—specifically Bowlby's Attachment styles, Gottman's communication parameters, and nervous-system co-regulation templates—into beautiful, actionable lifestyle essays. We compile readable schemas so you can map your relational landscape safely.
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* 11. CONTACT US PAGE */}
            {currentTab === 'contact' && (
              <div className="max-w-lg mx-auto bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-6 font-sans">
                {(() => {
                  const customPage = heartsync.pages.find(p => !p.is_deleted && (p.page_type === 'contact' || p.slug === 'contact'));
                  if (customPage) {
                    return (
                      <div className="space-y-4">
                        <h1 className="font-serif font-bold text-2xl text-center text-zinc-900 dark:text-white">{customPage.title}</h1>
                        <div className="prose prose-sm dark:prose-invert text-[11px] text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
                          <ReactMarkdown urlTransform={(url) => url}>
                            {customPage.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="text-center">
                      <h1 className="font-serif font-bold text-2xl">Contact Heartsync Editorial</h1>
                      <p className="text-[11px] text-zinc-400 mt-1">For syndicate queries, advertising suggestions, or relationship coach applications. You can reach us directly at <a href="mailto:support@heartsync.app" className="text-rose-500 font-bold hover:underline">support@heartsync.app</a>.</p>
                    </div>
                  );
                })()}

                {contactSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-center text-xs space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <strong>Relational Communication Received</strong>
                    <p className="text-[10px] text-zinc-500">Our editorial director will review your query within 48 business hours.</p>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmittingContact(true);
                      setTimeout(() => {
                        setSubmittingContact(false);
                        setContactSuccess(true);
                        heartsync.logAction('Contact Form Submitted', 'Contact inquiry saved.');
                      }, 1000);
                    }}
                    className="space-y-3.5 text-xs"
                  >
                    <div className="space-y-1">
                      <label htmlFor="hs-req-name" className="text-[10px] uppercase font-bold text-zinc-400">Vulnerable Name</label>
                      <input id="hs-req-name" type="text" required className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="hs-req-email" className="text-[10px] uppercase font-bold text-zinc-400">Secure Email Address</label>
                      <input id="hs-req-email" type="email" required className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-100 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="hs-req-query" className="text-[10px] uppercase font-bold text-zinc-400">Statement Query</label>
                      <textarea id="hs-req-query" rows={4} required className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none text-zinc-800 dark:text-zinc-100 outline-none" placeholder="Is there a specific relationship topic, dating tip, or wellness essay idea you'd like to share with us?" />
                    </div>
                    <button 
                      type="submit"
                      disabled={submittingContact}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      {submittingContact ? 'Transmitting...' : 'Transmit Query'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 12-15 LEGAL PAGES (Dynamic Overrides and Custom Slack URLs support) */}
            {['privacy', 'terms', 'cookies', 'disclaimer'].includes(currentTab) && (
              <div className="max-w-3xl mx-auto space-y-6 font-sans text-xs text-zinc-650 leading-relaxed">
                {(() => {
                  const customPage = heartsync.pages.find(p => !p.is_deleted && (p.page_type === currentTab || p.slug === currentTab || p.slug === tabArg || (currentTab === 'cookies' && p.page_type === 'cookie')));
                  if (customPage) {
                    return (
                      <div className="space-y-6">
                        <h1 className="font-serif font-extrabold text-3xl text-zinc-950 dark:text-white pb-3 border-b border-zinc-150 dark:border-zinc-800 tracking-tight">
                          {customPage.title}
                        </h1>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-655 dark:text-zinc-350 leading-relaxed markdown-body">
                          <ReactMarkdown
                            urlTransform={(url) => url}
                            components={{
                              img: ({ src, alt, title }) => (
                                <MarkdownImageElement src={src} alt={alt} title={title} />
                              )
                            }}
                          >
                            {preprocessMarkdownImages(customPage.content)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  }

                  if (currentTab === 'privacy') {
                    return (
                      <>
                        <h1 className="font-serif font-extrabold text-2xl text-zinc-950 dark:text-white pb-3 border-b">Privacy Policy Statement</h1>
                        <p><strong>Effective Date: May 21, 2026</strong></p>
                        <p>At Heartsync (accessible from Heartsync.com), one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Heartsync and how we use it.</p>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Log Files & Cookies</h3>
                        <p>Heartsync follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Google DoubleClick DART Cookie</h3>
                        <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet.</p>
<p>You may opt out of personalized advertising at any time via Google's Ads Settings (<a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="underline text-rose-600">https://www.google.com/settings/ads</a>), and you can review how Google handles data for its advertising products at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline text-rose-600">Google's Advertising Policies page</a>. Your consent choice on our cookie banner additionally controls whether personalized or non-personalized ads are requested on this site.</p>
                      </>
                    );
                  }

                  if (currentTab === 'disclaimer') {
                    return (
                      <>
                        <h1 className="font-serif font-extrabold text-2xl text-zinc-950 dark:text-white pb-3 border-b border-rose-100">Disclaimer Policy Disclosure</h1>
                        <p>The information on this website is for general educational and informational purposes only as a relationship and dating tips and emotional wellness blog. Heartsync does not provide professional therapy, relationship diagnosis, medical counsel, or professional evaluations.</p>
                        <p>Any reliance you place on such information is strictly at your own risk. Always consult licensed psychologists, family medical practitioners, or professional counselors regarding severe attachment concerns or severe couples stressors.</p>
                      </>
                    );
                  }

                  if (currentTab === 'terms') {
                    return (
                      <>
                        <h1 className="font-serif font-extrabold text-2xl text-zinc-950 dark:text-white pb-3 border-b border-rose-100">Terms of Service agreement</h1>
                        <p>Welcome to Heartsync. By accessing our relationship blog resources, you agree to comply with our modern user guidelines, including respectful comment boarding and whitelisted browser behaviors.</p>
                        <p>You agree not to scrape, distribute, or copy our human-authored emotional wellness outline templates without obtaining written syndicate permission from Heartsync leadership.</p>
                      </>
                    );
                  }

                  if (currentTab === 'cookies') {
                    return (
                      <div className="space-y-8 animate-fadeIn">
                        <div className="border-b border-zinc-150 dark:border-zinc-800 pb-5">
                          <h1 className="font-serif font-extrabold text-3xl text-zinc-950 dark:text-white tracking-tight font-display">
                            Heartsync Cookie Policy
                          </h1>
                          <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase tracking-wider">
                            Last Updated: May 26, 2026
                          </p>
                        </div>
                        
                        <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-zinc-650 dark:text-zinc-350 text-xs leading-relaxed">
                          <p>
                            To make Heartsync (accessible via Heartsync.com) feel safe, welcoming, and intuitive, we utilize cookies and other tracking technologies. This Cookie Policy explains how these components operate, why we use them, and how you can exercise your privacy controls in alignment with Google AdSense and global privacy laws.
                          </p>

                          <div className="bg-rose-50/50 dark:bg-rose-950/10 p-4 rounded-2xl border border-rose-500/10 space-y-2">
                            <h3 className="font-serif font-bold text-sm text-rose-950 dark:text-rose-200">
                              Our Privacy Commitment
                            </h3>
                            <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                              Heartsync supports the Google Consent Mode v2 framework. Non-essential cookies, Google Analytics tracking, and customized Google AdSense advertisements remain denied and loaded with default-denied states. Only after you grant explicit consent by clicking "Accept Cookies" do we activate personalized insights and campaigns.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                              1. What are Cookies?
                            </h3>
                            <p>
                              A cookie is a small text file placed onto your desktop or mobile browser by websites you visit. They are widely used to make websites work more efficiently, personalize layouts, track system preferences (like dark mode and language choices), and report anonymous campaign metrics to web operators.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                              2. How Heartsync Uses Cookies
                            </h3>
                            <p>
                              We split our cookies into functional categories. Each level is detailed below:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>
                                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Strictly Necessary Cookies:</strong> Required to operate authentic user logging, remember active administrator credentials, and preserve standard state selections.
                              </li>
                              <li>
                                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Performance & Analytics:</strong> Provided by Google Analytics to capture aggregate statistics (page click retention, article reading time) without tracking your individual metadata.
                              </li>
                              <li>
                                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Advertising Cookies:</strong> Provided by Google AdSense. In compliance with advertising policies, these match behavioral standards so advertisements displayed relate to relationships, lifestyle, wellness, and self-care interests.
                              </li>
                            </ul>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                              3. Google AdSense & Analytics Compliance
                            </h3>
                            <p>
                              Heartsync serves non-obtrusive, high-trust ads to keep our relationship resources free and accessible. We enforce strict AdSense rules:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>
                                Google and third-party vendors use DART cookies to serve ads based on prior visits.
                              </li>
                              <li>
                                If you wish to opt-out of personalized AdSense marketing globally, edit your configurations at Google's <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-rose-500 hover:underline">Ads Settings page</a>.
                              </li>
                              <li>
                                Analytics and campaign scripts only activate on Heartsync after physical clicking of the "Accept Cookies" container button.
                              </li>
                            </ul>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-serif font-bold text-base text-zinc-900 dark:text-zinc-100">
                              4. User Privacy & Right to Refuse
                            </h3>
                            <p>
                              Your consent can be modified at any point. Simply clear your browser's local cache or click the Cookie Preferences triggers in our page margins. If cookies are deactivated, rest assured that Heartsync's emotional guidance essays remain fully browsable.
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={() => window.dispatchEvent(new Event('heartsync-open-cookie-preferences'))}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#CE2B5E]/10 hover:bg-[#CE2B5E]/25 text-[#CE2B5E] font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer border border-[#CE2B5E]/20 focus:outline-none focus:ring-2 focus:ring-[#CE2B5E]"
                              >
                                <Settings className="w-4 h-4" />
                                Manage Cookie Preferences
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  resetConsent();
                                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                }}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs tracking-wide uppercase transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
                              >
                                Reset Consent Decisions
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            )}

            {currentTab === 'advertise' && (
              <div className="max-w-3xl mx-auto space-y-6 font-sans text-xs text-zinc-650">
                <div className="text-center space-y-2">
                  <h1 className="font-serif font-extrabold text-3xl">Advertise With Heartsync</h1>
                  <p className="text-xs text-zinc-400">Monetize premium audience alignment with couples wellness standards.</p>
                </div>
                <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-4">
                  <h3 className="font-bold text-sm">Ad Placement Framework metrics</h3>
                  <p className="leading-relaxed">
                    Heartsync delivers programmatic Leaderboards, Skyscrapers, and nested In-Article monetization blocks compliant with Google AdSense rules. Our readers display deep interest in mental health, emotional wellness, couples coaching, conflict books, and dating apps.
                  </p>
                  <p className="leading-relaxed text-rose-500 font-bold">
                    For customized CPM/CPC package proposals, transmit a syndication draft via our Contact Editorial form.
                  </p>
                </div>
              </div>
            )}

            {/* 16. NEWSLETTER LANDING */}
            {currentTab === 'newsletter' && (
              <div className="max-w-md mx-auto relative rounded-3xl bg-white dark:bg-zinc-900 w-full p-8 border border-zinc-150/80 dark:border-zinc-850/70 text-center space-y-6 font-sans shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-zinc-800 flex items-center justify-center text-rose-500 mx-auto">
                   <Mail className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h1 className="font-serif font-bold text-2xl">The Heartsync Weekly Digest</h1>
                  <p className="text-xs text-zinc-400 mt-1">Research-backed steps for human connection delivered weekly.</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-xs leading-normal">
                   Join over 3,400+ subscribers reading actionable relationship essays every Thursday. Completely safe. Disconnect anytime with one click.
                </div>
              </div>
            )}

            {/* 17. 404 / ERROR LANDING */}
            {currentTab === 'error' && (
              <div className="max-w-md mx-auto text-center space-y-6 font-sans py-12">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
                <div>
                  <h1 className="font-serif font-extrabold text-3xl">Wellness Connection Severed (404)</h1>
                  <p className="text-xs text-zinc-400 mt-1">This emotional guide has either shifted slugs or expired from active releasing.</p>
                </div>
                <button 
                  onClick={() => navigateTo('home')}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 font-bold text-white text-xs shadow-md cursor-pointer"
                >
                  Return to Home Sanctuary
                </button>
              </div>
            )}

            {/* 17c. PREMIUM MEMBERSHIP SUBSCRIPTION PAGE */}
            {currentTab === 'subscription' && (
              <SubscriptionPage onNavigate={navigateTo} />
            )}

            {/* 17d. AI ADVICE ENGINE — the HeartSync Guide */}
            {currentTab === 'ai_copilot' && (
              <AiCopilot onNavigate={navigateTo} />
            )}

            {/* 17e. LOVEVAULT — private vault, journal, boundary scripts */}
            {currentTab === 'lovevault' && (
              <LoveVault />
            )}

            {/* 18. ADMIN AUTHENTICATION — real sign-in gate */}
            {currentTab === 'login' && (
              <AdminLogin onNavigate={navigateTo} onSuccess={() => navigateTo('admin')} />
            )}

            {/* 18b. ADMIN CONSOLE PANES (admins only — gated in verifyAndSetTab) */}
            {(currentTab === 'admin' || currentTab === 'access-denied') && (
              <React.Suspense fallback={<div className="min-h-screen" />}>
              <AdminConsole 
                onNavigate={navigateTo} 
                theme={adminTheme} 
                setTheme={setAdminTheme} 
                initialPane={tabArg} 
                lang={lang}
                translatedPosts={translatedPosts}
                translatedCategories={translatedCategories}
                translatedSiteSettings={translatedSiteSettings}
              />
              </React.Suspense>
            )}

            </HeartsyncSuspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer element */}
      {currentTab !== 'admin' && (
        <>
          <Footer onNavigate={navigateTo} siteSettings={siteSettings} lang={lang} />
          {/* Site-wide ad-network scripts (Monetag / Adsterra), consent-gated */}
          <AdNetworkScripts />

          {/* Footer Ad Banner (Google AdSense) — never on admin/auth/error views */}
          {['admin', 'login', 'error', 'access-denied'].every((t) => t !== currentTab) && (
            <AdPlacement slot="footer" lazy />
          )}
        </>
      )}
      </div>

      {/* Cookie Banner Overlay */}
      {currentTab !== 'admin' && (
        <>
          <CookieBanner onLearnMore={() => navigateTo('cookies')} />
          <LiveChatWidget />
        </>
      )}

      {/* 19. AD WATCHING INTERACTIVE OVERLAY */}
      {adTarget && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          <div className="bg-zinc-900 border border-zinc-800 text-white w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top design accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-purple-500 to-rose-500" />
            
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Tv className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-rose-500 font-bold tracking-wider">
                  Heartsync Free Access
                </span>
                <h3 className="font-serif font-bold text-sm text-zinc-100">
                  Temporary Access Gateway
                </h3>
              </div>
            </div>

            {adStep === 'intro' && (
              <div className="space-y-5">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">How Free Access Works</span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">Stay on this screen for a short 15-second moment. No sponsor, no payment — this brief wait helps keep Heartsync's coaching content free to run.</p>
                </div>

                <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                  <p>
                    You are accessing <span className="font-bold text-white">"{adTarget.title}"</span> ({adTarget.type === 'category' ? 'Premium Topic Pillar' : 'Premium Article'}).
                  </p>
                  <p className="text-zinc-400">
                    Waiting this short 15-second moment helps keep Heartsync free for everyone and instantly unlocks <span className="text-rose-400 font-bold">3 hours of unrestricted access</span>.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdTarget(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdStep('watching');
                      setAdSecondsLeft(15);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start 15-Second Unlock
                  </button>
                </div>
              </div>
            )}

            {adStep === 'watching' && (
              <div className="space-y-6">
                {/* Calm 15-second unlock timer screen */}
                <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                  {/* Glowing background shapes */}
                  <div className="absolute inset-0 bg-radial-gradient from-rose-500/5 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Live Ad Header */}
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[9px] font-mono bg-zinc-900/90 text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-800/50">
                      FREE ACCESS TIMER
                    </span>
                    <span className="text-[9px] font-mono bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md font-bold">
                      {adSecondsLeft}s remaining
                    </span>
                  </div>

                  {/* Dynamic Ad Message Content */}
                  <div className="my-auto text-center relative z-10 space-y-2 px-4 animate-pulse">
                    {adSecondsLeft > 10 ? (
                      <>
                        <h4 className="font-serif italic text-sm text-zinc-200">"Take a long, deep breath in..."</h4>
                        <p className="text-[10px] text-zinc-400 font-sans">Heartsync free access moment</p>
                      </>
                    ) : adSecondsLeft > 5 ? (
                      <>
                        <h4 className="font-serif italic text-sm text-zinc-200">"Breathe out, releasing all stress."</h4>
                        <p className="text-[10px] text-zinc-400 font-sans">Feel the warmth of healthy, mindful connection.</p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-serif italic text-sm text-zinc-200">"Your access is almost ready..."</h4>
                        <p className="text-[10px] text-rose-400 font-sans">Nearly complete. Hold tight for secure access...</p>
                      </>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 relative z-10">
                    <div className="h-1.5 bg-zinc-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all duration-1000" 
                        style={{ width: `${((15 - adSecondsLeft) / 15) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                      <span>UNLOCK IN PROGRESS</span>
                      <span>15 SECS TOTAL</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-500 text-center leading-normal">
                  🔒 Closing or switching tabs will pause sponsor stream. Please remain on the screen to qualify for access tokens.
                </p>
              </div>
            )}

            {adStep === 'completed' && (
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle className="w-8 h-8 animate-bounce" />
                </div>

                {(() => {
                  let durationText = '3 hours';
                  let durationHours = 3;
                  if (adTarget) {
                    const rawDuration = adTarget.type === 'article'
                      ? ((publishedArticles.find(p => p.id === adTarget.id) || posts.find(p => p.id === adTarget.id))?.unlock_duration || siteSettings.rewarded_access_default_duration || '30m')
                      : (siteSettings.rewarded_access_default_duration || '30m');
                    switch (rawDuration) {
                      case '10m': durationHours = 10 / 60; durationText = '10 minutes'; break;
                      case '15m': durationHours = 15 / 60; durationText = '15 minutes'; break;
                      case '30m': durationHours = 30 / 60; durationText = '30 minutes'; break;
                      case '1h': durationHours = 1; durationText = '1 hour'; break;
                      case '3h': durationHours = 3; durationText = '3 hours'; break;
                      case '6h': durationHours = 6; durationText = '6 hours'; break;
                      case '12h': durationHours = 12; durationText = '12 hours'; break;
                      case '24h': durationHours = 24; durationText = '24 hours'; break;
                    }
                  }
                  return (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-serif font-bold text-base text-zinc-100 font-serif">Sponsor Stream Completed!</h4>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                          Your temporary <span className="font-bold text-rose-450">{durationText}</span> access ticket has been securely granted and saved to your device session.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (adTarget.type === 'article') {
                            tempUnlockArticle(adTarget.id, durationHours);
                          } else {
                            tempUnlockCategory(adTarget.id, durationHours);
                          }
                          showToast(`Sponsor Access Granted! Enjoy ${durationText} of unrestricted browsing.`);
                          setAdTarget(null);
                        }}
                        className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md text-center block"
                      >
                        🔓 Unlock Now & Continue
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accessible article image lightbox (Esc closes, focus trapped) */}
      <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

    </div>
  );
}
