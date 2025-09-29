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
   * Driven by scroll position instead of GSAP
   */
  createParallaxEffect(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || this.prefersReducedMotion) {
      return;
    }

    const cardElements = Array.from(cards) as HTMLElement[];
    const section = document.getElementById('servicos');

    if (!section || cardElements.length === 0) {
      return;
    }

    const updateParallax = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const totalDistance = rect.height + viewportHeight;
      const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / totalDistance));

      cardElements.forEach((card, index) => {
        const speed = 1 + index * 0.1;
        const baseMove = (progress - 0.5) * 20 * speed;
        const extraDrift = progress > 0.5 ? (progress - 0.5) * 30 : 0;
        const totalMove = baseMove - extraDrift;

        card.style.setProperty('--card-parallax', `${totalMove}px`);
        card.style.setProperty('--card-rotate-x', `${(progress - 0.5) * 1.5}deg`);
      });
    };

    let ticking = false;
    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          updateParallax();
          ticking = false;
        });
      }
    };

    requestUpdate();

    const onScroll = () => requestUpdate();
    const onResize = () => requestUpdate();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    this.cleanupFns.push(() => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
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
   */
  createSectionSnapping(): void {
    if (!this.isBrowser || this.prefersReducedMotion) {
      return;
    }

    const section = document.getElementById('servicos');

    if (!section) {
      return;
    }

    const root = document.documentElement;
    const initialSnapType = root.style.scrollSnapType;
    const initialSnapAlign = section.style.scrollSnapAlign;
    const initialSnapStop = section.style.scrollSnapStop;

    if (!initialSnapType) {
      root.style.scrollSnapType = 'y proximity';
    }

    if (!initialSnapAlign) {
      section.style.scrollSnapAlign = 'center';
    }

    if (!initialSnapStop) {
      section.style.scrollSnapStop = 'always';
    }

    section.classList.add('servicos-snapping');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
            section.classList.add('is-focused');
          } else {
            section.classList.remove('is-focused');
          }
        });
      },
      {
        threshold: [0.45, 0.9]
      }
    );

    observer.observe(section);
    this.observers.push(observer);

    this.cleanupFns.push(() => {
      section.classList.remove('servicos-snapping', 'is-focused');

      if (!initialSnapType) {
        root.style.removeProperty('scrollSnapType');
      } else {
        root.style.scrollSnapType = initialSnapType;
      }

      if (!initialSnapAlign) {
        section.style.removeProperty('scrollSnapAlign');
      } else {
        section.style.scrollSnapAlign = initialSnapAlign;
      }

      if (!initialSnapStop) {
        section.style.removeProperty('scrollSnapStop');
      } else {
        section.style.scrollSnapStop = initialSnapStop;
      }
    });
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
