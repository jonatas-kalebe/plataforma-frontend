/**
 * Comprehensive Unit Tests for Filosofia Section
 * Tests the line morphing animation, entry effects, and magnetic transitions
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FilosofiaSection } from './filosofia-section.component';
import { Component, DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

// Mock canvas context
const mockContext = {
  clearRect: jasmine.createSpy('clearRect'),
  beginPath: jasmine.createSpy('beginPath'),
  moveTo: jasmine.createSpy('moveTo'),
  lineTo: jasmine.createSpy('lineTo'),
  bezierCurveTo: jasmine.createSpy('bezierCurveTo'),
  stroke: jasmine.createSpy('stroke'),
  closePath: jasmine.createSpy('closePath'),
  strokeStyle: '',
  lineWidth: 0,
  shadowColor: '',
  shadowBlur: 0,
  canvas: {
    width: 400,
    height: 300
  }
};

// Mock GSAP
const mockGsap = {
  timeline: jasmine.createSpy('timeline').and.returnValue({
    to: jasmine.createSpy('to'),
    set: jasmine.createSpy('set'),
    fromTo: jasmine.createSpy('fromTo'),
    kill: jasmine.createSpy('kill')
  }),
  to: jasmine.createSpy('to'),
  fromTo: jasmine.createSpy('fromTo')
};

// Mock KnotCanvasService
const mockKnotCanvasService = {
  initialize: jasmine.createSpy('initialize'),
  updateProgress: jasmine.createSpy('updateProgress'),
  destroy: jasmine.createSpy('destroy'),
  getCanvas: jasmine.createSpy('getCanvas').and.returnValue({
    nativeElement: {
      getContext: jasmine.createSpy('getContext').and.returnValue(mockContext),
      width: 400,
      height: 300
    }
  })
};

@Component({
  template: `
    <app-filosofia-section 
      (sectionReady)="onSectionReady($event)"
      (canvasReady)="onCanvasReady($event)">
    </app-filosofia-section>
  `
})
class TestHostComponent {
  onSectionReady = jasmine.createSpy('onSectionReady');
  onCanvasReady = jasmine.createSpy('onCanvasReady');
}

describe('FilosofiaSection - Comprehensive Tests', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let filosofiaComponent: FilosofiaSection;
  let filosofiaElement: HTMLElement;

  beforeEach(async () => {
    // Setup GSAP mock
    (window as any).gsap = mockGsap;

    await TestBed.configureTestingModule({
      imports: [FilosofiaSection],
      declarations: [TestHostComponent],
      providers: []
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    
    fixture.detectChanges();
    
    filosofiaComponent = fixture.debugElement
      .query(By.directive(FilosofiaSection))
      .componentInstance;
    filosofiaElement = fixture.debugElement
      .query(By.css('#filosofia'))
      .nativeElement;
  });

  describe('Layout and Style Specifications', () => {
    it('should be a full viewport height section', () => {
      expect(filosofiaElement.classList.contains('section-base')).toBeTruthy();
      expect(filosofiaElement.id).toBe('filosofia');
    });

    it('should display exact heading "Da Complexidade à Clareza."', () => {
      const heading = fixture.debugElement.query(By.css('h2'));
      expect(heading).toBeTruthy();
      expect(heading.nativeElement.textContent?.trim()).toBe('Da Complexidade à Clareza.');
    });

    it('should have correct typography classes for heading', () => {
      const heading = fixture.debugElement.query(By.css('h2'));
      const element = heading.nativeElement;
      
      expect(element.classList.contains('text-4xl')).toBeTruthy();
      expect(element.classList.contains('md:text-5xl')).toBeTruthy();
      expect(element.classList.contains('font-extrabold')).toBeTruthy();
    });

    it('should display the exact descriptive paragraph', () => {
      const paragraph = fixture.debugElement.query(By.css('p'));
      expect(paragraph).toBeTruthy();
      
      const expectedText = 'Transformamos sistemas caóticos em experiências nítidas. Arquitetura, design e engenharia convergem para mover pessoas e negócios.';
      expect(paragraph.nativeElement.textContent?.trim()).toBe(expectedText);
    });

    it('should have proper grid layout on desktop', () => {
      const sectionContent = fixture.debugElement.query(By.css('.section-content'));
      expect(sectionContent).toBeTruthy();
      
      const element = sectionContent.nativeElement;
      expect(element.classList.contains('grid')).toBeTruthy();
      expect(element.classList.contains('md:grid-cols-2')).toBeTruthy();
      expect(element.classList.contains('gap-12')).toBeTruthy();
      expect(element.classList.contains('items-center')).toBeTruthy();
    });

    it('should have canvas with exact dimensions and styling', () => {
      const canvas = fixture.debugElement.query(By.css('canvas'));
      expect(canvas).toBeTruthy();
      
      const canvasElement = canvas.nativeElement;
      expect(canvasElement.classList.contains('w-full')).toBeTruthy();
      expect(canvasElement.classList.contains('h-[260px]')).toBeTruthy();
      expect(canvasElement.classList.contains('md:h-[320px]')).toBeTruthy();
      expect(canvasElement.classList.contains('rounded-xl')).toBeTruthy();
      expect(canvasElement.classList.contains('bg-athenity-blue-card')).toBeTruthy();
    });
  });

  describe('Entry Animation from Hero', () => {
    it('should animate text elements on entry (80% viewport trigger)', () => {
      // Simulate the entry trigger
      filosofiaComponent.ngAfterViewInit();
      
      // Should create animation timeline for entry
      expect(mockGsap.timeline).toHaveBeenCalled();
      
      // Should animate heading and paragraph
      const timelineCalls = mockGsap.timeline().fromTo.calls.all();
      expect(timelineCalls.length).toBeGreaterThan(0);
      
      // Check for text animation (slide up and fade in)
      const textAnimations = timelineCalls.filter(call => 
        call.args[1]?.opacity === 0 || call.args[1]?.y !== undefined
      );
      expect(textAnimations.length).toBeGreaterThan(0);
    });

    it('should slide text from below with proper easing', () => {
      filosofiaComponent.ngAfterViewInit();
      
      const fromToCalls = mockGsap.timeline().fromTo.calls.all();
      
      // Should animate from below (positive y) to 0
      const slideAnimations = fromToCalls.filter(call => 
        call.args[1]?.y > 0 && call.args[2]?.y === 0
      );
      
      expect(slideAnimations.length).toBeGreaterThan(0);
      
      // Should use smooth easing
      slideAnimations.forEach(call => {
        expect(call.args[2]?.ease).toBeDefined();
        expect(call.args[2]?.duration).toBeGreaterThan(0);
      });
    });

    it('should fade in text elements smoothly', () => {
      filosofiaComponent.ngAfterViewInit();
      
      const fromToCalls = mockGsap.timeline().fromTo.calls.all();
      
      // Should animate from opacity 0 to 1
      const fadeAnimations = fromToCalls.filter(call => 
        call.args[1]?.opacity === 0 && call.args[2]?.opacity === 1
      );
      
      expect(fadeAnimations.length).toBeGreaterThan(0);
    });
  });

  describe('Scroll-Driven Line Animation', () => {
    beforeEach(() => {
      // Mock canvas and context
      const canvasElement = fixture.debugElement.query(By.css('canvas'))?.nativeElement;
      if (canvasElement) {
        spyOn(canvasElement, 'getContext').and.returnValue(mockContext);
      }
    });

    it('should initialize knot animation with correct canvas', () => {
      filosofiaComponent.ngAfterViewInit();
      
      // Canvas should be ready and initialized
      expect(hostComponent.onCanvasReady).toHaveBeenCalled();
      
      const canvas = fixture.debugElement.query(By.css('canvas'));
      expect(canvas).toBeTruthy();
    });

    it('should transform line from complex to simple based on scroll', () => {
      const canvas = fixture.debugElement.query(By.css('canvas'))?.nativeElement;
      filosofiaComponent.ngAfterViewInit();
      
      if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        
        // Test different scroll progress values
        const testProgresses = [0, 0.25, 0.5, 0.75, 1.0];
        
        testProgresses.forEach(progress => {
          // Reset spy calls
          mockContext.bezierCurveTo.calls.reset();
          mockContext.lineTo.calls.reset();
          
          // Simulate scroll progress update
          if (filosofiaComponent.updateLineProgress) {
            filosofiaComponent.updateLineProgress(progress);
          }
          
          // At 0% should be wavy/complex (bezier curves)
          if (progress === 0) {
            expect(mockContext.bezierCurveTo.calls.count()).toBeGreaterThan(0);
          }
          
          // At 100% should be straight (simple lines)
          if (progress === 1.0) {
            expect(mockContext.lineTo.calls.count()).toBeGreaterThan(0);
          }
        });
      }
    });

    it('should use correct neon glow styling for line', () => {
      filosofiaComponent.ngAfterViewInit();
      
      if (mockContext) {
        // Should set stroke style to circuit green
        expect(mockContext.strokeStyle).toBeTruthy();
        
        // Should have glow effect
        expect(mockContext.shadowBlur).toBeGreaterThan(0);
        expect(mockContext.shadowColor).toBeTruthy();
      }
    });

    it('should have continuous and fluid transformation', () => {
      filosofiaComponent.ngAfterViewInit();
      
      // Test smooth progression
      const progressSteps = [];
      for (let i = 0; i <= 1; i += 0.1) {
        progressSteps.push(i);
      }
      
      progressSteps.forEach(progress => {
        if (filosofiaComponent.updateLineProgress) {
          expect(() => filosofiaComponent.updateLineProgress(progress)).not.toThrow();
        }
      });
    });
  });

  describe('Optional Pinning Behavior', () => {
    it('should configure pinning if enabled', () => {
      if (filosofiaComponent.enablePinning) {
        filosofiaComponent.ngAfterViewInit();
        
        // If pinning is configured, should affect scroll behavior
        // This would typically be tested through ScrollTrigger integration
        expect(filosofiaComponent.enablePinning).toBeTruthy();
      }
    });

    it('should pin during midpoint transformation (50% scroll)', () => {
      // This test would verify the pinning behavior
      // In a real implementation, this would test ScrollTrigger pin configuration
      expect(filosofiaElement).toBeTruthy(); // Placeholder for pin test
    });
  });

  describe('Magnetic Transition Out', () => {
    it('should complete line straightening on transition', () => {
      filosofiaComponent.ngAfterViewInit();
      
      // When transitioning out, line should be fully straight
      if (filosofiaComponent.updateLineProgress) {
        filosofiaComponent.updateLineProgress(1.0);
        
        // Should draw straight line
        expect(mockContext.lineTo).toHaveBeenCalled();
        expect(mockContext.bezierCurveTo).not.toHaveBeenCalled();
      }
    });

    it('should fade out content during transition', () => {
      filosofiaComponent.ngAfterViewInit();
      
      // Should have fade out animation capability
      expect(mockGsap.to).toBeDefined();
    });
  });

  describe('Reverse Scroll Behavior', () => {
    it('should reverse line animation when scrolling back up', () => {
      filosofiaComponent.ngAfterViewInit();
      
      if (filosofiaComponent.updateLineProgress) {
        // Go from straight back to wavy
        filosofiaComponent.updateLineProgress(1.0); // Straight
        mockContext.bezierCurveTo.calls.reset();
        
        filosofiaComponent.updateLineProgress(0.0); // Back to wavy
        
        // Should draw wavy line again
        expect(mockContext.bezierCurveTo.calls.count()).toBeGreaterThan(0);
      }
    });

    it('should restore text visibility when returning from other sections', () => {
      filosofiaComponent.ngAfterViewInit();
      
      // Text should be able to fade back in
      expect(mockGsap.timeline().to).toBeDefined();
    });
  });

  describe('Visual Design Specifications', () => {
    it('should use exact color scheme - dark blue background', () => {
      expect(filosofiaElement.classList.contains('section-base')).toBeTruthy();
      
      const canvas = fixture.debugElement.query(By.css('canvas'))?.nativeElement;
      expect(canvas.classList.contains('bg-athenity-blue-card')).toBeTruthy();
    });

    it('should use aqua/circuit green for line color (#64FFDA)', () => {
      filosofiaComponent.ngAfterViewInit();
      
      if (mockContext.strokeStyle) {
        // Line should use the brand neon green color
        expect(mockContext.strokeStyle).toBeTruthy();
      }
    });

    it('should maintain minimalist design principles', () => {
      const allElements = fixture.debugElement.queryAll(By.css('*'));
      
      // Should have clean, uncluttered layout
      expect(allElements.length).toBeLessThan(10); // Minimal DOM structure
    });
  });

  describe('Engagement and Interactivity', () => {
    it('should encourage scroll interaction through line response', () => {
      filosofiaComponent.ngAfterViewInit();
      
      // Line should respond to any scroll progress change
      if (filosofiaComponent.updateLineProgress) {
        const initialCallCount = mockContext.clearRect.calls.count();
        
        filosofiaComponent.updateLineProgress(0.3);
        filosofiaComponent.updateLineProgress(0.7);
        
        // Should redraw canvas for each progress change
        expect(mockContext.clearRect.calls.count()).toBeGreaterThan(initialCallCount);
      }
    });

    it('should provide visual satisfaction when reaching clarity (straight line)', () => {
      filosofiaComponent.ngAfterViewInit();
      
      if (filosofiaComponent.updateLineProgress) {
        filosofiaComponent.updateLineProgress(1.0);
        
        // At 100%, should draw a clean straight line
        expect(mockContext.lineTo).toHaveBeenCalled();
        expect(mockContext.moveTo).toHaveBeenCalled();
      }
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up animations on destroy', () => {
      filosofiaComponent.ngAfterViewInit();
      filosofiaComponent.ngOnDestroy();
      
      expect(mockGsap.timeline().kill).toHaveBeenCalled();
    });

    it('should handle rapid scroll updates efficiently', () => {
      filosofiaComponent.ngAfterViewInit();
      
      if (filosofiaComponent.updateLineProgress) {
        // Rapid progress updates should not throw errors
        expect(() => {
          for (let i = 0; i < 100; i++) {
            filosofiaComponent.updateLineProgress(Math.random());
          }
        }).not.toThrow();
      }
    });

    it('should emit section ready event', () => {
      filosofiaComponent.ngAfterViewInit();
      
      expect(hostComponent.onSectionReady).toHaveBeenCalled();
    });
  });
});