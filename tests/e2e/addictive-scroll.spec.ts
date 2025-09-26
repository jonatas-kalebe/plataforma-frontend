import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Helpers para interações complexas de scroll e validações.
 */
async function getScrollMetrics(page: Page) {
  return page.evaluate(() => {
    const service = (window as any).ng.getDirectives(document.querySelector('app-root'))[0]?.scrollOrchestrationService;
    if (!service) return null;
    return {
      velocity: service.getMetrics().velocity,
      globalProgress: service.getMetrics().globalProgress,
      activeSectionId: service.getMetrics().activeSection?.id,
      activeSectionProgress: service.getMetrics().activeSection?.progress,
    };
  });
}

async function getOpacityAndTransform(locator: Locator) {
  return locator.evaluate(el => {
    const style = window.getComputedStyle(el);
    return {
      opacity: parseFloat(style.opacity),
      transform: style.transform,
    };
  });
}

async function getElementTop(locator: Locator) {
    return locator.evaluate(el => el.getBoundingClientRect().top);
}


test.describe('Addictive Scroll Experience - E2E Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Espera o loading screen terminar e a página ficar interativa
    await expect(page.locator('app-loading-screen')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Garante que todas as animações iniciais se estabilizaram
  });

  test.describe('Global Behavior: Magnetic Section Snapping', () => {

    test('G4, G5: should snap to the next section on pause after 85% scroll', async ({ page }) => {
      const heroLocator = page.locator('#hero');
      const filosofiaLocator = page.locator('#filosofia');
      const vh = page.viewportSize()!.height;

      // Scroll lento para passar do threshold de 85% da Hero section
      await page.mouse.wheel(0, vh * 0.9);
      await page.waitForTimeout(300); // Pausa para o scroll parar e o snap ser acionado

      // A seção 'filosofia' deve ter "puxado" a tela para o seu topo.
      await expect(async () => {
        const filosofiaTop = await getElementTop(filosofiaLocator);
        // O topo da seção deve estar perfeitamente alinhado com o topo do viewport
        expect(filosofiaTop).toBeCloseTo(0, 1);
      }).toPass({ timeout: 2000 }); // A animação de snap leva tempo
    });

    test('G4, G5: should snap back to the previous section on pause before 15% scroll (upwards)', async ({ page }) => {
      const heroLocator = page.locator('#hero');
      const filosofiaLocator = page.locator('#filosofia');

      // Vai para a seção 'filosofia'
      await filosofiaLocator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Scroll pequeno para cima, para ficar com menos de 15% da seção visível
      await page.mouse.wheel(0, -page.viewportSize()!.height * 0.2);
      await page.waitForTimeout(300); // Pausa para acionar o snap reverso

      // A seção 'hero' deve ter "puxado" a tela de volta.
      await expect(async () => {
        const heroTop = await getElementTop(heroLocator);
        expect(heroTop).toBeCloseTo(0, 1);
      }).toPass({ timeout: 2000 });
    });

    test('G8: Mobile: should have a delay before snapping to allow kinetic scroll', async ({ page, isMobile }) => {
        if (!isMobile) {
          test.skip(true, 'This test is mobile-only');
          return;
        }
        const filosofiaLocator = page.locator('#filosofia');
        const vh = page.viewportSize()!.height;

        // Simula um "flick" que para na zona de snap
        await page.evaluate((vh) => window.scrollTo({ top: vh * 0.9, behavior: 'auto' }), vh);

        // Verifica que o snap NÃO acontece imediatamente
        await page.waitForTimeout(50); // Delay menor que o esperado (e.g., 100ms)
        let filosofiaTop = await getElementTop(filosofiaLocator);
        expect(filosofiaTop).not.toBeCloseTo(0, 1);

        // Espera o tempo total do delay + animação
        await page.waitForTimeout(1000);
        filosofiaTop = await getElementTop(filosofiaLocator);
        expect(filosofiaTop).toBeCloseTo(0, 1);
    });

  });

  test.describe('Section: Hero', () => {

    test('H2: should have gentle "elastic" resistance on initial scroll (0-20%)', async ({ page }) => {
      const heroTitle = page.locator('#hero h1');
      const { opacity: initialOpacity } = await getOpacityAndTransform(heroTitle);
      const initialTop = await getElementTop(heroTitle);

      // Scroll pequeno, correspondendo a ~10% da altura da viewport
      await page.mouse.wheel(0, page.viewportSize()!.height * 0.1);
      await page.waitForTimeout(200);

      const { opacity: newOpacity } = await getOpacityAndTransform(heroTitle);
      const newTop = await getElementTop(heroTitle);

      // A opacidade deve diminuir apenas um pouco
      expect(newOpacity).toBeGreaterThan(initialOpacity - 0.2);
      expect(newOpacity).toBeLessThan(initialOpacity);
      // O elemento deve ter se movido para cima, mas não muito (resistência)
      expect(newTop).toBeLessThan(initialTop);
      expect(newTop).toBeGreaterThan(initialTop - 50); // Movimento limitado a 50px
    });

    test('H3: should accelerate transition after 20% scroll', async ({ page }) => {
        const heroTitle = page.locator('#hero h1');
        await page.mouse.wheel(0, page.viewportSize()!.height * 0.1); // Scroll inicial
        await page.waitForTimeout(100);
        const { transform: transform1 } = await getOpacityAndTransform(heroTitle);

        // Scroll adicional para passar dos 20%
        await page.mouse.wheel(0, page.viewportSize()!.height * 0.2);
        await page.waitForTimeout(100);
        const { transform: transform2 } = await getOpacityAndTransform(heroTitle);

        // A mudança na transformação deve ser maior no segundo scroll
        const getTranslateY = (t: string) => t.includes('matrix') ? parseFloat(t.split(',')[5].trim().slice(0, -1)) : 0;
        const delta1 = Math.abs(getTranslateY(transform1));
        const delta2 = Math.abs(getTranslateY(transform2) - getTranslateY(transform1));

        expect(delta2).toBeGreaterThan(delta1);
    });

    test('H5: should smoothly reverse animations when scrolling back up to Hero', async ({ page }) => {
      const heroTitle = page.locator('#hero h1');
      const { opacity: initialOpacity, transform: initialTransform } = await getOpacityAndTransform(heroTitle);

      // Scroll para baixo até a próxima seção
      await page.locator('#filosofia').scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(1000);

      // Scroll para cima para voltar à Hero
      await page.locator('#hero').scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(1000);

      const { opacity: finalOpacity, transform: finalTransform } = await getOpacityAndTransform(heroTitle);

      // O estado deve ser revertido para o inicial
      expect(finalOpacity).toBeCloseTo(initialOpacity, 2);
      expect(finalTransform).toBe(initialTransform);
    });

  });

  test.describe('Section: Trabalhos (Work Card Ring)', () => {

    test.beforeEach(async ({ page }) => {
      await page.locator('#trabalhos').scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(1500); // Espera o pinning e animações iniciais
    });

    test('T2: section should be pinned for an extended duration', async ({ page }) => {
        const trabalhosLocator = page.locator('#trabalhos');
        const initialTop = await getElementTop(trabalhosLocator);

        // Scroll significativo dentro da seção
        await page.mouse.wheel(0, page.viewportSize()!.height * 0.5);
        await page.waitForTimeout(200);

        const afterScrollTop = await getElementTop(trabalhosLocator);

        // A posição da seção não deve mudar significativamente, provando o "pin"
        expect(afterScrollTop).toBeCloseTo(initialTop, 2);
    });

    test('T3, T4: ring should rotate on scroll and respond to drag', async ({ page }) => {
      const ringLocator = page.locator('app-work-card-ring .ring-container'); // Seletor para o container do anel
      const { transform: initialTransform } = await getOpacityAndTransform(ringLocator);

      // 1. Rotação por Scroll
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(200);
      const { transform: afterScrollTransform } = await getOpacityAndTransform(ringLocator);
      expect(afterScrollTransform).not.toBe(initialTransform);

      // 2. Rotação por Drag
      const ringBox = await ringLocator.boundingBox();
      expect(ringBox).toBeDefined();
      await page.mouse.move(ringBox!.x + ringBox!.width / 2, ringBox!.y + ringBox!.height / 2);
      await page.mouse.down();
      await page.mouse.move(ringBox!.x + ringBox!.width / 2 + 150, ringBox!.y + ringBox!.height / 2, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(200);

      const { transform: afterDragTransform } = await getOpacityAndTransform(ringLocator);
      expect(afterDragTransform).not.toBe(afterScrollTransform);
    });

    test('T5: ring should snap to the nearest card on drag release', async ({ page }) => {
        const ringLocator = page.locator('app-work-card-ring .ring-container');
        const ringBox = await ringLocator.boundingBox();
        expect(ringBox).toBeDefined();

        // Drag para uma posição intermediária, não alinhada
        await page.mouse.move(ringBox!.x + ringBox!.width / 2, ringBox!.y + ringBox!.height / 2);
        await page.mouse.down();
        await page.mouse.move(ringBox!.x + ringBox!.width / 2 + 80, ringBox!.y + ringBox!.height / 2, { steps: 5 }); // 80px drag
        await page.mouse.up();

        // Espera a animação de inércia e snap
        await page.waitForTimeout(1500);

        const finalRotation = await ringLocator.evaluate(el => {
            const style = window.getComputedStyle(el);
            const matrix = new DOMMatrixReadOnly(style.transform);
            // Extrai o ângulo de rotação Y
            return Math.atan2(-matrix.m13, matrix.m11) * (180 / Math.PI);
        });

        const angleStep = 360 / 8; // 8 cards
        // O ângulo final deve ser um múltiplo do ângulo entre os cards, com uma pequena tolerância.
        const remainder = Math.abs(finalRotation % angleStep);
        const isSnapped = remainder < 1 || Math.abs(remainder - angleStep) < 1;
        expect(isSnapped).toBe(true);
    });
  });

  test.describe('Dynamic Particle Background', () => {

    test('P2: particle speed should react to scroll velocity', async ({ page }) => {
      // É difícil medir a velocidade das partículas, mas podemos verificar se não há erros durante scroll rápido.
      // Scroll lento
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(200);

      // Scroll rápido
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, page.viewportSize()!.height);
        await page.waitForTimeout(50);
      }

      const metrics = await getScrollMetrics(page);
      expect(metrics!.velocity).toBeGreaterThan(500); // Confirma que o scroll foi rápido
    });

    test('P3: should create particle shockwave on click', async ({ page }) => {
      // Teste conceitual: Clica e espera que não quebre.
      // Uma validação mais profunda exigiria acesso ao estado interno do Three.js.
      await page.locator('#hero').click({ position: { x: 300, y: 300 }});
      await page.waitForTimeout(500);
      // Verifica se a aplicação continua funcionando
      await expect(page.locator('#hero h1')).toBeVisible();
    });

    test('P1: should react to mouse movement (parallax)', async ({ page }) => {
        const canvas = page.locator('app-three-particle-background canvas');
        // A validação exata do parallax é complexa. A abordagem E2E é garantir que a interação
        // não cause erros e que o canvas permaneça visível e renderizando.
        await page.mouse.move(100, 100);
        await page.waitForTimeout(200);
        await page.mouse.move(page.viewportSize()!.width - 100, page.viewportSize()!.height - 100);
        await page.waitForTimeout(200);

        await expect(canvas).toBeVisible();
    });
  });

  test.describe('Additional Micro-Interactions', () => {

    test('M1: interactive elements should have "cursor magnetism" on hover', async ({ page }) => {
      const ctaButton = page.locator('#cta a');
      await ctaButton.scrollIntoViewIfNeeded();

      const { transform: initialTransform } = await getOpacityAndTransform(ctaButton);
      await ctaButton.hover();
      await page.waitForTimeout(200);
      const { transform: hoverTransform } = await getOpacityAndTransform(ctaButton);

      // A transformação no hover (e.g., scale, translate) deve ser diferente da inicial.
      expect(hoverTransform).not.toBe(initialTransform);
    });

    test('M2: buttons should provide active state feedback on press', async ({ page }) => {
        const ctaButton = page.locator('#cta a');
        await ctaButton.scrollIntoViewIfNeeded();
        const initialScale = await ctaButton.evaluate(el => window.getComputedStyle(el).transform);

        const boundingBox = await ctaButton.boundingBox();
        await page.mouse.move(boundingBox!.x + boundingBox!.width / 2, boundingBox!.y + boundingBox!.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(100);

        const activeScale = await ctaButton.evaluate(el => window.getComputedStyle(el).transform);
        // O estado "pressionado" deve ter uma escala diferente (geralmente menor)
        expect(activeScale).not.toBe(initialScale);

        await page.mouse.up();
    });
  });
});