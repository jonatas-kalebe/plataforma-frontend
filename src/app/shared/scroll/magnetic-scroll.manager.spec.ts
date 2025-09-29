import { MagneticScrollManager } from './magnetic-scroll.manager';
import { ScrollSection } from './scroll-metrics.manager';

describe('MagneticScrollManager', () => {
  let manager: MagneticScrollManager;
  let mockSections: ScrollSection[];

  beforeEach(() => {
    manager = new MagneticScrollManager(false);
    
    // Setup mock sections
    mockSections = [
      { id: 'hero', element: document.createElement('div'), progress: 0, isActive: false },
      { id: 'filosofia', element: document.createElement('div'), progress: 0, isActive: false },
      { id: 'servicos', element: document.createElement('div'), progress: 0, isActive: false },
      { id: 'trabalhos', element: document.createElement('div'), progress: 0, isActive: false },
      { id: 'cta', element: document.createElement('div'), progress: 0, isActive: false }
    ];

    // Mock window.scrollTo
    spyOn(window, 'scrollTo').and.stub();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('checkMagneticSnap', () => {
    it('should snap forward when progress exceeds forward threshold', () => {
      mockSections[1].progress = 0.9; // filosofia at 90%
      const triggerSnapSpy = spyOn(manager as any, 'triggerSnap').and.stub();
      
      const result = manager.checkMagneticSnap(mockSections, 0.5);
      
      expect(result).toBe(true);
      expect(triggerSnapSpy).toHaveBeenCalledWith(mockSections[2], 'forward');
    });

    it('should snap backward when progress is below backward threshold', () => {
      mockSections[2].progress = 0.1; // servicos at 10%
      const triggerSnapSpy = spyOn(manager as any, 'triggerSnap').and.stub();
      
      const result = manager.checkMagneticSnap(mockSections, 0.5);
      
      expect(result).toBe(true);
      expect(triggerSnapSpy).toHaveBeenCalledWith(mockSections[1], 'backward');
    });

    it('should snap at edge boundaries regardless of direction when velocity is very low', () => {
      mockSections[1].progress = 0.85; // filosofia at 85% (edge case)
      manager.detectScrollIntention(0.05); // very low velocity
      const triggerSnapSpy = spyOn(manager as any, 'triggerSnap').and.stub();
      
      const result = manager.checkMagneticSnap(mockSections, 0.5);
      
      expect(result).toBe(true);
      expect(triggerSnapSpy).toHaveBeenCalledWith(mockSections[2], 'forward');
    });

    it('should snap with wider thresholds when speed is low', () => {
      mockSections[1].progress = 0.75; // filosofia at 75% (between 0.7 and 0.85)
      manager.detectScrollIntention(0.2); // low speed
      const triggerSnapSpy = spyOn(manager as any, 'triggerSnap').and.stub();
      
      const result = manager.checkMagneticSnap(mockSections, 0.5);
      
      expect(result).toBe(true);
      expect(triggerSnapSpy).toHaveBeenCalledWith(mockSections[2], 'forward');
    });

    it('should not snap when animating', () => {
      mockSections[1].progress = 0.9;
      (manager as any).isAnimating = true;
      
      const result = manager.checkMagneticSnap(mockSections, 0.5);
      
      expect(result).toBe(false);
    });

    it('should not snap when snap timeout is active', () => {
      mockSections[1].progress = 0.9;
      (manager as any).snapTimeoutId = 123;
      
      const result = manager.checkMagneticSnap(mockSections, 0.5);
      
      expect(result).toBe(false);
    });

    it('should handle edge cases near 95% and 5% boundaries', () => {
      // Test 95% boundary
      mockSections[1].progress = 0.96;
      const triggerSnapSpy = spyOn(manager as any, 'triggerSnap').and.stub();
      
      let result = manager.checkMagneticSnap(mockSections, 0.5);
      expect(result).toBe(true);
      expect(triggerSnapSpy).toHaveBeenCalledWith(mockSections[2], 'forward');
      
      // Reset and test 5% boundary
      triggerSnapSpy.calls.reset();
      mockSections[1].progress = 0.04;
      
      result = manager.checkMagneticSnap(mockSections, 0.5);
      expect(result).toBe(true);
      expect(triggerSnapSpy).toHaveBeenCalledWith(mockSections[0], 'backward');
    });
  });

  describe('direction handling', () => {
    it('should allow snap when direction is null (stopped)', () => {
      mockSections[1].progress = 0.88;
      manager.detectScrollIntention(0); // stopped, direction should be null
      const triggerSnapSpy = spyOn(manager as any, 'triggerSnap').and.stub();
      
      const result = manager.checkMagneticSnap(mockSections, 0.5);
      
      expect(result).toBe(true);
      expect(triggerSnapSpy).toHaveBeenCalledWith(mockSections[2], 'forward');
    });
  });
});