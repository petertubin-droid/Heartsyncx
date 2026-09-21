import React, { useEffect, useRef, useState } from 'react';
import { heartsync } from '../store';
import { useCookieConsent } from './useCookieConsent';

/**
 * Site-wide ad-network script injector.
 *
 * Monetag and Adsterra's site-level formats (Monetag MultiTag: OnClick
 * Popunder + Push Notifications + In-Page Push + Vignette; Adsterra:
 * Popunder, Social Bar, Interstitial, In-Page Push) are deployed by pasting
 * a per-zone snippet from the publisher dashboard into the page. This
 * component injects those snippets exactly as the networks issue them:
 *
 * - Monetag: the MultiTag snippet (settings.monetag_script_code). If only a
 *   zone id is provided, the standard MultiTag loader shape is used.
 * - Adsterra: one snippet field per site-wide format
 *   (adsterra_popunder_script, adsterra_social_bar_script,
 *   adsterra_interstitial_script, adsterra_inpage_push_script)  - paste each
 *   format's code from the dashboard.
 *
 * Everything is consent-gated: nothing injects until the visitor has
 * consented and accepted marketing cookies. Nothing renders when the
 * corresponding setting is empty or the provider is inactive.
 */
export const AdNetworkScripts: React.FC = () => {
  const injectedRef = useRef(false);
  const { hasConsented, preferences } = useCookieConsent();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = heartsync.subscribe(() => setVersion((v) => v + 1));
    return () => unsub();
  }, []);

  const s = heartsync.site_settings as Record<string, unknown>;
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
  void version;

  const monetagActive = s.monetag_active === true;
  const adsterraActive = s.adsterra_active === true;

  const monetagSnippet =
    str(s.monetag_script_code) ||
    (monetagActive && str(s.monetag_zone_id)
      ? `<script src="https://alwingulla.com/${str(s.monetag_zone_id)}/tag.min.js" data-zone="${str(s.monetag_zone_id)}" async data-cfasync="false"></script>`
      : '');

  const adsterraSnippets = adsterraActive
    ? [
        str(s.adsterra_popunder_script),
        str(s.adsterra_social_bar_script),
        str(s.adsterra_interstitial_script),
        str(s.adsterra_inpage_push_script)
      ].filter(Boolean)
    : [];

  const marketingConsent = !!((preferences as unknown as Record<string, unknown> | undefined)?.marketing);
  const shouldInject = hasConsented && marketingConsent && (hasConsented) && (monetagSnippet || adsterraSnippets.length > 0);

  // Revived feature: adsense_auto_script  - the site-owner's own AdSense
  // loader snippet, injected on mount WITHOUT a consent gate (the loader is
  // the site's own ad infrastructure; the ad units inside AdPlacement still
  // honor consent and serve non-personalized ads without marketing consent).
  useEffect(() => {
    const code = str((heartsync.site_settings as Record<string, unknown>).adsense_auto_script);
    const marker = 'script[data-heartsync-injected="adsense-auto"]';
    if (!code || document.querySelector(marker)) return;
    try {
      const doc = new DOMParser().parseFromString(code, 'text/html');
      const targets = [...doc.head.querySelectorAll('script'), ...doc.body.querySelectorAll('script')];
      targets.forEach((oldScript) => {
        const fresh = document.createElement('script');
        Array.from(oldScript.attributes).forEach((a) => fresh.setAttribute(a.name, a.value));
        fresh.setAttribute('data-heartsync-injected', 'adsense-auto');
        fresh.textContent = oldScript.textContent;
        document.head.appendChild(fresh);
      });
    } catch {
      // Malformed snippet  - do nothing rather than break the page.
    }
  }, [version]);

  useEffect(() => {
    if (!shouldInject || injectedRef.current) return;
    injectedRef.current = true;

    const inject = (html: string) => {
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // A bare <script src=...> snippet parses into the parsed doc's <head>
        // (HTML parsing rules), so scan BOTH containers  - body-only missed the
        // single-script format that network dashboards emit most often.
        const targets = [...doc.head.querySelectorAll('script'), ...doc.body.querySelectorAll('script')];
        targets.forEach((old) => {
          const fresh = document.createElement('script');
          Array.from(old.attributes).forEach((a) => fresh.setAttribute(a.name, a.value));
          fresh.setAttribute('data-heartsync-injected', 'ad-network-scripts');
          fresh.textContent = old.textContent;
          document.head.appendChild(fresh);
        });
        // Non-script markup (rare, e.g. noscript fallbacks) appended at body end
        if (doc.body.children.length > 0) {
          Array.from(doc.body.children).forEach((el) => {
            if (el.tagName !== 'SCRIPT') document.body.appendChild(document.importNode(el, true));
          });
        }
      } catch {
        // Malformed snippet  - do nothing rather than break the page.
      }
    };

    if (monetagSnippet) inject(monetagSnippet);
    adsterraSnippets.forEach(inject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldInject]);

  return null;
};

export default AdNetworkScripts;
