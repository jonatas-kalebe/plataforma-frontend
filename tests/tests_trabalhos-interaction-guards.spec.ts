import { test, expect } from '@playwright/test';

test.describe('Trabalhos: drag overrides scroll influence; end-of-pin transitions to CTA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
  });

  test('while dragging ring, scroll does not change rotation (scroll influence disabled)', async ({ page }) => {
    const ring = page.locator('app-work-card-ring .ring, app-work-card-ring [data-testid="ring"], app-work-card-ring > div > div').first();
    await expect(ring).toBeVisible();

    const bb = await ring.boundingBox();
    if (!bb) test.skip(true, 'Ring bounding box not available');

    // Start drag
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width / 2 + 120, bb.y + bb.height / 2, { steps: 8 });

    const duringDrag = await ring.evaluate(el => getComputedStyle(el as HTMLElement).transform);

    // Scroll while mouse is still down (dragging)
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(200);

    const stillDuringDrag = await ring.evaluate(el => getComputedStyle(el as HTMLElement).transform);
    expect(stillDuringDrag).toBe(duringDrag);

    // End drag
    await page.mouse.up();
  });

  test('at end of pinned scroll, section releases and CTA aligns to top', async ({ page }) => {
    // Scroll within pinned Trabalhos to its end
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(600);

    const ctaTop = await page.evaluate(() => (document.querySelector('#cta') as HTMLElement).getBoundingClientRect().top);
    expect(Math.abs(Math.round(ctaTop))).toBeLessThanOrEqual(2);
  });
});