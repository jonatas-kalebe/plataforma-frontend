import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface KnotConfig {
  segments?: number;
  strokeWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
  straightLinePadding?: number;
  straightLineOffset?: number;
  preserveAspectRatio?: string;
  [key: string]: unknown;
}

interface Point {
  x: number;
  y: number;
}

@Injectable({ providedIn: 'root' })
export class KnotCanvasService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tangledSvgUrl = new URL(
    '../../../assets/Components_assets/Tangled-Line.svg',
    import.meta.url
  ).href;

  private readonly DEFAULT_CONFIG: Required<
    Pick<
      KnotConfig,
      'segments' | 'strokeWidth' | 'strokeColor' | 'backgroundColor' | 'straightLinePadding' | 'straightLineOffset'
    >
  > & { preserveAspectRatio: string } = {
    segments: 400,
    strokeWidth: 2,
    strokeColor: '#64FFDA',
    backgroundColor: 'transparent',
    straightLinePadding: 0,
    straightLineOffset: 0,
    preserveAspectRatio: 'none',
  };

  private hostElement: HTMLElement | null = null;
  private svgEl: SVGSVGElement | null = null;
  private pathEl: SVGPathElement | null = null;

  private originalPathD = '';
  private originalPoints: Point[] = [];
  private straightPoints: Point[] = [];
  private cfg: KnotConfig = { ...this.DEFAULT_CONFIG };
  private ready = false;
  private progress = 0;

  initializeKnot(
    host: HTMLElement,
    config: Partial<KnotConfig> = {},
    initialProgress = 0
  ): Promise<SVGSVGElement | null> {
    if (!isPlatformBrowser(this.platformId) || !host) {
      return Promise.resolve(null);
    }

    this.cfg = { ...this.DEFAULT_CONFIG, ...config };
    this.hostElement = host;
    this.progress = this.clamp01(initialProgress);

    this.hostElement.style.backgroundColor = this.cfg.backgroundColor ?? 'transparent';
    this.hostElement.innerHTML = '';

    return this.loadSvg()
      .then(() => {
        this.prepareGeometry();
        this.ready = true;
        this.renderProgress(this.progress);
        return this.svgEl;
      })
      .catch((err) => {
        console.error('Failed to initialise knot SVG', err);
        return null;
      });
  }

  setProgress(progress: number): void {
    this.progress = this.clamp01(progress);
    if (!this.ready) return;
    this.renderProgress(this.progress);
  }

  // Mantido para compatibilidade com a API anterior
  setMotion(_: number): void {
    // A animação baseada em SVG não utiliza mais jitter dependente de movimento.
  }

  updateConfig(config: Partial<KnotConfig>): void {
    if (!this.hostElement) return;
    this.cfg = { ...this.cfg, ...config };
    if (!this.pathEl) return;
    this.applyConfigToPath();
    this.prepareGeometry();
    if (this.ready) {
      this.renderProgress(this.progress);
    }
  }

  resize(): void {
    if (!this.ready) return;
    this.prepareGeometry();
    this.renderProgress(this.progress);
  }

  clear(): void {
    if (this.hostElement) {
      this.hostElement.innerHTML = '';
    }
    this.svgEl = null;
    this.pathEl = null;
    this.originalPathD = '';
    this.originalPoints = [];
    this.straightPoints = [];
    this.ready = false;
  }

  destroy(): void {
    this.clear();
    this.hostElement = null;
  }

  private async loadSvg(): Promise<void> {
    if (!this.hostElement) return;

    const response = await fetch(this.tangledSvgUrl);
    if (!response.ok) {
      throw new Error(`Failed to load SVG asset: ${response.status}`);
    }

    const svgText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgNode = doc.querySelector('svg');
    const pathNode = svgNode?.querySelector('path');

    if (!svgNode || !pathNode) {
      throw new Error('SVG asset does not contain an expected path element.');
    }

    const svg = svgNode.cloneNode(true) as SVGSVGElement;
    const path = svg.querySelector('path');
    if (!path) {
      throw new Error('Cloned SVG is missing a path element.');
    }

    svg.setAttribute('preserveAspectRatio', this.cfg.preserveAspectRatio ?? this.DEFAULT_CONFIG.preserveAspectRatio);
    svg.style.width = '100%';
    svg.style.height = '100%';

    this.hostElement.innerHTML = '';
    this.hostElement.appendChild(svg);

    this.svgEl = svg;
    this.pathEl = path;
    this.originalPathD = path.getAttribute('d') ?? '';

    this.applyConfigToPath();
  }

  private applyConfigToPath(): void {
    if (!this.pathEl) return;

    this.pathEl.setAttribute('fill', 'none');
    this.pathEl.setAttribute('stroke', this.cfg.strokeColor ?? this.DEFAULT_CONFIG.strokeColor);
    this.pathEl.setAttribute('stroke-width', String(this.cfg.strokeWidth ?? this.DEFAULT_CONFIG.strokeWidth));
    this.pathEl.setAttribute('vector-effect', 'non-scaling-stroke');
  }

  private prepareGeometry(): void {
    if (!this.pathEl) return;

    if (!this.originalPathD) {
      this.originalPathD = this.pathEl.getAttribute('d') ?? '';
    } else {
      this.pathEl.setAttribute('d', this.originalPathD);
    }

    const segments = Math.max(32, Math.floor((this.cfg.segments as number) || this.DEFAULT_CONFIG.segments));
    const totalLength = this.pathEl.getTotalLength();

    const points: Point[] = [];
    for (let i = 0; i <= segments; i++) {
      const len = (i / segments) * totalLength;
      const pt = this.pathEl.getPointAtLength(len);
      points.push({ x: pt.x, y: pt.y });
    }

    this.originalPoints = points;

    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const bbox = this.pathEl.getBBox();
    const targetX = bbox.x + bbox.width / 2 + (Number(this.cfg.straightLineOffset) || 0);
    const padding = Math.max(0, Number(this.cfg.straightLinePadding) || 0);
    const targetMinY = minY + padding;
    const targetMaxY = maxY - padding;
    const height = targetMaxY - targetMinY;

    this.straightPoints = points.map((_, index) => {
      const t = segments === 0 ? 0 : index / segments;
      return {
        x: targetX,
        y: height > 0 ? targetMinY + height * t : targetMinY,
      };
    });

    if (this.progress > 0) {
      this.renderProgress(this.progress);
    } else {
      this.pathEl.setAttribute('d', this.originalPathD);
    }
  }

  private renderProgress(progress: number): void {
    if (!this.pathEl || this.originalPoints.length === 0) return;

    const easedProgress = this.applyProgressEasing(progress);

    if (easedProgress <= 0) {
      this.pathEl.setAttribute('d', this.originalPathD);
      return;
    }

    if (easedProgress >= 1) {
      const d = this.buildPath(this.straightPoints);
      this.pathEl.setAttribute('d', d);
      return;
    }

    const interpolated = this.originalPoints.map((start, index) => {
      const end = this.straightPoints[index];
      return {
        x: start.x + (end.x - start.x) * easedProgress,
        y: start.y + (end.y - start.y) * easedProgress,
      };
    });

    const d = this.buildPath(interpolated);
    this.pathEl.setAttribute('d', d);
  }

  private applyProgressEasing(progress: number): number {
    const clamped = this.clamp01(progress);

    // Delay the start of the straightening to give the impression that the
    // knot takes longer to begin unfolding.
    const startDelay = 0.18; // 18% of the gesture keeps the original knot.
    if (clamped <= startDelay) {
      return 0;
    }

    const normalized = (clamped - startDelay) / (1 - startDelay);
    if (normalized >= 1) {
      return 1;
    }

    // Ease-in curve so the line begins to straighten gently before speeding up.
    const eased = normalized * normalized * normalized;

    // Snap the line to a perfect straight segment once the user is close
    // enough to the centred position.
    const snapThreshold = 0.92;
    if (normalized >= snapThreshold) {
      return 1;
    }

    return this.clamp01(eased);
  }

  private buildPath(points: Point[]): string {
    if (!points.length) return '';
    const [first, ...rest] = points;
    let d = `M ${first.x} ${first.y}`;
    for (const pt of rest) {
      d += ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }

  private clamp01(value: number): number {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
}
