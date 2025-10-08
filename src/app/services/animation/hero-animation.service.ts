/**
 * Hero Animation Service
 * Dedicated service for hero section animations with professional quality
 */

import { Injectable, ElementRef } from '@angular/core';
import { GsapUtilsService } from './gsap-utils.service';
import { MotionPreferenceService } from '../../shared/utils';
import { ANIMATION_DURATIONS, ANIMATION_EASING, TIMELINE_CONFIG } from '../../shared/constants';

// ============================================================================
// 🎨 ANIMATION CONFIGURATION - Customize all animation settings here
// ============================================================================

/** Configuration for hero entrance animations */
const ENTRANCE_CONFIG = {
  /** Title entrance delay (seconds) */
  titleDelay: 0.2,
  
  /** Subtitle entrance delay (seconds) */
  subtitleDelay: 0.4,
  
  /** CTA button entrance delay (seconds) */
  ctaDelay: 0.6,
  
  /** Scroll hint entrance delay (seconds) */
  scrollHintDelay: 0.8,
  
  /** Initial Y offset (pixels) */
  initialY: 30,
  
  /** Title animation duration (seconds) */
  titleDuration: 0.6,
  
  /** Subtitle animation duration (seconds) */
  subtitleDuration: 0.4,
  
  /** CTA animation duration (seconds) */
  ctaDuration: 0.4,
  
  /** Scroll hint animation duration (seconds) */
  scrollHintDuration: 0.3,
  
  /** Enable/disable staggered entrance */
  staggerEnabled: true,
  
  /** Enable/disable entrance animations */
  enabled: true
} as const;

/** Configuration for scroll-based animations */
const SCROLL_CONFIG = {
  /** Scroll-based parallax enabled */
  scrollParallaxEnabled: true,
  
  /** Background parallax intensity (0-1) */
  backgroundParallaxIntensity: 0.5,
  
  /** Background scale intensity (0-1) */
  backgroundScaleIntensity: 0.1,
  
  /** Scroll trigger start point */
  triggerStart: 'top top',
  
  /** Scroll trigger end point */
  triggerEnd: 'bottom top',
  
  /** Scrub smoothness (higher = smoother) */
  scrubSmoothness: 1.5
} as const;

/** Configuration for mouse/touch parallax */
const MOUSE_PARALLAX_CONFIG = {
  /** Enable/disable mouse parallax */
  enabled: true,
  
  /** Title movement intensity X (pixels per normalized unit) */
  titleMoveX: 15,
  
  /** Title movement intensity Y (pixels per normalized unit) */
  titleMoveY: 10,
  
  /** Title tilt intensity (degrees per normalized unit) */
  titleTilt: 2,
  
  /** Subtitle movement intensity X (pixels per normalized unit) */
  subtitleMoveX: 8,
  
  /** Subtitle movement intensity Y (pixels per normalized unit) */
  subtitleMoveY: 5,
  
  /** Subtitle tilt intensity (degrees per normalized unit) */
  subtitleTilt: 1,
  
  /** CTA movement intensity X (pixels per normalized unit) */
  ctaMoveX: 5,
  
  /** CTA movement intensity Y (pixels per normalized unit) */
  ctaMoveY: 3,
  
  /** Interpolation smoothness (0-1, lower = smoother but slower) */
  interpolationFactor: 0.1
} as const;

/** Configuration for device tilt (mobile) */
const TILT_CONFIG = {
  /** Enable/disable device orientation tilt */
  enabled: true,
  
  /** Title tilt movement X (pixels) */
  titleTiltX: 20,
  
  /** Title tilt movement Y (pixels) */
  titleTiltY: 15,
  
  /** Title tilt rotation (degrees) */
  titleTiltRotation: 3,
  
  /** Subtitle tilt movement X (pixels) */
  subtitleTiltX: 12,
  
  /** Subtitle tilt movement Y (pixels) */
  subtitleTiltY: 8,
  
  /** Subtitle tilt rotation (degrees) */
  subtitleTiltRotation: 2
} as const;

/** Configuration for floating/pulse animations */
const FLOATING_CONFIG = {
  /** Floating animation vertical distance (pixels) */
  floatDistance: 10,
  
  /** Floating animation duration (seconds) */
  floatDuration: 2,
  
  /** Pulse scale factor */
  pulseScale: 1.05,
  
  /** Pulse animation duration (seconds) */
  pulseDuration: 1.5,
  
  /** Enable/disable floating animations */
  enabled: true
} as const;

/** Configuration for shockwave effects */
const SHOCKWAVE_CONFIG = {
  /** Enable/disable click shockwave */
  enabled: true,
  
  /** Click feedback scale */
  clickScale: 1.05,
  
  /** Click feedback duration (seconds) */
  clickDuration: 0.1
} as const;

/** Performance optimization settings */
const PERFORMANCE_CONFIG = {
  /** Use GPU acceleration */
  useGPU: true,
  
  /** Force 3D rendering */
  force3D: true,
  
  /** Use requestAnimationFrame for parallax */
  useRAF: true
} as const;

/** Responsive breakpoints */
const RESPONSIVE_CONFIG = {
  /** Mobile breakpoint (pixels) */
  mobileBreakpoint: 768,
  
  /** Tablet breakpoint (pixels) */
  tabletBreakpoint: 1024,
  
  /** Reduce parallax intensity on mobile */
  reduceParallaxOnMobile: true,
  
  /** Mobile parallax intensity multiplier */
  mobileParallaxMultiplier: 0.6
} as const;

// ============================================================================
// 🎯 SERVICE IMPLEMENTATION - Do not modify unless necessary
// ============================================================================

export interface HeroAnimationConfig {
  titleDelay: number;
  subtitleDelay: number;
  ctaDelay: number;
  scrollHintDelay: number;
  staggerEnabled: boolean;
  parallaxEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HeroAnimationService {
  // Configuration variables (customizable)
  private readonly DEFAULT_CONFIG: HeroAnimationConfig = {
    titleDelay: ENTRANCE_CONFIG.titleDelay,
    subtitleDelay: ENTRANCE_CONFIG.subtitleDelay,
    ctaDelay: ENTRANCE_CONFIG.ctaDelay,
    scrollHintDelay: ENTRANCE_CONFIG.scrollHintDelay,
    staggerEnabled: ENTRANCE_CONFIG.staggerEnabled,
    parallaxEnabled: SCROLL_CONFIG.scrollParallaxEnabled
  };

  private heroTimeline: gsap.core.Timeline | null = null;
  private parallaxElements: HTMLElement[] = [];
  private scrollTriggers: any[] = [];

  constructor(
    private gsapUtils: GsapUtilsService,
    private motionService: MotionPreferenceService
  ) {}

  /**
   * Initialize hero animations
   */
  initializeHeroAnimations(
    heroBgRef: ElementRef,
    config: Partial<HeroAnimationConfig> = {}
  ): void {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Create hero entrance timeline
    if (ENTRANCE_CONFIG.enabled) {
      this.createHeroTimeline(finalConfig);
    }

    // Setup scroll-based parallax if enabled
    if (finalConfig.parallaxEnabled && SCROLL_CONFIG.scrollParallaxEnabled && heroBgRef?.nativeElement) {
      this.setupScrollParallax(heroBgRef.nativeElement);
    }
  }

  /**
   * Create hero entrance timeline
   */
  private createHeroTimeline(config: HeroAnimationConfig): void {
    this.heroTimeline = this.gsapUtils.createTimeline({ paused: true });

    // Initial state - set elements invisible
    this.gsapUtils.set('#hero-title, #hero-subtitle, #hero-cta, #scroll-hint', {
      opacity: 0,
      y: ENTRANCE_CONFIG.initialY,
      force3D: PERFORMANCE_CONFIG.force3D
    });

    // Animate title
    this.heroTimeline.to('#hero-title', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(
        ANIMATION_DURATIONS.HERO_FADE_IN, 
        ENTRANCE_CONFIG.titleDuration
      ),
      ease: ANIMATION_EASING.EASE_OUT,
      force3D: PERFORMANCE_CONFIG.force3D
    }, config.titleDelay);

    // Animate subtitle
    this.heroTimeline.to('#hero-subtitle', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(
        ANIMATION_DURATIONS.SECTION_ENTER, 
        ENTRANCE_CONFIG.subtitleDuration
      ),
      ease: ANIMATION_EASING.EASE_OUT,
      force3D: PERFORMANCE_CONFIG.force3D
    }, config.subtitleDelay);

    // Animate CTA button
    this.heroTimeline.to('#hero-cta', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(
        ANIMATION_DURATIONS.SECTION_ENTER, 
        ENTRANCE_CONFIG.ctaDuration
      ),
      ease: ANIMATION_EASING.BOUNCE,
      force3D: PERFORMANCE_CONFIG.force3D
    }, config.ctaDelay);

    // Animate scroll hint
    this.heroTimeline.to('#scroll-hint', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(
        ANIMATION_DURATIONS.SECTION_ENTER, 
        ENTRANCE_CONFIG.scrollHintDuration
      ),
      ease: ANIMATION_EASING.EASE_OUT,
      force3D: PERFORMANCE_CONFIG.force3D
    }, config.scrollHintDelay);

    // Create ScrollTrigger for hero entrance
    const trigger = this.gsapUtils.createScrollTrigger({
      trigger: '#hero',
      start: 'top center',
      end: 'bottom center',
      onEnter: () => this.playHeroAnimation(),
      onEnterBack: () => this.playHeroAnimation()
    });
    
    if (trigger) {
      this.scrollTriggers.push(trigger);
    }
  }

  /**
   * Setup scroll-based parallax effects for hero background
   * Uses GSAP tween with ScrollTrigger scrub for smooth parallax
   */
  private setupScrollParallax(heroBg: HTMLElement): void {
    if (!this.gsapUtils.isReady || this.motionService.currentPreference) {
      return; // Skip parallax for reduced motion
    }

    this.parallaxElements.push(heroBg);

    // Set initial state
    this.gsapUtils.set(heroBg, {
      yPercent: 0,
      scale: 1,
      force3D: PERFORMANCE_CONFIG.force3D
    });

    // Create parallax scroll trigger with inline tween
    const trigger = this.gsapUtils.createScrollTrigger({
      trigger: '#hero',
      start: SCROLL_CONFIG.triggerStart,
      end: SCROLL_CONFIG.triggerEnd,
      scrub: SCROLL_CONFIG.scrubSmoothness,
      onUpdate: (self: any) => {
        const progress = self.progress;
        // Use set with overwrite to avoid conflicts
        this.gsapUtils.set(heroBg, {
          yPercent: -50 * SCROLL_CONFIG.backgroundParallaxIntensity * progress,
          scale: 1 + (SCROLL_CONFIG.backgroundScaleIntensity * progress),
          force3D: PERFORMANCE_CONFIG.force3D,
          overwrite: 'auto'
        });
      }
    });
    
    if (trigger) {
      this.scrollTriggers.push(trigger);
    }
  }

  /**
   * Play hero animation
   */
  playHeroAnimation(): void {
    if (this.heroTimeline) {
      this.heroTimeline.play();
    }
  }

  /**
   * Pause hero animation
   */
  pauseHeroAnimation(): void {
    if (this.heroTimeline) {
      this.heroTimeline.pause();
    }
  }

  /**
   * Restart hero animation
   */
  restartHeroAnimation(): void {
    if (this.heroTimeline) {
      this.heroTimeline.restart();
    }
  }

  /**
   * Reverse hero animation
   */
  reverseHeroAnimation(): void {
    if (this.heroTimeline) {
      this.heroTimeline.reverse();
    }
  }

  /**
   * Create text reveal animation for hero title
   */
  createTitleRevealAnimation(titleElement: HTMLElement): void {
    if (!titleElement) return;

    // Split text into words for animation
    const words = titleElement.textContent?.split(' ') || [];
    titleElement.innerHTML = words
      .map(word => `<span class="word-reveal">${word}</span>`)
      .join(' ');

    // Animate words with stagger
    this.gsapUtils.staggerAnimation(
      '.word-reveal',
      {
        opacity: 1,
        y: 0,
        duration: this.motionService.getAnimationDuration(0.6),
        force3D: PERFORMANCE_CONFIG.force3D
      },
      TIMELINE_CONFIG.STAGGER_SHORT
    );
  }

  /**
   * Create floating animation for elements
   */
  createFloatingAnimation(target: string | HTMLElement): void {
    if (this.motionService.currentPreference || !FLOATING_CONFIG.enabled) return;

    this.gsapUtils.animateTo(target, {
      y: -FLOATING_CONFIG.floatDistance,
      duration: FLOATING_CONFIG.floatDuration,
      ease: ANIMATION_EASING.EASE_IN_OUT,
      repeat: -1,
      yoyo: true,
      force3D: PERFORMANCE_CONFIG.force3D
    });
  }

  /**
   * Create pulse animation for elements
   */
  createPulseAnimation(target: string | HTMLElement): void {
    if (this.motionService.currentPreference || !FLOATING_CONFIG.enabled) return;

    this.gsapUtils.animateTo(target, {
      scale: FLOATING_CONFIG.pulseScale,
      duration: FLOATING_CONFIG.pulseDuration,
      ease: ANIMATION_EASING.EASE_IN_OUT,
      repeat: -1,
      yoyo: true,
      force3D: PERFORMANCE_CONFIG.force3D
    });
  }

  /**
   * Create glow effect animation
   */
  createGlowAnimation(target: string | HTMLElement): void {
    if (this.motionService.currentPreference) return;

    this.gsapUtils.animateTo(target, {
      boxShadow: '0 0 30px rgba(100, 255, 218, 0.6)',
      duration: 2,
      ease: ANIMATION_EASING.EASE_IN_OUT,
      repeat: -1,
      yoyo: true
    });
  }

  /**
   * Update animation configuration
   */
  updateConfig(config: Partial<HeroAnimationConfig>): void {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    this.createHeroTimeline(finalConfig);
  }

  /**
   * Get current animation progress
   */
  getProgress(): number {
    return this.heroTimeline?.progress() || 0;
  }

  /**
   * Set animation progress
   */
  setProgress(progress: number): void {
    this.heroTimeline?.progress(Math.max(0, Math.min(1, progress)));
  }

  /**
   * Check if animation is playing
   */
  isPlaying(): boolean {
    return this.heroTimeline?.isActive() || false;
  }

  /**
   * Cleanup hero animations
   */
  destroy(): void {
    if (this.heroTimeline) {
      this.heroTimeline.kill();
      this.heroTimeline = null;
    }

    // Kill all scroll triggers
    this.scrollTriggers.forEach(trigger => {
      if (trigger && typeof trigger.kill === 'function') {
        trigger.kill();
      }
    });
    this.scrollTriggers = [];

    // Clean up parallax elements
    this.parallaxElements.forEach(element => {
      this.gsapUtils.killAnimations(element);
    });
    this.parallaxElements = [];
  }
}

// Export configurations for use in hero component
export { 
  ENTRANCE_CONFIG,
  SCROLL_CONFIG,
  MOUSE_PARALLAX_CONFIG,
  TILT_CONFIG,
  FLOATING_CONFIG,
  SHOCKWAVE_CONFIG,
  PERFORMANCE_CONFIG,
  RESPONSIVE_CONFIG
};