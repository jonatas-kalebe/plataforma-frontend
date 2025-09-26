import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { LoadingScreenComponent } from './loading-screen.component';

// Mock GSAP
const mockGsapTimeline = {
  fromTo: jasmine.createSpy('fromTo').and.returnValue(mockGsapTimeline),
  to: jasmine.createSpy('to').and.returnValue(mockGsapTimeline),
  add: jasmine.createSpy('add').and.returnValue(mockGsapTimeline),
  play: jasmine.createSpy('play'),
  kill: jasmine.createSpy('kill'),
  eventCallback: jasmine.createSpy('eventCallback').and.callFake((type, callback) => {
    if (type === 'onComplete') {
      (mockGsapTimeline as any)._onComplete = callback;
    }
    return mockGsapTimeline;
  }),
  _onComplete: () => {} // Placeholder for the onComplete callback
};

const mockGsap = {
  timeline: jasmine.createSpy('timeline').and.callFake((options: any) => {
    if (options && options.onComplete) {
      (mockGsapTimeline as any)._onComplete = options.onComplete;
    }
    return mockGsapTimeline;
  }),
  set: jasmine.createSpy('set'),
  killTweensOf: jasmine.createSpy('killTweensOf')
};

describe('LoadingScreenComponent', () => {
  let component: LoadingScreenComponent;
  let fixture: ComponentFixture<LoadingScreenComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    (window as any).gsap = mockGsap;

    await TestBed.configureTestingModule({
      imports: [LoadingScreenComponent, HttpClientTestingModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingScreenComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    mockGsap.timeline.calls.reset();
    mockGsapTimeline.fromTo.calls.reset();
    mockGsapTimeline.to.calls.reset();
    mockGsapTimeline.add.calls.reset();
    mockGsapTimeline.eventCallback.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load SVG and start animation on init (browser)', () => {
    const mockSvgContent = '<svg><path id="owl-outline"></path></svg>';
    fixture.detectChanges(); // ngOnInit

    const req = httpMock.expectOne('assets/logo/Logo_lines.svg');
    expect(req.request.method).toBe('GET');
    req.flush(mockSvgContent);

    expect(component.isLoadingSvg).toBe(false);
    expect(component.svgContent).toBeTruthy();
    expect(mockGsap.timeline).toHaveBeenCalled();
    expect(mockGsapTimeline.fromTo).toHaveBeenCalled(); // A animação do traçado
    expect(mockGsapTimeline.to).toHaveBeenCalled(); // A animação de fade-out
  });

  it('should not start animation on server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LoadingScreenComponent, HttpClientTestingModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }]
    }).compileComponents();
    const serverFixture = TestBed.createComponent(LoadingScreenComponent);
    serverFixture.detectChanges();
    // No servidor, o HTTPClient pode não ser chamado da mesma forma, mas o principal é que o GSAP não seja.
    expect(mockGsap.timeline).not.toHaveBeenCalled();
  });

  it('should emit loadingFinished when GSAP timeline completes', fakeAsync(() => {
    const mockSvgContent = '<svg><path id="owl-outline"></path></svg>';
    spyOn(component.loadingFinished, 'emit');
    fixture.detectChanges();

    const req = httpMock.expectOne('assets/logo/Logo_lines.svg');
    req.flush(mockSvgContent);

    // Simula a conclusão da timeline do GSAP
    (mockGsapTimeline as any)._onComplete();
    tick(); // Processa a emissão do evento

    expect(component.loadingFinished.emit).toHaveBeenCalled();
  }));

  it('should have a minimum display time before finishing', fakeAsync(() => {
    const mockSvgContent = '<svg><path id="owl-outline"></path></svg>';
    spyOn(component.loadingFinished, 'emit');
    fixture.detectChanges();

    const req = httpMock.expectOne('assets/logo/Logo_lines.svg');
    req.flush(mockSvgContent);

    // Simula a conclusão da timeline do GSAP imediatamente
    (mockGsapTimeline as any)._onComplete();
    tick(500); // Avança menos que o MIN_DISPLAY_TIME

    // Ainda não deve ter emitido
    expect(component.loadingFinished.emit).not.toHaveBeenCalled();

    tick(1500); // Avança o tempo total
    expect(component.loadingFinished.emit).toHaveBeenCalled();
  }));
});
