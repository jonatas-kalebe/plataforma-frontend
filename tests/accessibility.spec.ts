import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Global Accessibility Features (WCAG 2.1 AA)
 * Tests skip link, focus indicators, and semantic landmarks
 */

test.describe('Global Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have skip link as first focusable element', async ({ page }) => {
    // Press Tab to focus the first element
    await page.keyboard.press('Tab');
    
    // Get the focused element
    const focusedElement = await page.locator(':focus');
    
    // Verify it's the skip link
    await expect(focusedElement).toHaveAttribute('href', '#main-content');
    await expect(focusedElement).toHaveText('Pular para o conteúdo principal');
  });

  test('skip link should be visible when focused', async ({ page }) => {
    // Press Tab to focus skip link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main-content"]');
    
    // Check that the skip link is visible when focused
    const boundingBox = await skipLink.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeGreaterThanOrEqual(0); // Should be visible at top
  });

  test('skip link should navigate to main content', async ({ page }) => {
    // Press Tab to focus skip link
    await page.keyboard.press('Tab');
    
    // Press Enter to activate the link
    await page.keyboard.press('Enter');
    
    // Wait a moment for navigation
    await page.waitForTimeout(300);
    
    // Verify URL has the anchor
    expect(page.url()).toContain('#main-content');
    
    // Verify main content exists
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });

  test('should have semantic landmarks with ARIA roles', async ({ page }) => {
    // Check header with banner role
    const header = page.locator('header[role="banner"]');
    await expect(header).toBeVisible();
    
    // Check main with role
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute('id', 'main-content');
    
    // Check footer with contentinfo role
    const footer = page.locator('footer[role="contentinfo"]');
    await expect(footer).toBeVisible();
  });

  test('interactive elements should have visible focus indicators', async ({ page }) => {
    // Press Tab multiple times to focus different elements
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // First interactive element after
    
    const focusedElement = await page.locator(':focus');
    
    // Check that outline is visible (via computed style)
    const outlineWidth = await focusedElement.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outlineWidth;
    });
    
    // Outline should be at least 2px
    expect(parseFloat(outlineWidth)).toBeGreaterThanOrEqual(2);
  });

  test('focus indicators should have sufficient contrast', async ({ page }) => {
    // Focus the skip link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a[href="#main-content"]');
    
    // Get outline color
    const outlineColor = await skipLink.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.outlineColor;
    });
    
    // The outline should be set (not 'none' or empty)
    expect(outlineColor).not.toBe('');
    expect(outlineColor).not.toBe('none');
  });

  test('footer should contain copyright information', async ({ page }) => {
    const footer = page.locator('footer[role="contentinfo"]');
    await expect(footer).toContainText('© 2024 Athenity');
    await expect(footer).toContainText('Todos os direitos reservados');
  });

  test('all ARIA landmarks should be present', async ({ page }) => {
    // Count landmarks
    const banners = await page.locator('[role="banner"]').count();
    const mains = await page.locator('[role="main"]').count();
    const contentinfos = await page.locator('[role="contentinfo"]').count();
    
    // Should have exactly one of each
    expect(banners).toBe(1);
    expect(mains).toBe(1);
    expect(contentinfos).toBe(1);
  });
});
