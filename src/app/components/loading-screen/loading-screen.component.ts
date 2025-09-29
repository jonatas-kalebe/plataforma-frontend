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
  ViewEncapsulation,
  PLATFORM_ID
} from '@angular/core';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {finalize, first} from 'rxjs/operators';
import { PreloadService } from '../../services/preload.service';

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
  private platformId = inject(PLATFORM_ID);
  private preloadService = inject(PreloadService);
  private animationTimeout: number | null = null;
  private isDone = false;
  private onSkip = () => this.skipAnimation();
  private startTime: number = 0;
  private readonly MIN_DISPLAY_TIME = 2000; // Minimum display time in ms
  private preloadStarted = false;

  private readonly animationOrder = [
    'owl-outline', 'owl-head-details', 'owl-left-eye', 'owl-right-eye',
    'owl-left-pupil', 'owl-body-circuitry-left', 'owl-body-circuitry-right',
    'owl-chest-details', 'owl-leg-details', 'owl-lower-body-circuitry'
  ];

  ngOnInit(): void {
    this.startTime = Date.now(); // Track when component started

    // Start preloading immediately based on user source
    if (isPlatformBrowser(this.platformId)) {
      this.startComponentPreloading();
    }

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
    if (!isPlatformBrowser(this.platformId)) return;

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
    if (isPlatformBrowser(this.platformId)) {
      this.hostRef.nativeElement.removeEventListener('click', this.onSkip);
    }
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
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

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Skip animation and show content immediately
      this.showFinalState(svgPaths, overlay);
      this.finish();
      return;
    }

    // Set initial state for all SVG elements
    svgPaths.forEach((path: Element, index: number) => {
      const element = path as SVGPathElement | SVGEllipseElement;
      const pathLength = this.getPathLength(element);

      // Set initial stroke properties
      element.style.strokeDasharray = pathLength.toString();
      element.style.strokeDashoffset = pathLength.toString();
      element.style.opacity = '0';

      // Add staggered animation class
      element.classList.add('svg-draw-stagger');

      // Set up individual animation timing
      const delay = index * 100; // 0.1s stagger
      element.style.animationDelay = `${delay}ms`;
    });

    // Start the animation sequence
    this.startAnimationSequence(overlay, svgPaths);
  }

  private startAnimationSequence(overlay: HTMLElement, svgPaths: NodeListOf<Element>): void {
    // Trigger CSS animations by adding the draw class
    svgPaths.forEach((path: Element) => {
      path.classList.add('svg-draw');
    });

    // Calculate total animation duration (stagger + animation + pause + fade)
    const staggerTime = svgPaths.length * 100; // 0.1s per element
    const animationTime = 1000; // 1s animation duration
    const pauseTime = 1300; // 1.3s pause
    const totalTime = staggerTime + animationTime + pauseTime;

    // Schedule overlay fade out
    this.animationTimeout = window.setTimeout(() => {
      overlay.style.transition = 'opacity 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
      overlay.style.opacity = '0';

      // Finish after fade completes
      setTimeout(() => this.finish(), 500);
    }, totalTime);
  }

  private showFinalState(svgPaths: NodeListOf<Element>, overlay: HTMLElement): void {
    svgPaths.forEach((path: Element) => {
      const element = path as SVGPathElement | SVGEllipseElement;
      element.style.strokeDasharray = 'none';
      element.style.strokeDashoffset = '0';
      element.style.opacity = '1';
    });

    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }

  private getPathLength(el: SVGElement): number {
    if ((el as any).getTotalLength) {
      return (el as any).getTotalLength();
    }
    return 1000;
  }

  private skipAnimation(): void {
    if (this.isDone) return;

    console.log('⏭️ User skipped owl animation - stopping preload and finishing immediately');

    const overlay = this.hostRef.nativeElement.querySelector('.loading-overlay') as HTMLElement | null;
    const svgPaths = this.hostRef.nativeElement.querySelectorAll('path, ellipse');

    // Cancel any running animations
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }

    // Show final state immediately
    if (svgPaths.length > 0) {
      this.showFinalState(svgPaths, overlay!);
    }

    this.finish();
  }

  private async startComponentPreloading(): Promise<void> {
    if (this.preloadStarted) return;
    this.preloadStarted = true;

    const isFromSearch = this.preloadService.isFromSearchSource();
    console.log(`🦉 Starting component preloading during owl animation (source: ${isFromSearch ? 'search' : 'direct'})`);

    try {
      await this.preloadService.startPreloading(isFromSearch, (progress) => {
        console.log(`🔄 Preload progress: ${progress.toFixed(1)}%`);
      });
    } catch (error) {
      console.error('❌ Preloading failed:', error);
    }
  }

  private async finish(): Promise<void> {
    if (this.isDone) return;

    // Check if minimum display time has passed
    const elapsedTime = Date.now() - this.startTime;
    if (elapsedTime < this.MIN_DISPLAY_TIME) {
      // Wait for the remaining time before finishing
      const remainingTime = this.MIN_DISPLAY_TIME - elapsedTime;
      setTimeout(() => this.finish(), remainingTime);
      return;
    }

    // For search users, wait a bit longer for critical components to load
    const isFromSearch = this.preloadService.isFromSearchSource();
    if (isFromSearch && this.preloadService.isPreloadingActive) {
      console.log('🔍 Search user detected, ensuring critical components are loaded...');
      // Give more time for critical components if still loading
      const additionalWaitTime = Math.min(1000, this.MIN_DISPLAY_TIME * 0.5);
      setTimeout(() => this.finish(), additionalWaitTime);
      return;
    }

    this.isDone = true;
    this.hostRef.nativeElement.removeEventListener('click', this.onSkip);

    const totalLoadTime = Date.now() - this.startTime;
    const preloadProgress = this.preloadService.getPreloadProgress();
    console.log(`🦉 Owl animation finished. Total time: ${totalLoadTime}ms, Preload progress: ${preloadProgress.toFixed(1)}%`);

    this.zone.run(() => this.loadingFinished.emit());
  }
}
