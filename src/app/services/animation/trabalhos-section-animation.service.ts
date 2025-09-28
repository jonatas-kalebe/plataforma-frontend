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
   * Create pinned section with extended interaction
   */
  createPinnedSection(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: '#trabalhos',
      start: 'top top',
      end: '+=100%', // Extended interaction area
      pin: true,
      pinSpacing: true,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Update ring rotation based on scroll progress
        const ringContainer = document.querySelector('#trabalhos .ring-container');
        if (ringContainer) {
          // Smooth rotation based on scroll
          const rotationDegrees = progress * 360 * 2; // 2 full rotations
          gsap.set(ringContainer, {
            rotateY: rotationDegrees
          });
        }
        
        // Visual feedback near the end of pin
        if (progress > 0.9) {
          this.prepareForTransition();
        }
      },
      onEnter: () => {
        this.isPinned = true;
        this.showInteractionHints();
      },
      onLeave: () => {
        this.isPinned = false;
        this.hideInteractionHints();
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

  /**
   * Create smooth entrance animation for the ring
   */
  createRingEntrance(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const ringContainer = document.querySelector('#trabalhos .ring-container');
    const title = document.querySelector('#trabalhos h3');
    const hint = document.querySelector('#trabalhos .drag-hint');

    if (!ringContainer || !title) return;

    // Initial state - ring hidden and scaled down
    gsap.set(ringContainer, {
      scale: 0.3,
      opacity: 0,
      rotateX: 45,
      y: 100
    });

    gsap.set(title, {
      opacity: 0,
      y: -30
    });

    if (hint) {
      gsap.set(hint, {
        opacity: 0,
        y: 20
      });
    }

    const entranceTimeline = gsap.timeline({
      paused: true
    });

    // Animate title first
    entranceTimeline.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Then animate ring with dramatic entrance
    entranceTimeline.to(ringContainer, {
      scale: 1,
      opacity: 1,
      rotateX: 0,
      y: 0,
      duration: 1.2,
      ease: 'power2.out'
    }, '-=0.4');

    // Finally show hint
    if (hint) {
      entranceTimeline.to(hint, {
        opacity: 0.7,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.6');
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
   * Enhance ring drag interactions
   */
  enhanceRingInteractions(workCardRingComponent: any): void {
    if (!this.isBrowser || !workCardRingComponent) return;

    // Add cursor styling
    const ringElement = workCardRingComponent.ringRef?.nativeElement;
    if (ringElement) {
      ringElement.style.cursor = 'grab';
      
      // Add grab cursor feedback
      ringElement.addEventListener('mousedown', () => {
        ringElement.style.cursor = 'grabbing';
      });
      
      ringElement.addEventListener('mouseup', () => {
        ringElement.style.cursor = 'grab';
      });
      
      ringElement.addEventListener('mouseleave', () => {
        ringElement.style.cursor = 'grab';
      });
    }

    // Enhanced visual feedback for card selection
    const originalActiveIndexChange = workCardRingComponent.activeIndexChange;
    workCardRingComponent.activeIndexChange = {
      emit: (index: number) => {
        this.highlightActiveCard(index);
        if (originalActiveIndexChange) {
          originalActiveIndexChange.emit(index);
        }
      }
    };
  }

  /**
   * Highlight the active card with visual effects
   */
  private highlightActiveCard(index: number): void {
    const cards = document.querySelectorAll('#trabalhos .work-card');
    
    cards.forEach((card, i) => {
      if (i === index) {
        // Highlight active card
        gsap.to(card, {
          scale: 1.05,
          boxShadow: '0 0 30px rgba(64, 224, 208, 0.4)',
          borderColor: 'rgba(64, 224, 208, 0.8)',
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        // Dim other cards
        gsap.to(card, {
          scale: 0.95,
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });
  }

  /**
   * Show interaction hints when section is pinned
   */
  private showInteractionHints(): void {
    const hint = document.querySelector('#trabalhos .drag-hint');
    if (hint) {
      gsap.to(hint, {
        opacity: 0.8,
        scale: 1.05,
        duration: 0.5,
        ease: 'power2.out'
      });
      
      // Pulse effect to draw attention
      gsap.to(hint, {
        opacity: 0.5,
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
      gsap.killTweensOf(hint); // Stop pulsing
      gsap.to(hint, {
        opacity: 0.3,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Prepare for transition to next section
   */
  private prepareForTransition(): void {
    const ringContainer = document.querySelector('#trabalhos .ring-container');
    if (ringContainer) {
      // Subtle visual feedback that we're about to leave
      gsap.to(ringContainer, {
        scale: 0.95,
        opacity: 0.8,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
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
        const ringContainer = document.querySelector('#trabalhos .ring-container');
        if (ringContainer) {
          gsap.to(ringContainer, {
            scale: 0.8,
            opacity: 0.6,
            rotateX: -15,
            y: -50,
            duration: 0.8,
            ease: 'power2.in'
          });
        }
      },
      onEnterBack: () => {
        const ringContainer = document.querySelector('#trabalhos .ring-container');
        if (ringContainer) {
          gsap.to(ringContainer, {
            scale: 1,
            opacity: 1,
            rotateX: 0,
            y: 0,
            duration: 0.8,
            ease: 'power2.out'
          });
        }
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