import { useEffect, useRef, useState } from 'react';
import { AdPlacement } from './AdPlacement';

/**
 * Scroll-aware ad wrapper: the wrapped ad unit fades out while the user is
 * actively scrolling and fades back in a moment after scrolling stops.
 *
 * The hide is LAYOUT-STABLE by design (opacity + visibility only, never a
 * height collapse). The first version collapsed the wrapper with
 * maxHeight: 0 + overflow: hidden, which caused two bugs:
 *   1. A collapsed (zero-height, clipped) wrapper can never intersect the
 *      viewport, so the wrapped unit's lazy IntersectionObserver could not
 *      fire while scrolling - the ad only ever loaded after the user
 *      stopped at the very bottom (or overscrolled into the rubber band).
 *   2. Toggling the wrapper's height between 0 and 460px resized the
 *      document mid-scroll: the page jumped, the jump fired more scroll
 *      events, and the unit flickered in and out ("glitching").
 * Keeping the box geometry intact fixes both: the lazy observer works
 * whenever the slot is in view, the document never reflows, and the
 * provider's iframe is never unmounted, so the unit keeps its slot state
 * and refills normally when it becomes visible again.
 *
 * The reveal is debounced (~450ms after the last scroll event) so fast
 * scroll gestures do not flicker the unit in and out.
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
        // Layout-stable hide: geometry stays intact so the lazy ad unit
        // inside can load and the document never reflows on toggle.
        opacity: hidden ? 0 : 1,
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: hidden ? 'none' : 'auto',
        transition: 'opacity 300ms ease, visibility 300ms ease'
      }}
    >
      <AdPlacement slot={slot} className={className} lazy={lazy} />
    </div>
  );
}
