import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Section Components
import { 
  HeroSectionComponent,
  FilosofiaSectionComponent,
  ServicosSectionComponent,
  TrabalhosSectionComponent,
  CtaSectionComponent
} from '../../components/sections';

// Animation Services
import {
  HeroAnimationService,
  KnotCanvasService,
  SectionAnimationService
} from '../../services/animation';

// Shared Types and Constants
import { ServiceItem, CallToAction } from '../../shared/types';

// Original Services
import { ScrollOrchestrationService, ScrollState } from '../../services/scroll-orchestration.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    FilosofiaSectionComponent,
    ServicosSectionComponent,
    TrabalhosSectionComponent,
    CtaSectionComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  // Configuration variables (customizable)
  public servicesData: ServiceItem[] = [
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
  ];

  public primaryCtaConfig: CallToAction = {
    label: 'Fale Conosco',
    href: 'mailto:athenity@gmail.com',
    variant: 'primary',
    size: 'lg'
  };

  // Platform and state
  private readonly platformId = inject(PLATFORM_ID);
  private zone = new NgZone({ enableLongStackTrace: false });
  private destroy$ = new Subject<void>();

  public scrollState: ScrollState | null = null;

  constructor(
    private scrollService: ScrollOrchestrationService,
    private heroAnimationService: HeroAnimationService,
    private knotCanvasService: KnotCanvasService,
    private sectionAnimationService: SectionAnimationService
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.zone.runOutsideAngular(() => {
      // Ensure DOM is fully rendered before initializing
      requestAnimationFrame(() => {
        this.initializeScrollService();
      });
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.destroy$.next();
    this.destroy$.complete();

    // Cleanup animation services
    this.heroAnimationService.destroy();
    this.knotCanvasService.destroy();
    this.sectionAnimationService.destroy();
    this.scrollService.destroy();
  }

  /**
   * Initialize scroll orchestration service
   */
  private initializeScrollService(): void {
    this.scrollService.initialize();

    // Subscribe to scroll state updates
    this.scrollService.scrollState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        setTimeout(() => {
          this.scrollState = state;
        });
      });
  }

  /**
   * Handle hero CTA click
   */
  handleHeroCta(event: Event): void {
    // Smooth scroll to services section
    this.scrollService.scrollToSection('servicos');
  }

  /**
   * Handle service card click
   */
  handleServiceClick(eventData: { service: ServiceItem; index: number; event: Event }): void {
    console.log('Service clicked:', eventData.service.title);
    // Could navigate to service detail page or show modal
  }

  /**
   * Handle work card selection
   */
  handleWorkCardSelection(card: any): void {
    console.log('Work card selected:', card);
    // Could show work details or navigate
  }

  /**
   * Handle primary CTA click
   */
  handlePrimaryCta(event: Event): void {
    console.log('Primary CTA clicked');
    // Email link is handled by href, but could add tracking here
  }

  /**
   * Hero section ready - setup hero animations
   */
  onHeroSectionReady(heroBgRef: ElementRef): void {
    if (!heroBgRef) return;

    this.heroAnimationService.initializeHeroAnimations(heroBgRef, {
      parallaxEnabled: true,
      staggerEnabled: true
    });
  }

  /**
   * Filosofia section ready
   */
  onFilosofiaSectionReady(elementRef: ElementRef): void {
    // Section animations are handled by the section component itself
    console.log('Filosofia section ready');
  }

  /**
   * Knot canvas ready - setup knot animation
   */
  onKnotCanvasReady(canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    this.knotCanvasService.initializeKnot(canvas, {
      segments: 200,
      amplitude: 0.5,
      frequency: 3,
      strokeColor: '#64FFDA',
      animate: true
    });
  }

  /**
   * Filosofia animation complete
   */
  onFilosofiaAnimationComplete(): void {
    console.log('Filosofia animation completed');
  }

  /**
   * Servicos section ready
   */
  onServicosSectionReady(): void {
    console.log('Servicos section ready');
  }

  /**
   * Work ring ready
   */
  onWorkRingReady(ring: any): void {
    console.log('Work ring ready:', ring);
  }

  /**
   * Trabalhos section ready
   */
  onTrabalhosSectionReady(elementRef: ElementRef): void {
    console.log('Trabalhos section ready');
  }

  /**
   * CTA section ready
   */
  onCtaSectionReady(): void {
    console.log('CTA section ready');
  }
}
