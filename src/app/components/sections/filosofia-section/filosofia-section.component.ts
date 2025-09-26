import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filosofia-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filosofia-section.component.html',
  styleUrls: ['./filosofia-section.component.css']
})
export class FilosofiaSectionComponent implements AfterViewInit {
  // Event outputs
  @Output() sectionReady = new EventEmitter<ElementRef>();
  @Output() canvasReady = new EventEmitter<HTMLCanvasElement>();
  
  // Component references
  @ViewChild('knotCanvas') knotCanvas!: ElementRef<HTMLCanvasElement>;
  
  ngAfterViewInit(): void {
    this.sectionReady.emit(this.knotCanvas);
    this.canvasReady.emit(this.knotCanvas.nativeElement);
  }
}