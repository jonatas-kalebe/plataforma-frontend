import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, fromEvent, takeUntil } from 'rxjs';
import { ReducedMotionService } from '../reduced-motion.service';
import { HapticsService } from '../haptics.service';
import { FeatureFlagsService } from '../feature-flags.service';

/**
 * Refactored TrabalhosSectionAnimationService
 * SSR-safe, decoupled from DOM, event-driven architecture
 * 
 * Key improvements:
 * - Zero direct DOM access (querySelector, document access)
 * - Uses IoVisibleDirective events via component callbacks
 * - Integrated with ReducedMotionService for accessibility
 * - Integrated with HapticsService for tactile feedback
 * - Integrated with FeatureFlagsService for feature gating
 * - RxJS-based cleanup with takeUntil pattern
 * - SSR-safe with proper platform checks
 * 
 * @see https://angular.dev/guide/universal
 * @see https://angular.dev/best-practices/a11y
 */
@Injectable({ providedIn: 'root' })
export class TrabalhosSectionAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly reducedMotionService = inject(ReducedMotionService);
  private readonly hapticsService = inject(HapticsService);
  private readonly featureFlagsService = inject(FeatureFlagsService);
  
  private readonly isBrowser: boolean;
  private prefersReducedMotion = false;
  private hapticsEnabled = false;
  private destroy$ = new Subject<void>();
  
  // Animation state
  private isPinned = false;
  public scrollProgress = 0;
  private currentRingComponent: any = null;
  
  // Drag state
  private isDragging = false;
  private dragVelocity = 0;
  
  // RAF handles
  private rafId: number | null = null;
  private momentumId: number | null = null;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Subscribe to reduced motion preference changes
    if (this.isBrowser) {
      this.reducedMotionService.getPrefersReducedMotion()
        .pipe(takeUntil(this.destroy$))
        .subscribe(prefersReduced => {
          this.prefersReducedMotion = prefersReduced;
        });
      
      // Check haptics feature flag
      this.hapticsEnabled = this.featureFlagsService.isHapticsEnabled();
    } else {
      // SSR: default to reduced motion
      this.prefersReducedMotion = true;
      this.hapticsEnabled = false;
    }
  }

  /**
   * Register section element for scroll-based animations
   * Called by component with element reference
   */
  registerSectionElement(element: HTMLElement): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;
    
    // Listen for scroll events via RxJS
    fromEvent(window, 'scroll', { passive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => this.handleScroll(element));
      });
    
    // Listen for resize events
    fromEvent(window, 'resize', { passive: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Recalculate positions on resize
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = requestAnimationFrame(() => this.handleScroll(element));
      });
    
    // Initial scroll calculation
    this.handleScroll(element);
  }

  /**
   * Register ring component
   * Called by component to provide reference
   */
  setRingComponent(ringComponent: any): void {
    this.currentRingComponent = ringComponent;
  }

  /**
   * Handle scroll for section element
   * Element is passed from component, no DOM queries
   */
  private handleScroll(sectionEl: HTMLElement): void {
    if (!sectionEl) return;
    
    const rect = sectionEl.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const y = window.scrollY;
    const sectionStartY = y + rect.top;
    const start = sectionStartY;
    const end = start + viewportH;
    const progress = Math.max(0, Math.min(1, (y - start) / (end - start)));
    const pinnedNow = y >= start && y < end;
    
    // Track pinned state changes
    if (pinnedNow !== this.isPinned) {
      this.isPinned = pinnedNow;
      // State changed - components can handle UI updates
    }
    
    if (this.isDragging) return;
    
    this.scrollProgress = progress;
    this.updateRingScrollProgress(progress);
    
    const totalRotation = progress * 720;
    const snapAngle = 45;
    const mod = ((totalRotation % snapAngle) + snapAngle) % snapAngle;
    const isNearSnap = mod < 15 || mod > 30;
    
    if (progress > 0.45 && progress < 0.55 && isNearSnap) {
      const snappedRotation = Math.round(totalRotation / snapAngle) * snapAngle;
      this.applyRingRotation(snappedRotation, true);
    } else {
      this.applyRingRotation(totalRotation, false);
    }
  }

  /**
   * Update ring component rotation via component reference
   * No direct DOM manipulation
   */
  private updateRingScrollProgress(progress: number): void {
    if (this.currentRingComponent && typeof this.currentRingComponent === 'object') {
      if ('scrollProgress' in this.currentRingComponent) {
        this.currentRingComponent.scrollProgress = progress;
      }
      if (!this.isDragging && 'rotationDeg' in this.currentRingComponent) {
        const totalRotation = progress * 720;
        this.currentRingComponent.rotationDeg = -totalRotation;
      }
    }
  }

  /**
   * Apply rotation to ring element (passed from component)
   */
  private applyRingRotation(rotation: number, isSnapped: boolean): void {
    if (this.currentRingComponent && 'applyRotation' in this.currentRingComponent) {
      this.currentRingComponent.applyRotation(rotation, isSnapped);
    }
  }

  /**
   * Handle intersection observer entrance event
   * Called by component when section enters viewport
   */
  onIntersectionEnter(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;
    // Animation logic handled by CSS classes in component
    // Service just tracks state
  }

  /**
   * Handle intersection observer exit event
   * Called by component when section exits viewport
   */
  onIntersectionLeave(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;
    // Animation logic handled by CSS classes in component
    // Service just tracks state
  }

  /**
   * Enhance ring interactions with drag handlers
   * Uses component's interaction bridge pattern
   */
  enhanceRingInteractions(workCardRingComponent: any): void {
    if (!this.isBrowser || !workCardRingComponent) return;
    
    // Use interaction bridge if available (preferred pattern)
    if (typeof workCardRingComponent.registerInteractionBridge === 'function') {
      workCardRingComponent.registerInteractionBridge({
        onDragStart: () => {
          this.handleDragStart(workCardRingComponent);
        },
        onDragMove: (rotation: number, velocity: number) => {
          this.handleDragMove(rotation, velocity);
        },
        onDragEnd: (velocity: number) => {
          this.handleDragEnd(workCardRingComponent, velocity);
        },
        onActiveIndexChange: (index: number) => {
          this.handleActiveIndexChange(index);
        }
      });
    }
  }

  /**
   * Handle drag start
   */
  private handleDragStart(component: any): void {
    this.isDragging = true;
    if (component) {
      component.isDragging = true;
    }
    
    // Haptic feedback for drag start
    if (this.hapticsEnabled && this.hapticsService.isHapticsSupported()) {
      this.hapticsService.vibrate(this.hapticsService.patterns.light);
    }
  }

  /**
   * Handle drag move
   */
  private handleDragMove(rotation: number, velocity: number): void {
    this.dragVelocity = velocity;
    if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
      this.currentRingComponent.rotationDeg = rotation;
    }
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(component: any, velocity: number): void {
    this.isDragging = false;
    if (component) {
      component.isDragging = false;
    }
    this.dragVelocity = velocity;
    
    // Haptic feedback for drag end
    if (this.hapticsEnabled && this.hapticsService.isHapticsSupported()) {
      this.hapticsService.vibrate(this.hapticsService.patterns.selection);
    }
    
    // Start momentum scroll
    this.startMomentum();
  }

  /**
   * Handle active index change
   */
  private handleActiveIndexChange(index: number): void {
    // Haptic feedback for snap
    if (this.hapticsEnabled && this.hapticsService.isHapticsSupported()) {
      this.hapticsService.vibrate(this.hapticsService.patterns.snap);
    }
  }

  /**
   * Start momentum animation after drag
   */
  private startMomentum(): void {
    if (this.momentumId) cancelAnimationFrame(this.momentumId);
    
    const friction = 0.92;
    const step = () => {
      if (Math.abs(this.dragVelocity) < 0.05) {
        this.snapToNearestCard();
        return;
      }
      
      const curr = this.currentRingComponent?.rotationDeg ?? 0;
      const next = curr + this.dragVelocity;
      
      if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
        this.currentRingComponent.rotationDeg = next;
      }
      
      this.dragVelocity *= friction;
      this.momentumId = requestAnimationFrame(step);
    };
    
    this.momentumId = requestAnimationFrame(step);
  }

  /**
   * Snap to nearest card position
   */
  private snapToNearestCard(): void {
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
      
      if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
        this.currentRingComponent.rotationDeg = val;
      }
      
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Snap complete - haptic feedback
        if (this.hapticsEnabled && this.hapticsService.isHapticsSupported()) {
          this.hapticsService.vibrate(this.hapticsService.patterns.selection);
        }
      }
    };
    
    animate();
  }

  /**
   * Get current pinned state
   */
  getIsPinned(): boolean {
    return this.isPinned;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Cancel RAF animations
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.momentumId) {
      cancelAnimationFrame(this.momentumId);
      this.momentumId = null;
    }
    
    // Complete destroy subject (triggers takeUntil cleanup)
    this.destroy$.next();
    this.destroy$.complete();
    
    // Reset state
    this.isPinned = false;
    this.currentRingComponent = null;
  }
}
