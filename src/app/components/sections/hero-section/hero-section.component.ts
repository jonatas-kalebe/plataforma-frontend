import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeParticleBackgroundComponent } from '../../three-particle-background/three-particle-background.component';
import { SECTION_IDS } from '../../../shared/constants/section.constants';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, ThreeParticleBackgroundComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css']
})
export class HeroSectionComponent implements AfterViewInit {
  // Configuration variables (customizable - at top of file)
  @Input() scrollState: any = null;
  @Input() titlePrefix: string = 'Nós Desenvolvemos ';
  @Input() titleHighlight: string = 'Momentos';
  @Input() titleSuffix: string = '.';
  
  // Event outputs
  @Output() ctaClicked = new EventEmitter<Event>();
  @Output() sectionReady = new EventEmitter<ElementRef>();
  
  // Component references
  @ViewChild('heroBg') heroBg!: ElementRef;
  @ViewChild(ThreeParticleBackgroundComponent) particleBackground!: ThreeParticleBackgroundComponent;
  
  // Constants
  readonly SECTION_ID = SECTION_IDS.HERO;
  
  ngAfterViewInit(): void {
    this.sectionReady.emit(this.heroBg);
  }

  /**
   * Handle CTA click
   */
  onCtaClick(event: Event): void {
    this.ctaClicked.emit(event);
  }
}