import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CtaSectionComponent } from './cta-section.component';
import { CallToAction } from '../../../shared/types';

describe('CtaSectionComponent', () => {
  let component: CtaSectionComponent;
  let fixture: ComponentFixture<CtaSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CtaSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CtaSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('[data-testid="cta-title"]');
    expect(title?.textContent).toContain('Vamos Construir o Futuro');
  });

  it('should display subtitle when provided', () => {
    component.subtitle = 'Custom subtitle text';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const subtitle = compiled.querySelector('[data-testid="cta-subtitle"]');
    expect(subtitle?.textContent).toContain('Custom subtitle text');
  });

  it('should render primary CTA button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const primaryButton = compiled.querySelector('[data-testid="primary-cta-button"]');
    expect(primaryButton).toBeTruthy();
  });

  it('should render secondary CTA button when provided', () => {
    const secondaryCta: CallToAction = {
      label: 'Learn More',
      href: '/learn-more',
      variant: 'secondary'
    };
    
    component.secondaryCta = secondaryCta;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const secondaryButton = compiled.querySelector('[data-testid="secondary-cta-button"]');
    expect(secondaryButton).toBeTruthy();
  });

  it('should not render secondary CTA button when not provided', () => {
    component.secondaryCta = undefined;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const secondaryButton = compiled.querySelector('[data-testid="secondary-cta-button"]');
    expect(secondaryButton).toBeFalsy();
  });

  it('should have correct section ID', () => {
    expect(component.SECTION_ID).toBe('cta');
  });

  it('should emit primaryCtaClicked when primary button is clicked', () => {
    spyOn(component.primaryCtaClicked, 'emit');
    const mockEvent = new Event('click');
    
    component.onPrimaryCtaClick(mockEvent);
    
    expect(component.primaryCtaClicked.emit).toHaveBeenCalledWith(mockEvent);
  });

  it('should emit secondaryCtaClicked when secondary button is clicked', () => {
    spyOn(component.secondaryCtaClicked, 'emit');
    const mockEvent = new Event('click');
    
    component.onSecondaryCtaClick(mockEvent);
    
    expect(component.secondaryCtaClicked.emit).toHaveBeenCalledWith(mockEvent);
  });

  it('should call primary CTA onClick callback when provided', () => {
    const onClickSpy = jasmine.createSpy('onClick');
    component.primaryCta = {
      ...component.primaryCta,
      onClick: onClickSpy
    };
    
    const mockEvent = new Event('click');
    component.onPrimaryCtaClick(mockEvent);
    
    expect(onClickSpy).toHaveBeenCalled();
  });

  it('should apply correct background classes', () => {
    component.backgroundColor = 'deep';
    fixture.detectChanges();
    
    const sectionClasses = component.getSectionClasses();
    expect(sectionClasses).toContain('bg-athenity-blue-deep');
  });

  it('should apply stacked button layout class', () => {
    component.buttonLayout = 'stacked';
    fixture.detectChanges();
    
    const sectionClasses = component.getSectionClasses();
    expect(sectionClasses).toContain('buttons-stacked');
  });

  it('should apply inline button layout class', () => {
    component.buttonLayout = 'inline';
    fixture.detectChanges();
    
    const sectionClasses = component.getSectionClasses();
    expect(sectionClasses).toContain('buttons-inline');
  });

  it('should update primary CTA dynamically', () => {
    const updates = { label: 'Updated Label', variant: 'secondary' as const };
    component.updatePrimaryCta(updates);
    
    expect(component.primaryCta.label).toBe('Updated Label');
    expect(component.primaryCta.variant).toBe('secondary');
  });

  it('should update secondary CTA dynamically', () => {
    const newSecondaryCta: CallToAction = {
      label: 'New Secondary',
      href: '/new-secondary',
      variant: 'ghost'
    };
    
    component.updateSecondaryCta(newSecondaryCta);
    expect(component.secondaryCta).toBe(newSecondaryCta);
  });

  it('should show additional content when enabled', () => {
    component.showAdditionalContent = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const contentContainer = compiled.querySelector('.mt-12');
    expect(contentContainer).toBeTruthy();
  });

  it('should show footer content when enabled', () => {
    component.showFooterContent = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const footerContainer = compiled.querySelector('.mt-16.pt-8.border-t');
    expect(footerContainer).toBeTruthy();
  });
});