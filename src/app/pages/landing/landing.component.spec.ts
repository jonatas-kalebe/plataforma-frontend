import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComponent } from './landing.component';
import { ScrollOrchestrationService } from '../../services/scroll-orchestration.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Mock do serviço de orquestração de scroll
const mockScrollOrchestrationService = {
  initialize: jasmine.createSpy('initialize'),
  destroy: jasmine.createSpy('destroy'),
  scrollToSection: jasmine.createSpy('scrollToSection'),
  scrollState$: new BehaviorSubject({
    globalProgress: 0,
    velocity: 0,
    activeSection: 0,
    direction: 'none'
  })
};

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let scrollService: ScrollOrchestrationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: ScrollOrchestrationService, useValue: mockScrollOrchestrationService }
      ],
      // Usar NO_ERRORS_SCHEMA para ignorar componentes filhos que não queremos testar aqui
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollOrchestrationService);
    fixture.detectChanges();
  });

  afterEach(() => {
    mockScrollOrchestrationService.initialize.calls.reset();
    mockScrollOrchestrationService.destroy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the ScrollOrchestrationService on ngAfterViewInit', () => {
    component.ngAfterViewInit();
    expect(scrollService.initialize).toHaveBeenCalled();
  });

  it('should destroy the ScrollOrchestrationService on ngOnDestroy', () => {
    component.ngOnDestroy();
    expect(scrollService.destroy).toHaveBeenCalled();
  });

  it('should render all the main sections of the page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-hero-section')).toBeTruthy();
    expect(compiled.querySelector('app-philosophy-section')).toBeTruthy();
    expect(compiled.querySelector('app-services-section')).toBeTruthy();
    expect(compiled.querySelector('app-work-section')).toBeTruthy();
    expect(compiled.querySelector('app-cta-section')).toBeTruthy();
  });

  it('should render the three-particle-background component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-three-particle-background')).toBeTruthy();
  });
});
