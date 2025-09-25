import { test, expect } from '@playwright/test';

test.describe('Scrollytelling Landing Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display hero section with particle background', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Nós Desenvolvemos');
    await expect(page.locator('app-three-particle-background')).toBeVisible();
    
    // Check if particles are rendered (canvas element exists)
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(2); // One for particles, one for knot
  });

  test('should handle scroll interactions', async ({ page }) => {
    // Initial position
    const initialScrollY = await page.evaluate(() => window.scrollY);
    expect(initialScrollY).toBe(0);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);

    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBe(500);

    // Should see the next section
    await expect(page.locator('#filosofia')).toBeInViewport();
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Simulate prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still display content but with reduced animations
    await expect(page.locator('h1')).toContainText('Nós Desenvolvemos');
    
    // Particle background should still be present but possibly with reduced motion
    await expect(page.locator('app-three-particle-background')).toBeVisible();
  });

  test('should display all sections', async ({ page }) => {
    // Check all main sections are present
    await expect(page.locator('#filosofia')).toBeAttached();
    await expect(page.locator('#servicos')).toBeAttached();
    await expect(page.locator('#trabalhos')).toBeAttached();
    await expect(page.locator('#cta')).toBeAttached();

    // Scroll to bottom to ensure all sections are accessible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // CTA section should be visible
    await expect(page.locator('#cta')).toBeInViewport();
  });

  test('should have interactive elements working', async ({ page }) => {
    // Test CTA button
    const ctaButton = page.locator('a[href="#servicos"]');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveText('Explore Nosso Trabalho');

    // Test contact link
    const contactLink = page.locator('a[href^="mailto:"]');
    await expect(contactLink).toBeVisible();
  });

  test('should maintain canvas responsiveness', async ({ page }) => {
    // Initial canvas size
    const initialCanvas = await page.locator('canvas').first();
    const initialBounds = await initialCanvas.boundingBox();
    expect(initialBounds).toBeTruthy();

    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    // Canvas should still be present and have reasonable dimensions
    const resizedBounds = await initialCanvas.boundingBox();
    expect(resizedBounds).toBeTruthy();
    expect(resizedBounds!.width).toBeGreaterThan(0);
    expect(resizedBounds!.height).toBeGreaterThan(0);
  });

});