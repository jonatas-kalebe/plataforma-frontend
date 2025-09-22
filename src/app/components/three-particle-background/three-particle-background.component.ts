import { Component, ElementRef, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-three-particle-background',
  standalone: true,
  template: '',
  styles: [':host { display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; }']
})
export class ThreeParticleBackgroundComponent implements AfterViewInit, OnDestroy {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private mouse = new THREE.Vector2(-100, -100); // Iniciar fora da tela
  private raycaster = new THREE.Raycaster();
  private originalPositions!: Float32Array;

  private animationFrameId!: number;

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
    // Limpeza de recursos do Three.js
    if(this.renderer) this.renderer.dispose();
    if(this.particles.geometry) this.particles.geometry.dispose();
    if((this.particles.material as THREE.Material)) (this.particles.material as THREE.Material).dispose();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize = (): void => {
    this.camera.aspect = this.el.nativeElement.clientWidth / this.el.nativeElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.el.nativeElement.clientWidth, this.el.nativeElement.clientHeight);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  private initThree(): void {
    const host = this.el.nativeElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, host.clientWidth / host.clientHeight, 0.1, 1000);
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    host.appendChild(this.renderer.domElement);
  }

  private createParticles(): void {
    const particleCount = 5000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorCircuitGreen = new THREE.Color(0x64FFDA);
    const colorDarkBlue = new THREE.Color(0x0A192F);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;

      const mixedColor = Math.random() > 0.7 ? colorCircuitGreen.clone() : colorDarkBlue.clone().lerp(colorCircuitGreen, Math.random() * 0.3);
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    this.originalPositions = new Float32Array(positions);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const positions = this.particles.geometry.getAttribute('position');
    const elapsedTime = Date.now() * 0.0001;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const x = this.originalPositions[i3];
      const y = this.originalPositions[i3 + 1];

      // Movimento sutil pulsante
      positions.setX(i, x + Math.cos(elapsedTime + x) * 0.1);
      positions.setY(i, y + Math.sin(elapsedTime + y) * 0.1);
    }

    // Efeito de ondulação com o mouse
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.particles); // This won't work directly on particles, so we do it manually

    const particlePositions = (this.particles.geometry.getAttribute('position') as THREE.BufferAttribute).array;
    for(let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      const particleVector = new THREE.Vector3(particlePositions[i3], particlePositions[i3+1], particlePositions[i3+2]);
      const mouseVector = new THREE.Vector3(this.mouse.x * 10, this.mouse.y * 10, 0); // Project mouse onto a plane

      const dist = particleVector.distanceTo(mouseVector);
      if(dist < 2) {
        const force = (2 - dist) * 0.05;
        particlePositions[i3] += force * (particlePositions[i3] - mouseVector.x);
        particlePositions[i3+1] += force * (particlePositions[i3+1] - mouseVector.y);
      }
    }


    positions.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}
