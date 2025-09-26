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
  activeSection: number;
  sections: ScrollSection[];
}

export interface ScrollState {
  globalProgress: number;
  velocity: number;
  activeSection: number;
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
  
  // Properties for magnetic snapping
  private activeSectionTrigger: any = null;
  private snapTimeoutId: number | null = null;

  private metricsSubject = new BehaviorSubject<ScrollMetrics>({
    globalProgress: 0,
    velocity: 0,
    activeSection: 0,
    sections: []
  });

  private scrollStateSubject = new BehaviorSubject<ScrollState>({
    globalProgress: 0,
    velocity: 0,
    activeSection: 0,
    direction: 'none'
  });

  public readonly metrics$: Observable<ScrollMetrics> = this.metricsSubject.asObservable();
  public readonly scrollState$: Observable<ScrollState> = this.scrollStateSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkReducedMotion();
      this.detectMobile();
    }
  }

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // Use window versions for testing if available, otherwise use imports
      const gsapInstance = (window as any).gsap || gsap;
      const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
      
      gsapInstance.registerPlugin(ScrollTriggerInstance, ScrollToPlugin);
      this.lastScrollY = window.scrollY || 0;
      this.setupSections();
      this.isInitialized = true;
    });
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
        if (this.isInitialized) {
          this.updateAnimationSettings();
        }
      });
    }
  }

  private setupSections(): void {
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
    const gsapInstance = (window as any).gsap || gsap;
    
    const sectionIds = ['#hero', '#filosofia', '#servicos', '#trabalhos', '#cta'];
    const sections: ScrollSection[] = [];

    sectionIds.forEach((id, index) => {
      const element = document.querySelector(id) as HTMLElement;
      if (!element) return;

      const section: ScrollSection = {
        id: id.substring(1),
        element,
        progress: 0,
        isActive: false
      };

      sections.push(section);

      const baseConfig = {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self: any) => {
          section.progress = self.progress;
          // Update active section trigger progress if this is the active section
          if (section.isActive && this.activeSectionTrigger?.vars?.id === section.id) {
            this.activeSectionTrigger.progress = self.progress;
            this.activeSectionTrigger.direction = self.direction || 1;
          }
          this.updateMetrics();
        },
        onToggle: (self: any) => {
          section.isActive = self.isActive;
          if (self.isActive) {
            this.setActiveSection(index);
            // Set this as the active section trigger for magnetic snapping
            this.activeSectionTrigger = {
              progress: self.progress,
              direction: self.direction || 1,
              vars: { id: section.id },
              start: self.start,
              end: self.end
            };
          }
          this.updateMetrics();
        }
      };

      // Sem pin aqui para evitar pin duplo e espaçadores extras
      const advancedConfig = this.prefersReducedMotion ? {} : {
        scrub: true,
        snap: {
          snapTo: (progress: number) => {
            const snapPoints = [0, 1];
            const threshold = 0.15;
            const k = 0.3 + Math.pow(Math.abs(0.5 - progress), 2);
            for (const point of snapPoints) {
              if (Math.abs(progress - point) < threshold * k) {
                return point;
              }
            }
            return progress;
          },
          duration: { min: 0.3, max: 0.8 },
          delay: 0.1,
          ease: 'power2.inOut'
        }
      };

      const trigger = ScrollTriggerInstance.create({ ...baseConfig, ...advancedConfig });
      this.scrollTriggers.push(trigger);

      // Note: Pin behavior for trabalhos will be handled by the work-card-ring component

      // Create animation timelines for specific sections
      if (id === '#hero') {
        const heroTimeline = gsapInstance.timeline({
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        });
        // Store timeline for cleanup if needed
      }

      if (id === '#filosofia') {
        const filosofiaTimeline = gsapInstance.timeline({
          scrollTrigger: {
            trigger: '#filosofia',
            start: 'top center',
            end: 'bottom top',
            scrub: 1
          }
        });
        // Store timeline for cleanup if needed
      }

      if (id === '#servicos') {
        const servicosTimeline = gsapInstance.timeline({
          scrollTrigger: {
            trigger: '#servicos',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });
        // Store timeline for cleanup if needed
      }
    });

    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      sections
    });

    this.setupGlobalProgress();
  }

  private setupGlobalProgress(): void {
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
    
    const globalTrigger = ScrollTriggerInstance.create({
      id: 'global-progress',
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self: any) => {
        const currentScrollY = window.scrollY || 0;
        const velocityRaw = Math.abs(currentScrollY - this.lastScrollY);
        const velocity = velocityRaw / 1000;

        if (currentScrollY > this.lastScrollY + 5) {
          this.scrollDirection = 'down';
        } else if (currentScrollY < this.lastScrollY - 5) {
          this.scrollDirection = 'up';
        } else {
          this.scrollDirection = 'none';
        }
        
        // Update lastScrollY after velocity calculation
        this.lastScrollY = currentScrollY;

        const currentMetrics = this.metricsSubject.value;

        this.metricsSubject.next({
          ...currentMetrics,
          globalProgress: self.progress,
          velocity: Math.abs(velocity)
        });

        this.scrollStateSubject.next({
          globalProgress: self.progress,
          velocity: Math.abs(velocity),
          activeSection: currentMetrics.activeSection,
          direction: this.scrollDirection
        });

        // Update active section trigger based on current scroll position
        this.updateActiveSectionTrigger(currentScrollY);

        // Magnetic snapping logic
        this.checkMagneticSnap();
      }
    });
    
    this.scrollTriggers.push(globalTrigger);
  }

  private updateActiveSectionTrigger(currentScrollY: number): void {
    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    
    // Find which section contains the current scroll position
    for (const sectionId of sectionOrder) {
      const element = document.querySelector(`#${sectionId}`) as HTMLElement;
      if (!element) continue;
      
      const sectionTop = element.offsetTop;
      const sectionHeight = element.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      
      // Check if scroll position is within this section
      if (currentScrollY >= sectionTop && currentScrollY < sectionBottom) {
        // Calculate accurate progress within this section
        const sectionProgress = (currentScrollY - sectionTop) / sectionHeight;
        
        this.activeSectionTrigger = {
          progress: sectionProgress,
          direction: currentScrollY > this.lastScrollY ? 1 : -1,
          vars: { id: sectionId },
          start: sectionTop,
          end: sectionBottom
        };
        
        console.log(`Active section: ${sectionId}, progress: ${sectionProgress.toFixed(3)}, direction: ${this.activeSectionTrigger.direction}`);
        break;
      }
    }
  }

  private checkMagneticSnap(): void {
    if (!this.activeSectionTrigger) return;

    // Calculate velocity properly
    const currentScrollY = window.scrollY || 0;
    const velocity = Math.abs(currentScrollY - this.lastScrollY);
    const progress = this.activeSectionTrigger.progress || 0;
    const direction = currentScrollY > this.lastScrollY ? 1 : -1;

    // Clear existing snap timeout
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }

    // Only snap when velocity is near zero (user stopped scrolling)
    if (velocity < 2) { // Very low threshold for stopped scrolling
      const delay = this.isMobile ? 150 : 100;
      this.snapTimeoutId = window.setTimeout(() => {
        this.performMagneticSnap();
      }, delay);
    }
  }

  private performMagneticSnap(): void {
    if (!this.activeSectionTrigger) return;

    const gsapInstance = (window as any).gsap || gsap;
    const progress = this.activeSectionTrigger.progress || 0;
    const currentScrollY = window.scrollY || 0;
    const direction = currentScrollY > this.lastScrollY ? 1 : -1;
    const sectionId = this.activeSectionTrigger.vars?.id;

    console.log('Performing magnetic snap check:', { progress, direction, sectionId });

    // Snap forward if progress > 85% and scrolling down
    if (progress > 0.85 && direction === 1) {
      const nextSectionElement = this.getNextSectionElement(sectionId);
      if (nextSectionElement) {
        console.log('Snapping to next section:', nextSectionElement.id);
        gsapInstance.to(window, {
          scrollTo: { y: nextSectionElement.offsetTop, autoKill: false },
          ease: 'power2.inOut',
          duration: 0.8
        });
      }
    }
    // Snap backward if progress < 15% and scrolling up
    else if (progress < 0.15 && direction === -1) {
      const prevSectionElement = this.getPrevSectionElement(sectionId);
      if (prevSectionElement) {
        console.log('Snapping to previous section:', prevSectionElement.id);
        gsapInstance.to(window, {
          scrollTo: { y: prevSectionElement.offsetTop, autoKill: false },
          ease: 'power2.inOut',
          duration: 0.8
        });
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

  private setActiveSection(index: number): void {
    const currentMetrics = this.metricsSubject.value;
    const currentScrollState = this.scrollStateSubject.value;

    this.metricsSubject.next({
      ...currentMetrics,
      activeSection: index
    });

    this.scrollStateSubject.next({
      ...currentScrollState,
      activeSection: index
    });
  }

  private updateMetrics(): void {
    const current = this.metricsSubject.value;
    this.metricsSubject.next({ ...current });
  }

  private updateAnimationSettings(): void {
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
    ScrollTriggerInstance.getAll().forEach((trigger: any) => trigger.kill());
    this.scrollTriggers = [];
    this.setupSections();
  }

  getSection(id: string): ScrollSection | undefined {
    const sections = this.metricsSubject.value.sections || [];
    return sections.find(section => section.id === id);
  }

  getScrollState(): ScrollState {
    return this.scrollStateSubject.value;
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
      const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
      
      // Clean up snap timeout
      if (this.snapTimeoutId) {
        clearTimeout(this.snapTimeoutId);
        this.snapTimeoutId = null;
      }
      
      this.scrollTriggers.forEach(trigger => trigger.kill());
      this.scrollTriggers = [];
      ScrollTriggerInstance.killAll();
      this.isInitialized = false;
      this.activeSectionTrigger = null;
    }
  }
}
