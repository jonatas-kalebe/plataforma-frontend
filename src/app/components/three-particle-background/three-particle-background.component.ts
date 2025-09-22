// src/app/pages/landing/three-particle-background.component.ts
import { Component, ElementRef, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-three-particle-background',
  standalone: true,
  template: '',
  styles: [':host{display:block;position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1}']
})
export class ThreeParticleBackgroundComponent implements AfterViewInit, OnDestroy {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private mouse = new THREE.Vector2(-100, -100);
  private original!: Float32Array;
  private raf = 0;

  constructor(private el: ElementRef, private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initThree();
      this.createParticles();
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    if (this.renderer) this.renderer.dispose();
    if (this.particles?.geometry) this.particles.geometry.dispose();
    if (this.particles?.material) (this.particles.material as THREE.Material).dispose();
  }

  @HostListener('window:resize')
  onResize = () => {
    const host = this.el.nativeElement;
    this.camera.aspect = host.clientWidth / host.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(host.clientWidth, host.clientHeight);
  };

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const host = this.el.nativeElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - host.left) / host.width) * 2 - 1;
    this.mouse.y = -((e.clientY - host.top) / host.height) * 2 + 1;
  }

  private initThree() {
    const host = this.el.nativeElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, host.clientWidth / host.clientHeight, 0.1, 1000);
    this.camera.position.z = 8;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    host.appendChild(this.renderer.domElement);
  }

  private createParticles() {
    const count = 7000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const g = new THREE.Color(0x64ffda);
    const b = new THREE.Color(0x0a192f);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 24;
      positions[i3 + 1] = (Math.random() - 0.5) * 14;
      positions[i3 + 2] = (Math.random() - 0.5) * 8;
      const c = Math.random() > 0.7 ? g.clone() : b.clone().lerp(g, Math.random() * 0.35);
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }
    this.original = new Float32Array(positions);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    const pos = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const t = performance.now() * 0.00015;
    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3;
      const ox = this.original[i3];
      const oy = this.original[i3 + 1];
      arr[i3] = ox + Math.cos(t + ox) * 0.08;
      arr[i3 + 1] = oy + Math.sin(t + oy) * 0.08;
    }
    const mx = this.mouse.x * 10;
    const my = this.mouse.y * 6;
    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3;
      const dx = arr[i3] - mx;
      const dy = arr[i3 + 1] - my;
      const d2 = dx * dx + dy * dy + 0.5;
      const f = 12 / d2;
      arr[i3] += (dx / Math.sqrt(d2)) * f * 0.02;
      arr[i3 + 1] += (dy / Math.sqrt(d2)) * f * 0.02;
    }
    pos.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  };
}
