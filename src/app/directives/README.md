# Directives - Diretivas Angular

Este diretório contém diretivas standalone, reutilizáveis e SSR-safe para o projeto.

## Diretivas Disponíveis

1. **[IoVisibleDirective](#iovisible-directive)** - IntersectionObserver para detecção de visibilidade
2. **[LazyImgDirective](#lazyimg-directive)** - Lazy loading de imagens com fallback

---

# LazyImgDirective - Lazy Image Loading Directive

## Objetivo

Diretiva standalone para lazy loading de imagens com detecção automática de suporte nativo a `loading="lazy"` e fallback via IntersectionObserver para browsers mais antigos. Garante carregamento eficiente de imagens e prevenção de CLS (Cumulative Layout Shift).

## Características

- ✅ **SSR-Safe**: Totalmente compatível com Server-Side Rendering (Angular Universal)
- ✅ **Standalone**: Pode ser importada diretamente sem módulos
- ✅ **Type-Safe**: Totalmente tipada com TypeScript
- ✅ **Testada**: 19 testes unitários cobrindo todos os cenários
- ✅ **Smart Fallback**: Detecta suporte nativo e usa fallback quando necessário
- ✅ **CLS Prevention**: Orientações para evitar Layout Shift
- ✅ **Performática**: Usa recursos nativos do browser sempre que possível

## Instalação

A diretiva está localizada em `src/app/directives/lazy-img.directive.ts`.

Para usar, simplesmente importe no seu componente:

```typescript
import { LazyImgDirective } from '@app/directives';
```

## API

### Inputs

| Input | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `lazySrc` | `string \| undefined` | `undefined` | URL da imagem a ser carregada lazy. Se não fornecido, usa src original |
| `rootMargin` | `string` | `'0px'` | Margem para pré-carregamento (ex: '50px' carrega 50px antes de ficar visível) |
| `threshold` | `number` | `0.01` | Threshold para disparar carregamento (valor entre 0.0 e 1.0) |

### Classes CSS Adicionadas

A diretiva adiciona classes CSS automaticamente durante o ciclo de vida do carregamento (apenas no modo fallback):

| Classe | Quando | Uso |
|--------|--------|-----|
| `lazy-loading` | Durante carregamento | Adicione spinner/skeleton |
| `lazy-loaded` | Após sucesso | Animações de entrada |
| `lazy-error` | Em caso de erro | Estados de erro |

## Exemplos de Uso

### 1. Uso Básico - Lazy Loading Simples

```typescript
import { Component } from '@angular/core';
import { LazyImgDirective } from '@app/directives';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    <img 
      lazyImg
      src="assets/images/photo.jpg"
      alt="Foto do produto"
      width="800"
      height="600">
  `
})
export class GalleryComponent {}
```

**⚠️ Importante**: Sempre defina `width` e `height` para prevenir CLS!

### 2. Com Placeholder e Transição Suave

```typescript
@Component({
  selector: 'app-hero-image',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    <img 
      lazyImg
      [lazySrc]="'assets/images/hero-hd.jpg'"
      src="assets/images/hero-placeholder.jpg"
      alt="Imagem hero"
      width="1920"
      height="1080"
      class="hero-img">
  `,
  styles: [`
    .hero-img {
      width: 100%;
      height: auto;
      transition: opacity 0.3s ease-in-out;
    }
    
    .hero-img.lazy-loading {
      opacity: 0.7;
    }
    
    .hero-img.lazy-loaded {
      opacity: 1;
    }
  `]
})
export class HeroImageComponent {}
```

### 3. Pré-carregamento com rootMargin

```typescript
@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    @for (product of products; track product.id) {
      <div class="product-card">
        <img 
          lazyImg
          [lazySrc]="product.imageUrl"
          [rootMargin]="'200px'"
          src="assets/placeholder.jpg"
          [alt]="product.name"
          width="400"
          height="300">
        <h3>{{ product.name }}</h3>
      </div>
    }
  `
})
export class ProductGridComponent {
  products = [
    { id: 1, name: 'Produto 1', imageUrl: 'assets/product1.jpg' },
    { id: 2, name: 'Produto 2', imageUrl: 'assets/product2.jpg' },
    // ...
  ];
}
```

### 4. Com Skeleton Loader

```typescript
@Component({
  selector: 'app-article-image',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    <div class="image-container">
      <img 
        lazyImg
        [lazySrc]="articleImage"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3C/svg%3E"
        alt="Imagem do artigo"
        width="800"
        height="600"
        class="article-img">
    </div>
  `,
  styles: [`
    .image-container {
      position: relative;
      aspect-ratio: 800 / 600;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    .article-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .article-img.lazy-loaded {
      animation: fadeIn 0.3s ease-in;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ArticleImageComponent {
  articleImage = 'assets/article-hero.jpg';
}
```

### 5. Tratamento de Erro de Carregamento

```typescript
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    <img 
      lazyImg
      [lazySrc]="userAvatar"
      src="assets/avatar-placeholder.jpg"
      alt="Avatar do usuário"
      width="200"
      height="200"
      class="avatar">
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      object-fit: cover;
    }
    
    .avatar.lazy-error {
      /* Fallback para quando a imagem falha ao carregar */
      content: url('assets/avatar-default.jpg');
    }
  `]
})
export class UserAvatarComponent {
  userAvatar = 'https://api.example.com/user/avatar.jpg';
}
```

### 6. Galeria com Múltiplas Imagens

```typescript
@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    <div class="gallery">
      @for (photo of photos; track photo.id) {
        <figure class="gallery-item">
          <img 
            lazyImg
            [lazySrc]="photo.full"
            [src]="photo.thumb"
            [alt]="photo.caption"
            width="400"
            height="300"
            [rootMargin]="'100px'"
            class="gallery-img">
          <figcaption>{{ photo.caption }}</figcaption>
        </figure>
      }
    </div>
  `,
  styles: [`
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .gallery-item {
      margin: 0;
      overflow: hidden;
    }
    
    .gallery-img {
      width: 100%;
      height: auto;
      display: block;
      transition: transform 0.3s ease;
    }
    
    .gallery-img.lazy-loading {
      filter: blur(5px);
    }
    
    .gallery-img.lazy-loaded {
      filter: blur(0);
    }
    
    .gallery-item:hover .gallery-img {
      transform: scale(1.05);
    }
  `]
})
export class PhotoGalleryComponent {
  photos = [
    { 
      id: 1, 
      thumb: 'assets/thumbs/photo1.jpg',
      full: 'assets/photos/photo1.jpg',
      caption: 'Foto 1'
    },
    // ...
  ];
}
```

### 7. Responsive Images com srcset (Combinação Manual)

```typescript
@Component({
  selector: 'app-responsive-image',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    <picture>
      <source 
        media="(min-width: 1200px)" 
        [srcset]="isLoaded ? images.large : ''"
        type="image/webp">
      <source 
        media="(min-width: 768px)" 
        [srcset]="isLoaded ? images.medium : ''"
        type="image/webp">
      <img 
        lazyImg
        [lazySrc]="images.small"
        src="assets/placeholder.jpg"
        (load)="isLoaded = true"
        alt="Imagem responsiva"
        width="1200"
        height="800">
    </picture>
  `
})
export class ResponsiveImageComponent {
  isLoaded = false;
  images = {
    small: 'assets/image-small.jpg',
    medium: 'assets/image-medium.webp',
    large: 'assets/image-large.webp'
  };
}
```

## Prevenção de CLS (Cumulative Layout Shift)

Para evitar Layout Shift e manter boas métricas Core Web Vitals:

### ✅ Sempre Defina Dimensões

```html
<!-- ✅ BOM -->
<img lazyImg 
     src="image.jpg" 
     width="800" 
     height="600"
     alt="Descrição">

<!-- ❌ EVITE -->
<img lazyImg src="image.jpg" alt="Descrição">
```

### ✅ Use Aspect Ratio CSS

```typescript
@Component({
  template: `
    <div class="img-wrapper">
      <img lazyImg src="image.jpg" alt="Descrição">
    </div>
  `,
  styles: [`
    .img-wrapper {
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }
    
    .img-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `]
})
```

### ✅ Use Placeholders com Mesmas Dimensões

```html
<!-- Placeholder e imagem final devem ter mesmas dimensões -->
<img lazyImg
     [lazySrc]="'full-image.jpg'"
     src="placeholder.jpg"
     width="1200"
     height="800"
     alt="Descrição">
```

## Como Funciona

### 1. Detecção de Suporte Nativo

```typescript
// A diretiva verifica automaticamente:
if ('loading' in HTMLImageElement.prototype) {
  // Usa loading="lazy" nativo
  <img loading="lazy" src="...">
} else {
  // Usa IntersectionObserver fallback
}
```

### 2. Modo Nativo (Browsers Modernos)

- Adiciona atributo `loading="lazy"` automaticamente
- Browser gerencia o carregamento
- Performance otimizada pelo browser

### 3. Modo Fallback (Browsers Antigos)

- Usa IntersectionObserver para detectar visibilidade
- Move `src` para `data-src` inicialmente
- Carrega imagem quando entra na viewport
- Adiciona classes CSS para feedback visual

## SSR (Server-Side Rendering)

A diretiva é **completamente SSR-safe**:

- ✅ Não acessa `window` ou `document` diretamente
- ✅ Usa `isPlatformBrowser` para detectar ambiente
- ✅ Não causa erros durante renderização no servidor
- ✅ Funcionalidades só ativam no browser

```typescript
// A diretiva faz isso internamente:
if (!isPlatformBrowser(this.platformId)) {
  return; // Não executa no servidor
}
```

## Compatibilidade

### Suporte Nativo a loading="lazy"

- **Chrome**: 77+
- **Edge**: 79+
- **Firefox**: 75+
- **Safari**: 15.4+
- **Opera**: 64+

### Fallback com IntersectionObserver

- **Chrome**: 51+
- **Edge**: 15+
- **Firefox**: 55+
- **Safari**: 12.1+

### Para Browsers Muito Antigos

Se nem IntersectionObserver estiver disponível, a imagem é carregada imediatamente (graceful degradation).

Para adicionar polyfill:

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
npm test -- --include='**/lazy-img.directive.spec.ts'
```

Testes cobrem (19 testes):

- ✅ Criação da diretiva
- ✅ Detecção de suporte nativo a loading="lazy"
- ✅ Atributo loading="lazy" em browsers modernos
- ✅ Uso de lazySrc vs src original
- ✅ IntersectionObserver fallback
- ✅ Atributo data-src no fallback
- ✅ Carregamento ao entrar na viewport
- ✅ Classes CSS (lazy-loading, lazy-loaded, lazy-error)
- ✅ Tratamento de erro de carregamento
- ✅ Configuração de rootMargin e threshold
- ✅ Desconexão do observer após carregamento
- ✅ Limpeza no destroy
- ✅ Comportamento SSR-safe
- ✅ Graceful degradation sem IntersectionObserver

## Performance

### Métricas Melhoradas

- **LCP (Largest Contentful Paint)**: Imagens above-the-fold carregam primeiro
- **FID (First Input Delay)**: Menos recursos carregados simultaneamente
- **CLS (Cumulative Layout Shift)**: Dimensões definidas previnem shift
- **Bandwidth**: Economiza dados carregando apenas imagens visíveis

### Dicas de Otimização

```typescript
// ✅ BOM - pré-carrega imagens próximas
[rootMargin]="'200px'"

// ✅ BOM - usa placeholders leves
src="data:image/svg+xml,..."  // ~100 bytes

// ✅ BOM - otimiza imagens
// Use WebP, AVIF, compressão adequada

// ❌ EVITE - threshold muito baixo
[threshold]="0"  // carrega muito cedo

// ❌ EVITE - sem dimensões
<img lazyImg src="...">  // causa CLS
```

## Troubleshooting

### Imagem não carrega

1. Verifique o caminho da imagem em `src` ou `lazySrc`
2. Abra DevTools > Network para verificar requisições
3. Verifique console para erros

### Imagem carrega imediatamente (não lazy)

1. Verifique se o browser suporta `loading="lazy"` (comportamento esperado)
2. Em browsers sem suporte, verifique se IntersectionObserver está disponível
3. Confirme que elemento `<img>` tem altura definida

### CLS (Layout Shift) ocorrendo

1. Sempre defina `width` e `height` na tag `<img>`
2. Use `aspect-ratio` CSS como alternativa
3. Garanta que placeholder tem mesmas dimensões da imagem final

### Comportamento inesperado no SSR

1. Verifique se não está acessando `window`/`document` no componente
2. Use `isPlatformBrowser` para guards adicionais
3. Verifique console do servidor para erros

## Comparação: IoVisible vs LazyImg

| Aspecto | IoVisibleDirective | LazyImgDirective |
|---------|-------------------|------------------|
| **Propósito** | Detectar visibilidade genérica | Lazy loading de imagens |
| **Elementos** | Qualquer elemento | Apenas `<img>` |
| **Eventos** | `entered`, `left` | Nenhum (automático) |
| **Suporte Nativo** | Não | Sim (loading="lazy") |
| **Classes CSS** | Não adiciona | Sim (lazy-loading, etc) |
| **Use quando** | Animações, rastreamento | Otimizar carregamento de imagens |

## Boas Práticas

### 1. Sempre Defina Dimensões

```html
<!-- ✅ BOM -->
<img lazyImg src="..." width="800" height="600" alt="...">

<!-- ❌ EVITE -->
<img lazyImg src="..." alt="...">
```

### 2. Use Placeholders Leves

```html
<!-- ✅ BOM - SVG inline ~100 bytes -->
<img lazyImg 
     [lazySrc]="'real.jpg'"
     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3C/svg%3E">

<!-- ✅ BOM - Thumbnail pequeno -->
<img lazyImg 
     [lazySrc]="'full-size.jpg'"
     src="thumb-10kb.jpg">

<!-- ❌ EVITE - Placeholder pesado -->
<img lazyImg 
     [lazySrc]="'image.jpg'"
     src="heavy-placeholder-500kb.jpg">
```

### 3. Ajuste rootMargin para Melhor UX

```html
<!-- ✅ BOM - pré-carrega antes de ficar visível -->
<img lazyImg [rootMargin]="'100px'" src="...">

<!-- ✅ BOM - pré-carrega mais distante para conexões lentas -->
<img lazyImg [rootMargin]="'300px'" src="...">

<!-- ⚠️ CUIDADO - carrega muito cedo -->
<img lazyImg [rootMargin]="'1000px'" src="...">
```

### 4. Combine com Outros Formatos

```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img lazyImg src="image.jpg" alt="..." width="800" height="600">
</picture>
```

## Migração de Código Existente

### Antes (sem lazy loading)

```html
<img src="assets/large-image.jpg" alt="Foto" width="1200" height="800">
```

### Depois (com LazyImgDirective)

```html
<img lazyImg 
     src="assets/large-image.jpg" 
     alt="Foto" 
     width="1200" 
     height="800">
```

ou com placeholder:

```html
<img lazyImg
     [lazySrc]="'assets/large-image.jpg'"
     src="assets/placeholder.jpg"
     alt="Foto"
     width="1200"
     height="800">
```

## Referências

- [MDN - Lazy Loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
- [MDN - loading attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading)
- [MDN - Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Web.dev - Browser-level image lazy loading](https://web.dev/browser-level-image-lazy-loading/)
- [Angular Performance Best Practices](https://angular.dev/best-practices/runtime-performance)
- [Web.dev - Cumulative Layout Shift (CLS)](https://web.dev/cls/)

---

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
