// Google Translate integration for Heartsync (international edition).
//
// The built-in dictionaries (src/utils/i18n.ts) cover the UI chrome in 33
// languages, but article content is authored in English only. Google
// Translate's site widget translates EVERY visible DOM text - articles
// included - client-side, which is exactly what an international audience
// needs. The widget's default toolbar and banner are hidden; our own
// language switcher drives it programmatically and carries the
// "Powered by Google Translate" attribution.
//
// Flow: the anchor div is mounted once (below), the element.js script is
// injected, and whenever the visitor's `lang` changes we set the hidden
// Google combo box and fire a change event - the widget handles the rest.
import React, { useEffect } from 'react';
import type { Language } from '../utils/i18n';

/** Our language codes that Google's widget spells differently. */
const GT_CODE_OVERRIDES: Partial<Record<Language, string>> = {
  zh: 'zh-CN', // Google splits Chinese into zh-CN / zh-TW
  he: 'iw'     // Google kept the legacy ISO code for Hebrew
};

/** Map a Heartsync language to the Google Translate widget code. */
export function mapToGoogleLanguage(lang: Language): string {
  return GT_CODE_OVERRIDES[lang] || lang;
}

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

let scriptInjected = false;

/** Inject translate element.js once; the callback builds the hidden widget. */
function injectGoogleTranslateScript(): void {
  if (scriptInjected || document.getElementById('google-translate-script')) {
    scriptInjected = true;
    return;
  }

  window.googleTranslateElementInit = () => {
    try {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google-translate-anchor');
      }
    } catch (err) {
      console.warn('Google Translate init failed:', err);
    }
  };

  const s = document.createElement('script');
  s.id = 'google-translate-script';
  s.type = 'text/javascript';
  s.async = true;
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  document.body.appendChild(s);
  scriptInjected = true;
}

/**
 * Wait for the widget's hidden combo box. The script loads asynchronously,
 * so poll briefly rather than assume it exists.
 */
function waitForGoogleCombo(timeoutMs = 15000): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (combo && combo.options.length > 1) {
        resolve(combo);
      } else if (Date.now() - started > timeoutMs) {
        resolve(null);
      } else {
        setTimeout(tick, 250);
      }
    };
    tick();
  });
}

/** Point Google Translate at a language. 'en' restores the original page. */
export async function applyGoogleLanguage(lang: Language): Promise<void> {
  const combo = await waitForGoogleCombo();
  if (!combo) return;
  const target = mapToGoogleLanguage(lang);
  if (combo.value === target) return;
  combo.value = target;
  combo.dispatchEvent(new Event('change'));
}

/**
 * Single mount point for the whole app: renders the hidden widget anchor,
 * injects the script, and re-aims Google Translate whenever the visitor's
 * language changes (header switcher, mobile menu, restored preference).
 */
export function GoogleTranslateSync({ lang }: { lang: Language }) {
  useEffect(() => {
    injectGoogleTranslateScript();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const combo = await waitForGoogleCombo();
      if (cancelled || !combo) return;
      await applyGoogleLanguage(lang);
    })();
    return () => { cancelled = true; };
  }, [lang]);

  return (
    <div
      id="google-translate-anchor"
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px', top: 0, width: '160px', height: '40px', overflow: 'hidden' }}
    />
  );
}
