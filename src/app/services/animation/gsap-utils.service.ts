/**
 * GSAP Utils Service
 * Centralized utilities and helpers for GSAP animations
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { 
  ANIMATION_DURATIONS, 
  ANIMATION_EASING, 
  SCROLL_TRIGGER_CONFIG,
  TIMELINE_CONFIG 
} from '../../shared/constants';
import { MotionPreferenceService } from '../../shared/utils';

export interface GsapConfig {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  repeat?: number;
  yoyo?: boolean;
  immediateRender?: boolean;
  // Animation properties
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  rotation?: number;
  rotationX?: number;
  rotationY?: number;
  boxShadow?: string;
  [key: string]: any;
}

export interface ScrollTriggerOptions {
  trigger: string | HTMLElement;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  toggleActions?: string;
  pin?: boolean | HTMLElement;
  markers?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
  onUpdate?: (self: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class GsapUtilsService {
  private readonly platformId = inject(PLATFORM_ID);
  private isInitialized = false;
  private registeredScrollTriggers: ScrollTrigger[] = [];

  constructor(private motionService: MotionPreferenceService) {
    // GSAP initialization removed - now handled by AnimationOrchestrationService
    // This service now relies on GSAP being initialized globally
    this.checkInitialization();
  }

  /**
   * Check if GSAP has been initialized (by AnimationOrchestrationService)
   */
  private checkInitialization(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check if GSAP is available globally (set by AnimationOrchestrationService)
    if (typeof window !== 'undefined' && (window as any).gsap && (window as any).ScrollTrigger) {
      this.isInitialized = true;
      
      // Set default ease for consistency
      gsap.defaults({ 
        ease: ANIMATION_EASING.EASE_OUT,
        duration: ANIMATION_DURATIONS.SECTION_ENTER
      });
    } else {
      // GSAP not yet initialized - will be checked again when used
      console.warn('GsapUtilsService: GSAP not yet initialized. Ensure AnimationOrchestrationService.initialize() is called first.');
    }
  }

  /**
   * Create a GSAP timeline with default configuration
   */
  createTimeline(config?: gsap.TimelineVars): gsap.core.Timeline {
    const defaultConfig = {
      paused: false,
      defaults: {
        duration: this.motionService.getAnimationDuration(ANIMATION_DURATIONS.SECTION_ENTER),
        ease: ANIMATION_EASING.EASE_OUT
      }
    };

    return gsap.timeline({ ...defaultConfig, ...config });
  }

  /**
   * Create a scroll trigger with default configuration
   */
  createScrollTrigger(options: ScrollTriggerOptions): ScrollTrigger | null {
    if (!this.isInitialized) {
      console.warn('GsapUtilsService: GSAP not initialized');
      return null;
    }

    try {
      const defaultOptions = {
        start: SCROLL_TRIGGER_CONFIG.START_TOP_BOTTOM,
        end: SCROLL_TRIGGER_CONFIG.END_CENTER_CENTER,
        toggleActions: 'play none none reverse'
      };

      const scrollTrigger = ScrollTrigger.create({
        ...defaultOptions,
        ...options
      });

      // Keep track of created scroll triggers
      this.registeredScrollTriggers.push(scrollTrigger);
      
      return scrollTrigger;
    } catch (error) {
      console.error('GsapUtilsService: Failed to create ScrollTrigger:', error);
      return null;
    }
  }

  /**
   * Animate element with motion preferences applied
   */
  animateTo(target: gsap.TweenTarget, config: GsapConfig): gsap.core.Tween {
    const motionConfig = this.motionService.getGsapConfig(
      config.duration || ANIMATION_DURATIONS.SECTION_ENTER,
      config.ease || ANIMATION_EASING.EASE_OUT
    );

    return gsap.to(target, {
      ...config,
      ...motionConfig
    });
  }

  /**
   * Animate element from specified values
   */
  animateFrom(target: gsap.TweenTarget, config: GsapConfig): gsap.core.Tween {
    const motionConfig = this.motionService.getGsapConfig(
      config.duration || ANIMATION_DURATIONS.SECTION_ENTER,
      config.ease || ANIMATION_EASING.EASE_OUT
    );

    return gsap.from(target, {
      ...config,
      ...motionConfig
    });
  }

  /**
   * Animate element from/to specified values
   */
  animateFromTo(
    target: gsap.TweenTarget, 
    fromConfig: GsapConfig, 
    toConfig: GsapConfig
  ): gsap.core.Tween {
    const motionConfig = this.motionService.getGsapConfig(
      toConfig.duration || ANIMATION_DURATIONS.SECTION_ENTER,
      toConfig.ease || ANIMATION_EASING.EASE_OUT
    );

    return gsap.fromTo(target, fromConfig, {
      ...toConfig,
      ...motionConfig
    });
  }

  /**
   * Create staggered animation
   */
  staggerAnimation(
    targets: gsap.TweenTarget, 
    config: GsapConfig, 
    stagger: number = TIMELINE_CONFIG.STAGGER_MEDIUM
  ): gsap.core.Tween {
    const motionConfig = this.motionService.getGsapConfig(
      config.duration || ANIMATION_DURATIONS.SECTION_ENTER,
      config.ease || ANIMATION_EASING.EASE_OUT
    );

    return gsap.to(targets, {
      ...config,
      ...motionConfig,
      stagger: stagger
    });
  }

  /**
   * Smooth scroll to element
   */
  scrollTo(target: string | HTMLElement, duration: number = 1): void {
    if (!this.isInitialized) return;

    gsap.to(window, {
      duration: this.motionService.getAnimationDuration(duration),
      scrollTo: target,
      ease: ANIMATION_EASING.EASE_OUT
    });
  }

  /**
   * Kill all animations for a target
   */
  killAnimations(target?: gsap.TweenTarget): void {
    if (target) {
      gsap.killTweensOf(target);
    } else {
      gsap.killTweensOf("*");
    }
  }

  /**
   * Set immediate values without animation
   */
  set(target: gsap.TweenTarget, config: gsap.TweenVars): gsap.core.Tween {
    return gsap.set(target, config);
  }

  /**
   * Refresh all ScrollTriggers
   */
  refreshScrollTriggers(): void {
    if (this.isInitialized) {
      ScrollTrigger.refresh();
    }
  }

  /**
   * Kill specific ScrollTrigger
   */
  killScrollTrigger(trigger: ScrollTrigger): void {
    const index = this.registeredScrollTriggers.indexOf(trigger);
    if (index > -1) {
      this.registeredScrollTriggers.splice(index, 1);
      trigger.kill();
    }
  }

  /**
   * Kill all ScrollTriggers created by this service
   */
  killAllScrollTriggers(): void {
    this.registeredScrollTriggers.forEach(trigger => trigger.kill());
    this.registeredScrollTriggers = [];
  }

  /**
   * Get current scroll position
   */
  getScrollPosition(): number {
    if (typeof window === 'undefined') return 0;
    return window.pageYOffset || 0;
  }

  /**
   * Check if GSAP is initialized and available
   */
  get isReady(): boolean {
    return this.isInitialized && isPlatformBrowser(this.platformId);
  }

  /**
   * Set initialization state (for testing)
   */
  set isReady(value: boolean) {
    this.isInitialized = value;
  }

  /**
   * Get GSAP instance
   */
  get gsap(): typeof gsap {
    return gsap;
  }

  /**
   * Get ScrollTrigger instance
   */
  get scrollTrigger(): typeof ScrollTrigger {
    return ScrollTrigger;
  }

  /**
   * Cleanup all animations and scroll triggers
   */
  destroy(): void {
    this.killAllScrollTriggers();
    this.killAnimations();
  }
}