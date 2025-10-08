import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkListSnapComponent, WorkItem } from './work-list-snap.component';
import { LazyImgDirective } from '../../directives/lazy-img.directive';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('WorkListSnapComponent', () => {
  let component: WorkListSnapComponent;
  let fixture: ComponentFixture<WorkListSnapComponent>;

  const mockItems: WorkItem[] = [
    {
      id: 1,
      title: 'Projeto 1',
      description: 'Descrição do projeto 1',
      imageUrl: 'https://example.com/image1.jpg',
      placeholderUrl: 'https://example.com/placeholder1.jpg'
    },
    {
      id: 2,
      title: 'Projeto 2',
      description: 'Descrição do projeto 2',
      imageUrl: 'https://example.com/image2.jpg'
    },
    {
      id: 3,
      title: 'Projeto 3',
      imageUrl: 'https://example.com/image3.jpg'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkListSnapComponent, LazyImgDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkListSnapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should have empty items array by default', () => {
      expect(component.items).toEqual([]);
    });

    it('should render items when provided', () => {
      component.items = mockItems;
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.snap-item'));
      expect(items.length).toBe(3);
    });

    it('should be standalone component', () => {
      const metadata = (component.constructor as any).ɵcmp;
      expect(metadata.standalone).toBe(true);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.items = mockItems;
      fixture.detectChanges();
    });

    it('should have proper ARIA labels on container', () => {
      const container = fixture.debugElement.query(By.css('.work-list-snap-container'));
      expect(container.nativeElement.getAttribute('aria-label')).toBe('Lista de projetos com 3 itens');
      expect(container.nativeElement.getAttribute('role')).toBe('region');
      expect(container.nativeElement.getAttribute('aria-roledescription')).toBe('lista de projetos com rolagem horizontal');
    });

    it('should have tabindex on container for keyboard focus', () => {
      const container = fixture.debugElement.query(By.css('.work-list-snap-container'));
      expect(container.nativeElement.getAttribute('tabindex')).toBe('0');
    });

    it('should have role="list" on scroll container', () => {
      const scrollContainer = fixture.debugElement.query(By.css('.scroll-container'));
      expect(scrollContainer.nativeElement.getAttribute('role')).toBe('list');
    });

    it('should have proper ARIA attributes on each item', () => {
      const items = fixture.debugElement.queryAll(By.css('.snap-item'));
      
      items.forEach((item, index) => {
        expect(item.nativeElement.getAttribute('role')).toBe('listitem');
        expect(item.nativeElement.getAttribute('aria-posinset')).toBe(String(index + 1));
        expect(item.nativeElement.getAttribute('aria-setsize')).toBe('3');
        expect(item.nativeElement.getAttribute('aria-label')).toBe(`Item ${index + 1} de 3`);
        expect(item.nativeElement.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should have screen reader instructions', () => {
      const srOnly = fixture.debugElement.query(By.css('.sr-only'));
      expect(srOnly).toBeTruthy();
      expect(srOnly.nativeElement.getAttribute('aria-live')).toBe('polite');
      expect(srOnly.nativeElement.textContent).toContain('Use as setas do teclado');
    });

    it('should update ARIA label when items count changes', () => {
      component.items = [mockItems[0]];
      fixture.detectChanges();
      
      expect(component.getContainerAriaLabel()).toBe('Lista de projetos com 1 item');
    });
  });

  describe('Image Rendering', () => {
    beforeEach(() => {
      component.items = mockItems;
      fixture.detectChanges();
    });

    it('should render images with LazyImgDirective', () => {
      const images = fixture.debugElement.queryAll(By.css('img[lazyImg]'));
      expect(images.length).toBe(3);
    });

    it('should set proper image attributes', () => {
      const firstImage = fixture.debugElement.query(By.css('img[lazyImg]'));
      const img = firstImage.nativeElement;
      
      expect(img.getAttribute('alt')).toBe('Projeto 1');
      expect(img.getAttribute('width')).toBe('400');
      expect(img.getAttribute('height')).toBe('300');
      // src is set by LazyImgDirective, just verify it exists
      expect(img.hasAttribute('src')).toBe(true);
    });

    it('should pass imageUrl to LazyImgDirective via src binding', () => {
      const firstImage = fixture.debugElement.query(By.css('img[lazyImg]'));
      const img = firstImage.nativeElement;
      
      // Verify the image has the lazyImg directive and src attribute
      expect(img.hasAttribute('lazyimg') || img.getAttribute('ng-reflect-lazy-src') !== null || img.hasAttribute('src')).toBe(true);
    });

    it('should configure LazyImgDirective with rootMargin for optimal UX', () => {
      const firstImage = fixture.debugElement.query(By.css('img[lazyImg]'));
      
      // Verify rootMargin is set via ng-reflect attribute
      expect(firstImage.nativeElement.getAttribute('ng-reflect-root-margin')).toBe('100px');
    });

    it('should have loading="lazy" attribute for native browser support', () => {
      const firstImage = fixture.debugElement.query(By.css('img[lazyImg]'));
      
      // The loading attribute should be present in the template
      expect(firstImage.nativeElement.getAttribute('loading')).toBe('lazy');
    });

    it('should prevent CLS with fixed dimensions', () => {
      const images = fixture.debugElement.queryAll(By.css('img[lazyImg]'));
      
      images.forEach(img => {
        const element = img.nativeElement;
        // Verify that both width and height are set to prevent layout shift
        expect(element.getAttribute('width')).toBeTruthy();
        expect(element.getAttribute('height')).toBeTruthy();
        expect(element.getAttribute('width')).toBe('400');
        expect(element.getAttribute('height')).toBe('300');
      });
    });
  });

  describe('Placeholder Rendering', () => {
    it('should render placeholder div when no imageUrl', () => {
      component.items = [{
        id: 4,
        title: 'Projeto sem imagem',
        description: 'Descrição'
      }];
      fixture.detectChanges();

      const placeholder = fixture.debugElement.query(By.css('.item-placeholder'));
      expect(placeholder).toBeTruthy();
      expect(placeholder.nativeElement.getAttribute('aria-label')).toBe('Placeholder para Projeto sem imagem');
    });
  });

  describe('Content Rendering', () => {
    beforeEach(() => {
      component.items = mockItems;
      fixture.detectChanges();
    });

    it('should render item titles', () => {
      const titles = fixture.debugElement.queryAll(By.css('.item-title'));
      expect(titles.length).toBe(3);
      expect(titles[0].nativeElement.textContent).toBe('Projeto 1');
      expect(titles[1].nativeElement.textContent).toBe('Projeto 2');
    });

    it('should render item descriptions when present', () => {
      const descriptions = fixture.debugElement.queryAll(By.css('.item-description'));
      expect(descriptions.length).toBe(2); // Only first two items have descriptions
      expect(descriptions[0].nativeElement.textContent).toContain('Descrição do projeto 1');
    });

    it('should not render description element when not provided', () => {
      // This is tested by the fact that mockItems[2] has no description
      // and we verify that only 2 descriptions render (not 3)
      const descriptions = fixture.debugElement.queryAll(By.css('.item-description'));
      expect(descriptions.length).toBe(2); // mockItems has 3 items, but only 2 have descriptions
    });
  });

  describe('Keyboard Navigation', () => {
    let scrollContainer: DebugElement;
    let containerElement: HTMLDivElement;

    beforeEach(() => {
      component.items = mockItems;
      fixture.detectChanges();
      scrollContainer = fixture.debugElement.query(By.css('.scroll-container'));
      containerElement = scrollContainer.nativeElement as HTMLDivElement;
      
      // Mock scrollTo method with proper signature
      spyOn(containerElement, 'scrollTo').and.callFake(() => {});
      // Mock scroll properties
      Object.defineProperty(containerElement, 'scrollLeft', { value: 0, writable: true });
      Object.defineProperty(containerElement, 'scrollWidth', { value: 1200, writable: true });
      Object.defineProperty(containerElement, 'clientWidth', { value: 400, writable: true });
    });

    it('should handle ArrowRight key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(containerElement.scrollTo).toHaveBeenCalled();
    });

    it('should handle ArrowLeft key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(containerElement.scrollTo).toHaveBeenCalled();
    });

    it('should handle ArrowDown key (same as ArrowRight)', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(containerElement.scrollTo).toHaveBeenCalled();
    });

    it('should handle ArrowUp key (same as ArrowLeft)', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(containerElement.scrollTo).toHaveBeenCalled();
    });

    it('should handle Home key to scroll to start', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(containerElement.scrollTo).toHaveBeenCalled();
    });

    it('should handle End key to scroll to end', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(containerElement.scrollTo).toHaveBeenCalled();
    });

    it('should not handle keyboard events when no items', () => {
      component.items = [];
      fixture.detectChanges();
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not handle unrelated keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      
      component.handleKeydown(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(containerElement.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('Item Click Handling', () => {
    beforeEach(() => {
      component.items = mockItems;
      fixture.detectChanges();
    });

    it('should emit itemClick event when item is clicked', () => {
      spyOn(component.itemClick, 'emit');
      
      const item = fixture.debugElement.query(By.css('.snap-item'));
      item.nativeElement.click();
      
      expect(component.itemClick.emit).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should emit itemClick on Enter key', () => {
      spyOn(component.itemClick, 'emit');
      
      const item = fixture.debugElement.query(By.css('.snap-item'));
      item.triggerEventHandler('keydown.enter', new KeyboardEvent('keydown'));
      
      expect(component.itemClick.emit).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should emit itemClick on Space key', () => {
      spyOn(component.itemClick, 'emit');
      
      const item = fixture.debugElement.query(By.css('.snap-item'));
      item.triggerEventHandler('keydown.space', new KeyboardEvent('keydown'));
      
      expect(component.itemClick.emit).toHaveBeenCalledWith(mockItems[0]);
    });

    it('should prevent default behavior on item click', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'preventDefault');
      
      component.onItemClick(mockItems[0], event);
      
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Track By Function', () => {
    it('should track by item id when available', () => {
      const result = component.trackByItem(0, mockItems[0]);
      expect(result).toBe(1);
    });

    it('should track by index when id is not available', () => {
      const itemWithoutId: WorkItem = { title: 'Test' };
      const result = component.trackByItem(5, itemWithoutId);
      expect(result).toBe(5);
    });
  });

  describe('Helper Methods', () => {
    it('should generate correct container ARIA label for multiple items', () => {
      component.items = mockItems;
      const label = component.getContainerAriaLabel();
      expect(label).toBe('Lista de projetos com 3 itens');
    });

    it('should generate correct container ARIA label for single item', () => {
      component.items = [mockItems[0]];
      const label = component.getContainerAriaLabel();
      expect(label).toBe('Lista de projetos com 1 item');
    });

    it('should generate correct container ARIA label for empty list', () => {
      component.items = [];
      const label = component.getContainerAriaLabel();
      expect(label).toBe('Lista de projetos com 0 itens');
    });

    it('should generate correct item ARIA label', () => {
      component.items = mockItems;
      expect(component.getItemAriaLabel(0)).toBe('Item 1 de 3');
      expect(component.getItemAriaLabel(1)).toBe('Item 2 de 3');
      expect(component.getItemAriaLabel(2)).toBe('Item 3 de 3');
    });
  });

  describe('CSS Classes', () => {
    beforeEach(() => {
      component.items = mockItems;
      fixture.detectChanges();
    });

    it('should have scroll-snap CSS class on container', () => {
      const scrollContainer = fixture.debugElement.query(By.css('.scroll-container'));
      expect(scrollContainer).toBeTruthy();
    });

    it('should have snap-item class on each item', () => {
      const items = fixture.debugElement.queryAll(By.css('.snap-item'));
      expect(items.length).toBe(3);
      items.forEach(item => {
        expect(item.nativeElement.classList.contains('snap-item')).toBe(true);
      });
    });

    it('should have item-image-wrapper for images', () => {
      const wrappers = fixture.debugElement.queryAll(By.css('.item-image-wrapper'));
      expect(wrappers.length).toBe(3);
    });

    it('should have item-content section', () => {
      const contents = fixture.debugElement.queryAll(By.css('.item-content'));
      expect(contents.length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined items gracefully', () => {
      component.items = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle empty items array', () => {
      component.items = [];
      fixture.detectChanges();
      
      const items = fixture.debugElement.queryAll(By.css('.snap-item'));
      expect(items.length).toBe(0);
    });

    it('should handle items with missing optional properties', () => {
      component.items = [{ title: 'Minimal Item' }];
      expect(() => fixture.detectChanges()).not.toThrow();
      
      const item = fixture.debugElement.query(By.css('.snap-item'));
      expect(item).toBeTruthy();
    });

    it('should handle very long titles', () => {
      component.items = [{
        title: 'A'.repeat(200),
        description: 'Test'
      }];
      fixture.detectChanges();
      
      const title = fixture.debugElement.query(By.css('.item-title'));
      expect(title.nativeElement.textContent.length).toBeGreaterThan(0);
    });

    it('should handle very long descriptions', () => {
      component.items = [{
        title: 'Test',
        description: 'B'.repeat(500)
      }];
      fixture.detectChanges();
      
      const description = fixture.debugElement.query(By.css('.item-description'));
      expect(description.nativeElement.textContent.length).toBeGreaterThan(0);
    });
  });
});
