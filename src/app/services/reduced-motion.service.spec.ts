/**
 * ReducedMotionService Tests
 * Tests for motion preference detection with matchMedia mocks
 * Ensures no memory leaks and proper cleanup
 */

import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ReducedMotionService } from './reduced-motion.service';

describe('ReducedMotionService', () => {
  let service: ReducedMotionService;
  let mockMediaQueryList: jasmine.SpyObj<MediaQueryList>;
  let mockMatchMedia: jasmine.Spy;
  let eventListeners: Map<string, EventListener[]>;

  function createMockMediaQueryList(matches: boolean): jasmine.SpyObj<MediaQueryList> {
    const mock = jasmine.createSpyObj<MediaQueryList>('MediaQueryList', 
      ['addEventListener', 'removeEventListener']
    );
    
    Object.defineProperty(mock, 'matches', {
      value: matches,
      writable: false,
      configurable: true
    });

    // Track addEventListener calls
    mock.addEventListener.and.callFake((event: string, listener: EventListener) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event)!.push(listener);
    });

    // Track removeEventListener calls
    mock.removeEventListener.and.callFake((event: string, listener: EventListener) => {
      if (eventListeners.has(event)) {
        const listeners = eventListeners.get(event)!;
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    });

    return mock;
  }

  beforeEach(() => {
    // Track event listeners to verify cleanup
    eventListeners = new Map<string, EventListener[]>();

    // Create mock MediaQueryList with default value
    mockMediaQueryList = createMockMediaQueryList(false);

    // Mock window.matchMedia
    mockMatchMedia = jasmine.createSpy('matchMedia').and.returnValue(mockMediaQueryList);
    
    // Set up browser environment
    TestBed.configureTestingModule({
      providers: [
        ReducedMotionService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    // Replace window.matchMedia
    (window as any).matchMedia = mockMatchMedia;
  });

  afterEach(() => {
    // Clean up
    service?.ngOnDestroy();
    eventListeners.clear();
  });

  it('should be created', () => {
    service = TestBed.inject(ReducedMotionService);
    expect(service).toBeTruthy();
  });

  it('should call matchMedia with correct query on initialization', () => {
    service = TestBed.inject(ReducedMotionService);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should set initial value based on matchMedia result', (done) => {
    mockMediaQueryList = createMockMediaQueryList(true);
    mockMatchMedia.and.returnValue(mockMediaQueryList);
    service = TestBed.inject(ReducedMotionService);
    
    service.getPrefersReducedMotion().subscribe(value => {
      expect(value).toBe(true);
      done();
    });
  });

  it('should return false when reduced motion is not preferred', (done) => {
    mockMediaQueryList = createMockMediaQueryList(false);
    mockMatchMedia.and.returnValue(mockMediaQueryList);
    service = TestBed.inject(ReducedMotionService);
    
    service.getPrefersReducedMotion().subscribe(value => {
      expect(value).toBe(false);
      done();
    });
  });

  it('should return current preference synchronously', () => {
    mockMediaQueryList = createMockMediaQueryList(true);
    mockMatchMedia.and.returnValue(mockMediaQueryList);
    service = TestBed.inject(ReducedMotionService);
    
    expect(service.getCurrentPreference()).toBe(true);
  });

  it('should emit changes when media query changes', (done) => {
    mockMediaQueryList = createMockMediaQueryList(false);
    mockMatchMedia.and.returnValue(mockMediaQueryList);
    service = TestBed.inject(ReducedMotionService);
    
    const values: boolean[] = [];
    service.getPrefersReducedMotion().subscribe(value => {
      values.push(value);
      
      if (values.length === 2) {
        expect(values[0]).toBe(false); // Initial value
        expect(values[1]).toBe(true);  // Changed value
        done();
      }
    });

    // Simulate media query change
    const changeListeners = eventListeners.get('change');
    expect(changeListeners).toBeDefined();
    expect(changeListeners!.length).toBe(1);
    
    // Trigger change event
    const changeEvent = new Event('change') as MediaQueryListEvent;
    Object.defineProperty(changeEvent, 'matches', { value: true });
    changeListeners![0](changeEvent);
  });

  it('should add event listener for media query changes', () => {
    service = TestBed.inject(ReducedMotionService);
    
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      'change',
      jasmine.any(Function)
    );
    
    const changeListeners = eventListeners.get('change');
    expect(changeListeners).toBeDefined();
    expect(changeListeners!.length).toBe(1);
  });

  it('should remove event listener on destroy', () => {
    service = TestBed.inject(ReducedMotionService);
    
    const changeListeners = eventListeners.get('change');
    expect(changeListeners!.length).toBe(1);
    const listener = changeListeners![0];
    
    service.ngOnDestroy();
    
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalledWith('change', listener);
    expect(changeListeners!.length).toBe(0);
  });

  it('should complete observable on destroy', (done) => {
    service = TestBed.inject(ReducedMotionService);
    
    let completed = false;
    service.getPrefersReducedMotion().subscribe({
      next: () => {},
      complete: () => {
        completed = true;
        expect(completed).toBe(true);
        done();
      }
    });
    
    service.ngOnDestroy();
  });

  it('should not leak memory - verify listener cleanup', () => {
    service = TestBed.inject(ReducedMotionService);
    
    // Verify listener is added
    const changeListeners = eventListeners.get('change');
    expect(changeListeners!.length).toBe(1);
    
    // Destroy service
    service.ngOnDestroy();
    
    // Verify listener is removed
    expect(changeListeners!.length).toBe(0);
  });

  describe('Server-side rendering', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ReducedMotionService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
    });

    it('should default to reduced motion on server', (done) => {
      service = TestBed.inject(ReducedMotionService);
      
      service.getPrefersReducedMotion().subscribe(value => {
        expect(value).toBe(true);
        done();
      });
    });

    it('should not call matchMedia on server', () => {
      service = TestBed.inject(ReducedMotionService);
      expect(mockMatchMedia).not.toHaveBeenCalled();
    });

    it('should return true for current preference on server', () => {
      service = TestBed.inject(ReducedMotionService);
      expect(service.getCurrentPreference()).toBe(true);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ReducedMotionService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });
    });

    it('should handle matchMedia errors gracefully', (done) => {
      // Mock matchMedia to throw error
      mockMatchMedia.and.throwError('matchMedia not supported');
      spyOn(console, 'warn');
      
      service = TestBed.inject(ReducedMotionService);
      
      service.getPrefersReducedMotion().subscribe(value => {
        expect(value).toBe(false); // Default to false on error
        expect(console.warn).toHaveBeenCalledWith(
          'ReducedMotionService: Unable to detect motion preferences:',
          jasmine.any(Error)
        );
        done();
      });
    });

    it('should still work after matchMedia error', () => {
      mockMatchMedia.and.throwError('matchMedia not supported');
      spyOn(console, 'warn');
      
      service = TestBed.inject(ReducedMotionService);
      
      // Should still be able to get current preference
      expect(service.getCurrentPreference()).toBe(false);
      
      // Observable should still work
      let emittedValue: boolean | undefined;
      service.getPrefersReducedMotion().subscribe(value => {
        emittedValue = value;
      });
      expect(emittedValue).toBe(false);
    });
  });

  describe('Multiple subscriptions', () => {
    it('should support multiple subscribers', (done) => {
      mockMediaQueryList = createMockMediaQueryList(false);
      mockMatchMedia.and.returnValue(mockMediaQueryList);
      service = TestBed.inject(ReducedMotionService);
      
      let subscriber1Value: boolean | undefined;
      let subscriber2Value: boolean | undefined;
      let subscriber3Value: boolean | undefined;
      
      service.getPrefersReducedMotion().subscribe(value => {
        subscriber1Value = value;
      });
      
      service.getPrefersReducedMotion().subscribe(value => {
        subscriber2Value = value;
      });
      
      service.getPrefersReducedMotion().subscribe(value => {
        subscriber3Value = value;
        
        // All subscribers should receive the same value
        expect(subscriber1Value).toBe(false);
        expect(subscriber2Value).toBe(false);
        expect(subscriber3Value).toBe(false);
        done();
      });
    });

    it('should notify all subscribers on change', (done) => {
      mockMediaQueryList = createMockMediaQueryList(false);
      mockMatchMedia.and.returnValue(mockMediaQueryList);
      service = TestBed.inject(ReducedMotionService);
      
      const values1: boolean[] = [];
      const values2: boolean[] = [];
      
      service.getPrefersReducedMotion().subscribe(value => {
        values1.push(value);
      });
      
      service.getPrefersReducedMotion().subscribe(value => {
        values2.push(value);
        
        if (values2.length === 2) {
          expect(values1).toEqual([false, true]);
          expect(values2).toEqual([false, true]);
          done();
        }
      });
      
      // Trigger change
      const changeListeners = eventListeners.get('change');
      const changeEvent = new Event('change') as MediaQueryListEvent;
      Object.defineProperty(changeEvent, 'matches', { value: true });
      changeListeners![0](changeEvent);
    });
  });
});
