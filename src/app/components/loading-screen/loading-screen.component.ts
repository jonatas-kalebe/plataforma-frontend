import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import gsap from 'gsap';
import {finalize, first} from 'rxjs/operators';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LoadingScreenComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() loadingFinished = new EventEmitter<void>();

  svgContent: SafeHtml | null = null;
  isLoadingSvg = true;

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private hostRef = inject(ElementRef<HTMLElement>);
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  private tl: gsap.core.Timeline | null = null;
  private isDone = false;
  private onSkip = () => this.skipAnimation();

  private readonly animationOrder = [
    'owl-outline', 'owl-head-details', 'owl-left-eye', 'owl-right-eye',
    'owl-left-pupil', 'owl-body-circuitry-left', 'owl-body-circuitry-right',
    'owl-chest-details', 'owl-leg-details', 'owl-lower-body-circuitry'
  ];

  ngOnInit(): void {
    this.http.get('assets/logo/Logo_lines.svg', {responseType: 'text'})
      .pipe(
        first(), finalize(() => {
          this.isLoadingSvg = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(svgData => {
        const processedSvg = this.processSvgIds(svgData);
        this.svgContent = this.sanitizer.bypassSecurityTrustHtml(processedSvg);
      });
  }

  ngAfterViewInit(): void {
    this.hostRef.nativeElement.addEventListener('click', this.onSkip);
    if (!this.isLoadingSvg) {
      this.initAnimation();
    } else {
      const observer = new MutationObserver(() => {
        if (this.hostRef.nativeElement.querySelector('svg')) {
          this.initAnimation();
          observer.disconnect();
        }
      });
      observer.observe(this.hostRef.nativeElement, {childList: true, subtree: true});
    }
  }

  ngOnDestroy(): void {
    this.hostRef.nativeElement.removeEventListener('click', this.onSkip);
    this.tl?.kill();
  }

  private processSvgIds(svgData: string): string {
    let modifiedSvg = svgData;
    this.animationOrder.forEach(id => {
      const idRegex = new RegExp(`id="${id}"`, 'g');
      modifiedSvg = modifiedSvg.replace(idRegex, `class="${id}"`);
    });
    let ellipseCounter = 1;
    modifiedSvg = modifiedSvg.replace(/<ellipse/g, (match) => {
      if (match.includes('class=')) return match;
      return `<ellipse class="ellipse-${ellipseCounter++}"`;
    });
    return modifiedSvg;
  }

  private initAnimation(): void {
    if (this.isDone) return;
    const overlay = this.hostRef.nativeElement.querySelector('.loading-overlay') as HTMLElement | null;
    const wrapper = this.hostRef.nativeElement.querySelector('.logo-wrapper');

    const svgPaths = this.hostRef.nativeElement.querySelectorAll('path, ellipse');

    if (!overlay || !wrapper || svgPaths.length === 0) {
      this.finish();
      return;
    }

    gsap.set([svgPaths], {opacity: 0});
    gsap.set(svgPaths, {
      strokeDasharray: (i, el) => this.getPathLength(el),
      strokeDashoffset: (i, el) => this.getPathLength(el),
    });

    this.tl = gsap.timeline({onComplete: () => this.finish()});

    this.tl
      .to(svgPaths, {
        strokeDashoffset: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.inOut',
        stagger: 0.1,
      })
    .to({}, {duration: 1.3})
      .to(overlay, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
      });
  }

  private getPathLength(el: SVGElement): number {
    if ((el as any).getTotalLength) {
      return (el as any).getTotalLength();
    }
    return 1000;
  }

  private skipAnimation(): void {
    if (this.isDone) return;
    const overlay = this.hostRef.nativeElement.querySelector('.loading-overlay') as HTMLElement | null;
    const svgPaths = this.hostRef.nativeElement.querySelectorAll('path, ellipse');
    this.tl?.kill();
    if (svgPaths.length > 0) {
      gsap.killTweensOf(svgPaths);
      gsap.set(svgPaths, {strokeDashoffset: 0, opacity: 1});
    }
    if (overlay) {
      gsap.killTweensOf(overlay);
      gsap.set(overlay, {opacity: 0, pointerEvents: 'none'});
    }
    this.finish();
  }

  private finish(): void {
    if (this.isDone) return;
    this.isDone = true;
    this.hostRef.nativeElement.removeEventListener('click', this.onSkip);
    this.zone.run(() => this.loadingFinished.emit());
  }
}
