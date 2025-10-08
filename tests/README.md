# E2E Tests for Trabalhos Section

## Overview

This directory contains end-to-end tests for the refactored `TrabalhosSectionAnimationService` to verify SSR-safety and browser behavior.

## Test Coverage

The E2E tests in `trabalhos-section.spec.ts` cover:

1. **SSR Safety**: Verifies no SSR-related errors (querySelector, document/window/navigator undefined)
2. **Rendering**: Confirms the trabalhos section renders correctly
3. **Intersection Observer**: Tests scroll-based animations via IoVisibleDirective
4. **Reduced Motion**: Validates respect for accessibility preferences
5. **Drag Interactions**: Tests user interactions without errors
6. **Navigation Cleanup**: Ensures proper resource cleanup
7. **Window Resize**: Handles viewport changes gracefully
8. **DOM Access**: Confirms no direct DOM access during SSR

## Running E2E Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Build and Run

1. Build the SSR application:
```bash
npm run build:ssr:frontend
```

2. Start the SSR server:
```bash
npm run serve:ssr:frontend
```

3. In another terminal, run the E2E tests:
```bash
npm run test:e2e
```

Or run specific tests:
```bash
npx playwright test tests/trabalhos-section.spec.ts
```

### Running in Different Browsers

Run in Chromium only:
```bash
npx playwright test tests/trabalhos-section.spec.ts --project=chromium
```

Run in Firefox:
```bash
npx playwright test tests/trabalhos-section.spec.ts --project=firefox
```

Run with UI mode (for debugging):
```bash
npx playwright test tests/trabalhos-section.spec.ts --ui
```

## Test Structure

### 1. SSR Error Detection
```typescript
test('should render trabalhos section without SSR errors', async ({ page }) => {
  // Monitors console for SSR-specific errors
  // Ensures no querySelector, document, window undefined errors
});
```

### 2. Visual Verification
```typescript
test('should display trabalhos section', async ({ page }) => {
  // Verifies section and key elements are visible
  // Confirms proper rendering
});
```

### 3. Intersection Observer
```typescript
test('should trigger intersection observer on scroll', async ({ page }) => {
  // Scrolls to section
  // Verifies IoVisibleDirective triggers correctly
  // No console errors during animation
});
```

### 4. Accessibility
```typescript
test('should respect reduced motion preference', async ({ page, context }) => {
  // Sets prefers-reduced-motion: reduce
  // Verifies animations respect preference
  // No errors with reduced motion enabled
});
```

### 5. User Interactions
```typescript
test('should handle drag interactions without errors', async ({ page }) => {
  // Simulates drag gestures on ring
  // Ensures haptic feedback doesn't cause errors
  // Validates smooth interactions
});
```

### 6. Cleanup
```typescript
test('should cleanup properly on navigation', async ({ page }) => {
  // Navigates to and away from section
  // Ensures destroy() is called
  // No memory leaks or orphaned listeners
});
```

### 7. Responsive Behavior
```typescript
test('should handle window resize without errors', async ({ page }) => {
  // Resizes viewport
  // Ensures responsive behavior
  // No errors on resize
});
```

### 8. DOM Access Verification
```typescript
test('should not access DOM directly during SSR', async ({ page }) => {
  // Monitors for querySelector/document warnings
  // Confirms SSR-safe implementation
});
```

## Debugging Failed Tests

### View test results:
```bash
npx playwright show-report
```

### View trace for failed test:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### Run in headed mode (see browser):
```bash
npx playwright test tests/trabalhos-section.spec.ts --headed
```

### Run with debug mode:
```bash
PWDEBUG=1 npx playwright test tests/trabalhos-section.spec.ts
```

## CI/CD Integration

For CI/CD pipelines:

```bash
# Install dependencies
npm ci

# Build
npm run build:ssr:frontend

# Install Playwright browsers in CI
npx playwright install --with-deps chromium

# Run tests
npm run test:e2e
```

## Expected Results

All 8 tests should pass:
- ✓ should render trabalhos section without SSR errors
- ✓ should display trabalhos section
- ✓ should trigger intersection observer on scroll
- ✓ should respect reduced motion preference
- ✓ should handle drag interactions without errors
- ✓ should cleanup properly on navigation
- ✓ should handle window resize without errors
- ✓ should not access DOM directly during SSR

## Troubleshooting

### Browser not installed
```bash
npx playwright install chromium
```

### Server not running
Make sure the SSR server is running on port 4000:
```bash
npm run serve:ssr:frontend
```

### Port already in use
Kill the process using port 4000:
```bash
lsof -ti:4000 | xargs kill -9
```

Then restart the server.

## Related Documentation

- Main refactoring doc: `TRABALHOS_ANIMATION_REFACTORING.md`
- Verification script: `verify-refactoring.sh`
- Unit tests: `src/app/services/animation/trabalhos-section-animation.service.spec.ts`
