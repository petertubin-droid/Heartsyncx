import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // e.g. 'video', 'square', 'auto'
  priority?: boolean;   // true for above-the-fold/hero images (disables lazy-load)
}

/**
 * Enterprise-grade OptimizedImage component
 * Automatically rewrites Unsplash URLs to serve responsive WebP sizes,
 * enforces lazy loading, decodes asynchronously, and prevents layout shift (CLS).
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  priority = false,
  width,
  height,
  ...props
}) => {
  // Check if image is from Unsplash for dynamic parameter transformation
  const isUnsplash = src && src.includes('images.unsplash.com');

  // Helper to generate custom size Unsplash URLs
  const getUnsplashUrl = (baseUrl: string, w: number, q: number = 80) => {
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('fm', 'webp'); // Enforce high-performance WebP format
      url.searchParams.set('q', String(q));
      url.searchParams.set('w', String(w));
      return url.toString();
    } catch (_) {
      return baseUrl;
    }
  };

  let finalSrc = src;
  let srcset = undefined;
  let sizes = undefined;

  if (isUnsplash) {
    // Generate authoritative WebP source URL
    const targetWidth = typeof width === 'number' ? width : 800;
    finalSrc = getUnsplashUrl(src, targetWidth);

    // Build responsive source set (srcset) for optimal device pixel delivery
    srcset = [
      `${getUnsplashUrl(src, 320)} 320w`,
      `${getUnsplashUrl(src, 640)} 640w`,
      `${getUnsplashUrl(src, 960)} 960w`,
      `${getUnsplashUrl(src, 1280)} 1280w`,
      `${getUnsplashUrl(src, 1920)} 1920w`,
    ].join(', ');

    // Define smart responsive sizes slot query
    sizes = props.sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }

  // Aspect ratio class mapper to prevent Cumulative Layout Shift (CLS)
  const ratioClasses: Record<string, string> = {
    'video': 'aspect-video object-cover',
    'square': 'aspect-square object-cover',
    'portrait': 'aspect-[3/4] object-cover',
    'auto': '',
  };

  const combinedClass = [
    ratioClasses[aspectRatio] || '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <img
      src={finalSrc}
      srcSet={srcset}
      sizes={sizes}
      alt={alt}
      className={combinedClass}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      referrerPolicy="no-referrer"
      width={width}
      height={height}
      {...props}
    />
  );
};
