/**
 * Trabalhos Section Component
 * Dedicated component for the work showcase section
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkCardRingComponent } from '../../work-card-ring/work-card-ring.component';
import { IoVisibleDirective } from '../../../directives/io-visible.directive';
import { SECTION_IDS } from '../../../shared/constants/section.constants';
import { AnimationOrchestrationService } from '../../../services/animation/animation-orchestration.service';
import { HapticsService } from '../../../services/haptics.service';

@Component({
  selector: 'app-trabalhos-section',
  standalone: true,
  imports: [CommonModule, WorkCardRingComponent, IoVisibleDirective],
  templateUrl: './trabalhos-section.component.html',
  styleUrls: ['./trabalhos-section.component.css']
})
export class TrabalhosSectionComponent implements AfterViewInit, OnDestroy {
  // Configuration variables (customizable)
  @Input() sectionTitle: string = 'Prova de Conceito';
  @Input() sectionSubtitle?: string;
  @Input() headerSize: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' = 'lg';
  @Input() headerAlignment: 'left' | 'center' | 'right' = 'center';
  @Input() showHeaderDivider: boolean = false;
  @Input() hintText: string = 'Arraste para girar';
  @Input() hintAnimation: 'none' | 'fade-in' | 'pulse' = 'pulse';
  @Input() hintOpacity: number = 0.7;
  @Input() workRingClass: string = '';
  @Input() enableParallax: boolean = true;
  @Input() enablePinning: boolean = true;
  @Input() showAdditionalContent: boolean = false;
  @Input() testId: string = 'trabalhos-section';

  // Outputs
  @Output() ringReady = new EventEmitter<any>();
  @Output() cardSelected = new EventEmitter<any>();
  @Output() sectionReady = new EventEmitter<ElementRef>();

  // ViewChild references
  @ViewChild('workCardRing') workCardRing!: WorkCardRingComponent;
  @ViewChild('sectionElement') sectionElement!: ElementRef;
  @ViewChild('pinContainer', { read: ElementRef }) pinContainer!: ElementRef;
  @ViewChild('trabalhosShowcase', { read: ElementRef }) trabalhosShowcase!: ElementRef;

  // Animation state
  private scrollTrigger: any = null;

  constructor(
    private animationService: AnimationOrchestrationService,
    private hapticsService: HapticsService
  ) {}

  ngAfterViewInit(): void {
    this.sectionReady.emit(this.sectionElement);
    
    // Initialize animations after view is ready
    setTimeout(() => {
      this.initializeAnimations();
    }, 200); // Slightly longer delay for ring to initialize
  }

  ngOnDestroy(): void {
    // Clean up all animations
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }
    // Kill any remaining animations on the ring element
    if (this.workCardRing) {
      this.animationService.killAll(this.workCardRing);
    }
  }

  /**
   * Initialize all animations for the trabalhos section
   */
  private initializeAnimations(): void {
    if (!this.sectionElement || !this.workCardRing) {
      return;
    }

    const sectionEl = this.sectionElement.nativeElement;
    
    // Setup scroll-based rotation animation
    if (this.enableParallax) {
      this.scrollTrigger = this.animationService.setupTrabalhosScrollAnimation(
        sectionEl,
        this.workCardRing
      );
    }
    
    // The ring component already handles its own drag interactions
    // We just need to provide haptic feedback if the ring supports it
    if (this.workCardRing && typeof this.workCardRing.registerInteractionBridge === 'function') {
      this.workCardRing.registerInteractionBridge({
        onDragStart: () => {
          if (this.hapticsService.isHapticsSupported()) {
            this.hapticsService.vibrate(this.hapticsService.patterns.light);
          }
        },
        onDragEnd: () => {
          if (this.hapticsService.isHapticsSupported()) {
            this.hapticsService.vibrate(this.hapticsService.patterns.selection);
          }
        },
        onActiveIndexChange: () => {
          if (this.hapticsService.isHapticsSupported()) {
            this.hapticsService.vibrate(this.hapticsService.patterns.snap);
          }
        }
      });
    }
  }

  /**
   * Handle intersection observer entrance
   * Called by IoVisibleDirective when section enters viewport
   */
  onSectionEnter(): void {
    // Animation logic handled by GSAP ScrollTrigger
    // No additional action needed here
  }

  /**
   * Handle intersection observer exit
   * Called by IoVisibleDirective when section exits viewport
   */
  onSectionLeave(): void {
    // Animation logic handled by GSAP ScrollTrigger
    // No additional action needed here
  }

  // Constants
  readonly SECTION_ID = SECTION_IDS.TRABALHOS;

  /**
   * Handle ring ready event
   */
  onRingReady(ring: any): void {
    this.ringReady.emit(ring);
  }

  /**
   * Handle card selection
   */
  onCardSelected(card: any): void {
    this.cardSelected.emit(card);
  }

  /**
   * Get section classes based on configuration
   */
  getSectionClasses(): string {
    const classes: string[] = [];
    
    // Remove overflow-hidden to avoid conflicts with pinning
    if (!this.enablePinning) {
      classes.push('overflow-hidden');
    }
    
    return classes.join(' ');
  }

  /**
   * Show section content with animation
   */
  showContent(): void {
    if (typeof document === 'undefined') return;
    if (!this.pinContainer?.nativeElement || !this.trabalhosShowcase?.nativeElement) return;

    const container = this.pinContainer.nativeElement;
    const showcase = this.trabalhosShowcase.nativeElement;

    // Show container first
    setTimeout(() => container.classList.add('visible'), 100);
    
    // Show showcase with delay
    setTimeout(() => showcase.classList.add('visible'), 300);
  }

  /**
   * Hide section content
   */
  hideContent(): void {
    if (typeof document === 'undefined') return;
    if (!this.pinContainer?.nativeElement || !this.trabalhosShowcase?.nativeElement) return;

    const container = this.pinContainer.nativeElement;
    const showcase = this.trabalhosShowcase.nativeElement;

    container.classList.remove('visible');
    showcase.classList.remove('visible');
  }

  /**
   * Get work card ring component instance
   */
  getWorkCardRing(): WorkCardRingComponent | undefined {
    return this.workCardRing;
  }

  /**
   * Update hint text dynamically
   */
  updateHintText(text: string): void {
    this.hintText = text;
  }

  /**
   * Update hint visibility
   */
  setHintVisibility(visible: boolean): void {
    this.hintOpacity = visible ? 0.7 : 0;
  }
}