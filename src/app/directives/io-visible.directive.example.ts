/**
 * Exemplo de integração da diretiva IoVisibleDirective
 * com o componente FilosofiaSectionComponent existente.
 * 
 * Este arquivo demonstra como refatorar o código existente
 * para usar a diretiva ao invés de criar IntersectionObserver manualmente.
 */

import {
  Component,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IoVisibleDirective } from '../../directives/io-visible.directive';

/**
 * ANTES: Código original que cria IntersectionObserver manualmente
 * 
 * private setupIntersectionAnimations(): void {
 *   const left = this.contentLeft?.nativeElement;
 *   const box = this.canvasBox?.nativeElement;
 *   if (!left || !box) return;
 * 
 *   const io = new IntersectionObserver(
 *     (entries) => {
 *       entries.forEach((entry) => {
 *         (entry.target as HTMLElement).classList.toggle('visible', entry.isIntersecting);
 *       });
 *     },
 *     { threshold: 0.15 }
 *   );
 * 
 *   io.observe(left);
 *   io.observe(box);
 * }
 */

/**
 * DEPOIS: Usando a diretiva IoVisibleDirective
 */
@Component({
  selector: 'app-filosofia-section-example',
  standalone: true,
  imports: [CommonModule, IoVisibleDirective],
  template: `
    <section class="filosofia-section">
      <!-- Content Left com diretiva -->
      <div 
        #contentLeft
        class="content-left"
        ioVisible
        [threshold]="0.15"
        [once]="false"
        (entered)="onContentLeftEntered()"
        (left)="onContentLeftLeft()">
        <h2>Da Complexidade à Clareza.</h2>
        <p>Transformamos sistemas caóticos em experiências nítidas.</p>
      </div>

      <!-- Canvas Box com diretiva -->
      <div 
        #canvasBox
        class="canvas-box"
        ioVisible
        [threshold]="0.15"
        [once]="false"
        (entered)="onCanvasBoxEntered()"
        (left)="onCanvasBoxLeft()">
        <!-- Canvas ou SVG aqui -->
      </div>
    </section>
  `,
  styles: [`
    .content-left,
    .canvas-box {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }

    .content-left.visible,
    .canvas-box.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class FilosofiaSectionExampleComponent {
  @ViewChild('contentLeft', { static: false }) contentLeft!: ElementRef<HTMLElement>;
  @ViewChild('canvasBox', { static: false }) canvasBox!: ElementRef<HTMLElement>;

  /**
   * Handler quando contentLeft entra no viewport
   */
  onContentLeftEntered(): void {
    this.contentLeft.nativeElement.classList.add('visible');
  }

  /**
   * Handler quando contentLeft sai do viewport
   */
  onContentLeftLeft(): void {
    this.contentLeft.nativeElement.classList.remove('visible');
  }

  /**
   * Handler quando canvasBox entra no viewport
   */
  onCanvasBoxEntered(): void {
    this.canvasBox.nativeElement.classList.add('visible');
  }

  /**
   * Handler quando canvasBox sai do viewport
   */
  onCanvasBoxLeft(): void {
    this.canvasBox.nativeElement.classList.remove('visible');
  }
}

/**
 * ABORDAGEM ALTERNATIVA: Usando um único handler
 * 
 * Esta abordagem é mais limpa e segue o princípio DRY
 */
@Component({
  selector: 'app-filosofia-section-alternative',
  standalone: true,
  imports: [CommonModule, IoVisibleDirective],
  template: `
    <section class="filosofia-section">
      <div 
        #contentLeft
        class="content-left"
        ioVisible
        [threshold]="0.15"
        (entered)="toggleVisibility(contentLeft, true)"
        (left)="toggleVisibility(contentLeft, false)">
        <h2>Da Complexidade à Clareza.</h2>
        <p>Transformamos sistemas caóticos em experiências nítidas.</p>
      </div>

      <div 
        #canvasBox
        class="canvas-box"
        ioVisible
        [threshold]="0.15"
        (entered)="toggleVisibility(canvasBox, true)"
        (left)="toggleVisibility(canvasBox, false)">
        <!-- Canvas ou SVG aqui -->
      </div>
    </section>
  `,
  styles: [`
    .content-left,
    .canvas-box {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }

    .content-left.visible,
    .canvas-box.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class FilosofiaSectionAlternativeComponent {
  /**
   * Toggle visibility class em qualquer elemento
   */
  toggleVisibility(element: ElementRef<HTMLElement>, visible: boolean): void {
    element.nativeElement.classList.toggle('visible', visible);
  }
}

/**
 * ABORDAGEM MAIS SIMPLES: Usando apenas CSS
 * 
 * Esta é a abordagem mais limpa - a diretiva apenas adiciona/remove uma classe,
 * e todo o styling é feito via CSS.
 */
@Component({
  selector: 'app-filosofia-section-simple',
  standalone: true,
  imports: [CommonModule, IoVisibleDirective],
  template: `
    <section class="filosofia-section">
      <div 
        class="content-left"
        ioVisible
        [threshold]="0.15"
        [class.is-visible]="true"
        (entered)="isContentVisible = true"
        (left)="isContentVisible = false"
        [class.visible]="isContentVisible">
        <h2>Da Complexidade à Clareza.</h2>
        <p>Transformamos sistemas caóticos em experiências nítidas.</p>
      </div>

      <div 
        class="canvas-box"
        ioVisible
        [threshold]="0.15"
        (entered)="isCanvasVisible = true"
        (left)="isCanvasVisible = false"
        [class.visible]="isCanvasVisible">
        <!-- Canvas ou SVG aqui -->
      </div>
    </section>
  `,
  styles: [`
    .content-left,
    .canvas-box {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }

    .content-left.visible,
    .canvas-box.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class FilosofiaSectionSimpleComponent {
  isContentVisible = false;
  isCanvasVisible = false;
}

/**
 * VANTAGENS DA DIRETIVA:
 * 
 * 1. ✅ SSR-Safe: Não quebra em ambiente Node.js
 * 2. ✅ Reutilizável: Pode ser usada em qualquer componente
 * 3. ✅ Declarativa: Configuração no template é mais legível
 * 4. ✅ Menos código: Não precisa gerenciar lifecycle do Observer
 * 5. ✅ Testável: Diretiva tem seus próprios testes isolados
 * 6. ✅ Type-safe: IntersectionObserverEntry tipado corretamente
 * 
 * COMPARAÇÃO DE LINHAS DE CÓDIGO:
 * 
 * Abordagem Manual (Original):
 * - ~20 linhas no componente
 * - Observer criado e gerenciado manualmente
 * - Necessário limpar no OnDestroy
 * - Guard SSR manual
 * 
 * Com Diretiva:
 * - ~3 linhas no template
 * - ~2 linhas no componente (properties)
 * - Sem gerenciamento de lifecycle
 * - SSR-safe automaticamente
 */
