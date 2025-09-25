import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject, fromEvent, EMPTY } from 'rxjs';
import { throttleTime, debounceTime } from 'rxjs/operators';

let gsap: any;
let ScrollTrigger: any;
let ScrollToPlugin: any;

if (typeof window !== 'undefined') {
  import('gsap').then(g => {
    gsap = g.default || g;
    return Promise.all([
      import('gsap/ScrollTrigger'),
      import('gsap/ScrollToPlugin')
    ]);
  }).then(([st, stp]) => {
    ScrollTrigger = st.ScrollTrigger;
    ScrollToPlugin = stp.ScrollToPlugin;
    if (gsap) {
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    }
  });
}

export interface ScrollState {
  globalProgress: number;
  sectionIndex: number;
  sectionProgress: number;
  velocity: number;
  isSnapping: boolean;
  prefersReducedMotion: boolean;
}

export interface SectionConfig {
  id: string;
  element?: HTMLElement;
  pin?: boolean;
  snap?: boolean;
  snapPoint?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollOrchestratorService {
  private readonly isBrowser: boolean;
  
  private readonly sections: SectionConfig[] = [
    { id: 'hero', pin: true, snap: true, snapPoint: 0 },
    { id: 'filosofia', snap: true, snapPoint: 0.25 },
    { id: 'servicos', snap: true, snapPoint: 0.5 },
    { id: 'trabalhos', pin: true, snap: true, snapPoint: 0.75 },
    { id: 'cta', snap: true, snapPoint: 1 }
  ];

  private readonly globalProgress$ = new BehaviorSubject<number>(0);
  private readonly sectionProgress$ = new BehaviorSubject<number>(0);
  private readonly velocity$ = new BehaviorSubject<number>(0);
  private readonly sectionIndex$ = new BehaviorSubject<number>(0);
  private readonly scrollState$ = new BehaviorSubject<ScrollState>({
    globalProgress: 0,
    sectionIndex: 0,
    sectionProgress: 0,
    velocity: 0,
    isSnapping: false,
    prefersReducedMotion: false
  });

  private scrollTriggers: ScrollTrigger[] = [];
  private lastScrollY = 0;
  private lastScrollTime = 0;
  private currentVelocity = 0;
  private snapTween?: gsap.core.Tween;
  private prefersReducedMotion = false;
  private isInitialized = false;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.detectReducedMotion();
    }
  }

  get globalProgress() { return this.globalProgress$.asObservable(); }
  get sectionProgress() { return this.sectionProgress$.asObservable(); }
  get velocity() { return this.velocity$.asObservable(); }
  get sectionIndex() { return this.sectionIndex$.asObservable(); }
  get scrollState() { return this.scrollState$.asObservable(); }

  initialize(): void {
    if (this.isInitialized || !this.isBrowser || !gsap || !ScrollTrigger) return;

    this.ngZone.runOutsideAngular(() => {
      this.setupSections();
      this.setupVelocityTracking();
      this.setupSnapBehavior();
      this.isInitialized = true;
    });
  }

  destroy(): void {
    if (!this.isBrowser || !ScrollTrigger) return;
    
    this.scrollTriggers.forEach(st => st.kill());
    this.scrollTriggers = [];
    if (this.snapTween) this.snapTween.kill();
    this.isInitialized = false;
  }

  getVelocity(): number {
    return this.currentVelocity;
  }

  private detectReducedMotion(): void {
    if (!this.isBrowser) return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = mediaQuery.matches;
    
    mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      this.updateScrollState();
    });
  }

  private setupSections(): void {
    if (!this.isBrowser || !ScrollTrigger) return;
    
    this.sections.forEach((section, index) => {
      const element = document.getElementById(section.id);
      if (!element) return;

      section.element = element;

      if (!this.prefersReducedMotion && section.pin) {
        const st = ScrollTrigger.create({
          trigger: element,
          start: 'top top',
          end: 'bottom top',
          pin: true,
          pinSpacing: false,
          scrub: 1,
          onUpdate: (self: any) => this.updateProgress(index, self.progress),
          onToggle: (self: any) => {
            if (self.isActive) this.sectionIndex$.next(index);
          }
        });
        this.scrollTriggers.push(st);
      } else {
        const st = ScrollTrigger.create({
          trigger: element,
          start: 'top 80%',
          end: 'bottom 20%',
          onUpdate: (self: any) => this.updateProgress(index, self.progress),
          onToggle: (self: any) => {
            if (self.isActive) this.sectionIndex$.next(index);
          }
        });
        this.scrollTriggers.push(st);
      }
    });

    const masterST = ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self: any) => {
        this.globalProgress$.next(self.progress);
        this.updateScrollState();
      }
    });
    this.scrollTriggers.push(masterST);
  }

  private setupVelocityTracking(): void {
    if (!this.isBrowser) return;
    
    const velocitySubject = new Subject<number>();
    
    fromEvent(window, 'scroll', { passive: true })
      .pipe(throttleTime(16))
      .subscribe(() => {
        const currentTime = Date.now();
        const currentScrollY = window.pageYOffset;
        
        if (this.lastScrollTime > 0) {
          const deltaTime = currentTime - this.lastScrollTime;
          const deltaY = currentScrollY - this.lastScrollY;
          this.currentVelocity = Math.abs(deltaY / deltaTime);
        }
        
        this.lastScrollY = currentScrollY;
        this.lastScrollTime = currentTime;
        
        velocitySubject.next(this.currentVelocity);
      });

    velocitySubject
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.currentVelocity = 0;
        this.velocity$.next(0);
      });

    velocitySubject.subscribe(velocity => {
      this.velocity$.next(velocity);
      this.updateScrollState();
    });
  }

  private setupSnapBehavior(): void {
    if (this.prefersReducedMotion || !this.isBrowser) return;

    let snapTimeout: number;
    
    fromEvent(window, 'scroll', { passive: true })
      .pipe(debounceTime(150))
      .subscribe(() => {
        clearTimeout(snapTimeout);
        snapTimeout = window.setTimeout(() => {
          this.snapToNearestSection();
        }, 200);
      });
  }

  private snapToNearestSection(): void {
    if (this.prefersReducedMotion || this.currentVelocity > 0.5 || !this.isBrowser || !gsap) return;

    const globalProgress = this.globalProgress$.value;
    const nearestSection = this.sections.reduce((nearest, section, index) => {
      const distance = Math.abs(globalProgress - (section.snapPoint || index / (this.sections.length - 1)));
      return distance < nearest.distance ? { section, index, distance } : nearest;
    }, { section: this.sections[0], index: 0, distance: 1 });

    if (nearestSection.distance < 0.1 && nearestSection.section.snap) {
      const targetElement = nearestSection.section.element;
      if (targetElement) {
        this.scrollState$.next({
          ...this.scrollState$.value,
          isSnapping: true
        });

        this.snapTween = gsap.to(window, {
          scrollTo: { y: targetElement.offsetTop, autoKill: true },
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => {
            this.scrollState$.next({
              ...this.scrollState$.value,
              isSnapping: false
            });
          }
        });
      }
    }
  }

  private updateProgress(sectionIndex: number, progress: number): void {
    if (this.sectionIndex$.value === sectionIndex) {
      this.sectionProgress$.next(progress);
      this.updateScrollState();
    }
  }

  private updateScrollState(): void {
    this.scrollState$.next({
      globalProgress: this.globalProgress$.value,
      sectionIndex: this.sectionIndex$.value,
      sectionProgress: this.sectionProgress$.value,
      velocity: this.currentVelocity,
      isSnapping: this.scrollState$.value.isSnapping,
      prefersReducedMotion: this.prefersReducedMotion
    });
  }
}