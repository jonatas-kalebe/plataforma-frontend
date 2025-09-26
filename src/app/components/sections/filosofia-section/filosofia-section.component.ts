/**
 * Filosofia Section Component
 * Dedicated component for the philosophy section with knot canvas animation
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeaderComponent } from '../../ui';
import { SECTION_IDS } from '../../../shared/constants';

@Component({
  selector: 'app-filosofia-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent],
  template: `
    <section 
      id="filosofia" 
      class="relative w-full h-screen flex items-center px-6"
      [attr.data-testid]="testId">
      
      <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        
        <!-- Text Content -->
        <div class="filosofia-content">
          <h2 class="text-4xl md:text-5xl font-extrabold text-athenity-text-title font-heading">
            {{ title }}
          </h2>
          <p class="mt-6 leading-relaxed text-athenity-text-body text-lg">
            {{ description }}
          </p>
          
          <!-- Optional additional content -->
          <div *ngIf="showAdditionalContent" class="mt-8">
            <ng-content select="[slot=additional-content]"></ng-content>
          </div>
        </div>

        <!-- Canvas Animation -->
        <div class="relative filosofia-animation">
          <canvas 
            #knotCanvas 
            [width]="canvasWidth"
            [height]="canvasHeight"
            class="w-full h-[260px] md:h-[320px] rounded-xl bg-athenity-blue-card"
            [attr.data-testid]="'knot-canvas'">
          </canvas>
          
          <!-- Canvas overlay for additional effects -->
          <div *ngIf="showCanvasOverlay" 
               class="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-transparent to-athenity-green-circuit/10">
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .filosofia-content {
      opacity: 0;
      transform: translateX(-30px);
      transition: all 0.8s ease;
    }
    
    .filosofia-content.visible {
      opacity: 1;
      transform: translateX(0);
    }
    
    .filosofia-animation {
      opacity: 0;
      transform: translateX(30px);
      transition: all 0.8s ease 0.2s;
    }
    
    .filosofia-animation.visible {
      opacity: 1;
      transform: translateX(0);
    }
    
    #knotCanvas {
      transition: all 0.3s ease;
    }
    
    #knotCanvas:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 32px rgba(100, 255, 218, 0.2);
    }
  `]
})
export class FilosofiaSectionComponent implements AfterViewInit, OnDestroy {
  // Configuration variables (customizable)
  @Input() title: string = 'Da Complexidade à Clareza.';
  @Input() description: string = 'Transformamos sistemas caóticos em experiências nítidas. Arquitetura, design e engenharia convergem para mover pessoas e negócios.';
  @Input() canvasWidth: number = 400;
  @Input() canvasHeight: number = 320;
  @Input() showCanvasOverlay: boolean = false;
  @Input() showAdditionalContent: boolean = false;
  @Input() enableAnimation: boolean = true;
  @Input() testId: string = 'filosofia-section';

  // Outputs
  @Output() sectionReady = new EventEmitter<ElementRef>();
  @Output() canvasReady = new EventEmitter<HTMLCanvasElement>();
  @Output() animationComplete = new EventEmitter<void>();

  // ViewChild references
  @ViewChild('knotCanvas', { static: true }) knotCanvas!: ElementRef<HTMLCanvasElement>;

  // Constants and internal state
  readonly SECTION_ID = SECTION_IDS.FILOSOFIA;
  private animationId = 0;

  ngAfterViewInit(): void {
    // Emit canvas ready for parent to setup knot animation
    if (this.knotCanvas?.nativeElement) {
      this.canvasReady.emit(this.knotCanvas.nativeElement);
    }

    // Emit section ready
    this.sectionReady.emit(this.knotCanvas);
  }

  ngOnDestroy(): void {
    // Clean up any animation frames
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  /**
   * Show section content with animation
   */
  showContent(): void {
    if (typeof document === 'undefined' || !this.enableAnimation) return;

    const content = document.querySelector('.filosofia-content');
    const animation = document.querySelector('.filosofia-animation');

    // Add visible classes for CSS animations
    setTimeout(() => content?.classList.add('visible'), 100);
    setTimeout(() => {
      animation?.classList.add('visible');
      this.animationComplete.emit();
    }, 300);
  }

  /**
   * Hide section content
   */
  hideContent(): void {
    if (typeof document === 'undefined') return;

    const content = document.querySelector('.filosofia-content');
    const animation = document.querySelector('.filosofia-animation');

    content?.classList.remove('visible');
    animation?.classList.remove('visible');
  }

  /**
   * Get canvas context
   */
  getCanvasContext(): CanvasRenderingContext2D | null {
    return this.knotCanvas?.nativeElement?.getContext('2d') || null;
  }

  /**
   * Resize canvas to match container
   */
  resizeCanvas(): void {
    if (!this.knotCanvas?.nativeElement) return;

    const canvas = this.knotCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }

  /**
   * Clear canvas
   */
  clearCanvas(): void {
    const ctx = this.getCanvasContext();
    if (ctx && this.knotCanvas?.nativeElement) {
      const canvas = this.knotCanvas.nativeElement;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}