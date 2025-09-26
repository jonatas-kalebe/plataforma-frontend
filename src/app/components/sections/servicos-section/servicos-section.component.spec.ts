import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServicosSectionComponent } from './servicos-section.component';
import { ServiceItem } from '../../../shared/types';

describe('ServicosSectionComponent', () => {
  let component: ServicosSectionComponent;
  let fixture: ComponentFixture<ServicosSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicosSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicosSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('[data-testid="servicos-header"]');
    expect(header).toBeTruthy();
  });

  it('should render service cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const serviceCards = compiled.querySelectorAll('[data-testid^="service-card-"]');
    expect(serviceCards.length).toBe(component.services.length);
  });

  it('should have correct section ID', () => {
    expect(component.SECTION_ID).toBe('servicos');
  });

  it('should track services correctly', () => {
    const mockService: ServiceItem = { title: 'Test Service', description: 'Test description' };
    const result = component.trackByService(0, mockService);
    expect(result).toBe('Test Service0');
  });

  it('should emit serviceClicked when service is clicked', () => {
    spyOn(component.serviceClicked, 'emit');
    const mockService = component.services[0];
    const mockEvent = new Event('click');
    
    component.onServiceClick(mockService, 0, mockEvent);
    
    expect(component.serviceClicked.emit).toHaveBeenCalledWith({
      service: mockService,
      index: 0,
      event: mockEvent
    });
  });

  it('should apply correct background class', () => {
    component.backgroundColor = 'deep';
    fixture.detectChanges();
    
    const sectionClasses = component.getSectionClasses();
    expect(sectionClasses).toContain('bg-athenity-blue-deep');
  });

  it('should apply correct grid classes for auto columns', () => {
    component.gridColumns = 'auto';
    fixture.detectChanges();
    
    const gridClasses = component.getGridClasses();
    expect(gridClasses).toContain('sm:grid-cols-2 lg:grid-cols-3');
  });

  it('should apply correct grid classes for specific column count', () => {
    component.gridColumns = '4';
    fixture.detectChanges();
    
    const gridClasses = component.getGridClasses();
    expect(gridClasses).toContain('sm:grid-cols-2 lg:grid-cols-4');
  });

  it('should apply correct spacing classes', () => {
    component.gridSpacing = 'compact';
    fixture.detectChanges();
    
    const gridClasses = component.getGridClasses();
    expect(gridClasses).toContain('gap-4');
  });

  it('should calculate animation delay correctly', () => {
    component.staggerAnimation = true;
    component.animationDelay = 0.2;
    
    const delay = component.getCardAnimationDelay(2);
    expect(delay).toBe(0.4);
  });

  it('should not calculate animation delay when staggering is disabled', () => {
    component.staggerAnimation = false;
    
    const delay = component.getCardAnimationDelay(2);
    expect(delay).toBe(0);
  });

  it('should allow custom services', () => {
    const customServices: ServiceItem[] = [
      { title: 'Custom Service 1', description: 'Custom description 1' },
      { title: 'Custom Service 2', description: 'Custom description 2' }
    ];
    
    component.services = customServices;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const serviceCards = compiled.querySelectorAll('[data-testid^="service-card-"]');
    expect(serviceCards.length).toBe(2);
  });

  it('should show additional content when enabled', () => {
    component.showAdditionalContent = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const additionalContent = compiled.querySelector('[slot=additional-content]');
    // Content projection area should exist
    const contentContainer = compiled.querySelector('.mt-12.text-center');
    expect(contentContainer).toBeTruthy();
  });
});