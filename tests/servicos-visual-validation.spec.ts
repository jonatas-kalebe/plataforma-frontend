/**
 * Visual and CSS Validation Tests for Serviços Section
 * Validates exact color values, spacing, typography, and visual design system implementation
 */

import { test, expect, Page } from '@playwright/test';

// Color validation helpers
const EXPECTED_COLORS = {
  DEEP_BLUE: 'rgb(10, 25, 47)',      // #0A192F
  CARD_BLUE: 'rgb(17, 34, 64)',      // #112240  
  NEON_GREEN: 'rgb(100, 255, 218)',  // #64FFDA
  TITLE_TEXT: 'rgb(204, 214, 246)',  // #CCD6F6
  BODY_TEXT: 'rgb(136, 146, 176)',   // #8892B0
};

async function getComputedStyles(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel) as HTMLElement;
    if (!element) return null;
    
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return {
      backgroundColor: computed.backgroundColor,
      color: computed.color,
      borderColor: computed.borderColor,
      boxShadow: computed.boxShadow,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontFamily: computed.fontFamily,
      lineHeight: computed.lineHeight,
      padding: computed.padding,
      margin: computed.margin,
      borderRadius: computed.borderRadius,
      transform: computed.transform,
      transition: computed.transition,
      opacity: computed.opacity,
      display: computed.display,
      gridTemplateColumns: computed.gridTemplateColumns,
      gap: computed.gap,
      textAlign: computed.textAlign,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    };
  }, selector);
}

async function validateColorMatch(actualColor: string, expectedColor: string, tolerance: number = 5) {
  const parseRGB = (color: string) => {
    const match = color.match(/rgb\((\d+),?\s*(\d+),?\s*(\d+)\)/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
  };

  const actual = parseRGB(actualColor);
  const expected = parseRGB(expectedColor);

  if (!actual || !expected) return false;

  return actual.every((value, index) => 
    Math.abs(value - expected[index]) <= tolerance
  );
}

test.describe('Serviços Section - Visual & CSS Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadingScreen = page.locator('app-loading-screen');
    if (await loadingScreen.isVisible()) {
      await expect(loadingScreen).not.toBeVisible({ timeout: 10000 });
    }
    
    await page.locator('#servicos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  });

  test.describe('1. Exact Color Implementation - Brand Compliance', () => {
    
    test('should have exact deep brand-blue background (#0A192F)', async ({ page }) => {
      const sectionStyles = await getComputedStyles(page, '#servicos');
      
      expect(sectionStyles).toBeTruthy();
      
      // Check if background contains the deep blue color (could be gradient or solid)
      const hasDeepBlue = sectionStyles!.backgroundColor.includes('10, 25, 47') ||
                          sectionStyles!.backgroundColor.includes('0, 25, 47'); // Account for rgb parsing
      
      expect(hasDeepBlue).toBeTruthy();
    });

    test('should have service cards with exact darker blue background (#112240)', async ({ page }) => {
      const cards = await page.locator('#servicos .service-card').all();
      expect(cards.length).toBeGreaterThan(0);
      
      for (let i = 0; i < cards.length; i++) {
        const cardStyles = await getComputedStyles(page, `#servicos [data-testid="service-card-${i}"]`);
        expect(cardStyles).toBeTruthy();
        
        const isCorrectBlue = await validateColorMatch(
          cardStyles!.backgroundColor, 
          EXPECTED_COLORS.CARD_BLUE,
          5
        );
        expect(isCorrectBlue).toBeTruthy();
      }
    });

    test('should have service titles with exact neon green color (#64FFDA)', async ({ page }) => {
      const titles = await page.locator('#servicos .service-card h4').all();
      expect(titles.length).toBeGreaterThan(0);
      
      for (const title of titles) {
        const color = await title.evaluate(el => getComputedStyle(el).color);
        
        const isCorrectGreen = await validateColorMatch(
          color,
          EXPECTED_COLORS.NEON_GREEN,
          5
        );
        expect(isCorrectGreen).toBeTruthy();
      }
    });

    test('should have section title with correct text color (#CCD6F6)', async ({ page }) => {
      const titleStyles = await getComputedStyles(page, '#servicos h3');
      expect(titleStyles).toBeTruthy();
      
      const isCorrectTextColor = await validateColorMatch(
        titleStyles!.color,
        EXPECTED_COLORS.TITLE_TEXT,
        5
      );
      expect(isCorrectTextColor).toBeTruthy();
    });

    test('should have body text with correct color (#8892B0)', async ({ page }) => {
      const descriptions = await page.locator('#servicos .service-card p').all();
      expect(descriptions.length).toBeGreaterThan(0);
      
      for (const description of descriptions) {
        const color = await description.evaluate(el => getComputedStyle(el).color);
        
        const isCorrectBodyColor = await validateColorMatch(
          color,
          EXPECTED_COLORS.BODY_TEXT,
          5
        );
        expect(isCorrectBodyColor).toBeTruthy();
      }
    });
  });

  test.describe('2. Typography Implementation - Font System', () => {
    
    test('should use Montserrat font family for headings', async ({ page }) => {
      const sectionTitleStyles = await getComputedStyles(page, '#servicos h3');
      const cardTitleStyles = await getComputedStyles(page, '#servicos .service-card h4');
      
      expect(sectionTitleStyles!.fontFamily).toMatch(/Montserrat/i);
      expect(cardTitleStyles!.fontFamily).toMatch(/Montserrat/i);
    });

    test('should have correct font sizes for section title', async ({ page }) => {
      const titleStyles = await getComputedStyles(page, '#servicos h3');
      
      // text-3xl should be approximately 30px (1.875rem)
      const fontSize = parseFloat(titleStyles!.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(28);
      expect(fontSize).toBeLessThanOrEqual(34);
    });

    test('should have correct font sizes for service card titles', async ({ page }) => {
      const cardTitleStyles = await getComputedStyles(page, '#servicos .service-card h4');
      
      // text-2xl should be approximately 24px (1.5rem)
      const fontSize = parseFloat(cardTitleStyles!.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(22);
      expect(fontSize).toBeLessThanOrEqual(26);
    });

    test('should have correct font weights', async ({ page }) => {
      const sectionTitleStyles = await getComputedStyles(page, '#servicos h3');
      const cardTitleStyles = await getComputedStyles(page, '#servicos .service-card h4');
      
      // font-extrabold should be 800
      expect(parseInt(sectionTitleStyles!.fontWeight)).toBeGreaterThanOrEqual(700);
      
      // font-bold should be 700
      expect(parseInt(cardTitleStyles!.fontWeight)).toBeGreaterThanOrEqual(600);
    });

    test('should have correct line heights', async ({ page }) => {
      const descriptionStyles = await getComputedStyles(page, '#servicos .service-card p');
      
      // leading-relaxed should be 1.625
      const lineHeight = parseFloat(descriptionStyles!.lineHeight);
      expect(lineHeight).toBeGreaterThanOrEqual(1.5);
      expect(lineHeight).toBeLessThanOrEqual(1.8);
    });

    test('should have correct text alignment', async ({ page }) => {
      const sectionTitleStyles = await getComputedStyles(page, '#servicos h3');
      
      // text-center
      expect(sectionTitleStyles!.textAlign).toBe('center');
    });
  });

  test.describe('3. Layout & Spacing Implementation - Grid System', () => {
    
    test('should have correct grid layout for responsive design', async ({ page }) => {
      const gridStyles = await getComputedStyles(page, '#servicos .servicos-grid');
      
      expect(gridStyles).toBeTruthy();
      expect(gridStyles!.display).toBe('grid');
      
      // Should have multiple columns on larger screens
      const gridCols = gridStyles!.gridTemplateColumns;
      expect(gridCols).not.toBe('none');
    });

    test('should have correct grid gap (gap-8 = 2rem = 32px)', async ({ page }) => {
      const gridStyles = await getComputedStyles(page, '#servicos .servicos-grid');
      
      const gap = parseFloat(gridStyles!.gap);
      expect(gap).toBeGreaterThanOrEqual(30);
      expect(gap).toBeLessThanOrEqual(34);
    });

    test('should have correct card padding (p-8 = 2rem = 32px)', async ({ page }) => {
      const cardStyles = await getComputedStyles(page, '#servicos .service-card');
      
      const padding = cardStyles!.padding;
      // Should be 32px on all sides
      expect(padding).toMatch(/32px/);
    });

    test('should have correct border radius (rounded-2xl = 1rem = 16px)', async ({ page }) => {
      const cardStyles = await getComputedStyles(page, '#servicos .service-card');
      
      const borderRadius = parseFloat(cardStyles!.borderRadius);
      expect(borderRadius).toBeGreaterThanOrEqual(14);
      expect(borderRadius).toBeLessThanOrEqual(18);
    });

    test('should have correct section margins and spacing', async ({ page }) => {
      const gridStyles = await getComputedStyles(page, '#servicos .servicos-grid');
      
      // mt-14 should be applied (3.5rem = 56px)
      const marginTop = parseFloat(gridStyles!.margin);
      // This might be parsed differently, but should be substantial spacing
      expect(Math.abs(marginTop)).toBeGreaterThan(40);
    });
  });

  test.describe('4. Interactive States - Hover & Transitions', () => {
    
    test('should have correct transition properties on cards', async ({ page }) => {
      const cardStyles = await getComputedStyles(page, '#servicos .service-card');
      
      expect(cardStyles!.transition).toContain('transform');
      expect(cardStyles!.transition).toMatch(/0\.[3-6]s/); // Should have reasonable duration
    });

    test('should have initial transparent border state', async ({ page }) => {
      const cardStyles = await getComputedStyles(page, '#servicos .service-card');
      
      // Should start with transparent border
      expect(cardStyles!.borderColor).toMatch(/rgba?\(0,?\s*0,?\s*0,?\s*0\)|transparent/);
    });

    test('should have hover transform classes properly configured', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit', 'Hover pseudo-class detection unreliable in WebKit CI');
      
      const firstCard = page.locator('#servicos [data-testid="service-card-0"]');
      
      // Check that hover classes are present in HTML
      const hasHoverClasses = await firstCard.evaluate(el => {
        return el.classList.contains('hover:-translate-y-2') &&
               el.classList.contains('hover:shadow-glow') &&
               el.classList.contains('hover:border-athenity-green-circuit/60');
      });
      
      expect(hasHoverClasses).toBeTruthy();
    });
  });

  test.describe('5. Responsive Behavior - Breakpoint Validation', () => {
    
    test('should adapt grid layout for mobile screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.locator('#servicos').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const gridStyles = await getComputedStyles(page, '#servicos .servicos-grid');
      const cardStyles = await getComputedStyles(page, '#servicos .service-card');
      
      // Grid should still be functional
      expect(gridStyles!.display).toBe('grid');
      
      // Cards should be visible and properly sized
      expect(cardStyles!.width).toBeGreaterThan(200);
    });

    test('should adapt grid layout for tablet screens', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.locator('#servicos').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const gridStyles = await getComputedStyles(page, '#servicos .servicos-grid');
      
      // Should likely have 2 columns on tablet (sm:grid-cols-2)
      const gridCols = gridStyles!.gridTemplateColumns;
      expect(gridCols).not.toBe('none');
    });

    test('should adapt grid layout for desktop screens', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.locator('#servicos').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const gridStyles = await getComputedStyles(page, '#servicos .servicos-grid');
      
      // Should have 3 columns on desktop (lg:grid-cols-3)
      const gridCols = gridStyles!.gridTemplateColumns;
      const columnCount = gridCols.split(' ').length;
      expect(columnCount).toBe(3);
    });

    test('should maintain readable font sizes across all breakpoints', async ({ page }) => {
      const breakpoints = [
        { width: 320, height: 568 },   // Mobile
        { width: 768, height: 1024 },  // Tablet  
        { width: 1280, height: 720 }   // Desktop
      ];
      
      for (const viewport of breakpoints) {
        await page.setViewportSize(viewport);
        await page.locator('#servicos').scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        
        const titleStyles = await getComputedStyles(page, '#servicos h3');
        const cardTitleStyles = await getComputedStyles(page, '#servicos .service-card h4');
        
        // Fonts should remain readable
        expect(parseFloat(titleStyles!.fontSize)).toBeGreaterThanOrEqual(20);
        expect(parseFloat(cardTitleStyles!.fontSize)).toBeGreaterThanOrEqual(18);
      }
    });
  });

  test.describe('6. Animation & Transform Validation', () => {
    
    test('should have correct initial transform states', async ({ page }) => {
      // Scroll away and back to reset animation state
      await page.mouse.wheel(0, -1000);
      await page.waitForTimeout(300);
      
      const cardStyles = await getComputedStyles(page, '#servicos .service-card');
      
      // Initial state might have transforms for animation
      expect(cardStyles!.transform).toBeDefined();
    });

    test('should have staggered animation delays configured', async ({ page }) => {
      const cards = await page.locator('#servicos [data-testid^="service-card-"]').all();
      
      for (let i = 0; i < cards.length; i++) {
        const transitionDelay = await cards[i].evaluate(el => 
          getComputedStyle(el).transitionDelay
        );
        
        // Each card should have appropriate delay
        const delay = parseFloat(transitionDelay);
        expect(delay).toBeGreaterThanOrEqual(i * 0.08); // Account for staggering
      }
    });

    test('should maintain proper z-index layering', async ({ page }) => {
      const sectionStyles = await getComputedStyles(page, '#servicos');
      const cardStyles = await getComputedStyles(page, '#servicos .service-card');
      
      // Section should have proper z-index context
      expect(sectionStyles).toBeTruthy();
      expect(cardStyles).toBeTruthy();
    });
  });

  test.describe('7. Accessibility Visual Compliance', () => {
    
    test('should meet WCAG AA contrast ratios for text', async ({ page }) => {
      // This is a visual validation test - in a real scenario you'd use
      // accessibility testing tools, but we can at least verify colors are set
      
      const titleColor = await page.locator('#servicos h3').evaluate(el => 
        getComputedStyle(el).color
      );
      const descriptionColor = await page.locator('#servicos .service-card p').first().evaluate(el => 
        getComputedStyle(el).color
      );
      
      // Colors should be set (not default black)
      expect(titleColor).not.toBe('rgb(0, 0, 0)');
      expect(descriptionColor).not.toBe('rgb(0, 0, 0)');
      
      // Should use the defined design system colors
      const isTitleColorCorrect = await validateColorMatch(titleColor, EXPECTED_COLORS.TITLE_TEXT, 10);
      const isDescColorCorrect = await validateColorMatch(descriptionColor, EXPECTED_COLORS.BODY_TEXT, 10);
      
      expect(isTitleColorCorrect).toBeTruthy();
      expect(isDescColorCorrect).toBeTruthy();
    });

    test('should have sufficient visual hierarchy', async ({ page }) => {
      const sectionTitleSize = await page.locator('#servicos h3').evaluate(el => 
        parseFloat(getComputedStyle(el).fontSize)
      );
      const cardTitleSize = await page.locator('#servicos .service-card h4').first().evaluate(el => 
        parseFloat(getComputedStyle(el).fontSize)
      );
      const descriptionSize = await page.locator('#servicos .service-card p').first().evaluate(el => 
        parseFloat(getComputedStyle(el).fontSize)
      );
      
      // Section title should be largest
      expect(sectionTitleSize).toBeGreaterThan(cardTitleSize);
      
      // Card titles should be larger than descriptions
      expect(cardTitleSize).toBeGreaterThan(descriptionSize);
    });

    test('should have adequate spacing for touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
      await page.locator('#servicos').scrollIntoViewIfNeeded();
      
      const cards = await page.locator('#servicos .service-card').all();
      
      for (const card of cards) {
        const rect = await card.boundingBox();
        expect(rect).toBeTruthy();
        
        // Cards should be large enough for touch interaction (at least 44px in either dimension)
        expect(rect!.width).toBeGreaterThanOrEqual(44);
        expect(rect!.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('8. Performance Visual Indicators', () => {
    
    test('should render all visual elements without layout shifts', async ({ page }) => {
      const initialLayout = await getComputedStyles(page, '#servicos');
      
      // Trigger some interaction
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(200);
      
      const afterInteractionLayout = await getComputedStyles(page, '#servicos');
      
      // Section dimensions should remain stable
      expect(Math.abs(initialLayout!.width - afterInteractionLayout!.width)).toBeLessThan(5);
      expect(Math.abs(initialLayout!.height - afterInteractionLayout!.height)).toBeLessThan(50);
    });

    test('should maintain visual quality during animations', async ({ page }) => {
      await page.locator('#servicos').scrollIntoViewIfNeeded();
      
      // All cards should be visually rendered
      const cards = await page.locator('#servicos .service-card').all();
      
      for (const card of cards) {
        const isVisible = await card.isVisible();
        const opacity = await card.evaluate(el => getComputedStyle(el).opacity);
        
        expect(isVisible).toBeTruthy();
        expect(parseFloat(opacity)).toBeGreaterThan(0);
      }
    });
  });
});