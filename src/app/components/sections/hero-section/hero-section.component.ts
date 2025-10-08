import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ThreeParticleBackgroundComponent } from '../../three-particle-background/three-particle-background.component';
import { SECTION_IDS } from '../../../shared/constants/section.constants';
import { ScrollOrchestrationService } from '../../../services/scroll-orchestration.service';
import { NativeScrollAnimationService } from '../../../services/animation/native-scroll-animation.service';
import gsap from 'gsap';

// Import configurations from hero animation service
import { 
  MOUSE_PARALLAX_CONFIG,
  TILT_CONFIG,
  SHOCKWAVE_CONFIG,
  PERFORMANCE_CONFIG,
  RESPONSIVE_CONFIG
} from '../../../services/animation/hero-animation.service';

// ============================================================================
// 🎨 COMPONENT CONFIGURATION - Customize component-specific settings here
// ============================================================================

/** Configuration for scroll-based fade/movement */
const SCROLL_FADE_CONFIG = {
  /** Enable scroll-based fade and movement */
  enabled: true,
  
  /** Resistance phase progress (0-1) */
  resistancePhase: 0.2,
  
  /** Title resistance movement (pixels) */
  titleResistanceY: 40,
  
  /** Title resistance opacity min */
  titleResistanceOpacity: 0.7,
  
  /** Subtitle resistance movement (pixels) */
  subtitleResistanceY: 25,
  
  /** Subtitle resistance opacity min */
  subtitleResistanceOpacity: 0.8,
  
  /** Title acceleration movement multiplier */
  titleAccelerationMultiplier: 100,
  
  /** Title acceleration opacity multiplier */
  titleAccelerationOpacityMult: 1.5,
  
  /** Subtitle acceleration movement multiplier */
  subtitleAccelerationMultiplier: 80,
  
  /** Subtitle acceleration opacity multiplier */
  subtitleAccelerationOpacityMult: 1.2,
  
  /** CTA acceleration movement multiplier */
  ctaAccelerationMultiplier: 60,
  
  /** Scroll hint fade speed */
  scrollHintFadeSpeed: 2
} as const;

/** Configuration for scroll hint animation */
const SCROLL_HINT_CONFIG = {
  /** Enable pulse-float animation */
  enablePulseFloat: true,
  
  /** CSS animation class */
  animationClass: 'pulse-float'
} as const;

// ============================================================================
// 🎯 COMPONENT IMPLEMENTATION - Do not modify unless necessary
// ============================================================================

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
  private nativeScrollService = new NativeScrollAnimationService();
  private scrollHandler: (() => void) | null = null;
  private mouseParallaxRAF: number | null = null;
  private isMobile = false;

  constructor(private scrollService: ScrollOrchestrationService) {}
  
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Detect mobile
    this.detectMobile();

    // Get element references
    this.heroTitle = document.querySelector('#hero-title') as HTMLElement;
    this.heroSubtitle = document.querySelector('#hero-subtitle') as HTMLElement; 
    this.heroCta = document.querySelector('#hero-cta') as HTMLElement;
    this.scrollHint = document.querySelector('#scroll-hint') as HTMLElement;

    this.sectionReady.emit(this.heroBg);
    
    // Set up all hero animations and interactions
    this.setupScrollAnimations();
    this.setupScrollHintAnimation();
    this.setupMouseParallaxEffects();
    this.setupDeviceTiltEffects();
    this.setupShockwaveEffects();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.nativeScrollService.destroy();
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler, { passive: true } as any);
      }
      if (this.mouseParallaxRAF) {
        cancelAnimationFrame(this.mouseParallaxRAF);
      }
    }
  }

  /**
   * Detect mobile device
   */
  private detectMobile(): void {
    this.isMobile = window.innerWidth < RESPONSIVE_CONFIG.mobileBreakpoint;
    const onResize = () => {
      this.isMobile = window.innerWidth < RESPONSIVE_CONFIG.mobileBreakpoint;
    };
    window.addEventListener('resize', onResize, { passive: true });
  }

  /**
   * Setup scroll-based fade and acceleration animations
   */
  private setupScrollAnimations(): void {
    if (!this.heroTitle || !this.heroSubtitle || !SCROLL_FADE_CONFIG.enabled) return;

    // Skip scroll animations if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    // Create native scroll handler for fade/movement effects
    this.scrollHandler = () => {
      this.updateScrollFade();
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking && this.scrollHandler && PERFORMANCE_CONFIG.useRAF) {
        requestAnimationFrame(() => {
          this.scrollHandler!();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
  }

  /**
   * Update fade and movement based on scroll position
   * Separate from mouse parallax to avoid conflicts
   */
  private updateScrollFade(): void {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    const rect = heroSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate scroll progress (0 = hero starts entering viewport, 1 = hero completely exits)
    const sectionTop = rect.top;
    const sectionHeight = rect.height;
    const progress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (windowHeight + sectionHeight)));

    if (progress <= SCROLL_FADE_CONFIG.resistancePhase) {
      // 0-20%: Gentle resistance - small movement
      const resistanceProgress = progress / SCROLL_FADE_CONFIG.resistancePhase;
      const resistance = resistanceProgress * 0.2;
      
      // Only modify opacity and Y, not X or rotation (mouse parallax handles those)
      if (this.heroTitle) {
        gsap.set(this.heroTitle, {
          y: -resistance * SCROLL_FADE_CONFIG.titleResistanceY,
          opacity: Math.max(SCROLL_FADE_CONFIG.titleResistanceOpacity, 1 - resistance * 0.3),
          overwrite: 'auto'
        });
      }
      
      if (this.heroSubtitle) {
        gsap.set(this.heroSubtitle, {
          y: -resistance * SCROLL_FADE_CONFIG.subtitleResistanceY,
          opacity: Math.max(SCROLL_FADE_CONFIG.subtitleResistanceOpacity, 1 - resistance * 0.2),
          overwrite: 'auto'
        });
      }
    } else {
      // >20%: Acceleration - progressively larger movement
      const accelerationProgress = (progress - SCROLL_FADE_CONFIG.resistancePhase) / (1 - SCROLL_FADE_CONFIG.resistancePhase);
      const acceleratedMovement = 0.2 + (accelerationProgress * accelerationProgress * 2);
      
      if (this.heroTitle) {
        gsap.set(this.heroTitle, {
          y: -acceleratedMovement * SCROLL_FADE_CONFIG.titleAccelerationMultiplier,
          opacity: Math.max(0, 1 - acceleratedMovement * SCROLL_FADE_CONFIG.titleAccelerationOpacityMult),
          overwrite: 'auto'
        });
      }
      
      if (this.heroSubtitle) {
        gsap.set(this.heroSubtitle, {
          y: -acceleratedMovement * SCROLL_FADE_CONFIG.subtitleAccelerationMultiplier,
          opacity: Math.max(0, 1 - acceleratedMovement * SCROLL_FADE_CONFIG.subtitleAccelerationOpacityMult),
          overwrite: 'auto'
        });
      }

      if (this.heroCta) {
        gsap.set(this.heroCta, {
          y: -acceleratedMovement * SCROLL_FADE_CONFIG.ctaAccelerationMultiplier,
          opacity: Math.max(0, 1 - acceleratedMovement),
          overwrite: 'auto'
        });
      }
    }

    // Fade out scroll hint as user scrolls
    if (this.scrollHint) {
      gsap.set(this.scrollHint, {
        opacity: Math.max(0, 1 - progress * SCROLL_FADE_CONFIG.scrollHintFadeSpeed),
        overwrite: 'auto'
      });
    }
  }

  /**
   * Setup animated scroll hint using CSS animation
   */
  private setupScrollHintAnimation(): void {
    if (!this.scrollHint || !SCROLL_HINT_CONFIG.enablePulseFloat) return;

    // Add CSS animation class instead of using GSAP
    this.scrollHint.classList.add(SCROLL_HINT_CONFIG.animationClass);
  }

  /**
   * Handle CTA click
   */
  onCtaClick(event: Event): void {
    this.ctaClicked.emit(event);
  }

  /**
   * Setup mouse/touch parallax effects for Hero elements
   * Uses X and rotation only (Y is controlled by scroll)
   */
  private setupMouseParallaxEffects(): void {
    if (!isPlatformBrowser(this.platformId) || !MOUSE_PARALLAX_CONFIG.enabled) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const heroSection = document.querySelector('#hero') as HTMLElement;
    if (!heroSection) return;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Get responsive multiplier
    const getMultiplier = () => {
      return (RESPONSIVE_CONFIG.reduceParallaxOnMobile && this.isMobile) 
        ? RESPONSIVE_CONFIG.mobileParallaxMultiplier 
        : 1;
    };

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
      mouseX += (targetX - mouseX) * MOUSE_PARALLAX_CONFIG.interpolationFactor;
      mouseY += (targetY - mouseY) * MOUSE_PARALLAX_CONFIG.interpolationFactor;

      const multiplier = getMultiplier();

      // Only modify X and rotation (Y is controlled by scroll fade)
      if (this.heroTitle) {
        gsap.set(this.heroTitle, {
          x: mouseX * MOUSE_PARALLAX_CONFIG.titleMoveX * multiplier,
          rotationX: mouseY * MOUSE_PARALLAX_CONFIG.titleTilt,
          rotationY: mouseX * MOUSE_PARALLAX_CONFIG.titleTilt,
          force3D: PERFORMANCE_CONFIG.force3D,
          overwrite: 'auto'
        });
      }

      if (this.heroSubtitle) {
        gsap.set(this.heroSubtitle, {
          x: mouseX * MOUSE_PARALLAX_CONFIG.subtitleMoveX * multiplier,
          rotationX: mouseY * MOUSE_PARALLAX_CONFIG.subtitleTilt,
          rotationY: mouseX * MOUSE_PARALLAX_CONFIG.subtitleTilt,
          force3D: PERFORMANCE_CONFIG.force3D,
          overwrite: 'auto'
        });
      }

      if (this.heroCta) {
        gsap.set(this.heroCta, {
          x: mouseX * MOUSE_PARALLAX_CONFIG.ctaMoveX * multiplier,
          force3D: PERFORMANCE_CONFIG.force3D,
          overwrite: 'auto'
        });
      }

      if (PERFORMANCE_CONFIG.useRAF) {
        this.mouseParallaxRAF = requestAnimationFrame(animateParallax);
      }
    };

    // Start parallax animation
    animateParallax();

    // Add event listeners
    heroSection.addEventListener('mousemove', handleMouseMove);
    heroSection.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
    });
  }

  /**
   * Setup device orientation tilt support for mobile
   */
  private setupDeviceTiltEffects(): void {
    if (!TILT_CONFIG.enabled || !('DeviceOrientationEvent' in window)) return;

    let tiltX = 0;
    let tiltY = 0;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // Normalize tilt values
      tiltX = (event.gamma || 0) / 45; // -1 to 1
      tiltY = (event.beta || 0) / 90; // -1 to 1

      // Only modify X and rotation (Y is controlled by scroll fade)
      if (this.heroTitle) {
        gsap.set(this.heroTitle, {
          x: tiltX * TILT_CONFIG.titleTiltX,
          rotationX: tiltY * TILT_CONFIG.titleTiltRotation,
          rotationY: tiltX * TILT_CONFIG.titleTiltRotation,
          force3D: PERFORMANCE_CONFIG.force3D,
          overwrite: 'auto'
        });
      }

      if (this.heroSubtitle) {
        gsap.set(this.heroSubtitle, {
          x: tiltX * TILT_CONFIG.subtitleTiltX,
          rotationX: tiltY * TILT_CONFIG.subtitleTiltRotation,
          rotationY: tiltX * TILT_CONFIG.subtitleTiltRotation,
          force3D: PERFORMANCE_CONFIG.force3D,
          overwrite: 'auto'
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
    if (!isPlatformBrowser(this.platformId) || !SHOCKWAVE_CONFIG.enabled) return;

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
            scale: SHOCKWAVE_CONFIG.clickScale,
            duration: SHOCKWAVE_CONFIG.clickDuration,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
            overwrite: 'auto'
          });
        }
      }
    };

    heroSection.addEventListener('click', handleClick);
    heroSection.addEventListener('touchend', handleClick);
  }
}
