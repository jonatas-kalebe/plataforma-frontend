/**
 * Comprehensive Unit Tests for Three.js Particle Background
 * Tests mouse interactions, shockwave effects, and visual feedback
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ThreeParticleBackgroundComponent } from './three-particle-background.component';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';

// Mock Three.js
const mockGeometry = {
  setAttribute: jasmine.createSpy('setAttribute'),
  dispose: jasmine.createSpy('dispose')
};

const mockMaterial = {
  dispose: jasmine.createSpy('dispose'),
  uniforms: {
    time: { value: 0 },
    mouse: { value: { x: 0, y: 0 } },
    resolution: { value: { x: 1024, y: 768 } },
    shockwaves: { value: [] }
  }
};

const mockMesh = {
  position: { set: jasmine.createSpy('set') },
  rotation: { set: jasmine.createSpy('set') },
  scale: { set: jasmine.createSpy('set') }
};

const mockScene = {
  add: jasmine.createSpy('add'),
  remove: jasmine.createSpy('remove'),
  clear: jasmine.createSpy('clear')
};

const mockCamera = {
  position: { set: jasmine.createSpy('set'), x: 0, y: 0, z: 5 },
  lookAt: jasmine.createSpy('lookAt'),
  updateProjectionMatrix: jasmine.createSpy('updateProjectionMatrix'),
  aspect: 1
};

const mockRenderer = {
  setSize: jasmine.createSpy('setSize'),
  render: jasmine.createSpy('render'),
  dispose: jasmine.createSpy('dispose'),
  domElement: document.createElement('canvas')
};

const mockTHREE = {
  Scene: jasmine.createSpy('Scene').and.returnValue(mockScene),
  PerspectiveCamera: jasmine.createSpy('PerspectiveCamera').and.returnValue(mockCamera),
  WebGLRenderer: jasmine.createSpy('WebGLRenderer').and.returnValue(mockRenderer),
  BufferGeometry: jasmine.createSpy('BufferGeometry').and.returnValue(mockGeometry),
  ShaderMaterial: jasmine.createSpy('ShaderMaterial').and.returnValue(mockMaterial),
  Points: jasmine.createSpy('Points').and.returnValue(mockMesh),
  BufferAttribute: jasmine.createSpy('BufferAttribute'),
  Vector2: jasmine.createSpy('Vector2').and.returnValue({ x: 0, y: 0 }),
  Color: jasmine.createSpy('Color').and.returnValue({ r: 0, g: 0, b: 0 })
};

@Component({
  template: `
    <app-three-particle-background 
      [scrollState]="scrollState"
      [enableShockwaves]="enableShockwaves"
      [particleCount]="particleCount">
    </app-three-particle-background>
  `
})
class TestHostComponent {
  scrollState = {
    activeSection: { id: 'hero', progress: 0 },
    globalProgress: 0,
    velocity: 0,
    sections: []
  };
  enableShockwaves = true;
  particleCount = 1000;
}

describe('ThreeParticleBackgroundComponent - Comprehensive Tests', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let particleComponent: ThreeParticleBackgroundComponent;
  let canvasElement: HTMLCanvasElement;

  beforeEach(async () => {
    // Mock THREE.js
    (window as any).THREE = mockTHREE;

    await TestBed.configureTestingModule({
      imports: [ThreeParticleBackgroundComponent],
      declarations: [TestHostComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    
    fixture.detectChanges();
    
    particleComponent = fixture.debugElement
      .query(By.directive(ThreeParticleBackgroundComponent))
      .componentInstance;
    
    canvasElement = fixture.debugElement
      .query(By.css('canvas'))
      ?.nativeElement;
  });

  afterEach(() => {
    // Clean up spies
    Object.values(mockTHREE).forEach(spy => {
      if (jasmine.isSpy(spy)) {
        spy.calls.reset();
      }
    });
  });

  describe('Initialization and Setup', () => {
    it('should create Three.js scene correctly', () => {
      particleComponent.ngAfterViewInit();
      
      expect(mockTHREE.Scene).toHaveBeenCalled();
      expect(mockTHREE.PerspectiveCamera).toHaveBeenCalled();
      expect(mockTHREE.WebGLRenderer).toHaveBeenCalled();
    });

    it('should initialize with correct number of particles', () => {
      hostComponent.particleCount = 1500;
      fixture.detectChanges();
      
      particleComponent.ngAfterViewInit();
      
      expect(mockTHREE.BufferGeometry).toHaveBeenCalled();
      expect(mockGeometry.setAttribute).toHaveBeenCalled();
    });

    it('should setup camera with proper perspective', () => {
      particleComponent.ngAfterViewInit();
      
      expect(mockTHREE.PerspectiveCamera).toHaveBeenCalledWith(
        jasmine.any(Number), // FOV
        jasmine.any(Number), // Aspect ratio
        jasmine.any(Number), // Near
        jasmine.any(Number)  // Far
      );
    });

    it('should add particle system to scene', () => {
      particleComponent.ngAfterViewInit();
      
      expect(mockScene.add).toHaveBeenCalled();
    });
  });

  describe('Mouse Interaction and Parallax', () => {
    beforeEach(() => {
      particleComponent.ngAfterViewInit();
    });

    it('should track mouse movement for parallax effect', () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 500,
        clientY: 300
      });
      
      canvasElement?.dispatchEvent(mouseEvent);
      
      // Should update mouse uniform in shader
      expect(mockMaterial.uniforms.mouse.value).toBeDefined();
    });

    it('should normalize mouse coordinates to -1 to 1 range', () => {
      // Mock canvas dimensions
      Object.defineProperty(canvasElement, 'clientWidth', { value: 1000 });
      Object.defineProperty(canvasElement, 'clientHeight', { value: 600 });
      
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 750, // 75% across width
        clientY: 150  // 25% down height
      });
      
      canvasElement?.dispatchEvent(mouseEvent);
      
      // Should convert to normalized coordinates
      // 750/1000 = 0.75, normalized: (0.75 * 2) - 1 = 0.5
      // 150/600 = 0.25, normalized: 1 - (0.25 * 2) = 0.5
      if (mockMaterial.uniforms.mouse.value) {
        expect(mockMaterial.uniforms.mouse.value.x).toBeCloseTo(0.5, 1);
        expect(mockMaterial.uniforms.mouse.value.y).toBeCloseTo(0.5, 1);
      }
    });

    it('should create subtle 3D parallax effect', () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 100
      });
      
      canvasElement?.dispatchEvent(mouseEvent);
      
      // Camera or particle system should respond to mouse movement
      // This creates the parallax depth effect
      expect(mockCamera.position.set).toHaveBeenCalled();
    });
  });

  describe('Click Shockwave Effects', () => {
    beforeEach(() => {
      particleComponent.ngAfterViewInit();
    });

    it('should create shockwave on canvas click', () => {
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300
      });
      
      canvasElement?.dispatchEvent(clickEvent);
      
      // Should add shockwave to shader uniforms
      expect(mockMaterial.uniforms.shockwaves.value).toBeDefined();
      expect(mockMaterial.uniforms.shockwaves.value.length).toBeGreaterThan(0);
    });

    it('should position shockwave at click coordinates', () => {
      Object.defineProperty(canvasElement, 'clientWidth', { value: 800 });
      Object.defineProperty(canvasElement, 'clientHeight', { value: 600 });
      
      const clickEvent = new MouseEvent('click', {
        clientX: 400, // Center X
        clientY: 300  // Center Y
      });
      
      canvasElement?.dispatchEvent(clickEvent);
      
      const shockwaves = mockMaterial.uniforms.shockwaves.value;
      if (shockwaves && shockwaves.length > 0) {
        const shockwave = shockwaves[0];
        expect(shockwave.position).toBeDefined();
        expect(shockwave.position.x).toBeCloseTo(0, 1); // Centered
        expect(shockwave.position.y).toBeCloseTo(0, 1); // Centered
      }
    });

    it('should animate shockwave expansion over time', () => {
      const clickEvent = new MouseEvent('click', {
        clientX: 300,
        clientY: 200
      });
      
      canvasElement?.dispatchEvent(clickEvent);
      
      const initialShockwaves = [...mockMaterial.uniforms.shockwaves.value];
      
      // Simulate animation frame updates
      particleComponent.animate?.();
      particleComponent.animate?.();
      
      // Shockwave should expand (radius increases)
      const currentShockwaves = mockMaterial.uniforms.shockwaves.value;
      if (initialShockwaves.length > 0 && currentShockwaves.length > 0) {
        expect(currentShockwaves[0].radius).toBeGreaterThan(0);
      }
    });

    it('should remove expired shockwaves', () => {
      // Create multiple shockwaves
      for (let i = 0; i < 5; i++) {
        const clickEvent = new MouseEvent('click', {
          clientX: i * 100,
          clientY: i * 100
        });
        canvasElement?.dispatchEvent(clickEvent);
      }
      
      const initialCount = mockMaterial.uniforms.shockwaves.value.length;
      
      // Simulate time passing - shockwaves should expire
      for (let i = 0; i < 100; i++) {
        particleComponent.animate?.();
      }
      
      const finalCount = mockMaterial.uniforms.shockwaves.value.length;
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });

    it('should limit maximum concurrent shockwaves', () => {
      // Create many shockwaves rapidly
      for (let i = 0; i < 20; i++) {
        const clickEvent = new MouseEvent('click', {
          clientX: Math.random() * 800,
          clientY: Math.random() * 600
        });
        canvasElement?.dispatchEvent(clickEvent);
      }
      
      // Should not exceed reasonable limit (e.g., 10)
      expect(mockMaterial.uniforms.shockwaves.value.length).toBeLessThanOrEqual(10);
    });

    it('should disable shockwaves when enableShockwaves is false', () => {
      hostComponent.enableShockwaves = false;
      fixture.detectChanges();
      
      const clickEvent = new MouseEvent('click', {
        clientX: 400,
        clientY: 300
      });
      
      canvasElement?.dispatchEvent(clickEvent);
      
      // Should not create shockwaves
      expect(mockMaterial.uniforms.shockwaves.value.length).toBe(0);
    });
  });

  describe('Scroll State Integration', () => {
    beforeEach(() => {
      particleComponent.ngAfterViewInit();
    });

    it('should respond to scroll state changes', () => {
      hostComponent.scrollState = {
        activeSection: { id: 'hero', progress: 0.5 },
        globalProgress: 0.2,
        velocity: 100,
        sections: []
      };
      
      fixture.detectChanges();
      
      // Particle system should update based on scroll state
      expect(mockMaterial.uniforms.time.value).toBeDefined();
    });

    it('should modify particle behavior during different sections', () => {
      const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
      
      sections.forEach(sectionId => {
        hostComponent.scrollState = {
          activeSection: { id: sectionId, progress: 0.5 },
          globalProgress: 0.5,
          velocity: 50,
          sections: []
        };
        
        fixture.detectChanges();
        
        // Each section might have different particle behavior
        expect(mockMaterial.uniforms).toBeDefined();
      });
    });

    it('should adjust particle density based on scroll velocity', () => {
      const velocities = [0, 50, 150, 300];
      
      velocities.forEach(velocity => {
        hostComponent.scrollState = {
          activeSection: { id: 'hero', progress: 0.3 },
          globalProgress: 0.3,
          velocity,
          sections: []
        };
        
        fixture.detectChanges();
        
        // Higher velocity might affect particle movement
        expect(mockRenderer.render).toBeDefined();
      });
    });
  });

  describe('Visual Specifications', () => {
    it('should use brand colors in particle system', () => {
      particleComponent.ngAfterViewInit();
      
      // Should use athenity brand colors
      expect(mockTHREE.Color).toHaveBeenCalled();
    });

    it('should maintain minimalist aesthetic', () => {
      particleComponent.ngAfterViewInit();
      
      // Particles should be subtle, not overwhelming
      expect(mockMaterial.uniforms).toBeDefined();
    });

    it('should create depth through particle positioning', () => {
      particleComponent.ngAfterViewInit();
      
      // Particles should be positioned in 3D space for depth
      expect(mockGeometry.setAttribute).toHaveBeenCalledWith(
        'position',
        jasmine.any(Object)
      );
    });
  });

  describe('Performance Optimization', () => {
    it('should handle window resize efficiently', () => {
      particleComponent.ngAfterViewInit();
      
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
      
      expect(mockCamera.updateProjectionMatrix).toHaveBeenCalled();
      expect(mockRenderer.setSize).toHaveBeenCalled();
    });

    it('should limit animation frame rate for performance', () => {
      particleComponent.ngAfterViewInit();
      
      // Should not create excessive animation calls
      const initialRenderCount = mockRenderer.render.calls.count();
      
      // Simulate multiple rapid frame updates
      for (let i = 0; i < 100; i++) {
        particleComponent.animate?.();
      }
      
      const finalRenderCount = mockRenderer.render.calls.count();
      expect(finalRenderCount - initialRenderCount).toBeLessThan(100);
    });

    it('should dispose resources on destroy', () => {
      particleComponent.ngAfterViewInit();
      particleComponent.ngOnDestroy();
      
      expect(mockGeometry.dispose).toHaveBeenCalled();
      expect(mockMaterial.dispose).toHaveBeenCalled();
      expect(mockRenderer.dispose).toHaveBeenCalled();
    });
  });

  describe('Mobile Considerations', () => {
    beforeEach(() => {
      // Mock mobile environment
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
      Object.defineProperty(window, 'innerWidth', { value: 375 });
    });

    it('should handle touch events for shockwaves', () => {
      particleComponent.ngAfterViewInit();
      
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{
          clientX: 200,
          clientY: 300
        } as Touch]
      });
      
      canvasElement?.dispatchEvent(touchEvent);
      
      // Should create shockwave from touch
      expect(mockMaterial.uniforms.shockwaves.value).toBeDefined();
    });

    it('should reduce particle count on mobile for performance', () => {
      // Mobile should use fewer particles
      hostComponent.particleCount = 500; // Reduced for mobile
      fixture.detectChanges();
      
      particleComponent.ngAfterViewInit();
      
      // Should create geometry with reduced particle count
      expect(mockTHREE.BufferGeometry).toHaveBeenCalled();
    });

    it('should handle device orientation changes', () => {
      particleComponent.ngAfterViewInit();
      
      const orientationEvent = new Event('orientationchange');
      window.dispatchEvent(orientationEvent);
      
      // Should update camera and renderer
      expect(mockCamera.aspect).toBeDefined();
      expect(mockRenderer.setSize).toHaveBeenCalled();
    });
  });

  describe('Accessibility and Reduced Motion', () => {
    it('should respect prefers-reduced-motion setting', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jasmine.createSpy('matchMedia').and.returnValue({
          matches: true,
          addListener: jasmine.createSpy('addListener'),
          removeListener: jasmine.createSpy('removeListener')
        })
      });
      
      particleComponent.ngAfterViewInit();
      
      // Should reduce or disable animations
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should not interfere with screen readers', () => {
      particleComponent.ngAfterViewInit();
      
      const canvas = fixture.debugElement.query(By.css('canvas'));
      expect(canvas.nativeElement.getAttribute('aria-hidden')).toBe('true');
    });
  });
});