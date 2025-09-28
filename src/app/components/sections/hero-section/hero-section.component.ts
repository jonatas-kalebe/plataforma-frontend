import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ThreeParticleBackgroundComponent } from '../../three-particle-background/three-particle-background.component';
import { SECTION_IDS } from '../../../shared/constants/section.constants';
import { ScrollOrchestrationService } from '../../../services/scroll-orchestration.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ThreeParticleBackgroundComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
})
export class HeroSectionComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  
  // Configuration variables (customizable - at top of file)
  @Input() scrollState: any = null;
  @Input() titlePrefix: string = 'Nós Desenvolvemos ';
  @Input() titleHighlight: string = 'Momentos';
  @Input() titleSuffix: string = '.';
  
  // Event outputs
  @Output() ctaClicked = new EventEmitter<Event>();
  @Output() sectionReady = new EventEmitter<ElementRef>();
  
  // Component references
  @ViewChild('heroBg') heroBg!: ElementRef;
  @ViewChild(ThreeParticleBackgroundComponent) particleBackground!: ThreeParticleBackgroundComponent;
  
  // Constants
  readonly SECTION_ID = SECTION_IDS.HERO;
  
  // Private properties for animations
  private heroTitle!: HTMLElement;
  private heroSubtitle!: HTMLElement;
  private heroCta!: HTMLElement;
  private scrollHint!: HTMLElement;
  private scrollTriggerInstance: any = null;

  constructor(private scrollService: ScrollOrchestrationService) {}
  
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Get element references
    this.heroTitle = document.querySelector('#hero-title') as HTMLElement;
    this.heroSubtitle = document.querySelector('#hero-subtitle') as HTMLElement; 
    this.heroCta = document.querySelector('#hero-cta') as HTMLElement;
    this.scrollHint = document.querySelector('#scroll-hint') as HTMLElement;

    this.sectionReady.emit(this.heroBg);
    
    // Set up all hero animations and interactions
    this.setupScrollAnimations();
    this.setupScrollHintAnimation();
    this.setupParallaxEffects();
    this.setupShockwaveEffects();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
    }
  }

  /**
   * Setup scroll-based resistance and acceleration animations
   */
  private setupScrollAnimations(): void {
    if (!this.heroTitle || !this.heroSubtitle) return;

    // Skip scroll animations if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const gsapInstance = (window as any).gsap || gsap;
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;

    // Create scroll trigger for hero section with resistance/acceleration behavior
    this.scrollTriggerInstance = ScrollTriggerInstance.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self: any) => {
        const progress = self.progress; // 0 to 1
        
        if (progress <= 0.2) {
          // 0-20%: Gentle resistance - small movement
          const resistanceProgress = progress / 0.2; // 0 to 1 within the resistance zone
          const resistance = resistanceProgress * 0.2; // Reduced from 0.3 to 0.2 for less movement
          
          gsapInstance.set(this.heroTitle, {
            y: -resistance * 40, // Reduced from 50 to 40px (max ~8px at 20%)
            opacity: Math.max(0.7, 1 - resistance * 0.3) // Min 0.7 instead of 0.6
          });
          
          gsapInstance.set(this.heroSubtitle, {
            y: -resistance * 25, // Reduced from 30 to 25px
            opacity: Math.max(0.8, 1 - resistance * 0.2)
          });
        } else {
          // >20%: Acceleration - progressively larger movement
          const accelerationProgress = (progress - 0.2) / 0.8; // 0 to 1 within acceleration zone
          const acceleratedMovement = 0.2 + (accelerationProgress * accelerationProgress * 2); // Quadratic acceleration
          
          gsapInstance.set(this.heroTitle, {
            y: -acceleratedMovement * 100, // Larger movement with acceleration
            opacity: Math.max(0, 1 - acceleratedMovement * 1.5) // More aggressive fade
          });
          
          gsapInstance.set(this.heroSubtitle, {
            y: -acceleratedMovement * 80,
            opacity: Math.max(0, 1 - acceleratedMovement * 1.2)
          });

          gsapInstance.set(this.heroCta, {
            y: -acceleratedMovement * 60,
            opacity: Math.max(0, 1 - acceleratedMovement)
          });
        }
      }
    });
  }

  /**
   * Setup animated scroll hint
   */
  private setupScrollHintAnimation(): void {
    if (!this.scrollHint) return;

    const gsapInstance = (window as any).gsap || gsap;

    // Create floating animation for scroll hint
    gsapInstance.to(this.scrollHint, {
      y: -10,
      duration: 1.5,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true
    });

    // Fade out scroll hint as user scrolls
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self: any) => {
        const progress = self.progress;
        gsapInstance.set(this.scrollHint, {
          opacity: Math.max(0, 1 - progress * 2) // Fade out quickly
        });
      }
    });
  }

  /**
   * Handle CTA click
   */
  onCtaClick(event: Event): void {
    this.ctaClicked.emit(event);
  }

  /**
   * Setup mouse/tilt parallax effects for Hero elements
   */
  private setupParallaxEffects(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const heroSection = document.querySelector('#hero') as HTMLElement;
    if (!heroSection) return;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Mouse move handler with smooth interpolation
    const handleMouseMove = (event: MouseEvent) => {
      const rect = heroSection.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize mouse position to -1 to 1
      targetX = (event.clientX - centerX) / (rect.width / 2);
      targetY = (event.clientY - centerY) / (rect.height / 2);
    };

    // Smooth animation loop for parallax
    const animateParallax = () => {
      // Smooth interpolation
      mouseX += (targetX - mouseX) * 0.1;
      mouseY += (targetY - mouseY) * 0.1;

      if (this.heroTitle) {
        gsap.set(this.heroTitle, {
          x: mouseX * 15, // Subtle horizontal movement
          y: mouseY * 10, // Subtle vertical movement
          rotateX: mouseY * 2,
          rotateY: mouseX * 2
        });
      }

      if (this.heroSubtitle) {
        gsap.set(this.heroSubtitle, {
          x: mouseX * 8, // Less movement for subtitle
          y: mouseY * 5,
          rotateX: mouseY * 1,
          rotateY: mouseX * 1
        });
      }

      if (this.heroCta) {
        gsap.set(this.heroCta, {
          x: mouseX * 5,
          y: mouseY * 3
        });
      }

      requestAnimationFrame(animateParallax);
    };

    // Start parallax animation
    animateParallax();

    // Add event listeners
    heroSection.addEventListener('mousemove', handleMouseMove);
    heroSection.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
    });

    // DeviceOrientation support for mobile tilt
    this.setupTiltSupport();
  }

  /**
   * Setup device orientation tilt support for mobile
   */
  private setupTiltSupport(): void {
    if (!('DeviceOrientationEvent' in window)) return;

    let tiltX = 0;
    let tiltY = 0;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // Normalize tilt values
      tiltX = (event.gamma || 0) / 45; // -1 to 1
      tiltY = (event.beta || 0) / 90; // -1 to 1

      if (this.heroTitle) {
        gsap.set(this.heroTitle, {
          x: tiltX * 20,
          y: tiltY * 15,
          rotateX: tiltY * 3,
          rotateY: tiltX * 3
        });
      }

      if (this.heroSubtitle) {
        gsap.set(this.heroSubtitle, {
          x: tiltX * 12,
          y: tiltY * 8,
          rotateX: tiltY * 2,
          rotateY: tiltX * 2
        });
      }
    };

    // Request permission for iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response == 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        });
    } else {
      // Non iOS 13+ devices
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  }

  /**
   * Setup click/tap shockwave effects
   */
  private setupShockwaveEffects(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const heroSection = document.querySelector('#hero') as HTMLElement;
    if (!heroSection) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      // Trigger shockwave through particle background
      if (this.particleBackground) {
        const rect = heroSection.getBoundingClientRect();
        let clientX, clientY;

        if (event instanceof MouseEvent) {
          clientX = event.clientX;
          clientY = event.clientY;
        } else {
          // TouchEvent
          const touch = event.touches[0] || event.changedTouches[0];
          clientX = touch.clientX;
          clientY = touch.clientY;
        }

        // Normalize coordinates for particle system
        const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normalizedY = -((clientY - rect.top) / rect.height) * 2 + 1;

        // Visual feedback: brief scale animation on clicked element
        const target = event.target as HTMLElement;
        if (target && (target.closest('#hero-title') || target.closest('#hero-subtitle') || target.closest('#hero-cta'))) {
          gsap.to(target, {
            scale: 1.05,
            duration: 0.1,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
          });
        }
      }
    };

    heroSection.addEventListener('click', handleClick);
    heroSection.addEventListener('touchend', handleClick);
  }
}