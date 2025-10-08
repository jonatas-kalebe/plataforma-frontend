import { Injectable } from '@angular/core';

/**
 * RingLayoutService
 * 
 * Provides pure functions for ring layout calculations.
 * All functions are stateless and do not access DOM or Window objects.
 */
@Injectable({
  providedIn: 'root'
})
export class RingLayoutService {
  /**
   * Computes the angular step in degrees between items in a ring layout.
   * 
   * @param count - Number of items in the ring (minimum 1)
   * @returns Angular step in degrees (360° / count)
   * 
   * @example
   * computeStepDeg(8) // returns 45
   * computeStepDeg(1) // returns 360
   */
  computeStepDeg(count: number): number {
    const safeCount = Math.max(1, count);
    return 360 / safeCount;
  }

  /**
   * Computes the minimum radius needed to maintain a specified gap between cards.
   * Uses chord length formula to ensure proper spacing.
   * 
   * @param cardW - Width of each card in pixels
   * @param gap - Minimum gap between cards in pixels
   * @param count - Number of cards in the ring
   * @returns Minimum radius in pixels to maintain the gap, or 0 if count <= 1
   * 
   * @example
   * computeSpacingRadius(200, 24, 8) // returns calculated radius for 8 cards
   * computeSpacingRadius(200, 0, 8) // returns radius with no gap
   * computeSpacingRadius(200, 24, 1) // returns 0 (no spacing needed for single item)
   */
  computeSpacingRadius(cardW: number, gap: number, count: number): number {
    const safeCount = Math.max(1, count);
    
    // For a single item, no spacing radius is needed
    if (safeCount === 1) {
      return 0;
    }

    // Calculate the angular step in radians
    const stepRad = (2 * Math.PI) / safeCount;
    
    // The chord length must accommodate the card width plus the gap
    const requiredChord = cardW + gap;
    
    // Use the chord-to-radius formula: chord = 2 * r * sin(θ/2)
    // Therefore: r = chord / (2 * sin(θ/2))
    const denom = 2 * Math.sin(stepRad / 2);
    
    // Avoid division by zero
    const spacingRadius = denom > 0 ? requiredChord / denom : 0;
    
    return spacingRadius;
  }

  /**
   * Computes the effective radius by taking the maximum of base radius and spacing radius.
   * This ensures the ring is large enough to accommodate both the desired size
   * and the minimum spacing requirements.
   * 
   * @param base - Base radius in pixels
   * @param spacing - Spacing radius in pixels (from computeSpacingRadius)
   * @returns The effective radius (maximum of base and spacing)
   * 
   * @example
   * effectiveRadius(200, 250) // returns 250
   * effectiveRadius(300, 250) // returns 300
   * effectiveRadius(200, 0) // returns 200
   */
  effectiveRadius(base: number, spacing: number): number {
    return Math.max(base, spacing || 0);
  }
}
