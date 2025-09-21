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

  // IDs dos grupos que esperamos encontrar no SVG
  private readonly svgGroupIds = [
    'owl-outline', 'owl-head-details', 'owl-left-eye', 'owl-right-eye',
    'owl-left-pupil', 'owl-body-circuitry-left', 'owl-body-circuitry-right',
    'owl-chest-details', 'owl-leg-details', 'owl-lower-body-circuitry'
  ];

  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef); // Para notificar o Angular sobre as mudanças

  ngOnInit(): void {
    this.http.get('assets/logo/Logo_lines.svg', { responseType: 'text' })
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this.isFadingOut = true;
            this.cdr.markForCheck(); // Notifica a mudança
            setTimeout(() => this.loadingFinished.emit(), 800);
          }, 7000);
        })
      )
      .subscribe({
        next: (svgData) => {
          this.processSvg(svgData);
          this.cdr.markForCheck(); // Notifica a mudança
        },
        error: (err) => {
          console.error('Falha crítica ao carregar ou processar o arquivo SVG:', err);
        }
      });
  }

  /**
   * CORRIGIDO: Esta função agora é mais segura.
   * Ela apenas converte IDs para classes e adiciona classes às elipses,
   * sem remover atributos estruturais essenciais como 'transform'.
   */
  private processSvg(svgData: string): void {
    let modifiedSvg = svgData;

    // 1. Converte IDs de grupos para classes para seleção via CSS.
    this.svgGroupIds.forEach(id => {
      const idRegex = new RegExp(`id="${id}"`, 'g');
      modifiedSvg = modifiedSvg.replace(idRegex, `class="${id}"`);
    });

    // 2. Adiciona classes sequenciais às elipses soltas que não têm ID.
    let ellipseCounter = 1;
    modifiedSvg = modifiedSvg.replace(/<ellipse/g, () => {
      return `<ellipse class="ellipse-${ellipseCounter++}"`;
    });

    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(modifiedSvg);
  }
}
