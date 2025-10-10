import { Component, signal, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { ViewportService } from './services/viewport.service';
import { AnimationOrchestrationService } from './services/animation/animation-orchestration.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingScreenComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly viewportService = inject(ViewportService);
  private readonly animationService = inject(AnimationOrchestrationService);
  showOverlay = signal(true);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize animation service early
      this.animationService.initialize();
      
      // ViewportService now handles viewport height automatically
      this.setupMobileOptimizations();
    }
  }

  /**
   * Setup additional mobile optimizations
   */
  private setupMobileOptimizations(): void {
    // Add device classes to body for CSS targeting
    const body = document.body;
    
    if (this.viewportService.isMobileDevice()) {
      body.classList.add('is-mobile');
    }
    
    if (this.viewportService.isTouchDevice()) {
      body.classList.add('is-touch');
    }
    
    if (this.viewportService.isLandscape()) {
      body.classList.add('is-landscape');
    } else {
      body.classList.add('is-portrait');
    }

    // Update orientation classes on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        body.classList.toggle('is-landscape', this.viewportService.isLandscape());
        body.classList.toggle('is-portrait', !this.viewportService.isLandscape());
      }, 100);
    });

    // Add device pixel ratio class for high-DPI displays
    const dpr = this.viewportService.getDevicePixelRatio();
    if (dpr >= 2) {
      body.classList.add('is-retina');
    }

    // Add reduced motion class
    if (this.viewportService.prefersReducedMotion()) {
      body.classList.add('prefers-reduced-motion');
    }

    // Add color scheme class
    const colorScheme = this.viewportService.getPreferredColorScheme();
    if (colorScheme !== 'no-preference') {
      body.classList.add(`prefers-${colorScheme}`);
    }
  }

  onOverlayDone(): void {
    this.showOverlay.set(false);
  }
}
