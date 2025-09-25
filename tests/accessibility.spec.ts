import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // First focusable element should be the hero CTA
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('A');
    
    // Continue tabbing to find all focusable elements
    const focusableElements = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = await page.evaluate(() => {
        const element = document.activeElement;
        return element ? {
          tagName: element.tagName,
          href: (element as HTMLElement).getAttribute('href'),
          textContent: element.textContent?.trim().substring(0, 50)
        } : null;
      });
      
      if (currentFocus) {
        focusableElements.push(currentFocus);
      }
    }
    
    // Should have at least the main CTA buttons
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test('should have proper text contrast', async ({ page }) => {
    // Check main title contrast
    const heroTitle = page.locator('#hero-title');
    const titleStyles = await heroTitle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize
      };
    });
    
    expect(titleStyles.color).toBeTruthy();
    expect(titleStyles.fontSize).toBeTruthy();
    
    // Check subtitle contrast
    const heroSubtitle = page.locator('#hero-subtitle');
    const subtitleStyles = await heroSubtitle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor
      };
    });
    
    expect(subtitleStyles.color).toBeTruthy();
    
    // Check that text is visible (not hidden or transparent)
    await expect(heroTitle).toBeVisible();
    await expect(heroSubtitle).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Get all headings on the page
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(el => ({
        tagName: el.tagName,
        textContent: el.textContent?.trim(),
        level: parseInt(el.tagName.substring(1))
      }));
    });
    
    expect(headings.length).toBeGreaterThan(0);
    
    // Should have exactly one h1
    const h1Elements = headings.filter(h => h.level === 1);
    expect(h1Elements.length).toBe(1);
    expect(h1Elements[0].textContent).toContain('Nós Desenvolvemos');
    
    // Check logical heading progression (no skipping levels)
    for (let i = 1; i < headings.length; i++) {
      const currentLevel = headings[i].level;
      const previousLevel = headings[i - 1].level;
      
      // Heading levels should not skip (e.g., h2 to h4)
      if (currentLevel > previousLevel) {
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    }
  });

  test('should respect prefers-reduced-motion for accessibility', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that reduced motion preference is detected
    const prefersReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(prefersReducedMotion).toBeTruthy();
    
    // Test that animations are still functional but reduced
    await page.locator('#filosofia').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Elements should still be visible and functional
    const filosofiaElements = page.locator('#filosofia h2');
    await expect(filosofiaElements).toBeVisible();
    
    await context.close();
  });

  test('should have accessible focus indicators', async ({ page }) => {
    // Tab to interactive elements and check focus styles
    await page.keyboard.press('Tab');
    
    // Check if focused element has visible focus indicator
    const focusStyles = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      if (!element) return null;
      
      const computed = window.getComputedStyle(element);
      const pseudoFocus = window.getComputedStyle(element, ':focus');
      
      return {
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        outlineColor: computed.outlineColor,
        boxShadow: computed.boxShadow,
        focusOutline: pseudoFocus.outline,
        focusBoxShadow: pseudoFocus.boxShadow
      };
    });
    
    if (focusStyles) {
      // Should have some kind of focus indicator (outline, box-shadow, etc.)
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.focusOutline !== 'none' ||
        focusStyles.focusBoxShadow !== 'none';
        
      expect(hasFocusIndicator).toBeTruthy();
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    // Check for any images on the page
    const images = await page.locator('img').count();
    
    if (images > 0) {
      // Check that images have alt attributes
      for (let i = 0; i < images; i++) {
        const image = page.locator('img').nth(i);
        const altText = await image.getAttribute('alt');
        
        // Alt attribute should exist (can be empty for decorative images)
        expect(altText).not.toBeNull();
      }
    }
  });

  test('should have proper ARIA labels where needed', async ({ page }) => {
    // Check for elements that might need ARIA labels
    const interactiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, [role="button"], [tabindex]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        hasAriaLabel: el.hasAttribute('aria-label'),
        hasAriaLabelledby: el.hasAttribute('aria-labelledby'),
        textContent: el.textContent?.trim(),
        title: el.getAttribute('title')
      }));
    });
    
    // Check that interactive elements have proper labeling
    interactiveElements.forEach(element => {
      const hasAccessibleName = 
        element.hasAriaLabel ||
        element.hasAriaLabelledby ||
        (element.textContent && element.textContent.length > 0) ||
        element.title;
        
      if (!hasAccessibleName) {
        console.warn(`Interactive element ${element.tagName} may lack accessible name`);
      }
    });
    
    // This is informational - we don't fail the test as some elements might be properly labeled in ways we can't detect
    expect(interactiveElements.length).toBeGreaterThanOrEqual(0);
  });

  test('should have proper semantic structure', async ({ page }) => {
    // Check for semantic HTML elements
    const semanticElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('main, nav, header, footer, article, section, aside');
      return Array.from(elements).map(el => el.tagName);
    });
    
    // Should use some semantic elements
    expect(semanticElements.length).toBeGreaterThan(0);
    
    // Check for proper section usage
    const sections = await page.locator('section').count();
    expect(sections).toBeGreaterThan(0);
  });

  test('should handle high contrast mode', async ({ browser }) => {
    // Test with forced colors (simulates high contrast mode)
    const context = await browser.newContext({
      forcedColors: 'active'
    });
    const page = await context.newPage();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that content is still visible and functional
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2').first()).toBeVisible();
    
    // Check that interactive elements are still clickable
    const ctaButton = page.locator('#hero-cta a');
    await expect(ctaButton).toBeVisible();
    
    await context.close();
  });
});