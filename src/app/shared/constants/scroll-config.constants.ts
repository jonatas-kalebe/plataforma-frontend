/**
 * Scroll Configuration Constants
 * Global configuration for magnetic scroll experience
 */

// Global scroll thresholds
export const SCROLL_CONFIG = {
  // Engagement and resistance thresholds
  ENGAGE_THRESHOLD: 0.2,           // 20% - when resistance reduces and acceleration begins
  SNAP_FORWARD_THRESHOLD: 0.85,    // 85% - when forward snap triggers on pause
  SNAP_BACKWARD_THRESHOLD: 0.15,   // 15% - when backward snap triggers on pause

  // Easing and timing
  SCROLL_EASE: 'power2.inOut',     // Smooth easing for snaps
  SCROLL_EASE_DURATION_MS: 550,    // Snap animation duration

  // Velocity detection
  VELOCITY_THRESHOLD: 0,           // Snap only when velocity reaches zero (scrolling stopped)
  MOBILE_SNAP_DELAY_MS: 100,       // Additional delay on mobile after momentum ends
  DESKTOP_SNAP_DELAY_MS: 80,       // Delay on desktop

  // Scroll intention detection
  INTENTION_CHECK_INTERVAL_MS: 50,  // How often to check if scrolling stopped
  SCROLL_STOPPED_THRESHOLD_MS: 100, // No scroll activity for this long = stopped
} as const;

// Per-section overrides
export const SECTION_SCROLL_CONFIG = {
  hero: {
    // Hero uses default thresholds
  },
  filosofia: {
    // Standard behavior with optional pinning
    enablePin: true,
    pinDuration: '+=50%'
  },
  servicos: {
    // Later snap to avoid interrupting reading
    SNAP_FORWARD_THRESHOLD: 0.92,
    SNAP_BACKWARD_THRESHOLD: 0.10
  },
  trabalhos: {
    // Extended pin for scroll-controlled interactions
    enablePin: true,
    pinDuration: '+=100%'
  },
  cta: {
    // No forward snap from CTA (end of page)
    SNAP_FORWARD_THRESHOLD: null,
    // Allow backward snap with slightly higher threshold
    SNAP_BACKWARD_THRESHOLD: 0.20
  }
} as const;

// Animation intensity settings
export const SCROLL_ANIMATION_CONFIG = {
  // Hero resistance and acceleration
  HERO_RESISTANCE_MAX_OFFSET: 40,    // Max pixels elements move during resistance
  HERO_ACCELERATION_MULTIPLIER: 2,   // Acceleration factor after engage threshold
  
  // Filosofia line animation
  FILOSOFIA_WAVE_SEGMENTS: 20,       // Line drawing segments
  FILOSOFIA_WAVE_FREQUENCY_1: 3,     // Primary wave frequency
  FILOSOFIA_WAVE_FREQUENCY_2: 7,     // Secondary wave frequency
  FILOSOFIA_WAVE_AMPLITUDE_1: 30,    // Primary wave amplitude
  FILOSOFIA_WAVE_AMPLITUDE_2: 15,    // Secondary wave amplitude
  
  // Services card animations
  SERVICOS_STAGGER_DELAY: 0.1,       // Delay between card animations
  SERVICOS_DRIFT_AMPLITUDE: 5,       // Subtle drift movement amplitude
  
  // Trabalhos ring rotation
  TRABALHOS_ROTATION_MULTIPLIER: 360, // Degrees per full scroll progress
  TRABALHOS_SNAP_ANGLE_THRESHOLD: 15, // Degrees within which to snap to card
  
  // Particle system
  PARTICLE_VELOCITY_AMPLIFIER: 0.0001, // How much scroll velocity affects particles
  PARTICLE_SCROLL_COLOR_RANGE: 0x5A5A5A, // Color variation range based on scroll
  
} as const;

// Accessibility and performance
export const SCROLL_ACCESSIBILITY_CONFIG = {
  // Reduced motion overrides
  REDUCED_MOTION_SNAP_DURATION_MS: 300,  // Faster snaps for reduced motion
  REDUCED_MOTION_DISABLE_PARALLAX: true, // Disable parallax effects
  REDUCED_MOTION_DISABLE_PARTICLES: true, // Disable complex particle effects
  
  // Performance thresholds
  TARGET_FPS: 60,
  MIN_FPS_FOR_EFFECTS: 30,      // Disable heavy effects if FPS drops below this
  PERFORMANCE_CHECK_INTERVAL_MS: 1000, // How often to check performance
  
} as const;