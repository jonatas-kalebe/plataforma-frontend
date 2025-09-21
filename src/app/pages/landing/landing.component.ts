
import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    this.initAnimations();
}

  private initAnimations(): void {
    const heroTimeline = gsap.timeline({
      defaults: { ease: 'power3.out', duration: 1 }
    });

    heroTimeline
      .from('#hero-title', { opacity: 0, y: 50, delay: 0.2 })
      .from('#hero-subtitle', { opacity: 0, y: 40 }, "-=0.8")
      .from('#hero-cta', { opacity: 0, y: 30 }, "-=0.6");

    gsap.utils.toArray<HTMLElement>('.service-card').forEach(card => {
      gsap.from(card, {
        opacity: 0,
        y: 100,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      });
    });
  }
}
