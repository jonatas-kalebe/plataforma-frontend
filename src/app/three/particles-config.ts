/**
 * Particles Configuration
 * Centralizes particle system parameters by breakpoint and accessibility preferences
 * 
 * Mobile-first approach: Reduces resource usage on limited devices
 * Accessibility: Respects prefers-reduced-motion preferences
 * 
 * @see https://angular.dev/best-practices/runtime-performance
 * @see https://tailwindcss.com/docs/responsive-design
 */

/**
 * Particle configuration profile interface
 */
export interface ParticleProfile {
  /** Number of particles to render */
  count: number;
  /** Gyroscope position gain (camera movement responsiveness) */
  gyroPositionGain: number;
  /** Gyroscope spin gain (rotation responsiveness) */
  gyroSpinGain: number;
  /** Base particle size in pixels */
  particleSize: number;
  /** Base opacity (0-1) */
  opacity: number;
  /** Maximum interaction radius for mouse/touch effects */
  maxInteractionRadius: number;
  /** Maximum force applied by interactions */
  maxForce: number;
  /** Friction coefficient for particle velocity decay */
  friction: number;
  /** Enable gyroscope interactions */
  enableGyro: boolean;
  /** Enable mouse/touch interactions */
  enableInteractions: boolean;
  /** Enable animations and rotation */
  enableAnimations: boolean;
}

/**
 * Mobile preset (< 768px)
 * Optimized for phones with limited resources
 * - Fewer particles to reduce computational load
 * - Reduced interaction complexity
 * - Smaller particle size for better visibility on small screens
 */
export const mobile: Readonly<ParticleProfile> = {
  count: 80,
  gyroPositionGain: 0.02,
  gyroSpinGain: 0.012,
  particleSize: 1.0,
  opacity: 0.5,
  maxInteractionRadius: 12,
  maxForce: 0.5,
  friction: 0.96,
  enableGyro: true,
  enableInteractions: true,
  enableAnimations: true
} as const;

/**
 * Tablet preset (768px - 1023px)
 * Balanced configuration for mid-range devices
 * - Moderate particle count
 * - Full interaction capabilities
 * - Balanced performance vs visual quality
 */
export const tablet: Readonly<ParticleProfile> = {
  count: 120,
  gyroPositionGain: 0.02,
  gyroSpinGain: 0.012,
  particleSize: 1.2,
  opacity: 0.6,
  maxInteractionRadius: 15,
  maxForce: 0.6,
  friction: 0.96,
  enableGyro: false,
  enableInteractions: true,
  enableAnimations: true
} as const;

/**
 * Desktop preset (>= 1024px)
 * Full visual experience for powerful devices
 * - Maximum particle count for rich visuals
 * - Enhanced interactions
 * - Full animation capabilities
 */
export const desktop: Readonly<ParticleProfile> = {
  count: 150,
  gyroPositionGain: 0.02,
  gyroSpinGain: 0.012,
  particleSize: 1.2,
  opacity: 0.6,
  maxInteractionRadius: 15,
  maxForce: 0.6,
  friction: 0.96,
  enableGyro: false,
  enableInteractions: true,
  enableAnimations: true
} as const;

/**
 * Reduced motion preset
 * Respects prefers-reduced-motion user preference
 * - Minimal particle count for static display
 * - All interactions disabled
 * - No animations or movement
 * - Static render only
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 */
export const reduced: Readonly<ParticleProfile> = {
  count: 50,
  gyroPositionGain: 0,
  gyroSpinGain: 0,
  particleSize: 1.0,
  opacity: 0.4,
  maxInteractionRadius: 0,
  maxForce: 0,
  friction: 1.0,
  enableGyro: false,
  enableInteractions: false,
  enableAnimations: false
} as const;

/**
 * Get particle configuration based on viewport width and motion preference
 * 
 * @param viewportWidth Current viewport width in pixels
 * @param prefersReducedMotion User's motion preference
 * @returns Appropriate particle configuration profile
 * 
 * @example
 * ```typescript
 * const config = getParticleConfig(window.innerWidth, matchMedia('(prefers-reduced-motion: reduce)').matches);
 * ```
 */
export function getParticleConfig(
  viewportWidth: number,
  prefersReducedMotion: boolean = false
): Readonly<ParticleProfile> {
  // Always respect reduced motion preference
  if (prefersReducedMotion) {
    return reduced;
  }

  // Mobile-first breakpoints (matching Tailwind config)
  // md: 768px, lg: 1024px
  if (viewportWidth < 768) {
    return mobile;
  } else if (viewportWidth < 1024) {
    return tablet;
  } else {
    return desktop;
  }
}

/**
 * All available particle profiles for testing and reference
 */
export const profiles = {
  mobile,
  tablet,
  desktop,
  reduced
} as const;
