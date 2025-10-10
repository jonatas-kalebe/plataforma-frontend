/**
 * Native Section Animations Class
 * Replaces GSAP-based section animations with native Web APIs
 */

import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NativeAnimation, NativeAnimationConfig } from './native-animation.class';
import { NativeScrollAnimationService } from '../../services/animation/native-scroll-animation.service';

export interface SectionElements {
  title?: string;
  content?: string;
  cta?: string;
}

export interface ScrollAnimationTrigger {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Native implementation of section animations without GSAP
 */
export class NativeSectionAnimations {
  private nativeAnimation: NativeAnimation;
  private scrollAnimationService: NativeScrollAnimationService;
  private prefersReducedMotion: boolean;
  private animatedElements = new Set<Element>();
  private isBrowser: boolean;

  constructor(private platformId?: Object) {
    this.isBrowser = platformId ? isPlatformBrowser(platformId) : typeof window !== 'undefined';
    this.nativeAnimation = new NativeAnimation();
    this.scrollAnimationService = new NativeScrollAnimationService();
    this.prefersReducedMotion = this.checkReducedMotion();
  }

  /**
   * Check if user prefers reduced motion
   */
  private checkReducedMotion(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  /**
   * Animate section entry with title, content and CTA
   */
  public animateSectionEntry(sectionId: string, elements: SectionElements): void {
    if (!this.isBrowser) return;
    
    const sectionElement = document.getElementById(sectionId);
    if (!sectionElement) return;

    // Set initial state for all elements
    const elementsToAnimate: string[] = [];
    if (elements.title) elementsToAnimate.push(elements.title);
    if (elements.content) elementsToAnimate.push(elements.content);
    if (elements.cta) elementsToAnimate.push(elements.cta);

    elementsToAnimate.forEach(selector => {
      this.nativeAnimation.set(selector, {
        opacity: 0,
        y: this.prefersReducedMotion ? 0 : 40
      });
    });

    // Create intersection observer for the section
    this.createSectionObserver(sectionElement, elements);
  }

  /**
   * Create intersection observer for section animations
   */
  private createSectionObserver(sectionElement: Element, elements: SectionElements): void {
    if (!this.isBrowser || typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            this.animatedElements.add(entry.target);
            this.animateElementsSequentially(elements);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -20% 0px' // Equivalent to 'top 80%' start
      }
    );

    observer.observe(sectionElement);
  }

  /**
   * Animate elements sequentially with proper timing
   */
  private async animateElementsSequentially(elements: SectionElements): Promise<void> {
    const baseConfig: NativeAnimationConfig = {
      opacity: 1,
      y: 0,
      duration: this.prefersReducedMotion ? 0.3 : 0.8,
      easing: this.prefersReducedMotion ? 'ease' : 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    };

    // Animate title first
    if (elements.title) {
      await this.nativeAnimation.animateTo(elements.title, {
        ...baseConfig,
        duration: this.prefersReducedMotion ? 0.3 : 1.0
      });
    }

    // Animate content with slight overlap
    if (elements.content) {
      const contentPromise = this.nativeAnimation.animateTo(elements.content, baseConfig);
      
      // Start CTA animation slightly before content finishes
      if (elements.cta) {
        setTimeout(() => {
          this.nativeAnimation.animateTo(elements.cta!, {
            ...baseConfig,
            duration: this.prefersReducedMotion ? 0.3 : 0.6
          });
        }, this.prefersReducedMotion ? 100 : 400);
      }
      
      await contentPromise;
    } else if (elements.cta) {
      // If no content, animate CTA directly
      await this.nativeAnimation.animateTo(elements.cta, {
        ...baseConfig,
        duration: this.prefersReducedMotion ? 0.3 : 0.6
      });
    }
  }

  /**
   * Animate scroll-triggered elements (like service cards)
   */
  public animateScrollTriggeredElements(config: {
    selector: string;
    trigger: string | Element;
    animationConfig?: NativeAnimationConfig;
    scrollConfig?: ScrollAnimationTrigger;
  }): void {
    if (!this.isBrowser) return;
    
    const elements = document.querySelectorAll(config.selector);
    if (elements.length === 0) return;

    const triggerElement = typeof config.trigger === 'string' ? 
      document.querySelector(config.trigger) : config.trigger;
    
    if (!triggerElement) return;
    if (typeof IntersectionObserver === 'undefined') return;

    // Set initial state
    this.nativeAnimation.set(config.selector, {
      opacity: 0,
      y: config.animationConfig?.y || 40
    });

    // Create observer for trigger element
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            this.animatedElements.add(entry.target);
            
            // Animate all elements with stagger
            elements.forEach((element, index) => {
              setTimeout(() => {
                this.nativeAnimation.animateTo(element, {
                  opacity: 1,
                  y: 0,
                  duration: this.prefersReducedMotion ? 0.3 : (config.animationConfig?.duration || 0.8),
                  easing: config.animationConfig?.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)'
                });
              }, this.prefersReducedMotion ? 0 : index * 100);
            });
          }
        });
      },
      {
        threshold: config.scrollConfig?.threshold || 0.1,
        rootMargin: config.scrollConfig?.rootMargin || '0px 0px -15% 0px'
      }
    );

    observer.observe(triggerElement);
  }

  /**
   * Setup hover animations using CSS transitions
   */
  public setupHoverAnimations(selector: string): void {
    if (!this.isBrowser) return;
    if (this.prefersReducedMotion) return;

    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      
      // Add hover animation classes
      htmlElement.classList.add('hover-lift');
      
      // Additional GPU acceleration
      htmlElement.classList.add('animate-gpu');
    });
  }

  /**
   * Setup service card animations specifically
   */
  public setupServiceCardAnimations(): void {
    if (!this.isBrowser) return;
    if (typeof IntersectionObserver === 'undefined') return;
    
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach((card, index) => {
      // Set initial state
      this.nativeAnimation.set(card, {
        opacity: 0,
        y: 40
      });

      // Add hover effects
      if (!this.prefersReducedMotion) {
        const htmlCard = card as HTMLElement;
        htmlCard.classList.add('hover-lift', 'animate-gpu');
      }

      // Create individual observer for each card
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
              this.animatedElements.add(entry.target);
              
              // Animate with stagger delay
              setTimeout(() => {
                this.nativeAnimation.animateTo(entry.target, {
                  opacity: 1,
                  y: 0,
                  duration: this.prefersReducedMotion ? 0.3 : 0.8,
                  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
                });
              }, this.prefersReducedMotion ? 0 : index * 150);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -15% 0px'
        }
      );

      observer.observe(card);
    });
  }

  /**
   * Cleanup all animations and observers
   */
  public destroy(): void {
    this.nativeAnimation.destroy();
    this.scrollAnimationService.destroy();
    this.animatedElements.clear();
  }
}