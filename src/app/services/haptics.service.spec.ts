/**
 * HapticsService Tests
 * Tests for safe vibration feedback with feature detection
 * Ensures no side effects when Vibration API is unavailable
 */

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { HapticsService } from './haptics.service';

describe('HapticsService', () => {
  let service: HapticsService;
  let mockVibrate: jasmine.Spy;

  describe('Browser environment with Vibration API support', () => {
    beforeEach(() => {
      // Mock navigator.vibrate directly
      mockVibrate = jasmine.createSpy('vibrate').and.returnValue(true);
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
        configurable: true
      });

      TestBed.configureTestingModule({
        providers: [
          HapticsService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      service = TestBed.inject(HapticsService);
    });

    afterEach(() => {
      // Clean up mock
      delete (navigator as any).vibrate;
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should detect vibration support', () => {
      expect(service.isHapticsSupported()).toBe(true);
    });

    it('should vibrate with single duration', () => {
      const result = service.vibrate(50);
      
      expect(mockVibrate).toHaveBeenCalledWith(50);
      expect(result).toBe(true);
    });

    it('should vibrate with pattern array', () => {
      const pattern = [200, 100, 200];
      const result = service.vibrate(pattern);
      
      expect(mockVibrate).toHaveBeenCalledWith(pattern);
      expect(result).toBe(true);
    });

    it('should cancel vibration', () => {
      const result = service.cancel();
      
      expect(mockVibrate).toHaveBeenCalledWith(0);
      expect(result).toBe(true);
    });

    it('should handle navigator.vibrate returning false', () => {
      mockVibrate.and.returnValue(false);
      
      const result = service.vibrate(100);
      
      expect(mockVibrate).toHaveBeenCalledWith(100);
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      mockVibrate.and.throwError('Vibration not allowed');
      spyOn(console, 'warn');
      
      const result = service.vibrate(100);
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'HapticsService: Vibration request failed',
        jasmine.any(Error)
      );
    });

    it('should handle cancel errors gracefully', () => {
      mockVibrate.and.throwError('Vibration not allowed');
      spyOn(console, 'warn');
      
      const result = service.cancel();
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        'HapticsService: Vibration cancellation failed',
        jasmine.any(Error)
      );
    });

    it('should provide predefined patterns', () => {
      expect(service.patterns.light).toBe(50);
      expect(service.patterns.medium).toBe(100);
      expect(service.patterns.heavy).toBe(200);
      expect(service.patterns.doubleTap).toEqual([50, 100, 50]);
      expect(service.patterns.success).toEqual([100, 50, 100]);
      expect(service.patterns.error).toEqual([200, 100, 200, 100, 200]);
      expect(service.patterns.selection).toBe(30);
      expect(service.patterns.snap).toEqual([30, 20, 50]);
    });

    it('should work with predefined patterns', () => {
      service.vibrate(service.patterns.light);
      expect(mockVibrate).toHaveBeenCalledWith(50);
      
      mockVibrate.calls.reset();
      service.vibrate(service.patterns.snap);
      expect(mockVibrate).toHaveBeenCalledWith([30, 20, 50]);
    });

    it('should not have side effects on multiple calls', () => {
      service.vibrate(50);
      service.vibrate(100);
      service.cancel();
      
      expect(mockVibrate).toHaveBeenCalledTimes(3);
      expect(mockVibrate.calls.argsFor(0)).toEqual([50]);
      expect(mockVibrate.calls.argsFor(1)).toEqual([100]);
      expect(mockVibrate.calls.argsFor(2)).toEqual([0]);
    });
  });

  describe('Browser environment without Vibration API support', () => {
    beforeEach(() => {
      // Mock navigator.vibrate as undefined to simulate lack of support
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true
      });

      TestBed.configureTestingModule({
        providers: [
          HapticsService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      service = TestBed.inject(HapticsService);
    });

    afterEach(() => {
      delete (navigator as any).vibrate;
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should detect lack of vibration support', () => {
      expect(service.isHapticsSupported()).toBe(false);
    });

    it('should return false on vibrate call (no-op)', () => {
      const result = service.vibrate(50);
      expect(result).toBe(false);
    });

    it('should return false on cancel call (no-op)', () => {
      const result = service.cancel();
      expect(result).toBe(false);
    });

    it('should not throw errors when calling vibrate', () => {
      expect(() => service.vibrate(100)).not.toThrow();
      expect(() => service.vibrate([100, 50, 100])).not.toThrow();
    });

    it('should not throw errors when calling cancel', () => {
      expect(() => service.cancel()).not.toThrow();
    });
  });

  describe('Server-side rendering (SSR)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          HapticsService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      service = TestBed.inject(HapticsService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should detect lack of vibration support on server', () => {
      expect(service.isHapticsSupported()).toBe(false);
    });

    it('should return false on vibrate call (no-op)', () => {
      const result = service.vibrate(50);
      expect(result).toBe(false);
    });

    it('should return false on cancel call (no-op)', () => {
      const result = service.cancel();
      expect(result).toBe(false);
    });

    it('should not throw errors on server', () => {
      expect(() => service.vibrate(100)).not.toThrow();
      expect(() => service.cancel()).not.toThrow();
      expect(() => service.isHapticsSupported()).not.toThrow();
    });

    it('should not access navigator on server', () => {
      // This should not throw even if navigator is undefined
      expect(() => {
        service.vibrate(50);
        service.cancel();
      }).not.toThrow();
    });
  });

  describe('Pure function characteristics', () => {
    beforeEach(() => {
      mockVibrate = jasmine.createSpy('vibrate').and.returnValue(true);
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
        configurable: true
      });

      TestBed.configureTestingModule({
        providers: [
          HapticsService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      service = TestBed.inject(HapticsService);
    });

    afterEach(() => {
      delete (navigator as any).vibrate;
    });

    it('should not modify input parameters', () => {
      const pattern = [100, 50, 100];
      const originalPattern = [...pattern];
      
      service.vibrate(pattern);
      
      expect(pattern).toEqual(originalPattern);
    });

    it('should be deterministic for same inputs', () => {
      const results: boolean[] = [];
      
      for (let i = 0; i < 5; i++) {
        results.push(service.vibrate(50));
      }
      
      // All results should be the same
      expect(results.every(r => r === true)).toBe(true);
    });

    it('should support multiple independent instances', () => {
      const service2 = TestBed.inject(HapticsService);
      
      service.vibrate(50);
      service2.vibrate(100);
      
      // Both should work independently
      expect(mockVibrate).toHaveBeenCalledTimes(2);
      expect(mockVibrate.calls.argsFor(0)).toEqual([50]);
      expect(mockVibrate.calls.argsFor(1)).toEqual([100]);
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      mockVibrate = jasmine.createSpy('vibrate').and.returnValue(true);
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
        configurable: true
      });

      TestBed.configureTestingModule({
        providers: [
          HapticsService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      service = TestBed.inject(HapticsService);
    });

    afterEach(() => {
      delete (navigator as any).vibrate;
    });

    it('should handle zero duration', () => {
      const result = service.vibrate(0);
      
      expect(mockVibrate).toHaveBeenCalledWith(0);
      expect(result).toBe(true);
    });

    it('should handle empty pattern array', () => {
      const result = service.vibrate([]);
      
      expect(mockVibrate).toHaveBeenCalledWith([]);
      expect(result).toBe(true);
    });

    it('should handle very long duration', () => {
      const result = service.vibrate(10000);
      
      expect(mockVibrate).toHaveBeenCalledWith(10000);
      expect(result).toBe(true);
    });

    it('should handle complex patterns', () => {
      const pattern = [100, 50, 100, 50, 100, 50, 200];
      const result = service.vibrate(pattern);
      
      expect(mockVibrate).toHaveBeenCalledWith(pattern);
      expect(result).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      mockVibrate = jasmine.createSpy('vibrate').and.returnValue(true);
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
        configurable: true
      });

      TestBed.configureTestingModule({
        providers: [
          HapticsService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      service = TestBed.inject(HapticsService);
    });

    afterEach(() => {
      delete (navigator as any).vibrate;
    });

    it('should support drag feedback scenario', () => {
      // User starts dragging
      service.vibrate(service.patterns.light);
      
      // User continues dragging - no vibration
      
      // User releases (snap)
      service.vibrate(service.patterns.snap);
      
      expect(mockVibrate).toHaveBeenCalledTimes(2);
      // First call with light pattern (50)
      const firstCall = mockVibrate.calls.argsFor(0)[0];
      expect(firstCall).toBe(50);
      // Second call with snap pattern [30, 20, 50]
      const secondCall = mockVibrate.calls.argsFor(1)[0];
      expect(Array.isArray(secondCall)).toBe(true);
      expect(secondCall).toEqual([30, 20, 50]);
    });

    it('should support error feedback scenario', () => {
      // Show error feedback
      service.vibrate(service.patterns.error);
      
      expect(mockVibrate).toHaveBeenCalledWith([200, 100, 200, 100, 200]);
    });

    it('should support cancellation during long vibration', () => {
      // Start long vibration
      service.vibrate(5000);
      
      // Cancel it immediately
      service.cancel();
      
      expect(mockVibrate).toHaveBeenCalledTimes(2);
      expect(mockVibrate.calls.argsFor(0)).toEqual([5000]);
      expect(mockVibrate.calls.argsFor(1)).toEqual([0]);
    });
  });
});
