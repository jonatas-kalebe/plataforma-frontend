/**
 * Common Types
 * Shared type definitions across the application
 */

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type Color = 'primary' | 'secondary' | 'accent' | 'neutral';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type Position = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface ComponentProps {
  id?: string;
  className?: string;
  style?: { [key: string]: any };
  'data-testid'?: string;
}

export interface ServiceItem {
  title: string;
  description: string;
  icon?: string;
  color?: Color;
}

export interface CallToAction {
  label: string;
  href: string;
  variant?: ButtonVariant;
  size?: Size;
  onClick?: () => void;
}

export interface ResponsiveConfig<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
}