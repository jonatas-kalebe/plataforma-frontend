/**
 * ReducedMotionService
 * Exposes an observable of user motion preferences (reduced motion)
 * Observes changes via matchMedia and ensures proper cleanup
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @see https://angular.dev/best-practices/a11y
 */

import { Injectable, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReducedMotionService implements OnDestroy {
  private readonly REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  private readonly platformId = inject(PLATFORM_ID);
  
  private readonly prefersReducedMotion$ = new BehaviorSubject<boolean>(false);
  private mediaQueryList?: MediaQueryList;
  private changeHandler?: (event: MediaQueryListEvent) => void;

  constructor() {
    this.initializeMotionPreference();
  }

  /**
   * Get an observable of the user's reduced motion preference
   * @returns Observable<boolean> - true if user prefers reduced motion
   */
  public getPrefersReducedMotion(): Observable<boolean> {
    return this.prefersReducedMotion$.asObservable();
  }

  /**
   * Get the current reduced motion preference value
   * @returns boolean - true if user prefers reduced motion
   */
  public getCurrentPreference(): boolean {
    return this.prefersReducedMotion$.value;
  }

  /**
   * Initialize motion preference detection using matchMedia
   * On server side, defaults to reduced motion for better performance
   */
  private initializeMotionPreference(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // On server, default to reduced motion for better performance
      this.prefersReducedMotion$.next(true);
      return;
    }

    try {
      // Create MediaQueryList for reduced motion preference
      this.mediaQueryList = window.matchMedia(this.REDUCED_MOTION_QUERY);
      
      // Set initial value
      this.updateMotionPreference(this.mediaQueryList.matches);
      
      // Create and store change handler for proper cleanup
      this.changeHandler = (event: MediaQueryListEvent) => {
        this.updateMotionPreference(event.matches);
      };
      
      // Listen for changes in motion preference
      this.mediaQueryList.addEventListener('change', this.changeHandler);
    } catch (error) {
      console.warn('ReducedMotionService: Unable to detect motion preferences:', error);
      // Default to no reduced motion on error
      this.prefersReducedMotion$.next(false);
    }
  }

  /**
   * Update motion preference and notify all subscribers
   * @param prefersReduced - true if user prefers reduced motion
   */
  private updateMotionPreference(prefersReduced: boolean): void {
    this.prefersReducedMotion$.next(prefersReduced);
  }

  /**
   * Cleanup resources to prevent memory leaks
   * Removes event listener and completes the observable
   */
  ngOnDestroy(): void {
    if (this.mediaQueryList && this.changeHandler) {
      this.mediaQueryList.removeEventListener('change', this.changeHandler);
    }
    this.prefersReducedMotion$.complete();
  }
}
