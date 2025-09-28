import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class ServicosAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private animations: gsap.core.Timeline[] = [];
  private scrollTriggers: ScrollTrigger[] = [];
  private prefersReducedMotion: boolean = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  /**
   * Create staggered entrance animations for service cards
   */
  createStaggeredEntrance(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const cardsArray = Array.from(cards);
    
    // Initial state - cards hidden and translated
    gsap.set(cardsArray, {
      opacity: 0,
      y: 60,
      scale: 0.95
    });

    // Create staggered entrance animation
    const entranceTimeline = gsap.timeline({
      paused: true
    });

    entranceTimeline.to(cardsArray, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.15 // 150ms delay between cards
    });

    this.animations.push(entranceTimeline);

    // ScrollTrigger to play animation when section comes into view
    const trigger = ScrollTrigger.create({
      trigger: '#servicos',
      start: 'top 75%',
      onEnter: () => {
        entranceTimeline.play();
      },
      onLeave: () => {
        // Don't reverse, keep cards visible
      },
      onEnterBack: () => {
        // Cards should already be visible
      }
    });

    this.scrollTriggers.push(trigger);
  }

  /**
   * Create subtle parallax effect for service cards
   */
  createParallaxEffect(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const cardsArray = Array.from(cards);

    cardsArray.forEach((card, index) => {
      // Different parallax speeds for visual depth
      const speed = 1 + (index * 0.1); // Cards move at slightly different rates
      
      const trigger = ScrollTrigger.create({
        trigger: card,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          // Subtle parallax movement
          const yMove = (progress - 0.5) * 30 * speed;
          
          gsap.set(card, {
            y: yMove,
            rotateX: (progress - 0.5) * 2 // Slight 3D tilt
          });
        }
      });

      this.scrollTriggers.push(trigger);
    });
  }

  /**
   * Create magnetic hover effects for cards
   */
  createMagneticHover(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser) return;

    const cardsArray = Array.from(cards);

    cardsArray.forEach((card) => {
      // Mouse enter
      card.addEventListener('mouseenter', () => {
        if (this.prefersReducedMotion) return;
        
        gsap.to(card, {
          scale: 1.05,
          y: -8,
          rotateY: 2,
          duration: 0.4,
          ease: 'power2.out'
        });
        
        // Add glow effect
        gsap.to(card, {
          boxShadow: '0 20px 40px rgba(64, 224, 208, 0.3)',
          borderColor: 'rgba(64, 224, 208, 0.6)',
          duration: 0.4,
          ease: 'power2.out'
        });
      });

      // Mouse leave
      card.addEventListener('mouseleave', () => {
        if (this.prefersReducedMotion) return;
        
        gsap.to(card, {
          scale: 1,
          y: 0,
          rotateY: 0,
          duration: 0.4,
          ease: 'power2.out'
        });
        
        // Remove glow
        gsap.to(card, {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: 'transparent',
          duration: 0.4,
          ease: 'power2.out'
        });
      });

      // Touch effects for mobile
      card.addEventListener('touchstart', () => {
        if (this.prefersReducedMotion) return;
        
        gsap.to(card, {
          scale: 1.02,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      card.addEventListener('touchend', () => {
        if (this.prefersReducedMotion) return;
        
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      // Mouse move for subtle magnetic effect
      card.addEventListener('mousemove', (e) => {
        if (this.prefersReducedMotion) return;
        
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);
        
        gsap.to(card, {
          rotateX: deltaY * -5,
          rotateY: deltaX * 5,
          duration: 0.3,
          ease: 'power1.out'
        });
      });
    });
  }

  /**
   * Create scroll-based section snapping with 90-95% threshold
   */
  createSectionSnapping(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: '#servicos',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Pin briefly at 50% for reading focus
        if (progress > 0.45 && progress < 0.55) {
          // Brief pin effect - slow down scroll
          gsap.set('#servicos', {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1
          });
        } else {
          // Release pin
          gsap.set('#servicos', {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            width: 'auto',
            zIndex: 'auto'
          });
        }
      }
    });

    this.scrollTriggers.push(trigger);
  }

  /**
   * Destroy all animations and clean up
   */
  destroy(): void {
    // Kill all animations
    this.animations.forEach(animation => {
      animation.kill();
    });
    this.animations = [];

    // Kill all ScrollTriggers
    this.scrollTriggers.forEach(trigger => {
      trigger.kill();
    });
    this.scrollTriggers = [];
  }
}