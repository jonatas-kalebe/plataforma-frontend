import { test, expect } from '@playwright/test';

async function scrollToNear(page: any, selector: string, offset: number) {
  const y = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel) as HTMLElement;
    const rect = el.getBoundingClientRect();
    return rect.top + window.scrollY;
  }, selector);
  // @ts-ignore
  await page.evaluate(([target, off]) => window.scrollTo(0, target - off), [y, offset]);
}

test.describe('Snap Magnético Não Linear', () => {
  test('pequeno gesto perto do limite deve snapar para a seção seguinte', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await scrollToNear(page, '#filosofia', 40);
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, 30);
    await page.waitForTimeout(400);
    const top = await page.evaluate(() => {
      const el = document.querySelector('#filosofia') as HTMLElement;
      return Math.abs(el.getBoundingClientRect().top);
    });
    expect(top).toBeLessThanOrEqual(24);
  });

  test('longe do limite, pequeno gesto não deve pular para a próxima seção', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await scrollToNear(page, '#servicos', 300);
    await page.waitForTimeout(100);
    const before = await page.evaluate(() => {
      const el = document.querySelector('#servicos') as HTMLElement;
      return Math.abs(el.getBoundingClientRect().top);
    });
    await page.mouse.wheel(0, 30);
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => {
      const el = document.querySelector('#servicos') as HTMLElement;
      return Math.abs(el.getBoundingClientRect().top);
    });
    expect(Math.abs(after - before)).toBeGreaterThan(0);
    expect(after).toBeGreaterThan(0);
  });
});
