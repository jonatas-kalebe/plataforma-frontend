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

  // Properties for magnetic snapping
  private activeSectionTrigger: any = null;
  private snapTimeoutId: number | null = null;
  private intentionDetected: { direction: 'forward' | 'backward' | null, at: number } = { direction: null, at: 0 };

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
    }
  }

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // Try immediate initialization first
      if (this.tryInitialize()) {
        return;
      }

      // Fallback: Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.tryInitialize();
        });
      } else {
        // DOM is ready, but elements might not be rendered yet
        // Use requestAnimationFrame to ensure elements are available
        requestAnimationFrame(() => {
          if (!this.tryInitialize()) {
            // Final fallback: retry after a short delay
            setTimeout(() => this.tryInitialize(), 100);
          }
        });
      }
    });
  }

  private tryInitialize(): boolean {
    if (this.isInitialized) {
      return true;
    }

    // Check if essential DOM elements exist
    const heroElement = document.querySelector('#hero');
    const filosofiaElement = document.querySelector('#filosofia');
    
    if (!heroElement || !filosofiaElement) {
      console.warn('ScrollOrchestrationService: Essential sections not found, retrying...');
      return false;
    }

    try {
      const gsapInstance = (window as any).gsap || gsap;
      const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;

      gsapInstance.registerPlugin(ScrollTriggerInstance, ScrollToPlugin);
      
      // Expose ScrollTrigger globally for debugging/testing
      if (typeof window !== 'undefined') {
        (window as any).ScrollTrigger = ScrollTriggerInstance;
      }
      
      this.lastScrollY = window.scrollY || 0;
      this.setupSections();
      this.isInitialized = true;
      
      console.log('ScrollOrchestrationService: Successfully initialized');
      return true;
    } catch (error) {
      console.error('ScrollOrchestrationService: Initialization failed:', error);
      return false;
    }
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

      // Configurações avançadas por seção
      let advancedConfig: any;
      if (id === '#trabalhos' && !this.prefersReducedMotion) {
        advancedConfig = {
          // ALTERAÇÃO: start alinhado ao topo para pin estável
          start: 'top top',
          scrub: true,
          pin: true,
          end: '+=100%',
          pinSpacing: true,
          onUpdate: (self: any) => {
            section.progress = self.progress;
          }
        };
      } else {
        // ALTERAÇÃO: remover snap por seção para evitar conflito com pin/snap magnético
        advancedConfig = this.prefersReducedMotion ? {} : {
          scrub: true
          // snap removido
        };
      }

      const trigger = ScrollTriggerInstance.create({ ...baseConfig, ...advancedConfig });
      this.scrollTriggers.push(trigger);

      // Timelines auxiliares
      if (id === '#hero' && !this.prefersReducedMotion) {
        const heroTimeline = gsapInstance.timeline({
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        });

        const heroTitle = document.querySelector('#hero-title');
        const heroSubtitle = document.querySelector('#hero-subtitle');
        const heroCta = document.querySelector('#hero-cta');

        if (heroTitle) {
          // 0-20%: gentle resistance - counter-scroll to reduce apparent movement
          heroTimeline.fromTo(heroTitle, 
            { y: 0, opacity: 1 },
            { y: 53, opacity: 0.8, ease: 'power1.out' },
            0
          );
          
          // 20-100%: accelerated transition with larger movement
          heroTimeline.to(heroTitle, 
            { y: -150, opacity: 0.1, ease: 'power2.in' },
            0.2
          );
        }

        if (heroSubtitle) {
          heroTimeline.fromTo(heroSubtitle, 
            { y: 0, opacity: 1 },
            { y: -40, opacity: 0.7, ease: 'power1.out' },
            0
          );
          
          heroTimeline.to(heroSubtitle, 
            { y: -120, opacity: 0, ease: 'power2.in' },
            0.25
          );
        }

        if (heroCta) {
          heroTimeline.fromTo(heroCta, 
            { y: 0, opacity: 1 },
            { y: -50, opacity: 0.6, ease: 'power1.out' },
            0
          );
          
          heroTimeline.to(heroCta, 
            { y: -100, opacity: 0, ease: 'power2.in' },
            0.3
          );
        }
      }

      if (id === '#filosofia') {
        const filosofiaConfig = this.prefersReducedMotion ? {} : { scrub: 1 };
        gsapInstance.timeline({
          scrollTrigger: {
            trigger: '#filosofia',
            start: 'top center',
            end: 'bottom top',
            ...filosofiaConfig
          }
        });
      }

      if (id === '#servicos') {
        const servicosConfig = this.prefersReducedMotion ? {} : { scrub: 1 };
        gsapInstance.timeline({
          scrollTrigger: {
            trigger: '#servicos',
            start: 'top bottom',
            end: 'bottom top',
            ...servicosConfig
          }
        });
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
    let lastUpdateTime = performance.now();

    const globalTrigger = ScrollTriggerInstance.create({
      id: 'global-progress',
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self: any) => {
        const currentTime = performance.now();
        const currentScrollY = window.scrollY || 0;
        const deltaTime = Math.max(currentTime - lastUpdateTime, 1); // Prevent division by zero
        const deltaScroll = Math.abs(currentScrollY - this.lastScrollY);
        
        // Calculate velocity in pixels per second
        const velocityRaw = (deltaScroll / deltaTime) * 1000;
        // Apply smoothing to avoid jittery values
        const smoothedVelocity = velocityRaw * 0.3 + (this.metricsSubject.value.velocity || 0) * 0.7;

        if (currentScrollY > this.lastScrollY + 5) {
          this.scrollDirection = 'down';
        } else if (currentScrollY < this.lastScrollY - 5) {
          this.scrollDirection = 'up';
        } else {
          this.scrollDirection = 'none';
        }

        this.lastScrollY = currentScrollY;
        lastUpdateTime = currentTime;

        const currentMetrics = this.metricsSubject.value;

        this.metricsSubject.next({
          ...currentMetrics,
          globalProgress: self.progress,
          velocity: Math.abs(smoothedVelocity)
        });

        this.scrollStateSubject.next({
          globalProgress: self.progress,
          velocity: Math.abs(smoothedVelocity),
          activeSection: currentMetrics.activeSection,
          direction: this.scrollDirection
        });

        this.updateActiveSectionTrigger(currentScrollY);
        this.detectScrollIntention();
        this.checkMagneticSnap(); // mantém chamada
      }
    });

    this.scrollTriggers.push(globalTrigger);
  }

  private updateActiveSectionTrigger(currentScrollY: number): void {
    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    for (const sectionId of sectionOrder) {
      const element = document.querySelector(`#${sectionId}`) as HTMLElement;
      if (!element) continue;

      const sectionTop = element.offsetTop;
      const sectionHeight = element.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;

      if (currentScrollY >= sectionTop && currentScrollY < sectionBottom) {
        const sectionProgress = (currentScrollY - sectionTop) / sectionHeight;
        this.activeSectionTrigger = {
          progress: sectionProgress,
          direction: this.scrollDirection === 'down' ? 1 : (this.scrollDirection === 'up' ? -1 : 0),
          vars: { id: sectionId },
          start: sectionTop,
          end: sectionBottom
        };
        break;
      }
    }
  }

  private detectScrollIntention(): void {
    if (!this.activeSectionTrigger || this.prefersReducedMotion) return;
    const progress = this.activeSectionTrigger.progress || 0;
    const direction = this.activeSectionTrigger.direction || 0;
    if (progress > 0.2 && direction > 0 && this.intentionDetected.direction !== 'forward') {
      this.intentionDetected = { direction: 'forward', at: progress };
    } else if (progress <= 0.2) {
      this.intentionDetected = { direction: null, at: 0 };
    } else if (progress <= 0.15 && direction < 0 && this.intentionDetected.direction !== 'backward') {
      this.intentionDetected = { direction: 'backward', at: progress };
    }
  }

  private checkMagneticSnap(): void {
    if (!this.activeSectionTrigger) return;
    if (this.prefersReducedMotion) return;

    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;

    // ALTERAÇÃO: se seção ativa for "trabalhos" OU se qualquer trigger com pin estiver ativo, não fazer snap
    const activeId = this.scrollStateSubject.value.activeSection?.id;
    if (activeId === 'trabalhos') return; // não snap durante pin de "trabalhos"
    const anyPinnedActive = ScrollTriggerInstance.getAll().some((t: any) => t.pin && t.isActive);
    if (anyPinnedActive) return;

    const progress = this.activeSectionTrigger.progress || 0;
    const direction = this.activeSectionTrigger.direction || 0;
    // Use our own velocity tracking since ScrollTrigger.getVelocity() doesn't exist
    const currentVelocity = this.scrollStateSubject.value.velocity * 1000; // Convert to pixels per second

    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }

    // Only snap when velocity is low (user has stopped or is scrolling slowly)
    if (Math.abs(currentVelocity) < 500) { // Increased threshold for more responsive snapping
      const delay = this.isMobile ? 250 : 100; // Reduced delay for quicker response
      this.snapTimeoutId = window.setTimeout(() => {
        this.performMagneticSnap();
      }, delay);
    }
  }

  private performMagneticSnap(): void {
    if (!this.activeSectionTrigger) return;

    const activeId = this.scrollStateSubject.value.activeSection?.id;
    // ALTERAÇÃO: proteção extra
    if (activeId === 'trabalhos') return;

    const gsapInstance = (window as any).gsap || gsap;
    const progress = this.activeSectionTrigger.progress || 0;
    const direction = this.activeSectionTrigger.direction || 0;
    const sectionId = this.activeSectionTrigger.vars?.id;

    // Snap forward when progress >= 85% 
    if (progress >= 0.85) {
      const nextSectionElement = this.getNextSectionElement(sectionId);
      if (nextSectionElement) {
        gsapInstance.to(window, {
          scrollTo: { y: nextSectionElement.offsetTop, autoKill: false },
          ease: 'power2.inOut',
          duration: 0.8
        });
        this.intentionDetected = { direction: null, at: 0 };
        return;
      }
    }

    // Snap backward when progress <= 15% and moving backward
    if (progress <= 0.15 && direction < 0) {
      const prevSectionElement = this.getPrevSectionElement(sectionId);
      if (prevSectionElement) {
        gsapInstance.to(window, {
          scrollTo: { y: prevSectionElement.offsetTop, autoKill: false },
          ease: 'power2.inOut',
          duration: 0.8
        });
        this.intentionDetected = { direction: null, at: 0 };
        return;
      }
    }
  }

  private getNextSectionElement(currentSectionId: string): HTMLElement | null {
    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentIndex = sectionOrder.indexOf(currentSectionId);
    if (currentSectionId === 'cta') {
      return null;
    }
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
    const activeSection = currentMetrics.sections[index] || null;

    this.metricsSubject.next({
      ...currentMetrics,
      activeSection: activeSection
    });

    this.scrollStateSubject.next({
      ...currentScrollState,
      activeSection: activeSection
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

  getMetrics(): ScrollMetrics {
    return this.metricsSubject.value;
  }

  getScrollState(): ScrollState {
    return this.scrollStateSubject.value;
  }

  // Method to check and ensure service is properly initialized
  ensureInitialized(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    if (this.isInitialized && this.scrollTriggers.length > 0) {
      return true;
    }

    console.warn('ScrollOrchestrationService: Service not properly initialized, attempting re-initialization...');
    this.isInitialized = false;
    this.initialize();
    return this.isInitialized;
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
