/**
 * Native Scroll Animation Service
 * Replaces GSAP ScrollTrigger with Intersection Observer and native scroll events
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NativeAnimation, NativeAnimationConfig, ScrollTriggerConfig } from './native-animation.class';

export interface ScrollAnimationConfig extends NativeAnimationConfig {
  selector: string;
  trigger?: string | Element;
  threshold?: number;
  rootMargin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NativeScrollAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private nativeAnimation: NativeAnimation;
  private scrollListeners: Array<{ element: Element, handler: () => void }> = [];
  private animatedElements = new Set<Element>();

  constructor() {
    this.nativeAnimation = new NativeAnimation();
  }

  /**
   * Create scroll-triggered fade-in animation
   */
  public createFadeInOnScroll(config: ScrollAnimationConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const elements = this.getElements(config.selector);
    if (elements.length === 0) return;

    // Set initial state
    this.nativeAnimation.set(config.selector, {
      opacity: 0,
      y: config.y || 40
    });

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            this.animatedElements.add(entry.target);
            
            // Animate element
            this.nativeAnimation.animateTo(entry.target, {
              opacity: 1,
              y: 0,
              duration: config.duration || 0.8,
              easing: config.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)'
            });
          }
        });
      },
      {
        threshold: config.threshold || 0.1,
        rootMargin: config.rootMargin || '0px 0px -10% 0px'
      }
    );

    elements.forEach(element => observer.observe(element));
  }

  /**
   * Create staggered scroll-triggered animations
   */
  public createStaggeredScrollAnimation(config: ScrollAnimationConfig & { stagger?: number }): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const elements = this.getElements(config.selector);
    if (elements.length === 0) return;

    const stagger = config.stagger || 0.1;

    // Set initial state for all elements
    this.nativeAnimation.set(config.selector, {
      opacity: 0,
      y: config.y || 40
    });

    // Create intersection observer for the container or first element
    const triggerElement = config.trigger ? 
      this.getElements(config.trigger)[0] : 
      elements[0];

    if (!triggerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
            this.animatedElements.add(entry.target);
            
            // Animate all elements with stagger
            elements.forEach((element, index) => {
              setTimeout(() => {
                this.nativeAnimation.animateTo(element, {
                  opacity: 1,
                  y: 0,
                  duration: config.duration || 0.8,
                  easing: config.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)'
                });
              }, stagger * index * 1000);
            });
          }
        });
      },
      {
        threshold: config.threshold || 0.1,
        rootMargin: config.rootMargin || '0px 0px -15% 0px'
      }
    );

    observer.observe(triggerElement);
  }

  /**
   * Create hover animations using CSS transitions
   */
  public setupHoverAnimation(selector: string, hoverConfig: NativeAnimationConfig): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const elements = this.getElements(selector);
    
    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      
      // Set transition
      htmlElement.style.transition = `transform ${hoverConfig.duration || 0.3}s ${hoverConfig.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)'}`;
      
      // Add hover listeners
      htmlElement.addEventListener('mouseenter', () => {
        const transforms: string[] = [];
        if (hoverConfig.scale !== undefined) transforms.push(`scale(${hoverConfig.scale})`);
        if (hoverConfig.y !== undefined) transforms.push(`translateY(${hoverConfig.y}px)`);
        if (hoverConfig.x !== undefined) transforms.push(`translateX(${hoverConfig.x}px)`);
        
        htmlElement.style.transform = transforms.join(' ');
      });

      htmlElement.addEventListener('mouseleave', () => {
        htmlElement.style.transform = 'scale(1) translateX(0) translateY(0)';
      });
    });
  }

  /**
   * Create parallax effect using scroll events
   */
  public createParallaxEffect(selector: string, speed: number = 0.5): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const elements = this.getElements(selector);
    if (elements.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.pageYOffset;
      
      elements.forEach(element => {
        const htmlElement = element as HTMLElement;
        const elementTop = htmlElement.offsetTop;
        const elementHeight = htmlElement.offsetHeight;
        const windowHeight = window.innerHeight;
        
        // Check if element is in viewport
        if (scrollY + windowHeight > elementTop && scrollY < elementTop + elementHeight) {
          const yPos = (scrollY - elementTop) * speed;
          htmlElement.style.transform = `translate3d(0, ${yPos}px, 0)`;
        }
      });
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Store listener for cleanup
    this.scrollListeners.push({
      element: window as any,
      handler: throttledScroll
    });
  }

  /**
   * Smooth scroll to element without GSAP ScrollToPlugin
   */
  public scrollToElement(selector: string, duration: number = 1000): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = this.getElements(selector)[0];
    if (!element) return;

    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Easing function (ease out)
      const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }

  /**
   * Helper method to get elements
   */
  private getElements(selector: string | Element): Element[] {
    if (typeof selector === 'string') {
      return Array.from(document.querySelectorAll(selector));
    }
    return [selector];
  }

  /**
   * Cleanup all observers and listeners
   */
  public destroy(): void {
    this.nativeAnimation.destroy();
    
    // Remove scroll listeners
    this.scrollListeners.forEach(({ element, handler }) => {
      if (element === window) {
        window.removeEventListener('scroll', handler);
      } else {
        element.removeEventListener('scroll', handler);
      }
    });
    this.scrollListeners = [];
    this.animatedElements.clear();
  }
}