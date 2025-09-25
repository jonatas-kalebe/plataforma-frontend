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

@Injectable({
  providedIn: 'root'
})
export class ScrollOrchestrationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  
  private isInitialized = false;
  private scrollTriggers: ScrollTrigger[] = [];
  private prefersReducedMotion = false;
  
  private metricsSubject = new BehaviorSubject<ScrollMetrics>({
    globalProgress: 0,
    velocity: 0,
    activeSection: 0,
    sections: []
  });

  public readonly metrics$: Observable<ScrollMetrics> = this.metricsSubject.asObservable();

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

      // Create ScrollTrigger for each section
      const trigger = ScrollTrigger.create({
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          section.progress = self.progress;
          this.updateMetrics();
        },
        onToggle: (self) => {
          section.isActive = self.isActive;
          if (self.isActive) {
            this.setActiveSection(index);
          }
          this.updateMetrics();
        },
        // Apply reduced motion settings
        ...(this.prefersReducedMotion ? {} : {
          pin: index === 0 || index === 3, // Pin hero (0) and trabalhos (3) sections for immersion
          scrub: index > 0 ? 1 : false, // Scrub for all sections except hero
          snap: {
            snapTo: 'labels',
            duration: { min: 0.2, max: 0.6 },
            delay: 0.1
          }
        })
      });

      this.scrollTriggers.push(trigger);
    });

    // Update sections in metrics
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      sections
    });

    // Setup global scroll progress
    this.setupGlobalProgress();
  }

  private setupGlobalProgress(): void {
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const velocity = (ScrollTrigger as any).getVelocity?.() || 0;
        const currentMetrics = this.metricsSubject.value;
        
        this.metricsSubject.next({
          ...currentMetrics,
          globalProgress: self.progress,
          velocity: velocity / 1000 // Normalize velocity
        });
      }
    });
  }

  private setActiveSection(index: number): void {
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      activeSection: index
    });
  }

  private updateMetrics(): void {
    // Trigger update to emit current metrics
    const current = this.metricsSubject.value;
    this.metricsSubject.next({ ...current });
  }

  private updateAnimationSettings(): void {
    // Refresh ScrollTrigger with new settings
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    this.scrollTriggers = [];
    this.setupSections();
  }

  getSection(id: string): ScrollSection | undefined {
    return this.metricsSubject.value.sections.find(section => section.id === id);
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