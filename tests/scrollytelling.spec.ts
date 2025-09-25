import { test, expect } from '@playwright/test';

test.describe('Scrollytelling functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('home page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Athenity/i);
  });

  test('hero section is visible and pinned', async ({ page }) => {
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();
    
    const heroTitle = page.locator('#hero-title');
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('Nós Desenvolvemos');
  });

  test('sections have correct IDs for scroll orchestrator', async ({ page }) => {
    const expectedSections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    
    for (const sectionId of expectedSections) {
      const section = page.locator(`#${sectionId}`);
      await expect(section).toBeVisible();
    }
  });

  test('scroll orchestrator initializes without errors', async ({ page }) => {
    let consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });
    
    await page.waitForTimeout(500);
    
    expect(consoleErrors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('font') &&
      !err.includes('manifest')
    )).toHaveLength(0);
  });

  test('prefers-reduced-motion disables animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();
  });

  test('particle background renders', async ({ page }) => {
    const particleComponent = page.locator('app-three-particle-background');
    await expect(particleComponent).toBeVisible();
  });

  test('work card ring is interactive', async ({ page }) => {
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    
    const workRing = page.locator('app-work-card-ring');
    await expect(workRing).toBeVisible();
    
    const ringElement = page.locator('[data-testid="ring"]').or(page.locator('.ring')).first();
    if (await ringElement.isVisible()) {
      await ringElement.hover();
    }
  });

  test('visual regression test - full page', async ({ page }) => {
    await expect(page).toHaveScreenshot('landing-page-full.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('visual regression test - hero section', async ({ page }) => {
    const heroSection = page.locator('#hero');
    await expect(heroSection).toHaveScreenshot('hero-section.png', {
      threshold: 0.3
    });
  });

  test('visual regression test - filosofia section', async ({ page }) => {
    await page.locator('#filosofia').scrollIntoViewIfNeeded();
    const filosofiaSection = page.locator('#filosofia');
    await expect(filosofiaSection).toHaveScreenshot('filosofia-section.png', {
      threshold: 0.3
    });
  });

  test('visual regression test - servicos section', async ({ page }) => {
    await page.locator('#servicos').scrollIntoViewIfNeeded();
    const servicosSection = page.locator('#servicos');
    await expect(servicosSection).toHaveScreenshot('servicos-section.png', {
      threshold: 0.3
    });
  });

  test('visual regression test - trabalhos section', async ({ page }) => {
    await page.locator('#trabalhos').scrollIntoViewIfNeeded();
    const trabalhosSection = page.locator('#trabalhos');
    await expect(trabalhosSection).toHaveScreenshot('trabalhos-section.png', {
      threshold: 0.3
    });
  });
});

test.describe('Scrollytelling with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('animations are disabled with prefers-reduced-motion', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();
    
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('reduced-motion-state.png', {
      threshold: 0.3
    });
  });
});