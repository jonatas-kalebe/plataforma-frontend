import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Inject, Input, NgZone, OnChanges, OnDestroy, Output, PLATFORM_ID, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';

// Service imports
import { RingLayoutService, RingLayoutConfig, RadiusState } from '../../services/animation/ring-layout.service';
import { RingPhysicsService, ReleaseVelocityParams } from '../../services/ring-physics.service';
import { RingGestureService, GestureData, SyntheticPointerEvent } from '../../services/ring-gesture.service';
import { ReducedMotionService } from '../../services/reduced-motion.service';
import { HapticsService, VibrationPattern } from '../../services/haptics.service';
import { FeatureFlagsService } from '../../services/feature-flags.service';

// A11y imports
import { getGroupAttrs, getItemAttrs, getLiveMessage, AriaGroupAttributes, AriaItemAttributes } from '../../a11y/aria-ring';

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
  private subscriptions = new Subscription();

  private rotationDeg = 0;
  private angularVelocity = 0;
  private desiredRotationDeg: number | null = null;

  private radiusState: RadiusState = {
    current: this.baseRadius,
    target: this.baseRadius,
    velocity: 0
  };
  private baseRadiusEffective = this.baseRadius;
  private lastRadiusApplied = -1;

  private dragging = false;
  private lastDragEndTS = 0;
  private snapPending = false;
  private snapTarget: number | null = null;

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
  private lastWheelTS = 0;

  // Haptic feedback debouncing
  private lastHapticTS = 0;
  private readonly HAPTIC_DEBOUNCE_MS = 250;

  // ARIA attributes
  public ariaGroupAttrs: AriaGroupAttributes = getGroupAttrs(this.items.length);
  public ariaLiveMessage = '';

  constructor(
    private zone: NgZone,
    private hostRef: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) platformId: Object,
    private ringLayoutService: RingLayoutService,
    private ringPhysicsService: RingPhysicsService,
    private ringGestureService: RingGestureService,
    private reducedMotionService: ReducedMotionService,
    private hapticsService: HapticsService,
    private featureFlagsService: FeatureFlagsService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Configure gesture service with component settings
    if (this.isBrowser) {
      this.ringGestureService.configure({
        gestureThreshold: this.gestureThreshold,
        horizontalBias: this.horizontalBias,
        velocityWindowSize: 6
      });
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.ringEl = this.ringRef.nativeElement;
    this.cardEls = this.cardRefs.toArray().map(r => r.nativeElement);

    // Subscribe to reduced motion preference
    this.subscriptions.add(
      this.reducedMotionService.getPrefersReducedMotion().subscribe(prefersReduced => {
        this.reducedMotion = prefersReduced;
      })
    );

    // Subscribe to gesture service
    this.subscriptions.add(
      this.ringGestureService.gestureData$.subscribe(data => this.handleGestureData(data))
    );

    // Initialize ARIA attributes
    this.updateAriaAttributes();

    const style = getComputedStyle(this.hostRef.nativeElement);
    const vp = parseFloat(style.getPropertyValue('--ring-viewport'));
    if (!Number.isNaN(vp)) this.ringViewport = vp;
    this.hostRef.nativeElement.style.setProperty('--ring-viewport', `${this.ringViewport}px`);

    this.setupDOM();
    this.applyOrientationFlipVariable();
    this.recomputeBaseRadiusEffective();
    this.radiusState.current = this.baseRadiusEffective;
    this.radiusState.target = this.baseRadiusEffective;
    this.layoutCards(true);
    this.attachEvents();

    this.zone.runOutsideAngular(() => {
      this.prevTS = performance.now();
      this.tick(this.prevTS);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isBrowser) return;

    // Update gesture service configuration if relevant inputs changed
    if (changes['gestureThreshold'] || changes['horizontalBias']) {
      this.ringGestureService.configure({
        gestureThreshold: this.gestureThreshold,
        horizontalBias: this.horizontalBias,
        velocityWindowSize: 6
      });
    }

    if (changes['items'] || changes['cardWidth'] || changes['baseRadius'] ||
      changes['minGapPx'] || changes['autoRadiusSpacing']) {
      queueMicrotask(() => {
        this.cardEls = this.cardRefs.toArray().map(r => r.nativeElement);
        this.recomputeBaseRadiusEffective();
        this.lastRadiusApplied = -1;
        this.layoutCards(true);
        this.emitActiveIndex();

        // Update ARIA attributes when items change
        if (changes['items']) {
          this.updateAriaAttributes();
        }
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
      this.snapTarget = null;
      this.snapPending = true;
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    // Unsubscribe from all observables
    this.subscriptions.unsubscribe();

    // Cleanup event listeners
    this.detachEvents();

    // Cancel animation frame
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Reset gesture service state
    this.ringGestureService.reset();
  }

  get count(): number { return Math.max(1, this.items?.length ?? 0); }
  get stepDeg(): number { return 360 / this.count; }

  onPointerDown = (ev: PointerEvent) => {
    // Convert to synthetic event and delegate to gesture service
    const syntheticEvent: SyntheticPointerEvent = {
      pointerId: ev.pointerId,
      clientX: ev.clientX,
      clientY: ev.clientY,
      timeStamp: ev.timeStamp || performance.now(),
      isPrimary: ev.isPrimary !== false,
      button: ev.button
    };

    // Reset rotation targets
    this.desiredRotationDeg = null;
    this.snapPending = false;
    this.snapTarget = null;

    // Update cursor
    this.ringEl.style.cursor = 'grab';
    this.ringEl.style.touchAction = 'pan-y';

    // Reset drag metrics
    this.lastDragVelocity = 0;
    this.peakDragVelocity = 0;
    this.peakDragAcceleration = 0;
    this.dragEnergy = 0;
    this.slowDragFrames = 0;

    this.ringGestureService.onPointerDown(syntheticEvent);
  };

  onPointerMove = (ev: PointerEvent) => {
    // Convert to synthetic event and delegate to gesture service
    const syntheticEvent: SyntheticPointerEvent = {
      pointerId: ev.pointerId,
      clientX: ev.clientX,
      clientY: ev.clientY,
      timeStamp: ev.timeStamp || performance.now(),
      isPrimary: ev.isPrimary !== false,
      button: ev.button
    };

    this.ringGestureService.onPointerMove(syntheticEvent);

    // Prevent default if rotating
    if (this.ringGestureService.getState() === 'rotate') {
      ev.preventDefault?.();
    }
  };

  onPointerUp = (ev: PointerEvent) => {
    // Convert to synthetic event and delegate to gesture service
    const syntheticEvent: SyntheticPointerEvent = {
      pointerId: ev.pointerId,
      clientX: ev.clientX,
      clientY: ev.clientY,
      timeStamp: ev.timeStamp || performance.now(),
      isPrimary: ev.isPrimary !== false,
      button: ev.button
    };

    this.ringGestureService.onPointerUp(syntheticEvent);

    // Reset cursor
    this.ringEl.style.cursor = 'grab';
    this.ringEl.style.touchAction = 'pan-y';
  };

  onPointerCancel = (ev: PointerEvent) => {
    // Delegate to pointer up handler
    this.onPointerUp(ev);
  };

  private wheelHandler = (ev: WheelEvent) => {
    if (this.interceptWheel) ev.preventDefault();
    if (this.dragging) return;

    const delta = ev.deltaY || ev.deltaX || ev.detail || 0;
    const direction = Math.sign(delta);
    if (!direction) return;

    const now = performance.now();
    const dt = now - this.lastWheelTS;
    this.lastWheelTS = now;

    const step = this.stepDeg;
    const anchor = this.snapTarget ?? this.ringPhysicsService.nearestSnapAngle(this.rotationDeg, step);
    this.snapTarget = anchor - direction * step;

    const fastFactor = Number.isFinite(dt) && dt > 0 ? Math.min(6, 240 / Math.max(18, dt)) : 1;
    const boostBase = this.stepDeg * 18;
    const newVelocity = direction * boostBase * fastFactor;

    if (Math.sign(this.angularVelocity) === direction) {
      this.angularVelocity += newVelocity;
    } else {
      this.angularVelocity = newVelocity;
    }

    this.desiredRotationDeg = null;
    this.snapPending = true;
    this.lastDragEndTS = now;

    // Trigger haptic feedback on wheel (debounced)
    this.triggerHapticFeedback(this.hapticsService.patterns.light, true);
  };

  /**
   * Handle gesture data from RingGestureService
   */
  private handleGestureData(data: GestureData): void {
    const state = data.state;

    if (state === 'pending') {
      // Gesture started, waiting for disambiguation
      this.dragging = false;
      this.interactionBridge?.onDragStart?.();
    } else if (state === 'rotate') {
      // Active rotation gesture
      if (!this.dragging) {
        this.dragging = true;
        this.ringEl.style.cursor = 'grabbing';
        this.ringEl.style.touchAction = 'none';

        // Trigger light haptic feedback on drag start
        this.triggerHapticFeedback(this.hapticsService.patterns.light, true);

        // Capture pointer if available
        if (data.pointerId !== null && this.ringEl.setPointerCapture) {
          try {
            this.ringEl.setPointerCapture(data.pointerId);
          } catch (e) {
            // Silently fail if pointer capture not available
          }
        }
      }

      // Apply drag curve and sensitivity
      const pointerSpeed = Math.abs(data.velocity);
      const intensity = this.computePointerIntensity(pointerSpeed);
      const deltaDeg = this.applyDragCurve(data.delta * this.dragSensitivity * intensity, intensity);
      const dt = Math.max(1 / 240, 1 / 60); // Assume 60fps for delta conversion
      const instantaneousVelocity = deltaDeg / dt;
      const accel = (instantaneousVelocity - this.lastDragVelocity) / dt;

      // Track drag metrics for release velocity calculation
      if (Number.isFinite(accel)) {
        this.peakDragAcceleration = Math.max(this.peakDragAcceleration, Math.abs(accel));
        this.dragEnergy = Math.min(this.dragEnergy + Math.abs(instantaneousVelocity * accel) * dt, this.stepDeg * 160);
      }
      this.lastDragVelocity = instantaneousVelocity;
      this.peakDragVelocity = Math.max(this.peakDragVelocity, Math.abs(instantaneousVelocity));

      // Update rotation
      this.rotationDeg += deltaDeg;
      this.snapTarget = null;

      // Update velocity with smoothing
      const smoothedVelocity = data.smoothedVelocity * this.dragSensitivity;
      const isSlowDrag = this.peakDragVelocity < this.stepDeg * 3.5 && Math.abs(smoothedVelocity) < this.stepDeg * 2.75;
      if (isSlowDrag) {
        this.slowDragFrames = Math.min(this.slowDragFrames + 1, 120);
        this.angularVelocity = smoothedVelocity;
      } else {
        this.slowDragFrames = Math.max(0, this.slowDragFrames - 3);
        this.angularVelocity = this.angularVelocity * 0.55 + smoothedVelocity * 0.45;
      }

      this.interactionBridge?.onDragMove?.(this.rotationDeg, this.angularVelocity);
    } else if (state === 'idle' && this.dragging) {
      // Gesture ended
      const wasRotating = this.dragging;
      this.dragging = false;

      // Release pointer capture
      if (data.pointerId !== null && this.ringEl.releasePointerCapture) {
        try {
          this.ringEl.releasePointerCapture(data.pointerId);
        } catch (e) {
          // Silently fail
        }
      }

      // Calculate release velocity using physics service
      if (wasRotating) {
        const params: ReleaseVelocityParams = {
          releaseVelocity: data.smoothedVelocity * this.dragSensitivity,
          slowDragFrames: this.slowDragFrames,
          peakDragVelocity: this.peakDragVelocity,
          lastDragVelocity: this.lastDragVelocity,
          currentRotation: this.rotationDeg,
          stepDeg: this.stepDeg,
          peakDragAcceleration: this.peakDragAcceleration,
          dragEnergy: this.dragEnergy
        };

        this.angularVelocity = this.ringPhysicsService.releaseVelocity(params);

        // Trigger haptic feedback on release (debounced, only for significant velocity)
        if (Math.abs(this.angularVelocity) > this.stepDeg * 2) {
          this.triggerHapticFeedback(this.hapticsService.patterns.selection, true);
        }
      }

      // Record when drag ended and handle snap
      this.lastDragEndTS = performance.now();
      this.snapPending = wasRotating;
      this.snapTarget = null;

      if (wasRotating && this.slowDragFrames > 12 && Math.abs(this.angularVelocity) < this.stepDeg * 1.25) {
        this.angularVelocity = 0;
        this.desiredRotationDeg = this.ringPhysicsService.nearestSnapAngle(this.rotationDeg, this.stepDeg);
      }

      if (wasRotating) {
        this.interactionBridge?.onDragEnd?.(this.angularVelocity);
      }

      // Reset drag metrics
      this.slowDragFrames = 0;
      this.lastDragVelocity = 0;
      this.peakDragVelocity = 0;
      this.peakDragAcceleration = 0;
      this.dragEnergy = 0;
    }
  }

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
    const config: RingLayoutConfig = {
      totalCards: this.count,
      baseRadius: this.baseRadius,
      cardWidth: this.cardWidth,
      cardHeight: this.cardHeight,
      minGapPx: this.minGapPx,
      orientation: this.orientation,
      autoRadiusSpacing: this.autoRadiusSpacing,
      radiusElasticity: this.radiusElasticity,
      radiusVelInfluence: this.radiusVelInfluence,
      springStiffness: this.springStiffness,
      springDamping: this.springDamping
    };

    this.baseRadiusEffective = this.ringLayoutService.calculateRadius(config);
  }

  private layoutCards(forceAll = false) {
    const radius = this.radiusState.current;

    if (!forceAll && Math.abs(radius - this.lastRadiusApplied) < 0.1) return;

    const config: RingLayoutConfig = {
      totalCards: this.count,
      baseRadius: this.baseRadius,
      cardWidth: this.cardWidth,
      cardHeight: this.cardHeight,
      minGapPx: this.minGapPx,
      orientation: this.orientation,
      autoRadiusSpacing: this.autoRadiusSpacing,
      radiusElasticity: this.radiusElasticity,
      radiusVelInfluence: this.radiusVelInfluence,
      springStiffness: this.springStiffness,
      springDamping: this.springDamping
    };

    for (let i = 0; i < this.cardEls.length; i++) {
      const el = this.cardEls[i];
      const position = this.ringLayoutService.calculateCardPosition(i, config, radius);

      el.style.transform = position.transform;
      el.style.width = `${this.cardWidth}px`;
      el.style.height = `${this.cardHeight}px`;

      // Add ARIA attributes to each card
      const itemAttrs = getItemAttrs(i, this.count);
      el.setAttribute('role', itemAttrs.role);
      el.setAttribute('aria-label', itemAttrs['aria-label']);
      if (itemAttrs['aria-roledescription']) {
        el.setAttribute('aria-roledescription', itemAttrs['aria-roledescription']);
      }
      if (itemAttrs['aria-setsize']) {
        el.setAttribute('aria-setsize', String(itemAttrs['aria-setsize']));
      }
      if (itemAttrs['aria-posinset']) {
        el.setAttribute('aria-posinset', String(itemAttrs['aria-posinset']));
      }
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
        // Use physics service for decay
        this.angularVelocity = this.ringPhysicsService.decay(
          this.angularVelocity,
          this.friction,
          dt
        );
        if (Math.abs(this.angularVelocity) < 0.01) this.angularVelocity = 0;
      } else if (!this.inertiaEnabled && !this.dragging) {
        this.angularVelocity = 0;
      }

      if (this.snapEnabled && !this.dragging) {
        const timeSinceDragEnd = now - this.lastDragEndTS;
        const snapDelay = 120;
        const forceSnapDelay = 900;
        const liveTarget = this.snapTarget ?? this.ringPhysicsService.nearestSnapAngle(this.rotationDeg, this.stepDeg);
        const diff = this.ringPhysicsService.shortestAngleDiff(this.rotationDeg, liveTarget);
        const velocityThreshold = Math.max(this.snapVelocityThreshold, this.stepDeg * 1.05);
        const belowVelocityThreshold = Math.abs(this.angularVelocity) < velocityThreshold;
        const almostAligned = Math.abs(diff) < this.stepDeg * 0.55;

        if (!this.snapPending && belowVelocityThreshold && almostAligned) {
          this.snapPending = true;
          this.lastDragEndTS = now - snapDelay;
          this.snapTarget = liveTarget;
        }

        if (this.snapPending && timeSinceDragEnd >= snapDelay && (belowVelocityThreshold || timeSinceDragEnd >= forceSnapDelay)) {
          if (this.snapTarget == null && belowVelocityThreshold) {
            this.snapTarget = this.ringPhysicsService.nearestSnapAngle(this.rotationDeg, this.stepDeg);
          }
          const target = this.snapTarget ?? this.ringPhysicsService.nearestSnapAngle(this.rotationDeg, this.stepDeg);
          const targetDiff = this.ringPhysicsService.shortestAngleDiff(this.rotationDeg, target);
          const proximity = Math.min(1, Math.abs(targetDiff) / this.stepDeg);
          const strength = this.snapStrength * (0.85 + (1 - proximity) * 0.45);
          const damp = timeSinceDragEnd >= forceSnapDelay ? strength * 0.55 : 6 + proximity * 6;
          const accel = strength * Math.sign(targetDiff) * Math.max(0.1, proximity);
          this.angularVelocity += (accel - damp * this.angularVelocity) * dt;

          if (timeSinceDragEnd >= forceSnapDelay && !belowVelocityThreshold) {
            this.angularVelocity = this.ringPhysicsService.decay(
              this.angularVelocity,
              this.friction * 0.65,
              dt
            );
          }

          const settleVelocity = Math.max(0.04, velocityThreshold * 0.12);
          const settleOffset = Math.max(0.01, this.stepDeg * 0.018);
          if (Math.abs(targetDiff) < settleOffset && Math.abs(this.angularVelocity) < settleVelocity) {
            this.rotationDeg = target;
            this.angularVelocity = 0;
            this.snapPending = false;
            this.snapTarget = null;

            // Trigger haptic feedback on snap (debounced)
            this.triggerHapticFeedback(this.hapticsService.patterns.snap, true);
          }
        } else if (this.snapPending && timeSinceDragEnd >= snapDelay) {
          // keep inertia alive but gently bleed energy so we eventually cross the threshold
          this.angularVelocity = this.ringPhysicsService.decay(
            this.angularVelocity,
            this.friction * 0.12,
            dt
          );
        }
      }
    }

    // Update dynamic radius using layout service
    const config: RingLayoutConfig = {
      totalCards: this.count,
      baseRadius: this.baseRadius,
      cardWidth: this.cardWidth,
      cardHeight: this.cardHeight,
      minGapPx: this.minGapPx,
      orientation: this.orientation,
      autoRadiusSpacing: this.autoRadiusSpacing,
      radiusElasticity: this.radiusElasticity,
      radiusVelInfluence: this.radiusVelInfluence,
      springStiffness: this.springStiffness,
      springDamping: this.springDamping
    };

    this.radiusState = this.ringLayoutService.computeDynamicRadius(
      this.radiusState,
      config,
      this.angularVelocity,
      dt,
      this.reducedMotion
    );

    this.applyRingTransform();
    this.layoutCards(false);

    this.maybeEmitIndex();

    this.rafId = requestAnimationFrame(this.tick);
  };

  private applyRingTransform() {
    this.ringEl.style.transform = `translateZ(0) rotateY(${this.rotationDeg}deg)`;
    this.ringEl.style.setProperty('--rotation', `${-this.rotationDeg}deg`);
  }

  private computeActiveIndex(): number {
    return this.ringLayoutService.computeActiveIndex(this.rotationDeg, this.count);
  }

  private lastEmittedIndex = -1;
  private maybeEmitIndex() {
    const idx = this.computeActiveIndex();
    if (idx !== this.lastEmittedIndex) {
      this.lastEmittedIndex = idx;
      this.activeIndexChange.emit(idx);
      this.interactionBridge?.onActiveIndexChange?.(idx);
      this.updateLiveMessage();

      // Update ARIA live message
      this.updateAriaLiveMessage(idx);
    }
  }

  private emitActiveIndex() {
    this.lastEmittedIndex = -1;
    this.maybeEmitIndex();
  }

  // Accessibility helpers
  liveMessage = '';

  getGroupAttrs() {
    return getGroupAttrs(this.count);
  }

  getItemAttrs(index: number) {
    return getItemAttrs(index, this.count);
  }

  private updateLiveMessage() {
    const activeIndex = this.computeActiveIndex();
    const item = this.items[activeIndex];
    const itemLabel = item?.title ?? undefined;

    this.liveMessage = getLiveMessage({
      activeIndex,
      total: this.count,
      itemLabel,
      isRotating: this.dragging
    });
  }

  onKeyDown(event: KeyboardEvent) {
    // Prevent default for navigation keys
    const navKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (navKeys.includes(event.key)) {
      event.preventDefault();
    }

    const step = this.stepDeg;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        // Rotate to previous item
        this.angularVelocity = step * 3;
        this.desiredRotationDeg = null;
        this.snapPending = true;
        this.lastDragEndTS = performance.now();
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        // Rotate to next item
        this.angularVelocity = -step * 3;
        this.desiredRotationDeg = null;
        this.snapPending = true;
        this.lastDragEndTS = performance.now();
        break;

      case 'Home':
        // Jump to first item
        this.desiredRotationDeg = 0;
        this.angularVelocity = 0;
        this.snapPending = false;
        break;

      case 'End':
        // Jump to last item
        this.desiredRotationDeg = -(this.count - 1) * step;
        this.angularVelocity = 0;
        this.snapPending = false;
        break;

      case 'Enter':
      case ' ':
        // Allow space and enter to trigger selection (emit event)
        const currentIndex = this.computeActiveIndex();
        // This allows parent components to handle selection
        this.activeIndexChange.emit(currentIndex);
        break;
    }
  }
  /**
   * Update ARIA attributes for accessibility
   */
  private updateAriaAttributes(): void {
    this.ariaGroupAttrs = getGroupAttrs(this.count);

    // Apply group attributes to ring element
    this.ringEl.setAttribute('role', this.ariaGroupAttrs.role);
    this.ringEl.setAttribute('aria-label', this.ariaGroupAttrs['aria-label']);
    if (this.ariaGroupAttrs['aria-roledescription']) {
      this.ringEl.setAttribute('aria-roledescription', this.ariaGroupAttrs['aria-roledescription']);
    }
    if (this.ariaGroupAttrs['aria-live']) {
      this.ringEl.setAttribute('aria-live', this.ariaGroupAttrs['aria-live']);
    }
  }

  /**
   * Update ARIA live message for screen readers
   */
  private updateAriaLiveMessage(activeIndex: number): void {
    const itemLabel = this.items[activeIndex]?.title || '';
    this.ariaLiveMessage = getLiveMessage({
      activeIndex,
      total: this.count,
      isRotating: this.dragging,
      itemLabel
    });
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

  private computePointerIntensity(pointerSpeed: number): number {
    if (!Number.isFinite(pointerSpeed)) return 1;
    const normalized = Math.min(1, pointerSpeed / 1800);
    return 1 + normalized * 2.4;
  }

  private applyDragCurve(delta: number, intensity = 1): number {
    const maxDelta = this.stepDeg * (1.2 + intensity * 1.6);
    const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
    const exponent = intensity > 1.4 ? 0.82 : 0.9;
    return Math.sign(clamped) * Math.pow(Math.abs(clamped), exponent);
  }

  /**
   * Track by function for ngFor performance optimization
   * Returns unique identifier for each item to minimize DOM re-renders
   */
  trackByItemId(index: number, item: any): any {
    return item?.id ?? index;
  }

  private triggerHapticFeedback(pattern: VibrationPattern, forceDebounce = true): void {
    // Check if haptics are enabled via feature flag
    if (!this.featureFlagsService.isHapticsEnabled()) {
      return;
    }

    // Respect prefers-reduced-motion preference
    if (this.reducedMotion) {
      return;
    }

    // Apply debouncing
    if (forceDebounce) {
      const now = performance.now();
      if (now - this.lastHapticTS < this.HAPTIC_DEBOUNCE_MS) {
        return; // Too soon, skip this haptic
      }
      this.lastHapticTS = now;
    }

    // Trigger the haptic feedback
    this.hapticsService.vibrate(pattern);
  }
}
