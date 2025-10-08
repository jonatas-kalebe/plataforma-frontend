/**
 * Work Card Component
 * Reusable card component for displaying work/project items
 * Follows WCAG AA accessibility guidelines with visible focus states
 */

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-work-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-card.component.html',
  styleUrls: ['./work-card.component.css']
})
export class WorkCardComponent {
  /**
   * Card title (required)
   */
  @Input() title!: string;
  
  /**
   * Card subtitle/description (optional)
   */
  @Input() subtitle?: string;
  
  /**
   * Image URL for the card (optional)
   */
  @Input() imageUrl?: string;
  
  /**
   * Call-to-action URL (optional)
   */
  @Input() ctaUrl?: string;
  
  /**
   * Additional CSS classes (optional)
   */
  @Input() customClass: string = '';
  
  /**
   * Test ID for automated testing (optional)
   */
  @Input() testId: string = 'work-card';
  
  /**
   * Check if the card has a clickable action
   */
  get isClickable(): boolean {
    return !!this.ctaUrl;
  }
  
  /**
   * Get dynamic card classes
   */
  getCardClasses(): string {
    const classes: string[] = ['work-card'];
    
    if (this.isClickable) {
      classes.push('work-card--clickable');
    }
    
    if (this.customClass) {
      classes.push(this.customClass);
    }
    
    return classes.join(' ');
  }
}
