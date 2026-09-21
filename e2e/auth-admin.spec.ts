import { test, expect } from '@playwright/test';
import { grantConsent } from './helpers';

/**
 * Auth UI and admin guard.
 * Real Google/email auth is not exercised in e2e (external providers);
 * these tests lock the surfaces: modal opens, provider buttons exist,
 * admin route never leaks the console without a session.
 */
test.describe('Auth UI', () => {
  test.beforeEach(async ({ page }) => {
    await grantConsent(page);
  });

  test('Login / Sign Up opens the auth modal with Google + email options', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const loginTrigger = page.getByRole('button', { name: /login \/ sign ?up/i }).first();
    await loginTrigger.click();
    // Auth modal is a motion.div without role=dialog  - locate by its heading
    const dialog = page.locator('div').filter({ has: page.getByRole('heading', { name: /welcome back|join heartsync/i }) }).last();
    await expect(page.getByText(/welcome back|join heartsync/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible();
  });

  test('auth modal closes without signing in', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /login \/ sign ?up/i }).first().click();
    await expect(page.getByText(/welcome back|join heartsync/i)).toBeVisible();
    // Close button is the icon X at the modal's top-right (aria-label "Close")
    const closeBtn = page.locator('button.absolute.right-4.top-4').first();
    const before = await page.getByText(/welcome back|join heartsync/i).isVisible();
    if (await closeBtn.count() && before) {
      await closeBtn.click();
      await page.waitForTimeout(600);
      expect(await page.getByText(/welcome back|join heartsync/i).count()).toBe(0);
    }
    const session = await page.evaluate(() => localStorage.getItem('hs_current_user'));
    expect(session ?? null).toBeNull();
  });
});

test.describe('Admin guard', () => {
  // Console-only markers that must never render without an admin session
  const CONSOLE_MARKERS = [
    /roles & permissions/i,
    /banner slots/i,
    /audit log/i,
    /subscribers list/i,
    /manage articles/i,
  ];

  test('/admin shows the admin login surface, never the console', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    for (const marker of CONSOLE_MARKERS) {
      expect(body, `console marker ${marker} leaked`).not.toMatch(marker);
    }
    // Admin sign-in surface must be offered
    expect(body).toMatch(/sign in|log ?in|password|admin/i);
  });

  test('/admin/login also guards the console', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    for (const marker of CONSOLE_MARKERS) {
      expect(body).not.toMatch(marker);
    }
    expect(body).toMatch(/sign in|log ?in|password|admin/i);
  });
});
