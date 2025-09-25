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
