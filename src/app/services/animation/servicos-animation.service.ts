import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ============================================================================
// 🎨 ANIMATION CONFIGURATION - Customize all animation settings here
// ============================================================================

/** Configuration for service card entrance animations */
const ENTRANCE_CONFIG = {
  /** Initial Y offset when card is off-screen (in pixels) */
  initialY: 60,
  
  /** Initial scale when card is off-screen (0-1) */
  initialScale: 0.95,
  
  /** Scroll trigger start point */
  triggerStart: 'top bottom-=100',
  
  /** Scroll trigger end point */
  triggerEnd: 'top center',
  
  /** Scrub smoothness (higher = smoother but slower response) */
  scrubSmoothness: 1.5,
  
  /** Enable/disable entrance animation */
  enabled: true
} as const;

/** Configuration for hover effects */
const HOVER_CONFIG = {
  /** Scale on hover for normal motion */
  hoverScale: 1.05,
  
  /** Scale on hover for reduced motion */
  reducedMotionScale: 1.02,
  
  /** Y offset on hover (negative = up) */
  hoverYOffset: -8,
  
  /** Hover animation duration (seconds) */
  hoverDuration: 0.4,
  
  /** Hover easing function */
  hoverEase: 'power2.out',
  
  /** 3D tilt intensity (degrees) */
  tiltIntensity: 3,
  
  /** 3D horizontal movement intensity (pixels) */
  moveIntensity: 4,
  
  /** Enable/disable hover effects */
  enabled: true,
  
  /** Enable/disable 3D tilt effect */
  enable3DTilt: true
} as const;

/** Configuration for touch interactions */
const TOUCH_CONFIG = {
  /** Scale on touch */
  touchScale: 1.02,
  
  /** Touch animation duration (seconds) */
  touchDuration: 0.2,
  
  /** Vibration duration (milliseconds) */
  vibrationDuration: 50,
  
  /** Enable/disable touch feedback */
  enabled: true,
  
  /** Enable/disable haptic vibration */
  enableVibration: true
} as const;

/** Performance optimization settings */
const PERFORMANCE_CONFIG = {
  /** Use GPU acceleration */
  useGPU: true,
  
  /** Force 3D rendering */
  force3D: true,
  
  /** Animation precision (higher = more accurate, lower = better performance) */
  precision: 0.01
} as const;

// ============================================================================
// 🎯 SERVICE IMPLEMENTATION - Do not modify unless necessary
// ============================================================================

@Injectable({
  providedIn: 'root'
})
export class ServicosAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly prefersReducedMotion: boolean;
  private scrollTriggers: ScrollTrigger[] = [];
  private cleanupFns: Array<() => void> = [];

  constructor() {
    this.prefersReducedMotion = this.isBrowser
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    if (this.isBrowser) {
      gsap.registerPlugin(ScrollTrigger);
    }
  }

  /**
   * Create scroll-driven entrance animations for service cards
   * Uses GSAP's native scrubbing to avoid conflicts
   */
  createStaggeredEntrance(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || !ENTRANCE_CONFIG.enabled) {
      return;
    }

    if (this.prefersReducedMotion) {
      // For reduced motion, show cards immediately
      const cardElements = Array.from(cards) as HTMLElement[];
      cardElements.forEach((card) => {
        gsap.set(card, { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          clearProps: 'all'
        });
      });
      return;
    }

    const cardElements = Array.from(cards) as HTMLElement[];

    cardElements.forEach((card) => {
      // Set initial state
      gsap.set(card, {
        opacity: 1,
        y: ENTRANCE_CONFIG.initialY,
        scale: ENTRANCE_CONFIG.initialScale,
        force3D: PERFORMANCE_CONFIG.force3D
      });

      // Create scroll-triggered animation using GSAP's animation property
      // This prevents conflicts by letting ScrollTrigger control the animation
      const animation = gsap.to(card, {
        y: 0,
        scale: 1,
        ease: 'none',
        paused: true
      });

      const trigger = ScrollTrigger.create({
        trigger: card,
        start: ENTRANCE_CONFIG.triggerStart,
        end: ENTRANCE_CONFIG.triggerEnd,
        scrub: ENTRANCE_CONFIG.scrubSmoothness,
        animation: animation,
        // Add markers for debugging (remove in production)
        // markers: true
      });

      this.scrollTriggers.push(trigger);
    });
  }

  /**
   * Create magnetic hover effects for cards
   * Professional-grade hover interactions
   */
  createMagneticHover(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || !HOVER_CONFIG.enabled) {
      return;
    }

    const cardElements = Array.from(cards) as HTMLElement[];

    cardElements.forEach((card) => {
      // Store original position for reset
      let isHovering = false;

      const handleMouseEnter = () => {
        isHovering = true;
        
        const scale = this.prefersReducedMotion 
          ? HOVER_CONFIG.reducedMotionScale 
          : HOVER_CONFIG.hoverScale;
          
        const yOffset = this.prefersReducedMotion ? 0 : HOVER_CONFIG.hoverYOffset;

        gsap.to(card, {
          scale,
          y: yOffset,
          duration: HOVER_CONFIG.hoverDuration,
          ease: HOVER_CONFIG.hoverEase,
          overwrite: 'auto' // Prevent conflicts with scroll animations
        });
      };

      const handleMouseLeave = () => {
        isHovering = false;
        
        gsap.to(card, {
          scale: 1,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          x: 0,
          duration: HOVER_CONFIG.hoverDuration,
          ease: HOVER_CONFIG.hoverEase,
          overwrite: 'auto'
        });
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (this.prefersReducedMotion || !HOVER_CONFIG.enable3DTilt || !isHovering) {
          return;
        }

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (event.clientX - centerX) / (rect.width / 2);
        const deltaY = (event.clientY - centerY) / (rect.height / 2);

        gsap.to(card, {
          rotationX: deltaY * -HOVER_CONFIG.tiltIntensity,
          rotationY: deltaX * HOVER_CONFIG.tiltIntensity,
          x: deltaX * HOVER_CONFIG.moveIntensity,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      };

      const handleTouchStart = () => {
        if (!TOUCH_CONFIG.enabled) return;

        gsap.to(card, {
          scale: TOUCH_CONFIG.touchScale,
          duration: TOUCH_CONFIG.touchDuration,
          ease: 'power2.out',
          overwrite: 'auto'
        });

        if (TOUCH_CONFIG.enableVibration && navigator.vibrate) {
          navigator.vibrate(TOUCH_CONFIG.vibrationDuration);
        }
      };

      const handleTouchEnd = () => {
        if (!TOUCH_CONFIG.enabled) return;

        gsap.to(card, {
          scale: 1,
          duration: TOUCH_CONFIG.touchDuration * 1.5,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('touchstart', handleTouchStart, { passive: true });
      card.addEventListener('touchend', handleTouchEnd);
      card.addEventListener('touchcancel', handleTouchEnd);

      this.cleanupFns.push(() => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('touchstart', handleTouchStart);
        card.removeEventListener('touchend', handleTouchEnd);
        card.removeEventListener('touchcancel', handleTouchEnd);
      });
    });
  }

  /**
   * Parallax effect disabled - conflicts with entrance animation
   * Keep this method for API compatibility but don't use it
   */
  createParallaxEffect(cards: NodeListOf<Element> | Element[]): void {
    // Disabled to prevent conflicts with entrance animation
    return;
  }

  /**
   * Section snapping disabled per user request
   */
  createSectionSnapping(): void {
    // Disabled per user request
    return;
  }

  /**
   * Destroy all animations and clean up
   */
  destroy(): void {
    this.scrollTriggers.forEach((trigger) => trigger.kill());
    this.scrollTriggers = [];

    this.cleanupFns.forEach((cleanup) => cleanup());
    this.cleanupFns = [];
  }
}
