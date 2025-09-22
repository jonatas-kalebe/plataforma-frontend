import { Component, AfterViewInit, OnDestroy, NgZone, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

import Swiper from 'swiper';
import { EffectCoverflow } from 'swiper/modules';
import {
  ThreeParticleBackgroundComponent
} from '../../components/three-particle-background/three-particle-background.component';

// Registrar plugins GSAP
gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ThreeParticleBackgroundComponent, ThreeParticleBackgroundComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Necessário para Swiper.js
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private swiperInstance: Swiper | undefined;

  constructor(private ngZone: NgZone, private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initAnimations();
      this.initSwiper();
    });
  }

  ngOnDestroy(): void {
    // Destruir todas as instâncias do ScrollTrigger para evitar memory leaks
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    this.swiperInstance?.destroy();
  }

  private initSwiper(): void {
    this.swiperInstance = new Swiper('.swiper-container', {
      modules: [EffectCoverflow],
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 'auto',
      loop: true,
      coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true,
      },
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
    });
  }

  private initAnimations(): void {
    // 1. Animação de entrada da Seção Herói (após o loading)
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('#hero-title', { opacity: 0, y: 50, duration: 1.2, delay: 0.2 })
      .from('#hero-subtitle', { opacity: 0, y: 40, duration: 1 }, "-=0.8")
      .from('#hero-cta', { opacity: 0, y: 30, duration: 0.8 }, "-=0.6");

    // Animação de Pin e Fade Out da Seção Herói ao rolar
    gsap.to('#hero-section', {
      scrollTrigger: {
        trigger: '#hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        pin: true,
        pinSpacing: false
      },
      opacity: 0
    });

    // 2. Animação da Seção Filosofia
    const philosophyTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#philosophy-section',
        start: 'top 70%',
        toggleActions: 'play none none reverse'
      }
    });

    philosophyTl
      .from('#philosophy-section .section-title', { opacity: 0, x: -50, duration: 1 })
      .from('#philosophy-section .section-body', { opacity: 0, x: -50, duration: 1 }, "-=0.7");

    // Animação do SVG
    gsap.to('#tangled-path', {
      scrollTrigger: {
          trigger: '#clarity-animation',
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 0.5,
      },
      morphSVG: '#clear-path',
      ease: 'power1.inOut'
    });

    // 3. Animação da Seção de Serviços (Cards)
    gsap.from('.service-card', {
      scrollTrigger: {
        trigger: '#services-section',
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 100,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power3.out'
    });

    // Animações genéricas para títulos e CTAs das seções
    const sections = this.el.nativeElement.querySelectorAll('#services-section, #work-section, #cta-section');
    sections.forEach((section: HTMLElement) => {
      const title = section.querySelector('.section-title');
      const body = section.querySelector('.section-body');
      const cta = section.querySelector('.section-cta, .swiper-container');

      const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
      });

      if (title) tl.from(title, { opacity: 0, y: 50, duration: 1 });
      if (body) tl.from(body, { opacity: 0, y: 40, duration: 1 }, "-=0.7");
      if (cta) tl.from(cta, { opacity: 0, y: 30, duration: 0.8 }, "-=0.6");
    });
  }
}
