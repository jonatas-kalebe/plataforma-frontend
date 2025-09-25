import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WorkCardRingComponent } from '../../components/work-card-ring/work-card-ring.component';
import {
  ThreeParticleBackgroundComponent
} from '../../components/three-particle-background/three-particle-background.component';
import { ScrollOrchestrationService } from '../../services/scroll-orchestration.service';

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
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('knotCanvas', { static: true }) knotCanvas!: ElementRef<HTMLCanvasElement>;

  private zone = new NgZone({ enableLongStackTrace: false });
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;

  constructor(private scrollService: ScrollOrchestrationService) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.zone.runOutsideAngular(() => {
      gsap.registerPlugin(ScrollTrigger);
      this.initGSAP();
      this.initKnot();
      
      // Initialize scroll orchestration service
      this.scrollService.initialize();
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Limpa apenas o que este componente controla
    cancelAnimationFrame(this.knotId);
    ScrollTrigger.getAll().forEach(st => st.kill());
    this.scrollService.destroy();
  }

  private initGSAP(): void {
    // Timeline para seção Hero (Ato 1) - animação inicial sem scrub
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
    heroTl.from('#hero-title', { opacity: 0, y: 50, delay: 0.2 })
      .from('#hero-subtitle', { opacity: 0, y: 40 }, '-=0.8')
      .from('#hero-cta', { opacity: 0, y: 30 }, '-=0.6');

    // Timeline para seção Filosofia (Ato 2) - com scrub para scrollytelling
    const filosofiaTl = gsap.timeline({
      ease: 'none',
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    filosofiaTl.from('#filosofia > div > div:first-child', { opacity: 0, y: 80, duration: 1 })
              .from('#filosofia > div > div:last-child', { opacity: 0, x: 50, duration: 1 }, '-=0.5');

    // Timeline para seção Serviços (Ato 3) - com scrub
    const servicosTl = gsap.timeline({
      ease: 'none',
      scrollTrigger: {
        trigger: '#servicos',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    servicosTl.from('#servicos h3', { opacity: 0, y: 50, duration: 0.5 })
              .from('.service-card', { opacity: 0, y: 100, duration: 1, stagger: 0.2 }, '-=0.3');

    // Timeline para seção Trabalhos (Ato 4) - com scrub
    const trabalhosTl = gsap.timeline({
      ease: 'none',
      scrollTrigger: {
        trigger: '#trabalhos',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    trabalhosTl.from('#trabalhos h3', { opacity: 0, y: 50, duration: 0.5 })
               .from('#trabalhos app-work-card-ring', { opacity: 0, scale: 0.8, duration: 1 }, '-=0.3');

    // Timeline para seção CTA (Ato 5) - com scrub
    const ctaTl = gsap.timeline({
      ease: 'none',
      scrollTrigger: {
        trigger: '#cta',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      }
    });
    ctaTl.from('#cta h3', { opacity: 0, y: 50, duration: 0.5 })
         .from('#cta a', { opacity: 0, y: 30, scale: 0.9, duration: 0.5 }, '-=0.3');
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

    // Animação controlada por GSAP e ScrollTrigger com scrub para scrollytelling
    gsap.to({ val: 0 }, {
      val: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: function(self) {
          t = self.progress;
          draw();
        }
      }
    });
  }
}
