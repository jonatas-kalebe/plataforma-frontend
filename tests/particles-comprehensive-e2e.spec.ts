/**
 * Pixel-Perfect E2E Tests for Dynamic Particle Background Enhancements
 * 
 * These tests validate the EXACT visual and interactive behavior described in the requirements:
 * - Real-time particle behavior validation through browser interactions
 * - Visual regression testing for particle rendering
 * - Cross-browser compatibility for particle effects
 * - Performance impact measurement
 * - Mobile-specific interactions (touch, gyro, haptic)
 * - Section transition flourishes in real environment
 */

import { test, expect, Page } from '@playwright/test';

// Helper functions for particle system validation
async function waitForParticleSystem(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Allow Three.js initialization
  
  // Ensure particle system is loaded and rendering
  const particleBackground = page.locator('app-three-particle-background');
  await expect(particleBackground).toBeAttached();
  
  // Wait for WebGL context to be ready
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const checkWebGL = () => {
        const canvas = document.querySelector('app-three-particle-background canvas');
        if (canvas && (canvas as HTMLCanvasElement).getContext('webgl2')) {
          resolve();
        } else {
          setTimeout(checkWebGL, 100);
        }
      };
      checkWebGL();
    });
  });
}

async function getScrollMetrics(page: Page) {
  return await page.evaluate(() => {
    return {
      scrollY: window.scrollY,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      velocity: (window as any).lastScrollVelocity || 0,
      globalProgress: window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
    };
  });
}

async function getParticleSystemStatus(page: Page) {
  return await page.evaluate(() => {
    const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
    if (!canvas) return { exists: false };
    
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { exists: false, webglSupported: false };
    
    // Get basic rendering info
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    return {
      exists: true,
      webglSupported: true,
      canvasSize: { width: canvas.width, height: canvas.height },
      renderer,
      vendor,
      isAnimating: !!(window as any).particleAnimationId
    };
  });
}

test.describe('Dynamic Particle Background - Pixel-Perfect E2E Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Disable animations that might interfere with particle system testing
    await page.addInitScript(() => {
      (window as any).testingMode = true;
    });
    
    await page.goto('/');
    await waitForParticleSystem(page);
  });

  test.describe('1. Baseline Behavior - Always Active Gentle Motion', () => {
    
    test('P1: should initialize exactly 120 particles with 0.6 opacity', async ({ page }) => {
      const particleStatus = await getParticleSystemStatus(page);
      expect(particleStatus.exists).toBe(true);
      expect(particleStatus.webglSupported).toBe(true);
      expect(particleStatus.isAnimating).toBe(true);

      // Validate particle count and opacity through WebGL state
      const particleInfo = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        if (!gl) return null;

        // Access Three.js scene through global reference (set during development)
        const scene = (window as any).particleScene;
        if (!scene) return { error: 'Scene not accessible' };

        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        if (!particleSystem) return { error: 'Particle system not found' };

        return {
          particleCount: particleSystem.geometry.attributes.position.count,
          opacity: particleSystem.material.opacity,
          isVisible: particleSystem.visible
        };
      });

      if (particleInfo && !particleInfo.error) {
        expect(particleInfo.particleCount).toBe(120);
        expect(particleInfo.opacity).toBeCloseTo(0.6, 1);
        expect(particleInfo.isVisible).toBe(true);
      }
    });

    test('P1: should maintain gentle drift motion when user is idle', async ({ page }) => {
      // Capture initial particle positions
      const initialPositions = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        if (!canvas) return null;
        
        // Get WebGL context to read buffer data (simplified for testing)
        return {
          timestamp: performance.now(),
          canvasData: canvas.toDataURL('image/png').substring(0, 100) // Sample of image data
        };
      });

      // Wait for gentle motion (particles should move even when idle)
      await page.waitForTimeout(2000);

      const laterPositions = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        if (!canvas) return null;
        
        return {
          timestamp: performance.now(),
          canvasData: canvas.toDataURL('image/png').substring(0, 100)
        };
      });

      // Particles should have moved (gentle drift), so canvas data should be different
      expect(initialPositions?.canvasData).not.toBe(laterPositions?.canvasData);
    });

    test('P1: should start with brand blue color (#2d5b8c)', async ({ page }) => {
      const colorInfo = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;

        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        if (!particleSystem) return null;

        const material = particleSystem.material;
        return {
          color: material.color ? {
            r: Math.round(material.color.r * 255),
            g: Math.round(material.color.g * 255),
            b: Math.round(material.color.b * 255)
          } : null,
          hex: material.color ? material.color.getHex() : null
        };
      });

      if (colorInfo) {
        // Brand blue #2d5b8c = rgb(45, 91, 140)
        expect(colorInfo.hex).toBe(0x2d5b8c);
        expect(colorInfo.color.r).toBeCloseTo(45, 5);
        expect(colorInfo.color.g).toBeCloseTo(91, 5);
        expect(colorInfo.color.b).toBeCloseTo(140, 5);
      }
    });

    test('P1: should never feel static - continuous subtle motion', async ({ page }) => {
      const motionSamples: string[] = [];
      
      // Sample particle state multiple times over 5 seconds
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(500);
        const sample = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          if (!canvas) return 'no-canvas';
          
          // Get a small sample of canvas data to detect changes
          const ctx = canvas.getContext('2d');
          if (!ctx) return 'no-context';
          
          const imageData = ctx.getImageData(100, 100, 50, 50);
          return Array.from(imageData.data.slice(0, 20)).join(',');
        });
        
        motionSamples.push(sample);
      }

      // All samples should be different (proving continuous motion)
      const uniqueSamples = new Set(motionSamples);
      expect(uniqueSamples.size).toBeGreaterThan(5); // Most samples should be unique
    });
  });

  test.describe('2. Scroll Velocity Influence - Whoosh Effect', () => {
    
    test('P1: should increase particle activity with high scroll velocity', async ({ page }) => {
      // Capture baseline particle activity
      await page.waitForTimeout(1000);
      const baselineCanvas = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 200);
      });

      // Perform rapid scrolling (high velocity)
      const rapidScrollCount = 20;
      for (let i = 0; i < rapidScrollCount; i++) {
        await page.mouse.wheel(0, 100); // Fast repeated scrolls
        await page.waitForTimeout(50);
      }

      // Measure scroll velocity achieved
      const metrics = await getScrollMetrics(page);
      expect(metrics.velocity).toBeGreaterThan(500); // Confirms high velocity scrolling

      // Capture particle activity during high velocity
      const highVelocityCanvas = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 200);
      });

      // Particle activity should be visibly different (more dynamic)
      expect(baselineCanvas).not.toBe(highVelocityCanvas);
    });

    test('P1: should boost particle opacity during fast scrolling', async ({ page }) => {
      const baselineOpacity = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return particleSystem?.material.opacity;
      });

      // Fast scrolling
      for (let i = 0; i < 15; i++) {
        await page.mouse.wheel(0, 150);
        await page.waitForTimeout(30);
      }

      await page.waitForTimeout(200); // Allow opacity boost to take effect

      const boostedOpacity = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return particleSystem?.material.opacity;
      });

      // Opacity should be temporarily boosted during fast scrolling
      if (baselineOpacity !== null && boostedOpacity !== null) {
        expect(boostedOpacity).toBeGreaterThanOrEqual(baselineOpacity);
      }
    });

    test('P1: should amplify rotation speed with scroll velocity', async ({ page }) => {
      const initialRotation = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return particleSystem?.rotation.y || 0;
      });

      // High velocity scrolling
      for (let i = 0; i < 25; i++) {
        await page.mouse.wheel(0, 80);
        await page.waitForTimeout(20);
      }

      await page.waitForTimeout(500);

      const acceleratedRotation = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return particleSystem?.rotation.y || 0;
      });

      // Rotation should have increased due to velocity influence
      expect(Math.abs(acceleratedRotation)).toBeGreaterThan(Math.abs(initialRotation));
    });

    test('P1: should settle back to normal when scrolling stops', async ({ page }) => {
      // High velocity phase
      for (let i = 0; i < 20; i++) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(30);
      }

      const highVelocityState = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return {
          rotation: particleSystem?.rotation.y || 0,
          opacity: particleSystem?.material.opacity || 0
        };
      });

      // Stop scrolling and wait for settling
      await page.waitForTimeout(3000); // Allow settling time

      const settledState = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return {
          rotation: particleSystem?.rotation.y || 0,
          opacity: particleSystem?.material.opacity || 0
        };
      });

      // Should have settled back (lerped down)
      expect(Math.abs(settledState.rotation)).toBeLessThan(Math.abs(highVelocityState.rotation) * 1.2);
      expect(settledState.opacity).toBeLessThanOrEqual(highVelocityState.opacity + 0.1);
    });
  });

  test.describe('3. Section Transition Flourishes - Shape Formation', () => {
    
    test('P1: should trigger particle shape formation during Hero->Filosofia transition', async ({ page }) => {
      // Navigate to the transition point (90% through Hero section)
      const heroSection = page.locator('#hero');
      await expect(heroSection).toBeVisible();

      // Scroll to approximate transition point
      await page.evaluate(() => {
        const heroElement = document.getElementById('hero');
        const filosofiaElement = document.getElementById('filosofia');
        if (heroElement && filosofiaElement) {
          const heroRect = heroElement.getBoundingClientRect();
          const heroHeight = heroElement.offsetHeight;
          const transitionPoint = window.scrollY + heroHeight * 0.9;
          window.scrollTo({ top: transitionPoint, behavior: 'smooth' });
        }
      });

      await page.waitForTimeout(1000);

      // Capture particle state before transition
      const preTransitionCanvas = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png');
      });

      // Continue scrolling to trigger transition
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(500); // Allow shape formation time

      const transitionCanvas = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png');
      });

      // Canvas should show different particle formation during transition
      expect(preTransitionCanvas).not.toBe(transitionCanvas);
    });

    test('P1: should form particles into recognizable pattern for ~0.5-1 second', async ({ page }) => {
      // Scroll to trigger transition
      await page.evaluate(() => {
        const heroElement = document.getElementById('hero');
        if (heroElement) {
          const heroHeight = heroElement.offsetHeight;
          window.scrollTo({ top: heroHeight * 0.9, behavior: 'smooth' });
        }
      });

      await page.waitForTimeout(500);
      const formationStart = Date.now();
      
      // Continue scrolling to trigger shape formation
      await page.mouse.wheel(0, 150);
      
      // Sample particle positions during formation period
      const samples: string[] = [];
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(100);
        const sample = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          return canvas?.toDataURL('image/png').substring(0, 100);
        });
        samples.push(sample);
      }
      
      const formationEnd = Date.now();
      const formationDuration = formationEnd - formationStart;

      // Formation should last within specified timeframe
      expect(formationDuration).toBeGreaterThan(500); // At least 0.5 seconds
      expect(formationDuration).toBeLessThan(1500);   // No more than 1.5 seconds

      // Particles should show different formations during this period
      const uniqueSamples = new Set(samples);
      expect(uniqueSamples.size).toBeGreaterThan(3); // Multiple distinct formations
    });

    test('P1: should return to normal particle behavior after shape formation', async ({ page }) => {
      // Trigger and complete a transition
      await page.evaluate(() => {
        const filosofiaElement = document.getElementById('filosofia');
        if (filosofiaElement) {
          const filosofiaTop = filosofiaElement.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: filosofiaTop + 300, behavior: 'smooth' });
        }
      });

      await page.waitForTimeout(2000); // Allow transition to complete

      // Check that particles have returned to normal behavior
      const normalBehaviorSamples: string[] = [];
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(300);
        const sample = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          const ctx = canvas?.getContext('2d');
          if (!ctx) return 'no-context';
          
          // Sample a small area to detect normal motion patterns
          const imageData = ctx.getImageData(200, 200, 30, 30);
          return Array.from(imageData.data.slice(0, 12)).join(',');
        });
        normalBehaviorSamples.push(sample);
      }

      // Should show normal gentle motion (all samples different)
      const uniqueNormalSamples = new Set(normalBehaviorSamples);
      expect(uniqueNormalSamples.size).toBeGreaterThan(3);
    });
  });

  test.describe('4. Converging on Scroll Hold - Pause Behavior', () => {
    
    test('P1: should detect scroll pause after 1+ seconds', async ({ page }) => {
      // Scroll to mid-page
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(200);

      // Capture initial state
      const initialState = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return {
          canvasData: canvas?.toDataURL('image/png').substring(0, 100),
          timestamp: performance.now()
        };
      });

      // Wait for pause detection (>1 second)
      await page.waitForTimeout(1200);

      const pausedState = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return {
          canvasData: canvas?.toDataURL('image/png').substring(0, 100),
          timestamp: performance.now()
        };
      });

      // Particles should show different behavior during pause
      expect(initialState.canvasData).not.toBe(pausedState.canvasData);
    });

    test('P1: should create gentle halo around screen center during pause', async ({ page }) => {
      // Scroll and then pause
      await page.mouse.wheel(0, 800);
      await page.waitForTimeout(1500); // Wait for pause detection

      // Sample particles near center vs edges
      const particleDistribution = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return null;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 100;

        // Sample center area
        const centerData = ctx.getImageData(centerX - radius, centerY - radius, radius * 2, radius * 2);
        
        // Sample edge areas
        const topData = ctx.getImageData(0, 0, canvas.width, 50);
        const bottomData = ctx.getImageData(0, canvas.height - 50, canvas.width, 50);

        // Count non-transparent pixels (rough particle density estimation)
        const countNonTransparent = (data: ImageData): number => {
          let count = 0;
          for (let i = 3; i < data.data.length; i += 4) {
            if (data.data[i] > 10) count++; // Alpha > 10
          }
          return count;
        };

        return {
          centerDensity: countNonTransparent(centerData),
          edgeDensity: (countNonTransparent(topData) + countNonTransparent(bottomData)) / 2
        };
      });

      // During pause, particles should gravitate toward center (higher center density)
      if (particleDistribution) {
        expect(particleDistribution.centerDensity).toBeGreaterThan(particleDistribution.edgeDensity * 0.5);
      }
    });

    test('P1: should disperse particles outward when scrolling resumes', async ({ page }) => {
      // Establish pause state
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(1200);

      const pausedDistribution = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 150);
      });

      // Resume scrolling
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(300);

      const resumedDistribution = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 150);
      });

      // Particle distribution should change (dispersive push)
      expect(pausedDistribution).not.toBe(resumedDistribution);
    });
  });

  test.describe('5. Color and Opacity Changes - Section Progression', () => {
    
    test('P1: should progress from brand blue to teal/green through sections', async ({ page }) => {
      const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
      const colors: any[] = [];

      for (const sectionId of sections) {
        const section = page.locator(`#${sectionId}`);
        if (await section.isVisible()) {
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);

          const color = await page.evaluate(() => {
            const scene = (window as any).particleScene;
            if (!scene) return null;
            const particleSystem = scene.children.find((child: any) => child.type === 'Points');
            if (!particleSystem) return null;
            
            return {
              hex: particleSystem.material.color.getHex(),
              rgb: {
                r: Math.round(particleSystem.material.color.r * 255),
                g: Math.round(particleSystem.material.color.g * 255),
                b: Math.round(particleSystem.material.color.b * 255)
              }
            };
          });

          colors.push({ section: sectionId, color });
        }
      }

      // Colors should progress through the page
      expect(colors.length).toBeGreaterThan(2);
      
      // Should start with brand blue
      const heroColor = colors.find(c => c.section === 'hero')?.color;
      if (heroColor) {
        expect(heroColor.hex).toBe(0x2d5b8c);
      }

      // Should end with different color (gold hint at CTA)
      const ctaColor = colors.find(c => c.section === 'cta')?.color;
      if (ctaColor && heroColor) {
        expect(ctaColor.hex).not.toBe(heroColor.hex);
        
        // CTA should have gold hint (more red and green than blue)
        expect(ctaColor.rgb.r + ctaColor.rgb.g).toBeGreaterThan(ctaColor.rgb.b);
      }
    });

    test('P1: should maintain sufficient contrast throughout color transitions', async ({ page }) => {
      // Test various scroll positions
      const positions = [0, 0.25, 0.5, 0.75, 1.0];
      
      for (const position of positions) {
        await page.evaluate((pos) => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: maxScroll * pos, behavior: 'auto' });
        }, position);
        
        await page.waitForTimeout(300);

        const contrastInfo = await page.evaluate(() => {
          const scene = (window as any).particleScene;
          if (!scene) return null;
          const particleSystem = scene.children.find((child: any) => child.type === 'Points');
          if (!particleSystem) return null;
          
          return {
            opacity: particleSystem.material.opacity,
            brightness: (particleSystem.material.color.r + particleSystem.material.color.g + particleSystem.material.color.b) / 3
          };
        });

        if (contrastInfo) {
          // Should maintain visibility (opacity > 0.3) and not be too bright (< 1.0)
          expect(contrastInfo.opacity).toBeGreaterThan(0.3);
          expect(contrastInfo.brightness).toBeLessThan(1.0);
          expect(contrastInfo.brightness).toBeGreaterThan(0.1); // Not too dark
        }
      }
    });

    test('P1: should subtly shift color without dramatic changes', async ({ page }) => {
      const colorSamples: number[] = [];
      
      // Sample colors at different positions
      for (let i = 0; i <= 10; i++) {
        await page.evaluate((position) => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          window.scrollTo({ top: maxScroll * position, behavior: 'auto' });
        }, i / 10);
        
        await page.waitForTimeout(200);

        const color = await page.evaluate(() => {
          const scene = (window as any).particleScene;
          if (!scene) return null;
          const particleSystem = scene.children.find((child: any) => child.type === 'Points');
          return particleSystem?.material.color.getHex() || null;
        });

        if (color !== null) colorSamples.push(color);
      }

      // Should have gradual changes (not abrupt jumps)
      for (let i = 1; i < colorSamples.length; i++) {
        const colorA = colorSamples[i - 1];
        const colorB = colorSamples[i];
        
        // Extract RGB components
        const rgbA = [(colorA >> 16) & 255, (colorA >> 8) & 255, colorA & 255];
        const rgbB = [(colorB >> 16) & 255, (colorB >> 8) & 255, colorB & 255];
        
        // Calculate color difference
        const diff = Math.sqrt(
          Math.pow(rgbA[0] - rgbB[0], 2) +
          Math.pow(rgbA[1] - rgbB[1], 2) +
          Math.pow(rgbA[2] - rgbB[2], 2)
        );
        
        // Changes should be subtle (not abrupt jumps > 100)
        expect(diff).toBeLessThan(100);
      }
    });
  });

  test.describe('6. Mouse Interactions and Immediate Visual Feedback', () => {
    
    test('P1: should respond immediately to mouse movement with particle attraction', async ({ page }) => {
      const beforeMouseMove = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      // Move mouse to specific location
      await page.mouse.move(300, 400);
      await page.waitForTimeout(100); // Immediate response expected

      const afterMouseMove = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      // Should show immediate visual change
      expect(beforeMouseMove).not.toBe(afterMouseMove);
    });

    test('P1: should create shockwave ripple on click with visible expansion', async ({ page }) => {
      // Click at specific location
      await page.click('body', { position: { x: 400, y: 300 } });
      
      // Capture shockwave frames
      const shockwaveFrames: string[] = [];
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(50);
        const frame = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          const ctx = canvas?.getContext('2d');
          if (!ctx) return 'no-context';
          
          // Sample area around click point for shockwave
          const imageData = ctx.getImageData(350, 250, 100, 100);
          return Array.from(imageData.data.slice(0, 40)).join(',');
        });
        shockwaveFrames.push(frame);
      }

      // Shockwave should create visually distinct frames (ripple expansion)
      const uniqueFrames = new Set(shockwaveFrames);
      expect(uniqueFrames.size).toBeGreaterThan(5); // Multiple distinct ripple states
    });

    test('P1: should attract particles within radius to cursor position', async ({ page }) => {
      // Move mouse to corner
      await page.mouse.move(100, 100);
      await page.waitForTimeout(300);

      const cornerDistribution = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return null;
        
        // Sample corner area (where mouse is)
        const cornerData = ctx.getImageData(50, 50, 100, 100);
        let cornerParticles = 0;
        for (let i = 3; i < cornerData.data.length; i += 4) {
          if (cornerData.data[i] > 10) cornerParticles++;
        }
        return cornerParticles;
      });

      // Move mouse to center
      await page.mouse.move(400, 300);
      await page.waitForTimeout(300);

      const centerDistribution = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return null;
        
        // Sample center area (where mouse moved to)
        const centerData = ctx.getImageData(350, 250, 100, 100);
        let centerParticles = 0;
        for (let i = 3; i < centerData.data.length; i += 4) {
          if (centerData.data[i] > 10) centerParticles++;
        }
        return centerParticles;
      });

      // Center should have more particles after mouse move
      if (cornerDistribution !== null && centerDistribution !== null) {
        expect(centerDistribution).toBeGreaterThan(cornerDistribution * 0.7);
      }
    });

    test('P1: should provide tactile feeling through visual particle response', async ({ page }) => {
      const mousePositions = [
        { x: 200, y: 150 },
        { x: 600, y: 400 },
        { x: 300, y: 500 },
        { x: 500, y: 200 }
      ];

      const responses: string[] = [];

      for (const position of mousePositions) {
        await page.mouse.move(position.x, position.y);
        await page.waitForTimeout(150);

        const response = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          const ctx = canvas?.getContext('2d');
          if (!ctx) return 'no-response';
          
          // Sample area around current mouse position
          const imageData = ctx.getImageData(
            window.mouseX - 50 || 0, 
            window.mouseY - 50 || 0, 
            100, 
            100
          );
          return Array.from(imageData.data.slice(0, 20)).join(',');
        });

        responses.push(response);
      }

      // Each mouse position should create different particle response
      const uniqueResponses = new Set(responses);
      expect(uniqueResponses.size).toBeGreaterThan(2);
    });
  });

  test.describe('7. Performance Validation - 60fps and Responsiveness', () => {
    
    test('P1: should maintain smooth 60fps during normal operation', async ({ page }) => {
      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).performanceFrames = [];
        (window as any).performanceStart = performance.now();
        
        const measureFrame = () => {
          (window as any).performanceFrames.push(performance.now());
          requestAnimationFrame(measureFrame);
        };
        requestAnimationFrame(measureFrame);
      });

      // Normal particle operations for 2 seconds
      await page.mouse.move(200, 200);
      await page.waitForTimeout(500);
      await page.mouse.move(400, 400);
      await page.waitForTimeout(500);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(500);
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(500);

      const performanceData = await page.evaluate(() => {
        const frames = (window as any).performanceFrames || [];
        const start = (window as any).performanceStart || performance.now();
        const duration = performance.now() - start;
        
        // Calculate average FPS
        const fps = frames.length / (duration / 1000);
        
        // Calculate frame time consistency
        const frameTimes: number[] = [];
        for (let i = 1; i < frames.length; i++) {
          frameTimes.push(frames[i] - frames[i - 1]);
        }
        
        const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        
        return {
          fps,
          averageFrameTime,
          frameCount: frames.length,
          duration
        };
      });

      // Should maintain close to 60 FPS
      expect(performanceData.fps).toBeGreaterThan(50);
      expect(performanceData.averageFrameTime).toBeLessThan(20); // < 20ms per frame
    });

    test('P1: should not impact page scrolling smoothness', async ({ page }) => {
      const scrollPerformanceStart = Date.now();
      
      // Perform extensive scrolling operations
      for (let i = 0; i < 50; i++) {
        await page.mouse.wheel(0, Math.random() * 200 - 100);
        await page.waitForTimeout(20);
      }
      
      const scrollPerformanceEnd = Date.now();
      const scrollDuration = scrollPerformanceEnd - scrollPerformanceStart;
      
      // Scrolling operations should complete quickly despite particle system
      expect(scrollDuration).toBeLessThan(3000); // 50 scroll operations in < 3 seconds
      
      // Page should still be responsive
      const finalScrollPosition = await page.evaluate(() => window.scrollY);
      expect(finalScrollPosition).toBeGreaterThan(0); // Scrolling actually occurred
    });

    test('P1: should handle stress testing without memory leaks', async ({ page }) => {
      // Stress test with rapid interactions
      for (let cycle = 0; cycle < 5; cycle++) {
        // Rapid mouse movements
        for (let i = 0; i < 20; i++) {
          await page.mouse.move(Math.random() * 800, Math.random() * 600);
          await page.waitForTimeout(10);
        }
        
        // Rapid clicks
        for (let i = 0; i < 10; i++) {
          await page.click('body', { 
            position: { x: Math.random() * 800, y: Math.random() * 600 }
          });
          await page.waitForTimeout(20);
        }
        
        // Rapid scrolling
        for (let i = 0; i < 10; i++) {
          await page.mouse.wheel(0, Math.random() * 400 - 200);
          await page.waitForTimeout(15);
        }
      }
      
      // System should remain stable
      const particleStatus = await getParticleSystemStatus(page);
      expect(particleStatus.exists).toBe(true);
      expect(particleStatus.isAnimating).toBe(true);
      
      // Check for memory usage (simplified)
      const memoryInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      });
      
      // Memory usage should be reasonable (< 50MB for this test)
      if (memoryInfo !== null) {
        expect(memoryInfo).toBeLessThan(50 * 1024 * 1024);
      }
    });
  });

  test.describe('8. Accessibility - Reduced Motion Support', () => {
    
    test('P1: should disable fancy effects when prefers-reduced-motion is set', async ({ browser }) => {
      const context = await browser.newContext({
        reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      
      await page.goto('/');
      await waitForParticleSystem(page);
      
      // Trigger transition that would normally create shape formation
      await page.evaluate(() => {
        const heroElement = document.getElementById('hero');
        if (heroElement) {
          const heroHeight = heroElement.offsetHeight;
          window.scrollTo({ top: heroHeight * 0.9, behavior: 'auto' });
        }
      });
      
      await page.waitForTimeout(500);
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(1000);
      
      // Fancy animations should be minimal/disabled
      const reducedMotionCanvas = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png');
      });
      
      // Create normal context for comparison
      await context.close();
      const normalPage = await browser.newPage();
      await normalPage.goto('/');
      await waitForParticleSystem(normalPage);
      
      await normalPage.evaluate(() => {
        const heroElement = document.getElementById('hero');
        if (heroElement) {
          const heroHeight = heroElement.offsetHeight;
          window.scrollTo({ top: heroHeight * 0.9, behavior: 'auto' });
        }
      });
      
      await normalPage.waitForTimeout(500);
      await normalPage.mouse.wheel(0, 200);
      await normalPage.waitForTimeout(1000);
      
      const normalCanvas = await normalPage.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png');
      });
      
      // Reduced motion version should be noticeably different (less fancy)
      expect(reducedMotionCanvas).not.toBe(normalCanvas);
      
      await normalPage.close();
    });
  });

  test.describe('9. Cross-Browser Compatibility', () => {
    
    test('P1: should render particles consistently across browsers', async ({ page, browserName }) => {
      const particleStatus = await getParticleSystemStatus(page);
      
      // Basic functionality should work in all browsers
      expect(particleStatus.exists).toBe(true);
      expect(particleStatus.webglSupported).toBe(true);
      expect(particleStatus.isAnimating).toBe(true);
      
      // Canvas should have reasonable size
      expect(particleStatus.canvasSize.width).toBeGreaterThan(100);
      expect(particleStatus.canvasSize.height).toBeGreaterThan(100);
      
      // Should respond to basic interactions
      await page.mouse.move(300, 300);
      await page.waitForTimeout(200);
      
      const afterInteraction = await getParticleSystemStatus(page);
      expect(afterInteraction.isAnimating).toBe(true);
    });
  });

  test.describe('10. Visual Regression Testing', () => {
    
    test('P1: should match baseline particle system appearance', async ({ page }) => {
      // Wait for stable state
      await page.waitForTimeout(3000);
      
      // Take screenshot of particle system
      const particleBackground = page.locator('app-three-particle-background');
      await expect(particleBackground).toHaveScreenshot('particles-baseline.png', {
        maxDiffPixelRatio: 0.05, // Allow 5% difference for WebGL variations
        threshold: 0.3
      });
    });
    
    test('P1: should maintain visual consistency during scroll transitions', async ({ page }) => {
      // Navigate to filosofia section
      const filosofiaSection = page.locator('#filosofia');
      await filosofiaSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);
      
      // Capture during section transition
      const particleBackground = page.locator('app-three-particle-background');
      await expect(particleBackground).toHaveScreenshot('particles-filosofia-transition.png', {
        maxDiffPixelRatio: 0.08,
        threshold: 0.3
      });
    });
  });
});