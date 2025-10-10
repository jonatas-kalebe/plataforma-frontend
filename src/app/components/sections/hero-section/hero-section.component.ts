import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  inject
} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {ThreeParticleBackgroundComponent} from '../../three-particle-background/three-particle-background.component';
import {SECTION_IDS} from '../../../shared/constants/section.constants';
import {ScrollOrchestrationService} from '../../../services/scroll-orchestration.service';
import {NativeScrollAnimationService} from '../../../services/animation/native-scroll-animation.service';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ThreeParticleBackgroundComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
})
export class HeroSectionComponent implements AfterViewInit, OnDestroy {
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
  @ViewChild('heroSection') heroSection!: ElementRef<HTMLElement>;
  @ViewChild('heroTitle') heroTitle!: ElementRef<HTMLElement>;
  @ViewChild('heroSubtitle') heroSubtitle!: ElementRef<HTMLElement>;
  @ViewChild('heroCta') heroCta!: ElementRef<HTMLElement>;
  @ViewChild('scrollHint') scrollHint!: ElementRef<HTMLElement>;
  @ViewChild(ThreeParticleBackgroundComponent) particleBackground!: ThreeParticleBackgroundComponent;
  // Constants
  readonly SECTION_ID = SECTION_IDS.HERO;
  private readonly platformId = inject(PLATFORM_ID);
  private nativeScrollService = new NativeScrollAnimationService();
  private scrollHandler: (() => void) | null = null;

  constructor(private scrollService: ScrollOrchestrationService) {
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.sectionReady.emit(this.heroBg);

    // Set up all hero animations and interactions
    this.setupScrollAnimations();
    this.setupScrollHintAnimation();
    this.setupParallaxEffects();
    this.setupShockwaveEffects();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.nativeScrollService.destroy();
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler, {passive: true} as any);
      }
    }
  }

  /**
   * Handle CTA click
   */
  onCtaClick(event: Event): void {
    this.ctaClicked.emit(event);
  }

  /**
   * Setup scroll-based resistance and acceleration animations using native JavaScript
   */
  private setupScrollAnimations(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.heroTitle?.nativeElement || !this.heroSubtitle?.nativeElement) return;

    // Skip scroll animations if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    // Create native scroll handler for parallax effects
    this.scrollHandler = () => {
      this.updateParallaxElements();
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledScrollHandler = () => {
      if (!ticking && this.scrollHandler) {
        requestAnimationFrame(() => {
          this.scrollHandler!();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScrollHandler, {passive: true});
  }

  /**
   * Update parallax elements based on scroll position
   */
  private updateParallaxElements(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.heroSection?.nativeElement) return;

    const heroSectionEl = this.heroSection.nativeElement;
    const rect = heroSectionEl.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate scroll progress (0 = hero starts entering viewport, 1 = hero completely exits)
    const sectionTop = rect.top;
    const sectionHeight = rect.height;
    const progress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (windowHeight + sectionHeight)));

    if (progress <= 0.2) {
      // 0-20%: Gentle resistance - small movement
      const resistanceProgress = progress / 0.2;
      const resistance = resistanceProgress * 0.2;

      if (this.heroTitle?.nativeElement) {
        this.heroTitle.nativeElement.style.transform = `translateY(${-resistance * 40}px)`;
        this.heroTitle.nativeElement.style.opacity = Math.max(0.7, 1 - resistance * 0.3).toString();
      }

      if (this.heroSubtitle?.nativeElement) {
        this.heroSubtitle.nativeElement.style.transform = `translateY(${-resistance * 25}px)`;
        this.heroSubtitle.nativeElement.style.opacity = Math.max(0.8, 1 - resistance * 0.2).toString();
      }
    } else {
      // >20%: Acceleration - progressively larger movement
      const accelerationProgress = (progress - 0.2) / 0.8;
      const acceleratedMovement = 0.2 + (accelerationProgress * accelerationProgress * 2);

      if (this.heroTitle?.nativeElement) {
        this.heroTitle.nativeElement.style.transform = `translateY(${-acceleratedMovement * 100}px)`;
        this.heroTitle.nativeElement.style.opacity = Math.max(0, 1 - acceleratedMovement * 1.5).toString();
      }

      if (this.heroSubtitle?.nativeElement) {
        this.heroSubtitle.nativeElement.style.transform = `translateY(${-acceleratedMovement * 80}px)`;
        this.heroSubtitle.nativeElement.style.opacity = Math.max(0, 1 - acceleratedMovement * 1.2).toString();
      }

      if (this.heroCta?.nativeElement) {
        this.heroCta.nativeElement.style.transform = `translateY(${-acceleratedMovement * 60}px)`;
        this.heroCta.nativeElement.style.opacity = Math.max(0, 1 - acceleratedMovement).toString();
      }
    }

    // Fade out scroll hint as user scrolls
    if (this.scrollHint?.nativeElement) {
      this.scrollHint.nativeElement.style.opacity = Math.max(0, 1 - progress * 2).toString();
    }
  }

  /**
   * Setup animated scroll hint using CSS animation
   */
  private setupScrollHintAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.scrollHint?.nativeElement) return;

    // Add CSS animation class instead of using GSAP
    this.scrollHint.nativeElement.classList.add('pulse-float');
  }

  /**
   * Setup mouse/tilt parallax effects for Hero elements
   */
  private setupParallaxEffects(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (!this.heroSection?.nativeElement) return;
    const heroSectionEl = this.heroSection.nativeElement;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Mouse move handler with smooth interpolation
    const handleMouseMove = (event: MouseEvent) => {
      const rect = heroSectionEl.getBoundingClientRect();
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

      if (this.heroTitle?.nativeElement) {
        this.heroTitle.nativeElement.style.transform = `
          translateX(${mouseX * 15}px)
          translateY(${mouseY * 10}px)
          rotateX(${mouseY * 2}deg)
          rotateY(${mouseX * 2}deg)
        `;
      }

      if (this.heroSubtitle?.nativeElement) {
        this.heroSubtitle.nativeElement.style.transform = `
          translateX(${mouseX * 8}px)
          translateY(${mouseY * 5}px)
          rotateX(${mouseY * 1}deg)
          rotateY(${mouseX * 1}deg)
        `;
      }

      if (this.heroCta?.nativeElement) {
        this.heroCta.nativeElement.style.transform = `
          translateX(${mouseX * 5}px)
          translateY(${mouseY * 3}px)
        `;
      }

      requestAnimationFrame(animateParallax);
    };

    // Start parallax animation
    animateParallax();

    // Add event listeners
    heroSectionEl.addEventListener('mousemove', handleMouseMove);
    heroSectionEl.addEventListener('mouseleave', () => {
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
    if (!isPlatformBrowser(this.platformId)) return;
    if (!('DeviceOrientationEvent' in window)) return;

    let tiltX = 0;
    let tiltY = 0;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      // Normalize tilt values
      tiltX = (event.gamma || 0) / 45; // -1 to 1
      tiltY = (event.beta || 0) / 90; // -1 to 1

      if (this.heroTitle?.nativeElement) {
        this.heroTitle.nativeElement.style.transform = `
          translateX(${tiltX * 20}px)
          translateY(${tiltY * 15}px)
          rotateX(${tiltY * 3}deg)
          rotateY(${tiltX * 3}deg)
        `;
      }

      if (this.heroSubtitle?.nativeElement) {
        this.heroSubtitle.nativeElement.style.transform = `
          translateX(${tiltX * 12}px)
          translateY(${tiltY * 8}px)
          rotateX(${tiltY * 2}deg)
          rotateY(${tiltX * 2}deg)
        `;
      }
    };

    // Request permission for iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((response: string) => {
          if (response == 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        })
        .catch(() => {
          // Permission denied or error - silently fail
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

    if (!this.heroSection?.nativeElement) return;
    const heroSectionEl = this.heroSection.nativeElement;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      // Trigger shockwave through particle background
      if (this.particleBackground) {
        const rect = heroSectionEl.getBoundingClientRect();
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
          const el = target as HTMLElement
          el?.animate(
            [{transform: 'scale(1)'}, {transform: 'scale(1.05)'}, {transform: 'scale(1)'}],
            {duration: 160, easing: 'ease-out'}
          )
        }
      }
    };

    heroSectionEl.addEventListener('click', handleClick);
    heroSectionEl.addEventListener('touchend', handleClick);
  }
}
