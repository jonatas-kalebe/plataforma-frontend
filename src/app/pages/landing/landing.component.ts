import {AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, PLATFORM_ID, ViewChild} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {ScrollToPlugin} from 'gsap/ScrollToPlugin';
import {ScrollOrchestrationService, ScrollState} from '../../services/scroll-orchestration.service';
import {Subject, takeUntil} from 'rxjs';

// Import section components
import {HeroSectionComponent} from '../../components/sections/hero-section/hero-section.component';
import {FilosofiaSectionComponent} from '../../components/sections/filosofia-section/filosofia-section.component';
import {ServicosSectionComponent} from '../../components/sections/servicos-section/servicos-section.component';
import {TrabalhosSectionComponent} from '../../components/sections/trabalhos-section/trabalhos-section.component';
import {CtaSectionComponent} from '../../components/sections/cta-section/cta-section.component';

// Import new animation system
import { SectionAnimations } from '../../shared/animation/section-animations.class';

// Configuração global do GSAP (centralizada)
if (typeof window !== 'undefined') {
  (window as any).gsap = gsap;
  (window as any).ScrollTrigger = ScrollTrigger;
}

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, HeroSectionComponent, FilosofiaSectionComponent, ServicosSectionComponent, TrabalhosSectionComponent, CtaSectionComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('knotCanvas', {static: true}) knotCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Estado público para template
  public scrollState: ScrollState | null = null;
  
  // Dependências do Angular
  private readonly platformId = inject(PLATFORM_ID);
  private zone = new NgZone({enableLongStackTrace: false});
  
  // Sistema de animações consolidado
  private sectionAnimations = new SectionAnimations();
  
  // Canvas e animação do knot
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;
  
  // Gerenciamento de lifecycle
  private destroy$ = new Subject<void>();
  
  // Configurações de acessibilidade
  private prefersReducedMotion = false;

  constructor(private scrollService: ScrollOrchestrationService) {
    this.checkReducedMotion();
  }

  /**
   * Event handlers para componentes de seção
   * Simplificados e consolidados para reduzir duplicação
   */
  onHeroCta(event: Event): void {
    this.scrollService.scrollToSection('servicos', 1);
  }

  onHeroSectionReady(heroBgRef: ElementRef): void {
    console.log('Hero section ready:', heroBgRef);
  }

  onFilosofiaSectionReady(elementRef: ElementRef): void {
    console.log('Filosofia section ready:', elementRef);
  }

  onKnotCanvasReady(canvas: HTMLCanvasElement): void {
    console.log('Knot canvas ready:', canvas);
    this.setupKnotCanvas(canvas);
  }

  onServicosSectionReady(event: any): void {
    console.log('Serviços section ready:', event);
    this.initializeServicosAnimations();
  }

  onServiceClicked(event: { service: any; index: number; event: Event }): void {
    console.log('Service clicked:', event);
  }

  onRingReady(ring: any): void {
    console.log('Work card ring ready:', ring);
  }

  onCardSelected(card: any): void {
    console.log('Work card selected:', card);
  }

  onTrabalhosSectionReady(elementRef: ElementRef): void {
    console.log('Trabalhos section ready:', elementRef);
  }

  onPrimaryCtaClicked(event: Event): void {
    console.log('Primary CTA clicked:', event);
  }

  onCtaSectionReady(event: any): void {
    console.log('CTA section ready:', event);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.zone.runOutsideAngular(() => {
      // Inicialização consolidada dos sistemas
      this.initializeScrollSystem();
      this.initializeSectionAnimations();
      this.initKnot();
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Cleanup consolidado e organizado
    this.destroy$.next();
    this.destroy$.complete();
    
    cancelAnimationFrame(this.knotId);
    this.sectionAnimations.destroy();
    ScrollTrigger.getAll().forEach(st => st.kill());
    this.scrollService.destroy();
  }

  private setupKnotCanvas(canvas: HTMLCanvasElement): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.knotCanvas = new ElementRef(canvas);
    this.initKnot();
  }

  /**
   * Verifica preferências de movimento reduzido
   * Movido para o construtor para centralizar configuração
   */
  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  /**
   * Inicializa sistema de scroll de forma consolidada
   */
  private initializeScrollSystem(): void {
    requestAnimationFrame(() => {
      this.scrollService.initialize();
      this.scrollService.scrollState$
        .pipe(takeUntil(this.destroy$))
        .subscribe(state => {
          setTimeout(() => {
            this.scrollState = state;
          });
        });
    });
  }

  /**
   * Inicializa animações de seção usando o novo sistema consolidado
   */
  private initializeSectionAnimations(): void {
    // Filosofia section - usando sistema unificado
    this.sectionAnimations.animateSectionEntry('filosofia', {
      title: '#filosofia h2',
      content: '#filosofia p'
    });

    // CTA section - usando sistema unificado
    this.sectionAnimations.animateSectionEntry('cta', {
      title: '#cta h2',
      cta: '#cta a'
    });
  }

  /**
   * Inicializa animações específicas da seção de serviços
   * Substituindo múltiplas animações GSAP por sistema consolidado
   */
  private initializeServicosAnimations(): void {
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach((card, index) => {
      this.sectionAnimations.animateScrollTriggeredElements({
        selector: `.service-card:nth-child(${index + 1})`,
        trigger: card as HTMLElement,
        animationConfig: {
          y: 40,
          duration: 0.8,
          delay: this.prefersReducedMotion ? index * 0.1 : 0
        },
        scrollConfig: {
          start: 'top 85%',
          end: this.prefersReducedMotion ? 'top 85%' : 'bottom center'
        }
      });
    });
  }
  /**
   * Inicializa animação do knot (canvas)
   * Otimizada e simplificada mantendo funcionalidade
   */
  private initKnot(): void {
    if (!isPlatformBrowser(this.platformId) || !this.knotCanvas?.nativeElement) return;

    // Configuração inicial do canvas
    this.knotCtx = this.knotCanvas.nativeElement.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Função de redimensionamento otimizada
    const resize = () => {
      const el = this.knotCanvas.nativeElement;
      const rect = el.getBoundingClientRect();
      el.width = rect.width * dpr;
      el.height = rect.height * dpr;
      if (this.knotCtx) this.knotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    
    resize();
    window.addEventListener('resize', resize);

    // Variáveis de animação
    let t = 0;
    
    // Função de desenho otimizada
    const draw = () => {
      const ctx = this.knotCtx;
      if (!ctx) return;
      
      const el = this.knotCanvas.nativeElement;
      ctx.clearRect(0, 0, el.clientWidth, el.clientHeight);
      
      const w = el.clientWidth;
      const h = el.clientHeight;
      const cy = h / 2;
      const pad = 24;

      // Configuração de estilo
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#64FFDA';
      ctx.shadowColor = 'rgba(100,255,218,0.4)';
      ctx.shadowBlur = 12;

      // Desenho do knot otimizado
      ctx.beginPath();
      const segments = 120;
      for (let i = 0; i <= segments; i++) {
        const p = i / segments;
        const x = pad + p * (w - pad * 2);
        const amp = (1 - t) * (h * 0.4);
        const freq = 4;
        const y = cy + Math.sin(p * Math.PI * freq + t * Math.PI * 2) * amp * (1 - Math.abs(0.5 - p) * 1.8);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // ScrollTrigger usando novo sistema
    const knotTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top bottom',
        end: this.prefersReducedMotion ? 'top bottom' : 'center center',
        ...(this.prefersReducedMotion ? {toggleActions: 'play none none reverse'} : {scrub: 1})
      }
    });

    knotTimeline.to({val: 0}, {
      val: 1,
      duration: this.prefersReducedMotion ? 0.3 : 1.5,
      ease: 'none',
      onUpdate: function () {
        t = (this as any).targets()[0].val;
        draw();
      }
    });
  }
}
