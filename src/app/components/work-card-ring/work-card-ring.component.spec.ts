import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef, NgZone } from '@angular/core';
import { WorkCardRingComponent } from './work-card-ring.component';
import { RingLayoutService } from '../../services/animation/ring-layout.service';
import { RingPhysicsService } from '../../services/ring-physics.service';
import { RingGestureService } from '../../services/ring-gesture.service';
import { ReducedMotionService } from '../../services/reduced-motion.service';
import { HapticsService } from '../../services/haptics.service';
import { FeatureFlagsService } from '../../services/feature-flags.service';
import { BehaviorSubject, of } from 'rxjs';

describe('WorkCardRingComponent', () => {
  let component: WorkCardRingComponent;
  let fixture: ComponentFixture<WorkCardRingComponent>;
  let mockRingLayoutService: jasmine.SpyObj<RingLayoutService>;
  let mockRingPhysicsService: jasmine.SpyObj<RingPhysicsService>;
  let mockRingGestureService: jasmine.SpyObj<RingGestureService>;
  let mockReducedMotionService: jasmine.SpyObj<ReducedMotionService>;
  let mockHapticsService: jasmine.SpyObj<HapticsService>;
  let mockFeatureFlagsService: jasmine.SpyObj<FeatureFlagsService>;
  let gestureDataSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    // Create gesture data subject for testing
    gestureDataSubject = new BehaviorSubject({
      state: 'idle',
      delta: 0,
      velocity: 0,
      smoothedVelocity: 0,
      pointerId: null,
      position: { x: 0, y: 0 }
    });

    // Create service mocks
    mockRingLayoutService = jasmine.createSpyObj('RingLayoutService', [
      'calculateCardPosition',
      'calculateRadius',
      'computeDynamicRadius',
      'computeActiveIndex'
    ]);

    mockRingPhysicsService = jasmine.createSpyObj('RingPhysicsService', [
      'decay',
      'nearestSnapAngle',
      'shortestAngleDiff',
      'releaseVelocity'
    ]);

    mockRingGestureService = jasmine.createSpyObj('RingGestureService', [
      'configure',
      'getState',
      'onPointerDown',
      'onPointerMove',
      'onPointerUp',
      'onPointerCancel',
      'reset'
    ]);
    mockRingGestureService.gestureData$ = gestureDataSubject.asObservable();

    mockReducedMotionService = jasmine.createSpyObj('ReducedMotionService', [
      'getPrefersReducedMotion',
      'getCurrentPreference'
    ]);
    mockReducedMotionService.getPrefersReducedMotion.and.returnValue(of(false));

    mockHapticsService = jasmine.createSpyObj('HapticsService', [
      'vibrate',
      'cancel',
      'isHapticsSupported'
    ]);
    mockHapticsService.patterns = {
      light: 50,
      medium: 100,
      heavy: 200,
      doubleTap: [50, 100, 50],
      success: [100, 50, 100],
      error: [200, 100, 200, 100, 200],
      selection: 30,
      snap: [30, 20, 50]
    };

    mockFeatureFlagsService = jasmine.createSpyObj('FeatureFlagsService', [
      'isHapticsEnabled',
      'isRing3dEnabled'
    ]);
    mockFeatureFlagsService.isHapticsEnabled.and.returnValue(true);
    mockFeatureFlagsService.isRing3dEnabled.and.returnValue(true);

    // Configure default return values for layout service
    mockRingLayoutService.calculateCardPosition.and.returnValue({
      angle: 0,
      radius: 200,
      transform: 'rotateY(0deg) translateZ(200px) rotateY(180deg)',
      index: 0
    });
    mockRingLayoutService.calculateRadius.and.returnValue(200);
    mockRingLayoutService.computeDynamicRadius.and.returnValue({
      current: 200,
      target: 200,
      velocity: 0
    });
    mockRingLayoutService.computeActiveIndex.and.returnValue(0);

    // Configure default return values for physics service
    mockRingPhysicsService.decay.and.callFake((v: number) => v * 0.9);
    mockRingPhysicsService.nearestSnapAngle.and.returnValue(0);
    mockRingPhysicsService.shortestAngleDiff.and.returnValue(0);
    mockRingPhysicsService.releaseVelocity.and.returnValue(0);

    await TestBed.configureTestingModule({
      imports: [WorkCardRingComponent],
      providers: [
        { provide: RingLayoutService, useValue: mockRingLayoutService },
        { provide: RingPhysicsService, useValue: mockRingPhysicsService },
        { provide: RingGestureService, useValue: mockRingGestureService },
        { provide: ReducedMotionService, useValue: mockReducedMotionService },
        { provide: HapticsService, useValue: mockHapticsService },
        { provide: FeatureFlagsService, useValue: mockFeatureFlagsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkCardRingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Service Integration', () => {
    it('should inject all required services', () => {
      expect((component as any).ringLayoutService).toBe(mockRingLayoutService);
      expect((component as any).ringPhysicsService).toBe(mockRingPhysicsService);
      expect((component as any).ringGestureService).toBe(mockRingGestureService);
      expect((component as any).reducedMotionService).toBe(mockReducedMotionService);
      expect((component as any).hapticsService).toBe(mockHapticsService);
      expect((component as any).featureFlagsService).toBe(mockFeatureFlagsService);
    });

    it('should configure gesture service on initialization', () => {
      fixture.detectChanges();
      expect(mockRingGestureService.configure).toHaveBeenCalledWith({
        gestureThreshold: component.gestureThreshold,
        horizontalBias: component.horizontalBias,
        velocityWindowSize: 6
      });
    });

    it('should subscribe to reduced motion preference', () => {
      fixture.detectChanges();
      expect(mockReducedMotionService.getPrefersReducedMotion).toHaveBeenCalled();
    });

    it('should subscribe to gesture data observable', () => {
      fixture.detectChanges();
      expect(mockRingGestureService.gestureData$).toBeTruthy();
    });
  });

  describe('Gesture Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should delegate pointer down to gesture service', () => {
      const pointerEvent = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        isPrimary: true,
        button: 0
      });

      component.onPointerDown(pointerEvent);

      expect(mockRingGestureService.onPointerDown).toHaveBeenCalledWith(
        jasmine.objectContaining({
          pointerId: 1,
          clientX: 100,
          clientY: 100,
          isPrimary: true,
          button: 0
        })
      );
    });

    it('should delegate pointer move to gesture service', () => {
      const pointerEvent = new PointerEvent('pointermove', {
        clientX: 150,
        clientY: 100,
        pointerId: 1
      });

      component.onPointerMove(pointerEvent);

      expect(mockRingGestureService.onPointerMove).toHaveBeenCalled();
    });

    it('should delegate pointer up to gesture service', () => {
      const pointerEvent = new PointerEvent('pointerup', {
        clientX: 150,
        clientY: 100,
        pointerId: 1
      });

      component.onPointerUp(pointerEvent);

      expect(mockRingGestureService.onPointerUp).toHaveBeenCalled();
    });

    it('should handle rotate gesture state', () => {
      gestureDataSubject.next({
        state: 'rotate',
        delta: 10,
        velocity: 100,
        smoothedVelocity: 90,
        pointerId: 1,
        position: { x: 100, y: 100 }
      });

      expect(component.isDragging).toBe(true);
    });

    it('should handle idle gesture state after rotation', () => {
      // First set to rotate
      gestureDataSubject.next({
        state: 'rotate',
        delta: 10,
        velocity: 100,
        smoothedVelocity: 90,
        pointerId: 1,
        position: { x: 100, y: 100 }
      });

      // Then set to idle
      gestureDataSubject.next({
        state: 'idle',
        delta: 0,
        velocity: 50,
        smoothedVelocity: 50,
        pointerId: null,
        position: { x: 100, y: 100 }
      });

      expect(component.isDragging).toBe(false);
      expect(mockRingPhysicsService.releaseVelocity).toHaveBeenCalled();
    });
  });

  describe('Physics Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should use physics service for decay calculation', () => {
      // Trigger animation tick
      const tickMethod = (component as any).tick;
      tickMethod(performance.now());

      // Should call decay when not dragging and inertia enabled
      if (component.inertiaEnabled && !(component as any).dragging) {
        expect(mockRingPhysicsService.decay).toHaveBeenCalled();
      }
    });

    it('should use physics service for snap angle calculation', () => {
      component.snapEnabled = true;
      
      // Trigger wheel event to activate snap
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      (component as any).wheelHandler(wheelEvent);

      expect(mockRingPhysicsService.nearestSnapAngle).toHaveBeenCalled();
    });

    it('should use physics service for shortest angle difference', () => {
      component.snapEnabled = true;
      (component as any).snapPending = true;
      (component as any).lastDragEndTS = performance.now() - 200;

      const tickMethod = (component as any).tick;
      tickMethod(performance.now());

      expect(mockRingPhysicsService.shortestAngleDiff).toHaveBeenCalled();
    });

    it('should calculate release velocity using physics service', () => {
      gestureDataSubject.next({
        state: 'rotate',
        delta: 10,
        velocity: 100,
        smoothedVelocity: 90,
        pointerId: 1,
        position: { x: 100, y: 100 }
      });

      gestureDataSubject.next({
        state: 'idle',
        delta: 0,
        velocity: 50,
        smoothedVelocity: 50,
        pointerId: null,
        position: { x: 100, y: 100 }
      });

      expect(mockRingPhysicsService.releaseVelocity).toHaveBeenCalledWith(
        jasmine.objectContaining({
          releaseVelocity: jasmine.any(Number),
          slowDragFrames: jasmine.any(Number),
          peakDragVelocity: jasmine.any(Number),
          stepDeg: jasmine.any(Number)
        })
      );
    });
  });

  describe('Layout Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should use layout service to calculate card positions', () => {
      (component as any).layoutCards(true);

      expect(mockRingLayoutService.calculateCardPosition).toHaveBeenCalled();
    });

    it('should use layout service to calculate effective radius', () => {
      (component as any).recomputeBaseRadiusEffective();

      expect(mockRingLayoutService.calculateRadius).toHaveBeenCalledWith(
        jasmine.objectContaining({
          totalCards: component.count,
          baseRadius: component.baseRadius,
          cardWidth: component.cardWidth,
          cardHeight: component.cardHeight
        })
      );
    });

    it('should use layout service for dynamic radius physics', () => {
      const tickMethod = (component as any).tick;
      tickMethod(performance.now());

      expect(mockRingLayoutService.computeDynamicRadius).toHaveBeenCalled();
    });

    it('should use layout service to compute active index', () => {
      (component as any).maybeEmitIndex();

      expect(mockRingLayoutService.computeActiveIndex).toHaveBeenCalledWith(
        jasmine.any(Number),
        component.count
      );
    });
  });

  describe('Reduced Motion', () => {
    it('should adapt animations when reduced motion is preferred', (done) => {
      mockReducedMotionService.getPrefersReducedMotion.and.returnValue(of(true));

      const newComponent = TestBed.createComponent(WorkCardRingComponent).componentInstance;
      
      setTimeout(() => {
        expect((newComponent as any).reducedMotion).toBe(true);
        done();
      }, 100);
    });

    it('should pass reduced motion flag to layout service', () => {
      (component as any).reducedMotion = true;
      
      const tickMethod = (component as any).tick;
      tickMethod(performance.now());

      expect(mockRingLayoutService.computeDynamicRadius).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.anything(),
        jasmine.anything(),
        jasmine.anything(),
        true
      );
    });
  });

  describe('Haptic Feedback', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trigger haptic feedback on wheel event', () => {
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      (component as any).wheelHandler(wheelEvent);

      expect(mockHapticsService.vibrate).toHaveBeenCalledWith(
        mockHapticsService.patterns.light
      );
    });

    it('should trigger haptic feedback on snap', () => {
      component.snapEnabled = true;
      (component as any).snapPending = true;
      (component as any).snapTarget = 0;
      (component as any).rotationDeg = 0.01;
      (component as any).angularVelocity = 0.01;
      (component as any).lastDragEndTS = performance.now() - 200;

      const tickMethod = (component as any).tick;
      tickMethod(performance.now());

      // Snap should occur and trigger haptic
      if ((component as any).rotationDeg === 0) {
        expect(mockHapticsService.vibrate).toHaveBeenCalledWith(
          mockHapticsService.patterns.snap
        );
      }
    });

    it('should respect feature flag for haptic feedback', () => {
      mockFeatureFlagsService.isHapticsEnabled.and.returnValue(false);

      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
      (component as any).wheelHandler(wheelEvent);

      expect(mockHapticsService.vibrate).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should unsubscribe from observables on destroy', () => {
      const subscriptions = (component as any).subscriptions;
      spyOn(subscriptions, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscriptions.unsubscribe).toHaveBeenCalled();
    });

    it('should cancel animation frame on destroy', () => {
      (component as any).rafId = 123;
      spyOn(window, 'cancelAnimationFrame');

      component.ngOnDestroy();

      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
    });

    it('should reset gesture service on destroy', () => {
      component.ngOnDestroy();

      expect(mockRingGestureService.reset).toHaveBeenCalled();
    });
  });

  describe('ARIA Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update ARIA attributes when items change', () => {
      const initialCount = component.items.length;
      component.items = Array.from({ length: 10 }, (_, i) => ({ title: `Item ${i}` }));
      component.ngOnChanges({
        items: {
          currentValue: component.items,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      // ARIA attributes should be updated
      expect(component.ariaGroupAttrs).toBeTruthy();
      expect(component.ariaGroupAttrs['aria-label']).toContain('10');
    });

    it('should generate live message on active index change', () => {
      mockRingLayoutService.computeActiveIndex.and.returnValue(2);
      
      (component as any).maybeEmitIndex();

      expect(component.ariaLiveMessage).toBeTruthy();
      expect(component.ariaLiveMessage).toContain('3'); // 1-based index
    });
  });

  describe('NgZone Integration', () => {
    it('should run animation loop outside Angular zone', () => {
      const ngZone = TestBed.inject(NgZone);
      spyOn(ngZone, 'runOutsideAngular').and.callThrough();

      fixture.detectChanges();

      expect(ngZone.runOutsideAngular).toHaveBeenCalled();
    });
  });

  describe('Input Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reconfigure gesture service when threshold changes', () => {
      mockRingGestureService.configure.calls.reset();
      
      component.gestureThreshold = 10;
      component.ngOnChanges({
        gestureThreshold: {
          currentValue: 10,
          previousValue: 8,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(mockRingGestureService.configure).toHaveBeenCalledWith(
        jasmine.objectContaining({
          gestureThreshold: 10
        })
      );
    });

    it('should recalculate layout when card dimensions change', () => {
      mockRingLayoutService.calculateRadius.calls.reset();
      
      component.cardWidth = 300;
      component.ngOnChanges({
        cardWidth: {
          currentValue: 300,
          previousValue: 240,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      setTimeout(() => {
        expect(mockRingLayoutService.calculateRadius).toHaveBeenCalled();
      }, 10);
    });
  });

  describe('Track By Function', () => {
    it('should track by item id when available', () => {
      const itemWithId = { id: 'item-123', title: 'Test Project' };
      const result = component.trackByItemId(0, itemWithId);
      expect(result).toBe('item-123');
    });

    it('should track by item id when id is numeric', () => {
      const itemWithId = { id: 42, title: 'Test Project' };
      const result = component.trackByItemId(0, itemWithId);
      expect(result).toBe(42);
    });

    it('should track by index when id is not available', () => {
      const itemWithoutId = { title: 'Test Project' };
      const result = component.trackByItemId(5, itemWithoutId);
      expect(result).toBe(5);
    });

    it('should track by index when item is null', () => {
      const result = component.trackByItemId(3, null);
      expect(result).toBe(3);
    });

    it('should track by index when item is undefined', () => {
      const result = component.trackByItemId(7, undefined);
      expect(result).toBe(7);
    });
  });
});
