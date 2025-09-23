import { Component, ElementRef, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';
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

  // --- Propriedades da Física ---
  private particleVelocities!: Float32Array;
  private mouse = new THREE.Vector2(-100, -100);
  private smoothedMouse = new THREE.Vector2(-100, -100);
  private lastMousePosition = new THREE.Vector2(-100, -100);
  private mouseVelocity = 0;
  private raycaster = new THREE.Raycaster();

  // --- Otimização de Grid Espacial ---
  private grid: Map<string, number[]> = new Map();
  private cellSize = 5; // Deve ser um pouco maior que o raio de repulsão

  // Vetores temporários
  private tempParticlePosition = new THREE.Vector3();
  private tempClosestPointOnRay = new THREE.Vector3();
  private tempVelocity = new THREE.Vector3();
  private tempReturnForce = new THREE.Vector3();
  private tempOriginalPosition = new THREE.Vector3();

  // Efeito Parallax
  private parallaxTarget = new THREE.Vector2(0, 0);
  private parallaxCurrent = new THREE.Vector2(0, 0);

  private animationFrameId = 0;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.createParticles();
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer) this.renderer.dispose();
    if (this.particles?.geometry) this.particles.geometry.dispose();
    if (this.particles?.material) (this.particles.material as THREE.Material).dispose();
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

  private initThree(): void {
    const host = this.el.nativeElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, host.clientWidth / host.clientHeight, 0.1, 200);
    this.camera.position.z = 60;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    host.appendChild(this.renderer.domElement);
  }

  private createParticles(): void {
    // Reduzido para garantir performance com a nova física
    const particleCount = 4000;
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
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.9, map: this.createParticleTexture(),
      transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
      color: 0x64FFDA
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
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

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const positions = this.particles.geometry.getAttribute('position').array as Float32Array;

    this.parallaxCurrent.lerp(this.parallaxTarget, 0.05);
    this.camera.position.x = -this.parallaxCurrent.x * 5;
    this.camera.position.y = -this.parallaxCurrent.y * 5;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.smoothedMouse.lerp(this.mouse, 0.1);

    const rawVelocity = this.smoothedMouse.distanceTo(this.lastMousePosition);
    this.mouseVelocity += (rawVelocity - this.mouseVelocity) * 0.05;
    this.lastMousePosition.copy(this.smoothedMouse);

    const MAX_SENSIBLE_VELOCITY = 0.04;
    const MAX_RADIUS = 25;
    const MAX_FORCE = 0.1;

    const normalizedVelocity = Math.min(this.mouseVelocity / MAX_SENSIBLE_VELOCITY, 1.0);
    const effectStrength = normalizedVelocity;

    const dynamicInteractionRadius = effectStrength * MAX_RADIUS;
    const dynamicForceFactor = effectStrength * MAX_FORCE;

    this.raycaster.setFromCamera(this.smoothedMouse, this.camera);

    const rotationSpeed = 0.0003;
    const friction = 0.96;
    const cos = Math.cos(rotationSpeed);
    const sin = Math.sin(rotationSpeed);

    // --- NOVA LÓGICA DE REPULSÃO E RETORNO ---
    const repulsionRadius = 4.0;
    const repulsionStrength = 0.0003;
    const returnSpeed = 0.00003;

    // 1. Preenche a grade espacial para otimização
    this.grid.clear();
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
      if (!this.grid.has(key)) this.grid.set(key, []);
      this.grid.get(key)!.push(i);
    }


    for (let i = 0; i < positions.length; i += 3) {
      let x = positions[i];
      let y = positions[i + 1];
      let z = positions[i + 2];

      const newX = x * cos - z * sin;
      const newZ = x * sin + z * cos;
      x = newX;
      z = newZ;

      this.tempParticlePosition.set(x, y, z);
      this.tempVelocity.set(this.particleVelocities[i], this.particleVelocities[i + 1], this.particleVelocities[i + 2]);
      this.tempOriginalPosition.set(this.originalPositions[i], this.originalPositions[i+1], this.originalPositions[i+2]);

      // 2. Interação com o Mouse (código anterior)
      if (dynamicInteractionRadius > 0.1) {
        this.raycaster.ray.closestPointToPoint(this.tempParticlePosition, this.tempClosestPointOnRay);
        const dist = this.tempParticlePosition.distanceTo(this.tempClosestPointOnRay);
        if (dist < dynamicInteractionRadius) {
          const falloff = Math.pow(1 - dist / dynamicInteractionRadius, 2);
          const repulsionForce = this.tempParticlePosition.clone().sub(this.tempClosestPointOnRay).normalize();
          repulsionForce.multiplyScalar(falloff * dynamicForceFactor);
          this.tempVelocity.add(repulsionForce);
        }
      }

      // 3. Lógica de repulsão entre partículas
      const cellX = Math.floor(x / this.cellSize);
      const cellY = Math.floor(y / this.cellSize);
      for (let nx = -1; nx <= 1; nx++) {
        for (let ny = -1; ny <= 1; ny++) {
          const key = `${cellX + nx},${cellY + ny}`;
          if (this.grid.has(key)) {
            for (const j of this.grid.get(key)!) {
              if (i === j) continue;
              const otherX = positions[j];
              const otherY = positions[j+1];
              const dx = x - otherX;
              const dy = y - otherY;
              const distSq = dx * dx + dy * dy;
              if (distSq < repulsionRadius * repulsionRadius) {
                const dist = Math.sqrt(distSq);
                const force = (repulsionRadius - dist) / repulsionRadius;
                this.tempVelocity.x += (dx / dist) * force * repulsionStrength;
                this.tempVelocity.y += (dy / dist) * force * repulsionStrength;
              }
            }
          }
        }
      }

      // 4. Força de retorno à posição original
      this.tempReturnForce.subVectors(this.tempOriginalPosition, this.tempParticlePosition).multiplyScalar(returnSpeed);
      this.tempVelocity.add(this.tempReturnForce);

      this.tempVelocity.multiplyScalar(friction);
      this.tempParticlePosition.add(this.tempVelocity);

      this.particleVelocities[i] = this.tempVelocity.x;
      this.particleVelocities[i + 1] = this.tempVelocity.y;
      this.particleVelocities[i + 2] = this.tempVelocity.z;
      positions[i] = this.tempParticlePosition.x;
      positions[i + 1] = this.tempParticlePosition.y;
      positions[i + 2] = this.tempParticlePosition.z;
    }

    this.particles.geometry.getAttribute('position').needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  };
}
