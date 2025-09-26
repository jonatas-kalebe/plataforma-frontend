import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { LoadingScreenComponent } from './components/loading-screen/loading-screen.component';
import { LandingComponent } from './pages/landing/landing.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';

// Mock dos componentes filhos para isolar o teste do AppComponent
@Component({ selector: 'app-loading-screen', template: '' })
class MockLoadingScreenComponent {}

@Component({ selector: 'app-landing', template: '' })
class MockLandingComponent {}


describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule],
      // Declarar os mocks para substituir os componentes reais
    }).overrideComponent(AppComponent, {
      remove: {
        imports: [LoadingScreenComponent, LandingComponent]
      },
      add: {
        imports: [MockLoadingScreenComponent, MockLandingComponent]
      }
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initially show the loading overlay', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    expect(app.showOverlay()).toBe(true);
  });

  it('should hide the loading overlay when onOverlayDone is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges(); // Seta o valor inicial para true

    app.onOverlayDone();
    fixture.detectChanges(); // Aplica a mudança no signal

    expect(app.showOverlay()).toBe(false);
  });

  it('should render the landing page content after the overlay is hidden', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;

    // Inicialmente, a tela de landing pode ou não estar no DOM, mas o overlay está visível
    app.onOverlayDone();
    fixture.detectChanges();

    // Após o overlay sumir, a landing page deve estar presente
    expect(compiled.querySelector('app-landing')).toBeTruthy();
  });
});
