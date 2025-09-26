import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { WorkCardRingComponent } from './work-card-ring.component';
import { ScrollOrchestrationService } from '../../services/scroll-orchestration.service';
import { BehaviorSubject } from 'rxjs';

// Mock ScrollOrchestrationService
const mockScrollOrchestrationService = {
  scrollState$: new BehaviorSubject({
    globalProgress: 0,
    velocity: 0,
    activeSection: null as any, // Allow any type for testing
    direction: 'none'
  }),
  metrics$: new BehaviorSubject({
    globalProgress: 0,
    velocity: 0,
    activeSection: null as any, // Allow any type for testing
    sections: []
  }),
  getSection: jasmine.createSpy('getSection').and.returnValue({
    id: 'trabalhos',
    progress: 0,
    isActive: false
  }),
  getScrollState: jasmine.createSpy('getScrollState').and.returnValue({
    globalProgress: 0,
    velocity: 0,
    activeSection: null as any,
    direction: 'none'
  }),
  scrollToSection: jasmine.createSpy('scrollToSection'),
  initialize: jasmine.createSpy('initialize'),
  destroy: jasmine.createSpy('destroy')
};

// Mock GSAP
const mockGsap = {
  registerPlugin: jasmine.createSpy('registerPlugin'),
  to: jasmine.createSpy('to').and.returnValue({}),
  set: jasmine.createSpy('set'),
  quickTo: jasmine.createSpy('quickTo').and.returnValue(jasmine.createSpy('quickToInstance')),
  timeline: jasmine.createSpy('timeline').and.returnValue({
    to: jasmine.createSpy('timelineTo'),
    from: jasmine.createSpy('timelineFrom'),
    set: jasmine.createSpy('timelineSet'),
    kill: jasmine.createSpy('timelineKill')
  }),
  utils: {
    toArray: jasmine.createSpy('toArray').and.callFake((selector: any) => {
      if (typeof selector === 'string') {
        return Array.from(document.querySelectorAll(selector));
      }
      return Array.isArray(selector) ? selector : [selector];
    })
  }
};

const mockDraggable = {
  create: jasmine.createSpy('create').and.returnValue([{
    addEventListener: jasmine.createSpy('addEventListener'),
    kill: jasmine.createSpy('kill')
  }])
};

// Mock ScrollTrigger
const mockScrollTrigger = {
  create: jasmine.createSpy('create').and.returnValue({
    kill: jasmine.createSpy('kill')
  }),
  getAll: jasmine.createSpy('getAll').and.returnValue([]),
  refresh: jasmine.createSpy('refresh')
};

// Mock requestAnimationFrame
let mockRafId = 0;
const mockRaf = jasmine.createSpy('requestAnimationFrame').and.callFake(callback => {
  mockRafId++;
  setTimeout(() => callback(mockRafId * 16.66), 16.66); // Simula o tempo passando
  return mockRafId;
});
const mockCancelRaf = jasmine.createSpy('cancelAnimationFrame');


describe('WorkCardRingComponent', () => {
  let component: WorkCardRingComponent;
  let fixture: ComponentFixture<WorkCardRingComponent>;
  let ringElement: HTMLElement;

  beforeEach(async () => {
    (window as any).gsap = mockGsap;
    (window as any).Draggable = mockDraggable;
    (window as any).ScrollTrigger = mockScrollTrigger;
    spyOn(window, 'requestAnimationFrame').and.callFake(mockRaf);
    spyOn(window, 'cancelAnimationFrame').and.callFake(mockCancelRaf);

    await TestBed.configureTestingModule({
      imports: [WorkCardRingComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ScrollOrchestrationService, useValue: mockScrollOrchestrationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkCardRingComponent);
    component = fixture.componentInstance;

    // Mock do elemento nativo
    ringElement = document.createElement('div');
    spyOn(ringElement, 'addEventListener');
    spyOn(ringElement, 'removeEventListener');
    // @ts-ignore
    component.ring = { nativeElement: ringElement };

    // Mock dos cards
    const cardElements = [];
    for (let i = 0; i < 8; i++) {
      const card = document.createElement('div');
      card.classList.add('work-card');
      cardElements.push({ nativeElement: card });
    }
    component.cards = { _results: cardElements } as any;

    fixture.detectChanges(); // Dispara ngOnInit
  });

  afterEach(() => {
    mockGsap.to.calls.reset();
    mockGsap.set.calls.reset();
    mockGsap.quickTo.calls.reset();
    mockDraggable.create.calls.reset();
    mockRaf.calls.reset();
    mockCancelRaf.calls.reset();
    (ringElement.addEventListener as jasmine.Spy).calls.reset();
    (ringElement.removeEventListener as jasmine.Spy).calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization (ngAfterViewInit)', () => {
    it('should not initialize on server', () => {
      // Reset call counts before this specific test
      mockGsap.set.calls.reset();
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [WorkCardRingComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
      }).compileComponents();
      const serverFixture = TestBed.createComponent(WorkCardRingComponent);
      const serverComponent = serverFixture.componentInstance;
      serverComponent.ring = { nativeElement: document.createElement('div') };
      serverComponent.cards = { _results: [] } as any;

      expect(() => serverComponent.ngAfterViewInit()).not.toThrow();
      expect(mockGsap.set).not.toHaveBeenCalled();
    });

    it('should set initial positions of 8 cards in a circle', () => {
      component.ngAfterViewInit();
      expect(mockGsap.set).toHaveBeenCalledTimes(8);
      const angleStep = 360 / 8;
      const radius = (component as any).radius;
      const firstCardArgs = mockGsap.set.calls.argsFor(0);
      const secondCardArgs = mockGsap.set.calls.argsFor(1);

      expect(firstCardArgs[0]).toBe(component.cards.toArray ? component.cards.toArray()[0].nativeElement : (component.cards as any)._results[0].nativeElement);
      expect(firstCardArgs[1].rotationY).toBe(0);
      expect(firstCardArgs[1].transformOrigin).toBe(`50% 50% ${-radius}px`);

      expect(secondCardArgs[1].rotationY).toBe(angleStep);
    });

    it('should initialize custom drag functionality for interaction', () => {
      component.ngAfterViewInit();
      expect(ringElement.style.cursor).toBe('grab');
      // Custom drag events should be set up (this is tested in detail in the drag interaction tests)
    });

    it('should start the animation loop', fakeAsync(() => {
      component.ngAfterViewInit();
      tick(100); // Deixa alguns frames de animação rodarem
      expect(mockRaf).toHaveBeenCalled();
    }));
  });

  describe('Drag Interaction - Custom Implementation', () => {
    let mouseDownEvent: MouseEvent;
    let mouseMoveEvent: MouseEvent;
    let mouseUpEvent: MouseEvent;

    beforeEach(() => {
      component.ngAfterViewInit();
      tick(100);
    });

    it('should setup custom drag events on ring element', () => {
      expect(ringElement.style.cursor).toBe('grab');
    });

    it('should handle mouse down and start dragging', () => {
      mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 400,
        clientY: 300,
        bubbles: true
      });

      ringElement.dispatchEvent(mouseDownEvent);
      
      expect(component.isDragging).toBe(true);
      expect(ringElement.style.cursor).toBe('grabbing');
    });

    it('should update rotation on mouse move during drag', fakeAsync(() => {
      // Start drag
      mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 400,
        clientY: 300,
        bubbles: true
      });
      ringElement.dispatchEvent(mouseDownEvent);
      
      // Move mouse
      mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 500, // 100px movement
        clientY: 300,
        bubbles: true
      });
      document.dispatchEvent(mouseMoveEvent);
      tick(50);
      
      // Should update rotation based on movement (100px * 0.5 sensitivity = 50 degrees)
      expect((component as any).rotation.target).toBe(50);
    }));

    it('should end drag and snap to nearest card on mouse up', fakeAsync(() => {
      // Setup initial rotation
      (component as any).rotation.target = 50; // Close to 45 degrees (card 1)
      
      // Start and end drag
      mouseDownEvent = new MouseEvent('mousedown', { clientX: 400, clientY: 300, bubbles: true });
      ringElement.dispatchEvent(mouseDownEvent);
      
      mouseUpEvent = new MouseEvent('mouseup', { clientX: 400, clientY: 300, bubbles: true });
      document.dispatchEvent(mouseUpEvent);
      tick();
      
      expect(component.isDragging).toBe(false);
      expect(ringElement.style.cursor).toBe('grab');
      expect(mockGsap.to).toHaveBeenCalledWith((component as any).rotation, jasmine.objectContaining({
        target: 45, // Should snap to 45 degrees (360/8 = 45)
        duration: jasmine.any(Number),
        ease: 'power2.out'
      }));
    }));

    it('should prevent conflicts between drag and scroll', () => {
      // Start dragging
      mouseDownEvent = new MouseEvent('mousedown', { clientX: 400, clientY: 300, bubbles: true });
      ringElement.dispatchEvent(mouseDownEvent);
      
      expect(component.isDragging).toBe(true);
      
      // Simulate scroll event while dragging
      mockScrollOrchestrationService.scrollState$.next({
        globalProgress: 0.5,
        velocity: 100,
        activeSection: { id: 'trabalhos', progress: 0.5, isActive: true },
        direction: 'down'
      });
      
      // Scroll should not affect rotation while dragging
      const rotationBeforeScroll = (component as any).rotation.target;
      tick(100);
      expect((component as any).rotation.target).toBe(rotationBeforeScroll);
    });
  });

  describe('Scroll-driven Rotation - Enhanced', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
      tick(100);
    });

    it('should update rotation based on scroll progress from scroll service', () => {
      mockScrollOrchestrationService.scrollState$.next({
        globalProgress: 0.5,
        velocity: 0,
        activeSection: { id: 'trabalhos', progress: 0.5, isActive: true },
        direction: 'down'
      });

      // Should update rotation: 0.5 * 360 * 2 = 360 degrees (2 full rotations during scroll)
      expect((component as any).rotation.target).toBe(360);
    });

    it('should add velocity-based momentum to scroll rotation', () => {
      mockScrollOrchestrationService.scrollState$.next({
        globalProgress: 0.25,
        velocity: 200, // High velocity
        activeSection: { id: 'trabalhos', progress: 0.25, isActive: true },
        direction: 'down'
      });

      // Base rotation: 0.25 * 360 * 2 = 180 degrees
      // Plus velocity factor: min(200 * 0.01, 2) * 10 = 20 degrees
      // Total: 200 degrees
      expect((component as any).rotation.target).toBe(200);
    });

    it('should implement magnetic snapping during slow scroll', () => {
      // Mock slow scroll at snap position
      mockScrollOrchestrationService.scrollState$.next({
        globalProgress: 0.125, // Exactly 1/8 position (card boundary)
        velocity: 30, // Low velocity < 50
        activeSection: { id: 'trabalhos', progress: 0.125, isActive: true },
        direction: 'down'
      });

      // Should snap to exact card position: 0.125 * 360 * 2 = 90 degrees
      expect((component as any).rotation.target).toBe(90);
    });

    it('should not interfere with scroll while dragging', () => {
      // Start dragging
      component.isDragging = true;
      (component as any).rotation.target = 45;

      // Send scroll event
      mockScrollOrchestrationService.scrollState$.next({
        globalProgress: 0.5,
        velocity: 100,
        activeSection: { id: 'trabalhos', progress: 0.5, isActive: true },
        direction: 'down'
      });

      // Rotation should remain unchanged due to dragging
      expect((component as any).rotation.target).toBe(45);
    });

    it('should handle scroll service without getSection method gracefully', () => {
      // Make getSection method return undefined
      mockScrollOrchestrationService.getSection.and.returnValue(undefined);
      
      mockScrollOrchestrationService.scrollState$.next({
        globalProgress: 0.5,
        velocity: 100,
        activeSection: { id: 'trabalhos', progress: 0.5, isActive: true },
        direction: 'down'
      });

      // Should not throw error and rotation should remain unchanged
      expect((component as any).rotation.target).toBe(0);
    });
  });

  describe('Fixed Y-Axis Rotation', () => {
    it('should apply rotation only on Y-axis in smoothRotate', fakeAsync(() => {
      component.ngAfterViewInit();
      (component as any).rotation.target = 90;
      (component as any).rotation.current = 0;
      
      // Let animation run for a few frames
      tick(100);
      
      // Should call gsap.set with explicit Y-axis rotation and reset X/Z axes
      expect(mockGsap.set).toHaveBeenCalledWith(ringElement, {
        rotateY: jasmine.any(Number),
        rotateX: 0,
        rotateZ: 0
      });
    }));

    it('should ensure smooth interpolation between rotation values', fakeAsync(() => {
      component.ngAfterViewInit();
      (component as any).rotation.target = 180;
      (component as any).rotation.current = 0;
      
      tick(50); // First frame
      const firstCall = mockGsap.set.calls.mostRecent();
      const firstRotation = firstCall.args[1].rotateY;
      
      tick(50); // Second frame
      const secondCall = mockGsap.set.calls.mostRecent();
      const secondRotation = secondCall.args[1].rotateY;
      
      // Should be interpolating towards target
      expect(secondRotation).toBeGreaterThan(firstRotation);
      expect(secondRotation).toBeLessThanOrEqual(180);
    }));
  });
});
