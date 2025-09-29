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
  private directionLock: { dir: Dir; until: number } = { dir: null, until: 0 };
  private flingLockUntil = 0;

  private readonly SCROLL_STOP_DELAY = 150;
  private readonly INTENT_THRESHOLD = 0.2;
  private readonly SNAP_FWD_THRESHOLD = 0.85;
  private readonly SNAP_BACK_THRESHOLD = 0.15;
  private readonly SNAP_DURATION_MS = 800;
  private readonly DIRECTION_LOCK_MS = 350;
  private readonly FLING_VELOCITY_THRESHOLD = 1.8;
  private readonly FLING_LOCK_DURATION_MS = 400;

  constructor(private prefersReducedMotion: boolean = false) {}

  setInputMode(mode: 'mouse' | 'touch' | 'unknown'): void {
    this.inputMode = mode;
  }

  updateSectionsSnapshot(sections: ScrollSection[]): void {
    this.lastSectionsSnapshot = sections.map(section => ({ ...section }));
  }

  notifyScrollActivity(): void {
    this.lastScrollTime = Date.now();
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
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

    if (Math.abs(v) > this.FLING_VELOCITY_THRESHOLD) {
      this.flingLockUntil = now + this.FLING_LOCK_DURATION_MS;
      if (this.snapTimeoutId) {
        clearTimeout(this.snapTimeoutId);
        this.snapTimeoutId = null;
      }
    }

    if (this.isAnimating && Math.abs(v) > 0.01) {
      this.cancelAnimation();
    }

    const newDir: Dir = v === 0 ? null : v > 0 ? 'forward' : 'backward';
    const prevDir = this.intention.direction;

    this.intention.velocity = v;
    this.intention.direction = newDir;
    this.intention.at = now;
    this.lastScrollTime = now;

    if (newDir && newDir !== prevDir) {
      this.directionLock = { dir: newDir, until: now + this.DIRECTION_LOCK_MS };
    }
  }

  checkMagneticSnap(sections: ScrollSection[], _globalProgress: number): boolean {
    if (!sections.length) {
      this.lastSectionsSnapshot = [];
      return false;
    }

    // Mantém um snapshot fresco para que o handler de scroll parado tenha dados confiáveis
    this.updateSectionsSnapshot(sections);

    if (this.prefersReducedMotion || this.snapTimeoutId || this.isAnimating || Date.now() < this.flingLockUntil) {
      return false;
    }

    const idx = this.findActiveIndex(sections);
    if (idx === -1) return false;

    const active = sections[idx];
    const next = this.getNext(sections, idx);
    const prev = this.getPrev(sections, idx);

    const dir = this.deriveDirection(idx, active.progress);
    const lowSpeed = Math.abs(this.intention.velocity) < 0.25;

    if (active.progress >= this.SNAP_FWD_THRESHOLD && next && dir !== 'backward') {
      this.triggerSnap(next, 'forward');
      return true;
    }
    if (active.progress <= this.SNAP_BACK_THRESHOLD && prev && dir !== 'forward') {
      this.triggerSnap(prev, 'backward');
      return true;
    }

    if (dir === 'forward' && next && lowSpeed && active.progress >= 1 - this.INTENT_THRESHOLD) {
      this.triggerSnap(next, 'forward');
      return true;
    }
    if (dir === 'backward' && prev && lowSpeed && active.progress <= this.INTENT_THRESHOLD) {
      this.triggerSnap(prev, 'backward');
      return true;
    }

    return false;
  }

  private onScrollingStopped(): void {
    this.clearScrollStopCheck();
    if (this.prefersReducedMotion || this.snapTimeoutId || this.isAnimating) {
      return;
    }
    if (!this.lastSectionsSnapshot || !this.lastSectionsSnapshot.length) return;

    const idx = this.findActiveIndex(this.lastSectionsSnapshot);
    if (idx === -1) return;

    const active = this.lastSectionsSnapshot[idx];
    const next = this.getNext(this.lastSectionsSnapshot, idx);
    const prev = this.getPrev(this.lastSectionsSnapshot, idx);

    const dir = this.deriveDirection(idx, active.progress);

    if (dir === 'forward' && active.progress >= 0.5 && next) {
      this.triggerSnap(next, 'forward');
      return;
    }
    if (dir === 'backward' && active.progress < 0.5 && prev) {
      this.triggerSnap(prev, 'backward');
      return;
    }

    if (active.progress > 0.5 && next) {
      this.triggerSnap(next, 'forward');
    } else if (active.progress <= 0.5 && prev) {
      this.triggerSnap(prev, 'backward');
    }
  }

  private triggerSnap(section: ScrollSection, dir: Exclude<Dir, null>): void {
    if (!section.element || this.isAnimating || this.snapTimeoutId) return;
    if (!this.isDirectionAllowed(dir)) return;
    const SNAP_ACTION_DELAY = 50;
    this.snapTimeoutId = window.setTimeout(() => {
      this.snapTimeoutId = null;
      if (this.isDirectionAllowed(dir)) {
        this.performSnap(section);
      }
    }, SNAP_ACTION_DELAY);
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
    this.directionLock = { dir: null, until: 0 };
    this.flingLockUntil = 0;
  }

  private isDirectionAllowed(targetDir: Exclude<Dir, null>): boolean {
    const now = Date.now();
    if (this.directionLock.dir && now < this.directionLock.until) {
      return this.directionLock.dir === targetDir;
    }
    if (now - this.intention.at > this.DIRECTION_LOCK_MS || Math.abs(this.intention.velocity) < 0.1) {
      return true;
    }
    if (this.intention.direction === null) {
      return true;
    }
    return this.intention.direction === targetDir;
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
