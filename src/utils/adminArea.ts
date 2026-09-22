/**
 * Admin-area detection and ad isolation helpers, shared by ConsentProvider
 * and AdNetworkScripts.
 *
 * The admin panel (/admin, /login, /access-denied) runs inside the same SPA
 * document as the public site. Ad tags - especially popunder / OnClick
 * zones - hijack every click with a redirect, which makes the admin panel
 * unusable ("ads redirecting in the admin"). While the admin area is
 * active, NO ad script may be injected and previously injected ad elements
 * are removed; injection resumes when the visitor navigates back to
 * public pages.
 */

export const ADMIN_AREA_PATH_RE = /^\/(admin|login|access-denied)(\/|$)/;

export const ADS_SUSPEND_EVENT = 'heartsync-ads-suspend';
export const ADS_RESUME_EVENT = 'heartsync-ads-resume';

/** True while the current URL points into the admin area. */
export function isAdminLocation(): boolean {
  try {
    return ADMIN_AREA_PATH_RE.test(window.location.pathname);
  } catch {
    return false;
  }
}

/** Remove every ad element this app injected (Monetag tag, Adsterra
 * snippets, AdSense auto loader). Used when the admin area activates. */
export function removeInjectedAdScripts(): void {
  document.head
    .querySelectorAll('script[data-heartsync-injected], script#heartsync-monetag-script, script#heartsync-adsterra-script, script#heartsync-meta-pixel-script')
    .forEach((el) => el.remove());
}
