/**
 * Animation Constants
 * Centralizes all animation timing, easing and configuration
 */

// Animation durations (in seconds)
export const ANIMATION_DURATIONS = {
  // Quick interactions
  HOVER: 0.3,
  CLICK: 0.2,
  
  // Section transitions
  SECTION_ENTER: 1.5,
  SECTION_EXIT: 0.8,
  
  // Specific animations
  HERO_FADE_IN: 2,
  KNOT_DRAW: 1.5,
  SERVICE_CARD_HOVER: 0.3,
  PARTICLE_FADE: 0.8,
  
  // Reduced motion
  REDUCED_MOTION: 0.3
} as const;

// GSAP easing functions
export const ANIMATION_EASING = {
  // Standard easing
  EASE_OUT: 'power2.out',
  EASE_IN: 'power2.in', 
  EASE_IN_OUT: 'power2.inOut',
  
  // Smooth transitions
  SMOOTH: 'power1.out',
  BOUNCE: 'back.out(1.7)',
  ELASTIC: 'elastic.out(1, 0.3)',
  
  // Special cases
  LINEAR: 'none',
  CIRC_OUT: 'circ.out'
} as const;

// ScrollTrigger configuration
export const SCROLL_TRIGGER_CONFIG = {
  // Start positions  
  START_TOP_BOTTOM: 'top bottom',
  START_CENTER_CENTER: 'center center',
  START_BOTTOM_TOP: 'bottom top',
  
  // End positions
  END_TOP_TOP: 'top top',
  END_CENTER_CENTER: 'center center',
  END_BOTTOM_TOP: 'bottom top',
  
  // Scrub values
  SCRUB_SMOOTH: 1,
  SCRUB_FAST: 0.5,
  SCRUB_SLOW: 2,
  
  // Snap configuration
  SNAP_SENSITIVITY: 0.1,
  SNAP_DIRECTIONAL: true
} as const;

// Timeline configuration
export const TIMELINE_CONFIG = {
  // Stagger timing
  STAGGER_SHORT: 0.1,
  STAGGER_MEDIUM: 0.2, 
  STAGGER_LONG: 0.3,
  
  // Delay timing
  DELAY_SHORT: 0.2,
  DELAY_MEDIUM: 0.5,
  DELAY_LONG: 1
} as const;