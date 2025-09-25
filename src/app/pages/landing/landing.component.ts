import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { WorkCardRingComponent } from '../../components/work-card-ring/work-card-ring.component';
import {
  ThreeParticleBackgroundComponent
} from '../../components/three-particle-background/three-particle-background.component';
import { ScrollOrchestratorService, ScrollState } from '../../core/scroll-orchestrator.service';

let ScrollTrigger: any;
if (typeof window !== 'undefined') {
  import('gsap/ScrollTrigger').then(st => {
    ScrollTrigger = st.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
  });
}

gsap.registerPlugin();

@Component({
  selector: 'app-landing',
  standalone: true,
  // ADICIONA OS NOVOS COMPONENTES AOS IMPORTS
  imports: [CommonModule, WorkCardRingComponent, ThreeParticleBackgroundComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('knotCanvas', { static: true }) knotCanvas!: ElementRef<HTMLCanvasElement>;

  scrollState: ScrollState = {
    globalProgress: 0,
    sectionIndex: 0,
    sectionProgress: 0,
    velocity: 0,
    isSnapping: false,
    prefersReducedMotion: false
  };

  private isBrowser: boolean;
  private zone = new NgZone({ enableLongStackTrace: false });
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;
  private scrollSubscription?: Subscription;

  constructor(
    private scrollOrchestrator: ScrollOrchestratorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.zone.runOutsideAngular(() => {
        this.scrollOrchestrator.initialize();
        this.subscribeToScrollState();
        this.initGSAP();
        this.initKnot();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      cancelAnimationFrame(this.knotId);
      this.scrollOrchestrator.destroy();
      this.scrollSubscription?.unsubscribe();
      if (ScrollTrigger) {
        ScrollTrigger.getAll().forEach((st: any) => st.kill());
      }
    }
  }

  private subscribeToScrollState(): void {
    this.scrollSubscription = this.scrollOrchestrator.scrollState.subscribe(state => {
      this.scrollState = state;
    });
  }

  private initGSAP(): void {
    if (!this.isBrowser || !ScrollTrigger) {
      // Retry initialization after ScrollTrigger loads
      setTimeout(() => this.initGSAP(), 100);
      return;
    }
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.createHeroTimeline(prefersReducedMotion);
    this.createFilosofiaTimeline(prefersReducedMotion);
    this.createServicosTimeline(prefersReducedMotion);
    this.createTrabalhosTimeline(prefersReducedMotion);
    this.createCTATimeline(prefersReducedMotion);
  }

  private createHeroTimeline(prefersReducedMotion: boolean): void {
    const heroTL = gsap.timeline({ 
      defaults: { ease: prefersReducedMotion ? 'power3.out' : 'none', duration: 1 }
    });

    heroTL.from('#hero-title', { opacity: 0, y: 50, delay: 0.2 })
      .from('#hero-subtitle', { opacity: 0, y: 40 }, '-=0.8')
      .from('#hero-cta', { opacity: 0, y: 30 }, '-=0.6');

    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: false,
        scrub: 1,
        animation: gsap.timeline()
          .to('#hero-title', { scale: 0.8, y: -50, ease: 'none' })
          .to('#hero-subtitle', { opacity: 0.5, ease: 'none' }, 0)
          .to('#hero-cta', { opacity: 0, y: -20, ease: 'none' }, 0)
      });
    }
  }

  private createFilosofiaTimeline(prefersReducedMotion: boolean): void {
    gsap.from('#filosofia > div', {
      opacity: 0,
      y: 80,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });

    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: '#filosofia',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        animation: gsap.timeline()
          .fromTo('#filosofia h2', { x: -100 }, { x: 0, ease: 'none' })
          .fromTo('#filosofia p', { x: 100 }, { x: 0, ease: 'none' }, 0)
      });
    }
  }

  private createServicosTimeline(prefersReducedMotion: boolean): void {
    gsap.utils.toArray<HTMLElement>('.service-card').forEach((card, index) => {
      gsap.from(card, {
        opacity: 0,
        y: 100,
        duration: 0.8,
        ease: 'power3.out',
        delay: index * 0.1,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      });

      if (!prefersReducedMotion) {
        ScrollTrigger.create({
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          animation: gsap.fromTo(card, 
            { rotateY: -15, transformPerspective: 1000 }, 
            { rotateY: 15, ease: 'none' }
          )
        });
      }
    });
  }

  private createTrabalhosTimeline(prefersReducedMotion: boolean): void {
    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: '#trabalhos',
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: false,
        scrub: 1,
        animation: gsap.timeline()
          .fromTo('#trabalhos h3', { opacity: 1, y: 0 }, { opacity: 0.3, y: -100, ease: 'none' })
          .fromTo('app-work-card-ring', { scale: 1 }, { scale: 1.2, ease: 'none' }, 0)
      });
    }
  }

  private createCTATimeline(prefersReducedMotion: boolean): void {
    gsap.from('#cta > div', {
      opacity: 0,
      y: 80,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#cta',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      }
    });

    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: '#cta',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        animation: gsap.timeline()
          .fromTo('#cta h3', { scale: 0.8 }, { scale: 1.1, ease: 'none' })
          .fromTo('#cta a', { y: 50 }, { y: -20, ease: 'none' }, 0)
      });
    }
  }

  private initKnot(): void {
    if (!this.isBrowser) return;
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
    window.addEventListener('resize', resize); // Garante que o canvas redimensione com a janela

    let t = 0; // Variável de progresso da animação
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
      const segments = 120; // Mais segmentos para uma linha mais suave
      for (let i = 0; i <= segments; i++) {
        const p = i / segments;
        const x = pad + p * (w - pad * 2);
        const amp = (1 - t) * (h * 0.4); // Amplitude baseada na altura
        const freq = 4;
        const y = cy + Math.sin(p * Math.PI * freq + t * Math.PI * 2) * amp * (1 - Math.abs(0.5 - p) * 1.8);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // Animação controlada por GSAP e ScrollTrigger
    gsap.to({ val: 0 }, {
      val: 1,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: function() {
        t = this["targets"]()[0].val;
        draw();
      },
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      }
    });
  }
}
