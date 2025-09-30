/**
 * Serviços Section Component
 * Dedicated component for the services grid section
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceItem } from '../../../shared/types/common.types';
import { SECTION_IDS } from '../../../shared/constants/section.constants';
import { ServicosAnimationService } from '../../../services/animation/servicos-animation.service';

@Component({
  selector: 'app-servicos-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './servicos-section.component.html',
  styleUrls: ['./servicos-section.component.css']
})
export class ServicosSectionComponent implements AfterViewInit, OnDestroy {
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
  @Output() sectionReady = new EventEmitter<ElementRef>();

  // ViewChild references
  @ViewChild('sectionElement') sectionElement!: ElementRef;

  // Constants
  readonly SECTION_ID = SECTION_IDS.SERVICOS;

  constructor(private servicosAnimation: ServicosAnimationService) {}

  ngAfterViewInit(): void {
    this.sectionReady.emit(this.sectionElement);
    
    // Initialize animations after view is ready
    setTimeout(() => {
      this.initializeAnimations();
    }, 100); // Small delay to ensure DOM is fully rendered
  }

  ngOnDestroy(): void {
    // Clean up all animations
    this.servicosAnimation.destroy();
  }

  /**
   * Initialize all animations for the services section
   */
  private initializeAnimations(): void {
    const cards = this.sectionElement.nativeElement.querySelectorAll('.service-card');
    
    if (cards.length > 0) {
      // Create staggered entrance animation
      if (this.staggerAnimation) {
        this.servicosAnimation.createStaggeredEntrance(cards);
      }

      // Create subtle parallax effect
      this.servicosAnimation.createParallaxEffect(cards);

      // Create magnetic hover effects
      if (this.enableCardHover) {
        this.servicosAnimation.createMagneticHover(cards);
      }

      // Create section snapping behavior
      this.servicosAnimation.createSectionSnapping();
    }
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
        classes.push('surface-deep');
        break;
      case 'gradient':
        classes.push('surface-highlight');
        break;
      default:
        classes.push('surface-minimal');
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

  showContent(): void {}
  hideContent(): void {}


}
