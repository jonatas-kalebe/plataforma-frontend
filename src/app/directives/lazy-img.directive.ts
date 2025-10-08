import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  inject,
  Renderer2
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Diretiva standalone para lazy loading de imagens com fallback via IntersectionObserver.
 * 
 * Esta diretiva é SSR-safe e detecta automaticamente o suporte nativo a loading="lazy".
 * Se o navegador suporta nativamente, usa o atributo. Caso contrário, implementa
 * fallback com IntersectionObserver para browsers mais antigos.
 * 
 * Para prevenir CLS (Cumulative Layout Shift), sempre defina width e height na imagem.
 * 
 * @example
 * ```html
 * <!-- Uso básico -->
 * <img lazyImg
 *      src="path/to/image.jpg"
 *      alt="Descrição da imagem"
 *      width="800"
 *      height="600">
 * 
 * <!-- Com placeholder -->
 * <img lazyImg
 *      [lazySrc]="'high-res-image.jpg'"
 *      src="placeholder.jpg"
 *      alt="Imagem lazy"
 *      width="400"
 *      height="300">
 * 
 * <!-- Com margem de pré-carregamento -->
 * <img lazyImg
 *      [lazySrc]="'image.jpg'"
 *      [rootMargin]="'50px'"
 *      alt="Pré-carregada 50px antes"
 *      width="600"
 *      height="400">
 * ```
 */
@Directive({
  selector: 'img[lazyImg]',
  standalone: true
})
export class LazyImgDirective implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef<HTMLImageElement>);
  private readonly renderer = inject(Renderer2);
  
  /**
   * URL da imagem a ser carregada de forma lazy.
   * Se não fornecido, usa o src original da imagem.
   */
  @Input() lazySrc?: string;
  
  /**
   * Margem ao redor do viewport para começar o carregamento antes.
   * Similar à propriedade CSS margin.
   * @default '0px'
   */
  @Input() rootMargin: string = '0px';
  
  /**
   * Threshold para disparar o carregamento.
   * Valor entre 0.0 e 1.0.
   * @default 0.01
   */
  @Input() threshold: number = 0.01;
  
  private observer: IntersectionObserver | null = null;
  private supportsNativeLoading = false;
  
  ngOnInit(): void {
    // Guard para SSR: só executa no browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const img = this.elementRef.nativeElement;
    
    // Verifica suporte nativo a loading="lazy"
    this.supportsNativeLoading = 'loading' in HTMLImageElement.prototype;
    
    if (this.supportsNativeLoading) {
      // Usa atributo nativo loading="lazy"
      this.renderer.setAttribute(img, 'loading', 'lazy');
      
      // Se lazySrc foi fornecido, atualiza o src
      if (this.lazySrc) {
        this.renderer.setAttribute(img, 'src', this.lazySrc);
      }
    } else {
      // Fallback: usa IntersectionObserver
      this.setupIntersectionObserver();
    }
  }
  
  ngOnDestroy(): void {
    this.disconnectObserver();
  }
  
  /**
   * Configura o IntersectionObserver para fallback em browsers sem suporte nativo
   */
  private setupIntersectionObserver(): void {
    // Verifica se IntersectionObserver está disponível
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('[LazyImgDirective] IntersectionObserver não está disponível. Carregando imagem imediatamente.');
      this.loadImage();
      return;
    }
    
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: this.rootMargin,
      threshold: this.threshold
    };
    
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      options
    );
    
    const img = this.elementRef.nativeElement;
    
    // Se lazySrc foi fornecido, guarda no data-src e mantém placeholder em src
    if (this.lazySrc) {
      this.renderer.setAttribute(img, 'data-src', this.lazySrc);
    } else {
      // Se não tem lazySrc, move o src atual para data-src e usa placeholder
      const currentSrc = img.getAttribute('src');
      if (currentSrc) {
        this.renderer.setAttribute(img, 'data-src', currentSrc);
        // Remove src para evitar carregamento imediato
        this.renderer.removeAttribute(img, 'src');
      }
    }
    
    this.observer.observe(img);
  }
  
  /**
   * Handler para eventos de interseção
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage();
        this.disconnectObserver();
      }
    });
  }
  
  /**
   * Carrega a imagem (usado no fallback)
   */
  private loadImage(): void {
    const img = this.elementRef.nativeElement;
    const dataSrc = img.getAttribute('data-src');
    
    // Se tem data-src, usa ele
    if (dataSrc) {
      // Define o src para iniciar o carregamento
      this.renderer.setAttribute(img, 'src', dataSrc);
      this.renderer.removeAttribute(img, 'data-src');
      
      // Adiciona classe para indicar que está carregando
      this.renderer.addClass(img, 'lazy-loading');
      
      // Remove classe após carregamento
      img.onload = () => {
        this.renderer.removeClass(img, 'lazy-loading');
        this.renderer.addClass(img, 'lazy-loaded');
      };
      
      // Trata erro de carregamento
      img.onerror = () => {
        this.renderer.removeClass(img, 'lazy-loading');
        this.renderer.addClass(img, 'lazy-error');
        console.error('[LazyImgDirective] Erro ao carregar imagem:', dataSrc);
      };
    } else if (this.lazySrc) {
      // Se não tem data-src mas tem lazySrc, usa lazySrc diretamente
      this.renderer.setAttribute(img, 'src', this.lazySrc);
      
      // Adiciona classe para indicar que está carregando
      this.renderer.addClass(img, 'lazy-loading');
      
      // Remove classe após carregamento
      img.onload = () => {
        this.renderer.removeClass(img, 'lazy-loading');
        this.renderer.addClass(img, 'lazy-loaded');
      };
      
      // Trata erro de carregamento
      img.onerror = () => {
        this.renderer.removeClass(img, 'lazy-loading');
        this.renderer.addClass(img, 'lazy-error');
        console.error('[LazyImgDirective] Erro ao carregar imagem:', this.lazySrc);
      };
    }
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
