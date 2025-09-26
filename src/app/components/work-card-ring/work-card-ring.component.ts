import { Component, ElementRef, NgZone, ViewChild, ViewChildren, AfterViewInit, OnDestroy, PLATFORM_ID, inject, Input, QueryList, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Draggable } from 'gsap/Draggable';
import { ScrollOrchestrationService, ScrollState } from '../../services/scroll-orchestration.service';
import { Subject, takeUntil } from 'rxjs';

// Ensure GSAP plugins are registered
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable);

@Component({
  selector: 'app-work-card-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-card-ring.component.html',
  styleUrls: ['./work-card-ring.component.css']
})
export class WorkCardRingComponent implements AfterViewInit, OnDestroy, OnChanges {
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('ring', { static: true }) ring!: ElementRef<HTMLDivElement>;
  @ViewChildren('card') cards!: QueryList<ElementRef<HTMLDivElement>>;

  items = Array.from({ length: 8 }).map((_, i) => ({ i, title: `Projeto ${i + 1}` }));

  isDragging = false;
  private radius = 200;
  private rafId: number | null = null;
  private destroy$ = new Subject<void>();
  private prefersReducedMotion = false;
  private draggable: any = null;
  private dragCleanup: (() => void) | null = null;
  @Input() scrollProgress: number | undefined;
  
  // Structure expected by tests
  private rotation = {
    current: 0,
    target: 0
  };
  
  // Properties for scroll-driven rotation
  private rotationFactor = 1;
  private isSnapped = true;
  private isInitialized = false;

  constructor(
    private zone: NgZone,
    private scrollService: ScrollOrchestrationService
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isInitialized) return;
    
    this.zone.runOutsideAngular(() => {
      this.checkReducedMotion();
      this.initializeCards();
      this.setupDraggable();
      this.setupScrollIntegration();
      this.startAnimationLoop();
      this.isInitialized = true;
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up custom drag events
    if (this.dragCleanup) {
      this.dragCleanup();
    }
    
    // Clean up GSAP draggable if it exists (for backward compatibility)
    if (this.draggable) {
      this.draggable[0].kill();
    }
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scrollProgress'] && this.scrollProgress !== undefined) {
      // If not snapped, follow scroll progress
      if (!this.isSnapped && !this.isDragging) {
        const expectedRotation = -this.scrollProgress * 360 * this.rotationFactor;
        this.rotation.target = expectedRotation;
      }
    }
  }

  private initializeCards(): void {
    // Handle both real QueryList and test mock
    const cardElements = this.cards?.toArray ? this.cards.toArray() : (this.cards as any)?._results || [];
    
    if (!cardElements.length) {
      return;
    }
    
    // Use window.gsap if available (for tests), otherwise use imported gsap
    const gsapInstance = (window as any).gsap || gsap;
    const angleStep = 360 / cardElements.length;
    
    cardElements.forEach((card: any, index: number) => {
      const angle = index * angleStep;
      const element = card.nativeElement || card;
      gsapInstance.set(element, {
        rotationY: angle,
        transformOrigin: `50% 50% ${-this.radius}px`
      });
    });
  }

  private setupDraggable(): void {
    if (!this.ring?.nativeElement) return;

    const ringEl = this.ring.nativeElement;
    
    // Set initial cursor
    ringEl.style.cursor = 'grab';

    // Custom drag implementation to ensure Y-axis only rotation
    this.setupCustomDrag();
  }

  private setupCustomDrag(): void {
    const ringEl = this.ring.nativeElement;
    let startX = 0;
    let startRotation = 0;
    let isPointerDown = false;
    let velocity = 0;
    let lastTime = 0;
    let lastX = 0;
    let animationId: number | null = null;
    
    const sensitivity = 0.5; // Adjust drag sensitivity
    const inertiaDecay = 0.95; // Momentum decay factor

    const handlePointerStart = (event: PointerEvent | MouseEvent | TouchEvent) => {
      isPointerDown = true;
      this.isDragging = true;
      ringEl.style.cursor = 'grabbing';
      
      // Get the X coordinate from different event types
      const clientX = 'clientX' in event ? event.clientX : 
                     ('touches' in event && event.touches.length > 0) ? event.touches[0].clientX : 0;
      
      startX = clientX;
      lastX = clientX;
      startRotation = this.rotation.target;
      velocity = 0;
      lastTime = performance.now();
      
      // Stop any ongoing inertia animation
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      
      // Only preventDefault for mouse events to avoid passive listener warnings
      if (event.type === 'mousedown') {
        event.preventDefault();
      }
    };

    const handlePointerMove = (event: PointerEvent | MouseEvent | TouchEvent) => {
      if (!isPointerDown) return;
      
      const clientX = 'clientX' in event ? event.clientX : 
                     ('touches' in event && event.touches.length > 0) ? event.touches[0].clientX : 0;
      
      const deltaX = clientX - startX;
      const currentTime = performance.now();
      const deltaTime = Math.max(currentTime - lastTime, 1);
      
      // Calculate velocity for momentum
      velocity = ((clientX - lastX) / deltaTime) * 1000 * sensitivity;
      lastX = clientX;
      lastTime = currentTime;
      
      // Update rotation - ONLY on Y-axis
      const newRotation = startRotation + (deltaX * sensitivity);
      this.rotation.target = newRotation;
      
      // Only preventDefault for mouse events
      if (event.type === 'mousemove') {
        event.preventDefault();
      }
    };

    const handlePointerEnd = (event: PointerEvent | MouseEvent | TouchEvent) => {
      if (!isPointerDown) return;
      
      isPointerDown = false;
      this.isDragging = false;
      ringEl.style.cursor = 'grab';
      
      // Add haptic feedback for mobile (if supported)
      if ('vibrate' in navigator && Math.abs(velocity) > 50) {
        navigator.vibrate(10); // Short vibration for snapping
      }
      
      // Apply momentum/inertia effect with improved physics
      if (Math.abs(velocity) > 10) {
        const startInertiaTime = performance.now();
        const startInertiaRotation = this.rotation.target;
        const initialVelocity = velocity;
        
        const inertiaAnimation = () => {
          const elapsed = performance.now() - startInertiaTime;
          const progress = Math.min(elapsed / 1000, 1); // 1 second max
          
          // Apply exponential decay to velocity with better curve
          velocity *= inertiaDecay;
          
          // Add slight easing curve for more natural feeling
          const easedVelocity = velocity * (1 - progress * 0.3);
          
          if (Math.abs(easedVelocity) > 1 && progress < 1) {
            this.rotation.target += easedVelocity * 0.016; // 60fps frame time
            animationId = requestAnimationFrame(inertiaAnimation);
          } else {
            // Snap to nearest card when inertia stops
            this.snapToNearestCard();
            // Small haptic feedback for snap completion
            if ('vibrate' in navigator && Math.abs(initialVelocity) > 100) {
              navigator.vibrate(5);
            }
            animationId = null;
          }
        };
        
        animationId = requestAnimationFrame(inertiaAnimation);
      } else {
        // Snap immediately if no significant velocity
        this.snapToNearestCard();
      }
      
      // Only preventDefault for mouse events
      if (event.type === 'mouseup') {
        event.preventDefault();
      }
    };

    // Mouse events
    ringEl.addEventListener('mousedown', handlePointerStart);
    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerEnd);

    // Touch events for mobile - make passive to avoid preventDefault warnings
    ringEl.addEventListener('touchstart', handlePointerStart, { passive: true });
    document.addEventListener('touchmove', handlePointerMove, { passive: true });
    document.addEventListener('touchend', handlePointerEnd, { passive: true });

    // Cleanup function (store for later use in ngOnDestroy)
    this.dragCleanup = () => {
      ringEl.removeEventListener('mousedown', handlePointerStart);
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerEnd);
      ringEl.removeEventListener('touchstart', handlePointerStart);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerEnd);
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }

  private snapToNearestCard(): void {
    const gsapInstance = (window as any).gsap || gsap;
    const cardAngle = 360 / 8; // 8 cards
    const nearestCardRotation = Math.round(this.rotation.target / cardAngle) * cardAngle;
    
    // For tests, animate the rotation object directly
    gsapInstance.to(this.rotation, {
      target: nearestCardRotation,
      duration: this.prefersReducedMotion ? 0.1 : 0.3,
      ease: this.prefersReducedMotion ? 'none' : 'power2.out'
    });
  }

  private startAnimationLoop(): void {
    this.smoothRotate();
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  private setupScrollIntegration(): void {
    this.scrollService.scrollState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        // Defensive check for getSection method availability
        if (typeof this.scrollService.getSection !== 'function') {
          return;
        }
        
        const trabalhosSection = this.scrollService.getSection('trabalhos');
        if (trabalhosSection && !this.isDragging) {
          const progress = trabalhosSection.progress;
          
          // Enhanced scroll-driven rotation with better dynamics
          const scrollRotation = progress * 360 * 2; // 2 full rotations during pin
          
          // Add slight momentum based on scroll velocity
          const scrollVelocity = state.velocity || 0;
          const velocityFactor = Math.min(scrollVelocity * 0.01, 2); // Cap at 2x
          
          // Apply momentum to rotation
          this.rotation.target = scrollRotation + (velocityFactor * 10);
          
          // Dynamic radius based on velocity (as requested in requirements)
          this.updateRadiusBasedOnVelocity(scrollVelocity);
          
          // Implement magnetic snapping during scroll
          const cardAngle = 360 / 8; // 45 degrees per card
          const nearestCardProgress = Math.round(progress * 8) / 8; // Snap to 8th positions
          
          // If scroll is slow, snap to nearest card
          if (scrollVelocity < 50 && Math.abs(progress - nearestCardProgress) < 0.05) {
            const snapRotation = nearestCardProgress * 360 * 2;
            this.rotation.target = snapRotation;
          }
        }
      });
  }

  private updateRadiusBasedOnVelocity(velocity: number): void {
    // Slightly increase radius based on velocity (subtle effect)
    const baseRadius = 200;
    const velocityMultiplier = Math.min(velocity * 0.001, 0.2); // Cap at 20% increase
    const dynamicRadius = baseRadius * (1 + velocityMultiplier);
    
    // Update CSS custom property for radius
    if (this.ring?.nativeElement) {
      this.ring.nativeElement.style.setProperty('--dynamic-radius', `${dynamicRadius}px`);
    }
  }

  private initAnimation(): void {
    gsap.from(this.ring.nativeElement, {
      scrollTrigger: {
        trigger: this.ring.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      rotateY: this.prefersReducedMotion ? 0 : -60,
      opacity: 0,
      duration: this.prefersReducedMotion ? 0.3 : 1.2,
      ease: this.prefersReducedMotion ? 'none' : 'power3.out'
    });
  }

  private smoothRotate = (): void => {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const gsapInstance = (window as any).gsap || gsap;
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
    const lerpFactor = this.prefersReducedMotion ? 1 : 0.1;
    
    this.rotation.current = lerp(this.rotation.current, this.rotation.target, lerpFactor);
    
    if (this.ring?.nativeElement && Math.abs(this.rotation.current - this.rotation.target) > 0.1) {
      // CRITICAL FIX: Always apply rotation ONLY on Y-axis using explicit rotateY transform
      gsapInstance.set(this.ring.nativeElement, { 
        rotateY: this.rotation.current,
        rotateX: 0,
        rotateZ: 0
      });
    }
    
    this.rafId = requestAnimationFrame(() => this.smoothRotate());
  };
}
