import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Diretiva standalone para emitir eventos de entrada/saída de interseção
 * usando IntersectionObserver API, com suporte completo para SSR.
 * 
 * Esta diretiva é SSR-safe e não acessa window/document diretamente.
 * 
 * @example
 * ```html
 * <div ioVisible
 *      [rootMargin]="'0px'"
 *      [threshold]="0.5"
 *      [once]="false"
 *      (entered)="onEnter()"
 *      (left)="onLeave()">
 *   Conteúdo a ser observado
 * </div>
 * ```
 */
@Directive({
  selector: '[ioVisible]',
  standalone: true
})
export class IoVisibleDirective implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);
  
  /**
   * Margem ao redor do root para calcular interseções.
   * Similar à propriedade CSS margin.
   * @default '0px'
   */
  @Input() rootMargin: string = '0px';
  
  /**
   * Threshold(s) para disparar o callback do observer.
   * Pode ser um único número ou array de números entre 0.0 e 1.0.
   * @default 0
   */
  @Input() threshold: number | number[] = 0;
  
  /**
   * Se true, o observer é desconectado após a primeira interseção (entered).
   * Útil para animações que devem ocorrer apenas uma vez.
   * @default false
   */
  @Input() once: boolean = false;
  
  /**
   * Emitido quando o elemento entra na área de interseção.
   * @param entry - IntersectionObserverEntry contendo informações da interseção
   */
  @Output() entered = new EventEmitter<IntersectionObserverEntry>();
  
  /**
   * Emitido quando o elemento sai da área de interseção.
   * @param entry - IntersectionObserverEntry contendo informações da interseção
   */
  @Output() left = new EventEmitter<IntersectionObserverEntry>();
  
  private observer: IntersectionObserver | null = null;
  private hasEnteredOnce = false;
  
  ngOnInit(): void {
    // Guard para SSR: IntersectionObserver só existe no browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    // Verifica se IntersectionObserver está disponível no browser
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('[IoVisibleDirective] IntersectionObserver não está disponível neste navegador');
      return;
    }
    
    this.setupObserver();
  }
  
  ngOnDestroy(): void {
    this.disconnectObserver();
  }
  
  /**
   * Configura o IntersectionObserver com as opções fornecidas
   */
  private setupObserver(): void {
    const options: IntersectionObserverInit = {
      root: null, // viewport como root
      rootMargin: this.rootMargin,
      threshold: this.threshold
    };
    
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      options
    );
    
    // Observa o elemento host da diretiva
    this.observer.observe(this.elementRef.nativeElement);
  }
  
  /**
   * Handler para eventos de interseção
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Elemento entrou na área de interseção
        this.entered.emit(entry);
        this.hasEnteredOnce = true;
        
        // Se 'once' é true, desconecta após primeira entrada
        if (this.once) {
          this.disconnectObserver();
        }
      } else {
        // Elemento saiu da área de interseção
        // Só emite 'left' se já tiver entrado ao menos uma vez
        if (this.hasEnteredOnce) {
          this.left.emit(entry);
        }
      }
    });
  }
  
  /**
   * Desconecta o observer e limpa recursos
   */
  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
