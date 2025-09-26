import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

export interface ScrollSection {
  id: string;
  element?: HTMLElement;
  progress: number;
  isActive: boolean;
}

export interface ScrollMetrics {
  globalProgress: number;
  velocity: number;
  activeSection: ScrollSection | null;
  sections: ScrollSection[];
}

export interface ScrollState {
  globalProgress: number;
  velocity: number;
  activeSection: ScrollSection | null;
  direction: 'up' | 'down' | 'none';
}

@Injectable({
  providedIn: 'root'
})
export class ScrollOrchestrationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private isInitialized = false;
  private scrollTriggers: ScrollTrigger[] = [];
  private prefersReducedMotion = false;
  private lastScrollY = 0;
  private scrollDirection: 'up' | 'down' | 'none' = 'none';
  private isMobile = false;

  // Properties for magnetic snapping - simplified approach
  private snapTimeoutId: number | null = null;
  private lastScrollTime = 0;
  private velocity = 0;

  private metricsSubject = new BehaviorSubject<ScrollMetrics>({
    globalProgress: 0,
    velocity: 0,
    activeSection: null,
    sections: []
  });

  private scrollStateSubject = new BehaviorSubject<ScrollState>({
    globalProgress: 0,
    velocity: 0,
    activeSection: null,
    direction: 'none'
  });

  public readonly metrics$: Observable<ScrollMetrics> = this.metricsSubject.asObservable();
  public readonly scrollState$: Observable<ScrollState> = this.scrollStateSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkReducedMotion();
      this.detectMobile();
      
      // Auto-initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => this.autoInitialize(), 1000);
        });
      } else {
        setTimeout(() => this.autoInitialize(), 1000);
      }
    }
  }

  // Auto initialization method
  private autoInitialize(): void {
    console.log('ScrollOrchestrationService: autoInitialize called');
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      console.log('ScrollOrchestrationService: initialize called but skipped', { 
        isPlatformBrowser: isPlatformBrowser(this.platformId), 
        isInitialized: this.isInitialized 
      });
      return;
    }

    console.log('ScrollOrchestrationService: Initializing...');
    
    this.ngZone.runOutsideAngular(() => {
      const gsapInstance = (window as any).gsap || gsap;
      const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;

      console.log('ScrollOrchestrationService: GSAP/ScrollTrigger available:', { 
        gsap: !!gsapInstance, 
        scrollTrigger: !!ScrollTriggerInstance 
      });

      if (!gsapInstance || !ScrollTriggerInstance) {
        console.error('ScrollOrchestrationService: GSAP or ScrollTrigger not available');
        return;
      }

      gsapInstance.registerPlugin(ScrollTriggerInstance, ScrollToPlugin);
      this.lastScrollY = window.scrollY || 0;
      
      // Use simplified magnetic scroll approach
      this.setupSimplifiedMagneticScroll();
      this.isInitialized = true;
      
      console.log('ScrollOrchestrationService: Successfully initialized with simplified magnetic scroll');
    });
  }

  // Simplified magnetic scroll implementation based on working prototype
  private setupSimplifiedMagneticScroll(): void {
    let rafId: number | null = null;
    
    const handleScroll = () => {
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        this.updateScrollState();
        this.checkMagneticSnapSimplified();
        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    console.log('ScrollOrchestrationService: Simplified scroll listener set up');
  }

  private updateScrollState(): void {
    const currentScrollY = window.scrollY;
    const currentTime = Date.now();
    const deltaTime = Math.max(currentTime - this.lastScrollTime, 1);
    const deltaScroll = Math.abs(currentScrollY - this.lastScrollY);
    
    this.velocity = (deltaScroll / deltaTime) * 1000;
    this.lastScrollY = currentScrollY;
    this.lastScrollTime = currentTime;
    
    // Update scroll direction
    if (currentScrollY > this.lastScrollY + 5) {
      this.scrollDirection = 'down';
    } else if (currentScrollY < this.lastScrollY - 5) {
      this.scrollDirection = 'up';
    } else {
      this.scrollDirection = 'none';
    }
  }

  private getCurrentSection(): any {
    const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentScrollY = window.scrollY;
    
    for (const sectionId of sections) {
      const element = document.querySelector(`#${sectionId}`) as HTMLElement;
      if (!element) continue;
      
      const sectionTop = element.offsetTop;
      const sectionHeight = element.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      
      if (currentScrollY >= sectionTop && currentScrollY < sectionBottom) {
        const progress = (currentScrollY - sectionTop) / sectionHeight;
        return {
          id: sectionId,
          element: element,
          progress: progress,
          top: sectionTop,
          height: sectionHeight
        };
      }
    }
    
    return null;
  }

  private checkMagneticSnapSimplified(): void {
    const currentSection = this.getCurrentSection();
    if (!currentSection || currentSection.id === 'trabalhos' || this.prefersReducedMotion) return;
    
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
    
    // Only snap when velocity is low
    if (this.velocity < 500) {
      this.snapTimeoutId = window.setTimeout(() => {
        this.performMagneticSnapSimplified(currentSection);
      }, this.isMobile ? 250 : 150);
    }
  }

  private performMagneticSnapSimplified(currentSection: any): void {
    const progress = currentSection.progress;
    
    console.log('ScrollOrchestrationService: performMagneticSnap', {
      section: currentSection.id,
      progress: progress,
      forwardSnap: progress >= 0.85,
      backwardSnap: progress <= 0.15
    });
    
    const gsapInstance = (window as any).gsap || gsap;
    
    // Forward snap at 85%
    if (progress >= 0.85) {
      const nextSection = this.getNextSectionElement(currentSection.id);
      if (nextSection) {
        console.log('ScrollOrchestrationService: Forward snap to', nextSection.id);
        gsapInstance.to(window, {
          scrollTo: { y: nextSection.offsetTop },
          ease: 'power2.inOut',
          duration: 0.8
        });
        return;
      }
    }
    
    // Backward snap at 15%
    if (progress <= 0.15 && this.velocity > 0) {
      const prevSection = this.getPrevSectionElement(currentSection.id);
      if (prevSection) {
        console.log('ScrollOrchestrationService: Backward snap to', prevSection.id);
        gsapInstance.to(window, {
          scrollTo: { y: prevSection.offsetTop },
          ease: 'power2.inOut',
          duration: 0.8
        });
        return;
      }
    }
  }

  private getNextSectionElement(currentSectionId: string): HTMLElement | null {
    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentIndex = sectionOrder.indexOf(currentSectionId);
    if (currentIndex >= 0 && currentIndex < sectionOrder.length - 1) {
      const nextSectionId = sectionOrder[currentIndex + 1];
      return document.querySelector(`#${nextSectionId}`) as HTMLElement;
    }
    return null;
  }

  private getPrevSectionElement(currentSectionId: string): HTMLElement | null {
    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentIndex = sectionOrder.indexOf(currentSectionId);
    if (currentIndex > 0) {
      const prevSectionId = sectionOrder[currentIndex - 1];
      return document.querySelector(`#${prevSectionId}`) as HTMLElement;
    }
    return null;
  }

  private detectMobile(): void {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;

      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
      });
    }
  }

  // Simplified public API
  getMetrics(): ScrollMetrics {
    return this.metricsSubject.value;
  }

  getScrollState(): ScrollState {
    return this.scrollStateSubject.value;
  }

  getSection(id: string): ScrollSection | undefined {
    // For compatibility with existing components
    // Return a simple section object based on DOM element
    const element = document.querySelector(`#${id}`) as HTMLElement;
    if (element) {
      return {
        id: id,
        element: element,
        progress: 0,
        isActive: false
      };
    }
    return undefined;
  }

  scrollToSection(id: string, duration: number = 1): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const gsapInstance = (window as any).gsap || gsap;
    const element = document.querySelector(`#${id}`);
    if (element) {
      const scrollToConfig = {
        duration: this.prefersReducedMotion ? 0.3 : duration,
        ease: this.prefersReducedMotion ? 'none' : 'power2.inOut',
        scrollTo: { y: element, offsetY: 0, autoKill: false }
      };

      gsapInstance.to(window, scrollToConfig);
    }
  }

  destroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.snapTimeoutId) {
        clearTimeout(this.snapTimeoutId);
        this.snapTimeoutId = null;
      }

      this.scrollTriggers.forEach(trigger => trigger.kill());
      this.scrollTriggers = [];
      this.isInitialized = false;
    }
  }
}