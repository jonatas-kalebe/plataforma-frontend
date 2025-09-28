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
import {AthenaChatWidgetComponent} from '../../components/athena-chat-widget/athena-chat-widget.component';

// Expose GSAP globally for the scroll service
if (typeof window !== 'undefined') {
  (window as any).gsap = gsap;
  (window as any).ScrollTrigger = ScrollTrigger;
}

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, HeroSectionComponent, FilosofiaSectionComponent, ServicosSectionComponent, TrabalhosSectionComponent, CtaSectionComponent, AthenaChatWidgetComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('knotCanvas', {static: true}) knotCanvas!: ElementRef<HTMLCanvasElement>;
  public scrollState: ScrollState | null = null;
  public showAthenaWidget: boolean = true; // Set to true for initial testing
  private readonly platformId = inject(PLATFORM_ID);
  private zone = new NgZone({enableLongStackTrace: false});
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;
  private destroy$ = new Subject<void>();
  private timelines: gsap.core.Timeline[] = [];
  private scrollTriggers: ScrollTrigger[] = [];
  private prefersReducedMotion = false;

  constructor(private scrollService: ScrollOrchestrationService) {
  }

  // Event handlers for section components
  onHeroCta(event: Event): void {
    // Handle CTA click - scroll to services section
    this.scrollService.scrollToSection('servicos', 1);
  }

  onHeroSectionReady(heroBgRef: ElementRef): void {
    // Store reference for animations if needed
    console.log('Hero section ready:', heroBgRef);
  }

  onFilosofiaSectionReady(elementRef: ElementRef): void {
    console.log('Filosofia section ready:', elementRef);
  }

  onKnotCanvasReady(canvas: HTMLCanvasElement): void {
    console.log('Knot canvas ready:', canvas);
    // The knot canvas animation is handled by the landing component
    // We need to pass this canvas to the knot animation method
    this.setupKnotCanvas(canvas);
  }

  onServicosSectionReady(event: any): void {
    console.log('Serviços section ready:', event);
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
      this.checkReducedMotion();

      // Ensure DOM is fully rendered before initializing scroll service
      requestAnimationFrame(() => {
        // Initialize the scroll orchestration service
        this.scrollService.initialize();

        this.scrollService.scrollState$
          .pipe(takeUntil(this.destroy$))
          .subscribe(state => {
            setTimeout(() => {
              this.scrollState = state;
              // Show Athena widget after scrolling past hero section (25% of page)
              const shouldShow = (state?.globalProgress || 0) > 0.25;
              console.log('Scroll state:', state?.globalProgress, 'Should show Athena:', shouldShow);
              this.showAthenaWidget = shouldShow || true; // Force true for now
            });
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

  private setupKnotCanvas(canvas: HTMLCanvasElement): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Extract knot animation logic for use with component canvas
    this.knotCanvas = new ElementRef(canvas);
    this.initKnot();
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  private initScrollytellingTimelines(): void {
    // Entry animations only - scroll-linked animations are handled by ScrollOrchestrationService
    this.initHeroTimeline();
    this.initFilosofiaTimeline();
    this.initServicosTimeline();
    // Remove ScrollTrigger timelines that conflict with ScrollOrchestrationService
    // this.initTrabalhosTimeline();
    // this.initCtaTimeline();
  }

  private initHeroTimeline(): void {
    // TEMPORARILY DISABLED: Initial entrance animation to test scroll resistance
    // The entrance animation might be interfering with scroll-linked resistance animations
    console.log('Hero entrance animation temporarily disabled for testing');
    /*
    const tl = gsap.timeline({
      defaults: {ease: this.prefersReducedMotion ? 'none' : 'power3.out', duration: this.prefersReducedMotion ? 0.3 : 1}
    });

    tl.from('#hero-title', { y: this.prefersReducedMotion ? 0 : 50, delay: 0.2})
      .from('#hero-subtitle', { y: this.prefersReducedMotion ? 0 : 40}, '-=0.8')
      .from('#hero-cta', { y: this.prefersReducedMotion ? 0 : 30}, '-=0.6');

    this.timelines.push(tl);
    */

    // Scroll-linked animations are now handled by ScrollOrchestrationService
    // Remove the conflicting ScrollTrigger that was here before
  }

  private initFilosofiaTimeline(): void {
    // Only basic entry animation, scroll-linked animations handled by ScrollOrchestrationService
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top 80%',
        end: 'top 80%',
        toggleActions: 'play none none reverse'
      }
    });

    tl.from('#filosofia h2', {
      y: this.prefersReducedMotion ? 0 : 80,
      duration: this.prefersReducedMotion ? 0.3 : 1,
      ease: this.prefersReducedMotion ? 'none' : 'power3.out'
    })
      .from('#filosofia p', {
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
          ...(this.prefersReducedMotion ? {toggleActions: 'play none none reverse'} : {scrub: 0.5})
        }
      });
      tl.fromTo(card, {y: 40}, {
        y: this.prefersReducedMotion ? 0 : 100,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out',
        duration: this.prefersReducedMotion ? 0.3 : 0.8,
        delay: this.prefersReducedMotion ? index * 0.1 : 0,
        immediateRender: false
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
        ...(this.prefersReducedMotion ? {toggleActions: 'play none none reverse'} : {
          // ALTERAÇÃO: remover pin aqui (pin é feito no serviço para evitar conflito)
          scrub: 1
        })
      }
    });

    tl.from('#trabalhos h3', {

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
        ...(this.prefersReducedMotion ? {toggleActions: 'play none none reverse'} : {scrub: 0.5})
      }
    });

    tl.from('#cta h2', {

      y: this.prefersReducedMotion ? 0 : 40,
      duration: this.prefersReducedMotion ? 0.3 : 0.8,
      ease: this.prefersReducedMotion ? 'none' : 'power3.out'
    })
      .from('#cta a', {

        y: this.prefersReducedMotion ? 0 : 30,
        duration: this.prefersReducedMotion ? 0.3 : 0.6,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out'
      }, '-=0.4');

    this.timelines.push(tl);
  }

  private initKnot(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.knotCanvas?.nativeElement) return;

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
        start: 'top bottom',
        end: this.prefersReducedMotion ? 'top bottom' : 'center center',
        ...(this.prefersReducedMotion ? {toggleActions: 'play none none reverse'} : {scrub: 1})
      }
    });

    knotTl.to({val: 0}, {
      val: 1,
      duration: this.prefersReducedMotion ? 0.3 : 1.5,
      ease: 'none',
      onUpdate: function () {
        t = (this as any).targets()[0].val;
        draw();
      }
    });

    this.timelines.push(knotTl);
  }
}
