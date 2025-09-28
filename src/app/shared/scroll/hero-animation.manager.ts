/**
 * Hero Animation Manager
 * Extrai lógica complexa de animação do hero do scroll service
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Gerencia animações específicas da seção hero
 * Reduz complexidade do scroll service principal
 */
export class HeroAnimationManager {
  private heroTimeline: gsap.core.Timeline | null = null;

  constructor(private prefersReducedMotion: boolean = false) {}

  /**
   * Cria animação do hero com efeitos de resistência ao scroll
   */
  public createHeroAnimation(gsapInstance: any): void {
    if (this.prefersReducedMotion) return;

    // Limpa animação anterior se existir
    if (this.heroTimeline) {
      this.heroTimeline.kill();
    }

    this.heroTimeline = gsapInstance.timeline();
    this.setupHeroElements();
  }

  /**
   * Configura animações dos elementos do hero
   */
  private setupHeroElements(): void {
    const heroTitle = document.querySelector('#hero-title');
    const heroSubtitle = document.querySelector('#hero-subtitle');
    const heroCta = document.querySelector('#hero-cta');

    if (!this.heroTimeline) return;

    // Animação do título com resistência gradual
    if (heroTitle) {
      this.animateHeroTitle(heroTitle);
    }

    // Animação do subtítulo
    if (heroSubtitle) {
      this.animateHeroSubtitle(heroSubtitle);
    }

    // Animação do CTA
    if (heroCta) {
      this.animateHeroCta(heroCta);
    }
  }

  /**
   * Anima título do hero com efeito de resistência
   */
  private animateHeroTitle(element: Element): void {
    if (!this.heroTimeline) return;

    // Fase 1: Resistência gentil (0-20%)
    this.heroTimeline.fromTo(element,
      { y: 0, opacity: 1 },
      { y: 53, opacity: 0.8, ease: 'power1.out' },
      0
    );

    // Fase 2: Transição acelerada (20-100%)
    this.heroTimeline.to(element,
      { y: -150, opacity: 0.1, ease: 'power2.in' },
      0.2
    );
  }

  /**
   * Anima subtítulo do hero
   */
  private animateHeroSubtitle(element: Element): void {
    if (!this.heroTimeline) return;

    this.heroTimeline.fromTo(element,
      { y: 0, opacity: 1 },
      { y: 40, opacity: 0.7, ease: 'power1.out' },
      0.05
    ).to(element,
      { y: -120, opacity: 0.2, ease: 'power2.in' },
      0.25
    );
  }

  /**
   * Anima CTA do hero
   */
  private animateHeroCta(element: Element): void {
    if (!this.heroTimeline) return;

    this.heroTimeline.fromTo(element,
      { y: 0, opacity: 1 },
      { y: 25, opacity: 0.8, ease: 'power1.out' },
      0.1
    ).to(element,
      { y: -80, opacity: 0.3, ease: 'power2.in' },
      0.3
    );
  }

  /**
   * Configura ScrollTrigger para o hero
   */
  public setupHeroScrollTrigger(): ScrollTrigger | null {
    if (this.prefersReducedMotion || !this.heroTimeline) return null;

    return ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      animation: this.heroTimeline,
      onUpdate: (self) => {
        // Lógica adicional durante scroll se necessário
        const progress = self.progress;
        this.updateHeroEffects(progress);
      }
    });
  }

  /**
   * Atualiza efeitos baseados no progresso do scroll
   */
  private updateHeroEffects(progress: number): void {
    // Lógica adicional para efeitos baseados no progresso
    if (progress > 0.8) {
      // Acelera transição final
      this.accelerateHeroTransition();
    }
  }

  /**
   * Acelera transição final do hero
   */
  private accelerateHeroTransition(): void {
    // Implementar aceleração se necessário
    if (this.heroTimeline) {
      this.heroTimeline.timeScale(1.2);
    }
  }

  /**
   * Destrói animações e limpa recursos
   */
  public destroy(): void {
    if (this.heroTimeline) {
      this.heroTimeline.kill();
      this.heroTimeline = null;
    }
  }
}