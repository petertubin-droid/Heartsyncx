import { useEffect, useRef, useState } from 'react';
import { AdPlacement } from './AdPlacement';

/**
 * Scroll-aware ad wrapper: the wrapped ad unit disappears while the user is
 * actively scrolling and reappears a moment after scrolling stops.
 *
 * - Collapse is CSS-only (max-height + opacity + overflow) so the ad iframe
 *   is never unmounted: the provider keeps its slot state and refills
 *   normally when the unit becomes visible again.
 * - The reveal is debounced (~450ms after the last scroll event) so fast
 *   scroll gestures do not flicker the unit in and out.
 */
export default function ScrollAwareAd({
  slot,
  className = '',
  lazy = true,
  hideDelayMs = 450
}: {
  slot: 'header' | 'sidebar' | 'in_article' | 'footer' | 'homepage' | 'article_bottom';
  className?: string;
  lazy?: boolean;
  hideDelayMs?: number;
}) {
  const [hidden, setHidden] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let stopped = false;

    const onScroll = () => {
      setHidden(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (!stopped) setHidden(false);
      }, hideDelayMs);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      stopped = true;
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer.current);
    };
  }, [hideDelayMs]);

  return (
    <div
      aria-hidden={hidden}
      style={{
        maxHeight: hidden ? 0 : 460,
        opacity: hidden ? 0 : 1,
        overflow: 'hidden',
        transition: 'max-height 350ms ease, opacity 300ms ease',
      }}
    >
      <AdPlacement slot={slot} className={className} lazy={lazy} />
    </div>
  );
}
