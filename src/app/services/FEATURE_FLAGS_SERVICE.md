# FeatureFlagsService

## Overview

`FeatureFlagsService` provides centralized control over experimental and conditional features in the application. The service enables/disables features like 3D effects, particle systems, haptic feedback, and list snapping behavior through a clean, type-safe API.

## Key Features

- ✅ **Safe Defaults** - All features enabled by default for progressive enhancement
- ✅ **Type-Safe API** - Full TypeScript support with compile-time checks
- ✅ **Dependency Injection** - Override flags via `InjectionToken` pattern
- ✅ **Reactive API** - Observable-based for reactive consumption
- ✅ **Immutable Configuration** - Prevents accidental state mutation
- ✅ **Fully Tested** - 24 comprehensive unit tests
- ✅ **Single Responsibility** - Focused solely on feature flag management

## Controlled Features

| Feature | Key | Default | Description |
|---------|-----|---------|-------------|
| 3D Ring | `ring3d` | ✅ Enabled | 3D ring carousel visualization |
| Particles | `particles` | ✅ Enabled | Particle background effects |
| Haptics | `haptics` | ✅ Enabled | Haptic/vibration feedback |
| List Snap | `listSnap` | ✅ Enabled | List snapping behavior |

## Installation

The service is already registered with `providedIn: 'root'`, so it's available throughout the application without manual registration.

## API Reference

### Methods

#### `getFlags(): Readonly<FeatureFlagsConfig>`
Get current feature flags configuration as an immutable object.

```typescript
const flags = featureFlags.getFlags();
console.log(flags.ring3d); // true
```

#### `getFlags$(): Observable<FeatureFlagsConfig>`
Get feature flags as an Observable for reactive consumption.

```typescript
featureFlags.getFlags$().subscribe(flags => {
  console.log('Flags updated:', flags);
});
```

#### `isRing3dEnabled(): boolean`
Check if 3D ring visualization is enabled.

```typescript
if (featureFlags.isRing3dEnabled()) {
  // Initialize 3D ring component
}
```

#### `isParticlesEnabled(): boolean`
Check if particle background effects are enabled.

```typescript
if (featureFlags.isParticlesEnabled()) {
  // Initialize particle system
}
```

#### `isHapticsEnabled(): boolean`
Check if haptic feedback is enabled.

```typescript
if (featureFlags.isHapticsEnabled()) {
  // Trigger haptic feedback
  haptics.vibrate(50);
}
```

#### `isListSnapEnabled(): boolean`
Check if list snapping behavior is enabled.

```typescript
if (featureFlags.isListSnapEnabled()) {
  // Enable snap-to-item behavior
}
```

#### `isFeatureEnabled(featureName: keyof FeatureFlagsConfig): boolean`
Check if a specific feature is enabled by name (generic method).

```typescript
if (featureFlags.isFeatureEnabled('particles')) {
  // Feature is enabled
}
```

## Usage Examples

### Basic Usage

```typescript
import { Component, inject } from '@angular/core';
import { FeatureFlagsService } from '@app/services/feature-flags.service';

@Component({
  selector: 'app-example',
  template: `
    <div *ngIf="showRing3d">
      <app-work-card-ring></app-work-card-ring>
    </div>
    
    <div *ngIf="showParticles">
      <app-three-particle-background></app-three-particle-background>
    </div>
  `
})
export class ExampleComponent {
  private featureFlags = inject(FeatureFlagsService);
  
  showRing3d = this.featureFlags.isRing3dEnabled();
  showParticles = this.featureFlags.isParticlesEnabled();
}
```

### Reactive Usage with Observable

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { FeatureFlagsService } from '@app/services/feature-flags.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reactive-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="(flags$ | async)?.particles">
      <app-three-particle-background></app-three-particle-background>
    </div>
  `
})
export class ReactiveExampleComponent {
  private featureFlags = inject(FeatureFlagsService);
  
  flags$ = this.featureFlags.getFlags$();
}
```

### Conditional Feature Initialization

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { FeatureFlagsService } from '@app/services/feature-flags.service';
import { HapticsService } from '@app/services/haptics.service';

@Component({
  selector: 'app-gesture-handler',
  template: `<div (pointerdown)="onDragStart()">Drag me</div>`
})
export class GestureHandlerComponent {
  private featureFlags = inject(FeatureFlagsService);
  private haptics = inject(HapticsService);
  
  onDragStart(): void {
    // Only trigger haptics if feature is enabled
    if (this.featureFlags.isHapticsEnabled()) {
      this.haptics.vibrate(50);
    }
  }
}
```

## Override Configuration

### Method 1: Application-Wide Override

Override flags at the application level in `app.config.ts` or module providers:

```typescript
import { ApplicationConfig } from '@angular/core';
import { FEATURE_FLAGS_CONFIG } from '@app/services/feature-flags.service';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: FEATURE_FLAGS_CONFIG,
      useValue: {
        ring3d: false,      // Disable 3D ring
        particles: true,    // Keep particles enabled
        haptics: true,      // Keep haptics enabled
        listSnap: false     // Disable list snap
      }
    }
  ]
};
```

### Method 2: Component-Level Override

Override flags for specific components and their children:

```typescript
import { Component } from '@angular/core';
import { FEATURE_FLAGS_CONFIG } from '@app/services/feature-flags.service';

@Component({
  selector: 'app-accessibility-mode',
  template: `...`,
  providers: [
    {
      provide: FEATURE_FLAGS_CONFIG,
      useValue: {
        ring3d: false,
        particles: false,
        haptics: false,
        listSnap: true
      }
    }
  ]
})
export class AccessibilityModeComponent {}
```

### Method 3: Environment-Based Override

Use environment files to control features per deployment:

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  featureFlags: {
    ring3d: true,
    particles: true,
    haptics: true,
    listSnap: true
  }
};

// app.config.ts
import { environment } from '@env/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: FEATURE_FLAGS_CONFIG,
      useValue: environment.featureFlags
    }
  ]
};
```

### Method 4: Partial Override

Only override specific flags, keeping others at default:

```typescript
providers: [
  {
    provide: FEATURE_FLAGS_CONFIG,
    useValue: {
      particles: false  // Only disable particles, others remain default (true)
    }
  }
]
```

## Testing

The service includes 24 comprehensive unit tests covering:

- ✅ Default configuration (all features enabled)
- ✅ Single feature override
- ✅ Multiple feature overrides
- ✅ All features disabled scenario
- ✅ Partial overrides with explicit values
- ✅ Empty override (uses all defaults)
- ✅ API consistency across methods
- ✅ Type safety
- ✅ Observable functionality
- ✅ Immutability guarantees

### Run Tests

```bash
# Run only FeatureFlagsService tests
npm test -- --include='**/feature-flags.service.spec.ts'

# Run all tests
npm test -- --no-watch --browsers=ChromeHeadless
```

## Best Practices

1. ✅ **Check flags before expensive operations** - Avoid initializing heavy features when disabled
2. ✅ **Use reactive API for dynamic UIs** - Subscribe to `getFlags$()` for real-time updates
3. ✅ **Combine with accessibility services** - Disable visual effects when `prefers-reduced-motion` is set
4. ✅ **Document flag usage** - Comment why a feature is disabled in overrides
5. ✅ **Test both enabled/disabled states** - Ensure features gracefully degrade when disabled

## Integration Examples

### With Reduced Motion Service

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureFlagsService } from '@app/services/feature-flags.service';
import { ReducedMotionService } from '@app/services/reduced-motion.service';

@Component({
  selector: 'app-smart-particles',
  template: `
    <app-three-particle-background 
      *ngIf="showParticles$ | async">
    </app-three-particle-background>
  `
})
export class SmartParticlesComponent {
  private featureFlags = inject(FeatureFlagsService);
  private reducedMotion = inject(ReducedMotionService);
  
  // Only show particles if feature is enabled AND user doesn't prefer reduced motion
  showParticles$ = combineLatest([
    this.featureFlags.getFlags$(),
    this.reducedMotion.getPrefersReducedMotion()
  ]).pipe(
    map(([flags, prefersReduced]) => flags.particles && !prefersReduced)
  );
}
```

### With Viewport Service

```typescript
import { Component, inject } from '@angular/core';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureFlagsService } from '@app/services/feature-flags.service';
import { ViewportService } from '@app/services/viewport.service';

@Component({
  selector: 'app-responsive-ring',
  template: `
    <app-work-card-ring 
      *ngIf="showRing$ | async">
    </app-work-card-ring>
  `
})
export class ResponsiveRingComponent {
  private featureFlags = inject(FeatureFlagsService);
  private viewport = inject(ViewportService);
  
  // Only show 3D ring if feature is enabled AND viewport is large enough
  showRing$ = combineLatest([
    this.featureFlags.getFlags$(),
    this.viewport.isMobile$
  ]).pipe(
    map(([flags, isMobile]) => flags.ring3d && !isMobile)
  );
}
```

## Performance

- **Memory**: Minimal overhead (~200 bytes for config object)
- **CPU**: O(1) lookup for all flag checks
- **No side effects**: Pure getter methods with no external dependencies
- **Observable**: Single BehaviorSubject shared across all subscribers

## Architecture Compliance

This service follows Angular best practices:

- ✅ **Single Responsibility Principle** - Only manages feature flags
- ✅ **Dependency Injection** - Uses Angular's DI system correctly
- ✅ **Immutability** - Configuration cannot be modified after initialization
- ✅ **Type Safety** - Full TypeScript support with strict types
- ✅ **SSR-Safe** - No browser-specific APIs, works on server-side
- ✅ **Testability** - Easy to mock and override in tests

## References

- [Angular Architecture Guide](https://angular.dev/guide/architecture)
- [Angular Dependency Injection](https://angular.dev/guide/di)
- [Angular Performance Best Practices](https://angular.dev/best-practices/runtime-performance)
- [RxJS BehaviorSubject](https://rxjs.dev/api/index/class/BehaviorSubject)

## Related Services

- `HapticsService` - Controlled by `haptics` flag
- `ReducedMotionService` - Complements accessibility features
- `ViewportService` - Can be combined for responsive feature toggling
