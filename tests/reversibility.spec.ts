import { test, expect } from '@playwright/test';

function getTransformOf(locator: any) {
  return locator.evaluate((el: Element) => {
    const c = window.getComputedStyle(el as HTMLElement);
    return { transform: c.transform, opacity: c.opacity };
  });
}

test.describe('Reversibilidade de Animações', () => {
  test('hero deve reverter estado ao voltar ao topo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const title = page.locator('#hero-title');
    await expect(title).toBeVisible();
    const initial = await getTransformOf(title);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(20);
    }
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -400);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(200);
    const back = await getTransformOf(title);
    expect(back.transform).toBe(initial.transform);
    expect(back.opacity).toBe(initial.opacity);
  });
});
