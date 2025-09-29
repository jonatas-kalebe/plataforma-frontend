/**
 * Knot Canvas Service (sem GSAP)
 * Mantém forma estável ao parar a rolagem usando latch/histerese de movimento.
 * Agora com:
 * - Variabilidade alta do padrão (patternChaos)
 * - Reseed automático em início de movimento (reseedOnEveryMove)
 * - Time jitter com ruído temporal (timeJitter*) que só avança quando há movimento
 * - Clamp dentro da caixa (boundsPadding)
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

  // Aleatoriedade e variação
  seed?: number;
  patternChaos?: number;        // 0..1
  reseedOnEveryMove?: boolean;  // (desativado para o seu caso)
  reseedOnLeaveStraight?: boolean; // NOVO: reseed ao sair de "reta"
  randomizePhases?: boolean;

  // Jitter temporal controlado por movimento (parado = congelado)
  timeJitterAmplitude?: number;     // px (0 desliga)
  timeJitterSpeed?: number;         // 0.1..2.0
  timeJitterGranularity?: number;   // 0.2..2.0 (variação espacial do jitter)

  glowLevels?: number;
  dpiAware?: boolean;

  // Curvas de decaimento/transformação
  tangleMultiplier?: number;
  globalFalloff?: number;
  knotFalloff?: number;
  waveFalloff?: number;

  // Congelar aparência/forma quando o usuário para de rolar
  freezeOnIdle?: boolean;

  // Padding interno para manter traço dentro da caixa
  boundsPadding?: number;
}

type Dir = 1 | -1;

interface LoopDef {
  t: number;
  halfWidth: number;
  radius: number;
  dirX: Dir;
  dirY: Dir;
  twist: number;
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

    // Aleatoriedade
    seed: undefined,
    patternChaos: 0.55,
    reseedOnEveryMove: false,        // DESLIGADO
    reseedOnLeaveStraight: true,     // LIGADO (comportamento desejado)
    randomizePhases: true,

    // Jitter temporal (leve por padrão; aumente no componente)
    timeJitterAmplitude: 0, // px
    timeJitterSpeed: 0.8,
    timeJitterGranularity: 1.0,

    glowLevels: 4,
    dpiAware: true,

    tangleMultiplier: 1.35,
    globalFalloff: 1.35,
    knotFalloff: 0.9,
    waveFalloff: 1.6,

    freezeOnIdle: true,
    boundsPadding: 16
  };

  private readonly platformId = inject(PLATFORM_ID);
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private cfg: KnotConfig = { ...this.DEFAULT_CONFIG };
  private dpr = 1;

  private loops: LoopDef[] = [];
  private progress = 0;

  // Movimento com latch/histerese
  private motionInput = 0;    // 0..1 (valor instantâneo vindo do componente)
  private motionLatched = 0;  // 0..1 (valor “congelado” para desenhar)
  private readonly gateUp = 0.08;   // acima: em movimento
  private readonly gateDown = 0.04; // abaixo: parado
  private wasMoving = false;

  // Estados para "reseed apenas ao sair de reto"
  private lastProgress = 0;
  private straightArmed = false;
  private readonly STRAIGHT_ARM = 0.999;  // arma quando >= isso
  private readonly STRAIGHT_LEAVE = 0.995; // dispara reseed quando cai abaixo

  // Offsets base
  private loopDX: Float32Array = new Float32Array(0);
  private loopDY: Float32Array = new Float32Array(0);
  private waveDX: Float32Array = new Float32Array(0);
  private waveDY: Float32Array = new Float32Array(0);
  private offsetsX: Float32Array = new Float32Array(0);
  private offsetsY: Float32Array = new Float32Array(0);

  // Jitter temporal (pré-ruído por segmento)
  private jAmpX: Float32Array = new Float32Array(0);
  private jAmpY: Float32Array = new Float32Array(0);
  private jFreqX: Float32Array = new Float32Array(0);
  private jFreqY: Float32Array = new Float32Array(0);
  private jPhaseX: Float32Array = new Float32Array(0);
  private jPhaseY: Float32Array = new Float32Array(0);

  // RAF e tempo
  private rafId = 0;
  private timeAcc = 0; // avança apenas quando em movimento (para congelar no idle)
  private lastTs = 0;

  private baseSeed = 0;
  private lastCssW = 0;
  private lastCssH = 0;

  initializeKnot(canvas: HTMLCanvasElement, config: Partial<KnotConfig> = {}, initialProgress = 0): void {
    if (!isPlatformBrowser(this.platformId) || !canvas) return;

    this.canvas = canvas;
    this.cfg = { ...this.DEFAULT_CONFIG, ...config };

    // Novo seed (se não fornecido) para variação entre sessões
    this.baseSeed = (typeof this.cfg.seed === 'number')
      ? (this.cfg.seed >>> 0)
      : ((Math.random() * 0x7fffffff) | 0) >>> 0;

    // Inicia latched com 1 para forma “cheia” congelada quando parado
    this.motionInput = 0;
    this.motionLatched = 1;
    this.wasMoving = false;

    // Estado de retidão inicial
    this.lastProgress = this.clamp01(initialProgress);
    this.straightArmed = this.lastProgress >= this.STRAIGHT_ARM;

    this.setupCanvasDimensions(true);
    this.prepareLoops();
    this.buildOffsets();

    // Inicia RAF se houver jitter temporal e animação habilitada
    this.startRafIfNeeded();

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
    const prev = this.lastProgress;
    this.progress = this.clamp01(progress);

    // Arma quando fica reto
    if (this.progress >= this.STRAIGHT_ARM) {
      this.straightArmed = true;
    }

    // Dispara reseed uma única vez ao sair de "reto" (transição 1 -> < limiar)
    if (
      this.cfg.reseedOnLeaveStraight &&
      this.straightArmed &&
      prev >= this.STRAIGHT_ARM &&
      this.progress <= this.STRAIGHT_LEAVE
    ) {
      this.reseedPattern();     // novo padrão para o próximo "embaralhar"
      this.straightArmed = false;
    }

    this.lastProgress = this.progress;
    this.draw();
  }

  setMotion(motion: number): void {
    this.motionInput = this.clamp01(motion);

    // Detecta transição parado -> movimento
    const isMoving = this.motionInput > this.gateUp;

    if (!this.cfg.freezeOnIdle) {
      this.motionLatched = this.motionInput;
    } else {
      if (isMoving) {
        this.motionLatched = this.motionInput;
      } else if (this.motionInput < this.gateDown) {
        // mantém latched
      } else {
        // zona morta
      }
    }

    // Mantém compat: se ALGUÉM quiser o antigo comportamento, pode ligar reseedOnEveryMove
    if (this.cfg.reseedOnEveryMove && isMoving && !this.wasMoving) {
      this.reseedPattern();
    }
    this.wasMoving = isMoving;

    // Mantém RAF ativo apenas se necessário
    this.startRafIfNeeded();

    this.draw();
  }

  updateConfig(config: Partial<KnotConfig>): void {
    const freezeFlagBefore = this.cfg.freezeOnIdle;
    this.cfg = { ...this.cfg, ...config };
    if (!freezeFlagBefore && this.cfg.freezeOnIdle && this.motionInput < this.gateDown) {
      this.motionLatched = Math.max(this.motionLatched, 0.6);
    }
    this.prepareLoops();
    this.buildOffsets();
    this.startRafIfNeeded();
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
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;

    this.canvas = null;
    this.ctx = null;
    this.loops = [];
    this.loopDX = new Float32Array(0);
    this.loopDY = new Float32Array(0);
    this.waveDX = new Float32Array(0);
    this.waveDY = new Float32Array(0);
    this.offsetsX = new Float32Array(0);
    this.offsetsY = new Float32Array(0);

    this.jAmpX = new Float32Array(0);
    this.jAmpY = new Float32Array(0);
    this.jFreqX = new Float32Array(0);
    this.jFreqY = new Float32Array(0);
    this.jPhaseX = new Float32Array(0);
    this.jPhaseY = new Float32Array(0);
  }

  // --- Internos ---

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

  // Recria padrão com novo seed
  private reseedPattern(): void {
    // muda o seed base e refaz estruturas
    const newSalt = ((Math.random() * 0x7fffffff) | 0) >>> 0;
    this.baseSeed = (this.baseSeed ^ (newSalt >>> 1)) >>> 0;
    this.prepareLoops();
    this.buildOffsets();
  }

  private prepareLoops(): void {
    if (!this.canvas) return;

    const rnd = this.makeSeeded(this.baseSeed);
    const chaos = this.clamp01(this.cfg.patternChaos ?? 0.55);

    // Varia o total de loops conforme o "chaos"
    const baseCount = Math.max(8, (this.cfg.loopsCount | 0));
    const countVar = Math.round(baseCount * (1 + (rnd() * 0.8 - 0.4) * (0.6 + 0.4 * chaos)));
    const count = Math.max(8, countVar);

    const loops: LoopDef[] = [];
    let i = 0;
    while (i < count) {
      // Variação maior no agrupamento
      const gMin = chaos > 0.7 ? 1.0 : 2.0;
      const gMax = 5.5 + chaos * 1.5;
      const groupSize = Math.min(count - i, Math.floor(this.randRange(rnd, gMin, gMax)));
      const baseT = this.jittered(rnd, i / (count + 1), 0.04 + 0.035 * chaos);

      for (let g = 0; g < groupSize; g++, i++) {
        const shift = (g - (groupSize - 1) / 2) * this.randRange(rnd, 0.008, 0.034 + 0.01 * chaos);
        const t = this.clamp01(baseT + shift);

        const radiusChaos = 1 + this.randRange(rnd, -0.15, 0.9) * chaos;
        const radius = this.randRange(rnd, this.cfg.loopRadiusMin, this.cfg.loopRadiusMax) *
          (this.cfg.tangleMultiplier ?? 1) * radiusChaos;

        const dirX: Dir = rnd() > 0.5 ? 1 : -1;
        const dirY: Dir = rnd() > 0.5 ? 1 : -1;

        // Aumenta chance de twists altos com chaos
        const r = rnd();
        const twist =
          r > (0.72 - 0.25 * chaos) ? 3 :
            r > (0.48 - 0.18 * chaos) ? 2 : 1;

        const halfWidth = this.randRange(rnd, 0.05, 0.12 + 0.06 * chaos);

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

    // Jitter arrays
    this.jAmpX = new Float32Array(segments + 1);
    this.jAmpY = new Float32Array(segments + 1);
    this.jFreqX = new Float32Array(segments + 1);
    this.jFreqY = new Float32Array(segments + 1);
    this.jPhaseX = new Float32Array(segments + 1);
    this.jPhaseY = new Float32Array(segments + 1);

    const rnd = this.makeSeeded(this.baseSeed ^ 0x9e3779b9);
    const A0 = (this.cfg.noiseAmplitude * (this.cfg.tangleMultiplier ?? 1));
    const harmonics = Math.max(0, this.cfg.harmonics | 0);
    const randomizePhases = this.cfg.randomizePhases !== false;

    const phases = new Array(harmonics + 1).fill(0).map((_, h) =>
      (h === 0 ? 0 : (randomizePhases ? rnd() : 0.5) * Math.PI * 2)
    );

    // Prepara jitter paramétrico por segmento (não avança no tempo aqui)
    const jGran = Math.max(0.2, Math.min(2.0, this.cfg.timeJitterGranularity ?? 1));
    for (let i = 0; i <= segments; i++) {
      // Amplitude relativa por ponto (0.4..1.0)
      this.jAmpX[i] = 0.4 + rnd() * 0.6;
      this.jAmpY[i] = 0.4 + rnd() * 0.6;
      // Frequências leves e variadas
      this.jFreqX[i] = 0.5 + rnd() * (2.2 * jGran);
      this.jFreqY[i] = 0.5 + rnd() * (2.2 * jGran);
      // Fases aleatórias
      this.jPhaseX[i] = rnd() * Math.PI * 2;
      this.jPhaseY[i] = rnd() * Math.PI * 2;
    }

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
        // Envelope levemente mais “pico” com chaos
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

    // Base reta
    const centerY = height / 2;
    const startX = width * 0.06;
    const endX = width * 0.94;
    const lengthX = endX - startX;

    // Retângulo seguro
    const padCfg = Math.max(0, this.cfg.boundsPadding ?? 16);
    const effectivePad = Math.min(padCfg, Math.max(0, (lengthX / 2) - 4));
    const minX = startX + effectivePad;
    const maxX = endX - effectivePad;
    const minY = effectivePad;
    const maxY = height - effectivePad;

    // Fator de “bagunça” com decaimento (snap total em 1.0)
    const fall = Math.max(0.6, this.cfg.globalFalloff ?? 1.0);
    let wave = Math.pow(1 - this.progress, fall);
    if (this.progress >= 0.999) {
      wave = 0; // linha 100% reta ao chegar no fim
    }

    // Jitter temporal só aparece quando ainda há “bagunça”
    const jitterGlobalAmp = (this.cfg.timeJitterAmplitude ?? 0) * Math.pow(wave, 0.85);
    const jitterSpeed = Math.max(0.05, this.cfg.timeJitterSpeed ?? 0.8);
    const time = this.timeAcc * jitterSpeed;

    const segments = Math.min(this.offsetsX.length - 1, Math.max(2, this.cfg.segments | 0));
    const path: { x: number; y: number }[] = new Array(segments + 1);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const baseX = startX + t * lengthX;
      const baseY = centerY;

      // Offsets “base”
      let ox0 = this.offsetsX[i] * wave;
      let oy0 = this.offsetsY[i] * wave;

      // Jitter temporal (orgânico, congelado quando idle)
      if (jitterGlobalAmp > 0) {
        const jx = jitterGlobalAmp * this.jAmpX[i] * Math.sin(time * (1.2 + this.jFreqX[i]) + this.jPhaseX[i] + t * (2.0 + 5.0 * this.jFreqX[i]));
        const jy = jitterGlobalAmp * this.jAmpY[i] * Math.cos(time * (1.1 + this.jFreqY[i]) + this.jPhaseY[i] + t * (1.5 + 4.5 * this.jFreqY[i]));
        ox0 += jx;
        oy0 += jy;
      }

      // Limites permitidos a partir do ponto base
      const allowNegX = baseX - minX;
      const allowPosX = maxX - baseX;
      const allowNegY = baseY - minY;
      const allowPosY = maxY - baseY;

      // Fatores de escala para manter dentro da caixa
      let sX = 1;
      if (ox0 < 0 && allowNegX < Math.abs(ox0)) sX = allowNegX / Math.max(1e-6, Math.abs(ox0));
      else if (ox0 > 0 && allowPosX < Math.abs(ox0)) sX = allowPosX / Math.max(1e-6, Math.abs(ox0));

      let sY = 1;
      if (oy0 < 0 && allowNegY < Math.abs(oy0)) sY = allowNegY / Math.max(1e-6, Math.abs(oy0));
      else if (oy0 > 0 && allowPosY < Math.abs(oy0)) sY = allowPosY / Math.max(1e-6, Math.abs(oy0));

      const s = Math.max(0, Math.min(1, Math.min(sX, sY)));

      const x = baseX + ox0 * s;
      const y = baseY + oy0 * s;

      path[i] = { x, y };
    }

    // Aparência
    const strokeBase = this.cfg.strokeWidth;
    const glowLevels = Math.max(1, this.cfg.glowLevels || 1);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';



    // Traço principal (constante)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#64FFDA';
    ctx.shadowColor = 'rgba(100,255,218,0.4)';
    ctx.shadowBlur = 12;

    this.strokePathPolyline(ctx, path);
  }


  private strokePathPolyline(ctx: CanvasRenderingContext2D, path: { x: number; y: number }[]) {
    const n = path.length;
    if (n < 2) return;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
  }

  // RAF: só avança tempo quando há movimento (para congelar jitter no idle)
  private startRafIfNeeded(): void {
    const needJitter = (this.cfg.animate && (this.cfg.timeJitterAmplitude ?? 0) > 0);
    if (!needJitter) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      return;
    }
    if (this.rafId) return;

    const tick = (now: number) => {
      if (!this.canvas) return;
      if (!this.rafId) return;

      if (this.lastTs === 0) this.lastTs = now;
      const dt = (now - this.lastTs) / 1000;
      this.lastTs = now;

      const moving = (!this.cfg.freezeOnIdle) || (this.motionInput > this.gateUp);
      if (moving) {
        // Avança o tempo apenas quando há movimento
        this.timeAcc += dt;
      }
      // Redesenha (inclui jitter temporal)
      this.draw();

      this.rafId = requestAnimationFrame(tick);
    };

    this.lastTs = 0;
    this.rafId = requestAnimationFrame(tick);
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
}
