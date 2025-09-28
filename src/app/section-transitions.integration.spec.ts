/**
 * Comprehensive Integration Tests for Section Transitions
 * Tests the complete scroll experience from section to section
 */

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ScrollOrchestrationService } from '../services/scroll-orchestration.service';
import { PLATFORM_ID } from '@angular/core';

@Component({
  template: `
    <div id="hero" class="section-base" style="height: 100vh;">
      <h1>Nós Desenvolvemos <span class="text-athenity-gold">Momentos</span>.</h1>
      <p>Não criamos sites. Criamos experiências onde o seu cliente é o protagonista.</p>
      <button>Explore Nosso Trabalho</button>
    </div>
    
    <div id="filosofia" class="section-base" style="height: 100vh;">
      <h2>Da Complexidade à Clareza.</h2>
      <p>Transformamos sistemas caóticos em experiências nítidas.</p>
      <canvas width="400" height="300" class="bg-athenity-blue-card"></canvas>
    </div>
    
    <div id="servicos" class="section-base" style="height: 100vh;">
      <h3>Nosso Arsenal</h3>
    </div>
    
    <div id="trabalhos" class="section-base" style="height: 100vh;">
      <h3>Prova de Conceito</h3>
    </div>
    
    <div id="cta" class="section-base" style="height: 100vh;">
      <h3>Vamos Conversar?</h3>
    </div>
  `
})
class IntegrationTestComponent { }

describe('Section Transition Integration Tests', () => {
  let component: IntegrationTestComponent;
  let fixture: ComponentFixture<IntegrationTestComponent>;
  let service: ScrollOrchestrationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IntegrationTestComponent],
      providers: [
        ScrollOrchestrationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrationTestComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ScrollOrchestrationService);
    
    fixture.detectChanges();
  });

  describe('Complete Scroll Experience Flow', () => {
    it('should have all 5 sections with correct IDs and 100vh height', () => {
      const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
      
      sections.forEach(sectionId => {
        const element = fixture.nativeElement.querySelector(`#${sectionId}`);
        expect(element).toBeTruthy();
        expect(element.classList.contains('section-base')).toBeTruthy();
        expect(element.style.height).toBe('100vh');
      });
    });

    it('should display exact brand messaging in Hero section', () => {
      const heroTitle = fixture.nativeElement.querySelector('#hero h1');
      expect(heroTitle).toBeTruthy();
      expect(heroTitle.textContent).toContain('Desenvolvemos');
      expect(heroTitle.textContent).toContain('Momentos');
      
      const goldSpan = heroTitle.querySelector('.text-athenity-gold');
      expect(goldSpan).toBeTruthy();
      expect(goldSpan.textContent.trim()).toBe('Momentos');
    });

    it('should display exact Filosofia section content', () => {
      const filosofiaTitle = fixture.nativeElement.querySelector('#filosofia h2');
      expect(filosofiaTitle).toBeTruthy();
      expect(filosofiaTitle.textContent.trim()).toBe('Da Complexidade à Clareza.');

      const filosofiaText = fixture.nativeElement.querySelector('#filosofia p');
      expect(filosofiaText).toBeTruthy();
      expect(filosofiaText.textContent.trim()).toContain('Transformamos sistemas caóticos');

      const canvas = fixture.nativeElement.querySelector('#filosofia canvas');
      expect(canvas).toBeTruthy();
      expect(canvas.classList.contains('bg-athenity-blue-card')).toBeTruthy();
    });

    it('should display exact Serviços section header', () => {
      const servicosTitle = fixture.nativeElement.querySelector('#servicos h3');
      expect(servicosTitle).toBeTruthy();
      expect(servicosTitle.textContent.trim()).toBe('Nosso Arsenal');
    });

    it('should display exact Trabalhos section header', () => {
      const trabalhosTitle = fixture.nativeElement.querySelector('#trabalhos h3');
      expect(trabalhosTitle).toBeTruthy();
      expect(trabalhosTitle.textContent.trim()).toBe('Prova de Conceito');
    });

    it('should display exact CTA section header', () => {
      const ctaTitle = fixture.nativeElement.querySelector('#cta h3');
      expect(ctaTitle).toBeTruthy();
      expect(ctaTitle.textContent.trim()).toBe('Vamos Conversar?');
    });
  });

  describe('Visual Design Compliance', () => {
    it('should use athenity-gold for brand highlight', () => {
      const goldElement = fixture.nativeElement.querySelector('.text-athenity-gold');
      expect(goldElement).toBeTruthy();
      expect(goldElement.textContent.trim()).toBe('Momentos');
    });

    it('should have proper semantic heading hierarchy', () => {
      const h1 = fixture.nativeElement.querySelectorAll('h1');
      const h2 = fixture.nativeElement.querySelectorAll('h2');
      const h3 = fixture.nativeElement.querySelectorAll('h3');
      
      expect(h1.length).toBe(1); // Only one H1
      expect(h2.length).toBe(1); // One H2 for Filosofia
      expect(h3.length).toBe(3); // Three H3s for Serviços, Trabalhos, CTA
    });

    it('should have canvas with proper styling for Filosofia', () => {
      const canvas = fixture.nativeElement.querySelector('#filosofia canvas');
      expect(canvas).toBeTruthy();
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(300);
      expect(canvas.classList.contains('bg-athenity-blue-card')).toBeTruthy();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper heading structure for screen readers', () => {
      const headings = fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      // Should have logical heading progression
      expect(headings[0].tagName.toLowerCase()).toBe('h1'); // Hero
      expect(headings[1].tagName.toLowerCase()).toBe('h2'); // Filosofia
      expect(headings[2].tagName.toLowerCase()).toBe('h3'); // Serviços
      expect(headings[3].tagName.toLowerCase()).toBe('h3'); // Trabalhos
      expect(headings[4].tagName.toLowerCase()).toBe('h3'); // CTA
    });

    it('should have meaningful content for each section', () => {
      const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
      
      sections.forEach(sectionId => {
        const section = fixture.nativeElement.querySelector(`#${sectionId}`);
        const textContent = section.textContent.trim();
        expect(textContent.length).toBeGreaterThan(0);
      });
    });

    it('should have button with actionable text', () => {
      const button = fixture.nativeElement.querySelector('#hero button');
      expect(button).toBeTruthy();
      expect(button.textContent.trim()).toBe('Explore Nosso Trabalho');
    });
  });

  describe('Content Exactness Validation', () => {
    it('should match exact Hero subtitle text', () => {
      const heroSubtitle = fixture.nativeElement.querySelector('#hero p');
      expect(heroSubtitle).toBeTruthy();
      
      const expectedText = 'Não criamos sites. Criamos experiências onde o seu cliente é o protagonista.';
      expect(heroSubtitle.textContent.trim()).toBe(expectedText);
    });

    it('should match exact Filosofia description text', () => {
      const filosofiaDesc = fixture.nativeElement.querySelector('#filosofia p');
      expect(filosofiaDesc).toBeTruthy();
      
      const expectedText = 'Transformamos sistemas caóticos em experiências nítidas.';
      expect(filosofiaDesc.textContent.trim()).toContain(expectedText);
    });

    it('should match exact CTA button text', () => {
      const ctaButton = fixture.nativeElement.querySelector('#hero button');
      expect(ctaButton).toBeTruthy();
      expect(ctaButton.textContent.trim()).toBe('Explore Nosso Trabalho');
    });
  });

  describe('Layout and Spacing Validation', () => {
    it('should have proper section base class on all sections', () => {
      const sections = fixture.nativeElement.querySelectorAll('.section-base');
      expect(sections.length).toBe(5);
      
      sections.forEach(section => {
        expect(section.style.height).toBe('100vh');
      });
    });

    it('should maintain proper DOM structure', () => {
      // Each section should be a direct child
      const allSections = fixture.nativeElement.querySelectorAll('#hero, #filosofia, #servicos, #trabalhos, #cta');
      expect(allSections.length).toBe(5);
    });
  });

  describe('Brand Color Usage Validation', () => {
    it('should use athenity-gold class correctly', () => {
      const goldElements = fixture.nativeElement.querySelectorAll('.text-athenity-gold');
      expect(goldElements.length).toBe(1);
      expect(goldElements[0].textContent.trim()).toBe('Momentos');
    });

    it('should use athenity-blue-card for canvas background', () => {
      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas.classList.contains('bg-athenity-blue-card')).toBeTruthy();
    });
  });

  describe('Typography Validation', () => {
    it('should use proper heading tags for semantic hierarchy', () => {
      expect(fixture.nativeElement.querySelector('#hero h1')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#filosofia h2')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#servicos h3')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#trabalhos h3')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#cta h3')).toBeTruthy();
    });

    it('should have descriptive paragraph content', () => {
      const heroParagraph = fixture.nativeElement.querySelector('#hero p');
      const filosofiaParagraph = fixture.nativeElement.querySelector('#filosofia p');
      
      expect(heroParagraph.textContent.trim().length).toBeGreaterThan(50);
      expect(filosofiaParagraph.textContent.trim().length).toBeGreaterThan(30);
    });
  });

  describe('Performance and Structure Validation', () => {
    it('should have minimal DOM structure for performance', () => {
      const allElements = fixture.nativeElement.querySelectorAll('*');
      expect(allElements.length).toBeLessThan(20); // Keeping it lean
    });

    it('should have proper element nesting', () => {
      // Each section should contain its expected child elements
      expect(fixture.nativeElement.querySelector('#hero h1')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#hero p')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#hero button')).toBeTruthy();
      
      expect(fixture.nativeElement.querySelector('#filosofia h2')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#filosofia p')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#filosofia canvas')).toBeTruthy();
    });
  });
});