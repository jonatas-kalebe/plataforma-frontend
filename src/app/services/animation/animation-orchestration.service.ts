/**
 * AnimationOrchestrationService
 * 
 * Centralized service for managing all GSAP animations, plugins, and configurations.
 * This service ensures that all GSAP plugins (ScrollTrigger, Draggable, InertiaPlugin)
 * are registered only once and only in browser environments (SSR-safe).
 * 
 * @example
 * ```typescript
 * // In your component
 * constructor(private animOrchestration: AnimationOrchestrationService) {
 *   this.animOrchestration.setupHeroParallax('.hero-section');
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Global scroll snap setup
 * ngOnInit() {
 *   this.animOrchestration.setupGlobalScrollSnap();
 * }
 * ```
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';

@Injectable({
  providedIn: 'root'
})
export class AnimationOrchestrationService {
  private readonly platformId = inject(PLATFORM_ID);
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize GSAP and register all plugins
   * 
   * This method is called automatically when the service is instantiated.
   * It ensures that all GSAP plugins are registered only once and only in browser environments.
   * This prevents SSR errors and ensures optimal performance.
   * 
   * @private
   */
  private initialize(): void {
    // Only initialize in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Prevent double initialization
    if (this.isInitialized) {
      return;
    }

    try {
      // Register GSAP plugins
      gsap.registerPlugin(ScrollTrigger, Draggable);
      
      // Note: InertiaPlugin is a premium GSAP plugin that requires a license
      // Uncomment the following line if you have a GSAP Club membership:
      // gsap.registerPlugin(InertiaPlugin);

      // Expose GSAP globally for compatibility (optional)
      if (typeof window !== 'undefined') {
        (window as any).gsap = gsap;
        (window as any).ScrollTrigger = ScrollTrigger;
        (window as any).Draggable = Draggable;
      }

      // Set global GSAP defaults
      gsap.defaults({
        ease: 'power2.out',
        duration: 0.6
      });

      this.isInitialized = true;

      console.log('[AnimationOrchestrationService] GSAP plugins initialized successfully');
    } catch (error) {
      console.error('[AnimationOrchestrationService] Failed to initialize GSAP:', error);
    }
  }

  /**
   * Setup hero parallax effect
   * 
   * Creates a parallax scrolling effect for hero sections using ScrollTrigger.
   * Elements with different data attributes will scroll at different speeds,
   * creating a depth effect.
   * 
   * @param selector - CSS selector for the hero section container
   * 
   * @example
   * ```typescript
   * // In your component
   * ngAfterViewInit() {
   *   this.animOrchestration.setupHeroParallax('.hero-section');
   * }
   * ```
   * 
   * @example
   * ```html
   * <!-- In your template -->
   * <div class="hero-section">
   *   <div data-speed="0.5">Slow layer</div>
   *   <div data-speed="1.5">Fast layer</div>
   * </div>
   * ```
   */
  setupHeroParallax(selector: string): void {
    if (!this.isReady) {
      console.warn('[AnimationOrchestrationService] Not initialized or not in browser');
      return;
    }

    console.log(`[AnimationOrchestrationService] Setting up hero parallax for: ${selector}`);
    
    // Placeholder implementation
    // TODO: Implement hero parallax logic
    // Example:
    // const elements = document.querySelectorAll(`${selector} [data-speed]`);
    // elements.forEach(el => {
    //   const speed = parseFloat(el.getAttribute('data-speed') || '1');
    //   gsap.to(el, {
    //     y: (i, target) => -ScrollTrigger.maxScroll(window) * target.dataset.speed,
    //     ease: 'none',
    //     scrollTrigger: {
    //       start: 0,
    //       end: 'max',
    //       invalidateOnRefresh: true,
    //       scrub: 0
    //     }
    //   });
    // });
  }

  /**
   * Setup global scroll snap
   * 
   * Enables smooth scroll snapping between sections using ScrollTrigger.
   * This creates a full-page scroll experience where each section snaps into place.
   * 
   * @example
   * ```typescript
   * // In your app component or layout
   * ngOnInit() {
   *   this.animOrchestration.setupGlobalScrollSnap();
   * }
   * ```
   * 
   * @example
   * ```html
   * <!-- In your template -->
   * <section class="snap-section">Section 1</section>
   * <section class="snap-section">Section 2</section>
   * <section class="snap-section">Section 3</section>
   * ```
   */
  setupGlobalScrollSnap(): void {
    if (!this.isReady) {
      console.warn('[AnimationOrchestrationService] Not initialized or not in browser');
      return;
    }

    console.log('[AnimationOrchestrationService] Setting up global scroll snap');
    
    // Placeholder implementation
    // TODO: Implement scroll snap logic
    // Example:
    // const sections = gsap.utils.toArray('.snap-section');
    // gsap.to(sections, {
    //   xPercent: -100 * (sections.length - 1),
    //   ease: 'none',
    //   scrollTrigger: {
    //     trigger: '.container',
    //     pin: true,
    //     scrub: 1,
    //     snap: 1 / (sections.length - 1),
    //     end: () => '+=' + document.querySelector('.container').offsetWidth
    //   }
    // });
  }

  /**
   * Check if service is ready to use
   * 
   * @returns true if initialized and running in browser
   */
  get isReady(): boolean {
    return this.isInitialized && isPlatformBrowser(this.platformId);
  }

  /**
   * Get the GSAP instance
   * 
   * @returns GSAP library instance
   */
  get gsap(): typeof gsap {
    return gsap;
  }

  /**
   * Get the ScrollTrigger instance
   * 
   * @returns ScrollTrigger plugin instance
   */
  get scrollTrigger(): typeof ScrollTrigger {
    return ScrollTrigger;
  }

  /**
   * Get the Draggable instance
   * 
   * @returns Draggable plugin instance
   */
  get draggable(): typeof Draggable {
    return Draggable;
  }

  /**
   * Refresh all ScrollTrigger instances
   * 
   * Call this after DOM changes or layout shifts to recalculate positions.
   * 
   * @example
   * ```typescript
   * // After adding/removing elements
   * this.animOrchestration.refreshScrollTriggers();
   * ```
   */
  refreshScrollTriggers(): void {
    if (!this.isReady) {
      return;
    }

    ScrollTrigger.refresh();
  }

  /**
   * Kill all active animations
   * 
   * Stops and removes all GSAP animations and ScrollTrigger instances.
   * Useful for cleanup on component destroy.
   * 
   * @example
   * ```typescript
   * ngOnDestroy() {
   *   this.animOrchestration.killAllAnimations();
   * }
   * ```
   */
  killAllAnimations(): void {
    if (!this.isReady) {
      return;
    }

    gsap.killTweensOf('*');
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
}
