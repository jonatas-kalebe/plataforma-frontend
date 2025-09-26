/**
 * Section Header Component
 * Reusable header component for section titles
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Size } from '../../../shared/types';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="section-header text-center"
      [class]="customClass"
      [attr.data-testid]="testId">
      
      <h3 
        class="font-heading font-extrabold text-athenity-text-title"
        [ngClass]="getTitleClasses()">
        {{ title }}
      </h3>
      
      <p *ngIf="subtitle" 
         class="mt-4 text-athenity-text-body leading-relaxed"
         [ngClass]="getSubtitleClasses()">
        {{ subtitle }}
      </p>
      
      <!-- Optional divider -->
      <div *ngIf="showDivider" 
           class="mt-6 mx-auto h-0.5 bg-gradient-to-r from-transparent via-athenity-green-circuit to-transparent"
           [style.width]="dividerWidth">
      </div>
    </div>
  `,
  styles: [`
    .section-header {
      margin-bottom: var(--header-margin, 3.5rem);
    }
    
    .title-animation {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s ease;
    }
    
    .title-animation.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class SectionHeaderComponent {
  // Configuration variables (customizable)
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() size: Size = 'lg';
  @Input() alignment: 'left' | 'center' | 'right' = 'center';
  @Input() showDivider: boolean = false;
  @Input() dividerWidth: string = '100px';
  @Input() customClass: string = '';
  @Input() testId: string = 'section-header';
  @Input() enableAnimation: boolean = true;

  /**
   * Get title classes based on size and alignment
   */
  getTitleClasses(): string {
    const classes: string[] = [];
    
    // Size classes
    switch (this.size) {
      case 'xs':
        classes.push('text-xl');
        break;
      case 'sm':
        classes.push('text-2xl');
        break;
      case 'md':
        classes.push('text-3xl');
        break;
      case 'lg':
        classes.push('text-3xl md:text-4xl');
        break;
      case 'xl':
        classes.push('text-4xl md:text-5xl');
        break;
      case 'xxl':
        classes.push('text-5xl md:text-6xl lg:text-7xl');
        break;
    }
    
    // Alignment classes
    switch (this.alignment) {
      case 'left':
        classes.push('text-left');
        break;
      case 'right':
        classes.push('text-right');
        break;
      case 'center':
      default:
        classes.push('text-center');
        break;
    }
    
    // Animation class
    if (this.enableAnimation) {
      classes.push('title-animation');
    }
    
    return classes.join(' ');
  }

  /**
   * Get subtitle classes based on size and alignment
   */
  getSubtitleClasses(): string {
    const classes: string[] = [];
    
    // Size-based subtitle classes
    switch (this.size) {
      case 'xs':
      case 'sm':
        classes.push('text-sm');
        break;
      case 'md':
        classes.push('text-base');
        break;
      case 'lg':
        classes.push('text-lg');
        break;
      case 'xl':
      case 'xxl':
        classes.push('text-xl');
        break;
    }
    
    // Alignment classes
    switch (this.alignment) {
      case 'left':
        classes.push('text-left');
        break;
      case 'right':
        classes.push('text-right');
        break;
      case 'center':
      default:
        classes.push('text-center');
        break;
    }
    
    return classes.join(' ');
  }
}