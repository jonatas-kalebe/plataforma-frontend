import { getGroupAttrs, getItemAttrs, getLiveMessage, AriaGroupAttributes, AriaItemAttributes } from './aria-ring';

describe('aria-ring utilities', () => {
  
  describe('getGroupAttrs', () => {
    it('should return correct ARIA attributes for typical count', () => {
      const attrs = getGroupAttrs(8);
      
      expect(attrs.role).toBe('group');
      expect(attrs['aria-label']).toBe('Carrossel de projetos com 8 itens');
      expect(attrs['aria-roledescription']).toBe('carrossel');
      expect(attrs['aria-live']).toBe('polite');
    });

    it('should handle singular item correctly', () => {
      const attrs = getGroupAttrs(1);
      
      expect(attrs['aria-label']).toBe('Carrossel de projetos com 1 item');
    });

    it('should handle plural items correctly', () => {
      const attrs = getGroupAttrs(2);
      
      expect(attrs['aria-label']).toBe('Carrossel de projetos com 2 itens');
    });

    it('should normalize zero count to 1', () => {
      const attrs = getGroupAttrs(0);
      
      expect(attrs['aria-label']).toBe('Carrossel de projetos com 1 item');
    });

    it('should normalize negative count to 1', () => {
      const attrs = getGroupAttrs(-5);
      
      expect(attrs['aria-label']).toBe('Carrossel de projetos com 1 item');
    });

    it('should handle large counts', () => {
      const attrs = getGroupAttrs(100);
      
      expect(attrs['aria-label']).toBe('Carrossel de projetos com 100 itens');
    });

    it('should return all required ARIA keys', () => {
      const attrs = getGroupAttrs(5);
      
      expect(Object.keys(attrs)).toContain('role');
      expect(Object.keys(attrs)).toContain('aria-label');
      expect(Object.keys(attrs)).toContain('aria-roledescription');
      expect(Object.keys(attrs)).toContain('aria-live');
    });

    it('should return consistent results for same input', () => {
      const attrs1 = getGroupAttrs(8);
      const attrs2 = getGroupAttrs(8);
      
      expect(attrs1).toEqual(attrs2);
    });
  });

  describe('getItemAttrs', () => {
    it('should return correct ARIA attributes for first item', () => {
      const attrs = getItemAttrs(0, 8);
      
      expect(attrs.role).toBe('group');
      expect(attrs['aria-label']).toBe('Item 1 de 8');
      expect(attrs['aria-roledescription']).toBe('item do carrossel');
      expect(attrs['aria-setsize']).toBe(8);
      expect(attrs['aria-posinset']).toBe(1);
    });

    it('should return correct ARIA attributes for middle item', () => {
      const attrs = getItemAttrs(4, 8);
      
      expect(attrs['aria-label']).toBe('Item 5 de 8');
      expect(attrs['aria-posinset']).toBe(5);
    });

    it('should return correct ARIA attributes for last item', () => {
      const attrs = getItemAttrs(7, 8);
      
      expect(attrs['aria-label']).toBe('Item 8 de 8');
      expect(attrs['aria-posinset']).toBe(8);
    });

    it('should handle single item correctly', () => {
      const attrs = getItemAttrs(0, 1);
      
      expect(attrs['aria-label']).toBe('Item 1 de 1');
      expect(attrs['aria-setsize']).toBe(1);
      expect(attrs['aria-posinset']).toBe(1);
    });

    it('should clamp negative index to 0', () => {
      const attrs = getItemAttrs(-1, 8);
      
      expect(attrs['aria-label']).toBe('Item 1 de 8');
      expect(attrs['aria-posinset']).toBe(1);
    });

    it('should clamp index beyond total to last valid index', () => {
      const attrs = getItemAttrs(10, 8);
      
      expect(attrs['aria-label']).toBe('Item 8 de 8');
      expect(attrs['aria-posinset']).toBe(8);
    });

    it('should normalize zero total to 1', () => {
      const attrs = getItemAttrs(0, 0);
      
      expect(attrs['aria-setsize']).toBe(1);
      expect(attrs['aria-posinset']).toBe(1);
    });

    it('should normalize negative total to 1', () => {
      const attrs = getItemAttrs(0, -5);
      
      expect(attrs['aria-setsize']).toBe(1);
    });

    it('should return all required ARIA keys', () => {
      const attrs = getItemAttrs(3, 8);
      
      expect(Object.keys(attrs)).toContain('role');
      expect(Object.keys(attrs)).toContain('aria-label');
      expect(Object.keys(attrs)).toContain('aria-roledescription');
      expect(Object.keys(attrs)).toContain('aria-setsize');
      expect(Object.keys(attrs)).toContain('aria-posinset');
    });

    it('should return consistent results for same input', () => {
      const attrs1 = getItemAttrs(3, 8);
      const attrs2 = getItemAttrs(3, 8);
      
      expect(attrs1).toEqual(attrs2);
    });

    it('should handle large total counts', () => {
      const attrs = getItemAttrs(99, 100);
      
      expect(attrs['aria-label']).toBe('Item 100 de 100');
      expect(attrs['aria-setsize']).toBe(100);
      expect(attrs['aria-posinset']).toBe(100);
    });
  });

  describe('getLiveMessage', () => {
    it('should generate basic message with position', () => {
      const message = getLiveMessage({ activeIndex: 0, total: 8 });
      
      expect(message).toBe('Item 1 de 8');
    });

    it('should generate message for middle item', () => {
      const message = getLiveMessage({ activeIndex: 4, total: 8 });
      
      expect(message).toBe('Item 5 de 8');
    });

    it('should generate message for last item', () => {
      const message = getLiveMessage({ activeIndex: 7, total: 8 });
      
      expect(message).toBe('Item 8 de 8');
    });

    it('should include item label when provided', () => {
      const message = getLiveMessage({ 
        activeIndex: 2, 
        total: 8, 
        itemLabel: 'Projeto Portfolio' 
      });
      
      expect(message).toBe('Item 3 de 8: Projeto Portfolio');
    });

    it('should include rotating state when isRotating is true', () => {
      const message = getLiveMessage({ 
        activeIndex: 2, 
        total: 8, 
        isRotating: true 
      });
      
      expect(message).toBe('Rotacionando carrossel. Item 3 de 8');
    });

    it('should handle all parameters together', () => {
      const message = getLiveMessage({ 
        activeIndex: 5, 
        total: 8, 
        isRotating: true,
        itemLabel: 'Projeto E-commerce' 
      });
      
      expect(message).toBe('Rotacionando carrossel. Item 6 de 8: Projeto E-commerce');
    });

    it('should handle single item', () => {
      const message = getLiveMessage({ activeIndex: 0, total: 1 });
      
      expect(message).toBe('Item 1 de 1');
    });

    it('should normalize negative activeIndex to 0', () => {
      const message = getLiveMessage({ activeIndex: -1, total: 8 });
      
      expect(message).toBe('Item 1 de 8');
    });

    it('should clamp activeIndex beyond total', () => {
      const message = getLiveMessage({ activeIndex: 10, total: 8 });
      
      expect(message).toBe('Item 8 de 8');
    });

    it('should normalize zero total to 1', () => {
      const message = getLiveMessage({ activeIndex: 0, total: 0 });
      
      expect(message).toBe('Item 1 de 1');
    });

    it('should normalize negative total to 1', () => {
      const message = getLiveMessage({ activeIndex: 0, total: -5 });
      
      expect(message).toBe('Item 1 de 1');
    });

    it('should handle empty string label gracefully', () => {
      const message = getLiveMessage({ 
        activeIndex: 0, 
        total: 8, 
        itemLabel: '' 
      });
      
      expect(message).toBe('Item 1 de 8');
    });

    it('should not include rotating prefix when isRotating is false', () => {
      const message = getLiveMessage({ 
        activeIndex: 2, 
        total: 8, 
        isRotating: false 
      });
      
      expect(message).toBe('Item 3 de 8');
    });

    it('should return consistent results for same input', () => {
      const message1 = getLiveMessage({ activeIndex: 3, total: 8 });
      const message2 = getLiveMessage({ activeIndex: 3, total: 8 });
      
      expect(message1).toBe(message2);
    });

    it('should handle large total counts', () => {
      const message = getLiveMessage({ activeIndex: 99, total: 100 });
      
      expect(message).toBe('Item 100 de 100');
    });
  });

  describe('Zero dependencies validation', () => {
    it('getGroupAttrs should be a pure function', () => {
      const result1 = getGroupAttrs(5);
      const result2 = getGroupAttrs(5);
      
      expect(result1).toEqual(result2);
      expect(typeof getGroupAttrs).toBe('function');
    });

    it('getItemAttrs should be a pure function', () => {
      const result1 = getItemAttrs(2, 5);
      const result2 = getItemAttrs(2, 5);
      
      expect(result1).toEqual(result2);
      expect(typeof getItemAttrs).toBe('function');
    });

    it('getLiveMessage should be a pure function', () => {
      const state = { activeIndex: 2, total: 5 };
      const result1 = getLiveMessage(state);
      const result2 = getLiveMessage(state);
      
      expect(result1).toBe(result2);
      expect(typeof getLiveMessage).toBe('function');
    });
  });

  describe('TypeScript type exports', () => {
    it('should export AriaGroupAttributes interface', () => {
      const attrs: AriaGroupAttributes = {
        role: 'group',
        'aria-label': 'test',
        'aria-roledescription': 'test',
        'aria-live': 'polite'
      };
      
      expect(attrs).toBeDefined();
    });

    it('should export AriaItemAttributes interface', () => {
      const attrs: AriaItemAttributes = {
        role: 'group',
        'aria-label': 'test',
        'aria-roledescription': 'test',
        'aria-setsize': 5,
        'aria-posinset': 1
      };
      
      expect(attrs).toBeDefined();
    });
  });
});
