import { ScrollSection } from './scroll-metrics.manager';

type Dir = 'forward' | 'backward' | null;

export class MagneticScrollManager {
  private snapTimeoutId: number | null = null;
  private lastScrollTime = 0;
  private scrollStoppedCheckInterval: number | null = null;
  private rafScrollId: number | null = null;
  private inputMode: 'mouse' | 'touch' | 'unknown' = 'unknown';
  private intention: { direction: Dir; at: number; velocity: number } = { direction: null, at: 0, velocity: 0 };
  private isAnimating = false;
  private lastActiveIndex = -1;
  private lastActiveProgress = 0;
  private lastSectionsSnapshot: ScrollSection[] = [];
  private prevScrollBehaviorHtml: string | null = null;
  private prevScrollBehaviorBody: string | null = null;

  private readonly SCROLL_STOP_DELAY = 150;
  private readonly INTENT_THRESHOLD = 0.2;
  private readonly SNAP_FWD_THRESHOLD = 0.85;
  private readonly SNAP_BACK_THRESHOLD = 0.15;
  private readonly SNAP_DURATION_MS = 800;
  private readonly TOUCH_SNAP_DELAY_MS = 280;

  constructor(private prefersReducedMotion: boolean = false) {}

  setInputMode(mode: 'mouse' | 'touch' | 'unknown'): void {
    this.inputMode = mode;
  }

  updateSectionsSnapshot(sections: ScrollSection[]): void {
    this.lastSectionsSnapshot = sections;
  }

  notifyScrollActivity(): void {
    this.lastScrollTime = Date.now();
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
    if (this.isAnimating) this.cancelAnimation();
  }

  startScrollStopCheck(): void {
    this.clearScrollStopCheck();
    if (this.prefersReducedMotion) return;
    this.lastScrollTime = Date.now();
    this.scrollStoppedCheckInterval = window.setInterval(() => {
      const d = Date.now() - this.lastScrollTime;
      if (d >= this.SCROLL_STOP_DELAY) this.onScrollingStopped();
    }, 50);
  }

  private clearScrollStopCheck(): void {
    if (this.scrollStoppedCheckInterval) {
      clearInterval(this.scrollStoppedCheckInterval);
      this.scrollStoppedCheckInterval = null;
    }
  }

  detectScrollIntention(velocity: number): void {
    if (this.prefersReducedMotion) return;
    const now = Date.now();
    const v = velocity || 0;
    const thr = 2;
    if (Math.abs(v) > thr) {
      this.intention = { direction: v > 0 ? 'forward' : 'backward', at: now, velocity: v };
    } else {
      this.intention.velocity = v;
    }
    this.lastScrollTime = now;
  }

  checkMagneticSnap(sections: ScrollSection[], _globalProgress: number): boolean {
    if (this.prefersReducedMotion || this.snapTimeoutId || this.isAnimating) return false;
    const idx = this.findActiveIndex(sections);
    if (idx === -1) return false;
    const active = sections[idx];
    const next = this.getNext(sections, idx);
    const prev = this.getPrev(sections, idx);
    const dir = this.deriveDirection(idx, active.progress);
    const lowSpeed = Math.abs(this.intention.velocity) < 0.25;

    if (active.progress >= this.SNAP_FWD_THRESHOLD && next) {
      this.scheduleSnapTo(next, this.delayForInput());
      return true;
    }

    if (active.progress <= this.SNAP_BACK_THRESHOLD && prev) {
      this.scheduleSnapTo(prev, this.delayForInput());
      return true;
    }

    if (dir === 'forward' && active.progress >= this.INTENT_THRESHOLD && next && lowSpeed) {
      this.scheduleSnapTo(next, this.delayForInput());
      return true;
    }

    if (dir === 'backward' && prev && prev.progress >= this.INTENT_THRESHOLD && lowSpeed) {
      this.scheduleSnapTo(prev, this.delayForInput());
      return true;
    }

    return false;
  }

  private onScrollingStopped(): void {
    this.clearScrollStopCheck();
    if (this.prefersReducedMotion || this.snapTimeoutId || this.isAnimating) return;
    if (!this.lastSectionsSnapshot || !this.lastSectionsSnapshot.length) return;
    const idx = this.findActiveIndex(this.lastSectionsSnapshot);
    if (idx === -1) return;
    const active = this.lastSectionsSnapshot[idx];
    const next = this.getNext(this.lastSectionsSnapshot, idx);
    const prev = this.getPrev(this.lastSectionsSnapshot, idx);
    if (active.progress >= this.SNAP_FWD_THRESHOLD && next) {
      this.scheduleSnapTo(next, this.delayForInput());
      return;
    }
    if (active.progress <= this.SNAP_BACK_THRESHOLD && prev) {
      this.scheduleSnapTo(prev, this.delayForInput());
      return;
    }
  }

  scrollToSection(sectionId: string, durationSec: number = 1): void {
    const el = document.querySelector<HTMLElement>(`#${sectionId}`);
    if (!el) return;
    const targetY = this.getElementPageY(el);
    const ms = (this.prefersReducedMotion ? 0.3 : durationSec) * 1000;
    if (this.prefersReducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    this.performSmoothScroll(targetY, ms);
  }

  destroy(): void {
    this.clearScrollStopCheck();
    this.cancelAnimation();
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
  }

  private delayForInput(): number {
    return this.inputMode === 'touch' ? this.TOUCH_SNAP_DELAY_MS : 0;
  }

  private scheduleSnapTo(section: ScrollSection, extraDelayMs: number): void {
    if (!section.element) return;
    if (this.snapTimeoutId) clearTimeout(this.snapTimeoutId);
    const delay = 200 + extraDelayMs;
    this.snapTimeoutId = window.setTimeout(() => {
      this.snapTimeoutId = null;
      this.performSnap(section);
    }, delay);
  }

  private performSnap(section: ScrollSection): void {
    if (!section.element) return;
    const targetY = this.getElementPageY(section.element as Element);
    if (this.prefersReducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    if ('vibrate' in navigator) try { navigator.vibrate?.(20); } catch {}
    this.performSmoothScroll(targetY, this.SNAP_DURATION_MS);
  }

  private performSmoothScroll(targetY: number, durationMs: number): void {
    if (this.isAnimating) this.cancelAnimation();
    this.isAnimating = true;
    this.disableNativeSmooth();
    this.smoothScrollTo(targetY, durationMs, () => {
      this.isAnimating = false;
      this.restoreNativeSmooth();
    });
  }

  private cancelAnimation(): void {
    if (this.rafScrollId) {
      cancelAnimationFrame(this.rafScrollId);
      this.rafScrollId = null;
    }
    this.isAnimating = false;
    this.restoreNativeSmooth();
  }

  private findActiveIndex(sections: ScrollSection[]): number {
    let best = -1;
    let bestProgress = -1;
    for (let i = 0; i < sections.length; i++) {
      const p = sections[i].progress ?? 0;
      if (p > 0 && p < 1 && p > bestProgress) {
        bestProgress = p;
        best = i;
      }
    }
    if (best !== -1) return best;
    let closest = -1;
    let bestDist = Infinity;
    for (let i = 0; i < sections.length; i++) {
      const d = Math.abs((sections[i].progress ?? 0) - 0.5);
      if (d < bestDist) {
        bestDist = d;
        closest = i;
      }
    }
    return closest;
  }

  private deriveDirection(idx: number, progress: number): Dir {
    let dir: Dir = this.intention.direction;
    if (!dir) {
      if (this.lastActiveIndex === idx) {
        if (progress > this.lastActiveProgress + 0.004) dir = 'forward';
        else if (progress < this.lastActiveProgress - 0.004) dir = 'backward';
      } else {
        dir = idx > this.lastActiveIndex ? 'forward' : this.lastActiveIndex === -1 ? null : 'backward';
      }
    }
    this.lastActiveIndex = idx;
    this.lastActiveProgress = progress;
    return dir;
  }

  private getNext(sections: ScrollSection[], idx: number): ScrollSection | null {
    return idx < sections.length - 1 ? sections[idx + 1] : null;
  }

  private getPrev(sections: ScrollSection[], idx: number): ScrollSection | null {
    return idx > 0 ? sections[idx - 1] : null;
  }

  private getElementPageY(el: Element): number {
    const rect = el.getBoundingClientRect();
    return Math.round(window.scrollY + rect.top);
  }

  private smoothScrollTo(targetY: number, durationMs: number, onDone?: () => void): void {
    if (this.rafScrollId) {
      cancelAnimationFrame(this.rafScrollId);
      this.rafScrollId = null;
    }
    const startY = window.scrollY;
    const delta = targetY - startY;
    if (durationMs <= 0 || Math.abs(delta) < 1) {
      window.scrollTo(0, targetY);
      if (onDone) onDone();
      return;
    }
    const startTs = performance.now();
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = () => {
      const now = performance.now();
      const t = Math.min(1, (now - startTs) / durationMs);
      const y = startY + delta * ease(t);
      window.scrollTo(0, Math.round(y));
      if (t < 1 && this.isAnimating) {
        this.rafScrollId = requestAnimationFrame(step);
      } else {
        this.rafScrollId = null;
        if (onDone) onDone();
      }
    };
    this.rafScrollId = requestAnimationFrame(step);
  }

  private disableNativeSmooth(): void {
    const html = document.documentElement as HTMLElement;
    const body = document.body as HTMLElement;
    this.prevScrollBehaviorHtml = html.style.scrollBehavior || null;
    this.prevScrollBehaviorBody = body.style.scrollBehavior || null;
    html.style.scrollBehavior = 'auto';
    body.style.scrollBehavior = 'auto';
  }

  private restoreNativeSmooth(): void {
    const html = document.documentElement as HTMLElement;
    const body = document.body as HTMLElement;
    if (this.prevScrollBehaviorHtml === null) html.style.removeProperty('scroll-behavior');
    else html.style.scrollBehavior = this.prevScrollBehaviorHtml;
    if (this.prevScrollBehaviorBody === null) body.style.removeProperty('scroll-behavior');
    else body.style.scrollBehavior = this.prevScrollBehaviorBody;
    this.prevScrollBehaviorHtml = null;
    this.prevScrollBehaviorBody = null;
  }
}
