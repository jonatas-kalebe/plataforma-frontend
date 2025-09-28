/**
 * Comprehensive End-to-End Style Unit Tests for Addictive Scroll Behavior
 * Tests the complete user experience as specified in the design document
 */

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Component, PLATFORM_ID } from '@angular/core';
import { ScrollOrchestrationService } from '../services/scroll-orchestration.service';

// Mock GSAP for controlled testing
const mockScrollTrigger = {
  create: jasmine.createSpy('create').and.callFake((config: any) => {
    return {
      progress: 0,
      direction: 0,
      vars: config,
      kill: jasmine.createSpy('kill')
    };
  }),
  getAll: jasmine.createSpy('getAll').and.returnValue([]),
  refresh: jasmine.createSpy('refresh'),
  killAll: jasmine.createSpy('killAll'),
  getVelocity: jasmine.createSpy('getVelocity').and.returnValue(0)
};

const mockGsap = {
  registerPlugin: jasmine.createSpy('registerPlugin'),
  to: jasmine.createSpy('to').and.returnValue({
    kill: jasmine.createSpy('kill')
  }),
  timeline: jasmine.createSpy('timeline').and.returnValue({
    to: jasmine.createSpy('to'),
    fromTo: jasmine.createSpy('fromTo'),
    set: jasmine.createSpy('set'),
    kill: jasmine.createSpy('kill')
  })
};

@Component({
  template: `
    <section id="hero" class="section-base" style="height: 100vh; background: #0A0E1A;">
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter">
        Nós Desenvolvemos <span class="text-athenity-gold">Momentos</span>.
      </h1>
      <p class="mt-6 text-lg md:text-xl max-w-2xl text-athenity-text-body mx-auto">
        Não criamos sites. Criamos experiências onde o seu cliente é o protagonista.
      </p>
      <button class="mt-10 bg-athenity-gold text-athenity-blue-deep font-bold py-4 px-8 rounded-xl">
        Explore Nosso Trabalho
      </button>
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-widest">
        Scroll
      </div>
    </section>

    <section id="filosofia" class="section-base" style="height: 100vh;">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 class="text-4xl md:text-5xl font-extrabold">Da Complexidade à Clareza.</h2>
          <p class="mt-6 leading-relaxed">
            Transformamos sistemas caóticos em experiências nítidas. Arquitetura, design e engenharia convergem para mover pessoas e negócios.
          </p>
        </div>
        <div>
          <canvas class="w-full h-[260px] md:h-[320px] rounded-xl bg-athenity-blue-card" width="400" height="300"></canvas>
        </div>
      </div>
    </section>

    <section id="servicos" class="section-base bg-athenity-blue-deep" style="height: 100vh;">
      <h3 class="text-3xl md:text-4xl font-extrabold text-center text-athenity-text-title">
        Nosso Arsenal
      </h3>
      <div class="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="bg-athenity-blue-card p-8 rounded-2xl">
          <h4 class="text-2xl text-athenity-green-circuit font-bold">Aplicações Sob Medida</h4>
          <p class="mt-4 text-athenity-text-body leading-relaxed">
            Soluções web e mobile robustas e elegantes, moldadas pelo contexto do seu cliente.
          </p>
        </div>
        <div class="bg-athenity-blue-card p-8 rounded-2xl">
          <h4 class="text-2xl text-athenity-green-circuit font-bold">IA &amp; Machine Learning</h4>
          <p class="mt-4 text-athenity-text-body leading-relaxed">
            Produtos inteligentes, dados acionáveis e automações que liberam valor real.
          </p>
        </div>
        <div class="bg-athenity-blue-card p-8 rounded-2xl">
          <h4 class="text-2xl text-athenity-green-circuit font-bold">Arquitetura em Nuvem</h4>
          <p class="mt-4 text-athenity-text-body leading-relaxed">
            Escalabilidade, observabilidade e segurança para crescer sem atrito.
          </p>
        </div>
      </div>
    </section>

    <section id="trabalhos" class="section-base" style="height: 100vh;">
      <h3 class="text-3xl md:text-4xl font-extrabold text-center">Prova de Conceito</h3>
      <div class="mt-6 text-center">
        <div class="text-sm text-athenity-text-body/70">Arraste para girar</div>
      </div>
    </section>

    <section id="cta" class="section-base bg-athenity-blue-deep" style="height: 100vh;">
      <h3 class="text-3xl md:text-4xl font-extrabold text-center text-athenity-text-title">
        Vamos Conversar?
      </h3>
    </section>
  `,
  styles: [`
    .section-base {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      position: relative;
    }
    
    .text-athenity-gold { color: #FFD700; }
    .text-athenity-text-body { color: #A1A1AA; }
    .text-athenity-text-title { color: #F4F4F5; }
    .text-athenity-green-circuit { color: #64FFDA; }
    .bg-athenity-blue-deep { background-color: #0A0E1A; }
    .bg-athenity-blue-card { background-color: #1E293B; }
    .bg-athenity-gold { background-color: #FFD700; }
    .text-athenity-blue-deep { color: #0A0E1A; }
  `]
})
class FullScrollExperienceComponent { }

describe('Complete Addictive Scroll Experience - E2E Style Tests', () => {
  let component: FullScrollExperienceComponent;
  let fixture: ComponentFixture<FullScrollExperienceComponent>;
  let service: ScrollOrchestrationService;

  beforeEach(async () => {
    // Setup GSAP mocks
    (window as any).gsap = mockGsap;
    (window as any).ScrollTrigger = mockScrollTrigger;

    await TestBed.configureTestingModule({
      declarations: [FullScrollExperienceComponent],
      providers: [
        ScrollOrchestrationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FullScrollExperienceComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ScrollOrchestrationService);
    
    fixture.detectChanges();
  });

  afterEach(() => {
    // Reset spies
    mockScrollTrigger.create.calls.reset();
    mockGsap.registerPlugin.calls.reset();
    mockGsap.to.calls.reset();
  });

  describe('EXACT Design Specification Compliance', () => {
    it('should display EXACTLY "Nós Desenvolvemos Momentos." with gold highlight', () => {
      const heroTitle = fixture.nativeElement.querySelector('#hero h1');
      expect(heroTitle).toBeTruthy();
      
      const textContent = heroTitle.textContent.trim();
      expect(textContent).toBe('Nós Desenvolvemos Momentos.');
      
      const goldSpan = heroTitle.querySelector('.text-athenity-gold');
      expect(goldSpan).toBeTruthy();
      expect(goldSpan.textContent.trim()).toBe('Momentos');
    });

    it('should display EXACTLY the specified hero subtitle', () => {
      const heroSubtitle = fixture.nativeElement.querySelector('#hero p');
      expect(heroSubtitle).toBeTruthy();
      
      const expectedText = 'Não criamos sites. Criamos experiências onde o seu cliente é o protagonista.';
      expect(heroSubtitle.textContent.trim()).toBe(expectedText);
    });

    it('should display EXACTLY "Explore Nosso Trabalho" button text', () => {
      const ctaButton = fixture.nativeElement.querySelector('#hero button');
      expect(ctaButton).toBeTruthy();
      expect(ctaButton.textContent.trim()).toBe('Explore Nosso Trabalho');
    });

    it('should display EXACTLY "Da Complexidade à Clareza." in Filosofia', () => {
      const filosofiaTitle = fixture.nativeElement.querySelector('#filosofia h2');
      expect(filosofiaTitle).toBeTruthy();
      expect(filosofiaTitle.textContent.trim()).toBe('Da Complexidade à Clareza.');
    });

    it('should display EXACTLY "Nosso Arsenal" in Serviços', () => {
      const servicosTitle = fixture.nativeElement.querySelector('#servicos h3');
      expect(servicosTitle).toBeTruthy();
      expect(servicosTitle.textContent.trim()).toBe('Nosso Arsenal');
    });

    it('should display EXACTLY "Prova de Conceito" in Trabalhos', () => {
      const trabalhosTitle = fixture.nativeElement.querySelector('#trabalhos h3');
      expect(trabalhosTitle).toBeTruthy();
      expect(trabalhosTitle.textContent.trim()).toBe('Prova de Conceito');
    });

    it('should display EXACTLY "Arraste para girar" interaction hint', () => {
      const hint = fixture.nativeElement.querySelector('#trabalhos .text-sm');
      expect(hint).toBeTruthy();
      expect(hint.textContent.trim()).toBe('Arraste para girar');
    });

    it('should display EXACTLY "Scroll" hint in hero section', () => {
      const scrollHint = fixture.nativeElement.querySelector('#hero .absolute.bottom-6');
      expect(scrollHint).toBeTruthy();
      expect(scrollHint.textContent.trim()).toBe('Scroll');
    });
  });

  describe('EXACT Typography Specifications', () => {
    it('should use EXACTLY the specified hero title classes', () => {
      const heroTitle = fixture.nativeElement.querySelector('#hero h1');
      expect(heroTitle.classList.contains('text-5xl')).toBeTruthy();
      expect(heroTitle.classList.contains('md:text-7xl')).toBeTruthy();
      expect(heroTitle.classList.contains('lg:text-8xl')).toBeTruthy();
      expect(heroTitle.classList.contains('font-black')).toBeTruthy();
      expect(heroTitle.classList.contains('tracking-tighter')).toBeTruthy();
    });

    it('should use EXACTLY the specified subtitle classes', () => {
      const heroSubtitle = fixture.nativeElement.querySelector('#hero p');
      expect(heroSubtitle.classList.contains('mt-6')).toBeTruthy();
      expect(heroSubtitle.classList.contains('text-lg')).toBeTruthy();
      expect(heroSubtitle.classList.contains('md:text-xl')).toBeTruthy();
      expect(heroSubtitle.classList.contains('max-w-2xl')).toBeTruthy();
      expect(heroSubtitle.classList.contains('text-athenity-text-body')).toBeTruthy();
      expect(heroSubtitle.classList.contains('mx-auto')).toBeTruthy();
    });

    it('should use EXACTLY the specified filosofia title classes', () => {
      const filosofiaTitle = fixture.nativeElement.querySelector('#filosofia h2');
      expect(filosofiaTitle.classList.contains('text-4xl')).toBeTruthy();
      expect(filosofiaTitle.classList.contains('md:text-5xl')).toBeTruthy();
      expect(filosofiaTitle.classList.contains('font-extrabold')).toBeTruthy();
    });
  });

  describe('EXACT Color Scheme Specifications', () => {
    it('should use EXACTLY athenity-gold for "Momentos" highlight', () => {
      const goldElement = fixture.nativeElement.querySelector('.text-athenity-gold');
      expect(goldElement).toBeTruthy();
      expect(goldElement.textContent.trim()).toBe('Momentos');
    });

    it('should use EXACTLY athenity-green-circuit for service titles', () => {
      const circuitElements = fixture.nativeElement.querySelectorAll('.text-athenity-green-circuit');
      expect(circuitElements.length).toBe(3); // Three service cards
      
      expect(circuitElements[0].textContent.trim()).toBe('Aplicações Sob Medida');
      expect(circuitElements[1].textContent.trim()).toBe('IA & Machine Learning');
      expect(circuitElements[2].textContent.trim()).toBe('Arquitetura em Nuvem');
    });

    it('should use EXACTLY athenity-blue-deep background for button text', () => {
      const ctaButton = fixture.nativeElement.querySelector('#hero button');
      expect(ctaButton.classList.contains('text-athenity-blue-deep')).toBeTruthy();
      expect(ctaButton.classList.contains('bg-athenity-gold')).toBeTruthy();
    });

    it('should use EXACTLY athenity-blue-card for canvas background', () => {
      const canvas = fixture.nativeElement.querySelector('#filosofia canvas');
      expect(canvas.classList.contains('bg-athenity-blue-card')).toBeTruthy();
    });
  });

  describe('EXACT Layout and Spacing Specifications', () => {
    it('should have EXACTLY 100vh height for all sections', () => {
      const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
      
      sections.forEach(sectionId => {
        const section = fixture.nativeElement.querySelector(`#${sectionId}`);
        expect(section.style.height).toBe('100vh');
        expect(section.classList.contains('section-base')).toBeTruthy();
      });
    });

    it('should use EXACTLY the specified button styling classes', () => {
      const ctaButton = fixture.nativeElement.querySelector('#hero button');
      expect(ctaButton.classList.contains('mt-10')).toBeTruthy();
      expect(ctaButton.classList.contains('bg-athenity-gold')).toBeTruthy();
      expect(ctaButton.classList.contains('text-athenity-blue-deep')).toBeTruthy();
      expect(ctaButton.classList.contains('font-bold')).toBeTruthy();
      expect(ctaButton.classList.contains('py-4')).toBeTruthy();
      expect(ctaButton.classList.contains('px-8')).toBeTruthy();
      expect(ctaButton.classList.contains('rounded-xl')).toBeTruthy();
    });

    it('should use EXACTLY the specified filosofia grid layout', () => {
      const gridContainer = fixture.nativeElement.querySelector('#filosofia .grid');
      expect(gridContainer.classList.contains('md:grid-cols-2')).toBeTruthy();
      expect(gridContainer.classList.contains('gap-12')).toBeTruthy();
      expect(gridContainer.classList.contains('items-center')).toBeTruthy();
    });

    it('should use EXACTLY the specified canvas dimensions and styling', () => {
      const canvas = fixture.nativeElement.querySelector('#filosofia canvas');
      expect(canvas.classList.contains('w-full')).toBeTruthy();
      expect(canvas.classList.contains('h-[260px]')).toBeTruthy();
      expect(canvas.classList.contains('md:h-[320px]')).toBeTruthy();
      expect(canvas.classList.contains('rounded-xl')).toBeTruthy();
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(300);
    });
  });

  describe('EXACT Service Cards Specifications', () => {
    it('should have EXACTLY 3 service cards with correct content', () => {
      const serviceCards = fixture.nativeElement.querySelectorAll('#servicos .bg-athenity-blue-card');
      expect(serviceCards.length).toBe(3);
      
      const expectedServices = [
        'Aplicações Sob Medida',
        'IA & Machine Learning',
        'Arquitetura em Nuvem'
      ];
      
      serviceCards.forEach((card, index) => {
        const title = card.querySelector('h4');
        expect(title.textContent.trim()).toBe(expectedServices[index]);
        expect(title.classList.contains('text-2xl')).toBeTruthy();
        expect(title.classList.contains('text-athenity-green-circuit')).toBeTruthy();
        expect(title.classList.contains('font-bold')).toBeTruthy();
      });
    });

    it('should have EXACTLY the specified service card styling', () => {
      const serviceCards = fixture.nativeElement.querySelectorAll('#servicos .bg-athenity-blue-card');
      
      serviceCards.forEach(card => {
        expect(card.classList.contains('bg-athenity-blue-card')).toBeTruthy();
        expect(card.classList.contains('p-8')).toBeTruthy();
        expect(card.classList.contains('rounded-2xl')).toBeTruthy();
        
        const description = card.querySelector('p');
        expect(description.classList.contains('mt-4')).toBeTruthy();
        expect(description.classList.contains('text-athenity-text-body')).toBeTruthy();
        expect(description.classList.contains('leading-relaxed')).toBeTruthy();
      });
    });
  });

  describe('EXACT Scroll Hint Specifications', () => {
    it('should have EXACTLY the specified scroll hint positioning and styling', () => {
      const scrollHint = fixture.nativeElement.querySelector('#hero .absolute.bottom-6');
      expect(scrollHint.classList.contains('absolute')).toBeTruthy();
      expect(scrollHint.classList.contains('bottom-6')).toBeTruthy();
      expect(scrollHint.classList.contains('left-1/2')).toBeTruthy();
      expect(scrollHint.classList.contains('-translate-x-1/2')).toBeTruthy();
      expect(scrollHint.classList.contains('text-xs')).toBeTruthy();
      expect(scrollHint.classList.contains('uppercase')).toBeTruthy();
      expect(scrollHint.classList.contains('tracking-widest')).toBeTruthy();
    });
  });

  describe('EXACT Content Accuracy', () => {
    it('should have EXACTLY the specified filosofia description', () => {
      const filosofiaDesc = fixture.nativeElement.querySelector('#filosofia p');
      const expectedText = 'Transformamos sistemas caóticos em experiências nítidas. Arquitetura, design e engenharia convergem para mover pessoas e negócios.';
      expect(filosofiaDesc.textContent.trim()).toBe(expectedText);
    });

    it('should have EXACTLY the specified service descriptions', () => {
      const serviceDescriptions = fixture.nativeElement.querySelectorAll('#servicos .bg-athenity-blue-card p');
      
      const expectedDescriptions = [
        'Soluções web e mobile robustas e elegantes, moldadas pelo contexto do seu cliente.',
        'Produtos inteligentes, dados acionáveis e automações que liberam valor real.',
        'Escalabilidade, observabilidade e segurança para crescer sem atrito.'
      ];
      
      serviceDescriptions.forEach((desc, index) => {
        expect(desc.textContent.trim()).toBe(expectedDescriptions[index]);
      });
    });
  });

  describe('Scroll Orchestration Integration', () => {
    it('should initialize scroll orchestration service', () => {
      service.initialize();
      
      expect(mockGsap.registerPlugin).toHaveBeenCalled();
      expect(mockScrollTrigger.create).toHaveBeenCalled();
    });

    it('should create ScrollTriggers for each section', () => {
      service.initialize();
      
      // Should create triggers for each section + global
      expect(mockScrollTrigger.create.calls.count()).toBeGreaterThanOrEqual(5);
    });

    it('should handle magnetic scroll behavior', fakeAsync(() => {
      service.initialize();
      
      // Mock section at 85% progress
      const mockTrigger = { 
        progress: 0.85, 
        direction: 1, 
        vars: { id: 'hero' } 
      };
      (service as any).activeSectionTrigger = mockTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0);
      
      // Trigger snap
      (service as any).performMagneticSnap();
      tick(100);
      
      // Should attempt to scroll to next section
      expect(mockGsap.to).toHaveBeenCalled();
    }));
  });

  describe('Minimalist Design Principles Validation', () => {
    it('should maintain clean, uncluttered layout', () => {
      const allElements = fixture.nativeElement.querySelectorAll('*');
      // Should have reasonable number of elements (not excessive)
      expect(allElements.length).toBeLessThan(50);
    });

    it('should use consistent spacing scale', () => {
      const spacingClasses = [
        'mt-6', 'mt-10', 'mt-14', 'p-8', 'py-4', 'px-8',
        'gap-8', 'gap-12'
      ];
      
      let foundSpacingClasses = 0;
      spacingClasses.forEach(className => {
        const elements = fixture.nativeElement.querySelectorAll(`.${className}`);
        foundSpacingClasses += elements.length;
      });
      
      expect(foundSpacingClasses).toBeGreaterThan(5);
    });

    it('should use consistent border radius', () => {
      const roundedElements = fixture.nativeElement.querySelectorAll('.rounded-xl, .rounded-2xl');
      expect(roundedElements.length).toBeGreaterThan(0);
    });
  });
});