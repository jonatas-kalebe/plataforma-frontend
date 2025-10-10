
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
