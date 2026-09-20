import React, { useState } from 'react';
import { Twitter, Facebook, Linkedin, Instagram, Music2, Send, Share2, Link2, Mail } from 'lucide-react';

interface ArticleShareRowProps {
  title: string;
  /** Fully-qualified article URL (falls back to window.location). */
  url?: string;
  compact?: boolean;
  className?: string;
}

const btnBase =
  'flex items-center justify-center transition-all hover:scale-110 cursor-pointer';
const circleBtn = 'p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:text-rose-500 text-zinc-600 dark:text-zinc-400 shadow-sm';
const flatBtn = 'p-2 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 flex flex-col items-center gap-0.5';

/**
 * Full social share row for an article.
 *
 * Web-intent platforms (X, Facebook, LinkedIn, WhatsApp, Telegram, Reddit,
 * email, native share) open directly. TikTok and Instagram have NO web share
 * intent (both are app-only posting surfaces), so their buttons copy the
 * article link and prompt the reader to paste it into a post — the honest,
 * working pattern used by every major publisher.
 */
export const ArticleShareRow: React.FC<ArticleShareRowProps> = ({ title, url, compact = false, className = '' }) => {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const [hint, setHint] = useState<string | null>(null);

  const flashHint = (msg: string) => {
    setHint(msg);
    window.setTimeout(() => setHint((h) => (h === msg ? null : h)), 2600);
  };

  const copyLink = async (platformHint?: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flashHint(platformHint ? `Link copied — ${platformHint}` : 'Copied link!');
    } catch {
      flashHint('Copy failed — select the address bar instead');
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        /* user dismissed the share sheet */
      }
    } else {
      copyLink();
    }
  };

  const iconSize = compact ? 'w-4 h-4' : 'w-4.5 h-4.5';

  return (
    <div className={`relative ${className}`}>
      {hint && (
        <span className="absolute left-1/2 -translate-x-1/2 -top-10 bg-zinc-900 text-white text-[9px] font-sans font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-10 leading-none">
          {hint}
        </span>
      )}
      <div className={`flex items-center flex-wrap ${compact ? 'gap-2' : 'gap-2.5'}`} role="group" aria-label="Share this article">
        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Share on X"
          aria-label="Share on X"
        >
          <Twitter className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">Post</span>}
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Share on Facebook"
          aria-label="Share on Facebook"
        >
          <Facebook className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">Share</span>}
        </a>

        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Share on LinkedIn"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">Share</span>}
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Share on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <Send className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">Send</span>}
        </a>

        {/* Reddit */}
        <a
          href={`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Share on Reddit"
          aria-label="Share on Reddit"
        >
          <span className={`${iconSize} font-black text-center leading-none`} aria-hidden="true">r/</span>
          {!compact && <span className="text-[8px] uppercase tracking-wider">Post</span>}
        </a>

        {/* Instagram — app-only posting: copy link, prompt to paste */}
        <button
          type="button"
          onClick={() => copyLink('paste it in your Instagram story or post')}
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Copy link for Instagram"
          aria-label="Copy link for Instagram"
        >
          <Instagram className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">Insta</span>}
        </button>

        {/* TikTok — app-only posting: copy link, prompt to paste */}
        <button
          type="button"
          onClick={() => copyLink('paste it in your TikTok video or bio')}
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Copy link for TikTok"
          aria-label="Copy link for TikTok"
        >
          <Music2 className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">TikTok</span>}
        </button>

        {/* Email */}
        <a
          href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`}
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Share via Email"
          aria-label="Share via Email"
        >
          <Mail className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">Mail</span>}
        </a>

        {/* Native share (mobile) / copy fallback */}
        <button
          type="button"
          onClick={nativeShare}
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="More share options"
          aria-label="More share options"
        >
          <Share2 className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">More</span>}
        </button>

        {/* Copy link */}
        <button
          type="button"
          onClick={() => copyLink()}
          className={`${btnBase} ${compact ? circleBtn : flatBtn}`}
          title="Copy article link"
          aria-label="Copy article link"
        >
          <Link2 className={iconSize} />
          {!compact && <span className="text-[8px] uppercase tracking-wider">Copy</span>}
        </button>
      </div>
    </div>
  );
};

export default ArticleShareRow;
