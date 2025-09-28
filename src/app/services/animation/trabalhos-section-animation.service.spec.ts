import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { TrabalhosSectionAnimationService } from './trabalhos-section-animation.service';

describe('TrabalhosSectionAnimationService', () => {
  let service: TrabalhosSectionAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrabalhosSectionAnimationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(TrabalhosSectionAnimationService);

    // Mock GSAP and ScrollTrigger
    (window as any).gsap = {
      set: jasmine.createSpy('set'),
      to: jasmine.createSpy('to'),
      killTweensOf: jasmine.createSpy('killTweensOf'),
      timeline: jasmine.createSpy('timeline').and.returnValue({
        to: jasmine.createSpy('to'),
        play: jasmine.createSpy('play'),
        kill: jasmine.createSpy('kill')
      })
    };

    (window as any).ScrollTrigger = {
      create: jasmine.createSpy('create').and.returnValue({
        kill: jasmine.createSpy('kill')
      })
    };

    // Mock DOM elements
    spyOn(document, 'querySelector').and.returnValue({
      addEventListener: jasmine.createSpy('addEventListener')
    } as any);
    
    spyOn(document, 'querySelectorAll').and.returnValue([
      { classList: { add: jasmine.createSpy(), remove: jasmine.createSpy() } } as any,
      { classList: { add: jasmine.createSpy(), remove: jasmine.createSpy() } } as any
    ] as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create pinned section', () => {
    service.createPinnedSection();
    
    expect((window as any).ScrollTrigger.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        trigger: '#trabalhos',
        pin: true,
        pinSpacing: true,
        scrub: true
      })
    );
  });

  it('should create ring entrance animation', () => {
    service.createRingEntrance();
    
    expect((window as any).gsap.set).toHaveBeenCalled();
    expect((window as any).gsap.timeline).toHaveBeenCalled();
    expect((window as any).ScrollTrigger.create).toHaveBeenCalled();
  });

  it('should enhance ring interactions', () => {
    const mockRingComponent = {
      ringRef: {
        nativeElement: {
          style: {},
          addEventListener: jasmine.createSpy('addEventListener')
        }
      },
      activeIndexChange: {
        emit: jasmine.createSpy('emit')
      }
    };
    
    service.enhanceRingInteractions(mockRingComponent);
    
    expect(mockRingComponent.ringRef.nativeElement.addEventListener).toHaveBeenCalledWith('mousedown', jasmine.any(Function));
    expect(mockRingComponent.ringRef.nativeElement.addEventListener).toHaveBeenCalledWith('mouseup', jasmine.any(Function));
  });

  it('should create exit transition', () => {
    service.createExitTransition();
    
    expect((window as any).ScrollTrigger.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        trigger: '#trabalhos',
        start: 'bottom 50%'
      })
    );
  });

  it('should return pinned state', () => {
    expect(service.getIsPinned()).toBe(false);
  });

  it('should destroy all animations', () => {
    const mockTrigger = {
      kill: jasmine.createSpy('kill')
    };
    
    // Simulate having triggers
    (service as any).scrollTriggers = [mockTrigger];
    
    service.destroy();
    
    expect(mockTrigger.kill).toHaveBeenCalled();
    expect(service.getIsPinned()).toBe(false);
  });

  it('should not create animations when prefers-reduced-motion is enabled', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy('matchMedia').and.returnValue({
        matches: true
      })
    });
    
    const newService = TestBed.inject(TrabalhosSectionAnimationService);
    
    newService.createPinnedSection();
    
    // Should not call ScrollTrigger methods when reduced motion is preferred
    expect((window as any).ScrollTrigger.create).not.toHaveBeenCalled();
  });
});