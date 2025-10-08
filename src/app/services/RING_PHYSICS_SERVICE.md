# RingPhysicsService

Pure physics calculation service for ring carousel interactions.

## Overview

`RingPhysicsService` provides pure, side-effect-free functions for physics calculations used in ring carousel components. All functions are deterministic, stateless, and optimized for performance in animation loops.

## Features

✅ **100% Pure Functions** - No side effects, DOM access, or global state  
✅ **Performance Optimized** - Suitable for 60fps animation loops  
✅ **Fully Tested** - 100% line coverage, 94.44% branch coverage  
✅ **TypeScript** - Full type safety with comprehensive JSDoc  

## Test Coverage

```
Statements   : 100% ( 43/43 )
Branches     : 94.44% ( 34/36 )
Functions    : 100% ( 6/6 )
Lines        : 100% ( 39/39 )
```

## API

### `decay(v: number, friction: number, dt: number): number`

Apply exponential decay to velocity based on friction.

**Parameters:**
- `v` - Current velocity (degrees/second)
- `friction` - Friction coefficient (higher = more friction)
- `dt` - Delta time in seconds

**Returns:** Decayed velocity

**Example:**
```typescript
const service = inject(RingPhysicsService);
let velocity = 100;
const friction = 2.8;
const dt = 0.016; // ~60fps

// Apply friction for one frame
velocity = service.decay(velocity, friction, dt);
```

**Formula:** `v' = v × e^(-friction × dt)`

---

### `nearestSnapAngle(curr: number, step: number): number`

Find the nearest snap angle given current angle and step size.

**Parameters:**
- `curr` - Current angle in degrees
- `step` - Step size in degrees (angle between items)

**Returns:** Nearest snap angle in degrees

**Example:**
```typescript
const service = inject(RingPhysicsService);
const currentRotation = 47;
const stepSize = 45;

const snapTarget = service.nearestSnapAngle(currentRotation, stepSize);
// snapTarget will be the nearest multiple of 45°
```

**Note:** Uses a specific sign convention: negates input, normalizes to [0, 360), rounds to nearest step, then negates result.

---

### `shortestAngleDiff(a: number, b: number): number`

Calculate the shortest angular difference between two angles, handling angle wrapping correctly.

**Parameters:**
- `a` - First angle in degrees
- `b` - Second angle in degrees

**Returns:** Shortest difference from a to b, in range [-180, 180]

**Example:**
```typescript
const service = inject(RingPhysicsService);

// Finds shortest path across 0/360 boundary
const diff1 = service.shortestAngleDiff(10, 350); // Returns -20 (not 340)
const diff2 = service.shortestAngleDiff(350, 10); // Returns 20 (not -340)
```

---

### `releaseVelocity(params: ReleaseVelocityParams): number`

Calculate release velocity after drag with advanced heuristics incorporating drag energy, acceleration, and velocity history.

**Parameters:**
- `params.releaseVelocity` - Raw velocity at the moment of release
- `params.slowDragFrames` - Number of frames where drag was slow
- `params.peakDragVelocity` - Peak velocity during the drag
- `params.lastDragVelocity` - Last recorded velocity during drag
- `params.currentRotation` - Current rotation angle
- `params.stepDeg` - Angle step (spacing between items)
- `params.peakDragAcceleration` - Peak acceleration during drag
- `params.dragEnergy` - Accumulated drag energy

**Returns:** Final velocity to apply after release (can be 0 for snap)

**Example:**
```typescript
const service = inject(RingPhysicsService);

const params: ReleaseVelocityParams = {
  releaseVelocity: 50,
  slowDragFrames: 5,
  peakDragVelocity: 120,
  lastDragVelocity: 45,
  currentRotation: 47,
  stepDeg: 45,
  peakDragAcceleration: 200,
  dragEnergy: 1500
};

const finalVelocity = service.releaseVelocity(params);
```

**Behavior:**
- Returns 0 for slow drags (user wants to snap)
- Boosts velocity based on drag energy and acceleration
- Ensures minimum carry velocity for engaged drags
- Caps maximum velocity at 840 deg/s
- Preserves direction from release velocity or drag history

## Usage in Components

```typescript
import { Component, inject } from '@angular/core';
import { RingPhysicsService } from './services/ring-physics.service';

@Component({
  selector: 'app-carousel',
  // ...
})
export class CarouselComponent {
  private physics = inject(RingPhysicsService);
  
  private animationLoop(dt: number) {
    // Apply friction
    this.angularVelocity = this.physics.decay(
      this.angularVelocity, 
      this.friction, 
      dt
    );
    
    // Update rotation
    this.rotation += this.angularVelocity * dt;
    
    // Calculate snap target
    const snapTarget = this.physics.nearestSnapAngle(
      this.rotation, 
      this.stepAngle
    );
    
    // Calculate difference using shortest path
    const diff = this.physics.shortestAngleDiff(
      this.rotation, 
      snapTarget
    );
    
    // Apply snapping logic...
  }
  
  private onDragEnd() {
    // Calculate release velocity with heuristics
    const velocity = this.physics.releaseVelocity({
      releaseVelocity: this.currentVelocity,
      slowDragFrames: this.slowFrameCount,
      peakDragVelocity: this.peakVelocity,
      lastDragVelocity: this.lastVelocity,
      currentRotation: this.rotation,
      stepDeg: this.stepAngle,
      peakDragAcceleration: this.peakAccel,
      dragEnergy: this.energy
    });
    
    this.angularVelocity = velocity;
  }
}
```

## Performance Considerations

✅ All functions are pure and can be safely called in animation loops  
✅ No memory allocations during computation  
✅ Optimized mathematical operations  
✅ Early returns for invalid inputs  
✅ No DOM access or side effects  

## Testing

Run tests with coverage:
```bash
npm test -- --include='**/ring-physics.service.spec.ts' --code-coverage
```

## References

- [Angular Performance Best Practices](https://angular.dev/best-practices/runtime-performance)
- [NN/g: Mobile Carousel Usability](https://www.nngroup.com/articles/mobile-carousels/)

## License

Part of plataforma-frontend project.
