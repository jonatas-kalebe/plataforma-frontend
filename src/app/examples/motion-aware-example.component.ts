/**
 * Example Component demonstrating ReducedMotionService usage
 * This is a reference implementation showing best practices
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ReducedMotionService } from '../services/reduced-motion.service';

@Component({
  selector: 'app-motion-aware-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="motion-aware-container" [class.reduced-motion]="prefersReducedMotion">
      <h2>Motion-Aware Component Example</h2>
      
      <div class="status-indicator">
        <p>Current Motion Preference: 
          <strong>{{ prefersReducedMotion ? 'Reduced Motion' : 'Standard Motion' }}</strong>
        </p>
      </div>

      <div class="animated-box">
        <p>This box respects your motion preferences</p>
      </div>

      <div class="info">
        <p>Try changing your system's motion preferences to see the effect:</p>
        <ul>
          <li><strong>macOS:</strong> System Preferences → Accessibility → Display → Reduce motion</li>
          <li><strong>Windows:</strong> Settings → Ease of Access → Display → Show animations in Windows</li>
          <li><strong>Linux:</strong> Varies by desktop environment</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .motion-aware-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    h2 {
      color: #333;
      margin-bottom: 1rem;
    }

    .status-indicator {
      background: #f0f0f0;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .animated-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 2rem;
      
      /* Standard motion: full animations */
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), 
                  opacity 0.3s ease;
      animation: float 3s ease-in-out infinite;
    }

    /* Reduced motion: simplified animations */
    .reduced-motion .animated-box {
      transition: opacity 0.2s ease;
      animation: none;
    }

    .animated-box:hover {
      transform: scale(1.05);
      opacity: 0.9;
    }

    .reduced-motion .animated-box:hover {
      transform: none;
      opacity: 0.95;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    .info {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 1rem;
      border-radius: 8px;
    }

    .info ul {
      margin: 0.5rem 0 0 1.5rem;
    }

    .info li {
      margin-bottom: 0.5rem;
    }

    strong {
      color: #667eea;
    }
  `]
})
export class MotionAwareExampleComponent implements OnInit, OnDestroy {
  prefersReducedMotion = false;
  private subscription?: Subscription;

  constructor(private reducedMotionService: ReducedMotionService) {}

  ngOnInit(): void {
    // Subscribe to motion preference changes
    this.subscription = this.reducedMotionService
      .getPrefersReducedMotion()
      .subscribe(prefersReduced => {
        this.prefersReducedMotion = prefersReduced;
        console.log('Motion preference changed:', prefersReduced ? 'Reduced' : 'Standard');
      });
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    this.subscription?.unsubscribe();
  }
}
