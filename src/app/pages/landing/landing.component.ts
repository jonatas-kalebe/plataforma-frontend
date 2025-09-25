import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WorkCardRingComponent } from '../../components/work-card-ring/work-card-ring.component';
import {
  ThreeParticleBackgroundComponent
} from '../../components/three-particle-background/three-particle-background.component';
import { ScrollOrchestratorService } from '../../services/scroll-orchestrator.service';

gsap.registerPlugin(ScrollTrigger);

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

  private zone = new NgZone({ enableLongStackTrace: false });
  private scrollOrchestrator = inject(ScrollOrchestratorService);
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.scrollOrchestrator.initialize();
      this.initScrollytelling();
      this.initKnot();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.knotId);
    this.scrollOrchestrator.destroy();
  }

  private initScrollytelling(): void {
    const prefersReducedMotion = this.scrollOrchestrator.isPrefersReducedMotion();

    this.createHeroSection(prefersReducedMotion);
    this.createFilosofiaSection(prefersReducedMotion);
    this.createServicosSection(prefersReducedMotion);
    this.createTrabalhosSection(prefersReducedMotion);
    this.createCTASection(prefersReducedMotion);
  }

  private createHeroSection(prefersReducedMotion: boolean): void {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
    tl.from('#hero-title', { opacity: 0, y: 50, delay: 0.2 })
      .from('#hero-subtitle', { opacity: 0, y: 40 }, '-=0.8')
      .from('#hero-cta', { opacity: 0, y: 30 }, '-=0.6');

    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: 'section:first-child',
        start: 'top top',
        end: 'bottom top',
        pin: true,
        pinSpacing: false,
        scrub: 1,
        snap: { snapTo: 1, duration: 0.5 }
      });
    }
  }

  private createFilosofiaSection(prefersReducedMotion: boolean): void {
    const filosofiaAnimation = gsap.from('#filosofia > div', {
      opacity: 0,
      y: 80,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      paused: true
    });

    ScrollTrigger.create({
      trigger: '#filosofia',
      start: 'top 80%',
      end: prefersReducedMotion ? 'bottom 20%' : 'bottom top',
      pin: prefersReducedMotion ? false : true,
      scrub: prefersReducedMotion ? undefined : 1,
      snap: prefersReducedMotion ? undefined : { snapTo: 1, duration: 0.5 },
      onToggle: (self) => {
        if (prefersReducedMotion) {
          if (self.isActive) filosofiaAnimation.play();
          else filosofiaAnimation.reverse();
        }
      },
      onUpdate: (self) => {
        if (!prefersReducedMotion) {
          filosofiaAnimation.progress(self.progress);
        }
      }
    });
  }

  private createServicosSection(prefersReducedMotion: boolean): void {
    gsap.utils.toArray<HTMLElement>('.service-card').forEach((card, index) => {
      const cardAnimation = gsap.from(card, {
        opacity: 0,
        y: 100,
        duration: 0.8,
        ease: 'power3.out',
        paused: true
      });

      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        end: 'bottom 15%',
        scrub: prefersReducedMotion ? undefined : 0.5,
        onToggle: (self) => {
          if (prefersReducedMotion) {
            if (self.isActive) cardAnimation.play();
            else cardAnimation.reverse();
          }
        },
        onUpdate: (self) => {
          if (!prefersReducedMotion) {
            cardAnimation.progress(self.progress);
          }
        }
      });
    });

    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: '#servicos',
        start: 'top top',
        end: 'bottom top',
        snap: { snapTo: 1, duration: 0.5 }
      });
    }
  }

  private createTrabalhosSection(prefersReducedMotion: boolean): void {
    if (!prefersReducedMotion) {
      ScrollTrigger.create({
        trigger: '#trabalhos',
        start: 'top top',
        end: 'bottom top',
        pin: true,
        scrub: 1,
        snap: { snapTo: 1, duration: 0.5 }
      });
    }
  }

  private createCTASection(prefersReducedMotion: boolean): void {
    gsap.from('#cta h3', {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#cta',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });

    gsap.from('#cta a', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2,
      scrollTrigger: {
        trigger: '#cta',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      }
    });
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
        const amp = t * (h * 0.4);
        const freq = 4;
        const y = cy + Math.sin(p * Math.PI * freq + t * Math.PI * 2) * amp * (1 - Math.abs(0.5 - p) * 1.8);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const prefersReducedMotion = this.scrollOrchestrator.isPrefersReducedMotion();
    
    if (prefersReducedMotion) {
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
    } else {
      gsap.to({ val: 0 }, {
        val: 1,
        ease: 'none',
        onUpdate: function() {
          t = this["targets"]()[0].val;
          draw();
        },
        scrollTrigger: {
          trigger: '#filosofia',
          start: 'top center',
          end: 'bottom center',
          scrub: 1
        }
      });
    }
  }
}
