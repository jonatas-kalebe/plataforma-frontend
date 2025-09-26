/**
 * CTA Section Component
 * Dedicated component for the call-to-action section
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, CtaButtonComponent } from '../../ui';
import { CallToAction, ButtonVariant, Size } from '../../../shared/types';
import { SECTION_IDS } from '../../../shared/constants';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, CtaButtonComponent],
  template: `
    <section 
      id="cta" 
      class="w-full h-screen flex items-center px-6"
      [ngClass]="getSectionClasses()"
      [attr.data-testid]="testId">
      
      <div class="max-w-4xl mx-auto text-center w-full">
        
        <!-- Main CTA Title -->
        <h2 
          class="text-4xl md:text-5xl font-extrabold text-athenity-text-title font-heading cta-title"
          [attr.data-testid]="'cta-title'">
          {{ title }}
        </h2>

        <!-- Optional Subtitle -->
        <p *ngIf="subtitle" 
           class="mt-6 text-lg md:text-xl text-athenity-text-body leading-relaxed cta-subtitle"
           [attr.data-testid]="'cta-subtitle'">
          {{ subtitle }}
        </p>

        <!-- CTA Buttons Container -->
        <div class="cta-buttons mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
             [attr.data-testid]="'cta-buttons'">
          
          <!-- Primary CTA Button -->
          <app-cta-button
            [label]="primaryCta.label"
            [href]="primaryCta.href"
            [variant]="primaryCta.variant || 'primary'"
            [size]="primaryCta.size || 'lg'"
            [customClass]="primaryButtonClass"
            [testId]="'primary-cta-button'"
            (click)="onPrimaryCtaClick($event)">
          </app-cta-button>

          <!-- Secondary CTA Button (optional) -->
          <app-cta-button
            *ngIf="secondaryCta"
            [label]="secondaryCta.label"
            [href]="secondaryCta.href"
            [variant]="secondaryCta.variant || 'secondary'"
            [size]="secondaryCta.size || 'lg'"
            [customClass]="secondaryButtonClass"
            [testId]="'secondary-cta-button'"
            (click)="onSecondaryCtaClick($event)">
          </app-cta-button>
        </div>

        <!-- Optional Additional Content -->
        <div *ngIf="showAdditionalContent" class="mt-12">
          <ng-content select="[slot=additional-content]"></ng-content>
        </div>

        <!-- Optional Footer Content -->
        <div *ngIf="showFooterContent" class="mt-16 pt-8 border-t border-athenity-text-body/20">
          <ng-content select="[slot=footer-content]"></ng-content>
        </div>
      </div>
    </section>
  `,
  styles: [`
    #cta {
      background: linear-gradient(135deg, var(--athenity-blue-deep) 0%, rgba(10, 25, 47, 0.95) 100%);
    }
    
    .cta-title {
      opacity: 0;
      transform: translateY(30px);
      transition: all 0.8s ease;
    }
    
    .cta-title.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .cta-subtitle {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.8s ease 0.2s;
    }
    
    .cta-subtitle.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .cta-buttons {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.8s ease 0.4s;
    }
    
    .cta-buttons.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    /* Button layout variations */
    .buttons-stacked .cta-buttons {
      flex-direction: column;
    }
    
    .buttons-inline .cta-buttons {
      flex-direction: row;
    }
    
    @media (max-width: 640px) {
      .cta-buttons {
        flex-direction: column !important;
      }
    }
  `]
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