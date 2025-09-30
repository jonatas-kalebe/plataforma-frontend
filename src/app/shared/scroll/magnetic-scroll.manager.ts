import { ScrollSection } from './scroll-metrics.manager';

export type SnapDirection = 'forward' | 'backward' | null;

export interface SnapScrollConfig {
  /** Delay (ms) after the last scroll event before forcing a snap */
  scrollStopDelayMs: number;
  /** Minimum velocity considered meaningful for resolving direction */
  velocityNoiseThreshold: number;
  /** Velocity below which we assume the user wants to settle into a section */
  settleVelocityThreshold: number;
  /** Progress threshold in the active section to snap to the next one */
  forwardSnapProgress: number;
  /** Progress threshold in the active section to snap to the previous one */
  backwardSnapProgress: number;
  /** Minimum difference in section progress to infer direction */
  progressDirectionThreshold: number;
  /** Debounce delay (ms) before triggering a snap after the condition matches */
  snapDebounceMs: number;
  /** Duration (ms) of the smooth scroll animation */
  snapAnimationDurationMs: number;
  /** Optional easing function for the snap animation */
  easingFn?: (t: number) => number;
  /** Reference point inside the viewport (0 - top, 1 - bottom) used to evaluate proximity */
  snapReferencePoint: number;
}

export const DEFAULT_SNAP_SCROLL_CONFIG: SnapScrollConfig = {
  scrollStopDelayMs: 180,
  velocityNoiseThreshold: 0.25,
  settleVelocityThreshold: 0.6,
  forwardSnapProgress: 0.82,
  backwardSnapProgress: 0.18,
  progressDirectionThreshold: 0.01,
  snapDebounceMs: 80,
  snapAnimationDurationMs: 750,
  easingFn: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  snapReferencePoint: 0.5
};

export class MagneticScrollManager {
  private readonly config: SnapScrollConfig;

  private lastSections: ScrollSection[] = [];
  private lastVelocity = 0;
  private lastDirection: SnapDirection = null;
  private lastProgressBySection = new Map<string, number>();
  private stopTimerId: number | null = null;
  private pendingSnapId: number | null = null;
  private animationFrameId: number | null = null;
  private isSnapping = false;

  private previousScrollBehaviorHtml: string | null = null;
  private previousScrollBehaviorBody: string | null = null;

  constructor(
    private readonly prefersReducedMotion: boolean = false,
    config: Partial<SnapScrollConfig> = {}
  ) {
    this.config = { ...DEFAULT_SNAP_SCROLL_CONFIG, ...config };
  }

  /** Registers the current input mode. Reserved for future custom behaviours. */
  setInputMode(_mode: 'mouse' | 'touch' | 'unknown'): void {
    // No-op for now. Kept for API compatibility.
  }

  /**
   * Detect user intention by analysing velocity. Called on every scroll event.
   */
  detectScrollIntention(velocity: number): void {
    if (this.prefersReducedMotion) return;

    this.lastVelocity = velocity || 0;

    if (Math.abs(this.lastVelocity) > this.config.velocityNoiseThreshold) {
      this.lastDirection = this.lastVelocity > 0 ? 'forward' : 'backward';
    }

    this.scheduleScrollStopCheck();
  }

  /**
   * Schedules a debounced snap when scroll activity stops.
   */
  startScrollStopCheck(): void {
    if (this.prefersReducedMotion) return;
    this.scheduleScrollStopCheck();
  }

  /**
   * Analyse the current progress of each section and trigger snapping if needed.
   */
  checkMagneticSnap(sections: ScrollSection[]): boolean {
    if (this.prefersReducedMotion) {
      this.lastSections = sections;
      return false;
    }

    this.lastSections = sections;
    const activeIndex = this.findDominantSection(sections);
    if (activeIndex === -1) return false;

    const activeSection = sections[activeIndex];
    const direction = this.resolveDirection(activeIndex, activeSection.progress ?? 0);
    const velocityMagnitude = Math.abs(this.lastVelocity);

    if (this.isSnapping) return false;

    if (direction === 'forward') {
      if (activeSection.progress != null && activeSection.progress >= this.config.forwardSnapProgress) {
        const next = this.getSection(sections, activeIndex + 1);
        if (next) {
          this.queueSnap(next);
          return true;
        }
      }
    } else if (direction === 'backward') {
      if (activeSection.progress != null && activeSection.progress <= this.config.backwardSnapProgress) {
        const previous = this.getSection(sections, activeIndex - 1);
        if (previous) {
          this.queueSnap(previous);
          return true;
        }
      }
    }

    if (velocityMagnitude <= this.config.settleVelocityThreshold) {
      const target = this.pickClosestSection(sections);
      if (target && target !== activeSection) {
        this.queueSnap(target);
        return true;
      }
    }

    return false;
  }

  /**
   * Programmatic scroll to a section.
   */
  scrollToSection(sectionId: string, durationSec: number = 1): void {
    const element = document.querySelector<HTMLElement>(`#${sectionId}`);
    if (!element) return;

    const targetY = this.getElementPageY(element);
    if (this.prefersReducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }

    const duration = Math.max(0, durationSec * 1000);
    this.startSmoothScroll(targetY, duration || this.config.snapAnimationDurationMs);
  }

  /**
   * Cleanup resources and cancel pending animations.
   */
  destroy(): void {
    this.clearStopTimer();
    this.clearPendingSnap();
    this.cancelAnimation();
    this.lastSections = [];
    this.lastProgressBySection.clear();
    this.lastDirection = null;
    this.lastVelocity = 0;
  }

  private scheduleScrollStopCheck(): void {
    this.clearStopTimer();
    if (this.prefersReducedMotion) return;

    this.stopTimerId = window.setTimeout(() => {
      this.stopTimerId = null;
      this.onScrollSettled();
    }, this.config.scrollStopDelayMs);
  }

  private onScrollSettled(): void {
    if (this.prefersReducedMotion || this.isSnapping) return;
    if (!this.lastSections.length) return;

    const target = this.pickClosestSection(this.lastSections);
    if (!target) return;

    const activeIndex = this.findDominantSection(this.lastSections);
    const active = activeIndex !== -1 ? this.lastSections[activeIndex] : null;
    if (active && target === active) {
      // Already aligned with best section.
      return;
    }

    this.queueSnap(target);
  }

  private queueSnap(section: ScrollSection): void {
    if (!section.element) return;

    this.clearPendingSnap();
    this.pendingSnapId = window.setTimeout(() => {
      this.pendingSnapId = null;
      this.snapToSection(section);
    }, this.config.snapDebounceMs);
  }

  private snapToSection(section: ScrollSection): void {
    if (!section.element) return;

    const targetY = this.getElementPageY(section.element);
    if (this.prefersReducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }

    this.startSmoothScroll(targetY, this.config.snapAnimationDurationMs);
  }

  private startSmoothScroll(targetY: number, durationMs: number): void {
    this.cancelAnimation();
    this.isSnapping = true;
    this.disableNativeSmoothScroll();

    const startY = window.scrollY;
    const distance = targetY - startY;

    if (durationMs <= 0 || Math.abs(distance) < 1) {
      window.scrollTo(0, targetY);
      this.finishAnimation();
      return;
    }

    const startTs = performance.now();
    const ease = this.config.easingFn ?? DEFAULT_SNAP_SCROLL_CONFIG.easingFn!;

    const step = () => {
      const now = performance.now();
      const progress = Math.min(1, (now - startTs) / durationMs);
      const eased = ease(progress);
      const y = startY + distance * eased;
      window.scrollTo(0, Math.round(y));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.finishAnimation();
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }

  private finishAnimation(): void {
    this.cancelAnimation();
  }

  private cancelAnimation(restore = true): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isSnapping = false;
    if (restore) {
      this.restoreNativeSmoothScroll();
    }
  }

  private clearStopTimer(): void {
    if (this.stopTimerId) {
      clearTimeout(this.stopTimerId);
      this.stopTimerId = null;
    }
  }

  private clearPendingSnap(): void {
    if (this.pendingSnapId) {
      clearTimeout(this.pendingSnapId);
      this.pendingSnapId = null;
    }
  }

  private findDominantSection(sections: ScrollSection[]): number {
    let bestIndex = -1;
    let bestScore = -Infinity;

    sections.forEach((section, index) => {
      const progress = section.progress ?? 0;
      const score = 1 - Math.abs(progress - 0.5);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestIndex;
  }

  private resolveDirection(index: number, progress: number): SnapDirection {
    if (Math.abs(this.lastVelocity) > this.config.velocityNoiseThreshold) {
      this.lastDirection = this.lastVelocity > 0 ? 'forward' : 'backward';
      return this.lastDirection;
    }

    const key = this.getSectionKey(index);
    const previousProgress = this.lastProgressBySection.get(key) ?? progress;
    this.lastProgressBySection.set(key, progress);

    const delta = progress - previousProgress;
    if (Math.abs(delta) > this.config.progressDirectionThreshold) {
      this.lastDirection = delta > 0 ? 'forward' : 'backward';
      return this.lastDirection;
    }

    return this.lastDirection;
  }

  private pickClosestSection(sections: ScrollSection[]): ScrollSection | null {
    if (!sections.length) return null;

    let closest: ScrollSection | null = null;
    let smallestDistance = Infinity;
    const viewportReference = window.innerHeight * this.config.snapReferencePoint;

    sections.forEach(section => {
      const element = section.element;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top - viewportReference);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closest = section;
      }
    });

    return closest;
  }

  private getSection(sections: ScrollSection[], index: number): ScrollSection | null {
    if (index < 0 || index >= sections.length) return null;
    return sections[index];
  }

  private getSectionKey(index: number): string {
    const section = this.lastSections[index];
    return section ? section.id ?? `section-${index}` : `section-${index}`;
  }

  private getElementPageY(element: Element): number {
    const rect = element.getBoundingClientRect();
    return Math.round(window.scrollY + rect.top);
  }

  private disableNativeSmoothScroll(): void {
    const html = document.documentElement as HTMLElement;
    const body = document.body as HTMLElement;

    this.previousScrollBehaviorHtml = html.style.scrollBehavior || null;
    this.previousScrollBehaviorBody = body.style.scrollBehavior || null;

    html.style.scrollBehavior = 'auto';
    body.style.scrollBehavior = 'auto';
  }

  private restoreNativeSmoothScroll(): void {
    const html = document.documentElement as HTMLElement;
    const body = document.body as HTMLElement;

    if (this.previousScrollBehaviorHtml === null) {
      html.style.removeProperty('scroll-behavior');
    } else {
      html.style.scrollBehavior = this.previousScrollBehaviorHtml;
    }

    if (this.previousScrollBehaviorBody === null) {
      body.style.removeProperty('scroll-behavior');
    } else {
      body.style.scrollBehavior = this.previousScrollBehaviorBody;
    }

    this.previousScrollBehaviorHtml = null;
    this.previousScrollBehaviorBody = null;
  }
}

