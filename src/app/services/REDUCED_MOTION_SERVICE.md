# ReducedMotionService

## Overview

The `ReducedMotionService` is an Angular service that exposes an observable of user motion preferences based on the `prefers-reduced-motion` CSS media query. This service helps implement accessible animations that respect user preferences for reduced motion.

## Features

- ✅ Observable pattern for reactive motion preference detection
- ✅ Automatic cleanup of `matchMedia` listeners (no memory leaks)
- ✅ Server-side rendering (SSR) support
- ✅ WCAG AA compliant
- ✅ Comprehensive test coverage with matchMedia mocks
- ✅ TypeScript support

## Usage

### Basic Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { ReducedMotionService } from './services/reduced-motion.service';

@Component({
  selector: 'app-example',
  template: `...`
})
export class ExampleComponent implements OnInit {
  constructor(private reducedMotionService: ReducedMotionService) {}

  ngOnInit() {
    // Subscribe to motion preference changes
    this.reducedMotionService.getPrefersReducedMotion().subscribe(prefersReduced => {
      if (prefersReduced) {
        console.log('User prefers reduced motion');
        // Disable or simplify animations
      } else {
        console.log('User prefers standard motion');
        // Enable full animations
      }
    });
  }
}
```

### Get Current Preference Synchronously

```typescript
const prefersReduced = this.reducedMotionService.getCurrentPreference();
if (prefersReduced) {
  // Use reduced motion
}
```

### With Animations

```typescript
import { Component, OnInit } from '@angular/core';
import { ReducedMotionService } from './services/reduced-motion.service';

@Component({
  selector: 'app-animated',
  template: `
    <div class="animated-element" [class.reduced-motion]="prefersReducedMotion">
      Content
    </div>
  `
})
export class AnimatedComponent implements OnInit {
  prefersReducedMotion = false;

  constructor(private reducedMotionService: ReducedMotionService) {}

  ngOnInit() {
    this.reducedMotionService.getPrefersReducedMotion().subscribe(
      prefersReduced => {
        this.prefersReducedMotion = prefersReduced;
      }
    );
  }
}
```

## API

### Methods

#### `getPrefersReducedMotion(): Observable<boolean>`

Returns an observable that emits `true` when the user prefers reduced motion, `false` otherwise. The observable will emit whenever the user changes their motion preference.

#### `getCurrentPreference(): boolean`

Returns the current motion preference synchronously. Useful when you need an immediate value without subscribing.

## Implementation Details

- **Browser Environment**: Uses `window.matchMedia('(prefers-reduced-motion: reduce)')` to detect user preferences
- **Server Environment**: Defaults to `true` (reduced motion) for better SSR performance
- **Listener Management**: Automatically adds and removes event listeners to prevent memory leaks
- **Error Handling**: Gracefully handles environments where `matchMedia` is not supported

## Testing

The service includes comprehensive tests covering:
- Initial value detection
- Media query change events
- Memory leak prevention
- Server-side rendering
- Error handling
- Multiple subscribers

Run tests with:
```bash
npm test
```

## Browser Support

Supports all modern browsers that implement the `prefers-reduced-motion` media query:
- Chrome 74+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## References

- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Angular Accessibility Best Practices](https://angular.dev/best-practices/a11y)
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)

## License

Part of the Plataforma Frontend project.
