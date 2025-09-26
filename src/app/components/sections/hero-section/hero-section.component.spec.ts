import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroSectionComponent } from './hero-section.component';
import { ScrollState } from '../../../services/scroll-orchestration.service';

describe('HeroSectionComponent', () => {
  let component: HeroSectionComponent;
  let fixture: ComponentFixture<HeroSectionComponent>;

  const mockScrollState: ScrollState = {
    globalProgress: 0,
    velocity: 0,
    activeSection: null,
    direction: 'none'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSectionComponent);
    component = fixture.componentInstance;
    component.scrollState = mockScrollState;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title with highlight', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('#hero-title');
    expect(title?.textContent).toContain('Nós Desenvolvemos');
    expect(title?.textContent).toContain('Momentos');
  });

  it('should display subtitle', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subtitle = compiled.querySelector('#hero-subtitle');
    expect(subtitle?.textContent).toContain('Não criamos sites');
  });

  it('should render CTA button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cta = compiled.querySelector('[data-testid="hero-cta-button"]');
    expect(cta).toBeTruthy();
  });

  it('should render scroll hint', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const scrollHint = compiled.querySelector('[data-testid="hero-scroll-hint"]');
    expect(scrollHint).toBeTruthy();
  });

  it('should emit ctaClicked when CTA is clicked', () => {
    spyOn(component.ctaClicked, 'emit');
    const mockEvent = new Event('click');
    
    component.onCtaClick(mockEvent);
    
    expect(component.ctaClicked.emit).toHaveBeenCalledWith(mockEvent);
  });

  it('should emit sectionReady after view init', () => {
    spyOn(component.sectionReady, 'emit');
    
    component.ngAfterViewInit();
    
    expect(component.sectionReady.emit).toHaveBeenCalled();
  });

  it('should have correct section ID', () => {
    expect(component.SECTION_ID).toBe('hero');
  });

  it('should allow customization of title parts', () => {
    component.titlePrefix = 'We Create ';
    component.titleHighlight = 'Amazing';
    component.titleSuffix = ' Experiences.';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('#hero-title');
    expect(title?.textContent).toContain('We Create Amazing Experiences.');
  });
});