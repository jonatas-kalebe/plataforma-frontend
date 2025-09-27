import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SECTION_IDS } from '../../../shared/constants/section.constants';

@Component({
  selector: 'app-filosofia-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filosofia-section.component.html',
  styleUrls: ['./filosofia-section.component.css']
})
export class FilosofiaSectionComponent implements AfterViewInit {
  // Configuration inputs
  @Input() title: string = 'Da Complexidade à Clareza.';
  @Input() description: string = 'Transformamos sistemas caóticos em experiências nítidas. Arquitetura, design e engenharia convergem para mover pessoas e negócios.';
  @Input() showCanvasOverlay: boolean = false;

  // Event outputs
  @Output() sectionReady = new EventEmitter<ElementRef>();
  @Output() canvasReady = new EventEmitter<HTMLCanvasElement>();
  
  // Component references
  @ViewChild('knotCanvas') knotCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Constants
  readonly SECTION_ID = SECTION_IDS.FILOSOFIA;
  
  ngAfterViewInit(): void {
    this.sectionReady.emit(this.knotCanvas);
    this.canvasReady.emit(this.knotCanvas.nativeElement);
  }

  /**
   * Get the canvas context
   */
  getCanvasContext(): CanvasRenderingContext2D | null {
    if (!this.knotCanvas?.nativeElement) return null;
    return this.knotCanvas.nativeElement.getContext('2d');
  }

  /**
   * Clear the canvas
   */
  clearCanvas(): void {
    const context = this.getCanvasContext();
    if (!context) return;
    
    const canvas = this.knotCanvas.nativeElement;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
}