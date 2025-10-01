/**
 * Trabalhos Section Animation Service (Refactored)
 * Versão simplificada e otimizada com responsabilidades consolidadas
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BaseAnimation } from '../../shared/animation/base-animation.class';

interface RingConfig {
  totalCards: number;
  snapAngle: number;
  rotationSpeed: number;
}

/**
 * Serviço de animação consolidado para seção de trabalhos
 * Reduz complexidade e elimina duplicações
 */
@Injectable({
  providedIn: 'root'
})
export class TrabalhosSectionAnimationService extends BaseAnimation {
  private readonly platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private isPinned = false;
  
  // Configuração do ring otimizada
  private readonly RING_CONFIG: RingConfig = {
    totalCards: 8,
    snapAngle: 45, // 360/8 = 45 degrees per card
    rotationSpeed: 2 // 2 full rotations through scroll
  };
  
  // Estado público para acesso externo
  public scrollProgress = 0;
  private currentRingComponent: any = null;

  constructor() {
    super();
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Cria seção pinada com interação estendida
   * Versão simplificada mantendo funcionalidade essencial
   */
  public createPinnedSection(): void {
    if (!this.isBrowser || this.prefersReducedMotion) return;

    const scrollTriggerConfig = {
      trigger: '#trabalhos',
      start: 'top top',
      end: '+=100%', // 100% viewport height
      scrub: true,
      onUpdate: (self: any) => {
        this.scrollProgress = self.progress;
        this.updateRingRotation(self.progress);
      }
    };

    // Adiciona pin apenas se não for reduced motion
    if (!this.prefersReducedMotion) {
      Object.assign(scrollTriggerConfig, { 
        pin: true, 
        pinSpacing: true 
      });
    }

    const trigger = this.createScrollTrigger(scrollTriggerConfig);
    if (trigger) {
      this.isPinned = true;
    }
  }

  /**
   * Atualiza rotação do ring baseada no progresso do scroll
   * Lógica consolidada e otimizada
   */
  private updateRingRotation(progress: number): void {
    if (!this.currentRingComponent) return;

    const totalRotation = progress * 360 * this.RING_CONFIG.rotationSpeed;
    const normalizedRotation = totalRotation % 360;
    
    // Determina se está próximo de um ponto de snap
    const snapProgress = normalizedRotation / this.RING_CONFIG.snapAngle;
    const isNearSnap = Math.abs(snapProgress - Math.round(snapProgress)) < 0.2;
    
    this.applyRingRotation(normalizedRotation, isNearSnap);
    
    // Destaca card ativo
    const activeCardIndex = Math.round(normalizedRotation / this.RING_CONFIG.snapAngle) % this.RING_CONFIG.totalCards;
    this.highlightActiveCard(activeCardIndex);
  }

  /**
   * Aplica rotação ao ring com otimizações de performance
   */
  private applyRingRotation(rotation: number, isSnapped: boolean): void {
    if (!this.currentRingComponent?.setRotation) return;

    // Aplica rotação com transform otimizado
    this.currentRingComponent.setRotation(rotation);
    
    // Adiciona efeito de snap visual se necessário
    if (isSnapped && !this.prefersReducedMotion) {
      this.applySnapEffect();
    }
  }

  private lastSnapEffect = 0;

  /**
   * Efeito visual de snap (simplificado)
   */
  private applySnapEffect(): void {
    // Debounce snap effect to prevent multiple rapid calls
    const now = performance.now();
    if (now - this.lastSnapEffect < 200) return;
    this.lastSnapEffect = now;
    
    // Efeito sutil de snap via CSS se possível, ou GSAP mínimo
    const ringElement = document.querySelector('.trabalhos-ring');
    if (ringElement && !ringElement.classList.contains('snapped')) {
      ringElement.classList.add('snapped');
      setTimeout(() => ringElement.classList.remove('snapped'), 150);
    }
  }

  /**
   * Destaca card ativo (otimizado)
   */
  private highlightActiveCard(index: number): void {
    if (index < 0 || index >= this.RING_CONFIG.totalCards) return;

    // Remove destaque de todos os cards
    const allCards = document.querySelectorAll('.trabalhos-card');
    allCards.forEach(card => card.classList.remove('active'));

    // Adiciona destaque ao card ativo
    const activeCard = document.querySelector(`.trabalhos-card:nth-child(${index + 1})`);
    if (activeCard) {
      activeCard.classList.add('active');
      
      // Animação sutil se não for reduced motion
      if (!this.prefersReducedMotion) {
        gsap.to(activeCard, {
          scale: 1.1,
          duration: 0.3,
          ease: 'power2.out'
        });
        
        // Reverte outras cards
        allCards.forEach((card, i) => {
          if (i !== index) {
            gsap.to(card, {
              scale: 1,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        });
      }
    }
  }

  /**
   * Registra componente do ring para comunicação
   */
  public registerRingComponent(component: any): void {
    this.currentRingComponent = component;
    console.log('Ring component registered for trabalhos section');
  }

  /**
   * Snap para o card mais próximo (simplificado)
   */
  public snapToNearestCard(): void {
    if (this.prefersReducedMotion || !this.currentRingComponent) return;

    const currentRotation = this.scrollProgress * 360 * this.RING_CONFIG.rotationSpeed;
    const nearestSnapRotation = Math.round(currentRotation / this.RING_CONFIG.snapAngle) * this.RING_CONFIG.snapAngle;
    const targetProgress = (nearestSnapRotation / 360) / this.RING_CONFIG.rotationSpeed;

    // Anima para o snap mais próximo
    gsap.to(this, {
      scrollProgress: targetProgress,
      duration: 0.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.updateRingRotation(this.scrollProgress);
      }
    });
  }

  /**
   * Mostra dicas de interação (simplificado)
   */
  public showInteractionHints(): void {
    const hintElement = document.querySelector('.interaction-hints');
    if (hintElement && !this.prefersReducedMotion) {
      gsap.to(hintElement, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Esconde dicas de interação
   */
  public hideInteractionHints(): void {
    const hintElement = document.querySelector('.interaction-hints');
    if (hintElement) {
      gsap.to(hintElement, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.in'
      });
    }
  }

  /**
   * Obtém informações do card ativo
   */
  public getActiveCardInfo(): { index: number; rotation: number } | null {
    if (!this.currentRingComponent) return null;

    const currentRotation = this.scrollProgress * 360 * this.RING_CONFIG.rotationSpeed;
    const activeIndex = Math.round(currentRotation / this.RING_CONFIG.snapAngle) % this.RING_CONFIG.totalCards;
    
    return {
      index: activeIndex,
      rotation: currentRotation % 360
    };
  }

  /**
   * Destrói animações e limpa recursos
   */
  public override destroy(): void {
    super.destroy();
    this.currentRingComponent = null;
    this.isPinned = false;
    console.log('TrabalhosSectionAnimationService destroyed');
  }
}