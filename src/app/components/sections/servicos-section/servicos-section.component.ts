/**
 * Serviços Section Component
 * Dedicated component for the services grid section
 */

import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceItem } from '../../../shared/types/common.types';
import { SECTION_IDS } from '../../../shared/constants/section.constants';

@Component({
  selector: 'app-servicos-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './servicos-section.component.html',
  styleUrls: ['./servicos-section.component.css']
})
export class ServicosSectionComponent implements AfterViewInit {
  // Configuration variables (customizable)
  @Input() sectionTitle: string = 'Nosso Arsenal';
  @Input() sectionSubtitle?: string;
  @Input() headerSize: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' = 'lg';
  @Input() headerAlignment: 'left' | 'center' | 'right' = 'center';
  @Input() showHeaderDivider: boolean = false;
  @Input() backgroundColor: 'default' | 'deep' | 'gradient' = 'deep';
  @Input() gridColumns: 'auto' | '1' | '2' | '3' | '4' = 'auto';
  @Input() gridSpacing: 'compact' | 'normal' | 'spacious' = 'normal';
  @Input() enableCardHover: boolean = true;
  @Input() staggerAnimation: boolean = true;
  @Input() animationDelay: number = 0.1;
  @Input() showAdditionalContent: boolean = false;
  @Input() testId: string = 'servicos-section';

  // Services data
  @Input() services: ServiceItem[] = [
    {
      title: 'Aplicações Sob Medida',
      description: 'Soluções web e mobile robustas e elegantes, moldadas pelo contexto do seu cliente.'
    },
    {
      title: 'IA & Machine Learning',
      description: 'Produtos inteligentes, dados acionáveis e automações que liberam valor real.'
    },
    {
      title: 'Arquitetura em Nuvem',
      description: 'Escalabilidade, observabilidade e segurança para crescer sem atrito.'
    }
  ];

  // Outputs
  @Output() serviceClicked = new EventEmitter<{ service: ServiceItem; index: number; event: Event }>();
  @Output() sectionReady = new EventEmitter<void>();

  // Constants
  readonly SECTION_ID = SECTION_IDS.SERVICOS;

  ngAfterViewInit(): void {
    this.sectionReady.emit();
  }

  /**
   * Track by function for services
   */
  trackByService(index: number, service: ServiceItem): string {
    return service.title + index;
  }

  /**
   * Handle service card click
   */
  onServiceClick(service: ServiceItem, index: number, event: Event): void {
    this.serviceClicked.emit({ service, index, event });
  }

  /**
   * Get section classes based on configuration
   */
  getSectionClasses(): string {
    const classes: string[] = [];
    
    switch (this.backgroundColor) {
      case 'deep':
        classes.push('bg-athenity-blue-deep');
        break;
      case 'gradient':
        classes.push('bg-gradient-to-b from-athenity-blue-deep to-athenity-blue-card');
        break;
      default:
        // Use default styling from template
        break;
    }
    
    return classes.join(' ');
  }

  /**
   * Get grid classes based on configuration
   */
  getGridClasses(): string {
    const classes: string[] = [];
    
    // Grid columns
    switch (this.gridColumns) {
      case '1':
        classes.push('grid-cols-1');
        break;
      case '2':
        classes.push('sm:grid-cols-2');
        break;
      case '3':
        classes.push('sm:grid-cols-2 lg:grid-cols-3');
        break;
      case '4':
        classes.push('sm:grid-cols-2 lg:grid-cols-4');
        break;
      case 'auto':
      default:
        classes.push('sm:grid-cols-2 lg:grid-cols-3');
        break;
    }
    
    // Grid spacing
    switch (this.gridSpacing) {
      case 'compact':
        classes.push('gap-4');
        break;
      case 'spacious':
        classes.push('gap-12');
        break;
      default:
        classes.push('gap-8');
        break;
    }
    
    return classes.join(' ');
  }

  /**
   * Get card class for individual service cards
   */
  getCardClass(index: number): string {
    const classes: string[] = ['service-card'];
    
    // Add animation delay class if staggering is enabled
    if (this.staggerAnimation) {
      classes.push(`animation-delay-${index}`);
    }
    
    return classes.join(' ');
  }

  /**
   * Get animation delay for service cards
   */
  getCardAnimationDelay(index: number): number {
    return this.staggerAnimation ? index * this.animationDelay : 0;
  }

  /**
   * Show section content with animation
   */
  showContent(): void {
    if (typeof document === 'undefined') return;

    const grid = document.querySelector('.servicos-grid');
    const cards = document.querySelectorAll('.service-card');

    // Show grid
    setTimeout(() => grid?.classList.add('visible'), 100);

    // Show cards with stagger
    cards.forEach((card, index) => {
      const delay = this.staggerAnimation ? 200 + (index * 100) : 200;
      setTimeout(() => card.classList.add('visible'), delay);
    });
  }

  /**
   * Hide section content
   */
  hideContent(): void {
    if (typeof document === 'undefined') return;

    const grid = document.querySelector('.servicos-grid');
    const cards = document.querySelectorAll('.service-card');

    grid?.classList.remove('visible');
    cards.forEach(card => card.classList.remove('visible'));
  }
}