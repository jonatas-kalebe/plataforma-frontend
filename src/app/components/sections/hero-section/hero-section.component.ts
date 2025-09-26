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
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
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