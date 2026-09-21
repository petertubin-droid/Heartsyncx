import { Page } from '@playwright/test';

/**
 * Pre-seed the GDPR consent store so the app column is interactive.
 * Until consent is given, the app applies `blur-md pointer-events-none`
 * to all non-admin content (App.tsx)  - interaction tests must grant
 * consent before navigation, or accept the banner first.
 */
export async function grantConsent(page: Page, opts?: { analytics?: boolean; marketing?: boolean }) {
  await page.addInitScript(
    ({ analytics = true, marketing = true }) => {
      localStorage.setItem('heartsync_cookie_consent', 'accepted');
      localStorage.setItem(
        'heartsync_cookie_preferences',
        JSON.stringify({ necessary: true, functional: true, analytics, marketing })
      );
    },
    { analytics: opts?.analytics ?? true, marketing: opts?.marketing ?? true }
  );
}
