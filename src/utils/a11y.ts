import { useEffect, useRef } from 'react';

// Accessible-dialog helpers shared by every modal surface (lightbox, cookie
// preferences, admin overlays). The WAI-ARIA dialog pattern: Escape closes,
// Tab/Shift+Tab stay inside, focus lands inside on open, and focus returns
// to the invoking element on close.

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  // NOTE: no offsetParent/display visibility filtering  - jsdom reports no
  // layout, and dialogs here never render hidden focusable children.
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
}

/**
 * Keep Tab/Shift+Tab cycles inside the container.
 * Returns true when the event was handled.
 */
export function trapTabKey(container: HTMLElement, e: KeyboardEvent): boolean {
  if (e.key !== 'Tab') return false;
  const focusable = getFocusable(container);
  if (focusable.length === 0) return true;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (e.shiftKey) {
    if (active === first || !container.contains(active)) {
      e.preventDefault();
      last.focus();
      return true;
    }
  } else if (active === last || !container.contains(active)) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

/**
 * Full dialog behavior for a single open/close surface.
 *
 *   const dialogRef = useDialogA11y(open, close);
 *   <div ref={dialogRef} role="dialog" aria-modal="true" ...>
 *
 * While open: Escape closes, focus moves into the dialog (first focusable
 * or the dialog itself), Tab is trapped, and on close the previously
 * focused element regains focus.
 */
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  opts?: { initialFocusRef?: React.RefObject<HTMLElement | null> }
) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const dialogEl = dialogRef.current;
    const focusTarget =
      opts?.initialFocusRef?.current || getFocusable(dialogEl)[0] || dialogEl;
    (focusTarget as HTMLElement).focus?.();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (dialogRef.current) trapTabKey(dialogRef.current, e);
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // Return focus to whatever invoked the dialog (WCAG 2.4.3).
      restoreFocusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return dialogRef;
}
