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
        return { sel, ok: Math.abs(h - vh) <= 2, height: h, vh };
      });
    });

    for (const r of results) {
      expect(r.ok, `${r.sel} height=${r.height} vs vh=${r.vh}`).toBeTruthy();
    }
  });
});