// work-card-ring.component.ts
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

  // Aliases for test compatibility
  get ring() { return this.ringRef; }
  set ring(value: any) { this.ringRef = value; }
  get cards() { return this.cardRefs; }
  set cards(value: any) { this.cardRefs = value; }
  get isDragging() { return this.dragging; }
  set isDragging(value: boolean) { this.dragging = value; }

  // Dados
  @Input() items: Item[] = Array.from({ length: 8 }, (_, i) => ({ title: `Projeto ${i + 1}` }));

  // Aparência
  @Input() ringViewport = 320; // px - tamanho fixo do container .ring (não muda com o raio)
  @Input() baseRadius = 200;   // px - raio mínimo
  @Input() cardWidth = 240;    // px
  @Input() cardHeight = 140;   // px
  @Input() perspective = 1200; // px

  // Interação
  @Input() dragSensitivity = 0.35; // deg/px
  @Input() wheelSpeed = 0.2;       // deg por deltaY
  @Input() friction = 2.8;         // 1/s
  @Input() inertiaEnabled = true;

  // Snap
  @Input() snapEnabled = true;
  @Input() snapVelocityThreshold = 15; // deg/s
  @Input() snapStrength = 45;          // deg/s²

  // Scroll externo
  @Input() interceptWheel = true;
  @Input() scrollProgress: number | undefined; // 0..1
  @Input() scrollRotations = 2;

  // Elástico do raio
  @Input() radiusElasticity = 0.25;   // 0..1
  @Input() radiusVelInfluence = 720;  // deg/s
  @Input() springStiffness = 120;     // 1/s²
  @Input() springDamping = 22;        // 1/s

  // Orientação dos cards
  @Input() orientation: OrientationMode = 'outward';

  // Espaçamento automático entre cards
  @Input() autoRadiusSpacing = true;
  @Input() minGapPx = 24;

  // Eventos
  @Output() activeIndexChange = new EventEmitter<number>();

  // Estado interno
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
  private pointerStartX = 0;
  private pointerStartY = 0;
  private lastMoveTS = 0;
  private pointerCaptured = false;
  private gestureMode: 'idle' | 'pending' | 'rotate' | 'scroll' = 'idle';
  private readonly intentThreshold = 12; // px

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
    this.recomputeBaseRadiusEffective();      // calcula raio de repouso com gap
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

  // Pointer
  onPointerDown = (ev: PointerEvent) => {
    this.pointerId = ev.pointerId;
    this.lastPointerX = ev.clientX;
    this.pointerStartX = ev.clientX;
    this.pointerStartY = ev.clientY;
    this.lastMoveTS = ev.timeStamp || performance.now();
    this.dragging = false;
    this.pointerCaptured = false;
    this.gestureMode = ev.pointerType === 'touch' ? 'pending' : 'rotate';

    if (this.gestureMode === 'rotate') {
      this.beginRotate(ev);
    } else {
      this.dragging = false;
      this.ringEl.style.cursor = 'grab';
      this.ringEl.style.touchAction = 'pan-y';
    }
  };
  onPointerMove = (ev: PointerEvent) => {
    if (ev.pointerId !== this.pointerId) return;

    if (this.gestureMode === 'pending') {
      const dx = ev.clientX - this.pointerStartX;
      const dy = ev.clientY - this.pointerStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDy >= this.intentThreshold && absDy > absDx) {
        this.gestureMode = 'scroll';
        this.pointerId = null;
        this.dragging = false;
        this.pointerCaptured = false;
        this.ringEl.style.cursor = 'grab';
        this.ringEl.style.touchAction = 'pan-y';
        return;
      }

      if (absDx >= this.intentThreshold && absDx > absDy) {
        this.beginRotate(ev);
      } else {
        return;
      }
    }

    if (!this.dragging || this.gestureMode !== 'rotate') return;
    const now = ev.timeStamp || performance.now();
    const dx = ev.clientX - this.lastPointerX;
    const dt = Math.max(1, now - this.lastMoveTS) / 1000;
    this.lastPointerX = ev.clientX;
    this.lastMoveTS = now;

    const deltaDeg = dx * this.dragSensitivity;
    this.rotationDeg += deltaDeg;
    this.angularVelocity = deltaDeg / dt;
  };
  onPointerUp = (ev: PointerEvent) => {
    if (this.pointerId != null && ev.pointerId !== this.pointerId) return;

    if (this.pointerCaptured) {
      try {
        this.ringEl.releasePointerCapture(ev.pointerId);
      } catch {
        // Ignore if capture was already released
      }
    }

    this.dragging = false;
    this.pointerId = null;
    this.pointerCaptured = false;
    this.gestureMode = 'idle';
    this.ringEl.style.cursor = 'grab';
    this.ringEl.style.touchAction = 'pan-y';
  };

  private beginRotate(ev: PointerEvent) {
    this.dragging = true;
    this.gestureMode = 'rotate';
    this.pointerId = ev.pointerId;
    this.lastPointerX = ev.clientX;
    this.lastMoveTS = ev.timeStamp || performance.now();
    try {
      this.ringEl.setPointerCapture(ev.pointerId);
      this.pointerCaptured = true;
    } catch {
      this.pointerCaptured = false;
    }
    this.ringEl.style.cursor = 'grabbing';
    this.ringEl.style.touchAction = 'none';
    this.desiredRotationDeg = null;
  }

  // Wheel
  private wheelHandler = (ev: WheelEvent) => {
    if (this.interceptWheel) ev.preventDefault();
    const delta = ev.deltaY || ev.detail || 0;
    const deltaDeg = delta * this.wheelSpeed;
    this.rotationDeg += deltaDeg;
    this.angularVelocity += deltaDeg * 60; // impulso
    this.desiredRotationDeg = null;
  };

  // DOM
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

  // Raio que garante gap mínimo entre cards (sem mexer no tamanho do .ring)
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
    this.ringEl.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.ringEl.addEventListener('pointerup', this.onPointerUp, { passive: true });
    this.ringEl.addEventListener('pointercancel', this.onPointerUp, { passive: true });
    this.ringEl.addEventListener('pointerleave', this.onPointerUp, { passive: true });
    this.ringEl.addEventListener('wheel', this.wheelHandler, { passive: !this.interceptWheel });
  }
  private detachEvents() {
    this.ringEl.removeEventListener('pointerdown', this.onPointerDown);
    this.ringEl.removeEventListener('pointermove', this.onPointerMove);
    this.ringEl.removeEventListener('pointerup', this.onPointerUp);
    this.ringEl.removeEventListener('pointercancel', this.onPointerUp);
    this.ringEl.removeEventListener('pointerleave', this.onPointerUp);
    this.ringEl.removeEventListener('wheel', this.wheelHandler);
  }

  private setupReducedMotion() {
    if (!window || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = mq.matches;
    mq.addEventListener?.('change', (e) => (this.reducedMotion = e.matches));
  }

  // Física
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

    // Raio elástico baseado no raio de repouso (com espaçamento)
    const velAbs = Math.abs(this.angularVelocity);
    const maxAdd = this.baseRadiusEffective * (this.reducedMotion ? 0 : this.radiusElasticity);
    const radiusTarget = this.baseRadiusEffective + Math.min(1, velAbs / this.radiusVelInfluence) * maxAdd;

    // Mola
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
