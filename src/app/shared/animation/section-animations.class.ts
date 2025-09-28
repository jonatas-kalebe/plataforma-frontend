/**
 * Section Animations Class
 * Classe especializada para animações de seção reutilizáveis
 */

import gsap from 'gsap';
import { BaseAnimation, AnimationConfig, ScrollTriggerConfig } from './base-animation.class';

/**
 * Classe especializada para animações de entrada de seções
 * Reduz duplicação de código nas animações similares
 */
export class SectionAnimations extends BaseAnimation {

  /**
   * Animação padrão de entrada para título e conteúdo de seção
   */
  public animateSectionEntry(sectionId: string, elements: { title?: string, content?: string, cta?: string }): void {
    const scrollTriggerConfig: ScrollTriggerConfig = {
      trigger: `#${sectionId}`,
      start: 'top 80%',
      end: 'top 80%',
      toggleActions: 'play none none reverse'
    };

    const timeline = this.createTimeline({
      scrollTrigger: scrollTriggerConfig
    });

    // Anima título se especificado
    if (elements.title) {
      timeline.from(elements.title, {
        y: this.prefersReducedMotion ? 0 : 80,
        duration: this.prefersReducedMotion ? 0.3 : 1,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out'
      });
    }

    // Anima conteúdo se especificado
    if (elements.content) {
      timeline.from(elements.content, {
        y: this.prefersReducedMotion ? 0 : 60,
        duration: this.prefersReducedMotion ? 0.3 : 0.8,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out'
      }, elements.title ? '-=0.4' : 0);
    }

    // Anima CTA se especificado
    if (elements.cta) {
      timeline.from(elements.cta, {
        y: this.prefersReducedMotion ? 0 : 30,
        duration: this.prefersReducedMotion ? 0.3 : 0.6,
        ease: this.prefersReducedMotion ? 'none' : 'power3.out'
      }, '-=0.4');
    }
  }

  /**
   * Animação de scroll-triggered para elementos individuais
   */
  public animateScrollTriggeredElements(config: {
    selector: string,
    trigger: string | Element,
    animationConfig?: AnimationConfig,
    scrollConfig?: Partial<ScrollTriggerConfig>
  }): void {
    const { selector, trigger, animationConfig = {}, scrollConfig = {} } = config;

    const finalScrollConfig: ScrollTriggerConfig = {
      trigger,
      start: 'top 85%',
      end: this.prefersReducedMotion ? 'top 85%' : 'bottom center',
      ...(this.prefersReducedMotion ? { toggleActions: 'play none none reverse' } : { scrub: 0.5 }),
      ...scrollConfig
    };

    const timeline = this.createTimeline({
      scrollTrigger: finalScrollConfig
    });

    const finalAnimConfig = {
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      ...animationConfig
    };

    timeline.fromTo(selector, 
      { y: finalAnimConfig.y }, 
      {
        y: this.prefersReducedMotion ? 0 : (finalAnimConfig.y + 60),
        duration: this.prefersReducedMotion ? 0.3 : finalAnimConfig.duration,
        ease: this.prefersReducedMotion ? 'none' : finalAnimConfig.ease
      }
    );
  }

  /**
   * Animação genérica para hover em elementos
   * Substitui algumas animações GSAP simples por CSS quando possível
   */
  public setupHoverAnimations(selector: string): void {
    if (this.prefersReducedMotion) return;

    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      // Adiciona classes CSS para hover em vez de usar GSAP para casos simples
      element.classList.add('hover-scale-animation');
      
      // Para animações mais complexas, ainda usamos GSAP
      element.addEventListener('mouseenter', () => {
        gsap.to(element, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      element.addEventListener('mouseleave', () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });
  }
}