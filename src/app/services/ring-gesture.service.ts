import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * FSM States for gesture recognition
 */
export type GestureState = 'idle' | 'pending' | 'rotate';

/**
 * Synthetic pointer event normalized from PointerEvent/TouchEvent
 */
export interface SyntheticPointerEvent {
  pointerId: number;
  clientX: number;
  clientY: number;
  timeStamp: number;
  isPrimary: boolean;
  button?: number;
}

/**
 * Gesture output data emitted by the service
 */
export interface GestureData {
  state: GestureState;
  delta: number;           // dx since last event
  velocity: number;        // dx/dt (pixels per second)
  smoothedVelocity: number; // windowed average velocity
  pointerId: number | null;
  position: { x: number; y: number };
}

/**
 * Configuration options for the gesture service
 */
export interface GestureConfig {
  gestureThreshold: number;      // pixels to move before gesture detection
  horizontalBias: number;        // bias factor for horizontal vs vertical
  velocityWindowSize: number;    // number of samples for velocity smoothing
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: GestureConfig = {
  gestureThreshold: 8,
  horizontalBias: 1.2,
  velocityWindowSize: 6,
};

/**
 * RingGestureService - Pure gesture recognition service
 * 
 * Features:
 * - FSM-based gesture state management (idle → pending → rotate)
 * - Pointer event normalization
 * - Delta (dx) and velocity (dx/dt) calculation
 * - Velocity smoothing with configurable window
 * - Observable-based API for reactive consumption
 * - No DOM dependencies for testability
 * - Accessibility-ready (can be extended with keyboard support)
 * 
 * Usage:
 * ```typescript
 * const service = inject(RingGestureService);
 * service.configure({ gestureThreshold: 10 });
 * 
 * service.gestureData$.subscribe(data => {
 *   console.log(data.state, data.velocity);
 * });
 * 
 * service.onPointerDown(syntheticEvent);
 * service.onPointerMove(syntheticEvent);
 * service.onPointerUp(syntheticEvent);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class RingGestureService {
  private config: GestureConfig;
  
  // FSM state
  private state: GestureState = 'idle';
  
  // Pointer tracking
  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private lastTimestamp = 0;
  
  // Velocity tracking
  private velocitySamples: number[] = [];
  private lastVelocity = 0;
  
  // Observable state
  private gestureDataSubject = new BehaviorSubject<GestureData>(this.createInitialData());
  
  /**
   * Observable stream of gesture data
   */
  public readonly gestureData$: Observable<GestureData> = this.gestureDataSubject.asObservable();
  
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }
  
  /**
   * Update configuration at runtime
   */
  public configure(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  public getConfig(): Readonly<GestureConfig> {
    return { ...this.config };
  }
  
  /**
   * Get current gesture state
   */
  public getState(): GestureState {
    return this.state;
  }
  
  /**
   * Handle pointer down event
   */
  public onPointerDown(event: SyntheticPointerEvent): void {
    // Ignore if already tracking a pointer
    if (this.pointerId !== null) {
      return;
    }
    
    // Ignore non-primary pointers and non-left buttons
    if (event.isPrimary === false) {
      return;
    }
    
    if (event.button !== undefined && event.button !== 0) {
      return;
    }
    
    // Initialize tracking
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.lastTimestamp = event.timeStamp;
    
    // Transition to pending state
    this.state = 'pending';
    this.resetVelocitySamples();
    this.lastVelocity = 0;
    
    this.emitGestureData(0, 0);
  }
  
  /**
   * Handle pointer move event
   */
  public onPointerMove(event: SyntheticPointerEvent): void {
    // Ignore if not tracking this pointer
    if (this.pointerId === null || event.pointerId !== this.pointerId) {
      return;
    }
    
    const now = event.timeStamp;
    const dt = Math.max(1, now - this.lastTimestamp) / 1000; // Convert to seconds
    
    // In pending state, check if threshold exceeded
    if (this.state === 'pending') {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;
      
      if (Math.abs(dx) > this.config.gestureThreshold || 
          Math.abs(dy) > this.config.gestureThreshold) {
        
        // Check if horizontal gesture (with bias)
        if (Math.abs(dx) * this.config.horizontalBias > Math.abs(dy)) {
          this.state = 'rotate';
        } else {
          // Vertical gesture - reject and reset
          this.reset();
          return;
        }
      } else {
        // Still below threshold
        return;
      }
    }
    
    // Must be in rotate state at this point
    if (this.state !== 'rotate') {
      return;
    }
    
    // Calculate delta and velocity
    const delta = event.clientX - this.lastX;
    const safeDt = Math.max(1 / 240, dt); // Clamp minimum dt
    const instantaneousVelocity = delta / safeDt;
    
    // Record velocity sample
    this.recordVelocitySample(instantaneousVelocity);
    const smoothedVelocity = this.getSmoothedVelocity();
    
    // Update tracking
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.lastTimestamp = now;
    this.lastVelocity = instantaneousVelocity;
    
    this.emitGestureData(delta, instantaneousVelocity, smoothedVelocity);
  }
  
  /**
   * Handle pointer up event
   */
  public onPointerUp(event: SyntheticPointerEvent): void {
    // Ignore if not tracking this pointer
    if (event.pointerId !== this.pointerId) {
      return;
    }
    
    const wasRotating = this.state === 'rotate';
    const finalVelocity = this.getSmoothedVelocity();
    
    this.reset();
    
    // Emit final state with release velocity
    if (wasRotating) {
      this.emitGestureData(0, finalVelocity, finalVelocity);
    }
  }
  
  /**
   * Handle pointer cancel event (treat as pointer up)
   */
  public onPointerCancel(event: SyntheticPointerEvent): void {
    this.onPointerUp(event);
  }
  
  /**
   * Reset gesture state (useful for external cancellation)
   */
  public reset(): void {
    this.state = 'idle';
    this.pointerId = null;
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.lastTimestamp = 0;
    this.resetVelocitySamples();
    this.lastVelocity = 0;
    
    this.emitGestureData(0, 0);
  }
  
  /**
   * Keyboard support hook - emit a synthetic rotation delta
   * This allows keyboard navigation integration
   */
  public emitKeyboardDelta(delta: number): void {
    if (this.state !== 'idle') {
      return; // Don't interfere with active gesture
    }
    
    // Create a synthetic velocity for smooth keyboard interaction
    const syntheticVelocity = delta * 60; // Assume 60 FPS for velocity
    
    this.state = 'rotate';
    this.emitGestureData(delta, syntheticVelocity, syntheticVelocity);
    
    // Return to idle immediately
    setTimeout(() => {
      if (this.state === 'rotate' && this.pointerId === null) {
        this.reset();
      }
    }, 0);
  }
  
  /**
   * Private: Reset velocity samples
   */
  private resetVelocitySamples(): void {
    this.velocitySamples = [];
  }
  
  /**
   * Private: Record a velocity sample
   */
  private recordVelocitySample(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }
    
    this.velocitySamples.push(value);
    
    if (this.velocitySamples.length > this.config.velocityWindowSize) {
      this.velocitySamples.shift();
    }
  }
  
  /**
   * Private: Get smoothed velocity (average of window)
   */
  private getSmoothedVelocity(): number {
    if (this.velocitySamples.length === 0) {
      return 0;
    }
    
    const sum = this.velocitySamples.reduce((acc, v) => acc + v, 0);
    return sum / this.velocitySamples.length;
  }
  
  /**
   * Private: Create initial gesture data
   */
  private createInitialData(): GestureData {
    return {
      state: 'idle',
      delta: 0,
      velocity: 0,
      smoothedVelocity: 0,
      pointerId: null,
      position: { x: 0, y: 0 },
    };
  }
  
  /**
   * Private: Emit gesture data to subscribers
   */
  private emitGestureData(
    delta: number,
    velocity: number,
    smoothedVelocity?: number
  ): void {
    const data: GestureData = {
      state: this.state,
      delta,
      velocity,
      smoothedVelocity: smoothedVelocity ?? velocity,
      pointerId: this.pointerId,
      position: {
        x: this.lastX,
        y: this.lastY,
      },
    };
    
    this.gestureDataSubject.next(data);
  }
}
