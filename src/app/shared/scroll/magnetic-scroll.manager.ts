import { ScrollSection } from './scroll-metrics.manager';

type Dir = 'forward' | 'backward' | null;

export interface SnapScrollConfig {
  /** Tempo da animação de snap em milissegundos */
  snapDurationMs: number;
  /** Atraso antes do snap automático ser disparado */
  snapDelayMs: number;
  /** Atraso adicional aplicado quando o snap é para trás */
  backwardSnapExtraDelayMs: number;
  /** Multiplicador aplicado à duração do snap quando voltando para uma seção anterior */
  backwardSnapDurationMultiplier: number;
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
  backwardSnapExtraDelayMs: 110,
  backwardSnapDurationMultiplier: 1.2,
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
    // Magnetic snap completely disabled per user request
    return;
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
    // Magnetic snap completely disabled per user request
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

  private snapToClosestInDirection(reason: SnapReason, direction: Dir): boolean {
    if (!this.lastSectionsSnapshot.length || this.isAnimating) {
      return false;
    }

    const currentY = window.scrollY;
    const dominant = this.findDominantSection(this.lastSectionsSnapshot);
    
    if (!dominant) {
      return false; // Don't snap if no dominant section
    }

    const { section: currentSection, index } = dominant;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const closeEnoughThreshold = Math.max(100, viewportHeight * 0.15); // Only snap if within 15% of viewport

    // Determine snap target based on direction - only snap if close enough
    let targetSection: ScrollSection | null = null;

    if (direction === 'forward') {
      // When scrolling forward, ONLY consider next section, and only if close enough
      const nextSection = this.lastSectionsSnapshot[index + 1];
      if (nextSection && nextSection.element) {
        const nextTargetY = this.getTargetY(nextSection.element);
        const distance = nextTargetY - currentY;
        // Only snap to next if we're moving toward it AND close enough
        if (distance > 0 && distance < closeEnoughThreshold) {
          targetSection = nextSection;
        }
      }
      // No fallback - if we can't snap forward, don't snap at all
    } else if (direction === 'backward') {
      // When scrolling backward, ONLY consider prev section, and only if close enough
      const prevSection = this.lastSectionsSnapshot[index - 1];
      if (prevSection && prevSection.element) {
        const prevTargetY = this.getTargetY(prevSection.element);
        const distance = currentY - prevTargetY;
        // Only snap to prev if we're moving toward it AND close enough
        if (distance > 0 && distance < closeEnoughThreshold) {
          targetSection = prevSection;
        }
      }
      // No fallback - if we can't snap backward, don't snap at all
    } else {
      // No clear direction, don't snap
      return false;
    }

    if (!targetSection || !targetSection.element) {
      return false; // Don't snap if no valid target
    }

    const targetY = this.getTargetY(targetSection.element);
    if (Math.abs(targetY - currentY) < 1) {
      return false;
    }

    return this.queueSnap(targetSection, reason);
  }

  private performSnap(element: HTMLElement, reason: SnapReason): void {
    if (this.prefersReducedMotion) {
      window.scrollTo({ top: this.getTargetY(element), behavior: 'auto' });
      return;
    }

    const duration = this.getSnapDuration(reason);
    this.performSmoothScroll(this.getTargetY(element), duration, reason);
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
    if (reason === SnapReason.BackwardProgress) {
      return this.config.snapDelayMs + this.config.backwardSnapExtraDelayMs;
    }
    if (reason === SnapReason.Idle || reason === SnapReason.LowVelocity) {
      return this.config.snapDelayMs + 120;
    }
    return this.config.snapDelayMs;
  }

  private getSnapDuration(reason: SnapReason): number {
    if (reason === SnapReason.BackwardProgress) {
      return Math.round(this.config.snapDurationMs * this.config.backwardSnapDurationMultiplier);
    }
    return this.config.snapDurationMs;
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

    const currentY = window.scrollY;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const closeEnoughThreshold = Math.max(100, viewportHeight * 0.15); // Only snap if within 15% of viewport

    // Filter candidates based on scroll direction - only consider next/prev, never current
    let targetSection: ScrollSection | null = null;
    
    if (this.direction === 'forward') {
      // When scrolling forward, ONLY consider next section
      if (next && next.element) {
        const nextTargetY = this.getTargetY(next.element);
        const distance = nextTargetY - currentY;
        // Only snap if close enough
        if (distance > 0 && distance < closeEnoughThreshold) {
          targetSection = next;
        }
      }
    } else if (this.direction === 'backward') {
      // When scrolling backward, ONLY consider prev section
      if (prev && prev.element) {
        const prevTargetY = this.getTargetY(prev.element);
        const distance = currentY - prevTargetY;
        // Only snap if close enough
        if (distance > 0 && distance < closeEnoughThreshold) {
          targetSection = prev;
        }
      }
    } else {
      // No clear direction - check if we're very close to any section
      const candidates: Array<ScrollSection | undefined> = [prev, dominant.section, next];
      const candidate = this.findBestAlignmentCandidate(candidates);
      
      if (candidate) {
        const { section, distance } = candidate;
        // Only snap if very close (within 12% of viewport)
        if (distance >= 12 && distance < viewportHeight * 0.12) {
          targetSection = section;
        }
      }
    }

    if (!targetSection || !targetSection.element) {
      return null;
    }

    const distance = Math.abs(this.getTargetY(targetSection.element) - currentY);
    if (distance < 12) {
      return null;
    }

    if (this.lastSnapTargetId === targetSection.id) {
      return null;
    }

    return targetSection;
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
