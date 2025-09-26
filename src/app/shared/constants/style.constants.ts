/**
 * Style Constants  
 * Centralizes design tokens, spacing, typography and layout values
 */

// Spacing scale (based on Tailwind but centralized for consistency)
export const SPACING = {
  XXS: '0.125rem', // 2px
  XS: '0.25rem',   // 4px
  SM: '0.5rem',    // 8px
  MD: '0.75rem',   // 12px
  LG: '1rem',      // 16px
  XL: '1.25rem',   // 20px
  XXL: '1.5rem',   // 24px
  XXXL: '2rem',    // 32px
  
  // Section specific
  SECTION_PADDING: '1.5rem',     // 24px
  SECTION_MARGIN: '3.5rem',      // 56px
  CARD_PADDING: '2rem',          // 32px
  BUTTON_PADDING: '1rem 2rem',   // 16px 32px
} as const;

// Typography scale
export const TYPOGRAPHY = {
  // Font sizes
  FONT_SIZE: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    BASE: '1rem',     // 16px
    LG: '1.125rem',   // 18px
    XL: '1.25rem',    // 20px
    '2XL': '1.5rem',  // 24px
    '3XL': '1.875rem', // 30px
    '4XL': '2.25rem',  // 36px
    '5XL': '3rem',     // 48px
    '6XL': '3.75rem',  // 60px
    '7XL': '4.5rem',   // 72px
    '8XL': '6rem'      // 96px
  },
  
  // Font weights
  FONT_WEIGHT: {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
    EXTRABOLD: '800',
    BLACK: '900'
  },
  
  // Line heights
  LINE_HEIGHT: {
    TIGHT: '1.25',
    NORMAL: '1.5',
    RELAXED: '1.625',
    LOOSE: '2'
  }
} as const;

// Layout breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  XXL: '1536px'
} as const;

// Z-index layers
export const Z_INDEX = {
  BEHIND: -10,
  BASE: 0,
  CONTENT: 10,
  OVERLAY: 20,
  MODAL: 30,
  TOOLTIP: 40,
  DROPDOWN: 50
} as const;

// Border radius values
export const BORDER_RADIUS = {
  NONE: '0',
  SM: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  MD: '0.375rem',   // 6px
  LG: '0.5rem',     // 8px
  XL: '0.75rem',    // 12px
  XXL: '1rem',      // 16px
  FULL: '9999px'
} as const;

// Shadow configurations
export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  GLOW: '0 0 20px rgb(100 255 218 / 0.3)' // Custom glow effect
} as const;