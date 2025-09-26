/**
 * Serviços Section Component
 * Dedicated component for the services grid section
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ServiceCardComponent } from '../../ui';
import { ServiceItem } from '../../../shared/types';
import { SECTION_IDS } from '../../../shared/constants';

@Component({
  selector: 'app-servicos-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, ServiceCardComponent],
  template: `
    <section 
      id="servicos" 
      class="w-full h-screen flex items-center px-6"
      [ngClass]="getSectionClasses()"
      [attr.data-testid]="testId">
      
      <div class="max-w-7xl mx-auto w-full">
        
        <!-- Section Header -->
        <app-section-header
          [title]="sectionTitle"
          [subtitle]="sectionSubtitle"
          [size]="headerSize"
          [alignment]="headerAlignment"
          [showDivider]="showHeaderDivider"
          [testId]="'servicos-header'">
        </app-section-header>

        <!-- Services Grid -->
        <div class="servicos-grid grid gap-8" [ngClass]="getGridClasses()">
          <app-service-card
            *ngFor="let service of services; let i = index; trackBy: trackByService"
            [service]="service"
            [customClass]="getCardClass(i)"
            [hoverEnabled]="enableCardHover"
            [animationDelay]="getCardAnimationDelay(i)"
            [testId]="'service-card-' + i"
            (click)="onServiceClick(service, i, $event)">
          </app-service-card>
        </div>

        <!-- Optional additional content -->
        <div *ngIf="showAdditionalContent" class="mt-12 text-center">
          <ng-content select="[slot=additional-content]"></ng-content>
        </div>
      </div>
    </section>
  `,
  styles: [`
    #servicos {
      background: linear-gradient(135deg, var(--athenity-blue-deep) 0%, rgba(17, 34, 64, 0.95) 100%);
    }
    
    .servicos-grid {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease;
    }
    
    .servicos-grid.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .service-card {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s ease;
    }
    
    .service-card.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Grid responsive variations */
    .grid-compact {
      gap: 1rem;
    }
    
    .grid-spacious {
      gap: 2rem;
    }
  `]
})
export class ServicosSectionComponent {
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