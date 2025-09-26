import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilosofiaSectionComponent } from './filosofia-section.component';

describe('FilosofiaSectionComponent', () => {
  let component: FilosofiaSectionComponent;
  let fixture: ComponentFixture<FilosofiaSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilosofiaSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilosofiaSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h2');
    const description = compiled.querySelector('p');
    
    expect(title?.textContent).toContain('Da Complexidade à Clareza');
    expect(description?.textContent).toContain('Transformamos sistemas caóticos');
  });

  it('should render canvas with correct attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const canvas = compiled.querySelector('canvas');
    
    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute('data-testid')).toBe('knot-canvas');
  });

  it('should emit canvasReady on view init', () => {
    spyOn(component.canvasReady, 'emit');
    
    component.ngAfterViewInit();
    
    expect(component.canvasReady.emit).toHaveBeenCalledWith(component.knotCanvas.nativeElement);
  });

  it('should emit sectionReady on view init', () => {
    spyOn(component.sectionReady, 'emit');
    
    component.ngAfterViewInit();
    
    expect(component.sectionReady.emit).toHaveBeenCalled();
  });

  it('should have correct section ID', () => {
    expect(component.SECTION_ID).toBe('filosofia');
  });

  it('should show canvas overlay when enabled', () => {
    component.showCanvasOverlay = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const overlay = compiled.querySelector('.bg-gradient-to-tr');
    expect(overlay).toBeTruthy();
  });

  it('should hide canvas overlay when disabled', () => {
    component.showCanvasOverlay = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const overlay = compiled.querySelector('.bg-gradient-to-tr');
    expect(overlay).toBeFalsy();
  });

  it('should get canvas context', () => {
    // Mock canvas context
    const mockContext = {} as CanvasRenderingContext2D;
    spyOn(component.knotCanvas.nativeElement, 'getContext').and.returnValue(mockContext);
    
    const result = component.getCanvasContext();
    
    expect(result).toBe(mockContext);
  });

  it('should clear canvas', () => {
    // Mock canvas and context
    const mockContext = {
      clearRect: jasmine.createSpy('clearRect')
    } as any;
    
    spyOn(component, 'getCanvasContext').and.returnValue(mockContext);
    component.knotCanvas.nativeElement.width = 400;
    component.knotCanvas.nativeElement.height = 300;
    
    component.clearCanvas();
    
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
  });

  it('should allow customization of content', () => {
    component.title = 'Custom Title';
    component.description = 'Custom description text';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('h2');
    const description = compiled.querySelector('p');
    
    expect(title?.textContent).toBe('Custom Title');
    expect(description?.textContent).toBe('Custom description text');
  });
});