/**
 * FeatureFlagsService Tests
 * Tests for feature flags configuration with defaults and overrides
 * Ensures safe defaults and proper override mechanism
 */

import { TestBed } from '@angular/core/testing';
import { FeatureFlagsService, FEATURE_FLAGS_CONFIG, FeatureFlagsConfig } from './feature-flags.service';
import { take } from 'rxjs/operators';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  describe('Default Configuration', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [FeatureFlagsService]
      });
      service = TestBed.inject(FeatureFlagsService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have all features enabled by default', () => {
      const flags = service.getFlags();
      
      expect(flags.ring3d).toBe(true);
      expect(flags.particles).toBe(true);
      expect(flags.haptics).toBe(true);
      expect(flags.listSnap).toBe(true);
    });

    it('should return immutable configuration from getFlags()', () => {
      const flags1 = service.getFlags();
      const flags2 = service.getFlags();
      
      expect(flags1).not.toBe(flags2); // Different objects
      expect(flags1).toEqual(flags2); // Same values
    });

    it('should emit flags via observable', (done) => {
      service.getFlags$().pipe(take(1)).subscribe(flags => {
        expect(flags.ring3d).toBe(true);
        expect(flags.particles).toBe(true);
        expect(flags.haptics).toBe(true);
        expect(flags.listSnap).toBe(true);
        done();
      });
    });

    it('should return true for isRing3dEnabled()', () => {
      expect(service.isRing3dEnabled()).toBe(true);
    });

    it('should return true for isParticlesEnabled()', () => {
      expect(service.isParticlesEnabled()).toBe(true);
    });

    it('should return true for isHapticsEnabled()', () => {
      expect(service.isHapticsEnabled()).toBe(true);
    });

    it('should return true for isListSnapEnabled()', () => {
      expect(service.isListSnapEnabled()).toBe(true);
    });

    it('should check feature by name', () => {
      expect(service.isFeatureEnabled('ring3d')).toBe(true);
      expect(service.isFeatureEnabled('particles')).toBe(true);
      expect(service.isFeatureEnabled('haptics')).toBe(true);
      expect(service.isFeatureEnabled('listSnap')).toBe(true);
    });
  });

  describe('Override Configuration', () => {
    describe('Single feature override', () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            FeatureFlagsService,
            {
              provide: FEATURE_FLAGS_CONFIG,
              useValue: { ring3d: false }
            }
          ]
        });
        service = TestBed.inject(FeatureFlagsService);
      });

      it('should override ring3d flag', () => {
        expect(service.isRing3dEnabled()).toBe(false);
      });

      it('should keep other flags at default', () => {
        expect(service.isParticlesEnabled()).toBe(true);
        expect(service.isHapticsEnabled()).toBe(true);
        expect(service.isListSnapEnabled()).toBe(true);
      });

      it('should reflect override in getFlags()', () => {
        const flags = service.getFlags();
        
        expect(flags.ring3d).toBe(false);
        expect(flags.particles).toBe(true);
        expect(flags.haptics).toBe(true);
        expect(flags.listSnap).toBe(true);
      });
    });

    describe('Multiple features override', () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            FeatureFlagsService,
            {
              provide: FEATURE_FLAGS_CONFIG,
              useValue: { 
                particles: false, 
                haptics: false 
              }
            }
          ]
        });
        service = TestBed.inject(FeatureFlagsService);
      });

      it('should override multiple flags', () => {
        expect(service.isParticlesEnabled()).toBe(false);
        expect(service.isHapticsEnabled()).toBe(false);
      });

      it('should keep non-overridden flags at default', () => {
        expect(service.isRing3dEnabled()).toBe(true);
        expect(service.isListSnapEnabled()).toBe(true);
      });
    });

    describe('All features disabled', () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            FeatureFlagsService,
            {
              provide: FEATURE_FLAGS_CONFIG,
              useValue: { 
                ring3d: false,
                particles: false,
                haptics: false,
                listSnap: false
              }
            }
          ]
        });
        service = TestBed.inject(FeatureFlagsService);
      });

      it('should disable all features', () => {
        expect(service.isRing3dEnabled()).toBe(false);
        expect(service.isParticlesEnabled()).toBe(false);
        expect(service.isHapticsEnabled()).toBe(false);
        expect(service.isListSnapEnabled()).toBe(false);
      });

      it('should reflect in getFlags()', () => {
        const flags = service.getFlags();
        
        expect(flags.ring3d).toBe(false);
        expect(flags.particles).toBe(false);
        expect(flags.haptics).toBe(false);
        expect(flags.listSnap).toBe(false);
      });

      it('should reflect in observable', (done) => {
        service.getFlags$().pipe(take(1)).subscribe(flags => {
          expect(flags.ring3d).toBe(false);
          expect(flags.particles).toBe(false);
          expect(flags.haptics).toBe(false);
          expect(flags.listSnap).toBe(false);
          done();
        });
      });
    });

    describe('Partial override with explicit true values', () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            FeatureFlagsService,
            {
              provide: FEATURE_FLAGS_CONFIG,
              useValue: { 
                ring3d: false,
                particles: true  // Explicitly true (same as default)
              }
            }
          ]
        });
        service = TestBed.inject(FeatureFlagsService);
      });

      it('should respect explicitly true override', () => {
        expect(service.isRing3dEnabled()).toBe(false);
        expect(service.isParticlesEnabled()).toBe(true);
      });
    });

    describe('Empty override', () => {
      beforeEach(() => {
        TestBed.configureTestingModule({
          providers: [
            FeatureFlagsService,
            {
              provide: FEATURE_FLAGS_CONFIG,
              useValue: {}
            }
          ]
        });
        service = TestBed.inject(FeatureFlagsService);
      });

      it('should use all defaults with empty override', () => {
        const flags = service.getFlags();
        
        expect(flags.ring3d).toBe(true);
        expect(flags.particles).toBe(true);
        expect(flags.haptics).toBe(true);
        expect(flags.listSnap).toBe(true);
      });
    });
  });

  describe('API Consistency', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          FeatureFlagsService,
          {
            provide: FEATURE_FLAGS_CONFIG,
            useValue: { ring3d: false, particles: false }
          }
        ]
      });
      service = TestBed.inject(FeatureFlagsService);
    });

    it('should have consistent results across different API methods', () => {
      const flags = service.getFlags();
      
      expect(service.isRing3dEnabled()).toBe(flags.ring3d);
      expect(service.isParticlesEnabled()).toBe(flags.particles);
      expect(service.isHapticsEnabled()).toBe(flags.haptics);
      expect(service.isListSnapEnabled()).toBe(flags.listSnap);
    });

    it('should match isFeatureEnabled() with specific methods', () => {
      expect(service.isFeatureEnabled('ring3d')).toBe(service.isRing3dEnabled());
      expect(service.isFeatureEnabled('particles')).toBe(service.isParticlesEnabled());
      expect(service.isFeatureEnabled('haptics')).toBe(service.isHapticsEnabled());
      expect(service.isFeatureEnabled('listSnap')).toBe(service.isListSnapEnabled());
    });

    it('should have observable values match synchronous values', (done) => {
      const syncFlags = service.getFlags();
      
      service.getFlags$().pipe(take(1)).subscribe(asyncFlags => {
        expect(asyncFlags).toEqual(syncFlags);
        done();
      });
    });
  });

  describe('Type Safety', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [FeatureFlagsService]
      });
      service = TestBed.inject(FeatureFlagsService);
    });

    it('should accept valid feature names in isFeatureEnabled()', () => {
      // These should compile and work
      expect(() => service.isFeatureEnabled('ring3d')).not.toThrow();
      expect(() => service.isFeatureEnabled('particles')).not.toThrow();
      expect(() => service.isFeatureEnabled('haptics')).not.toThrow();
      expect(() => service.isFeatureEnabled('listSnap')).not.toThrow();
    });

    it('should return readonly configuration', () => {
      const flags = service.getFlags();
      
      // TypeScript should prevent this at compile time
      // At runtime, modifying the returned object shouldn't affect service state
      (flags as any).ring3d = false;
      
      // Service should still return original values
      expect(service.isRing3dEnabled()).toBe(true);
    });
  });
});
