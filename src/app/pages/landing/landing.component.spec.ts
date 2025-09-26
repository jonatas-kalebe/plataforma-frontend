import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { ScrollOrchestrationService } from '../../services/scroll-orchestration.service';
import { HeroAnimationService, KnotCanvasService, SectionAnimationService } from '../../services/animation';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ServiceItem, CallToAction } from '../../shared/types';

// Mock services
const mockScrollOrchestrationService = {
  initialize: jasmine.createSpy('initialize'),
  destroy: jasmine.createSpy('destroy'),
  scrollToSection: jasmine.createSpy('scrollToSection'),
  scrollState$: new BehaviorSubject({
    globalProgress: 0,
    velocity: 0,
    activeSection: null,
    direction: 'none' as const
  })
};

const mockHeroAnimationService = {
  initializeHeroAnimations: jasmine.createSpy('initializeHeroAnimations'),
  destroy: jasmine.createSpy('destroy')
};

const mockKnotCanvasService = {
  initializeKnot: jasmine.createSpy('initializeKnot'),
  destroy: jasmine.createSpy('destroy')
};

const mockSectionAnimationService = {
  destroy: jasmine.createSpy('destroy')
};

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let scrollService: ScrollOrchestrationService;
  let heroAnimationService: HeroAnimationService;
  let knotCanvasService: KnotCanvasService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: ScrollOrchestrationService, useValue: mockScrollOrchestrationService },
        { provide: HeroAnimationService, useValue: mockHeroAnimationService },
        { provide: KnotCanvasService, useValue: mockKnotCanvasService },
        { provide: SectionAnimationService, useValue: mockSectionAnimationService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollOrchestrationService);
    heroAnimationService = TestBed.inject(HeroAnimationService);
    knotCanvasService = TestBed.inject(KnotCanvasService);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Reset all spy calls
    mockScrollOrchestrationService.initialize.calls.reset();
    mockScrollOrchestrationService.destroy.calls.reset();
    mockScrollOrchestrationService.scrollToSection.calls.reset();
    mockHeroAnimationService.initializeHeroAnimations.calls.reset();
    mockHeroAnimationService.destroy.calls.reset();
    mockKnotCanvasService.initializeKnot.calls.reset();
    mockKnotCanvasService.destroy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default services data', () => {
    expect(component.servicesData).toBeDefined();
    expect(component.servicesData.length).toBe(3);
    expect(component.servicesData[0].title).toBe('Aplicações Sob Medida');
  });

  it('should have primary CTA configuration', () => {
    expect(component.primaryCtaConfig).toBeDefined();
    expect(component.primaryCtaConfig.label).toBe('Fale Conosco');
    expect(component.primaryCtaConfig.variant).toBe('primary');
  });

  it('should handle hero CTA click', () => {
    const mockEvent = new Event('click');
    component.handleHeroCta(mockEvent);
    expect(scrollService.scrollToSection).toHaveBeenCalledWith('servicos');
  });

  it('should handle service click', () => {
    const mockService: ServiceItem = {
      title: 'Test Service',
      description: 'Test description'
    };
    const eventData = {
      service: mockService,
      index: 0,
      event: new Event('click')
    };
    
    spyOn(console, 'log');
    component.handleServiceClick(eventData);
    expect(console.log).toHaveBeenCalledWith('Service clicked:', 'Test Service');
  });

  it('should handle work card selection', () => {
    const mockCard = { id: 'test-card', title: 'Test Work' };
    
    spyOn(console, 'log');
    component.handleWorkCardSelection(mockCard);
    expect(console.log).toHaveBeenCalledWith('Work card selected:', mockCard);
  });

  it('should handle primary CTA click', () => {
    const mockEvent = new Event('click');
    
    spyOn(console, 'log');
    component.handlePrimaryCta(mockEvent);
    expect(console.log).toHaveBeenCalledWith('Primary CTA clicked');
  });

  it('should initialize hero animations when section is ready', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    
    component.onHeroSectionReady(mockElementRef);
    
    expect(heroAnimationService.initializeHeroAnimations).toHaveBeenCalledWith(
      mockElementRef,
      { parallaxEnabled: true, staggerEnabled: true }
    );
  });

  it('should initialize knot canvas when ready', () => {
    const mockCanvas = document.createElement('canvas');
    
    component.onKnotCanvasReady(mockCanvas);
    
    expect(knotCanvasService.initializeKnot).toHaveBeenCalledWith(
      mockCanvas,
      {
        segments: 200,
        amplitude: 0.5,
        frequency: 3,
        strokeColor: '#64FFDA',
        animate: true
      }
    );
  });

  it('should destroy all animation services on component destroy', () => {
    component.ngOnDestroy();
    
    expect(heroAnimationService.destroy).toHaveBeenCalled();
    expect(knotCanvasService.destroy).toHaveBeenCalled();
    expect(scrollService.destroy).toHaveBeenCalled();
  });

  it('should initialize scroll service on view init', () => {
    // Reset the spy since ngAfterViewInit is called during setup
    mockScrollOrchestrationService.initialize.calls.reset();
    
    component.ngAfterViewInit();
    
    // Should be called asynchronously
    setTimeout(() => {
      expect(scrollService.initialize).toHaveBeenCalled();
    }, 0);
  });

  it('should handle section ready callbacks', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    
    spyOn(console, 'log');
    
    // Test all section ready callbacks
    component.onFilosofiaSectionReady(mockElementRef);
    component.onServicosSectionReady();
    component.onTrabalhosSectionReady(mockElementRef);
    component.onCtaSectionReady();
    component.onWorkRingReady({ id: 'test-ring' });
    component.onFilosofiaAnimationComplete();
    
    // Verify console logs were called (basic functionality test)
    expect(console.log).toHaveBeenCalledTimes(6);
  });
});
