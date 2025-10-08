import { Component, DebugElement, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LazyImgDirective } from './lazy-img.directive';

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

// Componente de teste
@Component({
  template: `
    <img
      lazyImg
      [lazySrc]="lazySrc"
      [rootMargin]="rootMargin"
      [threshold]="threshold"
      [src]="src"
      alt="Test image"
      width="400"
      height="300">
  `,
  standalone: true,
  imports: [LazyImgDirective]
})
class TestComponent {
  lazySrc: string | undefined = undefined;
  rootMargin = '0px';
  threshold = 0.01;
  src = 'placeholder.jpg';
}

describe('LazyImgDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgElement: DebugElement;
  let mockObserver: MockIntersectionObserver | undefined;
  let originalIntersectionObserver: any;
  let originalLoading: any;

  beforeEach(() => {
    // Salva referências originais
    originalIntersectionObserver = (window as any).IntersectionObserver;
    originalLoading = HTMLImageElement.prototype.hasOwnProperty('loading');
  });

  afterEach(() => {
    // Restaura IntersectionObserver original
    (window as any).IntersectionObserver = originalIntersectionObserver;
    
    // Restaura loading se foi modificado
    if (!originalLoading && 'loading' in HTMLImageElement.prototype) {
      delete (HTMLImageElement.prototype as any).loading;
    }
  });

  describe('Browser with native loading="lazy" support', () => {
    beforeEach(() => {
      // Simula suporte a loading="lazy"
      if (!('loading' in HTMLImageElement.prototype)) {
        Object.defineProperty(HTMLImageElement.prototype, 'loading', {
          configurable: true,
          value: 'lazy'
        });
      }

      TestBed.configureTestingModule({
        imports: [TestComponent]
      });

      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      imgElement = fixture.debugElement.query(By.css('img'));
    });

    it('should create directive', () => {
      fixture.detectChanges();
      expect(imgElement).toBeTruthy();
    });

    it('should set loading="lazy" attribute when supported', fakeAsync(() => {
      component.lazySrc = 'high-res.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      expect(img.getAttribute('loading')).toBe('lazy');
    }));

    it('should use lazySrc when provided', fakeAsync(() => {
      component.lazySrc = 'lazy-image.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      expect(img.getAttribute('src')).toBe('lazy-image.jpg');
    }));

    it('should keep original src when lazySrc not provided', fakeAsync(() => {
      component.lazySrc = undefined;
      component.src = 'original.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      expect(img.getAttribute('src')).toBe('original.jpg');
      expect(img.getAttribute('loading')).toBe('lazy');
    }));
  });

  describe('Browser without native loading support (fallback mode)', () => {
    beforeEach(() => {
      // Remove suporte a loading="lazy"
      if ('loading' in HTMLImageElement.prototype) {
        delete (HTMLImageElement.prototype as any).loading;
      }

      // Mock IntersectionObserver
      mockObserver = undefined;
      (window as any).IntersectionObserver = function(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit
      ) {
        mockObserver = new MockIntersectionObserver(callback, options);
        return mockObserver;
      };

      TestBed.configureTestingModule({
        imports: [TestComponent]
      });

      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      imgElement = fixture.debugElement.query(By.css('img'));
    });

    it('should create IntersectionObserver when loading not supported', fakeAsync(() => {
      component.lazySrc = 'lazy.jpg';
      fixture.detectChanges();
      tick();

      expect(mockObserver).toBeDefined();
      expect(mockObserver!.observedElements.length).toBe(1);
    }));

    it('should set data-src attribute in fallback mode', fakeAsync(() => {
      component.lazySrc = 'lazy-image.jpg';
      component.src = 'placeholder.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      expect(img.getAttribute('data-src')).toBe('lazy-image.jpg');
    }));

    it('should load image when intersecting', fakeAsync(() => {
      component.lazySrc = 'test-image.jpg';
      component.src = 'placeholder.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      expect(img.getAttribute('data-src')).toBe('test-image.jpg');

      // Simula interseção
      mockObserver!.triggerIntersection(true);
      tick();

      expect(img.getAttribute('src')).toBe('test-image.jpg');
      expect(img.getAttribute('data-src')).toBeNull();
    }));

    it('should add lazy-loading class when loading', fakeAsync(() => {
      component.lazySrc = 'image.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      
      // Simula interseção
      mockObserver!.triggerIntersection(true);
      tick();

      expect(img.classList.contains('lazy-loading')).toBe(true);
    }));

    it('should add lazy-loaded class after successful load', fakeAsync(() => {
      component.lazySrc = 'image.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      
      // Simula interseção
      mockObserver!.triggerIntersection(true);
      tick();

      // Simula carregamento bem-sucedido
      if (img.onload) {
        img.onload(new Event('load'));
      }
      tick();

      expect(img.classList.contains('lazy-loaded')).toBe(true);
      expect(img.classList.contains('lazy-loading')).toBe(false);
    }));

    it('should handle image load error', fakeAsync(() => {
      spyOn(console, 'error');
      
      component.lazySrc = 'broken-image.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      
      // Simula interseção
      mockObserver!.triggerIntersection(true);
      tick();

      // Simula erro de carregamento
      if (img.onerror) {
        img.onerror(new Event('error'));
      }
      tick();

      expect(img.classList.contains('lazy-error')).toBe(true);
      expect(img.classList.contains('lazy-loading')).toBe(false);
      expect(console.error).toHaveBeenCalled();
    }));

    it('should pass rootMargin to IntersectionObserver', fakeAsync(() => {
      component.rootMargin = '50px';
      fixture.detectChanges();
      tick();

      expect(mockObserver!.options.rootMargin).toBe('50px');
    }));

    it('should pass threshold to IntersectionObserver', fakeAsync(() => {
      component.threshold = 0.5;
      fixture.detectChanges();
      tick();

      expect(mockObserver!.options.threshold).toBe(0.5);
    }));

    it('should disconnect observer after loading', fakeAsync(() => {
      component.lazySrc = 'image.jpg';
      fixture.detectChanges();
      tick();

      expect(mockObserver!.observedElements.length).toBe(1);

      // Simula interseção
      mockObserver!.triggerIntersection(true);
      tick();

      expect(mockObserver!.observedElements.length).toBe(0);
    }));

    it('should handle missing lazySrc by using original src', fakeAsync(() => {
      component.lazySrc = undefined;
      component.src = 'original-image.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      expect(img.getAttribute('data-src')).toBe('original-image.jpg');
      
      // Simula interseção
      mockObserver!.triggerIntersection(true);
      tick();

      expect(img.getAttribute('src')).toBe('original-image.jpg');
    }));

    it('should disconnect observer on destroy', fakeAsync(() => {
      component.lazySrc = 'image.jpg';
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
      // No SSR não devemos ter IntersectionObserver mock
      mockObserver = undefined;
      
      TestBed.configureTestingModule({
        imports: [TestComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      imgElement = fixture.debugElement.query(By.css('img'));
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

    it('should not modify image attributes in SSR', fakeAsync(() => {
      component.src = 'original.jpg';
      component.lazySrc = 'lazy.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      // No SSR, atributos não devem ser modificados pela diretiva
      expect(img.getAttribute('loading')).toBeNull();
      expect(img.getAttribute('data-src')).toBeNull();
    }));
  });

  describe('Browser without IntersectionObserver support', () => {
    beforeEach(() => {
      // Remove suporte a loading="lazy"
      if ('loading' in HTMLImageElement.prototype) {
        delete (HTMLImageElement.prototype as any).loading;
      }

      // Remove IntersectionObserver
      (window as any).IntersectionObserver = undefined;

      TestBed.configureTestingModule({
        imports: [TestComponent]
      });

      fixture = TestBed.createComponent(TestComponent);
      component = fixture.componentInstance;
      imgElement = fixture.debugElement.query(By.css('img'));
    });

    it('should load image immediately when no IntersectionObserver', fakeAsync(() => {
      spyOn(console, 'warn');
      
      component.lazySrc = 'image.jpg';
      fixture.detectChanges();
      tick();

      const img = imgElement.nativeElement;
      expect(img.getAttribute('src')).toBe('image.jpg');
      expect(console.warn).toHaveBeenCalledWith(
        '[LazyImgDirective] IntersectionObserver não está disponível. Carregando imagem imediatamente.'
      );
    }));
  });
});
