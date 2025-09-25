import { test, expect } from '@playwright/test';

test('home visual', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Athenity/i);
  await expect(page).toHaveScreenshot();
});

test('landing page sections exist', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Check that all required sections exist for scroll orchestration
  await expect(page.locator('#hero')).toBeVisible();
  await expect(page.locator('#filosofia')).toBeVisible();
  await expect(page.locator('#servicos')).toBeVisible();
  await expect(page.locator('#trabalhos')).toBeVisible();
  await expect(page.locator('#cta')).toBeVisible();
  
  // Check that main text content is present
  await expect(page.locator('h1')).toContainText('Nós Desenvolvemos');
  await expect(page.locator('h2')).toContainText('Da Complexidade à Clareza');
});

test('scroll orchestration infrastructure check', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Check that the scroll service sections are accessible and functional
  const sectionsExist = await page.evaluate(() => {
    // Check if main sections exist
    const hero = document.querySelector('#hero');
    const filosofia = document.querySelector('#filosofia');
    const servicos = document.querySelector('#servicos');
    const trabalhos = document.querySelector('#trabalhos');
    const cta = document.querySelector('#cta');
    
    return !!(hero && filosofia && servicos && trabalhos && cta);
  });
  
  expect(sectionsExist).toBeTruthy();
  
  // Check basic page functionality (scroll service will be activated when needed)
  const pageTitle = await page.title();
  expect(pageTitle).toContain('Athenity');
});

// Scrollytelling snapshot tests for the 5 acts
test('scrollytelling act 1 - hero section snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Scroll to hero section (top of page)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000); // Allow animations to complete
  
  // Take snapshot of hero section
  await expect(page.locator('#hero')).toHaveScreenshot('act1-hero.png', { threshold: 0.3 });
});

test('scrollytelling act 2 - filosofia section snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Scroll to filosofia section
  await page.evaluate(() => {
    const element = document.querySelector('#filosofia');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(1000);
  
  // Take snapshot of filosofia section
  await expect(page.locator('#filosofia')).toHaveScreenshot('act2-filosofia.png', { threshold: 0.3 });
});

test('scrollytelling act 3 - servicos section snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Scroll to servicos section
  await page.evaluate(() => {
    const element = document.querySelector('#servicos');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(1000);
  
  // Take snapshot of servicos section
  await expect(page.locator('#servicos')).toHaveScreenshot('act3-servicos.png', { threshold: 0.3 });
});

test('scrollytelling act 4 - trabalhos section snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Scroll to trabalhos section
  await page.evaluate(() => {
    const element = document.querySelector('#trabalhos');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(1000);
  
  // Take snapshot of trabalhos section
  await expect(page.locator('#trabalhos')).toHaveScreenshot('act4-trabalhos.png', { threshold: 0.3 });
});

test('scrollytelling act 5 - cta section snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Scroll to cta section
  await page.evaluate(() => {
    const element = document.querySelector('#cta');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await page.waitForTimeout(1000);
  
  // Take snapshot of cta section
  await expect(page.locator('#cta')).toHaveScreenshot('act5-cta.png', { threshold: 0.3 });
});
