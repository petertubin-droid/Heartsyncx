import { test, expect } from '@playwright/test';

/**
 * GDPR cookie consent — banner, accept/reject, customization modal,
 * persistence and the Footer "Cookie Settings" reopen path.
 */
const CONSENT_KEY = 'heartsync_cookie_consent';
const PREFS_KEY = 'heartsync_cookie_preferences';

test.describe('Cookie consent (GDPR)', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('banner appears for a first-time visitor', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('[aria-label="Heartsync Cookie Consent"]');
    await expect(banner).toBeVisible();
    await expect(banner.getByRole('button', { name: /accept all/i })).toBeVisible();
    await expect(banner.getByRole('button', { name: /reject all/i })).toBeVisible();
    await expect(banner.getByRole('button', { name: /customize cookie options|more options/i }).first()).toBeVisible();
  });

  test('Accept All records consent and dismisses the banner', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('[aria-label="Heartsync Cookie Consent"]');
    await banner.getByRole('button', { name: /accept all/i }).click();
    await expect(banner).toBeHidden();
    const stored = await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY);
    expect(stored).toMatch(/accepted/);
  });

  test('Reject All records a necessary-only choice', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('[aria-label="Heartsync Cookie Consent"]');
    await banner.getByRole('button', { name: /reject all/i }).click();
    await expect(banner).toBeHidden();
    const consent = await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY);
    expect(consent).toMatch(/rejected/);
    const prefs = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), PREFS_KEY);
    expect(prefs).toBeTruthy();
    expect(prefs.necessary).toBe(true);
    expect(prefs.analytics).toBe(false);
  });

  test('consent choice persists across reloads (banner does not re-appear)', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('[aria-label="Heartsync Cookie Consent"]');
    await banner.getByRole('button', { name: /accept all/i }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.locator('[aria-label="Heartsync Cookie Consent"]')).toBeHidden();
  });

  test('customize modal saves a custom analytics-only split', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('[aria-label="Heartsync Cookie Consent"]');
    await banner.getByRole('button', { name: /customize cookie options|more options/i }).first().click();
    // Wait for the preferences modal to appear (it renders separately from the banner)
    const prefsModal = page.getByRole('dialog').filter({ hasText: /cookie preferences/i }).first();
    await expect(prefsModal).toBeVisible({ timeout: 8000 });
    const analyticsSwitch = prefsModal.getByRole('switch', { name: /analytics cookies/i });
    await analyticsSwitch.click();
    // Scope Save to the modal to avoid hidden save buttons elsewhere in the DOM
    await prefsModal.getByRole('button', { name: /save settings|save/i }).first().click();
    await page.waitForTimeout(500);
    const prefs = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), PREFS_KEY);
    expect(prefs?.analytics).toBe(true);
    expect(prefs?.marketing).toBe(false);
    const consent = await page.evaluate((k) => localStorage.getItem(k), CONSENT_KEY);
    expect(consent).toMatch(/custom|accepted/);
  });

  test('Footer Cookie Settings reopens the preferences modal', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('[aria-label="Heartsync Cookie Consent"]');
    await banner.getByRole('button', { name: /accept all/i }).click();
    await expect(banner).toBeHidden();
    const cookieSettings = page.locator('footer').getByRole('button', { name: /cookie settings/i }).first();
    await cookieSettings.click();
    const modal = page.getByRole('dialog').filter({ hasText: /cookie preferences/i });
    await expect(modal.first()).toBeVisible();
  });
});
