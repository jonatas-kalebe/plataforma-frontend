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
  @Output() canvasReady = new EventEmitter<HTMLCanvasElement>();

  @ViewChild('sectionEl', { static: true }) sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('knotCanvas', { static: true }) knotCanvas!: ElementRef<HTMLCanvasElement>;
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

    this.prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    this.sectionReady.emit(this.knotCanvas);
    this.canvasReady.emit(this.knotCanvas.nativeElement);

    requestAnimationFrame(() => {
      const cfg: Partial<KnotConfig> = {
        segments: 560,
        loopsCount: 36,
        loopRadiusMin: 34,
        loopRadiusMax: 104,
        noiseAmplitude: 110,
        harmonics: 9,
        tangleMultiplier: 1.6,

        // Decaimento mais rápido para “desembaralhar”
        globalFalloff: 2.1,     // antes ~1.35
        knotFalloff: 0.85,
        waveFalloff: 1.7,

        strokeWidth: 3,
        glowLevels: 4,
        animate: !this.prefersReduced,
        backgroundColor: 'transparent',
        freezeOnIdle: true,

        // Mantém o traço dentro da caixa
        boundsPadding: 18
      };
      this.knotSvc.initializeKnot(this.knotCanvas.nativeElement, cfg, this.prefersReduced ? 1 : 0);

      this.setupIntersectionAnimations();

      this.updateTargetFromScroll();
      this.startTicker();
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
    this.startTicker();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.knotSvc.resize();
    this.updateTargetFromScroll();
    this.startTicker();
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  private updateTargetFromScroll(): void {
    const sec = this.sectionRef?.nativeElement;
    if (!sec) return;

    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Mapeamento original (mantido para continuidade)
    const start = vh * 0.95;
    const end = -r.height * 0.15;
    let raw = (start - r.top) / (start - end);
    raw = this.clamp01(raw);
    const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;

    // NOVO: proximidade do centro da viewport (quanto mais perto do centro, mais próximo de 1)
    const sectionCenter = r.top + r.height / 2;
    const viewCenter = vh / 2;
    const distToCenter = Math.abs(sectionCenter - viewCenter);
    const centerNorm = 1 - this.clamp01(distToCenter / (vh * 0.45)); // 0 longe, 1 no centro
    const centerBoost = Math.pow(centerNorm, 1.1);

    // Snap para 1.0 quando realmente centralizado
    const CENTER_SNAP_PX = vh * 0.03;
    if (distToCenter <= CENTER_SNAP_PX) {
      this.targetProgress = 1;
    } else {
      // Usa o maior entre o mapeamento clássico e a proximidade ao centro
      this.targetProgress = Math.max(eased, centerBoost);
    }
  }

  private startTicker(): void {
    if (this.ticking) return;
    this.ticking = true;

    // Smoothing mais agressivo para “resolver” mais rápido
    const ALPHA = 0.30;  // antes 0.18
    const DEAD = 0.002;
    const EPS = 0.0005;

    // limites para detectar “parado”
    const VEL_NORM = 0.012;
    const IDLE_VEL = 0.012;
    const CLOSE_DELTA = 0.004;

    const tick = () => {
      if (!this.ticking) return;

      // Velocidade (mudança do progresso suavizado)
      const deltaForMotion = this.smoothedProgress - this.lastSmoothed;
      this.lastSmoothed = this.smoothedProgress;

      const absVel = Math.abs(deltaForMotion);
      this.velLP = this.velLP * 0.82 + Math.min(1, absVel / VEL_NORM) * 0.18;

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
      if (this.smoothedProgress < 0) this.smoothedProgress = 0;
      else if (this.smoothedProgress > 1) this.smoothedProgress = 1;

      this.knotSvc.setProgress(this.smoothedProgress);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  private setupIntersectionAnimations(): void {
    const left = this.contentLeft?.nativeElement;
    const box = this.canvasBox?.nativeElement;
    if (!left || !box) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          (entry.target as HTMLElement).classList.toggle('visible', entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );

    io.observe(left);
    io.observe(box);
  }
}
