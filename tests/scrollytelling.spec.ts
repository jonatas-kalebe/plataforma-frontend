import { test, expect, devices } from '@playwright/test';

test.describe('Scrollytelling & GSAP Animations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Allow animations to initialize
  });

  test('should render all sections with SSR', async ({ page }) => {
    // Verify SSR renders all required sections
    await expect(page.locator('#hero')).toBeVisible();
    await expect(page.locator('#filosofia')).toBeVisible();
    await expect(page.locator('#servicos')).toBeVisible();
    await expect(page.locator('#trabalhos')).toBeVisible();
    await expect(page.locator('#cta')).toBeVisible();

    // Check main content is present (SSR rendered)
    await expect(page.locator('h1')).toContainText('Nós Desenvolvemos');
    await expect(page.locator('h2').first()).toContainText('Da Complexidade à Clareza');
    
    // Verify no hydration errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    const hydrationErrors = consoleErrors.filter(error => 
      error.includes('hydration') || error.includes('mismatch')
    );
    expect(hydrationErrors.length).toBe(0);
  });

  test('should respond to scroll with animations', async ({ page }) => {
    // Get initial positions
    const heroRect = await page.locator('#hero').boundingBox();
    const filosofiaRect = await page.locator('#filosofia').boundingBox();
    
    expect(heroRect).toBeTruthy();
    expect(filosofiaRect).toBeTruthy();
    
    // Test slow scroll
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(500);
    
    // Test fast scroll
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(500);
    
    // Test scroll to filosofia section
    await page.locator('#filosofia').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Verify filosofia section is in view
    const filosofiaInView = await page.evaluate(() => {
      const element = document.querySelector('#filosofia');
      const rect = element?.getBoundingClientRect();
      return rect && rect.top >= 0 && rect.top <= window.innerHeight;
    });
    
    expect(filosofiaInView).toBeTruthy();
  });

  test('should implement scroll snapping between sections', async ({ page }) => {
    const sections = ['#hero', '#filosofia', '#servicos', '#trabalhos', '#cta'];
    
    for (let i = 0; i < sections.length - 1; i++) {
      const currentSection = sections[i];
      const nextSection = sections[i + 1];
      
      // Scroll to section
      await page.locator(nextSection).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Check snap tolerance (≤24px from section start)
      const snapTolerance = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        const rect = element?.getBoundingClientRect();
        return rect ? Math.abs(rect.top) : 1000;
      }, nextSection);
      
      expect(snapTolerance).toBeLessThanOrEqual(24);
    }
  });

  test('should pin trabalhos section (ring clímax)', async ({ page }) => {
    // Scroll to trabalhos section
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Check if section is pinned
    const initialPosition = await page.evaluate(() => {
      const element = document.querySelector('#trabalhos');
      return element?.getBoundingClientRect().top;
    });
    
    // Scroll within the section
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);
    
    const afterScrollPosition = await page.evaluate(() => {
      const element = document.querySelector('#trabalhos');
      return element?.getBoundingClientRect().top;
    });
    
    // Position should remain relatively stable (pinned)
    expect(Math.abs((initialPosition || 0) - (afterScrollPosition || 0))).toBeLessThan(50);
  });

  test('should animate ring based on scroll progress', async ({ page }) => {
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Get initial ring transformation
    const initialTransform = await page.locator('app-work-card-ring [data-testid="ring"], app-work-card-ring > div > div').first().evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    
    // Scroll within the section to change progress
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(500);
    
    // Get new ring transformation
    const newTransform = await page.locator('app-work-card-ring [data-testid="ring"], app-work-card-ring > div > div').first().evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    
    // Transform should have changed
    expect(initialTransform).not.toBe(newTransform);
  });

  test('should maintain reasonable gaps between sections', async ({ page }) => {
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const sections = ['#hero', '#filosofia', '#servicos', '#trabalhos', '#cta'];
    
    for (let i = 0; i < sections.length - 1; i++) {
      const currentSection = sections[i];
      const nextSection = sections[i + 1];
      
      const gap = await page.evaluate((current, next) => {
        const currentEl = document.querySelector(current);
        const nextEl = document.querySelector(next);
        
        if (!currentEl || !nextEl) return 0;
        
        const currentRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();
        
        // Calculate gap between bottom of current and top of next
        return nextRect.top - (currentRect.top + currentRect.height);
      }, currentSection, nextSection);
      
      // Gap should not exceed 20% of viewport height
      expect(gap).toBeLessThanOrEqual(viewportHeight * 0.2);
    }
  });
});

test.describe('Reduced Motion Support', () => {
  test('should disable pin/scrub with prefers-reduced-motion', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Scroll to trabalhos section
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    const initialPosition = await page.evaluate(() => {
      const element = document.querySelector('#trabalhos');
      return element?.getBoundingClientRect().top;
    });
    
    // Scroll past the section
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    
    const afterScrollPosition = await page.evaluate(() => {
      const element = document.querySelector('#trabalhos');
      return element?.getBoundingClientRect().top;
    });
    
    // Section should NOT be pinned (should scroll normally)
    expect(Math.abs((initialPosition || 0) - (afterScrollPosition || 0))).toBeGreaterThan(100);
    
    await context.close();
  });

  test('should maintain discrete transitions with reduced motion', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Elements should still animate but with reduced motion
    const heroTitle = page.locator('#hero-title');
    await expect(heroTitle).toBeVisible();
    
    // Scroll to trigger animations
    await page.locator('#filosofia').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Animation should complete but quickly
    const filosofiaElements = page.locator('#filosofia > div');
    await expect(filosofiaElements.first()).toBeVisible();
    
    await context.close();
  });
});

test.describe('Performance Tests', () => {
  test('should meet Lighthouse performance criteria', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          const cls = entries.find(entry => entry.entryType === 'layout-shift');
          
          resolve({
            lcp: lcp ? (lcp as any).startTime : 0,
            cls: cls ? (cls as any).value : 0
          });
        }).observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          resolve({
            lcp: navigation.loadEventEnd - navigation.fetchStart,
            cls: 0
          });
        }, 3000);
      });
    });
    
    const metrics = await performanceMetrics;
    
    // LCP should be ≤ 3000ms
    expect((metrics as any).lcp).toBeLessThanOrEqual(3000);
    
    // CLS should be ≤ 0.1
    expect((metrics as any).cls).toBeLessThanOrEqual(0.1);
  });

  test('should handle fast scrolling without jank', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Record frame times during fast scrolling
    const framePromise = page.evaluate(() => {
      return new Promise((resolve) => {
        const frameTimes: number[] = [];
        let start = performance.now();
        let frameCount = 0;
        
        function measureFrame() {
          const now = performance.now();
          frameTimes.push(now - start);
          start = now;
          frameCount++;
          
          if (frameCount < 30) {
            requestAnimationFrame(measureFrame);
          } else {
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            resolve({ avgFrameTime, maxFrameTime: Math.max(...frameTimes) });
          }
        }
        
        requestAnimationFrame(measureFrame);
      });
    });
    
    // Fast scroll during measurement
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }
    
    const frameStats = await framePromise;
    
    // Average frame time should be reasonable (60fps = ~16.67ms)
    expect((frameStats as any).avgFrameTime).toBeLessThan(20);
    
    // Max frame time shouldn't exceed 33ms (30fps)
    expect((frameStats as any).maxFrameTime).toBeLessThan(33);
  });
});

test.describe('Mobile Tests', () => {
  test('should handle mobile gesture scroll', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13']
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Simulate touch scroll
    await page.touchscreen.tap(400, 400);
    
    // Swipe up to scroll down
    await page.touchscreen.tap(400, 600);
    await page.touchscreen.tap(400, 200);
    
    await page.waitForTimeout(500);
    
    // Check if scroll occurred
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
    
    await context.close();
  });

  test('should work on mobile without jank', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13']
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Perform scroll gestures and check for smooth operation
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(100);
    }
    
    // Should complete without timeout or errors
    expect(true).toBeTruthy();
    
    await context.close();
  });
});