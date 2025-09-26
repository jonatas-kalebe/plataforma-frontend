/**
 * Section Types
 * Type definitions for section components and configuration
 */

import { SECTION_IDS } from '../constants';

export type SectionId = typeof SECTION_IDS[keyof typeof SECTION_IDS];

export interface SectionConfig {
  id: SectionId;
  name: string;
  hasAnimation: boolean;
  hasScrollTrigger: boolean;
  hasCanvas?: boolean;
  hasInteractiveElement?: boolean;
  isLastSection?: boolean;
}

export interface SectionProps {
  id: SectionId;
  className?: string;
  isVisible?: boolean;
  animationConfig?: AnimationConfig;
}

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  timeline?: any; // GSAP Timeline
}

export interface ScrollTriggerConfig {
  trigger: string;
  start: string;
  end: string;
  scrub?: boolean | number;
  toggleActions?: string;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}