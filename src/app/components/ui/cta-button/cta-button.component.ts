/**
 * CTA Button Component
 * Reusable call-to-action button with multiple variants
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonVariant, Size } from '../../../shared/types';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a 
      *ngIf="href && !disabled; else buttonTemplate"
      [href]="href"
      [target]="target"
      [rel]="rel"
      class="cta-button inline-block font-bold transition transform"
      [class]="customClass"
      [ngClass]="getButtonClasses()"
      [attr.data-testid]="testId"
      (click)="handleClick($event)">
      
      <!-- Icon before text -->
      <i *ngIf="iconBefore" [class]="iconBefore" class="icon-before"></i>
      
      <span class="button-text">{{ label }}</span>
      
      <!-- Icon after text -->
      <i *ngIf="iconAfter" [class]="iconAfter" class="icon-after"></i>
    </a>

    <ng-template #buttonTemplate>
      <button
        type="button"
        [disabled]="disabled"
        class="cta-button font-bold transition transform"
        [class]="customClass"
        [ngClass]="getButtonClasses()"
        [attr.data-testid]="testId"
        (click)="handleClick($event)">
        
        <!-- Icon before text -->
        <i *ngIf="iconBefore" [class]="iconBefore" class="icon-before"></i>
        
        <span class="button-text">{{ label }}</span>
        
        <!-- Icon after text -->
        <i *ngIf="iconAfter" [class]="iconAfter" class="icon-after"></i>
      </button>
    </ng-template>
  `,
  styles: [`
    .cta-button {
      cursor: pointer;
      text-decoration: none;
      border: none;
      outline: none;
      user-select: none;
      border-radius: 0.75rem;
      transition: all 0.3s ease;
    }
    
    .cta-button:hover:not(:disabled) {
      opacity: 0.9;
      transform: scale(1.03);
    }
    
    .cta-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .cta-button .icon-before {
      margin-right: 0.5rem;
    }
    
    .cta-button .icon-after {
      margin-left: 0.5rem;
    }
    
    /* Primary variant */
    .cta-primary {
      background-color: #FFD700;
      color: #0A192F;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
    }
    
    /* Secondary variant */
    .cta-secondary {
      background-color: transparent;
      color: #64FFDA;
      border: 2px solid #64FFDA;
    }
    
    /* Ghost variant */
    .cta-ghost {
      background-color: transparent;
      color: #8892B0;
    }
    
    /* Outline variant */
    .cta-outline {
      background-color: transparent;
      color: #CCD6F6;
      border: 1px solid rgba(204, 214, 246, 0.3);
    }
  `]
})
export class CtaButtonComponent {
  // Configuration variables (customizable)
  @Input() label!: string;
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: Size = 'md';
  @Input() href?: string;
  @Input() target: string = '_self';
  @Input() rel?: string;
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() loading: boolean = false;
  @Input() iconBefore?: string;
  @Input() iconAfter?: string;
  @Input() customClass: string = '';
  @Input() testId: string = 'cta-button';

  @Output() click = new EventEmitter<Event>();

  /**
   * Handle button click events
   */
  handleClick(event: Event): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      return;
    }
    
    this.click.emit(event);
  }

  /**
   * Get button classes based on configuration
   */
  getButtonClasses(): string {
    const classes: string[] = [];
    
    // Variant classes
    classes.push(`cta-${this.variant}`);
    
    // Size classes
    switch (this.size) {
      case 'xs':
        classes.push('text-sm px-3 py-1.5');
        break;
      case 'sm':
        classes.push('text-sm px-4 py-2');
        break;
      case 'md':
        classes.push('text-lg px-8 py-4');
        break;
      case 'lg':
        classes.push('text-xl px-10 py-5');
        break;
      case 'xl':
        classes.push('text-2xl px-12 py-6');
        break;
    }
    
    // Width class
    if (this.fullWidth) {
      classes.push('w-full block');
    }
    
    // Loading state
    if (this.loading) {
      classes.push('opacity-75 cursor-wait');
    }
    
    // Hover effects (only if not disabled)
    if (!this.disabled && !this.loading) {
      classes.push('hover:opacity-90 hover:scale-[1.03]');
      
      // Variant-specific hover effects
      if (this.variant === 'primary') {
        classes.push('shadow-glow');
      }
    }
    
    return classes.join(' ');
  }
}