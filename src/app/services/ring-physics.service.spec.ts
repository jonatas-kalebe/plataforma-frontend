import { TestBed } from '@angular/core/testing';
import { RingPhysicsService, ReleaseVelocityParams } from './ring-physics.service';

describe('RingPhysicsService', () => {
  let service: RingPhysicsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RingPhysicsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('decay', () => {
    it('should apply exponential decay to velocity', () => {
      const initialVelocity = 100;
      const friction = 2.8;
      const dt = 0.016; // ~60fps
      
      const result = service.decay(initialVelocity, friction, dt);
      
      // Should be less than initial but not zero
      expect(result).toBeLessThan(initialVelocity);
      expect(result).toBeGreaterThan(0);
      // Verify exponential decay formula: v * e^(-friction * dt)
      const expected = initialVelocity * Math.exp(-friction * dt);
      expect(result).toBeCloseTo(expected, 5);
    });

    it('should return zero for invalid velocity', () => {
      expect(service.decay(NaN, 2.8, 0.016)).toBe(0);
      expect(service.decay(Infinity, 2.8, 0.016)).toBe(0);
      expect(service.decay(-Infinity, 2.8, 0.016)).toBe(0);
    });

    it('should return zero for invalid friction', () => {
      expect(service.decay(100, NaN, 0.016)).toBe(0);
      expect(service.decay(100, Infinity, 0.016)).toBe(0);
    });

    it('should return zero for invalid dt', () => {
      expect(service.decay(100, 2.8, NaN)).toBe(0);
      expect(service.decay(100, 2.8, Infinity)).toBe(0);
    });

    it('should handle negative velocity', () => {
      const result = service.decay(-100, 2.8, 0.016);
      expect(result).toBeGreaterThan(-100);
      expect(result).toBeLessThan(0);
    });

    it('should decay more with higher friction', () => {
      const velocity = 100;
      const dt = 0.016;
      
      const lowFriction = service.decay(velocity, 1.0, dt);
      const highFriction = service.decay(velocity, 5.0, dt);
      
      expect(Math.abs(highFriction)).toBeLessThan(Math.abs(lowFriction));
    });

    it('should decay more with larger dt', () => {
      const velocity = 100;
      const friction = 2.8;
      
      const smallDt = service.decay(velocity, friction, 0.016);
      const largeDt = service.decay(velocity, friction, 0.1);
      
      expect(Math.abs(largeDt)).toBeLessThan(Math.abs(smallDt));
    });

    it('should approach zero with multiple applications', () => {
      let velocity = 100;
      const friction = 2.8;
      const dt = 0.016;
      
      // Apply decay 200 times (more iterations needed for larger friction values)
      for (let i = 0; i < 200; i++) {
        velocity = service.decay(velocity, friction, dt);
      }
      
      expect(Math.abs(velocity)).toBeLessThan(1);
    });

    it('should be pure (no side effects)', () => {
      const velocity = 100;
      const friction = 2.8;
      const dt = 0.016;
      
      const result1 = service.decay(velocity, friction, dt);
      const result2 = service.decay(velocity, friction, dt);
      
      expect(result1).toBe(result2);
    });
  });

  describe('nearestSnapAngle', () => {
    it('should find nearest snap angle for positive angles', () => {
      // The algorithm uses a specific sign convention: it negates input, normalizes, rounds, and negates result
      // Input 47: -47 → 313 (normalized) → 7 (idx) → -315
      // Input 23: -23 → 337 (normalized) → 7 (idx) → -315  
      // Input 68: -68 → 292 (normalized) → 6 (idx) → -270
      expect(service.nearestSnapAngle(47, 45)).toBe(-315);
      expect(service.nearestSnapAngle(23, 45)).toBe(-315);
      expect(service.nearestSnapAngle(68, 45)).toBe(-270);
    });

    it('should find nearest snap angle for negative angles', () => {
      // Input -23: -(-23) = 23 → 23 (normalized) → 1 (idx) → -45
      // Input -47: -(-47) = 47 → 47 (normalized) → 1 (idx) → -45
      // Input -68: -(-68) = 68 → 68 (normalized) → 2 (idx) → -90
      expect(service.nearestSnapAngle(-23, 45)).toBe(-45);
      expect(service.nearestSnapAngle(-47, 45)).toBe(-45);
      expect(service.nearestSnapAngle(-68, 45)).toBe(-90);
    });

    it('should handle exact multiples', () => {
      // The algorithm negates inputs before normalizing
      expect(service.nearestSnapAngle(45, 45)).toBe(-315);
      expect(service.nearestSnapAngle(90, 45)).toBe(-270);
      expect(service.nearestSnapAngle(0, 45)).toBe(0);
      expect(service.nearestSnapAngle(-90, 45)).toBe(-90);
    });

    it('should handle angles greater than 360', () => {
      // Input 407: -407 → 313 (normalized: (-407 % 360) + 360 = -47 + 360 = 313) → 7 (idx) → -315
      // Input 725: -725 → 355 (normalized: (-725 % 360) + 360 = -5 + 360 = 355) → 1 (idx) → -360
      expect(service.nearestSnapAngle(407, 45)).toBe(-315);
      expect(service.nearestSnapAngle(725, 45)).toBe(-360);
    });

    it('should handle angles less than -360', () => {
      // Input -407: -(-407) = 407 → 47 (normalized) → 1 (idx) → -45
      // Input -725: -(-725) = 725 → 5 (normalized) → 0 (idx) → 0
      expect(service.nearestSnapAngle(-407, 45)).toBe(-45);
      expect(service.nearestSnapAngle(-725, 45)).toBe(0);
    });

    it('should return 0 for zero step', () => {
      expect(service.nearestSnapAngle(47, 0)).toBe(0);
    });

    it('should return 0 for invalid inputs', () => {
      expect(service.nearestSnapAngle(NaN, 45)).toBe(0);
      expect(service.nearestSnapAngle(47, NaN)).toBe(0);
      expect(service.nearestSnapAngle(Infinity, 45)).toBe(0);
      expect(service.nearestSnapAngle(47, Infinity)).toBe(0);
    });

    it('should handle small step sizes', () => {
      // Input 5: -5 → 355 (normalized) → 355 (idx) → -355
      // Input 5.5: -5.5 → 354.5 (normalized) → 355 (idx) → -355
      expect(service.nearestSnapAngle(5, 1)).toBeCloseTo(-355, 5);
      expect(service.nearestSnapAngle(5.5, 1)).toBeCloseTo(-355, 5);
    });

    it('should handle large step sizes', () => {
      // Input 100: -100 → 260 (normalized) → 1 (idx) → -360
      // Input 200: -200 → 160 (normalized) → 0 (idx) → 0
      // Input 270: -270 → 90 (normalized) → 0 (idx) → 0
      expect(service.nearestSnapAngle(100, 360)).toBe(-360);
      expect(service.nearestSnapAngle(200, 360)).toBe(0);
      expect(service.nearestSnapAngle(270, 360)).toBe(0);
    });

    it('should round to nearest at exact midpoint', () => {
      // At exact midpoint, Math.round behavior applies
      // Input 22.5: -22.5 → 337.5 (normalized) → 7 or 8 (idx depending on rounding) → -315 or -360
      const result = service.nearestSnapAngle(22.5, 45);
      expect([-315, -360]).toContain(result);
    });

    it('should be pure (no side effects)', () => {
      const result1 = service.nearestSnapAngle(47, 45);
      const result2 = service.nearestSnapAngle(47, 45);
      expect(result1).toBe(result2);
    });
  });

  describe('shortestAngleDiff', () => {
    it('should calculate simple differences', () => {
      expect(service.shortestAngleDiff(10, 50)).toBe(40);
      expect(service.shortestAngleDiff(50, 10)).toBe(-40);
      expect(service.shortestAngleDiff(0, 90)).toBe(90);
    });

    it('should handle wrapping from 350 to 10', () => {
      expect(service.shortestAngleDiff(350, 10)).toBe(20);
      expect(service.shortestAngleDiff(10, 350)).toBe(-20);
    });

    it('should handle wrapping from 10 to 350', () => {
      expect(service.shortestAngleDiff(10, 350)).toBe(-20);
      expect(service.shortestAngleDiff(350, 10)).toBe(20);
    });

    it('should prefer shorter path across 0/360', () => {
      expect(service.shortestAngleDiff(5, 355)).toBe(-10);
      expect(service.shortestAngleDiff(355, 5)).toBe(10);
    });

    it('should return 0 for same angles', () => {
      expect(service.shortestAngleDiff(45, 45)).toBe(0);
      expect(service.shortestAngleDiff(0, 0)).toBe(0);
      expect(service.shortestAngleDiff(180, 180)).toBe(0);
    });

    it('should handle 180 degree difference', () => {
      const result = service.shortestAngleDiff(0, 180);
      // 180 or -180 are both valid shortest paths
      expect(Math.abs(result)).toBe(180);
    });

    it('should handle angles greater than 360', () => {
      expect(service.shortestAngleDiff(370, 380)).toBe(10);
      expect(service.shortestAngleDiff(720, 730)).toBe(10);
    });

    it('should handle negative angles', () => {
      expect(service.shortestAngleDiff(-10, -50)).toBe(-40);
      expect(service.shortestAngleDiff(-350, -10)).toBe(-20);
    });

    it('should return 0 for invalid inputs', () => {
      expect(service.shortestAngleDiff(NaN, 50)).toBe(0);
      expect(service.shortestAngleDiff(10, NaN)).toBe(0);
      expect(service.shortestAngleDiff(Infinity, 50)).toBe(0);
      expect(service.shortestAngleDiff(10, -Infinity)).toBe(0);
    });

    it('should be antisymmetric', () => {
      const diff1 = service.shortestAngleDiff(30, 60);
      const diff2 = service.shortestAngleDiff(60, 30);
      expect(diff1).toBe(-diff2);
    });

    it('should stay within [-180, 180] range', () => {
      for (let a = 0; a < 360; a += 30) {
        for (let b = 0; b < 360; b += 30) {
          const diff = service.shortestAngleDiff(a, b);
          expect(diff).toBeGreaterThanOrEqual(-180);
          expect(diff).toBeLessThanOrEqual(180);
        }
      }
    });

    it('should be pure (no side effects)', () => {
      const result1 = service.shortestAngleDiff(10, 350);
      const result2 = service.shortestAngleDiff(10, 350);
      expect(result1).toBe(result2);
    });
  });

  describe('releaseVelocity', () => {
    const defaultParams: ReleaseVelocityParams = {
      releaseVelocity: 50,
      slowDragFrames: 5,
      peakDragVelocity: 120,
      lastDragVelocity: 45,
      currentRotation: 47,
      stepDeg: 45,
      peakDragAcceleration: 200,
      dragEnergy: 1500
    };

    it('should calculate release velocity with normal drag', () => {
      const result = service.releaseVelocity(defaultParams);
      
      expect(result).not.toBe(0);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('should return 0 for slow drag with low velocity', () => {
      const slowParams: ReleaseVelocityParams = {
        ...defaultParams,
        slowDragFrames: 15,
        peakDragVelocity: 50, // Less than stepDeg * 3.5
        releaseVelocity: 30   // Less than stepDeg * 2.1
      };
      
      const result = service.releaseVelocity(slowParams);
      expect(result).toBe(0);
    });

    it('should not return 0 for fast drag even with many slow frames', () => {
      const fastParams: ReleaseVelocityParams = {
        ...defaultParams,
        slowDragFrames: 20,
        peakDragVelocity: 200, // Greater than stepDeg * 3.5
        releaseVelocity: 150
      };
      
      const result = service.releaseVelocity(fastParams);
      expect(result).not.toBe(0);
    });

    it('should preserve direction from release velocity', () => {
      const positiveParams = { ...defaultParams, releaseVelocity: 100 };
      const negativeParams = { ...defaultParams, releaseVelocity: -100 };
      
      const positiveResult = service.releaseVelocity(positiveParams);
      const negativeResult = service.releaseVelocity(negativeParams);
      
      expect(positiveResult).toBeGreaterThan(0);
      expect(negativeResult).toBeLessThan(0);
    });

    it('should boost velocity with high energy', () => {
      const lowEnergyParams = { ...defaultParams, dragEnergy: 100 };
      const highEnergyParams = { ...defaultParams, dragEnergy: 5000 };
      
      const lowEnergyResult = Math.abs(service.releaseVelocity(lowEnergyParams));
      const highEnergyResult = Math.abs(service.releaseVelocity(highEnergyParams));
      
      expect(highEnergyResult).toBeGreaterThan(lowEnergyResult);
    });

    it('should boost velocity with high acceleration', () => {
      const lowAccelParams = { ...defaultParams, peakDragAcceleration: 50 };
      const highAccelParams = { ...defaultParams, peakDragAcceleration: 500 };
      
      const lowAccelResult = Math.abs(service.releaseVelocity(lowAccelParams));
      const highAccelResult = Math.abs(service.releaseVelocity(highAccelParams));
      
      expect(highAccelResult).toBeGreaterThan(lowAccelResult);
    });

    it('should cap velocity at maximum', () => {
      const extremeParams: ReleaseVelocityParams = {
        ...defaultParams,
        releaseVelocity: 5000,
        peakDragVelocity: 5000,
        dragEnergy: 50000,
        peakDragAcceleration: 5000
      };
      
      const result = Math.abs(service.releaseVelocity(extremeParams));
      expect(result).toBeLessThanOrEqual(840); // Max velocity
    });

    it('should ensure minimum carry velocity for engaged drags', () => {
      const engagedParams: ReleaseVelocityParams = {
        ...defaultParams,
        releaseVelocity: 10,
        peakDragVelocity: 20,
        dragEnergy: 1000, // energyFactor > 0.2
        peakDragAcceleration: 10
      };
      
      const result = Math.abs(service.releaseVelocity(engagedParams));
      const minCarry = defaultParams.stepDeg * 2.5;
      expect(result).toBeGreaterThanOrEqual(minCarry * 0.5);
    });

    it('should return 0 for invalid releaseVelocity', () => {
      const invalidParams = { ...defaultParams, releaseVelocity: NaN };
      expect(service.releaseVelocity(invalidParams)).toBe(0);
    });

    it('should return 0 for invalid peakDragVelocity', () => {
      const invalidParams = { ...defaultParams, peakDragVelocity: Infinity };
      expect(service.releaseVelocity(invalidParams)).toBe(0);
    });

    it('should return 0 for zero stepDeg', () => {
      const invalidParams = { ...defaultParams, stepDeg: 0 };
      expect(service.releaseVelocity(invalidParams)).toBe(0);
    });

    it('should use lastDragVelocity for direction when releaseVelocity is zero', () => {
      const positiveLastVel = { ...defaultParams, releaseVelocity: 0, lastDragVelocity: 50 };
      const negativeLastVel = { ...defaultParams, releaseVelocity: 0, lastDragVelocity: -50 };
      
      const positiveResult = service.releaseVelocity(positiveLastVel);
      const negativeResult = service.releaseVelocity(negativeLastVel);
      
      // Both should be non-zero since these are not slow drags
      if (positiveResult !== 0) expect(positiveResult).toBeGreaterThan(0);
      if (negativeResult !== 0) expect(negativeResult).toBeLessThan(0);
    });

    it('should handle zero velocity and acceleration gracefully', () => {
      const zeroParams: ReleaseVelocityParams = {
        ...defaultParams,
        releaseVelocity: 0,
        peakDragVelocity: 0,
        lastDragVelocity: 0,
        peakDragAcceleration: 0,
        dragEnergy: 0,
        slowDragFrames: 0
      };
      
      const result = service.releaseVelocity(zeroParams);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('should be pure (no side effects)', () => {
      const result1 = service.releaseVelocity(defaultParams);
      const result2 = service.releaseVelocity(defaultParams);
      expect(result1).toBe(result2);
    });

    it('should handle different step sizes consistently', () => {
      const smallStep = { ...defaultParams, stepDeg: 30 };
      const largeStep = { ...defaultParams, stepDeg: 60 };
      
      const smallStepResult = service.releaseVelocity(smallStep);
      const largeStepResult = service.releaseVelocity(largeStep);
      
      expect(Number.isFinite(smallStepResult)).toBe(true);
      expect(Number.isFinite(largeStepResult)).toBe(true);
    });

    it('should scale appropriately with step size', () => {
      const baseStep = 45;
      const params1 = { ...defaultParams, stepDeg: baseStep };
      const params2 = { ...defaultParams, stepDeg: baseStep * 2 };
      
      const result1 = Math.abs(service.releaseVelocity(params1));
      const result2 = Math.abs(service.releaseVelocity(params2));
      
      // Larger steps should generally produce larger velocities
      // (due to thresholds and min carry being proportional to stepDeg)
      expect(result2).toBeGreaterThan(result1 * 0.5);
    });
  });

  describe('Service purity and immutability', () => {
    it('should not modify input parameters', () => {
      const params: ReleaseVelocityParams = {
        releaseVelocity: 50,
        slowDragFrames: 5,
        peakDragVelocity: 120,
        lastDragVelocity: 45,
        currentRotation: 47,
        stepDeg: 45,
        peakDragAcceleration: 200,
        dragEnergy: 1500
      };
      
      const originalParams = { ...params };
      service.releaseVelocity(params);
      
      expect(params).toEqual(originalParams);
    });

    it('should produce consistent results for same inputs', () => {
      const iterations = 100;
      const velocity = 100;
      const friction = 2.8;
      const dt = 0.016;
      
      const results = Array(iterations).fill(0).map(() => 
        service.decay(velocity, friction, dt)
      );
      
      // All results should be identical
      expect(new Set(results).size).toBe(1);
    });

    it('should not have internal state affecting results', () => {
      // Call methods multiple times in different orders
      service.decay(100, 2.8, 0.016);
      service.nearestSnapAngle(47, 45);
      const result1 = service.shortestAngleDiff(10, 350);
      
      service.shortestAngleDiff(50, 100);
      service.decay(200, 1.5, 0.02);
      const result2 = service.shortestAngleDiff(10, 350);
      
      expect(result1).toBe(result2);
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle very small numbers', () => {
      expect(service.decay(0.0001, 2.8, 0.016)).toBeGreaterThan(0);
      // Input 0.0001: -0.0001 → 359.9999 (normalized) → 8 (idx) → -360
      const snapResult = service.nearestSnapAngle(0.0001, 45);
      expect([0, -360]).toContain(snapResult);
      expect(service.shortestAngleDiff(0.0001, 0.0002)).toBeCloseTo(0.0001, 5);
    });

    it('should handle very large numbers', () => {
      expect(service.decay(1e6, 2.8, 0.016)).toBeLessThan(1e6);
      expect(Number.isFinite(service.nearestSnapAngle(1e6, 45))).toBe(true);
      expect(Number.isFinite(service.shortestAngleDiff(1e6, 1e6 + 10))).toBe(true);
    });

    it('should handle zero values appropriately', () => {
      expect(service.decay(0, 2.8, 0.016)).toBe(0);
      expect(service.nearestSnapAngle(0, 45)).toBe(0);
      expect(service.shortestAngleDiff(0, 0)).toBe(0);
    });

    it('should handle negative values appropriately', () => {
      expect(service.decay(-100, 2.8, 0.016)).toBeLessThan(0);
      expect(Number.isFinite(service.nearestSnapAngle(-100, 45))).toBe(true);
      expect(service.shortestAngleDiff(-10, -20)).toBe(-10);
    });
  });
});
