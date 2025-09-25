import { test, expect } from '@playwright/test';

test('home visual', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Athenity/i);
  await expect(page).toHaveScreenshot();
});
