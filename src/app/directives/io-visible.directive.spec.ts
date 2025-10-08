import { Component, DebugElement, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IoVisibleDirective } from './io-visible.directive';

/**
 * Mock IntersectionObserver para testes
 */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit;
  observedElements: Element[] = [];
  
  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.options = options || {};
  }
  
  observe(target: Element): void {
    this.observedElements.push(target);
  }
  
  unobserve(target: Element): void {
    const index = this.observedElements.indexOf(target);
    if (index > -1) {
      this.observedElements.splice(index, 1);
    }
  }
  
  disconnect(): void {
    this.observedElements = [];
  }
  
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  
  /**
   * Helper para simular entrada do elemento
   */
  triggerIntersection(isIntersecting: boolean, target?: Element): void {
    const element = target || this.observedElements[0];
    if (!element) return;
    
    const entry: Partial<IntersectionObserverEntry> = {
      target: element,
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRect: element.getBoundingClientRect(),
      rootBounds: null,
      time: Date.now()
    };
    
    this.callback([entry as IntersectionObserverEntry], this);
  }
}

// Componente de teste simples
@Component({
  template: `
    <div
      ioVisible
      [rootMargin]="rootMargin"
      [threshold]="threshold"
      [once]="once"
      (entered)="onEntered($event)"
      (left)="onLeft($event)"
      data-testid="target">
      Test Content
    </div>
  `,
  standalone: true,
  imports: [IoVisibleDirective]
})
class TestComponent {
  rootMargin = '0px';
  threshold: number | number[] = 0;
  once = false;
  
  enteredCount = 0;
  leftCount = 0;
  lastEnteredEntry: IntersectionObserverEntry | null = null;
  lastLeftEntry: IntersectionObserverEntry | null = null;
  
  onEntered(entry: IntersectionObserverEntry): void {
    this.enteredCount++;
    this.lastEnteredEntry = entry;
  }
  
  onLeft(entry: IntersectionObserverEntry): void {
    this.leftCount++;
    this.lastLeftEntry = entry;
  }
}

describe('IoVisibleDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directiveElement: DebugElement;
  let mockObserver: MockIntersectionObserver | undefined;
  let originalIntersectionObserver: any;
  
  describe('Browser Environment', () => {
    beforeEach(() => {
      // Salva o IntersectionObserver original
      originalIntersectionObserver = (window as any).IntersectionObserver;
      
      // Mock do IntersectionObserver
      (window as any).IntersectionObserver = class {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          mockObserver = new MockIntersectionObserver(callback, options);
          return mockObserver;
        }
      };
      
      TestBed.configureTestingModule({
        imports: [TestComponent]
      });
      
      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      directiveElement = fixture.debugElement.query(By.directive(IoVisibleDirective));
    });
    
    afterEach(() => {
      // Restaura o IntersectionObserver original
      (window as any).IntersectionObserver = originalIntersectionObserver;
      mockObserver = undefined;
    });
    
    it('should create directive', () => {
      expect(directiveElement).toBeTruthy();
    });
    
    it('should initialize IntersectionObserver on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(mockObserver).toBeDefined();
      expect(mockObserver!.observedElements.length).toBe(1);
      expect(mockObserver!.observedElements[0]).toBe(directiveElement.nativeElement);
    }));
    
    it('should emit entered event when element enters viewport', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(component.enteredCount).toBe(0);
      
      // Simula entrada no viewport
      mockObserver!.triggerIntersection(true);
      tick();
      
      expect(component.enteredCount).toBe(1);
      expect(component.lastEnteredEntry).toBeTruthy();
      expect(component.lastEnteredEntry?.isIntersecting).toBe(true);
    }));
    
    it('should emit left event when element leaves viewport', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      // Primeiro entra
      mockObserver!.triggerIntersection(true);
      tick();
      
      expect(component.enteredCount).toBe(1);
      expect(component.leftCount).toBe(0);
      
      // Depois sai
      mockObserver!.triggerIntersection(false);
      tick();
      
      expect(component.leftCount).toBe(1);
      expect(component.lastLeftEntry).toBeTruthy();
      expect(component.lastLeftEntry?.isIntersecting).toBe(false);
    }));
    
    it('should not emit left event if element never entered', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      // Tenta sair sem ter entrado
      mockObserver!.triggerIntersection(false);
      tick();
      
      expect(component.enteredCount).toBe(0);
      expect(component.leftCount).toBe(0);
    }));
    
    it('should handle multiple enter/leave cycles', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      // Ciclo 1: entra e sai
      mockObserver!.triggerIntersection(true);
      tick();
      mockObserver!.triggerIntersection(false);
      tick();
      
      // Ciclo 2: entra e sai
      mockObserver!.triggerIntersection(true);
      tick();
      mockObserver!.triggerIntersection(false);
      tick();
      
      expect(component.enteredCount).toBe(2);
      expect(component.leftCount).toBe(2);
    }));
    
    it('should disconnect observer when once=true after first entry', fakeAsync(() => {
      component.once = true;
      fixture.detectChanges();
      tick();
      
      expect(mockObserver!.observedElements.length).toBe(1);
      
      // Primeira entrada
      mockObserver!.triggerIntersection(true);
      tick();
      
      expect(component.enteredCount).toBe(1);
      // Observer deve ter sido desconectado
      expect(mockObserver!.observedElements.length).toBe(0);
      
      // Segunda entrada não deve emitir evento
      mockObserver!.triggerIntersection(false);
      tick();
      mockObserver!.triggerIntersection(true);
      tick();
      
      expect(component.enteredCount).toBe(1);
    }));
    
    it('should pass rootMargin to IntersectionObserver', fakeAsync(() => {
      component.rootMargin = '10px 20px';
      fixture.detectChanges();
      tick();
      
      expect(mockObserver!.options.rootMargin).toBe('10px 20px');
    }));
    
    it('should pass threshold to IntersectionObserver', fakeAsync(() => {
      component.threshold = 0.5;
      fixture.detectChanges();
      tick();
      
      expect(mockObserver!.options.threshold).toBe(0.5);
    }));
    
    it('should pass array of thresholds to IntersectionObserver', fakeAsync(() => {
      component.threshold = [0, 0.25, 0.5, 0.75, 1];
      fixture.detectChanges();
      tick();
      
      expect(mockObserver!.options.threshold).toEqual([0, 0.25, 0.5, 0.75, 1]);
    }));
    
    it('should disconnect observer on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(mockObserver!.observedElements.length).toBe(1);
      
      fixture.destroy();
      flush();
      
      expect(mockObserver!.observedElements.length).toBe(0);
    }));
  });
  
  describe('SSR Environment (Node)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [TestComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });
      
      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
    });
    
    it('should not throw error in SSR environment', fakeAsync(() => {
      expect(() => {
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));
    
    it('should not initialize observer in SSR environment', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      // mockObserver não deve ser definido porque não deveria ter sido criado
      expect(mockObserver).toBeUndefined();
    }));
    
    it('should not emit events in SSR environment', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      
      expect(component.enteredCount).toBe(0);
      expect(component.leftCount).toBe(0);
    }));
  });
  
  describe('Browser without IntersectionObserver support', () => {
    beforeEach(() => {
      // Remove IntersectionObserver do window
      (window as any).IntersectionObserver = undefined;
      
      TestBed.configureTestingModule({
        imports: [TestComponent]
      });
      
      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
    });
    
    it('should handle missing IntersectionObserver gracefully', fakeAsync(() => {
      // Mock console.warn para evitar poluir o console durante os testes
      spyOn(console, 'warn');
      
      expect(() => {
        fixture.detectChanges();
        tick();
      }).not.toThrow();
      
      expect(console.warn).toHaveBeenCalledWith(
        '[IoVisibleDirective] IntersectionObserver não está disponível neste navegador'
      );
    }));
  });
});
