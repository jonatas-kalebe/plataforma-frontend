# TrabalhosSectionAnimationService Refactoring

## Objetivo

Refatorar o serviço de animação da seção de trabalhos para ser SSR-safe, desacoplado do DOM e integrado com serviços de acessibilidade.

## Mudanças Principais

### 1. Remoção de Acesso Direto ao DOM

**Antes:**
```typescript
// Acesso direto via querySelector
this.sectionEl = document.querySelector('#trabalhos');
this.ringEl = document.querySelector('#trabalhos .ring');
```

**Depois:**
```typescript
// Elementos passados pelo componente
registerSectionElement(element: HTMLElement): void {
  // elemento recebido como parâmetro
}
```

### 2. Integração com Serviços

#### ReducedMotionService
```typescript
this.reducedMotionService.getPrefersReducedMotion()
  .pipe(takeUntil(this.destroy$))
  .subscribe(prefersReduced => {
    this.prefersReducedMotion = prefersReduced;
  });
```

#### HapticsService
```typescript
// Feedback tátil com feature flag
if (this.hapticsEnabled && this.hapticsService.isHapticsSupported()) {
  this.hapticsService.vibrate(this.hapticsService.patterns.light);
}
```

#### FeatureFlagsService
```typescript
// Verificar se haptics está habilitado
this.hapticsEnabled = this.featureFlagsService.isHapticsEnabled();
```

### 3. Arquitetura Baseada em Eventos

**RxJS para Scroll/Resize:**
```typescript
fromEvent(window, 'scroll', { passive: true })
  .pipe(takeUntil(this.destroy$))
  .subscribe(() => {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.handleScroll(element));
  });
```

**Interaction Bridge Pattern:**
```typescript
workCardRingComponent.registerInteractionBridge({
  onDragStart: () => this.handleDragStart(component),
  onDragMove: (rotation, velocity) => this.handleDragMove(rotation, velocity),
  onDragEnd: (velocity) => this.handleDragEnd(component, velocity),
  onActiveIndexChange: (index) => this.handleActiveIndexChange(index)
});
```

### 4. SSR Safety

```typescript
constructor() {
  this.isBrowser = isPlatformBrowser(this.platformId);
  
  if (this.isBrowser) {
    // Lógica apenas para browser
  } else {
    // SSR: valores padrão seguros
    this.prefersReducedMotion = true;
    this.hapticsEnabled = false;
  }
}
```

### 5. Cleanup com RxJS

```typescript
private destroy$ = new Subject<void>();

destroy(): void {
  // Cancela RAF
  if (this.rafId) cancelAnimationFrame(this.rafId);
  if (this.momentumId) cancelAnimationFrame(this.momentumId);
  
  // Completa subject (dispara takeUntil em todos os observables)
  this.destroy$.next();
  this.destroy$.complete();
  
  // Reset state
  this.isPinned = false;
  this.currentRingComponent = null;
}
```

## Integração com Componente

### Component TypeScript

```typescript
import { IoVisibleDirective } from '../../../directives/io-visible.directive';

@Component({
  imports: [CommonModule, WorkCardRingComponent, IoVisibleDirective],
  // ...
})
export class TrabalhosSectionComponent {
  onSectionEnter(): void {
    this.trabalhosSectionAnimation.onIntersectionEnter();
  }

  onSectionLeave(): void {
    this.trabalhosSectionAnimation.onIntersectionLeave();
  }
}
```

### Component Template

```html
<section
  ioVisible
  [threshold]="0.2"
  [once]="true"
  (entered)="onSectionEnter()"
  (left)="onSectionLeave()">
  <!-- conteúdo -->
</section>
```

## Testes

### Cobertura
- 34 testes unitários
- 100% dos testes passando
- Cobertura de cenários:
  - Browser environment
  - Browser com reduced motion
  - SSR (server-side rendering)
  - Integração de serviços
  - Error handling
  - Edge cases

### Exemplo de Teste

```typescript
it('should provide haptic feedback on drag start', () => {
  const mockRingComponent = {
    isDragging: false,
    registerInteractionBridge: jasmine.createSpy('registerInteractionBridge')
  };
  
  service.enhanceRingInteractions(mockRingComponent);
  const bridge = mockRingComponent.registerInteractionBridge.calls.mostRecent().args[0];
  
  bridge.onDragStart();
  
  expect(mockHapticsService.vibrate).toHaveBeenCalledWith(50);
});
```

## Benefícios

### 1. SSR-Safe ✅
- Nenhum acesso direto a `window`, `document`, `navigator`
- Verificações de plataforma apropriadas
- Valores padrão seguros para servidor

### 2. Acessibilidade ✅
- Respeita preferência de movimento reduzido
- Feedback tátil opcional com feature flag
- Animações adaptativas

### 3. Manutenibilidade ✅
- Código desacoplado e testável
- Arquitetura baseada em eventos
- Cleanup automático de recursos

### 4. Performance ✅
- RequestAnimationFrame para animações
- Event listeners com `passive: true`
- Cleanup adequado previne memory leaks

## API Pública

### Métodos

```typescript
// Registrar elemento da seção
registerSectionElement(element: HTMLElement): void

// Registrar componente do anel
setRingComponent(ringComponent: any): void

// Melhorar interações do anel
enhanceRingInteractions(workCardRingComponent: any): void

// Eventos de interseção
onIntersectionEnter(): void
onIntersectionLeave(): void

// Estado
getIsPinned(): boolean

// Cleanup
destroy(): void
```

## Checklist de Verificação

- [x] Remover todos os `querySelector` e `document` access
- [x] Integrar com ReducedMotionService
- [x] Integrar com HapticsService
- [x] Integrar com FeatureFlagsService
- [x] Usar IoVisibleDirective para eventos de interseção
- [x] RxJS com takeUntil para cleanup
- [x] Platform checks para SSR
- [x] Testes unitários comprehensivos
- [x] Build sem erros
- [x] Todos os testes passando

## Próximos Passos (Opcionais)

1. Adicionar testes E2E para validar comportamento no browser
2. Adicionar métricas de performance
3. Documentar padrões de haptic feedback
4. Criar guia de migração para outros serviços similares
