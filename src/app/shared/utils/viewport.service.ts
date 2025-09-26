/**
 * Viewport Service
 * Handles responsive utilities and viewport-related functionality
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { BREAKPOINTS } from '../constants';

export interface ViewportSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  // Configuration
  private readonly RESIZE_DEBOUNCE_TIME = 150; // ms
  
  private readonly platformId = inject(PLATFORM_ID);
  private viewportSize$ = new BehaviorSubject<ViewportSize>(this.getInitialSize());

  constructor() {
    this.initializeViewportTracking();
  }

  /**
   * Get viewport size as Observable
   */
  get size(): Observable<ViewportSize> {
    return this.viewportSize$.asObservable();
  }

  /**
   * Get current viewport size
   */
  get currentSize(): ViewportSize {
    return this.viewportSize$.value;
  }

  /**
   * Get mobile state as Observable
   */
  get isMobile(): Observable<boolean> {
    return this.size.pipe(
      map(size => size.isMobile),
      distinctUntilChanged()
    );
  }

  /**
   * Get tablet state as Observable
   */
  get isTablet(): Observable<boolean> {
    return this.size.pipe(
      map(size => size.isTablet),
      distinctUntilChanged()
    );
  }

  /**
   * Get desktop state as Observable
   */
  get isDesktop(): Observable<boolean> {
    return this.size.pipe(
      map(size => size.isDesktop),
      distinctUntilChanged()
    );
  }

  /**
   * Get initial viewport size
   */
  private getInitialSize(): ViewportSize {
    if (!isPlatformBrowser(this.platformId)) {
      // Server-side defaults
      return {
        width: 1920,
        height: 1080,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeScreen: true
      };
    }

    return this.calculateViewportSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Calculate viewport size and breakpoint states
   */
  private calculateViewportSize(width: number, height: number): ViewportSize {
    const smWidth = parseInt(BREAKPOINTS.SM);
    const mdWidth = parseInt(BREAKPOINTS.MD);
    const lgWidth = parseInt(BREAKPOINTS.LG);
    const xlWidth = parseInt(BREAKPOINTS.XL);

    return {
      width,
      height,
      isMobile: width < mdWidth,
      isTablet: width >= mdWidth && width < lgWidth,
      isDesktop: width >= lgWidth,
      isLargeScreen: width >= xlWidth
    };
  }

  /**
   * Initialize viewport tracking
   */
  private initializeViewportTracking(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Listen to window resize events
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(this.RESIZE_DEBOUNCE_TIME),
        map(() => ({ 
          width: window.innerWidth, 
          height: window.innerHeight 
        }))
      )
      .subscribe(({ width, height }) => {
        const newSize = this.calculateViewportSize(width, height);
        this.viewportSize$.next(newSize);
      });
  }

  /**
   * Check if viewport matches a specific breakpoint
   */
  isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
    const size = this.currentSize;
    const breakpointWidth = parseInt(BREAKPOINTS[breakpoint]);
    
    switch (breakpoint) {
      case 'SM':
        return size.width >= breakpointWidth;
      case 'MD':
        return size.width >= breakpointWidth;
      case 'LG':
        return size.width >= breakpointWidth;
      case 'XL':
        return size.width >= breakpointWidth;
      case 'XXL':
        return size.width >= breakpointWidth;
      default:
        return false;
    }
  }

  /**
   * Get responsive class suffix based on viewport
   */
  getResponsiveClassSuffix(): string {
    const size = this.currentSize;
    
    if (size.isMobile) return 'sm';
    if (size.isTablet) return 'md';
    if (size.isDesktop && !size.isLargeScreen) return 'lg';
    return 'xl';
  }
}