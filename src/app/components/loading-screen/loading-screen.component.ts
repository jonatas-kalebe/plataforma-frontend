import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation, inject, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import gsap from 'gsap';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LoadingScreenComponent implements OnInit, AfterViewInit {
  @Output() loadingFinished = new EventEmitter<void>();

  private http = inject(HttpClient);
  private host = inject(ElementRef<HTMLElement>);

  private overlay!: HTMLDivElement;
  private wrap!: HTMLDivElement;
  private svgRoot!: SVGSVGElement;
  private owlGroup!: SVGGElement;
  private glowLayer!: SVGGElement;
  private flashLayer!: SVGGElement;
  private tl!: gsap.core.Timeline;
  private vb = { w: 447, h: 518 };

  private order = [
    'owl-lower-body-circuitry',
    'owl-leg-details',
    'owl-body-circuitry-left',
    'owl-body-circuitry-right',
    'owl-chest-details',
    'owl-left-eye',
    'owl-left-pupil',
    'owl-right-eye',
    'owl-head-details',
    'owl-free-dots',
    'owl-outline'
  ];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createOverlay();
    this.http.get('assets/logo/Logo_lines.svg', { responseType: 'text' }).subscribe({
      next: (svg) => { this.buildScene(svg); this.animate(); },
      error: () => this.finish()
    });
  }

  private createOverlay() {
    const s = document.createElement('style');
    s.textContent = `
      .ath-overlay{position:fixed;inset:0;background:#0A192F;z-index:9999;display:grid;place-items:center;cursor:pointer;padding:4vh 4vw;box-sizing:border-box}
      .ath-wrap{position:relative;display:flex;flex-direction:column;align-items:center;gap:.75rem;transform-origin:top left;will-change:transform,opacity}
      .ath-svg{width:min(15vw,150px);min-width:100px;max-width:640px;height:auto;display:block;overflow:visible}
      .ath-status{font-family:'Fira Code',monospace;color:#8892B0;opacity:0}
      .ath-svg *{vector-effect:non-scaling-stroke;shape-rendering:geometricPrecision}
    `;
    document.head.appendChild(s);
    this.overlay = document.createElement('div');
    this.overlay.className = 'ath-overlay';
    this.wrap = document.createElement('div');
    this.wrap.className = 'ath-wrap';
    this.overlay.appendChild(this.wrap);
    this.overlay.addEventListener('click', () => { if (this.tl) this.tl.progress(0.98); });
    document.body.appendChild(this.overlay);
  }

  private buildScene(svgText: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const sourceSvg = doc.querySelector('svg') as SVGSVGElement | null;
    if (sourceSvg?.viewBox.baseVal) this.vb = { w: sourceSvg.viewBox.baseVal.width, h: sourceSvg.viewBox.baseVal.height };

    this.svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgRoot.setAttribute('viewBox', `0 0 ${this.vb.w} ${this.vb.h + 110}`);
    this.svgRoot.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svgRoot.setAttribute('class', 'ath-svg');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glow.setAttribute('id', 'ath-glow');
    glow.setAttribute('filterUnits', 'objectBoundingBox');
    glow.setAttribute('x', '-50%');
    glow.setAttribute('y', '-50%');
    glow.setAttribute('width', '200%');
    glow.setAttribute('height', '200%');
    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '3.5');
    blur.setAttribute('result', 'blur');
    glow.appendChild(blur);

    const glowEye = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowEye.setAttribute('id', 'ath-eye-glow');
    glowEye.setAttribute('filterUnits', 'objectBoundingBox');
    glowEye.setAttribute('x', '-50%');
    glowEye.setAttribute('y', '-50%');
    glowEye.setAttribute('width', '200%');
    glowEye.setAttribute('height', '200%');
    const blurEye = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blurEye.setAttribute('stdDeviation', '2.2');
    blurEye.setAttribute('result', 'blur');
    glowEye.appendChild(blurEye);

    defs.appendChild(glow);
    defs.appendChild(glowEye);
    this.svgRoot.appendChild(defs);

    this.glowLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    this.glowLayer.setAttribute('id', 'ath-glow-layer');

    this.owlGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    this.svgRoot.appendChild(this.glowLayer);
    this.svgRoot.appendChild(this.owlGroup);

    const groups: Record<string, SVGGElement> = {};
    this.order.forEach(id => {
      const g = doc.getElementById(id) as SVGGElement | null;
      const ng = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
      ng.setAttribute('id', id);
      const glowG = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;

      if (g) {
        const nodes = g.querySelectorAll('path,ellipse,circle,polyline,polygon,line') as NodeListOf<SVGGeometryElement>;
        nodes.forEach((el: SVGGeometryElement) => this.cloneInto(el, ng, glowG));
      } else if (id === 'owl-free-dots' && sourceSvg) {
        // @ts-ignore
        const loose = Array.from(sourceSvg.querySelectorAll('ellipse,circle')).filter(e => e.parentElement === sourceSvg) as SVGGeometryElement[];
        loose.forEach(el => this.cloneInto(el, ng, glowG, true));
      }

      groups[id] = ng;
      this.glowLayer.appendChild(glowG as unknown as Node);
      this.owlGroup.appendChild(ng as unknown as Node);
    });

    this.flashLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    this.flashLayer.setAttribute('id', 'ath-flash-layer');

    const leftG = this.owlGroup.querySelector('#owl-left-pupil') as SVGGElement | null;
    const rightG = this.owlGroup.querySelector('#owl-right-eye') as SVGGElement | null;

    if (leftG) {
      const bb = leftG.getBBox();
      const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      e.setAttribute('cx', String(bb.x + bb.width / 2));
      e.setAttribute('cy', String(bb.y + bb.height / 2));
      e.setAttribute('rx', String((bb.width / 2) * 0.75));
      e.setAttribute('ry', String((bb.height / 2) * 0.75));
      e.setAttribute('fill', 'none');
      e.setAttribute('stroke', '#FFD700');
      e.setAttribute('stroke-width', '3');
      e.setAttribute('opacity', '0');
      e.setAttribute('filter', 'url(#ath-eye-glow)');
      this.flashLayer.appendChild(e);
    }

    if (rightG) {
      const bb = rightG.getBBox();
      const e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      e.setAttribute('cx', String(bb.x + bb.width / 2));
      e.setAttribute('cy', String(bb.y + bb.height / 2));
      e.setAttribute('rx', String((bb.width / 2) * 0.68));
      e.setAttribute('ry', String((bb.height / 2) * 0.68));
      e.setAttribute('fill', 'none');
      e.setAttribute('stroke', '#FFD700');
      e.setAttribute('stroke-width', '3');
      e.setAttribute('opacity', '0');
      e.setAttribute('filter', 'url(#ath-eye-glow)');
      this.flashLayer.appendChild(e);
    }

    this.svgRoot.appendChild(this.flashLayer);

    const status = document.createElement('div');
    status.className = 'ath-status';
    this.wrap.appendChild(this.svgRoot);
    this.wrap.appendChild(status);
  }

  private cloneInto(src: SVGGeometryElement, baseGroup: SVGGElement, glowGroup: SVGGElement, forceFade = false) {
    const isGold = ((src as SVGElement).getAttribute('stroke') || '').toLowerCase().includes('#dbc043');
    const base = src.cloneNode(true) as SVGGeometryElement;
    (base as SVGElement).setAttribute('stroke', isGold ? '#FFD700' : '#8892B0');
    (base as SVGElement).setAttribute('fill', 'none');
    (base as SVGElement).setAttribute('stroke-linecap', 'round');
    (base as SVGElement).setAttribute('stroke-linejoin', 'round');
    (base as SVGElement).setAttribute('stroke-width', '2');
    (base as SVGElement).setAttribute('opacity', '0');

    const drawable = !forceFade && this.canDraw(base);
    if (drawable) {
      const L = this.getLen(base);
      (base as SVGElement).setAttribute('stroke-dasharray', `${L} ${L}`);
      (base as SVGElement).setAttribute('stroke-dashoffset', `${L}`);
      (base as SVGElement).setAttribute('data-anim', 'draw');
    } else {
      (base as SVGElement).setAttribute('data-anim', 'fade');
    }
    baseGroup.appendChild(base as unknown as Node);

    const glowStroke = src.cloneNode(true) as SVGGeometryElement;
    (glowStroke as SVGElement).setAttribute('stroke', isGold ? '#FFD700' : '#64FFDA');
    (glowStroke as SVGElement).setAttribute('fill', 'none');
    (glowStroke as SVGElement).setAttribute('stroke-linecap', 'round');
    (glowStroke as SVGElement).setAttribute('stroke-linejoin', 'round');
    (glowStroke as SVGElement).setAttribute('stroke-width', '4');
    (glowStroke as SVGElement).setAttribute('opacity', '0');
    (glowStroke as SVGElement).setAttribute('filter', 'url(#ath-glow)');
    if (drawable) {
      const L = this.getLen(glowStroke);
      (glowStroke as SVGElement).setAttribute('stroke-dasharray', `${L} ${L}`);
      (glowStroke as SVGElement).setAttribute('stroke-dashoffset', `${L}`);
      (glowStroke as SVGElement).setAttribute('data-anim', 'draw');
    } else {
      (glowStroke as SVGElement).setAttribute('data-anim', 'fade');
    }
    glowGroup.appendChild(glowStroke as unknown as Node);
  }

  private canDraw(el: SVGGeometryElement): boolean {
    try { return typeof (el as any).getTotalLength === 'function'; } catch { return false; }
  }

  private animate() {
    const lines = this.collectByOrder();
    const glowLines = Array.from(this.glowLayer.querySelectorAll('path,ellipse,circle,polyline,polygon,line') as NodeListOf<SVGGeometryElement>);
    const status = this.wrap.querySelector('.ath-status') as HTMLDivElement;
    const flashEyes = Array.from(this.flashLayer.querySelectorAll('ellipse') as NodeListOf<SVGEllipseElement>);

    const drawTotal = 2.6;
    this.tl = gsap.timeline({ defaults: { ease: 'none' } });

    const drawEls = lines.filter(el => (el as SVGElement).getAttribute('data-anim') === 'draw');
    const avg = this.avgLen(drawEls);
    let cursor = 0;
    const unit = drawTotal / Math.max(lines.length, 1);

    lines.forEach((el, i) => {
      const mode = (el as SVGElement).getAttribute('data-anim');
      const glow = glowLines[i];
      if (mode === 'draw') {
        const len = this.getLen(el);
        const dur = unit * (len / Math.max(avg, 1));
        this.tl.fromTo(el, { opacity: 0, strokeDashoffset: len }, { opacity: 1, strokeDashoffset: 0, duration: dur }, cursor);
        if (glow) {
          this.tl.fromTo(glow, { opacity: 0, strokeDashoffset: len }, { opacity: 0.85, strokeDashoffset: 0, duration: dur * 0.8 }, cursor + dur * 0.05);
          this.tl.to(glow, { opacity: 0, duration: dur * 0.2 }, cursor + dur * 0.8);
        }
        cursor += dur * 0.94;
      } else {
        const dur = unit * 0.7;
        this.tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: dur }, cursor);
        if (glow) {
          this.tl.fromTo(glow, { opacity: 0 }, { opacity: 0.85, duration: dur * 0.8 }, cursor + dur * 0.05);
          this.tl.to(glow, { opacity: 0, duration: dur * 0.2 }, cursor + dur * 0.8);
        }
        cursor += dur * 0.9;
      }
    });

    const blinkAt = drawTotal + 0.1;
    this.tl.fromTo(flashEyes, { opacity: 0, stroke: '#FFD700' }, { opacity: 1, duration: 0.12, yoyo: true, repeat: 1 }, blinkAt);
    this.tl.to(status, { opacity: 1, duration: 0.45 }, Math.max(0, drawTotal - 0.2));
    this.tl.add(this.moveToNav(), blinkAt + 0.38);
    this.tl.add(this.fadeOut(), blinkAt + 1.0);
  }

  private moveToNav() {
    return () => {
      const slot = document.getElementById('nav-logo-slot');
      if (!slot) return;
      const start = this.wrap.getBoundingClientRect();
      const end = slot.getBoundingClientRect();
      const scale = 56 / Math.max(start.width, 1);
      const dx = end.left - start.left;
      const dy = end.top - start.top;
      gsap.to(this.wrap, { duration: 0.6, ease: 'power3.inOut', x: dx, y: dy, scale });
      setTimeout(() => {
        const clone = this.svgRoot.cloneNode(true) as SVGSVGElement;
        clone.removeAttribute('class');
        clone.style.width = '56px';
        clone.style.height = 'auto';
        while (slot.firstChild) slot.removeChild(slot.firstChild);
        slot.appendChild(clone);
      }, 600);
    };
  }

  private fadeOut() {
    return () => {
      gsap.to(this.overlay, { duration: 0.7, opacity: 0, ease: 'power2.out', onComplete: () => this.finish() });
    };
  }

  private collectByOrder(): SVGGeometryElement[] {
    const arr: SVGGeometryElement[] = [];
    this.order.forEach(id => {
      const g = this.owlGroup.querySelector(`#${id}`) as SVGGElement | null;
      if (!g) return;
      const nodes = g.querySelectorAll('path,ellipse,circle,polyline,polygon,line') as NodeListOf<SVGGeometryElement>;
      nodes.forEach(n => arr.push(n));
    });
    return arr;
  }

  private getLen(el: SVGGeometryElement): number {
    try { if (typeof (el as any).getTotalLength === 'function') return (el as any).getTotalLength(); } catch {}
    const bb = el.getBBox();
    return Math.max(20, (bb.width + bb.height) * 0.5);
  }

  private getTextLen(t: SVGTextElement): number {
    try { return (t as any).getComputedTextLength ? (t as any).getComputedTextLength() : 300; } catch { return 300; }
  }

  private avgLen(list: SVGGeometryElement[]): number {
    if (!list.length) return 1;
    const s = list.reduce((a, e) => a + this.getLen(e), 0);
    return s / list.length;
  }

  private finish() {
    if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this.loadingFinished.emit();
  }
}
