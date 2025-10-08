import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
   * Create scroll-driven animations for service cards
   * Cards animate based on scroll position, not time
   */
  createStaggeredEntrance(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || this.prefersReducedMotion) {
      // For reduced motion or SSR, show cards immediately
      const cardElements = Array.from(cards) as HTMLElement[];
      cardElements.forEach((card) => {
        gsap.set(card, { opacity: 1, y: 0, scale: 1 });
      });
      return;
    }

    const cardElements = Array.from(cards) as HTMLElement[];

    // Set initial state - cards are visible but transformed
    cardElements.forEach((card, index) => {
      gsap.set(card, {
        opacity: 1,
        y: 60,
        scale: 0.95
      });

      // Create scroll-triggered animation for each card
      const trigger = ScrollTrigger.create({
        trigger: card,
        start: 'top bottom-=100',
        end: 'top center',
        scrub: 1, // Smooth scrubbing effect
        onUpdate: (self) => {
          // Animate based on scroll progress
          const progress = self.progress;
          gsap.to(card, {
            y: 60 * (1 - progress),
            scale: 0.95 + (0.05 * progress),
            duration: 0.1,
            ease: 'none'
          });
        }
      });

      this.scrollTriggers.push(trigger);
    });
  }

  /**
   * Create subtle parallax effect for service cards
   * Parallax is now scroll-driven, not mousemove-driven
   */
  createParallaxEffect(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || this.prefersReducedMotion) {
      return;
    }

    const cardElements = Array.from(cards) as HTMLElement[];

    cardElements.forEach((card, index) => {
      const trigger = ScrollTrigger.create({
        trigger: card,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
        onUpdate: (self) => {
          // Subtle parallax based on scroll position
          const yOffset = (self.progress - 0.5) * 30; // Max 15px up or down
          gsap.to(card, {
            y: yOffset,
            duration: 0.1,
            ease: 'none'
          });
        }
      });

      this.scrollTriggers.push(trigger);
    });
  }

  /**
   * Create magnetic hover effects for cards
   * Implemented with vanilla DOM events and CSS variables
   */
  createMagneticHover(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser) {
      return;
    }

    const cardElements = Array.from(cards) as HTMLElement[];

    cardElements.forEach((card) => {
      const handleMouseEnter = () => {
        if (this.prefersReducedMotion) {
          gsap.to(card, { scale: 1.02, duration: 0.3 });
        } else {
          gsap.to(card, { scale: 1.05, y: -8, duration: 0.4, ease: 'power2.out' });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(card, { scale: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (this.prefersReducedMotion) {
          return;
        }

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (event.clientX - centerX) / (rect.width / 2);
        const deltaY = (event.clientY - centerY) / (rect.height / 2);

        gsap.to(card, {
          rotationX: deltaY * -3,
          rotationY: deltaX * 3,
          x: deltaX * 4,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      const handleTouchStart = () => {
        gsap.to(card, { scale: 1.02, duration: 0.2 });

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      };

      const handleTouchEnd = () => {
        gsap.to(card, { scale: 1, duration: 0.3 });
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
   * Create scroll-based section snapping with vanilla CSS adjustments
   * DISABLED per user request - no automatic snapping
   */
  createSectionSnapping(): void {
    // Snap behavior disabled per user request
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
