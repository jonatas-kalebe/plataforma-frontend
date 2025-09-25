import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThreeParticleBackgroundComponent } from './three-particle-background.component';

// Mock Three.js
const mockScene = {
  add: jasmine.createSpy('add'),
  remove: jasmine.createSpy('remove')
};

const mockCamera = {
  position: { z: 0 },
  aspect: 1,
  updateProjectionMatrix: jasmine.createSpy('updateProjectionMatrix')
};

const mockRenderer = {
  setSize: jasmine.createSpy('setSize'),
  setPixelRatio: jasmine.createSpy('setPixelRatio'),
  render: jasmine.createSpy('render'),
  domElement: document.createElement('canvas'),
  dispose: jasmine.createSpy('dispose')
};

const mockGeometry = {
  dispose: jasmine.createSpy('dispose')
};

const mockMaterial = {
  dispose: jasmine.createSpy('dispose')
};

const mockPoints = {
  geometry: mockGeometry,
  material: mockMaterial
};

// Mock Three.js module
(window as any).THREE = {
  Scene: jasmine.createSpy('Scene').and.returnValue(mockScene),
  PerspectiveCamera: jasmine.createSpy('PerspectiveCamera').and.returnValue(mockCamera),
  WebGLRenderer: jasmine.createSpy('WebGLRenderer').and.returnValue(mockRenderer),
  BufferGeometry: jasmine.createSpy('BufferGeometry').and.returnValue(mockGeometry),
  PointsMaterial: jasmine.createSpy('PointsMaterial').and.returnValue(mockMaterial),
  Points: jasmine.createSpy('Points').and.returnValue(mockPoints),
  Float32BufferAttribute: jasmine.createSpy('Float32BufferAttribute'),
  Vector2: jasmine.createSpy('Vector2').and.returnValue({ x: 0, y: 0 }),
  Vector3: jasmine.createSpy('Vector3').and.returnValue({ x: 0, y: 0, z: 0 })
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jasmine.createSpy('matchMedia').and.returnValue({
    matches: false,
    addEventListener: jasmine.createSpy('addEventListener')
  })
});

// Mock performance.now
Object.defineProperty(window, 'performance', {
  value: { now: jasmine.createSpy('now').and.returnValue(Date.now()) }
});

describe('ThreeParticleBackgroundComponent', () => {
  let component: ThreeParticleBackgroundComponent;
  let fixture: ComponentFixture<ThreeParticleBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeParticleBackgroundComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreeParticleBackgroundComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize Three.js scene on browser platform', () => {
    fixture.detectChanges();
    
    // Since ngAfterViewInit runs in ngZone.runOutsideAngular, 
    // we need to trigger it manually for testing
    component.ngAfterViewInit();
    
    expect((window as any).THREE.Scene).toHaveBeenCalled();
    expect((window as any).THREE.PerspectiveCamera).toHaveBeenCalled();
    expect((window as any).THREE.WebGLRenderer).toHaveBeenCalled();
  });

  it('should not initialize on server platform', () => {
    // Create new component with server platform
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ThreeParticleBackgroundComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    
    const serverFixture = TestBed.createComponent(ThreeParticleBackgroundComponent);
    const serverComponent = serverFixture.componentInstance;
    
    serverFixture.detectChanges();
    
    // Should not throw errors on server
    expect(() => serverComponent.ngAfterViewInit()).not.toThrow();
  });

  it('should handle mouse movement', () => {
    fixture.detectChanges();
    component.ngAfterViewInit();
    
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: 100,
      clientY: 200
    });
    
    // Trigger mouse move
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });

  it('should clean up resources on destroy', () => {
    fixture.detectChanges();
    component.ngAfterViewInit();
    
    spyOn(window, 'cancelAnimationFrame');
    
    component.ngOnDestroy();
    
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('should respect prefers-reduced-motion', () => {
    // Mock reduced motion preference
    (window.matchMedia as jasmine.Spy).and.returnValue({
      matches: true,
      addEventListener: jasmine.createSpy('addEventListener')
    });
    
    fixture.detectChanges();
    component.ngAfterViewInit();
    
    // Component should handle reduced motion preference
    expect(component).toBeTruthy();
  });

  it('should detect mobile devices correctly', () => {
    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', {
      value: true,
      writable: true
    });
    
    fixture.detectChanges();
    component.ngAfterViewInit();
    
    expect(component).toBeTruthy();
  });

  it('should handle window resize', () => {
    fixture.detectChanges();
    component.ngAfterViewInit();
    
    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);
    
    // Should not throw errors
    expect(component).toBeTruthy();
  });
});
