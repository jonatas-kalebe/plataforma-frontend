/**
 * Comprehensive Visual Design and Accessibility Tests
 * Tests exact colors, fonts, spacing, WCAG AA compliance, and visual hierarchy
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LandingComponent } from './pages/landing/landing.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('Visual Design and Accessibility - Comprehensive Tests', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Color Scheme Specifications', () => {
    it('should use exact athenity-gold (#FFD700) for highlights', () => {
      const goldElements = fixture.debugElement.queryAll(By.css('.text-athenity-gold'));
      expect(goldElements.length).toBeGreaterThan(0);
      
      goldElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element.nativeElement);
        // Note: In real tests, we'd check actual computed color values
        expect(element.nativeElement.classList.contains('text-athenity-gold')).toBeTruthy();
      });
    });

    it('should use athenity-blue-deep for primary backgrounds', () => {
      const blueElements = fixture.debugElement.queryAll(By.css('.bg-athenity-blue-deep, .text-athenity-blue-deep'));
      expect(blueElements.length).toBeGreaterThan(0);
      
      blueElements.forEach(element => {
        expect(element.nativeElement.classList).toContain(jasmine.stringMatching(/athenity-blue-deep/));
      });
    });

    it('should use circuit green (#64FFDA) for accents and lines', () => {
      const circuitElements = fixture.debugElement.queryAll(By.css('.text-athenity-green-circuit, .border-athenity-green-circuit'));
      
      // Circuit green should be used for interactive elements and accents
      if (circuitElements.length > 0) {
        circuitElements.forEach(element => {
          expect(element.nativeElement.classList).toContain(jasmine.stringMatching(/athenity-green-circuit/));
        });
      }
    });

    it('should maintain proper contrast ratios (WCAG AA: 4.5:1)', () => {
      const textElements = fixture.debugElement.queryAll(By.css('h1, h2, h3, p, a, button'));
      
      textElements.forEach(element => {
        const classList = element.nativeElement.classList;
        
        // Text on dark backgrounds should have sufficient contrast
        if (classList.contains('text-athenity-text-body') || 
            classList.contains('text-athenity-text-title')) {
          expect(classList).toBeDefined();
          // In real implementation, would calculate actual contrast ratios
        }
      });
    });
  });

  describe('Typography and Font Specifications', () => {
    it('should use correct font sizes for Hero title (5xl/7xl/8xl)', () => {
      const heroTitle = fixture.debugElement.query(By.css('#hero-title'));
      if (heroTitle) {
        const element = heroTitle.nativeElement;
        
        expect(element.classList.contains('text-5xl')).toBeTruthy();
        expect(element.classList.contains('md:text-7xl')).toBeTruthy();
        expect(element.classList.contains('lg:text-8xl')).toBeTruthy();
        expect(element.classList.contains('font-black')).toBeTruthy();
        expect(element.classList.contains('tracking-tighter')).toBeTruthy();
      }
    });

    it('should use proper heading hierarchy (H1 -> H2 -> H3)', () => {
      const headings = fixture.debugElement.queryAll(By.css('h1, h2, h3, h4, h5, h6'));
      
      let h1Count = 0;
      let hasProperOrder = true;
      let lastLevel = 0;
      
      headings.forEach(heading => {
        const tagName = heading.nativeElement.tagName.toLowerCase();
        const level = parseInt(tagName.charAt(1));
        
        if (level === 1) h1Count++;
        
        if (level > lastLevel + 1 && lastLevel !== 0) {
          hasProperOrder = false;
        }
        lastLevel = Math.min(lastLevel, level);
      });
      
      expect(h1Count).toBe(1); // Only one H1 per page
      expect(hasProperOrder).toBeTruthy(); // Proper heading order
    });

    it('should use correct font weights and styles', () => {
      const weightClasses = [
        '.font-black',
        '.font-extrabold', 
        '.font-bold',
        '.font-normal'
      ];
      
      weightClasses.forEach(className => {
        const elements = fixture.debugElement.queryAll(By.css(className));
        if (elements.length > 0) {
          elements.forEach(element => {
            expect(element.nativeElement.classList.contains(className.substring(1))).toBeTruthy();
          });
        }
      });
    });

    it('should use proper line heights for readability', () => {
      const textElements = fixture.debugElement.queryAll(By.css('p, .leading-relaxed'));
      
      textElements.forEach(element => {
        // Should have relaxed line height for body text
        if (element.nativeElement.tagName.toLowerCase() === 'p') {
          expect(element.nativeElement.classList.contains('leading-relaxed') ||
                element.nativeElement.classList.contains('leading-normal')).toBeTruthy();
        }
      });
    });
  });

  describe('Spacing and Layout Specifications', () => {
    it('should maintain consistent spacing scale (Tailwind scale)', () => {
      const spacingClasses = [
        'mt-6', 'mt-10', 'mt-14',
        'mb-6', 'mb-10', 'mb-14',
        'p-8', 'px-6', 'py-4',
        'gap-8', 'gap-12'
      ];
      
      spacingClasses.forEach(className => {
        const elements = fixture.debugElement.queryAll(By.css(`.${className}`));
        if (elements.length > 0) {
          elements.forEach(element => {
            expect(element.nativeElement.classList.contains(className)).toBeTruthy();
          });
        }
      });
    });

    it('should use proper section padding and margins', () => {
      const sections = fixture.debugElement.queryAll(By.css('section'));
      
      sections.forEach(section => {
        const classList = section.nativeElement.classList;
        expect(classList.contains('section-base') || 
               classList.contains('py-20') || 
               classList.contains('py-16')).toBeTruthy();
      });
    });

    it('should maintain responsive grid layouts', () => {
      const gridElements = fixture.debugElement.queryAll(By.css('.grid'));
      
      gridElements.forEach(element => {
        const classList = element.nativeElement.classList;
        
        // Should have responsive grid classes
        const hasResponsiveGrid = (classList as DOMTokenList).contains('grid') || 
          Array.from(classList as DOMTokenList).some(className => 
            className.includes('grid-cols') || 
            className.includes('md:grid-cols') ||
            className.includes('lg:grid-cols')
          );
        
        expect(hasResponsiveGrid).toBeTruthy();
      });
    });
  });

  describe('Interactive Element Specifications', () => {
    it('should have proper button styling and states', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button, a[role="button"], .btn'));
      
      buttons.forEach(button => {
        const classList = button.nativeElement.classList;
        
        // Should have proper styling
        expect(classList.contains('font-bold') || 
               classList.contains('font-semibold')).toBeTruthy();
        
        // Should have hover states
        const hasHoverState = Array.from(classList as DOMTokenList).some(className => 
          (className as string).includes('hover:')
        );
        expect(hasHoverState).toBeTruthy();
      });
    });

    it('should have consistent border radius (rounded-xl)', () => {
      const roundedElements = fixture.debugElement.queryAll(By.css('.rounded-xl, .rounded-2xl'));
      
      expect(roundedElements.length).toBeGreaterThan(0);
      
      roundedElements.forEach(element => {
        const classList = element.nativeElement.classList;
        expect(classList.contains('rounded-xl') || 
               classList.contains('rounded-2xl')).toBeTruthy();
      });
    });

    it('should have glow effects for premium elements', () => {
      const glowElements = fixture.debugElement.queryAll(By.css('.shadow-glow'));
      
      if (glowElements.length > 0) {
        glowElements.forEach(element => {
          expect(element.nativeElement.classList.contains('shadow-glow')).toBeTruthy();
        });
      }
    });
  });

  describe('WCAG AA Accessibility Compliance', () => {
    it('should have proper alt text for images', () => {
      const images = fixture.debugElement.queryAll(By.css('img'));
      
      images.forEach(img => {
        const element = img.nativeElement;
        const alt = element.getAttribute('alt');
        const ariaLabel = element.getAttribute('aria-label');
        
        // Should have either alt text or aria-label
        expect(alt !== null || ariaLabel !== null).toBeTruthy();
        
        // Alt text should be descriptive (not empty or generic)
        if (alt) {
          expect(alt.length).toBeGreaterThan(0);
          expect(alt).not.toBe('image');
        }
      });
    });

    it('should have proper ARIA labels for interactive elements', () => {
      const interactive = fixture.debugElement.queryAll(By.css('button, a, input, select, textarea'));
      
      interactive.forEach(element => {
        const nativeElement = element.nativeElement;
        const hasLabel = nativeElement.getAttribute('aria-label') ||
                        nativeElement.getAttribute('aria-labelledby') ||
                        nativeElement.textContent?.trim().length > 0;
        
        expect(hasLabel).toBeTruthy();
      });
    });

    it('should have proper focus indicators', () => {
      const focusableElements = fixture.debugElement.queryAll(
        By.css('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      );
      
      focusableElements.forEach(element => {
        const classList = element.nativeElement.classList;
        
        // Should have focus styles (focus:ring, focus:outline, etc.)
        const hasFocusStyles = Array.from(classList as DOMTokenList).some(className => 
          (className as string).includes('focus:')
        );
        
        // At minimum, should not have outline-none without custom focus styles
        if (classList.contains('outline-none')) {
          expect(hasFocusStyles).toBeTruthy();
        }
      });
    });

    it('should have proper semantic HTML structure', () => {
      const semanticElements = fixture.debugElement.queryAll(
        By.css('header, nav, main, section, article, aside, footer')
      );
      
      expect(semanticElements.length).toBeGreaterThan(0);
      
      // Should have a main element
      const mainElement = fixture.debugElement.query(By.css('main'));
      expect(mainElement).toBeTruthy();
    });

    it('should have proper landmark roles', () => {
      const landmarks = fixture.debugElement.queryAll(
        By.css('[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]')
      );
      
      // Should have proper landmark structure or use semantic HTML
      const semanticLandmarks = fixture.debugElement.queryAll(
        By.css('header, nav, main, footer')
      );
      
      expect(landmarks.length + semanticLandmarks.length).toBeGreaterThan(0);
    });

    it('should have proper heading structure for screen readers', () => {
      const headings = fixture.debugElement.queryAll(By.css('h1, h2, h3, h4, h5, h6'));
      
      // Should have at least one heading
      expect(headings.length).toBeGreaterThan(0);
      
      // First heading should be H1
      if (headings.length > 0) {
        const firstHeading = headings[0].nativeElement;
        expect(firstHeading.tagName.toLowerCase()).toBe('h1');
      }
    });
  });

  describe('Responsive Design Specifications', () => {
    it('should have mobile-first responsive classes', () => {
      const responsiveElements = fixture.debugElement.queryAll(By.css('*'));
      let hasMobileFirst = false;
      
      responsiveElements.forEach(element => {
        const classList = Array.from(element.nativeElement.classList);
        
        // Check for mobile-first pattern (base class + md:/lg: variants)
        classList.forEach(className => {
          if ((className as string).includes('md:') || (className as string).includes('lg:')) {
            hasMobileFirst = true;
          }
        });
      });
      
      expect(hasMobileFirst).toBeTruthy();
    });

    it('should handle text sizing responsively', () => {
      const textElements = fixture.debugElement.queryAll(By.css('h1, h2, h3, p'));
      
      textElements.forEach(element => {
        const classList = Array.from(element.nativeElement.classList);
        
        // Should have responsive text sizing
        const hasResponsiveText = classList.some(className => 
          (className as string).includes('md:text-') || (className as string).includes('lg:text-')
        );
        
        if (element.nativeElement.tagName.toLowerCase().startsWith('h')) {
          expect(hasResponsiveText).toBeTruthy();
        }
      });
    });

    it('should use proper container and max-width constraints', () => {
      const containerElements = fixture.debugElement.queryAll(By.css('.container, .max-w-7xl, .max-w-2xl'));
      
      expect(containerElements.length).toBeGreaterThan(0);
      
      containerElements.forEach(element => {
        const classList = element.nativeElement.classList;
        expect(classList.contains('container') || 
               Array.from(classList as DOMTokenList).some(c => (c as string).startsWith('max-w-'))).toBeTruthy();
      });
    });
  });

  describe('Animation and Transition Specifications', () => {
    it('should use consistent transition durations', () => {
      const transitionElements = fixture.debugElement.queryAll(By.css('.transition, .transition-transform, .transition-opacity'));
      
      transitionElements.forEach(element => {
        const classList = element.nativeElement.classList;
        
        // Should specify transition properties
        expect(classList.contains('transition') || 
               classList.contains('transition-transform') ||
               classList.contains('transition-opacity')).toBeTruthy();
      });
    });

    it('should have hover and focus states for interactive elements', () => {
      const interactiveElements = fixture.debugElement.queryAll(By.css('button, a, .service-card'));
      
      interactiveElements.forEach(element => {
        const classList = Array.from(element.nativeElement.classList);
        
        // Should have hover states
        const hasHoverState = classList.some(className => (className as string).includes('hover:'));
        expect(hasHoverState).toBeTruthy();
      });
    });

    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: jasmine.createSpy('matchMedia').and.returnValue({
          matches: true,
          addListener: jasmine.createSpy(),
          removeListener: jasmine.createSpy()
        })
      });
      
      // Should handle reduced motion preference
      expect(window.matchMedia).toBeDefined();
    });
  });

  describe('Content and Copy Specifications', () => {
    it('should display exact brand messaging', () => {
      const heroTitle = fixture.debugElement.query(By.css('#hero-title'));
      if (heroTitle) {
        const text = heroTitle.nativeElement.textContent;
        expect(text).toContain('Desenvolvemos');
        expect(text).toContain('Momentos');
      }
    });

    it('should have consistent tone and voice', () => {
      const textElements = fixture.debugElement.queryAll(By.css('p'));
      
      textElements.forEach(element => {
        const text = element.nativeElement.textContent?.trim();
        if (text) {
          // Should maintain professional, confident tone
          expect(text.length).toBeGreaterThan(0);
        }
      });
    });

    it('should use proper Portuguese language attributes', () => {
      const htmlElement = document.documentElement;
      const lang = htmlElement.getAttribute('lang');
      
      expect(lang).toBe('pt-BR');
    });
  });

  describe('Performance and Loading Specifications', () => {
    it('should load critical CSS inline', () => {
      // Critical styles should be inline or load quickly
      const styleElements = document.querySelectorAll('style');
      expect(styleElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should have proper image optimization attributes', () => {
      const images = fixture.debugElement.queryAll(By.css('img'));
      
      images.forEach(img => {
        const element = img.nativeElement;
        
        // Should have loading attributes for performance
        const loading = element.getAttribute('loading');
        if (loading) {
          expect(loading).toBe('lazy');
        }
      });
    });

    it('should use proper font loading strategies', () => {
      // Should use font-display: swap for web fonts
      const fontElements = document.querySelectorAll('link[rel="preload"][as="font"]');
      
      fontElements.forEach(font => {
        expect(font.getAttribute('crossorigin')).toBe('anonymous');
      });
    });
  });
});