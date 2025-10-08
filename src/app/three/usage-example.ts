/**
 * Example: Using particles-config in ThreeParticleBackgroundComponent
 * 
 * This file demonstrates how the ThreeParticleBackgroundComponent
 * could be updated to consume the particles-config module.
 * 
 * NOTE: This is an example/reference - not meant to replace the existing component.
 */

import { Component, AfterViewInit, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { getParticleConfig, ParticleProfile } from '../particles-config';

@Component({
  selector: 'app-example-particle-usage',
  standalone: true,
  template: '',
  styles: []
})
export class ExampleParticleUsageComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private config!: ParticleProfile;
  private particles!: THREE.Points;
  private scene!: THREE.Scene;
  
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Detect user preferences and viewport
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const viewportWidth = window.innerWidth;

    // 2. Get appropriate configuration
    this.config = getParticleConfig(viewportWidth, prefersReducedMotion);

    console.log('Particle Configuration:', {
      profile: this.getProfileName(),
      count: this.config.count,
      animationsEnabled: this.config.enableAnimations,
      interactionsEnabled: this.config.enableInteractions,
      gyroEnabled: this.config.enableGyro
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // 3. Initialize scene with configuration
    this.initThreeScene();
    this.createParticlesFromConfig();

    // 4. Start animation loop only if enabled
    if (this.config.enableAnimations) {
      this.startAnimationLoop();
    } else {
      // Static render for reduced motion
      this.renderStaticScene();
    }
  }

  private initThreeScene(): void {
    this.scene = new THREE.Scene();
    // ... scene initialization
  }

  private createParticlesFromConfig(): void {
    // Use configuration values
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.config.count * 3);
    
    // Initialize particle positions
    for (let i = 0; i < this.config.count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 150;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 150;
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    // Use configured particle size and opacity
    const material = new THREE.PointsMaterial({
      size: this.config.particleSize,
      opacity: this.config.opacity,
      transparent: true,
      color: 0x64ffda
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    console.log(`Created ${this.config.count} particles with size ${this.config.particleSize}`);
  }

  private startAnimationLoop(): void {
    // Only start animation if enabled in config
    if (!this.config.enableAnimations) {
      console.log('Animations disabled - skipping animation loop');
      return;
    }

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Apply rotation based on config
      if (this.particles) {
        this.particles.rotation.y += 0.001;
        this.particles.rotation.x += 0.0001;
      }
      
      // Render scene
      // this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  private renderStaticScene(): void {
    // Single static render for reduced motion
    console.log('Rendering static scene (reduced motion)');
    // this.renderer.render(this.scene, this.camera);
  }

  private setupInteractions(): void {
    // Only setup if enabled
    if (!this.config.enableInteractions) {
      console.log('Interactions disabled');
      return;
    }

    // Use config values for interaction parameters
    const maxRadius = this.config.maxInteractionRadius;
    const maxForce = this.config.maxForce;
    const friction = this.config.friction;

    console.log('Interactions enabled:', { maxRadius, maxForce, friction });
    
    // Setup mouse/touch interaction logic here
    // using maxRadius, maxForce, friction from config
  }

  private setupGyroControls(): void {
    // Only setup if enabled (typically mobile only)
    if (!this.config.enableGyro) {
      console.log('Gyroscope disabled');
      return;
    }

    const positionGain = this.config.gyroPositionGain;
    const spinGain = this.config.gyroSpinGain;

    console.log('Gyroscope enabled:', { positionGain, spinGain });

    // Setup device orientation handlers here
    // using positionGain and spinGain from config
  }

  private getProfileName(): string {
    if (!this.config.enableAnimations) return 'reduced';
    if (this.config.count <= 80) return 'mobile';
    if (this.config.count <= 120) return 'tablet';
    return 'desktop';
  }

  ngOnDestroy(): void {
    // Cleanup
    if (this.particles?.geometry) {
      this.particles.geometry.dispose();
    }
    if (this.particles?.material) {
      (this.particles.material as THREE.Material).dispose();
    }
  }
}

/**
 * USAGE COMPARISON:
 * 
 * BEFORE (hardcoded values):
 * --------------------------
 * private readonly mobileParticleCount = 120;
 * private readonly desktopParticleCount = 120;
 * private readonly gyroPositionGain = 0.02;
 * const particleCount = this.isMobile ? this.mobileParticleCount : this.desktopParticleCount;
 * 
 * AFTER (using config):
 * --------------------
 * import { getParticleConfig } from '@app/three';
 * 
 * const config = getParticleConfig(window.innerWidth, prefersReducedMotion);
 * const particleCount = config.count;
 * const gyroGain = config.gyroPositionGain;
 * if (config.enableAnimations) { startAnimation(); }
 * 
 * BENEFITS:
 * ---------
 * ✅ Centralized configuration
 * ✅ Automatic reduced motion support
 * ✅ Three breakpoints instead of two (mobile, tablet, desktop)
 * ✅ Type-safe configuration
 * ✅ Testable and documented
 * ✅ Easy to extend with new profiles
 * ✅ Consistent values across components
 */
