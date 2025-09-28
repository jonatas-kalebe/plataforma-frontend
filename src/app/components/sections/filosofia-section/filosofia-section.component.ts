import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SECTION_IDS } from '../../../shared/constants/section.constants';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-filosofia-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filosofia-section.component.html',
  styleUrls: ['./filosofia-section.component.css']
})
export class FilosofiaSectionComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  // Configuration inputs
  @Input() title: string = 'Da Complexidade à Clareza.';
  @Input() description: string = 'Transformamos sistemas caóticos em experiências nítidas. Arquitetura, design e engenharia convergem para mover pessoas e negócios.';
  @Input() showCanvasOverlay: boolean = false;
  @Input() enablePinning: boolean = true;

  // Event outputs
  @Output() sectionReady = new EventEmitter<ElementRef>();
  @Output() canvasReady = new EventEmitter<HTMLCanvasElement>();
  
  // Component references
  @ViewChild('knotCanvas') knotCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Constants
  readonly SECTION_ID = SECTION_IDS.FILOSOFIA;
  
  // Animation state
  private currentProgress: number = 0;
  private animationFrame: number = 0;
  private scrollTrigger: any = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.sectionReady.emit(this.knotCanvas);
    this.canvasReady.emit(this.knotCanvas.nativeElement);
    
    // Initialize canvas and animations
    this.initializeCanvas();
    this.setupScrollAnimation();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      if (this.scrollTrigger) {
        this.scrollTrigger.kill();
      }
    }
  }

  /**
   * Initialize canvas with proper dimensions and styling
   */
  private initializeCanvas(): void {
    if (!this.knotCanvas?.nativeElement) return;

    const canvas = this.knotCanvas.nativeElement;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    
    // Initial draw
    this.drawLine(0);
  }

  /**
   * Setup scroll-triggered line animation
   */
  private setupScrollAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const ScrollTriggerInstance = (window as any).ScrollTrigger || ScrollTrigger;
    
    let config: any = {
      trigger: '#filosofia',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self: any) => {
        this.updateLineProgress(self.progress);
      }
    };

    // Add pinning if enabled and reduced motion is off
    if (this.enablePinning && !prefersReducedMotion) {
      config = {
        ...config,
        pin: true,
        start: 'center center',
        end: '+=50%', // Pin for extra scroll distance
        pinSpacing: true
      };
    }

    this.scrollTrigger = ScrollTriggerInstance.create(config);
  }

  /**
   * Update line drawing based on scroll progress
   * @param progress - Scroll progress from 0 to 1
   */
  updateLineProgress(progress: number): void {
    this.currentProgress = Math.max(0, Math.min(1, progress));
    this.drawLine(this.currentProgress);
  }

  /**
   * Draw the animated line that transforms from wavy to straight
   * @param progress - Animation progress from 0 (wavy) to 1 (straight)
   */
  private drawLine(progress: number): void {
    if (!this.ctx || !this.knotCanvas?.nativeElement) return;

    const canvas = this.knotCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Set line style with neon glow effect
    this.ctx.strokeStyle = '#64FFDA'; // Circuit green
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#64FFDA';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Calculate line parameters
    const centerY = height / 2;
    const startX = width * 0.1;
    const endX = width * 0.9;
    const lineWidth = endX - startX;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, centerY);

    if (progress === 1.0) {
      // At 100%: completely straight line
      this.ctx.lineTo(endX, centerY);
    } else {
      // Interpolate between wavy (progress=0) and straight (progress=1)
      const segments = 20;
      const segmentWidth = lineWidth / segments;
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = startX + t * lineWidth;
        
        // Wave parameters that diminish with progress
        const waveIntensity = (1 - progress);
        const frequency1 = 3 * Math.PI; // Primary wave
        const frequency2 = 7 * Math.PI; // Secondary wave for complexity
        const amplitude1 = 30 * waveIntensity;
        const amplitude2 = 15 * waveIntensity;
        
        // Complex wave calculation
        const wave1 = Math.sin(t * frequency1) * amplitude1;
        const wave2 = Math.sin(t * frequency2 + Math.PI / 4) * amplitude2;
        const totalWave = wave1 + wave2 * 0.5;
        
        const y = centerY + totalWave;
        
        if (progress < 0.3) {
          // Use bezier curves for more complex wavy appearance at the beginning
          const prevX = startX + (t - 1 / segments) * lineWidth;
          const cpx1 = prevX + segmentWidth * 0.3;
          const cpy1 = centerY + totalWave * 0.8;
          const cpx2 = x - segmentWidth * 0.3;
          const cpy2 = y * 0.9;
          
          this.ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y);
        } else {
          // Use simple lines as we approach straightness
          this.ctx.lineTo(x, y);
        }
      }
    }

    this.ctx.stroke();
  }

  /**
   * Get the canvas context
   */
  getCanvasContext(): CanvasRenderingContext2D | null {
    if (!this.knotCanvas?.nativeElement) return null;
    return this.knotCanvas.nativeElement.getContext('2d');
  }

  /**
   * Clear the canvas
   */
  clearCanvas(): void {
    const context = this.getCanvasContext();
    if (!context) return;
    
    const canvas = this.knotCanvas.nativeElement;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
}