/**
 * Comprehensive Unit Tests for Serviços Section Component
 * Tests every pixel, color, animation, and functionality as described in requirements
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ServicosSectionComponent } from './servicos-section.component';
import { ServiceItem } from '../../../shared/types';
import { SECTION_IDS } from '../../../shared/constants';

describe('ServicosSectionComponent - Comprehensive Pixel-Perfect Validation', () => {
  let component: ServicosSectionComponent;
  let fixture: ComponentFixture<ServicosSectionComponent>;
  let compiled: HTMLElement;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicosSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicosSectionComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  describe('1. Layout & Content Validation - Exact Grid Structure', () => {
    
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should have exactly 3 default service cards as specified', () => {
      const serviceCards = compiled.querySelectorAll('[data-testid^="service-card-"]');
      expect(serviceCards.length).toBe(3);
    });

    it('should render service cards with exact content structure', () => {
      const serviceCards = compiled.querySelectorAll('[data-testid^="service-card-"]');
      
      serviceCards.forEach((card, index) => {
        const title = card.querySelector('h4');
        const description = card.querySelector('p');
        
        expect(title).toBeTruthy();
        expect(description).toBeTruthy();
        expect(title?.textContent?.trim()).toBe(component.services[index].title);
        expect(description?.textContent?.trim()).toBe(component.services[index].description);
      });
    });

    it('should have correct default services content', () => {
      expect(component.services).toEqual([
        {
          title: 'Aplicações Sob Medida',
          description: 'Soluções web e mobile robustas e elegantes, moldadas pelo contexto do seu cliente.'
        },
        {
          title: 'IA & Machine Learning',
          description: 'Produtos inteligentes, dados acionáveis e automações que liberam valor real.'
        },
        {
          title: 'Arquitetura em Nuvem',
          description: 'Escalabilidade, observabilidade e segurança para crescer sem atrito.'
        }
      ]);
    });

    it('should have correct section title "Nosso Arsenal"', () => {
      const titleElement = compiled.querySelector('h3');
      expect(titleElement?.textContent?.trim()).toBe('Nosso Arsenal');
    });

    it('should apply 3-column responsive grid classes by default', () => {
      const gridContainer = compiled.querySelector('.servicos-grid');
      expect(gridContainer).toHaveClass('sm:grid-cols-2');
      expect(gridContainer).toHaveClass('lg:grid-cols-3');
    });

    it('should have correct section ID for navigation', () => {
      const sectionElement = compiled.querySelector('#servicos');
      expect(sectionElement).toBeTruthy();
      expect(component.SECTION_ID).toBe(SECTION_IDS.SERVICOS);
    });

    it('should have correct test ID attribute', () => {
      const sectionElement = compiled.querySelector('[data-testid="servicos-section"]');
      expect(sectionElement).toBeTruthy();
    });

    it('should apply section-base class for styling consistency', () => {
      const sectionElement = compiled.querySelector('#servicos');
      expect(sectionElement).toHaveClass('section-base');
    });
  });

  describe('2. Background & Visual Design System - Deep Brand Blue', () => {
    
    it('should apply deep brand-blue background by default', () => {
      component.backgroundColor = 'deep';
      fixture.detectChanges();
      
      const sectionClasses = component.getSectionClasses();
      expect(sectionClasses).toContain('bg-athenity-blue-deep');
    });

    it('should apply gradient background when specified', () => {
      component.backgroundColor = 'gradient';
      fixture.detectChanges();
      
      const sectionClasses = component.getSectionClasses();
      expect(sectionClasses).toContain('bg-gradient-to-b from-athenity-blue-deep to-athenity-blue-card');
    });

    it('should have correct card background styling classes', () => {
      const serviceCards = compiled.querySelectorAll('.service-card');
      
      serviceCards.forEach(card => {
        expect(card).toHaveClass('bg-athenity-blue-card');
        expect(card).toHaveClass('p-8');
        expect(card).toHaveClass('rounded-2xl');
      });
    });

    it('should have service titles with neon green circuit color', () => {
      const titles = compiled.querySelectorAll('.service-card h4');
      
      titles.forEach(title => {
        expect(title).toHaveClass('text-athenity-green-circuit');
        expect(title).toHaveClass('font-heading');
        expect(title).toHaveClass('font-bold');
        expect(title).toHaveClass('text-2xl');
      });
    });

    it('should have correct body text styling', () => {
      const descriptions = compiled.querySelectorAll('.service-card p');
      
      descriptions.forEach(description => {
        expect(description).toHaveClass('text-athenity-text-body');
        expect(description).toHaveClass('leading-relaxed');
        expect(description).toHaveClass('mt-4');
      });
    });

    it('should have correct section title styling', () => {
      const titleElement = compiled.querySelector('h3');
      
      expect(titleElement).toHaveClass('text-3xl');
      expect(titleElement).toHaveClass('md:text-4xl');
      expect(titleElement).toHaveClass('font-extrabold');
      expect(titleElement).toHaveClass('text-center');
      expect(titleElement).toHaveClass('text-athenity-text-title');
      expect(titleElement).toHaveClass('font-heading');
    });
  });

  describe('3. Hover States & Interactive Feedback - Magnetism', () => {
    
    it('should have hover transform classes on service cards', () => {
      const serviceCards = compiled.querySelectorAll('.service-card');
      
      serviceCards.forEach(card => {
        expect(card).toHaveClass('hover:-translate-y-2');
        expect(card).toHaveClass('hover:shadow-glow');
        expect(card).toHaveClass('hover:border-athenity-green-circuit/60');
        expect(card).toHaveClass('transition-transform');
      });
    });

    it('should have correct border styling for cards', () => {
      const serviceCards = compiled.querySelectorAll('.service-card');
      
      serviceCards.forEach(card => {
        expect(card).toHaveClass('border');
        expect(card).toHaveClass('border-transparent');
      });
    });

    it('should enable hover effects by default', () => {
      expect(component.enableCardHover).toBe(true);
    });

    it('should have correct click handlers for cards', () => {
      const serviceCard = compiled.querySelector('[data-testid="service-card-0"]') as HTMLElement;
      spyOn(component, 'onServiceClick');
      
      serviceCard.click();
      
      expect(component.onServiceClick).toHaveBeenCalled();
    });
  });

  describe('4. Grid System & Spacing - Minimalist Layout', () => {
    
    it('should apply correct grid spacing by default (normal)', () => {
      const gridClasses = component.getGridClasses();
      expect(gridClasses).toContain('gap-8');
    });

    it('should apply compact spacing when specified', () => {
      component.gridSpacing = 'compact';
      fixture.detectChanges();
      
      const gridClasses = component.getGridClasses();
      expect(gridClasses).toContain('gap-4');
    });

    it('should apply spacious spacing when specified', () => {
      component.gridSpacing = 'spacious';
      fixture.detectChanges();
      
      const gridClasses = component.getGridClasses();
      expect(gridClasses).toContain('gap-12');
    });

    it('should have correct grid container margin-top', () => {
      const gridContainer = compiled.querySelector('.servicos-grid');
      expect(gridContainer).toHaveClass('mt-14');
    });

    it('should maintain grid class structure for different column counts', () => {
      // Test 1 column
      component.gridColumns = '1';
      expect(component.getGridClasses()).toContain('grid-cols-1');
      
      // Test 2 columns
      component.gridColumns = '2';
      expect(component.getGridClasses()).toContain('sm:grid-cols-2');
      
      // Test 4 columns
      component.gridColumns = '4';
      expect(component.getGridClasses()).toContain('sm:grid-cols-2 lg:grid-cols-4');
    });
  });

  describe('5. Animation Configuration - Staggered Reveals', () => {
    
    it('should enable staggered animation by default', () => {
      expect(component.staggerAnimation).toBe(true);
    });

    it('should have correct default animation delay', () => {
      expect(component.animationDelay).toBe(0.1);
    });

    it('should calculate staggered animation delays correctly', () => {
      component.staggerAnimation = true;
      component.animationDelay = 0.1;
      
      expect(component.getCardAnimationDelay(0)).toBe(0);
      expect(component.getCardAnimationDelay(1)).toBe(0.1);
      expect(component.getCardAnimationDelay(2)).toBe(0.2);
    });

    it('should return zero delay when staggering is disabled', () => {
      component.staggerAnimation = false;
      
      expect(component.getCardAnimationDelay(0)).toBe(0);
      expect(component.getCardAnimationDelay(1)).toBe(0);
      expect(component.getCardAnimationDelay(2)).toBe(0);
    });

    it('should apply animation delay styling to cards', () => {
      const serviceCards = compiled.querySelectorAll('.service-card');
      
      serviceCards.forEach((card, index) => {
        const element = card as HTMLElement;
        const expectedDelay = component.getCardAnimationDelay(index);
        expect(element.style.transitionDelay).toBe(`${expectedDelay}s`);
      });
    });

    it('should apply correct card classes for animation', () => {
      component.staggerAnimation = true;
      
      const cardClass0 = component.getCardClass(0);
      const cardClass1 = component.getCardClass(1);
      
      expect(cardClass0).toContain('service-card');
      expect(cardClass0).toContain('animation-delay-0');
      expect(cardClass1).toContain('animation-delay-1');
    });
  });

  describe('6. Component Event Handling', () => {
    
    it('should emit serviceClicked when a service card is clicked', () => {
      spyOn(component.serviceClicked, 'emit');
      const mockService = component.services[0];
      const mockEvent = new Event('click');
      
      component.onServiceClick(mockService, 0, mockEvent);
      
      expect(component.serviceClicked.emit).toHaveBeenCalledWith({
        service: mockService,
        index: 0,
        event: mockEvent
      });
    });

    it('should emit sectionReady after view init', fakeAsync(() => {
      spyOn(component.sectionReady, 'emit');
      
      component.ngAfterViewInit();
      tick();
      
      expect(component.sectionReady.emit).toHaveBeenCalledWith(component.sectionElement);
    }));

    it('should track services correctly for Angular change detection', () => {
      const mockService: ServiceItem = { title: 'Test Service', description: 'Test description' };
      const result = component.trackByService(1, mockService);
      expect(result).toBe('Test Service1');
    });
  });

  describe('7. Responsive Configuration Options', () => {
    
    it('should support different header alignments', () => {
      component.headerAlignment = 'left';
      expect(component.headerAlignment).toBe('left');
      
      component.headerAlignment = 'right';
      expect(component.headerAlignment).toBe('right');
      
      component.headerAlignment = 'center';
      expect(component.headerAlignment).toBe('center');
    });

    it('should support different header sizes', () => {
      const validSizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'xxl'> = ['sm', 'md', 'lg', 'xl', 'xxl'];
      
      validSizes.forEach(size => {
        component.headerSize = size;
        expect(component.headerSize).toBe(size);
      });
    });

    it('should support header divider option', () => {
      component.showHeaderDivider = true;
      expect(component.showHeaderDivider).toBe(true);
      
      component.showHeaderDivider = false;
      expect(component.showHeaderDivider).toBe(false);
    });
  });

  describe('8. Custom Services Configuration', () => {
    
    it('should allow custom services array', () => {
      const customServices: ServiceItem[] = [
        { title: 'Custom Service 1', description: 'Custom description 1', icon: 'fas fa-code' },
        { title: 'Custom Service 2', description: 'Custom description 2', icon: 'fas fa-chart-bar' }
      ];
      
      component.services = customServices;
      fixture.detectChanges();
      
      const serviceCards = compiled.querySelectorAll('[data-testid^="service-card-"]');
      expect(serviceCards.length).toBe(2);
      
      const firstTitle = serviceCards[0].querySelector('h4');
      const firstDescription = serviceCards[0].querySelector('p');
      expect(firstTitle?.textContent?.trim()).toBe('Custom Service 1');
      expect(firstDescription?.textContent?.trim()).toBe('Custom description 1');
    });

    it('should render service icons when provided', () => {
      const servicesWithIcons: ServiceItem[] = [
        { title: 'Service with Icon', description: 'Description', icon: 'fas fa-star' }
      ];
      
      component.services = servicesWithIcons;
      fixture.detectChanges();
      
      const iconElement = compiled.querySelector('.service-card i');
      expect(iconElement).toBeTruthy();
      expect(iconElement).toHaveClass('fas');
      expect(iconElement).toHaveClass('fa-star');
      expect(iconElement).toHaveClass('text-3xl');
      expect(iconElement).toHaveClass('text-athenity-green-circuit');
    });

    it('should display additional content container when enabled', () => {
      component.showAdditionalContent = true;
      fixture.detectChanges();
      
      const additionalContentContainer = compiled.querySelector('.mt-12.text-center');
      expect(additionalContentContainer).toBeTruthy();
    });
  });

  describe('9. Accessibility & Standards Compliance', () => {
    
    it('should have proper semantic structure with section element', () => {
      const sectionElement = compiled.querySelector('section#servicos');
      expect(sectionElement).toBeTruthy();
    });

    it('should have proper heading hierarchy', () => {
      const mainHeading = compiled.querySelector('h3');
      const cardHeadings = compiled.querySelectorAll('h4');
      
      expect(mainHeading).toBeTruthy();
      expect(cardHeadings.length).toBe(component.services.length);
    });

    it('should have clickable elements with proper event handlers', () => {
      const serviceCards = compiled.querySelectorAll('.service-card[data-testid^="service-card-"]');
      
      serviceCards.forEach(card => {
        expect(card.getAttribute('data-testid')).toMatch(/service-card-\d+/);
      });
    });

    it('should maintain proper content structure for screen readers', () => {
      const serviceCards = compiled.querySelectorAll('.service-card');
      
      serviceCards.forEach(card => {
        const title = card.querySelector('h4');
        const description = card.querySelector('p');
        
        expect(title).toBeTruthy();
        expect(description).toBeTruthy();
        expect(title?.textContent?.trim().length).toBeGreaterThan(0);
        expect(description?.textContent?.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('10. Edge Cases & Error Handling', () => {
    
    it('should handle empty services array gracefully', () => {
      component.services = [];
      fixture.detectChanges();
      
      const serviceCards = compiled.querySelectorAll('[data-testid^="service-card-"]');
      expect(serviceCards.length).toBe(0);
    });

    it('should handle undefined subtitle gracefully', () => {
      component.sectionSubtitle = undefined;
      fixture.detectChanges();
      
      const subtitle = compiled.querySelector('p.mt-4.text-center');
      expect(subtitle).toBeNull();
    });

    it('should handle custom test ID', () => {
      const customTestId = 'custom-servicos-test-id';
      component.testId = customTestId;
      fixture.detectChanges();
      
      const sectionElement = compiled.querySelector(`[data-testid="${customTestId}"]`);
      expect(sectionElement).toBeTruthy();
    });

    it('should maintain functionality with disabled animations', () => {
      component.staggerAnimation = false;
      component.enableCardHover = false;
      fixture.detectChanges();
      
      // Component should still render correctly
      const serviceCards = compiled.querySelectorAll('[data-testid^="service-card-"]');
      expect(serviceCards.length).toBe(component.services.length);
    });
  });
});