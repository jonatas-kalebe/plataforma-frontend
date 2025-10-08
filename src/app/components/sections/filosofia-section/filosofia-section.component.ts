import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SECTION_IDS } from '../../../shared/constants/section.constants';
import { KnotCanvasService, KnotConfig } from '../../../services/animation';

// ============================================================================
// 🎨 ANIMATION CONFIGURATION - Customize all animation settings here
// ============================================================================

const KNOT_CONFIG = {
  segments: 680,                // Número de segmentos para interpolação
  strokeWidth: 2,               // Espessura da linha (px)
  strokeColor: '#64FFDA',       // Cor da linha
  backgroundColor: 'transparent', // Cor de fundo
  straightLinePadding: 12,      // Padding quando linha reta (px)
  initialProgress: 0            // Progresso inicial (0-1)
};

const SCROLL_MAPPING_CONFIG = {
  startThreshold: 0.95,         // Viewport height * threshold para começar (0-1)
  endThreshold: 0.15,           // Height * threshold para terminar (0-1)
  centerSnapDistance: 0.03,     // Distância do centro para snap (viewport height *)
  centerInfluence: 0.45,        // Influência do centro (viewport height *)
  centerPower: 1.1,             // Potência da curva de proximidade ao centro
  easingPower: 2                // Potência do easing (2 = quadrático)
};

const SMOOTHING_CONFIG = {
  alpha: 0.30,                  // Suavidade da interpolação (0-1, maior = mais rápido)
  deadZone: 0.002,              // Zona morta para parar animação
  epsilon: 0.0005,              // Precisão mínima para snap final
  idleVelocityThreshold: 0.012, // Velocidade abaixo da qual considera parado
  closeDelta: 0.004             // Distância ao target para snap
};

const VELOCITY_CONFIG = {
  normalizer: 0.012,            // Normalizador de velocidade
  filterAlpha: 0.82,            // Filtro passa-baixa para velocidade (0-1)
  minThreshold: 0.012           // Velocidade mínima para considerar movimento
};

const INTERSECTION_CONFIG = {
  threshold: 0.15,              // Threshold do IntersectionObserver (0-1)
  visibleClass: 'visible'       // Classe CSS aplicada quando visível
};

const PERFORMANCE_CONFIG = {
  useRAF: true,                 // Usar requestAnimationFrame
  enableTicker: true            // Habilitar ticker de animação
};

const RESPONSIVE_CONFIG = {
  checkPrefersReducedMotion: true, // Verificar preferência de movimento reduzido
  disableAnimationOnReduced: true  // Desabilitar animação se preferir movimento reduzido
};

@Component({
  selector: 'app-filosofia-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filosofia-section.component.html',
  styleUrls: ['./filosofia-section.component.css']
})
export class FilosofiaSectionComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @Input() title: string = 'Da Complexidade à Clareza.';
  @Input() description: string = 'Transformamos sistemas caóticos em experiências nítidas. Arquitetura, design e engenharia convergem para mover pessoas e negócios.';
  @Input() showCanvasOverlay: boolean = false;
  @Input() enablePinning: boolean = true;

  @Output() sectionReady = new EventEmitter<ElementRef>();
  @Output() canvasReady = new EventEmitter<SVGSVGElement | null>();

  @ViewChild('sectionEl', { static: true }) sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('knotContainer', { static: true }) knotContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('contentLeft', { static: true }) contentLeft!: ElementRef<HTMLElement>;
  @ViewChild('canvasBox', { static: true }) canvasBox!: ElementRef<HTMLElement>;

  readonly SECTION_ID = SECTION_IDS.FILOSOFIA;

  private targetProgress = 0;
  private smoothedProgress = 0;
  private lastSmoothed = 0;
  private velLP = 0; // velocidade filtrada (0..1)

  private ticking = false;
  private rafId = 0;
  prefersReduced = false;

  constructor(private knotSvc: KnotCanvasService) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (RESPONSIVE_CONFIG.checkPrefersReducedMotion) {
      this.prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    }

    this.sectionReady.emit(this.knotContainer);

    if (PERFORMANCE_CONFIG.useRAF) {
      requestAnimationFrame(() => this.initializeKnot());
    } else {
      this.initializeKnot();
    }
  }

  private initializeKnot(): void {
    const cfg: Partial<KnotConfig> = {
      segments: KNOT_CONFIG.segments,
      strokeWidth: KNOT_CONFIG.strokeWidth,
      strokeColor: KNOT_CONFIG.strokeColor,
      backgroundColor: KNOT_CONFIG.backgroundColor,
      straightLinePadding: KNOT_CONFIG.straightLinePadding,
    };

    const initialProgress = (this.prefersReduced && RESPONSIVE_CONFIG.disableAnimationOnReduced) 
      ? 1 
      : KNOT_CONFIG.initialProgress;

    this.knotSvc
      .initializeKnot(this.knotContainer.nativeElement, cfg, initialProgress)
      .then((svg) => {
        this.canvasReady.emit(svg);
        this.setupIntersectionAnimations();
        this.updateTargetFromScroll();
        if (PERFORMANCE_CONFIG.enableTicker && !this.prefersReduced) {
          this.startTicker();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.ticking = false;
    this.knotSvc.destroy();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!isPlatformBrowser(this.platformId) || this.prefersReduced) return;
    this.updateTargetFromScroll();
    if (PERFORMANCE_CONFIG.enableTicker) {
      this.startTicker();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.knotSvc.resize();
    this.updateTargetFromScroll();
    if (PERFORMANCE_CONFIG.enableTicker) {
      this.startTicker();
    }
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  private updateTargetFromScroll(): void {
    const sec = this.sectionRef?.nativeElement;
    if (!sec) return;

    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Mapeamento baseado na posição da seção
    const start = vh * SCROLL_MAPPING_CONFIG.startThreshold;
    const end = -r.height * SCROLL_MAPPING_CONFIG.endThreshold;
    let raw = (start - r.top) / (start - end);
    raw = this.clamp01(raw);
    
    // Easing baseado em configuração
    const easingPower = SCROLL_MAPPING_CONFIG.easingPower;
    const eased = raw < 0.5 
      ? Math.pow(2, easingPower - 1) * Math.pow(raw, easingPower)
      : 1 - Math.pow(-2 * raw + 2, easingPower) / Math.pow(2, easingPower - 1);

    // Proximidade do centro da viewport (boost quando centralizado)
    const sectionCenter = r.top + r.height / 2;
    const viewCenter = vh / 2;
    const distToCenter = Math.abs(sectionCenter - viewCenter);
    const centerInfluenceDistance = vh * SCROLL_MAPPING_CONFIG.centerInfluence;
    const centerNorm = 1 - this.clamp01(distToCenter / centerInfluenceDistance);
    const centerBoost = Math.pow(centerNorm, SCROLL_MAPPING_CONFIG.centerPower);

    // Snap para 1.0 quando realmente centralizado
    const centerSnapPx = vh * SCROLL_MAPPING_CONFIG.centerSnapDistance;
    if (distToCenter <= centerSnapPx) {
      this.targetProgress = 1;
    } else {
      // Usa o maior entre o mapeamento clássico e a proximidade ao centro
      this.targetProgress = Math.max(eased, centerBoost);
    }
  }

  private startTicker(): void {
    if (this.ticking) return;
    this.ticking = true;

    const ALPHA = SMOOTHING_CONFIG.alpha;
    const DEAD = SMOOTHING_CONFIG.deadZone;
    const EPS = SMOOTHING_CONFIG.epsilon;
    const IDLE_VEL = SMOOTHING_CONFIG.idleVelocityThreshold;
    const CLOSE_DELTA = SMOOTHING_CONFIG.closeDelta;
    const VEL_NORM = VELOCITY_CONFIG.normalizer;
    const VEL_FILTER = VELOCITY_CONFIG.filterAlpha;

    const tick = () => {
      if (!this.ticking) return;

      // Velocidade (mudança do progresso suavizado)
      const deltaForMotion = this.smoothedProgress - this.lastSmoothed;
      this.lastSmoothed = this.smoothedProgress;

      const absVel = Math.abs(deltaForMotion);
      this.velLP = this.velLP * VEL_FILTER + Math.min(1, absVel / VEL_NORM) * (1 - VEL_FILTER);

      // Atualiza o movimento no serviço (com latch/histerese)
      this.knotSvc.setMotion(this.velLP);

      // Smoothing do progresso
      const deltaTarget = this.targetProgress - this.smoothedProgress;

      // Se estamos praticamente parados e perto do alvo, faz snap
      if (this.velLP < IDLE_VEL && Math.abs(deltaTarget) < CLOSE_DELTA) {
        this.smoothedProgress = this.targetProgress;
        this.knotSvc.setProgress(this.smoothedProgress);
        this.ticking = false;
        return;
      }

      // Deadzone padrão
      if (Math.abs(deltaTarget) < DEAD) {
        if (Math.abs(deltaTarget) < EPS) {
          this.smoothedProgress = this.targetProgress;
          this.knotSvc.setProgress(this.smoothedProgress);
          this.ticking = false;
          return;
        }
      }

      this.smoothedProgress = this.smoothedProgress + deltaTarget * ALPHA;
      this.smoothedProgress = this.clamp01(this.smoothedProgress);

      this.knotSvc.setProgress(this.smoothedProgress);
      
      if (PERFORMANCE_CONFIG.useRAF) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(tick, 16);
      }
    };

    if (PERFORMANCE_CONFIG.useRAF) {
      requestAnimationFrame(tick);
    } else {
      setTimeout(tick, 16);
    }
  }

  private setupIntersectionAnimations(): void {
    const left = this.contentLeft?.nativeElement;
    const box = this.canvasBox?.nativeElement;
    if (!left || !box) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          (entry.target as HTMLElement).classList.toggle(
            INTERSECTION_CONFIG.visibleClass, 
            entry.isIntersecting
          );
        });
      },
      { threshold: INTERSECTION_CONFIG.threshold }
    );

    io.observe(left);
    io.observe(box);
  }
}
