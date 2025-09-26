import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceCardComponent } from './service-card.component';
import { ServiceItem } from '../../../shared/types';

describe('ServiceCardComponent', () => {
  let component: ServiceCardComponent;
  let fixture: ComponentFixture<ServiceCardComponent>;
  
  const mockService: ServiceItem = {
    title: 'Test Service',
    description: 'Test description for the service'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCardComponent);
    component = fixture.componentInstance;
    component.service = mockService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display service title and description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h4')?.textContent).toContain(mockService.title);
    expect(compiled.querySelector('p')?.textContent).toContain(mockService.description);
  });

  it('should apply custom classes', () => {
    component.customClass = 'test-class';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.service-card')).toHaveClass('test-class');
  });

  it('should show icon when provided', () => {
    component.service = { ...mockService, icon: 'fas fa-star' };
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('i')).toBeTruthy();
    expect(compiled.querySelector('i')).toHaveClass('fas', 'fa-star');
  });

  it('should apply hover classes when hover is enabled', () => {
    component.hoverEnabled = true;
    fixture.detectChanges();
    
    const cardClasses = component.getCardClasses();
    expect(cardClasses).toContain('hover:-translate-y-2');
  });

  it('should not apply hover classes when hover is disabled', () => {
    component.hoverEnabled = false;
    fixture.detectChanges();
    
    const cardClasses = component.getCardClasses();
    expect(cardClasses).not.toContain('hover:-translate-y-2');
  });
});