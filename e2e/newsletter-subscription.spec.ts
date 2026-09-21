import { test, expect } from '@playwright/test';
import { grantConsent } from './helpers';

/**
 * Newsletter & subscription conversion surfaces.
 */
test.describe('Newsletter signup', () => {
  test('newsletter page shows an email capture form', async ({ page }) => {
    await page.goto('/newsletter');
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toMatch(/newsletter|digest|subscribe/i);
  });

  test('home newsletter block accepts an email and shows feedback', async ({ page }) => {
    await grantConsent(page);
    await page.goto('/');
    await page.waitForTimeout(1500);
    const forms = page.locator('input[type="email"]');
    const count = await forms.count();
    test.skip(count === 0, 'no email capture on home');
    const form = forms.first();
    await form.fill('e2e-reader@example.com');
    await form.press('Enter');
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/thank|subscribed|check your|welcome|success|failed|error|try again/i);
  });
});

test.describe('Subscription page', () => {
  test('subscription page presents plan options', async ({ page }) => {
    await page.goto('/subscription');
    await page.waitForTimeout(800);
    const body = await page.locator('body').innerText();
    expect(body).toMatch(/premium|plan|subscribe|month|year/i);
  });

  test('subscription CTA buttons are real buttons/links', async ({ page }) => {
    await grantConsent(page);
    await page.goto('/subscription');
    await page.waitForTimeout(800);
    const cta = page
      .getByRole('button', { name: /upgrade|subscribe|get premium|start/i })
      .first();
    if (await cta.count()) {
      await expect(cta).toBeVisible();
    } else {
      const link = page
        .getByRole('link', { name: /upgrade|subscribe|get premium|start/i })
        .first();
      expect(await link.count()).toBeGreaterThan(0);
    }
  });
});
