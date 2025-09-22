import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
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
  @ViewChild('heroBg', {static: true}) heroBg!: ElementRef<HTMLDivElement>;
  @ViewChild('knotCanvas', {static: true}) knotCanvas!: ElementRef<HTMLCanvasElement>;
  private zone = new NgZone({enableLongStackTrace: false});
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

  /**
   * MELHORIA: Cria uma textura suave e circular para as partículas.
   * Isso substitui os quadrados padrão por "orbes" de luz.
   */
  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  private initHeroThree(): void {
    const el = this.heroBg.nativeElement;
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 200);
    this.camera.position.z = 60; // Posição da câmera mantida

    // AUMENTADO: Mais partículas para um efeito mais denso e imersivo
    const count = 900;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count); // Atributo para tamanho
    const opacities = new Float32Array(count); // Atributo para opacidade

    const colorA = new THREE.Color(0x64FFDA); // Verde Circuito
    const colorB = new THREE.Color(0x112240); // Azul Card

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // MANTIDO: Distribuição em caixa 3D para ter partículas na frente e atrás
      positions[i3] = (Math.random() - 0.5) * 150;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 150;

      // MELHORIA: Partículas mais distantes (Z negativo) ficam maiores (simulando blur)
      const depth = positions[i3 + 2];
      const depthFactor = Math.abs(depth / 75); // Normaliza a profundidade
      scales[i] = 1.0 + depthFactor * 1.5;
      opacities[i] = Math.max(0.1, 1.0 - depthFactor * 0.8);
    }
    this.originalPositions = new Float32Array(positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // ALTERAÇÃO CRÍTICA: Troca de PointsMaterial para ShaderMaterial
    // Isso nos dá controle total sobre cada partícula (tamanho, cor, opacidade).
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: {value: colorA},
        pointTexture: {value: this.createParticleTexture()}
      },
      vertexShader: `
        attribute float scale;
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          // O tamanho da partícula agora depende da escala (profundidade) e da distância
          gl_PointSize = scale * ( 300.0 / -mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying float vOpacity;
        void main() {
          // Usa a textura circular e aplica a opacidade baseada na profundidade
          vec4 texColor = texture2D( pointTexture, gl_PointCoord );
          if (texColor.a < 0.1) discard; // Otimização: descarta pixels totalmente transparentes
          gl_FragColor = vec4( color, texColor.a * vOpacity );
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
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

    // MANTIDO: Efeito parallax da câmera que você já tinha
    this.parallaxCurrent.lerp(this.parallaxTarget, 0.05);
    this.camera.position.x = this.parallaxCurrent.x * 5;
    this.camera.position.y = -this.parallaxCurrent.y * 5;
    this.camera.lookAt(0, 0, 0);

    // MANTIDO: Lógica de repulsão, mas com parâmetros ajustados para mais impacto
    const worldMouse = new THREE.Vector3(this.parallaxCurrent.x * 50, -this.parallaxCurrent.y * 40, 0);
    const repulsionRadius = 20; // AUMENTADO: Área de efeito maior
    const repulsionStrength = 1.2; // AUMENTADO: Força de repulsão maior
    const returnSpeed = 0.02;

    for (let i = 0; i < positions.length; i += 3) {
      const p = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      const originalP = new THREE.Vector3(this.originalPositions[i], this.originalPositions[i + 1], this.originalPositions[i + 2]);

      const d = p.distanceTo(worldMouse);

      if (d < repulsionRadius) {
        let f = (repulsionRadius - d) / repulsionRadius;
        f = f * f; // MELHORIA: A força é mais intensa no centro e decai mais rápido
        p.add(p.clone().sub(worldMouse).normalize().multiplyScalar(f * repulsionStrength));
      } else {
        // MANTIDO: Retorno suave à posição original
        p.lerp(originalP, returnSpeed);
      }
      positions[i] = p.x;
      positions[i + 1] = p.y;
      positions[i + 2] = p.z;
    }
    posAttr.needsUpdate = true;

    this.points.rotation.y += 0.0002;
    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(this.loop);
  };


  private initGSAP(): void {
    const tl = gsap.timeline({defaults: {ease: 'power3.out', duration: 1}});
    tl.from('#hero-title', {opacity: 0, y: 50, delay: 0.2}).from('#hero-subtitle', {
      opacity: 0,
      y: 40
    }, '-=0.8').from('#hero-cta', {opacity: 0, y: 30}, '-=0.6');
    gsap.utils.toArray<HTMLElement>('.service-card').forEach(card => {
      gsap.from(card, {
        opacity: 0,
        y: 100,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {trigger: card, start: 'top 85%', toggleActions: 'play none none none'}
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
        if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      this.knotId = requestAnimationFrame(render);
    };
    window.addEventListener('resize', resize);
    this.knotId = requestAnimationFrame(render);
  }
}
