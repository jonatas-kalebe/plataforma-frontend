/**
 * Section Animation Service
 * Service for managing section entrance/exit animations and transitions
 */

import { Injectable } from '@angular/core';
import { GsapUtilsService } from './gsap-utils.service';
import { MotionPreferenceService } from '../../shared/utils';
import { SectionId, SECTION_IDS } from '../../shared/constants';
import { ANIMATION_DURATIONS, ANIMATION_EASING, TIMELINE_CONFIG } from '../../shared/constants';

export interface SectionAnimationConfig {
  entranceDelay: number;
  exitDelay: number;
  staggerDelay: number;
  parallaxIntensity: number;
  enableScrollTrigger: boolean;
  enableParallax: boolean;
}

export interface SectionElements {
  container: HTMLElement;
  title?: HTMLElement;
  content?: HTMLElement;
  children?: HTMLElement[];
}

@Injectable({
  providedIn: 'root'
})
export class SectionAnimationService {
  // Configuration variables (customizable)
  private readonly DEFAULT_CONFIG: SectionAnimationConfig = {
    entranceDelay: 0.2,
    exitDelay: 0.1,
    staggerDelay: 0.1,
    parallaxIntensity: 0.3,
    enableScrollTrigger: true,
    enableParallax: false
  };

  private sectionTimelines: Map<SectionId, gsap.core.Timeline> = new Map();
  private sectionConfigs: Map<SectionId, SectionAnimationConfig> = new Map();

  constructor(
    private gsapUtils: GsapUtilsService,
    private motionService: MotionPreferenceService
  ) {}

  /**
   * Initialize animations for a section
   */
  initializeSectionAnimations(
    sectionId: SectionId,
    elements: SectionElements,
    config: Partial<SectionAnimationConfig> = {}
  ): void {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    this.sectionConfigs.set(sectionId, finalConfig);

    // Create section timeline
    this.createSectionTimeline(sectionId, elements, finalConfig);

    // Setup scroll triggers if enabled
    if (finalConfig.enableScrollTrigger) {
      this.setupScrollTrigger(sectionId, elements, finalConfig);
    }

    // Setup parallax if enabled
    if (finalConfig.enableParallax && !this.motionService.currentPreference) {
      this.setupParallaxEffects(sectionId, elements, finalConfig);
    }
  }

  /**
   * Create timeline for section animations
   */
  private createSectionTimeline(
    sectionId: SectionId,
    elements: SectionElements,
    config: SectionAnimationConfig
  ): void {
    const timeline = this.gsapUtils.createTimeline({ paused: true });

    // Set initial states
    const animatedElements = [
      elements.title,
      elements.content,
      ...(elements.children || [])
    ].filter(Boolean) as HTMLElement[];

    // Initial state - hide elements
    this.gsapUtils.set(animatedElements, {
      opacity: 0,
      y: 30
    });

    // Entrance animations with stagger
    timeline.to(animatedElements, {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(ANIMATION_DURATIONS.SECTION_ENTER),
      ease: ANIMATION_EASING.EASE_OUT,
      stagger: config.staggerDelay
    }, config.entranceDelay);

    this.sectionTimelines.set(sectionId, timeline);
  }

  /**
   * Setup scroll trigger for section
   */
  private setupScrollTrigger(
    sectionId: SectionId,
    elements: SectionElements,
    config: SectionAnimationConfig
  ): void {
    const sectionSelector = `#${sectionId}`;

    this.gsapUtils.createScrollTrigger({
      trigger: sectionSelector,
      start: 'top 80%',
      end: 'bottom 20%',
      onEnter: () => this.playSection(sectionId),
      onLeave: () => this.pauseSection(sectionId),
      onEnterBack: () => this.playSection(sectionId),
      onLeaveBack: () => this.reverseSection(sectionId)
    });
  }

  /**
   * Setup parallax effects for section
   */
  private setupParallaxEffects(
    sectionId: SectionId,
    elements: SectionElements,
    config: SectionAnimationConfig
  ): void {
    if (this.motionService.currentPreference) return;

    const sectionSelector = `#${sectionId}`;

    // Create parallax scroll trigger
    this.gsapUtils.createScrollTrigger({
      trigger: sectionSelector,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const intensity = config.parallaxIntensity;

        // Apply different parallax speeds to different elements
        if (elements.title) {
          this.gsapUtils.set(elements.title, {
            yPercent: -intensity * 50 * progress
          });
        }

        if (elements.content) {
          this.gsapUtils.set(elements.content, {
            yPercent: -intensity * 30 * progress
          });
        }

        if (elements.children) {
          elements.children.forEach((child, index) => {
            this.gsapUtils.set(child, {
              yPercent: -intensity * (20 + index * 10) * progress
            });
          });
        }
      }
    });
  }

  /**
   * Create specific animation for services section
   */
  createServicesAnimation(elements: SectionElements): void {
    const timeline = this.gsapUtils.createTimeline({ paused: true });

    // Set initial state
    this.gsapUtils.set('.service-card', {
      opacity: 0,
      y: 50,
      scale: 0.9
    });

    // Animate service cards with stagger
    timeline.to('.service-card', {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: this.motionService.getAnimationDuration(0.6),
      ease: ANIMATION_EASING.BOUNCE,
      stagger: 0.1
    });

    this.sectionTimelines.set(SECTION_IDS.SERVICOS, timeline);
  }

  /**
   * Create specific animation for trabalhos section
   */
  createTrabalhosAnimation(elements: SectionElements): void {
    // Simplified animation without problematic scaling/opacity changes
    const timeline = this.gsapUtils.createTimeline({ paused: true });

    // Simple fade-in entrance only
    timeline.fromTo('.trabalhos-showcase', {
      opacity: 0,
      y: 20
    }, {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(0.8),
      ease: 'power2.out'
    });

    this.sectionTimelines.set(SECTION_IDS.TRABALHOS, timeline);
  }

  /**
   * Create specific animation for CTA section
   */
  createCtaAnimation(elements: SectionElements): void {
    const timeline = this.gsapUtils.createTimeline({ paused: true });

    // Animate CTA elements with bounce effect
    timeline.fromTo('.cta-title', {
      opacity: 0,
      scale: 0.8
    }, {
      opacity: 1,
      scale: 1,
      duration: this.motionService.getAnimationDuration(0.8),
      ease: ANIMATION_EASING.BOUNCE
    })
    .fromTo('.cta-buttons', {
      opacity: 0,
      y: 30
    }, {
      opacity: 1,
      y: 0,
      duration: this.motionService.getAnimationDuration(0.6),
      ease: ANIMATION_EASING.EASE_OUT
    }, 0.2);

    this.sectionTimelines.set(SECTION_IDS.CTA, timeline);
  }

  /**
   * Play section animation
   */
  playSection(sectionId: SectionId): void {
    const timeline = this.sectionTimelines.get(sectionId);
    timeline?.play();
  }

  /**
   * Pause section animation
   */
  pauseSection(sectionId: SectionId): void {
    const timeline = this.sectionTimelines.get(sectionId);
    timeline?.pause();
  }

  /**
   * Reverse section animation
   */
  reverseSection(sectionId: SectionId): void {
    const timeline = this.sectionTimelines.get(sectionId);
    timeline?.reverse();
  }

  /**
   * Restart section animation
   */
  restartSection(sectionId: SectionId): void {
    const timeline = this.sectionTimelines.get(sectionId);
    timeline?.restart();
  }

  /**
   * Get section animation progress
   */
  getSectionProgress(sectionId: SectionId): number {
    const timeline = this.sectionTimelines.get(sectionId);
    return timeline?.progress() || 0;
  }

  /**
   * Set section animation progress
   */
  setSectionProgress(sectionId: SectionId, progress: number): void {
    const timeline = this.sectionTimelines.get(sectionId);
    timeline?.progress(Math.max(0, Math.min(1, progress)));
  }

  /**
   * Check if section animation is playing
   */
  isSectionPlaying(sectionId: SectionId): boolean {
    const timeline = this.sectionTimelines.get(sectionId);
    return timeline?.isActive() || false;
  }

  /**
   * Update section configuration
   */
  updateSectionConfig(
    sectionId: SectionId, 
    config: Partial<SectionAnimationConfig>
  ): void {
    const currentConfig = this.sectionConfigs.get(sectionId) || this.DEFAULT_CONFIG;
    const finalConfig = { ...currentConfig, ...config };
    this.sectionConfigs.set(sectionId, finalConfig);
  }

  /**
   * Kill section animation
   */
  killSection(sectionId: SectionId): void {
    const timeline = this.sectionTimelines.get(sectionId);
    if (timeline) {
      timeline.kill();
      this.sectionTimelines.delete(sectionId);
    }
  }

  /**
   * Cleanup all section animations
   */
  destroy(): void {
    this.sectionTimelines.forEach((timeline) => {
      timeline.kill();
    });
    this.sectionTimelines.clear();
    this.sectionConfigs.clear();
  }
}