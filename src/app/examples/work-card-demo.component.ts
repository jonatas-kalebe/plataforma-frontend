/**
 * Work Card Demo Component
 * Demonstrates the WorkCardComponent usage with various configurations
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkCardComponent } from '../components/ui/work-card/work-card.component';

@Component({
  selector: 'app-work-card-demo',
  standalone: true,
  imports: [CommonModule, WorkCardComponent],
  template: `
    <div class="demo-container">
      <header class="demo-header">
        <h1>WorkCardComponent Demo</h1>
        <p>Demonstração do componente WorkCard com diferentes configurações</p>
      </header>
      
      <section class="demo-section">
        <h2>Exemplo 1: Card com imagem e CTA</h2>
        <div class="card-grid">
          <app-work-card
            title="Projeto E-commerce"
            subtitle="Plataforma completa de vendas online com gestão de estoque"
            imageUrl="https://via.placeholder.com/400x225/112240/64FFDA?text=E-commerce"
            ctaUrl="https://example.com/projeto-1"
            testId="work-card-1">
          </app-work-card>
        </div>
      </section>
      
      <section class="demo-section">
        <h2>Exemplo 2: Card sem imagem</h2>
        <div class="card-grid">
          <app-work-card
            title="Sistema de Gestão"
            subtitle="Sistema completo para gestão empresarial"
            ctaUrl="https://example.com/projeto-2"
            testId="work-card-2">
          </app-work-card>
        </div>
      </section>
      
      <section class="demo-section">
        <h2>Exemplo 3: Card não clicável</h2>
        <div class="card-grid">
          <app-work-card
            title="Projeto em Desenvolvimento"
            subtitle="Website institucional moderno com animações 3D"
            imageUrl="https://via.placeholder.com/400x225/112240/FFD700?text=Em+Desenvolvimento"
            testId="work-card-3">
          </app-work-card>
        </div>
      </section>
      
      <section class="demo-section">
        <h2>Exemplo 4: Grid com múltiplos cards</h2>
        <div class="card-grid card-grid--multi">
          <app-work-card
            *ngFor="let project of projects"
            [title]="project.title"
            [subtitle]="project.subtitle"
            [imageUrl]="project.imageUrl"
            [ctaUrl]="project.ctaUrl"
            [testId]="'work-card-' + project.id">
          </app-work-card>
        </div>
      </section>
      
      <section class="demo-section accessibility-notes">
        <h2>Notas de Acessibilidade</h2>
        <ul>
          <li>✓ Foco visível com outline de 2px (WCAG AA)</li>
          <li>✓ Contraste de cores adequado (WCAG AA)</li>
          <li>✓ Suporte a prefers-reduced-motion</li>
          <li>✓ Suporte a prefers-contrast: high</li>
          <li>✓ Touch targets mínimos de 44x44px (mobile)</li>
          <li>✓ Semântica apropriada com role="article"</li>
          <li>✓ ARIA labels descritivos</li>
          <li>✓ Navegação por teclado (Tab + Enter)</li>
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      min-height: 100vh;
      background-color: #0A192F;
      padding: clamp(2rem, 4vw, 4rem);
    }
    
    .demo-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .demo-header h1 {
      font-size: clamp(2rem, 4vw, 3rem);
      color: #CCD6F6;
      margin: 0 0 1rem 0;
    }
    
    .demo-header p {
      font-size: clamp(1rem, 2vw, 1.25rem);
      color: #8892B0;
      margin: 0;
    }
    
    .demo-section {
      margin-bottom: 4rem;
    }
    
    .demo-section h2 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      color: #64FFDA;
      margin: 0 0 1.5rem 0;
      border-bottom: 2px solid rgba(100, 255, 218, 0.2);
      padding-bottom: 0.5rem;
    }
    
    .card-grid {
      display: grid;
      gap: 2rem;
      max-width: 600px;
    }
    
    .card-grid--multi {
      max-width: 100%;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    
    .accessibility-notes {
      background-color: #112240;
      padding: 2rem;
      border-radius: 1rem;
      border: 2px solid rgba(100, 255, 218, 0.3);
    }
    
    .accessibility-notes ul {
      list-style: none;
      padding: 0;
      margin: 1rem 0 0 0;
    }
    
    .accessibility-notes li {
      color: #CCD6F6;
      padding: 0.5rem 0;
      font-size: 1rem;
    }
    
    @media (max-width: 768px) {
      .card-grid--multi {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WorkCardDemoComponent {
  projects = [
    {
      id: 101,
      title: 'Portfolio Pessoal',
      subtitle: 'Website moderno com animações e transições',
      imageUrl: 'https://via.placeholder.com/400x225/112240/64FFDA?text=Portfolio',
      ctaUrl: 'https://example.com/portfolio'
    },
    {
      id: 102,
      title: 'App Mobile',
      subtitle: 'Aplicativo híbrido para iOS e Android',
      imageUrl: 'https://via.placeholder.com/400x225/112240/FFD700?text=Mobile+App',
      ctaUrl: 'https://example.com/app'
    },
    {
      id: 103,
      title: 'Dashboard Analytics',
      subtitle: 'Painel de análise de dados em tempo real',
      imageUrl: 'https://via.placeholder.com/400x225/112240/64FFDA?text=Dashboard',
      ctaUrl: 'https://example.com/dashboard'
    },
    {
      id: 104,
      title: 'API REST',
      subtitle: 'Backend escalável com microserviços',
      ctaUrl: 'https://example.com/api'
    }
  ];
}
