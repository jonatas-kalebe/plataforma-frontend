/**
 * Integration Example: Adding Accessibility to WorkCardRingComponent
 * 
 * This example demonstrates how to enhance the WorkCardRingComponent
 * with ARIA attributes using the aria-ring utilities.
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkCardRingComponent } from '../components/work-card-ring/work-card-ring.component';
import { getGroupAttrs, getItemAttrs, getLiveMessage } from '../a11y/aria-ring';

@Component({
  selector: 'app-accessible-ring-example',
  standalone: true,
  imports: [CommonModule, WorkCardRingComponent],
  template: `
    <div class="accessible-ring-wrapper">
      <h2>Portfólio de Projetos</h2>
      
      <!-- Screen reader only instructions -->
      <div class="sr-only" role="region" aria-label="Instruções">
        Use as setas esquerda e direita para navegar pelos projetos.
        Pressione Enter para selecionar um projeto.
      </div>
      
      <!-- Accessible ring container with ARIA attributes -->
      <div 
        [attr.role]="groupAttrs().role"
        [attr.aria-label]="groupAttrs()['aria-label']"
        [attr.aria-roledescription]="groupAttrs()['aria-roledescription']"
        tabindex="0"
        (keydown)="handleKeyboard($event)">
        
        <!-- Live region for screen reader announcements -->
        <div 
          class="sr-only" 
          [attr.aria-live]="'polite'" 
          [attr.aria-atomic]="'true'">
          {{ liveMessage() }}
        </div>
        
        <!-- The actual ring component -->
        <app-work-card-ring
          [items]="projects"
          (activeIndexChange)="onActiveIndexChange($event)">
        </app-work-card-ring>
      </div>
      
      <!-- Navigation controls with proper ARIA labels -->
      <div class="ring-controls" role="group" aria-label="Controles de navegação">
        <button 
          (click)="rotatePrevious()"
          aria-label="Projeto anterior"
          [attr.aria-disabled]="isRotating()"
          class="control-btn">
          <span aria-hidden="true">←</span>
          <span class="sr-only">Anterior</span>
        </button>
        
        <div class="position-indicator" aria-hidden="true">
          {{ activeIndex() + 1 }} / {{ projects.length }}
        </div>
        
        <button 
          (click)="rotateNext()"
          aria-label="Próximo projeto"
          [attr.aria-disabled]="isRotating()"
          class="control-btn">
          <span aria-hidden="true">→</span>
          <span class="sr-only">Próximo</span>
        </button>
      </div>
      
      <!-- Current project details -->
      <div 
        class="project-details"
        [attr.aria-live]="'polite'"
        [attr.aria-atomic]="'false'">
        <h3>{{ currentProject()?.title }}</h3>
        <p>{{ currentProject()?.description }}</p>
      </div>
    </div>
  `,
  styles: [`
    .accessible-ring-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .ring-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      margin-top: 2rem;
    }

    .control-btn {
      padding: 0.75rem 1.5rem;
      background: var(--athenity-green-circuit, #64ffda);
      color: var(--athenity-blue-navy, #0a192f);
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1.25rem;
      font-weight: bold;
      transition: all 0.3s ease;
      min-width: 48px;
      min-height: 48px;
    }

    .control-btn:hover:not([aria-disabled="true"]) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(100, 255, 218, 0.4);
    }

    .control-btn:active:not([aria-disabled="true"]) {
      transform: translateY(0);
    }

    .control-btn[aria-disabled="true"] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .control-btn:focus-visible {
      outline: 2px solid var(--athenity-green-circuit, #64ffda);
      outline-offset: 2px;
    }

    .position-indicator {
      font-size: 1.125rem;
      font-weight: bold;
      color: var(--athenity-slate-light, #ccd6f6);
      min-width: 4rem;
      text-align: center;
    }

    .project-details {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--athenity-blue-card, #112240);
      border-radius: 0.75rem;
      border: 1px solid rgba(100, 255, 218, 0.1);
    }

    .project-details h3 {
      margin: 0 0 0.5rem 0;
      color: var(--athenity-slate-lightest, #e6f1ff);
    }

    .project-details p {
      margin: 0;
      color: var(--athenity-slate-light, #ccd6f6);
    }

    h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: var(--athenity-slate-lightest, #e6f1ff);
    }

    /* Ensure keyboard focus is visible on the ring container */
    [tabindex="0"]:focus-visible {
      outline: 2px solid var(--athenity-green-circuit, #64ffda);
      outline-offset: 4px;
      border-radius: 0.5rem;
    }
  `]
})
export class AccessibleRingExampleComponent implements OnInit {
  // Project data
  projects = [
    { 
      id: 1,
      title: 'E-commerce Platform', 
      description: 'Plataforma completa de comércio eletrônico com checkout e gestão de produtos.'
    },
    { 
      id: 2,
      title: 'Portfolio Website', 
      description: 'Site de portfólio responsivo com animações e design moderno.'
    },
    { 
      id: 3,
      title: 'Dashboard Analytics', 
      description: 'Dashboard interativo para visualização de dados e métricas em tempo real.'
    },
    { 
      id: 4,
      title: 'Mobile App', 
      description: 'Aplicativo mobile híbrido com sincronização offline e push notifications.'
    },
    { 
      id: 5,
      title: 'CMS System', 
      description: 'Sistema de gerenciamento de conteúdo com editor visual e versionamento.'
    },
    { 
      id: 6,
      title: 'Social Network', 
      description: 'Rede social com feed em tempo real, mensagens e compartilhamento de mídia.'
    },
    { 
      id: 7,
      title: 'Booking Platform', 
      description: 'Sistema de reservas online com calendário integrado e pagamentos.'
    },
    { 
      id: 8,
      title: 'Learning Management', 
      description: 'Plataforma de ensino à distância com vídeos, quizzes e certificados.'
    }
  ];

  // State signals
  activeIndex = signal(0);
  isRotating = signal(false);
  liveMessage = signal('');
  
  // Computed values
  groupAttrs = signal(getGroupAttrs(this.projects.length));
  currentProject = signal(this.projects[0]);

  ngOnInit() {
    // Initialize with first item message
    this.updateLiveMessage();
  }

  /**
   * Returns ARIA attributes for individual items
   * Used in the template with *ngFor if items are individually accessed
   */
  getItemAttrs(index: number) {
    return getItemAttrs(index, this.projects.length);
  }

  /**
   * Handle active index changes from the ring component
   */
  onActiveIndexChange(index: number) {
    this.activeIndex.set(index);
    this.currentProject.set(this.projects[index]);
    this.updateLiveMessage();
  }

  /**
   * Navigate to previous project
   */
  rotatePrevious() {
    if (this.isRotating()) return;
    
    const newIndex = (this.activeIndex() - 1 + this.projects.length) % this.projects.length;
    this.activeIndex.set(newIndex);
    this.currentProject.set(this.projects[newIndex]);
    this.updateLiveMessage(true);
    
    // Trigger rotation in WorkCardRingComponent would require additional integration
    // For now, this demonstrates the A11y aspect
  }

  /**
   * Navigate to next project
   */
  rotateNext() {
    if (this.isRotating()) return;
    
    const newIndex = (this.activeIndex() + 1) % this.projects.length;
    this.activeIndex.set(newIndex);
    this.currentProject.set(this.projects[newIndex]);
    this.updateLiveMessage(true);
    
    // Trigger rotation in WorkCardRingComponent would require additional integration
    // For now, this demonstrates the A11y aspect
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboard(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.rotatePrevious();
        break;
      
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.rotateNext();
        break;
      
      case 'Home':
        event.preventDefault();
        this.jumpToIndex(0);
        break;
      
      case 'End':
        event.preventDefault();
        this.jumpToIndex(this.projects.length - 1);
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectCurrentProject();
        break;
    }
  }

  /**
   * Jump to specific index
   */
  private jumpToIndex(index: number) {
    if (index < 0 || index >= this.projects.length) return;
    
    this.activeIndex.set(index);
    this.currentProject.set(this.projects[index]);
    this.updateLiveMessage(true);
  }

  /**
   * Select/activate current project (placeholder for actual action)
   */
  private selectCurrentProject() {
    const project = this.currentProject();
    console.log('Selected project:', project);
    
    // Update live message for selection
    this.liveMessage.set(`Projeto selecionado: ${project.title}`);
    
    // Additional actions could go here (navigation, modal, etc.)
  }

  /**
   * Update the live region message for screen readers
   */
  private updateLiveMessage(isRotating = false) {
    const message = getLiveMessage({
      activeIndex: this.activeIndex(),
      total: this.projects.length,
      itemLabel: this.currentProject()?.title,
      isRotating
    });
    
    this.liveMessage.set(message);
    
    // Clear rotating state after a short delay
    if (isRotating) {
      this.isRotating.set(true);
      setTimeout(() => this.isRotating.set(false), 300);
    }
  }
}
