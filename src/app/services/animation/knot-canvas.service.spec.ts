import { TestBed } from '@angular/core/testing';
import { KnotCanvasService, KnotConfig } from './knot-canvas.service';
import { GsapUtilsService } from './gsap-utils.service';
import { MotionPreferenceService } from '../../shared/utils';

describe('KnotCanvasService', () => {
  let service: KnotCanvasService;
  let gsapUtils: jasmine.SpyObj<GsapUtilsService>;
  let motionService: jasmine.SpyObj<MotionPreferenceService>;
  let mockTimeline: any;

  beforeEach(() => {
    const gsapSpy = jasmine.createSpyObj('GsapUtilsService', [
      'createTimeline',
      'createScrollTrigger'
    ]);
    const motionSpy = jasmine.createSpyObj('MotionPreferenceService', [
      'getAnimationDuration'
    ], {
      currentPreference: false
    });

    TestBed.configureTestingModule({
      providers: [
        KnotCanvasService,
        { provide: GsapUtilsService, useValue: gsapSpy },
        { provide: MotionPreferenceService, useValue: motionSpy }
      ]
    });

    service = TestBed.inject(KnotCanvasService);
    gsapUtils = TestBed.inject(GsapUtilsService) as jasmine.SpyObj<GsapUtilsService>;
    motionService = TestBed.inject(MotionPreferenceService) as jasmine.SpyObj<MotionPreferenceService>;
    
    // Setup mocks
    mockTimeline = {
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
    motionService.getAnimationDuration.and.returnValue(1.5);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize knot with canvas', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    
    // Mock getBoundingClientRect
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    // Mock getContext
    const mockContext = {
      scale: jasmine.createSpy('scale'),
      clearRect: jasmine.createSpy('clearRect'),
      beginPath: jasmine.createSpy('beginPath'),
      moveTo: jasmine.createSpy('moveTo'),
      lineTo: jasmine.createSpy('lineTo'),
      stroke: jasmine.createSpy('stroke'),
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: ''
    };
    
    spyOn(canvas, 'getContext').and.returnValue(mockContext as any);

    service.initializeKnot(canvas);
    
    expect(gsapUtils.createTimeline).toHaveBeenCalled();
  });

  it('should update knot configuration', () => {
    const canvas = document.createElement('canvas');
    
    // Setup canvas
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
    
    spyOn(canvas, 'getContext').and.returnValue({} as any);
    
    service.initializeKnot(canvas);
    
    const newConfig: Partial<KnotConfig> = {
      segments: 100,
      strokeColor: '#FF0000'
    };
    
    service.updateConfig(newConfig);
    
    // Should create timeline again
    expect(gsapUtils.createTimeline).toHaveBeenCalledTimes(2);
  });

  it('should play animation', () => {
    const canvas = document.createElement('canvas');
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
    spyOn(canvas, 'getContext').and.returnValue({} as any);
    
    service.initializeKnot(canvas);
    service.play();
    
    // Timeline play should be called
    expect(gsapUtils.createTimeline().play).toHaveBeenCalled();
  });

  it('should pause animation', () => {
    const canvas = document.createElement('canvas');
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
    spyOn(canvas, 'getContext').and.returnValue({} as any);
    
    service.initializeKnot(canvas);
    service.pause();
    
    expect(gsapUtils.createTimeline().pause).toHaveBeenCalled();
  });

  it('should get animation progress', () => {
    const canvas = document.createElement('canvas');
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
    spyOn(canvas, 'getContext').and.returnValue({} as any);
    
    service.initializeKnot(canvas);
    
    const progress = service.getProgress();
    expect(progress).toBe(0);
  });

  it('should set animation progress', () => {
    const canvas = document.createElement('canvas');
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
    spyOn(canvas, 'getContext').and.returnValue({} as any);
    
    service.initializeKnot(canvas);
    service.setProgress(0.5);
    
    expect(mockTimeline.progress).toHaveBeenCalledWith(0.5);
  });

  it('should clear canvas', () => {
    const canvas = document.createElement('canvas');
    const mockContext = {
      clearRect: jasmine.createSpy('clearRect')
    };
    
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
    spyOn(canvas, 'getContext').and.returnValue(mockContext as any);
    
    service.initializeKnot(canvas);
    service.clear();
    
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('should cleanup on destroy', () => {
    const canvas = document.createElement('canvas');
    spyOn(canvas, 'getBoundingClientRect').and.returnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {}
    });
    spyOn(canvas, 'getContext').and.returnValue({} as any);
    
    service.initializeKnot(canvas);
    service.destroy();
    
    expect(gsapUtils.createTimeline().kill).toHaveBeenCalled();
  });
});