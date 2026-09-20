import React from 'react';
import { useDialogA11y } from '../utils/a11y';

interface ImageLightboxProps {
  image: { src: string; alt?: string; caption?: string } | null;
  onClose: () => void;
}

/**
 * Accessible full-screen article-image lightbox (WAI-ARIA dialog pattern):
 * role=dialog + aria-modal, Escape closes, backdrop click closes, Tab is
 * trapped inside, focus lands on the close button on open and returns to
 * the invoking element on close.
 */
export default function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  const dialogRef = useDialogA11y(image !== null, onClose);
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={image.alt || 'Enlarged article image'}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <figure className="flex flex-col items-center gap-3">
          <img
            src={image.src}
            alt={image.alt || ''}
            className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
          />
          {image.caption && (
            <figcaption className="text-xs text-zinc-200 text-center max-w-2xl leading-relaxed">
              {image.caption}
            </figcaption>
          )}
        </figure>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-zinc-900 text-white border border-zinc-600 flex items-center justify-center hover:bg-zinc-800 focus:ring-2 focus:ring-white focus:outline-none transition-colors"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
