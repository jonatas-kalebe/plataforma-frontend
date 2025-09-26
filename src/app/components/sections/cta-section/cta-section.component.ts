/**
 * CTA Section Component
 * Dedicated component for the call-to-action section
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SECTION_IDS } from '../../../shared/constants';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-section.component.html',
  styleUrls: ['./cta-section.component.css']
})
export class CtaSectionComponent {
  // Configuration variables (customizable)
  @Input() title: string = 'Vamos Construir o Futuro';
  @Input() subtitle?: string;
  @Input() primaryCta: { label: string; href: string } = {
    label: 'Fale Conosco',
    href: 'mailto:athenity@gmail.com'
  };
  @Input() secondaryCta?: { label: string; href: string };
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
  }

  /**
   * Handle secondary CTA click  
   */
  onSecondaryCtaClick(event: Event): void {
    this.secondaryCtaClicked.emit(event);
  }
}