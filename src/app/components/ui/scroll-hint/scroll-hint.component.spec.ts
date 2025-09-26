import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollHintComponent } from './scroll-hint.component';

describe('ScrollHintComponent', () => {
  let component: ScrollHintComponent;
  let fixture: ComponentFixture<ScrollHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollHintComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display default text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hint-text')?.textContent).toContain('Scroll');
  });

  it('should display custom text', () => {
    component.text = 'Custom hint text';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hint-text')?.textContent).toContain('Custom hint text');
  });

  it('should show arrow when enabled', () => {
    component.showArrow = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.scroll-arrow')).toBeTruthy();
    expect(compiled.querySelector('svg')).toBeTruthy();
  });

  it('should show icon when provided', () => {
    component.icon = 'fas fa-arrow-down';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('i')).toBeTruthy();
    expect(compiled.querySelector('i')).toHaveClass('fas', 'fa-arrow-down');
  });

  it('should apply position classes correctly', () => {
    component.position = 'top';
    fixture.detectChanges();
    
    const hintClasses = component.getHintClasses();
    expect(hintClasses).toContain('absolute top-6');
  });

  it('should apply alignment classes correctly', () => {
    component.alignment = 'left';
    fixture.detectChanges();
    
    const hintClasses = component.getHintClasses();
    expect(hintClasses).toContain('left-6');
  });

  it('should apply animation classes', () => {
    component.animate = 'fade-in';
    fixture.detectChanges();
    
    const hintClasses = component.getHintClasses();
    expect(hintClasses).toContain('fade-in');
  });

  it('should not apply animation classes when set to none', () => {
    component.animate = 'none';
    fixture.detectChanges();
    
    const hintClasses = component.getHintClasses();
    expect(hintClasses).not.toContain('fade-in');
    expect(hintClasses).not.toContain('pulse');
  });

  it('should update opacity dynamically', () => {
    component.setOpacity(0.5);
    expect(component.opacity).toBe(0.5);
  });
});