/** ContentPages: every remaining tab render (articles, categories, category,
 *  author, search, trending, faq, about, contact, custom pages, advertise,
 *  newsletter, error, subscription, ai_copilot, lovevault), extracted
 *  verbatim from App.tsx (2026-09-24 split, phase 3). Blocks are mutually
 *  exclusive on currentTab, so they render from one component safely.
 */
import React, { Suspense } from 'react';
import BlogCard from './BlogCard';
import { AdPlacement, AdsterraDirectLink } from './AdPlacement';
import { heartsync, getAuthors } from '../store';
import { Post, Author, Topic, Category } from '../types';
import { getTranslation, Language } from '../utils/i18n';
import { getCategoryIcon } from '../utils/categoryIcons';
import ReactMarkdown from 'react-markdown';
import { preprocessMarkdownImages, MarkdownImageElement } from '../utils/markdownImage';
import { LEGAL_DOCS } from '../utils/legalContent';
import { motion } from 'motion/react';
import { HeartsyncSuspense } from './LoadingSystem';
const SubscriptionPage = React.lazy(() => import('./SubscriptionPage'));
const AiCopilot = React.lazy(() => import('./AiCopilot'));
const LoveVault = React.lazy(() => import('./LoveVault'));
import {
  AlertTriangle,
  BookmarkX,
  CheckCircle,
  Lock,
  Mail,
  Play
} from 'lucide-react';

export interface ContentPagesProps {
  currentTab: any;
  tabArg: string;
  lang: string;
  categories: any[];
  posts: Post[];
  publishedArticles: Post[];
  navigateTo: (tab: any, arg?: string, skipScroll?: boolean) => void;
  showToast: (msg: string) => void;
  renderSidebar: () => React.ReactNode;
  searchQuery: string;
  submittingContact: boolean;
  setSubmittingContact: (b: boolean) => void;
  contactSuccess: boolean;
  setContactSuccess: (b: boolean) => void;
  checkIsCategoryLocked: (catId: string) => boolean;
  unlockCategoryInState: (id: string) => void;
  articlePaymentPortal: 'stripe' | 'paystack' | 'paypal';
  setArticlePaymentPortal: (p: 'stripe' | 'paystack' | 'paypal') => void;
  isPayingArticle: boolean;
  setIsPayingArticle: (b: boolean) => void;
  payCardNum: string;
  setPayCardNum: (s: string) => void;
  payEmail: string;
  setPayEmail: (s: string) => void;
  payExpiry: string;
  setPayExpiry: (s: string) => void;
  payCvc: string;
  setPayCvc: (s: string) => void;
  setAdTarget: (v: { type: 'article' | 'category'; id: string; title: string } | null) => void;
  setAdStep: (s: 'intro' | 'watching' | 'completed') => void;
  setAdSecondsLeft: (n: number) => void;
}

export default function ContentPages({
  currentTab, tabArg, lang, categories, posts, publishedArticles, navigateTo, showToast,
  renderSidebar, searchQuery, submittingContact, setSubmittingContact, contactSuccess,
  setContactSuccess, checkIsCategoryLocked, unlockCategoryInState, articlePaymentPortal,
  setArticlePaymentPortal, isPayingArticle, setIsPayingArticle, payCardNum, setPayCardNum,
  payEmail, setPayEmail, payExpiry, setPayExpiry, payCvc, setPayCvc, setAdTarget, setAdStep,
  setAdSecondsLeft
}: ContentPagesProps) {
  return (
    <>
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
                    <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 font-sans mt-1.5 max-w-xl leading-relaxed">Expert essays on emotional resilience, attachment, and relationship wellness  - written by clinicians, curated with care.</p>
                  </div>

                  <AdPlacement slot="homepage" className="my-2" lazy />

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
                  <AdPlacement slot="sidebar" className="mt-8" lazy />
                </div>
              </div>
            )}
            {/* 4. COMPREHENSIVE CATEGORIES INDEX */}
            {currentTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <div className="pb-4 border-b border-zinc-150 dark:border-zinc-800">
                    <span className="text-[10px] font-mono tracking-widest text-[#F43F5E] block uppercase font-bold">Aesthetic Topic Mapping</span>
                    <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white mt-1">Interpersonal Categories</h1>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-sans mt-0.5">Filter through specialized connection topics to discover practical, research-backed connection steps.</p>
                  </div>

                  <AdPlacement slot="homepage" className="my-2" lazy />

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
                  <AdPlacement slot="sidebar" className="mt-8" lazy />
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
                                  <label htmlFor="hs-pay-5" className="text-[9px] uppercase font-mono text-zinc-450 block">Your Receipt Email</label>
                                  <input
                                    id="hs-pay-5"
                                    type="email"
                                    required
                                    value={payEmail}
                                    onChange={(e) => setPayEmail(e.target.value)}
                                    placeholder="you@domain.com"
                                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="col-span-2 space-y-1">
                                    <label htmlFor="hs-pay-6" className="text-[9px] uppercase font-mono text-zinc-450 block">Card Number</label>
                                    <input
                                      id="hs-pay-6"
                                      type="text"
                                      value={payCardNum}
                                      onChange={(e) => setPayCardNum(e.target.value)}
                                      placeholder="4242 4242 4242 4242"
                                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label htmlFor="hs-pay-7" className="text-[9px] uppercase font-mono text-zinc-450 block">Expiry</label>
                                    <input
                                      id="hs-pay-7"
                                      type="text"
                                      value={payExpiry}
                                      onChange={(e) => setPayExpiry(e.target.value)}
                                      placeholder="MM/YY"
                                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-[1px] focus:outline-rose-500 text-center"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label htmlFor="hs-pay-8" className="text-[9px] uppercase font-mono text-zinc-450 block">CVV</label>
                                    <input
                                      id="hs-pay-8"
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
                <AdPlacement slot="in_article" className="mt-8" lazy />
                </div>

                <div className="col-span-12 lg:col-span-4 lg:pl-6 border-t lg:border-t-0 lg:border-l border-rose-100/30 dark:border-zinc-850 pt-8 lg:pt-0">
                  {renderSidebar()}
                  <AdPlacement slot="sidebar" className="mt-8" lazy />
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
                          <p className="text-xs text-zinc-400 mt-0.5">{getTranslation('authorPageIntro', lang as Language)}</p>
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
                <AdPlacement slot="homepage" lazy />
              </div>
            )}

            {/* 7. DYNAMIC SEARCH RESULTS PAGE */}
            {currentTab === 'search' && (
              <div className="space-y-8">
                <div className="pb-4 border-b border-zinc-150 dark:border-zinc-800">
                  <span className="text-[10px] font-mono tracking-widest text-rose-500 block uppercase font-bold">System Database Query</span>
                  <h1 className="font-serif font-bold text-3xl text-zinc-900 dark:text-white mt-1">{getTranslation('searchResultsTitle', lang as Language)}</h1>
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
                <AdPlacement slot="homepage" lazy />
              </div>
            )}

            {/* 8. TRENDING POSTS ALGORITHM PAGE */}
            {currentTab === 'trending' && (
              <div className="space-y-8">
                <div className="pb-4 border-b border-zinc-150 dark:border-zinc-800">
                  <span className="text-[10px] font-mono tracking-widest text-rose-500 block uppercase font-bold">{getTranslation('trendingConnections', lang as Language)}</span>
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
                <AdPlacement slot="homepage" lazy />
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
                <AdPlacement slot="article_bottom" lazy />
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
                          Our mission is to translate expert psychology concepts - specifically Bowlby's Attachment styles, Gottman's communication parameters, and nervous-system co-regulation templates - into beautiful, actionable lifestyle essays. We compile readable schemas so you can map your relational landscape safely.
                        </p>
                      </div>
                    </>
                  );
                })()}
                <AdPlacement slot="article_bottom" lazy />
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
              <div className="max-w-4xl mx-auto space-y-8 font-sans text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed py-6">
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

                  {
                    const doc = LEGAL_DOCS[currentTab as 'privacy' | 'terms' | 'disclaimer' | 'cookies'];
                    return (
                      <div className="space-y-10">
                        <div className="pb-6 border-b border-zinc-150 dark:border-zinc-800 dark:border-rose-500/15">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-sans tracking-widest text-[#CE2B5E] uppercase font-bold">
                            <span className="w-6 h-[2px] bg-rose-500 rounded-full" />
                            {doc.kicker}
                          </span>
                          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-zinc-950 dark:text-white mt-2 tracking-tight">
                            {doc.title}
                          </h1>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
                            Last reviewed: {doc.updated}
                          </p>
                        </div>

                        <div className="space-y-8">
                          {doc.sections.map((section, i) => (
                            <section key={i} className="space-y-3">
                              <h2 className="font-sans font-bold text-sm sm:text-[15px] text-zinc-900 dark:text-zinc-100 tracking-tight">
                                {section.heading}
                              </h2>
                              {section.paragraphs.map((para, j) => (
                                <p key={j} className="leading-relaxed">{para}</p>
                              ))}
                            </section>
                          ))}
                        </div>

                        <div className="pt-6 border-t border-zinc-150 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          Questions about this document? Write to our editorial team from the{' '}
                          <button onClick={() => navigateTo('contact')} className="text-rose-600 dark:text-rose-400 underline cursor-pointer">Contact</button>
                          {' '}page and we will respond within thirty days.
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
                <AdPlacement slot="homepage" lazy />
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
              <Suspense fallback={null}><SubscriptionPage onNavigate={navigateTo} /></Suspense>
            )}

            {/* 17d. AI ADVICE ENGINE  - the HeartSync Guide */}
            {currentTab === 'ai_copilot' && (
              <Suspense fallback={null}><AiCopilot onNavigate={navigateTo} /></Suspense>
            )}

            {/* 17e. LOVEVAULT  - private vault, journal, boundary scripts */}
            {currentTab === 'lovevault' && (
              <Suspense fallback={null}><LoveVault /></Suspense>
            )}
    </>
  );
}
