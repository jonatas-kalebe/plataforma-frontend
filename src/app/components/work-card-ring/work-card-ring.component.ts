// src/app/work-card-ring/work-card-ring.component.ts
import { Component, ElementRef, NgZone, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-work-card-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-card-ring.component.html',
  styleUrls: ['./work-card-ring.component.css']
})
export class WorkCardRingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ring', { static: true }) ring!: ElementRef<HTMLDivElement>;

  private isDragging = false;
  private startX = 0;
  private currentYRotate = 0;
  private targetYRotate = 0;
  private velocity = 0;
  private animationFrameId: number | null = null;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initAnimation();
      this.setupDragEvents();
      this.smoothRotate();
    });
  }

  ngOnDestroy(): void {
    this.removeDragEvents();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private initAnimation(): void {
    // Animação de entrada dos cards
    gsap.from(this.ring.nativeElement, {
      scrollTrigger: {
        trigger: this.ring.nativeElement,
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      rotateY: -60,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
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
    this.ring.nativeElement.style.cursor = 'grabbing';
  };

  private onDragMove = (e: MouseEvent | TouchEvent): void => {
    if (!this.isDragging) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - this.startX;

    // Sensibilidade do arraste
    const sensitivity = 0.25;
    this.targetYRotate += deltaX * sensitivity;
    this.velocity = deltaX * sensitivity;

    this.startX = currentX;
  };

  private onDragEnd = (): void => {
    this.isDragging = false;
    this.ring.nativeElement.style.cursor = 'grab';
  };

  private smoothRotate = (): void => {
    if (!this.isDragging) {
      // Aplica inércia (desaceleração)
      this.velocity *= 0.95;
      if (Math.abs(this.velocity) < 0.01) {
        this.velocity = 0;
      }
      this.targetYRotate += this.velocity;
    }

    // Interpolação linear para suavizar o movimento
    const lerpFactor = 0.1;
    this.currentYRotate += (this.targetYRotate - this.currentYRotate) * lerpFactor;

    this.ring.nativeElement.style.transform = `rotateY(${this.currentYRotate}deg)`;

    this.animationFrameId = requestAnimationFrame(this.smoothRotate);
  };
}
