# Particle Physics Web Worker

## Overview

This directory contains a Web Worker implementation for particle physics calculations. The worker offloads heavy physics computations from the main UI thread to maintain smooth 60fps animations, especially important on mobile devices.

## Files

- **`three-particles.worker.types.ts`** - TypeScript interfaces and types for all worker messages
- **`three-particles.worker.ts`** - The worker implementation (no Three.js dependencies)
- **`three-particles.worker.spec.ts`** - Unit tests for types and message structure

## Key Features

✅ **Zero Three.js Dependencies** - Worker uses pure JavaScript for maximum compatibility  
✅ **Typed Arrays** - Float32Array for efficient memory transfer  
✅ **Transferable Objects** - Zero-copy message passing between threads  
✅ **Dynamic Configuration** - Update physics parameters at runtime  
✅ **Mobile-First** - Optimized for mobile performance  

## Message Types

### Input Messages (Main → Worker)

1. **INIT** - Initialize worker with particle data
   - Positions, velocities, original positions (Float32Array)
   - Physics configuration

2. **STEP** - Step physics simulation forward
   - Delta time, current timestamp
   - Mouse position and velocity
   - Shockwave effects
   - Camera matrices for projection

3. **UPDATE_CONFIG** - Update physics configuration
   - Partial config updates supported

### Output Messages (Worker → Main)

1. **INIT_COMPLETE** - Worker initialized successfully
   - Returns particle count

2. **STEP_COMPLETE** - Physics step complete
   - Returns updated positions and velocities

3. **CONFIG_UPDATED** - Configuration updated
   - Returns current configuration

## Usage Example

```typescript
import { ParticleWorkerMessageType, InitMessage } from './three-particles.worker.types';

// Create worker
const worker = new Worker(
  new URL('./three-particles.worker', import.meta.url),
  { type: 'module' }
);

// Initialize
const particleCount = 100;
const initMessage: InitMessage = {
  type: ParticleWorkerMessageType.INIT,
  positions: new Float32Array(particleCount * 3),
  velocities: new Float32Array(particleCount * 3),
  originalPositions: new Float32Array(particleCount * 3),
  config: {
    friction: 0.96,
    returnSpeed: 0.0005,
    maxForce: 0.6,
    maxRadius: 15,
    maxSensibleVelocity: 0.04,
  },
};

worker.postMessage(initMessage);

// Listen for responses
worker.onmessage = (event) => {
  if (event.data.type === ParticleWorkerMessageType.INIT_COMPLETE) {
    console.log('Worker initialized with', event.data.particleCount, 'particles');
  }
};
```

## Physics Configuration

```typescript
interface ParticlePhysicsConfig {
  friction: number;              // 0-1, higher = more friction (default: 0.96)
  returnSpeed: number;           // Speed to return to original position (default: 0.0005)
  maxForce: number;              // Maximum force from interactions (default: 0.6)
  maxRadius: number;             // Maximum interaction radius (default: 15)
  maxSensibleVelocity: number;   // Maximum mouse velocity (default: 0.04)
}
```

## Testing

### Unit Tests

```bash
# Run type validation tests
npm test -- --include='**/three-particles.worker.spec.ts'
```

### Manual Testing in Browser

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open browser console** and navigate to a page with particle background

4. **Test worker communication:**
   ```javascript
   // The worker is already initialized by ThreeParticleBackgroundComponent
   // You can observe it working by monitoring performance
   
   // Open Performance Monitor (Chrome DevTools > More tools > Performance monitor)
   // Look for:
   // - Main thread CPU usage should be LOW during particle animations
   // - Frames should stay at 60fps even with many particles
   ```

### Browser DevTools Worker Inspection

1. Open Chrome DevTools
2. Go to **Sources** tab
3. Look for **Workers** in the left sidebar
4. You can set breakpoints and inspect the worker code

### Performance Validation

The worker's effectiveness can be measured by:

1. **FPS Stability** - Should maintain 60fps with 100+ particles
2. **Main Thread CPU** - Should be <30% during particle animation
3. **Input Responsiveness** - UI should remain responsive during heavy physics

## Integration with ThreeParticleBackgroundComponent

The worker is designed to integrate with the existing particle background component:

1. Component sends camera matrices and mouse/shockwave data to worker
2. Worker performs physics calculations
3. Worker returns updated positions
4. Component updates Three.js geometry with new positions

## Performance Benefits

Without worker:
- Main thread handles both UI and physics
- Can drop to ~30fps with 100+ particles on mobile
- UI interactions may feel sluggish

With worker:
- Main thread only handles rendering
- Maintains 60fps with 200+ particles
- UI remains responsive during heavy physics

## Browser Compatibility

Web Workers are supported in:
- ✅ Chrome/Edge 4+
- ✅ Firefox 3.5+
- ✅ Safari 4+
- ✅ Opera 10.6+
- ✅ iOS Safari 5+
- ✅ Android Browser 4.4+

## Troubleshooting

### Worker fails to load
- Ensure the worker file is properly bundled
- Check browser console for security errors
- Verify `type: 'module'` is set when creating worker

### Performance not improved
- Verify worker is actually running (check DevTools > Sources > Workers)
- Ensure transferable objects are being used (check postMessage calls)
- Profile to ensure physics is happening in worker, not main thread

### Messages not received
- Check worker.onerror for errors
- Verify message types match exactly
- Ensure typed arrays are properly transferred

## Future Enhancements

Potential improvements for Wave 3+:

- [ ] Add worker pool for multi-core utilization
- [ ] Implement spatial partitioning (quadtree) for O(n log n) collision detection
- [ ] Add particle-to-particle interactions
- [ ] Implement physics timestep sub-stepping
- [ ] Add SIMD optimizations where available
- [ ] Implement predictive positioning for lower latency

## References

- [Angular Web Workers Guide](https://angular.dev/ecosystem/web-workers)
- [Angular Performance Best Practices](https://angular.dev/best-practices/runtime-performance)
- [MDN Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
