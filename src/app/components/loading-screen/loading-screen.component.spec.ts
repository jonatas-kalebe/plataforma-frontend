import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';

import { LoadingScreenComponent } from './loading-screen.component';

describe('LoadingScreenComponent', () => {
  let component: LoadingScreenComponent;
  let fixture: ComponentFixture<LoadingScreenComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingScreenComponent, HttpClientTestingModule],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadingScreenComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load SVG content on init', () => {
    const mockSvgContent = '<svg><path id="owl-outline"></path></svg>';
    
    fixture.detectChanges();
    
    const req = httpMock.expectOne('assets/logo/Logo_lines.svg');
    expect(req.request.method).toBe('GET');
    req.flush(mockSvgContent);
    
    expect(component.svgContent).toBeTruthy();
    expect(component.isLoadingSvg).toBeFalsy();
  });

  it('should emit loadingFinished when animation completes', (done) => {
    component.loadingFinished.subscribe(() => {
      expect(true).toBeTruthy();
      done();
    });
    
    fixture.detectChanges();
    
    const req = httpMock.expectOne('assets/logo/Logo_lines.svg');
    req.flush('<svg><path></path></svg>');
    
    // Trigger finish directly since we can't easily test GSAP timeline in unit tests
    (component as any).finish();
  });
});
