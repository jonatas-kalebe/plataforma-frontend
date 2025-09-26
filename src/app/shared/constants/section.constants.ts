/**
 * Section Constants
 * Centralizes section configuration for consistent navigation and identification
 */

// Section IDs and navigation order
export const SECTION_IDS = {
  HERO: 'hero',
  FILOSOFIA: 'filosofia', 
  SERVICOS: 'servicos',
  TRABALHOS: 'trabalhos',
  CTA: 'cta'
} as const;

// Navigation order
export const SECTION_ORDER = [
  SECTION_IDS.HERO,
  SECTION_IDS.FILOSOFIA,
  SECTION_IDS.SERVICOS,
  SECTION_IDS.TRABALHOS,
  SECTION_IDS.CTA
] as const;

// Section metadata
export const SECTION_METADATA = {
  [SECTION_IDS.HERO]: {
    name: 'Hero',
    hasAnimation: true,
    hasScrollTrigger: true
  },
  [SECTION_IDS.FILOSOFIA]: {
    name: 'Filosofia',
    hasAnimation: true,
    hasScrollTrigger: true,
    hasCanvas: true
  },
  [SECTION_IDS.SERVICOS]: {
    name: 'Serviços',
    hasAnimation: true,
    hasScrollTrigger: true
  },
  [SECTION_IDS.TRABALHOS]: {
    name: 'Trabalhos', 
    hasAnimation: true,
    hasScrollTrigger: true,
    hasInteractiveElement: true
  },
  [SECTION_IDS.CTA]: {
    name: 'Call to Action',
    hasAnimation: true,
    hasScrollTrigger: true,
    isLastSection: true
  }
} as const;

export type SectionId = typeof SECTION_IDS[keyof typeof SECTION_IDS];