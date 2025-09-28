import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ServicosAnimationService } from './servicos-animation.service';

describe('ServicosAnimationService', () => {
  let service: ServicosAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServicosAnimationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ServicosAnimationService);

    // Mock GSAP and ScrollTrigger
    (window as any).gsap = {
      set: jasmine.createSpy('set'),
      to: jasmine.createSpy('to'),
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
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create staggered entrance animation', () => {
    const mockCards = [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div')
    ];
    
    service.createStaggeredEntrance(mockCards);
    
    expect((window as any).gsap.set).toHaveBeenCalled();
    expect((window as any).gsap.timeline).toHaveBeenCalled();
    expect((window as any).ScrollTrigger.create).toHaveBeenCalled();
  });

  it('should create parallax effect', () => {
    const mockCards = [
      document.createElement('div'),
      document.createElement('div')
    ];
    
    service.createParallaxEffect(mockCards);
    
    expect((window as any).ScrollTrigger.create).toHaveBeenCalled();
  });

  it('should create magnetic hover effects', () => {
    const mockCard = document.createElement('div');
    spyOn(mockCard, 'addEventListener');
    
    service.createMagneticHover([mockCard]);
    
    expect(mockCard.addEventListener).toHaveBeenCalledWith('mouseenter', jasmine.any(Function));
    expect(mockCard.addEventListener).toHaveBeenCalledWith('mouseleave', jasmine.any(Function));
  });

  it('should destroy all animations', () => {
    const mockTimeline = {
      kill: jasmine.createSpy('kill')
    };
    const mockTrigger = {
      kill: jasmine.createSpy('kill')
    };
    
    // Simulate having animations
    (service as any).animations = [mockTimeline];
    (service as any).scrollTriggers = [mockTrigger];
    
    service.destroy();
    
    expect(mockTimeline.kill).toHaveBeenCalled();
    expect(mockTrigger.kill).toHaveBeenCalled();
  });

  it('should not create animations when prefers-reduced-motion is enabled', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jasmine.createSpy('matchMedia').and.returnValue({
        matches: true
      })
    });
    
    const newService = TestBed.inject(ServicosAnimationService);
    const mockCards = [document.createElement('div')];
    
    newService.createStaggeredEntrance(mockCards);
    
    // Should not call GSAP methods when reduced motion is preferred
    expect((window as any).gsap.set).not.toHaveBeenCalled();
  });
});