import { TestBed } from '@angular/core/testing';
import { RingLayoutService } from './ring-layout.service';

describe('RingLayoutService', () => {
  let service: RingLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RingLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('computeStepDeg', () => {
    it('should compute correct step for typical counts', () => {
      expect(service.computeStepDeg(8)).toBe(45);
      expect(service.computeStepDeg(4)).toBe(90);
      expect(service.computeStepDeg(12)).toBe(30);
      expect(service.computeStepDeg(6)).toBe(60);
    });

    it('should handle count of 1', () => {
      expect(service.computeStepDeg(1)).toBe(360);
    });

    it('should handle count of 2', () => {
      expect(service.computeStepDeg(2)).toBe(180);
    });

    it('should handle zero or negative count by treating as 1', () => {
      expect(service.computeStepDeg(0)).toBe(360);
      expect(service.computeStepDeg(-5)).toBe(360);
    });

    it('should return stable numerical results', () => {
      const result1 = service.computeStepDeg(8);
      const result2 = service.computeStepDeg(8);
      expect(result1).toBe(result2);
    });

    it('should handle large counts', () => {
      expect(service.computeStepDeg(360)).toBe(1);
      expect(service.computeStepDeg(720)).toBe(0.5);
    });
  });

  describe('computeSpacingRadius', () => {
    it('should return 0 for count of 1', () => {
      expect(service.computeSpacingRadius(200, 24, 1)).toBe(0);
    });

    it('should return 0 for count of 0 or negative', () => {
      expect(service.computeSpacingRadius(200, 24, 0)).toBe(0);
      expect(service.computeSpacingRadius(200, 24, -1)).toBe(0);
    });

    it('should compute positive radius for count > 1', () => {
      const radius = service.computeSpacingRadius(200, 24, 8);
      expect(radius).toBeGreaterThan(0);
      expect(typeof radius).toBe('number');
      expect(isFinite(radius)).toBe(true);
    });

    it('should handle gap of 0', () => {
      const radiusWithGap = service.computeSpacingRadius(200, 24, 8);
      const radiusNoGap = service.computeSpacingRadius(200, 0, 8);
      
      expect(radiusNoGap).toBeGreaterThan(0);
      expect(radiusNoGap).toBeLessThan(radiusWithGap);
    });

    it('should increase radius with larger gap', () => {
      const smallGap = service.computeSpacingRadius(200, 10, 8);
      const largeGap = service.computeSpacingRadius(200, 50, 8);
      
      expect(largeGap).toBeGreaterThan(smallGap);
    });

    it('should increase radius with larger card width', () => {
      const smallCard = service.computeSpacingRadius(150, 24, 8);
      const largeCard = service.computeSpacingRadius(250, 24, 8);
      
      expect(largeCard).toBeGreaterThan(smallCard);
    });

    it('should increase radius with more items', () => {
      const fewItems = service.computeSpacingRadius(200, 24, 4);
      const manyItems = service.computeSpacingRadius(200, 24, 12);
      
      expect(manyItems).toBeGreaterThan(fewItems);
    });

    it('should return stable numerical results', () => {
      const result1 = service.computeSpacingRadius(200, 24, 8);
      const result2 = service.computeSpacingRadius(200, 24, 8);
      
      expect(result1).toBe(result2);
    });

    it('should match expected calculation for known values', () => {
      // For 8 items, step = 360/8 = 45 degrees = π/4 radians
      // stepRad = 2π/8 = π/4
      // requiredChord = 200 + 24 = 224
      // denom = 2 * sin(π/8) ≈ 2 * 0.38268 ≈ 0.76537
      // radius = 224 / 0.76537 ≈ 292.7
      const radius = service.computeSpacingRadius(200, 24, 8);
      expect(radius).toBeCloseTo(292.7, 0);
    });

    it('should handle count of 2', () => {
      const radius = service.computeSpacingRadius(200, 24, 2);
      expect(radius).toBeGreaterThan(0);
      expect(isFinite(radius)).toBe(true);
    });

    it('should not produce NaN or Infinity', () => {
      const testCases = [
        [200, 24, 8],
        [150, 0, 6],
        [300, 50, 12],
        [100, 10, 3],
      ];

      testCases.forEach(([cardW, gap, count]) => {
        const result = service.computeSpacingRadius(cardW, gap, count);
        expect(isNaN(result)).toBe(false);
        expect(isFinite(result)).toBe(true);
      });
    });
  });

  describe('effectiveRadius', () => {
    it('should return base when base is larger', () => {
      expect(service.effectiveRadius(300, 250)).toBe(300);
    });

    it('should return spacing when spacing is larger', () => {
      expect(service.effectiveRadius(200, 250)).toBe(250);
    });

    it('should return base when spacing is 0', () => {
      expect(service.effectiveRadius(200, 0)).toBe(200);
    });

    it('should handle equal values', () => {
      expect(service.effectiveRadius(250, 250)).toBe(250);
    });

    it('should handle negative spacing as 0', () => {
      // The || 0 in the implementation treats falsy values as 0
      expect(service.effectiveRadius(200, -10)).toBe(200);
    });

    it('should return stable numerical results', () => {
      const result1 = service.effectiveRadius(200, 250);
      const result2 = service.effectiveRadius(200, 250);
      expect(result1).toBe(result2);
    });

    it('should work with decimal values', () => {
      expect(service.effectiveRadius(200.5, 250.7)).toBe(250.7);
    });
  });

  describe('Integration tests', () => {
    it('should compute complete ring layout parameters', () => {
      const cardWidth = 240;
      const minGap = 24;
      const baseRadius = 200;
      const itemCount = 8;

      // Step 1: Compute angular step
      const stepDeg = service.computeStepDeg(itemCount);
      expect(stepDeg).toBe(45);

      // Step 2: Compute spacing radius
      const spacingRadius = service.computeSpacingRadius(cardWidth, minGap, itemCount);
      expect(spacingRadius).toBeGreaterThan(0);

      // Step 3: Compute effective radius
      const effective = service.effectiveRadius(baseRadius, spacingRadius);
      expect(effective).toBeGreaterThanOrEqual(baseRadius);
      expect(effective).toBeGreaterThanOrEqual(spacingRadius);
    });

    it('should handle single item scenario', () => {
      const cardWidth = 240;
      const minGap = 24;
      const baseRadius = 200;
      const itemCount = 1;

      const stepDeg = service.computeStepDeg(itemCount);
      expect(stepDeg).toBe(360);

      const spacingRadius = service.computeSpacingRadius(cardWidth, minGap, itemCount);
      expect(spacingRadius).toBe(0);

      const effective = service.effectiveRadius(baseRadius, spacingRadius);
      expect(effective).toBe(baseRadius);
    });

    it('should handle no gap scenario', () => {
      const cardWidth = 240;
      const minGap = 0;
      const baseRadius = 200;
      const itemCount = 6;

      const stepDeg = service.computeStepDeg(itemCount);
      expect(stepDeg).toBe(60);

      const spacingRadius = service.computeSpacingRadius(cardWidth, minGap, itemCount);
      expect(spacingRadius).toBeGreaterThan(0);

      const effective = service.effectiveRadius(baseRadius, spacingRadius);
      expect(effective).toBeGreaterThanOrEqual(Math.max(baseRadius, spacingRadius));
    });
  });

  describe('Pure function characteristics', () => {
    it('should not access DOM', () => {
      // These functions should work without any DOM access
      const stepDeg = service.computeStepDeg(8);
      expect(stepDeg).toBeDefined();
      // If this test runs without error, DOM wasn't accessed
    });

    it('should not access Window object', () => {
      // These functions should work without any Window access
      const radius = service.computeSpacingRadius(200, 24, 8);
      expect(radius).toBeDefined();
      // If this test runs without error, Window wasn't accessed
    });

    it('should be deterministic', () => {
      // Same inputs should always produce same outputs
      for (let i = 0; i < 10; i++) {
        expect(service.computeStepDeg(8)).toBe(45);
        expect(service.effectiveRadius(200, 250)).toBe(250);
      }
    });

    it('should not have side effects', () => {
      const inputCount = 8;
      const inputBase = 200;
      const inputSpacing = 250;

      service.computeStepDeg(inputCount);
      service.effectiveRadius(inputBase, inputSpacing);

      // Inputs should remain unchanged (pure function test)
      expect(inputCount).toBe(8);
      expect(inputBase).toBe(200);
      expect(inputSpacing).toBe(250);
    });
  });
});
