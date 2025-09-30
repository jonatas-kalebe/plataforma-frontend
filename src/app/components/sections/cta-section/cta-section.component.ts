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

    const primaryButton = document.querySelector('[data-testid="cta-buttons"] a:first-child') as HTMLElement;
    const secondaryButton = document.querySelector('[data-testid="cta-buttons"] a:last-child') as HTMLElement;
    
    const gsapInstance = (window as any).gsap || gsap;

    // Enhanced magnetic effects for all buttons
    const buttons = [primaryButton, secondaryButton].filter(Boolean);
    
    buttons.forEach((button, index) => {
      const isPrimary = index === 0;
      
      // Continuous pulse for primary button (even with reduced motion, but simpler)
      if (isPrimary) {
        if (prefersReducedMotion) {
          // Simple opacity pulse for reduced motion
          this.pulseAnimation = gsapInstance.to(button, {
            opacity: 0.9,
            duration: 2,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: -1
          });
        } else {
          // Full scale pulse for normal motion
          this.pulseAnimation = gsapInstance.to(button, {
            scale: 1.02,
            duration: 2,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: -1,
            transformOrigin: 'center center'
          });
        }
      }

      // Enhanced magnetic hover effects
      button.addEventListener('mouseenter', () => {
        if (isPrimary && this.pulseAnimation) {
          this.pulseAnimation.pause();
        }
        
        if (prefersReducedMotion) {
          // Simple hover for reduced motion
          gsapInstance.to(button, {
            scale: 1.03,
            opacity: 0.9,
            duration: 0.3,
            ease: 'power2.out'
          });
        } else {
          // Full magnetic effect with tilt
          gsapInstance.to(button, {
            scale: 1.05,
            y: -3,
            rotateY: 2,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      });

      button.addEventListener('mouseleave', () => {
        gsapInstance.to(button, {
          scale: 1,
          y: 0,
          rotateY: 0,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
          onComplete: () => {
            if (isPrimary && this.pulseAnimation) {
              this.pulseAnimation.resume();
            }
          }
        });
      });

      // Mouse movement for magnetic tracking (only if no reduced motion)
      if (!prefersReducedMotion) {
        button.addEventListener('mousemove', (e: MouseEvent) => {
          const rect = button.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          const deltaX = (e.clientX - centerX) / (rect.width / 2);
          const deltaY = (e.clientY - centerY) / (rect.height / 2);
          
          gsapInstance.to(button, {
            rotateX: deltaY * -3,
            rotateY: deltaX * 3,
            duration: 0.3,
            ease: 'power1.out'
          });
        });
      }

      // Touch effects with haptic feedback
      button.addEventListener('touchstart', () => {
        // Haptic feedback for mobile devices
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        gsapInstance.to(button, {
          scale: prefersReducedMotion ? 1.01 : 1.02,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      button.addEventListener('touchend', () => {
        gsapInstance.to(button, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
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
    switch (this.backgroundColor) {
      case 'deep':
        return 'surface-deep';
      case 'gradient':
        return 'surface-highlight';
      default:
        return 'surface-minimal';
    }
  }

  getButtonLayoutClasses(): string {
    return this.buttonLayout === 'stacked'
      ? 'flex-col sm:flex-col'
      : 'flex-col sm:flex-row';
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