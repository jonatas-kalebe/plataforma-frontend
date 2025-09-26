import { test, expect, devices } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Accessibility, Performance and SSR', () => {

  test.describe('Accessibility (A11Y)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('app-loading-screen')).not.toBeVisible({ timeout: 10000 });
    });

    test('A1: should have a logical heading hierarchy', async ({ page }) => {
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1); // Exatamente um H1 na página

      const headings = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => parseInt(h.tagName.substring(1)));
      });

      for (let i = 1; i < headings.length; i++) {
        const prevLevel = headings[i - 1];
        const currentLevel = headings[i];
        // Um nível de título não deve pular mais de um nível (ex: H2 para H4)
        expect(currentLevel).toBeLessThanOrEqual(prevLevel + 1);
      }
    });

    test('A2: should respect "prefers-reduced-motion"', async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('app-loading-screen')).not.toBeVisible({ timeout: 10000 });

      // Na seção 'Trabalhos', o 'pin' deve ser desativado
      const trabalhosLocator = page.locator('#trabalhos');
      await trabalhosLocator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const initialTop = await trabalhosLocator.evaluate(el => el.getBoundingClientRect().top);

      // Scroll que normalmente ficaria dentro da área "pinada"
      await page.mouse.wheel(0, page.viewportSize()!.height * 0.5);
      await page.waitForTimeout(500);

      const finalTop = await trabalhosLocator.evaluate(el => el.getBoundingClientRect().top);

      // Com movimento reduzido, a seção deve rolar normalmente
      expect(finalTop).toBeLessThan(initialTop);

      await context.close();
    });

    test('A3: should provide focus indicators for keyboard navigation', async ({ page }) => {
        const ctaButton = page.locator('#hero a'); // Um elemento focável
        await ctaButton.focus();

        // O elemento focado deve ter um outline ou box-shadow visível
        await expect(ctaButton).toHaveCSS('outline-style', (s) => s !== 'none');
    });
  });

  test.describe('Performance', () => {
    test('P1: should meet Lighthouse performance thresholds', async ({ browser }) => {
      // Este teste é mais pesado e pode precisar de configuração específica.
      test.skip(process.env.CI !== 'true', 'Lighthouse test is slow, run only in CI');

      const port = 9222;
      const endpoint = browser.wsEndpoint();
      const page = await browser.newPage();
      await page.goto('/');

      await playAudit({
        page: page,
        port: port,
        thresholds: {
            performance: 50,
            accessibility: 90,
            'best-practices': 90,
            seo: 90,
        },
        // O endpoint do browser é necessário para o Lighthouse se conectar
        opts: {
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          logLevel: 'info',
          chromeFlags: [`--remote-debugging-port=${port}`]
        }
      });
      await page.close();
    });

    test('P2: should maintain smooth frame rate during fast scrolling', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('app-loading-screen')).not.toBeVisible({ timeout: 10000 });

        const { droppedFrameCount } = await page.evaluate(async () => {
            let droppedFrameCount = 0;
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if ((entry as any).dropped) {
                        droppedFrameCount++;
                    }
                }
            });
            observer.observe({ type: 'frame', buffered: true });

            // Simula um scroll rápido e contínuo
            const scrollHeight = document.body.scrollHeight;
            window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
            await new Promise(resolve => setTimeout(resolve, 2000)); // Duração do scroll

            observer.disconnect();
            return { droppedFrameCount };
        });

        // O número de frames perdidos deve ser muito baixo para uma experiência fluida.
        expect(droppedFrameCount).toBeLessThan(10);
    });
  });

  test.describe('Server-Side Rendering (SSR) & Hydration', () => {
    test('S1: should render initial content on the server and hydrate without errors', async ({ page }) => {
      const hydrationErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().toLowerCase().includes('hydration')) {
          hydrationErrors.push(msg.text());
        }
      });

      // Carrega a página e verifica o conteúdo SSR antes do JS ser totalmente executado.
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toContainText('Nós Desenvolvemos Momentos.');

      // Espera a hidratação completar
      await page.waitForLoadState('networkidle');

      // Não deve haver erros de hidratação no console.
      expect(hydrationErrors).toHaveLength(0);
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ ...devices['iPhone 13'] });

    test('MB1: layout should adapt correctly to mobile viewport', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('app-loading-screen')).not.toBeVisible({ timeout: 10000 });

      // Na seção 'Filosofia', o layout deve ser empilhado (texto acima do canvas)
      const filosofiaText = page.locator('#filosofia .content');
      const filosofiaCanvas = page.locator('#filosofia .canvas-container');

      const textBounds = await filosofiaText.boundingBox();
      const canvasBounds = await filosofiaCanvas.boundingBox();

      expect(textBounds).toBeDefined();
      expect(canvasBounds).toBeDefined();

      // O final do texto (bottom) deve estar acima do início do canvas (top).
      expect(textBounds!.y + textBounds!.height).toBeLessThanOrEqual(canvasBounds!.y);
    });

    test('MB2: touch gestures on the ring carousel should work', async ({ page, isMobile }) => {
        if (!isMobile) {
          test.skip(true, 'This test is mobile-only');
          return;
        }
        await page.goto('/');
        await page.locator('#trabalhos').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);

        const ringLocator = page.locator('app-work-card-ring .ring-container');
        const { transform: initialTransform } = await getOpacityAndTransform(ringLocator);

        // Simula um gesto de swipe (arrastar)
        const box = await ringLocator.boundingBox();
        await page.touchscreen.swipe(box!.x + box!.width / 2, box!.y + box!.height / 2, box!.x + box!.width / 2 - 100, box!.y + box!.height / 2, { steps: 5 });
        await page.waitForTimeout(500);

        const { transform: finalTransform } = await getOpacityAndTransform(ringLocator);
        expect(finalTransform).not.toBe(initialTransform);
    });
  });
});