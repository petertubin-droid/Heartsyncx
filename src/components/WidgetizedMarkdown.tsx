import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Heart, BookOpen, AlertTriangle, Lightbulb, Play, BookOpenCheck, HelpCircle, 
  Layers, Compass, ArrowRight, Lock, Wand2, CheckCircle2, ChevronDown, Check,
  BookOpenText, Mail, Info, Quote, Image as ImageIcon
} from 'lucide-react';
import { preprocessMarkdownImages } from '../utils/markdownImage';

// Define custom blockquote icons and headers matching PremiumArticleReader styles
const CUSTOM_HEADING_FONT = '"Playfair Display", "Lora", Georgia, serif';

interface WidgetizedMarkdownProps {
  content: string;
  faqItems?: { question: string; answer: string }[];
  categories?: any[];
  onNavigateToArticle?: (slug: string) => void;
}

export function parseContentToSegments(content: string) {
  if (!content) return [];
  // Regex supporting HTML-style tags for our interactive insert elements
  const regex = /(<newsletter-signup\s*\/?>|<table-of-contents\s*\/?>|<premium-divider\s*\/?>|<related-article\s+[^>]*\/>|<author-insight\s+[^>]*\/>|<custom-section\s+[^>]*\/>|<image-gallery\s+[^>]*\/>|<faq-section\s*\/?>)/gi;
  const parts = content.split(regex);
  return parts.map(part => {
    const trimmed = part.trim();
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
      const isNewsletter = /<newsletter-signup/i.test(trimmed);
      const isTOC = /<table-of-contents/i.test(trimmed);
      const isDivider = /<premium-divider/i.test(trimmed);
      const isFaq = /<faq-section/i.test(trimmed);
      
      const slugMatch = trimmed.match(/slug=["']([^"']*)["']/i);
      const titleMatch = trimmed.match(/title=["']([^"']*)["']/i);
      const authorMatch = trimmed.match(/author=["']([^"']*)["']/i);
      const insightMatch = trimmed.match(/insight=["']([^"']*)["']/i);
      const textMatch = trimmed.match(/text=["']([^"']*)["']/i);
      const urlsMatch = trimmed.match(/urls=["']([^"']*)["']/i);

      if (isNewsletter) return { type: 'newsletter' };
      if (isTOC) return { type: 'toc' };
      if (isDivider) return { type: 'divider' };
      if (isFaq) return { type: 'faq' };
      if (/<related-article/i.test(trimmed)) {
        return { type: 'related-article', slug: slugMatch?.[1] || '', title: titleMatch?.[1] || '' };
      }
      if (/<author-insight/i.test(trimmed)) {
        return { type: 'author-insight', author: authorMatch?.[1] || '', insight: insightMatch?.[1] || '' };
      }
      if (/<custom-section/i.test(trimmed)) {
        return { type: 'custom-section', title: titleMatch?.[1] || '', text: textMatch?.[1] || '' };
      }
      if (/<image-gallery/i.test(trimmed)) {
        return { type: 'image-gallery', urls: urlsMatch?.[1] || '' };
      }
    }
    return { type: 'markdown', content: part };
  });
}

export default function WidgetizedMarkdown({ 
  content, 
  faqItems = [], 
  categories = [],
  onNavigateToArticle 
}: WidgetizedMarkdownProps) {
  
  const segments = useMemo(() => parseContentToSegments(content), [content]);

  // Extract headings from raw content for Table of Contents rendering
  const tocHeadings = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const headings: { id: string; text: string; level: number }[] = [];
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
        headings.push({ id, text, level });
      }
    }
    return headings;
  }, [content]);

  // Custom Markdown Element Renderers mimicking public page styling
  const customMarkdownComponents = useMemo(() => ({
    img: ({ src, alt, title }: any) => {
      let captionText = title || alt || '';
      if (title && title.startsWith('ATTRS:')) {
        try {
          let jsonStr = title.substring(6);
          const parsed = JSON.parse(decodeURIComponent(jsonStr));
          if (parsed.caption) captionText = parsed.caption;
        } catch (_) {}
      }
      return (
        <span className="block my-8 text-center bg-zinc-50 dark:bg-zinc-900/40 p-2 rounded-2xl border border-zinc-200/40 dark:border-zinc-800">
          <img 
            src={src} 
            alt={alt} 
            className="w-full object-cover max-h-[460px] rounded-xl shadow-xs" 
            referrerPolicy="no-referrer"
          />
          {captionText && (
            <span className="block text-center text-xs text-zinc-500 mt-2.5 font-serif italic">
              {captionText}
            </span>
          )}
        </span>
      );
    },
    h2: ({ children }: any) => {
      const text = String(children || '');
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h2 id={id} className="scroll-mt-24 text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-850 pb-3 mt-10 mb-4 tracking-tight flex items-center gap-2.5" style={{ fontFamily: CUSTOM_HEADING_FONT }}>
          <span className="w-1 h-5 bg-rose-500 rounded-full shrink-0" />
          <span>{children}</span>
        </h2>
      );
    },
    h3: ({ children }: any) => {
      const text = String(children || '');
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h3 id={id} className="scroll-mt-24 text-base sm:text-lg font-bold text-zinc-850 dark:text-zinc-100 mt-8 mb-3 tracking-tight" style={{ fontFamily: CUSTOM_HEADING_FONT }}>
          {children}
        </h3>
      );
    },
    p: ({ children }: any) => (
      <p className="font-serif leading-relaxed text-zinc-800 dark:text-zinc-200 mb-5 text-base sm:text-[17px]">
        {children}
      </p>
    ),
    blockquote: ({ children }: any) => {
      const childrenArray = React.Children.toArray(children);
      const searchForCallout = (node: any): string => {
        if (typeof node === 'string') return node;
        if (node && node.props && node.props.children) {
          return React.Children.toArray(node.props.children).map(searchForCallout).join("");
        }
        return "";
      };

      const fullText = childrenArray.map(searchForCallout).join("").trim();
      
      if (fullText.startsWith('[!TIP]') || fullText.toLowerCase().includes('tip:')) {
        const cleanText = fullText.replace('[!TIP]', '').replace(/tip:/i, '').trim();
        return (
          <div className="my-8 p-5 bg-emerald-500/[0.04] border-l-4 border-emerald-500 rounded-r-2xl text-left flex gap-4">
            <span className="text-emerald-500 shrink-0 mt-0.5"><Lightbulb className="w-5 h-5" /></span>
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-400 block uppercase tracking-wider text-[10px] font-mono mb-1">Clinical Suggestion</span>
              <p className="italic text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{cleanText}</p>
            </div>
          </div>
        );
      }
      
      if (fullText.startsWith('[!WARNING]') || fullText.toLowerCase().includes('warning:') || fullText.toLowerCase().includes('caution:')) {
        const cleanText = fullText.replace('[!WARNING]', '').replace(/warning:/i, '').replace(/caution:/i, '').trim();
        return (
          <div className="my-8 p-5 bg-amber-500/[0.04] border-l-4 border-amber-500 rounded-r-2xl text-left flex gap-4">
            <span className="text-amber-500 shrink-0 mt-0.5"><AlertTriangle className="w-5 h-5" /></span>
            <div>
              <span className="font-bold text-amber-800 dark:text-amber-400 block uppercase tracking-wider text-[10px] font-mono mb-1">Cautionary Advice</span>
              <p className="italic text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{cleanText}</p>
            </div>
          </div>
        );
      }

      if (fullText.startsWith('[!NOTE]') || fullText.toLowerCase().includes('note:')) {
        const cleanText = fullText.replace('[!NOTE]', '').replace(/note:/i, '').trim();
        return (
          <div className="my-8 p-5 bg-blue-500/[0.04] border-l-4 border-blue-500 rounded-r-2xl text-left flex gap-4">
            <span className="text-blue-500 shrink-0 mt-0.5"><Info className="w-5 h-5" /></span>
            <div>
              <span className="font-bold text-blue-800 dark:text-blue-400 block uppercase tracking-wider text-[10px] font-mono mb-1">Key Insight Note</span>
              <p className="italic text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{cleanText}</p>
            </div>
          </div>
        );
      }

      if (fullText.startsWith('[!TAKEAWAY]') || fullText.toLowerCase().includes('takeaway:')) {
        const cleanText = fullText.replace('[!TAKEAWAY]', '').replace(/takeaway:/i, '').trim();
        return (
          <div className="my-8 p-5 bg-rose-500/[0.04] border-l-4 border-rose-500 rounded-r-2xl text-left flex gap-4">
            <span className="text-rose-500 shrink-0 mt-0.5"><BookOpenCheck className="w-5 h-5" /></span>
            <div>
              <span className="font-bold text-rose-800 dark:text-rose-400 block uppercase tracking-wider text-[10px] font-mono mb-1">Key Takeaway</span>
              <p className="italic text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{cleanText}</p>
            </div>
          </div>
        );
      }

      return (
        <blockquote className="my-8 pl-5 border-l-4 border-rose-500 italic text-zinc-800 dark:text-zinc-200 font-serif text-lg py-1.5 leading-relaxed text-left">
          {children}
        </blockquote>
      );
    },
    ul: ({ children }: any) => (
      <ul className="list-disc pl-5 my-5 space-y-2 text-zinc-800 dark:text-zinc-200 text-sm sm:text-base text-left font-sans">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-5 my-5 space-y-2 text-zinc-800 dark:text-zinc-200 text-sm sm:text-base text-left font-sans">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed pl-1">{children}</li>
    ),
    table: ({ children }: any) => (
      <div className="my-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs sm:text-sm font-sans">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-zinc-50 dark:bg-zinc-900 font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/60 bg-white dark:bg-zinc-950/30">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3.5 text-[10px] font-bold tracking-wider">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-zinc-650 dark:text-zinc-350">{children}</td>
    )
  }), [faqItems]);

  return (
    <div className="space-y-6">
      {segments.map((seg, idx) => {
        if (seg.type === 'markdown') {
          return (
            <div key={idx} className="prose prose-zinc dark:prose-invert max-w-none text-left">
              <ReactMarkdown urlTransform={(url) => url} components={customMarkdownComponents}>
                {preprocessMarkdownImages(seg.content || '')}
              </ReactMarkdown>
            </div>
          );
        }

        if (seg.type === 'newsletter') {
          return (
            <div key={idx} className="my-8 p-6 rounded-3xl bg-gradient-to-r from-rose-500/10 to-fuchsia-500/10 border border-rose-500/15 text-left relative overflow-hidden font-sans">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs shrink-0 text-rose-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Newsletter Integration</span>
                  <h4 className="text-base font-bold font-serif text-zinc-900 dark:text-white" style={{ fontFamily: CUSTOM_HEADING_FONT }}>Join Secure Connections Weekly</h4>
                  <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed max-w-lg mb-3">
                    Unlock professional guidelines, somatic centering modules, and research-grade strategies directly in your inbox.
                  </p>
                  <div className="flex max-w-md gap-2">
                    <input 
                      type="email" 
                      placeholder="Enter your email address..." 
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Thank you for subscribing to Heartsync Newsletter!');
                      }}
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (seg.type === 'toc') {
          if (tocHeadings.length === 0) return null;
          return (
            <div key={idx} className="my-8 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 text-left font-sans">
              <div className="flex items-center gap-2 mb-4">
                <BookOpenText className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-350">Table of Contents</span>
              </div>
              <ul className="space-y-2.5">
                {tocHeadings.map((h, i) => (
                  <li key={i} style={{ paddingLeft: `${(h.level - 2) * 1.5}rem` }} className="text-xs sm:text-sm font-medium text-zinc-650 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 opacity-50 text-rose-500 shrink-0" />
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (seg.type === 'divider') {
          return (
            <div key={idx} className="my-12 relative flex items-center justify-center font-sans">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-dashed border-rose-300 dark:border-rose-900" />
              </div>
              <div className="relative bg-white dark:bg-zinc-950 px-5 flex items-center gap-2 py-1.5 rounded-full border border-rose-300 dark:border-rose-900 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Premium Attachment Module Limit</span>
              </div>
            </div>
          );
        }

        if (seg.type === 'related-article') {
          return (
            <div key={idx} className="my-8 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-left font-sans shadow-xs hover:border-rose-500/30 transition-all cursor-pointer group" onClick={() => onNavigateToArticle && onNavigateToArticle(seg.slug || '')}>
              <div className="flex items-center gap-3.5 flex-1">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-xl shrink-0">
                  <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Recommended Reading</span>
                  <h5 className="text-sm font-bold text-zinc-800 dark:text-zinc-250 group-hover:text-rose-500 transition-colors" style={{ fontFamily: CUSTOM_HEADING_FONT }}>{seg.title || 'Related study module'}</h5>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </div>
          );
        }

        if (seg.type === 'author-insight') {
          return (
            <div key={idx} className="my-10 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-left font-sans flex flex-col sm:flex-row gap-4 relative overflow-hidden">
              <span className="absolute top-4 right-4 text-zinc-200 dark:text-zinc-800 text-6xl font-serif select-none pointer-events-none leading-none">“</span>
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center font-bold text-rose-600 font-serif text-lg shrink-0">
                {seg.author?.[0] || 'C'}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Expert Clinical Insight</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{seg.author || 'Heartsync Advisor'}</span>
                </div>
                <p className="text-sm italic text-zinc-700 dark:text-zinc-300 leading-relaxed font-serif">
                  {seg.insight}
                </p>
              </div>
            </div>
          );
        }

        if (seg.type === 'custom-section') {
          return (
            <div key={idx} className="my-8 p-6 rounded-3xl bg-rose-500/[0.01] dark:bg-zinc-900/10 border border-zinc-200/60 dark:border-zinc-800/80 text-left font-sans">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4.5 h-4.5 text-rose-500" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">{seg.title || 'Special Focus Area'}</h4>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {seg.text}
              </p>
            </div>
          );
        }

        if (seg.type === 'image-gallery') {
          const urls = seg.urls ? seg.urls.split(',').map(u => u.trim()).filter(Boolean) : [];
          if (urls.length === 0) return null;
          return (
            <div key={idx} className="my-10 space-y-3 font-sans text-left">
              <div className="flex items-center gap-2 text-zinc-400">
                <ImageIcon className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Media Gallery Exhibit ({urls.length} images)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {urls.map((url, uidx) => (
                  <div key={uidx} className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group shadow-xs">
                    <img src={url} alt={`Gallery ${uidx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (seg.type === 'faq') {
          if (!faqItems || faqItems.length === 0) return null;
          return (
            <div key={idx} className="my-8 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/80 text-left font-sans space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
                <HelpCircle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-300">Frequently Asked Questions (FAQ)</span>
              </div>
              <div className="space-y-4">
                {faqItems.map((item, fidx) => (
                  <FaqAccordionItem key={fidx} item={item} />
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// Subcomponent for interactive FAQ collapsible accordion matching public page aesthetic
function FaqAccordionItem({ item }: { item: { question: string; answer: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3 last:border-b-0 last:pb-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-2.5 text-left font-semibold text-xs sm:text-sm text-zinc-850 dark:text-zinc-200 hover:text-rose-550 transition-colors focus:outline-none"
      >
        <span className="pr-4 leading-snug">{item.question}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed bg-white/40 dark:bg-zinc-950/20 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800/40">
          {item.answer}
        </p>
      </div>
    </div>
  );
}
