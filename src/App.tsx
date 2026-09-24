import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';

// The 16k-line admin console is split out of the reader bundle  - it only
// downloads when an admin actually opens the admin tab.
const AdminConsole = React.lazy(() => import('./components/AdminConsole'));
import Header from './components/Header';
import Footer from './components/Footer';
import AnalyticsPanel from './components/AnalyticsPanel';
import RichTextEditor from './components/RichTextEditor';
import AdminLogin from './components/AdminLogin';
const AiCopilot = React.lazy(() => import('./components/AiCopilot'));
const LoveVault = React.lazy(() => import('./components/LoveVault'));
const ImageLightbox = React.lazy(() => import('./components/ImageLightbox'));
import { CookieBanner } from './components/CookieBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { useCookieConsent } from './components/useCookieConsent';
const LiveChatWidget = React.lazy(() => import('./components/LiveChatWidget'));
const SubscriptionPage = React.lazy(() => import('./components/SubscriptionPage'));
import ArticleBodyWithInserts from './components/ArticleBodyWithInserts';
import HomePage from './components/HomePage';
import { HeartsyncLoader, LoadingProgressBar, HeartsyncSuspense } from './components/LoadingSystem';
import ContentPages from './components/ContentPages';
import { MarkdownImageElement } from './utils/markdownImage';
import ArticlePage from './components/ArticlePage';
import OfflineReaderBanner from './components/OfflineReaderBanner';
import { AdPlacement, AdsterraDirectLink } from './components/AdPlacement';
import { AdNetworkScripts } from './components/AdNetworkScripts';
import { heartsync, getAuthors } from './store';
import { ADS_SUSPEND_EVENT, ADS_RESUME_EVENT } from './utils/adminArea';
import { Post, Category, Author, SiteSettings, Topic } from './types';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Language, getSavedLanguage, getTranslation } from './utils/i18n';
import { getArticleSeoData } from './utils/seoArticleData';
import { clearUnauthorizedStorageKeys } from './utils/storageAudit';
import { 
  Heart, BookOpen, MessageSquare, Copy, ArrowLeft, Send, 
  HelpCircle, AlertTriangle, User, Smile, PlusCircle, CheckCircle, 
  Trash2, ShieldAlert, BadgeInfo, BellRing, ChevronRight,
  BookmarkX, Award, AlertCircle, RefreshCw, Mail, Settings, Twitter, Facebook, Link as LinkIcon, Calendar, Clock,
  HeartCrack, Brain, Flag, CircleDot, Lock, Play, Tv, Users, TrendingUp, Maximize2, ArrowRight, Share2
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
  const [scrollPercent, setScrollPercent] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [homeNewsletterEmail, setHomeNewsletterEmail] = useState('');
  const [homeNewsletterSubscribed, setHomeNewsletterSubscribed] = useState(false);
  const [copyFeedbackToast, setCopyFeedbackToast] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  useEffect(() => {
    if (!shareMenuOpen) return;
    const closeOnOutsideClick = () => setShareMenuOpen(false);
    window.addEventListener('click', closeOnOutsideClick);
    return () => window.removeEventListener('click', closeOnOutsideClick);
  }, [shareMenuOpen]);
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

  const paragraphCountRef = useRef(0);

  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string; caption?: string } | null>(null);


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
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -8 },
          transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
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
  // The hero already shows the title; if the article's own markdown
  // opens with a "# <same title>" line, strip it so the body doesn't
  // repeat it as a second, unstyled heading right before the first
  // (dropcap) paragraph.
  //
  // BUGFIX (2026-09-22): every article's `content` template literal opens
  // with a blank line before the "# Title" line (content: `\n# Title...`),
  // so raw.split('\n')[0] was always "" and this check never matched --
  // the duplicate title rendered on literally every article page. Now we
  // skip leading blank lines first, and compare titles with punctuation
  // normalized (curly vs straight quotes, en-dash vs hyphen) so it also
  // catches the few articles where the H1 uses different Unicode
  // punctuation than the `title` field.
  const articleBody = useMemo(() => {
    const raw = activeArticle?.content || '';
    if (!raw) return raw;
    const lines = raw.split('\n');
    let firstIdx = 0;
    while (firstIdx < lines.length && lines[firstIdx].trim() === '') firstIdx++;
    if (firstIdx < lines.length && /^#\s+/.test(lines[firstIdx].trim())) {
      const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '');
      const h1Text = lines[firstIdx].replace(/^#\s+/, '').trim();
      const titleText = (activeArticle?.title || '').trim();
      if (h1Text && normalize(h1Text) === normalize(titleText)) {
        let rest = lines.slice(firstIdx + 1);
        while (rest.length && rest[0].trim() === '') rest = rest.slice(1);
        return rest.join('\n');
      }
    }
    return raw;
  }, [activeArticle?.content, activeArticle?.title]);

  const splitArticleContent = useMemo(() => {
    if (!articleBody) return null;
    const sections = articleBody.split(/\n\s*\n/);
    if (sections.length <= 3) {
      return { firstHalf: articleBody, secondHalf: null };
    }
    const midPoint = Math.floor(sections.length / 2);
    const firstHalf = sections.slice(0, midPoint).join('\n\n');
    const secondHalf = sections.slice(midPoint).join('\n\n');
    return { firstHalf, secondHalf };
  }, [articleBody]);

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
    // H-08: anonymous page-view beacon  - persisted server-side via the
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

  // Re-resolve a held article route once /api/state hydration settles:
  // if the slug is valid the article renders now. Unknown slugs first get a
  // direct database rescue (fresh or slow-syncing articles still render);
  // only when the article genuinely does not exist do we soft-land the
  // reader on the articles library - a bare 404 page is never shown for
  // article routes again.
  useEffect(() => {
    if (currentTab === 'article' && !activeArticleState && heartsync.serverStateLoaded) {
      const match = heartsync.posts.find(p => p.slug === tabArg);
      if (match) {
        setActiveArticle(match);
        heartsync.recordView(match.id);
        if (!match.content) {
          heartsync.ensureArticleContent(match).then(enriched => {
            if (enriched) setActiveArticle(enriched);
          });
        }
      } else {
        let cancelled = false;
        heartsync.resolveArticleBySlugDirect(tabArg).then(rescued => {
          if (cancelled) return;
          if (rescued) {
            setActiveArticle(rescued);
            heartsync.recordView(rescued.id);
            if (!rescued.content) {
              heartsync.ensureArticleContent(rescued).then(enriched => {
                if (enriched && !cancelled) setActiveArticle(enriched);
              });
            }
          } else {
            window.history.replaceState(null, '', '/articles');
            setCurrentTab('articles');
            setTabArg('');
            setActiveArticle(null);
          }
        });
        return () => { cancelled = true; };
      }
    }
  }, [posts, currentTab, activeArticleState, tabArg]);

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

  // Theme isolation: the admin panel lives in the same SPA document as the
  // public site. Toggling the admin theme used to flip the shared
  // root/body `dark` class, restyling the frontend (and the browser's own
  // dark-mode UI) with it. The shared document classes now follow ONLY the
  // frontend theme; the admin area carries its own scoped `.dark` wrapper,
  // so the two themes are fully independent.
  const isAdminArea = currentTab === 'admin' || currentTab === 'login' || currentTab === 'access-denied';

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    if (frontendTheme === 'dark' && !isAdminArea) {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
  }, [currentTab, frontendTheme, adminTheme, isAdminArea]);

  // Ad isolation for the admin area: popunder / OnClick ad tags hijack every
  // click with a redirect, making the admin panel unusable. While the admin
  // area is active, ad script injection is suspended (and injected scripts
  // removed); it resumes automatically when navigating back to public pages.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(isAdminArea ? ADS_SUSPEND_EVENT : ADS_RESUME_EVENT));
  }, [isAdminArea]);

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

    // Admin access requires a signed-in admin account  - no auto-provisioned sessions
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
        // Full body ships per-article (not in the boot payload)  - enrich lazily.
        if (!match.content) {
          heartsync.ensureArticleContent(match).then(enriched => {
            if (enriched) setActiveArticle(enriched);
          });
        }
      } else if (!heartsync.serverStateLoaded) {
        // Hydration race: on a first visit the /api/state fetch has not
        // settled yet, so posts is empty. HOLD the route (article skeleton)
        // and re-resolve when the store finishes loading - previously this
        // rewrote valid article URLs to /404 for fresh visitors and any
        // external/deep traffic (SEO + referral links broke).
        setCurrentTab('article');
        setTabArg(arg);
        setActiveArticle(null);
      } else {
        // Direct database rescue before giving up: covers articles the boot
        // state fetch missed. If the article truly does not exist, land on
        // the articles library - never the bare 404 page.
        setActiveArticle(null);
        setCurrentTab('article');
        setTabArg(arg);
        heartsync.resolveArticleBySlugDirect(arg).then(rescued => {
          if (rescued && tabArg === arg) {
            setActiveArticle(rescued);
            heartsync.recordView(rescued.id);
            if (!rescued.content) {
              heartsync.ensureArticleContent(rescued).then(enriched => {
                if (enriched) setActiveArticle(enriched);
              });
            }
          } else if (!rescued && tabArg === arg) {
            window.history.replaceState(null, '', '/articles');
            setCurrentTab('articles');
            setTabArg('');
          }
        });
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
      } else if (parts.length === 1 && firstSegment) {
        // Bare-slug article URL (no /article/ prefix)  - legacy indexed
        // links, external shares, or any backlink missing the prefix used
        // to bounce straight to the homepage here, silently killing the
        // article (and its in-article ad) for that visitor. verifyAndSetTab
        // ('article', slug) already resolves this robustly on its own: it
        // holds the route through the /api/state hydration race, does a
        // direct DB rescue for slugs the boot payload missed, and only
        // soft-lands on the articles library if the slug truly doesn't
        // exist  - so trying it here can only recover real article URLs,
        // never regress a genuinely unknown path.
        verifyAndSetTab('article', firstSegment);
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

        {/* Header leaderboard ad slot (728x90 class) - desktop only; the
            admin console has always advertised this spot, but it was never
            mounted. Hidden on mobile where a 728-wide unit cannot fit. */}
        {currentTab !== 'admin' && (
          <div className="hidden md:block">
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
              {/* Global breadcrumbs  - every page except home/admin/auth keeps a
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
            {/* 1. HOME - extracted to components/HomePage.tsx (2026-09-24
                App.tsx split, phase 2). Props passed verbatim from App scope;
                see HomePageProps for the contract. */}
            {currentTab === 'home' && (
              <HomePage
                currentTab={currentTab}
                siteSettings={siteSettings}
                categories={categories}
                categoriesState={categoriesState}
                publishedArticles={publishedArticles}
                navigateTo={navigateTo}
                showToast={showToast}
                homeNewsletterEmail={homeNewsletterEmail}
                setHomeNewsletterEmail={setHomeNewsletterEmail}
                homeNewsletterSubscribed={homeNewsletterSubscribed}
                setHomeNewsletterSubscribed={setHomeNewsletterSubscribed}
                quizStep={quizStep}
                setQuizStep={setQuizStep}
                quizAnswers={quizAnswers}
                setQuizAnswers={setQuizAnswers}
                quizOutcome={quizOutcome}
                setQuizOutcome={setQuizOutcome}
              />
            )}

            {/* 2. ALL OTHER CONTENT TABS - articles, categories, category, author,
                search, trending, faq, about, contact, custom pages, advertise,
                newsletter, error, subscription, ai_copilot, lovevault -
                extracted to components/ContentPages.tsx (2026-09-24 split,
                phase 3). Tab conditions are mutually exclusive on currentTab,
                so consolidation is order-safe. See ContentPagesProps. */}
            <ContentPages
              currentTab={currentTab}
              tabArg={tabArg}
              categories={categories}
              posts={posts}
              publishedArticles={publishedArticles}
              navigateTo={navigateTo}
              showToast={showToast}
              renderSidebar={renderSidebar}
              searchQuery={searchQuery}
              submittingContact={submittingContact}
              setSubmittingContact={setSubmittingContact}
              contactSuccess={contactSuccess}
              setContactSuccess={setContactSuccess}
              checkIsCategoryLocked={checkIsCategoryLocked}
              unlockCategoryInState={unlockCategoryInState}
              articlePaymentPortal={articlePaymentPortal}
              setArticlePaymentPortal={setArticlePaymentPortal}
              isPayingArticle={isPayingArticle}
              setIsPayingArticle={setIsPayingArticle}
              payCardNum={payCardNum}
              setPayCardNum={setPayCardNum}
              payEmail={payEmail}
              setPayEmail={setPayEmail}
              payExpiry={payExpiry}
              setPayExpiry={setPayExpiry}
              payCvc={payCvc}
              setPayCvc={setPayCvc}
              setAdTarget={setAdTarget}
              setAdStep={setAdStep}
              setAdSecondsLeft={setAdSecondsLeft}
            />
            {/* 3. SINGLE ARTICLE DETAIL PAGE VIEW */}
            {currentTab === 'article' && !activeArticle && (
              <HeartsyncSuspense isLoading type="article" />
            )}
            {/* 3. ARTICLE READING EXPERIENCE - extracted to components/ArticlePage.tsx
                (2026-09-24 App.tsx split, phase 1). Props below are passed
                verbatim from the App scope; see ArticlePageProps for the contract. */}
            {currentTab === 'article' && activeArticle && (
              <ArticlePage
                activeArticle={activeArticle}
                articleBody={articleBody}
                headings={headings}
                markdownComponents={markdownComponents}
                siteSettings={siteSettings}
                navigateTo={navigateTo}
                showToast={showToast}
                renderSidebar={renderSidebar}
                handleReaction={handleReaction}
                submitComment={submitComment}
                checkIsArticleLocked={checkIsArticleLocked}
                unlockArticleInState={unlockArticleInState}
                paragraphCountRef={paragraphCountRef}
                publishedArticles={publishedArticles}
                posts={posts}
                categories={categories}
                setActiveArticle={setActiveArticle}
                setCurrentTab={setCurrentTab}
                setTabArg={setTabArg}
                setLightboxImage={setLightboxImage}
                setAdTarget={setAdTarget}
                setAdStep={setAdStep}
                setAdSecondsLeft={setAdSecondsLeft}
                scrollPercent={scrollPercent}
                activeHeadingId={activeHeadingId}
                newsletterSubscribed={newsletterSubscribed}
                setNewsletterSubscribed={setNewsletterSubscribed}
                newsletterEmail={newsletterEmail}
                setNewsletterEmail={setNewsletterEmail}
                copyFeedbackToast={copyFeedbackToast}
                setCopyFeedbackToast={setCopyFeedbackToast}
                shareMenuOpen={shareMenuOpen}
                setShareMenuOpen={setShareMenuOpen}
                hasLiked={hasLiked}
                setHasLiked={setHasLiked}
                comments={comments}
                commentInput={commentInput}
                setCommentInput={setCommentInput}
                commentAuthorName={commentAuthorName}
                setCommentAuthorName={setCommentAuthorName}
                commentAuthorEmail={commentAuthorEmail}
                setCommentAuthorEmail={setCommentAuthorEmail}
                activeQuizIndex={activeQuizIndex}
                setActiveQuizIndex={setActiveQuizIndex}
                selectedAnswerIndex={selectedAnswerIndex}
                setSelectedAnswerIndex={setSelectedAnswerIndex}
                quizAnswerSubmitted={quizAnswerSubmitted}
                setQuizAnswerSubmitted={setQuizAnswerSubmitted}
                quizScore={quizScore}
                setQuizScore={setQuizScore}
                quizSessionFinished={quizSessionFinished}
                setQuizSessionFinished={setQuizSessionFinished}
                articlePaymentPortal={articlePaymentPortal}
                setArticlePaymentPortal={setArticlePaymentPortal}
                isPayingArticle={isPayingArticle}
                setIsPayingArticle={setIsPayingArticle}
                payCardNum={payCardNum}
                setPayCardNum={setPayCardNum}
                payEmail={payEmail}
                setPayEmail={setPayEmail}
                payExpiry={payExpiry}
                setPayExpiry={setPayExpiry}
                payCvc={payCvc}
                setPayCvc={setPayCvc}
              />
            )}
            
            {/* 18. ADMIN AUTHENTICATION  - real sign-in gate */}
            {currentTab === 'login' && (
              <div className={adminTheme === 'dark' ? 'dark' : ''} style={{ colorScheme: adminTheme }}>
                <AdminLogin onNavigate={navigateTo} onSuccess={() => navigateTo('admin')} />
              </div>
            )}

            {/* 18b. ADMIN CONSOLE PANES (admins only  - gated in verifyAndSetTab) */}
            {(currentTab === 'admin' || currentTab === 'access-denied') && (
              <React.Suspense fallback={<div className="min-h-screen" />}>
              <div className={adminTheme === 'dark' ? 'dark' : ''} style={{ colorScheme: adminTheme }}>
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
              </div>
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

          {/* Footer Ad Banner (Google AdSense)  - never on admin/auth/error views */}
          {['admin', 'login', 'error', 'access-denied'].every((t) => t !== currentTab) && (
            <>
              <AdPlacement slot="footer" lazy />
              {/* Adsterra Direct Link / Smartlink (labelled sponsored link) */}
              <AdsterraDirectLink />
            </>
          )}
        </>
      )}
      </div>

      {/* Cookie Banner Overlay */}
      {currentTab !== 'admin' && (
        <>
          <CookieBanner onLearnMore={() => navigateTo('cookies')} />
          <Suspense fallback={null}><LiveChatWidget /></Suspense>
          <InstallPrompt />
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
                  <p className="text-[11px] text-zinc-300 leading-relaxed">Stay on this screen for a short 15-second moment. No sponsor, no payment  - this brief wait helps keep Heartsync's coaching content free to run.</p>
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
      <Suspense fallback={null}><ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} /></Suspense>

    </div>
  );
}
