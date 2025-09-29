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
import { SECTION_IDS } from '../../../shared';
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
        loopRadiusMax: 70,
        noiseAmplitude: 110,
        harmonics: 9,
        tangleMultiplier: 1.6,
        globalFalloff: 1.35,
        knotFalloff: 0.85,
        waveFalloff: 1.7,
        strokeWidth: 3,
        glowLevels: 4,
        animate: !this.prefersReduced,
        backgroundColor: 'transparent',
        freezeOnIdle: true, // chave do comportamento desejado
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

  private updateTargetFromScroll(): void {
    const sec = this.sectionRef?.nativeElement;
    if (!sec) return;

    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    const start = vh * 0.95;
    const end = -r.height * 0.15;

    let raw = (start - r.top) / (start - end);
    raw = Math.max(0, Math.min(1, raw));

    const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;

    this.targetProgress = eased;
  }

  private startTicker(): void {
    if (this.ticking) return;
    this.ticking = true;

    const ALPHA = 0.18;   // suavização (0..1)
    const DEAD = 0.004;   // deadzone
    const EPS = 0.0005;

    // limites para detectar “parado”
    const VEL_NORM = 0.012;   // normalização da velocidade
    const IDLE_VEL = 0.015;   // abaixo disso consideramos parado
    const CLOSE_DELTA = 0.008; // se progresso-alvo estiver perto o bastante

    const tick = () => {
      if (!this.ticking) return;

      // Velocidade (mudança do progresso suavizado)
      const deltaForMotion = this.smoothedProgress - this.lastSmoothed;
      this.lastSmoothed = this.smoothedProgress;

      const absVel = Math.abs(deltaForMotion);
      this.velLP = this.velLP * 0.85 + Math.min(1, absVel / VEL_NORM) * 0.15;

      // Atualiza o movimento no serviço (com latch/histerese)
      this.knotSvc.setMotion(this.velLP);

      // Smoothing do progresso
      const deltaTarget = this.targetProgress - this.smoothedProgress;

      // Se estamos praticamente parados e perto do alvo, faz snap para evitar morph residual
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
