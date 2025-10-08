# ARIA Ring Accessibility Utilities

## Visão Geral

O módulo `aria-ring` fornece utilitários puros para adicionar suporte de acessibilidade (A11y) a componentes de carrossel/ring. Implementa funções que geram atributos ARIA e mensagens instrutivas seguindo as diretrizes WCAG 2.1 Nível AA e WAI-ARIA best practices.

## Características

✅ **Zero dependências externas** - Apenas TypeScript puro  
✅ **Funções puras** - Sem efeitos colaterais, totalmente testáveis  
✅ **WCAG 2.1 AA** - Segue padrões de acessibilidade reconhecidos  
✅ **Documentação completa** - JSDoc detalhada em todas as funções  
✅ **100% testado** - 39 testes cobrindo todos os casos de uso  
✅ **TypeScript** - Type safety completo  

## Instalação

O módulo está localizado em `src/app/a11y/aria-ring.ts` e pode ser importado diretamente:

```typescript
import { getGroupAttrs, getItemAttrs, getLiveMessage } from '@app/a11y/aria-ring';
```

## API

### `getGroupAttrs(count: number): AriaGroupAttributes`

Retorna atributos ARIA para o elemento container/grupo do carrossel.

**Parâmetros:**
- `count` - Número total de itens no ring (mínimo 1)

**Retorna:** Objeto com atributos ARIA:
- `role` - "group"
- `aria-label` - Descrição do carrossel com contagem de itens
- `aria-roledescription` - "carrossel"
- `aria-live` - "polite"

**Exemplo:**
```typescript
const attrs = getGroupAttrs(8);
// Resultado:
// {
//   role: 'group',
//   'aria-label': 'Carrossel de projetos com 8 itens',
//   'aria-roledescription': 'carrossel',
//   'aria-live': 'polite'
// }

// Aplicar no template:
<div [attr.role]="attrs.role" 
     [attr.aria-label]="attrs['aria-label']"
     [attr.aria-roledescription]="attrs['aria-roledescription']"
     [attr.aria-live]="attrs['aria-live']">
  <!-- ring content -->
</div>
```

### `getItemAttrs(i: number, total: number): AriaItemAttributes`

Retorna atributos ARIA para um item individual do carrossel.

**Parâmetros:**
- `i` - Índice zero-based do item
- `total` - Número total de itens (mínimo 1)

**Retorna:** Objeto com atributos ARIA:
- `role` - "group"
- `aria-label` - "Item X de Y"
- `aria-roledescription` - "item do carrossel"
- `aria-setsize` - Tamanho total do conjunto
- `aria-posinset` - Posição no conjunto (1-based)

**Exemplo:**
```typescript
const attrs = getItemAttrs(0, 8);
// Resultado:
// {
//   role: 'group',
//   'aria-label': 'Item 1 de 8',
//   'aria-roledescription': 'item do carrossel',
//   'aria-setsize': 8,
//   'aria-posinset': 1
// }

// Aplicar no template (usando *ngFor):
<div *ngFor="let item of items; let i = index"
     [attr.role]="getItemAttrs(i, items.length).role"
     [attr.aria-label]="getItemAttrs(i, items.length)['aria-label']"
     [attr.aria-roledescription]="getItemAttrs(i, items.length)['aria-roledescription']"
     [attr.aria-setsize]="getItemAttrs(i, items.length)['aria-setsize']"
     [attr.aria-posinset]="getItemAttrs(i, items.length)['aria-posinset']">
  {{ item.title }}
</div>
```

### `getLiveMessage(state: RingState): string`

Gera mensagens instrutivas para leitores de tela baseadas no estado atual do carrossel.

**Parâmetros:**
- `state.activeIndex` - Índice do item ativo (zero-based)
- `state.total` - Número total de itens
- `state.isRotating` - (Opcional) Se o carrossel está rotacionando
- `state.itemLabel` - (Opcional) Label/título do item ativo

**Retorna:** Mensagem legível para anúncio de leitores de tela

**Exemplos:**
```typescript
// Mensagem básica
getLiveMessage({ activeIndex: 2, total: 8 });
// "Item 3 de 8"

// Com label do item
getLiveMessage({ 
  activeIndex: 2, 
  total: 8, 
  itemLabel: 'Projeto Portfolio' 
});
// "Item 3 de 8: Projeto Portfolio"

// Durante rotação
getLiveMessage({ 
  activeIndex: 2, 
  total: 8, 
  isRotating: true 
});
// "Rotacionando carrossel. Item 3 de 8"

// Todos os parâmetros
getLiveMessage({ 
  activeIndex: 5, 
  total: 8, 
  isRotating: true,
  itemLabel: 'Projeto E-commerce' 
});
// "Rotacionando carrossel. Item 6 de 8: Projeto E-commerce"
```

**Uso em componente:**
```typescript
import { Component } from '@angular/core';
import { getLiveMessage } from '@app/a11y/aria-ring';

@Component({
  selector: 'app-my-ring',
  template: `
    <div [attr.aria-live]="'polite'">
      {{ liveMessage }}
    </div>
  `
})
export class MyRingComponent {
  liveMessage = '';
  
  onActiveIndexChange(index: number) {
    this.liveMessage = getLiveMessage({
      activeIndex: index,
      total: this.items.length,
      itemLabel: this.items[index].title
    });
  }
}
```

## Exemplo Completo de Integração

```typescript
import { Component, OnInit } from '@angular/core';
import { getGroupAttrs, getItemAttrs, getLiveMessage } from '@app/a11y/aria-ring';

@Component({
  selector: 'app-accessible-ring',
  template: `
    <div class="ring-container"
         [attr.role]="groupAttrs.role"
         [attr.aria-label]="groupAttrs['aria-label']"
         [attr.aria-roledescription]="groupAttrs['aria-roledescription']">
      
      <!-- Live region para anúncios -->
      <div class="sr-only" 
           [attr.aria-live]="'polite'" 
           [attr.aria-atomic]="'true'">
        {{ liveMessage }}
      </div>
      
      <!-- Itens do ring -->
      <div *ngFor="let item of items; let i = index"
           class="ring-item"
           [attr.role]="getItemAttrs(i, items.length).role"
           [attr.aria-label]="getItemAttrs(i, items.length)['aria-label']"
           [attr.aria-roledescription]="getItemAttrs(i, items.length)['aria-roledescription']"
           [attr.aria-setsize]="getItemAttrs(i, items.length)['aria-setsize']"
           [attr.aria-posinset]="getItemAttrs(i, items.length)['aria-posinset']">
        {{ item.title }}
      </div>
      
      <!-- Controles opcionais -->
      <button (click)="rotatePrev()" 
              aria-label="Item anterior">
        ← Anterior
      </button>
      <button (click)="rotateNext()" 
              aria-label="Próximo item">
        Próximo →
      </button>
    </div>
  `,
  styles: [`
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
  `]
})
export class AccessibleRingComponent implements OnInit {
  items = [
    { title: 'Projeto 1' },
    { title: 'Projeto 2' },
    { title: 'Projeto 3' }
  ];
  
  activeIndex = 0;
  groupAttrs = getGroupAttrs(this.items.length);
  liveMessage = '';
  
  ngOnInit() {
    this.updateLiveMessage();
  }
  
  getItemAttrs(i: number, total: number) {
    return getItemAttrs(i, total);
  }
  
  rotatePrev() {
    this.activeIndex = (this.activeIndex - 1 + this.items.length) % this.items.length;
    this.updateLiveMessage(true);
  }
  
  rotateNext() {
    this.activeIndex = (this.activeIndex + 1) % this.items.length;
    this.updateLiveMessage(true);
  }
  
  private updateLiveMessage(isRotating = false) {
    this.liveMessage = getLiveMessage({
      activeIndex: this.activeIndex,
      total: this.items.length,
      itemLabel: this.items[this.activeIndex].title,
      isRotating
    });
  }
}
```

## Casos de Borda Tratados

- ✅ Contagens zero ou negativas normalizadas para 1
- ✅ Índices negativos normalizados para 0
- ✅ Índices além do total limitados ao último índice válido
- ✅ Labels vazios tratados graciosamente (sem sufixo adicional)
- ✅ Contagens grandes (100+) suportadas
- ✅ Singular/plural correto ("1 item" vs "2 itens")

## Testes

O módulo possui 39 testes cobrindo:
- ✅ Geração de atributos de grupo
- ✅ Geração de atributos de item
- ✅ Geração de mensagens live
- ✅ Validação de zero dependências
- ✅ Pureza das funções
- ✅ Exportação de tipos TypeScript

Execute os testes:
```bash
npm test -- --include='**/aria-ring.spec.ts'
```

## Conformidade com Padrões

### WCAG 2.1 Nível AA
- ✅ **1.3.1 Info and Relationships** - Estrutura semântica com roles ARIA
- ✅ **2.1.1 Keyboard** - Suporte para navegação por teclado (via controles)
- ✅ **4.1.2 Name, Role, Value** - Todos os componentes têm nomes e roles adequados

### WAI-ARIA Best Practices
- ✅ Uso de `role="group"` para estrutura hierárquica
- ✅ Uso de `aria-label` e `aria-roledescription` para contexto
- ✅ Uso de `aria-setsize` e `aria-posinset` para navegação
- ✅ Uso de `aria-live="polite"` para anúncios não invasivos

## Referências

- [WAI-ARIA Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Angular Accessibility Best Practices](https://angular.dev/best-practices/a11y)
- [MDN ARIA Attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

## Licença

Este módulo faz parte do projeto plataforma-frontend e segue a mesma licença do projeto.
