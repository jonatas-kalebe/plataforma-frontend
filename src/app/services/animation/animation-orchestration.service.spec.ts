import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AnimationOrchestrationService } from './animation-orchestration.service';

describe('AnimationOrchestrationService', () => {
  let service: AnimationOrchestrationService;

  describe('Browser Environment', () => {
    beforeEach(async () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
      service = TestBed.inject(AnimationOrchestrationService);
      await service.initialize();
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be initialized in browser', async () => {
      await service.initialize();
    it('should be initialized in browser', () => {
      expect(service.isReady()).toBe(true);
    });

    it('should expose gsap instance', async () => {
      await service.initialize();
      expect(service.gsap).toBeDefined();
    });

    it('should expose scrollTrigger instance', async () => {
      await service.initialize();
      expect(service.ScrollTrigger).toBeDefined();
    });

    it('should expose draggable instance', async () => {
      await service.initialize();
    it('should expose ScrollTrigger instance', () => {
      expect(service.ScrollTrigger).toBeDefined();
    });

    it('should expose Draggable instance', () => {
      expect(service.Draggable).toBeDefined();
    });

    it('should setup hero parallax without errors', async () => {
      await service.initialize();
      expect(() => service.setupHeroParallax('.test-hero')).not.toThrow();
    });

    it('should setup global scroll snap without errors', async () => {
      await service.initialize();
      expect(() => service.setupGlobalScrollSnap('.test-section')).not.toThrow();
    it('should setup global scroll snap without errors', () => {
      expect(() => service.setupGlobalScrollSnap('section')).not.toThrow();
    });

    it('should refresh scroll triggers without errors', async () => {
      await service.initialize();
      expect(() => service.refreshScrollTriggers()).not.toThrow();
    });

    it('should kill all animations without errors', async () => {
      await service.initialize();
    it('should kill all animations without errors', () => {
      expect(() => service.killAll()).not.toThrow();
    });
  });

  describe('Server Environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      service = TestBed.inject(AnimationOrchestrationService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should not be ready in server environment', () => {
      expect(service.isReady()).toBe(false);
    });

    it('should not throw when calling methods in server environment', () => {
      expect(() => service.setupHeroParallax('.test')).not.toThrow();
      expect(() => service.setupGlobalScrollSnap('.test-section')).not.toThrow();
      expect(() => service.setupGlobalScrollSnap('section')).not.toThrow();
      expect(() => service.refreshScrollTriggers()).not.toThrow();
      expect(() => service.killAll()).not.toThrow();
    });
  });
});
