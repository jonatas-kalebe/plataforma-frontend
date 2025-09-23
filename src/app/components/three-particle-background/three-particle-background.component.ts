import {AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy} from '@angular/core';
import * as THREE from 'three';

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
  private raycaster = new THREE.Raycaster();
  private rayOrigin = new THREE.Vector3();
  private rayDir = new THREE.Vector3();
  private rayOriginLocal = new THREE.Vector3();
  private rayDirLocal = new THREE.Vector3();
  private grid: Map<number, number[]> = new Map();
  private cellSize = 5;
  private parallaxTarget = new THREE.Vector2(0, 0);
  private parallaxCurrent = new THREE.Vector2(0, 0);
  private gyroParallaxTarget = new THREE.Vector2(0, 0);
  private gyroEnabled = false;
  private isTouching = false;
  private touchStartTime = 0;
  private touchStartPos = new THREE.Vector2();
  private tapImpulse = 0;
  private animationFrameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private readonly dtFixed = 1 / 60;
  private lodStep = 1;
  private lodPhase = 0;
  private readonly KEY_STRIDE = 2048;

  private isMobile = false;
  private mobileParticleCount = 1200;
  private desktopParticleCount = 4000;
  private gyroIntensity = 2.0;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.createParticles();
      this.lastTime = performance.now();
      window.addEventListener('touchstart', this.tryEnableGyro, { passive: true });
      window.addEventListener('click', this.tryEnableGyro, { passive: true });
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('touchstart', this.tryEnableGyro as any);
    window.removeEventListener('click', this.tryEnableGyro as any);
    if (this.gyroEnabled) window.removeEventListener('deviceorientation', this.handleOrientation as any);
    if (this.renderer) this.renderer.dispose();
    if (this.particles?.geometry) this.particles.geometry.dispose();
    if (this.particles?.material) (this.particles.material as THREE.Material).dispose();
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
      size: 0.9,
      map: this.createParticleTexture(),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x64FFDA
    });
    this.particles = new THREE.Points(geometry, material);
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
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

  @HostListener('window:resize')
  onWindowResize = () => {
    const host = this.el.nativeElement;
    this.camera.aspect = host.clientWidth / host.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(host.clientWidth, host.clientHeight);
  };

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.mouse.x = (x / rect.width) * 2 - 1;
    this.mouse.y = -(y / rect.height) * 2 + 1;
    this.parallaxTarget.set(this.mouse.x, this.mouse.y);
  }

  @HostListener('document:touchstart', ['$event'])
  onTouchStart(ev: TouchEvent) {
    if (ev.touches.length === 0) return;
    const t = ev.touches[0];
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    this.mouse.x = (x / rect.width) * 2 - 1;
    this.mouse.y = -(y / rect.height) * 2 + 1;
    this.parallaxTarget.set(this.mouse.x, this.mouse.y);
    this.lastMousePosition.copy(this.mouse);
    this.isTouching = true;
    this.touchStartTime = performance.now();
    this.touchStartPos.set(this.mouse.x, this.mouse.y);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(ev: TouchEvent) {
    if (ev.touches.length === 0) return;
    const t = ev.touches[0];
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const y = t.clientY - rect.top;
    this.mouse.x = (x / rect.width) * 2 - 1;
    this.mouse.y = -(y / rect.height) * 2 + 1;
    this.parallaxTarget.set(this.mouse.x, this.mouse.y);
  }

  @HostListener('document:touchend', ['$event'])
  onTouchEnd(ev: TouchEvent) {
    const dt = performance.now() - this.touchStartTime;
    const dx = this.mouse.x - this.touchStartPos.x;
    const dy = this.mouse.y - this.touchStartPos.y;
    const moved = Math.hypot(dx, dy);
    if (dt < 220 && moved < 0.05) this.tapImpulse = Math.min(this.tapImpulse + 0.7, 1);
    this.isTouching = false;
    this.mouse.set(-100, -100);
  }

  @HostListener('document:touchcancel', ['$event'])
  onTouchCancel() {
    this.isTouching = false;
    this.mouse.set(-100, -100);
  }

  private tryEnableGyro = async () => {
    const DOE: any = (window as any).DeviceOrientationEvent;
    if (!DOE) return;
    if (typeof DOE.requestPermission === 'function') {
      try {
        const state = await DOE.requestPermission();
        if (state !== 'granted') return;
      } catch { return; }
    }
    if (!this.gyroEnabled) {
      window.addEventListener('deviceorientation', this.handleOrientation as any, { passive: true });
      this.gyroEnabled = true;
      window.removeEventListener('touchstart', this.tryEnableGyro as any);
      window.removeEventListener('click', this.tryEnableGyro as any);
    }
  };

  private handleOrientation = (e: DeviceOrientationEvent) => {
    const g = e.gamma ?? 0;
    const b = e.beta ?? 0;
    const nx = Math.max(-1, Math.min(1, (g / 45) * this.gyroIntensity));
    const ny = Math.max(-1, Math.min(1, (b / 45) * this.gyroIntensity));
    this.gyroParallaxTarget.set(nx, -ny);
  };

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const useGyro = this.gyroEnabled && !this.isTouching;
    if (useGyro) this.parallaxTarget.copy(this.gyroParallaxTarget);
    this.parallaxCurrent.lerp(this.parallaxTarget, 0.06);
    this.camera.position.x = -this.parallaxCurrent.x * 5;
    this.camera.position.y = -this.parallaxCurrent.y * 5;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.smoothedMouse.lerp(this.mouse, 0.12);
    const rawVelocity = this.smoothedMouse.distanceTo(this.lastMousePosition);
    this.mouseVelocity += (rawVelocity - this.mouseVelocity) * 0.08;
    this.lastMousePosition.copy(this.smoothedMouse);
    this.tapImpulse *= 0.9;
    this.particles.rotation.y += 0.0003;
    this.lodStep = dt > 1 / 55 ? 2 : 1;
    this.lodPhase ^= 1;
    this.accumulator += dt;
    let sub = 0;
    while (this.accumulator >= this.dtFixed && sub < 3) {
      this.stepPhysics(this.dtFixed);
      this.accumulator -= this.dtFixed;
      sub++;
    }
    this.renderer.render(this.scene, this.camera);
  };

  private stepPhysics(dt: number) {
    const positions = this.particles.geometry.getAttribute('position').array as Float32Array;
    const v = this.particleVelocities;
    this.raycaster.setFromCamera(this.smoothedMouse, this.camera);
    this.rayOrigin.copy(this.raycaster.ray.origin);
    this.rayDir.copy(this.raycaster.ray.direction).normalize();
    this.rayOriginLocal.copy(this.rayOrigin).applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.particles.rotation.y);
    this.rayDirLocal.copy(this.rayDir).applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.particles.rotation.y).normalize();
    const MAX_SENSIBLE_VELOCITY = 0.04;
    const MAX_RADIUS = 25;
    const MAX_FORCE = 0.4;
    const normalizedVelocity = Math.min(this.mouseVelocity / MAX_SENSIBLE_VELOCITY, 1.0);
    const effectStrength = Math.min(normalizedVelocity + this.tapImpulse, 1.0);
    const dynamicInteractionRadius = effectStrength * MAX_RADIUS;
    const dynamicForceFactor = effectStrength * MAX_FORCE;
    const repulsionRadius = 4.0;
    const repulsionStrength = 0.0003;
    const returnSpeed = 0.0003;
    const friction = 0.96;
    const radius2 = dynamicInteractionRadius * dynamicInteractionRadius;
    for (const arr of this.grid.values()) arr.length = 0;
    const invCell = 1 / this.cellSize;
    for (let i = 0; i < positions.length; i += 3) {
      const px = positions[i];
      const py = positions[i + 1];
      const cellX = Math.floor(px * invCell);
      const cellY = Math.floor(py * invCell);
      const key = cellX * this.KEY_STRIDE + cellY;
      let arr = this.grid.get(key);
      if (!arr) {
        arr = [];
        this.grid.set(key, arr);
      }
      arr.push(i);
    }
    const rep2 = repulsionRadius * repulsionRadius;
    const count = positions.length;
    for (let i = 0, idx = 0; i < count; i += 3, idx++) {
      const px = positions[i];
      const py = positions[i + 1];
      const pz = positions[i + 2];
      let vx = v[i];
      let vy = v[i + 1];
      let vz = v[i + 2];
      const wx = px - this.rayOriginLocal.x;
      const wy = py - this.rayOriginLocal.y;
      const wz = pz - this.rayOriginLocal.z;
      const proj = wx * this.rayDirLocal.x + wy * this.rayDirLocal.y + wz * this.rayDirLocal.z;
      const cx = this.rayOriginLocal.x + this.rayDirLocal.x * proj;
      const cy = this.rayOriginLocal.y + this.rayDirLocal.y * proj;
      const cz = this.rayOriginLocal.z + this.rayDirLocal.z * proj;
      const dxr = px - cx;
      const dyr = py - cy;
      const dzr = pz - cz;
      const d2 = dxr * dxr + dyr * dyr + dzr * dzr;
      if (dynamicInteractionRadius > 0.1 && d2 < radius2) {
        const d = Math.sqrt(d2) + 1e-6;
        const falloff = Math.pow(1 - d / (dynamicInteractionRadius + 1e-6), 2);
        const f = falloff * dynamicForceFactor;
        vx += (dxr / d) * f;
        vy += (dyr / d) * f;
        vz += (dzr / d) * f;
      }
      const cellX = Math.floor(px * invCell);
      const cellY = Math.floor(py * invCell);
      for (let nx = -1; nx <= 1; nx++) {
        for (let ny = -1; ny <= 1; ny++) {
          const nkey = (cellX + nx) * this.KEY_STRIDE + (cellY + ny);
          const arr = this.grid.get(nkey);
          if (!arr) continue;
          for (let k = 0; k < arr.length; k++) {
            const j = arr[k];
            if (j === i) continue;
            const ox = positions[j];
            const oy = positions[j + 1];
            const dxp = px - ox;
            const dyp = py - oy;
            const d2p = dxp * dxp + dyp * dyp;
            if (d2p > 0 && d2p < rep2) {
              const d = Math.sqrt(d2p) + 1e-6;
              const force = (repulsionRadius - d) / repulsionRadius;
              const f = force * repulsionStrength;
              vx += (dxp / d) * f;
              vy += (dyp / d) * f;
            }
          }
        }
      }
      const ox = this.originalPositions[i];
      const oy = this.originalPositions[i + 1];
      const oz = this.originalPositions[i + 2];
      vx += (ox - px) * returnSpeed;
      vy += (oy - py) * returnSpeed;
      vz += (oz - pz) * returnSpeed;
      vx *= friction;
      vy *= friction;
      vz *= friction;
      positions[i] = px + vx;
      positions[i + 1] = py + vy;
      positions[i + 2] = pz + vz;
      v[i] = vx;
      v[i + 1] = vy;
      v[i + 2] = vz;
    }
    (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}
