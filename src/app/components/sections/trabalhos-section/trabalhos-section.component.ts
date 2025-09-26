/**
 * Trabalhos Section Component
 * Dedicated component for the work showcase section
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent, ScrollHintComponent } from '../../ui';
import { WorkCardRingComponent } from '../../work-card-ring/work-card-ring.component';
import { SECTION_IDS } from '../../../shared/constants';

@Component({
  selector: 'app-trabalhos-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, ScrollHintComponent, WorkCardRingComponent],
  template: `
    <section 
      id="trabalhos" 
      class="w-full h-screen flex items-center px-6"
      [ngClass]="getSectionClasses()"
      [attr.data-testid]="testId">
      
      <div class="pin-container max-w-7xl mx-auto w-full">
        
        <!-- Section Header -->
        <app-section-header
          [title]="sectionTitle"
          [subtitle]="sectionSubtitle"
          [size]="headerSize"
          [alignment]="headerAlignment"
          [showDivider]="showHeaderDivider"
          [testId]="'trabalhos-header'">
        </app-section-header>

        <!-- Work Card Ring Component -->
        <div class="trabalhos-showcase" [attr.data-testid]="'work-showcase'">
          <app-work-card-ring
            #workCardRing
            (ringReady)="onRingReady($event)"
            (cardSelected)="onCardSelected($event)">
          </app-work-card-ring>
        </div>

        <!-- Interaction Hint -->
        <div class="mt-6 text-center">
          <app-scroll-hint
            [text]="hintText"
            position="center"
            alignment="center"
            [showArrow]="false"
            [animate]="hintAnimation"
            [opacity]="hintOpacity"
            [testId]="'trabalhos-hint'">
          </app-scroll-hint>
        </div>

        <!-- Optional additional content -->
        <div *ngIf="showAdditionalContent" class="mt-8 text-center">
          <ng-content select="[slot=additional-content]"></ng-content>
        </div>
      </div>
    </section>
  `,
  styles: [`
    #trabalhos {
      background: linear-gradient(135deg, var(--athenity-blue-deep) 0%, rgba(10, 25, 47, 0.98) 100%);
    }
    
    .pin-container {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.8s ease;
    }
    
    .pin-container.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .trabalhos-showcase {
      opacity: 0;
      transform: scale(0.95);
      transition: all 1s ease 0.2s;
    }
    
    .trabalhos-showcase.visible {
      opacity: 1;
      transform: scale(1);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .pin-container {
        padding: 0 1rem;
      }
    }
  `]
})
export class TrabalhosSectionComponent {
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

    const container = document.querySelector('.pin-container');
    const showcase = document.querySelector('.trabalhos-showcase');

    // Show container first
    setTimeout(() => container?.classList.add('visible'), 100);
    
    // Show showcase with delay
    setTimeout(() => showcase?.classList.add('visible'), 300);
  }

  /**
   * Hide section content
   */
  hideContent(): void {
    if (typeof document === 'undefined') return;

    const container = document.querySelector('.pin-container');
    const showcase = document.querySelector('.trabalhos-showcase');

    container?.classList.remove('visible');
    showcase?.classList.remove('visible');
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