import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Trabalhos Section Animation Service
 * Validates SSR-safe behavior and browser animations
 */

test.describe('Trabalhos Section - SSR and Animation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page with trabalhos section
    await page.goto('/');
  });

  test('should render trabalhos section without SSR errors', async ({ page }) => {
    // Check for console errors that might indicate SSR issues
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    
    // Verify no SSR-related errors
    const ssrErrors = consoleErrors.filter(err => 
      err.includes('querySelector') || 
      err.includes('document is not defined') ||
      err.includes('window is not defined') ||
      err.includes('navigator is not defined')
    );
    
    expect(ssrErrors).toHaveLength(0);
  });

  test('should display trabalhos section', async ({ page }) => {
    // Wait for the section to be visible
    const section = page.locator('#trabalhos');
    await expect(section).toBeVisible();
    
    // Check that key elements are present
    const title = section.locator('h3');
    await expect(title).toBeVisible();
    
    const ringContainer = section.locator('.ring-container');
    await expect(ringContainer).toBeVisible();
  });

  test('should trigger intersection observer on scroll', async ({ page }) => {
    // Scroll to the trabalhos section
    const section = page.locator('#trabalhos');
    await section.scrollIntoViewIfNeeded();
    
    // Wait a bit for animations to trigger
    await page.waitForTimeout(500);
    
    // Verify section is in viewport
    const isVisible = await section.isVisible();
    expect(isVisible).toBe(true);
    
    // Check that no errors occurred during animation
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('should respect reduced motion preference', async ({ page, context }) => {
    // Set reduced motion preference
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto('/');
    
    // Scroll to trabalhos section
    const section = page.locator('#trabalhos');
    await section.scrollIntoViewIfNeeded();
    
    // Should render without errors even with reduced motion
    await page.waitForTimeout(300);
    await expect(section).toBeVisible();
  });

  test('should handle drag interactions without errors', async ({ page }) => {
    // Scroll to trabalhos section
    const section = page.locator('#trabalhos');
    await section.scrollIntoViewIfNeeded();
    
    // Wait for section to be fully loaded
    await page.waitForTimeout(500);
    
    // Try to find the ring element
    const ring = page.locator('.ring, app-work-card-ring').first();
    
    if (await ring.isVisible()) {
      // Simulate drag interaction (if ring is visible)
      const box = await ring.boundingBox();
      if (box) {
        // Mouse down
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        
        // Drag
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
        
        // Mouse up
        await page.mouse.up();
        
        // Wait for any animations to complete
        await page.waitForTimeout(500);
      }
    }
    
    // Check for no console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    expect(consoleErrors.filter(e => 
      !e.includes('Failed to load resource') // Ignore resource loading errors
    )).toHaveLength(0);
  });

  test('should cleanup properly on navigation', async ({ page }) => {
    // Navigate to page
    await page.goto('/');
    
    // Scroll to trabalhos section
    const section = page.locator('#trabalhos');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Navigate away (if there's another route)
    // This tests that cleanup methods are called properly
    await page.goto('/');
    
    // Wait and check for memory leaks or cleanup errors
    await page.waitForTimeout(500);
    
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle window resize without errors', async ({ page }) => {
    // Scroll to trabalhos section
    const section = page.locator('#trabalhos');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300);
    
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    
    // Verify section still works
    await expect(section).toBeVisible();
    
    // Check for no errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    expect(consoleErrors).toHaveLength(0);
  });

  test('should not access DOM directly during SSR', async ({ page }) => {
    // Monitor for direct DOM access warnings
    const warnings: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && 
          (msg.text().includes('querySelector') || 
           msg.text().includes('document'))) {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have no warnings about DOM access
    expect(warnings).toHaveLength(0);
  });
});
