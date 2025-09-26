import { test, expect, devices } from '@playwright/test';

async function getCardsOrderOpacity(page) {
  return page.evaluate(() => {
    const container = document.querySelector('#servicos')!;
    const cards = Array.from(container.querySelectorAll('.service-card, [data-testid="service-card"], .card, article')) as HTMLElement[];
    return cards.slice(0, 4).map(el => {
      const s = getComputedStyle(el);
      return { text: el.textContent?.trim()?.slice(0, 30) || '', opacity: parseFloat(s.opacity || '0'), transform: s.transform };
    });
  });
}

test.describe('Serviços: stagger, parallax, magnetism, threshold snap, optional pin, bg transition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#servicos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  });

  test('staggered reveal: first card appears before the next ones', async ({ page }) => {
    const before = await getCardsOrderOpacity(page);
    await page.waitForTimeout(250);
    const mid = await getCardsOrderOpacity(page);
    await page.waitForTimeout(250);
    const after = await getCardsOrderOpacity(page);

    // Opacity should increase over time and card[0] should reach visible sooner than card[1]/card[2]
    expect((mid[0]?.opacity || 0)).toBeGreaterThanOrEqual(before[0]?.opacity || 0);
    expect((after[0]?.opacity || 0)).toBeGreaterThanOrEqual((mid[0]?.opacity || 0));
    // Some staggering evidence
    if (after[1] && after[0]) {
      expect(after[0].opacity).toBeGreaterThanOrEqual(after[1].opacity);
    }
  });

  test('parallax drift after reveal: further scroll increases translateY subtly (not reduced motion)', async ({ page }) => {
    const before = await getCardsOrderOpacity(page);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(200);
    const after = await getCardsOrderOpacity(page);

    // Look for transform change in cards (best-effort)
    expect(after.some((c, i) => c.transform !== before[i]?.transform)).toBeTruthy();
  });

  test('hover magnetism: card lifts and glows on hover (desktop)', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Hover style detection can be flaky on WebKit in CI');
    const firstCard = page.locator('#servicos .service-card, #servicos [data-testid="service-card"], #servicos .card, #servicos article').first();
    await expect(firstCard).toBeVisible();
    const before = await firstCard.evaluate(el => {
      const s = getComputedStyle(el as HTMLElement);
      return { transform: s.transform, boxShadow: s.boxShadow };
    });
    await firstCard.hover();
    await page.waitForTimeout(150);
    const after = await firstCard.evaluate(el => {
      const s = getComputedStyle(el as HTMLElement);
      return { transform: s.transform, boxShadow: s.boxShadow };
    });

    expect(after.transform).not.toBe(before.transform);
    expect(after.boxShadow).not.toBe(before.boxShadow);
  });

  test('reduced motion: cards fade in without movement', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#servicos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const cards = await page.evaluate(() => {
      const container = document.querySelector('#servicos')!;
      return Array.from(container.querySelectorAll('.service-card, [data-testid="service-card"], .card, article')).map(el => {
        const s = getComputedStyle(el as HTMLElement);
        return { opacity: parseFloat(s.opacity || '0'), transform: s.transform };
      });
    });

    // Expect opacity > 0 and transforms to be none/static
    expect(cards.some(c => c.opacity > 0)).toBeTruthy();
    expect(cards.every(c => c.transform === 'none' || c.transform === 'matrix(1, 0, 0, 1, 0, 0)')).toBeTruthy();

    await context.close();
  });

  test('near end (≈90–95%) pause should snap to Trabalhos', async ({ page }) => {
    // Scroll down inside Serviços near the end
    await page.mouse.wheel(0, Math.round((await page.viewportSize())!.height * 0.95));
    await page.waitForTimeout(900);

    const nextTop = await page.evaluate(() => (document.querySelector('#trabalhos') as HTMLElement).getBoundingClientRect().top);
    expect(Math.abs(Math.round(nextTop))).toBeLessThanOrEqual(2);
  });

  test('optional mild pin near bottom (if configured) keeps top stable', async ({ page }) => {
    const hasPin = await page.evaluate(() => {
      const ST = (window as any).ScrollTrigger;
      if (!ST?.getAll) return false;
      return ST.getAll().some((t: any) => t?.vars?.trigger?.id === 'servicos' && t.vars.pin);
    });
    if (!hasPin) test.skip(true, 'Pin not configured for #servicos (optional).');

    const t1 = await page.evaluate(() => (document.querySelector('#servicos') as HTMLElement).getBoundingClientRect().top);
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(200);
    const t2 = await page.evaluate(() => (document.querySelector('#servicos') as HTMLElement).getBoundingClientRect().top);

    expect(Math.abs(t2 - t1)).toBeLessThan(8);
  });

  test('background color transitions smoothly from Serviços to Trabalhos', async ({ page }) => {
    const getBg = async () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.locator('#servicos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const before = await getBg();

    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    const after = await getBg();

    expect(before).not.toBe(after);
  });
});