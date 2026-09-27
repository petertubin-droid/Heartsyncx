import React from 'react';
import { BadgeInfo, ShieldAlert, Heart } from 'lucide-react';
import { MarkdownImageElement } from '../utils/markdownImage';

/**
 * GLOBAL ARTICLE TYPOGRAPHY RENDERERS
 *
 * Single shared ReactMarkdown component map used by EVERY article on the
 * site, existing and future. Weight hierarchy:
 *   body paragraphs ......... 400 (regular weight, configured article font)
 *   strong/bold ............. 700 (only intentional **bold** appears bold)
 *   em/italic ............... 400 + italic
 *   h2 (sections) ........... 700 serif
 *   h3 (subsections) ........ 600 sans
 *
 * Body paragraphs deliberately carry NO font weight class and NO font-serif:
 * they inherit the admin-configured article_font_family (site default
 * Inter) at regular weight. The .markdown-body p / li rules in index.css
 * pin font-weight:400 as a hard guarantee against inherited bold.
 *
 * The first paragraph gets the decorative serif dropcap letter; the
 * paragraph itself stays regular weight.
 */
export function buildArticleMarkdownComponents({ paragraphCountRef }: {
  paragraphCountRef: React.MutableRefObject<number>;
}) {
  return ({    img: ({ src, alt, title }: any) => (
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
            <p className="leading-relaxed text-zinc-850 dark:text-zinc-200 mb-6 text-lg sm:text-xl relative">
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

      return <p className="leading-relaxed text-zinc-800 dark:text-zinc-200 mb-6 text-base sm:text-lg">{children}</p>;
    },
    h2: ({ children }: any) => {
      const text = String(children || '');
      const id = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h2 id={id} className="scroll-mt-24 font-serif font-bold text-xl sm:text-2xl text-zinc-900 dark:text-zinc-50 border-b border-zinc-150/40 dark:border-zinc-800/60 pb-2.5 mt-9 mb-4 group relative flex items-center justify-between">
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
        <h3 id={id} className="scroll-mt-24 font-sans font-semibold text-sm sm:text-base text-zinc-850 dark:text-zinc-100 mt-7 mb-3.5 group relative flex items-center justify-between">
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
  });
}
