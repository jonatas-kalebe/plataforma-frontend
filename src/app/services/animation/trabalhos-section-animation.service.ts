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
      end: '+=100%', // Extended interaction area as specified
      pin: true,
      pinSpacing: true,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Store scroll progress for access by external components
        this.scrollProgress = progress;
        
        // Try to update ring component if available
        this.updateRingScrollProgress(progress);
        
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
   * Update ring component with scroll progress
   */
  private updateRingScrollProgress(progress: number): void {
    if (this.currentRingComponent && typeof this.currentRingComponent === 'object') {
      // Directly set scrollProgress if it exists
      if ('scrollProgress' in this.currentRingComponent) {
        this.currentRingComponent.scrollProgress = progress;
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