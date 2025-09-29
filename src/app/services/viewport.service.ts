import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  private isBrowser: boolean;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.initializeViewportHeight();
      this.setupViewportListeners();
    }
  }

  /**
   * Initialize dynamic viewport height for mobile devices
   * This helps with the mobile browser address bar issue
   */
  private initializeViewportHeight(): void {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setVH();
    
    // Update on window resize with debouncing
    let resizeTimer: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setVH, 150);
    });

    // Update on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 500); // Delay to account for browser UI changes
    });
  }

  /**
   * Setup additional viewport-related listeners
   */
  private setupViewportListeners(): void {
    if (!this.isBrowser) return;

    // Handle visual viewport changes (mobile keyboard, etc.)
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!;
      
      visualViewport.addEventListener('resize', () => {
        const scale = visualViewport.scale;
        const height = visualViewport.height;
        
        // Update CSS custom property for visual viewport
        document.documentElement.style.setProperty('--visual-vh', `${height * 0.01}px`);
        document.documentElement.style.setProperty('--viewport-scale', `${scale}`);
      });
    }

    // Handle focus events that might trigger mobile keyboard
    document.addEventListener('focusin', this.handleFocusIn);
    document.addEventListener('focusout', this.handleFocusOut);
  }

  private handleFocusIn = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    
    if (this.isInputElement(target)) {
      // Add class to body to handle keyboard appearance
      document.body.classList.add('keyboard-visible');
      
      // Scroll element into view on mobile
      if (this.isMobileDevice()) {
        setTimeout(() => {
          target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 300);
      }
    }
  };

  private handleFocusOut = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    
    if (this.isInputElement(target)) {
      // Remove keyboard class after delay
      setTimeout(() => {
        document.body.classList.remove('keyboard-visible');
      }, 300);
    }
  };

  /**
   * Check if element is an input that would trigger mobile keyboard
   */
  private isInputElement(element: HTMLElement): boolean {
    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    const inputTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'];
    
    if (inputTags.includes(element.tagName)) {
      if (element.tagName === 'INPUT') {
        const inputElement = element as HTMLInputElement;
        return inputTypes.includes(inputElement.type);
      }
      return true;
    }
    
    return element.contentEditable === 'true';
  }

  /**
   * Detect if device is mobile
   */
  public isMobileDevice(): boolean {
    if (!this.isBrowser) return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }

  /**
   * Get current viewport dimensions
   */
  public getViewportDimensions(): { width: number; height: number } {
    if (!this.isBrowser) {
      return { width: 0, height: 0 };
    }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Get safe area insets for devices with notches
   */
  public getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    if (!this.isBrowser) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0
    };
  }

  /**
   * Check if device is in landscape mode
   */
  public isLandscape(): boolean {
    if (!this.isBrowser) return false;
    
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Check if device supports touch
   */
  public isTouchDevice(): boolean {
    if (!this.isBrowser) return false;
    
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get device pixel ratio
   */
  public getDevicePixelRatio(): number {
    if (!this.isBrowser) return 1;
    
    return window.devicePixelRatio || 1;
  }

  /**
   * Check if user prefers reduced motion
   */
  public prefersReducedMotion(): boolean {
    if (!this.isBrowser) return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get preferred color scheme
   */
  public getPreferredColorScheme(): 'light' | 'dark' | 'no-preference' {
    if (!this.isBrowser) return 'no-preference';
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    return 'no-preference';
  }
}