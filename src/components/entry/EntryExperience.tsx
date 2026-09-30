import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

// HeartSyncX Entry Experience - a premium editorial welcome shown once,
// before the main homepage, to first-time visitors only.
//
// Visual language upgraded to match the HeartsyncX brand reference (couple
// hero photo, split-color headline/wordmark, gradient CTA pill, decorative
// base flourish). A few deliberate exceptions from the reference, since
// this renders as a full-viewport overlay rather than a scrolling page
// section - see inline notes below.
//
// Design notes:
// - Pure presentation layer: it renders ON TOP of the fully-mounted
//   homepage (no routing, no redirects, no content gating), so crawlers,
//   deep links and returning visitors are completely unaffected.
// - First visit: staged rise-in of background, logo, wordmark, headline,
//   supporting and curiosity lines, then the CTA.
// - Returning visit: the parent never mounts this component (the flag is
//   checked before render), so the homepage is immediate.
// - No new dependencies: CSS animations + lucide icon already in the app.

const STORAGE_KEY = 'hs_entry_seen_v1';

/** Has this visitor already entered the site? (localStorage, no personal data) */
export function hasEnteredBefore(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch (_) {
    // Storage unavailable (private mode etc.) - never trap the visitor.
    return true;
  }
}

/** Remember the visit locally so the entry never blocks again. */
export function markEntered(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch (_) {
    /* best effort only */
  }
}

interface EntryExperienceProps {
  /** Called after the exit transition finishes; the parent unmounts us. */
  onComplete: () => void;
}

export default function EntryExperience({ onComplete }: EntryExperienceProps) {
  const [leaving, setLeaving] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const completedRef = useRef(false);

  // Staggered rise-in helpers: every element fades+rises once, holding its
  // pre-animation (invisible) state until its delay elapses ("both" fill).
  const rise = (delay: number): React.CSSProperties => ({
    animationDelay: `${delay}ms`,
  });

  const enter = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    markEntered();
    let reduced = false;
    try {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) {
      reduced = false;
    }
    setLeaving(true);
    window.setTimeout(onComplete, reduced ? 0 : 460);
  }, [onComplete]);

  // Keyboard: Escape enters too. Focus the CTA on mount so keyboard users
  // can enter with a single Enter press.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => ctaRef.current?.focus({ preventScroll: true }), 900);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [enter]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to HeartSyncX"
      className={`fixed inset-0 z-[9999] overflow-hidden bg-zinc-950 select-none ${leaving ? 'entry-leave' : ''}`}
      data-testid="entry-experience"
    >
      {/* Background: instant gradient paint, couple photo fades in when loaded.
          Lighter scrim up top keeps the photo readable there; it deepens
          toward the bottom so the text block stays crisp - same composition
          idea as the brand reference, adapted to a full-viewport overlay. */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="/assets/entry/entry-bg.jpg"
          alt=""
          onLoad={() => setBgReady(true)}
          onError={() => setBgReady(true)}
          className={`absolute inset-0 h-full w-full object-cover object-[50%_18%] transition-opacity duration-1000 ease-out ${bgReady ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Scrims: photo breathes near the top, text stays legible below */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/45 via-zinc-950/55 to-zinc-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.35)_0%,rgba(9,9,11,0.25)_45%,rgba(9,9,11,0.8)_100%)]" />
        {/* Soft atmospheric accents echoing the site's rose/violet gradient */}
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-rose-600/14 blur-3xl sm:w-96 sm:h-96" />
        <div className="absolute -bottom-28 -right-16 w-72 h-72 rounded-full bg-indigo-600/14 blur-3xl sm:w-96 sm:h-96" />
      </div>

      {/* Content */}
      <main
        className="relative flex h-full w-full flex-col items-center justify-end overflow-y-auto px-6 pb-10 text-center sm:justify-center"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="entry-rise" style={rise(120)}>
            <img
              src="/logo.svg"
              alt="HeartSyncX"
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl ring-1 ring-white/15 shadow-[0_10px_40px_-12px_rgba(244,63,94,0.4)] sm:h-[72px] sm:w-[72px]"
            />
          </div>

          {/* Wordmark - bold brand lockup, "X" carrying the accent color,
              matching the reference's hero wordmark treatment. */}
          <p
            className="entry-rise mt-4 font-display text-2xl font-bold tracking-tight text-zinc-50 sm:mt-5 sm:text-[28px]"
            style={rise(260)}
          >
            Heartsync<span className="text-rose-400">X</span>
          </p>

          {/* Headline - split coloring: statement in white, the personal
              half of the promise carried in the brand's rose accent. */}
          <h1
            className="entry-rise mt-5 font-serif text-3xl font-semibold leading-[1.15] text-balance sm:mt-7 sm:text-5xl sm:leading-[1.1] lg:text-6xl"
            style={rise(420)}
          >
            <span className="text-zinc-50">Understand Love.</span>
            <br />
            <span className="text-rose-400">Understand Yourself.</span>
          </h1>

          {/* Supporting message */}
          <p
            className="entry-rise mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-300/90 text-pretty sm:mt-6 sm:text-lg"
            style={rise(580)}
          >
            Real conversations about relationships, dating, connection and the
            emotions behind them.
          </p>

          {/* Curiosity line, with a hand-drawn-style underline accent */}
          <div className="entry-rise mt-8 flex flex-col items-center sm:mt-9" style={rise(720)}>
            <p className="max-w-md font-serif text-[15px] italic leading-relaxed text-zinc-200 sm:text-base">
              Some relationships need answers. Some need honesty.
            </p>
            <svg
              width="190"
              height="10"
              viewBox="0 0 190 10"
              fill="none"
              aria-hidden="true"
              className="mt-1.5 text-rose-400"
            >
              <path
                d="M3 6.5C45 2 130 2 187 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* CTA - gradient pill, matching the reference's brand button */}
          <button
            ref={ctaRef}
            type="button"
            onClick={enter}
            data-testid="entry-cta"
            className="entry-rise group mt-9 inline-flex min-h-[56px] items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-9 py-4 text-base font-semibold text-white shadow-[0_14px_44px_-12px_rgba(244,63,94,0.65)] ring-1 ring-white/10 transition-all duration-300 ease-out hover:from-rose-400 hover:to-fuchsia-400 hover:shadow-[0_18px_54px_-12px_rgba(244,63,94,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.98] sm:mt-11 sm:px-11"
            style={rise(880)}
          >
            Explore HeartSyncX
            <ArrowRight
              className="h-5 w-5 transition-transform duration-300 ease-out group-hover:translate-x-1"
              aria-hidden="true"
            />
          </button>

          <span className="sr-only" style={rise(880)}>
            Press Enter or select the button to continue to the HeartSyncX homepage.
          </span>
        </div>
      </main>

      {/* Decorative base flourish - a purely cosmetic gradient wave, echoing
          the reference's bottom curve. Unlike the reference (a scrolling
          hero peeking into the next section) this overlay covers the full
          viewport, so it stays abstract rather than implying real content
          beneath it. */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full text-rose-500/25"
        style={{ height: '14vh', minHeight: '64px' }}
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="entryWaveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          d="M0,55 C90,10 160,90 260,45 C320,20 370,55 400,35 L400,100 L0,100 Z"
          fill="url(#entryWaveGradient)"
          opacity="0.35"
        />
        <path
          d="M0,70 C110,35 180,95 280,60 C330,42 365,68 400,58 L400,100 L0,100 Z"
          fill="url(#entryWaveGradient)"
          opacity="0.25"
        />
      </svg>
    </div>
  );
}
