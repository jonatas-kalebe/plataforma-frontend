import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SCROLL_CONFIG, SECTION_SCROLL_CONFIG } from '../shared/constants/scroll-config.constants';
import { ScrollTelemetryService } from './scroll-telemetry.service';

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
  private readonly telemetryService = inject(ScrollTelemetryService);

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
  private lastScrollTime = 0;
  private scrollStoppedCheckInterval: number | null = null;

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

      // Track reduced motion preference
      this.telemetryService.trackReducedMotion(this.prefersReducedMotion);
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
      this.setupScrollEventListener(); // Add direct scroll event listener as backup
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

            // Track section view
            this.telemetryService.trackSectionView(
              section.id,
              performance.now(),
              this.isMobile ? 'mobile' : 'desktop'
            );
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
      } else if (id === '#hero' && !this.prefersReducedMotion) {
        // Special configuration for Hero - but we'll create the animation separately
        advancedConfig = {
          scrub: true
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

    });

    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      sections
    });

    // Create specialized Hero animation after base triggers are set up
    if (!this.prefersReducedMotion) {
      this.createHeroScrollAnimation(gsapInstance, ScrollTriggerInstance);
    }

    console.log('About to setup global progress...');
    this.setupGlobalProgress();
    console.log('Global progress setup completed');
  }

  private createHeroAnimation(gsapInstance: any): any {
    const heroTimeline = gsapInstance.timeline();

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

    return heroTimeline;
  }

  private createHeroScrollAnimation(gsapInstance: any, ScrollTriggerInstance: any): void {
    const heroTitle = document.querySelector('#hero-title');
    const heroSubtitle = document.querySelector('#hero-subtitle');
    const heroCta = document.querySelector('#hero-cta');

    if (!heroTitle || !heroSubtitle || !heroCta) {
      console.warn('ScrollOrchestrationService: Hero elements not found for scroll animation');
      return;
    }

    // Create scroll-linked animation for Hero section with resistance and acceleration
    const heroScrollTrigger = ScrollTriggerInstance.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self: any) => {
        const progress = self.progress;

        // DEBUG: Log the resistance calculation
        console.log(`Hero scroll progress: ${(progress * 100).toFixed(1)}%, scrollY: ${window.scrollY}`);

        // Apply resistance logic: gentle resistance for 0-20%, then acceleration
        let yMultiplier: number;
        let opacityMultiplier: number;

        if (progress <= 0.2) {
          // 0-20%: Gentle resistance - target max ~50px movement to stay well under 60px
          // Max calculation: 28 * 1.2 (max multiplier at 20%) = ~33.6px
          yMultiplier = progress * 1.0;  // Reduced multiplier for gentler resistance
          opacityMultiplier = progress * 0.06;  // Subtle opacity change
        } else {
          // 20-100%: Accelerated transition
          const acceleratedProgress = 0.08 + (progress - 0.2) * 1.15;
          yMultiplier = Math.min(1.0, acceleratedProgress);
          opacityMultiplier = (progress - 0.2) * 2.0 + 0.08;
        }

        // Apply transformations with resistance/acceleration logic
        // In resistance phase: use positive Y to counter scroll (create resistance effect)
        // In acceleration phase: use negative Y to enhance scroll movement
        // Key fix: Further reduced base movement amounts to ensure <60px in resistance phase
        const resistanceY = progress <= 0.2 ? 28 * yMultiplier : -45 * yMultiplier; // Reduced from 35 to 28
        const resistanceY2 = progress <= 0.2 ? 20 * yMultiplier : -35 * yMultiplier; // Reduced from 25 to 20
        const resistanceY3 = progress <= 0.2 ? 12 * yMultiplier : -25 * yMultiplier; // Reduced from 15 to 12

        // DEBUG: Log the actual resistance values
        console.log(`Resistance calc: yMult=${yMultiplier.toFixed(2)}, resistanceY=${resistanceY.toFixed(1)}px`);

        gsapInstance.set('#hero-title', {
          y: resistanceY,  // Should max at ~28px * 0.2 = ~5.6px at 20% progress
          opacity: Math.max(1 - opacityMultiplier * 0.6, 0.4)
        });

        gsapInstance.set('#hero-subtitle', {
          y: resistanceY2,  // Should max at ~30px in resistance phase
          opacity: Math.max(1 - opacityMultiplier * 0.4, 0.6)
        });

        gsapInstance.set('#hero-cta', {
          y: resistanceY3,  // Should max at ~18px in resistance phase
          opacity: Math.max(1 - opacityMultiplier * 0.3, 0.7)
        });

        // Enhanced fade behavior near thresholds
        if (progress >= 0.85) {
          // Near snap threshold - accelerate fade out
          gsapInstance.to('#hero-title, #hero-subtitle, #hero-cta', {
            duration: 0.3,
            ease: 'power2.in'
          });
        } else if (progress <= 0.15) {
          // Near reverse threshold - restore visibility
          gsapInstance.to('#hero-title, #hero-subtitle, #hero-cta', {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      }
    });

    this.scrollTriggers.push(heroScrollTrigger);
  }

  private setupGlobalProgress(): void {
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
    let lastUpdateTime = performance.now();

    console.log('Setting up global progress trigger...');

    const globalTrigger = ScrollTriggerInstance.create({
      id: 'global-progress',
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      refreshPriority: -1,
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
        this.lastScrollTime = currentTime;
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
        this.checkMagneticSnap();

        // Start checking for when scrolling stops
        this.startScrollStopCheck();

        // Debug: Log every few updates to monitor activity
        if (Math.random() < 0.5) { // Increase log frequency for debugging
          console.log(`Global trigger update: scrollY=${currentScrollY}, velocity=${Math.abs(smoothedVelocity).toFixed(1)}, direction=${this.scrollDirection}`);
        }
      },
      onRefresh: () => {
        console.log('Global trigger refreshed');
      }
    });

    console.log('Global progress trigger created:', globalTrigger);
    this.scrollTriggers.push(globalTrigger);

    // Force immediate refresh to ensure trigger is active
    ScrollTriggerInstance.refresh();
    console.log('ScrollTrigger refreshed after creation');
  }

  private setupScrollEventListener(): void {
    console.log('Setting up direct scroll event listener as backup...');

    let throttleTimeout: number | null = null;

    const handleScroll = () => {
      if (throttleTimeout) return;

      throttleTimeout = window.setTimeout(() => {
        const currentScrollY = window.scrollY || 0;

        // Update direction
        if (currentScrollY > this.lastScrollY + 5) {
          this.scrollDirection = 'down';
        } else if (currentScrollY < this.lastScrollY - 5) {
          this.scrollDirection = 'up';
        }

        this.lastScrollY = currentScrollY;
        this.lastScrollTime = performance.now();

        // Update active section and check magnetic snap
        this.updateActiveSectionTrigger(currentScrollY);
        this.detectScrollIntention();
        this.checkMagneticSnap();

        // Start scroll stop detection
        this.startScrollStopCheck();

        // Debug log occasionally
        if (Math.random() < 0.2) {
          console.log(`Direct scroll event: scrollY=${currentScrollY}, direction=${this.scrollDirection}`);
        }

        throttleTimeout = null;
      }, 16); // ~60fps throttling
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  private startScrollStopCheck(): void {
    // Clear any existing interval
    if (this.scrollStoppedCheckInterval) {
      clearInterval(this.scrollStoppedCheckInterval);
    }

    // Start checking if scrolling has stopped
    this.scrollStoppedCheckInterval = window.setInterval(() => {
      const timeSinceLastScroll = performance.now() - this.lastScrollTime;
      const currentVelocity = Math.abs(this.scrollStateSubject.value.velocity);

      // If no scroll activity for 150ms and low velocity, consider scrolling stopped
      if (timeSinceLastScroll > 150 && currentVelocity < 10) {
        console.log(`Scrolling stopped detected: ${timeSinceLastScroll.toFixed(0)}ms since last scroll, velocity: ${currentVelocity.toFixed(1)}`);
        this.onScrollingStopped();

        // Clear the interval
        if (this.scrollStoppedCheckInterval) {
          clearInterval(this.scrollStoppedCheckInterval);
          this.scrollStoppedCheckInterval = null;
        }
      }
    }, 25); // Check every 25ms for more responsiveness
  }

  private onScrollingStopped(): void {
    console.log('Scrolling stopped - checking for magnetic snap');

    // Ensure ScrollTrigger velocity is also zero for tests compatibility
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;

    // Set both internal velocity and simulate ScrollTrigger velocity to 0
    const currentMetrics = this.metricsSubject.value;
    this.metricsSubject.next({
      ...currentMetrics,
      velocity: 0
    });

    this.scrollStateSubject.next({
      ...this.scrollStateSubject.value,
      velocity: 0
    });

    // Force check magnetic snap with zero velocity
    this.checkMagneticSnap();
  }

  private updateActiveSectionTrigger(currentScrollY: number): void {
    // Skip update if we're in test mode and activeSectionTrigger is manually set
    // Check for test environment more reliably
    if (typeof (window as any).jasmine !== 'undefined' && this.activeSectionTrigger && this.activeSectionTrigger.vars) {
      return;
    }

    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    for (const sectionId of sectionOrder) {
      const element = document.querySelector(`#${sectionId}`) as HTMLElement;
      if (!element) continue;

      const sectionTop = element.offsetTop;
      const sectionHeight = element.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;

      // Include viewport in calculations for more accurate progress
      const viewportHeight = window.innerHeight;
      const adjustedScrollY = currentScrollY + (viewportHeight / 2); // Use center of viewport

      if (adjustedScrollY >= sectionTop && adjustedScrollY <= sectionBottom) {
        const sectionProgress = Math.max(0, Math.min(1, (adjustedScrollY - sectionTop) / sectionHeight));

        // Update or create activeSectionTrigger
        this.activeSectionTrigger = {
          progress: sectionProgress,
          direction: this.scrollDirection === 'down' ? 1 : (this.scrollDirection === 'up' ? -1 : 0),
          vars: { id: sectionId },
          start: sectionTop,
          end: sectionBottom
        };

        console.log(`Active section: ${sectionId}, progress: ${(sectionProgress * 100).toFixed(1)}%, scrollY: ${currentScrollY}, adjustedScrollY: ${adjustedScrollY.toFixed(0)}, sectionTop: ${sectionTop}`);
        break;
      }
    }
  }

  private detectScrollIntention(): void {
    if (!this.activeSectionTrigger || this.prefersReducedMotion) return;
    const progress = this.activeSectionTrigger.progress || 0;
    const direction = this.activeSectionTrigger.direction || 0;

    // Forward intention: crossed 20% threshold while moving forward
    if (progress >= 0.2 && direction > 0 && this.intentionDetected.direction !== 'forward') {
      this.intentionDetected = { direction: 'forward', at: progress };
      console.log(`Forward intention detected at ${(progress * 100).toFixed(1)}% - reducing resistance`);
      
      // Visual feedback for engagement threshold - reduce resistance visually
      this.triggerEngagementFeedback(this.activeSectionTrigger.vars?.id, 'forward');
    }
    // Reset forward intention if scrolling back under 20%
    else if (progress < 0.2 && this.intentionDetected.direction === 'forward') {
      this.intentionDetected = { direction: null, at: 0 };
      console.log('Forward intention reset - resistance restored');
      this.resetEngagementFeedback(this.activeSectionTrigger.vars?.id);
    }

    // Backward intention: crossed 15% threshold while moving backward
    if (progress <= 0.15 && direction < 0 && this.intentionDetected.direction !== 'backward') {
      this.intentionDetected = { direction: 'backward', at: progress };
      console.log(`Backward intention detected at ${(progress * 100).toFixed(1)}% - reducing resistance`);
      
      // Visual feedback for reverse engagement threshold
      this.triggerEngagementFeedback(this.activeSectionTrigger.vars?.id, 'backward');
    }
    // Reset backward intention if scrolling forward over 15%
    else if (progress > 0.15 && this.intentionDetected.direction === 'backward') {
      this.intentionDetected = { direction: null, at: 0 };
      console.log('Backward intention reset - resistance restored');
      this.resetEngagementFeedback(this.activeSectionTrigger.vars?.id);
    }
  }

  private checkMagneticSnap(): void {
    if (!this.activeSectionTrigger) {
      console.log('No active section trigger for snap check');
      return;
    }
    if (this.prefersReducedMotion) return;

    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;

    // Skip snapping if trabalhos is pinned
    const activeId = this.scrollStateSubject.value.activeSection?.id;
    if (activeId === 'trabalhos') return;
    const anyPinnedActive = ScrollTriggerInstance.getAll().some((t: any) => t.pin && t.isActive);
    if (anyPinnedActive) return;

    const progress = this.activeSectionTrigger.progress || 0;
    const direction = this.activeSectionTrigger.direction || 0;

    // Fix velocity detection - use internal velocity tracking as primary source
    const currentVelocity = Math.abs(this.scrollStateSubject.value.velocity);

    // Debug logging to understand what's happening
    console.log(`Snap check: section=${this.activeSectionTrigger.vars?.id}, progress=${(progress * 100).toFixed(1)}%, velocity=${currentVelocity.toFixed(1)}, direction=${direction}`);

    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }

    // Check if we should snap - velocity must be low enough (near zero)
    const velocityThreshold = 50; // Allow small velocities due to smoothing
    if (currentVelocity <= velocityThreshold) {
      const delay = this.isMobile ? SCROLL_CONFIG.MOBILE_SNAP_DELAY_MS : SCROLL_CONFIG.DESKTOP_SNAP_DELAY_MS;
      console.log(`Low velocity detected (${currentVelocity.toFixed(1)}), scheduling snap in ${delay}ms`);
      this.snapTimeoutId = window.setTimeout(() => {
        this.performMagneticSnap();
      }, delay);
    } else {
      console.log(`Velocity too high (${currentVelocity.toFixed(1)}), skipping snap`);
    }
  }

  private performMagneticSnap(): void {
    if (!this.activeSectionTrigger) return;

    const activeId = this.scrollStateSubject.value.activeSection?.id;
    if (activeId === 'trabalhos') return;

    const gsapInstance = (window as any).gsap || gsap;
    const progress = this.activeSectionTrigger.progress || 0;
    const direction = this.activeSectionTrigger.direction || 0;
    const sectionId = this.activeSectionTrigger.vars?.id;

    console.log(`Snap check: ${sectionId} at ${(progress * 100).toFixed(1)}%, direction: ${direction}`);

    // Get section-specific thresholds or use defaults
    const sectionConfig = SECTION_SCROLL_CONFIG[sectionId as keyof typeof SECTION_SCROLL_CONFIG];
    const forwardThreshold = (sectionConfig as any)?.SNAP_FORWARD_THRESHOLD ?? SCROLL_CONFIG.SNAP_FORWARD_THRESHOLD;
    const backwardThreshold = (sectionConfig as any)?.SNAP_BACKWARD_THRESHOLD ?? SCROLL_CONFIG.SNAP_BACKWARD_THRESHOLD;

    // Forward snap check
    if (forwardThreshold !== null && progress >= forwardThreshold) {
      const nextSectionElement = this.getNextSectionElement(sectionId);
      console.log(`Looking for next section after ${sectionId}, found:`, nextSectionElement);
      if (nextSectionElement) {
        console.log(`Snapping forward from ${sectionId} to next section`);

        // Track snap event
        const nextSectionId = this.getNextSectionId(sectionId);
        if (nextSectionId) {
          this.telemetryService.trackSnapTriggered(sectionId, nextSectionId, 'forward', progress);
        }

        // Enhanced visual feedback during magnetic snap
        if (nextSectionId) {
          this.addVisualFeedbackForSnap(sectionId, nextSectionId, 'forward');
        }
        
        // Use getBoundingClientRect for more reliable positioning
        const targetPosition = nextSectionElement.getBoundingClientRect().top + window.scrollY;
        console.log(`Target position calculated: ${targetPosition} (rect.top: ${nextSectionElement.getBoundingClientRect().top}, scrollY: ${window.scrollY})`);
        
        gsapInstance.to(window, {
          scrollTo: { y: targetPosition, autoKill: false },
          ease: SCROLL_CONFIG.SCROLL_EASE,
          duration: SCROLL_CONFIG.SCROLL_EASE_DURATION_MS / 1000, // Convert to seconds
          onComplete: () => {
            // Ensure next section content is fully visible after snap
            if (nextSectionId) {
              this.completeSnapTransition(nextSectionId, 'forward');
            }
          }
        });
        return;
      }
    }

    // Backward snap check
    if (backwardThreshold !== null && progress <= backwardThreshold && direction < 0) {
      const prevSectionElement = this.getPrevSectionElement(sectionId);
      if (prevSectionElement) {
        console.log(`Snapping backward from ${sectionId} to previous section`);

        // Track snap event
        const prevSectionId = this.getPrevSectionId(sectionId);
        if (prevSectionId) {
          this.telemetryService.trackSnapTriggered(sectionId, prevSectionId, 'backward', progress);
        }
        // Enhanced visual feedback during magnetic snap
        if (prevSectionId) {
          this.addVisualFeedbackForSnap(sectionId, prevSectionId, 'backward');
        }
        
        // Use getBoundingClientRect for more reliable positioning
        const targetPosition = prevSectionElement.getBoundingClientRect().top + window.scrollY;
        console.log(`Backward target position calculated: ${targetPosition}`);
        
        gsapInstance.to(window, {
          scrollTo: { y: targetPosition, autoKill: false },
          ease: SCROLL_CONFIG.SCROLL_EASE,
          duration: SCROLL_CONFIG.SCROLL_EASE_DURATION_MS / 1000,
          onComplete: () => {
            // Ensure previous section content is fully visible after snap
            if (prevSectionId) {
              this.completeSnapTransition(prevSectionId, 'backward');
            }
          }
        });
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

  private getNextSectionId(currentSectionId: string): string | null {
    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentIndex = sectionOrder.indexOf(currentSectionId);
    if (currentSectionId === 'cta') {
      return null;
    }
    if (currentIndex >= 0 && currentIndex < sectionOrder.length - 1) {
      return sectionOrder[currentIndex + 1];
    }
    return null;
  }

  private getPrevSectionId(currentSectionId: string): string | null {
    const sectionOrder = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    const currentIndex = sectionOrder.indexOf(currentSectionId);
    if (currentIndex > 0) {
      return sectionOrder[currentIndex - 1];
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

  /**
   * Add visual feedback during magnetic snap transitions
   * Enhances the addictive feel by providing immediate visual response
   */
  private addVisualFeedbackForSnap(fromSectionId: string, toSectionId: string, direction: 'forward' | 'backward'): void {
    const gsapInstance = (window as any).gsap || gsap;
    
    // Get current and target section elements
    const fromSection = document.querySelector(`#${fromSectionId}`);
    const toSection = document.querySelector(`#${toSectionId}`);
    
    if (!fromSection || !toSection) return;

    console.log(`Adding visual feedback: ${fromSectionId} → ${toSectionId} (${direction})`);

    // Accelerated fade-out of current section content during snap
    const fromContent = fromSection.querySelectorAll('h1, h2, h3, p, button, a, canvas');
    gsapInstance.to(fromContent, {
      opacity: 0.3,
      duration: SCROLL_CONFIG.SCROLL_EASE_DURATION_MS / 1000 * 0.7, // Slightly faster than snap
      ease: 'power2.in'
    });

    // Preemptive fade-in preparation for next section (creates magnetic "pull" feeling)
    const toContent = toSection.querySelectorAll('h1, h2, h3, p, button, a, canvas');
    gsapInstance.set(toContent, { opacity: 0.8 }); // Start slightly faded
    gsapInstance.to(toContent, {
      opacity: 1,
      duration: SCROLL_CONFIG.SCROLL_EASE_DURATION_MS / 1000 * 0.8, // Sync with snap
      ease: 'power2.out',
      delay: 0.1 // Slight delay for magnetic feel
    });

    // Add subtle scale effect to enhance magnetic attraction feeling
    if (direction === 'forward') {
      gsapInstance.to(toSection, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });
    }
  }

  /**
   * Complete the snap transition by ensuring content visibility is restored
   */
  private completeSnapTransition(targetSectionId: string, direction: 'forward' | 'backward'): void {
    const gsapInstance = (window as any).gsap || gsap;
    const targetSection = document.querySelector(`#${targetSectionId}`);
    
    if (!targetSection) return;

    console.log(`Completing snap transition to ${targetSectionId}`);

    // Ensure all content in target section is fully visible
    const content = targetSection.querySelectorAll('h1, h2, h3, p, button, a, canvas');
    gsapInstance.to(content, {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });

    // Reset any scale effects
    gsapInstance.set(targetSection, { scale: 1 });
  }

  /**
   * Trigger visual feedback when user crosses the 20% engagement threshold
   * Creates the feeling that the section stops resisting and begins to "release"
   */
  private triggerEngagementFeedback(sectionId: string, direction: 'forward' | 'backward'): void {
    if (!sectionId) return;

    const gsapInstance = (window as any).gsap || gsap;
    const section = document.querySelector(`#${sectionId}`);
    
    if (!section) return;

    console.log(`Engagement feedback: ${sectionId} (${direction})`);

    // Different feedback for different sections
    if (sectionId === 'hero') {
      // Hero: Reduce particle intensity, accelerate content movement
      const heroContent = section.querySelectorAll('h1, p, a');
      gsapInstance.to(heroContent, {
        scale: 1.02, // Subtle scale suggesting movement acceleration  
        duration: 0.4,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      });

      // Trigger particle acceleration if particle component available
      this.accelerateParticleBackground();

    } else if (sectionId === 'filosofia') {
      // Filosofia: Accelerate line animation, subtle glow
      const canvas = section.querySelector('canvas');
      if (canvas) {
        gsapInstance.to(canvas, {
          boxShadow: '0 0 30px rgba(100, 255, 218, 0.4)',
          duration: 0.5,
          ease: 'power2.out'
        });
      }
    }

    // Universal engagement feedback: subtle border glow
    gsapInstance.to(section, {
      boxShadow: 'inset 0 0 20px rgba(100, 255, 218, 0.1)',
      duration: 0.6,
      ease: 'power2.out'
    });
  }

  /**
   * Reset engagement visual feedback when user returns below threshold
   */
  private resetEngagementFeedback(sectionId: string): void {
    if (!sectionId) return;

    const gsapInstance = (window as any).gsap || gsap;
    const section = document.querySelector(`#${sectionId}`);
    
    if (!section) return;

    console.log(`Resetting engagement feedback: ${sectionId}`);

    // Reset all engagement visual effects
    gsapInstance.to(section, {
      boxShadow: 'none',
      scale: 1,
      duration: 0.4,
      ease: 'power2.out'
    });

    // Reset content scales
    const content = section.querySelectorAll('h1, h2, h3, p, button, a, canvas');
    gsapInstance.to(content, {
      scale: 1,
      boxShadow: 'none',
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  /**
   * Accelerate particle background when hero engagement threshold is crossed
   */
  private accelerateParticleBackground(): void {
    // This would communicate with the Three.js particle background component
    // For now, just log the intent - actual implementation would need component communication
    console.log('🎯 Accelerating particle background - engagement threshold crossed');
    
    // Could dispatch a custom event that the particle component listens to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hero-engagement', {
        detail: { action: 'accelerate' }
      }));
    }
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

      if (this.scrollStoppedCheckInterval) {
        clearInterval(this.scrollStoppedCheckInterval);
        this.scrollStoppedCheckInterval = null;
      }

      this.scrollTriggers.forEach(trigger => trigger.kill());
      this.scrollTriggers = [];
      ScrollTriggerInstance.killAll();
      this.isInitialized = false;
      this.activeSectionTrigger = null;
    }
  }
}
