import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { HeroAnimationService, HeroAnimationConfig } from './hero-animation.service';
import { GsapUtilsService } from './gsap-utils.service';
import { MotionPreferenceService } from '../../shared/utils';

describe('HeroAnimationService', () => {
  let service: HeroAnimationService;
  let gsapUtils: jasmine.SpyObj<GsapUtilsService>;
  let motionService: jasmine.SpyObj<MotionPreferenceService>;

  beforeEach(() => {
    const gsapSpy = jasmine.createSpyObj('GsapUtilsService', [
      'createTimeline',
      'createScrollTrigger',
      'set',
      'animateTo',
      'killAnimations',
      'staggerAnimation',
      'isReady'
    ]);
    const motionSpy = jasmine.createSpyObj('MotionPreferenceService', [
      'getAnimationDuration',
      'currentPreference'
    ]);

    TestBed.configureTestingModule({
      providers: [
        HeroAnimationService,
        { provide: GsapUtilsService, useValue: gsapSpy },
        { provide: MotionPreferenceService, useValue: motionSpy }
      ]
    });

    service = TestBed.inject(HeroAnimationService);
    gsapUtils = TestBed.inject(GsapUtilsService) as jasmine.SpyObj<GsapUtilsService>;
    motionService = TestBed.inject(MotionPreferenceService) as jasmine.SpyObj<MotionPreferenceService>;
    
    // Setup mocks
    const mockTimeline = {
      to: jasmine.createSpy('to').and.returnValue({}),
      progress: jasmine.createSpy('progress').and.returnValue(0),
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      reverse: jasmine.createSpy('reverse'),
      restart: jasmine.createSpy('restart'),
      isActive: jasmine.createSpy('isActive').and.returnValue(false),
      kill: jasmine.createSpy('kill')
    };
    
    gsapUtils.createTimeline.and.returnValue(mockTimeline as any);
    gsapUtils.createScrollTrigger.and.returnValue(null);
    gsapUtils.set.and.returnValue({} as any);
    gsapUtils.animateTo.and.returnValue({} as any);
    gsapUtils.staggerAnimation.and.returnValue({} as any);
    gsapUtils.isReady = true;
    
    motionService.getAnimationDuration.and.returnValue(0.3);
    motionService.currentPreference = false;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize hero animations', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    
    service.initializeHeroAnimations(mockElementRef);
    
    expect(gsapUtils.createTimeline).toHaveBeenCalled();
    expect(gsapUtils.set).toHaveBeenCalled();
    expect(gsapUtils.createScrollTrigger).toHaveBeenCalled();
  });

  it('should initialize with custom config', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    const config: Partial<HeroAnimationConfig> = {
      titleDelay: 0.5,
      parallaxEnabled: false
    };
    
    service.initializeHeroAnimations(mockElementRef, config);
    
    expect(gsapUtils.createTimeline).toHaveBeenCalled();
  });

  it('should skip parallax when motion is reduced', () => {
    motionService.currentPreference = true;
    const mockElementRef = new ElementRef(document.createElement('div'));
    
    service.initializeHeroAnimations(mockElementRef, { parallaxEnabled: true });
    
    // Should still create timeline but not parallax scroll trigger
    expect(gsapUtils.createTimeline).toHaveBeenCalled();
  });

  it('should play hero animation', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    service.playHeroAnimation();
    
    expect(gsapUtils.createTimeline().play).toHaveBeenCalled();
  });

  it('should pause hero animation', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    service.pauseHeroAnimation();
    
    expect(gsapUtils.createTimeline().pause).toHaveBeenCalled();
  });

  it('should restart hero animation', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    service.restartHeroAnimation();
    
    expect(gsapUtils.createTimeline().restart).toHaveBeenCalled();
  });

  it('should reverse hero animation', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    service.reverseHeroAnimation();
    
    expect(gsapUtils.createTimeline().reverse).toHaveBeenCalled();
  });

  it('should create title reveal animation', () => {
    const titleElement = document.createElement('h1');
    titleElement.textContent = 'Test Title Words';
    
    service.createTitleRevealAnimation(titleElement);
    
    expect(gsapUtils.staggerAnimation).toHaveBeenCalled();
    expect(titleElement.innerHTML).toContain('<span class="word-reveal">');
  });

  it('should create floating animation', () => {
    const target = document.createElement('div');
    
    service.createFloatingAnimation(target);
    
    expect(gsapUtils.animateTo).toHaveBeenCalled();
  });

  it('should skip floating animation for reduced motion', () => {
    motionService.currentPreference = true;
    const target = document.createElement('div');
    
    service.createFloatingAnimation(target);
    
    expect(gsapUtils.animateTo).not.toHaveBeenCalled();
  });

  it('should create pulse animation', () => {
    const target = document.createElement('div');
    
    service.createPulseAnimation(target);
    
    expect(gsapUtils.animateTo).toHaveBeenCalled();
  });

  it('should create glow animation', () => {
    const target = document.createElement('div');
    
    service.createGlowAnimation(target);
    
    expect(gsapUtils.animateTo).toHaveBeenCalled();
  });

  it('should update configuration', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    const newConfig: Partial<HeroAnimationConfig> = {
      titleDelay: 1.0,
      staggerEnabled: false
    };
    
    service.updateConfig(newConfig);
    
    // Should create new timeline with updated config
    expect(gsapUtils.createTimeline).toHaveBeenCalledTimes(2);
  });

  it('should get animation progress', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    const progress = service.getProgress();
    expect(progress).toBe(0);
  });

  it('should set animation progress', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    service.setProgress(0.5);
    
    expect(gsapUtils.createTimeline().progress).toHaveBeenCalledWith(0.5);
  });

  it('should check if animation is playing', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    const isPlaying = service.isPlaying();
    expect(isPlaying).toBe(false);
  });

  it('should cleanup on destroy', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    service.initializeHeroAnimations(mockElementRef);
    
    service.destroy();
    
    expect(gsapUtils.createTimeline().kill).toHaveBeenCalled();
    expect(gsapUtils.killAnimations).toHaveBeenCalled();
  });
});