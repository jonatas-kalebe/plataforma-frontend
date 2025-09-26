/**
 * Motion Preference Service
 * Handles reduced motion detection and animation preferences
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MotionPreferenceService {
  // Configuration
  private readonly REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  
  private readonly platformId = inject(PLATFORM_ID);
  private prefersReducedMotion$ = new BehaviorSubject<boolean>(false);
  private mediaQueryList?: MediaQueryList;

  constructor() {
    this.initializeMotionPreference();
  }

  /**
   * Get current reduced motion preference as Observable
   */
  get prefersReducedMotion(): Observable<boolean> {
    return this.prefersReducedMotion$.asObservable();
  }

  /**
   * Get current reduced motion preference as boolean
   */
  get currentPreference(): boolean {
    return this.prefersReducedMotion$.value;
  }

  /**
   * Initialize motion preference detection
   */
  private initializeMotionPreference(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // On server, default to reduced motion for better performance
      this.prefersReducedMotion$.next(true);
      return;
    }

    try {
      // Check for reduced motion preference
      this.mediaQueryList = window.matchMedia(this.REDUCED_MOTION_QUERY);
      
      // Set initial value
      this.updateMotionPreference(this.mediaQueryList.matches);
      
      // Listen for changes
      this.mediaQueryList.addEventListener('change', (event) => {
        this.updateMotionPreference(event.matches);
      });
    } catch (error) {
      console.warn('MotionPreferenceService: Unable to detect motion preferences:', error);
      // Default to no reduced motion
      this.prefersReducedMotion$.next(false);
    }
  }

  /**
   * Update motion preference and notify subscribers
   */
  private updateMotionPreference(prefersReduced: boolean): void {
    this.prefersReducedMotion$.next(prefersReduced);
  }

  /**
   * Get animation duration based on motion preference
   */
  getAnimationDuration(normalDuration: number, reducedDuration: number = 0.3): number {
    return this.currentPreference ? reducedDuration : normalDuration;
  }

  /**
   * Get GSAP configuration object with motion preferences applied
   */
  getGsapConfig(duration: number, ease: string = 'power2.out'): { duration: number; ease: string } {
    return {
      duration: this.getAnimationDuration(duration),
      ease: this.currentPreference ? 'none' : ease
    };
  }

  /**
   * Cleanup resources
   */
  ngOnDestroy(): void {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', () => {});
    }
  }
}