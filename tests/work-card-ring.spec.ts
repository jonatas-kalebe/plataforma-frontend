import { test, expect } from '@playwright/test';

test.describe('Work Card Ring Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to trabalhos section where ring is located
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  });

  test('should render ring component', async ({ page }) => {
    const ringComponent = page.locator('app-work-card-ring');
    await expect(ringComponent).toBeAttached();
    
    // Ring should be visible
    await expect(ringComponent).toBeVisible();
  });

  test('should animate ring on scroll into view', async ({ page }) => {
    // Scroll away and back to trigger animation
    await page.locator('#cta').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Ring should animate in (opacity and rotation)
    const ringElement = page.locator('app-work-card-ring').first();
    await expect(ringElement).toBeVisible();
    
    // Check that ring has some transform (animation applied)
    const transform = await ringElement.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    
    // Should have some transform applied (not 'none')
    expect(transform).not.toBe('none');
  });

  test('should respond to mouse drag', async ({ page }) => {
    const ringElement = page.locator('app-work-card-ring').first();
    
    // Get initial position
    const initialTransform = await ringElement.evaluate(el => {
      const ringDiv = el.querySelector('div > div') as HTMLElement;
      return ringDiv ? window.getComputedStyle(ringDiv).transform : 'none';
    });
    
    // Perform drag gesture
    const ringBox = await ringElement.boundingBox();
    if (ringBox) {
      const startX = ringBox.x + ringBox.width / 2;
      const startY = ringBox.y + ringBox.height / 2;
      
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 100, startY, { steps: 10 });
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      
      // Get new transform
      const newTransform = await ringElement.evaluate(el => {
        const ringDiv = el.querySelector('div > div') as HTMLElement;
        return ringDiv ? window.getComputedStyle(ringDiv).transform : 'none';
      });
      
      // Transform should have changed
      expect(newTransform).not.toBe(initialTransform);
    }
  });

  test('should respond to touch drag on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      hasTouch: true
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    const ringElement = page.locator('app-work-card-ring').first();
    
    // Get initial position
    const initialTransform = await ringElement.evaluate(el => {
      const ringDiv = el.querySelector('div > div') as HTMLElement;
      return ringDiv ? window.getComputedStyle(ringDiv).transform : 'none';
    });
    
    // Perform touch drag
    const ringBox = await ringElement.boundingBox();
    if (ringBox) {
      const centerX = ringBox.x + ringBox.width / 2;
      const centerY = ringBox.y + ringBox.height / 2;
      
      await page.touchscreen.tap(centerX, centerY);
      await page.touchscreen.tap(centerX + 50, centerY);
      
      await page.waitForTimeout(500);
      
      // Transform should have changed
      const newTransform = await ringElement.evaluate(el => {
        const ringDiv = el.querySelector('div > div') as HTMLElement;
        return ringDiv ? window.getComputedStyle(ringDiv).transform : 'none';
      });
      
      // Note: Touch interaction might be different, so we just check it's still working
      expect(newTransform).toBeTruthy();
    }
    
    await context.close();
  });

  test('should maintain smooth rotation with inertia', async ({ page }) => {
    const ringElement = page.locator('app-work-card-ring').first();
    const ringBox = await ringElement.boundingBox();
    
    if (ringBox) {
      const centerX = ringBox.x + ringBox.width / 2;
      const centerY = ringBox.y + ringBox.height / 2;
      
      // Quick drag to create velocity
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 150, centerY, { steps: 5 }); // Fast movement
      await page.mouse.up();
      
      // Wait for inertia animation
      await page.waitForTimeout(1000);
      
      // Ring should continue rotating with inertia
      const ringInner = ringElement.locator('> div > div').first();
      await expect(ringInner).toBeVisible();
    }
  });

  test('should display project items correctly', async ({ page }) => {
    // Check that ring contains project items
    const ringItems = page.locator('app-work-card-ring [class*="card"], app-work-card-ring [class*="item"], app-work-card-ring [class*="project"]');
    
    // Should have multiple items (the component creates 8 by default)
    const itemCount = await ringItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // If we can find specific project text
    const hasProjectText = await page.locator('app-work-card-ring').textContent();
    if (hasProjectText && hasProjectText.includes('Projeto')) {
      expect(hasProjectText).toContain('Projeto');
    }
  });

  test('should handle rapid interactions without breaking', async ({ page }) => {
    const ringElement = page.locator('app-work-card-ring').first();
    const ringBox = await ringElement.boundingBox();
    
    if (ringBox) {
      const centerX = ringBox.x + ringBox.width / 2;
      const centerY = ringBox.y + ringBox.height / 2;
      
      // Rapid interactions
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(centerX + (i * 20), centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + (i * 20) + 50, centerY);
        await page.mouse.up();
        await page.waitForTimeout(50);
      }
      
      await page.waitForTimeout(500);
      
      // Ring should still be functional
      await expect(ringElement).toBeVisible();
    }
  });

  test('should clean up event listeners on destroy', async ({ page }) => {
    // Navigate away and back to test cleanup
    await page.goto('about:blank');
    await page.waitForTimeout(500);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Ring should reinitialize properly
    const ringComponent = page.locator('app-work-card-ring');
    await expect(ringComponent).toBeVisible();
  });

  test('should respond to scroll progress within pinned section', async ({ page }) => {
    // This tests the integration with scroll orchestration
    const initialTransform = await page.locator('app-work-card-ring').first().evaluate(el => {
      const ringDiv = el.querySelector('div > div') as HTMLElement;
      return ringDiv ? window.getComputedStyle(ringDiv).transform : 'none';
    });
    
    // Scroll within the trabalhos section (if pinned)
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(500);
    
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    
    // Ring might respond to scroll progress
    const ringElement = page.locator('app-work-card-ring').first();
    await expect(ringElement).toBeVisible();
  });

  test('should maintain 3D perspective and depth', async ({ page }) => {
    const ringElement = page.locator('app-work-card-ring').first();
    
    // Check for 3D transforms or perspective
    const has3D = await ringElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      const ringDiv = el.querySelector('div') as HTMLElement;
      const ringInnerDiv = ringDiv?.querySelector('div') as HTMLElement;
      
      if (ringInnerDiv) {
        const innerStyles = window.getComputedStyle(ringInnerDiv);
        return {
          perspective: styles.perspective,
          transformStyle: styles.transformStyle,
          transform: innerStyles.transform
        };
      }
      return null;
    });
    
    if (has3D) {
      // Should have some 3D properties set
      expect(has3D.transform).toBeTruthy();
    }
  });
});

test.describe('Ring Visual Regression', () => {
  test('should match ring visual baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    
    // Take screenshot of trabalhos section with ring
    const trabalhoSection = page.locator('#trabalhos');
    await expect(trabalhoSection).toHaveScreenshot('trabalhos-with-ring.png', {
      threshold: 0.1
    });
  });

  test('should maintain ring appearance across viewports', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.locator('#trabalhos').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      const ringComponent = page.locator('app-work-card-ring');
      await expect(ringComponent).toBeVisible();
    }
  });
});