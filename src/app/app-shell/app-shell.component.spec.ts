import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a placeholder for the hero section', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroSection = compiled.querySelector('#hero');
    expect(heroSection).toBeTruthy();
    expect(heroSection?.textContent).toContain('Nós Desenvolvemos Momentos.');
  });

  it('should have a simple, non-interactive structure', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Verifica se não há scripts ou listeners complexos, apenas estrutura estática
    const scripts = compiled.querySelectorAll('script');
    expect(scripts.length).toBe(0);
  });

  it('should render basic placeholders for other sections to maintain layout', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#filosofia')).toBeTruthy();
    expect(compiled.querySelector('#servicos')).toBeTruthy();
    expect(compiled.querySelector('#trabalhos')).toBeTruthy();
    expect(compiled.querySelector('#cta')).toBeTruthy();
  });
});
