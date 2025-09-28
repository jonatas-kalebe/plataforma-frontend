/**
 * Magnetic Scroll Utility
 * Extrai lógica de snap magnético do scroll service
 */

import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollSection } from './scroll-metrics.manager';

/**
 * Gerencia comportamento de snap magnético entre seções
 * Consolidada para reduzir complexidade do serviço principal
 */
export class MagneticScrollManager {
  private activeSectionTrigger: any = null;
  private snapTimeoutId: number | null = null;
  private intentionDetected: { direction: 'forward' | 'backward' | null, at: number } = { 
    direction: null, 
    at: 0 
  };
  private lastScrollTime = 0;
  private scrollStoppedCheckInterval: number | null = null;
  
  // Configurações otimizadas
  private readonly SCROLL_STOP_DELAY = 150;
  private readonly MAGNETIC_THRESHOLD = 0.85;
  private readonly SNAP_DURATION = 0.8;

  constructor(private prefersReducedMotion: boolean = false) {
    // Registra plugin necessário
    gsap.registerPlugin(ScrollToPlugin);
  }

  /**
   * Inicia verificação de parada de scroll
   */
  public startScrollStopCheck(): void {
    this.clearScrollStopCheck();
    
    if (this.prefersReducedMotion) return;

    this.lastScrollTime = Date.now();
    this.scrollStoppedCheckInterval = window.setInterval(() => {
      const timeSinceLastScroll = Date.now() - this.lastScrollTime;
      
      if (timeSinceLastScroll >= this.SCROLL_STOP_DELAY) {
        this.onScrollingStopped();
      }
    }, 50);
  }

  /**
   * Para verificação de scroll stop
   */
  private clearScrollStopCheck(): void {
    if (this.scrollStoppedCheckInterval) {
      clearInterval(this.scrollStoppedCheckInterval);
      this.scrollStoppedCheckInterval = null;
    }
  }

  /**
   * Detecta intenção do usuário baseada na velocidade
   */
  public detectScrollIntention(velocity: number): void {
    if (this.prefersReducedMotion) return;

    const now = Date.now();
    const velocityThreshold = 2;

    if (Math.abs(velocity) > velocityThreshold) {
      this.intentionDetected = {
        direction: velocity > 0 ? 'forward' : 'backward',
        at: now
      };
    }
  }

  /**
   * Verifica se deve executar snap magnético
   */
  public checkMagneticSnap(sections: ScrollSection[], globalProgress: number): boolean {
    if (this.prefersReducedMotion || this.snapTimeoutId) return false;

    const activeSection = this.findSectionForSnap(sections, globalProgress);
    if (!activeSection) return false;

    // Verifica se atingiu o threshold magnético
    if (activeSection.progress >= this.MAGNETIC_THRESHOLD) {
      this.scheduleMagneticSnap(activeSection);
      return true;
    }

    return false;
  }

  /**
   * Encontra seção candidata para snap
   */
  private findSectionForSnap(sections: ScrollSection[], globalProgress: number): ScrollSection | null {
    return sections.find(section => 
      section.progress >= this.MAGNETIC_THRESHOLD && 
      section.progress < 1
    ) || null;
  }

  /**
   * Agenda snap magnético
   */
  private scheduleMagneticSnap(section: ScrollSection): void {
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
    }

    this.snapTimeoutId = window.setTimeout(() => {
      this.performMagneticSnap(section);
      this.snapTimeoutId = null;
    }, 200);
  }

  /**
   * Executa snap magnético para a seção
   */
  private performMagneticSnap(section: ScrollSection): void {
    if (!section.element || this.prefersReducedMotion) return;

    const gsapInstance = (window as any).gsap || gsap;
    
    gsapInstance.to(window, {
      duration: this.SNAP_DURATION,
      ease: 'power2.inOut',
      scrollTo: { 
        y: section.element, 
        offsetY: 0, 
        autoKill: false 
      }
    });

    console.log(`Magnetic snap to section: ${section.id}`);
  }

  /**
   * Callback quando scroll para
   */
  private onScrollingStopped(): void {
    this.clearScrollStopCheck();
    
    if (this.prefersReducedMotion) return;

    // Aqui pode ser adicionada lógica adicional quando o scroll para
    console.log('Scroll stopped, checking for magnetic snap opportunities');
  }

  /**
   * Scroll programático para seção específica
   */
  public scrollToSection(sectionId: string, duration: number = 1): void {
    const element = document.querySelector(`#${sectionId}`);
    if (!element) return;

    const gsapInstance = (window as any).gsap || gsap;
    
    const scrollConfig = {
      duration: this.prefersReducedMotion ? 0.3 : duration,
      ease: this.prefersReducedMotion ? 'none' : 'power2.inOut',
      scrollTo: { y: element, offsetY: 0, autoKill: false }
    };

    gsapInstance.to(window, scrollConfig);
  }

  /**
   * Limpa recursos
   */
  public destroy(): void {
    this.clearScrollStopCheck();
    
    if (this.snapTimeoutId) {
      clearTimeout(this.snapTimeoutId);
      this.snapTimeoutId = null;
    }
  }
}