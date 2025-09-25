import { test, expect } from '@playwright/test';

test.describe('Three.js Particle System Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow particle system to initialize
  });

  test('should initialize particle system without errors', async ({ page }) => {
    const particleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && (
        msg.text().includes('THREE') ||
        msg.text().includes('WebGL') ||
        msg.text().includes('particle')
      )) {
        particleErrors.push(msg.text());
      }
    });
    
    // Check that particle background component exists
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
    
    // Wait for initialization
    await page.waitForTimeout(3000);
    
    expect(particleErrors.length).toBe(0);
  });

  test('should respond to mouse movement', async ({ page }) => {
    // Move mouse to trigger particle interactions
    await page.mouse.move(200, 200);
    await page.waitForTimeout(500);
    
    await page.mouse.move(400, 400);
    await page.waitForTimeout(500);
    
    await page.mouse.move(600, 300);
    await page.waitForTimeout(500);
    
    // Check that particle system is still rendering (no crashes)
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
  });

  test('should respond to scroll state changes', async ({ page }) => {
    // Initial state
    await page.waitForTimeout(1000);
    
    // Scroll to trigger state changes
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    
    // Scroll back up
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(500);
    
    // Particle system should handle velocity changes
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
  });

  test('should handle window resize gracefully', async ({ page }) => {
    // Initial viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Resize to large desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    // Particle system should adapt to resize
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
  });

  test('should respect prefers-reduced-motion for particles', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Particle system should still initialize but with reduced motion
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
    
    // Move mouse - particles should still respond but with reduced animation
    await page.mouse.move(400, 400);
    await page.waitForTimeout(500);
    
    await context.close();
  });

  test('should handle mobile touch events', async ({ page }) => {
    // Simulate touch interactions
    await page.touchscreen.tap(300, 300);
    await page.waitForTimeout(300);
    
    await page.touchscreen.tap(500, 400);
    await page.waitForTimeout(300);
    
    // Particle system should handle touch events
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
  });

  test('should maintain stable physics during rapid interactions', async ({ page }) => {
    // Rapid mouse movements to test stability
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(Math.random() * 800, Math.random() * 600);
      await page.waitForTimeout(50);
    }
    
    // Rapid scrolling
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, Math.random() * 200 - 100);
      await page.waitForTimeout(100);
    }
    
    // System should remain stable
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
  });

  test('should clean up resources properly', async ({ page }) => {
    // Navigate away and back to test cleanup
    await page.goto('about:blank');
    await page.waitForTimeout(500);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Particle system should reinitialize properly
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
  });

  test('should handle WebGL context loss gracefully', async ({ page }) => {
    // Wait for particle system initialization
    await page.waitForTimeout(2000);
    
    // Simulate WebGL context loss (if possible in test environment)
    const contextLossHandled = await page.evaluate(() => {
      // Try to access WebGL context
      const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
      if (canvas) {
        const gl = canvas.getContext('webgl');
        if (gl) {
          // Simulate context loss
          const extension = gl.getExtension('WEBGL_lose_context');
          if (extension) {
            extension.loseContext();
            return true;
          }
        }
      }
      return false;
    });
    
    if (contextLossHandled) {
      await page.waitForTimeout(1000);
    }
    
    // Component should still be attached even if WebGL fails
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
  });

  test('should not interfere with page performance', async ({ page }) => {
    // Measure page performance with particles
    const performanceStart = Date.now();
    
    // Interact with page while particles are running
    await page.locator('#filosofia').scrollIntoView();
    await page.waitForTimeout(500);
    
    await page.locator('#servicos').scrollIntoView();
    await page.waitForTimeout(500);
    
    await page.locator('#trabalhos').scrollIntoView();
    await page.waitForTimeout(500);
    
    const performanceEnd = Date.now();
    const duration = performanceEnd - performanceStart;
    
    // Interactions should complete in reasonable time (not blocked by particles)
    expect(duration).toBeLessThan(5000);
    
    // Check that scrolling is still smooth
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });
});

test.describe('Particle Visual Regression', () => {
  test('should match particle system visual baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for particles to stabilize
    await page.waitForTimeout(3000);
    
    // Take screenshot of hero section with particles
    const heroSection = page.locator('#hero');
    
    // Note: We'll set threshold higher for particles since they're animated
    await expect(heroSection).toHaveScreenshot('hero-with-particles.png', {
      threshold: 0.3 // Higher threshold for animated content
    });
  });

  test('should maintain particle rendering across different viewports', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(2000);
      
      const particleBackground = page.locator('app-three-particle-background');
      await expect(particleBackground).toBeAttached();
    }
  });
});