/**
 * Scroll Telemetry Service
 * Tracks scroll interactions and performance metrics
 * Respects privacy - no PII collection
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ScrollTelemetryEvent {
  event: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  frameDrops: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollTelemetryService {
  private readonly platformId = inject(PLATFORM_ID);
  private events: ScrollTelemetryEvent[] = [];
  private performanceMetrics: PerformanceMetrics = {
    fps: 60,
    avgFps: 60,
    frameDrops: 0
  };
  
  private frameCount = 0;
  private lastFrameTime = 0;
  private performanceStartTime = 0;
  private fpsHistory: number[] = [];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializePerformanceTracking();
    }
  }

  /**
   * Track section view event
   */
  trackSectionView(section: string, progressTime: number, deviceType: 'mobile' | 'desktop'): void {
    this.logEvent('section_view', {
      section,
      enter_progress_time: progressTime,
      device_type: deviceType
    });
  }

  /**
   * Track magnetic snap event
   */
  trackSnapTriggered(fromSection: string, toSection: string, direction: 'forward' | 'backward', progressAtSnap: number): void {
    this.logEvent('snap_triggered', {
      from_section: fromSection,
      to_section: toSection,
      direction,
      progress_at_snap: progressAtSnap
    });
  }

  /**
   * Track drag interactions
   */
  trackDragStart(section: string = 'trabalhos'): void {
    this.logEvent('drag_start', {
      section,
      timestamp: performance.now()
    });
  }

  trackDragEnd(section: string = 'trabalhos', durationMs: number, degreesRotated: number, snaps: number): void {
    this.logEvent('drag_end', {
      section,
      duration_ms: durationMs,
      degrees_rotated: degreesRotated,
      snaps
    });
  }

  /**
   * Track card snap in ring
   */
  trackCardSnap(cardIndex: number): void {
    this.logEvent('card_snap', {
      card_index: cardIndex
    });
  }

  /**
   * Track CTA interactions
   */
  trackCtaView(): void {
    this.logEvent('cta_view', {});
  }

  trackCtaClick(): void {
    this.logEvent('cta_click', {});
  }

  /**
   * Track accessibility settings
   */
  trackReducedMotion(enabled: boolean): void {
    this.logEvent('reduced_motion_enabled', {
      enabled
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformanceTick(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.logEvent('perf_tick', {
      fps: this.performanceMetrics.fps,
      avg_fps: this.performanceMetrics.avgFps,
      frame_drops: this.performanceMetrics.frameDrops
    });
  }

  /**
   * Get all events (for debugging/analytics)
   */
  getEvents(): ScrollTelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Clear all stored events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Export events as JSON (for analytics integration)
   */
  exportEvents(): string {
    return JSON.stringify({
      events: this.events,
      performance: this.performanceMetrics,
      exportTime: Date.now()
    });
  }

  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking(): void {
    this.performanceStartTime = performance.now();
    this.lastFrameTime = this.performanceStartTime;
    
    // Track FPS in animation loop
    const trackFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      
      if (deltaTime > 0) {
        const fps = Math.round(1000 / deltaTime);
        this.fpsHistory.push(fps);
        
        // Keep only last 100 frames for average
        if (this.fpsHistory.length > 100) {
          this.fpsHistory.shift();
        }
        
        // Update metrics
        this.performanceMetrics.fps = fps;
        this.performanceMetrics.avgFps = Math.round(
          this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length
        );
        
        // Track frame drops (below 30fps)
        if (fps < 30) {
          this.performanceMetrics.frameDrops++;
        }
      }
      
      this.lastFrameTime = currentTime;
      this.frameCount++;
      
      requestAnimationFrame(trackFrame);
    };
    
    requestAnimationFrame(trackFrame);
    
    // Report performance metrics every 5 seconds
    setInterval(() => {
      this.trackPerformanceTick();
    }, 5000);
  }

  /**
   * Log event to internal storage
   */
  private logEvent(event: string, data: Record<string, any>): void {
    const telemetryEvent: ScrollTelemetryEvent = {
      event,
      timestamp: Date.now(),
      data
    };
    
    this.events.push(telemetryEvent);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.events.length > 1000) {
      this.events.shift();
    }
    
    // Log to console in development (can be removed for production)
    if (typeof window !== 'undefined' && (window as any).location?.hostname === 'localhost') {
      console.log('📊 Scroll Telemetry:', telemetryEvent);
    }
  }
}