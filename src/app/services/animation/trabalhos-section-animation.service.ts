import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class TrabalhosSectionAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private scrollTriggers: ScrollTrigger[] = [];
  private prefersReducedMotion: boolean = false;
  private isPinned: boolean = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /**
   * Create pinned section with extended interaction (100% viewport height)
   * Enhanced scroll-driven rotation with magnetic snap points
   */
  createPinnedSection(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: '#trabalhos',
      start: 'top top',
      end: '+=100%', // Extended interaction area as specified (100% viewport height)
      pin: true,
      pinSpacing: true,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Store scroll progress for access by external components
        this.scrollProgress = progress;
        
        // Enhanced scroll-driven rotation with magnetic snap points
        this.updateRingScrollProgress(progress);
        
        // Dynamic rotation factor with magnetic snap points
        const totalRotation = progress * 360 * 2; // 2 full rotations through scroll
        const snapAngle = 45; // Degrees per card (360/8 = 45)
        const isNearSnap = (totalRotation % snapAngle) < 15 || (totalRotation % snapAngle) > 30;
        
        // Apply magnetic snap at mid-scroll (progress ~0.5) as specified
        if (progress > 0.45 && progress < 0.55 && isNearSnap) {
          const snappedRotation = Math.round(totalRotation / snapAngle) * snapAngle;
          this.applyRingRotation(snappedRotation, true);
        } else {
          this.applyRingRotation(totalRotation, false);
        }
        
        // Visual feedback near the end of pin
        if (progress > 0.9) {
          this.prepareForTransition();
        }
      },
      onEnter: () => {
        this.isPinned = true;
        this.showInteractionHints();
        console.log('Trabalhos section pinned - scroll controls 3D carousel');
      },
      onLeave: () => {
        this.isPinned = false;
        this.hideInteractionHints();
        console.log('Trabalhos section unpinned - transitioning to CTA');
      },
      onEnterBack: () => {
        this.isPinned = true;
        this.showInteractionHints();
      },
      onLeaveBack: () => {
        this.isPinned = false;
        this.hideInteractionHints();
      }
    });

    this.scrollTriggers.push(trigger);
  }

  // Store scroll progress for external access
  public scrollProgress: number = 0;
  private currentRingComponent: any = null;

  /**
   * Register ring component for scroll progress updates
   */
  setRingComponent(ringComponent: any): void {
    this.currentRingComponent = ringComponent;
  }

  /**
   * Update ring component with scroll progress and rotation
   */
  private updateRingScrollProgress(progress: number): void {
    if (this.currentRingComponent && typeof this.currentRingComponent === 'object') {
      // Directly set scrollProgress if it exists
      if ('scrollProgress' in this.currentRingComponent) {
        this.currentRingComponent.scrollProgress = progress;
      }
      
      // Also update rotation if the component supports it
      if ('rotationDeg' in this.currentRingComponent) {
        const totalRotation = progress * 360 * 2; // 2 full rotations
        this.currentRingComponent.rotationDeg = -totalRotation; // Negative for proper direction
      }
    }
  }

  /**
   * Apply rotation to ring with magnetic snap effects
   */
  private applyRingRotation(rotation: number, isSnapped: boolean): void {
    const ring = document.querySelector('#trabalhos .ring');
    if (ring) {
      const transform = `translateZ(0) rotateY(${-rotation}deg)`;
      
      if (isSnapped) {
        // Smooth snap transition
        gsap.to(ring, {
          rotation: -rotation,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        // Direct rotation following scroll
        gsap.set(ring, {
          rotation: -rotation,
          force3D: true
        });
      }
    }
  }

  /**
   * Create smooth entrance animation for the ring
   */
  createRingEntrance(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const ringContainer = document.querySelector('#trabalhos .ring-container');
    const title = document.querySelector('#trabalhos h3');
    const hint = document.querySelector('#trabalhos .drag-hint');

    if (!ringContainer || !title) return;

    // Simplified initial state - just fade in, no complex scaling
    gsap.set(ringContainer, {
      opacity: 0,
      y: 30
    });

    gsap.set(title, {
      opacity: 0,
      y: -20
    });

    if (hint) {
      gsap.set(hint, {
        opacity: 0,
        y: 15
      });
    }

    const entranceTimeline = gsap.timeline({
      paused: true
    });

    // Animate title first
    entranceTimeline.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    });

    // Then animate ring with simple fade-in
    entranceTimeline.to(ringContainer, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.3');

    // Finally show hint
    if (hint) {
      entranceTimeline.to(hint, {
        opacity: 0.7,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.4');
    }

    // Trigger animation when section becomes visible
    const trigger = ScrollTrigger.create({
      trigger: '#trabalhos',
      start: 'top 80%',
      onEnter: () => {
        entranceTimeline.play();
      },
      once: true
    });

    this.scrollTriggers.push(trigger);
  }

  /**
   * Enhance ring drag interactions with momentum and snap
   */
  enhanceRingInteractions(workCardRingComponent: any): void {
    if (!this.isBrowser || !workCardRingComponent) return;

    // Add cursor styling
    const ringElement = workCardRingComponent.ringRef?.nativeElement;
    if (ringElement) {
      ringElement.style.cursor = 'grab';
      
      // Enhanced drag cursor feedback
      ringElement.addEventListener('mousedown', () => {
        ringElement.style.cursor = 'grabbing';
        // Temporarily disable scroll-driven rotation during drag
        if (this.currentRingComponent) {
          this.currentRingComponent.isDragging = true;
        }
      });
      
      ringElement.addEventListener('mouseup', () => {
        ringElement.style.cursor = 'grab';
        // Re-enable scroll-driven rotation after drag
        if (this.currentRingComponent) {
          this.currentRingComponent.isDragging = false;
          this.snapToNearestCard();
        }
      });
      
      ringElement.addEventListener('mouseleave', () => {
        ringElement.style.cursor = 'grab';
        // Re-enable scroll control and snap to nearest card
        if (this.currentRingComponent) {
          this.currentRingComponent.isDragging = false;
          this.snapToNearestCard();
        }
      });

      // Enhanced touch handling for mobile
      ringElement.addEventListener('touchstart', (e: TouchEvent) => {
        // Add haptic feedback for drag start
        if (navigator.vibrate) {
          navigator.vibrate(30); // Short haptic pulse
        }
        
        if (this.currentRingComponent) {
          this.currentRingComponent.isDragging = true;
        }
        
        // Visual feedback for touch drag
        gsap.to(ringElement, {
          scale: 1.02,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      ringElement.addEventListener('touchend', () => {
        if (this.currentRingComponent) {
          this.currentRingComponent.isDragging = false;
          this.snapToNearestCard();
        }
        
        // Reset touch visual feedback
        gsap.to(ringElement, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });

        // Haptic feedback for release
        if (navigator.vibrate) {
          navigator.vibrate(20);
        }
      });
    }

    // Enhanced visual feedback for card selection with momentum
    const originalActiveIndexChange = workCardRingComponent.activeIndexChange;
    workCardRingComponent.activeIndexChange = {
      emit: (index: number) => {
        this.highlightActiveCard(index);
        
        // Add haptic feedback for card selection
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]); // Pattern for selection
        }
        
        if (originalActiveIndexChange) {
          originalActiveIndexChange.emit(index);
        }
      }
    };
  }

  /**
   * Highlight the active card with enhanced visual effects
   */
  private highlightActiveCard(index: number): void {
    const cards = document.querySelectorAll('#trabalhos .work-card');
    
    cards.forEach((card, i) => {
      if (i === index) {
        // Enhanced highlight for active card with glow trails
        gsap.to(card, {
          scale: 1.08,
          boxShadow: '0 0 40px rgba(64, 224, 208, 0.6), 0 0 80px rgba(64, 224, 208, 0.3)',
          borderColor: 'rgba(64, 224, 208, 1)',
          duration: 0.4,
          ease: 'power2.out'
        });
        
        // Add pulsing glow effect for active card
        gsap.to(card, {
          boxShadow: '0 0 60px rgba(64, 224, 208, 0.8), 0 0 100px rgba(64, 224, 208, 0.4)',
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        });
      } else {
        // Subtle dim for inactive cards with depth
        gsap.killTweensOf(card); // Stop any pulsing
        gsap.to(card, {
          scale: 0.92,
          boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          opacity: 0.7,
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });
  }

  /**
   * Show enhanced interaction hints when section is pinned
   */
  private showInteractionHints(): void {
    const hint = document.querySelector('#trabalhos .drag-hint');
    if (hint) {
      gsap.to(hint, {
        opacity: 0.9,
        scale: 1.05,
        y: -5, // Slight upward float
        duration: 0.6,
        ease: 'power2.out'
      });
      
      // Enhanced pulse effect with breathing animation
      gsap.to(hint, {
        opacity: 0.6,
        scale: 0.98,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
      
      // Subtle color shift to draw attention
      gsap.to(hint, {
        color: 'rgba(64, 224, 208, 0.8)',
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }
  }

  /**
   * Hide interaction hints when leaving section
   */
  private hideInteractionHints(): void {
    const hint = document.querySelector('#trabalhos .drag-hint');
    if (hint) {
      gsap.killTweensOf(hint); // Stop pulsing and color animations
      gsap.to(hint, {
        opacity: 0.4,
        scale: 1,
        y: 0,
        color: 'rgba(255, 255, 255, 0.7)', // Reset to original color
        duration: 0.4,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Snap to nearest card with magnetic attraction
   */
  private snapToNearestCard(): void {
    if (!this.currentRingComponent || this.prefersReducedMotion) return;

    const currentRotation = this.currentRingComponent.rotationDeg || 0;
    const cardAngle = 360 / 8; // 45 degrees per card
    const nearestCardIndex = Math.round(-currentRotation / cardAngle);
    const targetRotation = -nearestCardIndex * cardAngle;
    
    // Smooth snap to nearest card with magnetic feel
    if (this.currentRingComponent.rotationDeg !== undefined) {
      gsap.to(this.currentRingComponent, {
        rotationDeg: targetRotation,
        duration: 0.8,
        ease: 'power3.out', // More pronounced easing for magnetic feel
        onUpdate: () => {
          // Apply rotation to DOM element
          const ring = document.querySelector('#trabalhos .ring');
          if (ring) {
            gsap.set(ring, {
              rotation: this.currentRingComponent.rotationDeg,
              force3D: true
            });
          }
        },
        onComplete: () => {
          // Highlight the snapped card
          this.highlightActiveCard(Math.abs(nearestCardIndex) % 8);
        }
      });
    }
  }

  /**
   * Prepare for transition to next section
   */
  private prepareForTransition(): void {
    // Remove problematic scale/opacity changes that cause visual artifacts
    console.log('Preparing trabalhos section for transition');
  }

  /**
   * Create coordinated exit animation to CTA
   */
  createExitTransition(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: '#trabalhos',
      start: 'bottom 50%',
      onLeave: () => {
        // Remove problematic scaling animations 
        console.log('Trabalhos section exiting');
      },
      onEnterBack: () => {
        // Simple re-entry without scaling
        console.log('Trabalhos section re-entering');
      }
    });

    this.scrollTriggers.push(trigger);
  }

  /**
   * Get pinned state
   */
  getIsPinned(): boolean {
    return this.isPinned;
  }

  /**
   * Destroy all animations and clean up
   */
  destroy(): void {
    // Kill all ScrollTriggers
    this.scrollTriggers.forEach(trigger => {
      trigger.kill();
    });
    this.scrollTriggers = [];
    
    this.isPinned = false;
  }
}