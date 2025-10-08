# IoVisibleDirective - IntersectionObserver Directive

## Objetivo

Diretiva standalone SSR-safe para emitir eventos de entrada/saída de interseção usando IntersectionObserver API, permitindo ativação/desativação de animações de forma segura e performática.

## Características

- ✅ **SSR-Safe**: Totalmente compatível com Server-Side Rendering (Angular Universal)
- ✅ **Standalone**: Pode ser importada diretamente sem módulos
- ✅ **Type-Safe**: Totalmente tipada com TypeScript
- ✅ **Testada**: 15 testes unitários cobrindo todos os cenários
- ✅ **Performática**: Usa IntersectionObserver nativo do browser
- ✅ **Flexível**: Suporta múltiplos thresholds e configurações customizadas

## Instalação

A diretiva está localizada em `src/app/directives/io-visible.directive.ts`.

Para usar, simplesmente importe no seu componente:

```typescript
import { IoVisibleDirective } from '@app/directives';
```

## API

### Inputs

| Input | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `rootMargin` | `string` | `'0px'` | Margem ao redor do root para calcular interseções (similar à propriedade CSS margin) |
| `threshold` | `number \| number[]` | `0` | Threshold(s) para disparar o callback. Valores entre 0.0 e 1.0 |
| `once` | `boolean` | `false` | Se true, observer é desconectado após primeira interseção |

### Outputs

| Output | Tipo | Descrição |
|--------|------|-----------|
| `entered` | `EventEmitter<IntersectionObserverEntry>` | Emitido quando elemento entra na área de interseção |
| `left` | `EventEmitter<IntersectionObserverEntry>` | Emitido quando elemento sai da área de interseção |

## Exemplos de Uso

### 1. Básico - Detectar Visibilidade

```typescript
import { Component } from '@angular/core';
import { IoVisibleDirective } from '@app/directives';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <div ioVisible (entered)="onVisible()" (left)="onHidden()">
      Este elemento será monitorado
    </div>
  `
})
export class MyComponent {
  onVisible(): void {
    console.log('Elemento entrou no viewport!');
  }

  onHidden(): void {
    console.log('Elemento saiu do viewport!');
  }
}
```

### 2. Animação de Fade-in Única

```typescript
@Component({
  selector: 'app-fade-in',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <div 
      ioVisible
      [once]="true"
      [threshold]="0.5"
      (entered)="fadeIn()"
      [class.visible]="isVisible">
      Conteúdo que aparece uma vez
    </div>
  `,
  styles: [`
    div {
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s ease-out;
    }
    
    div.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class FadeInComponent {
  isVisible = false;

  fadeIn(): void {
    this.isVisible = true;
  }
}
```

### 3. Lazy Loading de Imagens

```typescript
@Component({
  selector: 'app-lazy-image',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <img
      ioVisible
      [once]="true"
      [rootMargin]="'50px'"
      (entered)="loadImage()"
      [src]="currentSrc"
      alt="Lazy loaded image">
  `
})
export class LazyImageComponent {
  currentSrc = 'placeholder.jpg';
  realSrc = 'high-resolution-image.jpg';

  loadImage(): void {
    this.currentSrc = this.realSrc;
  }
}
```

### 4. Controle de Animações com Multiple Thresholds

```typescript
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <div
      ioVisible
      [threshold]="[0, 0.25, 0.5, 0.75, 1]"
      (entered)="onProgressChange($event)">
      <div class="progress" [style.width.%]="progress"></div>
    </div>
  `
})
export class ProgressBarComponent {
  progress = 0;

  onProgressChange(entry: IntersectionObserverEntry): void {
    this.progress = entry.intersectionRatio * 100;
  }
}
```

### 5. Toggle de Animações CSS

```typescript
@Component({
  selector: 'app-animated-section',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <section
      ioVisible
      [threshold]="0.2"
      (entered)="isAnimating = true"
      (left)="isAnimating = false"
      [class.animate]="isAnimating">
      <h2>Seção Animada</h2>
      <p>Animação ativa apenas quando visível</p>
    </section>
  `,
  styles: [`
    section {
      transition: all 0.4s;
    }
    
    section.animate {
      animation: slideIn 0.6s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-50px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `]
})
export class AnimatedSectionComponent {
  isAnimating = false;
}
```

### 6. Integração com Animações Canvas/Three.js

```typescript
@Component({
  selector: 'app-canvas-animation',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <canvas
      #canvas
      ioVisible
      [threshold]="0.1"
      (entered)="startAnimation()"
      (left)="stopAnimation()">
    </canvas>
  `
})
export class CanvasAnimationComponent {
  private animationId: number | null = null;

  startAnimation(): void {
    if (this.animationId) return;
    
    const animate = () => {
      // Lógica de animação do canvas
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
```

### 7. Contadores Animados

```typescript
@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <div
      ioVisible
      [once]="true"
      [threshold]="0.8"
      (entered)="startCounting()">
      <span class="counter">{{ currentValue }}</span>
    </div>
  `
})
export class CounterComponent {
  currentValue = 0;
  targetValue = 1000;

  startCounting(): void {
    const duration = 2000; // 2 segundos
    const steps = 60;
    const increment = this.targetValue / steps;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      this.currentValue = Math.min(
        Math.round(increment * step),
        this.targetValue
      );

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);
  }
}
```

## Uso com Serviço de Animação Existente

Integração com `NativeScrollAnimationService`:

```typescript
import { Component, inject } from '@angular/core';
import { IoVisibleDirective } from '@app/directives';
import { NativeScrollAnimationService } from '@app/services/animation';

@Component({
  selector: 'app-scroll-section',
  standalone: true,
  imports: [IoVisibleDirective],
  template: `
    <section
      ioVisible
      [threshold]="0.15"
      (entered)="animateIn()">
      <div class="content" #content>Conteúdo</div>
    </section>
  `
})
export class ScrollSectionComponent {
  private animationService = inject(NativeScrollAnimationService);

  animateIn(): void {
    // Usa serviço existente para animações
    this.animationService.animateElements('.content', {
      opacity: 1,
      y: 0,
      duration: 600,
      easing: 'ease-out'
    });
  }
}
```

## Boas Práticas

### 1. Use `once: true` para Animações Únicas

```typescript
// ✅ Bom - animação ocorre apenas uma vez
<div ioVisible [once]="true" (entered)="animate()">

// ❌ Evite - animação dispara toda vez que entra/sai
<div ioVisible (entered)="animate()">
```

### 2. Ajuste `rootMargin` para Preload

```typescript
// ✅ Bom - carrega antes de ficar visível
<img ioVisible [rootMargin]="'100px'" [once]="true" (entered)="load()">

// ❌ OK mas menos ideal - carrega apenas quando visível
<img ioVisible (entered)="load()">
```

### 3. Use Thresholds Apropriados

```typescript
// ✅ Bom - 50% visível antes de animar
[threshold]="0.5"

// ✅ Bom - múltiplos pontos para animação progressiva
[threshold]="[0, 0.25, 0.5, 0.75, 1]"

// ⚠️ Cuidado - pode disparar muito cedo/tarde
[threshold]="0"  // dispara assim que 1 pixel é visível
[threshold]="1"  // dispara apenas quando 100% visível
```

### 4. Limpe Recursos no OnDestroy

```typescript
@Component({
  // ...
})
export class MyComponent implements OnDestroy {
  private animationId: number | null = null;

  startAnimation(): void {
    this.animationId = requestAnimationFrame(/* ... */);
  }

  ngOnDestroy(): void {
    // A diretiva já limpa o observer, mas limpe seus recursos
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
```

## SSR (Server-Side Rendering)

A diretiva é **completamente SSR-safe**:

- ✅ Não acessa `window` ou `document` diretamente
- ✅ Usa `isPlatformBrowser` para detectar ambiente
- ✅ Não causa erros durante renderização no servidor
- ✅ Observer só é criado no browser

```typescript
// A diretiva faz isso internamente:
if (!isPlatformBrowser(this.platformId)) {
  return; // Não executa no servidor
}
```

## Compatibilidade

- **Angular**: 19.0+
- **IntersectionObserver**: Suportado em todos os browsers modernos
- **SSR**: Totalmente compatível com Angular Universal
- **Browsers**: Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+

Para browsers mais antigos, considere usar um polyfill:
```bash
npm install intersection-observer
```

```typescript
// src/polyfills.ts
import 'intersection-observer';
```

## Testes

A diretiva possui cobertura completa de testes:

```bash
npm test -- --include='**/io-visible.directive.spec.ts'
```

Testes cobrem:
- ✅ Criação da diretiva
- ✅ Inicialização do IntersectionObserver
- ✅ Eventos de entrada/saída
- ✅ Modo `once`
- ✅ Configuração de `threshold` e `rootMargin`
- ✅ Limpeza no destroy
- ✅ Comportamento SSR-safe
- ✅ Graceful degradation sem IntersectionObserver

## Performance

### Vantagens do IntersectionObserver

1. **Assíncrono**: Não bloqueia a thread principal
2. **Eficiente**: Nativo do browser, altamente otimizado
3. **Sem Scroll Listeners**: Não adiciona overhead de eventos scroll
4. **Batching**: Callbacks são executados em batch pelo browser

### Dicas de Performance

```typescript
// ✅ Bom - usa threshold para evitar callbacks desnecessários
[threshold]="0.5"

// ✅ Bom - desconecta após uso
[once]="true"

// ❌ Evite - threshold 0 dispara muitos callbacks
[threshold]="0"
```

## Troubleshooting

### Diretiva não dispara eventos

1. Verifique se o elemento tem altura/largura
2. Verifique se `threshold` está configurado corretamente
3. Use DevTools para verificar se elemento está na viewport

### Comportamento inesperado no SSR

1. Certifique-se de que o código não acessa `window`/`document` diretamente
2. Use `isPlatformBrowser` para guards adicionais
3. Verifique console do servidor para erros

### Múltiplos disparos inesperados

1. Use `once: true` se animação deve ocorrer apenas uma vez
2. Ajuste `threshold` para evitar transições rápidas
3. Considere debounce nos handlers se necessário

## Referências

- [MDN - Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Angular SSR Guide](https://angular.dev/guide/universal)
- [Web.dev - IntersectionObserver](https://web.dev/intersectionobserver/)

## Licença

Este código faz parte do projeto plataforma-frontend.
