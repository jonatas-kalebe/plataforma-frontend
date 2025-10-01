import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ServicosAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly prefersReducedMotion: boolean;
  private observers: IntersectionObserver[] = [];
  private cleanupFns: Array<() => void> = [];

  constructor() {
    this.prefersReducedMotion = this.isBrowser
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }

  /**
   * Create staggered entrance animations for service cards
   * Uses IntersectionObserver to toggle CSS-driven transitions
   */
  createStaggeredEntrance(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser) {
      return;
    }

    const cardElements = Array.from(cards) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;

          if (entry.isIntersecting) {
            target.classList.add('is-visible');

            if (this.prefersReducedMotion) {
              target.style.setProperty('--card-stagger-delay', '0s');
            }

            obs.unobserve(target);
          }
        });
      },
      {
        threshold: this.prefersReducedMotion ? 0.1 : 0.25,
        rootMargin: '0px 0px -15% 0px'
      }
    );

    cardElements.forEach((card) => {
      card.classList.remove('is-visible');
      observer.observe(card);
    });

    this.observers.push(observer);
  }

  /**
   * Create subtle parallax effect for service cards
   * DISABLED: Can cause visual stuttering/flickering
   */
  createParallaxEffect(cards: NodeListOf<Element> | Element[]): void {
    // Parallax effect disabled to prevent flickering
    return;
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
          card.classList.add('hover-reduced');
        } else {
          card.classList.add('magnetic-hover-active');
        }
      };

      const handleMouseLeave = () => {
        card.classList.remove('magnetic-hover-active', 'hover-reduced');
        card.style.setProperty('--card-rotate-x', '0deg');
        card.style.setProperty('--card-rotate-y', '0deg');
        card.style.setProperty('--card-translate-x', '0px');
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

        card.style.setProperty('--card-rotate-x', `${deltaY * -3}deg`);
        card.style.setProperty('--card-rotate-y', `${deltaX * 3}deg`);
        card.style.setProperty('--card-translate-x', `${deltaX * 4}px`);
      };

      const handleTouchStart = () => {
        card.classList.add('touch-active');

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      };

      const handleTouchEnd = () => {
        card.classList.remove('touch-active');
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
   * DISABLED: Causing flickering issues
   */
  createSectionSnapping(): void {
    // Snap behavior disabled to prevent flickering
    // The section will scroll normally without snap effects
    return;
  }

  /**
   * Destroy all animations and clean up
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    this.cleanupFns.forEach((cleanup) => cleanup());
    this.cleanupFns = [];
  }
}
