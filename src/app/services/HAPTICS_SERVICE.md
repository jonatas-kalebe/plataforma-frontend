# HapticsService

## Overview

`HapticsService` provides safe, feature-detected vibration feedback for drag/snap gestures and other interactive elements. The service ensures graceful degradation when the Vibration API is unavailable (SSR, unsupported browsers).

## Key Features

- ✅ **Safe feature detection** - Checks for Vibration API support before use
- ✅ **SSR-compatible** - No-op on server-side (no errors thrown)
- ✅ **No side effects** - Gracefully handles missing API
- ✅ **Predefined patterns** - Common haptic patterns ready to use
- ✅ **Fully tested** - 33 comprehensive unit tests
- ✅ **TypeScript** - Full type safety and IDE support

## Installation

The service is already registered with `providedIn: 'root'`, so it's available throughout the application without manual registration.

## API Reference

### Methods

#### `vibrate(pattern: VibrationPattern): boolean`

Trigger haptic vibration with specified duration or pattern.

**Parameters:**
- `pattern` - Duration in milliseconds (number) or array of durations for pattern (number[])

**Returns:**
- `boolean` - true if vibration was triggered, false if not supported

**Examples:**
```typescript
// Single vibration (50ms)
haptics.vibrate(50);

// Pattern: vibrate 200ms, pause 100ms, vibrate 200ms
haptics.vibrate([200, 100, 200]);

// Using predefined pattern
haptics.vibrate(haptics.patterns.snap);
```

#### `cancel(): boolean`

Cancel any ongoing vibration.

**Returns:**
- `boolean` - true if cancellation was successful, false if not supported

**Example:**
```typescript
haptics.cancel();
```

#### `isHapticsSupported(): boolean`

Check if haptic feedback is supported on current platform.

**Returns:**
- `boolean` - true if Vibration API is available

**Example:**
```typescript
if (haptics.isHapticsSupported()) {
  console.log('Haptics are available!');
}
```

### Predefined Patterns

The service provides several predefined patterns for common interactions:

```typescript
haptics.patterns = {
  light: 50,                       // Light tap feedback
  medium: 100,                     // Medium tap feedback
  heavy: 200,                      // Heavy tap feedback
  doubleTap: [50, 100, 50],       // Double tap pattern
  success: [100, 50, 100],        // Success feedback
  error: [200, 100, 200, 100, 200], // Error feedback
  selection: 30,                   // Quick selection feedback
  snap: [30, 20, 50],             // Snap/gesture completion
}
```

## Usage Examples

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { HapticsService } from './services/haptics.service';

@Component({
  selector: 'app-my-component',
  // ...
})
export class MyComponent {
  private haptics = inject(HapticsService);

  onButtonClick() {
    // Provide light haptic feedback
    this.haptics.vibrate(this.haptics.patterns.light);
  }
}
```

### Drag and Drop with Haptic Feedback

```typescript
@Component({
  // ...
})
export class DraggableComponent {
  private haptics = inject(HapticsService);

  onDragStart(event: DragEvent) {
    // Light feedback when starting drag
    this.haptics.vibrate(this.haptics.patterns.light);
  }

  onDrop(event: DragEvent) {
    // Snap pattern when drop completes
    this.haptics.vibrate(this.haptics.patterns.snap);
  }
}
```

### Conditional Haptics

```typescript
@Component({
  // ...
})
export class FormComponent {
  private haptics = inject(HapticsService);

  onSubmit(formValid: boolean) {
    if (formValid) {
      // Success feedback
      this.haptics.vibrate(this.haptics.patterns.success);
    } else {
      // Error feedback
      this.haptics.vibrate(this.haptics.patterns.error);
    }
  }
}
```

### Touch Events

```typescript
@Component({
  // ...
})
export class TouchComponent {
  private haptics = inject(HapticsService);

  onTouchStart(event: TouchEvent) {
    // Only vibrate if supported
    if (this.haptics.isHapticsSupported()) {
      this.haptics.vibrate(this.haptics.patterns.selection);
    }
  }
}
```

### Replacing Direct navigator.vibrate Usage

**Before:**
```typescript
// Direct navigator.vibrate usage (unsafe)
button.addEventListener('touchstart', () => {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
});
```

**After:**
```typescript
// Using HapticsService (safe)
button.addEventListener('touchstart', () => {
  this.haptics.vibrate(this.haptics.patterns.light);
});
```

## Browser Support

The service automatically detects browser support for the Vibration API:

- ✅ Chrome (Android)
- ✅ Firefox (Android)
- ✅ Opera (Android)
- ✅ Samsung Internet
- ❌ iOS Safari (not supported)
- ❌ Desktop browsers (API available but usually no effect)

The service gracefully handles unsupported browsers by returning `false` without throwing errors.

## SSR Compatibility

The service is fully compatible with Server-Side Rendering:

- On server: `isHapticsSupported()` returns `false`
- On server: `vibrate()` and `cancel()` return `false` (no-op)
- No errors are thrown in SSR environment

## Testing

The service includes 33 comprehensive unit tests covering:

- ✅ Feature detection
- ✅ Basic vibration functionality
- ✅ Pattern support
- ✅ Error handling
- ✅ SSR compatibility
- ✅ Browser without Vibration API support
- ✅ Edge cases (zero duration, empty patterns, etc.)
- ✅ Integration scenarios

Run tests:
```bash
npm test -- --include='**/haptics.service.spec.ts'
```

## Best Practices

1. ✅ **Use predefined patterns** - They provide consistent UX
2. ✅ **Don't overuse** - Too much vibration is annoying
3. ✅ **Keep durations short** - 20-200ms is usually sufficient
4. ✅ **Respect user preferences** - Consider `prefers-reduced-motion`
5. ✅ **Test on real devices** - Vibration feels different on different devices

## Performance

All methods are O(1) time complexity with minimal overhead:
- Feature detection is done once at service initialization
- No DOM manipulation
- No memory leaks (no event listeners to clean up)

## References

- [MDN Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Angular Runtime Performance Best Practices](https://angular.dev/best-practices/runtime-performance)
- [Can I Use: Vibration API](https://caniuse.com/vibration)
