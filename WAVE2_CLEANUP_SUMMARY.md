# Wave 2: Animation Services Cleanup Summary

## Completed Actions

### Removed Redundant Service Files
The following duplicate/unused service files have been removed:

1. **trabalhos-section-animation-refactored.service.ts** - Duplicate implementation, zero imports
2. **servicos-animation-refactored.service.ts** - Duplicate implementation, zero imports  
3. **hero-animation.service.ts** - Unused service, no imports

### Updated Barrel Exports
- Updated `src/app/services/animation/index.ts` to remove references to deleted services
- Kept only actively used services in the barrel export

### Build Verification
- ✅ Build completes successfully
- ✅ No orphaned imports or references
- ✅ Application architecture intact

## Remaining Services (Currently In Use)

The following services are mentioned in the issue but are **actively used** by components and **cannot be removed without migration**:

### 1. trabalhos-section-animation.service.ts
- **Used by:** `trabalhos-section.component.ts`
- **Purpose:** Manages animations for trabalhos section
- **Dependencies:** ReducedMotionService, HapticsService, FeatureFlagsService
- **Status:** Required by component, migration needed before removal

### 2. native-scroll-animation.service.ts  
- **Used by:** 
  - `hero-section.component.ts`
  - `native-section-animations.class.ts`
- **Purpose:** Native Web API-based scroll animations (no GSAP)
- **Status:** Required by multiple consumers, migration needed before removal

### 3. scroll-orchestration.service.ts
- **Used by:**
  - `landing.component.ts`
  - `three-particle-background.component.ts`
  - `hero-section.component.ts`
- **Purpose:** Orchestrates scroll behavior and metrics
- **Architecture:** Already refactored internally to use shared managers (ScrollMetricsManager, MagneticScrollManager, HeroAnimationManager)
- **Status:** Facade service used by multiple components, migration needed before removal

## Architecture Notes

### Current State
The codebase follows a layered architecture:

```
Components
    ↓ (inject/use)
Services (facades)
    ↓ (delegate to)
Shared Managers/Classes
```

### Service Dependencies
- `ScrollOrchestrationService` → Uses `ScrollMetricsManager`, `MagneticScrollManager`, `HeroAnimationManager`
- `NativeSectionAnimations` → Uses `NativeScrollAnimationService`  
- `AnimationOrchestrationService` → GSAP initialization only (not a replacement for other services)

### Why Services Can't Be Removed Yet

The issue states "após migração" (after migration), indicating these services should only be removed AFTER:

1. Components are refactored to use shared managers directly, OR
2. A new centralized service provides equivalent functionality, OR  
3. Component functionality is redesigned to not need these services

## Recommendations for Wave 3

To complete the cleanup and achieve full centralization:

### Option A: Direct Manager Usage
Refactor components to use shared managers directly:
- Components import `ScrollMetricsManager`, `HeroAnimationManager`, etc.
- Remove service facades
- Update dependency injection

### Option B: Enhanced AnimationOrchestrationService
Extend `AnimationOrchestrationService` to provide:
- Scroll orchestration methods (from ScrollOrchestrationService)
- Section animation methods (from native-scroll-animation)
- Component-specific animation methods (from trabalhos-section-animation)
- Migrate components to use this unified service

### Option C: Incremental Migration
1. Migrate one component at a time
2. Start with simplest (hero-section)
3. Document pattern for others
4. Remove services as components are migrated

## Files Modified in Wave 2

### Deleted
- `src/app/services/animation/trabalhos-section-animation-refactored.service.ts`
- `src/app/services/animation/servicos-animation-refactored.service.ts`
- `src/app/services/animation/hero-animation.service.ts`

### Modified  
- `src/app/services/animation/index.ts` - Updated barrel exports

### Preserved (Still In Use)
- `src/app/services/animation/animation-orchestration.service.ts`
- `src/app/services/animation/gsap-utils.service.ts`
- `src/app/services/animation/knot-canvas.service.ts`
- `src/app/services/animation/native-scroll-animation.service.ts`
- `src/app/services/animation/ring-layout.service.ts`
- `src/app/services/animation/section-animation.service.ts`
- `src/app/services/animation/servicos-animation.service.ts`
- `src/app/services/animation/trabalhos-section-animation.service.ts`
- `src/app/services/scroll-orchestration.service.ts`

## Build Status
✅ **Build successful** - No breaking changes introduced
