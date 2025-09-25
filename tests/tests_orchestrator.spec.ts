import { test, expect } from '@playwright/test';

test.describe('Orquestração de Scroll', () => {
  test('deve registrar ScrollTriggers canônicos com pin/scrub/snap quando aplicável', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => {
      const ST = (window as any).ScrollTrigger;
      if (!ST || !ST.getAll) return { ok: false, ids: [], pinned: false, scrubs: 0, snaps: 0 };
      const all = ST.getAll();
      const ids = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
      const found = new Set<string>();
      let pinned = false;
      let scrubs = 0;
      let snaps = 0;
      for (const t of all) {
        const trg = t.vars?.trigger;
        const id = trg && trg.id ? trg.id : '';
        if (ids.includes(id)) found.add(id);
        if (id === 'trabalhos' && t.vars?.pin) pinned = true;
        if (t.vars?.scrub) scrubs++;
        if (t.vars?.snap) snaps++;
      }
      return { ok: true, ids: Array.from(found), pinned, scrubs, snaps };
    });
    expect(info.ok).toBeTruthy();
    expect(info.ids.sort()).toEqual(['cta', 'filosofia', 'hero', 'servicos', 'trabalhos']);
    expect(info.pinned).toBeTruthy();
    expect(info.scrubs).toBeGreaterThan(0);
    expect(info.snaps).toBeGreaterThan(0);
  });

  test('deve reportar velocidade alta ao rolar rápido', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(30);
    }
    const v = await page.evaluate(() => {
      const ST = (window as any).ScrollTrigger;
      if (!ST || !ST.getVelocity) return 0;
      return Math.abs(ST.getVelocity());
    });
    expect(v).toBeGreaterThan(200);
  });

  test('reduced-motion deve desabilitar pin e scrub', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);
    const states = await page.evaluate(() => {
      const ST = (window as any).ScrollTrigger;
      if (!ST || !ST.getAll) return { pins: 0, scrubs: 0 };
      const all = ST.getAll();
      let pins = 0;
      let scrubs = 0;
      for (const t of all) {
        if (t.vars?.pin) pins++;
        if (t.vars?.scrub) scrubs++;
      }
      return { pins, scrubs };
    });
    expect(states.pins).toBe(0);
    expect(states.scrubs).toBe(0);
    await context.close();
  });
});