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
  templateUrl: './service-card.component.html',
  styleUrls: ['./service-card.component.css']
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