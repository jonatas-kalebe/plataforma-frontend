import { test, expect } from '@playwright/test';

test.describe('Reduced Motion Tests', () => {
  test.use({ reducedMotion: 'reduce' });

  test('should maintain layout with reduced motion enabled', async ({ page }) => {
    await page.goto('http://localhost:4000');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot with reduced motion
    await page.screenshot({
      path: '/tmp/reduced-motion-full-page.png',
      fullPage: true
    });
    
    // Check that the ring carousel is visible and has transforms
    const ring = page.locator('[role="region"][aria-label*="Carrossel"]').first();
    await expect(ring).toBeVisible();
    
    // Get the computed transform
    const transform = await ring.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).transform;
    });
    
    console.log('Ring transform with reduced motion:', transform);
    
    // Transform should NOT be 'none' - it should have positioning transforms
    expect(transform).not.toBe('none');
    
    // Take a screenshot of just the ring section
    const ringSection = page.locator('app-trabalhos-section').first();
    await ringSection.screenshot({
      path: '/tmp/reduced-motion-ring-section.png'
    });
  });
});
