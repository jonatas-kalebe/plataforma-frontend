
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
   * (Placeholder) Configura um efeito de parallax para uma seção "hero".
   * @param selector O seletor CSS do contêiner da seção hero.
   */
  public setupHeroParallax(selector: string): void {
    if (!this.isReady()) {
      this.logNotReadyWarning('setupHeroParallax');
      return;
    }
    // TODO: Implementar a lógica de parallax aqui.
    // Exemplo: Animar elementos com `data-speed` dentro do seletor.
    console.log(`[AnimationOrchestrationService] Placeholder: Configurando parallax para ${selector}`);
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

    // Cria array de posições de snap (início de cada seção)
    const snapPositions = Array.from(sections).map((section) => {
      const element = section as HTMLElement;
      return element.offsetTop;
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
