import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ScrollOrchestrationService } from './scroll-orchestration.service';

// Mock robusto para GSAP e ScrollTrigger
const mockGsap = {
  registerPlugin: jasmine.createSpy('registerPlugin'),
  to: jasmine.createSpy('to').and.callFake((target, vars) => ({
    kill: jasmine.createSpy('kill')
  })),
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

const mockScrollTriggerInstance = {
  kill: jasmine.createSpy('kill'),
  refresh: jasmine.createSpy('refresh'),
  progress: 0.5, // Valor padrão para testes
  start: 0,
  end: 1000
};

const mockScrollTrigger = {
  create: jasmine.createSpy('create').and.returnValue(mockScrollTriggerInstance),
  getAll: jasmine.createSpy('getAll').and.returnValue([mockScrollTriggerInstance]),
  killAll: jasmine.createSpy('killAll'),
  getVelocity: jasmine.createSpy('getVelocity').and.returnValue(0),
  refresh: jasmine.createSpy('refresh'),
  defaults: jasmine.createSpy('defaults'),
  sort: jasmine.createSpy('sort'),
  update: jasmine.createSpy('update')
};

// Mock de elementos do DOM
const createMockElement = (id: string, top: number, height: number) => ({
  id,
  getBoundingClientRect: () => ({ top, bottom: top + height, height, left: 0, right: 800, x: 0, y: top, toJSON: () => '' }),
  offsetTop: top,
  offsetHeight: height,
  style: {},
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener'),
  classList: { add: jasmine.createSpy('add'), remove: jasmine.createSpy('remove') }
});

const mockSections = {
  hero: createMockElement('hero', 0, 1000),
  filosofia: createMockElement('filosofia', 1000, 1000),
  servicos: createMockElement('servicos', 2000, 1000),
  trabalhos: createMockElement('trabalhos', 3000, 1000),
  cta: createMockElement('cta', 4000, 1000)
};

describe('ScrollOrchestrationService', () => {
  let service: ScrollOrchestrationService;

  beforeEach(() => {
    (window as any).gsap = mockGsap;
    (window as any).ScrollTrigger = mockScrollTrigger;

    spyOn(document, 'querySelector').and.callFake((selector: string) => {
      const id = selector.replace('#', '');
      return (mockSections as any)[id] || null;
    });
    spyOn(document, 'querySelectorAll').and.returnValue(Object.values(mockSections) as any);

    TestBed.configureTestingModule({
      providers: [
        ScrollOrchestrationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(ScrollOrchestrationService);
  });

  afterEach(() => {
    // Limpa todos os mocks após cada teste
    Object.values(mockGsap).forEach(spy => (spy as jasmine.Spy).calls?.reset());
    Object.values(mockScrollTrigger).forEach(spy => (spy as jasmine.Spy).calls?.reset());
    mockScrollTriggerInstance.kill.calls.reset();
    mockScrollTriggerInstance.refresh.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not initialize on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ScrollOrchestrationService,
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
    const serverService = TestBed.inject(ScrollOrchestrationService);
    serverService.initialize();
    expect(mockGsap.registerPlugin).not.toHaveBeenCalled();
  });

  describe('Browser-side Initialization', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should register GSAP plugins', () => {
      expect(mockGsap.registerPlugin).toHaveBeenCalledWith(mockScrollTrigger, jasmine.any(Object));
    });

    it('should create a ScrollTrigger for each section', () => {
      // 5 seções + 1 global
      expect(mockScrollTrigger.create).toHaveBeenCalledTimes(Object.keys(mockSections).length + 1);
    });

    it('should set up a global progress tracker', () => {
      const globalTriggerArgs = mockScrollTrigger.create.calls.allArgs().find(args => args[0].trigger === document.body);
      expect(globalTriggerArgs).toBeDefined();
      // @ts-ignore
      expect(globalTriggerArgs[0].id).toBe('global-progress');
    });
  });

  describe('Magnetic Scroll Snapping', () => {
    let globalOnUpdate: (self: any) => void;

    beforeEach(() => {
      service.initialize();
      // Captura a função onUpdate do gatilho global para simular o scroll
      const globalTriggerArgs = mockScrollTrigger.create.calls.allArgs().find(args => args[0].id === 'global-progress');
      if (globalTriggerArgs) {
        globalOnUpdate = globalTriggerArgs[0].onUpdate;
      }
    });

    it('should trigger snap to next section when scroll progress > 85% and velocity is zero', fakeAsync(() => {
      const currentSectionTrigger = { progress: 0.86, direction: 1, start: 1000, end: 2000, vars: { id: 'filosofia' } };
      (service as any).activeSectionTrigger = currentSectionTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0); // Simula a parada do scroll

      globalOnUpdate({ progress: 0.3 }); // Simula um evento de scroll
      tick(100); // Avança o tempo para permitir que a lógica de snap seja executada

      expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
        scrollTo: { y: mockSections.servicos.offsetTop, autoKill: false },
        ease: 'power2.inOut'
      }));
    }));

    it('should trigger snap to previous section when scroll progress < 15% and velocity is zero', fakeAsync(() => {
      const currentSectionTrigger = { progress: 0.14, direction: -1, start: 1000, end: 2000, vars: { id: 'filosofia' } };
      (service as any).activeSectionTrigger = currentSectionTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0);

      globalOnUpdate({ progress: 0.25 });
      tick(100);

      expect(mockGsap.to).toHaveBeenCalledWith(window, jasmine.objectContaining({
        scrollTo: { y: mockSections.hero.offsetTop, autoKill: false },
      }));
    }));

    it('should NOT snap if scroll progress is between 15% and 85%', fakeAsync(() => {
      const currentSectionTrigger = { progress: 0.5, direction: 1, start: 1000, end: 2000, vars: { id: 'filosofia' } };
      (service as any).activeSectionTrigger = currentSectionTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0);

      globalOnUpdate({ progress: 0.4 });
      tick(100);

      expect(mockGsap.to).not.toHaveBeenCalled();
    }));

    it('should NOT snap if velocity is not zero', fakeAsync(() => {
      const currentSectionTrigger = { progress: 0.9, direction: 1, start: 1000, end: 2000, vars: { id: 'filosofia' } };
      (service as any).activeSectionTrigger = currentSectionTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(500); // Usuário ainda está rolando

      globalOnUpdate({ progress: 0.45 });
      tick(100);

      expect(mockGsap.to).not.toHaveBeenCalled();
    }));

    it('should respect a delay before snapping on mobile to allow for kinetic scroll', fakeAsync(() => {
      (service as any).isMobile = true;
      service.initialize(); // Re-initialize for mobile context
      const globalTriggerArgs = mockScrollTrigger.create.calls.allArgs().find(args => args[0].id === 'global-progress');
      if (globalTriggerArgs) globalOnUpdate = globalTriggerArgs[0].onUpdate;

      const currentSectionTrigger = { progress: 0.88, direction: 1, start: 1000, end: 2000, vars: { id: 'filosofia' } };
      (service as any).activeSectionTrigger = currentSectionTrigger;
      mockScrollTrigger.getVelocity.and.returnValue(0);

      globalOnUpdate({ progress: 0.35 });
      tick(50); // Menos que o delay de 100ms
      expect(mockGsap.to).not.toHaveBeenCalled();

      tick(100); // Passa do delay
      expect(mockGsap.to).toHaveBeenCalled();
    }));
  });

  describe('Section-specific Scroll Effects', () => {
    it('should create a pinned ScrollTrigger for "Trabalhos" section', () => {
      service.initialize();
      const trabalhosTriggerArgs = mockScrollTrigger.create.calls.allArgs().find(args => args[0].id === 'trabalhos-pin');
      expect(trabalhosTriggerArgs).toBeDefined();
      // @ts-ignore
      expect(trabalhosTriggerArgs[0].pin).toBe('#trabalhos .pin-container');
      // @ts-ignore
      expect(trabalhosTriggerArgs[0].end).toBe('+=100%');
    });

    it('should create animation timelines for each section on initialization', () => {
      service.initialize();
      // Verifica se as timelines foram criadas para as seções que as possuem
      expect(mockGsap.timeline).toHaveBeenCalledWith(jasmine.objectContaining({ scrollTrigger: jasmine.objectContaining({ trigger: '#hero' }) }));
      expect(mockGsap.timeline).toHaveBeenCalledWith(jasmine.objectContaining({ scrollTrigger: jasmine.objectContaining({ trigger: '#filosofia' }) }));
      expect(mockGsap.timeline).toHaveBeenCalledWith(jasmine.objectContaining({ scrollTrigger: jasmine.objectContaining({ trigger: '#servicos' }) }));
    });
  });

  it('should clean up all ScrollTriggers on destroy', () => {
    service.initialize();
    service.destroy();
    expect(mockScrollTrigger.killAll).toHaveBeenCalled();
  });
});
