import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ScrollOrchestrationService } from '../src/app/services/scroll-orchestration.service';

describe('ScrollOrchestrationService Behavior', () => {
  let created: any[] = [];
  let mockGsap: any;
  let mockST: any;

  beforeEach(() => {
    created = [];
    mockGsap = {
      registerPlugin: jasmine.createSpy('registerPlugin'),
      to: jasmine.createSpy('to'),
      utils: { toArray: jasmine.createSpy('toArray').and.returnValue([]) },
      timeline: jasmine.createSpy('timeline'),
      from: jasmine.createSpy('from')
    };
    mockST = {
      create: jasmine.createSpy('create').and.callFake((vars: any) => {
        const inst = { vars, kill: jasmine.createSpy('kill'), refresh: jasmine.createSpy('refresh') };
        created.push(inst);
        return inst;
      }),
      getAll: jasmine.createSpy('getAll').and.callFake(() => created),
      killAll: jasmine.createSpy('killAll'),
      getVelocity: jasmine.createSpy('getVelocity').and.returnValue(0)
    };
    (window as any).gsap = mockGsap;
    (window as any).ScrollTrigger = mockST;
    spyOn(window, 'matchMedia').and.returnValue({ matches: false, addEventListener: () => {} } as any);
    const ids = ['hero', 'filosofia', 'servicos', 'trabalhos', 'cta'];
    ids.forEach(id => {
      const el = document.getElementById(id) || document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
    });
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
    });
  });

  afterEach(() => {
    created = [];
  });

  it('deve criar triggers para todas as seções e um global', () => {
    const s = TestBed.inject(ScrollOrchestrationService);
    s.initialize();
    expect(mockGsap.registerPlugin).toHaveBeenCalled();
    const sectionCalls = created.filter(c => c.vars && c.vars.trigger && c.vars.trigger.id).length;
    expect(sectionCalls).toBeGreaterThanOrEqual(5);
    const hasGlobal = created.some(c => c.vars && c.vars.trigger === document.body);
    expect(hasGlobal).toBeTrue();
  });

  it('deve configurar pin e scrub apenas quando motion não estiver reduzido', () => {
    const s = TestBed.inject(ScrollOrchestrationService);
    s.initialize();
    const trabalhos = created.find(c => c.vars.trigger?.id === 'trabalhos');
    expect(!!trabalhos.vars.pin).toBeTrue();
    expect(!!trabalhos.vars.scrub).toBeTrue();
  });

  it('deve desabilitar pin e scrub com prefers-reduced-motion', () => {
    (window.matchMedia as jasmine.Spy).and.returnValue({ matches: true, addEventListener: () => {} } as any);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'browser' }] });
    const s = TestBed.inject(ScrollOrchestrationService);
    s.initialize();
    const anyWithPin = created.some(c => !!c.vars.pin);
    const anyWithScrub = created.some(c => !!c.vars.scrub);
    expect(anyWithPin).toBeFalse();
    expect(anyWithScrub).toBeFalse();
  });

  it('scrollToSection deve chamar gsap.to', () => {
    const s = TestBed.inject(ScrollOrchestrationService);
    const el = document.createElement('div');
    el.id = 'hero';
    document.body.appendChild(el);
    s.scrollToSection('hero', 0.5);
    expect(mockGsap.to).toHaveBeenCalled();
  });

  it('destroy deve limpar triggers', () => {
    const s = TestBed.inject(ScrollOrchestrationService);
    s.initialize();
    s.destroy();
    expect(mockST.killAll).toHaveBeenCalled();
  });
});