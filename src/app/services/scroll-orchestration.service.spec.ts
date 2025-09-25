import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ScrollOrchestrationService } from './scroll-orchestration.service';

// Mock GSAP
const mockGsap = {
  registerPlugin: jasmine.createSpy('registerPlugin'),
  to: jasmine.createSpy('to'),
  timeline: jasmine.createSpy('timeline').and.returnValue({
    from: jasmine.createSpy('from').and.returnValue({
      from: jasmine.createSpy('from').and.returnValue({
        from: jasmine.createSpy('from')
      })
    })
  }),
  from: jasmine.createSpy('from'),
  utils: {
    toArray: jasmine.createSpy('toArray').and.returnValue([])
  }
};

const mockScrollTrigger = {
  create: jasmine.createSpy('create').and.returnValue({ 
    kill: jasmine.createSpy('kill'),
    refresh: jasmine.createSpy('refresh')
  }),
  getAll: jasmine.createSpy('getAll').and.returnValue([]),
  killAll: jasmine.createSpy('killAll'),
  getVelocity: jasmine.createSpy('getVelocity').and.returnValue(0),
  refresh: jasmine.createSpy('refresh')
};

// Mock window.matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jasmine.createSpy('matchMedia').and.returnValue({
    matches: false,
    addEventListener: jasmine.createSpy('addEventListener')
  })
});

// Mock DOM elements
const mockElement = {
  getBoundingClientRect: () => ({ top: 0, bottom: 1000, height: 1000 }),
  offsetTop: 0,
  offsetHeight: 1000,
  style: {},
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener')
};

const mockBody = {
  scrollTop: 0,
  scrollHeight: 5000,
  clientHeight: 1000,
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener')
};

describe('ScrollOrchestrationService', () => {
  let service: ScrollOrchestrationService;
  let platformId: Object;

  beforeEach(() => {
    // Mock GSAP modules
    (window as any).gsap = mockGsap;
    (window as any).ScrollTrigger = mockScrollTrigger;
    
    // Mock document.querySelector to return mock elements
    spyOn(document, 'querySelector').and.callFake((selector: string) => {
      if (selector.includes('#')) {
        return mockElement;
      }
      return mockElement;
    });
    
    // Mock document.body
    spyOnProperty(document, 'body', 'get').and.returnValue(mockBody as any);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ScrollOrchestrationService);
    platformId = TestBed.inject(PLATFORM_ID);
  });

  afterEach(() => {
    // Reset spies
    mockGsap.registerPlugin.calls.reset();
    mockGsap.to.calls.reset();
    mockScrollTrigger.create.calls.reset();
    mockScrollTrigger.getAll.calls.reset();
    mockScrollTrigger.killAll.calls.reset();
    mockScrollTrigger.getVelocity.calls.reset();
    
    // Clear DOM mocks
    (document.querySelector as jasmine.Spy).calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not initialize on server platform', () => {
    // Create service with server platform
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    const serverService = TestBed.inject(ScrollOrchestrationService);
    
    serverService.initialize();
    expect(mockGsap.registerPlugin).not.toHaveBeenCalled();
  });

  it('should initialize correctly on browser platform', () => {
    service.initialize();

    expect(mockGsap.registerPlugin).toHaveBeenCalled();
    expect(mockScrollTrigger.create).toHaveBeenCalled();
    expect(document.querySelector).toHaveBeenCalledWith('#hero');
  });

  it('should check for reduced motion preference', () => {
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should provide scroll metrics observable', (done) => {
    expect(service.metrics$).toBeDefined();
    
    service.metrics$.subscribe(metrics => {
      expect(metrics).toEqual(jasmine.objectContaining({
        globalProgress: jasmine.any(Number),
        velocity: jasmine.any(Number),
        activeSection: jasmine.any(Number),
        sections: jasmine.any(Array)
      }));
      done();
    });
  });

  it('should not scroll to section on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    const serverService = TestBed.inject(ScrollOrchestrationService);
    
    serverService.scrollToSection('hero');
    expect(mockGsap.to).not.toHaveBeenCalled();
  });

  it('should scroll to section on browser platform', () => {
    const mockElement = document.createElement('div');
    spyOn(document, 'querySelector').and.returnValue(mockElement);

    service.scrollToSection('hero');
    expect(mockGsap.to).toHaveBeenCalled();
  });

  it('should clean up resources on destroy', () => {
    service.destroy();
    expect(mockScrollTrigger.killAll).toHaveBeenCalled();
  });

  it('should get section by id', () => {
    service.initialize();
    
    // Since sections are created during initialization with proper DOM mocking
    const section = service.getSection('hero');
    expect(section).toBeDefined();
  });

  it('should handle reduced motion preference changes', () => {
    let mockMediaQuery = {
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener')
    };
    
    (window.matchMedia as jasmine.Spy).and.returnValue(mockMediaQuery);
    
    service.initialize();
    
    // Simulate change to reduced motion
    mockMediaQuery.matches = true;
    const changeHandler = mockMediaQuery.addEventListener.calls.argsFor(0)[1];
    changeHandler({ matches: true });
    
    expect(mockScrollTrigger.getAll).toHaveBeenCalled();
  });
});