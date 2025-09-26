import { test, expect } from '@playwright/test';

async function getMetrics(page) {
  return page.evaluate(() => {
    const title = document.querySelector('#hero h1') as HTMLElement | null;
    if (!title) return null;
    const rect = title.getBoundingClientRect();
    const style = getComputedStyle(title);
    return { top: rect.top, opacity: parseFloat(style.opacity || '1'), transform: style.transform };
  });
}

test.describe('Hero micro-behavior (0–20% resistance, >20% acceleration, scroll hint)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#hero')).toBeVisible();
  });

  test('initial 0–20% scroll applies gentle resistance: small translateY and slight opacity change', async ({ page }) => {
    const initial = await getMetrics(page);
    await page.mouse.wheel(0, Math.round((await page.viewportSize())!.height * 0.1));
    await page.waitForTimeout(200);
    const after = await getMetrics(page);

    expect(after).toBeTruthy();
    // Small upward move (negative delta), limited magnitude
    expect(after!.top).toBeLessThan(initial!.top);
    expect(initial!.top - after!.top).toBeLessThan(60);
    // Slight opacity drop (no big fade)
    expect(after!.opacity).toBeGreaterThan(0.6);
    expect(after!.opacity).toBeLessThan(initial!.opacity);
  });

  test('beyond ~20% scroll accelerates transition (larger delta than initial movement)', async ({ page }) => {
    const start = await getMetrics(page);
    // 10% scroll
    await page.mouse.wheel(0, Math.round((await page.viewportSize())!.height * 0.1));
    await page.waitForTimeout(150);
    const mid = await getMetrics(page);
    const delta1 = Math.abs((start!.top - mid!.top));

    // Additional 20% scroll (crossing the ~20% threshold)
    await page.mouse.wheel(0, Math.round((await page.viewportSize())!.height * 0.2));
    await page.waitForTimeout(150);
    const end = await getMetrics(page);
    const delta2 = Math.abs((mid!.top - end!.top));

    expect(delta2).toBeGreaterThan(delta1);
  });

  test('scroll hint should exist and be animated', async ({ page }) => {
    const hint = page.locator('#scroll-hint, .scroll-hint, [data-testid="scroll-hint"]');
    const exists = await hint.count();
    expect(exists).toBeGreaterThan(0);

    const hasAnimation = await hint.first().evaluate(el => {
      const s = getComputedStyle(el as HTMLElement);
      return (s.animationName && s.animationName !== 'none') || (s.animationDuration && s.animationDuration !== '0s');
    });
    expect(hasAnimation).toBeTruthy();
  });
});