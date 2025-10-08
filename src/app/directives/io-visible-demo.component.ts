import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IoVisibleDirective } from '../../directives/io-visible.directive';

/**
 * Página de demonstração da diretiva IoVisibleDirective
 * 
 * Esta página demonstra diferentes casos de uso da diretiva
 * e pode ser usada para testes visuais e manuais.
 * 
 * Para testar localmente:
 * 1. Importe este componente em app.routes.ts
 * 2. Navegue para a rota correspondente
 * 3. Role a página para ver as animações
 */
@Component({
  selector: 'app-io-visible-demo',
  standalone: true,
  imports: [CommonModule, IoVisibleDirective],
  template: `
    <div class="demo-page">
      <header class="hero">
        <h1>IoVisibleDirective Demo</h1>
        <p>Role para baixo para ver as animações em ação</p>
      </header>

      <section class="demo-section">
        <h2>1. Fade In Básico</h2>
        <p>Animação simples de fade-in ao entrar no viewport</p>
        <div
          ioVisible
          [threshold]="0.5"
          [once]="true"
          (entered)="onBox1Enter()"
          class="demo-box"
          [class.visible]="box1Visible">
          <div class="content">
            <h3>Fade In</h3>
            <p>Aparece uma vez quando 50% visível</p>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>2. Slide In da Esquerda</h2>
        <p>Elemento desliza da esquerda</p>
        <div
          ioVisible
          [threshold]="0.3"
          [once]="true"
          (entered)="onBox2Enter()"
          class="demo-box slide-left"
          [class.visible]="box2Visible">
          <div class="content">
            <h3>Slide Left</h3>
            <p>Desliza da esquerda ao entrar</p>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>3. Slide In da Direita</h2>
        <p>Elemento desliza da direita</p>
        <div
          ioVisible
          [threshold]="0.3"
          [once]="true"
          (entered)="onBox3Enter()"
          class="demo-box slide-right"
          [class.visible]="box3Visible">
          <div class="content">
            <h3>Slide Right</h3>
            <p>Desliza da direita ao entrar</p>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>4. Toggle - Entra e Sai</h2>
        <p>Animação que dispara ao entrar E ao sair</p>
        <div
          ioVisible
          [threshold]="0.5"
          [once]="false"
          (entered)="onBox4Enter()"
          (left)="onBox4Leave()"
          class="demo-box toggle"
          [class.visible]="box4Visible">
          <div class="content">
            <h3>Toggle Animation</h3>
            <p>Status: {{ box4Visible ? 'Visível' : 'Oculto' }}</p>
            <p>Entra: {{ box4EnterCount }}x | Sai: {{ box4LeaveCount }}x</p>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>5. Scale + Rotate</h2>
        <p>Combinação de escala e rotação</p>
        <div
          ioVisible
          [threshold]="0.4"
          [once]="true"
          (entered)="onBox5Enter()"
          class="demo-box scale-rotate"
          [class.visible]="box5Visible">
          <div class="content">
            <h3>Scale & Rotate</h3>
            <p>Cresce e rotaciona ao entrar</p>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>6. Contador Animado</h2>
        <p>Contador que anima ao entrar no viewport</p>
        <div
          ioVisible
          [threshold]="0.6"
          [once]="true"
          (entered)="startCounter()"
          class="demo-box counter"
          [class.visible]="counterVisible">
          <div class="content">
            <h3>Contador</h3>
            <p class="counter-value">{{ currentCount }}</p>
            <p>Meta: {{ targetCount }}</p>
          </div>
        </div>
      </section>

      <section class="demo-section">
        <h2>7. Múltiplos Elementos</h2>
        <p>Vários elementos com delays diferentes</p>
        <div class="multi-boxes">
          <div
            *ngFor="let box of multiBoxes; let i = index"
            ioVisible
            [threshold]="0.5"
            [once]="true"
            (entered)="onMultiBoxEnter(i)"
            class="demo-box mini"
            [class.visible]="box.visible"
            [style.transition-delay]="box.delay">
            <div class="content">
              <p>Box {{ i + 1 }}</p>
            </div>
          </div>
        </div>
      </section>

      <footer class="demo-footer">
        <p>Fim da demonstração - Role de volta para o topo</p>
      </footer>
    </div>
  `,
  styles: [`
    .demo-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .hero {
      text-align: center;
      color: white;
      padding: 4rem 2rem;
      margin-bottom: 4rem;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .hero p {
      font-size: 1.5rem;
      opacity: 0.9;
    }

    .demo-section {
      max-width: 800px;
      margin: 4rem auto;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
    }

    .demo-section h2 {
      color: white;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .demo-section > p {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 2rem;
    }

    .demo-box {
      background: white;
      padding: 3rem;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .demo-box .content h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #667eea;
    }

    .demo-box .content p {
      color: #666;
      margin: 0.5rem 0;
    }

    /* Animação Fade In */
    .demo-box.visible {
      opacity: 1;
    }

    /* Animação Slide Left */
    .demo-box.slide-left {
      transform: translateX(-100px);
    }

    .demo-box.slide-left.visible {
      transform: translateX(0);
      opacity: 1;
    }

    /* Animação Slide Right */
    .demo-box.slide-right {
      transform: translateX(100px);
    }

    .demo-box.slide-right.visible {
      transform: translateX(0);
      opacity: 1;
    }

    /* Animação Toggle */
    .demo-box.toggle {
      transform: scale(0.8);
    }

    .demo-box.toggle.visible {
      opacity: 1;
      transform: scale(1);
    }

    /* Animação Scale + Rotate */
    .demo-box.scale-rotate {
      transform: scale(0) rotate(-180deg);
    }

    .demo-box.scale-rotate.visible {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }

    /* Contador */
    .demo-box.counter .counter-value {
      font-size: 4rem;
      font-weight: 700;
      color: #667eea;
      text-align: center;
      margin: 2rem 0;
    }

    /* Múltiplos Boxes */
    .multi-boxes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .demo-box.mini {
      padding: 1.5rem;
    }

    .demo-box.mini .content p {
      font-weight: 600;
      color: #667eea;
      text-align: center;
      margin: 0;
    }

    .demo-footer {
      text-align: center;
      color: white;
      padding: 4rem 2rem;
      margin-top: 4rem;
    }

    .demo-footer p {
      font-size: 1.2rem;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }

      .hero p {
        font-size: 1.2rem;
      }

      .demo-section h2 {
        font-size: 1.5rem;
      }

      .demo-box {
        padding: 2rem;
      }

      .demo-box.counter .counter-value {
        font-size: 3rem;
      }
    }
  `]
})
export class IoVisibleDemoComponent {
  // Box 1 - Fade In
  box1Visible = false;

  // Box 2 - Slide Left
  box2Visible = false;

  // Box 3 - Slide Right
  box3Visible = false;

  // Box 4 - Toggle
  box4Visible = false;
  box4EnterCount = 0;
  box4LeaveCount = 0;

  // Box 5 - Scale Rotate
  box5Visible = false;

  // Box 6 - Counter
  counterVisible = false;
  currentCount = 0;
  targetCount = 1234;
  private counterInterval: any = null;

  // Box 7 - Multiple
  multiBoxes = Array.from({ length: 6 }, (_, i) => ({
    visible: false,
    delay: `${i * 100}ms`
  }));

  onBox1Enter(): void {
    this.box1Visible = true;
  }

  onBox2Enter(): void {
    this.box2Visible = true;
  }

  onBox3Enter(): void {
    this.box3Visible = true;
  }

  onBox4Enter(): void {
    this.box4Visible = true;
    this.box4EnterCount++;
  }

  onBox4Leave(): void {
    this.box4Visible = false;
    this.box4LeaveCount++;
  }

  onBox5Enter(): void {
    this.box5Visible = true;
  }

  startCounter(): void {
    if (this.counterInterval) return;
    
    this.counterVisible = true;
    const duration = 2000;
    const steps = 60;
    const increment = this.targetCount / steps;
    const interval = duration / steps;

    let step = 0;
    this.counterInterval = setInterval(() => {
      step++;
      this.currentCount = Math.min(
        Math.round(increment * step),
        this.targetCount
      );

      if (step >= steps) {
        clearInterval(this.counterInterval);
        this.counterInterval = null;
      }
    }, interval);
  }

  onMultiBoxEnter(index: number): void {
    this.multiBoxes[index].visible = true;
  }

  ngOnDestroy(): void {
    if (this.counterInterval) {
      clearInterval(this.counterInterval);
    }
  }
}
