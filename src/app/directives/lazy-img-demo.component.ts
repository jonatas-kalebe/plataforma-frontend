import { Component } from '@angular/core';
import { LazyImgDirective } from './lazy-img.directive';

/**
 * Componente de exemplo demonstrando o uso da LazyImgDirective
 * Este arquivo serve como referência de implementação
 */
@Component({
  selector: 'app-lazy-img-demo',
  standalone: true,
  imports: [LazyImgDirective],
  template: `
    <div class="demo-container">
      <h2>LazyImgDirective - Exemplos de Uso</h2>
      
      <!-- Exemplo 1: Uso básico -->
      <section class="demo-section">
        <h3>1. Uso Básico</h3>
        <img 
          lazyImg
          src="https://via.placeholder.com/800x600/0ea5e9/ffffff?text=Lazy+Image+1"
          alt="Exemplo de lazy loading básico"
          width="800"
          height="600"
          class="demo-img">
      </section>

      <!-- Exemplo 2: Com placeholder -->
      <section class="demo-section">
        <h3>2. Com Placeholder</h3>
        <img 
          lazyImg
          [lazySrc]="'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=High+Res'"
          src="https://via.placeholder.com/800x600/c084fc/ffffff?text=Placeholder"
          alt="Exemplo com placeholder"
          width="800"
          height="600"
          class="demo-img">
      </section>

      <!-- Exemplo 3: Com pré-carregamento -->
      <section class="demo-section">
        <h3>3. Pré-carregamento (rootMargin: 200px)</h3>
        <img 
          lazyImg
          [lazySrc]="'https://via.placeholder.com/800x600/f59e0b/ffffff?text=Preload'"
          [rootMargin]="'200px'"
          src="https://via.placeholder.com/800x600/fbbf24/ffffff?text=Loading..."
          alt="Exemplo com pré-carregamento"
          width="800"
          height="600"
          class="demo-img">
      </section>

      <!-- Exemplo 4: Galeria com múltiplas imagens -->
      <section class="demo-section">
        <h3>4. Galeria</h3>
        <div class="gallery">
          @for (image of galleryImages; track image.id) {
            <img 
              lazyImg
              [lazySrc]="image.full"
              [src]="image.thumb"
              [alt]="image.alt"
              width="400"
              height="300"
              [rootMargin]="'100px'"
              class="gallery-img">
          }
        </div>
      </section>

      <!-- Exemplo 5: Com transição suave -->
      <section class="demo-section">
        <h3>5. Com Transição Suave</h3>
        <img 
          lazyImg
          [lazySrc]="'https://via.placeholder.com/800x600/10b981/ffffff?text=Smooth+Transition'"
          src="https://via.placeholder.com/800x600/34d399/ffffff?text=Loading..."
          alt="Exemplo com transição suave"
          width="800"
          height="600"
          class="smooth-img">
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .demo-section {
      margin-bottom: 4rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .demo-section h3 {
      margin-bottom: 1rem;
      color: #1f2937;
      font-size: 1.5rem;
    }

    .demo-img {
      display: block;
      width: 100%;
      max-width: 800px;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .gallery-img {
      width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .gallery-img:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    /* Classes adicionadas pela diretiva (apenas no fallback) */
    .gallery-img.lazy-loading {
      filter: blur(3px);
      opacity: 0.7;
    }

    .gallery-img.lazy-loaded {
      filter: blur(0);
      opacity: 1;
    }

    /* Transição suave */
    .smooth-img {
      display: block;
      width: 100%;
      max-width: 800px;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: opacity 0.5s ease-in-out;
    }

    .smooth-img.lazy-loading {
      opacity: 0.5;
    }

    .smooth-img.lazy-loaded {
      opacity: 1;
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .demo-container {
        padding: 1rem;
      }

      .gallery {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LazyImgDemoComponent {
  galleryImages = [
    {
      id: 1,
      thumb: 'https://via.placeholder.com/400x300/ec4899/ffffff?text=Thumb+1',
      full: 'https://via.placeholder.com/400x300/be185d/ffffff?text=Gallery+1',
      alt: 'Imagem de galeria 1'
    },
    {
      id: 2,
      thumb: 'https://via.placeholder.com/400x300/a855f7/ffffff?text=Thumb+2',
      full: 'https://via.placeholder.com/400x300/7c3aed/ffffff?text=Gallery+2',
      alt: 'Imagem de galeria 2'
    },
    {
      id: 3,
      thumb: 'https://via.placeholder.com/400x300/06b6d4/ffffff?text=Thumb+3',
      full: 'https://via.placeholder.com/400x300/0891b2/ffffff?text=Gallery+3',
      alt: 'Imagem de galeria 3'
    },
    {
      id: 4,
      thumb: 'https://via.placeholder.com/400x300/eab308/ffffff?text=Thumb+4',
      full: 'https://via.placeholder.com/400x300/ca8a04/ffffff?text=Gallery+4',
      alt: 'Imagem de galeria 4'
    }
  ];
}
