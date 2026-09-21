import { test, expect } from '@playwright/test';
import { grantConsent } from './helpers';

/**
 * Article reading flow: listing -> detail -> deep-link.
 */
test.describe('Article flow', () => {
  test.beforeEach(async ({ page }) => {
    await grantConsent(page);
  });

  test('articles listing shows clickable article cards', async ({ page }) => {
    await page.goto('/articles');
    await expect(page.getByRole('heading', { name: /wellness journals/i })).toBeVisible({ timeout: 15_000 });
    // BlogCard renders as a clickable div (class group + cursor-pointer) with an h3 title
    const cards = page.locator('div.cursor-pointer.group:has(h3)');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
  });

  test('clicking a card opens the article detail and syncs the URL', async ({ page }) => {
    await page.goto('/articles');
    const card = page.locator('div.cursor-pointer.group:has(h3)').first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/article\//);
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(400);
  });

  test('article deep-link from the sitemap renders heading + body', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const match = xml.match(/\/article\/([a-z0-9-]+)/i);
    test.skip(!match, 'sitemap exposes no article URLs');
    const slug = match![1];
    await page.goto(`/article/${slug}`);
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(300);
    // Reading UI markers (hero byline, reading time, or journal chrome)
    expect(body).toMatch(/min read|reading|by |categor|journal|essay/i);
  });

  test('article view browser-back returns to the listing', async ({ page }) => {
    await page.goto('/articles');
    const card = page.locator('div.cursor-pointer.group:has(h3)').first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click();
    await page.waitForTimeout(1500);
    await page.goBack();
    await expect(page).toHaveURL(/articles/);
  });
});
