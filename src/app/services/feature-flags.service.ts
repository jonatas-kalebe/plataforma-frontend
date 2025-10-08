/**
 * FeatureFlagsService
 * Provides centralized control over experimental features
 * Supports safe defaults with override capability via dependency injection
 * 
 * Features:
 * - ring3d: 3D ring carousel visualization
 * - particles: Particle background effects
 * - haptics: Haptic/vibration feedback
 * - listSnap: List snapping behavior
 * 
 * @see https://angular.dev/guide/architecture
 * @see https://angular.dev/best-practices/runtime-performance
 */

import { Injectable, InjectionToken, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Configuration interface for feature flags
 */
export interface FeatureFlagsConfig {
  /** Enable 3D ring visualization */
  ring3d: boolean;
  
  /** Enable particle background effects */
  particles: boolean;
  
  /** Enable haptic/vibration feedback */
  haptics: boolean;
  
  /** Enable list snapping behavior */
  listSnap: boolean;
}

/**
 * Default feature flags configuration
 * All features enabled by default for progressive enhancement
 */
const DEFAULT_FEATURE_FLAGS: FeatureFlagsConfig = {
  ring3d: true,
  particles: true,
  haptics: true,
  listSnap: true,
};

/**
 * Injection token for feature flags configuration override
 * Use this token to provide custom feature flags configuration
 * 
 * @example
 * ```typescript
 * providers: [
 *   {
 *     provide: FEATURE_FLAGS_CONFIG,
 *     useValue: { ring3d: false, particles: true, haptics: true, listSnap: true }
 *   }
 * ]
 * ```
 */
export const FEATURE_FLAGS_CONFIG = new InjectionToken<Partial<FeatureFlagsConfig>>(
  'FEATURE_FLAGS_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({})
  }
);

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagsService {
  private readonly configOverride = inject(FEATURE_FLAGS_CONFIG, { optional: true });
  
  private readonly flags: FeatureFlagsConfig;
  private readonly flags$ = new BehaviorSubject<FeatureFlagsConfig>(DEFAULT_FEATURE_FLAGS);

  constructor() {
    // Merge default flags with any provided overrides
    this.flags = {
      ...DEFAULT_FEATURE_FLAGS,
      ...(this.configOverride || {})
    };
    
    // Update observable with final configuration
    this.flags$.next(this.flags);
  }

  /**
   * Get all feature flags as an observable
   * @returns Observable<FeatureFlagsConfig> - Reactive stream of feature flags
   */
  public getFlags$(): Observable<FeatureFlagsConfig> {
    return this.flags$.asObservable();
  }

  /**
   * Get current feature flags configuration
   * @returns Readonly<FeatureFlagsConfig> - Current feature flags (immutable)
   */
  public getFlags(): Readonly<FeatureFlagsConfig> {
    return { ...this.flags };
  }

  /**
   * Check if 3D ring visualization is enabled
   * @returns boolean - true if ring3d feature is enabled
   */
  public isRing3dEnabled(): boolean {
    return this.flags.ring3d;
  }

  /**
   * Check if particle background effects are enabled
   * @returns boolean - true if particles feature is enabled
   */
  public isParticlesEnabled(): boolean {
    return this.flags.particles;
  }

  /**
   * Check if haptic feedback is enabled
   * @returns boolean - true if haptics feature is enabled
   */
  public isHapticsEnabled(): boolean {
    return this.flags.haptics;
  }

  /**
   * Check if list snapping behavior is enabled
   * @returns boolean - true if listSnap feature is enabled
   */
  public isListSnapEnabled(): boolean {
    return this.flags.listSnap;
  }

  /**
   * Check if a specific feature is enabled by name
   * @param featureName - Name of the feature to check
   * @returns boolean - true if feature is enabled
   */
  public isFeatureEnabled(featureName: keyof FeatureFlagsConfig): boolean {
    return this.flags[featureName];
  }
}
