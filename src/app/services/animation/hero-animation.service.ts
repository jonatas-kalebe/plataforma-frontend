/**
 * Hero Animation Service
 * Dedicated service for hero section animations
 */

import { Injectable, ElementRef } from '@angular/core';
import { GsapUtilsService } from './gsap-utils.service';
import { MotionPreferenceService } from '../../shared/utils';
import { ANIMATION_DURATIONS, ANIMATION_EASING, TIMELINE_CONFIG } from '../../shared/constants';

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
    titleDelay: 0.2,
    subtitleDelay: 0.4,
    ctaDelay: 0.6,
    scrollHintDelay: 0.8,
    staggerEnabled: true,
    parallaxEnabled: true
  };

  private heroTimeline: gsap.core.Timeline | null = null;
  private parallaxElements: HTMLElement[] = [];

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
    this.createHeroTimeline(finalConfig);

    // Setup parallax effects if enabled
    if (finalConfig.parallaxEnabled && heroBgRef?.nativeElement) {
      this.setupParallaxEffects(heroBgRef.nativeElement);
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
      y: 30
    });

    // Animate title
    this.heroTimeline.to('#hero-title', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(ANIMATION_DURATIONS.HERO_FADE_IN, 0.6),
      ease: ANIMATION_EASING.EASE_OUT
    }, config.titleDelay);

    // Animate subtitle
    this.heroTimeline.to('#hero-subtitle', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(ANIMATION_DURATIONS.SECTION_ENTER, 0.4),
      ease: ANIMATION_EASING.EASE_OUT
    }, config.subtitleDelay);

    // Animate CTA button
    this.heroTimeline.to('#hero-cta', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(ANIMATION_DURATIONS.SECTION_ENTER, 0.4),
      ease: ANIMATION_EASING.BOUNCE
    }, config.ctaDelay);

    // Animate scroll hint
    this.heroTimeline.to('#scroll-hint', {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(ANIMATION_DURATIONS.SECTION_ENTER, 0.3),
      ease: ANIMATION_EASING.EASE_OUT
    }, config.scrollHintDelay);

    // Create ScrollTrigger for hero
    this.gsapUtils.createScrollTrigger({
      trigger: '#hero',
      start: 'top center',
      end: 'bottom center',
      onEnter: () => this.playHeroAnimation(),
      onEnterBack: () => this.playHeroAnimation()
    });
  }

  /**
   * Setup parallax effects for hero background
   */
  private setupParallaxEffects(heroBg: HTMLElement): void {
    if (!this.gsapUtils.isReady || this.motionService.currentPreference) {
      return; // Skip parallax for reduced motion
    }

    this.parallaxElements.push(heroBg);

    // Create parallax scroll trigger
    this.gsapUtils.createScrollTrigger({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Parallax background movement
        this.gsapUtils.set(heroBg, {
          yPercent: -50 * progress,
          scale: 1 + (0.1 * progress)
        });
      }
    });
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
        duration: this.motionService.getAnimationDuration(0.6)
      },
      TIMELINE_CONFIG.STAGGER_SHORT
    );
  }

  /**
   * Create floating animation for elements
   */
  createFloatingAnimation(target: string | HTMLElement): void {
    if (this.motionService.currentPreference) return;

    this.gsapUtils.animateTo(target, {
      y: -10,
      duration: 2,
      ease: ANIMATION_EASING.EASE_IN_OUT,
      repeat: -1,
      yoyo: true
    });
  }

  /**
   * Create pulse animation for elements
   */
  createPulseAnimation(target: string | HTMLElement): void {
    if (this.motionService.currentPreference) return;

    this.gsapUtils.animateTo(target, {
      scale: 1.05,
      duration: 1.5,
      ease: ANIMATION_EASING.EASE_IN_OUT,
      repeat: -1,
      yoyo: true
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

    // Clean up parallax elements
    this.parallaxElements.forEach(element => {
      this.gsapUtils.killAnimations(element);
    });
    this.parallaxElements = [];
  }
}