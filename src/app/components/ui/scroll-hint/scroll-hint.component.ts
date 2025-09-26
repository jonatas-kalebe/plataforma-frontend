/**
 * Scroll Hint Component
 * Small reusable component for scroll indicators
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-hint',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="scroll-hint text-xs uppercase tracking-widest text-athenity-text-body"
      [class]="customClass"
      [ngClass]="getHintClasses()"
      [attr.data-testid]="testId">
      
      <!-- Text content -->
      <span class="hint-text">{{ text }}</span>
      
      <!-- Optional icon -->
      <i *ngIf="icon" [class]="icon" class="ml-2"></i>
      
      <!-- Optional animated arrow -->
      <div *ngIf="showArrow" class="scroll-arrow mt-2 flex justify-center">
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="currentColor"
          class="animate-bounce">
          <path d="M8 12l-4-4h2.5V4h3v4H12l-4 4z"/>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .scroll-hint {
      opacity: var(--hint-opacity, 0.7);
      transition: opacity 0.3s ease;
    }
    
    .scroll-hint:hover {
      opacity: 1;
    }
    
    .scroll-hint.fade-in {
      animation: fadeIn 0.6s ease forwards;
    }
    
    .scroll-hint.pulse {
      animation: pulse 2s infinite;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: var(--hint-opacity, 0.7); transform: translateY(0); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: var(--hint-opacity, 0.7); }
      50% { opacity: 0.3; }
    }
    
    .scroll-arrow svg {
      animation-duration: var(--bounce-duration, 2s);
    }
  `]
})
export class ScrollHintComponent {
  // Configuration variables (customizable)
  @Input() text: string = 'Scroll';
  @Input() position: 'bottom' | 'top' | 'center' = 'bottom';
  @Input() alignment: 'left' | 'center' | 'right' = 'center';
  @Input() showArrow: boolean = false;
  @Input() icon?: string;
  @Input() opacity: number = 0.7;
  @Input() animate: 'none' | 'fade-in' | 'pulse' = 'none';
  @Input() customClass: string = '';
  @Input() testId: string = 'scroll-hint';

  constructor() {
    // Set CSS custom properties for customization
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--hint-opacity', this.opacity.toString());
      document.documentElement.style.setProperty('--bounce-duration', '2s');
    }
  }

  /**
   * Get hint classes based on configuration
   */
  getHintClasses(): string {
    const classes: string[] = [];
    
    // Position classes
    switch (this.position) {
      case 'top':
        classes.push('absolute top-6');
        break;
      case 'center':
        classes.push('absolute top-1/2 -translate-y-1/2');
        break;
      case 'bottom':
      default:
        classes.push('absolute bottom-6');
        break;
    }
    
    // Alignment classes
    switch (this.alignment) {
      case 'left':
        classes.push('left-6');
        break;
      case 'right':
        classes.push('right-6');
        break;
      case 'center':
      default:
        classes.push('left-1/2 -translate-x-1/2');
        break;
    }
    
    // Animation classes
    if (this.animate !== 'none') {
      classes.push(this.animate);
    }
    
    return classes.join(' ');
  }

  /**
   * Update opacity dynamically
   */
  setOpacity(opacity: number): void {
    this.opacity = opacity;
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--hint-opacity', opacity.toString());
    }
  }
}