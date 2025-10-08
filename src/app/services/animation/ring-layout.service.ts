/**
 * Ring Layout Service
 * Gerencia cálculos de layout e posicionamento para componentes de ring 3D
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Configuração do ring layout
 */
export interface RingLayoutConfig {
  /** Número total de cards no ring */
  totalCards: number;
  /** Raio base do ring em pixels */
  baseRadius: number;
  /** Largura do card em pixels */
  cardWidth: number;
  /** Altura do card em pixels */
  cardHeight: number;
  /** Gap mínimo entre cards em pixels */
  minGapPx: number;
  /** Modo de orientação dos cards */
  orientation: 'outward' | 'inward' | 'camera';
  /** Habilita espaçamento automático de raio */
  autoRadiusSpacing: boolean;
  /** Elasticidade do raio (0-1) */
  radiusElasticity: number;
  /** Influência da velocidade no raio */
  radiusVelInfluence: number;
  /** Rigidez da mola para animação de raio */
  springStiffness: number;
  /** Amortecimento da mola para animação de raio */
  springDamping: number;
}

/**
 * Posição calculada de um card no ring
 */
export interface CardPosition {
  /** Ângulo de rotação em graus */
  angle: number;
  /** Raio atual em pixels */
  radius: number;
  /** String de transformação CSS */
  transform: string;
  /** Índice do card */
  index: number;
}

/**
 * Estado dinâmico do raio com física
 */
export interface RadiusState {
  /** Raio efetivo atual */
  current: number;
  /** Raio alvo */
  target: number;
  /** Velocidade do raio */
  velocity: number;
}

/**
 * Serviço para cálculos de layout de ring 3D
 * Fornece funções de utilidade para posicionamento e transformação de cards
 */
@Injectable({
  providedIn: 'root'
})
export class RingLayoutService {
  private readonly platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Calcula a posição 3D de um card no ring
   * @param index - Índice do card
   * @param config - Configuração do ring
   * @param currentRadius - Raio atual do ring
   * @returns Posição calculada do card
   */
  calculateCardPosition(
    index: number,
    config: RingLayoutConfig,
    currentRadius: number
  ): CardPosition {
    // Stub: retorna posição padrão
    const angle = this.calculateRotationAngle(index, config.totalCards);
    const transform = this.getCardTransform(angle, currentRadius, config.orientation);
    
    return {
      angle,
      radius: currentRadius,
      transform,
      index
    };
  }

  /**
   * Calcula o raio efetivo baseado no número de cards e espaçamento
   * @param config - Configuração do ring
   * @returns Raio efetivo em pixels
   */
  calculateRadius(config: RingLayoutConfig): number {
    // Stub: implementação básica
    if (!config.autoRadiusSpacing || config.totalCards <= 1) {
      return config.baseRadius;
    }

    // Calcula raio necessário para espaçamento mínimo
    const stepRad = (2 * Math.PI) / Math.max(1, config.totalCards);
    const requiredChord = config.cardWidth + config.minGapPx;
    const denom = 2 * Math.sin(stepRad / 2);
    const spacingRadius = denom > 0 ? requiredChord / denom : 0;
    
    return Math.max(config.baseRadius, spacingRadius || 0);
  }

  /**
   * Calcula o ângulo de rotação para um índice de card
   * @param index - Índice do card
   * @param totalCards - Total de cards no ring
   * @returns Ângulo em graus
   */
  calculateRotationAngle(index: number, totalCards: number): number {
    // Stub: cálculo básico de ângulo
    if (totalCards <= 0) {
      return 0;
    }
    
    const stepDeg = 360 / totalCards;
    return index * stepDeg;
  }

  /**
   * Aplica transformação de orientação ao card
   * @param angle - Ângulo base em graus
   * @param radius - Raio do ring
   * @param orientation - Modo de orientação
   * @returns String de transformação CSS
   */
  applyOrientation(
    angle: number,
    radius: number,
    orientation: 'outward' | 'inward' | 'camera'
  ): string {
    // Stub: implementação básica de orientação
    switch (orientation) {
      case 'camera':
        return `rotateY(${angle}deg) translateZ(${radius}px) rotateY(${-angle}deg)`;
      case 'inward':
        return `rotateY(${angle}deg) translateZ(${radius}px)`;
      case 'outward':
      default:
        return `rotateY(${angle}deg) translateZ(${radius}px) rotateY(180deg)`;
    }
  }

  /**
   * Calcula raio dinâmico com física de mola
   * @param state - Estado atual do raio
   * @param config - Configuração do ring
   * @param angularVelocity - Velocidade angular atual
   * @param deltaTime - Delta time em segundos
   * @param reducedMotion - Se animações reduzidas estão ativas
   * @returns Novo estado do raio
   */
  computeDynamicRadius(
    state: RadiusState,
    config: RingLayoutConfig,
    angularVelocity: number,
    deltaTime: number,
    reducedMotion: boolean = false
  ): RadiusState {
    // Stub: implementação básica de física
    const baseRadius = this.calculateRadius(config);
    const velAbs = Math.abs(angularVelocity);
    const maxAdd = baseRadius * (reducedMotion ? 0 : config.radiusElasticity);
    const target = baseRadius + Math.min(1, velAbs / config.radiusVelInfluence) * maxAdd;

    // Física de mola simplificada
    const k = config.springStiffness;
    const c = config.springDamping;
    const x = state.current;
    const v = state.velocity;
    const a = -k * (x - target) - c * v;
    
    const newVelocity = v + a * deltaTime;
    const newCurrent = x + newVelocity * deltaTime;

    return {
      current: newCurrent,
      target,
      velocity: newVelocity
    };
  }

  /**
   * Gera string de transformação CSS completa para um card
   * @param angle - Ângulo em graus
   * @param radius - Raio em pixels
   * @param orientation - Modo de orientação
   * @returns String de transformação CSS
   */
  getCardTransform(
    angle: number,
    radius: number,
    orientation: 'outward' | 'inward' | 'camera'
  ): string {
    // Stub: delega para applyOrientation
    return this.applyOrientation(angle, radius, orientation);
  }

  /**
   * Normaliza um ângulo para o intervalo [0, 360)
   * @param degrees - Ângulo em graus
   * @returns Ângulo normalizado
   */
  normalizeDegrees(degrees: number): number {
    // Stub: normalização de ângulo
    let normalized = degrees % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    return normalized;
  }

  /**
   * Calcula a menor distância angular entre dois ângulos
   * @param from - Ângulo inicial em graus
   * @param to - Ângulo final em graus
   * @returns Distância angular em graus (-180 a 180)
   */
  shortestAngleDist(from: number, to: number): number {
    // Stub: cálculo de distância angular
    let diff = (to - from) % 360;
    if (diff < -180) {
      diff += 360;
    }
    if (diff > 180) {
      diff -= 360;
    }
    return diff;
  }

  /**
   * Calcula o ângulo de snap mais próximo
   * @param currentAngle - Ângulo atual em graus
   * @param totalCards - Total de cards no ring
   * @returns Ângulo de snap em graus
   */
  nearestSnapAngle(currentAngle: number, totalCards: number): number {
    // Stub: cálculo de snap
    if (totalCards <= 0) {
      return 0;
    }
    
    const stepDeg = 360 / totalCards;
    const normalized = this.normalizeDegrees(-currentAngle);
    const idx = Math.round(normalized / stepDeg);
    return -idx * stepDeg;
  }

  /**
   * Calcula o índice do card ativo baseado na rotação
   * @param rotationDeg - Rotação atual em graus
   * @param totalCards - Total de cards no ring
   * @returns Índice do card ativo
   */
  computeActiveIndex(rotationDeg: number, totalCards: number): number {
    // Stub: cálculo de índice ativo
    if (totalCards <= 0) {
      return 0;
    }
    
    const stepDeg = 360 / totalCards;
    const normalized = this.normalizeDegrees(-rotationDeg);
    let idx = Math.round(normalized / stepDeg) % totalCards;
    if (idx < 0) {
      idx += totalCards;
    }
    return idx;
  }

  /**
   * Valida uma configuração de ring
   * @param config - Configuração a validar
   * @returns true se válida, false caso contrário
   */
  validateConfig(config: Partial<RingLayoutConfig>): boolean {
    // Stub: validação básica
    if (config.totalCards !== undefined && config.totalCards < 1) {
      console.warn('RingLayoutService: totalCards deve ser >= 1');
      return false;
    }
    
    if (config.baseRadius !== undefined && config.baseRadius < 0) {
      console.warn('RingLayoutService: baseRadius deve ser >= 0');
      return false;
    }
    
    if (config.cardWidth !== undefined && config.cardWidth <= 0) {
      console.warn('RingLayoutService: cardWidth deve ser > 0');
      return false;
    }
    
    if (config.cardHeight !== undefined && config.cardHeight <= 0) {
      console.warn('RingLayoutService: cardHeight deve ser > 0');
      return false;
    }
    
    return true;
  }

  /**
   * Cria uma configuração padrão de ring
   * @param overrides - Valores a sobrescrever
   * @returns Configuração completa
   */
  createDefaultConfig(overrides: Partial<RingLayoutConfig> = {}): RingLayoutConfig {
    // Stub: configuração padrão
    const defaults: RingLayoutConfig = {
      totalCards: 8,
      baseRadius: 200,
      cardWidth: 240,
      cardHeight: 140,
      minGapPx: 24,
      orientation: 'outward',
      autoRadiusSpacing: true,
      radiusElasticity: 0.25,
      radiusVelInfluence: 720,
      springStiffness: 120,
      springDamping: 22
    };
    
    return { ...defaults, ...overrides };
  }
}
