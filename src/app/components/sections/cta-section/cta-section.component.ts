/**
 * CTA Section Component
 * Dedicated component for the call-to-action section
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CtaButtonComponent } from '../../ui';
import { CallToAction, ButtonVariant, Size } from '../../../shared/types';
import { SECTION_IDS } from '../../../shared/constants';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule, CtaButtonComponent],
  templateUrl: './cta-section.component.html',
  styleUrls: ['./cta-section.component.css']
})
export class CtaSectionComponent {
  // Configuration variables (customizable)
  @Input() title: string = 'Vamos Construir o Futuro';
  @Input() subtitle?: string;
  @Input() primaryCta: CallToAction = {
    label: 'Fale Conosco',
    href: 'mailto:athenity@gmail.com',
    variant: 'primary',
    size: 'lg'
  };
  @Input() secondaryCta?: CallToAction;
  @Input() buttonLayout: 'stacked' | 'inline' | 'responsive' = 'responsive';
  @Input() primaryButtonClass: string = '';
  @Input() secondaryButtonClass: string = '';
  @Input() backgroundColor: 'default' | 'deep' | 'gradient' = 'default';
  @Input() showAdditionalContent: boolean = false;
  @Input() showFooterContent: boolean = false;
  @Input() testId: string = 'cta-section';

  // Outputs
  @Output() primaryCtaClicked = new EventEmitter<Event>();
  @Output() secondaryCtaClicked = new EventEmitter<Event>();
  @Output() sectionReady = new EventEmitter<void>();

  // Constants
  readonly SECTION_ID = SECTION_IDS.CTA;

  /**
   * Handle primary CTA click
   */
  onPrimaryCtaClick(event: Event): void {
    this.primaryCtaClicked.emit(event);
    
    // Execute callback if provided
    if (this.primaryCta.onClick) {
      this.primaryCta.onClick();
    }
  }

  /**
   * Handle secondary CTA click
   */
  onSecondaryCtaClick(event: Event): void {
    this.secondaryCtaClicked.emit(event);
    
    // Execute callback if provided
    if (this.secondaryCta?.onClick) {
      this.secondaryCta.onClick();
    }
  }

  /**
   * Get section classes based on configuration
   */
  getSectionClasses(): string {
    const classes: string[] = [];
    
    // Background classes
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
    
    // Button layout classes
    switch (this.buttonLayout) {
      case 'stacked':
        classes.push('buttons-stacked');
        break;
      case 'inline':
        classes.push('buttons-inline');
        break;
      default:
        // Responsive layout (default)
        break;
    }
    
    return classes.join(' ');
  }

  /**
   * Show section content with animation
   */
  showContent(): void {
    if (typeof document === 'undefined') return;

    const title = document.querySelector('.cta-title');
    const subtitle = document.querySelector('.cta-subtitle');
    const buttons = document.querySelector('.cta-buttons');

    // Show elements with stagger
    setTimeout(() => title?.classList.add('visible'), 100);
    
    if (subtitle) {
      setTimeout(() => subtitle.classList.add('visible'), 200);
    }
    
    setTimeout(() => buttons?.classList.add('visible'), 300);
  }

  /**
   * Hide section content
   */
  hideContent(): void {
    if (typeof document === 'undefined') return;

    const title = document.querySelector('.cta-title');
    const subtitle = document.querySelector('.cta-subtitle');
    const buttons = document.querySelector('.cta-buttons');

    title?.classList.remove('visible');
    subtitle?.classList.remove('visible');
    buttons?.classList.remove('visible');
  }

  /**
   * Update primary CTA dynamically
   */
  updatePrimaryCta(cta: Partial<CallToAction>): void {
    this.primaryCta = { ...this.primaryCta, ...cta };
  }

  /**
   * Update secondary CTA dynamically
   */
  updateSecondaryCta(cta: CallToAction | undefined): void {
    this.secondaryCta = cta;
  }
}