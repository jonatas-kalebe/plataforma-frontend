import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeaderComponent } from './section-header.component';

describe('SectionHeaderComponent', () => {
  let component: SectionHeaderComponent;
  let fixture: ComponentFixture<SectionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    component = fixture.componentInstance;
    component.title = 'Test Title';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toContain('Test Title');
  });

  it('should display subtitle when provided', () => {
    component.subtitle = 'Test subtitle';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')?.textContent).toContain('Test subtitle');
  });

  it('should show divider when enabled', () => {
    component.showDivider = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.bg-gradient-to-r')).toBeTruthy();
  });

  it('should apply size classes correctly', () => {
    component.size = 'xl';
    fixture.detectChanges();
    
    const titleClasses = component.getTitleClasses();
    expect(titleClasses).toContain('text-4xl md:text-5xl');
  });

  it('should apply alignment classes correctly', () => {
    component.alignment = 'left';
    fixture.detectChanges();
    
    const titleClasses = component.getTitleClasses();
    expect(titleClasses).toContain('text-left');
  });

  it('should apply animation classes when enabled', () => {
    component.enableAnimation = true;
    fixture.detectChanges();
    
    const titleClasses = component.getTitleClasses();
    expect(titleClasses).toContain('title-animation');
  });

  it('should not apply animation classes when disabled', () => {
    component.enableAnimation = false;
    fixture.detectChanges();
    
    const titleClasses = component.getTitleClasses();
    expect(titleClasses).not.toContain('title-animation');
  });
});