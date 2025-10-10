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
import {AnimationOrchestrationService} from '../../../services/animation/animation-orchestration.service';

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
  @ViewChild('heroTitle', {static: false}) heroTitle!: ElementRef;
  @ViewChild('heroSubtitle', {static: false}) heroSubtitle!: ElementRef;
  @ViewChild('heroCta', {static: false}) heroCta!: ElementRef;
  @ViewChild('scrollHint', {static: false}) scrollHint!: ElementRef;
  @ViewChild(ThreeParticleBackgroundComponent) particleBackground!: ThreeParticleBackgroundComponent;
  // Constants
  readonly SECTION_ID = SECTION_IDS.HERO;
  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private scrollService: ScrollOrchestrationService,
    private animationService: AnimationOrchestrationService
  ) {
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.sectionReady.emit(this.heroBg);

    // Setup hero parallax using AnimationOrchestrationService
    if (this.animationService.isReady()) {
      this.setupHeroAnimations();
    } else {
      // Wait for animation service to be ready
      this.animationService.initialize().then(() => {
        this.setupHeroAnimations();
      });
    }

    // Setup other effects
    this.setupScrollHintAnimation();
    this.setupShockwaveEffects();
  }

  /**
   * Setup hero animations via AnimationOrchestrationService
   */
  private setupHeroAnimations(): void {
    const heroContainer = document.getElementById('hero');
    if (!heroContainer || !this.heroTitle || !this.heroSubtitle || !this.heroCta) {
      return;
    }

    this.animationService.setupHeroParallax(
      heroContainer,
      this.heroTitle.nativeElement,
      this.heroSubtitle.nativeElement,
      this.heroCta.nativeElement,
      this.scrollHint?.nativeElement
    );
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Cleanup animations managed by AnimationOrchestrationService
      this.animationService.killAll('#hero');
    }
  }

  /**
   * Handle CTA click
   */
  onCtaClick(event: Event): void {
    this.ctaClicked.emit(event);
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
          const el = target as HTMLElement
          el?.animate(
            [{transform: 'scale(1)'}, {transform: 'scale(1.05)'}, {transform: 'scale(1)'}],
            {duration: 160, easing: 'ease-out'}
          )
        }
      }
    };

    heroSection.addEventListener('click', handleClick);
    heroSection.addEventListener('touchend', handleClick);
  }
}
