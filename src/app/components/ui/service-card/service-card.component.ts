/**
 * Service Card Component
 * Reusable card component for displaying services
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceItem } from '../../../shared/types';
import { ANIMATION_DURATIONS } from '../../../shared/constants';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="service-card bg-athenity-blue-card p-8 rounded-2xl transition-transform border border-transparent"
      [class]="customClass"
      [ngClass]="getCardClasses()"
      [attr.data-testid]="testId">
      
      <h4 class="text-2xl text-athenity-green-circuit font-heading font-bold">
        {{ service.title }}
      </h4>
      
      <p class="mt-4 text-athenity-text-body leading-relaxed">
        {{ service.description }}
      </p>
      
      <!-- Optional icon slot -->
      <div *ngIf="service.icon" class="mt-6">
        <i [class]="service.icon" class="text-3xl text-athenity-green-circuit"></i>
      </div>
    </div>
  `,
  styles: [`
    .service-card {
      transition-duration: var(--hover-duration, 0.3s);
      transition-timing-function: ease;
    }
    
    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
      border-color: rgba(100, 255, 218, 0.6);
    }
    
    .service-card:hover h4 {
      color: #64FFDA;
    }
  `]
})
export class ServiceCardComponent {
  // Configuration variables (customizable)
  @Input() service!: ServiceItem;
  @Input() customClass: string = '';
  @Input() hoverEnabled: boolean = true;
  @Input() testId: string = 'service-card';
  @Input() animationDelay: number = 0;

  // Animation configuration
  private readonly HOVER_DURATION = ANIMATION_DURATIONS.SERVICE_CARD_HOVER;

  constructor() {
    // Set CSS custom property for hover duration
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--hover-duration', `${this.HOVER_DURATION}s`);
    }
  }

  /**
   * Get dynamic card classes based on configuration
   */
  getCardClasses(): string {
    const classes: string[] = [];
    
    if (this.hoverEnabled) {
      classes.push('hover:-translate-y-2', 'hover:shadow-glow', 'hover:border-athenity-green-circuit/60');
    }
    
    return classes.join(' ');
  }
}