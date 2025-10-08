import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ============================================================================
// 🎨 ANIMATION CONFIGURATION - Customize all animation settings here
// ============================================================================

/** Configuration for ring entrance animations */
const ENTRANCE_CONFIG = {
  /** Initial scale of ring container */
  initialScale: 0.8,
  
  /** Initial Y offset of ring container (pixels) */
  initialY: 50,
  
  /** Initial Y offset of title (pixels) */
  titleInitialY: 30,
  
  /** Initial Y offset of hint (pixels) */
  hintInitialY: 20,
  
  /** Scroll trigger start point */
  triggerStart: 'top bottom-=100',
  
  /** Scroll trigger end point */
  triggerEnd: 'top center',
  
  /** Scrub smoothness (higher = smoother but slower response) */
  scrubSmoothness: 1.5,
  
  /** Enable/disable entrance animation */
  enabled: true
} as const;

/** Configuration for ring rotation controlled by scroll */
const SCROLL_ROTATION_CONFIG = {
  /** Total rotation in degrees for full scroll (720 = 2 full rotations) */
  totalRotationDeg: 720,
  
  /** Enable scroll-driven rotation */
  enabled: true,
  
  /** Disable card snapping (per user request) */
  enableCardSnap: false,
  
  /** Snap angle in degrees (only used if enableCardSnap is true) */
  snapAngleDeg: 45,
  
  /** Progress range for snapping (0-1) */
  snapProgressMin: 0.45,
  snapProgressMax: 0.55
} as const;

/** Configuration for drag interactions */
const DRAG_CONFIG = {
  /** Drag sensitivity (how much rotation per pixel moved) */
  sensitivity: 0.5,
  
  /** Momentum friction (0-1, closer to 1 = less friction) */
  momentumFriction: 0.92,
  
  /** Minimum velocity to stop momentum */
  minVelocityThreshold: 0.05,
  
  /** Enable/disable drag interactions */
  enabled: true,
  
  /** Enable/disable haptic feedback */
  enableVibration: true,
  
  /** Vibration duration for drag start (milliseconds) */
  vibrationStartMs: 30,
  
  /** Vibration duration for drag end (milliseconds) */
  vibrationEndMs: 20,
  
  /** Vibration pattern for card change [on, off, on] (milliseconds) */
  vibrationCardChange: [50, 50, 50] as const
} as const;

/** Configuration for interaction hints */
const HINT_CONFIG = {
  /** Show hints when section is pinned */
  showOnPin: true,
  
  /** Hide hints when section is unpinned */
  hideOnUnpin: true,
  
  /** Hint fade duration (seconds) */
  fadeDuration: 0.3
} as const;

/** Performance optimization settings */
const PERFORMANCE_CONFIG = {
  /** Use GPU acceleration */
  useGPU: true,
  
  /** Force 3D rendering */
  force3D: true,
  
  /** Use requestAnimationFrame for smooth updates */
  useRAF: true,
  
  /** Throttle scroll handler (milliseconds) */
  scrollThrottle: 16
} as const;

/** Responsive breakpoints */
const RESPONSIVE_CONFIG = {
  /** Mobile breakpoint (pixels) */
  mobileBreakpoint: 768,
  
  /** Tablet breakpoint (pixels) */
  tabletBreakpoint: 1024,
  
  /** Adjust animations for mobile */
  reduceDragSensitivityOnMobile: true,
  
  /** Mobile drag sensitivity multiplier */
  mobileSensitivityMultiplier: 0.7
} as const;

// ============================================================================
// 🎯 SERVICE IMPLEMENTATION - Do not modify unless necessary
// ============================================================================

@Injectable({ providedIn: 'root' })
export class TrabalhosSectionAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private prefersReducedMotion = false;
  private isPinned = false;
  private disposers: Array<() => void> = [];
  private scrollTriggers: ScrollTrigger[] = [];
  public scrollProgress = 0;
  private currentRingComponent: any = null;
  private sectionEl: HTMLElement | null = null;
  private ringEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private hintEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private momentumId: number | null = null;
  private isDragging = false;
  private dragLastX = 0;
  private dragVelocity = 0;
  private dragLastTs = 0;
  private sectionStartY = 0;
  private viewportH = 0;
  private lastPinnedState = false;
  private isMobile = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.registerPlugin(ScrollTrigger);
      this.detectMobile();
    }
  }

  private detectMobile(): void {
    this.isMobile = window.innerWidth < RESPONSIVE_CONFIG.mobileBreakpoint;
    const onResize = () => {
      this.isMobile = window.innerWidth < RESPONSIVE_CONFIG.mobileBreakpoint;
    };
    window.addEventListener('resize', onResize, { passive: true });
    this.disposers.push(() => window.removeEventListener('resize', onResize));
  }

  createPinnedSection(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;
    this.sectionEl = document.querySelector('#trabalhos');
    this.ringEl = document.querySelector('#trabalhos .ring');
    this.titleEl = document.querySelector('#trabalhos h3');
    this.hintEl = document.querySelector('#trabalhos .drag-hint');
    if (!this.sectionEl) return;
    const recalc = () => {
      const rect = this.sectionEl!.getBoundingClientRect();
      this.viewportH = window.innerHeight;
      this.sectionStartY = window.scrollY + rect.top;
    };
    recalc();
    const onResize = () => recalc();
    const onScroll = () => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.handleScroll());
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    this.disposers.push(() => window.removeEventListener('resize', onResize));
    this.disposers.push(() => window.removeEventListener('scroll', onScroll));
    this.handleScroll();
  }

  setRingComponent(ringComponent: any): void {
    this.currentRingComponent = ringComponent;
    const el = ringComponent?.ringRef?.nativeElement as HTMLElement | undefined;
    if (el) this.ringEl = el;
  }

  private handleScroll(): void {
    if (!this.sectionEl) return;
    const y = window.scrollY;
    const start = this.sectionStartY;
    const end = start + this.viewportH;
    const progress = Math.max(0, Math.min(1, (y - start) / (end - start)));
    const pinnedNow = y >= start && y < end;
    
    // Handle pin/unpin state changes
    if (pinnedNow !== this.lastPinnedState) {
      this.lastPinnedState = pinnedNow;
      if (pinnedNow) {
        this.isPinned = true;
        if (HINT_CONFIG.showOnPin) {
          this.showInteractionHints();
        }
      } else {
        this.isPinned = false;
        if (HINT_CONFIG.hideOnUnpin) {
          this.hideInteractionHints();
        }
      }
    }
    
    // Don't update rotation while dragging
    if (this.isDragging) return;
    
    this.scrollProgress = progress;
    this.updateRingScrollProgress(progress);
    
    // Calculate rotation based on scroll progress
    if (SCROLL_ROTATION_CONFIG.enabled) {
      const totalRotation = progress * SCROLL_ROTATION_CONFIG.totalRotationDeg;
      
      // Card snapping disabled per user request
      if (SCROLL_ROTATION_CONFIG.enableCardSnap) {
        const snapAngle = SCROLL_ROTATION_CONFIG.snapAngleDeg;
        const mod = ((totalRotation % snapAngle) + snapAngle) % snapAngle;
        const isNearSnap = mod < 15 || mod > 30;
        
        if (progress > SCROLL_ROTATION_CONFIG.snapProgressMin && 
            progress < SCROLL_ROTATION_CONFIG.snapProgressMax && 
            isNearSnap) {
          const snappedRotation = Math.round(totalRotation / snapAngle) * snapAngle;
          this.applyRingRotation(snappedRotation, true);
        } else {
          this.applyRingRotation(totalRotation, false);
        }
      } else {
        // Smooth rotation without snapping
        this.applyRingRotation(totalRotation, false);
      }
    }
    
    if (progress > 0.9) {
      this.prepareForTransition();
    }
  }

  private updateRingScrollProgress(progress: number): void {
    if (this.currentRingComponent && typeof this.currentRingComponent === 'object') {
      if ('scrollProgress' in this.currentRingComponent) {
        this.currentRingComponent.scrollProgress = progress;
      }
      if (!this.isDragging && 'rotationDeg' in this.currentRingComponent) {
        const totalRotation = progress * SCROLL_ROTATION_CONFIG.totalRotationDeg;
        this.currentRingComponent.rotationDeg = -totalRotation;
      }
    }
  }

  private applyRingRotation(rotation: number, isSnapped: boolean): void {
    if (!this.ringEl) this.ringEl = document.querySelector('#trabalhos .ring');
    const ring = this.ringEl;
    if (!ring) return;
    if (isSnapped) {
      ring.classList.add('snap-transition');
    } else {
      ring.classList.remove('snap-transition');
    }
    ring.style.setProperty('--rotation', `${-rotation}deg`);
  }

  /**
   * Create scroll-driven entrance animation for ring and related elements
   * Uses GSAP's native animation property to avoid conflicts
   */
  createRingEntrance(): void {
    if (!this.isBrowser || !ENTRANCE_CONFIG.enabled) {
      return;
    }
    
    const ringContainer = document.querySelector('#trabalhos .ring-container') as HTMLElement | null;
    const title = document.querySelector('#trabalhos h3') as HTMLElement | null;
    const hint = document.querySelector('#trabalhos .drag-hint') as HTMLElement | null;
    const section = document.querySelector('#trabalhos') as HTMLElement | null;
    
    if (!ringContainer || !title || !section) return;

    if (this.prefersReducedMotion) {
      // For reduced motion, show immediately without animation
      gsap.set([ringContainer, title, hint].filter(Boolean), { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        clearProps: 'all'
      });
      return;
    }

    // Set initial state - elements are visible but transformed
    gsap.set(ringContainer, { 
      opacity: 1, 
      scale: ENTRANCE_CONFIG.initialScale, 
      y: ENTRANCE_CONFIG.initialY,
      force3D: PERFORMANCE_CONFIG.force3D
    });
    gsap.set(title, { 
      opacity: 1, 
      y: ENTRANCE_CONFIG.titleInitialY,
      force3D: PERFORMANCE_CONFIG.force3D
    });
    if (hint) {
      gsap.set(hint, { 
        opacity: 1, 
        y: ENTRANCE_CONFIG.hintInitialY,
        force3D: PERFORMANCE_CONFIG.force3D
      });
    }

    // Create GSAP timeline for all entrance animations
    const timeline = gsap.timeline({ paused: true });
    
    timeline.to(ringContainer, {
      scale: 1,
      y: 0,
      ease: 'none'
    }, 0);
    
    timeline.to(title, {
      y: 0,
      ease: 'none'
    }, 0);
    
    if (hint) {
      timeline.to(hint, {
        y: 0,
        ease: 'none'
      }, 0);
    }

    // Create scroll-triggered animation using the timeline
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: ENTRANCE_CONFIG.triggerStart,
      end: ENTRANCE_CONFIG.triggerEnd,
      scrub: ENTRANCE_CONFIG.scrubSmoothness,
      animation: timeline
    });

    this.scrollTriggers.push(trigger);
  }

  /**
   * Enhance ring interactions with drag and touch support
   * Includes haptic feedback and responsive sensitivity
   */
  enhanceRingInteractions(workCardRingComponent: any): void {
    if (!this.isBrowser || !workCardRingComponent || !DRAG_CONFIG.enabled) return;
    
    const ringElement: HTMLElement | null = workCardRingComponent.ringRef?.nativeElement ?? document.querySelector('#trabalhos .ring');
    if (!ringElement) return;
    
    this.ringEl = ringElement;
    ringElement.style.cursor = 'grab';

    // Get responsive sensitivity
    const getSensitivity = () => {
      if (RESPONSIVE_CONFIG.reduceDragSensitivityOnMobile && this.isMobile) {
        return DRAG_CONFIG.sensitivity * RESPONSIVE_CONFIG.mobileSensitivityMultiplier;
      }
      return DRAG_CONFIG.sensitivity;
    };

    // Use interaction bridge if available (preferred method)
    if (typeof workCardRingComponent.registerInteractionBridge === 'function') {
      workCardRingComponent.registerInteractionBridge({
        onDragStart: () => {
          this.isDragging = true;
          workCardRingComponent.isDragging = true;
          ringElement.style.cursor = 'grabbing';
          ringElement.classList.add('ring-dragging');
          if (DRAG_CONFIG.enableVibration && navigator.vibrate) {
            navigator.vibrate(DRAG_CONFIG.vibrationStartMs);
          }
        },
        onDragMove: (rotation: number, velocity: number) => {
          this.dragVelocity = velocity;
          if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
            this.currentRingComponent.rotationDeg = rotation;
          }
          ringElement.classList.remove('snap-transition');
          ringElement.style.setProperty('--rotation', `${-rotation}deg`);
        },
        onDragEnd: (velocity: number) => {
          this.isDragging = false;
          workCardRingComponent.isDragging = false;
          this.dragVelocity = velocity;
          ringElement.style.cursor = 'grab';
          ringElement.classList.remove('ring-dragging');
          if (DRAG_CONFIG.enableVibration && navigator.vibrate) {
            navigator.vibrate(DRAG_CONFIG.vibrationEndMs);
          }
        },
        onActiveIndexChange: (index: number) => {
          this.highlightActiveCard(index);
          if (DRAG_CONFIG.enableVibration && navigator.vibrate) {
            navigator.vibrate(DRAG_CONFIG.vibrationCardChange);
          }
        }
      });

      this.disposers.push(() => {
        workCardRingComponent.registerInteractionBridge(null);
      });

      return;
    }

    // Fallback to manual pointer events
    const onPointerDown = (ev: PointerEvent) => {
      this.isDragging = true;
      workCardRingComponent.isDragging = true;
      ringElement.setPointerCapture(ev.pointerId);
      ringElement.style.cursor = 'grabbing';
      this.dragLastX = ev.clientX;
      this.dragLastTs = performance.now();
      this.dragVelocity = 0;
      ringElement.classList.add('ring-dragging');
      if (DRAG_CONFIG.enableVibration && navigator.vibrate) {
        navigator.vibrate(DRAG_CONFIG.vibrationStartMs);
      }
    };
    
    const onPointerMove = (ev: PointerEvent) => {
      if (!this.isDragging) return;
      const now = performance.now();
      const dx = ev.clientX - this.dragLastX;
      const dt = Math.max(16, now - this.dragLastTs);
      const sensitivity = getSensitivity();
      const deltaDeg = dx * sensitivity;
      const curr = this.currentRingComponent?.rotationDeg ?? 0;
      const next = curr + deltaDeg;
      if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
        this.currentRingComponent.rotationDeg = next;
      }
      ringElement.classList.remove('snap-transition');
      ringElement.style.setProperty('--rotation', `${-next}deg`);
      this.dragVelocity = (dx / dt) * sensitivity * 16;
      this.dragLastX = ev.clientX;
      this.dragLastTs = now;
    };
    
    const endDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      workCardRingComponent.isDragging = false;
      ringElement.style.cursor = 'grab';
      ringElement.classList.remove('ring-dragging');
      if (DRAG_CONFIG.enableVibration && navigator.vibrate) {
        navigator.vibrate(DRAG_CONFIG.vibrationEndMs);
      }
      this.startMomentum();
    };
    
    ringElement.addEventListener('pointerdown', onPointerDown);
    ringElement.addEventListener('pointermove', onPointerMove);
    ringElement.addEventListener('pointerup', endDrag);
    ringElement.addEventListener('pointercancel', endDrag);
    ringElement.addEventListener('mouseleave', endDrag);
    const originalActiveIndexChange = workCardRingComponent.activeIndexChange;
    workCardRingComponent.activeIndexChange = {
      emit: (index: number) => {
        this.highlightActiveCard(index);
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        if (originalActiveIndexChange) originalActiveIndexChange.emit(index);
      }
    };
    this.disposers.push(() => {
      ringElement.removeEventListener('pointerdown', onPointerDown);
      ringElement.removeEventListener('pointermove', onPointerMove);
      ringElement.removeEventListener('pointerup', endDrag);
      ringElement.removeEventListener('pointercancel', endDrag);
      ringElement.removeEventListener('mouseleave', endDrag);
    });
  }

  private startMomentum(): void {
    if (this.momentumId) cancelAnimationFrame(this.momentumId);
    const friction = DRAG_CONFIG.momentumFriction;
    const minVelocity = DRAG_CONFIG.minVelocityThreshold;
    
    const step = () => {
      if (Math.abs(this.dragVelocity) < minVelocity) {
        // Snap to nearest card disabled per user request
        if (SCROLL_ROTATION_CONFIG.enableCardSnap) {
          this.snapToNearestCard();
        }
        return;
      }
      const curr = this.currentRingComponent?.rotationDeg ?? 0;
      const next = curr + this.dragVelocity;
      if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
        this.currentRingComponent.rotationDeg = next;
      }
      if (this.ringEl) {
        this.ringEl.style.setProperty('--rotation', `${-next}deg`);
      }
      this.dragVelocity *= friction;
      this.momentumId = requestAnimationFrame(step);
    };
    
    if (PERFORMANCE_CONFIG.useRAF) {
      this.momentumId = requestAnimationFrame(step);
    }
  }

  private highlightActiveCard(index: number): void {
    const cards = document.querySelectorAll('#trabalhos .work-card');
    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      if (i === index) {
        el.classList.add('card-active');
        el.classList.remove('card-inactive');
      } else {
        el.classList.remove('card-active');
        el.classList.add('card-inactive');
      }
    });
  }

  private showInteractionHints(): void {
    if (!HINT_CONFIG.showOnPin) return;
    const hint = document.querySelector('#trabalhos .drag-hint') as HTMLElement | null;
    if (!hint) return;
    
    if (this.prefersReducedMotion) {
      hint.classList.add('hint-on');
    } else {
      gsap.to(hint, {
        opacity: 1,
        duration: HINT_CONFIG.fadeDuration,
        ease: 'power2.out',
        overwrite: 'auto',
        onComplete: () => hint.classList.add('hint-on')
      });
    }
  }

  private hideInteractionHints(): void {
    if (!HINT_CONFIG.hideOnUnpin) return;
    const hint = document.querySelector('#trabalhos .drag-hint') as HTMLElement | null;
    if (!hint) return;
    
    if (this.prefersReducedMotion) {
      hint.classList.remove('hint-on');
    } else {
      gsap.to(hint, {
        opacity: 0,
        duration: HINT_CONFIG.fadeDuration,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => hint.classList.remove('hint-on')
      });
    }
  }

  private snapToNearestCard(): void {
    // Card snapping disabled per user request
    if (!SCROLL_ROTATION_CONFIG.enableCardSnap) return;
    
    if (!this.currentRingComponent || this.prefersReducedMotion) return;
    const currentRotation = this.currentRingComponent.rotationDeg || 0;
    const cardAngle = 45;
    const nearestCardIndex = Math.round(-currentRotation / cardAngle);
    const targetRotation = -nearestCardIndex * cardAngle;
    const start = currentRotation;
    const duration = 800;
    const startTs = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = () => {
      const now = performance.now();
      const t = Math.min(1, (now - startTs) / duration);
      const eased = easeOut(t);
      const val = start + (targetRotation - start) * eased;
      this.currentRingComponent.rotationDeg = val;
      if (this.ringEl) {
        this.ringEl.classList.add('snap-transition');
        this.ringEl.style.setProperty('--rotation', `${-val}deg`);
      }
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.highlightActiveCard(Math.abs(nearestCardIndex) % 8);
        if (this.ringEl) this.ringEl.classList.remove('snap-transition');
      }
    };
    animate();
  }

  private prepareForTransition(): void {}

  createExitTransition(): void {
    // Exit transition disabled - scroll-driven animations handle this naturally
    return;
  }

  getIsPinned(): boolean {
    return this.isPinned;
  }

  destroy(): void {
    this.disposers.forEach(fn => fn());
    this.disposers = [];
    this.scrollTriggers.forEach(trigger => trigger.kill());
    this.scrollTriggers = [];
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.momentumId) cancelAnimationFrame(this.momentumId);
    this.isPinned = false;
  }
}
