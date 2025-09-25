import { test, expect } from '@playwright/test';

async function getRingYDegrees(page: any) {
  return page.evaluate(() => {
    const el = document.querySelector('.ring') as HTMLElement;
    if (!el) return null;
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    if (t.startsWith('matrix3d')) {
      const vals = t.slice(9, -1).split(',').map(parseFloat);
      const m11 = vals[0];
      const m13 = vals[2];
      const rad = Math.atan2(m13, m11);
      return rad * 180 / Math.PI;
    }
    if (t.startsWith('matrix(')) {
      const vals = t.slice(7, -1).split(',').map(parseFloat);
      const a = vals[0];
      const b = vals[1];
      return Math.atan2(b, a) * 180 / Math.PI;
    }
    return 0;
  });
}

test.describe('Sensibilidade Adaptativa do Ring', () => {
  test('variação próxima aos snaps deve ser maior que no meio do progresso', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const startAngle = await getRingYDegrees(page);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(80);
    }
    const nearStartBefore = await getRingYDegrees(page);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(120);
    const nearStartAfter = await getRingYDegrees(page);
    const deltaStart = Math.abs((nearStartAfter || 0) - (nearStartBefore || 0));
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 150);
      await page.waitForTimeout(60);
    }
    const midBefore = await getRingYDegrees(page);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(120);
    const midAfter = await getRingYDegrees(page);
    const deltaMid = Math.abs((midAfter || 0) - (midBefore || 0));
    expect(deltaStart).toBeGreaterThan(0);
    expect(deltaMid).toBeGreaterThan(0);
    expect(deltaStart).toBeGreaterThan(deltaMid * 1.1);
    expect(startAngle).not.toBeNull();
  });
});