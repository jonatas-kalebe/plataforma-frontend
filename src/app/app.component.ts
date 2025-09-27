import { Component, signal, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {LoadingScreenComponent} from './components/loading-screen/loading-screen.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoadingScreenComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  showOverlay = signal(false); // Temporarily disabled for testing

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setViewportHeight();
      window.addEventListener('resize', () => this.setViewportHeight());
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.setViewportHeight(), 100);
      });
    }
  }

  private setViewportHeight(): void {
    // Calculate actual viewport height for mobile browsers
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  onOverlayDone(): void {
    this.showOverlay.set(false);
  }
}
