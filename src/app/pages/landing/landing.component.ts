import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';

import gsap from 'gsap';

import { ScrollTrigger } from 'gsap/ScrollTrigger';

import * as THREE from 'three';

import { WorkCardRingComponent } from '../../components/work-card-ring/work-card-ring.component';



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

  private mouse = new THREE.Vector2(9999, 9999);

  private knotCtx!: CanvasRenderingContext2D | null;

  private knotId = 0;

  private parallaxTarget = new THREE.Vector2(0, 0);

  private parallaxCurrent = new THREE.Vector2(0, 0);



  ngAfterViewInit(): void {

    this.zone.runOutsideAngular(() => {

      this.initHeroThree();

      this.initGSAP();

      this.initKnot();

    });

  }



  ngOnDestroy(): void {

    cancelAnimationFrame(this.animId);

    cancelAnimationFrame(this.knotId);

    window.removeEventListener('resize', this.onResize);

    window.removeEventListener('mousemove', this.onMouseMove);

    if (this.renderer) {

      this.renderer.dispose();

      if (this.heroBg?.nativeElement?.contains(this.renderer.domElement)) {

        this.heroBg.nativeElement.removeChild(this.renderer.domElement);

      }

    }

    ScrollTrigger.getAll().forEach(st => st.kill());

  }



  private initHeroThree(): void {

    const el = this.heroBg.nativeElement;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.renderer.setSize(el.clientWidth, el.clientHeight);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    el.appendChild(this.renderer.domElement);



    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(65, el.clientWidth / el.clientHeight, 0.1, 200);

    this.camera.position.z = 60;



    const count = 500;

    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);

    const colors = new Float32Array(count * 3);

    const colorA = new THREE.Color(0x64FFDA);

    const colorB = new THREE.Color(0x0A192F);

    for (let i = 0; i < count; i++) {

      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 120;

      positions[i3 + 1] = (Math.random() - 0.5) * 70;

      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      const c = colorB.clone().lerp(colorA, Math.random() * 0.6 + 0.2);

      colors[i3] = c.r;

      colors[i3 + 1] = c.g;

      colors[i3 + 2] = c.b;

    }

    this.originalPositions = new Float32Array(positions);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));



    const material = new THREE.PointsMaterial({

      size: 0.6,

      vertexColors: true,

      transparent: true,

      opacity: 0.6,

      blending: THREE.AdditiveBlending,

      depthWrite: false

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

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;

    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.parallaxTarget.set(this.mouse.x, this.mouse.y);

  };



  private loop = () => {

    const posAttr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;

    const positions = posAttr.array as Float32Array;



    this.parallaxCurrent.lerp(this.parallaxTarget, 0.05);

    this.camera.position.x = this.parallaxCurrent.x * 4;

    this.camera.position.y = this.parallaxCurrent.y * 2;

    this.camera.lookAt(0, 0, 0);



    const mouseVec = new THREE.Vector3(this.parallaxCurrent.x * 30, this.parallaxCurrent.y * 20, 0);

    const repulsionRadius = 12;

    const repulsionStrength = 0.25;

    const returnSpeed = 0.02;

    for (let i = 0; i < positions.length; i += 3) {

      const px = positions[i];

      const py = positions[i + 1];

      const pz = positions[i + 2];

      const ox = this.originalPositions[i];

      const oy = this.originalPositions[i + 1];

      const oz = this.originalPositions[i + 2];

      const dx = px - mouseVec.x;

      const dy = py - mouseVec.y;

      const dz = pz;

      const d = Math.hypot(dx, dy, dz);

      if (d < repulsionRadius) {

        const f = (repulsionRadius - d) / repulsionRadius;

        positions[i] += (dx / (d || 1)) * f * repulsionStrength;

        positions[i + 1] += (dy / (d || 1)) * f * repulsionStrength;

        positions[i + 2] += (dz / (d || 1)) * f * 0.08;

      } else {

        positions[i] += (ox - px) * returnSpeed;

        positions[i + 1] += (oy - py) * returnSpeed;

        positions[i + 2] += (oz - pz) * returnSpeed;

      }

    }

    posAttr.needsUpdate = true;



    this.points.rotation.y += 0.0004;

    this.renderer.render(this.scene, this.camera);

    this.animId = requestAnimationFrame(this.loop);

  };



  private initGSAP(): void {

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });

    tl.from('#hero-title', { opacity: 0, y: 50, delay: 0.2 })

      .from('#hero-subtitle', { opacity: 0, y: 40 }, '-=0.8')

      .from('#hero-cta', { opacity: 0, y: 30 }, '-=0.6');



    gsap.utils.toArray<HTMLElement>('.service-card').forEach(card => {

      gsap.from(card, {

        opacity: 0,

        y: 100,

        duration: 0.8,

        ease: 'power3.out',

        scrollTrigger: {

          trigger: card,

          start: 'top 85%',

          toggleActions: 'play none none none'

        }

      });

    });

  }



  private initKnot(): void {

    this.knotCtx = this.knotCanvas.nativeElement.getContext('2d');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {

      const el = this.knotCanvas.nativeElement;

      const rect = el.getBoundingClientRect();

      el.width = rect.width * dpr;

      el.height = rect.height * dpr;

      if (this.knotCtx) this.knotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    };

    resize();

    const render = (t: number) => {

      const ctx = this.knotCtx;

      if (!ctx) return;

      const el = this.knotCanvas.nativeElement;

      ctx.clearRect(0, 0, el.clientWidth, el.clientHeight);

      const w = el.clientWidth;

      const h = el.clientHeight;

      const cx = w / 2;

      const cy = h / 2;

      ctx.lineWidth = 2;

      ctx.strokeStyle = '#64FFDA';

      ctx.beginPath();

      const turns = 2;

      const R = Math.min(w, h) * 0.32;

      for (let a = 0; a <= Math.PI * 2 * turns; a += 0.02) {

        const r = R * 0.5 * (Math.cos(a * 0.5 + t * 0.001) + 1);

        const x = cx + (R + r) * Math.cos(a + t * 0.0006);

        const y = cy + (R + r) * Math.sin(a + t * 0.0006);

        if (a === 0) ctx.moveTo(x, y);

        else ctx.lineTo(x, y);

      }

      ctx.stroke();

      this.knotId = requestAnimationFrame(render);

    };

    window.addEventListener('resize', resize);

    this.knotId = requestAnimationFrame(render);

  }

}
