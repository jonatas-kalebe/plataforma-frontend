import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { WorkCardRingComponent } from '../../components/work-card-ring/work-card-ring.component';
import {
  ThreeParticleBackgroundComponent
} from '../../components/three-particle-background/three-particle-background.component';
import { ScrollOrchestrationService, ScrollState } from '../../services/scroll-orchestration.service';
import { Subject, takeUntil } from 'rxjs';

// Expose GSAP globally for the scroll service
if (typeof window !== 'undefined') {
  (window as any).gsap = gsap;
  (window as any).ScrollTrigger = ScrollTrigger;
}

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

@Component({
  selector: 'app-landing',
  standalone: true,
  // ADICIONA OS NOVOS COMPONENTES AOS IMPORTS
  imports: [CommonModule, WorkCardRingComponent, ThreeParticleBackgroundComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('knotCanvas', { static: true }) knotCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild(ThreeParticleBackgroundComponent) particleBackground!: ThreeParticleBackgroundComponent;

  private zone = new NgZone({ enableLongStackTrace: false });
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;
  private destroy$ = new Subject<void>();
  private timelines: gsap.core.Timeline[] = [];
  private scrollTriggers: ScrollTrigger[] = [];
  private prefersReducedMotion = false;

  public scrollState: ScrollState | null = null;

  constructor(private scrollService: ScrollOrchestrationService) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.zone.runOutsideAngular(() => {
      this.checkReducedMotion();
      // GSAP is already registered globally, just make sure the service can access it
      
      // Initialize the scroll orchestration service
      this.scrollService.initialize();

      this.scrollService.scrollState$
        .pipe(takeUntil(this.destroy$))
        .subscribe(state => {
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.scrollState = state;
          });
        });

      this.initScrollytellingTimelines();
      this.initKnot();
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.destroy$.next();
    this.destroy$.complete();

    cancelAnimationFrame(this.knotId);
    this.timelines.forEach(tl => tl.kill());
    this.scrollTriggers.forEach(st => st.kill());
    ScrollTrigger.getAll().forEach(st => st.kill());
    this.scrollService.destroy();
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  private initScrollytellingTimelines(): void {
    this.initHeroTimeline();
    this.initFilosofiaTimeline();
    this.initServicosTimeline();
    this.initTrabalhosTimeline();
    this.initCtaTimeline();
  }

  private initHeroTimeline(): void {
    // Initial entrance animation (non-scroll based)
    const tl = gsap.timeline({
      defaults: { ease: this.prefersReducedMotion ? 'none' : 'power3.out', duration: this.prefersReducedMotion ? 0.3 : 1 }
    });

    tl.from('#hero-title', { opacity: 0, y: this.prefersReducedMotion ? 0 : 50, delay: 0.2 })
      .from('#hero-subtitle', { opacity: 0, y: this.prefersReducedMotion ? 0 : 40 }, '-=0.8')
      .from('#hero-cta', { opacity: 0, y: this.prefersReducedMotion ? 0 : 30 }, '-=0.6');

    this.timelines.push(tl);

    // Custom scroll-based animation with elastic resistance
    if (!this.prefersReducedMotion) {
      const heroScrollTrigger = ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        onUpdate: self => {
          const progress = self.progress;
          console.log('Hero ScrollTrigger progress:', progress, 'scroll:', window.scrollY);
          let yMultiplier, opacityMultiplier;
          
          if (progress <= 0.2) {
            // Strong resistance for 0-20%: minimal movement
            yMultiplier = progress * 0.3; // Very gentle movement
            opacityMultiplier = progress * 0.3; // Very gentle fade
          } else {
            // Accelerate after 20%
            const acceleratedProgress = 0.06 + (progress - 0.2) * 2.925; // Start from 0.06, accelerate
            yMultiplier = acceleratedProgress;
            opacityMultiplier = acceleratedProgress;
          }
          
          console.log('Applying yMultiplier:', yMultiplier, 'for progress:', progress);
          
          // Apply transforms
          gsap.set('#hero-title', { 
            y: -50 * yMultiplier, 
            opacity: Math.max(1 - opacityMultiplier * 0.8, 0.2)
          });
          gsap.set('#hero-subtitle', { 
            y: -30 * yMultiplier, 
            opacity: Math.max(1 - opacityMultiplier * 0.6, 0.4) 
          });
          gsap.set('#hero-cta', { 
            y: -20 * yMultiplier, 
            opacity: Math.max(1 - opacityMultiplier * 0.4, 0.6) 
          });
        }
      });
      
      this.scrollTriggers.push(heroScrollTrigger);
    }
  }

  private initFilosofiaTimeline(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top 80%',
        end: this.prefersReducedMotion ? 'top 80%' : 'bottom center',
        ...(this.prefersReducedMotion ? { toggleActions: 'play none none reverse' } : { scrub: 1 })
      }
    });

    tl.from('#filosofia h2', {
      opacity: 0,
      y: this.prefersReducedMotion ? 0 : 80,
      duration: this.prefersReducedMotion ? 0.3 : 1,
      ease: this.prefersReducedMotion ? 'none' : 'power3.out'
    })
      .from('#filosofia p', {
        opacity: 0,
        y: this.prefersReducedMotion ? 0 : 60,
        duration: this.prefersReducedMotion ? 0.3 : 0.8,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out'
      }, '-=0.4');

    this.timelines.push(tl);
  }

  private initServicosTimeline(): void {
    gsap.utils.toArray<HTMLElement>('.service-card').forEach((card, index) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          end: this.prefersReducedMotion ? 'top 85%' : 'bottom center',
          ...(this.prefersReducedMotion ? { toggleActions: 'play none none reverse' } : { scrub: 0.5 })
        }
      });

      tl.from(card, {
        opacity: 0,
        y: this.prefersReducedMotion ? 0 : 100,
        duration: this.prefersReducedMotion ? 0.3 : 0.8,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out',
        delay: this.prefersReducedMotion ? index * 0.1 : 0
      });

      if (!this.prefersReducedMotion) {
        tl.to(card, {
          y: -30,
          ease: 'none'
        });
      }

      this.timelines.push(tl);
    });
  }

  private initTrabalhosTimeline(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#trabalhos',
        start: 'top center',
        end: 'bottom center',
        ...(this.prefersReducedMotion ? { toggleActions: 'play none none reverse' } : {
          scrub: 1,
          pin: true
        })
      }
    });

    tl.from('#trabalhos h3', {
      opacity: 0,
      y: this.prefersReducedMotion ? 0 : 50,
      duration: this.prefersReducedMotion ? 0.3 : 0.5,
      ease: this.prefersReducedMotion ? 'none' : 'power2.out'
    });

    this.timelines.push(tl);
  }

  private initCtaTimeline(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#cta',
        start: 'top 80%',
        end: this.prefersReducedMotion ? 'top 80%' : 'bottom center',
        ...(this.prefersReducedMotion ? { toggleActions: 'play none none reverse' } : { scrub: 0.5 })
      }
    });

    tl.from('#cta h3', {
      opacity: 0,
      y: this.prefersReducedMotion ? 0 : 40,
      duration: this.prefersReducedMotion ? 0.3 : 0.8,
      ease: this.prefersReducedMotion ? 'none' : 'power3.out'
    })
      .from('#cta a', {
        opacity: 0,
        y: this.prefersReducedMotion ? 0 : 30,
        duration: this.prefersReducedMotion ? 0.3 : 0.6,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out'
      }, '-=0.4');

    this.timelines.push(tl);
  }

  private initKnot(): void {
    this.knotCtx = this.knotCanvas.nativeElement.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const el = this.knotCanvas.nativeElement;
      const rect = el.getBoundingClientRect();
      el.width = rect.width * dpr;
      el.height = rect.height * dpr;
      if (this.knotCtx) this.knotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const draw = () => {
      const ctx = this.knotCtx;
      if (!ctx) return;
      const el = this.knotCanvas.nativeElement;

      ctx.clearRect(0, 0, el.clientWidth, el.clientHeight);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const cy = h / 2;
      const pad = 24;

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#64FFDA';
      ctx.shadowColor = 'rgba(100,255,218,0.4)';
      ctx.shadowBlur = 12;

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

    const knotTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#filosofia',
        // Começa quando a seção entra na viewport e termina quando o centro da seção
        // encontra o centro da tela — a linha fica reta exatamente no meio da tela.
        start: 'top bottom',
        end: this.prefersReducedMotion ? 'top bottom' : 'center center',
        ...(this.prefersReducedMotion ? { toggleActions: 'play none none reverse' } : { scrub: 1 })
      }
    });

    knotTl.to({ val: 0 }, {
      val: 1,
      duration: this.prefersReducedMotion ? 0.3 : 1.5,
      ease: 'none', // linear com o scroll para sincronizar perfeitamente o "reta no centro"
      onUpdate: function() {
        t = (this as any).targets()[0].val;
        draw();
      }
    });

    this.timelines.push(knotTl);
  }
}
