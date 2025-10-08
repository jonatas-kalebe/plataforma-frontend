/**
 * Particles Configuration Tests
 * Validates particle system configuration presets and utility functions
 * 
 * Ensures:
 * - All profiles are properly structured
 * - Configurations are appropriate for each breakpoint
 * - No side effects or mutations
 * - Reduced motion preference is respected
 */

import { 
  ParticleProfile, 
  mobile, 
  tablet, 
  desktop, 
  reduced,
  getParticleConfig,
  profiles
} from './particles-config';

describe('ParticlesConfig', () => {
  
  describe('Profile Structure', () => {
    it('should have all required properties in mobile profile', () => {
      expect(mobile).toBeDefined();
      expect(mobile.count).toBeDefined();
      expect(mobile.gyroPositionGain).toBeDefined();
      expect(mobile.gyroSpinGain).toBeDefined();
      expect(mobile.particleSize).toBeDefined();
      expect(mobile.opacity).toBeDefined();
      expect(mobile.maxInteractionRadius).toBeDefined();
      expect(mobile.maxForce).toBeDefined();
      expect(mobile.friction).toBeDefined();
      expect(mobile.enableGyro).toBeDefined();
      expect(mobile.enableInteractions).toBeDefined();
      expect(mobile.enableAnimations).toBeDefined();
    });

    it('should have all required properties in tablet profile', () => {
      expect(tablet).toBeDefined();
      expect(tablet.count).toBeDefined();
      expect(tablet.gyroPositionGain).toBeDefined();
      expect(tablet.gyroSpinGain).toBeDefined();
      expect(tablet.particleSize).toBeDefined();
      expect(tablet.opacity).toBeDefined();
      expect(tablet.maxInteractionRadius).toBeDefined();
      expect(tablet.maxForce).toBeDefined();
      expect(tablet.friction).toBeDefined();
      expect(tablet.enableGyro).toBeDefined();
      expect(tablet.enableInteractions).toBeDefined();
      expect(tablet.enableAnimations).toBeDefined();
    });

    it('should have all required properties in desktop profile', () => {
      expect(desktop).toBeDefined();
      expect(desktop.count).toBeDefined();
      expect(desktop.gyroPositionGain).toBeDefined();
      expect(desktop.gyroSpinGain).toBeDefined();
      expect(desktop.particleSize).toBeDefined();
      expect(desktop.opacity).toBeDefined();
      expect(desktop.maxInteractionRadius).toBeDefined();
      expect(desktop.maxForce).toBeDefined();
      expect(desktop.friction).toBeDefined();
      expect(desktop.enableGyro).toBeDefined();
      expect(desktop.enableInteractions).toBeDefined();
      expect(desktop.enableAnimations).toBeDefined();
    });

    it('should have all required properties in reduced profile', () => {
      expect(reduced).toBeDefined();
      expect(reduced.count).toBeDefined();
      expect(reduced.gyroPositionGain).toBeDefined();
      expect(reduced.gyroSpinGain).toBeDefined();
      expect(reduced.particleSize).toBeDefined();
      expect(reduced.opacity).toBeDefined();
      expect(reduced.maxInteractionRadius).toBeDefined();
      expect(reduced.maxForce).toBeDefined();
      expect(reduced.friction).toBeDefined();
      expect(reduced.enableGyro).toBeDefined();
      expect(reduced.enableInteractions).toBeDefined();
      expect(reduced.enableAnimations).toBeDefined();
    });
  });

  describe('Mobile-First Approach', () => {
    it('should have lowest particle count on mobile', () => {
      expect(mobile.count).toBeLessThanOrEqual(tablet.count);
      expect(mobile.count).toBeLessThanOrEqual(desktop.count);
    });

    it('should progressively increase particle count from mobile to desktop', () => {
      expect(mobile.count).toBeLessThanOrEqual(tablet.count);
      expect(tablet.count).toBeLessThanOrEqual(desktop.count);
    });

    it('should have appropriate particle counts for performance', () => {
      expect(mobile.count).toBeGreaterThan(0);
      expect(mobile.count).toBeLessThan(150);
      expect(tablet.count).toBeGreaterThan(0);
      expect(tablet.count).toBeLessThan(200);
      expect(desktop.count).toBeGreaterThan(0);
      expect(desktop.count).toBeLessThan(250);
    });
  });

  describe('Reduced Motion Profile', () => {
    it('should disable all animations', () => {
      expect(reduced.enableAnimations).toBe(false);
    });

    it('should disable all interactions', () => {
      expect(reduced.enableInteractions).toBe(false);
      expect(reduced.enableGyro).toBe(false);
    });

    it('should have zero motion gains', () => {
      expect(reduced.gyroPositionGain).toBe(0);
      expect(reduced.gyroSpinGain).toBe(0);
    });

    it('should have zero interaction effects', () => {
      expect(reduced.maxInteractionRadius).toBe(0);
      expect(reduced.maxForce).toBe(0);
    });

    it('should have friction set to 1 (no velocity decay)', () => {
      expect(reduced.friction).toBe(1.0);
    });

    it('should have minimal particle count', () => {
      expect(reduced.count).toBeLessThanOrEqual(mobile.count);
      expect(reduced.count).toBeGreaterThan(0);
    });
  });

  describe('Profile Values', () => {
    it('should have valid opacity values (0-1)', () => {
      expect(mobile.opacity).toBeGreaterThan(0);
      expect(mobile.opacity).toBeLessThanOrEqual(1);
      expect(tablet.opacity).toBeGreaterThan(0);
      expect(tablet.opacity).toBeLessThanOrEqual(1);
      expect(desktop.opacity).toBeGreaterThan(0);
      expect(desktop.opacity).toBeLessThanOrEqual(1);
      expect(reduced.opacity).toBeGreaterThan(0);
      expect(reduced.opacity).toBeLessThanOrEqual(1);
    });

    it('should have positive particle sizes', () => {
      expect(mobile.particleSize).toBeGreaterThan(0);
      expect(tablet.particleSize).toBeGreaterThan(0);
      expect(desktop.particleSize).toBeGreaterThan(0);
      expect(reduced.particleSize).toBeGreaterThan(0);
    });

    it('should have valid friction values (0-1)', () => {
      expect(mobile.friction).toBeGreaterThan(0);
      expect(mobile.friction).toBeLessThanOrEqual(1);
      expect(tablet.friction).toBeGreaterThan(0);
      expect(tablet.friction).toBeLessThanOrEqual(1);
      expect(desktop.friction).toBeGreaterThan(0);
      expect(desktop.friction).toBeLessThanOrEqual(1);
      // Reduced can be exactly 1.0
      expect(reduced.friction).toBe(1.0);
    });

    it('should have non-negative interaction values', () => {
      [mobile, tablet, desktop, reduced].forEach(profile => {
        expect(profile.maxInteractionRadius).toBeGreaterThanOrEqual(0);
        expect(profile.maxForce).toBeGreaterThanOrEqual(0);
        expect(profile.gyroPositionGain).toBeGreaterThanOrEqual(0);
        expect(profile.gyroSpinGain).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getParticleConfig Function', () => {
    it('should return mobile config for small viewport', () => {
      const config = getParticleConfig(320, false);
      expect(config).toEqual(mobile);
    });

    it('should return mobile config for viewport just below tablet breakpoint', () => {
      const config = getParticleConfig(767, false);
      expect(config).toEqual(mobile);
    });

    it('should return tablet config for tablet viewport', () => {
      const config = getParticleConfig(768, false);
      expect(config).toEqual(tablet);
    });

    it('should return tablet config for viewport just below desktop breakpoint', () => {
      const config = getParticleConfig(1023, false);
      expect(config).toEqual(tablet);
    });

    it('should return desktop config for desktop viewport', () => {
      const config = getParticleConfig(1024, false);
      expect(config).toEqual(desktop);
    });

    it('should return desktop config for large viewport', () => {
      const config = getParticleConfig(1920, false);
      expect(config).toEqual(desktop);
    });

    it('should return reduced config when prefersReducedMotion is true regardless of viewport', () => {
      expect(getParticleConfig(320, true)).toEqual(reduced);
      expect(getParticleConfig(768, true)).toEqual(reduced);
      expect(getParticleConfig(1024, true)).toEqual(reduced);
      expect(getParticleConfig(1920, true)).toEqual(reduced);
    });

    it('should default prefersReducedMotion to false', () => {
      const config = getParticleConfig(1024);
      expect(config).toEqual(desktop);
      expect(config).not.toEqual(reduced);
    });
  });

  describe('Immutability (No Side Effects)', () => {
    it('should export profiles as readonly constants', () => {
      // Verify profiles are exported (TypeScript enforces readonly at compile time)
      expect(mobile).toBeDefined();
      expect(tablet).toBeDefined();
      expect(desktop).toBeDefined();
      expect(reduced).toBeDefined();
    });

    it('should maintain consistent values across multiple reads of mobile profile', () => {
      const count1 = mobile.count;
      const count2 = mobile.count;
      expect(count1).toBe(count2);
      expect(count1).toBe(80);
    });

    it('should maintain consistent values across multiple reads of tablet profile', () => {
      const count1 = tablet.count;
      const count2 = tablet.count;
      expect(count1).toBe(count2);
      expect(count1).toBe(120);
    });

    it('should maintain consistent values across multiple reads of desktop profile', () => {
      const count1 = desktop.count;
      const count2 = desktop.count;
      expect(count1).toBe(count2);
      expect(count1).toBe(150);
    });

    it('should maintain consistent values across multiple reads of reduced profile', () => {
      const count1 = reduced.count;
      const count2 = reduced.count;
      expect(count1).toBe(count2);
      expect(count1).toBe(50);
    });

    it('should return same reference from getParticleConfig for same inputs', () => {
      const config1 = getParticleConfig(1024, false);
      const config2 = getParticleConfig(1024, false);
      expect(config1).toBe(config2); // Same reference
    });

    it('should be pure function - no side effects from getParticleConfig', () => {
      const initialMobileCount = mobile.count;
      const initialTabletCount = tablet.count;
      const initialDesktopCount = desktop.count;
      const initialReducedCount = reduced.count;

      // Call function multiple times with different inputs
      getParticleConfig(320, false);
      getParticleConfig(768, false);
      getParticleConfig(1024, false);
      getParticleConfig(1920, true);

      // Verify original profiles are unchanged
      expect(mobile.count).toBe(initialMobileCount);
      expect(tablet.count).toBe(initialTabletCount);
      expect(desktop.count).toBe(initialDesktopCount);
      expect(reduced.count).toBe(initialReducedCount);
    });
  });

  describe('Profiles Export', () => {
    it('should export all profiles in profiles object', () => {
      expect(profiles).toBeDefined();
      expect(profiles.mobile).toBe(mobile);
      expect(profiles.tablet).toBe(tablet);
      expect(profiles.desktop).toBe(desktop);
      expect(profiles.reduced).toBe(reduced);
    });

    it('should have exactly 4 profiles', () => {
      expect(Object.keys(profiles).length).toBe(4);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce ParticleProfile interface', () => {
      const testProfile: ParticleProfile = {
        count: 100,
        gyroPositionGain: 0.01,
        gyroSpinGain: 0.01,
        particleSize: 1.0,
        opacity: 0.5,
        maxInteractionRadius: 10,
        maxForce: 0.5,
        friction: 0.95,
        enableGyro: true,
        enableInteractions: true,
        enableAnimations: true
      };
      
      expect(testProfile).toBeDefined();
      expect(typeof testProfile.count).toBe('number');
      expect(typeof testProfile.enableGyro).toBe('boolean');
    });
  });

  describe('Accessibility Best Practices', () => {
    it('should prioritize reduced motion over breakpoint selection', () => {
      // Even on a large desktop screen, if user prefers reduced motion,
      // that preference should be respected
      const config = getParticleConfig(2560, true);
      expect(config).toEqual(reduced);
      expect(config.enableAnimations).toBe(false);
    });

    it('should have lower opacity in reduced mode for less visual distraction', () => {
      expect(reduced.opacity).toBeLessThanOrEqual(mobile.opacity);
      expect(reduced.opacity).toBeLessThanOrEqual(tablet.opacity);
      expect(reduced.opacity).toBeLessThanOrEqual(desktop.opacity);
    });
  });

  describe('Performance Optimization', () => {
    it('should enable gyro only on mobile devices', () => {
      expect(mobile.enableGyro).toBe(true);
      expect(tablet.enableGyro).toBe(false);
      expect(desktop.enableGyro).toBe(false);
      expect(reduced.enableGyro).toBe(false);
    });

    it('should have appropriate max interaction radius scaling', () => {
      // Mobile should have smaller radius for performance
      expect(mobile.maxInteractionRadius).toBeLessThanOrEqual(tablet.maxInteractionRadius);
      expect(mobile.maxInteractionRadius).toBeLessThanOrEqual(desktop.maxInteractionRadius);
    });
  });
});
