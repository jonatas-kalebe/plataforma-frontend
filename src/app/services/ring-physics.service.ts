import { Injectable } from '@angular/core';

/**
 * Parameters for calculating release velocity after drag
 */
export interface ReleaseVelocityParams {
  /** Raw velocity at the moment of release */
  releaseVelocity: number;
  /** Number of frames where drag was slow */
  slowDragFrames: number;
  /** Peak velocity during the drag */
  peakDragVelocity: number;
  /** Last recorded velocity during drag */
  lastDragVelocity: number;
  /** Current rotation angle */
  currentRotation: number;
  /** Angle step (spacing between items) */
  stepDeg: number;
  /** Peak acceleration during drag */
  peakDragAcceleration: number;
  /** Accumulated drag energy */
  dragEnergy: number;
}

/**
 * RingPhysicsService
 * 
 * Pure physics functions for ring carousel behavior including:
 * - Inertia decay with friction
 * - Angle snapping calculations
 * - Shortest angle difference computation
 * - Release velocity calculation with drag heuristics
 * 
 * All functions are pure with no side effects, DOM access, or global state.
 */
@Injectable({
  providedIn: 'root'
})
export class RingPhysicsService {

  /**
   * Apply exponential decay to velocity based on friction
   * 
   * @param v - Current velocity (degrees/second)
   * @param friction - Friction coefficient (higher = more friction)
   * @param dt - Delta time in seconds
   * @returns Decayed velocity
   * 
   * @example
   * const newVel = decay(100, 2.8, 0.016); // Apply friction for 1 frame at 60fps
   */
  decay(v: number, friction: number, dt: number): number {
    if (!Number.isFinite(v) || !Number.isFinite(friction) || !Number.isFinite(dt)) {
      return 0;
    }
    
    // Exponential decay: v' = v * e^(-friction * dt)
    const decayFactor = Math.exp(-friction * dt);
    return v * decayFactor;
  }

  /**
   * Find the nearest snap angle given current angle and step size
   * 
   * @param curr - Current angle in degrees
   * @param step - Step size in degrees (angle between items)
   * @returns Nearest snap angle in degrees
   * 
   * @example
   * const snapAngle = nearestSnapAngle(47, 45); // Returns 45
   * const snapAngle2 = nearestSnapAngle(-23, 45); // Returns 0
   */
  nearestSnapAngle(curr: number, step: number): number {
    if (!Number.isFinite(curr) || !Number.isFinite(step) || step === 0) {
      return 0;
    }
    
    // Normalize angle to [0, 360) range
    const normalized = this.normalizeDeg(-curr);
    
    // Find nearest multiple of step
    const idx = Math.round(normalized / step);
    
    // Return in original sign convention
    return -idx * step;
  }

  /**
   * Calculate the shortest angular difference between two angles
   * Handles angle wrapping correctly
   * 
   * @param a - First angle in degrees
   * @param b - Second angle in degrees
   * @returns Shortest difference from a to b, in range [-180, 180]
   * 
   * @example
   * shortestAngleDiff(10, 350); // Returns -20 (not 340)
   * shortestAngleDiff(350, 10); // Returns 20 (not -340)
   */
  shortestAngleDiff(a: number, b: number): number {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return 0;
    }
    
    // Calculate difference with wrapping
    let diff = (b - a) % 360;
    
    // Normalize to [-180, 180]
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    
    return diff;
  }

  /**
   * Calculate release velocity after drag with advanced heuristics
   * Incorporates drag energy, acceleration, and velocity history
   * 
   * @param params - Release velocity calculation parameters
   * @returns Final velocity to apply after release
   * 
   * @example
   * const velocity = releaseVelocity({
   *   releaseVelocity: 50,
   *   slowDragFrames: 5,
   *   peakDragVelocity: 120,
   *   lastDragVelocity: 45,
   *   currentRotation: 47,
   *   stepDeg: 45,
   *   peakDragAcceleration: 200,
   *   dragEnergy: 1500
   * });
   */
  releaseVelocity(params: ReleaseVelocityParams): number {
    const {
      releaseVelocity,
      slowDragFrames,
      peakDragVelocity,
      lastDragVelocity,
      currentRotation,
      stepDeg,
      peakDragAcceleration,
      dragEnergy
    } = params;
    
    // Validate all inputs
    if (!this.isValidNumber(releaseVelocity) || 
        !this.isValidNumber(peakDragVelocity) ||
        !this.isValidNumber(stepDeg) || stepDeg === 0) {
      return 0;
    }
    
    // Check for slow drag condition - user wants to snap
    const slowDrag = slowDragFrames > 12 && peakDragVelocity < stepDeg * 3.5;
    if (slowDrag && Math.abs(releaseVelocity) < stepDeg * 2.1) {
      return 0; // Signal snap pending
    }
    
    // Determine direction from multiple sources
    const nearestSnap = this.nearestSnapAngle(currentRotation, stepDeg);
    const directionSource = releaseVelocity || 
                           lastDragVelocity || 
                           (currentRotation - nearestSnap);
    const direction = Math.sign(directionSource) || 1;
    
    // Calculate base speed from release and peak velocities
    const baseSpeed = Math.max(Math.abs(releaseVelocity), peakDragVelocity * 0.85);
    
    // Add boost from acceleration
    const accelBoost = peakDragAcceleration * 0.08;
    
    // Calculate energy factor (capped at 1.75)
    const energyFactor = Math.min(1.75, dragEnergy / (stepDeg * 28));
    
    // Apply energy boost
    let boosted = baseSpeed * (1 + energyFactor * 0.85) + accelBoost;
    
    // Ensure minimum carry velocity for engaged drags
    const minCarry = stepDeg * 2.5;
    if (boosted < minCarry && energyFactor > 0.2) {
      boosted = minCarry + (boosted - minCarry) * 0.5;
    }
    
    // Cap maximum velocity
    const maxReleaseVelocity = 840;
    const finalVelocity = Math.min(
      Math.max(boosted, slowDrag ? 0 : minCarry),
      maxReleaseVelocity
    );
    
    return direction * finalVelocity;
  }

  /**
   * Normalize angle to [0, 360) range
   * 
   * @param deg - Angle in degrees
   * @returns Normalized angle
   */
  private normalizeDeg(deg: number): number {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
  }

  /**
   * Check if a number is valid (finite and not NaN)
   * 
   * @param value - Value to check
   * @returns True if valid number
   */
  private isValidNumber(value: number): boolean {
    return Number.isFinite(value) && !Number.isNaN(value);
  }
}
