import {AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy} from '@angular/core';
import * as THREE from 'three';

/**
 * Interface para definir a estrutura da "onda de choque" de um clique/toque,
 * alinhado com o estudo para fornecer feedback recompensador.
 */
interface Shockwave {
  pos: THREE.Vector2;
  startTime: number;
  maxStrength: number;
}

@Component({
  selector: 'app-three-particle-background',
  standalone: true,
  template: '',
  styles: [`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      outline: none;
    }
  `]
})
export class ThreeParticleBackgroundComponent implements AfterViewInit, OnDestroy {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private originalPositions!: Float32Array;
  private particleVelocities!: Float32Array;

  private mouse = new THREE.Vector2(-100, -100);
  private smoothedMouse = new THREE.Vector2(-100, -100);
  private lastMousePosition = new THREE.Vector2(-100, -100);
  private mouseVelocity = 0;
  private shockwaves: Shockwave[] = [];

  private parallaxTarget = new THREE.Vector2(0, 0);
  private parallaxCurrent = new THREE.Vector2(0, 0);
  private gyroParallaxTarget = new THREE.Vector2(0, 0);
  private gyroEnabled = false;
  private isTouching = false;
  private animationFrameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private readonly dtFixed = 1 / 60;
  private tempVector3D = new THREE.Vector3();
  private prefersReducedMotion = false;

  private isMobile = false;
  private readonly mobileParticleCount = 60;
  private readonly desktopParticleCount = 80;
  private readonly gyroIntensity = 4.0;

  constructor(private el: ElementRef, private ngZone: NgZone) {
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        this.prefersReducedMotion = true;
      }

      this.initThree();
      this.createParticles();
      this.lastTime = performance.now();

      if (!this.prefersReducedMotion) {
        window.addEventListener('click', this.tryEnableGyro, {once: true, passive: true});
        this.animate();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('click', this.tryEnableGyro as any);
    if (this.gyroEnabled) window.removeEventListener('deviceorientation', this.handleOrientation);
    if (this.renderer) this.renderer.dispose();
    if (this.particles?.geometry) this.particles.geometry.dispose();
    if (this.particles?.material) (this.particles.material as THREE.Material).dispose();
  }

  @HostListener('window:resize')
  onWindowResize = () => {
    const host = this.el.nativeElement;
    this.camera.aspect = host.clientWidth / host.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    if (this.prefersReducedMotion) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.parallaxTarget.set(this.mouse.x, this.mouse.y);
  }

  @HostListener('document:click', ['$event'])
  onClick() {
    if (this.isTouching) return;
    this.shockwaves.push({pos: this.mouse.clone(), startTime: performance.now(), maxStrength: 0.6});
  }

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(ev: TouchEvent) {
    this.isTouching = true;
    this.onMouseMove(ev.touches[0] as any);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(ev: TouchEvent) {
    this.onMouseMove(ev.touches[0] as any);
  }

  @HostListener('document:touchend')
  onTouchEnd() {
    this.shockwaves.push({pos: this.mouse.clone(), startTime: performance.now(), maxStrength: 1.0});
    this.isTouching = false;
    this.mouse.set(-100, -100);
  }

  private initThree(): void {
    const host = this.el.nativeElement;
    this.isMobile = ('ontouchstart' in window) || (navigator as any).maxTouchPoints > 0;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, host.clientWidth / host.clientHeight, 0.1, 200);
    this.camera.position.z = 60;
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 1.75));
    this.renderer.setClearColor(0x000000, 0);
    host.appendChild(this.renderer.domElement);
  }

  private createParticles(): void {
    const particleCount = this.isMobile ? this.mobileParticleCount : this.desktopParticleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.particleVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 150;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 150;
    }

    this.originalPositions = new Float32Array(positions);
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.StreamDrawUsage);
    geometry.setAttribute('position', posAttr);

    const material = new THREE.PointsMaterial({
      size: 1.2,
      map: this.createParticleTexture(),
      transparent: true,
      opacity: 0.6,
      blending: THREE.NormalBlending,
      depthWrite: false,
      color: 0x2d5b8c
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);

    if (this.prefersReducedMotion) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  private tryEnableGyro = async () => {
    if (!this.isMobile) return;
    const DOE = (window as any).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      try {
        const state = await DOE.requestPermission();
        if (state !== 'granted') return;
      } catch {
        return;
      }
    }
    if (!this.gyroEnabled) {
      window.addEventListener('deviceorientation', this.handleOrientation, {passive: true});
      this.gyroEnabled = true;
    }
  };

  private handleOrientation = (e: DeviceOrientationEvent) => {
    const gamma = e.gamma ?? 0;
    const beta = e.beta ?? 0;

    const nx = Math.max(-1, Math.min(1, (gamma / 30) * this.gyroIntensity));
    const ny = Math.max(-1, Math.min(1, (beta / 30) * this.gyroIntensity));

    this.gyroParallaxTarget.set(nx, ny);
  };


  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    const useGyro = this.gyroEnabled && !this.isTouching;
    if (useGyro) {
      this.parallaxTarget.lerp(this.gyroParallaxTarget, 0.1);
    }
    this.parallaxCurrent.lerp(this.parallaxTarget, 0.08);

    this.camera.position.x = -this.parallaxCurrent.x * 3;
    this.camera.position.y = this.parallaxCurrent.y * 5;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();

    this.smoothedMouse.lerp(this.mouse, 0.12);
    const rawVelocity = this.smoothedMouse.distanceTo(this.lastMousePosition);
    this.mouseVelocity = THREE.MathUtils.lerp(this.mouseVelocity, rawVelocity, 0.08);
    this.lastMousePosition.copy(this.smoothedMouse);

    this.particles.rotation.y += 0.0003;

    this.accumulator += dt;
    let sub = 0;
    while (this.accumulator >= this.dtFixed && sub < 3) {
      this.stepPhysics(this.dtFixed, now);
      this.accumulator -= this.dtFixed;
      sub++;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private stepPhysics(dt: number, timeNow: number) {
    const positions = this.particles.geometry.getAttribute('position').array as Float32Array;
    const v = this.particleVelocities;

    const MAX_SENSIBLE_VELOCITY = 0.04;
    const MAX_RADIUS = 15;
    const MAX_FORCE = 0.6;
    const friction = 0.96;
    const returnSpeed = 0.0005;

    const normalizedVelocity = Math.min(this.mouseVelocity / MAX_SENSIBLE_VELOCITY, 1.0);
    const easedVelocity = 1 - Math.pow(1 - normalizedVelocity, 3);
    const dynamicInteractionRadius = easedVelocity * MAX_RADIUS;
    const dynamicForceFactor = easedVelocity * MAX_FORCE;

    this.shockwaves = this.shockwaves.filter(sw => (timeNow - sw.startTime) < 500);
    for (let i = 0; i < positions.length; i += 3) {
      this.tempVector3D.set(positions[i], positions[i + 1], positions[i + 2]);
      this.tempVector3D.project(this.camera);

      if (this.tempVector3D.z > 1) continue;

      let totalForceX = 0;
      let totalForceY = 0;

      const distToMouse = Math.hypot(this.tempVector3D.x - this.smoothedMouse.x, this.tempVector3D.y - this.smoothedMouse.y);
      if (dynamicInteractionRadius > 0.01 && distToMouse < dynamicInteractionRadius) {
        const falloff = Math.pow(1 - distToMouse / dynamicInteractionRadius, 2);
        const force = falloff * dynamicForceFactor;
        const normDist = distToMouse || 1;
        totalForceX += (this.tempVector3D.x - this.smoothedMouse.x) / normDist * force;
        totalForceY += (this.tempVector3D.y - this.smoothedMouse.y) / normDist * force;
      }

      for (const sw of this.shockwaves) {
        const age = (timeNow - sw.startTime) / 500;
        const swRadius = age * 0.4;
        const swStrength = sw.maxStrength * (1 - age);
        const distToSw = Math.hypot(this.tempVector3D.x - sw.pos.x, this.tempVector3D.y - sw.pos.y);

        if (swStrength > 0 && distToSw < swRadius && distToSw > swRadius - 0.15) {
          const normDist = distToSw || 1;
          totalForceX += (this.tempVector3D.x - sw.pos.x) / normDist * swStrength;
          totalForceY += (this.tempVector3D.y - sw.pos.y) / normDist * swStrength;
        }
      }

      v[i] += totalForceX * 0.05;
      v[i + 1] += totalForceY * 0.05;

      v[i] += (this.originalPositions[i] - positions[i]) * returnSpeed;
      v[i + 1] += (this.originalPositions[i + 1] - positions[i + 1]) * returnSpeed;
      v[i + 2] += (this.originalPositions[i + 2] - positions[i + 2]) * returnSpeed;

      v[i] *= friction;
      v[i + 1] *= friction;
      v[i + 2] *= friction;

      positions[i] += v[i];
      positions[i + 1] += v[i + 1];
      positions[i + 2] += v[i + 2];
    }
    (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}
