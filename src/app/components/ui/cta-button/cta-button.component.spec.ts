import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CtaButtonComponent } from './cta-button.component';

describe('CtaButtonComponent', () => {
  let component: CtaButtonComponent;
  let fixture: ComponentFixture<CtaButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CtaButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CtaButtonComponent);
    component = fixture.componentInstance;
    component.label = 'Test Button';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display label', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.button-text')?.textContent).toContain('Test Button');
  });

  it('should render as anchor when href is provided', () => {
    component.href = 'https://example.com';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a')).toBeTruthy();
    expect(compiled.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
  });

  it('should render as button when no href', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button')).toBeTruthy();
  });

  it('should emit click event', () => {
    spyOn(component.click, 'emit');
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    button?.click();
    
    expect(component.click.emit).toHaveBeenCalled();
  });

  it('should not emit click when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    
    spyOn(component.click, 'emit');
    
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    button?.click();
    
    expect(component.click.emit).not.toHaveBeenCalled();
  });

  it('should apply variant classes', () => {
    component.variant = 'secondary';
    fixture.detectChanges();
    
    const buttonClasses = component.getButtonClasses();
    expect(buttonClasses).toContain('cta-secondary');
  });

  it('should apply size classes', () => {
    component.size = 'lg';
    fixture.detectChanges();
    
    const buttonClasses = component.getButtonClasses();
    expect(buttonClasses).toContain('text-xl px-10 py-5');
  });

  it('should show icons when provided', () => {
    component.iconBefore = 'fas fa-star';
    component.iconAfter = 'fas fa-arrow-right';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.icon-before')).toBeTruthy();
    expect(compiled.querySelector('.icon-after')).toBeTruthy();
  });

  it('should apply full width class', () => {
    component.fullWidth = true;
    fixture.detectChanges();
    
    const buttonClasses = component.getButtonClasses();
    expect(buttonClasses).toContain('w-full block');
  });
});