import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrabalhosSectionComponent } from './trabalhos-section.component';

describe('TrabalhosSectionComponent', () => {
  let component: TrabalhosSectionComponent;
  let fixture: ComponentFixture<TrabalhosSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrabalhosSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TrabalhosSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const header = compiled.querySelector('h3');
    expect(header).toBeTruthy();
    expect(header?.textContent?.trim()).toBe('Prova de Conceito');
  });

  it('should render work showcase', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const showcase = compiled.querySelector('[data-testid="work-showcase"]');
    expect(showcase).toBeTruthy();
  });

  it('should display interaction hint', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const hint = compiled.querySelector('.text-sm');
    expect(hint).toBeTruthy();
    expect(hint?.textContent?.trim()).toBe('Arraste para girar');
  });

  it('should have correct section ID', () => {
    expect(component.SECTION_ID).toBe('trabalhos');
  });

  it('should emit ringReady when ring is ready', () => {
    spyOn(component.ringReady, 'emit');
    const mockRing = { id: 'test-ring' };
    
    component.onRingReady(mockRing);
    
    expect(component.ringReady.emit).toHaveBeenCalledWith(mockRing);
  });

  it('should emit cardSelected when card is selected', () => {
    spyOn(component.cardSelected, 'emit');
    const mockCard = { id: 'test-card' };
    
    component.onCardSelected(mockCard);
    
    expect(component.cardSelected.emit).toHaveBeenCalledWith(mockCard);
  });

  it('should not add overflow-hidden class when pinning is enabled', () => {
    component.enablePinning = true;
    fixture.detectChanges();
    
    const sectionClasses = component.getSectionClasses();
    expect(sectionClasses).not.toContain('overflow-hidden');
  });

  it('should add overflow-hidden class when pinning is disabled', () => {
    component.enablePinning = false;
    fixture.detectChanges();
    
    const sectionClasses = component.getSectionClasses();
    expect(sectionClasses).toContain('overflow-hidden');
  });

  it('should allow customization of section title', () => {
    component.sectionTitle = 'Custom Work Title';
    fixture.detectChanges();
    
    // The title is passed to app-section-header, so we can't directly test the rendered output
    // but we can verify the input property is set correctly
    expect(component.sectionTitle).toBe('Custom Work Title');
  });

  it('should allow customization of hint text', () => {
    component.hintText = 'Custom hint text';
    fixture.detectChanges();
    
    expect(component.hintText).toBe('Custom hint text');
  });

  it('should update hint text dynamically', () => {
    const newText = 'Updated hint text';
    component.updateHintText(newText);
    
    expect(component.hintText).toBe(newText);
  });

  it('should update hint visibility', () => {
    component.setHintVisibility(false);
    expect(component.hintOpacity).toBe(0);
    
    component.setHintVisibility(true);
    expect(component.hintOpacity).toBe(0.7);
  });

  it('should show additional content when enabled', () => {
    component.showAdditionalContent = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const contentContainer = compiled.querySelector('.mt-8.text-center');
    expect(contentContainer).toBeTruthy();
  });

  it('should have correct test id', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('section');
    expect(section?.getAttribute('data-testid')).toBe('trabalhos-section');
  });
});