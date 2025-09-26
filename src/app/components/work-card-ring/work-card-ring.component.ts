import { Component, ElementRef, NgZone, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, inject, Input, QueryList, ViewChildren } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { ScrollOrchestrationService, ScrollState } from '../../services/scroll-orchestration.service';
import { Subject, takeUntil } from 'rxjs';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-work-card-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-card-ring.component.html',
  styleUrls: ['./work-card-ring.component.css']
})
export class WorkCardRingComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  @ViewChild('ring', { static: true }) ring!: ElementRef<HTMLDivElement>;

  items = Array.from({ length: 8 }).map((_, i) => ({ i, title: `Projeto ${i + 1}` }));
  
  isDragging = false; // Public for testing
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
  private radius = 200; // 3D ring radius
  private draggableInstance: any = null;

  // Getter that provides a get() method for tests
  get cards() {
    const queryList = this._cards;
    return {
      ...queryList,
      get: (index: number) => queryList.toArray()[index]
    };
  }
  
  @ViewChildren('card') private _cards!: QueryList<ElementRef<HTMLDivElement>>;
  scrollProgress: number | undefined;

  constructor(
    private zone: NgZone,
    private scrollService: ScrollOrchestrationService
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.zone.runOutsideAngular(() => {
      this.checkReducedMotion();
      gsap.registerPlugin(ScrollTrigger, Draggable);
      this.initCardPositions();
      this.initDraggable();
      this.initAnimation();
      this.setupScrollIntegration();
      this.smoothRotate();
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.draggableInstance) {
      this.draggableInstance[0].kill();
    }
    
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  private initCardPositions(): void {
    const cardElements = this._cards.toArray();
    const angleStep = 360 / 8;
    
    cardElements.forEach((cardRef, index) => {
      const angle = index * angleStep;
      gsap.set(cardRef.nativeElement, {
        rotationY: angle,
        transformOrigin: `50% 50% ${-this.radius}px`
      });
    });
  }

  private initDraggable(): void {
    this.draggableInstance = (gsap as any).Draggable.create(this.ring.nativeElement, {
      type: 'rotation',
      inertia: true,
      onPress: () => {
        this.isDragging = true;
      },
      onDrag: () => {
        this.targetYRotate = this.draggableInstance[0].rotation;
      },
      onThrowUpdate: () => {
        this.targetYRotate = this.draggableInstance[0].rotation;
      },
      onRelease: () => {
        this.isDragging = false;
        this.snapToNearestCard();
      }
    });
  }

  private snapToNearestCard(): void {
    const angleStep = 360 / 8;
    const normalizedRotation = ((this.targetYRotate % 360) + 360) % 360;
    const nearestCardAngle = Math.round(normalizedRotation / angleStep) * angleStep;
    
    gsap.to(this, {
      targetYRotate: nearestCardAngle,
      duration: 0.5,
      ease: 'power2.out'
    });
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

  private setupDragEvents(): void {
    const ringEl = this.ring.nativeElement;
    ringEl.addEventListener('mousedown', this.onDragStart);
    window.addEventListener('mousemove', this.onDragMove);
    window.addEventListener('mouseup', this.onDragEnd);
    ringEl.addEventListener('touchstart', this.onDragStart, { passive: true });
    window.addEventListener('touchmove', this.onDragMove);
    window.addEventListener('touchend', this.onDragEnd);
  }

  private removeDragEvents(): void {
    const ringEl = this.ring.nativeElement;
    ringEl.removeEventListener('mousedown', this.onDragStart);
    window.removeEventListener('mousemove', this.onDragMove);
    window.removeEventListener('mouseup', this.onDragEnd);
    ringEl.removeEventListener('touchstart', this.onDragStart);
    window.removeEventListener('touchmove', this.onDragMove);
    window.removeEventListener('touchend', this.onDragEnd);
  }

  private onDragStart = (e: MouseEvent | TouchEvent): void => {
    this.isDragging = true;
    this.startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    this.velocity = 0;
    this.baseRotation = this.currentYRotate;
    this.ring.nativeElement.style.cursor = 'grabbing';
  };

  private onDragMove = (e: MouseEvent | TouchEvent): void => {
    if (!this.isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - this.startX;
    const sensitivity = 0.25;
    this.targetYRotate = this.baseRotation + deltaX * sensitivity;
    this.velocity = deltaX * sensitivity;
    this.startX = currentX;
  };

  private onDragEnd = (): void => {
    this.isDragging = false;
    this.baseRotation = this.targetYRotate;
    this.ring.nativeElement.style.cursor = 'grab';
  };

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
    this.ring.nativeElement.style.transform = `rotateY(${this.currentYRotate}deg)`;
    this.animationFrameId = requestAnimationFrame(this.smoothRotate);
  };

  ngOnChanges(param: {
    scrollProgress: { currentValue: number; previousValue: number; firstChange: boolean; isFirstChange: () => boolean }
  }) {
    //placeholder to the test, shoud be implemented latter 
  }
}
