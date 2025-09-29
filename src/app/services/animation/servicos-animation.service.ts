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
   * Enhanced with 85% scroll trigger as specified in requirements
   */
  createStaggeredEntrance(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser) return;

    const cardsArray = Array.from(cards);

    // Initial state - cards hidden and translated
    gsap.set(cardsArray, {
      opacity: 0,
      y: this.prefersReducedMotion ? 20 : 60,
      scale: this.prefersReducedMotion ? 1 : 0.95
    });

    // Create staggered entrance animation
    const entranceTimeline = gsap.timeline({
      paused: true
    });

    entranceTimeline.to(cardsArray, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: this.prefersReducedMotion ? 0.3 : 0.8,
      ease: this.prefersReducedMotion ? 'none' : 'power3.out',
      stagger: this.prefersReducedMotion ? 0.1 : 0.15 // 150ms delay between cards
    });

    this.animations.push(entranceTimeline);

    // ScrollTrigger to play animation at 85% as specified in requirements
    const trigger = ScrollTrigger.create({
      trigger: '#servicos',
      start: 'top 85%', // Changed from 75% to 85% as specified
      onEnter: () => {
        entranceTimeline.play();
      },
      onLeave: () => {
        // Don't reverse, keep cards visible for reading
      },
      onEnterBack: () => {
        // Cards should already be visible
      }
    });

    this.scrollTriggers.push(trigger);
  }

  /**
   * Create subtle parallax effect for service cards
   * Enhanced with drift upward movement as specified in requirements
   */
  createParallaxEffect(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const cardsArray = Array.from(cards);

    cardsArray.forEach((card, index) => {
      // Different parallax speeds for visual depth
      const speed = 1 + (index * 0.1);

      const trigger = ScrollTrigger.create({
        trigger: '#servicos',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;

          // Subtle parallax movement that drifts cards upward
          // Extra 30px upward movement when section is scrolled further (as specified)
          const baseMove = (progress - 0.5) * 20 * speed;
          const extraDrift = progress > 0.5 ? (progress - 0.5) * 30 : 0;
          const totalMove = baseMove - extraDrift; // Negative for upward drift

          gsap.set(card, {
            y: totalMove,
            rotateX: (progress - 0.5) * 1.5, // Reduced for subtlety
            force3D: true // Optimize for performance
          });
        }
      });

      this.scrollTriggers.push(trigger);
    });
  }

  /**
   * Create magnetic hover effects for cards
   * Enhanced with mobile touch handling and haptic feedback
   */
  createMagneticHover(cards: NodeListOf<Element> | Element[]): void {
    if (!this.isBrowser) return;

    const cardsArray = Array.from(cards);

    cardsArray.forEach((card) => {
      // Mouse enter
      card.addEventListener('mouseenter', () => {
        // Always provide some hover feedback, even with reduced motion
        if (this.prefersReducedMotion) {
          // Simplified hover for reduced motion
          gsap.to(card, {
            scale: 1.02,
            opacity: 0.95,
            duration: 0.3,
            ease: 'power2.out'
          });
        } else {
          // Full magnetic hover effect with lift and glow
          gsap.to(card, {
            scale: 1.05,
            y: -8,
            rotateY: 2,
            duration: 0.4,
            ease: 'power2.out'
          });
        }

        // Enhanced glow effect that feels rewarding
        gsap.to(card, {
          boxShadow: this.prefersReducedMotion
            ? '0 10px 30px rgba(64, 224, 208, 0.2)'
            : '0 20px 40px rgba(64, 224, 208, 0.3), 0 0 20px rgba(64, 224, 208, 0.1)',
          borderColor: 'rgba(64, 224, 208, 0.6)',
          duration: 0.4,
          ease: 'power2.out'
        });
      });

      // Mouse leave
      card.addEventListener('mouseleave', () => {
        // Reset hover state (always)
        gsap.to(card, {
          scale: 1,
          y: 0,
          rotateY: 0,
          opacity: 1,
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

      // Enhanced touch effects for mobile with haptic feedback
      card.addEventListener('touchstart', (e) => {
        // Add haptic feedback for supported devices
        if (navigator.vibrate) {
          navigator.vibrate(50); // Short, subtle vibration as specified
        }

        // Visual feedback for touch - scale up slightly
        gsap.to(card, {
          scale: this.prefersReducedMotion ? 1.01 : 1.02,
          duration: 0.2,
          ease: 'power2.out'
        });

        // Add subtle glow on touch
        gsap.to(card, {
          boxShadow: '0 8px 25px rgba(64, 224, 208, 0.15)',
          borderColor: 'rgba(64, 224, 208, 0.3)',
          duration: 0.2,
          ease: 'power2.out'
        });

        // Prevent mouse events on touch devices
        e.preventDefault();
      });

      card.addEventListener('touchend', () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });

        // Remove touch glow
        gsap.to(card, {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderColor: 'transparent',
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      // Mouse move for subtle magnetic effect - only if no reduced motion
      if (!this.prefersReducedMotion) {
        card.addEventListener('mousemove', (e: any) => {
          if (e.clientX && e.clientY) {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);

            // Subtle magnetic attraction to cursor
            gsap.to(card, {
              rotateX: deltaY * -3, // Reduced intensity for subtlety
              rotateY: deltaX * 3,
              x: deltaX * 2, // Slight movement toward cursor
              y: deltaY * 2,
              duration: 0.3,
              ease: 'power1.out'
            });
          }
        });
      }
    });
  }

  /**
   * Create scroll-based section snapping with 90-95% threshold for reading content
   * Enhanced magnetic behavior that doesn't interrupt reading
   */
  createSectionSnapping(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const trigger = ScrollTrigger.create({
      trigger: '#servicos',
      start: 'top top',
      end: 'bottom bottom',
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;

        // Brief pin at 50% for reading focus (20% viewport height as specified)
        if (progress > 0.45 && progress < 0.55) {
          // Slow down scroll in the middle for content absorption
          self.scroll(self.start + (self.end - self.start) * 0.5);
        }

        // Visual feedback for the floating cards effect
        const cards = document.querySelectorAll('#servicos .service-card');
        cards.forEach((card, i) => {
          const cardProgress = Math.min(1, Math.max(0, progress + (i * 0.1)));
          const floatIntensity = Math.sin(cardProgress * Math.PI) * 5;

          gsap.set(card, {
            y: `+=${floatIntensity}`,
            rotateY: cardProgress * 2,
            force3D: true
          });
        });
      },
      onEnter: () => {
        console.log('Serviços section pinned for enhanced reading experience');
      },
      onLeave: () => {
        console.log('Serviços section released, transitioning to next section');
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
