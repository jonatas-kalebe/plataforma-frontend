/**
 * Comprehensive Unit Tests for Addictive Scroll Experience Design
 * Tests every pixel, timing, threshold, and interaction as specified in the design document
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ScrollOrchestrationService } from './scroll-orchestration.service';
import { PLATFORM_ID } from '@angular/core';

// Mock GSAP and ScrollTrigger
const mockScrollTrigger = {
  create: jasmine.createSpy('create'),
  getAll: jasmine.createSpy('getAll').and.returnValue([]),
  refresh: jasmine.createSpy('refresh'),
  killAll: jasmine.createSpy('killAll'),
  getById: jasmine.createSpy('getById'),
  getVelocity: jasmine.createSpy('getVelocity').and.returnValue(0)
};

const mockGsap = {
  registerPlugin: jasmine.createSpy('registerPlugin'),
  to: jasmine.createSpy('to').and.returnValue({ kill: jasmine.createSpy('kill') }),
  set: jasmine.createSpy('set'),
  timeline: jasmine.createSpy('timeline').and.returnValue({
    to: jasmine.createSpy('to'),
    set: jasmine.createSpy('set'),
    progress: jasmine.createSpy('progress'),
    kill: jasmine.createSpy('kill')
  })
};

// Mock DOM elements for sections
const createMockSection = (id: string, offsetTop: number = 0) => {
  const element = document.createElement('section');
  element.id = id;
  element.style.height = '100vh';
  Object.defineProperty(element, 'offsetTop', { value: offsetTop, writable: true });
  Object.defineProperty(element, 'offsetHeight', { value: window.innerHeight || 768, writable: true });
  document.body.appendChild(element);
  return element;
};

describe('ScrollOrchestrationService - Comprehensive Addictive Scroll Tests', () => {
  let service: ScrollOrchestrationService;
  let mockSections: { [key: string]: HTMLElement };
  
  beforeEach(() => {
    // Setup mock window dimensions
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    
    // Setup mock GSAP
    (window as any).gsap = mockGsap;
    (window as any).ScrollTrigger = mockScrollTrigger;

    // Clear DOM
    document.body.innerHTML = '';
    
    // Create mock sections as specified in design
    mockSections = {
      hero: createMockSection('hero', 0),
      filosofia: createMockSection('filosofia', 768),
      servicos: createMockSection('servicos', 1536),
      trabalhos: createMockSection('trabalhos', 2304),
      cta: createMockSection('cta', 3072)
    };

    TestBed.configureTestingModule({
      providers: [
        ScrollOrchestrationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(ScrollOrchestrationService);
    
    // Reset spies
    mockScrollTrigger.create.calls.reset();
    mockGsap.registerPlugin.calls.reset();
    mockGsap.to.calls.reset();
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    service.destroy();
  });

  describe('Initialization and Plugin Setup', () => {
    it('should register GSAP plugins correctly', () => {
      service.initialize();
      
      expect(mockGsap.registerPlugin).toHaveBeenCalledWith(
        mockScrollTrigger, 
        jasmine.any(Object) // ScrollToPlugin
      );
    });

    it('should create ScrollTriggers for all 5 sections exactly', () => {
      service.initialize();
      
      // Should create triggers for: hero, filosofia, servicos, trabalhos, cta + global
      expect(mockScrollTrigger.create).toHaveBeenCalledTimes(6);
    });

    it('should setup global progress tracker with correct configuration', () => {
      service.initialize();
      
      const calls = mockScrollTrigger.create.calls.all();
      const globalTrigger = calls.find(call => 
        call.args[0].trigger === document.body && call.args[0].id === 'global-progress'
      );
      
      expect(globalTrigger).toBeDefined();
      expect(globalTrigger?.args[0]).toEqual(jasmine.objectContaining({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        id: 'global-progress'
      }));
    });
  });

  describe('Magnetic Scroll Snapping - Core Behavior', () => {
    let globalOnUpdate: any;
    
    beforeEach(() => {
      service.initialize();
      
      // Get the global onUpdate callback
      const globalCall = mockScrollTrigger.create.calls.all()
        .find(call => call.args[0].id === 'global-progress');
      globalOnUpdate = globalCall?.args[0].onUpdate;
      expect(globalOnUpdate).toBeDefined();
    });

    describe('85% Forward Snap Threshold', () => {
      it('should snap forward when progress >= 85% and velocity is zero', fakeAsync(() => {
        // Setup active section at 85% progress
        const mockTrigger = { 
          progress: 0.85, 
          direction: 1, 
          vars: { id: 'hero' } 
        };
        (service as any).activeSectionTrigger = mockTrigger;
        mockScrollTrigger.getVelocity.and.returnValue(0);

        // Trigger the snap check
        globalOnUpdate({ progress: 0.5 });
        tick(100);

        expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
          scrollTo: { y: mockSections.filosofia.offsetTop, autoKill: false },
          ease: 'power2.inOut',
          duration: 0.8
        }));
      }));

      it('should snap forward when progress > 85%', fakeAsync(() => {
        const mockTrigger = { 
          progress: 0.87, 
          direction: 1, 
          vars: { id: 'filosofia' } 
        };
        (service as any).activeSectionTrigger = mockTrigger;
        mockScrollTrigger.getVelocity.and.returnValue(0);

        globalOnUpdate({ progress: 0.6 });
        tick(100);

        expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
          scrollTo: { y: mockSections.servicos.offsetTop, autoKill: false }
        }));
      }));

      it('should NOT snap if velocity is not zero (user still scrolling)', fakeAsync(() => {
        const mockTrigger = { 
          progress: 0.9, 
          direction: 1, 
          vars: { id: 'hero' } 
        };
        (service as any).activeSectionTrigger = mockTrigger;
        mockScrollTrigger.getVelocity.and.returnValue(500); // User still scrolling

        globalOnUpdate({ progress: 0.5 });
        tick(100);

        expect(mockGsap.to).not.toHaveBeenCalled();
      }));
    });

    describe('15% Backward Snap Threshold', () => {
      it('should snap backward when progress <= 15% and moving backward', fakeAsync(() => {
        const mockTrigger = { 
          progress: 0.15, 
          direction: -1, 
          vars: { id: 'filosofia' } 
        };
        (service as any).activeSectionTrigger = mockTrigger;
        mockScrollTrigger.getVelocity.and.returnValue(0);

        globalOnUpdate({ progress: 0.3 });
        tick(100);

        expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
          scrollTo: { y: mockSections.hero.offsetTop, autoKill: false },
          ease: 'power2.inOut'
        }));
      }));

      it('should snap backward when progress < 15%', fakeAsync(() => {
        const mockTrigger = { 
          progress: 0.12, 
          direction: -1, 
          vars: { id: 'servicos' } 
        };
        (service as any).activeSectionTrigger = mockTrigger;
        mockScrollTrigger.getVelocity.and.returnValue(0);

        globalOnUpdate({ progress: 0.4 });
        tick(100);

        expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
          scrollTo: { y: mockSections.filosofia.offsetTop, autoKill: false }
        }));
      }));
    });

    describe('No-Snap Zone (15% to 85%)', () => {
      it('should NOT snap when progress is between 15% and 85%', fakeAsync(() => {
        const testCases = [0.2, 0.3, 0.5, 0.7, 0.8, 0.84];
        
        testCases.forEach(progress => {
          mockGsap.to.calls.reset();
          
          const mockTrigger = { 
            progress, 
            direction: 1, 
            vars: { id: 'filosofia' } 
          };
          (service as any).activeSectionTrigger = mockTrigger;
          mockScrollTrigger.getVelocity.and.returnValue(0);

          globalOnUpdate({ progress: 0.4 });
          tick(100);

          expect(mockGsap.to).not.toHaveBeenCalled();
        });
      }));
    });

    describe('Easing and Duration Specifications', () => {
      it('should use exactly power2.inOut easing as specified', fakeAsync(() => {
        const mockTrigger = { 
          progress: 0.9, 
          direction: 1, 
          vars: { id: 'hero' } 
        };
        (service as any).activeSectionTrigger = mockTrigger;
        mockScrollTrigger.getVelocity.and.returnValue(0);

        globalOnUpdate({ progress: 0.5 });
        tick(100);

        expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
          ease: 'power2.inOut'
        }));
      }));

      it('should use 0.8 second duration for smooth transition', fakeAsync(() => {
        const mockTrigger = { 
          progress: 0.86, 
          direction: 1, 
          vars: { id: 'filosofia' } 
        };
        (service as any).activeSectionTrigger = mockTrigger;
        mockScrollTrigger.getVelocity.and.returnValue(0);

        globalOnUpdate({ progress: 0.6 });
        tick(100);

        expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
          duration: 0.8
        }));
      }));
    });
  });

  describe('Section Sequence Validation', () => {
    it('should correctly identify next section in sequence', () => {
      service.initialize();
      
      const getNextSection = (service as any).getNextSectionElement.bind(service);
      
      expect(getNextSection('hero')).toBe(mockSections.filosofia);
      expect(getNextSection('filosofia')).toBe(mockSections.servicos);
      expect(getNextSection('servicos')).toBe(mockSections.trabalhos);
      expect(getNextSection('trabalhos')).toBe(mockSections.cta);
      expect(getNextSection('cta')).toBe(null); // Last section
    });

    it('should correctly identify previous section in sequence', () => {
      service.initialize();
      
      const getPrevSection = (service as any).getPrevSectionElement.bind(service);
      
      expect(getPrevSection('filosofia')).toBe(mockSections.hero);
      expect(getPrevSection('servicos')).toBe(mockSections.filosofia);
      expect(getPrevSection('trabalhos')).toBe(mockSections.servicos);
      expect(getPrevSection('cta')).toBe(mockSections.trabalhos);
      expect(getPrevSection('hero')).toBe(null); // First section
    });
  });

  describe('Viewport Height Requirements', () => {
    it('should configure each section as 100vh as specified', () => {
      service.initialize();
      
      const sectionCalls = mockScrollTrigger.create.calls.all()
        .filter(call => call.args[0].id !== 'global-progress');
      
      sectionCalls.forEach(call => {
        const trigger = call.args[0];
        // Each section should span full viewport height
        expect(trigger.start).toBe('top bottom');
        expect(trigger.end).toBe('bottom top');
      });
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up ScrollTriggers on destroy', () => {
      service.initialize();
      
      service.destroy();
      
      expect(mockScrollTrigger.killAll).toHaveBeenCalled();
    });

    it('should handle multiple initialize calls safely', () => {
      service.initialize();
      service.initialize(); // Second call
      
      // Should not create duplicate triggers
      expect(mockScrollTrigger.create).toHaveBeenCalledTimes(6); // Not 12
    });
  });

  describe('Mobile Considerations', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      // Mock touch device
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    });

    it('should apply same thresholds on mobile as desktop', fakeAsync(() => {
      service.initialize();
      
      const globalCall = mockScrollTrigger.create.calls.all()
        .find(call => call.args[0].id === 'global-progress');
      const globalOnUpdate = globalCall?.args[0].onUpdate;
      
      const mockTrigger = { 
        progress: 0.85, 
        direction: 1, 
        vars: { id: 'hero' } 
      };
      (service as any).activeSectionTrigger = mockTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0);

      globalOnUpdate({ progress: 0.5 });
      tick(100);

      // Same behavior as desktop
      expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
        ease: 'power2.inOut',
        duration: 0.8
      }));
    }));
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing next section gracefully', fakeAsync(() => {
      // Remove the next section from DOM
      mockSections.filosofia.remove();
      
      service.initialize();
      
      const globalCall = mockScrollTrigger.create.calls.all()
        .find(call => call.args[0].id === 'global-progress');
      const globalOnUpdate = globalCall?.args[0].onUpdate;
      
      const mockTrigger = { 
        progress: 0.9, 
        direction: 1, 
        vars: { id: 'hero' } 
      };
      (service as any).activeSectionTrigger = mockTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0);

      // Should not throw error
      expect(() => {
        globalOnUpdate({ progress: 0.5 });
        tick(100);
      }).not.toThrow();
      
      // Should not attempt to scroll to missing section
      expect(mockGsap.to).not.toHaveBeenCalled();
    }));

    it('should handle trabalhos section specially (no snap from trabalhos)', fakeAsync(() => {
      service.initialize();
      
      const globalCall = mockScrollTrigger.create.calls.all()
        .find(call => call.args[0].id === 'global-progress');
      const globalOnUpdate = globalCall?.args[0].onUpdate;
      
      const mockTrigger = { 
        progress: 0.9, 
        direction: 1, 
        vars: { id: 'trabalhos' } 
      };
      (service as any).activeSectionTrigger = mockTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0);

      globalOnUpdate({ progress: 0.8 });
      tick(100);

      // Should not snap from trabalhos section as per design
      expect(mockGsap.to).not.toHaveBeenCalled();
    }));
  });
});