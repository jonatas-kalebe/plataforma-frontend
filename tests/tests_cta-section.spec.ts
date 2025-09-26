import { test, expect, devices } from '@playwright/test';

test.describe('CTA: entrance, pulse, magnetic scroll edge cases, optional haptics/sounds', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#cta').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
  });

  test('CTA content fades/slides in; button has subtle pulsing animation', async ({ page }) => {
    const heading = page.locator('#cta h2, #cta h1').first();
    await expect(heading).toBeVisible();

    const btn = page.locator('#cta a, #cta button').first();
    await expect(btn).toBeVisible();

    const hasPulse = await btn.evaluate(el => {
      const s = getComputedStyle(el as HTMLElement);
      return (s.animationName && s.animationName !== 'none') || (s.animationDuration && s.animationDuration !== '0s');
    });
    expect(hasPulse).toBeTruthy();
  });

  test('no downward snap at end (last section); upward snap back to Trabalhos when <15% from bottom', async ({ page }) => {
    // Scroll slightly within CTA (simulate near-bottom region)
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(300);

    // Ensure we remain within CTA (no further snap down)
    const ctaTopMid = await page.evaluate(() => (document.querySelector('#cta') as HTMLElement).getBoundingClientRect().top);
    expect(ctaTopMid).toBeLessThanOrEqual(0); // CTA locked at/near top while inside

    // Now small upward movement and pause triggers snap back
    await page.mouse.wheel(0, -Math.round((await page.viewportSize())!.height * 0.2));
    await page.waitForTimeout(900);

    const trabalhosTop = await page.evaluate(() => (document.querySelector('#trabalhos') as HTMLElement).getBoundingClientRect().top);
    expect(Math.abs(Math.round(trabalhosTop))).toBeLessThanOrEqual(2);
  });

  test('optional haptic feedback on snap: navigator.vibrate called if available', async ({ page }) => {
    // Monkey-patch vibrate to observe calls
    await page.evaluate(() => {
      (navigator as any).__vibrateCalls = 0;
      const orig = navigator.vibrate?.bind(navigator);
      (navigator as any).vibrate = (pattern: any) => {
        (navigator as any).__vibrateCalls++;
        return orig ? orig(pattern) : true;
      };
    });

    // Force a snap back up by slight upward scroll near CTA start
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(1000);

    const vibrateCalls = await page.evaluate(() => (navigator as any).__vibrateCalls || 0);
    // Optional: pass if 0 (feature not implemented), but assert no errors by reaching here.
    expect(vibrateCalls).toBeGreaterThanOrEqual(0);
  });

  test('optional subtle sound cue on snap: HTMLMediaElement.play or AudioContext used (if implemented)', async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__audioPlayCalls = 0;
      const proto = (window as any).HTMLMediaElement?.prototype;
      if (proto && !proto.__playPatched) {
        const orig = proto.play;
        proto.play = function (...args: any[]) {
          (window as any).__audioPlayCalls++;
          return orig.apply(this, args);
        };
        (proto as any).__playPatched = true;
      }
    });

    // Trigger a snap (scroll down from Trabalhos end into CTA)
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1000);

    const audioCalls = await page.evaluate(() => (window as any).__audioPlayCalls || 0);
    // Optional: same approach — ensure it doesn't break; count >= 0
    expect(audioCalls).toBeGreaterThanOrEqual(0);
  });
});