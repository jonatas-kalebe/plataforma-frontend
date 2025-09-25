import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WorkCardRingComponent } from '../../components/work-card-ring/work-card-ring.component';
import {
  ThreeParticleBackgroundComponent
} from '../../components/three-particle-background/three-particle-background.component';
import { ScrollOrchestratorService, ScrollState } from '../../core/scroll-orchestrator.service';

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
  private knotCtx!: CanvasRenderingContext2D | null;
  private knotId = 0;
  private subscriptions: Subscription[] = [];
  
  scrollState: ScrollState | undefined;

  constructor(private scrollOrchestrator: ScrollOrchestratorService) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.setupScrollOrchestrator();
      this.initKnot();
      this.initScrolltelling();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.knotId);
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.scrollOrchestrator.destroy();
  }

  private setupScrollOrchestrator(): void {
    this.scrollOrchestrator.registerSection({
      id: 'hero',
      pin: true,
      snap: true,
      scrub: true
    });
    
    this.scrollOrchestrator.registerSection({
      id: 'filosofia',
      scrub: true
    });
    
    this.scrollOrchestrator.registerSection({
      id: 'servicos',
      scrub: true
    });
    
    this.scrollOrchestrator.registerSection({
      id: 'trabalhos',
      pin: true,
      snap: true,
      scrub: true
    });
    
    this.scrollOrchestrator.registerSection({
      id: 'cta',
      snap: true
    });

    const stateSubscription = this.scrollOrchestrator.scrollState.subscribe(state => {
      this.scrollState = state;
    });
    
    this.subscriptions.push(stateSubscription);
    this.scrollOrchestrator.initialize();
  }

  private initScrolltelling(): void {
    this.createActI();
    this.createActII();
    this.createActIII();
    this.createActIV();
    this.createActV();
  }

  private createActI(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        pin: false
      }
    });

    tl.set('#hero-title, #hero-subtitle, #hero-cta', { opacity: 0, y: 50 })
      .to('#hero-title', { opacity: 1, y: 0, ease: 'none' }, 0)
      .to('#hero-subtitle', { opacity: 1, y: 0, ease: 'none' }, 0.2)
      .to('#hero-cta', { opacity: 1, y: 0, ease: 'none' }, 0.4);
  }

  private createActII(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top 75%',
        end: 'bottom center',
        scrub: 1
      }
    });

    const blocks = gsap.utils.toArray('#filosofia > div > *');
    tl.set(blocks, { opacity: 0, y: 80 })
      .to(blocks, { 
        opacity: 1, 
        y: 0, 
        stagger: 0.3,
        ease: 'none'
      });
  }

  private createActIII(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#trabalhos',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        pin: false
      }
    });

    tl.to('.ring', {
      rotation: '+=360',
      ease: 'none'
    });
  }

  private createActIV(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#servicos',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2
      }
    });

    gsap.utils.toArray('.service-card').forEach((card, index) => {
      tl.from(card as HTMLElement, {
        opacity: 0,
        y: 100,
        ease: 'none'
      }, index * 0.2);
    });
  }

  private createActV(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#cta',
        start: 'top 80%',
        end: 'bottom center',
        scrub: 1
      }
    });

    tl.from('#cta h3', { opacity: 0, y: 50, ease: 'none' })
      .from('#cta a', { opacity: 0, y: 30, ease: 'none' }, '-=0.5');
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
