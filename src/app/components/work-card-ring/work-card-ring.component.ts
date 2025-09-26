import { Component, ElementRef, NgZone, ViewChild, ViewChildren, AfterViewInit, OnDestroy, PLATFORM_ID, inject, Input, QueryList, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollOrchestrationService, ScrollState } from '../../services/scroll-orchestration.service';
import { Subject, takeUntil } from 'rxjs';

// Ensure GSAP plugins are registered
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

@Component({
  selector: 'app-work-card-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-card-ring.component.html',
  styleUrls: ['./work-card-ring.component.css']
})
export class WorkCardRingComponent implements AfterViewInit, OnDestroy, OnChanges {
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('ring', { static: true }) ring!: ElementRef<HTMLDivElement>;
  @ViewChildren('card') cards!: QueryList<ElementRef<HTMLDivElement>>;

  items = Array.from({ length: 8 }).map((_, i) => ({ i, title: `Projeto ${i + 1}` }));

  isDragging = false;
  private radius = 200;
  private startX = 0;
  private currentYRotate = 0;
  private targetYRotate = 0;
  private velocity = 0;
  private animationFrameId: number | null = null;
  private destroy$ = new Subject<void>();
  private scrollRotationOffset = 0;
  private baseRotation = 0;
  private isSnapped = false;
  private prefersReducedMotion = false;
  private draggable: any = null;
  @Input() scrollProgress: number | undefined;

  constructor(
    private zone: NgZone,
    private scrollService: ScrollOrchestrationService
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.zone.runOutsideAngular(() => {
      this.checkReducedMotion();
      this.initializeCards();
      this.initAnimation();
      this.setupDraggable();
      this.setupScrollIntegration();
      this.startAnimationLoop();
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.destroy$.next();
    this.destroy$.complete();
    if (this.draggable) {
      this.draggable[0].kill();
    }
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private initializeCards(): void {
    // Handle both real QueryList and test mock
    const cardElements = this.cards.toArray ? this.cards.toArray() : (this.cards as any)._results || [];
    const angleStep = 360 / cardElements.length;
    
    cardElements.forEach((card: any, index: number) => {
      const angle = index * angleStep;
      const element = card.nativeElement || card;
      gsap.set(element, {
        rotationY: angle,
        transformOrigin: `50% 50% ${-this.radius}px`
      });
    });
  }

  private setupDraggable(): void {
    // Try to use Draggable if available (for testing), otherwise use native events
    const DraggableClass = (window as any).Draggable;
    
    if (DraggableClass && typeof DraggableClass.create === 'function') {
      this.draggable = DraggableClass.create(this.ring.nativeElement, {
        type: 'rotation',
        inertia: true,
        onDrag: () => {
          this.isDragging = true;
        },
        onThrowUpdate: () => {
          this.snapToNearestCard();
        },
        onDragEnd: () => {
          this.isDragging = false;
          this.snapToNearestCard();
        }
      });
    } else {
      // Fallback to native events if Draggable is not available
      this.setupNativeDragEvents();
    }
  }

  private setupNativeDragEvents(): void {
    const ringEl = this.ring.nativeElement;
    
    const onStart = (e: MouseEvent | TouchEvent) => {
      this.isDragging = true;
      this.startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      this.velocity = 0;
      this.baseRotation = this.currentYRotate;
      ringEl.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging) return;
      const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - this.startX;
      const sensitivity = 0.25;
      this.targetYRotate = this.baseRotation + deltaX * sensitivity;
      this.velocity = deltaX * sensitivity;
      this.startX = currentX;
    };

    const onEnd = () => {
      this.isDragging = false;
      this.baseRotation = this.targetYRotate;
      ringEl.style.cursor = 'grab';
      this.snapToNearestCard();
    };

    ringEl.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    ringEl.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }

  private snapToNearestCard(): void {
    const currentRotation = this.currentYRotate % 360;
    const cardAngle = 360 / 8; // 8 cards
    const nearestCardRotation = Math.round(currentRotation / cardAngle) * cardAngle;
    
    gsap.to(this.ring.nativeElement, {
      rotationY: nearestCardRotation,
      duration: this.prefersReducedMotion ? 0.1 : 0.3,
      ease: this.prefersReducedMotion ? 'none' : 'power2.out'
    });
  }

  private startAnimationLoop(): void {
    this.smoothRotate();
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  private setupScrollIntegration(): void {
    this.scrollService.scrollState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        const trabalhosSection = this.scrollService.getSection('trabalhos');
        if (trabalhosSection && !this.isDragging) {
          const progress = trabalhosSection.progress;
          const k = 0.3 + Math.pow(Math.abs(0.5 - progress), 2);
          
          if (Math.abs(progress - 0.5) < 0.1 * k) {
            this.isSnapped = true;
            this.scrollRotationOffset = this.baseRotation + progress * 180;
          } else {
            this.isSnapped = false;
            this.scrollRotationOffset = this.baseRotation + progress * 360 * k;
          }
        }
      });
  }

  private initAnimation(): void {
    gsap.from(this.ring.nativeElement, {
      scrollTrigger: {
        trigger: this.ring.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      rotateY: this.prefersReducedMotion ? 0 : -60,
      opacity: 0,
      duration: this.prefersReducedMotion ? 0.3 : 1.2,
      ease: this.prefersReducedMotion ? 'none' : 'power3.out'
    });
  }

  private smoothRotate = (): void => {
    if (!this.isDragging) {
      this.velocity *= 0.95;
      if (Math.abs(this.velocity) < 0.01) this.velocity = 0;
      
      if (!this.isSnapped) {
        this.targetYRotate = this.scrollRotationOffset;
      } else {
        this.targetYRotate += this.velocity * 0.1;
      }
    }
    
    const lerpFactor = this.isSnapped ? 0.05 : 0.1;
    this.currentYRotate += (this.targetYRotate - this.currentYRotate) * lerpFactor;
    
    if (this.ring && this.ring.nativeElement) {
      this.ring.nativeElement.style.transform = `rotateY(${this.currentYRotate}deg)`;
    }
    
    this.animationFrameId = requestAnimationFrame(this.smoothRotate);
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['scrollProgress'] && this.scrollProgress !== undefined) {
      // Handle scroll progress changes if needed
    }
  }
}
