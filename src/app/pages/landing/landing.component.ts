import {AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, PLATFORM_ID, ViewChild, OnInit} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {ScrollOrchestrationService, ScrollState} from '../../services/scroll-orchestration.service';
import {Subject, takeUntil} from 'rxjs';
import { PreloadService, PreloadStatus } from '../../services/preload.service';

// Import section components
import {HeroSectionComponent} from '../../components/sections/hero-section/hero-section.component';
import {FilosofiaSectionComponent} from '../../components/sections/filosofia-section/filosofia-section.component';
import {ServicosSectionComponent} from '../../components/sections/servicos-section/servicos-section.component';
import {TrabalhosSectionComponent} from '../../components/sections/trabalhos-section/trabalhos-section.component';
import {CtaSectionComponent} from '../../components/sections/cta-section/cta-section.component';

// Import new animation system
import { NativeSectionAnimations } from '../../shared/animation/native-section-animations.class';
import { AnimationOrchestrationService } from '../../services/animation/animation-orchestration.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, HeroSectionComponent, FilosofiaSectionComponent, ServicosSectionComponent, TrabalhosSectionComponent, CtaSectionComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('knotCanvas', {static: true}) knotCanvas!: ElementRef<HTMLCanvasElement>;

  // Estado público para template
  public scrollState: ScrollState | null = null;

  // Dependências do Angular
  private readonly platformId = inject(PLATFORM_ID);
  private zone = new NgZone({enableLongStackTrace: false});

  // Sistema de animações consolidado
  private sectionAnimations = new NativeSectionAnimations(this.platformId);

  // Canvas e animação do knot
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;

  // Gerenciamento de lifecycle
  private destroy$ = new Subject<void>();

  // Configurações de acessibilidade
  private prefersReducedMotion = false;

  // Preload service injection
  private preloadService = inject(PreloadService);
  public preloadStatus: PreloadStatus = {};
  
  // Animation orchestration service injection
  private animationOrchestration = inject(AnimationOrchestrationService);

  constructor(private scrollService: ScrollOrchestrationService) {
    this.checkReducedMotion();
  }

  ngOnInit(): void {
    // Subscribe to preload status updates
    this.preloadService.status$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.preloadStatus = status;
        const loadedCount = Object.values(status).filter(s => s.loaded).length;
        const totalCount = Object.keys(status).length;
        if (totalCount > 0) {
          console.log(`📊 Landing: ${loadedCount}/${totalCount} components loaded`, status);
        }
      });
  }

  /**
   * Determines if a section should show loading state
   * Only shows loading for non-critical sections when they haven't been preloaded
   * and the user came from search (to avoid showing loading after owl animation)
   */
  shouldShowLoadingState(sectionName: string): boolean {
    // Never show loading state for critical sections (hero, filosofia)
    if (sectionName === 'hero-section' || sectionName === 'filosofia-section') {
      return false;
    }

    const isFromSearch = this.preloadService.isFromSearchSource();
    const componentStatus = this.preloadStatus[sectionName];
    
    // Only show loading states if:
    // 1. User came from search (they only get critical components preloaded)
    // 2. Component is not loaded yet
    // 3. We have preload status data (indicates preloading system is active)
    return isFromSearch && 
           (!componentStatus || !componentStatus.loaded) && 
           Object.keys(this.preloadStatus).length > 0;
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

  onServicosSectionReady(event: any): void {
    console.log('Serviços section ready:', event);
    // Trigger service card animations when section is ready
    setTimeout(() => {
      this.sectionAnimations.setupServiceCardAnimations();
    }, 100);
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
      // Initialize GSAP first via AnimationOrchestrationService
      this.animationOrchestration.initialize().then(() => {
        console.log('LandingComponent: GSAP initialized via AnimationOrchestrationService');
        
        // Then initialize scroll system (which depends on GSAP)
        this.initializeScrollSystem();
        this.initializeSectionAnimations();
      }).catch(error => {
        console.error('LandingComponent: Failed to initialize GSAP:', error);
      });
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Cleanup consolidado e organizado
    this.destroy$.next();
    this.destroy$.complete();

    cancelAnimationFrame(this.knotId);
    this.sectionAnimations.destroy();
    this.scrollService.destroy();
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
  private async initializeScrollSystem(): Promise<void> {
    await this.scrollService.initialize();
    this.scrollService.scrollState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        setTimeout(() => {
          this.scrollState = state;
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



}
