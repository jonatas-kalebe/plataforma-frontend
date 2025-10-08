/**
 * Tests for particle physics Web Worker types and structure
 * 
 * Note: Direct worker testing in Karma has limitations due to security restrictions.
 * The worker implementation is verified through:
 * 1. Type checking at compile time
 * 2. Integration tests in the browser
 * 3. Manual testing via the ThreeParticleBackgroundComponent
 * 
 * See TESTING_WORKERS.md for manual testing instructions.
 */

import {
  ParticleWorkerMessageType,
  InitMessage,
  StepMessage,
  UpdateConfigMessage,
  InitCompleteMessage,
  StepCompleteMessage,
  ConfigUpdatedMessage,
  ParticlePhysicsConfig,
  ParticleWorkerInputMessage,
  ParticleWorkerOutputMessage,
  ShockwaveData,
} from './three-particles.worker.types';

describe('ThreeParticlesWorker Types', () => {
  describe('Message Types', () => {
    it('should define all required message types', () => {
      expect(ParticleWorkerMessageType.INIT).toBe('INIT');
      expect(ParticleWorkerMessageType.STEP).toBe('STEP');
      expect(ParticleWorkerMessageType.UPDATE_CONFIG).toBe('UPDATE_CONFIG');
      expect(ParticleWorkerMessageType.INIT_COMPLETE).toBe('INIT_COMPLETE');
      expect(ParticleWorkerMessageType.STEP_COMPLETE).toBe('STEP_COMPLETE');
      expect(ParticleWorkerMessageType.CONFIG_UPDATED).toBe('CONFIG_UPDATED');
    });
  });

  describe('ParticlePhysicsConfig', () => {
    it('should create valid physics config', () => {
      const config: ParticlePhysicsConfig = {
        friction: 0.96,
        returnSpeed: 0.0005,
        maxForce: 0.6,
        maxRadius: 15,
        maxSensibleVelocity: 0.04,
      };

      expect(config.friction).toBe(0.96);
      expect(config.returnSpeed).toBe(0.0005);
      expect(config.maxForce).toBe(0.6);
      expect(config.maxRadius).toBe(15);
      expect(config.maxSensibleVelocity).toBe(0.04);
    });
  });

  describe('ShockwaveData', () => {
    it('should create valid shockwave data', () => {
      const shockwave: ShockwaveData = {
        posX: 0.5,
        posY: -0.3,
        startTime: 1000,
        maxStrength: 1.0,
      };

      expect(shockwave.posX).toBe(0.5);
      expect(shockwave.posY).toBe(-0.3);
      expect(shockwave.startTime).toBe(1000);
      expect(shockwave.maxStrength).toBe(1.0);
    });
  });

  describe('InitMessage', () => {
    it('should create valid init message with typed arrays', () => {
      const particleCount = 10;
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);
      const originalPositions = new Float32Array(particleCount * 3);

      for (let i = 0; i < positions.length; i++) {
        positions[i] = Math.random() * 100;
        originalPositions[i] = positions[i];
        velocities[i] = 0;
      }

      const config: ParticlePhysicsConfig = {
        friction: 0.96,
        returnSpeed: 0.0005,
        maxForce: 0.6,
        maxRadius: 15,
        maxSensibleVelocity: 0.04,
      };

      const message: InitMessage = {
        type: ParticleWorkerMessageType.INIT,
        positions,
        velocities,
        originalPositions,
        config,
      };

      expect(message.type).toBe(ParticleWorkerMessageType.INIT);
      expect(message.positions).toBeInstanceOf(Float32Array);
      expect(message.velocities).toBeInstanceOf(Float32Array);
      expect(message.originalPositions).toBeInstanceOf(Float32Array);
      expect(message.positions.length).toBe(particleCount * 3);
      expect(message.config.friction).toBe(0.96);
    });
  });

  describe('StepMessage', () => {
    it('should create valid step message', () => {
      const projectionMatrix = new Float32Array(16);
      const viewMatrix = new Float32Array(16);
      
      // Identity matrices
      projectionMatrix[0] = projectionMatrix[5] = projectionMatrix[10] = projectionMatrix[15] = 1;
      viewMatrix[0] = viewMatrix[5] = viewMatrix[10] = viewMatrix[15] = 1;

      const shockwaves: ShockwaveData[] = [
        { posX: 0, posY: 0, startTime: 100, maxStrength: 1.0 }
      ];

      const message: StepMessage = {
        type: ParticleWorkerMessageType.STEP,
        dt: 0.016,
        timeNow: performance.now(),
        smoothedMouseX: 0.5,
        smoothedMouseY: -0.3,
        mouseVelocity: 0.02,
        shockwaves,
        projectionMatrix,
        viewMatrix,
      };

      expect(message.type).toBe(ParticleWorkerMessageType.STEP);
      expect(message.dt).toBe(0.016);
      expect(message.smoothedMouseX).toBe(0.5);
      expect(message.shockwaves.length).toBe(1);
      expect(message.projectionMatrix).toBeInstanceOf(Float32Array);
      expect(message.viewMatrix).toBeInstanceOf(Float32Array);
    });
  });

  describe('UpdateConfigMessage', () => {
    it('should create valid update config message', () => {
      const message: UpdateConfigMessage = {
        type: ParticleWorkerMessageType.UPDATE_CONFIG,
        config: {
          friction: 0.98,
          maxForce: 0.8,
        },
      };

      expect(message.type).toBe(ParticleWorkerMessageType.UPDATE_CONFIG);
      expect(message.config.friction).toBe(0.98);
      expect(message.config.maxForce).toBe(0.8);
    });

    it('should support partial config updates', () => {
      const message: UpdateConfigMessage = {
        type: ParticleWorkerMessageType.UPDATE_CONFIG,
        config: {
          friction: 0.95,
        },
      };

      expect(message.config.friction).toBe(0.95);
      expect(message.config.returnSpeed).toBeUndefined();
    });
  });

  describe('Response Messages', () => {
    it('should create valid init complete message', () => {
      const message: InitCompleteMessage = {
        type: ParticleWorkerMessageType.INIT_COMPLETE,
        particleCount: 100,
      };

      expect(message.type).toBe(ParticleWorkerMessageType.INIT_COMPLETE);
      expect(message.particleCount).toBe(100);
    });

    it('should create valid step complete message', () => {
      const positions = new Float32Array(30);
      const velocities = new Float32Array(30);

      const message: StepCompleteMessage = {
        type: ParticleWorkerMessageType.STEP_COMPLETE,
        positions,
        velocities,
      };

      expect(message.type).toBe(ParticleWorkerMessageType.STEP_COMPLETE);
      expect(message.positions).toBeInstanceOf(Float32Array);
      expect(message.velocities).toBeInstanceOf(Float32Array);
    });

    it('should create valid config updated message', () => {
      const config: ParticlePhysicsConfig = {
        friction: 0.96,
        returnSpeed: 0.0005,
        maxForce: 0.6,
        maxRadius: 15,
        maxSensibleVelocity: 0.04,
      };

      const message: ConfigUpdatedMessage = {
        type: ParticleWorkerMessageType.CONFIG_UPDATED,
        config,
      };

      expect(message.type).toBe(ParticleWorkerMessageType.CONFIG_UPDATED);
      expect(message.config).toEqual(config);
    });
  });

  describe('Union Types', () => {
    it('should accept all input message types', () => {
      const positions = new Float32Array(30);
      const velocities = new Float32Array(30);
      const originalPositions = new Float32Array(30);
      const config: ParticlePhysicsConfig = {
        friction: 0.96,
        returnSpeed: 0.0005,
        maxForce: 0.6,
        maxRadius: 15,
        maxSensibleVelocity: 0.04,
      };

      const initMsg: ParticleWorkerInputMessage = {
        type: ParticleWorkerMessageType.INIT,
        positions,
        velocities,
        originalPositions,
        config,
      };

      const stepMsg: ParticleWorkerInputMessage = {
        type: ParticleWorkerMessageType.STEP,
        dt: 0.016,
        timeNow: 1000,
        smoothedMouseX: 0,
        smoothedMouseY: 0,
        mouseVelocity: 0,
        shockwaves: [],
        projectionMatrix: new Float32Array(16),
        viewMatrix: new Float32Array(16),
      };

      const updateMsg: ParticleWorkerInputMessage = {
        type: ParticleWorkerMessageType.UPDATE_CONFIG,
        config: { friction: 0.95 },
      };

      expect(initMsg.type).toBe(ParticleWorkerMessageType.INIT);
      expect(stepMsg.type).toBe(ParticleWorkerMessageType.STEP);
      expect(updateMsg.type).toBe(ParticleWorkerMessageType.UPDATE_CONFIG);
    });

    it('should accept all output message types', () => {
      const positions = new Float32Array(30);
      const velocities = new Float32Array(30);
      const config: ParticlePhysicsConfig = {
        friction: 0.96,
        returnSpeed: 0.0005,
        maxForce: 0.6,
        maxRadius: 15,
        maxSensibleVelocity: 0.04,
      };

      const initCompleteMsg: ParticleWorkerOutputMessage = {
        type: ParticleWorkerMessageType.INIT_COMPLETE,
        particleCount: 100,
      };

      const stepCompleteMsg: ParticleWorkerOutputMessage = {
        type: ParticleWorkerMessageType.STEP_COMPLETE,
        positions,
        velocities,
      };

      const configUpdatedMsg: ParticleWorkerOutputMessage = {
        type: ParticleWorkerMessageType.CONFIG_UPDATED,
        config,
      };

      expect(initCompleteMsg.type).toBe(ParticleWorkerMessageType.INIT_COMPLETE);
      expect(stepCompleteMsg.type).toBe(ParticleWorkerMessageType.STEP_COMPLETE);
      expect(configUpdatedMsg.type).toBe(ParticleWorkerMessageType.CONFIG_UPDATED);
    });
  });

  describe('Typed Arrays Performance', () => {
    it('should use Float32Array for efficient memory transfer', () => {
      const particleCount = 1000;
      const positions = new Float32Array(particleCount * 3);
      
      // Verify typed array characteristics
      expect(positions).toBeInstanceOf(Float32Array);
      expect(positions.BYTES_PER_ELEMENT).toBe(4);
      expect(positions.buffer).toBeInstanceOf(ArrayBuffer);
      expect(positions.byteLength).toBe(particleCount * 3 * 4);
    });

    it('should support transferable objects for zero-copy messaging', () => {
      const positions = new Float32Array(30);
      const buffer = positions.buffer;
      
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBe(30 * 4);
    });
  });

  describe('No Three.js Dependencies', () => {
    it('should define shockwave without Three.Vector2', () => {
      const shockwave: ShockwaveData = {
        posX: 0.5,
        posY: -0.3,
        startTime: 1000,
        maxStrength: 1.0,
      };

      // Verify it's a plain object, not a Three.js Vector2
      expect(typeof shockwave.posX).toBe('number');
      expect(typeof shockwave.posY).toBe('number');
      expect((shockwave as any).x).toBeUndefined();
      expect((shockwave as any).y).toBeUndefined();
    });

    it('should use plain numbers for coordinates', () => {
      const message: StepMessage = {
        type: ParticleWorkerMessageType.STEP,
        dt: 0.016,
        timeNow: 1000,
        smoothedMouseX: 0.5,
        smoothedMouseY: -0.3,
        mouseVelocity: 0.02,
        shockwaves: [],
        projectionMatrix: new Float32Array(16),
        viewMatrix: new Float32Array(16),
      };

      expect(typeof message.smoothedMouseX).toBe('number');
      expect(typeof message.smoothedMouseY).toBe('number');
    });
  });
});
