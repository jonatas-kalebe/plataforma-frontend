import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, EventEmitter, inject, NgZone, OnDestroy, OnInit, Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip'; // NOVO: Importa o plugin Flip
import { finalize, first } from 'rxjs/operators';

// NOVO: Registra o plugin Flip
gsap.registerPlugin(Flip);

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingScreenComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() loadingFinished = new EventEmitter<void>();

  svgContent: SafeHtml | null = null;
  isLoadingSvg = true;

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private hostRef = inject(ElementRef<HTMLElement>);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private tl: gsap.core.Timeline | null = null;
  private isDone = false;
  private onSkip = () => this.skipAnimation();

  ngOnInit(): void {
    this.http.get('assets/logo/Logo_lines.svg', { responseType: 'text' })
      .pipe(
        first(),
        finalize(() => {
          this.isLoadingSvg = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(svgData => {
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svgData);
      });
  }

  ngAfterViewInit(): void {
    this.hostRef.nativeElement.addEventListener('click', this.onSkip);
    // Observa quando o SVG é renderizado para iniciar a animação
    const observer = new MutationObserver(() => {
      if (this.hostRef.nativeElement.querySelector('svg')) {
        this.initAnimation();
        observer.disconnect();
      }
    });
    observer.observe(this.hostRef.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.hostRef.nativeElement.removeEventListener('click', this.onSkip);
    this.tl?.kill();
  }

  private initAnimation(): void {
    if (this.isDone) return;

    const overlay = this.hostRef.nativeElement.querySelector('.loading-overlay');
    const wrapper = this.hostRef.nativeElement.querySelector('.logo-wrapper');
    const svgPaths = this.hostRef.nativeElement.querySelectorAll('path, ellipse');
    const navSlot = document.querySelector('#nav-logo-slot'); // Alvo final no header

    if (!overlay || !wrapper || svgPaths.length === 0 || !navSlot) {
      this.finish();
      return;
    }

    gsap.set(svgPaths, {
      strokeDasharray: (el) => (el as unknown as SVGPathElement).getTotalLength(),
      strokeDashoffset: (el) => (el as unknown as SVGPathElement).getTotalLength(),
      opacity: 1
    });

    this.tl = gsap.timeline({
      // CORREÇÃO: A lógica de finalização agora está no onComplete da timeline
      onComplete: () => {
        // 1. Captura o estado inicial do logo
        const state = Flip.getState(wrapper);

        // 2. Move o logo para o seu contêiner final no header
        navSlot.appendChild(wrapper);

        // 3. Anima o logo do estado inicial para o final
        Flip.from(state, {
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => {
            // Garante que o logo fique posicionado corretamente após a animação
            gsap.set(wrapper, { clearProps: 'all' });
            this.finish();
          }
        });

        // Anima o desaparecimento do fundo do overlay ao mesmo tempo
        gsap.to(overlay, {
          duration: 1.0,
          opacity: 0,
          ease: 'power2.in',
          onComplete: () => {
            overlay.remove(); // Remove o overlay do DOM
          }
        });
      }
    });

    this.tl
      .to(svgPaths, {
        strokeDashoffset: 0,
        duration: 2.5, // Duração do desenho
        ease: 'power1.inOut',
        stagger: 0.1,
      })
      .to(wrapper, { // Um pequeno flash/brilho no final
        boxShadow: '0 0 30px rgba(100,255,218,0.5)',
        repeat: 1,
        yoyo: true,
        duration: 0.3
      })
      .to({}, { duration: 0.5 }); // Pausa antes da transição final
  }

  private skipAnimation(): void {
    if (this.isDone) return;
    this.tl?.totalProgress(1); // Pula a animação para o final, acionando o onComplete
  }

  private finish(): void {
    if (this.isDone) return;
    this.isDone = true;
    this.hostRef.nativeElement.removeEventListener('click', this.onSkip);
    this.zone.run(() => this.loadingFinished.emit());
  }
}
