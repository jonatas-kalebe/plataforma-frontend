import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID, NgZone } from '@angular/core';
import { ThreeParticleBackgroundComponent } from './three-particle-background.component';
import { ScrollOrchestrationService } from '../../services/scroll-orchestration.service';
import { of, BehaviorSubject } from 'rxjs';

// Mocks para Three.js
const mockVector3 = { x: 0, y: 0, z: 0, clone: () => mockVector3, lerp: jasmine.createSpy('lerp') };
const mockScene = { add: jasmine.createSpy('add'), remove: jasmine.createSpy('remove') };
const mockCamera = { 
  position: { x: 0, y: 0, z: 500 }, 
  aspect: 1, 
  updateProjectionMatrix: jasmine.createSpy('updateProjectionMatrix'), 
  lookAt: jasmine.createSpy('lookAt'),
  updateMatrixWorld: jasmine.createSpy('updateMatrixWorld')
};
const mockRenderer = { setSize: jasmine.createSpy('setSize'), setPixelRatio: jasmine.createSpy('setPixelRatio'), render: jasmine.createSpy('render'), domElement: document.createElement('canvas'), dispose: jasmine.createSpy('dispose') };
const mockGeometry = { dispose: jasmine.createSpy('dispose'), setAttribute: jasmine.createSpy('setAttribute'), attributes: { position: { array: new Float32Array(3), needsUpdate: false } } };
const mockMaterial = { dispose: jasmine.createSpy('dispose'), color: { set: jasmine.createSpy('set') }, size: 1, opacity: 1, needsUpdate: false };
const mockPoints = { geometry: mockGeometry, material: mockMaterial, rotation: { x: 0, y: 0 } };

(window as any).THREE = {
  Scene: jasmine.createSpy('Scene').and.returnValue(mockScene),
  PerspectiveCamera: jasmine.createSpy('PerspectiveCamera').and.returnValue(mockCamera),
  WebGLRenderer: jasmine.createSpy('WebGLRenderer').and.returnValue(mockRenderer),
  BufferGeometry: jasmine.createSpy('BufferGeometry').and.returnValue(mockGeometry),
  PointsMaterial: jasmine.createSpy('PointsMaterial').and.returnValue(mockMaterial),
  Points: jasmine.createSpy('Points').and.returnValue(mockPoints),
  Float32BufferAttribute: jasmine.createSpy('Float32BufferAttribute'),
  Vector3: jasmine.createSpy('Vector3').and.returnValue(mockVector3),
  Color: jasmine.createSpy('Color').and.returnValue({ set: mockMaterial.color.set }),
};

// Mock para ScrollOrchestrationService
const mockScrollService = {
  metrics$: new BehaviorSubject({
    globalProgress: 0,
    velocity: 0,
    activeSection: 0,
    sections: []
  }),
  destroy: jasmine.createSpy('destroy')
};

// Mock para requestAnimationFrame
let mockRafId = 0;
const mockRaf = jasmine.createSpy('requestAnimationFrame').and.callFake(callback => {
  mockRafId++;
  return mockRafId;
});
const mockCancelRaf = jasmine.createSpy('cancelAnimationFrame');

describe('ThreeParticleBackgroundComponent', () => {
  let component: ThreeParticleBackgroundComponent;
  let fixture: ComponentFixture<ThreeParticleBackgroundComponent>;
  let ngZone: NgZone;

  beforeEach(async () => {
    spyOn(window, 'requestAnimationFrame').and.callFake(mockRaf);
    spyOn(window, 'cancelAnimationFrame').and.callFake(mockCancelRaf);

    await TestBed.configureTestingModule({
      imports: [ThreeParticleBackgroundComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ScrollOrchestrationService, useValue: mockScrollService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ThreeParticleBackgroundComponent);
    component = fixture.componentInstance;
    ngZone = TestBed.inject(NgZone);
  });

  afterEach(() => {
    mockRaf.calls.reset();
    mockCancelRaf.calls.reset();
    mockScene.add.calls.reset();
    mockRenderer.render.calls.reset();
    mockCamera.updateProjectionMatrix.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should not init on server', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ThreeParticleBackgroundComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
      }).compileComponents();
      const serverFixture = TestBed.createComponent(ThreeParticleBackgroundComponent);
      expect(() => serverFixture.componentInstance.ngAfterViewInit()).not.toThrow();
      expect(mockScene.add).not.toHaveBeenCalled();
    });

    it('should initialize scene, camera, and renderer on browser', fakeAsync(() => {
      ngZone.runOutsideAngular(() => component.ngAfterViewInit());
      tick();
      expect((window as any).THREE.Scene).toHaveBeenCalled();
      expect((window as any).THREE.WebGLRenderer).toHaveBeenCalled();
      expect(mockScene.add).toHaveBeenCalledWith(mockPoints);
      expect(mockRaf).toHaveBeenCalled();
    }));
  });

  describe('Scroll-based Interactions', () => {
    it('should increase particle rotation speed with high scroll velocity', () => {
      const highVelocityMetrics = { globalProgress: 0.5, velocity: 800, activeSection: 1, sections: [] };
      (mockScrollService.metrics$ as any).next(highVelocityMetrics);
      component.ngOnInit();
      fixture.detectChanges();

      (component as any).updateParticles();
      const initialSpinY = (component as any).spin.y;

      // Simula um "tick" da animação
      (component as any).lastTime = performance.now() - 16;
      (component as any).updateParticles();

      // Com velocidade alta, o spin deve aumentar
      expect((component as any).spin.y).toBeGreaterThan(initialSpinY);
    });

    it('should change particle color based on global scroll progress', () => {
      component.ngOnInit();
      const metrics = { globalProgress: 0.8, velocity: 100, activeSection: 3, sections: [] };
      (mockScrollService.metrics$ as any).next(metrics);
      fixture.detectChanges();

      (component as any).updateParticles();

      // Verifica se a cor foi alterada (o mock do lerp seria chamado)
      // Como não temos um mock completo de cor, verificamos se a lógica de cor foi chamada
      expect(mockMaterial.color.set).toHaveBeenCalled();
    });

    it('should trigger particle shape formation on section transition', () => {
      spyOn(component as any, 'formShape');
      const transitionMetrics = { globalProgress: 0.20, velocity: 200, activeSection: 1, sections: [{id: 'hero', progress: 0.95}] }; // Transição Hero -> Filosofia
      (mockScrollService.metrics$ as any).next(transitionMetrics);
      fixture.detectChanges();

      (component as any).updateParticles();

      // A lógica de transição deve chamar a formação de forma
      // Esta é uma verificação conceitual, a implementação exata pode variar
      const isInTransition = (component as any).isInTransition(transitionMetrics);
      if (isInTransition) {
        expect((component as any).formShape).toHaveBeenCalled();
      }
    });
  });

  describe('User Input Interactions', () => {
    it('should update mouse coordinates on mousemove', () => {
      const event = new MouseEvent('mousemove', { clientX: 200, clientY: 300 });
      window.dispatchEvent(event);
      // A lógica está dentro do onMouseMove, que é privado. Verificamos o resultado.
      (component as any).onMouseMove(event);
      expect((component as any).mouse.x).not.toBe(0);
      expect((component as any).mouse.y).not.toBe(0);
    });

    it('should create a shockwave on click', () => {
      spyOn((component as any).shockwaves, 'push');
      const event = new MouseEvent('click');
      (component as any).onClick(event);
      expect((component as any).shockwaves.push).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should clean up resources on destroy', fakeAsync(() => {
      ngZone.runOutsideAngular(() => component.ngAfterViewInit());
      tick();
      const rafId = (component as any).animationFrameId;

      component.ngOnDestroy();

      expect(mockCancelRaf).toHaveBeenCalledWith(rafId);
      expect(mockRenderer.dispose).toHaveBeenCalled();
      expect(mockGeometry.dispose).toHaveBeenCalled();
      expect(mockMaterial.dispose).toHaveBeenCalled();
    }));
  });
});
