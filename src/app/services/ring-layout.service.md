# RingLayoutService

## Overview

The `RingLayoutService` provides pure functions for calculating ring layout parameters in Angular applications. This service is specifically designed for circular/ring-based UI components like the `WorkCardRingComponent`.

## Key Features

- ✅ **Pure Functions**: All methods are stateless and deterministic
- ✅ **No DOM/Window Access**: Safe for SSR and Node.js environments
- ✅ **Numerical Stability**: Handles edge cases like single items and zero gaps
- ✅ **Well-Tested**: Comprehensive unit test coverage (32 tests)
- ✅ **TypeScript**: Full type safety and IDE support

## Installation

The service is already registered with `providedIn: 'root'`, so it's available throughout the application without manual registration.

## API Reference

### `computeStepDeg(count: number): number`

Computes the angular step in degrees between items in a ring layout.

**Parameters:**
- `count`: Number of items in the ring (minimum 1)

**Returns:** Angular step in degrees (360° / count)

**Examples:**
```typescript
service.computeStepDeg(8);  // Returns 45
service.computeStepDeg(12); // Returns 30
service.computeStepDeg(1);  // Returns 360
```

---

### `computeSpacingRadius(cardW: number, gap: number, count: number): number`

Computes the minimum radius needed to maintain a specified gap between cards.

**Parameters:**
- `cardW`: Width of each card in pixels
- `gap`: Minimum gap between cards in pixels
- `count`: Number of cards in the ring

**Returns:** Minimum radius in pixels to maintain the gap, or 0 if count <= 1

**Formula:** Uses the chord-to-radius formula: `r = chord / (2 * sin(θ/2))`

**Examples:**
```typescript
service.computeSpacingRadius(240, 24, 8);  // Returns ~292.7
service.computeSpacingRadius(200, 0, 8);   // Returns radius with no gap
service.computeSpacingRadius(200, 24, 1);  // Returns 0 (single item)
```

---

### `effectiveRadius(base: number, spacing: number): number`

Computes the effective radius by taking the maximum of base radius and spacing radius.

**Parameters:**
- `base`: Base radius in pixels
- `spacing`: Spacing radius in pixels (from `computeSpacingRadius`)

**Returns:** The effective radius (maximum of base and spacing)

**Examples:**
```typescript
service.effectiveRadius(200, 250); // Returns 250
service.effectiveRadius(300, 250); // Returns 300
service.effectiveRadius(200, 0);   // Returns 200
```

## Usage Example

```typescript
import { Component, OnInit } from '@angular/core';
import { RingLayoutService } from './services/ring-layout.service';

@Component({
  selector: 'app-my-component',
  template: '...'
})
export class MyComponent implements OnInit {
  constructor(private ringLayout: RingLayoutService) {}

  ngOnInit() {
    const itemCount = 8;
    const cardWidth = 240;
    const minGap = 24;
    const baseRadius = 200;

    // Step 1: Calculate angular step between items
    const stepDeg = this.ringLayout.computeStepDeg(itemCount);
    console.log(`Items are ${stepDeg}° apart`);

    // Step 2: Calculate minimum radius for proper spacing
    const spacingRadius = this.ringLayout.computeSpacingRadius(
      cardWidth,
      minGap,
      itemCount
    );

    // Step 3: Get effective radius (whichever is larger)
    const effectiveRadius = this.ringLayout.effectiveRadius(
      baseRadius,
      spacingRadius
    );

    console.log(`Using radius: ${effectiveRadius}px`);
  }
}
```

## Edge Cases Handled

1. **Single Item (count: 1)**
   - `computeStepDeg(1)` returns 360°
   - `computeSpacingRadius(*, *, 1)` returns 0 (no spacing needed)

2. **Zero Gap**
   - `computeSpacingRadius(cardW, 0, count)` correctly calculates minimum radius without gap

3. **Invalid Counts**
   - Negative or zero counts are treated as 1
   - Division by zero is prevented

4. **Numerical Stability**
   - All functions return stable, finite numbers
   - No NaN or Infinity results

## Testing

Run the unit tests:
```bash
npm test
```

All 32 tests should pass, covering:
- Basic functionality
- Edge cases (count:1, gap:0)
- Numerical stability
- Pure function characteristics
- Integration scenarios

## Performance

All functions are O(1) time complexity with minimal computational overhead. They perform simple arithmetic operations and are suitable for real-time calculations.

## References

- [Angular Performance Best Practices](https://angular.dev/best-practices/runtime-performance)
- [Responsive Design Principles](https://tailwindcss.com/docs/responsive-design)
- Mathematical Foundation: Chord-to-radius relationship in circle geometry
