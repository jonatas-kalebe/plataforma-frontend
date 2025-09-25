import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface ScrollState {
  globalProgress: number;
  velocity: number;
  currentSection: number;
  sectionsProgress: Record<string, number>;
  isReducedMotion: boolean;
}

export interface SectionConfig {
  id: string;
  element?: HTMLElement;
  timeline?: gsap.core.Timeline;
  pin?: boolean;
  snap?: boolean;
  scrub?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollOrchestratorService {
  private readonly scrollState$ = new BehaviorSubject<ScrollState>({
    globalProgress: 0,
    velocity: 0,
    currentSection: 0,
    sectionsProgress: {},
    isReducedMotion: false
  });

  private readonly velocity$ = new Subject<number>();
  private sections: SectionConfig[] = [];
  private lastScrollTime = 0;
  private lastScrollY = 0;
  private velocitySmooth = 0;
  private debounceTimer?: number;
  private isInitialized = false;

  readonly scrollState = this.scrollState$.asObservable();
  readonly velocity = this.velocity$.asObservable();

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);
    }
  }

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) return;

    this.ngZone.runOutsideAngular(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const isReducedMotion = mediaQuery.matches;
      
      this.updateScrollState({
        isReducedMotion
      });

      this.setupScrollTriggers();
      this.isInitialized = true;
    });
  }

  registerSection(config: SectionConfig): void {
    this.sections.push(config);
  }

  private setupScrollTriggers(): void {
    this.sections.forEach((section, index) => {
      const element = document.getElementById(section.id);
      if (!element) return;

      section.element = element;
      
      ScrollTrigger.create({
        trigger: element,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => this.updateCurrentSection(index),
        onEnterBack: () => this.updateCurrentSection(index),
        onUpdate: (self) => {
          const progress = self.progress;
          this.updateSectionProgress(section.id, progress);
          this.updateVelocity(self.getVelocity());
        }
      });

      const currentState = this.scrollState$.value;
      if (!currentState.isReducedMotion) {
        if (section.pin) {
          ScrollTrigger.create({
            trigger: element,
            start: 'top top',
            end: 'bottom top',
            pin: true
          });
        }

        if (section.snap) {
          ScrollTrigger.create({
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            snap: {
              snapTo: [0, 1],
              duration: { min: 0.2, max: 0.6 },
              delay: 0.1
            }
          });
        }
      }
    });

    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        this.updateScrollState({
          globalProgress: self.progress
        });
      }
    });
  }

  getVelocity(): number {
    return this.velocitySmooth;
  }

  private updateVelocity(rawVelocity: number): void {
    const now = performance.now();
    const deltaTime = now - this.lastScrollTime;
    
    if (deltaTime > 16) {
      this.velocitySmooth = gsap.utils.interpolate(this.velocitySmooth, rawVelocity, 0.1);
      
      this.ngZone.run(() => {
        this.velocity$.next(this.velocitySmooth);
      });
      
      this.lastScrollTime = now;
    }

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.ngZone.run(() => {
        this.velocity$.next(0);
      });
      this.velocitySmooth = 0;
    }, 100);
  }

  private updateCurrentSection(index: number): void {
    this.updateScrollState({
      currentSection: index
    });
  }

  private updateSectionProgress(sectionId: string, progress: number): void {
    const currentState = this.scrollState$.value;
    this.updateScrollState({
      sectionsProgress: {
        ...currentState.sectionsProgress,
        [sectionId]: progress
      }
    });
  }

  private updateScrollState(partialState: Partial<ScrollState>): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        const currentState = this.scrollState$.value;
        this.scrollState$.next({
          ...currentState,
          ...partialState
        });
      });
    }, 0);
  }

  destroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      ScrollTrigger.getAll().forEach(st => st.kill());
      this.scrollState$.complete();
      this.velocity$.complete();
    }
  }
}