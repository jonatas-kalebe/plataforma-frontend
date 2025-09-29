/**
 * Native Animation Class
 * Replaces GSAP functionality with native HTML, CSS and TypeScript
 */

export interface NativeAnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  x?: number;
  y?: number;
  scale?: number;
  opacity?: number;
  rotate?: number;
}

export interface ScrollTriggerConfig {
  trigger: string | Element;
  start?: string;
  end?: string;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}

/**
 * Native animation system that replaces GSAP with Web APIs
 */
export class NativeAnimation {
  private observers: IntersectionObserver[] = [];
  private animationFrames: number[] = [];
  private prefersReducedMotion: boolean;

  constructor() {
    this.prefersReducedMotion = this.checkReducedMotion();
  }

  /**
   * Check if user prefers reduced motion
   */
  private checkReducedMotion(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }

  /**
   * Animate element to specified values using native CSS transitions
   */
  public animateTo(selector: string | Element, config: NativeAnimationConfig): Promise<void> {
    const elements = this.getElements(selector);
    if (elements.length === 0) return Promise.resolve();

    const duration = this.prefersReducedMotion ? 0.3 : (config.duration || 0.6);
    const easing = this.prefersReducedMotion ? 'ease' : (config.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)');

    return new Promise(resolve => {
      elements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        
        // Set transition
        htmlElement.style.transition = `all ${duration}s ${easing}`;
        
        // Apply delay if specified
        if (config.delay) {
          htmlElement.style.transitionDelay = `${config.delay * index}s`;
        }

        // Apply transforms
        const transforms: string[] = [];
        if (config.x !== undefined) transforms.push(`translateX(${config.x}px)`);
        if (config.y !== undefined) transforms.push(`translateY(${config.y}px)`);
        if (config.scale !== undefined) transforms.push(`scale(${config.scale})`);
        if (config.rotate !== undefined) transforms.push(`rotate(${config.rotate}deg)`);

        if (transforms.length > 0) {
          htmlElement.style.transform = transforms.join(' ');
        }

        // Apply opacity
        if (config.opacity !== undefined) {
          htmlElement.style.opacity = config.opacity.toString();
        }

        // Resolve after animation completes
        if (index === elements.length - 1) {
          setTimeout(() => resolve(), (duration + (config.delay || 0)) * 1000);
        }
      });
    });
  }

  /**
   * Animate element from specified values using native CSS transitions
   */
  public animateFrom(selector: string | Element, config: NativeAnimationConfig): Promise<void> {
    const elements = this.getElements(selector);
    if (elements.length === 0) return Promise.resolve();

    const duration = this.prefersReducedMotion ? 0.3 : (config.duration || 0.6);
    const easing = this.prefersReducedMotion ? 'ease' : (config.easing || 'cubic-bezier(0.4, 0.0, 0.2, 1)');

    return new Promise(resolve => {
      elements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;

        // Set initial state immediately
        const transforms: string[] = [];
        if (config.x !== undefined) transforms.push(`translateX(${config.x}px)`);
        if (config.y !== undefined) transforms.push(`translateY(${config.y}px)`);
        if (config.scale !== undefined) transforms.push(`scale(${config.scale})`);
        if (config.rotate !== undefined) transforms.push(`rotate(${config.rotate}deg)`);

        if (transforms.length > 0) {
          htmlElement.style.transform = transforms.join(' ');
        }

        if (config.opacity !== undefined) {
          htmlElement.style.opacity = config.opacity.toString();
        }

        // Set transition
        htmlElement.style.transition = `all ${duration}s ${easing}`;
        
        // Apply delay if specified
        if (config.delay) {
          htmlElement.style.transitionDelay = `${config.delay * index}s`;
        }

        // Animate to final state on next frame
        requestAnimationFrame(() => {
          htmlElement.style.transform = 'translateX(0) translateY(0) scale(1) rotate(0deg)';
          htmlElement.style.opacity = '1';
        });

        // Resolve after animation completes
        if (index === elements.length - 1) {
          setTimeout(() => resolve(), (duration + (config.delay || 0)) * 1000);
        }
      });
    });
  }

  /**
   * Create scroll-triggered animations using Intersection Observer
   */
  public createScrollTrigger(config: ScrollTriggerConfig): void {
    const element = this.getElements(config.trigger)[0];
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            config.onEnter?.();
          } else {
            config.onLeave?.();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: config.start === 'top 85%' ? '-15% 0px -85% 0px' : '0px'
      }
    );

    observer.observe(element);
    this.observers.push(observer);
  }

  /**
   * Create staggered animations with CSS delays
   */
  public animateStagger(selector: string, config: NativeAnimationConfig & { stagger?: number }): Promise<void> {
    const elements = this.getElements(selector);
    if (elements.length === 0) return Promise.resolve();

    const stagger = config.stagger || 0.1;
    const promises: Promise<void>[] = [];

    elements.forEach((element, index) => {
      const elementConfig = {
        ...config,
        delay: (config.delay || 0) + (stagger * index)
      };
      
      const promise = this.animateFrom(element, elementConfig);
      promises.push(promise);
    });

    return Promise.all(promises).then(() => {});
  }

  /**
   * Set initial state for elements (equivalent to gsap.set)
   */
  public set(selector: string | Element, config: NativeAnimationConfig): void {
    const elements = this.getElements(selector);
    
    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      
      // Apply transforms immediately
      const transforms: string[] = [];
      if (config.x !== undefined) transforms.push(`translateX(${config.x}px)`);
      if (config.y !== undefined) transforms.push(`translateY(${config.y}px)`);
      if (config.scale !== undefined) transforms.push(`scale(${config.scale})`);
      if (config.rotate !== undefined) transforms.push(`rotate(${config.rotate}deg)`);

      if (transforms.length > 0) {
        htmlElement.style.transform = transforms.join(' ');
      }

      if (config.opacity !== undefined) {
        htmlElement.style.opacity = config.opacity.toString();
      }
    });
  }

  /**
   * Helper to get elements from selector
   */
  private getElements(selector: string | Element): Element[] {
    if (typeof selector === 'string') {
      return Array.from(document.querySelectorAll(selector));
    }
    return [selector];
  }

  /**
   * Cleanup all observers and animations
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
    this.animationFrames = [];
  }
}