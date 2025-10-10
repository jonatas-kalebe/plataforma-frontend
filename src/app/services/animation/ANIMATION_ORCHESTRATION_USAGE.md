# AnimationOrchestrationService - Usage Examples

## Overview

The `AnimationOrchestrationService` is a centralized service for managing all GSAP animations and plugins in an Angular SSR application. It ensures that GSAP plugins are registered only once and only in browser environments, preventing SSR errors.

## Features

- **SSR-Safe**: All GSAP operations are guarded with `isPlatformBrowser` checks
- **Single Plugin Registration**: GSAP plugins (ScrollTrigger, Draggable) are registered only once
- **Centralized Configuration**: Global GSAP defaults are set in one place
- **Browser-Only Execution**: All animation logic runs only in the browser

## Basic Usage

### 1. Inject the Service

```typescript
import { Component, OnInit } from '@angular/core';
import { AnimationOrchestrationService } from '@app/services/animation';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html'
})
export class HeroSectionComponent implements OnInit {
  constructor(private animOrchestration: AnimationOrchestrationService) {}

  ngOnInit() {
    // Service is automatically initialized
    console.log('GSAP ready:', this.animOrchestration.isReady);
  }
}
```

### 2. Setup Hero Parallax Effect

```typescript
import { Component, AfterViewInit } from '@angular/core';
import { AnimationOrchestrationService } from '@app/services/animation';

@Component({
  selector: 'app-hero',
  template: `
    <div class="hero-section">
      <div data-speed="0.5" class="background-layer">Background</div>
      <div data-speed="1.0" class="content-layer">Content</div>
      <div data-speed="1.5" class="foreground-layer">Foreground</div>
    </div>
  `
})
export class HeroComponent implements AfterViewInit {
  constructor(private animOrchestration: AnimationOrchestrationService) {}

  ngAfterViewInit() {
    // Setup parallax effect
    this.animOrchestration.setupHeroParallax('.hero-section');
  }
}
```

### 3. Setup Global Scroll Snap

```typescript
import { Component, OnInit } from '@angular/core';
import { AnimationOrchestrationService } from '@app/services/animation';

@Component({
  selector: 'app-root',
  template: `
    <section class="snap-section">Section 1</section>
    <section class="snap-section">Section 2</section>
    <section class="snap-section">Section 3</section>
  `
})
export class AppComponent implements OnInit {
  constructor(private animOrchestration: AnimationOrchestrationService) {}

  ngOnInit() {
    // Setup scroll snapping between sections
    this.animOrchestration.setupGlobalScrollSnap();
  }
}
```

### 4. Access GSAP Instances

```typescript
import { Component } from '@angular/core';
import { AnimationOrchestrationService } from '@app/services/animation';

@Component({
  selector: 'app-custom-animation'
})
export class CustomAnimationComponent {
  constructor(private animOrchestration: AnimationOrchestrationService) {}

  animateElement(element: HTMLElement) {
    // Access GSAP directly
    const { gsap, scrollTrigger } = this.animOrchestration;

    gsap.to(element, {
      opacity: 0,
      scrollTrigger: {
        trigger: element,
        start: 'top center',
        end: 'bottom center',
        scrub: true
      }
    });
  }
}
```

### 5. Cleanup on Component Destroy

```typescript
import { Component, OnDestroy } from '@angular/core';
import { AnimationOrchestrationService } from '@app/services/animation';

@Component({
  selector: 'app-animated-section'
})
export class AnimatedSectionComponent implements OnDestroy {
  constructor(private animOrchestration: AnimationOrchestrationService) {}

  ngOnDestroy() {
    // Clean up all animations
    this.animOrchestration.killAllAnimations();
  }
}
```

## Advanced Usage

### Refresh ScrollTrigger After DOM Changes

```typescript
addNewContent() {
  // Add new DOM elements
  this.items.push(newItem);

  // Recalculate ScrollTrigger positions
  setTimeout(() => {
    this.animOrchestration.refreshScrollTriggers();
  }, 100);
}
```

### Check if Service is Ready

```typescript
ngAfterViewInit() {
  if (this.animOrchestration.isReady) {
    // Safe to run animations
    this.setupAnimations();
  } else {
    // Running in SSR, skip animations
    console.log('Animations disabled in SSR');
  }
}
```

## Plugin Registration

The service automatically registers the following GSAP plugins:

- **ScrollTrigger**: For scroll-based animations
- **Draggable**: For drag interactions
- **InertiaPlugin**: (Premium - requires license, currently commented out)

Plugins are registered only once when the service is instantiated in a browser environment.

## SSR Compatibility

All animation methods include browser checks:

```typescript
setupAnimation() {
  if (!this.animOrchestration.isReady) {
    // Skip animation setup in SSR
    return;
  }

  // Safe to run browser-only code
  this.animOrchestration.setupHeroParallax('.hero');
}
```

## Global GSAP Defaults

The service sets the following global defaults:

- **ease**: `'power2.out'`
- **duration**: `0.6` seconds

These can be overridden in individual animations.

## API Reference

### Properties

- `isReady: boolean` - Returns true if service is initialized and in browser
- `gsap: typeof gsap` - Access to GSAP library instance
- `scrollTrigger: typeof ScrollTrigger` - Access to ScrollTrigger plugin
- `draggable: typeof Draggable` - Access to Draggable plugin

### Methods

- `setupHeroParallax(selector: string): void` - Setup parallax scrolling
- `setupGlobalScrollSnap(): void` - Setup scroll snapping between sections
- `refreshScrollTriggers(): void` - Recalculate ScrollTrigger positions
- `killAllAnimations(): void` - Stop and remove all animations

## Notes

- The service is provided in root, so it's a singleton
- Plugin registration happens automatically in the constructor
- All methods are SSR-safe and can be called in any environment
- The service exposes GSAP globally on `window` for compatibility with legacy code
