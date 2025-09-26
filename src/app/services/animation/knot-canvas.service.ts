/**
 * Knot Canvas Service
 * Dedicated service for knot animation in the filosofia section
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GsapUtilsService } from './gsap-utils.service';
import { MotionPreferenceService } from '../../shared/utils';
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '../../shared/constants';

export interface KnotConfig {
  segments: number;
  amplitude: number;
  frequency: number;
  strokeWidth: number;
  strokeColor: string;
  backgroundColor: string;
  animate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class KnotCanvasService {
  // Configuration variables (customizable)
  private readonly DEFAULT_CONFIG: KnotConfig = {
    segments: 200,
    amplitude: 0.5,
    frequency: 3,
    strokeWidth: 2,
    strokeColor: '#64FFDA',
    backgroundColor: '#112240',
    animate: true
  };

  private readonly platformId = inject(PLATFORM_ID);
  private activeCanvas: HTMLCanvasElement | null = null;
  private animationId: number = 0;
  private knotTimeline: gsap.core.Timeline | null = null;

  constructor(
    private gsapUtils: GsapUtilsService,
    private motionService: MotionPreferenceService
  ) {}

  /**
   * Initialize knot animation on canvas
   */
  initializeKnot(
    canvas: HTMLCanvasElement, 
    config: Partial<KnotConfig> = {}
  ): void {
    if (!isPlatformBrowser(this.platformId) || !canvas) {
      return;
    }

    this.activeCanvas = canvas;
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Setup canvas
    this.setupCanvas(canvas);

    // Create animation timeline
    this.createKnotAnimation(canvas, finalConfig);
  }

  /**
   * Setup canvas dimensions and context
   */
  private setupCanvas(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context for high-DPI displays
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Set CSS size to maintain layout
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  /**
   * Create knot animation with GSAP
   */
  private createKnotAnimation(canvas: HTMLCanvasElement, config: KnotConfig): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const baseRadius = Math.min(rect.width, rect.height) * 0.3;

    // Animation parameters
    let animationProgress = 0;

    // Draw knot function
    const drawKnot = (progress: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Set drawing style
      ctx.strokeStyle = config.strokeColor;
      ctx.lineWidth = config.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw knot path
      ctx.beginPath();

      for (let i = 0; i <= config.segments * progress; i++) {
        const t = (i / config.segments) * Math.PI * 2 * config.frequency;
        
        // Trefoil knot parametric equations
        const scale = baseRadius;
        const x = centerX + scale * (Math.sin(t) + 2 * Math.sin(2 * t)) * config.amplitude;
        const y = centerY + scale * (Math.cos(t) - 2 * Math.cos(2 * t)) * config.amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    // Create GSAP animation timeline
    this.knotTimeline = this.gsapUtils.createTimeline({ paused: true });

    this.knotTimeline.to({ val: 0 }, {
      val: 1,
      duration: this.motionService.getAnimationDuration(ANIMATION_DURATIONS.KNOT_DRAW),
      ease: ANIMATION_EASING.EASE_OUT,
      onUpdate: () => {
        const progress = this.knotTimeline?.progress() || 0;
        drawKnot(progress);
      },
      onComplete: () => {
        // Animation complete callback
      }
    });

    // Create ScrollTrigger for the animation
    if (config.animate) {
      this.gsapUtils.createScrollTrigger({
        trigger: '#filosofia',
        start: 'top bottom',
        end: this.motionService.currentPreference ? 'top bottom' : 'center center',
        scrub: this.motionService.currentPreference ? false : ANIMATION_DURATIONS.KNOT_DRAW,
        toggleActions: this.motionService.currentPreference ? 'play none none reverse' : undefined,
        onEnter: () => {
          if (this.motionService.currentPreference) {
            this.knotTimeline?.play();
          }
        },
        onLeave: () => {
          if (this.motionService.currentPreference) {
            this.knotTimeline?.reverse();
          }
        },
        onUpdate: (self) => {
          if (!this.motionService.currentPreference) {
            this.knotTimeline?.progress(self.progress);
          }
        }
      });
    } else {
      // If animation disabled, draw complete knot
      drawKnot(1);
    }
  }

  /**
   * Update knot configuration
   */
  updateConfig(config: Partial<KnotConfig>): void {
    if (!this.activeCanvas) return;

    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    this.createKnotAnimation(this.activeCanvas, finalConfig);
  }

  /**
   * Play knot animation
   */
  play(): void {
    this.knotTimeline?.play();
  }

  /**
   * Pause knot animation
   */
  pause(): void {
    this.knotTimeline?.pause();
  }

  /**
   * Reverse knot animation
   */
  reverse(): void {
    this.knotTimeline?.reverse();
  }

  /**
   * Restart knot animation
   */
  restart(): void {
    this.knotTimeline?.restart();
  }

  /**
   * Set animation progress manually
   */
  setProgress(progress: number): void {
    this.knotTimeline?.progress(Math.max(0, Math.min(1, progress)));
  }

  /**
   * Get current animation progress
   */
  getProgress(): number {
    return this.knotTimeline?.progress() || 0;
  }

  /**
   * Check if animation is playing
   */
  isPlaying(): boolean {
    return this.knotTimeline?.isActive() || false;
  }

  /**
   * Resize canvas and redraw
   */
  resize(): void {
    if (!this.activeCanvas) return;

    this.setupCanvas(this.activeCanvas);
    
    // Redraw at current progress
    const currentProgress = this.getProgress();
    this.setProgress(currentProgress);
  }

  /**
   * Clear canvas
   */
  clear(): void {
    if (!this.activeCanvas) return;

    const ctx = this.activeCanvas.getContext('2d');
    if (ctx) {
      const rect = this.activeCanvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }

  /**
   * Cleanup knot animation
   */
  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.knotTimeline) {
      this.knotTimeline.kill();
      this.knotTimeline = null;
    }

    this.activeCanvas = null;
  }
}