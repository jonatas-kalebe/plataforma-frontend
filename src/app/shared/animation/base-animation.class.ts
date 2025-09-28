/**
 * Base Animation Class
 * Classe base para padronizar e simplificar animações GSAP no projeto
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ANIMATION_DURATIONS, ANIMATION_EASING } from '../constants/animation.constants';

export interface AnimationConfig {
  duration?: number;
  ease?: string;
  delay?: number;
  y?: number;
  x?: number;
  opacity?: number;
  scale?: number;
}

export interface ScrollTriggerConfig {
  trigger: string | Element;
  start?: string;
  end?: string;
  scrub?: number | boolean;
  toggleActions?: string;
  onUpdate?: (self: ScrollTrigger) => void;
}

/**
 * Classe base para animações reutilizáveis
 * Centraliza configurações comuns e reduz duplicação de código
 */
export abstract class BaseAnimation {
  protected timelines: gsap.core.Timeline[] = [];
  protected scrollTriggers: ScrollTrigger[] = [];
  protected prefersReducedMotion = false;

  constructor() {
    this.checkReducedMotion();
  }

  /**
   * Verifica se o usuário prefere movimento reduzido
   */
  private checkReducedMotion(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  /**
   * Cria uma timeline GSAP com configurações padrão otimizadas
   */
  protected createTimeline(config?: gsap.TimelineVars): gsap.core.Timeline {
    const timeline = gsap.timeline({
      defaults: {
        ease: this.prefersReducedMotion ? 'none' : ANIMATION_EASING.EASE_OUT,
        duration: this.prefersReducedMotion ? ANIMATION_DURATIONS.REDUCED_MOTION : ANIMATION_DURATIONS.SECTION_ENTER
      },
      ...config
    });
    
    this.timelines.push(timeline);
    return timeline;
  }

  /**
   * Cria um ScrollTrigger com configurações otimizadas baseadas nas preferências do usuário
   */
  protected createScrollTrigger(config: ScrollTriggerConfig): ScrollTrigger | null {
    if (!ScrollTrigger) return null;

    // Adapta configurações para movimento reduzido
    const finalConfig = this.prefersReducedMotion ? {
      ...config,
      scrub: false,
      toggleActions: config.toggleActions || 'play none none reverse'
    } : config;

    const scrollTrigger = ScrollTrigger.create(finalConfig);
    this.scrollTriggers.push(scrollTrigger);
    return scrollTrigger;
  }

  /**
   * Animação de entrada padrão para elementos
   */
  protected animateEnter(selector: string, config: AnimationConfig = {}): gsap.core.Timeline {
    const finalConfig = this.getAdaptedConfig(config);
    const timeline = this.createTimeline();
    
    timeline.from(selector, finalConfig);
    return timeline;
  }

  /**
   * Animação de entrada escalonada para múltiplos elementos
   */
  protected animateStaggeredEnter(selector: string, config: AnimationConfig = {}, stagger: number = 0.1): gsap.core.Timeline {
    const finalConfig = this.getAdaptedConfig(config);
    const timeline = this.createTimeline();
    
    timeline.from(selector, {
      ...finalConfig,
      stagger: this.prefersReducedMotion ? 0 : stagger
    });
    
    return timeline;
  }

  /**
   * Adapta configurações de animação baseado nas preferências do usuário
   */
  private getAdaptedConfig(config: AnimationConfig): AnimationConfig {
    if (this.prefersReducedMotion) {
      return {
        ...config,
        duration: config.duration || ANIMATION_DURATIONS.REDUCED_MOTION,
        ease: 'none',
        y: 0,
        x: 0,
        scale: config.scale || 1
      };
    }
    
    return {
      duration: ANIMATION_DURATIONS.SECTION_ENTER,
      ease: ANIMATION_EASING.EASE_OUT,
      y: 50,
      ...config
    };
  }

  /**
   * Destrói todas as animações e ScrollTriggers criados
   */
  public destroy(): void {
    this.timelines.forEach(timeline => timeline.kill());
    this.scrollTriggers.forEach(trigger => trigger.kill());
    this.timelines = [];
    this.scrollTriggers = [];
  }
}