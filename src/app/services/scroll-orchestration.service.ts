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
          this.updateMetrics();
        },
        onToggle: (self: any) => {
          section.isActive = self.isActive;
          if (self.isActive) {
            this.setActiveSection(index);
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
    });

    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      sections
    });

    this.setupGlobalProgress();
  }

  private setupGlobalProgress(): void {
    ScrollTrigger.create({
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
      }
    });
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
      this.scrollTriggers.forEach(trigger => trigger.kill());
      this.scrollTriggers = [];
      ScrollTrigger.killAll();
      this.isInitialized = false;
    }
  }
}
