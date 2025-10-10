
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Importa apenas os tipos para não carregar a biblioteca no servidor
import type { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Draggable } from 'gsap/Draggable';
import type { InertiaPlugin } from 'gsap/InertiaPlugin';
import type { ScrollToPlugin } from 'gsap/ScrollToPlugin';

@Injectable({
  providedIn: 'root'
})
export class AnimationOrchestrationService {
  private readonly platformId = inject(PLATFORM_ID);
  private isInitialized = false;

  // Propriedades para armazenar as instâncias do GSAP após o carregamento
  private _gsap?: typeof gsap;
  private _ScrollTrigger?: typeof ScrollTrigger;
  private _Draggable?: typeof Draggable;
  private _InertiaPlugin?: typeof InertiaPlugin;
  private _ScrollToPlugin?: typeof ScrollToPlugin;

  /**
   * Inicializa o GSAP e registra todos os plugins necessários.
   * Este método deve ser chamado uma vez, de preferência no componente principal
   * da aplicação (ex: AppComponent), antes de qualquer outra chamada de animação.
   * O método é idempotente e seguro para SSR.
   */
  public async initialize(): Promise<void> {
    // Roda apenas no navegador e previne inicialização dupla
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    try {
      // Carrega as bibliotecas do GSAP de forma assíncrona (lazy-loading)
      const [gsapModule, stModule, draggableModule, inertiaModule, scrollToModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('gsap/Draggable'),
        import('gsap/InertiaPlugin'), // InertiaPlugin agora é parte do core gratuito do GSAP
        import('gsap/ScrollToPlugin'),
      ]);

      this._gsap = gsapModule.gsap;
      this._ScrollTrigger = stModule.ScrollTrigger;
      this._Draggable = draggableModule.Draggable;
      this._InertiaPlugin = inertiaModule.InertiaPlugin;
      this._ScrollToPlugin = scrollToModule.ScrollToPlugin;

      // Registra os plugins no GSAP (incluindo ScrollToPlugin necessário para animações de scroll)
      this._gsap.registerPlugin(this._ScrollTrigger, this._Draggable, this._InertiaPlugin, this._ScrollToPlugin);
      
      // Expõe globalmente para compatibilidade com código legado
      if (typeof window !== 'undefined') {
        (window as any).gsap = this._gsap;
        (window as any).ScrollTrigger = this._ScrollTrigger;
      }

      // Define padrões globais para consistência nas animações
      this._gsap.defaults({
        ease: 'power3.out',
        duration: 0.8,
      });

      this.isInitialized = true;
      console.log('[AnimationOrchestrationService] GSAP e plugins inicializados com sucesso.');
    } catch (error) {
      console.error('[AnimationOrchestrationService] Falha ao inicializar o GSAP:', error);
      // Garante que não tentaremos usar o GSAP se a inicialização falhar
      this.isInitialized = false;
    }
  }

  /**
   * Configura um efeito de parallax para uma seção "hero" usando GSAP e ScrollTrigger.
   * @param heroContainer O elemento container da seção hero
   * @param heroTitle O elemento do título do hero
   * @param heroSubtitle O elemento do subtítulo do hero
   * @param heroCta O elemento do CTA do hero
   * @param scrollHint O elemento da dica de scroll (opcional)
   */
  public setupHeroParallax(
    heroContainer: HTMLElement,
    heroTitle: HTMLElement,
    heroSubtitle: HTMLElement,
    heroCta: HTMLElement,
    scrollHint?: HTMLElement
  ): void {
    if (!this.isReady()) {
      this.logNotReadyWarning('setupHeroParallax');
      return;
    }

    if (!this._gsap || !this._ScrollTrigger) {
      console.warn('[AnimationOrchestrationService] GSAP ou ScrollTrigger não disponível');
      return;
    }

    const gsap = this._gsap;
    const ScrollTrigger = this._ScrollTrigger;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      console.log('[AnimationOrchestrationService] Reduced motion preference detected, skipping parallax setup');
      return;
    }

    // Setup scroll-based parallax with resistance and acceleration phases
    ScrollTrigger.create({
      trigger: heroContainer,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        if (progress <= 0.2) {
          // 0-20%: Gentle resistance - small movement
          const resistanceProgress = progress / 0.2;
          const resistance = resistanceProgress * 0.2;

          gsap.set(heroTitle, {
            y: -resistance * 40,
            opacity: Math.max(0.7, 1 - resistance * 0.3)
          });

          gsap.set(heroSubtitle, {
            y: -resistance * 25,
            opacity: Math.max(0.8, 1 - resistance * 0.2)
          });
        } else {
          // >20%: Acceleration - progressively larger movement
          const accelerationProgress = (progress - 0.2) / 0.8;
          const acceleratedMovement = 0.2 + (accelerationProgress * accelerationProgress * 2);

          gsap.set(heroTitle, {
            y: -acceleratedMovement * 100,
            opacity: Math.max(0, 1 - acceleratedMovement * 1.5)
          });

          gsap.set(heroSubtitle, {
            y: -acceleratedMovement * 80,
            opacity: Math.max(0, 1 - acceleratedMovement * 1.2)
          });

          gsap.set(heroCta, {
            y: -acceleratedMovement * 60,
            opacity: Math.max(0, 1 - acceleratedMovement)
          });
        }

        // Fade out scroll hint as user scrolls
        if (scrollHint) {
          gsap.set(scrollHint, {
            opacity: Math.max(0, 1 - progress * 2)
          });
        }
      }
    });

    // Setup mouse parallax effect
    this.setupMouseParallax(heroContainer, heroTitle, heroSubtitle, heroCta);

    console.log('[AnimationOrchestrationService] Hero parallax configurado com sucesso');
  }

  /**
   * Configura efeito de parallax baseado no movimento do mouse
   */
  private setupMouseParallax(
    heroContainer: HTMLElement,
    heroTitle: HTMLElement,
    heroSubtitle: HTMLElement,
    heroCta: HTMLElement
  ): void {
    if (!this._gsap) return;

    const gsap = this._gsap;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = heroContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize mouse position to -1 to 1
      mouseX = (event.clientX - centerX) / (rect.width / 2);
      mouseY = (event.clientY - centerY) / (rect.height / 2);

      // Use GSAP to animate transforms
      gsap.to(heroTitle, {
        x: mouseX * 15,
        y: mouseY * 10,
        rotateX: mouseY * 2,
        rotateY: mouseX * 2,
        duration: 0.5,
        ease: 'power2.out'
      });

      gsap.to(heroSubtitle, {
        x: mouseX * 8,
        y: mouseY * 5,
        rotateX: mouseY * 1,
        rotateY: mouseX * 1,
        duration: 0.5,
        ease: 'power2.out'
      });

      gsap.to(heroCta, {
        x: mouseX * 5,
        y: mouseY * 3,
        duration: 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      // Reset to neutral position
      gsap.to([heroTitle, heroSubtitle, heroCta], {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.8,
        ease: 'power2.out'
      });
    };

    heroContainer.addEventListener('mousemove', handleMouseMove);
    heroContainer.addEventListener('mouseleave', handleMouseLeave);
  }

  /**
   * Configura o scroll snap global para seções de página inteira usando ScrollTrigger.snap.
   * @param sectionSelector O seletor CSS para as seções que devem ter o snap.
   * @param options Opções de configuração do snap (opcional).
   */
  public setupGlobalScrollSnap(
    sectionSelector: string,
    options?: {
      duration?: number;
      ease?: string;
      delay?: number;
      directional?: boolean;
    }
  ): void {
    if (!this.isReady()) {
      this.logNotReadyWarning('setupGlobalScrollSnap');
      return;
    }

    if (!this._ScrollTrigger || !this._gsap) {
      console.error('[AnimationOrchestrationService] GSAP ou ScrollTrigger não disponíveis.');
      return;
    }

    const sections = document.querySelectorAll(sectionSelector);
    if (!sections.length) {
      console.warn(`[AnimationOrchestrationService] Nenhuma seção encontrada para o seletor: ${sectionSelector}`);
      return;
    }

    // Configurações padrão para snapping suave
    const snapConfig = {
      duration: options?.duration ?? 0.9,
      ease: options?.ease ?? 'power3.out',
      delay: options?.delay ?? 0.1,
      directional: options?.directional ?? true
    };

    // Calculate total scrollable height
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Cria array de posições de snap como frações de progresso (0-1)
    const snapPositions = Array.from(sections).map((section) => {
      const element = section as HTMLElement;
      const scrollPosition = element.offsetTop;
      // Convert pixel position to progress fraction (0-1)
      return scrollPosition / scrollHeight;
    });

    // Configura ScrollTrigger com snap global
    this._ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: snapPositions,
        duration: snapConfig.duration,
        delay: snapConfig.delay,
        ease: snapConfig.ease,
        directional: snapConfig.directional,
      },
    });

    console.log(`[AnimationOrchestrationService] Scroll snap configurado para ${sections.length} seções.`);
  }

  /**
   * Recalcula as posições de todas as instâncias do ScrollTrigger.
   * Essencial para chamar após mudanças no DOM que afetam o layout (ex: carregar imagens, adicionar conteúdo).
   */
  public refreshScrollTriggers(): void {
    if (this.isReady()) {
      this._ScrollTrigger?.refresh();
    }
  }

  /**
   * Configura animações de scroll para a seção de trabalhos usando GSAP e ScrollTrigger.
   * @param sectionElement O elemento da seção de trabalhos
   * @param ringComponent Referência ao componente do anel que será animado
   * @returns O ScrollTrigger criado, ou null se não puder ser criado
   */
  public setupTrabalhosScrollAnimation(
    sectionElement: HTMLElement,
    ringComponent: any
  ): any {
    if (!this.isReady()) {
      this.logNotReadyWarning('setupTrabalhosScrollAnimation');
      return null;
    }

    if (!this._gsap || !this._ScrollTrigger) {
      console.warn('[AnimationOrchestrationService] GSAP ou ScrollTrigger não disponível');
      return null;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      console.log('[AnimationOrchestrationService] Reduced motion preference detected, skipping trabalhos scroll animation');
      return null;
    }

    const ScrollTrigger = this._ScrollTrigger;
    const gsap = this._gsap;

    // Create scroll-based rotation animation for the ring
    const trigger = ScrollTrigger.create({
      trigger: sectionElement,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Update ring component's scroll progress
        if (ringComponent && 'scrollProgress' in ringComponent) {
          ringComponent.scrollProgress = progress;
        }

        // Calculate rotation based on scroll progress (2 full rotations over the section)
        const totalRotation = progress * 720;
        
        // Apply rotation to ring component
        if (ringComponent && 'rotationDeg' in ringComponent) {
          ringComponent.rotationDeg = -totalRotation;
        }
      }
    });

    console.log('[AnimationOrchestrationService] Trabalhos scroll animation configured');
    return trigger;
  }

  /**
   * Configura interação de drag para o anel de trabalhos usando GSAP Draggable.
   * @param ringElement O elemento HTML do anel que será arrastável
   * @param ringComponent Referência ao componente do anel
   * @param callbacks Callbacks para eventos de drag
   */
  public setupTrabalhosDrag(
    ringElement: HTMLElement,
    ringComponent: any,
    callbacks?: {
      onDragStart?: () => void;
      onDragMove?: (rotation: number, velocity: number) => void;
      onDragEnd?: (velocity: number) => void;
      onSnap?: (index: number) => void;
    }
  ): any {
    if (!this.isReady()) {
      this.logNotReadyWarning('setupTrabalhosDrag');
      return null;
    }

    if (!this._gsap || !this._Draggable) {
      console.warn('[AnimationOrchestrationService] GSAP ou Draggable não disponível');
      return null;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      console.log('[AnimationOrchestrationService] Reduced motion preference detected, skipping drag setup');
      return null;
    }

    const Draggable = this._Draggable;
    const gsap = this._gsap;

    // Create draggable instance with rotation
    const draggable = Draggable.create(ringElement, {
      type: 'rotation',
      inertia: true,
      onDragStart: () => {
        if (callbacks?.onDragStart) callbacks.onDragStart();
        if (ringComponent) ringComponent.isDragging = true;
      },
      onDrag: function(this: any) {
        const rotation = this['rotation'];
        const velocity = this['getVelocity']('rotation');
        if (callbacks?.onDragMove) callbacks.onDragMove(rotation, velocity);
        if (ringComponent && 'rotationDeg' in ringComponent) {
          ringComponent.rotationDeg = rotation;
        }
      },
      onDragEnd: function(this: any) {
        const velocity = this['getVelocity']('rotation');
        if (callbacks?.onDragEnd) callbacks.onDragEnd(velocity);
        if (ringComponent) ringComponent.isDragging = false;
        
        // Snap to nearest card (45 degrees per card)
        const currentRotation = this['rotation'];
        const cardAngle = 45;
        const nearestCardIndex = Math.round(-currentRotation / cardAngle);
        const targetRotation = -nearestCardIndex * cardAngle;
        
        gsap.to(ringElement, {
          rotation: targetRotation,
          duration: 0.8,
          ease: 'power3.out',
          onComplete: () => {
            if (callbacks?.onSnap) callbacks.onSnap(nearestCardIndex);
          }
        });
      },
      snap: (value: number) => {
        // Snap to 45-degree intervals (8 cards)
        return Math.round(value / 45) * 45;
      }
    });

    console.log('[AnimationOrchestrationService] Trabalhos drag interaction configured');
    return draggable[0];
  }

  /**
   * Interrompe e remove animações e instâncias do ScrollTrigger.
   * Crucial para a limpeza no `ngOnDestroy` de componentes para evitar memory leaks.
   * @param target Opcional. O alvo (seletor, elemento) para matar as animações. Se não for fornecido, remove triggers globais.
   */
  public killAll(target?: any): void {
    if (!this.isReady()) return;

    if (target) {
      this._gsap?.killTweensOf(target);
    }
    // Limpa todos os triggers para evitar comportamento inesperado ao navegar entre rotas
    this._ScrollTrigger?.getAll().forEach(trigger => trigger.kill());
  }

  /**
   * Verifica se o serviço está inicializado e rodando no browser.
   */
  public isReady(): boolean {
    return this.isInitialized && isPlatformBrowser(this.platformId);
  }

  // GETTERS para acesso seguro às instâncias do GSAP
  get gsap(): typeof gsap | undefined { return this._gsap; }
  get ScrollTrigger(): typeof ScrollTrigger | undefined { return this._ScrollTrigger; }
  get Draggable(): typeof Draggable | undefined { return this._Draggable; }

  private logNotReadyWarning(methodName: string): void {
    console.warn(
      `[AnimationOrchestrationService] Tentativa de chamar '${methodName}' antes da inicialização. ` +
      `Certifique-se de que 'await animationService.initialize()' foi chamado e concluído.`
    );
  }
}
