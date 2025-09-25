import { Injectable, signal } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface ScrollState {
  progress: number;
  velocity: number;
  direction: number;
  isScrolling: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScrollOrchestratorService {
  private scrollState = signal<ScrollState>({
    progress: 0,
    velocity: 0,
    direction: 0,
    isScrolling: false
  });

  private prefersReducedMotion = false;
  private particleModulators: Array<(state: ScrollState) => void> = [];
  private scrollTimeout: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;
    }
  }

  initialize(): void {
    if (typeof window === 'undefined') return;

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => this.updateScrollState(self),
      scrub: this.prefersReducedMotion ? false : true
    });
  }

  registerParticleModulator(modulator: (state: ScrollState) => void): () => void {
    this.particleModulators.push(modulator);
    return () => {
      const index = this.particleModulators.indexOf(modulator);
      if (index > -1) this.particleModulators.splice(index, 1);
    };
  }

  getScrollState() {
    return this.scrollState.asReadonly();
  }

  private updateScrollState(self: ScrollTrigger): void {
    const newState: ScrollState = {
      progress: self.progress,
      velocity: self.getVelocity(),
      direction: self.direction,
      isScrolling: true
    };

    this.scrollState.set(newState);
    this.notifyParticleModulators(newState);

    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = window.setTimeout(() => {
      this.scrollState.update(state => ({ ...state, isScrolling: false, velocity: 0 }));
    }, 150);
  }

  private notifyParticleModulators(state: ScrollState): void {
    this.particleModulators.forEach(modulator => modulator(state));
  }

  isPrefersReducedMotion(): boolean {
    return this.prefersReducedMotion;
  }

  destroy(): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.particleModulators.length = 0;
    ScrollTrigger.getAll().forEach(st => st.kill());
  }
}