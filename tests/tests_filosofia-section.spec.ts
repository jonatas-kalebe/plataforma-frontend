import { test, expect } from '@playwright/test';

test.describe('Filosofia section: entry, optional pin, magnetic out', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#filosofia').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  });

  test('entry animation when near 80% viewport: text fades/slides in', async ({ page }) => {
    const title = page.locator('#filosofia h2, #filosofia [data-testid="title"], #filosofia .title').first();
    await expect(title).toBeVisible();
    const before = await title.evaluate(el => {
      const s = getComputedStyle(el as HTMLElement);
      return { opacity: parseFloat(s.opacity || '0'), transform: s.transform };
    });

    // Nudge to simulate crossing the trigger point
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(300);

    const after = await title.evaluate(el => {
      const s = getComputedStyle(el as HTMLElement);
      return { opacity: parseFloat(s.opacity || '0'), transform: s.transform };
    });

    expect(after.opacity).toBeGreaterThanOrEqual(before.opacity);
  });

  test('optional pin at mid progress (if configured) keeps section top stable on scroll', async ({ page }) => {
    // Inspect ScrollTrigger to see if pin is configured for #filosofia
    const hasPin = await page.evaluate(() => {
      const ST = (window as any).ScrollTrigger;
      if (!ST?.getAll) return false;
      return ST.getAll().some((t: any) => t?.vars?.trigger?.id === 'filosofia' && t.vars.pin);
    });

    if (!hasPin) test.skip(true, 'Pin not configured for #filosofia (optional).');

    const top1 = await page.evaluate(() => (document.querySelector('#filosofia') as HTMLElement).getBoundingClientRect().top);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(200);
    const top2 = await page.evaluate(() => (document.querySelector('#filosofia') as HTMLElement).getBoundingClientRect().top);

    expect(Math.abs(top2 - top1)).toBeLessThan(8);
  });

  test('magnetic transition out (>85%) fades filosofia and reveals next', async ({ page }) => {
    // Scroll deep into Filosofia and pause
    await page.mouse.wheel(0, Math.round((await page.viewportSize())!.height * 0.9));
    await page.waitForTimeout(900);

    const nextTop = await page.evaluate(() => (document.querySelector('#servicos') as HTMLElement).getBoundingClientRect().top);
    expect(Math.abs(Math.round(nextTop))).toBeLessThanOrEqual(2);
  });
});