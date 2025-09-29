import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, switchMap, catchError } from 'rxjs/operators';

export interface PreloadStrategy {
  priority: 'high' | 'medium' | 'low';
  defer?: boolean; // If true, only preload after owl animation starts
}

export interface PreloadStatus {
  [componentName: string]: {
    loaded: boolean;
    error?: string;
    loadTime?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PreloadService {
  private readonly platformId = inject(PLATFORM_ID);
  private preloadStatus = new BehaviorSubject<PreloadStatus>({});
  private isPreloading = false;
  private startTime = 0;

  // Components and their preload strategies
  private readonly componentsConfig = {
    'hero-section': { priority: 'high' as const },
    'filosofia-section': { priority: 'high' as const },
    'servicos-section': { priority: 'medium' as const },
    'trabalhos-section': { priority: 'medium' as const },
    'cta-section': { priority: 'low' as const },
  };

  get status$(): Observable<PreloadStatus> {
    return this.preloadStatus.asObservable();
  }

  get isPreloadingActive(): boolean {
    return this.isPreloading;
  }

  /**
   * Starts preloading components based on user source
   * @param isFromSearch - Whether the user came from search/external source
   * @param onProgress - Optional callback for progress updates
   */
  async startPreloading(isFromSearch: boolean = false, onProgress?: (progress: number) => void): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.isPreloading) {
      return;
    }

    this.isPreloading = true;
    this.startTime = Date.now();

    console.log(`🔄 Starting component preloading (source: ${isFromSearch ? 'search' : 'direct'})`);

    try {
      if (isFromSearch) {
        // For search users, preload only critical components first
        await this.preloadCriticalComponents(onProgress);
      } else {
        // For direct navigation, preload everything during owl animation
        await this.preloadAllComponents(onProgress);
      }
    } catch (error) {
      console.error('❌ Error during preloading:', error);
    } finally {
      this.isPreloading = false;
      const loadTime = Date.now() - this.startTime;
      console.log(`✅ Preloading completed in ${loadTime}ms`);
    }
  }

  /**
   * Preloads only critical components (hero, filosofia)
   */
  private async preloadCriticalComponents(onProgress?: (progress: number) => void): Promise<void> {
    const criticalComponents = ['hero-section', 'filosofia-section'];
    await this.preloadComponentsBatch(criticalComponents, onProgress);
  }

  /**
   * Preloads all landing components with priority-based ordering
   */
  private async preloadAllComponents(onProgress?: (progress: number) => void): Promise<void> {
    // Sort components by priority
    const sortedComponents = Object.entries(this.componentsConfig)
      .sort(([, a], [, b]) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .map(([name]) => name);

    await this.preloadComponentsBatch(sortedComponents, onProgress);
  }

  /**
   * Preloads a batch of components
   */
  private async preloadComponentsBatch(componentNames: string[], onProgress?: (progress: number) => void): Promise<void> {
    const total = componentNames.length;
    let completed = 0;

    for (const componentName of componentNames) {
      try {
        const startTime = Date.now();
        await this.preloadComponent(componentName);
        const loadTime = Date.now() - startTime;

        // Update status
        this.updateComponentStatus(componentName, { loaded: true, loadTime });
        completed++;

        if (onProgress) {
          onProgress((completed / total) * 100);
        }

        console.log(`✅ ${componentName} preloaded in ${loadTime}ms`);

        // Small delay between components to avoid blocking UI
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`❌ Failed to preload ${componentName}:`, error);
        this.updateComponentStatus(componentName, { 
          loaded: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        completed++;

        if (onProgress) {
          onProgress((completed / total) * 100);
        }
      }
    }
  }

  /**
   * Preloads a specific component by triggering its module loading
   */
  private async preloadComponent(componentName: string): Promise<void> {
    // Simulate component loading - in a real implementation, this would
    // trigger the actual component module loading
    switch (componentName) {
      case 'hero-section':
        await import('../components/sections/hero-section/hero-section.component');
        break;
      case 'filosofia-section':
        await import('../components/sections/filosofia-section/filosofia-section.component');
        break;
      case 'servicos-section':
        await import('../components/sections/servicos-section/servicos-section.component');
        break;
      case 'trabalhos-section':
        await import('../components/sections/trabalhos-section/trabalhos-section.component');
        break;
      case 'cta-section':
        await import('../components/sections/cta-section/cta-section.component');
        break;
      default:
        throw new Error(`Unknown component: ${componentName}`);
    }
  }

  /**
   * Updates the status of a component
   */
  private updateComponentStatus(componentName: string, status: Partial<PreloadStatus[string]>): void {
    const currentStatus = this.preloadStatus.value;
    this.preloadStatus.next({
      ...currentStatus,
      [componentName]: {
        ...currentStatus[componentName],
        ...status
      }
    });
  }

  /**
   * Detects if the user came from search based on referrer
   */
  isFromSearchSource(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const referrer = document.referrer.toLowerCase();
    const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu'];
    
    return searchEngines.some(engine => referrer.includes(engine)) ||
           referrer.includes('search') ||
           new URLSearchParams(window.location.search).has('gclid') || // Google Ads
           new URLSearchParams(window.location.search).has('fbclid');   // Facebook
  }

  /**
   * Gets the current preload status for a specific component
   */
  getComponentStatus(componentName: string): PreloadStatus[string] | undefined {
    return this.preloadStatus.value[componentName];
  }

  /**
   * Checks if all components are loaded
   */
  areAllComponentsLoaded(): boolean {
    const status = this.preloadStatus.value;
    const componentNames = Object.keys(this.componentsConfig);
    return componentNames.every(name => status[name]?.loaded);
  }

  /**
   * Gets preload progress as percentage
   */
  getPreloadProgress(): number {
    const status = this.preloadStatus.value;
    const componentNames = Object.keys(this.componentsConfig);
    const loadedCount = componentNames.filter(name => status[name]?.loaded).length;
    return (loadedCount / componentNames.length) * 100;
  }

  /**
   * Resets preload status
   */
  reset(): void {
    this.preloadStatus.next({});
    this.isPreloading = false;
  }
}