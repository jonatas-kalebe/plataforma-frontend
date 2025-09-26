/**
 * Hero Section Component
 * Dedicated component for the hero/landing section with particle background
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeParticleBackgroundComponent } from '../../three-particle-background/three-particle-background.component';
import { CtaButtonComponent, ScrollHintComponent } from '../../ui';
import { ScrollState } from '../../../services/scroll-orchestration.service';
import { SECTION_IDS } from '../../../shared/constants';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [
    CommonModule,
    ThreeParticleBackgroundComponent,
    CtaButtonComponent,
    ScrollHintComponent
  ],
  template: `
    <section 
      id="hero" 
      class="relative h-screen w-full overflow-hidden select-none"
      [attr.data-testid]="testId">
      
      <!-- Particle Background -->
      <app-three-particle-background 
        [scrollState]="scrollState"
        class="absolute inset-0">
      </app-three-particle-background>

      <!-- Background Element for animations -->
      <div #heroBg class="absolute inset-0 -z-10"></div>

      <!-- Content Container -->
      <div class="h-full w-full flex flex-col items-center justify-center text-center px-6 relative z-10">
        
        <!-- Main Title -->
        <h1 
          id="hero-title" 
          class="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter font-heading text-athenity-text-title"
          [attr.data-testid]="'hero-title'">
          {{ titlePrefix }}
          <span class="text-athenity-gold">{{ titleHighlight }}</span>{{ titleSuffix }}
        </h1>

        <!-- Subtitle -->
        <p 
          id="hero-subtitle" 
          class="mt-6 text-lg md:text-xl max-w-2xl text-athenity-text-body leading-relaxed"
          [attr.data-testid]="'hero-subtitle'">
          {{ subtitle }}
        </p>

        <!-- Call to Action -->
        <div id="hero-cta" class="mt-10" [attr.data-testid]="'hero-cta'">
          <app-cta-button
            [label]="ctaLabel"
            [href]="ctaHref"
            variant="primary"
            size="lg"
            [testId]="'hero-cta-button'"
            (click)="onCtaClick($event)">
          </app-cta-button>
        </div>

        <!-- Scroll Hint -->
        <app-scroll-hint
          [text]="scrollHintText"
          position="bottom"
          alignment="center"
          [showArrow]="showScrollArrow"
          [animate]="scrollHintAnimation"
          [testId]="'hero-scroll-hint'">
        </app-scroll-hint>
      </div>
    </section>
  `,
  styles: [`
    #hero {
      background: linear-gradient(135deg, var(--athenity-blue-deep) 0%, var(--athenity-blue-card) 100%);
    }
    
    #hero-title {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease;
    }
    
    #hero-title.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    #hero-subtitle {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.8s ease 0.2s;
    }
    
    #hero-subtitle.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    #hero-cta {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.8s ease 0.4s;
    }
    
    #hero-cta.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class HeroSectionComponent implements AfterViewInit {
  // Configuration variables (customizable)
  @Input() titlePrefix: string = 'Nós Desenvolvemos ';
  @Input() titleHighlight: string = 'Momentos';
  @Input() titleSuffix: string = '.';
  @Input() subtitle: string = 'Não criamos sites. Criamos experiências onde o seu cliente é o protagonista.';
  @Input() ctaLabel: string = 'Explore Nosso Trabalho';
  @Input() ctaHref: string = '#servicos';
  @Input() scrollHintText: string = 'Scroll';
  @Input() showScrollArrow: boolean = false;
  @Input() scrollHintAnimation: 'none' | 'fade-in' | 'pulse' = 'fade-in';
  @Input() scrollState: ScrollState | null = null;
  @Input() testId: string = 'hero-section';

  // Outputs
  @Output() ctaClicked = new EventEmitter<Event>();
  @Output() sectionReady = new EventEmitter<ElementRef>();

  // ViewChild references
  @ViewChild('heroBg', { static: true }) heroBg!: ElementRef<HTMLDivElement>;

  // Constants
  readonly SECTION_ID = SECTION_IDS.HERO;

  ngAfterViewInit(): void {
    // Emit section ready for parent to setup animations
    this.sectionReady.emit(this.heroBg);
  }

  /**
   * Handle CTA button click
   */
  onCtaClick(event: Event): void {
    this.ctaClicked.emit(event);
  }

  /**
   * Show hero content with animation
   */
  showContent(): void {
    if (typeof document === 'undefined') return;

    const title = document.getElementById('hero-title');
    const subtitle = document.getElementById('hero-subtitle');
    const cta = document.getElementById('hero-cta');

    // Add visible classes for CSS animations
    setTimeout(() => title?.classList.add('visible'), 100);
    setTimeout(() => subtitle?.classList.add('visible'), 200);
    setTimeout(() => cta?.classList.add('visible'), 300);
  }

  /**
   * Hide hero content
   */
  hideContent(): void {
    if (typeof document === 'undefined') return;

    const title = document.getElementById('hero-title');
    const subtitle = document.getElementById('hero-subtitle');
    const cta = document.getElementById('hero-cta');

    title?.classList.remove('visible');
    subtitle?.classList.remove('visible');
    cta?.classList.remove('visible');
  }
}