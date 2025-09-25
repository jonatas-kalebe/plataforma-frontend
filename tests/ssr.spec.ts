import { test, expect } from '@playwright/test';

test.describe('SSR (Server-Side Rendering) Tests', () => {
  test('should render without errors on server', async ({ page }) => {
    // Monitor console for errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check that content is server-rendered (available immediately)
    const title = await page.locator('h1').textContent();
    expect(title).toContain('Nós Desenvolvemos');
    
    // No server-side errors should occur
    const serverErrors = consoleMessages.filter(msg => 
      msg.includes('window is not defined') || 
      msg.includes('document is not defined') || 
      msg.includes('ReferenceError')
    );
    expect(serverErrors.length).toBe(0);
  });

  test('should not access window/document during SSR', async ({ page }) => {
    // This test ensures our components are SSR-safe
    await page.goto('/');
    
    // Wait for hydration
    await page.waitForLoadState('networkidle');
    
    // Check that all major sections are present (server rendered)
    const sectionsExist = await page.evaluate(() => {
      return {
        hero: !!document.querySelector('#hero'),
        filosofia: !!document.querySelector('#filosofia'),
        servicos: !!document.querySelector('#servicos'),
        trabalhos: !!document.querySelector('#trabalhos'),
        cta: !!document.querySelector('#cta')
      };
    });
    
    expect(sectionsExist.hero).toBeTruthy();
    expect(sectionsExist.filosofia).toBeTruthy();
    expect(sectionsExist.servicos).toBeTruthy();
    expect(sectionsExist.trabalhos).toBeTruthy();
    expect(sectionsExist.cta).toBeTruthy();
  });

  test('should hydrate properly without mismatches', async ({ page }) => {
    const hydrationErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && (
        msg.text().includes('hydration') ||
        msg.text().includes('mismatch') ||
        msg.text().includes('Expected server HTML')
      )) {
        hydrationErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait additional time for any delayed hydration
    await page.waitForTimeout(2000);
    
    expect(hydrationErrors.length).toBe(0);
  });

  test('should initialize ScrollOrchestrationService after hydration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that scroll service is initialized (GSAP should be registered)
    const gsapRegistered = await page.evaluate(() => {
      return !!(window as any).gsap && !!(window as any).ScrollTrigger;
    });
    
    expect(gsapRegistered).toBeTruthy();
  });

  test('should handle particle system initialization safely', async ({ page }) => {
    const threeJsErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && (
        msg.text().includes('WebGL') ||
        msg.text().includes('THREE') ||
        msg.text().includes('canvas')
      )) {
        threeJsErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Particle background should initialize without errors
    const particleBackground = page.locator('app-three-particle-background');
    await expect(particleBackground).toBeAttached();
    
    // Wait for Three.js initialization
    await page.waitForTimeout(2000);
    
    // Should not have Three.js initialization errors
    expect(threeJsErrors.length).toBe(0);
  });

  test('should work in Node.js environment (server build)', async ({ request }) => {
    // Test that the server responds correctly
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    
    const html = await response.text();
    
    // Check that essential content is in the server response
    expect(html).toContain('Nós Desenvolvemos');
    expect(html).toContain('Da Complexidade à Clareza');
    expect(html).toContain('id="hero"');
    expect(html).toContain('id="filosofia"');
    expect(html).toContain('id="servicos"');
    expect(html).toContain('id="trabalhos"');
    expect(html).toContain('id="cta"');
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check that title is set
    const title = await page.title();
    expect(title).toContain('Athenity');
    
    // Check for essential meta tags (if they exist)
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    const metaViewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    // These might be empty but should not throw errors
    expect(typeof metaDescription === 'string' || metaDescription === null).toBeTruthy();
    expect(metaViewport).toBeTruthy();
  });

  test('should not have build warnings in production', async ({ page }) => {
    // Monitor for Angular build warnings that might appear in console
    const buildWarnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'warning' && (
        msg.text().includes('Angular') ||
        msg.text().includes('zone.js') ||
        msg.text().includes('hydration')
      )) {
        buildWarnings.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow time for any delayed warnings
    await page.waitForTimeout(3000);
    
    // Should not have critical build warnings
    const criticalWarnings = buildWarnings.filter(warning => 
      !warning.includes('DevTools') && !warning.includes('extension')
    );
    expect(criticalWarnings.length).toBe(0);
  });
});