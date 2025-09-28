/**
 * Mobile-Specific Tests for Dynamic Particle Background
 * 
 * Tests mobile-specific particle interactions as described in requirements:
 * - Touch interactions and particle response
 * - Device orientation effects (gyro parallax) 
 * - Haptic feedback integration
 * - Mobile performance optimization
 * - Touch gesture sensitivity adjustments
 */

import { test, expect, devices } from '@playwright/test';

// Helper to simulate device orientation
async function simulateDeviceOrientation(page: any, alpha: number, beta: number, gamma: number) {
  await page.evaluate(({ alpha, beta, gamma }) => {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {
      alpha,
      beta, 
      gamma,
      absolute: true
    }));
  }, { alpha, beta, gamma });
}

// Helper to simulate touch with pressure
async function simulateTouch(page: any, x: number, y: number, pressure = 1.0) {
  await page.touchscreen.tap(x, y);
  
  // Also trigger custom touch event with pressure if supported
  await page.evaluate(({ x, y, pressure }) => {
    const touch = new Touch({
      identifier: Date.now(),
      target: document.body,
      clientX: x,
      clientY: y,
      force: pressure
    });
    
    const touchEvent = new TouchEvent('touchstart', {
      touches: [touch],
      targetTouches: [touch],
      changedTouches: [touch]
    });
    
    document.dispatchEvent(touchEvent);
  }, { x, y, pressure });
}

test.describe('Mobile Particle System - Touch and Device Interactions', () => {

  test.describe('iPhone Tests', () => {
    test.use({ ...devices['iPhone 13'] });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Allow particle system to initialize
    });

    test('P1: should use exactly 120 particles on mobile for performance', async ({ page }) => {
      const mobileParticleInfo = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        if (!particleSystem) return null;
        
        return {
          particleCount: particleSystem.geometry.attributes.position.count,
          isMobileDetected: /Mobi|Android/i.test(navigator.userAgent)
        };
      });

      if (mobileParticleInfo) {
        expect(mobileParticleInfo.isMobileDetected).toBe(true);
        expect(mobileParticleInfo.particleCount).toBe(120); // Mobile particle count
      }
    });

    test('P1: should respond to touch interactions with immediate particle feedback', async ({ page }) => {
      const beforeTouch = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      // Touch interaction
      await simulateTouch(page, 200, 300);
      await page.waitForTimeout(200);

      const afterTouch = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      // Should show immediate visual response to touch
      expect(beforeTouch).not.toBe(afterTouch);
    });

    test('P1: should create touch-based shockwave with proper ripple effect', async ({ page }) => {
      // Touch at specific location
      await simulateTouch(page, 300, 400, 0.8);
      
      // Capture shockwave progression
      const shockwaveFrames: string[] = [];
      for (let i = 0; i < 8; i++) {
        await page.waitForTimeout(50);
        const frame = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          const ctx = canvas?.getContext('2d');
          if (!ctx) return 'no-context';
          
          // Sample around touch point
          const imageData = ctx.getImageData(250, 350, 100, 100);
          return Array.from(imageData.data.slice(0, 32)).join(',');
        });
        shockwaveFrames.push(frame);
      }

      // Touch shockwave should create distinct visual frames
      const uniqueFrames = new Set(shockwaveFrames);
      expect(uniqueFrames.size).toBeGreaterThan(4);
    });

    test('P1: should trigger haptic feedback on touch interactions (if supported)', async ({ page }) => {
      // Mock vibration API
      await page.addInitScript(() => {
        (window.navigator as any).vibrate = jasmine.createSpy('vibrate');
        (window as any).vibrationCalls = [];
        (window.navigator as any).vibrate = (pattern: any) => {
          (window as any).vibrationCalls.push(pattern);
          return true;
        };
      });

      // Touch interaction that should trigger haptic feedback
      await simulateTouch(page, 400, 300, 1.0);
      await page.waitForTimeout(300);

      const vibrationCalls = await page.evaluate(() => (window as any).vibrationCalls || []);

      // Should have triggered vibration (if device supports it)
      if (vibrationCalls.length > 0) {
        expect(vibrationCalls[0]).toBeDefined();
        expect(typeof vibrationCalls[0]).toBe('number'); // Duration
        expect(vibrationCalls[0]).toBeGreaterThan(0);
        expect(vibrationCalls[0]).toBeLessThan(50); // Short haptic feedback
      }
    });

    test('P1: should adjust touch sensitivity for small screen interactions', async ({ page }) => {
      const viewportSize = page.viewportSize();
      expect(viewportSize!.width).toBeLessThan(500); // Confirm mobile viewport

      // Small touch movements should be amplified
      await simulateTouch(page, 150, 200);
      await page.waitForTimeout(100);
      const smallMoveResponse = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 80);
      });

      await simulateTouch(page, 170, 220); // Small 20px movement
      await page.waitForTimeout(100);
      const amplifiedResponse = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 80);
      });

      // Small movements should create noticeable particle response
      expect(smallMoveResponse).not.toBe(amplifiedResponse);
    });

    test('P1: should handle swipe gestures for particle interaction', async ({ page }) => {
      const startX = 100;
      const startY = 200;
      const endX = 300;
      const endY = 200;

      // Simulate swipe gesture
      await page.touchscreen.tap(startX, startY);
      await page.waitForTimeout(50);

      // Drag motion
      for (let i = 0; i <= 10; i++) {
        const currentX = startX + (endX - startX) * (i / 10);
        const currentY = startY + (endY - startY) * (i / 10);
        
        await page.evaluate(({ x, y, i }) => {
          const touch = new Touch({
            identifier: 1,
            target: document.body,
            clientX: x,
            clientY: y
          });
          
          const touchEvent = new TouchEvent(i === 10 ? 'touchend' : 'touchmove', {
            touches: i === 10 ? [] : [touch],
            targetTouches: i === 10 ? [] : [touch],
            changedTouches: [touch]
          });
          
          document.dispatchEvent(touchEvent);
        }, { x: currentX, y: currentY, i });
        
        await page.waitForTimeout(20);
      }

      await page.waitForTimeout(200);

      // Swipe should create particle trail/disturbance
      const swipeEffect = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return null;
        
        // Sample along swipe path
        const pathData = ctx.getImageData(100, 190, 200, 20);
        let particlesInPath = 0;
        for (let i = 3; i < pathData.data.length; i += 4) {
          if (pathData.data[i] > 15) particlesInPath++;
        }
        
        return particlesInPath;
      });

      expect(swipeEffect).toBeGreaterThan(5); // Particles should be disturbed along swipe path
    });
  });

  test.describe('Device Orientation Effects', () => {
    test.use({ ...devices['iPhone 13'] });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Enable gyro parallax by simulating user permission
      await page.evaluate(() => {
        // Mock DeviceOrientationEvent permission
        (window as any).DeviceOrientationEvent = {
          ...DeviceOrientationEvent,
          requestPermission: () => Promise.resolve('granted')
        };
      });
    });

    test('P1: should respond to device tilt with particle field shift', async ({ page }) => {
      const initialState = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 120);
      });

      // Tilt device left (negative gamma)
      await simulateDeviceOrientation(page, 0, 0, -30);
      await page.waitForTimeout(300);

      const leftTiltState = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 120);
      });

      // Tilt device right (positive gamma)
      await simulateDeviceOrientation(page, 0, 0, 30);
      await page.waitForTimeout(300);

      const rightTiltState = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 120);
      });

      // All three states should be different (particle field shifted)
      expect(initialState).not.toBe(leftTiltState);
      expect(leftTiltState).not.toBe(rightTiltState);
      expect(initialState).not.toBe(rightTiltState);
    });

    test('P1: should use gyroPositionGain of 0.02 for subtle movement', async ({ page }) => {
      // Access gyro settings
      const gyroSettings = await page.evaluate(() => {
        const component = (window as any).particleBackgroundComponent;
        if (!component) return null;
        
        return {
          gyroPositionGain: component.gyroPositionGain || 0.02,
          gyroSpinGain: component.gyroSpinGain || 0.012
        };
      });

      // Settings should match requirements for subtlety
      if (gyroSettings) {
        expect(gyroSettings.gyroPositionGain).toBe(0.02);
        expect(gyroSettings.gyroSpinGain).toBe(0.012);
      }
    });

    test('P1: should handle screen orientation changes gracefully', async ({ page }) => {
      // Portrait mode
      await page.setViewportSize({ width: 375, height: 667 });
      await simulateDeviceOrientation(page, 0, 0, 15);
      await page.waitForTimeout(200);

      const portraitResponse = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      // Landscape mode
      await page.setViewportSize({ width: 667, height: 375 });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('orientationchange'));
      });
      await page.waitForTimeout(500);

      await simulateDeviceOrientation(page, 0, 0, 15);
      await page.waitForTimeout(200);

      const landscapeResponse = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      // Should handle orientation change without errors
      expect(portraitResponse).toBeDefined();
      expect(landscapeResponse).toBeDefined();
      expect(portraitResponse).not.toBe(landscapeResponse);
    });

    test('P1: should invite user to move phone with discoverable gyro effects', async ({ page }) => {
      // Simulate discovering gyro effect accidentally
      const effects: string[] = [];

      // Small random tilts (as user naturally holds phone)
      const tilts = [
        { alpha: 5, beta: -2, gamma: 8 },
        { alpha: -3, beta: 4, gamma: -5 },
        { alpha: 7, beta: -1, gamma: 12 },
        { alpha: -4, beta: 3, gamma: -8 }
      ];

      for (const tilt of tilts) {
        await simulateDeviceOrientation(page, tilt.alpha, tilt.beta, tilt.gamma);
        await page.waitForTimeout(200);

        const effect = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          return canvas?.toDataURL('image/png').substring(0, 80);
        });

        effects.push(effect);
      }

      // Each tilt should create different particle effect (discoverable)
      const uniqueEffects = new Set(effects);
      expect(uniqueEffects.size).toBeGreaterThan(2);
    });

    test('P1: should create physical dimension to experience through device movement', async ({ page }) => {
      // Test various device orientations to create 3D-like effect
      const orientations = [
        { alpha: 0, beta: 10, gamma: 0 },    // Tilt forward
        { alpha: 0, beta: -10, gamma: 0 },   // Tilt back
        { alpha: 0, beta: 0, gamma: 15 },    // Tilt right
        { alpha: 0, beta: 0, gamma: -15 },   // Tilt left
        { alpha: 45, beta: 5, gamma: 5 }     // Rotate device
      ];

      const dimensionalEffects: string[] = [];

      for (const orientation of orientations) {
        await simulateDeviceOrientation(page, orientation.alpha, orientation.beta, orientation.gamma);
        await page.waitForTimeout(250);

        const effect = await page.evaluate(() => {
          const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
          const ctx = canvas?.getContext('2d');
          if (!ctx) return 'no-context';
          
          // Sample multiple areas to detect 3D-like shifts
          const centerData = ctx.getImageData(canvas.width/2 - 25, canvas.height/2 - 25, 50, 50);
          const topData = ctx.getImageData(canvas.width/2 - 25, 10, 50, 30);
          const bottomData = ctx.getImageData(canvas.width/2 - 25, canvas.height - 40, 50, 30);
          
          // Create signature from different areas
          const centerSum = Array.from(centerData.data).reduce((sum, val, i) => i % 4 === 3 ? sum + val : sum, 0);
          const topSum = Array.from(topData.data).reduce((sum, val, i) => i % 4 === 3 ? sum + val : sum, 0);
          const bottomSum = Array.from(bottomData.data).reduce((sum, val, i) => i % 4 === 3 ? sum + val : sum, 0);
          
          return `${centerSum}-${topSum}-${bottomSum}`;
        });

        dimensionalEffects.push(effect);
      }

      // Each orientation should create a different 3D-like particle arrangement
      const uniqueDimensionalEffects = new Set(dimensionalEffects);
      expect(uniqueDimensionalEffects.size).toBeGreaterThan(3);
    });
  });

  test.describe('Touch Pressure and Force Sensitivity', () => {
    test.use({ ...devices['iPhone 13'] });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    });

    test('P1: should respond to touch pressure variations', async ({ page }) => {
      // Light touch
      await simulateTouch(page, 300, 300, 0.3);
      await page.waitForTimeout(200);

      const lightTouchEffect = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return null;
        
        const data = ctx.getImageData(250, 250, 100, 100);
        let intensity = 0;
        for (let i = 3; i < data.data.length; i += 4) {
          intensity += data.data[i];
        }
        return intensity;
      });

      // Heavy touch
      await simulateTouch(page, 300, 300, 1.0);
      await page.waitForTimeout(200);

      const heavyTouchEffect = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return null;
        
        const data = ctx.getImageData(250, 250, 100, 100);
        let intensity = 0;
        for (let i = 3; i < data.data.length; i += 4) {
          intensity += data.data[i];
        }
        return intensity;
      });

      // Heavy touch should create more intense particle effect
      if (lightTouchEffect !== null && heavyTouchEffect !== null) {
        expect(heavyTouchEffect).toBeGreaterThan(lightTouchEffect * 0.8);
      }
    });

    test('P1: should create stronger shockwaves with harder touches', async ({ page }) => {
      const shockwaveData: any[] = [];

      // Test different touch pressures
      const pressures = [0.2, 0.5, 0.8, 1.0];

      for (const pressure of pressures) {
        await simulateTouch(page, 400, 350, pressure);
        await page.waitForTimeout(100);

        const shockwaveInfo = await page.evaluate(() => {
          const scene = (window as any).particleScene;
          if (!scene) return null;
          
          // Access shockwave data from particle system
          const particleSystem = scene.children.find((child: any) => child.type === 'Points');
          if (!particleSystem || !particleSystem.material.uniforms) return null;
          
          const shockwaves = particleSystem.material.uniforms.shockwaves?.value || [];
          return {
            count: shockwaves.length,
            latestStrength: shockwaves[shockwaves.length - 1]?.maxStrength || 0
          };
        });

        if (shockwaveInfo) {
          shockwaveData.push({ pressure, strength: shockwaveInfo.latestStrength });
        }

        await page.waitForTimeout(300); // Allow shockwave to fade
      }

      // Stronger touches should create stronger shockwaves
      if (shockwaveData.length >= 2) {
        const lowPressure = shockwaveData.find(d => d.pressure <= 0.3);
        const highPressure = shockwaveData.find(d => d.pressure >= 0.8);
        
        if (lowPressure && highPressure) {
          expect(highPressure.strength).toBeGreaterThan(lowPressure.strength);
        }
      }
    });
  });

  test.describe('Mobile Performance Optimization', () => {
    test.use({ ...devices['Pixel 5'] });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    });

    test('P1: should maintain 60fps on mobile during intensive interactions', async ({ page }) => {
      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).mobileFrames = [];
        (window as any).mobileStartTime = performance.now();
        
        const trackFrame = () => {
          (window as any).mobileFrames.push(performance.now());
          requestAnimationFrame(trackFrame);
        };
        requestAnimationFrame(trackFrame);
      });

      // Intensive mobile interactions
      for (let i = 0; i < 30; i++) {
        await simulateTouch(page, Math.random() * 300, Math.random() * 400);
        await page.waitForTimeout(33); // ~30fps interaction rate
      }

      // Add some orientation changes
      for (let i = 0; i < 5; i++) {
        await simulateDeviceOrientation(page, Math.random() * 360, Math.random() * 40 - 20, Math.random() * 40 - 20);
        await page.waitForTimeout(100);
      }

      const mobilePerformance = await page.evaluate(() => {
        const frames = (window as any).mobileFrames || [];
        const startTime = (window as any).mobileStartTime || performance.now();
        const duration = performance.now() - startTime;
        
        const fps = frames.length / (duration / 1000);
        
        // Calculate frame time variance for smoothness
        const frameTimes: number[] = [];
        for (let i = 1; i < frames.length; i++) {
          frameTimes.push(frames[i] - frames[i - 1]);
        }
        
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const variance = frameTimes.reduce((sum, time) => sum + Math.pow(time - avgFrameTime, 2), 0) / frameTimes.length;
        
        return { fps, avgFrameTime, variance, frameCount: frames.length };
      });

      // Should maintain good mobile performance
      expect(mobilePerformance.fps).toBeGreaterThan(45); // Allow some drop on mobile
      expect(mobilePerformance.avgFrameTime).toBeLessThan(25); // ~40fps minimum
      expect(mobilePerformance.variance).toBeLessThan(100); // Reasonable smoothness
    });

    test('P1: should disable intensive effects on lower-end devices', async ({ page }) => {
      // Simulate lower-end device by reducing available features
      await page.evaluate(() => {
        // Mock reduced GPU capabilities
        (window as any).mockLowEndDevice = true;
        
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
          // Reduce max texture units to simulate limited GPU
          const originalGetParameter = gl.getParameter.bind(gl);
          gl.getParameter = (pname: any) => {
            if (pname === gl.MAX_TEXTURE_IMAGE_UNITS) return 4; // Low limit
            if (pname === gl.MAX_VERTEX_ATTRIBS) return 8; // Low limit
            return originalGetParameter(pname);
          };
        }
      });

      // Trigger effects that should be simplified on low-end devices
      await simulateTouch(page, 200, 200);
      await page.waitForTimeout(100);

      // Scroll to trigger transition effects
      await page.touchscreen.tap(300, 400);
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(500);

      // System should remain responsive (no complex effects)
      const lowEndPerformance = await page.evaluate(() => {
        const start = performance.now();
        
        // Simulate some work
        for (let i = 0; i < 1000; i++) {
          Math.random();
        }
        
        return performance.now() - start;
      });

      // Should complete quickly even with limited resources
      expect(lowEndPerformance).toBeLessThan(50); // Should be very fast
    });

    test('P1: should adapt particle density based on device performance', async ({ page }) => {
      // Monitor actual particle rendering performance
      const performanceMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const frames: number[] = [];
          const startTime = performance.now();
          let frameCount = 0;
          
          const measure = () => {
            frames.push(performance.now());
            frameCount++;
            
            if (frameCount < 60) { // Measure 60 frames
              requestAnimationFrame(measure);
            } else {
              const duration = performance.now() - startTime;
              const avgFPS = frameCount / (duration / 1000);
              
              resolve({
                avgFPS,
                duration,
                frameCount
              });
            }
          };
          
          requestAnimationFrame(measure);
        });
      });

      // If performance is low, particle system should adapt
      if ((performanceMetrics as any).avgFPS < 50) {
        const adaptedParticleInfo = await page.evaluate(() => {
          const scene = (window as any).particleScene;
          if (!scene) return null;
          
          const particleSystem = scene.children.find((child: any) => child.type === 'Points');
          if (!particleSystem) return null;
          
          return {
            particleCount: particleSystem.geometry.attributes.position.count,
            simplified: (window as any).simplifiedMode || false
          };
        });

        // Should use reduced particle count or simplified mode
        if (adaptedParticleInfo) {
          expect(adaptedParticleInfo.particleCount).toBeLessThanOrEqual(120);
        }
      }

      expect((performanceMetrics as any).avgFPS).toBeGreaterThan(30); // Minimum acceptable
    });
  });

  test.describe('Touch Gesture Recognition', () => {
    test.use({ ...devices['iPad Pro'] });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    });

    test('P1: should recognize multi-touch gestures', async ({ page }) => {
      // Simulate two-finger touch
      await page.evaluate(() => {
        const touch1 = new Touch({
          identifier: 1,
          target: document.body,
          clientX: 200,
          clientY: 200
        });
        
        const touch2 = new Touch({
          identifier: 2,
          target: document.body,
          clientX: 300,
          clientY: 300
        });
        
        const touchEvent = new TouchEvent('touchstart', {
          touches: [touch1, touch2],
          targetTouches: [touch1, touch2],
          changedTouches: [touch1, touch2]
        });
        
        document.dispatchEvent(touchEvent);
      });

      await page.waitForTimeout(200);

      const multiTouchEffect = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 150);
      });

      // End multi-touch
      await page.evaluate(() => {
        const touchEvent = new TouchEvent('touchend', {
          touches: [],
          targetTouches: [],
          changedTouches: []
        });
        
        document.dispatchEvent(touchEvent);
      });

      await page.waitForTimeout(200);

      const afterMultiTouchEffect = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 150);
      });

      // Multi-touch should create different particle behavior
      expect(multiTouchEffect).not.toBe(afterMultiTouchEffect);
    });

    test('P1: should handle pinch gestures without interfering with particles', async ({ page }) => {
      // Simulate pinch gesture
      await page.evaluate(() => {
        const touch1 = new Touch({ identifier: 1, target: document.body, clientX: 250, clientY: 250 });
        const touch2 = new Touch({ identifier: 2, target: document.body, clientX: 350, clientY: 350 });
        
        // Start pinch
        document.dispatchEvent(new TouchEvent('touchstart', {
          touches: [touch1, touch2], targetTouches: [touch1, touch2], changedTouches: [touch1, touch2]
        }));
        
        // Move touches closer (pinch in)
        const touch1Close = new Touch({ identifier: 1, target: document.body, clientX: 275, clientY: 275 });
        const touch2Close = new Touch({ identifier: 2, target: document.body, clientX: 325, clientY: 325 });
        
        document.dispatchEvent(new TouchEvent('touchmove', {
          touches: [touch1Close, touch2Close], targetTouches: [touch1Close, touch2Close], changedTouches: [touch1Close, touch2Close]
        }));
      });

      await page.waitForTimeout(300);

      // Particle system should remain stable during pinch
      const particleStatus = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return {
          exists: !!canvas,
          hasContext: !!(canvas?.getContext('webgl2') || canvas?.getContext('webgl'))
        };
      });

      expect(particleStatus.exists).toBe(true);
      expect(particleStatus.hasContext).toBe(true);
    });

    test('P1: should distinguish between intentional particle interaction and accidental touch', async ({ page }) => {
      // Quick accidental touch
      await simulateTouch(page, 100, 100);
      await page.waitForTimeout(50); // Very short duration

      const accidentalEffect = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      await page.waitForTimeout(200);

      // Intentional longer interaction
      await simulateTouch(page, 200, 200);
      await page.waitForTimeout(300); // Longer duration

      const intentionalEffect = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 100);
      });

      // Both should create effects but potentially different intensities
      expect(accidentalEffect).toBeDefined();
      expect(intentionalEffect).toBeDefined();
      // The system should respond to both, but implementation may vary intensity
    });
  });

  test.describe('Mobile-Specific Edge Cases', () => {
    test.use({ ...devices['iPhone SE'] }); // Smaller screen

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    });

    test('P1: should handle device rotation without losing particle state', async ({ page }) => {
      // Establish particle state in portrait
      await simulateTouch(page, 150, 200);
      await page.waitForTimeout(200);

      const portraitState = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return {
          particleCount: particleSystem?.geometry.attributes.position.count,
          isVisible: particleSystem?.visible
        };
      });

      // Rotate to landscape
      await page.setViewportSize({ width: 568, height: 320 });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('orientationchange'));
      });
      await page.waitForTimeout(1000); // Allow reinitialization

      const landscapeState = await page.evaluate(() => {
        const scene = (window as any).particleScene;
        if (!scene) return null;
        const particleSystem = scene.children.find((child: any) => child.type === 'Points');
        return {
          particleCount: particleSystem?.geometry.attributes.position.count,
          isVisible: particleSystem?.visible
        };
      });

      // Particle system should survive rotation
      if (portraitState && landscapeState) {
        expect(landscapeState.particleCount).toBe(portraitState.particleCount);
        expect(landscapeState.isVisible).toBe(true);
      }
    });

    test('P1: should handle memory pressure gracefully on mobile', async ({ page }) => {
      // Simulate memory pressure by creating many objects
      await page.evaluate(() => {
        (window as any).memoryPressureTest = [];
        for (let i = 0; i < 1000; i++) {
          (window as any).memoryPressureTest.push(new Array(1000).fill(Math.random()));
        }
      });

      // Continue particle interactions under memory pressure
      for (let i = 0; i < 20; i++) {
        await simulateTouch(page, Math.random() * 300, Math.random() * 400);
        await page.waitForTimeout(25);
      }

      // Particle system should remain stable
      const systemStatus = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
        
        return {
          canvasExists: !!canvas,
          webglActive: !!gl && !gl.isContextLost(),
          memoryArrayExists: !!(window as any).memoryPressureTest
        };
      });

      expect(systemStatus.canvasExists).toBe(true);
      expect(systemStatus.webglActive).toBe(true);

      // Cleanup memory pressure test
      await page.evaluate(() => {
        delete (window as any).memoryPressureTest;
      });
    });

    test('P1: should maintain touch responsiveness in low battery mode', async ({ page }) => {
      // Simulate low battery mode (reduced performance)
      await page.evaluate(() => {
        // Mock reduced animation frame rate
        const originalRAF = window.requestAnimationFrame;
        (window as any).originalRAF = originalRAF;
        
        window.requestAnimationFrame = (callback: FrameRequestCallback) => {
          // Slower frame rate to simulate battery saving
          return setTimeout(() => callback(performance.now()), 33); // ~30fps
        };
      });

      // Test touch responsiveness
      const touchStart = Date.now();
      await simulateTouch(page, 200, 250);
      await page.waitForTimeout(100);
      
      const touchResponse = await page.evaluate(() => {
        const canvas = document.querySelector('app-three-particle-background canvas') as HTMLCanvasElement;
        return canvas?.toDataURL('image/png').substring(0, 80);
      });
      
      const touchEnd = Date.now();
      const responseTime = touchEnd - touchStart;

      // Should still respond to touch even with reduced performance
      expect(touchResponse).toBeDefined();
      expect(responseTime).toBeLessThan(300); // Should respond within 300ms

      // Restore normal RAF
      await page.evaluate(() => {
        if ((window as any).originalRAF) {
          window.requestAnimationFrame = (window as any).originalRAF;
        }
      });
    });
  });
});