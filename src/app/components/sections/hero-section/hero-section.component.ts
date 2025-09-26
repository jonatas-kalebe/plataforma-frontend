import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreeParticleBackgroundComponent } from '../../three-particle-background/three-particle-background.component';

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
  
  // Event outputs
  @Output() ctaClicked = new EventEmitter<Event>();
  @Output() sectionReady = new EventEmitter<ElementRef>();
  
  // Component references
  @ViewChild('heroBg') heroBg!: ElementRef;
  @ViewChild(ThreeParticleBackgroundComponent) particleBackground!: ThreeParticleBackgroundComponent;
  
  ngAfterViewInit(): void {
    this.sectionReady.emit(this.heroBg);
  }
}