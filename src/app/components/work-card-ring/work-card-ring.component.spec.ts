import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { WorkCardRingComponent } from './work-card-ring.component';

// Mock GSAP
const mockGsap = {
  registerPlugin: jasmine.createSpy('registerPlugin'),
  from: jasmine.createSpy('from').and.returnValue({
    scrollTrigger: jasmine.createSpy('scrollTrigger')
  })
};

const mockScrollTrigger = {
  create: jasmine.createSpy('create').and.returnValue({
    kill: jasmine.createSpy('kill')
  })
};

// Mock requestAnimationFrame
let mockAnimationFrameId = 1;
Object.defineProperty(window, 'requestAnimationFrame', {
  value: jasmine.createSpy('requestAnimationFrame').and.callFake((callback: Function) => {
    setTimeout(callback, 16);
    return mockAnimationFrameId++;
  })
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: jasmine.createSpy('cancelAnimationFrame')
});

describe('WorkCardRingComponent', () => {
  let component: WorkCardRingComponent;
  let fixture: ComponentFixture<WorkCardRingComponent>;
  let mockElement: any;

  beforeEach(async () => {
    // Mock GSAP modules
    (window as any).gsap = mockGsap;
    (window as any).ScrollTrigger = mockScrollTrigger;
    
    // Create mock element with necessary properties
    mockElement = {
      style: {},
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      getBoundingClientRect: jasmine.createSpy('getBoundingClientRect').and.returnValue({
        top: 0,
        left: 0,
        width: 400,
        height: 400
      })
    };

    await TestBed.configureTestingModule({
      imports: [WorkCardRingComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkCardRingComponent);
    component = fixture.componentInstance;
    
    // Mock ViewChild element
    component.ring = { nativeElement: mockElement } as any;
  });

  afterEach(() => {
    // Reset spies
    mockGsap.registerPlugin.calls.reset();
    mockGsap.from.calls.reset();
    mockScrollTrigger.create.calls.reset();
    (window.requestAnimationFrame as jasmine.Spy).calls.reset();
    (window.cancelAnimationFrame as jasmine.Spy).calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 8 project items', () => {
    expect(component.items).toBeTruthy();
    expect(component.items.length).toBe(8);
    expect(component.items[0].title).toBe('Projeto 1');
    expect(component.items[7].title).toBe('Projeto 8');
  });

  it('should initialize animation on browser platform', () => {
    component.ngAfterViewInit();
    
    expect(mockGsap.registerPlugin).toHaveBeenCalled();
    expect(mockGsap.from).toHaveBeenCalled();
  });

  it('should not initialize on server platform', () => {
    // Create new component with server platform
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [WorkCardRingComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    
    const serverFixture = TestBed.createComponent(WorkCardRingComponent);
    const serverComponent = serverFixture.componentInstance;
    
    // Should not throw errors on server
    expect(() => serverComponent.ngAfterViewInit()).not.toThrow();
  });

  it('should setup drag event listeners', () => {
    component.ngAfterViewInit();
    
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mousedown', jasmine.any(Function));
    expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', jasmine.any(Function), jasmine.any(Object));
  });

  it('should remove event listeners on destroy', () => {
    component.ngAfterViewInit();
    component.ngOnDestroy();
    
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('mousedown', jasmine.any(Function));
    expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchstart', jasmine.any(Function));
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('should handle mouse drag start', () => {
    component.ngAfterViewInit();
    
    const mouseEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
    (component as any).onDragStart(mouseEvent);
    
    expect((component as any).isDragging).toBeTruthy();
    expect((component as any).startX).toBe(100);
    expect(mockElement.style.cursor).toBe('grabbing');
  });

  it('should handle touch drag start', () => {
    component.ngAfterViewInit();
    
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 150, clientY: 250 } as Touch]
    });
    
    (component as any).onDragStart(touchEvent);
    
    expect((component as any).isDragging).toBeTruthy();
    expect((component as any).startX).toBe(150);
  });

  it('should handle drag move', () => {
    component.ngAfterViewInit();
    
    // Start drag
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
    (component as any).onDragStart(startEvent);
    
    // Move
    const moveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 200 });
    (component as any).onDragMove(moveEvent);
    
    expect((component as any).targetYRotate).not.toBe(0);
    expect((component as any).velocity).not.toBe(0);
    expect((component as any).startX).toBe(150);
  });

  it('should handle drag end', () => {
    component.ngAfterViewInit();
    
    // Start and end drag
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
    (component as any).onDragStart(startEvent);
    
    (component as any).onDragEnd();
    
    expect((component as any).isDragging).toBeFalsy();
    expect(mockElement.style.cursor).toBe('grab');
  });

  it('should clean up animation frame on destroy', () => {
    component.ngAfterViewInit();
    
    // Set animation frame ID
    (component as any).animationFrameId = 123;
    
    component.ngOnDestroy();
    
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
  });
});
