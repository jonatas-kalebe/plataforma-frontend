import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Inject, Input, NgZone, OnChanges, OnDestroy, Output, PLATFORM_ID, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

type Item = any;
type OrientationMode = 'outward' | 'inward' | 'camera';

@Component({
  selector: 'app-work-card-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-card-ring.component.html',
  styleUrls: ['./work-card-ring.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkCardRingComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('ring', { static: true }) ringRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('card') cardRefs!: QueryList<ElementRef<HTMLDivElement>>;

  get ring() { return this.ringRef; }
  set ring(value: any) { this.ringRef = value; }
  get cards() { return this.cardRefs; }
  set cards(value: any) { this.cardRefs = value; }
  get isDragging() { return this.dragging; }
  set isDragging(value: boolean) { this.dragging = value; }

  @Input() items: Item[] = Array.from({ length: 8 }, (_, i) => ({ title: `Projeto ${i + 1}` }));

  @Input() ringViewport = 320;
  @Input() baseRadius = 200;
  @Input() cardWidth = 240;
  @Input() cardHeight = 140;
  @Input() perspective = 1200;

  @Input() dragSensitivity = 0.35;
  @Input() wheelSpeed = 0.2;
  @Input() friction = 2.8;
  @Input() inertiaEnabled = true;

  @Input() snapEnabled = true;
  @Input() snapVelocityThreshold = 15;
  @Input() snapStrength = 45;

  @Input() interceptWheel = true;
  @Input() scrollProgress: number | undefined;
  @Input() scrollRotations = 2;

  @Input() radiusElasticity = 0.25;
  @Input() radiusVelInfluence = 720;
  @Input() springStiffness = 120;
  @Input() springDamping = 22;

  @Input() orientation: OrientationMode = 'outward';

  @Input() autoRadiusSpacing = true;
  @Input() minGapPx = 24;

  @Input() gestureThreshold = 8;
  @Input() horizontalBias = 1.2;

  @Output() activeIndexChange = new EventEmitter<number>();

  private isBrowser = false;
  private reducedMotion = false;

  private rotationDeg = 0;
  private angularVelocity = 0;
  private desiredRotationDeg: number | null = null;

  private dynamicRadius = this.baseRadius;
  private baseRadiusEffective = this.baseRadius;
  private radiusVelocity = 0;
  private lastRadiusApplied = -1;

  private dragging = false;
  private pointerId: number | null = null;
  private lastPointerX = 0;
  private startPointerX = 0;
  private startPointerY = 0;
  private gesture: 'idle' | 'pending' | 'rotate' | 'scroll' = 'idle';
  private lastMoveTS = 0;
  private lastDragEndTS = 0; // Track when drag ended to delay snap

  private dragDeltaHistory: number[] = [];
  private dragVelocityHistory: number[] = [];
  private readonly dragDeltaWindow = 5;
  private readonly dragVelocityWindow = 6;

  private rafId: number | null = null;
  private prevTS = 0;

  private ringEl!: HTMLDivElement;
  private cardEls: HTMLDivElement[] = [];

  constructor(
    private zone: NgZone,
    private hostRef: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.ringEl = this.ringRef.nativeElement;
    this.cardEls = this.cardRefs.toArray().map(r => r.nativeElement);

    this.setupReducedMotion();

    const style = getComputedStyle(this.hostRef.nativeElement);
    const vp = parseFloat(style.getPropertyValue('--ring-viewport'));
    if (!Number.isNaN(vp)) this.ringViewport = vp;
    this.hostRef.nativeElement.style.setProperty('--ring-viewport', `${this.ringViewport}px`);

    this.setupDOM();
    this.applyOrientationFlipVariable();
    this.recomputeBaseRadiusEffective();
    this.dynamicRadius = this.baseRadiusEffective;
    this.layoutCards(true);
    this.attachEvents();

    this.zone.runOutsideAngular(() => {
      this.prevTS = performance.now();
      this.tick(this.prevTS);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;

    if (changes['items'] || changes['cardWidth'] || changes['baseRadius'] ||
      changes['minGapPx'] || changes['autoRadiusSpacing']) {
      queueMicrotask(() => {
        this.cardEls = this.cardRefs.toArray().map(r => r.nativeElement);
        this.recomputeBaseRadiusEffective();
        this.lastRadiusApplied = -1;
        this.layoutCards(true);
        this.emitActiveIndex();
      });
    }

    if (changes['ringViewport']) {
      this.hostRef.nativeElement.style.setProperty('--ring-viewport', `${this.ringViewport}px`);
    }

    if (changes['orientation'] && this.ringEl) {
      this.applyOrientationFlipVariable();
      this.layoutCards(true);
    }

    if (changes['scrollProgress'] && this.scrollProgress != null && !this.dragging) {
      const target = -this.scrollProgress * 360 * this.scrollRotations;
      this.desiredRotationDeg = target;
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    this.detachEvents();
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
  }

  get count(): number { return Math.max(1, this.items?.length ?? 0); }
  get stepDeg(): number { return 360 / this.count; }

  onPointerDown = (ev: PointerEvent) => {
    // Only respond to primary button / touch contact
    if (ev.button != null && ev.button !== 0) return;

    // Prevent multiple simultaneous drags
    if (this.pointerId != null) return;

    ev.preventDefault();

    this.pointerId = ev.pointerId;
    this.startPointerX = ev.clientX;
    this.startPointerY = ev.clientY;
    this.lastPointerX = ev.clientX;
    this.lastMoveTS = ev.timeStamp || performance.now();
    this.desiredRotationDeg = null;
    this.gesture = 'pending';
    this.dragging = false;
    this.dragDeltaHistory.length = 0;
    this.dragVelocityHistory.length = 0;
    // Don't reset angular velocity - let natural friction handle it
    this.ringEl.style.cursor = 'grab';
    this.ringEl.style.touchAction = 'pan-y';
  };

  onPointerMove = (ev: PointerEvent) => {
    if (this.pointerId == null || ev.pointerId !== this.pointerId) return;

    const now = ev.timeStamp || performance.now();
    const dt = Math.max(1, now - this.lastMoveTS) / 1000;

    if (this.gesture === 'pending') {
      const dx0 = ev.clientX - this.startPointerX;
      const dy0 = ev.clientY - this.startPointerY;
      if (Math.abs(dx0) > this.gestureThreshold || Math.abs(dy0) > this.gestureThreshold) {
        if (Math.abs(dx0) * this.horizontalBias > Math.abs(dy0)) {
          this.gesture = 'rotate';
          this.dragging = true;
          // Only capture pointer if we're definitely rotating
          try {
            this.ringEl.setPointerCapture(this.pointerId);
          } catch (e) {
            // Pointer capture may fail in some cases, continue anyway
            console.warn('Failed to capture pointer:', e);
          }
          this.ringEl.style.cursor = 'grabbing';
          this.ringEl.style.touchAction = 'none';
          this.lastPointerX = ev.clientX;
          this.lastMoveTS = now;
        } else {
          this.gesture = 'scroll';
          this.dragging = false;
          this.ringEl.style.touchAction = 'pan-y';
        }
      }
      return;
    }

    if (this.gesture !== 'rotate') return;

    ev.preventDefault();

    const dx = ev.clientX - this.lastPointerX;
    this.pushDragDelta(dx);

    const smoothedDx = this.getSmoothedDelta();
    const deltaDeg = smoothedDx * this.dragSensitivity;
    this.rotationDeg += deltaDeg;

    const instantaneousVelocity = deltaDeg / dt;
    this.pushDragVelocity(instantaneousVelocity);
    this.angularVelocity = this.getSmoothedVelocity();

    this.lastPointerX = ev.clientX;
    this.lastMoveTS = now;
  };

  onPointerUp = (ev: PointerEvent) => {
    if (ev.pointerId !== this.pointerId) return;

    if (this.gesture === 'rotate' && this.pointerId != null) {
      try {
        this.ringEl.releasePointerCapture(this.pointerId);
      } catch (e) {
        // Pointer release may fail, ignore
        console.warn('Failed to release pointer:', e);
      }
      this.ringEl.style.cursor = 'grab';

      // If angular velocity is very high, cap it to prevent extreme spinning
      const maxReleaseVelocity = 200; // degrees per second
      if (Math.abs(this.angularVelocity) > maxReleaseVelocity) {
        this.angularVelocity = Math.sign(this.angularVelocity) * maxReleaseVelocity;
      }
    }

    this.dragging = false;
    this.pointerId = null;
    this.gesture = 'idle';
    this.ringEl.style.touchAction = 'pan-y';
    // Record when drag ended to delay snap activation
    this.lastDragEndTS = performance.now();

    this.dragDeltaHistory.length = 0;
    this.dragVelocityHistory.length = 0;
  };

  onPointerCancel = (ev: PointerEvent) => {
    // Handle pointer cancel same as pointer up to prevent stuck state
    this.onPointerUp(ev);
  };

  onPointerLeave = (ev: PointerEvent) => {
    if (ev.pointerId !== this.pointerId) return;
    // Only treat as pointer up if the pointer actually ended
    if (ev.buttons === 0) {
      this.onPointerUp(ev);
    }
  };

  private wheelHandler = (ev: WheelEvent) => {
    if (this.interceptWheel) ev.preventDefault();
    const delta = ev.deltaY || ev.detail || 0;
    const deltaDeg = delta * this.wheelSpeed;
    this.rotationDeg += deltaDeg;
    this.angularVelocity += deltaDeg * 60;
    this.desiredRotationDeg = null;
  };

  private setupDOM() {
    this.hostRef.nativeElement.style.setProperty('--perspective', `${this.perspective}px`);
    this.hostRef.nativeElement.style.setProperty('--ring-viewport', `${this.ringViewport}px`);
    this.hostRef.nativeElement.style.setProperty('--card-w', `${this.cardWidth}px`);
    this.hostRef.nativeElement.style.setProperty('--card-h', `${this.cardHeight}px`);
    this.ringEl.style.touchAction = 'pan-y';
    this.ringEl.style.cursor = 'grab';
  }

  private applyOrientationFlipVariable() {
    const flip = this.orientation === 'outward' ? '180deg' : '0deg';
    this.ringEl.style.setProperty('--inner-flip', flip);
  }

  private recomputeBaseRadiusEffective() {
    const stepRad = (2 * Math.PI) / Math.max(1, this.count);
    let spacingRadius = 0;
    if (this.autoRadiusSpacing && this.count > 1) {
      const requiredChord = this.cardWidth + this.minGapPx;
      const denom = 2 * Math.sin(stepRad / 2);
      spacingRadius = denom > 0 ? requiredChord / denom : 0;
    }
    this.baseRadiusEffective = Math.max(this.baseRadius, spacingRadius || 0);
  }

  private layoutCards(forceAll = false) {
    const radius = this.dynamicRadius;
    const step = this.stepDeg;

    if (!forceAll && Math.abs(radius - this.lastRadiusApplied) < 0.1) return;

    for (let i = 0; i < this.cardEls.length; i++) {
      const angle = i * step;
      const el = this.cardEls[i];

      let t = '';
      switch (this.orientation) {
        case 'camera':
          t = `rotateY(${angle}deg) translateZ(${radius}px) rotateY(${-angle}deg)`;
          break;
        case 'inward':
          t = `rotateY(${angle}deg) translateZ(${radius}px)`;
          break;
        case 'outward':
        default:
          t = `rotateY(${angle}deg) translateZ(${radius}px) rotateY(180deg)`;
          break;
      }

      el.style.transform = t;
      el.style.width = `${this.cardWidth}px`;
      el.style.height = `${this.cardHeight}px`;
    }

    this.lastRadiusApplied = radius;
  }

  private attachEvents() {
    this.ringEl.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.ringEl.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.ringEl.addEventListener('pointerup', this.onPointerUp, { passive: false });
    this.ringEl.addEventListener('pointercancel', this.onPointerCancel, { passive: false });
    this.ringEl.addEventListener('pointerleave', this.onPointerLeave, { passive: false });
    this.ringEl.addEventListener('wheel', this.wheelHandler, { passive: !this.interceptWheel });
  }

  private detachEvents() {
    this.ringEl.removeEventListener('pointerdown', this.onPointerDown);
    this.ringEl.removeEventListener('pointermove', this.onPointerMove);
    this.ringEl.removeEventListener('pointerup', this.onPointerUp);
    this.ringEl.removeEventListener('pointercancel', this.onPointerCancel);
    this.ringEl.removeEventListener('pointerleave', this.onPointerLeave);
    this.ringEl.removeEventListener('wheel', this.wheelHandler);
  }

  private pushDragDelta(delta: number) {
    this.dragDeltaHistory.push(delta);
    if (this.dragDeltaHistory.length > this.dragDeltaWindow) {
      this.dragDeltaHistory.shift();
    }
  }

  private getSmoothedDelta(): number {
    if (!this.dragDeltaHistory.length) return 0;
    const total = this.dragDeltaHistory.reduce((acc, value) => acc + value, 0);
    return total / this.dragDeltaHistory.length;
  }

  private pushDragVelocity(velocity: number) {
    this.dragVelocityHistory.push(velocity);
    if (this.dragVelocityHistory.length > this.dragVelocityWindow) {
      this.dragVelocityHistory.shift();
    }
  }

  private getSmoothedVelocity(): number {
    if (!this.dragVelocityHistory.length) return 0;
    const total = this.dragVelocityHistory.reduce((acc, value) => acc + value, 0);
    return total / this.dragVelocityHistory.length;
  }

  private setupReducedMotion() {
    if (!window || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = mq.matches;
    mq.addEventListener?.('change', (e) => (this.reducedMotion = e.matches));
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - (this.prevTS || now)) / 1000);
    this.prevTS = now;

    if (this.desiredRotationDeg != null && !this.dragging) {
      const blend = this.reducedMotion ? 1 : Math.min(1, dt * 12);
      this.rotationDeg = this.rotationDeg + (this.desiredRotationDeg - this.rotationDeg) * blend;
      this.angularVelocity = 0;
    } else {
      this.rotationDeg += this.angularVelocity * dt;

      if (this.inertiaEnabled && !this.dragging) {
        const decay = Math.exp(-this.friction * dt);
        this.angularVelocity *= decay;
        if (Math.abs(this.angularVelocity) < 0.01) this.angularVelocity = 0;
      } else if (!this.inertiaEnabled && !this.dragging) {
        this.angularVelocity = 0;
      }

      if (this.snapEnabled && !this.dragging && Math.abs(this.angularVelocity) < this.snapVelocityThreshold) {
        // Wait 150ms after drag ends before allowing snap to activate
        const timeSinceDragEnd = now - this.lastDragEndTS;
        if (timeSinceDragEnd < 150) {
          // Skip snap logic while in cooldown period
        } else {
          const snapTarget = this.nearestSnapAngle(this.rotationDeg);
          const diff = this.shortestAngleDist(this.rotationDeg, snapTarget);
          const accel = this.snapStrength * Math.sign(diff) * Math.min(1, Math.abs(diff) / this.stepDeg);
          const damp = 6;
          this.angularVelocity += (accel - damp * this.angularVelocity) * dt;

          if (Math.abs(diff) < 0.02 && Math.abs(this.angularVelocity) < 0.05) {
            this.rotationDeg = snapTarget;
            this.angularVelocity = 0;
          }
        }
      }
    }

    const velAbs = Math.abs(this.angularVelocity);
    const maxAdd = this.baseRadiusEffective * (this.reducedMotion ? 0 : this.radiusElasticity);
    const radiusTarget = this.baseRadiusEffective + Math.min(1, velAbs / this.radiusVelInfluence) * maxAdd;

    const k = this.springStiffness;
    const c = this.springDamping;
    const x = this.dynamicRadius;
    const v = this.radiusVelocity;
    const a = -k * (x - radiusTarget) - c * v;
    this.radiusVelocity = v + a * dt;
    this.dynamicRadius = x + this.radiusVelocity * dt;

    this.applyRingTransform();
    this.layoutCards(false);

    this.maybeEmitIndex();

    this.rafId = requestAnimationFrame(this.tick);
  };

  private applyRingTransform() {
    this.ringEl.style.transform = `translateZ(0) rotateY(${this.rotationDeg}deg)`;
  }

  private nearestSnapAngle(currentDeg: number): number {
    const step = this.stepDeg;
    const normalized = this.normalizeDeg(-currentDeg);
    const idx = Math.round(normalized / step);
    return -idx * step;
  }

  private normalizeDeg(deg: number): number {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
  }

  private shortestAngleDist(a: number, b: number): number {
    let diff = (b - a) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return diff;
  }

  private computeActiveIndex(): number {
    const step = this.stepDeg;
    const normalized = this.normalizeDeg(-this.rotationDeg);
    let idx = Math.round(normalized / step) % this.count;
    if (idx < 0) idx += this.count;
    return idx;
  }

  private lastEmittedIndex = -1;
  private maybeEmitIndex() {
    const idx = this.computeActiveIndex();
    if (idx !== this.lastEmittedIndex) {
      this.lastEmittedIndex = idx;
      this.activeIndexChange.emit(idx);
    }
  }
  private emitActiveIndex() {
    this.lastEmittedIndex = -1;
    this.maybeEmitIndex();
  }

  @HostListener('window:resize')
  onResize() {
    const style = getComputedStyle(this.hostRef.nativeElement);
    const vp = parseFloat(style.getPropertyValue('--ring-viewport'));
    if (!Number.isNaN(vp) && vp !== this.ringViewport) {
      this.ringViewport = vp;
      this.hostRef.nativeElement.style.setProperty('--ring-viewport', `${this.ringViewport}px`);
      this.recomputeBaseRadiusEffective();
      this.lastRadiusApplied = -1;
      this.layoutCards(true);
    }
  }
}
