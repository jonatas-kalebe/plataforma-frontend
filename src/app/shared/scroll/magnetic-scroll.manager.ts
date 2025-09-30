import { ScrollSection } from './scroll-metrics.manager';

type Dir = 'forward' | 'backward' | null;

export interface SnapScrollConfig {
  /** Tempo da animação de snap em milissegundos */
  snapDurationMs: number;
  /** Atraso antes do snap automático ser disparado */
  snapDelayMs: number;
  /** Tempo de inatividade antes de forçar snap para a seção mais próxima */
  idleSnapDelayMs: number;
  /** Variação mínima de scroll (px) para considerar que o usuário ainda está se movendo */
  velocityIgnoreThreshold: number;
  /** Quando a velocidade fica abaixo desse limiar, o snap tenta alinhar automaticamente */
  settleVelocityThreshold: number;
  /** Velocidade em pixels considerada um "fling" para bloquear snaps temporariamente */
  flingVelocityThreshold: number;
  /** Progresso mínimo (0-1) para disparar snap para frente */
  progressForwardSnap: number;
  /** Progresso máximo (0-1) para disparar snap para trás */
  progressBackwardSnap: number;
  /** Tempo que mantém a direção travada depois de uma mudança brusca */
  directionLockMs: number;
  /** Offset aplicado ao alinhar a seção */
  topOffsetPx: number;
  /** Forma de alinhamento da seção */
  align: 'start' | 'center';
  /** Função de easing usada na animação */
  easingFn: (t: number) => number;
  /** Habilita logs de debug */
  debug: boolean;
}

const DEFAULT_SNAP_CONFIG: SnapScrollConfig = {
  snapDurationMs: 850,
  snapDelayMs: 80,
  idleSnapDelayMs: 180,
  velocityIgnoreThreshold: 2,
  settleVelocityThreshold: 0.5,
  flingVelocityThreshold: 120,
  progressForwardSnap: 0.8,
  progressBackwardSnap: 0.2,
  directionLockMs: 280,
  topOffsetPx: 0,
  align: 'start',
  easingFn: (t: number) => 1 - Math.pow(1 - t, 3),
  debug: false,
};

const enum SnapReason {
  ForwardProgress = 'forward-progress',
  BackwardProgress = 'backward-progress',
  Idle = 'idle',
  LowVelocity = 'low-velocity',
  Programmatic = 'programmatic',
}

export class MagneticScrollManager {
  private config: SnapScrollConfig;
  private prefersReducedMotion: boolean;

  private snapTimeoutId: number | null = null;
  private idleTimeoutId: number | null = null;
  private rafScrollId: number | null = null;

  private direction: Dir = null;
  private lastVelocity = 0;
  private skipSnapUntil = 0;
  private isAnimating = false;
  private lastDominantIndex: number | null = null;
  private lastUserActivityTs = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  private lastAssistTs = 0;
  private lastSnapTargetId: string | null = null;

  private lastSectionsSnapshot: ScrollSection[] = [];

  private prevScrollBehaviorHtml: string | null = null;
  private prevScrollBehaviorBody: string | null = null;

  constructor(prefersReducedMotion: boolean = false, config: Partial<SnapScrollConfig> = {}) {
    this.prefersReducedMotion = prefersReducedMotion;
    this.config = { ...DEFAULT_SNAP_CONFIG, ...config };
  }

  updatePreference(prefersReducedMotion: boolean): void {
    this.prefersReducedMotion = prefersReducedMotion;
  }

  updateConfig(config: Partial<SnapScrollConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setInputMode(_mode: 'mouse' | 'touch' | 'unknown'): void {
    // Mantido por compatibilidade futura. A lógica atual não depende do modo de input.
  }

  updateSectionsSnapshot(sections: ScrollSection[]): void {
    this.lastSectionsSnapshot = sections.map(section => ({ ...section }));
  }

  notifyScrollActivity(): void {
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
    this.lastUserActivityTs = this.now();
    this.lastSnapTargetId = null;
  }

  startScrollStopCheck(): void {
    if (this.prefersReducedMotion) return;
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
    }
    this.idleTimeoutId = window.setTimeout(() => {
      this.idleTimeoutId = null;
      this.snapToClosest(SnapReason.Idle);
    }, this.config.idleSnapDelayMs);
  }

  detectScrollIntention(velocity: number): void {
    if (this.prefersReducedMotion) return;

    const now = this.now();
    this.lastVelocity = velocity;
    this.lastUserActivityTs = now;

    const absVelocity = Math.abs(velocity);
    if (absVelocity > this.config.velocityIgnoreThreshold) {
      const newDir: Dir = velocity > 0 ? 'forward' : 'backward';
      if (newDir !== this.direction) {
        this.direction = newDir;
      }
    }

    if (absVelocity > this.config.flingVelocityThreshold) {
      this.skipSnapUntil = now + this.config.directionLockMs;
    }
  }

  checkMagneticSnap(sections: ScrollSection[]): boolean {
    if (this.prefersReducedMotion) return false;

    this.updateSectionsSnapshot(sections);

    if (!sections.length || this.isAnimating) {
      return false;
    }

    const now = this.now();
    if (now < this.skipSnapUntil) {
      return false;
    }

    const dominant = this.findDominantSection(sections);
    if (!dominant) {
      return false;
    }

    const { index, progress } = dominant;
    const next = sections[index + 1];
    const prev = sections[index - 1];

    const timeSinceActivity = now - this.lastUserActivityTs;
    const lowVelocity = Math.abs(this.lastVelocity) <= this.config.settleVelocityThreshold * 1.5;
    const nearIdle = timeSinceActivity >= this.config.snapDelayMs;
    const settled = lowVelocity && timeSinceActivity >= this.config.snapDelayMs / 2;

    const leaps = this.lastDominantIndex === null ? 0 : Math.abs(index - this.lastDominantIndex);
    this.lastDominantIndex = index;

    if (!nearIdle && !settled) {
      return false;
    }

    const shouldAssistIdle = nearIdle;

    if (shouldAssistIdle) {
      const assistTarget = this.resolveIdleAssist(dominant, prev, next);
      if (assistTarget) {
        return this.queueSnap(assistTarget, SnapReason.Idle);
      }
    }

    if (settled && leaps <= 1 && this.direction === 'forward' && progress >= this.config.progressForwardSnap && next) {
      return this.queueSnap(next, SnapReason.ForwardProgress);
    }

    if (settled && leaps <= 1 && this.direction === 'backward' && progress <= this.config.progressBackwardSnap && prev) {
      return this.queueSnap(prev, SnapReason.BackwardProgress);
    }

    if (settled) {
      return this.snapToClosest(SnapReason.LowVelocity);
    }

    return false;
  }

  scrollToSection(sectionId: string, durationSec: number = 1): void {
    const element = document.querySelector<HTMLElement>(`#${sectionId}`);
    if (!element) return;

    const targetY = this.getTargetY(element);
    const durationMs = this.prefersReducedMotion ? 0 : Math.max(0, durationSec * 1000 || this.config.snapDurationMs);

    this.cancelPendingSnap();

    if (durationMs === 0) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      return;
    }

    this.performSmoothScroll(targetY, durationMs, SnapReason.Programmatic);
  }

  destroy(): void {
    this.cancelPendingSnap();
    if (this.idleTimeoutId) {
      clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
    if (this.rafScrollId) {
      cancelAnimationFrame(this.rafScrollId);
      this.rafScrollId = null;
    }
    this.restoreNativeSmooth();
    this.lastSectionsSnapshot = [];
    this.direction = null;
    this.lastVelocity = 0;
    this.skipSnapUntil = 0;
    this.lastDominantIndex = null;
    this.lastSnapTargetId = null;
    this.lastAssistTs = 0;
    this.lastUserActivityTs = this.now();
  }

  private queueSnap(section: ScrollSection, reason: SnapReason): boolean {
    if (!section.element || this.isAnimating) {
      return false;
    }

    if (this.snapTimeoutId && this.lastSnapTargetId === section.id) {
      return false;
    }

    this.cancelPendingSnap();

    const targetElement = section.element;
    const delay = this.getSnapDelay(reason);
    this.lastSnapTargetId = section.id;
    this.snapTimeoutId = window.setTimeout(() => {
      this.snapTimeoutId = null;
      if (reason === SnapReason.Idle || reason === SnapReason.LowVelocity) {
        this.lastAssistTs = this.now();
      }
      this.performSnap(targetElement, reason);
    }, delay);

    return true;
  }

  private snapToClosest(reason: SnapReason): boolean {
    if (!this.lastSectionsSnapshot.length || this.isAnimating) {
      return false;
    }

    const closest = this.findClosestSection(this.lastSectionsSnapshot);
    if (!closest || !closest.section.element) {
      return false;
    }

    if (Math.abs(this.getTargetY(closest.section.element) - window.scrollY) < 1) {
      return false;
    }

    return this.queueSnap(closest.section, reason);
  }

  private performSnap(element: HTMLElement, reason: SnapReason): void {
    if (this.prefersReducedMotion) {
      window.scrollTo({ top: this.getTargetY(element), behavior: 'auto' });
      return;
    }

    this.performSmoothScroll(this.getTargetY(element), this.config.snapDurationMs, reason);
  }

  private performSmoothScroll(targetY: number, durationMs: number, reason: SnapReason): void {
    if (this.isAnimating && this.rafScrollId) {
      cancelAnimationFrame(this.rafScrollId);
      this.rafScrollId = null;
    }

    const startY = window.scrollY;
    const delta = targetY - startY;

    const adaptiveDuration = this.computeAdaptiveDuration(delta, durationMs);

    if (adaptiveDuration <= 0 || Math.abs(delta) < 1) {
      window.scrollTo(0, targetY);
      return;
    }

    this.disableNativeSmooth();
    this.isAnimating = true;

    const startTs = this.now();
    const ease = this.config.easingFn;

    const step = () => {
      const now = this.now();
      const t = Math.min(1, (now - startTs) / adaptiveDuration);
      const easedT = ease(t);
      const y = startY + delta * easedT;
      window.scrollTo(0, Math.round(y));

      if (t < 1) {
        this.rafScrollId = requestAnimationFrame(step);
      } else {
        this.finishAnimation(reason);
      }
    };

    this.rafScrollId = requestAnimationFrame(step);
  }

  private finishAnimation(reason: SnapReason): void {
    if (this.config.debug) {
      console.debug(`[MagneticScrollManager] Snap complete (${reason})`);
    }
    this.isAnimating = false;
    this.rafScrollId = null;
    this.restoreNativeSmooth();
    this.lastSnapTargetId = null;
    if (reason === SnapReason.Idle || reason === SnapReason.LowVelocity) {
      this.lastAssistTs = this.now();
    }
  }

  private cancelPendingSnap(): void {
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
    if (this.rafScrollId) {
      cancelAnimationFrame(this.rafScrollId);
      this.rafScrollId = null;
    }
    this.isAnimating = false;
    this.restoreNativeSmooth();
    this.lastSnapTargetId = null;
  }

  private findDominantSection(sections: ScrollSection[]): { section: ScrollSection; index: number; progress: number } | null {
    let bestIndex = -1;
    let bestProgress = -Infinity;

    sections.forEach((section, index) => {
      const progress = section.progress ?? 0;
      if (progress > bestProgress) {
        bestProgress = progress;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) {
      return null;
    }

    return {
      section: sections[bestIndex],
      index: bestIndex,
      progress: bestProgress,
    };
  }

  private findClosestSection(sections: ScrollSection[]): { section: ScrollSection; index: number } | null {
    const currentY = window.scrollY;
    let bestSection: ScrollSection | null = null;
    let bestIndex = -1;
    let bestDistance = Infinity;

    sections.forEach((section, index) => {
      if (!section.element) return;
      const targetY = this.getTargetY(section.element);
      const distance = Math.abs(targetY - currentY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSection = section;
        bestIndex = index;
      }
    });

    if (bestIndex === -1 || !bestSection) {
      return null;
    }

    return { section: bestSection, index: bestIndex };
  }

  private getTargetY(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;

    if (this.config.align === 'center') {
      const centerOffset = rect.height / 2;
      return Math.round(scrollY + rect.top + centerOffset - viewportHeight / 2 + this.config.topOffsetPx);
    }

    return Math.round(scrollY + rect.top + this.config.topOffsetPx);
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

  private getSnapDelay(reason: SnapReason): number {
    if (reason === SnapReason.Programmatic) {
      return 0;
    }
    if (reason === SnapReason.Idle || reason === SnapReason.LowVelocity) {
      return this.config.snapDelayMs + 120;
    }
    return this.config.snapDelayMs;
  }

  private computeAdaptiveDuration(distance: number, baseDuration: number): number {
    const absDistance = Math.abs(distance);
    if (baseDuration <= 0) {
      return baseDuration;
    }

    const minDuration = Math.max(280, baseDuration * 0.65);
    const maxDuration = baseDuration * 1.5;

    if (absDistance < 120) {
      return minDuration;
    }
    if (absDistance > 1200) {
      return Math.min(maxDuration, baseDuration + absDistance * 0.2);
    }

    const ratio = absDistance / 1200;
    return Math.min(maxDuration, Math.max(minDuration, baseDuration * (0.65 + 0.35 * ratio)));
  }

  private resolveIdleAssist(
    dominant: { section: ScrollSection; index: number; progress: number },
    prev?: ScrollSection,
    next?: ScrollSection
  ): ScrollSection | null {
    const now = this.now();
    if (now - this.lastAssistTs < this.config.snapDelayMs) {
      return null;
    }

    const candidate = this.findBestAlignmentCandidate([
      prev,
      dominant.section,
      next
    ]);

    if (!candidate) {
      return null;
    }

    const { section, distance } = candidate;
    if (distance < 12) {
      return null;
    }

    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const comfortableDistance = Math.max(180, viewportHeight * 0.28);
    if (distance > comfortableDistance) {
      return null;
    }

    if (this.lastSnapTargetId === section.id) {
      return null;
    }

    return section;
  }

  private findBestAlignmentCandidate(
    candidates: Array<ScrollSection | undefined>
  ): { section: ScrollSection; distance: number } | null {
    const currentY = window.scrollY;
    const scored = candidates
      .filter((section): section is ScrollSection => !!section && !!section.element)
      .map(section => ({
        section,
        distance: Math.abs(this.getTargetY(section.element as HTMLElement) - currentY)
      }))
      .sort((a, b) => a.distance - b.distance);

    return scored[0] ?? null;
  }

  private now(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }
}
