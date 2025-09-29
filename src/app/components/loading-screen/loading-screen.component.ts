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
import gsap from 'gsap';
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
  private tl: gsap.core.Timeline | null = null;
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

    // Use window.gsap if available (for tests), otherwise use imported gsap
    const gsapInstance = (window as any).gsap || gsap;

    gsapInstance.set([svgPaths], {opacity: 0});
    gsapInstance.set(svgPaths, {
      strokeDasharray: (i: number, el: any) => this.getPathLength(el),
      strokeDashoffset: (i: number, el: any) => this.getPathLength(el),
    });

    this.tl = gsapInstance.timeline({onComplete: () => this.finish()});

    if (this.tl) {
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
    
    // Use window.gsap if available (for tests), otherwise use imported gsap
    const gsapInstance = (window as any).gsap || gsap;
    
    this.tl?.kill();
    if (svgPaths.length > 0) {
      gsapInstance.killTweensOf(svgPaths);
      gsapInstance.set(svgPaths, {strokeDashoffset: 0, opacity: 1});
    }
    if (overlay) {
      gsapInstance.killTweensOf(overlay);
      gsapInstance.set(overlay, {opacity: 0, pointerEvents: 'none'});
    }
    
    // When animation is skipped, finish immediately
    // The user will see loading of components that weren't preloaded yet
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
