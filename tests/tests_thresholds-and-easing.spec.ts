import { test, expect } from '@playwright/test';

test.describe('Thresholds, Velocity Gating and Snap Easing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Monkey-patch gsap.to to capture ease used for scrollTo snaps
    await page.evaluate(() => {
      const w = window as any;
      if (!w.__snapEaseLog) {
        w.__snapEaseLog = [];
        if (w.gsap && typeof w.gsap.to === 'function') {
          const origTo = w.gsap.to.bind(w.gsap);
          w.gsap.to = (target: any, vars: any) => {
            if (vars && (vars.scrollTo !== undefined || (vars as any).scrollTo)) {
              const ease = vars.ease || '(none)';
              w.__snapEaseLog.push(String(ease));
            }
            return origTo(target, vars);
          };
        }
      }
    });
  });

  test('should not snap while velocity > 0 even if >85% threshold is crossed; snaps only after pause', async ({ page }) => {
    // Go to near end of #hero (just before Filosofia)
    await page.locator('#hero').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Cross >85% but keep scrolling quickly to keep velocity non-zero
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 250);
      await page.waitForTimeout(30);
    }

    // Immediately check Filosofia not perfectly aligned yet (no snap while moving)
    const topNow = await page.evaluate(() => {
      const el = document.querySelector('#filosofia')!;
      return Math.round(el.getBoundingClientRect().top);
    });
    expect(Math.abs(topNow)).toBeGreaterThan(4);

    // Pause to allow snap
    await page.waitForTimeout(800);

    // Now it should snap
    const topAfter = await page.evaluate(() => {
      const el = document.querySelector('#filosofia')!;
      return Math.round(el.getBoundingClientRect().top);
    });
    expect(Math.abs(topAfter)).toBeLessThanOrEqual(2);
  });

  test('snap should use a gentle easing (e.g., power2.inOut)', async ({ page }) => {
    // Force a snap by going near end of #filosofia and pausing
    await page.locator('#filosofia').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(1200);

    const easeLog = await page.evaluate(() => (window as any).__snapEaseLog as string[]);
    // Accept variants like 'power2.inOut' or 'Power2.easeInOut' etc.
    const hasGentle = (easeLog || []).some(e => /power2/i.test(e) && /(inout|easeinout)/i.test(e));
    expect(hasGentle, `Snap easing not detected in: ${easeLog}`).toBeTruthy();
  });
});