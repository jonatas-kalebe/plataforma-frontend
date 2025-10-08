# WorkCardComponent

Componente standalone reutilizável para exibir cards de projetos/trabalhos com suporte completo a acessibilidade WCAG AA.

## 📋 Características

- ✅ Standalone component (Angular 19)
- ✅ Zero dependências externas
- ✅ Totalmente acessível (WCAG AA)
- ✅ Responsivo e fluido
- ✅ Suporte a navegação por teclado
- ✅ Suporte a motion/contrast preferences

## 🚀 Uso Básico

```typescript
import { WorkCardComponent } from '@app/components/ui/work-card/work-card.component';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [WorkCardComponent],
  template: `
    <app-work-card
      title="Meu Projeto"
      subtitle="Descrição do projeto"
      imageUrl="/assets/projeto.jpg"
      ctaUrl="/projetos/meu-projeto">
    </app-work-card>
  `
})
export class MyComponent {}
```

## 📝 API

### Inputs

| Property | Tipo | Required | Default | Descrição |
|----------|------|----------|---------|-----------|
| `title` | `string` | ✅ Sim | - | Título do card |
| `subtitle` | `string` | ❌ Não | - | Descrição/subtítulo |
| `imageUrl` | `string` | ❌ Não | - | URL da imagem (aspect ratio 16:9) |
| `ctaUrl` | `string` | ❌ Não | - | URL de destino (torna o card clicável) |
| `customClass` | `string` | ❌ Não | `''` | Classes CSS adicionais |
| `testId` | `string` | ❌ Não | `'work-card'` | ID para testes automatizados |

## 💡 Exemplos

### Card Completo (com imagem e link)

```html
<app-work-card
  title="E-commerce Platform"
  subtitle="Plataforma completa de vendas online com gestão de estoque"
  imageUrl="https://example.com/ecommerce.jpg"
  ctaUrl="https://example.com/projeto-1"
  testId="card-ecommerce">
</app-work-card>
```

### Card Simples (sem imagem)

```html
<app-work-card
  title="Sistema de Gestão"
  subtitle="Sistema completo para gestão empresarial"
  ctaUrl="/projetos/gestao">
</app-work-card>
```

### Card Não Clicável (informativo)

```html
<app-work-card
  title="Projeto em Desenvolvimento"
  subtitle="Website institucional moderno"
  imageUrl="/assets/em-desenvolvimento.jpg">
</app-work-card>
```

### Grid de Cards

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <app-work-card
    *ngFor="let project of projects"
    [title]="project.title"
    [subtitle]="project.description"
    [imageUrl]="project.image"
    [ctaUrl]="project.url">
  </app-work-card>
</div>
```

## ♿ Acessibilidade

### WCAG AA Compliance

O componente atende todos os critérios WCAG AA:

- **1.4.3 Contrast (Minimum):** Contraste mínimo de 4.5:1 para texto
- **2.1.1 Keyboard:** Navegação completa por teclado
- **2.4.7 Focus Visible:** Outline de 2px visível ao focar
- **4.1.2 Name, Role, Value:** Semântica e ARIA corretos

### Navegação por Teclado

- `Tab` - Navega para o próximo card
- `Shift + Tab` - Navega para o card anterior
- `Enter` ou `Space` - Ativa o link do card (se tiver ctaUrl)

### Estados Visuais

- **Hover:** Elevação e mudança de cor do título
- **Focus:** Outline verde (#64FFDA) com 4px de offset
- **Active:** Indicação visual ao clicar

### Screen Readers

- Todos os cards têm `role="article"`
- Links descritivos com `aria-label`
- Imagens com `alt` text apropriado

## 🎨 Customização

### Classes CSS Customizadas

```html
<app-work-card
  title="Projeto Especial"
  customClass="my-custom-card highlight-card">
</app-work-card>
```

### Variáveis CSS Disponíveis

O componente usa as seguintes variáveis CSS (pode sobrescrever se necessário):

```css
.work-card {
  --card-bg: #112240;
  --card-border: rgba(100, 255, 218, 0.1);
  --card-hover-border: rgba(100, 255, 218, 0.3);
  --card-title-color: #CCD6F6;
  --card-subtitle-color: #8892B0;
  --card-focus-color: #64FFDA;
}
```

## 📱 Responsividade

O componente é totalmente responsivo:

- **Desktop:** Card completo com todas as features
- **Tablet:** Ajustes de padding e tipografia
- **Mobile:** 
  - Redução de border-radius (12px)
  - Touch targets mínimos de 44x44px
  - Tipografia fluida com `clamp()`

### Breakpoints

- `< 768px` - Mobile
- `>= 768px` - Desktop

## 🎭 Estados do Componente

### Card Clicável (com ctaUrl)

- Cursor pointer
- Hover effects
- Navegável por teclado
- Link semântico com `<a>`

### Card Não Clicável (sem ctaUrl)

- Cursor default
- Sem hover effects
- Apenas informativo
- Sem link wrapper

## 🧪 Testes

### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkCardComponent } from './work-card.component';

describe('WorkCardComponent', () => {
  let component: WorkCardComponent;
  let fixture: ComponentFixture<WorkCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkCardComponent);
    component = fixture.componentInstance;
  });

  it('should render title', () => {
    component.title = 'Test Project';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.work-card__title').textContent).toContain('Test Project');
  });

  it('should be clickable when ctaUrl is provided', () => {
    component.title = 'Test';
    component.ctaUrl = 'https://example.com';
    fixture.detectChanges();
    expect(component.isClickable).toBe(true);
  });
});
```

### E2E Tests (Playwright)

```typescript
test('work card should be accessible via keyboard', async ({ page }) => {
  await page.goto('/demo/work-card');
  await page.keyboard.press('Tab');
  
  // Check focus is visible
  const focusedElement = await page.locator(':focus');
  await expect(focusedElement).toHaveCSS('outline', /2px solid/);
});
```

## 🔍 Demo

Execute o servidor de desenvolvimento e acesse:

```bash
npm run serve:ssr:frontend
```

Navegue para: `http://localhost:4000/demo/work-card`

## 📚 Referências

- [Angular Accessibility Guide](https://angular.dev/best-practices/a11y)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## 🐛 Troubleshooting

### Imagem não carrega

Verifique se o `imageUrl` é válido e acessível. O componente usa `loading="lazy"` para otimização.

### Focus não visível

Certifique-se de que não há estilos globais sobrescrevendo `outline` ou `:focus-visible`.

### Card não responde ao hover

Verifique se `ctaUrl` está definido. Apenas cards clicáveis têm hover effects.

## 📄 Licença

Este componente faz parte do projeto Athenity Frontend.
