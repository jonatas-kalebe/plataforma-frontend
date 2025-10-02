import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Inject, Input, NgZone, OnChanges, OnDestroy, Output, PLATFORM_ID, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

type Item = any;
type OrientationMode = 'outward' | 'inward' | 'camera';

type InteractionBridge = {
  onDragStart?: () => void;
  onDragMove?: (rotation: number, velocity: number) => void;
  onDragEnd?: (velocity: number) => void;
  onActiveIndexChange?: (index: number) => void;
} | null;

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
  @Input() wheelSpeed = 0.2; // legacy - kept for backwards compat but overridden by discrete wheel steps
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

  private velocitySamples: number[] = [];
  private readonly velocityWindow = 6;

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
  private snapPending = false;
  private pointerCaptured = false;

  private lastDragVelocity = 0;
  private peakDragVelocity = 0;
  private peakDragAcceleration = 0;
  private dragEnergy = 0;
  private slowDragFrames = 0;

  private rafId: number | null = null;
  private prevTS = 0;

  private ringEl!: HTMLDivElement;
  private cardEls: HTMLDivElement[] = [];
  private interactionBridge: InteractionBridge = null;

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
    // Prevent multiple simultaneous drags
    if (this.pointerId != null) return;
    if (ev.button != null && ev.button !== 0) return;
    if (ev.isPrimary === false) return;

    this.pointerId = ev.pointerId;
    this.startPointerX = ev.clientX;
    this.startPointerY = ev.clientY;
    this.lastPointerX = ev.clientX;
    this.lastMoveTS = ev.timeStamp || performance.now();
    this.desiredRotationDeg = null;
    this.snapPending = false;
    this.gesture = 'pending';
    this.dragging = false;
    this.pointerCaptured = false;
    this.resetVelocitySamples();
    this.lastDragVelocity = 0;
    this.peakDragVelocity = 0;
    this.peakDragAcceleration = 0;
    this.dragEnergy = 0;
    this.slowDragFrames = 0;
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
          this.beginRotateGesture(ev, now);
        } else {
          this.gesture = 'scroll';
          this.dragging = false;
          this.ringEl.style.touchAction = 'pan-y';
          this.releasePointerCapture();
        }
      }
      return;
    }

    if (this.gesture !== 'rotate') return;

    ev.preventDefault?.();

    const safeDt = Math.max(1 / 240, dt);
    const dxRaw = this.computePointerDelta(ev);
    const pointerSpeed = Math.abs(dxRaw) / safeDt;
    const intensity = this.computePointerIntensity(pointerSpeed);
    const deltaDeg = this.applyDragCurve(dxRaw * this.dragSensitivity * intensity, intensity);
    const instantaneousVelocity = deltaDeg / safeDt;
    const accel = (instantaneousVelocity - this.lastDragVelocity) / safeDt;

    if (Number.isFinite(accel)) {
      this.peakDragAcceleration = Math.max(this.peakDragAcceleration, Math.abs(accel));
      this.dragEnergy = Math.min(this.dragEnergy + Math.abs(instantaneousVelocity * accel) * safeDt, this.stepDeg * 160);
    }
    this.lastDragVelocity = instantaneousVelocity;
    this.peakDragVelocity = Math.max(this.peakDragVelocity, Math.abs(instantaneousVelocity));

    this.rotationDeg += deltaDeg;
    this.recordVelocitySample(instantaneousVelocity);
    const smoothedVelocity = this.getSmoothedVelocity();
    const isSlowDrag =
      this.peakDragVelocity < this.stepDeg * 3.5 && Math.abs(smoothedVelocity) < this.stepDeg * 2.75;
    if (isSlowDrag) {
      this.slowDragFrames = Math.min(this.slowDragFrames + 1, 120);
      this.angularVelocity = smoothedVelocity;
    } else {
      this.slowDragFrames = Math.max(0, this.slowDragFrames - 3);
      this.angularVelocity = this.angularVelocity * 0.55 + smoothedVelocity * 0.45;
    }

    this.lastPointerX = ev.clientX;
    this.lastMoveTS = now;

    this.interactionBridge?.onDragMove?.(this.rotationDeg, this.angularVelocity);
  };

  onPointerUp = (ev: PointerEvent) => {
    if (ev.pointerId !== this.pointerId) return;

    const wasRotating = this.gesture === 'rotate';

    if (wasRotating && this.pointerId != null) {
      this.releasePointerCapture();
      this.ringEl.style.cursor = 'grab';

      // If angular velocity is very high, cap it to prevent extreme spinning
      const releaseVelocity = this.getSmoothedVelocity();
      this.angularVelocity = this.computeReleaseVelocity(releaseVelocity);
    }

    this.dragging = false;
    this.pointerId = null;
    this.gesture = 'idle';
    this.ringEl.style.touchAction = 'pan-y';
    // Record when drag ended to delay snap activation
    this.lastDragEndTS = performance.now();
    this.snapPending = wasRotating;
    if (wasRotating && this.slowDragFrames > 12 && Math.abs(this.angularVelocity) < this.stepDeg * 1.25) {
      this.angularVelocity = 0;
      this.desiredRotationDeg = this.nearestSnapAngle(this.rotationDeg);
    }
    if (wasRotating) {
      this.interactionBridge?.onDragEnd?.(this.angularVelocity);
    }
    this.slowDragFrames = 0;
    this.lastDragVelocity = 0;
    this.peakDragVelocity = 0;
    this.peakDragAcceleration = 0;
    this.dragEnergy = 0;
  };

  onPointerCancel = (ev: PointerEvent) => {
    // Handle pointer cancel same as pointer up to prevent stuck state
    this.onPointerUp(ev);
  };

  private wheelHandler = (ev: WheelEvent) => {
    if (this.interceptWheel) ev.preventDefault();
    if (this.dragging) return;

    const delta = ev.deltaY || ev.deltaX || ev.detail || 0;
    const direction = Math.sign(delta);
    if (!direction) return;

    const step = this.stepDeg;
    const currentAnchor = this.desiredRotationDeg ?? this.nearestSnapAngle(this.rotationDeg);
    const target = currentAnchor - direction * step;

    this.desiredRotationDeg = target;
    this.angularVelocity = 0;
    this.snapPending = true;
    this.lastDragEndTS = performance.now();
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
    this.ringEl.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    this.ringEl.addEventListener('pointermove', this.onPointerMove, { passive: false });
    this.ringEl.addEventListener('pointerup', this.onPointerUp, { passive: true });
    this.ringEl.addEventListener('pointercancel', this.onPointerCancel, { passive: true });
    this.ringEl.addEventListener('pointerleave', this.onPointerUp, { passive: true });
    this.ringEl.addEventListener('wheel', this.wheelHandler, { passive: !this.interceptWheel });
  }

  private detachEvents() {
    this.ringEl.removeEventListener('pointerdown', this.onPointerDown);
    this.ringEl.removeEventListener('pointermove', this.onPointerMove);
    this.ringEl.removeEventListener('pointerup', this.onPointerUp);
    this.ringEl.removeEventListener('pointercancel', this.onPointerCancel);
    this.ringEl.removeEventListener('pointerleave', this.onPointerUp);
    this.ringEl.removeEventListener('wheel', this.wheelHandler);
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

      if (this.snapEnabled && !this.dragging) {
        const timeSinceDragEnd = now - this.lastDragEndTS;
        const snapDelay = 120;
        const forceSnapDelay = 900;
        const snapTarget = this.nearestSnapAngle(this.rotationDeg);
        const diff = this.shortestAngleDist(this.rotationDeg, snapTarget);
        const velocityThreshold = Math.max(this.snapVelocityThreshold, this.stepDeg * 1.05);
        const belowVelocityThreshold = Math.abs(this.angularVelocity) < velocityThreshold;
        const almostAligned = Math.abs(diff) < this.stepDeg * 0.55;

        if (!this.snapPending && belowVelocityThreshold && almostAligned) {
          this.snapPending = true;
          this.lastDragEndTS = now - snapDelay;
        }

        if (this.snapPending && timeSinceDragEnd >= snapDelay && (belowVelocityThreshold || timeSinceDragEnd >= forceSnapDelay)) {
          const proximity = Math.min(1, Math.abs(diff) / this.stepDeg);
          const strength = this.snapStrength * (0.85 + (1 - proximity) * 0.45);
          const damp = timeSinceDragEnd >= forceSnapDelay ? strength * 0.55 : 6 + proximity * 6;
          const accel = strength * Math.sign(diff) * Math.max(0.1, proximity);
          this.angularVelocity += (accel - damp * this.angularVelocity) * dt;

          if (timeSinceDragEnd >= forceSnapDelay && !belowVelocityThreshold) {
            this.angularVelocity *= Math.exp(-this.friction * dt * 0.65);
          }

          const settleVelocity = Math.max(0.04, velocityThreshold * 0.12);
          const settleOffset = Math.max(0.01, this.stepDeg * 0.018);
          if (Math.abs(diff) < settleOffset && Math.abs(this.angularVelocity) < settleVelocity) {
            this.rotationDeg = snapTarget;
            this.angularVelocity = 0;
            this.snapPending = false;
          }
        } else if (this.snapPending && timeSinceDragEnd >= snapDelay) {
          // keep inertia alive but gently bleed energy so we eventually cross the threshold
          this.angularVelocity *= Math.exp(-this.friction * dt * 0.12);
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
    this.ringEl.style.setProperty('--rotation', `${-this.rotationDeg}deg`);
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
      this.interactionBridge?.onActiveIndexChange?.(idx);
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

  registerInteractionBridge(bridge: InteractionBridge) {
    this.interactionBridge = bridge;
  }

  private beginRotateGesture(ev: PointerEvent, now: number) {
    this.gesture = 'rotate';
    this.dragging = true;
    this.resetVelocitySamples();
    this.capturePointer();
    this.ringEl.style.cursor = 'grabbing';
    this.ringEl.style.touchAction = 'none';
    this.lastPointerX = ev.clientX;
    this.lastMoveTS = now;
    this.interactionBridge?.onDragStart?.();
  }

  private capturePointer() {
    if (this.pointerId == null || this.pointerCaptured) return;
    try {
      this.ringEl.setPointerCapture(this.pointerId);
      this.pointerCaptured = true;
    } catch (e) {
      console.warn('Failed to capture pointer:', e);
      this.pointerCaptured = false;
    }
  }

  private releasePointerCapture() {
    if (this.pointerId == null || !this.pointerCaptured) return;
    try {
      this.ringEl.releasePointerCapture(this.pointerId);
    } catch (e) {
      console.warn('Failed to release pointer:', e);
    }
    this.pointerCaptured = false;
  }

  private resetVelocitySamples() {
    this.velocitySamples = [];
  }

  private recordVelocitySample(value: number) {
    if (!Number.isFinite(value)) return;
    this.velocitySamples.push(value);
    if (this.velocitySamples.length > this.velocityWindow) {
      this.velocitySamples.shift();
    }
  }

  private getSmoothedVelocity(): number {
    if (!this.velocitySamples.length) return 0;
    const sum = this.velocitySamples.reduce((acc, v) => acc + v, 0);
    return sum / this.velocitySamples.length;
  }

  private computePointerDelta(ev: PointerEvent): number {
    const movementX = (ev as any).movementX;
    if (typeof movementX === 'number' && Number.isFinite(movementX) && movementX !== 0) {
      return movementX;
    }
    return ev.clientX - this.lastPointerX;
  }

  private computePointerIntensity(pointerSpeed: number): number {
    if (!Number.isFinite(pointerSpeed)) return 1;
    const normalized = Math.min(1, pointerSpeed / 1800);
    return 1 + normalized * 2.4;
  }

  private computeReleaseVelocity(releaseVelocity: number): number {
    const slowDrag = this.slowDragFrames > 12 && this.peakDragVelocity < this.stepDeg * 3.5;
    if (slowDrag && Math.abs(releaseVelocity) < this.stepDeg * 2.1) {
      this.snapPending = true;
      return 0;
    }

    const directionSource = releaseVelocity || this.lastDragVelocity || (this.rotationDeg - this.nearestSnapAngle(this.rotationDeg));
    const direction = Math.sign(directionSource) || 1;
    const baseSpeed = Math.max(Math.abs(releaseVelocity), this.peakDragVelocity * 0.85);
    const accelBoost = this.peakDragAcceleration * 0.08;
    const energyFactor = Math.min(1.75, this.dragEnergy / (this.stepDeg * 28));
    let boosted = baseSpeed * (1 + energyFactor * 0.85) + accelBoost;
    const minCarry = this.stepDeg * 2.5;
    if (boosted < minCarry && energyFactor > 0.2) {
      boosted = minCarry + (boosted - minCarry) * 0.5;
    }
    const maxReleaseVelocity = 840;
    const finalVelocity = Math.min(Math.max(boosted, slowDrag ? 0 : minCarry), maxReleaseVelocity);
    return direction * finalVelocity;
  }

  private applyDragCurve(delta: number, intensity = 1): number {
    const maxDelta = this.stepDeg * (1.2 + intensity * 1.6);
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
    const exponent = intensity > 1.4 ? 0.82 : 0.9;
    return Math.sign(clamped) * Math.pow(Math.abs(clamped), exponent);
  }
}
