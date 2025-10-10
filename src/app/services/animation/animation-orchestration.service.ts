
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Importa apenas os tipos para não carregar a biblioteca no servidor
import type { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Draggable } from 'gsap/Draggable';
import type { InertiaPlugin } from 'gsap/InertiaPlugin';

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
      const [gsapModule, stModule, draggableModule, inertiaModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('gsap/Draggable'),
        import('gsap/InertiaPlugin'), // InertiaPlugin agora é parte do core gratuito do GSAP
      ]);

      this._gsap = gsapModule.gsap;
      this._ScrollTrigger = stModule.ScrollTrigger;
      this._Draggable = draggableModule.Draggable;
      this._InertiaPlugin = inertiaModule.InertiaPlugin;

      // Registra os plugins no GSAP
      this._gsap.registerPlugin(this._ScrollTrigger, this._Draggable, this._InertiaPlugin);

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
   * (Placeholder) Configura o scroll snap global para seções de página inteira.
   * @param sectionSelector O seletor CSS para as seções que devem ter o snap.
   */
  public setupGlobalScrollSnap(sectionSelector: string): void {
    if (!this.isReady()) {
      this.logNotReadyWarning('setupGlobalScrollSnap');
      return;
    }
    // TODO: Implementar a lógica de scroll snap aqui.
    // Exemplo: Usar ScrollTrigger.create() com a opção `snap`.
    console.log(`[AnimationOrchestrationService] Placeholder: Configurando scroll snap para ${sectionSelector}`);
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
   * Interrompe e remove animações e instâncias do ScrollTrigger.
   * Crucial para a limpeza no `ngOnDestroy` de componentes para evitar memory leaks.
   * @param target Opcional. O alvo (seletor, elemento) para matar as animações. Se não for fornecido, remove triggers globais.
   */
  public killAll(target?: gsap.DOMTarget): void {
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
