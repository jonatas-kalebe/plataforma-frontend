/**
 * ARIA Ring Accessibility Utilities
 * 
 * Pure functions for generating ARIA attributes and live messages for ring carousel components.
 * Follows WCAG 2.1 Level AA guidelines and WAI-ARIA best practices for carousel patterns.
 * 
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 * @see https://www.w3.org/WAI/standards-guidelines/wcag/
 */

/**
 * ARIA attributes for a group/container element
 */
export interface AriaGroupAttributes {
  role: string;
  'aria-label': string;
  'aria-roledescription'?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

/**
 * ARIA attributes for an individual item element
 */
export interface AriaItemAttributes {
  role: string;
  'aria-label': string;
  'aria-roledescription'?: string;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
}

/**
 * State information for generating live messages
 */
export interface RingState {
  activeIndex: number;
  total: number;
  isRotating?: boolean;
  itemLabel?: string;
}

/**
 * Returns ARIA attributes for the ring container/group element.
 * 
 * Creates a semantic structure for screen readers to understand the carousel pattern.
 * Uses role="group" with descriptive labeling.
 * 
 * @param count - Total number of items in the ring (minimum 1)
 * @returns Object with ARIA attributes for the group element
 * 
 * @example
 * ```typescript
 * const attrs = getGroupAttrs(8);
 * // Returns: {
 * //   role: 'group',
 * //   'aria-label': 'Carrossel de projetos com 8 itens',
 * //   'aria-roledescription': 'carrossel',
 * //   'aria-live': 'polite'
 * // }
 * ```
 */
export function getGroupAttrs(count: number): AriaGroupAttributes {
  const normalizedCount = Math.max(1, count);
  
  return {
    role: 'group',
    'aria-label': `Carrossel de projetos com ${normalizedCount} ${normalizedCount === 1 ? 'item' : 'itens'}`,
    'aria-roledescription': 'carrossel',
    'aria-live': 'polite'
  };
}

/**
 * Returns ARIA attributes for an individual ring item.
 * 
 * Provides position information (X of Y) and semantic role for each item.
 * Uses role="group" for items to maintain hierarchy within the carousel group.
 * 
 * @param i - Zero-based index of the item
 * @param total - Total number of items (minimum 1)
 * @returns Object with ARIA attributes for the item element
 * 
 * @example
 * ```typescript
 * const attrs = getItemAttrs(0, 8);
 * // Returns: {
 * //   role: 'group',
 * //   'aria-label': 'Item 1 de 8',
 * //   'aria-roledescription': 'item do carrossel',
 * //   'aria-setsize': 8,
 * //   'aria-posinset': 1
 * // }
 * ```
 */
export function getItemAttrs(i: number, total: number): AriaItemAttributes {
  const normalizedTotal = Math.max(1, total);
  const normalizedIndex = Math.max(0, Math.min(i, normalizedTotal - 1));
  const position = normalizedIndex + 1; // 1-based for humans
  
  return {
    role: 'group',
    'aria-label': `Item ${position} de ${normalizedTotal}`,
    'aria-roledescription': 'item do carrossel',
    'aria-setsize': normalizedTotal,
    'aria-posinset': position
  };
}

/**
 * Generates instructive live region messages for screen readers.
 * 
 * Provides contextual feedback about the current state of the ring carousel,
 * including active item position and optional item labels.
 * 
 * @param state - Current state of the ring (activeIndex, total, optional isRotating and itemLabel)
 * @returns Human-readable message for screen reader announcement
 * 
 * @example
 * ```typescript
 * const message = getLiveMessage({ activeIndex: 2, total: 8 });
 * // Returns: "Item 3 de 8"
 * 
 * const messageWithLabel = getLiveMessage({ 
 *   activeIndex: 2, 
 *   total: 8, 
 *   itemLabel: 'Projeto Portfolio' 
 * });
 * // Returns: "Item 3 de 8: Projeto Portfolio"
 * 
 * const rotatingMessage = getLiveMessage({ 
 *   activeIndex: 2, 
 *   total: 8, 
 *   isRotating: true 
 * });
 * // Returns: "Rotacionando carrossel. Item 3 de 8"
 * ```
 */
export function getLiveMessage(state: RingState): string {
  const { activeIndex, total, isRotating = false, itemLabel } = state;
  
  const normalizedTotal = Math.max(1, total);
  const normalizedIndex = Math.max(0, Math.min(activeIndex, normalizedTotal - 1));
  const position = normalizedIndex + 1;
  
  let message = '';
  
  if (isRotating) {
    message = 'Rotacionando carrossel. ';
  }
  
  message += `Item ${position} de ${normalizedTotal}`;
  
  if (itemLabel !== undefined && itemLabel !== null && itemLabel !== '') {
    message += `: ${itemLabel}`;
  }
  
  return message;
}
