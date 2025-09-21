import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ViewEncapsulation, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LoadingScreenComponent implements OnInit {
  isFadingOut = false;
  @Output() loadingFinished = new EventEmitter<void>();
  svgContent: SafeHtml | null = null;

  private readonly svgGroupIds = [
    'owl-outline', 'owl-head-details', 'owl-left-eye', 'owl-right-eye',
    'owl-left-pupil', 'owl-body-circuitry-left', 'owl-body-circuitry-right',
    'owl-chest-details', 'owl-leg-details', 'owl-lower-body-circuitry'
  ];

  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.http.get('assets/logo/Logo_lines.svg', { responseType: 'text' })
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.isFadingOut = true;
            this.cdr.markForCheck();
            setTimeout(() => this.loadingFinished.emit(), 800);
          }, 3600);
        })
      )
      .subscribe({
        next: (svgData) => {
          this.processSvg(svgData);
          this.cdr.markForCheck();
        },
        error: (err) => {}
      });
  }

  private processSvg(svgData: string): void {
    let modifiedSvg = svgData;
    this.svgGroupIds.forEach(id => {
      const idRegex = new RegExp(`id="${id}"`, 'g');
      modifiedSvg = modifiedSvg.replace(idRegex, `class="${id}"`);
    });
    let ellipseCounter = 1;
    modifiedSvg = modifiedSvg.replace(/<ellipse/g, () => `<ellipse class="ellipse-${ellipseCounter++}"`);
    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(modifiedSvg);
  }
}
