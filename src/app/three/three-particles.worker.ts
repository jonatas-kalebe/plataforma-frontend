/**
 * Web Worker for particle physics calculations
 * 
 * This worker handles the physics simulation for particles,
 * offloading heavy calculations from the main UI thread.
 * 
 * Key features:
 * - No Three.js dependencies (pure calculations)
 * - Uses typed arrays for performance
 * - Handles mouse interactions and shockwaves
 * - Supports dynamic configuration updates
 */

import {
  ParticleWorkerMessageType,
  ParticlePhysicsConfig,
  ParticleWorkerInputMessage,
  InitMessage,
  StepMessage,
  UpdateConfigMessage,
  InitCompleteMessage,
  StepCompleteMessage,
  ConfigUpdatedMessage,
} from './three-particles.worker.types';

/**
 * Worker state
 */
let positions: Float32Array | null = null;
let velocities: Float32Array | null = null;
let originalPositions: Float32Array | null = null;
let particleCount = 0;

/**
 * Default physics configuration
 */
let config: ParticlePhysicsConfig = {
  friction: 0.96,
  returnSpeed: 0.0005,
  maxForce: 0.6,
  maxRadius: 15,
  maxSensibleVelocity: 0.04,
};

/**
 * Temporary vector for calculations (avoid allocations)
 */
const tempVec3 = { x: 0, y: 0, z: 0 };

/**
 * Project a 3D point to 2D screen space using camera matrices
 */
function projectPoint(
  x: number,
  y: number,
  z: number,
  viewMatrix: Float32Array,
  projectionMatrix: Float32Array,
  out: { x: number; y: number; z: number }
): void {
  // Apply view matrix (world to camera space)
  const vx = viewMatrix[0] * x + viewMatrix[4] * y + viewMatrix[8] * z + viewMatrix[12];
  const vy = viewMatrix[1] * x + viewMatrix[5] * y + viewMatrix[9] * z + viewMatrix[13];
  const vz = viewMatrix[2] * x + viewMatrix[6] * y + viewMatrix[10] * z + viewMatrix[14];
  const vw = viewMatrix[3] * x + viewMatrix[7] * y + viewMatrix[11] * z + viewMatrix[15];

  // Apply projection matrix (camera to clip space)
  const px = projectionMatrix[0] * vx + projectionMatrix[4] * vy + projectionMatrix[8] * vz + projectionMatrix[12] * vw;
  const py = projectionMatrix[1] * vx + projectionMatrix[5] * vy + projectionMatrix[9] * vz + projectionMatrix[13] * vw;
  const pz = projectionMatrix[2] * vx + projectionMatrix[6] * vy + projectionMatrix[10] * vz + projectionMatrix[14] * vw;
  const pw = projectionMatrix[3] * vx + projectionMatrix[7] * vy + projectionMatrix[11] * vz + projectionMatrix[15] * vw;

  // Perspective divide (clip to NDC)
  if (pw !== 0) {
    out.x = px / pw;
    out.y = py / pw;
    out.z = pz / pw;
  } else {
    out.x = px;
    out.y = py;
    out.z = pz;
  }
}

/**
 * Handle INIT message
 */
function handleInit(message: InitMessage): void {
  positions = message.positions;
  velocities = message.velocities;
  originalPositions = message.originalPositions;
  particleCount = positions.length / 3;
  config = { ...config, ...message.config };

  const response: InitCompleteMessage = {
    type: ParticleWorkerMessageType.INIT_COMPLETE,
    particleCount,
  };

  self.postMessage(response);
}

/**
 * Handle STEP message - perform physics simulation
 */
function handleStep(message: StepMessage): void {
  if (!positions || !velocities || !originalPositions) {
    console.error('Worker not initialized');
    return;
  }

  const {
    dt,
    timeNow,
    smoothedMouseX,
    smoothedMouseY,
    mouseVelocity,
    shockwaves,
    projectionMatrix,
    viewMatrix,
  } = message;

  // Calculate dynamic interaction parameters
  const normalizedVelocity = Math.min(mouseVelocity / config.maxSensibleVelocity, 1.0);
  const easedVelocity = 1 - Math.pow(1 - normalizedVelocity, 3);
  const dynamicInteractionRadius = easedVelocity * config.maxRadius;
  const dynamicForceFactor = easedVelocity * config.maxForce;

  // Process each particle
  for (let i = 0; i < positions.length; i += 3) {
    // Project particle to screen space
    projectPoint(
      positions[i],
      positions[i + 1],
      positions[i + 2],
      viewMatrix,
      projectionMatrix,
      tempVec3
    );

    // Skip particles behind camera
    if (tempVec3.z > 1) continue;

    let totalForceX = 0;
    let totalForceY = 0;

    // Mouse interaction force
    const distToMouse = Math.hypot(tempVec3.x - smoothedMouseX, tempVec3.y - smoothedMouseY);
    if (dynamicInteractionRadius > 0.01 && distToMouse < dynamicInteractionRadius) {
      const falloff = Math.pow(1 - distToMouse / dynamicInteractionRadius, 2);
      const force = falloff * dynamicForceFactor;
      const normDist = distToMouse || 1;
      totalForceX += (tempVec3.x - smoothedMouseX) / normDist * force;
      totalForceY += (tempVec3.y - smoothedMouseY) / normDist * force;
    }

    // Shockwave forces
    for (const sw of shockwaves) {
      const age = (timeNow - sw.startTime) / 500;
      if (age >= 1) continue; // Shockwave expired

      const swRadius = age * 0.4;
      const swStrength = sw.maxStrength * (1 - age);
      const distToSw = Math.hypot(tempVec3.x - sw.posX, tempVec3.y - sw.posY);

      if (swStrength > 0 && distToSw < swRadius && distToSw > swRadius - 0.15) {
        const normDist = distToSw || 1;
        totalForceX += (tempVec3.x - sw.posX) / normDist * swStrength;
        totalForceY += (tempVec3.y - sw.posY) / normDist * swStrength;
      }
    }

    // Apply forces to velocity
    velocities[i] += totalForceX * 0.05;
    velocities[i + 1] += totalForceY * 0.05;

    // Restore force (pull back to original position)
    velocities[i] += (originalPositions[i] - positions[i]) * config.returnSpeed;
    velocities[i + 1] += (originalPositions[i + 1] - positions[i + 1]) * config.returnSpeed;
    velocities[i + 2] += (originalPositions[i + 2] - positions[i + 2]) * config.returnSpeed;

    // Apply friction
    velocities[i] *= config.friction;
    velocities[i + 1] *= config.friction;
    velocities[i + 2] *= config.friction;

    // Update positions
    positions[i] += velocities[i];
    positions[i + 1] += velocities[i + 1];
    positions[i + 2] += velocities[i + 2];
  }

  // Send updated positions back to main thread
  const response: StepCompleteMessage = {
    type: ParticleWorkerMessageType.STEP_COMPLETE,
    positions,
    velocities,
  };

  // Don't transfer - worker needs to keep the arrays for next frame
  self.postMessage(response);
}

/**
 * Handle UPDATE_CONFIG message
 */
function handleUpdateConfig(message: UpdateConfigMessage): void {
  config = { ...config, ...message.config };

  const response: ConfigUpdatedMessage = {
    type: ParticleWorkerMessageType.CONFIG_UPDATED,
    config,
  };

  self.postMessage(response);
}

/**
 * Main message handler
 */
self.addEventListener('message', (event: MessageEvent<ParticleWorkerInputMessage>) => {
  const message = event.data;

  switch (message.type) {
    case ParticleWorkerMessageType.INIT:
      handleInit(message);
      break;

    case ParticleWorkerMessageType.STEP:
      handleStep(message);
      break;

    case ParticleWorkerMessageType.UPDATE_CONFIG:
      handleUpdateConfig(message);
      break;

    default:
      console.error('Unknown message type:', (message as any).type);
  }
});

// Export empty object to make this a module
export {};
