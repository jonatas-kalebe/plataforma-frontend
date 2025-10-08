import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyImgDirective } from '../../directives/lazy-img.directive';

/**
 * Interface for work items to be displayed in the snap list
 */
export interface WorkItem {
  id?: string | number;
  title: string;
  description?: string;
  imageUrl?: string;
  placeholderUrl?: string;
  link?: string;
}

/**
 * WorkListSnapComponent - Mobile-first horizontal scroll list with CSS scroll-snap
 * 
 * A lightweight alternative to carousel components that uses native CSS scroll-snap
 * for a performant, accessible mobile experience without JavaScript inertia.
 * 
 * Features:
 * - CSS scroll-snap for smooth, native scrolling
 * - Lazy loading images with LazyImgDirective
 * - Basic keyboard navigation (arrow keys)
 * - Mobile-first responsive design
 * - WCAG AA accessible
 * 
 * @example
 * ```html
 * <app-work-list-snap
 *   [items]="workItems"
 *   (itemClick)="onItemClick($event)">
 * </app-work-list-snap>
 * ```
 */
@Component({
  selector: 'app-work-list-snap',
  standalone: true,
  imports: [CommonModule, LazyImgDirective],
  templateUrl: './work-list-snap.component.html',
  styleUrls: ['./work-list-snap.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkListSnapComponent implements AfterViewInit {
  /**
   * Array of work items to display
   */
  @Input() items: WorkItem[] = [];

  /**
   * Emits when an item is clicked
   */
  @Output() itemClick = new EventEmitter<WorkItem>();

  /**
   * Emits when the active/visible item changes during scroll
   */
  @Output() activeItemChange = new EventEmitter<number>();

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef<HTMLDivElement>;

  private currentActiveIndex = 0;

  ngAfterViewInit(): void {
    // Set up intersection observer to track active item
    this.setupActiveItemTracking();
  }

  /**
   * Handle keyboard navigation for accessibility
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.scrollContainer || !this.items || this.items.length === 0) {
      return;
    }

    const container = this.scrollContainer.nativeElement;
    const itemWidth = container.scrollWidth / this.items.length;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.scrollToPrevious(container, itemWidth);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.scrollToNext(container, itemWidth);
        break;
      case 'Home':
        event.preventDefault();
        container.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'End':
        event.preventDefault();
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        break;
    }
  }

  /**
   * Scroll to the previous item
   */
  private scrollToPrevious(container: HTMLDivElement, itemWidth: number): void {
    const newScroll = Math.max(0, container.scrollLeft - itemWidth);
    container.scrollTo({ left: newScroll, behavior: 'smooth' });
  }

  /**
   * Scroll to the next item
   */
  private scrollToNext(container: HTMLDivElement, itemWidth: number): void {
    const maxScroll = container.scrollWidth - container.clientWidth;
    const newScroll = Math.min(maxScroll, container.scrollLeft + itemWidth);
    container.scrollTo({ left: newScroll, behavior: 'smooth' });
  }

  /**
   * Handle item click
   */
  onItemClick(item: WorkItem, event: MouseEvent): void {
    event.preventDefault();
    this.itemClick.emit(item);
  }

  /**
   * Set up intersection observer to track the currently visible/active item
   */
  private setupActiveItemTracking(): void {
    if (!this.scrollContainer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const options: IntersectionObserverInit = {
      root: this.scrollContainer.nativeElement,
      threshold: 0.5, // Item is considered active when 50% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
          if (index !== this.currentActiveIndex) {
            this.currentActiveIndex = index;
            this.activeItemChange.emit(index);
          }
        }
      });
    }, options);

    // Observe all items
    const items = this.scrollContainer.nativeElement.querySelectorAll('.snap-item');
    items.forEach((item) => observer.observe(item));
  }

  /**
   * Get ARIA label for the scroll container
   */
  getContainerAriaLabel(): string {
    const count = this.items?.length || 0;
    return `Lista de projetos com ${count} ${count === 1 ? 'item' : 'itens'}`;
  }

  /**
   * Get ARIA label for an individual item
   */
  getItemAriaLabel(index: number): string {
    const position = index + 1;
    const total = this.items?.length || 0;
    return `Item ${position} de ${total}`;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByItem(index: number, item: WorkItem): string | number {
    return item.id ?? index;
  }
}
