/**
 * Scroll Metrics Utility
 * Extrai lógica de métricas e telemetria do scroll service principal
 */

import { BehaviorSubject, Observable } from 'rxjs';
import { ScrollTelemetryService } from '../../services/scroll-telemetry.service';

export interface ScrollSection {
  id: string;
  element?: HTMLElement;
  progress: number;
  isActive: boolean;
}

export interface ScrollMetrics {
  globalProgress: number;
  velocity: number;
  activeSection: ScrollSection | null;
  sections: ScrollSection[];
}

export interface ScrollState {
  globalProgress: number;
  velocity: number;
  activeSection: ScrollSection | null;
  direction: 'up' | 'down' | 'none';
}

/**
 * Gerencia métricas e estado do scroll de forma consolidada
 */
export class ScrollMetricsManager {
  private metricsSubject = new BehaviorSubject<ScrollMetrics>({
    globalProgress: 0,
    velocity: 0,
    activeSection: null,
    sections: []
  });

  private scrollStateSubject = new BehaviorSubject<ScrollState>({
    globalProgress: 0,
    velocity: 0,
    activeSection: null,
    direction: 'none'
  });

  public readonly metrics$: Observable<ScrollMetrics> = this.metricsSubject.asObservable();
  public readonly scrollState$: Observable<ScrollState> = this.scrollStateSubject.asObservable();

  // Cache para otimização
  private lastUpdateTime = 0;
  private readonly UPDATE_THROTTLE = 16; // 60fps

  constructor(private telemetryService?: ScrollTelemetryService) {}

  /**
   * Atualiza métricas com throttling para performance
   */
  public updateMetrics(
    globalProgress: number,
    velocity: number,
    activeSection: ScrollSection | null,
    sections: ScrollSection[],
    direction: 'up' | 'down' | 'none'
  ): void {
    const now = performance.now();
    
    // Throttle updates para melhor performance
    if (now - this.lastUpdateTime < this.UPDATE_THROTTLE) return;
    this.lastUpdateTime = now;

    const metrics: ScrollMetrics = {
      globalProgress,
      velocity,
      activeSection,
      sections
    };

    const state: ScrollState = {
      globalProgress,
      velocity,
      activeSection,
      direction
    };

    this.metricsSubject.next(metrics);
    this.scrollStateSubject.next(state);

    // Telemetria opcional
    if (this.telemetryService && activeSection) {
      this.telemetryService.trackSectionView(
        activeSection.id, 
        activeSection.progress * 100, 
        'desktop' // Simplificado, pode ser expandido depois
      );
    }
  }

  /**
   * Calcula progresso global baseado nas seções
   */
  public calculateGlobalProgress(sections: ScrollSection[]): number {
    if (!sections.length) return 0;

    // Cálculo otimizado do progresso global
    const totalProgress = sections.reduce((sum, section) => sum + section.progress, 0);
    return Math.min(1, Math.max(0, totalProgress / sections.length));
  }

  /**
   * Identifica seção ativa baseada no progresso
   */
  public findActiveSection(sections: ScrollSection[]): ScrollSection | null {
    // Otimização: encontra seção com maior progresso que seja >= 0.3
    return sections
      .filter(section => section.progress >= 0.3)
      .sort((a, b) => b.progress - a.progress)[0] || null;
  }

  /**
   * Limpa todos os subjects
   */
  public destroy(): void {
    this.metricsSubject.complete();
    this.scrollStateSubject.complete();
  }
}