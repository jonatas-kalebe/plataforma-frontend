/**
 * Servicos Animation Service (Refactored)
 * Versão simplificada usando sistema de animação base
 */

import { Injectable } from '@angular/core';
import { BaseAnimation } from '../../shared/animation/base-animation.class';
import gsap from 'gsap';

/**
 * Serviço de animação otimizado para seção de serviços
 * Utiliza classes base para reduzir duplicação
 */
@Injectable({
  providedIn: 'root'
})
export class ServicosAnimationService extends BaseAnimation {

  constructor() {
    super();
  }

  /**
   * Cria animações de entrada escalonada para cards de serviço
   * Versão simplificada mantendo funcionalidade
   */
  public createStaggeredEntrance(cards: NodeListOf<Element> | Element[]): void {
    if (this.prefersReducedMotion) return;

    const cardsArray = Array.from(cards);
    
    // Usa método base para animação escalonada
    this.animateStaggeredEnter('.service-card', {
      y: 60,
      opacity: 0,
      scale: 0.95,
      duration: 0.8
    }, 0.15);

    // ScrollTrigger otimizado
    this.createScrollTrigger({
      trigger: '#servicos',
      start: 'top 85%',
      toggleActions: 'play none none reverse'
    });
  }

  /**
   * Cria efeito parallax sutil para cards
   * Simplificado para melhor performance
   */
  public createParallaxEffect(cards: NodeListOf<Element> | Element[]): void {
    if (this.prefersReducedMotion) return;

    const cardsArray = Array.from(cards);
    
    cardsArray.forEach((card, index) => {
      this.createScrollTrigger({
        trigger: card as HTMLElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          const yMovement = progress * -30; // Movimento sutil
          
          gsap.set(card, { y: yMovement });
        }
      });
    });
  }

  /**
   * Cria efeitos de hover magnético otimizados
   * Usa CSS onde possível, GSAP para casos complexos
   */
  public createMagneticHover(cards: NodeListOf<Element> | Element[]): void {
    if (this.prefersReducedMotion) return;

    const cardsArray = Array.from(cards);
    
    cardsArray.forEach(card => {
      // Adiciona classe CSS para hover básico
      card.classList.add('hover-scale-animation');
      
      // GSAP apenas para efeitos magnéticos complexos
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });
  }

  /**
   * Cria snap magnético entre seções (simplificado)
   */
  public createSectionSnapping(): void {
    if (this.prefersReducedMotion) return;

    this.createScrollTrigger({
      trigger: '#servicos',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Snap suave no meio da seção (50%)
        if (progress > 0.45 && progress < 0.55) {
          this.applySectionSnap();
        }
      }
    });
  }

  /**
   * Aplica snap suave na seção
   */
  private applySectionSnap(): void {
    // Implementação simplificada do snap
    const servicesSection = document.querySelector('#servicos');
    if (servicesSection) {
      servicesSection.classList.add('snapped');
      setTimeout(() => servicesSection.classList.remove('snapped'), 300);
    }
  }

  /**
   * Inicializa todas as animações da seção de serviços
   */
  public initializeAll(): void {
    const serviceCards = document.querySelectorAll('.service-card');
    
    if (serviceCards.length > 0) {
      this.createStaggeredEntrance(serviceCards);
      this.createParallaxEffect(serviceCards);
      this.createMagneticHover(serviceCards);
      this.createSectionSnapping();
    }
  }
}