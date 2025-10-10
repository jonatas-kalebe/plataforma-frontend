/**
 * Simplified Scroll Orchestration Service
 * Versão refatorada com responsabilidades divididas
 */

// Angular Core and Common Imports
import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// RxJS Imports
import { Observable } from 'rxjs';

// Application Configuration and Services
import { ScrollTelemetryService } from './scroll-telemetry.service';
import { AnimationOrchestrationService } from './animation/animation-orchestration.service';

// Novo sistema de utilidades
import {
  ScrollMetricsManager,
  ScrollSection,
  ScrollMetrics,
  ScrollState
} from '../shared/scroll/scroll-metrics.manager';

// Re-export para compatibilidade
export type { ScrollSection, ScrollMetrics, ScrollState };

// ---------------------------------------------------------------------------
// 🔧 Configurações principais para customização rápida do comportamento
// ---------------------------------------------------------------------------

const SCROLL_SECTION_IDS = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'] as const;
const SCROLL_SECTION_SELECTORS = SCROLL_SECTION_IDS.map(id => `#${id}`);

const SCROLL_TRIGGER_SETTINGS = {
  start: 'top bottom',
  end: 'bottom top'
} as const;

const SCROLL_EVENT_OPTIONS: AddEventListenerOptions = { passive: true };

@Injectable({
  providedIn: 'root'
})
export class ScrollOrchestrationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly telemetryService = inject(ScrollTelemetryService);
  private readonly animationOrchestrationService = inject(AnimationOrchestrationService);

  // Estado do serviço
  private isInitialized = false;
  private scrollTriggers: any[] = [];
  private prefersReducedMotion = false;
  private lastScrollY = 0;
  private scrollDirection: 'up' | 'down' | 'none' = 'none';
  private isMobile = false;

  // Managers especializados (novo sistema)
  private metricsManager: ScrollMetricsManager;

  // Expõe observables
  public readonly metrics$: Observable<ScrollMetrics>;
  public readonly scrollState$: Observable<ScrollState>;

  constructor() {
    // Inicializa managers
    this.metricsManager = new ScrollMetricsManager(this.telemetryService);

    // Expõe observables dos managers
    this.metrics$ = this.metricsManager.metrics$;
    this.scrollState$ = this.metricsManager.scrollState$;


    if (isPlatformBrowser(this.platformId)) {
      this.checkReducedMotion();
      this.detectMobile();
      this.telemetryService.trackReducedMotion(this.prefersReducedMotion);
    }
  }

  /**
   * Inicializa o serviço de scroll
   * Note: AnimationOrchestrationService must be initialized by the caller before this method
   */
  async initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    // AnimationOrchestrationService initialization is now handled by LandingComponent
    // This service only depends on GSAP being available globally

    this.ngZone.runOutsideAngular(() => {
      if (this.tryInitialize()) {
        return;
      }

      // Fallback para DOM não pronto
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          if (this.tryInitialize()) return;
          setTimeout(() => this.tryInitialize(), 100);
        });
      } else {
        setTimeout(() => this.tryInitialize(), 100);
      }
    });
  }

  /**
   * Tenta inicializar o sistema
   */
  private tryInitialize(): boolean {
    if (this.isInitialized) return true;

    // Verifica elementos essenciais
    const heroElement = document.querySelector('#hero');
    const filosofiaElement = document.querySelector('#filosofia');

    if (!heroElement || !filosofiaElement) {
      console.warn('ScrollOrchestrationService: Essential sections not found, retrying...');
      return false;
    }

    try {
      // GSAP initialization removed - now handled by AnimationOrchestrationService
      this.setupSections();
      this.setupScrollEventListener();

      // Global scroll snap is now configured in LandingComponent
      // after AnimationOrchestrationService.initialize()

      this.isInitialized = true;
      console.log('ScrollOrchestrationService: Successfully initialized');
      return true;
    } catch (error) {
      console.error('ScrollOrchestrationService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Configura seções de scroll (simplificado)
   * Note: GSAP must be initialized via AnimationOrchestrationService before calling this
   */
  private setupSections(): void {
    // Use globally available GSAP instances (set by AnimationOrchestrationService)
    const ScrollTriggerInstance = (window as any).ScrollTrigger;
    const gsapInstance = (window as any).gsap;

    this.lastScrollY = window.scrollY || 0;

    const sections: ScrollSection[] = [];

    SCROLL_SECTION_SELECTORS.forEach((selector, index) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) return;

      const section: ScrollSection = {
        id: SCROLL_SECTION_IDS[index],
        element,
        progress: 0,
        isActive: false
      };

      sections.push(section);

      // Configuração consolidada de ScrollTrigger
      const scrollTriggerConfig: any = {
        trigger: element,
        start: SCROLL_TRIGGER_SETTINGS.start,
        end: SCROLL_TRIGGER_SETTINGS.end,
        onUpdate: (self: any) => {
          section.progress = self.progress;
          this.updateScrollMetrics(sections);
        }
      };

      // Adiciona scrub apenas se não for reduced motion
      if (!this.prefersReducedMotion) {
        Object.assign(scrollTriggerConfig, { scrub: true });
      }

      const trigger = ScrollTriggerInstance.create(scrollTriggerConfig);
      this.scrollTriggers.push(trigger);
    });

    // Atualiza métricas iniciais
    this.updateScrollMetrics(sections);

    // Hero animations are now handled by AnimationOrchestrationService in HeroSectionComponent
    // No need to setup hero animation here
  }

  /**
   * Configura listener de eventos de scroll (otimizado)
   */
  private setupScrollEventListener(): void {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.onScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, SCROLL_EVENT_OPTIONS);
  }

  /**
   * Handler de scroll otimizado
   */
  private onScroll(): void {
    const currentScrollY = window.scrollY || 0;
    const velocity = currentScrollY - this.lastScrollY;

    // Atualiza direção do scroll
    this.scrollDirection = velocity > 0 ? 'down' : velocity < 0 ? 'up' : 'none';
    this.lastScrollY = currentScrollY;
  }

  /**
   * Atualiza métricas usando o manager especializado
   */
  private updateScrollMetrics(sections: ScrollSection[]): void {
    const globalProgress = this.metricsManager.calculateGlobalProgress(sections);
    const activeSection = this.metricsManager.findActiveSection(sections);
    const velocity = Math.abs(this.lastScrollY - (window.scrollY || 0));

    // Atualiza através do manager
    this.metricsManager.updateMetrics(
      globalProgress,
      velocity,
      activeSection,
      sections,
      this.scrollDirection
    );
  }

  /**
   * Scroll programático para seção
   */
  scrollToSection(id: string, duration: number = 1): void {
    const element = document.querySelector(`#${id}`);
    if (!element) {
      console.warn(`ScrollOrchestrationService: Section ${id} not found`);
      return;
    }

    const gsapInstance = (window as any).gsap;
    if (!gsapInstance) {
      console.warn('ScrollOrchestrationService: GSAP not available for scrollToSection');
      return;
    }
    
    gsapInstance.to(window, {
      duration: this.prefersReducedMotion ? 0 : duration,
      scrollTo: { y: element, offsetY: 0 },
      ease: 'power3.out'
    });
  }

  /**
   * Verifica preferência de movimento reduzido
   */
  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }


  /**
   * Detecta dispositivos móveis
   */
  private detectMobile(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    }
  }

  /**
   * Destrói o serviço e limpa recursos
   */
  destroy(): void {
    // Limpa ScrollTriggers
    this.scrollTriggers.forEach(trigger => trigger.kill());
    this.scrollTriggers = [];

    // Limpa managers
    this.metricsManager.destroy();

    this.isInitialized = false;
  }
}
