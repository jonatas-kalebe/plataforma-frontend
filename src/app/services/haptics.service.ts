/**
 * HapticsService
 * Provides safe, feature-detected vibration feedback for drag/snap gestures
 * Ensures no-op behavior when Vibration API is unavailable (SSR, unsupported browsers)
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 * @see https://angular.dev/best-practices/runtime-performance
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Type for vibration patterns
 * Can be a single duration (number) or an array of durations (pattern)
 */
export type VibrationPattern = number | number[] | readonly number[];

@Injectable({
  providedIn: 'root'
})
export class HapticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser: boolean;
  private readonly isSupported: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Check if Vibration API is available and is a function
    this.isSupported = this.isBrowser && 
                       typeof navigator !== 'undefined' && 
                       'vibrate' in navigator &&
                       typeof navigator.vibrate === 'function';
  }

  /**
   * Trigger haptic vibration with specified duration or pattern
   * No-op when Vibration API is unavailable
   * 
   * @param pattern - Duration in milliseconds or array of durations for pattern
   * @returns boolean - true if vibration was triggered, false if not supported
   * 
   * @example
   * // Single vibration (50ms)
   * haptics.vibrate(50);
   * 
   * @example
   * // Pattern: vibrate 200ms, pause 100ms, vibrate 200ms
   * haptics.vibrate([200, 100, 200]);
   */
  public vibrate(pattern: VibrationPattern): boolean {
    if (!this.isSupported) {
      return false;
    }

    try {
      // Call navigator.vibrate() - returns boolean indicating success
      // Ensure compatibility with Vibration API by converting readonly arrays to mutable
      const vibratePattern: number | number[] = Array.isArray(pattern) 
        ? [...pattern]  // Create mutable copy of array
        : pattern as number;  // Type assertion for number
      const result = navigator.vibrate(vibratePattern);
      return result;
    } catch (error) {
      // Silently handle any errors (some browsers may throw)
      console.warn('HapticsService: Vibration request failed', error);
      return false;
    }
  }

  /**
   * Cancel any ongoing vibration
   * No-op when Vibration API is unavailable
   * 
   * @returns boolean - true if cancellation was successful, false if not supported
   */
  public cancel(): boolean {
    if (!this.isSupported) {
      return false;
    }

    try {
      // Calling vibrate(0) or vibrate([]) cancels ongoing vibration
      const result = navigator.vibrate(0);
      return result;
    } catch (error) {
      console.warn('HapticsService: Vibration cancellation failed', error);
      return false;
    }
  }

  /**
   * Check if haptic feedback is supported on current platform
   * 
   * @returns boolean - true if Vibration API is available
   */
  public isHapticsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Predefined haptic patterns for common interactions
   */
  public readonly patterns = {
    /** Light tap feedback (50ms) */
    light: 50,
    
    /** Medium tap feedback (100ms) */
    medium: 100,
    
    /** Heavy tap feedback (200ms) */
    heavy: 200,
    
    /** Double tap pattern */
    doubleTap: [50, 100, 50],
    
    /** Success pattern */
    success: [100, 50, 100],
    
    /** Error pattern */
    error: [200, 100, 200, 100, 200],
    
    /** Selection feedback (quick tap) */
    selection: 30,
    
    /** Snap feedback for gesture completion */
    snap: [30, 20, 50],
  } as const;
}
