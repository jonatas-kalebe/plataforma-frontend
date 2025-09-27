/**
 * CTA Section Component
 * Dedicated component for the call-to-action section
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SECTION_IDS } from '../../../shared/constants/section.constants';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-section.component.html',
  styleUrls: ['./cta-section.component.css']
})
export class CtaSectionComponent implements AfterViewInit {
  // Configuration variables (customizable)
  @Input() title: string = 'Vamos Construir o Futuro';
  @Input() subtitle?: string;
  @Input() primaryCta: { label: string; href: string; variant?: string; onClick?: () => void } = {
    label: 'Fale Conosco',
    href: 'mailto:athenity@gmail.com'
  };
  @Input() secondaryCta?: { label: string; href: string };
  @Input() showAdditionalContent: boolean = false;
  @Input() showFooterContent: boolean = false;
  @Input() testId: string = 'cta-section';
  @Input() backgroundColor: 'default' | 'deep' | 'gradient' = 'default';
  @Input() buttonLayout: 'inline' | 'stacked' = 'inline';

  // Outputs
  @Output() primaryCtaClicked = new EventEmitter<Event>();
  @Output() secondaryCtaClicked = new EventEmitter<Event>();
  @Output() sectionReady = new EventEmitter<ElementRef>();

  // ViewChild references
  @ViewChild('sectionElement') sectionElement!: ElementRef;

  // Constants
  readonly SECTION_ID = SECTION_IDS.CTA;

  ngAfterViewInit(): void {
    this.sectionReady.emit(this.sectionElement);
  }

  /**
   * Handle primary CTA click
   */
  onPrimaryCtaClick(event: Event): void {
    if (this.primaryCta.onClick) {
      this.primaryCta.onClick();
    }
    this.primaryCtaClicked.emit(event);
  }

  /**
   * Handle secondary CTA click  
   */
  onSecondaryCtaClick(event: Event): void {
    this.secondaryCtaClicked.emit(event);
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

    if (this.buttonLayout === 'stacked') {
      classes.push('flex-col');
    } else {
      classes.push('flex-row');
    }
    
    return classes.join(' ');
  }

  /**
   * Update primary CTA properties
   */
  updatePrimaryCta(updates: Partial<{ label: string; href: string; variant?: string }>): void {
    this.primaryCta = { ...this.primaryCta, ...updates };
  }

  /**
   * Update secondary CTA properties
   */
  updateSecondaryCta(newSecondaryCta: { label: string; href: string }): void {
    this.secondaryCta = newSecondaryCta;
  }
}