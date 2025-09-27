import { TestBed } from '@angular/core/testing';
import { GsapUtilsService } from './gsap-utils.service';
import { MotionPreferenceService } from '../../shared/utils';

describe('GsapUtilsService', () => {
  let service: GsapUtilsService;
  let motionService: jasmine.SpyObj<MotionPreferenceService>;

  beforeEach(() => {
    const motionSpy = jasmine.createSpyObj('MotionPreferenceService', [
      'getAnimationDuration',
      'getGsapConfig'
    ], {
      currentPreference: false
    });

    TestBed.configureTestingModule({
      providers: [
        GsapUtilsService,
        { provide: MotionPreferenceService, useValue: motionSpy }
      ]
    });

    service = TestBed.inject(GsapUtilsService);
    motionService = TestBed.inject(MotionPreferenceService) as jasmine.SpyObj<MotionPreferenceService>;
    
    // Setup default mock returns
    motionService.getAnimationDuration.and.returnValue(0.3);
    motionService.getGsapConfig.and.returnValue({ duration: 0.3, ease: 'power2.out' });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if GSAP is ready', () => {
    expect(typeof service.isReady).toBe('boolean');
  });

  it('should create timeline', () => {
    const timeline = service.createTimeline();
    expect(timeline).toBeDefined();
  });

  it('should create scroll trigger with default options', () => {
    const mockElement = document.createElement('div');
    mockElement.id = 'test';
    document.body.appendChild(mockElement);

    const scrollTrigger = service.createScrollTrigger({
      trigger: '#test'
    });

    if (scrollTrigger) {
      expect(scrollTrigger).toBeDefined();
      scrollTrigger.kill();
    }

    document.body.removeChild(mockElement);
  });

  it('should animate to with motion preferences', () => {
    const mockElement = document.createElement('div');
    
    const tween = service.animateTo(mockElement, {
      duration: 1,
      ease: 'power2.out'
    });

    expect(tween).toBeDefined();
    expect(motionService.getGsapConfig).toHaveBeenCalled();
    
    tween.kill();
  });

  it('should animate from with motion preferences', () => {
    const mockElement = document.createElement('div');
    
    const tween = service.animateFrom(mockElement, {
      duration: 1,
      ease: 'power2.out'
    });

    expect(tween).toBeDefined();
    expect(motionService.getGsapConfig).toHaveBeenCalled();
    
    tween.kill();
  });

  it('should create staggered animation', () => {
    const mockElements = [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div')
    ];
    
    const tween = service.staggerAnimation(mockElements, {
      duration: 0.5
    });

    expect(tween).toBeDefined();
    
    tween.kill();
  });

  it('should set immediate values', () => {
    const mockElement = document.createElement('div');
    
    const tween = service.set(mockElement, {
      opacity: 0,
      x: 100
    });

    expect(tween).toBeDefined();
    
    tween.kill();
  });

  it('should kill animations for target', () => {
    const mockElement = document.createElement('div');
    
    // Create animation first
    service.animateTo(mockElement, { duration: 1 });
    
    // Kill it
    service.killAnimations(mockElement);
    
    // Should not throw error
    expect(true).toBe(true);
  });

  it('should kill all animations', () => {
    const mockElement1 = document.createElement('div');
    const mockElement2 = document.createElement('div');
    
    // Create animations
    service.animateTo(mockElement1, { duration: 1 });
    service.animateTo(mockElement2, { duration: 1 });
    
    // Kill all
    service.killAnimations();
    
    // Should not throw error
    expect(true).toBe(true);
  });

  it('should cleanup on destroy', () => {
    spyOn(service, 'killAllScrollTriggers');
    spyOn(service, 'killAnimations');
    
    service.destroy();
    
    expect(service.killAllScrollTriggers).toHaveBeenCalled();
    expect(service.killAnimations).toHaveBeenCalled();
  });
});