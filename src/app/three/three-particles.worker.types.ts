/**
 * Message types for particle physics Web Worker
 * These define the contract between the main thread and worker thread
 */

/**
 * Message types that can be sent to/from the worker
 */
export enum ParticleWorkerMessageType {
  /** Initialize worker with particle data */
  INIT = 'INIT',
  /** Step physics simulation forward */
  STEP = 'STEP',
  /** Update physics configuration */
  UPDATE_CONFIG = 'UPDATE_CONFIG',
  /** Response: Worker initialized successfully */
  INIT_COMPLETE = 'INIT_COMPLETE',
  /** Response: Physics step complete with updated positions */
  STEP_COMPLETE = 'STEP_COMPLETE',
  /** Response: Configuration updated */
  CONFIG_UPDATED = 'CONFIG_UPDATED',
}

/**
 * Physics configuration for particles
 */
export interface ParticlePhysicsConfig {
  /** Friction coefficient (0-1, higher = more friction) */
  friction: number;
  /** Speed at which particles return to original positions */
  returnSpeed: number;
  /** Maximum force from mouse interaction */
  maxForce: number;
  /** Maximum interaction radius */
  maxRadius: number;
  /** Maximum sensible mouse velocity */
  maxSensibleVelocity: number;
}

/**
 * Shockwave data structure (no Three.js dependencies)
 */
export interface ShockwaveData {
  /** X position in normalized screen space (-1 to 1) */
  posX: number;
  /** Y position in normalized screen space (-1 to 1) */
  posY: number;
  /** Timestamp when shockwave started */
  startTime: number;
  /** Maximum strength of shockwave */
  maxStrength: number;
}

/**
 * Message sent to initialize the worker
 */
export interface InitMessage {
  type: ParticleWorkerMessageType.INIT;
  /** Initial particle positions (x,y,z interleaved) */
  positions: Float32Array;
  /** Initial particle velocities (x,y,z interleaved) */
  velocities: Float32Array;
  /** Original/rest positions for particles */
  originalPositions: Float32Array;
  /** Physics configuration */
  config: ParticlePhysicsConfig;
}

/**
 * Message sent to step physics simulation
 */
export interface StepMessage {
  type: ParticleWorkerMessageType.STEP;
  /** Delta time in seconds */
  dt: number;
  /** Current timestamp */
  timeNow: number;
  /** Smoothed mouse X position (normalized -1 to 1) */
  smoothedMouseX: number;
  /** Smoothed mouse Y position (normalized -1 to 1) */
  smoothedMouseY: number;
  /** Current mouse velocity */
  mouseVelocity: number;
  /** Active shockwaves */
  shockwaves: ShockwaveData[];
  /** Camera projection matrix (16 elements) for particle projection */
  projectionMatrix: Float32Array;
  /** Camera view matrix (16 elements) */
  viewMatrix: Float32Array;
}

/**
 * Message sent to update configuration
 */
export interface UpdateConfigMessage {
  type: ParticleWorkerMessageType.UPDATE_CONFIG;
  /** New physics configuration (partial update supported) */
  config: Partial<ParticlePhysicsConfig>;
}

/**
 * Response: Worker initialized
 */
export interface InitCompleteMessage {
  type: ParticleWorkerMessageType.INIT_COMPLETE;
  /** Number of particles initialized */
  particleCount: number;
}

/**
 * Response: Physics step complete
 */
export interface StepCompleteMessage {
  type: ParticleWorkerMessageType.STEP_COMPLETE;
  /** Updated particle positions (x,y,z interleaved) */
  positions: Float32Array;
  /** Updated particle velocities (x,y,z interleaved) */
  velocities: Float32Array;
}

/**
 * Response: Configuration updated
 */
export interface ConfigUpdatedMessage {
  type: ParticleWorkerMessageType.CONFIG_UPDATED;
  /** Current configuration after update */
  config: ParticlePhysicsConfig;
}

/**
 * Union type for all messages sent TO the worker
 */
export type ParticleWorkerInputMessage = InitMessage | StepMessage | UpdateConfigMessage;

/**
 * Union type for all messages sent FROM the worker
 */
export type ParticleWorkerOutputMessage = InitCompleteMessage | StepCompleteMessage | ConfigUpdatedMessage;
