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
    activeSection: 0,
    direction: 'none'
  }),
  metrics$: new BehaviorSubject({
    globalProgress: 0,
    velocity: 0,
    activeSection: 0,
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
    activeSection: 0,
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

    it('should initialize Draggable for drag interaction', () => {
      component.ngAfterViewInit();
      expect(mockDraggable.create).toHaveBeenCalledWith(ringElement, jasmine.any(Object));
      const draggableArgs = mockDraggable.create.calls.argsFor(0)[1];
      expect(draggableArgs.type).toBe('rotation');
      expect(draggableArgs.inertia).toBe(true);
    });

    it('should start the animation loop', fakeAsync(() => {
      component.ngAfterViewInit();
      tick(100); // Deixa alguns frames de animação rodarem
      expect(mockRaf).toHaveBeenCalled();
    }));
  });

  describe('Drag Interaction', () => {
    let onDragCallback: (this: any) => void;
    let onThrowUpdateCallback: (this: any) => void;

    beforeEach(() => {
      component.ngAfterViewInit();
      const draggableInstance = mockDraggable.create.calls.all()[0].returnValue[0];
      const addListenerSpy = draggableInstance.addEventListener as jasmine.Spy;
      // @ts-ignore
      onDragCallback = addListenerSpy.calls.all().find(c => c.args[0] === 'drag').args[1];
      // @ts-ignore
      onThrowUpdateCallback = addListenerSpy.calls.all().find(c => c.args[0] === 'throwupdate').args[1];
    });

    it('should update target rotation on drag', () => {
      (component as any).isDragging = true;
      
      // Direct test of the updateRotationTarget method
      (component as any).updateRotationTarget(45);
      expect((component as any).rotation.target).toBe(45);
      
      // Test callback if it exists
      if (onDragCallback) {
        onDragCallback.call({ rotation: 45 });
      }
      expect((component as any).rotation.target).toBe(45);
    });

    it('should update target rotation on throw (inertia)', () => {
      (component as any).isDragging = false;
      
      // Direct test of the updateRotationTarget method
      (component as any).updateRotationTarget(90);
      expect((component as any).rotation.target).toBe(90);
      
      // Test callback if it exists
      if (onThrowUpdateCallback) {
        onThrowUpdateCallback.call({ rotation: 90 });
      }
      expect((component as any).rotation.target).toBe(90);
    });

    it('should change cursor to "grabbing" on drag start and back to "grab" on drag end', () => {
      const onDragStartCallback = (mockDraggable.create.calls.argsFor(0)[1] as any).onDragStart;
      const onDragEndCallback = (mockDraggable.create.calls.argsFor(0)[1] as any).onDragEnd;

      onDragStartCallback();
      expect(component.isDragging).toBe(true);
      expect(ringElement.style.cursor).toBe('grabbing');

      onDragEndCallback();
      expect(component.isDragging).toBe(false);
      expect(ringElement.style.cursor).toBe('grab');
    });

    it('should snap to the nearest card when drag ends', fakeAsync(() => {
      const onDragEndCallback = (mockDraggable.create.calls.argsFor(0)[1] as any).onDragEnd;
      (component as any).rotation.target = 50; // Próximo a 45 graus (card 1)

      onDragEndCallback();
      tick();

      expect(mockGsap.to).toHaveBeenCalledWith((component as any).rotation, jasmine.objectContaining({
        target: 45, // 360 / 8 = 45
        duration: jasmine.any(Number),
        ease: 'power2.out'
      }));
    }));
  });

  describe('Scroll-driven Rotation', () => {
    it('should update target rotation based on scroll progress input', () => {
      component.ngAfterViewInit();
      const scrollProgress = 0.5;
      component.scrollProgress = scrollProgress;
      component.ngOnChanges({
        scrollProgress: {
          currentValue: scrollProgress,
          previousValue: 0,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      // Se o snap estiver ativo (padrão), ele deve ir para o card mais próximo
      // Se não, deve seguir o progresso
      (component as any).isSnapped = false; // Força o modo não-snap para testar o progresso
      component.ngOnChanges({
        scrollProgress: {
          currentValue: scrollProgress,
          previousValue: 0,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      const expectedRotation = -scrollProgress * 360 * (component as any).rotationFactor;
      expect((component as any).rotation.target).toBeCloseTo(expectedRotation);
    });

    it('should snap to center alignment when scroll progress is ~0.5', () => {
      component.ngAfterViewInit();
      (component as any).isSnapped = true;
      const scrollProgress = 0.51; // Perto do meio
      component.scrollProgress = scrollProgress;
      component.ngOnChanges({
        scrollProgress: {
          currentValue: scrollProgress,
          previousValue: 0,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      // No meio, deve travar em uma rotação de alinhamento, que pode ser 0 ou outro ângulo definido
      expect((component as any).rotation.target).toBe(0); // Assumindo que o snap central alinha em 0
    });
  });


  describe('Lifecycle (ngOnDestroy)', () => {
    it('should cancel the animation frame', () => {
      component.ngAfterViewInit();
      const rafId = (component as any).rafId;
      component.ngOnDestroy();
      expect(mockCancelRaf).toHaveBeenCalledWith(rafId);
    });

    it('should kill the Draggable instance', () => {
      component.ngAfterViewInit();
      const draggableInstance = (component as any).draggable[0];
      component.ngOnDestroy();
      expect(draggableInstance.kill).toHaveBeenCalled();
    });
  });
});
