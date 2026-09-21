import { test, expect } from '@playwright/test';
import { grantConsent } from './helpers';

/**
 * Header navigation across all sections  - every route from the sitemap
 * must load with meaningful content and a matching URL.
 */
const routes = [
  { path: '/articles', name: 'Articles', expect: /wellness journals|journal|essay/i },
  { path: '/categories', name: 'Categories', expect: /categor/i },
  { path: '/trending', name: 'Trending', expect: /trending|popular/i },
  { path: '/ai-copilot', name: 'AI Copilot', expect: /copilot|ai/i },
  { path: '/subscription', name: 'Subscription', expect: /subscription|premium|plan/i },
  { path: '/lovevault', name: 'LoveVault', expect: /lovevault|vault/i },
  { path: '/about', name: 'About', expect: /about heartsync/i },
  { path: '/faq', name: 'FAQ', expect: /faq|frequently|interpersonal faq/i },
  { path: '/contact', name: 'Contact', expect: /contact/i },
  { path: '/newsletter', name: 'Newsletter', expect: /newsletter|digest/i },
  { path: '/privacy', name: 'Privacy Policy', expect: /privacy/i },
  { path: '/disclaimer', name: 'Disclaimer', expect: /disclaimer/i },
  { path: '/terms', name: 'Terms of Service', expect: /terms/i },
  { path: '/cookies', name: 'Cookie Policy', expect: /cookie/i },
  { path: '/advertise', name: 'Advertise', expect: /advertise/i },
];

test.describe('Static sections render', () => {
  for (const route of routes) {
    test(`/${route.path.replace('/', '')} renders with content`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace('/', '/')));
      // Wait for tab content to finish rendering (shared-server timing varies)
      await page.waitForFunction(
        () => document.body.innerText.length > 150,
        null,
        { timeout: 15_000 }
      );
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(150);
      expect(body.toLowerCase()).toMatch(route.expect);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(3);
    });
  }

  test('every sitemap route serves index.html directly (crawlability)', async ({ request }) => {
    for (const route of routes) {
      const res = await request.get(route.path);
      expect(res.status(), route.path).toBe(200);
      const html = await res.text();
      expect(html, route.path).toContain('<div id="root">');
    }
  });
});

test.describe('Header navigation interactions', () => {
  test.use({});

  test('header nav link navigates to the articles section and updates the URL', async ({ page }) => {
    await grantConsent(page);
    await page.goto('/');
    await page.waitForTimeout(1200);
    // Desktop nav labels are translated ("Contents" = articles tab)
    const navLink = page.locator('header').getByRole('button', { name: /^contents$/i }).first();
    await navLink.click();
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/articles/);
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/wellness journals|journal|essay/i);
  });

  test('mobile viewport shows the hamburger menu and it opens navigation', async ({ page }) => {
    await grantConsent(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(1200);
    const trigger = page
      .locator('button[aria-label*="menu" i], button[aria-label*="navigation" i]')
      .first();
    await trigger.click();
    await page.waitForTimeout(800);
    const menuText = await page.locator('body').innerText();
    expect(menuText.toLowerCase()).toMatch(/contents|home|trending|faq/);
  });

  test('browser back/forward restores sections (popstate sync)', async ({ page }) => {
    await page.goto('/');
    await page.goto('/articles');
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/articles/);
  });
});

test.describe('404 handling', () => {
  test('unknown article slug redirects the URL to /404 and shows the error landing', async ({ page }) => {
    await grantConsent(page);
    await page.goto('/article/this-slug-does-not-exist-xyz');
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/404/);
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/404|severed/i);
  });

  test('direct /404 visit shows the error landing', async ({ page }) => {
    await page.goto('/404');
    await page.waitForTimeout(1200);
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/404|severed/i);
  });

  test('unknown top-level route falls back to the home section (app behavior)', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');
    await page.waitForTimeout(1200);
    // App maps unknown segments to home rather than erroring
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/explore articles|welcome to heartsync|journal/i);
  });
});
