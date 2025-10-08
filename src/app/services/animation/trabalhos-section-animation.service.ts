import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({ providedIn: 'root' })
export class TrabalhosSectionAnimationService {
  private readonly platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private prefersReducedMotion = false;
  private isPinned = false;
  private disposers: Array<() => void> = [];
  private scrollTriggers: ScrollTrigger[] = [];
  public scrollProgress = 0;
  private currentRingComponent: any = null;
  private sectionEl: HTMLElement | null = null;
  private ringEl: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private hintEl: HTMLElement | null = null;
  private rafId: number | null = null;
  private momentumId: number | null = null;
  private isDragging = false;
  private dragLastX = 0;
  private dragVelocity = 0;
  private dragLastTs = 0;
  private sectionStartY = 0;
  private viewportH = 0;
  private lastPinnedState = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.registerPlugin(ScrollTrigger);
    }
  }

  createPinnedSection(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;
    this.sectionEl = document.querySelector('#trabalhos');
    this.ringEl = document.querySelector('#trabalhos .ring');
    this.titleEl = document.querySelector('#trabalhos h3');
    this.hintEl = document.querySelector('#trabalhos .drag-hint');
    if (!this.sectionEl) return;
    const recalc = () => {
      const rect = this.sectionEl!.getBoundingClientRect();
      this.viewportH = window.innerHeight;
      this.sectionStartY = window.scrollY + rect.top;
    };
    recalc();
    const onResize = () => recalc();
    const onScroll = () => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.handleScroll());
    };
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    this.disposers.push(() => window.removeEventListener('resize', onResize));
    this.disposers.push(() => window.removeEventListener('scroll', onScroll));
    this.handleScroll();
  }

  setRingComponent(ringComponent: any): void {
    this.currentRingComponent = ringComponent;
    const el = ringComponent?.ringRef?.nativeElement as HTMLElement | undefined;
    if (el) this.ringEl = el;
  }

  private handleScroll(): void {
    if (!this.sectionEl) return;
    const y = window.scrollY;
    const start = this.sectionStartY;
    const end = start + this.viewportH;
    const progress = Math.max(0, Math.min(1, (y - start) / (end - start)));
    const pinnedNow = y >= start && y < end;
    if (pinnedNow !== this.lastPinnedState) {
      this.lastPinnedState = pinnedNow;
      if (pinnedNow) {
        this.isPinned = true;
        this.showInteractionHints();
      } else {
        this.isPinned = false;
        this.hideInteractionHints();
      }
    }
    if (this.isDragging) return;
    this.scrollProgress = progress;
    this.updateRingScrollProgress(progress);
    const totalRotation = progress * 720;
    const snapAngle = 45;
    const mod = ((totalRotation % snapAngle) + snapAngle) % snapAngle;
    const isNearSnap = mod < 15 || mod > 30;
    if (progress > 0.45 && progress < 0.55 && isNearSnap) {
      const snappedRotation = Math.round(totalRotation / snapAngle) * snapAngle;
      this.applyRingRotation(snappedRotation, true);
    } else {
      this.applyRingRotation(totalRotation, false);
    }
    if (progress > 0.9) {
      this.prepareForTransition();
    }
  }

  private updateRingScrollProgress(progress: number): void {
    if (this.currentRingComponent && typeof this.currentRingComponent === 'object') {
      if ('scrollProgress' in this.currentRingComponent) {
        this.currentRingComponent.scrollProgress = progress;
      }
      if (!this.isDragging && 'rotationDeg' in this.currentRingComponent) {
        const totalRotation = progress * 720;
        this.currentRingComponent.rotationDeg = -totalRotation;
      }
    }
  }

  private applyRingRotation(rotation: number, isSnapped: boolean): void {
    if (!this.ringEl) this.ringEl = document.querySelector('#trabalhos .ring');
    const ring = this.ringEl;
    if (!ring) return;
    if (isSnapped) {
      ring.classList.add('snap-transition');
    } else {
      ring.classList.remove('snap-transition');
    }
    ring.style.setProperty('--rotation', `${-rotation}deg`);
  }

  createRingEntrance(): void {
    if (!this.isBrowser) return;
    
    const ringContainer = document.querySelector('#trabalhos .ring-container') as HTMLElement | null;
    const title = document.querySelector('#trabalhos h3') as HTMLElement | null;
    const hint = document.querySelector('#trabalhos .drag-hint') as HTMLElement | null;
    const section = document.querySelector('#trabalhos') as HTMLElement | null;
    
    if (!ringContainer || !title || !section) return;

    if (this.prefersReducedMotion) {
      // For reduced motion, show immediately
      gsap.set([ringContainer, title, hint].filter(Boolean), { opacity: 1, y: 0, scale: 1 });
      return;
    }

    // Set initial state - elements are visible but transformed
    gsap.set(ringContainer, { opacity: 1, scale: 0.8, y: 50 });
    gsap.set(title, { opacity: 1, y: 30 });
    if (hint) gsap.set(hint, { opacity: 1, y: 20 });

    // Create scroll-triggered entrance animation
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom-=100',
      end: 'top center',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Animate ring container
        gsap.to(ringContainer, {
          scale: 0.8 + (0.2 * progress),
          y: 50 * (1 - progress),
          duration: 0.1,
          ease: 'none'
        });
        
        // Animate title
        gsap.to(title, {
          y: 30 * (1 - progress),
          duration: 0.1,
          ease: 'none'
        });
        
        // Animate hint
        if (hint) {
          gsap.to(hint, {
            y: 20 * (1 - progress),
            duration: 0.1,
            ease: 'none'
          });
        }
      }
    });

    this.scrollTriggers.push(trigger);
  }

  enhanceRingInteractions(workCardRingComponent: any): void {
    if (!this.isBrowser || !workCardRingComponent) return;
    const ringElement: HTMLElement | null = workCardRingComponent.ringRef?.nativeElement ?? document.querySelector('#trabalhos .ring');
    if (!ringElement) return;
    this.ringEl = ringElement;
    ringElement.style.cursor = 'grab';

    if (typeof workCardRingComponent.registerInteractionBridge === 'function') {
      workCardRingComponent.registerInteractionBridge({
        onDragStart: () => {
          this.isDragging = true;
          workCardRingComponent.isDragging = true;
          ringElement.style.cursor = 'grabbing';
          ringElement.classList.add('ring-dragging');
          if (navigator.vibrate) navigator.vibrate(30);
        },
        onDragMove: (rotation: number, velocity: number) => {
          this.dragVelocity = velocity;
          if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
            this.currentRingComponent.rotationDeg = rotation;
          }
          ringElement.classList.remove('snap-transition');
          ringElement.style.setProperty('--rotation', `${-rotation}deg`);
        },
        onDragEnd: (velocity: number) => {
          this.isDragging = false;
          workCardRingComponent.isDragging = false;
          this.dragVelocity = velocity;
          ringElement.style.cursor = 'grab';
          ringElement.classList.remove('ring-dragging');
          if (navigator.vibrate) navigator.vibrate(20);
        },
        onActiveIndexChange: (index: number) => {
          this.highlightActiveCard(index);
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        }
      });

      this.disposers.push(() => {
        workCardRingComponent.registerInteractionBridge(null);
      });

      return;
    }

    const onPointerDown = (ev: PointerEvent) => {
      this.isDragging = true;
      workCardRingComponent.isDragging = true;
      ringElement.setPointerCapture(ev.pointerId);
      ringElement.style.cursor = 'grabbing';
      this.dragLastX = ev.clientX;
      this.dragLastTs = performance.now();
      this.dragVelocity = 0;
      ringElement.classList.add('ring-dragging');
      if (navigator.vibrate) navigator.vibrate(30);
    };
    const onPointerMove = (ev: PointerEvent) => {
      if (!this.isDragging) return;
      const now = performance.now();
      const dx = ev.clientX - this.dragLastX;
      const dt = Math.max(16, now - this.dragLastTs);
      const sensitivity = 0.5;
      const deltaDeg = dx * sensitivity;
      const curr = this.currentRingComponent?.rotationDeg ?? 0;
      const next = curr + deltaDeg;
      if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
        this.currentRingComponent.rotationDeg = next;
      }
      ringElement.classList.remove('snap-transition');
      ringElement.style.setProperty('--rotation', `${-next}deg`);
      this.dragVelocity = (dx / dt) * sensitivity * 16;
      this.dragLastX = ev.clientX;
      this.dragLastTs = now;
    };
    const endDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      workCardRingComponent.isDragging = false;
      ringElement.style.cursor = 'grab';
      ringElement.classList.remove('ring-dragging');
      if (navigator.vibrate) navigator.vibrate(20);
      this.startMomentum();
    };
    ringElement.addEventListener('pointerdown', onPointerDown);
    ringElement.addEventListener('pointermove', onPointerMove);
    ringElement.addEventListener('pointerup', endDrag);
    ringElement.addEventListener('pointercancel', endDrag);
    ringElement.addEventListener('mouseleave', endDrag);
    const originalActiveIndexChange = workCardRingComponent.activeIndexChange;
    workCardRingComponent.activeIndexChange = {
      emit: (index: number) => {
        this.highlightActiveCard(index);
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        if (originalActiveIndexChange) originalActiveIndexChange.emit(index);
      }
    };
    this.disposers.push(() => {
      ringElement.removeEventListener('pointerdown', onPointerDown);
      ringElement.removeEventListener('pointermove', onPointerMove);
      ringElement.removeEventListener('pointerup', endDrag);
      ringElement.removeEventListener('pointercancel', endDrag);
      ringElement.removeEventListener('mouseleave', endDrag);
    });
  }

  private startMomentum(): void {
    if (this.momentumId) cancelAnimationFrame(this.momentumId);
    const friction = 0.92;
    const step = () => {
      if (Math.abs(this.dragVelocity) < 0.05) {
        this.snapToNearestCard();
        return;
      }
      const curr = this.currentRingComponent?.rotationDeg ?? 0;
      const next = curr + this.dragVelocity;
      if (this.currentRingComponent && 'rotationDeg' in this.currentRingComponent) {
        this.currentRingComponent.rotationDeg = next;
      }
      if (this.ringEl) {
        this.ringEl.style.setProperty('--rotation', `${-next}deg`);
      }
      this.dragVelocity *= friction;
      this.momentumId = requestAnimationFrame(step);
    };
    this.momentumId = requestAnimationFrame(step);
  }

  private highlightActiveCard(index: number): void {
    const cards = document.querySelectorAll('#trabalhos .work-card');
    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      if (i === index) {
        el.classList.add('card-active');
        el.classList.remove('card-inactive');
      } else {
        el.classList.remove('card-active');
        el.classList.add('card-inactive');
      }
    });
  }

  private showInteractionHints(): void {
    const hint = document.querySelector('#trabalhos .drag-hint') as HTMLElement | null;
    if (!hint) return;
    hint.classList.add('hint-on');
  }

  private hideInteractionHints(): void {
    const hint = document.querySelector('#trabalhos .drag-hint') as HTMLElement | null;
    if (!hint) return;
    hint.classList.remove('hint-on');
  }

  private snapToNearestCard(): void {
    if (!this.currentRingComponent || this.prefersReducedMotion) return;
    const currentRotation = this.currentRingComponent.rotationDeg || 0;
    const cardAngle = 45;
    const nearestCardIndex = Math.round(-currentRotation / cardAngle);
    const targetRotation = -nearestCardIndex * cardAngle;
    const start = currentRotation;
    const duration = 800;
    const startTs = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = () => {
      const now = performance.now();
      const t = Math.min(1, (now - startTs) / duration);
      const eased = easeOut(t);
      const val = start + (targetRotation - start) * eased;
      this.currentRingComponent.rotationDeg = val;
      if (this.ringEl) {
        this.ringEl.classList.add('snap-transition');
        this.ringEl.style.setProperty('--rotation', `${-val}deg`);
      }
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.highlightActiveCard(Math.abs(nearestCardIndex) % 8);
        if (this.ringEl) this.ringEl.classList.remove('snap-transition');
      }
    };
    animate();
  }

  private prepareForTransition(): void {}

  createExitTransition(): void {
    // Exit transition disabled - scroll-driven animations handle this naturally
    return;
  }

  getIsPinned(): boolean {
    return this.isPinned;
  }

  destroy(): void {
    this.disposers.forEach(fn => fn());
    this.disposers = [];
    this.scrollTriggers.forEach(trigger => trigger.kill());
    this.scrollTriggers = [];
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.momentumId) cancelAnimationFrame(this.momentumId);
    this.isPinned = false;
  }
}
