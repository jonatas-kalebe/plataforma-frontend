import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import {WorkCardRingComponent} from '../../components/work-card-ring/work-card-ring.component';


gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, WorkCardRingComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('heroBg', { static: true }) heroBg!: ElementRef<HTMLDivElement>;
  @ViewChild('knotCanvas', { static: true }) knotCanvas!: ElementRef<HTMLCanvasElement>;

  private zone = new NgZone({ enableLongStackTrace: false });
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private points!: THREE.Points;
  private originalPositions!: Float32Array;
  private animId = 0;
  private mouse = new THREE.Vector2(9999, 9999); // Inicia o mouse bem longe

  constructor() {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initHeroThree();
      this.initGSAP();
      this.initKnot();
    });
  }

  ngOnDestroy(): void {
    // Limpeza completa para evitar memory leaks
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.renderer) {
      this.renderer.dispose();
      if (this.heroBg.nativeElement) {
        this.heroBg.nativeElement.removeChild(this.renderer.domElement);
      }
    }
    ScrollTrigger.getAll().forEach(st => st.kill());
  }

  private initHeroThree() {
    // ... (código de inicialização do Three.js, idêntico à versão corrigida anterior)
    const el = this.heroBg.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 100);
    this.camera.position.z = 50;

    const count = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 100;
    }
    this.originalPositions = new Float32Array(positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.25,
      color: 0x64FFDA,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    this.loop();
  }

  private onResize = () => {
    const el = this.heroBg.nativeElement;
    this.camera.aspect = el.clientWidth / el.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  private onMouseMove = (event: MouseEvent) => {
    // Converte a posição do mouse para o sistema de coordenadas do Three.js
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  // CORREÇÃO: Lógica de animação das partículas que realmente funciona
  private loop = () => {
    const positions = this.points.geometry.getAttribute('position').array as Float32Array;

    // Projeta a posição 2D do mouse em um plano 3D para interagir com as partículas
    const mouseVector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
    mouseVector.unproject(this.camera);
    const dir = mouseVector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const worldMouse = this.camera.position.clone().add(dir.multiplyScalar(distance));

    const repulsionRadius = 15;
    const repulsionStrength = 0.5;
    const returnSpeed = 0.02;

    for (let i = 0; i < positions.length; i += 3) {
      const p = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const originalP = new THREE.Vector3(this.originalPositions[i], this.originalPositions[i + 1], this.originalPositions[i + 2]);

      const dist = p.distanceTo(worldMouse);

      if (dist < repulsionRadius) {
        const force = (repulsionRadius - dist) / repulsionRadius;
        p.add(new THREE.Vector3(p.x - worldMouse.x, p.y - worldMouse.y, 0).normalize().multiplyScalar(force * repulsionStrength));
      } else {
        p.lerp(originalP, returnSpeed);
      }

      positions[i] = p.x;
      positions[i + 1] = p.y;
      positions[i + 2] = p.z;
    }
    this.points.geometry.getAttribute('position').needsUpdate = true;

    this.points.rotation.y += 0.0005; // Movimento sutil de fundo
    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(this.loop);
  };

  // O restante do arquivo (initGSAP, initKnot) permanece o mesmo da correção anterior
  private initGSAP() { /* ... */ }
  private initKnot() { /* ... */ }
}
