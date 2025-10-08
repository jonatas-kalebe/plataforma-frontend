# RingGestureService

## Overview

`RingGestureService` is a pure, testable Angular service for gesture recognition with a Finite State Machine (FSM) approach. It normalizes pointer/touch events, calculates deltas and velocities, and provides an observable-based API for reactive gesture handling.

## Features

- ✅ **FSM-based gesture recognition** - Clean state transitions: `idle` → `pending` → `rotate`
- ✅ **Pointer event normalization** - Unified interface for mouse/touch/pointer events
- ✅ **Delta calculation** - Tracks pixel movement (dx) between events
- ✅ **Velocity tracking** - Calculates dx/dt with configurable smoothing window
- ✅ **Observable API** - RxJS-based reactive event stream
- ✅ **No DOM dependencies** - Pure service, fully testable without browser
- ✅ **Accessibility-ready** - Keyboard support hook for alternative input
- ✅ **No global side effects** - Multiple instances work independently

## Installation

The service is already available in your Angular app:

```typescript
import { RingGestureService } from './services/ring-gesture.service';
```

## Basic Usage

### 1. Inject the Service

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { RingGestureService, SyntheticPointerEvent } from './services/ring-gesture.service';

@Component({
  selector: 'app-my-component',
  template: `
    <div 
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)">
      Drag me!
    </div>
  `
})
export class MyComponent implements OnInit {
  private gestureService = inject(RingGestureService);
  
  ngOnInit() {
    // Subscribe to gesture events
    this.gestureService.gestureData$.subscribe(data => {
      console.log('State:', data.state);
      console.log('Delta:', data.delta);
      console.log('Velocity:', data.velocity);
      console.log('Smoothed Velocity:', data.smoothedVelocity);
    });
  }
  
  onPointerDown(event: PointerEvent) {
    this.gestureService.onPointerDown(this.toSynthetic(event));
  }
  
  onPointerMove(event: PointerEvent) {
    this.gestureService.onPointerMove(this.toSynthetic(event));
  }
  
  onPointerUp(event: PointerEvent) {
    this.gestureService.onPointerUp(this.toSynthetic(event));
  }
  
  private toSynthetic(event: PointerEvent): SyntheticPointerEvent {
    return {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      timeStamp: event.timeStamp,
      isPrimary: event.isPrimary,
      button: event.button,
    };
  }
}
```

### 2. Custom Configuration

```typescript
// Inject the service
private gestureService = inject(RingGestureService);

ngOnInit() {
  // Configure after injection
  this.gestureService.configure({
    gestureThreshold: 10,      // Pixels to move before gesture detection
    horizontalBias: 1.5,       // Favor horizontal gestures
    velocityWindowSize: 8,     // Larger smoothing window
  });
}
```

### 3. Runtime Configuration Updates

```typescript
// Update configuration on the fly
gestureService.configure({
  gestureThreshold: 15
});

// Get current configuration
const config = gestureService.getConfig();
console.log(config.gestureThreshold); // 15
```

## Advanced Usage

### Keyboard Support

The service includes a hook for keyboard navigation:

```typescript
@HostListener('keydown', ['$event'])
onKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    this.gestureService.emitKeyboardDelta(-10);
  } else if (event.key === 'ArrowRight') {
    this.gestureService.emitKeyboardDelta(10);
  }
}
```

### State Monitoring

```typescript
// Check current state
const state = this.gestureService.getState();
console.log(state); // 'idle' | 'pending' | 'rotate'

// Filter by state in subscription
this.gestureService.gestureData$
  .pipe(
    filter(data => data.state === 'rotate')
  )
  .subscribe(data => {
    // Only handle active rotation gestures
    this.applyRotation(data.delta);
  });
```

### Reset Service

```typescript
// Manually reset gesture state (useful for cancellation)
this.gestureService.reset();
```

## API Reference

### Types

#### `GestureState`
```typescript
type GestureState = 'idle' | 'pending' | 'rotate';
```

#### `SyntheticPointerEvent`
```typescript
interface SyntheticPointerEvent {
  pointerId: number;
  clientX: number;
  clientY: number;
  timeStamp: number;
  isPrimary: boolean;
  button?: number;
}
```

#### `GestureData`
```typescript
interface GestureData {
  state: GestureState;         // Current FSM state
  delta: number;               // Horizontal movement since last event (px)
  velocity: number;            // Instantaneous velocity (px/s)
  smoothedVelocity: number;    // Windowed average velocity (px/s)
  pointerId: number | null;    // Active pointer ID
  position: { x: number; y: number }; // Current pointer position
}
```

#### `GestureConfig`
```typescript
interface GestureConfig {
  gestureThreshold: number;    // Default: 8
  horizontalBias: number;      // Default: 1.2
  velocityWindowSize: number;  // Default: 6
}
```

### Methods

#### `constructor()`
Create a new gesture service instance. When used as an Angular Injectable, the service is automatically instantiated by the DI system.

#### `configure(config: Partial<GestureConfig>): void`
Update configuration at runtime. Use this to customize the service after injection.

#### `getConfig(): Readonly<GestureConfig>`
Get current configuration (immutable copy).

#### `getState(): GestureState`
Get current FSM state.

#### `onPointerDown(event: SyntheticPointerEvent): void`
Handle pointer down event. Transitions to `pending` state.

#### `onPointerMove(event: SyntheticPointerEvent): void`
Handle pointer move event. May transition to `rotate` state when threshold exceeded.

#### `onPointerUp(event: SyntheticPointerEvent): void`
Handle pointer up event. Returns to `idle` state.

#### `onPointerCancel(event: SyntheticPointerEvent): void`
Handle pointer cancel event (same as pointer up).

#### `reset(): void`
Manually reset to `idle` state and clear all tracking data.

#### `emitKeyboardDelta(delta: number): void`
Emit a synthetic rotation delta for keyboard navigation support.

### Observable

#### `gestureData$: Observable<GestureData>`
Stream of gesture data updates. Emits on state changes and pointer movements.

## FSM Behavior

```
┌──────┐
│ idle │ ◄──────────────────────────┐
└──────┘                            │
    │                               │
    │ pointerdown                   │
    ▼                               │
┌─────────┐                         │
│ pending │                         │
└─────────┘                         │
    │                               │
    │ threshold exceeded            │
    │ + horizontal bias             │
    ▼                               │
┌────────┐                          │
│ rotate │ ─── pointerup ───────────┘
└────────┘
    │
    │ vertical movement
    └─── reset to idle
```

## Example: Integration with Ring Component

```typescript
export class WorkCardRingComponent implements OnInit, OnDestroy {
  private gestureService = new RingGestureService({
    gestureThreshold: 8,
    horizontalBias: 1.2,
  });
  
  private rotationDeg = 0;
  private subscription?: Subscription;
  
  ngOnInit() {
    this.subscription = this.gestureService.gestureData$.subscribe(data => {
      if (data.state === 'rotate') {
        // Apply delta to rotation
        this.rotationDeg += data.delta * 0.35; // sensitivity factor
        this.updateRingRotation();
        
        // Use velocity for inertia
        if (data.smoothedVelocity > 100) {
          this.applyInertia(data.smoothedVelocity);
        }
      }
    });
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
  
  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) {
    this.gestureService.onPointerDown({
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      timeStamp: event.timeStamp,
      isPrimary: event.isPrimary,
      button: event.button,
    });
  }
  
  // Similar for pointermove, pointerup...
}
```

## Testing

The service is designed to be tested without a browser environment. See `src/test-ring-gesture.ts` for comprehensive manual tests demonstrating:

- FSM state transitions
- Fast and slow drag velocity calculation
- Velocity smoothing
- Gesture rejection (vertical vs horizontal)
- Multiple pointer handling
- Configuration
- No side effects between instances

## Accessibility Considerations

The service is designed with accessibility in mind:

1. **Keyboard Support**: Use `emitKeyboardDelta()` to provide keyboard navigation
2. **Pointer Independence**: Works with mouse, touch, and stylus inputs
3. **Configurable Thresholds**: Adjust gesture thresholds for different user needs
4. **No Capture Required**: Service doesn't manage pointer capture (component's responsibility)

### Accessibility Example

```typescript
// Make your component keyboard-accessible
@Component({
  selector: 'app-accessible-ring',
  template: `
    <div 
      tabindex="0"
      role="slider"
      [attr.aria-valuenow]="currentIndex"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="itemCount"
      (keydown)="onKeyDown($event)"
      (pointerdown)="onPointerDown($event)">
      <!-- content -->
    </div>
  `
})
export class AccessibleRingComponent {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const step = 10;
    
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.gestureService.emitKeyboardDelta(-step);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.gestureService.emitKeyboardDelta(step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.jumpToIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.jumpToIndex(this.itemCount - 1);
    }
  }
}
```

## Performance Considerations

- **Velocity Window**: Larger windows (8-12) = smoother but less responsive. Smaller windows (3-5) = more responsive but jittery.
- **Observable Subscription**: Always unsubscribe in `ngOnDestroy()` to prevent memory leaks.
- **Synthetic Events**: Creating synthetic events has minimal overhead compared to native events.

## Best Practices

1. ✅ **Single Responsibility**: One service instance per interactive element
2. ✅ **Unsubscribe**: Always clean up subscriptions
3. ✅ **Configuration**: Set thresholds based on your UI scale and user testing
4. ✅ **Error Handling**: Wrap event handlers in try-catch for production
5. ✅ **Performance**: Use RxJS operators (`debounceTime`, `throttleTime`) if needed

## References

- [NN/G Drag-and-Drop Guidelines](https://www.nngroup.com/articles/drag-drop/)
- [Angular Accessibility Best Practices](https://angular.dev/best-practices/a11y)
- [W3C Pointer Events](https://www.w3.org/TR/pointerevents/)

## License

Part of the plataforma-frontend project.
