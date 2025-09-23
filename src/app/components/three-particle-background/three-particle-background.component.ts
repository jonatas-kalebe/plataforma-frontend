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

  // Propriedades para a nova física de interação
  private particleVelocities!: Float32Array;
  private mouse = new THREE.Vector2(-100, -100);
  private lastMousePosition = new THREE.Vector2(-100, -100);
  private mouseVelocity = new THREE.Vector2(0, 0);

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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer) this.renderer.dispose();
    if (this.particles?.geometry) this.particles.geometry.dispose();
    if (this.particles?.material) (this.particles.material as THREE.Material).dispose();
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
    const particleCount = 19000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const opacities = new Float32Array(particleCount);
    this.particleVelocities = new Float32Array(particleCount * 3); // Inicializa velocidades
    const colorA = new THREE.Color(0x64FFDA);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 150;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 150;

      const depth = positions[i3 + 2];
      const depthFactor = Math.abs(depth / 75);
      scales[i] = 1.0 + depthFactor * 1.5;
      opacities[i] = Math.max(0.1, 1.0 - depthFactor * 0.8);
    }

    this.originalPositions = new Float32Array(positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: colorA },
        pointTexture: { value: this.createParticleTexture() }
      },
      vertexShader: `
        attribute float scale;
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_PointSize = scale * ( 350.0 / -mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying float vOpacity;
        void main() {
          vec4 texColor = texture2D( pointTexture, gl_PointCoord );
          if (texColor.a < 0.1) discard;
          gl_FragColor = vec4( color, texColor.a * vOpacity );
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
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
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 - 1;
    this.parallaxTarget.set(this.mouse.x, this.mouse.y);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const positions = this.particles.geometry.getAttribute('position').array as Float32Array;

    // --- LÓGICA DE INTERAÇÃO TOTALMENTE REFEITA ---

    // 1. Calcula a velocidade do mouse para o efeito de vórtice
    this.mouseVelocity.subVectors(this.mouse, this.lastMousePosition);
    this.lastMousePosition.copy(this.mouse);

    // 2. Suaviza o movimento da câmera (efeito parallax)
    this.parallaxCurrent.lerp(this.parallaxTarget, 0.05);
    this.camera.position.x = this.parallaxCurrent.x * 5;
    this.camera.position.y = -this.parallaxCurrent.y * 5;
    this.camera.lookAt(0, 0, 0);

    // 3. Converte a posição do mouse para o espaço 3D das partículas
    const worldMouse = new THREE.Vector3(this.parallaxCurrent.x * 60, -this.parallaxCurrent.y * 45, 0);

    // 4. Parâmetros da física
    const interactionRadius = 25;
    const repulsionStrength = 0.5;
    const vortexStrength = 3.5;
    const returnSpeed = 0.015;
    const friction = 0.96;

    // 5. Loop de atualização de cada partícula
    for (let i = 0; i < this.originalPositions.length; i += 3) {
      const p = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const originalP = new THREE.Vector3(this.originalPositions[i], this.originalPositions[i + 1], this.originalPositions[i + 2]);
      const v = new THREE.Vector3(this.particleVelocities[i], this.particleVelocities[i + 1], this.particleVelocities[i + 2]);

      const dist = p.distanceTo(worldMouse);

      // Aplica forças apenas se a partícula estiver dentro do raio de interação
      if (dist < interactionRadius) {
        const falloff = (interactionRadius - dist) / interactionRadius; // A força é maior perto do mouse

        // Força de Repulsão (empurra para fora)
        const repulsionForce = p.clone().sub(worldMouse).normalize().multiplyScalar(falloff * repulsionStrength);
        v.add(repulsionForce);

        // Força de Vórtice (cria o redemoinho)
        const vortexDirection = new THREE.Vector3(-this.mouseVelocity.y, this.mouseVelocity.x, 0).normalize();
        const vortexForce = vortexDirection.multiplyScalar(this.mouseVelocity.length() * vortexStrength * falloff);
        v.add(vortexForce);
      }

      // Força de Retorno (puxa de volta para o lugar original)
      const returnForce = originalP.clone().sub(p).multiplyScalar(returnSpeed);
      v.add(returnForce);

      // Aplica Fricção (desacelera o movimento)
      v.multiplyScalar(friction);

      // Atualiza a velocidade e a posição
      this.particleVelocities[i] = v.x;
      this.particleVelocities[i + 1] = v.y;
      this.particleVelocities[i + 2] = v.z;
      positions[i] += v.x;
      positions[i + 1] += v.y;
      positions[i + 2] += v.z;
    }

    this.particles.geometry.getAttribute('position').needsUpdate = true;
    this.particles.rotation.y += 0.0002; // Rotação sutil de fundo
    this.renderer.render(this.scene, this.camera);
  };
}
