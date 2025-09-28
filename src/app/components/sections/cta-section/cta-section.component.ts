/**
 * CTA Section Component
 * Dedicated component for the call-to-action section
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SECTION_IDS } from '../../../shared/constants/section.constants';
import gsap from 'gsap';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-section.component.html',
  styleUrls: ['./cta-section.component.css']
})
export class CtaSectionComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

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

  // Animation references
  private pulseAnimation: gsap.core.Tween | null = null;

  ngAfterViewInit(): void {
    this.sectionReady.emit(this.sectionElement);
    
    if (isPlatformBrowser(this.platformId)) {
      this.initializePulseAnimation();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.pulseAnimation) {
      this.pulseAnimation.kill();
    }
  }

  /**
   * Initialize subtle pulse animation for primary CTA button
   */
  private initializePulseAnimation(): void {
    // Skip animations if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const primaryButton = document.querySelector('[data-testid="cta-buttons"] a:first-child');
    if (!primaryButton) return;

    const gsapInstance = (window as any).gsap || gsap;

    // Create a subtle, continuous pulse animation
    this.pulseAnimation = gsapInstance.to(primaryButton, {
      scale: 1.02,
      duration: 2,
      ease: 'power2.inOut',
      yoyo: true,
      repeat: -1,
      transformOrigin: 'center center'
    });

    // Add magnetic hover effect
    primaryButton.addEventListener('mouseenter', () => {
      if (this.pulseAnimation) {
        this.pulseAnimation.pause();
      }
      gsapInstance.to(primaryButton, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    primaryButton.addEventListener('mouseleave', () => {
      gsapInstance.to(primaryButton, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          if (this.pulseAnimation) {
            this.pulseAnimation.resume();
          }
        }
      });
    });
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