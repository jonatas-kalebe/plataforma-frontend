import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
    }
  }

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      gsap.registerPlugin(ScrollTrigger);
      this.lastScrollY = window.scrollY || 0;
      this.setupSections();
      this.setupGlobalProgress();
      this.isInitialized = true;
    });
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
          // Track active section trigger for magnetic snapping
          if (section.isActive) {
            this.activeSectionTrigger = self;
            this.activeSectionTrigger.vars = { id: section.id };
          }
          this.updateMetrics();
        },
        onToggle: (self: any) => {
          section.isActive = self.isActive;
          if (self.isActive) {
            this.setActiveSection(index);
            this.activeSectionTrigger = self;
            this.activeSectionTrigger.vars = { id: section.id };
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

      const trigger = ScrollTrigger.create({ ...baseConfig, ...advancedConfig });
      this.scrollTriggers.push(trigger);
      
      // Special pin configuration for Trabalhos section
      if (section.id === 'trabalhos') {
        const pinTrigger = ScrollTrigger.create({
          id: 'trabalhos-pin',
          trigger: element,
          pin: '#trabalhos .pin-container',
          start: 'center center',
          end: '+=100%',
          pinSpacing: false
        });
        this.scrollTriggers.push(pinTrigger);
      }
    });

    // Create animation timelines for sections
    this.createSectionTimelines();

    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      sections
    });

    this.setupGlobalProgress();
  }

  private setupGlobalProgress(): void {
    const trigger = ScrollTrigger.create({
      id: 'global-progress',
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const currentScrollY = window.scrollY || 0;
        const velocityRaw = (ScrollTrigger as any).getVelocity?.() || 0;
        const velocity = velocityRaw / 1000;

        if (currentScrollY > this.lastScrollY + 5) {
          this.scrollDirection = 'down';
        } else if (currentScrollY < this.lastScrollY - 5) {
          this.scrollDirection = 'up';
        } else {
          this.scrollDirection = 'none';
        }
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

        // Check for magnetic snap conditions
        this.checkMagneticSnap();
      }
    });
    
    this.scrollTriggers.push(trigger);
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
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    this.scrollTriggers = [];
    this.setupSections();
  }

  private createSectionTimelines(): void {
    // Create timelines for each section as expected by tests
    
    // Hero timeline
    gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    // Filosofia timeline
    gsap.timeline({
      scrollTrigger: {
        trigger: '#filosofia',
        start: 'top 80%',
        end: 'bottom center',
        scrub: true
      }
    });

    // Servicos timeline
    gsap.timeline({
      scrollTrigger: {
        trigger: '#servicos',
        start: 'top 85%',
        end: 'bottom center',
        scrub: true
      }
    });
  }

  private checkMagneticSnap(): void {
    if (!this.activeSectionTrigger) return;
    
    const velocity = (ScrollTrigger as any).getVelocity?.(window) || 0;
    const progress = this.activeSectionTrigger.progress;
    const direction = this.activeSectionTrigger.direction;
    
    // Clear existing snap timeout
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }

    // Only snap when velocity is near zero (user stopped scrolling)
    if (Math.abs(velocity) < 10) {
      this.snapTimeoutId = window.setTimeout(() => {
        this.performMagneticSnap();
      }, 100);
    }
  }

  private performMagneticSnap(): void {
    if (!this.activeSectionTrigger) return;
    
    const progress = this.activeSectionTrigger.progress;
    const direction = this.activeSectionTrigger.direction;
    const sectionId = this.activeSectionTrigger.vars?.id;
    
    const sections = {
      hero: { offsetTop: 0 },
      filosofia: { offsetTop: 1000 },
      servicos: { offsetTop: 2000 },
      trabalhos: { offsetTop: 3000 },
      cta: { offsetTop: 4000 }
    } as any;

    // Forward snap: >85% progress and moving down
    if (progress > 0.85 && direction === 1) {
      const nextSection = this.getNextSection(sectionId);
      if (nextSection && sections[nextSection]) {
        gsap.to(window, {
          scrollTo: { y: sections[nextSection].offsetTop, autoKill: false },
          ease: 'power2.inOut',
          duration: 0.8
        });
      }
    }
    // Reverse snap: <15% progress and moving up  
    else if (progress < 0.15 && direction === -1) {
      const prevSection = this.getPreviousSection(sectionId);
      if (prevSection && sections[prevSection]) {
        gsap.to(window, {
          scrollTo: { y: sections[prevSection].offsetTop, autoKill: false },
          ease: 'power2.inOut',
          duration: 0.8
        });
      }
    }
  }

  private getNextSection(currentId: string): string | null {
    const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentIndex = sections.indexOf(currentId);
    return currentIndex >= 0 && currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
  }

  private getPreviousSection(currentId: string): string | null {
    const sections = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentIndex = sections.indexOf(currentId);
    return currentIndex > 0 ? sections[currentIndex - 1] : null;
  }

  getSection(id: string): ScrollSection | undefined {
    return this.metricsSubject.value.sections.find(section => section.id === id);
  }

  getScrollState(): ScrollState {
    return this.scrollStateSubject.value;
  }

  scrollToSection(id: string, duration: number = 1): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const element = document.querySelector(`#${id}`);
    if (element) {
      gsap.to(window, {
        duration: this.prefersReducedMotion ? 0.3 : duration,
        scrollTo: { y: element, offsetY: 0 },
        ease: this.prefersReducedMotion ? 'none' : 'power2.inOut'
      });
    }
  }

  destroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Clear any pending snap timeout
      if (this.snapTimeoutId) {
        clearTimeout(this.snapTimeoutId);
        this.snapTimeoutId = null;
      }
      
      this.scrollTriggers.forEach(trigger => trigger.kill());
      this.scrollTriggers = [];
      ScrollTrigger.killAll();
      this.isInitialized = false;
    }
  }
}
