/**
 * Simplified Scroll Orchestration Service
 * Versão refatorada com responsabilidades divididas
 */

// Angular Core and Common Imports
import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// RxJS Imports
import { Observable } from 'rxjs';

// GSAP Animation Library Imports
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

// Application Configuration and Services
import { SCROLL_CONFIG, SECTION_SCROLL_CONFIG } from '../shared/constants/scroll-config.constants';
import { ScrollTelemetryService } from './scroll-telemetry.service';

// Novo sistema de utilidades
import {
  ScrollMetricsManager,
  ScrollSection,
  ScrollMetrics,
  ScrollState
} from '../shared/scroll/scroll-metrics.manager';
import { MagneticScrollManager } from '../shared/scroll/magnetic-scroll.manager';
import { HeroAnimationManager } from '../shared/scroll/hero-animation.manager';

// Re-export para compatibilidade
export type { ScrollSection, ScrollMetrics, ScrollState };

@Injectable({
  providedIn: 'root'
})
export class ScrollOrchestrationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly telemetryService = inject(ScrollTelemetryService);

  // Estado do serviço
  private isInitialized = false;
  private scrollTriggers: ScrollTrigger[] = [];
  private prefersReducedMotion = false;
  private lastScrollY = 0;
  private scrollDirection: 'up' | 'down' | 'none' = 'none';
  private isMobile = false;

  // Managers especializados (novo sistema)
  private metricsManager: ScrollMetricsManager;
  private magneticScrollManager: MagneticScrollManager;
  private heroAnimationManager: HeroAnimationManager;

  // Expõe observables
  public readonly metrics$: Observable<ScrollMetrics>;
  public readonly scrollState$: Observable<ScrollState>;

  // Input detection listeners
  private pointerDownListener?: (event: PointerEvent) => void;
  private touchStartListener?: (event: TouchEvent) => void;
  private wheelListener?: (event: WheelEvent) => void;
  private inputDetectionConfigured = false;

  constructor() {
    // Inicializa managers
    this.metricsManager = new ScrollMetricsManager(this.telemetryService);
    this.magneticScrollManager = new MagneticScrollManager(this.prefersReducedMotion);
    this.heroAnimationManager = new HeroAnimationManager(this.prefersReducedMotion);

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
   */
  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

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
      this.initializeGsap();
      this.setupSections();
      this.setupInputModeDetection();
      this.setupScrollEventListener();

      this.isInitialized = true;
      console.log('ScrollOrchestrationService: Successfully initialized');
      return true;
    } catch (error) {
      console.error('ScrollOrchestrationService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Inicializa GSAP e plugins
   */
  private initializeGsap(): void {
    const gsapInstance = (window as any).gsap || gsap;
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;

    gsapInstance.registerPlugin(ScrollTriggerInstance, ScrollToPlugin);

    // Expõe globalmente para compatibilidade
    if (typeof window !== 'undefined') {
      (window as any).ScrollTrigger = ScrollTriggerInstance;
    }

    this.lastScrollY = window.scrollY || 0;
  }

  /**
   * Configura seções de scroll (simplificado)
   */
  private setupSections(): void {
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
    const gsapInstance = (window as any).gsap || gsap;

    const sectionIds = ['#hero', '#filosofia', '#servicos', '#trabalhos', '#cta'];
    const sections: ScrollSection[] = [];

    sectionIds.forEach((id, index) => {
      const element = document.querySelector(id) as HTMLElement;
      if (!element) return;

      const section: ScrollSection = {
        id: id.substring(1),
        element,
        progress: 0,
        isActive: false
      };

      sections.push(section);

      // Configuração consolidada de ScrollTrigger
      const scrollTriggerConfig = {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
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

    // Configura animação do hero
    if (!this.prefersReducedMotion) {
      this.heroAnimationManager.createHeroAnimation(gsapInstance);
      const heroTrigger = this.heroAnimationManager.setupHeroScrollTrigger();
      if (heroTrigger) {
        this.scrollTriggers.push(heroTrigger);
      }
    }
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

    window.addEventListener('scroll', handleScroll, { passive: true });
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

    this.magneticScrollManager.notifyScrollActivity();
    // Detecta intenção e verifica snap magnético
    this.magneticScrollManager.detectScrollIntention(velocity);
    this.magneticScrollManager.startScrollStopCheck();
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

    // Mantém um snapshot para checagem de snap quando o scroll para
    this.magneticScrollManager.updateSectionsSnapshot(
      sections.map(section => ({ ...section }))
    );

    // Verifica snap magnético
    this.magneticScrollManager.checkMagneticSnap(sections, globalProgress);
  }

  /**
   * Scroll programático para seção
   */
  scrollToSection(id: string, duration: number = 1): void {
    this.magneticScrollManager.scrollToSection(id, duration);
  }

  /**
   * Verifica preferência de movimento reduzido
   */
  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;

      // Atualiza managers
      this.magneticScrollManager = new MagneticScrollManager(this.prefersReducedMotion);
      this.heroAnimationManager = new HeroAnimationManager(this.prefersReducedMotion);
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
      if (this.isMobile) {
        this.magneticScrollManager.setInputMode('touch');
      }
    }
  }

  /**
   * Detecta o tipo de input predominante (mouse x toque) para calibrar atrasos magnéticos
   */
  private setupInputModeDetection(): void {
    if (this.inputDetectionConfigured) return;

    const updateFromPointer = (event: PointerEvent) => {
      const pointerType = event.pointerType === 'touch' ? 'touch' : 'mouse';
      this.magneticScrollManager.setInputMode(pointerType);
      this.magneticScrollManager.notifyScrollActivity();
    };

    const updateFromTouch = (_event: TouchEvent) => {
      this.magneticScrollManager.setInputMode('touch');
      this.magneticScrollManager.notifyScrollActivity();
    };

    const updateFromWheel = (_event: WheelEvent) => {
      this.magneticScrollManager.setInputMode('mouse');
      this.magneticScrollManager.notifyScrollActivity();
    };

    window.addEventListener('pointerdown', updateFromPointer, { passive: true });
    window.addEventListener('touchstart', updateFromTouch, { passive: true });
    window.addEventListener('wheel', updateFromWheel, { passive: true });

    this.pointerDownListener = updateFromPointer;
    this.touchStartListener = updateFromTouch;
    this.wheelListener = updateFromWheel;
    this.inputDetectionConfigured = true;
  }

  private teardownInputModeDetection(): void {
    if (!this.inputDetectionConfigured) return;

    if (this.pointerDownListener) {
      window.removeEventListener('pointerdown', this.pointerDownListener);
    }
    if (this.touchStartListener) {
      window.removeEventListener('touchstart', this.touchStartListener);
    }
    if (this.wheelListener) {
      window.removeEventListener('wheel', this.wheelListener);
    }

    this.pointerDownListener = undefined;
    this.touchStartListener = undefined;
    this.wheelListener = undefined;
    this.inputDetectionConfigured = false;
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
    this.magneticScrollManager.destroy();
    this.heroAnimationManager.destroy();

    this.teardownInputModeDetection();

    this.isInitialized = false;
  }
}
