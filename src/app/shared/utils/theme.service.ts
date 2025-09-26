/**
 * Theme Service  
 * Manages theme colors, utilities and design tokens
 */

import { Injectable } from '@angular/core';

// Athenity color palette (from tailwind.config.js)
export const THEME_COLORS = {
  // Primary colors
  BLUE_DEEP: '#0A192F',
  BLUE_CARD: '#112240', 
  GOLD: '#FFD700',
  GREEN_CIRCUIT: '#64FFDA',
  
  // Text colors
  TEXT_TITLE: '#CCD6F6',
  TEXT_BODY: '#8892B0',
  
  // Utility colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  
  // Transparent variations (for programmatic use)
  TRANSPARENT: 'transparent',
  CURRENT: 'currentColor'
} as const;

// Color opacity variations
export const COLOR_OPACITY = {
  '10': '10%',
  '20': '20%',
  '30': '30%',
  '40': '40%',
  '50': '50%',
  '60': '60%',
  '70': '70%',
  '80': '80%',
  '90': '90%'
} as const;

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Configuration
  private readonly THEME_COLORS = THEME_COLORS;

  /**
   * Get theme color by key
   */
  getColor(colorKey: keyof typeof THEME_COLORS): string {
    return this.THEME_COLORS[colorKey];
  }

  /**
   * Get color with opacity
   */
  getColorWithOpacity(
    colorKey: keyof typeof THEME_COLORS, 
    opacity: keyof typeof COLOR_OPACITY
  ): string {
    const baseColor = this.getColor(colorKey);
    const opacityValue = COLOR_OPACITY[opacity];
    
    // Return CSS color with opacity
    return `color-mix(in srgb, ${baseColor} ${opacityValue}, transparent)`;
  }

  /**
   * Get Tailwind color class
   */
  getTailwindColorClass(
    colorName: string, 
    property: 'bg' | 'text' | 'border' = 'bg',
    opacity?: keyof typeof COLOR_OPACITY
  ): string {
    const opacityClass = opacity ? `/${opacity}` : '';
    return `${property}-${colorName}${opacityClass}`;
  }

  /**
   * Get CSS custom property for color
   */
  getCssCustomProperty(colorKey: keyof typeof THEME_COLORS): string {
    return `var(--color-${colorKey.toLowerCase().replace('_', '-')})`;
  }

  /**
   * Generate CSS variables object for theme colors
   */
  generateCssVariables(): Record<string, string> {
    const cssVars: Record<string, string> = {};
    
    Object.entries(this.THEME_COLORS).forEach(([key, value]) => {
      const cssVarName = `--color-${key.toLowerCase().replace('_', '-')}`;
      cssVars[cssVarName] = value;
    });
    
    return cssVars;
  }

  /**
   * Get gradient CSS for hero backgrounds
   */
  getHeroGradient(): string {
    return `linear-gradient(135deg, ${this.getColor('BLUE_DEEP')} 0%, ${this.getColorWithOpacity('BLUE_CARD', '80')} 100%)`;
  }

  /**
   * Get glow effect CSS
   */
  getGlowEffect(color: keyof typeof THEME_COLORS = 'GREEN_CIRCUIT'): string {
    const baseColor = this.getColor(color);
    return `0 0 20px ${baseColor}30`;
  }

  /**
   * Get card hover effect CSS
   */
  getCardHoverEffect(): { [key: string]: string } {
    return {
      transform: 'translateY(-8px)',
      boxShadow: this.getGlowEffect(),
      borderColor: this.getColorWithOpacity('GREEN_CIRCUIT', '60')
    };
  }

  /**
   * Get button styles by type
   */
  getButtonStyles(type: 'primary' | 'secondary' | 'ghost'): { [key: string]: string } {
    const styles = {
      borderRadius: '0.75rem',
      fontWeight: '700',
      padding: '1rem 2rem',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    };

    switch (type) {
      case 'primary':
        return {
          ...styles,
          backgroundColor: this.getColor('GOLD'),
          color: this.getColor('BLUE_DEEP'),
          border: 'none',
          boxShadow: this.getGlowEffect('GOLD')
        };
      
      case 'secondary':
        return {
          ...styles,
          backgroundColor: 'transparent',
          color: this.getColor('GREEN_CIRCUIT'),
          border: `2px solid ${this.getColor('GREEN_CIRCUIT')}`,
          boxShadow: 'none'
        };
      
      case 'ghost':
        return {
          ...styles,
          backgroundColor: 'transparent',
          color: this.getColor('TEXT_BODY'),
          border: 'none',
          boxShadow: 'none'
        };
      
      default:
        return styles;
    }
  }
}