/**
 * Knot Canvas Service (sem GSAP)
 * Corda extremamente embaraçada com controle separado de nós/ondas e sensível à velocidade.
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface KnotConfig {
  segments: number;
  strokeWidth: number;
  strokeColor: string;
  glowColor: string;
  backgroundColor: string;
  animate: boolean;
  loopsCount: number;
  loopRadiusMin: number;
  loopRadiusMax: number;
  noiseAmplitude: number;
  harmonics: number;
  seed?: number;
  glowLevels?: number;
  dpiAware?: boolean;

  tangleMultiplier?: number;
  globalFalloff?: number;
  // Quedas diferenciadas
  knotFalloff?: number;
  waveFalloff?: number;
}

type Dir = 1 | -1;

interface LoopDef {
  t: number;
  halfWidth: number;
  radius: number;
  dirX: Dir;
  dirY: Dir;
  twist: number; // 1=círculo, 2=8, 3=triplo
}

@Injectable({ providedIn: 'root' })
export class KnotCanvasService {
  private readonly DEFAULT_CONFIG: KnotConfig = {
    segments: 480,
    strokeWidth: 3,
    strokeColor: '#64FFDA',
    glowColor: '#64FFDA',
    backgroundColor: 'transparent',
    animate: true,

    loopsCount: 30,
    loopRadiusMin: 28,
    loopRadiusMax: 86,
    noiseAmplitude: 100,
    harmonics: 8,

    glowLevels: 4,
    dpiAware: true,
    seed: undefined,

    tangleMultiplier: 1.35,
    globalFalloff: 1.35,

    knotFalloff: 0.9,
    waveFalloff: 1.6,
  };

  private readonly platformId = inject(PLATFORM_ID);
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private cfg: KnotConfig = { ...this.DEFAULT_CONFIG };
  private dpr = 1;

  private loops: LoopDef[] = [];
  private progress = 0;

  // Sensibilidade a movimento (0=parado, 1=rolando)
  private motion = 0;

  // Componentes pré-computados
  private loopDX: Float32Array = new Float32Array(0);
  private loopDY: Float32Array = new Float32Array(0);
  private waveDX: Float32Array = new Float32Array(0);
  private waveDY: Float32Array = new Float32Array(0);
  // Compat
  private offsetsX: Float32Array = new Float32Array(0);
  private offsetsY: Float32Array = new Float32Array(0);

  private baseSeed = 0;
  private lastCssW = 0;
  private lastCssH = 0;

  initializeKnot(canvas: HTMLCanvasElement, config: Partial<KnotConfig> = {}, initialProgress = 0): void {
    if (!isPlatformBrowser(this.platformId) || !canvas) return;

    this.canvas = canvas;
    this.cfg = { ...this.DEFAULT_CONFIG, ...config };

    this.baseSeed = (typeof this.cfg.seed === 'number')
      ? (this.cfg.seed >>> 0)
      : ((Math.random() * 0x7fffffff) | 0) >>> 0;

    this.setupCanvasDimensions(true);
    this.prepareLoops();
    this.buildOffsets();

    if (this.cssWidth() === 0 || this.cssHeight() === 0) {
      requestAnimationFrame(() => {
        this.setupCanvasDimensions(true);
        this.prepareLoops();
        this.buildOffsets();
        this.setProgress(initialProgress);
      });
    } else {
      this.setProgress(initialProgress);
    }
  }

  setProgress(progress: number): void {
    this.progress = this.clamp01(progress);
    this.draw();
  }

  // NOVO: recebe fator de movimento (0..1) e redesenha
  setMotion(motion: number): void {
    this.motion = this.clamp01(motion);
    this.draw();
  }

  updateConfig(config: Partial<KnotConfig>): void {
    this.cfg = { ...this.cfg, ...config };
    this.prepareLoops();
    this.buildOffsets();
    this.draw();
  }

  resize(): void {
    if (!this.canvas) return;
    const changed = this.setupCanvasDimensions(false);
    if (!changed) return;
    this.prepareLoops();
    this.buildOffsets();
    this.draw();
  }

  clear(): void {
    if (!this.ctx) return;
    const w = this.cssWidth();
    const h = this.cssHeight();
    this.ctx.clearRect(0, 0, w, h);
  }

  destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.loops = [];
    this.loopDX = new Float32Array(0);
    this.loopDY = new Float32Array(0);
    this.waveDX = new Float32Array(0);
    this.waveDY = new Float32Array(0);
    this.offsetsX = new Float32Array(0);
    this.offsetsY = new Float32Array(0);
  }

  // ---------- Internos ----------

  private cssWidth(): number {
    if (!this.canvas) return 0;
    const w = this.canvas.clientWidth || this.canvas.getBoundingClientRect().width;
    return Math.max(0, Math.round(w));
  }

  private cssHeight(): number {
    if (!this.canvas) return 0;
    const h = this.canvas.clientHeight || this.canvas.getBoundingClientRect().height;
    return Math.max(0, Math.round(h));
  }

  private setupCanvasDimensions(isInit: boolean): boolean {
    if (!this.canvas) return false;

    const widthCss = this.cssWidth();
    const heightCss = this.cssHeight();

    const changed =
      isInit ||
      Math.abs(widthCss - this.lastCssW) >= 2 ||
      Math.abs(heightCss - this.lastCssH) >= 2;

    if (!changed && this.ctx) return false;

    this.lastCssW = widthCss || this.lastCssW || 800;
    this.lastCssH = heightCss || this.lastCssH || 320;

    const safeWidth = this.lastCssW || 800;
    const safeHeight = this.lastCssH || 320;

    this.dpr = this.cfg.dpiAware ? (window.devicePixelRatio || 1) : 1;

    this.canvas.width = Math.max(1, Math.round(safeWidth * this.dpr));
    this.canvas.height = Math.max(1, Math.round(safeHeight * this.dpr));
    this.canvas.style.width = `${safeWidth}px`;
    this.canvas.style.height = `${safeHeight}px`;

    const ctx = this.canvas.getContext('2d', { alpha: true });
    if (!ctx) return false;
    this.ctx = ctx;

    if (this.cfg.dpiAware) ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    else ctx.setTransform(1, 0, 0, 1, 0, 0);

    return true;
  }

  private prepareLoops(): void {
    if (!this.canvas) return;

    const rnd = this.makeSeeded(this.baseSeed);

    const count = Math.max(8, (this.cfg.loopsCount | 0));
    const loops: LoopDef[] = [];

    let i = 0;
    while (i < count) {
      const groupSize = Math.min(count - i, Math.floor(this.randRange(rnd, 2, 4.9)));
      const baseT = this.jittered(rnd, i / (count + 1), 0.035);

      for (let g = 0; g < groupSize; g++, i++) {
        const shift = (g - (groupSize - 1) / 2) * this.randRange(rnd, 0.01, 0.028);
        const t = this.clamp01(baseT + shift);

        const radius = this.randRange(rnd, this.cfg.loopRadiusMin, this.cfg.loopRadiusMax) * (this.cfg.tangleMultiplier ?? 1);
        const dirX: Dir = rnd() > 0.5 ? 1 : -1;
        const dirY: Dir = rnd() > 0.5 ? 1 : -1;

        const r = rnd();
        const twist = r > 0.86 ? 3 : (r > 0.58 ? 2 : 1);

        const halfWidth = this.randRange(rnd, 0.06, 0.12); // um pouco mais largos

        loops.push({ t, halfWidth, radius, dirX, dirY, twist });
      }
    }

    loops.sort((a, b) => a.t - b.t);
    this.loops = loops;
  }

  private buildOffsets(): void {
    const segments = Math.max(160, this.cfg.segments | 0);

    this.loopDX = new Float32Array(segments + 1);
    this.loopDY = new Float32Array(segments + 1);
    this.waveDX = new Float32Array(segments + 1);
    this.waveDY = new Float32Array(segments + 1);
    this.offsetsX = new Float32Array(segments + 1);
    this.offsetsY = new Float32Array(segments + 1);

    const rnd = this.makeSeeded(this.baseSeed ^ 0x9e3779b9);
    const A0 = (this.cfg.noiseAmplitude * (this.cfg.tangleMultiplier ?? 1));
    const harmonics = Math.max(0, this.cfg.harmonics | 0);

    const phases = new Array(harmonics + 1).fill(0).map((_, h) => (h === 0 ? 0 : rnd() * Math.PI * 2));

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      let ldx = 0, ldy = 0;
      let wdx = 0, wdy = 0;

      // Nós (loops)
      for (const L of this.loops) {
        const t0 = L.t - L.halfWidth;
        const t1 = L.t + L.halfWidth;
        if (t < t0 || t > t1) continue;

        const u = (t - t0) / (2 * L.halfWidth);
        const theta = u * (Math.PI * 2) * L.twist;
        const envelope = Math.sin(u * Math.PI);

        ldx += L.radius * Math.sin(theta) * envelope * L.dirX;
        ldy += L.radius * Math.cos(theta) * envelope * L.dirY;
      }

      // Ondas/harmônicas
      for (let h = 1; h <= harmonics; h++) {
        const f = h * 2.35 + 0.75;
        const phase = phases[h];
        wdy += (A0 / h) * Math.sin(t * Math.PI * 2 * f + phase) * 0.9;
        wdx += (A0 / (h * 3.5)) * Math.cos(t * Math.PI * 2 * (f * 0.55) + phase * 0.41) * 0.8;
      }

      // Micro variações
      wdy += 10 * Math.sin(t * Math.PI * 2 * 18.0 + 0.7) * 0.5;
      wdx += 10 * Math.cos(t * Math.PI * 2 * 11.0 + 1.9) * 0.25;

      this.loopDX[i] = ldx;
      this.loopDY[i] = ldy;
      this.waveDX[i] = wdx;
      this.waveDY[i] = wdy;

      this.offsetsX[i] = ldx + wdx;
      this.offsetsY[i] = ldy + wdy;
    }
  }

  private draw(): void {
    if (!this.canvas || !this.ctx) return;

    const ctx = this.ctx;
    const width = this.cssWidth() || this.canvas.width / this.dpr;
    const height = this.cssHeight() || this.canvas.height / this.dpr;

    ctx.clearRect(0, 0, width, height);

    if (this.cfg.backgroundColor !== 'transparent') {
      ctx.save();
      ctx.fillStyle = this.cfg.backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    const centerY = height / 2;
    const startX = width * 0.06;
    const endX = width * 0.94;
    const lengthX = endX - startX;

    // Quedas por progresso
    const fallBase = Math.max(0.6, this.cfg.globalFalloff ?? 1.0);
    const loopGainBase = Math.pow(1 - this.progress, (this.cfg.knotFalloff ?? fallBase * 0.6));
    const waveGainBase = Math.pow(1 - this.progress, (this.cfg.waveFalloff ?? fallBase * 1.2));

    // Gating por movimento: parado => ondas ~0; movimentando => 1
    // Smoothstep para evitar popping
    const motionGate = this.smoothstep(0.05, 0.22, this.motion);
    const waveGain = waveGainBase * motionGate;
    const loopGain = loopGainBase;

    const segments = Math.min(this.offsetsX.length - 1, Math.max(2, this.cfg.segments | 0));
    const path: { x: number; y: number }[] = new Array(segments + 1);

    const baseStep = lengthX / segments;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const baseX = startX + t * lengthX;
      const baseY = centerY;

      const dx = this.loopDX[i] * loopGain + this.waveDX[i] * waveGain;
      const dy = this.loopDY[i] * loopGain + this.waveDY[i] * waveGain;

      path[i] = { x: baseX + dx, y: baseY + dy };
    }

    const hasBacktrack = this.pathHasBacktracking(path, baseStep);

    const strokeBase = this.cfg.strokeWidth;
    const glowLevels = Math.max(1, this.cfg.glowLevels || 1);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Suavização só quando há movimento e sem backtracking
    const useSmooth = !hasBacktrack && (motionGate > 0.25);

    // Glow
    const chaos = Math.max(loopGain, waveGain);
    for (let g = glowLevels; g >= 1; g--) {
      const alpha = 0.07 * g;
      ctx.strokeStyle = this.hexToRgba(this.cfg.glowColor, alpha);
      ctx.lineWidth = strokeBase + g * (8 + 4 * chaos);
      ctx.shadowBlur = 18 * g * (0.6 + 0.4 * chaos);
      ctx.shadowColor = this.cfg.glowColor;
      this.strokePath(ctx, path, useSmooth);
    }

    // Traço principal
    ctx.strokeStyle = this.cfg.strokeColor;
    ctx.lineWidth = strokeBase + 1.5;
    ctx.shadowBlur = 0;
    this.strokePath(ctx, path, useSmooth);

    // Traço interno
    ctx.strokeStyle = this.hexToRgba('#FFFFFF', 0.12 + 0.25 * (1 - chaos));
    ctx.lineWidth = Math.max(1, strokeBase - 0.5);
    this.strokePath(ctx, path, useSmooth);
  }

  private pathHasBacktracking(path: { x: number; y: number }[], baseStep: number): boolean {
    const tol = Math.max(0.4, baseStep * 0.15);
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i + 1].x < path[i].x - tol) return true;
    }
    return false;
  }

  private strokePath(ctx: CanvasRenderingContext2D, path: { x: number; y: number }[], smooth: boolean) {
    const n = path.length;
    if (n < 2) return;

    if (!smooth) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < n; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < n - 2; i++) {
      const xc = (path[i].x + path[i + 1].x) / 2;
      const yc = (path[i].y + path[i + 1].y) / 2;
      ctx.quadraticCurveTo(path[i].x, path[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(path[n - 2].x, path[n - 2].y, path[n - 1].x, path[n - 1].y);
    ctx.stroke();
  }

  // --- utils determinísticos ---

  private jittered(rnd: () => number, base: number, amount: number): number {
    return this.clamp01(base + (rnd() * 2 - 1) * amount);
  }

  private randRange(rnd: () => number, min: number, max: number): number {
    return min + (max - min) * rnd();
  }

  private hexToRgba(hex: string, alpha: number): string {
    const m = hex.replace('#', '');
    const bigint = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private makeSeeded(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return (s & 0xfffffff) / 0xfffffff;
    };
  }

  private clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = this.clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  }
}
