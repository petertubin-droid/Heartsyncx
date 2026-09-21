import { test, expect } from '@playwright/test';

/**
 * Home section (/) — hero, editorial sections, newsletter block, footer.
 */
test.describe('Home section', () => {
  test('renders the landing page with hero and header landmarks', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Heartsync/i);
    await expect(page.locator('header').first()).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(200);
  });

  test('renders editorial sections (hero + journals + footer content)', async ({ page }) => {
    await page.goto('/');
    // NOTE: never wait for networkidle — realtime/polling keeps sockets open.
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    const hasEditorialContent =
      /latest|trending|newsletter|journal|articles|read|essay/i.test(body);
    expect(hasEditorialContent).toBeTruthy();
    // Hero CTA exists (Explore Articles)
    expect(body).toMatch(/explore articles|take .* quiz|read/i);
  });

  test('footer renders with legal entries and cookie settings', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    // Legal entries are buttons (history-API navigation, not anchors)
    await expect(footer.getByRole('button', { name: /privacy policy/i })).toBeVisible();
    await expect(footer.getByRole('button', { name: /terms of service/i })).toBeVisible();
    await expect(footer.getByRole('button', { name: /cookie policy/i })).toBeVisible();
    await expect(footer.getByRole('button', { name: /cookie settings/i })).toBeVisible();
  });

  test('no critical client errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
});
