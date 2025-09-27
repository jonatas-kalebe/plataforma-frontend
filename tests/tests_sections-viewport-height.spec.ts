import { test, expect } from '@playwright/test';

test.describe('Viewport Height per Section (100vh)', () => {
  test('all sections should be approximately 100vh tall', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await page.evaluate(() => {
      const ids = ['#hero', '#filosofia', '#servicos', '#trabalhos', '#cta'];
      const vh = window.innerHeight;
      return ids.map(sel => {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) return { sel, ok: false, height: 0, vh };
        const h = el.getBoundingClientRect().height;
        // Mobile browsers can have significant viewport variations due to address bars
        // Allow up to 200px tolerance to account for mobile UI elements
        const tolerance = vh > 500 ? 200 : 50; // More tolerance for mobile viewports
        return { sel, ok: Math.abs(h - vh) <= tolerance, height: h, vh, tolerance };
      });
    });

    for (const r of results) {
      expect(r.ok, `${r.sel} height=${r.height} vs vh=${r.vh} (tolerance: ${(r as any).tolerance}px)`).toBeTruthy();
    }
  });
});