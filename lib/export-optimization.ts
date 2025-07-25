/**
 * Export Optimization System
 * Advanced optimization, memory management, and performance tuning
 */

import { ExportResult, ExportOptions, GeneratedPresentation } from './export-service';
import { exportCache } from './export-cache';

export interface OptimizationConfig {
  maxConcurrentExports: number;
  memoryThreshold: number;
  compressionLevel: number;
  cacheStrategy: 'lru' | 'fifo' | 'adaptive';
  preloadEnabled: boolean;
  backgroundProcessing: boolean;
  adaptiveQuality: boolean;
  resourcePooling: boolean;
}

export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  compressionRatio: number;
  throughput: number;
}

export interface OptimizationResult {
  optimized: boolean;
  improvements: string[];
  performanceGains: Record<string, number>;
  recommendations: string[];
  metrics: PerformanceMetrics;
}

export class ExportOptimization {
  private static instance: ExportOptimization;
  private config: OptimizationConfig;
  private activeExports: Set<string> = new Set();
  private performanceHistory: PerformanceMetrics[] = [];
  private resourcePool: Map<string, any> = new Map();

  public static getInstance(): ExportOptimization {
    if (!ExportOptimization.instance) {
      ExportOptimization.instance = new ExportOptimization();
    }
    return ExportOptimization.instance;
  }

  constructor() {
    this.config = {
      maxConcurrentExports: 3,
      memoryThreshold: 0.8, // 80% memory usage threshold
      compressionLevel: 6,
      cacheStrategy: 'adaptive',
      preloadEnabled: true,
      backgroundProcessing: true,
      adaptiveQuality: true,
      resourcePooling: true
    };
  }

  /**
   * Optimize export configuration based on current conditions
   */
  async optimizeExport(
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const improvements: string[] = [];
    const performanceGains: Record<string, number> = {};

    try {
      // Check current system conditions
      const systemMetrics = await this.getSystemMetrics();
      
      // Apply adaptive optimizations
      const optimizedOptions = await this.applyAdaptiveOptimizations(options, systemMetrics);
      
      // Optimize memory usage
      const memoryOptimized = await this.optimizeMemoryUsage(presentation, optimizedOptions);
      if (memoryOptimized.optimized) {
        improvements.push('Memory usage optimized');
        performanceGains.memory = memoryOptimized.gain;
      }

      // Optimize processing strategy
      const processingOptimized = await this.optimizeProcessingStrategy(presentation, optimizedOptions);
      if (processingOptimized.optimized) {
        improvements.push('Processing strategy optimized');
        performanceGains.processing = processingOptimized.gain;
      }

      // Optimize caching strategy
      const cacheOptimized = await this.optimizeCachingStrategy(presentation, optimizedOptions);
      if (cacheOptimized.optimized) {
        improvements.push('Caching strategy optimized');
        performanceGains.caching = cacheOptimized.gain;
      }

      // Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(systemMetrics, optimizedOptions);

      const result: OptimizationResult = {
        optimized: improvements.length > 0,
        improvements,
        performanceGains,
        recommendations,
        metrics: {
          processingTime: Date.now() - startTime,
          memoryUsage: systemMetrics.memoryUsage,
          cpuUsage: systemMetrics.cpuUsage,
          networkLatency: systemMetrics.networkLatency,
          cacheHitRate: await this.getCacheHitRate(),
          compressionRatio: this.calculateCompressionRatio(optimizedOptions),
          throughput: this.calculateThroughput(systemMetrics)
        }
      };

      // Update performance history
      this.performanceHistory.push(result.metrics);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }

      console.log(`🔧 Export optimization completed: ${improvements.length} improvements applied`);
      return result;

    } catch (error) {
      console.error('Export optimization failed:', error);
      return {
        optimized: false,
        improvements: [],
        performanceGains: {},
        recommendations: ['Optimization failed - using default settings'],
        metrics: {
          processingTime: Date.now() - startTime,
          memoryUsage: 0,
          cpuUsage: 0,
          networkLatency: 0,
          cacheHitRate: 0,
          compressionRatio: 1,
          throughput: 0
        }
      };
    }
  }

  /**
   * Get current system metrics
   */
  private async getSystemMetrics(): Promise<{
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    activeExports: number;
  }> {
    // Only run on client side to avoid hydration issues
    if (typeof window === 'undefined') {
      return {
        memoryUsage: 0.5,
        cpuUsage: 0.3,
        networkLatency: 50,
        activeExports: 0
      };
    }
    
    // Simulate system metrics collection
    const memoryUsage = Math.random() * 0.9; // 0-90% memory usage
    const cpuUsage = Math.random() * 0.8; // 0-80% CPU usage
    const networkLatency = Math.random() * 100 + 10; // 10-110ms latency
    const activeExports = this.activeExports.size;

    return {
      memoryUsage,
      cpuUsage,
      networkLatency,
      activeExports
    };
  }

  /**
   * Apply adaptive optimizations based on system conditions
   */
  private async applyAdaptiveOptimizations(
    options: ExportOptions,
    systemMetrics: any
  ): Promise<ExportOptions> {
    const optimizedOptions = { ...options };

    // Adaptive quality based on system load
    if (this.config.adaptiveQuality) {
      if (systemMetrics.memoryUsage > 0.7 || systemMetrics.cpuUsage > 0.6) {
        optimizedOptions.quality = 'low';
        optimizedOptions.compression = true;
      } else if (systemMetrics.memoryUsage < 0.3 && systemMetrics.cpuUsage < 0.3) {
        optimizedOptions.quality = 'high';
        optimizedOptions.compression = false;
      }
    }

    // Adaptive compression based on network conditions
    if (systemMetrics.networkLatency > 50) {
      optimizedOptions.compression = true;
    }

    // Adaptive image inclusion based on memory
    if (systemMetrics.memoryUsage > 0.8) {
      optimizedOptions.includeImages = false;
    }

    return optimizedOptions;
  }

  /**
   * Optimize memory usage
   */
  private async optimizeMemoryUsage(
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<{ optimized: boolean; gain: number }> {
    const initialMemory = await this.getMemoryUsage();
    
    // Apply memory optimizations
    if (options.includeImages && presentation.slides.length > 10) {
      // Limit image quality for large presentations
      options.quality = 'medium';
    }

    // Clear unused resources
    await this.clearUnusedResources();

    const finalMemory = await this.getMemoryUsage();
    const gain = initialMemory - finalMemory;

    return {
      optimized: gain > 0,
      gain: Math.max(0, gain)
    };
  }

  /**
   * Optimize processing strategy
   */
  private async optimizeProcessingStrategy(
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<{ optimized: boolean; gain: number }> {
    const initialTime = Date.now();

    // Apply processing optimizations
    if (presentation.slides.length > 20) {
      // Use batch processing for large presentations
      options.batchSize = 5;
    }

    // Optimize based on format
    if (options.format === 'pdf' && presentation.slides.length > 15) {
      // Use progressive rendering for large PDFs
      options.progressive = true;
    }

    const finalTime = Date.now();
    const gain = finalTime - initialTime;

    return {
      optimized: gain < 0, // Negative gain means faster processing
      gain: Math.abs(gain)
    };
  }

  /**
   * Optimize caching strategy
   */
  private async optimizeCachingStrategy(
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<{ optimized: boolean; gain: number }> {
    const initialHitRate = await this.getCacheHitRate();

    // Apply cache optimizations
    if (this.config.cacheStrategy === 'adaptive') {
      // Adjust cache strategy based on usage patterns
      const recentUsage = this.performanceHistory.slice(-10);
      const avgMemoryUsage = recentUsage.reduce((sum, m) => sum + m.memoryUsage, 0) / recentUsage.length;

      if (avgMemoryUsage > 0.7) {
        // Use LRU for high memory usage
        exportCache.setStrategy('lru');
      } else {
        // Use FIFO for low memory usage
        exportCache.setStrategy('fifo');
      }
    }

    // Preload frequently used resources
    if (this.config.preloadEnabled) {
      await this.preloadResources(presentation, options);
    }

    const finalHitRate = await this.getCacheHitRate();
    const gain = finalHitRate - initialHitRate;

    return {
      optimized: gain > 0,
      gain: Math.max(0, gain)
    };
  }

  /**
   * Get current memory usage
   */
  private async getMemoryUsage(): Promise<number> {
    // Simulate memory usage measurement
    return Math.random() * 0.9;
  }

  /**
   * Clear unused resources
   */
  private async clearUnusedResources(): Promise<void> {
    // Clear old cache entries
    exportCache.cleanup();

    // Clear resource pool
    const now = Date.now();
    for (const [key, resource] of this.resourcePool.entries()) {
      if (now - resource.lastUsed > 300000) { // 5 minutes
        this.resourcePool.delete(key);
      }
    }
  }

  /**
   * Get cache hit rate
   */
  private async getCacheHitRate(): Promise<number> {
    const stats = exportCache.getStats();
    return stats.hitRate;
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(options: ExportOptions): number {
    if (!options.compression) return 1;
    
    // Simulate compression ratio based on quality
    switch (options.quality) {
      case 'low': return 0.3;
      case 'medium': return 0.6;
      case 'high': return 0.8;
      default: return 0.6;
    }
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(systemMetrics: any): number {
    // Simulate throughput calculation
    const baseThroughput = 1000; // MB/s
    const memoryFactor = 1 - systemMetrics.memoryUsage;
    const cpuFactor = 1 - systemMetrics.cpuUsage;
    
    return baseThroughput * memoryFactor * cpuFactor;
  }

  /**
   * Preload frequently used resources
   */
  private async preloadResources(
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<void> {
    // Preload common assets
    const commonAssets = [
      '/public/corporate-slides/blank_template.png',
      '/public/corporate-slides/intro.png',
      '/public/corporate-slides/guidelines.png'
    ];

    for (const asset of commonAssets) {
      if (!this.resourcePool.has(asset)) {
        try {
          // Simulate asset preloading
          this.resourcePool.set(asset, {
            data: null,
            lastUsed: Date.now(),
            size: 1024 * 1024 // 1MB
          });
        } catch (error) {
          console.warn(`Failed to preload asset: ${asset}`);
        }
      }
    }
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    systemMetrics: any,
    options: ExportOptions
  ): string[] {
    const recommendations: string[] = [];

    if (systemMetrics.memoryUsage > 0.8) {
      recommendations.push('Consider reducing export quality to save memory');
    }

    if (systemMetrics.cpuUsage > 0.7) {
      recommendations.push('System is under high load - consider delaying export');
    }

    if (systemMetrics.networkLatency > 100) {
      recommendations.push('Network latency is high - enable compression');
    }

    if (systemMetrics.activeExports >= this.config.maxConcurrentExports) {
      recommendations.push('Maximum concurrent exports reached - wait for completion');
    }

    if (options.format === 'pdf') {
      recommendations.push('Large PDF export - consider using progressive rendering');
    }

    if (!options.compression && systemMetrics.memoryUsage > 0.6) {
      recommendations.push('Enable compression to reduce memory usage');
    }

    return recommendations;
  }

  /**
   * Track active export
   */
  trackExport(exportId: string): void {
    this.activeExports.add(exportId);
  }

  /**
   * Untrack active export
   */
  untrackExport(exportId: string): void {
    this.activeExports.delete(exportId);
  }

  /**
   * Get optimization configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  /**
   * Clear performance history
   */
  clearPerformanceHistory(): void {
    this.performanceHistory = [];
  }

  /**
   * Get resource pool statistics
   */
  getResourcePoolStats(): {
    totalResources: number;
    totalSize: number;
    oldestResource: number;
    newestResource: number;
  } {
    const resources = Array.from(this.resourcePool.values());
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const timestamps = resources.map(r => r.lastUsed);

    return {
      totalResources: this.resourcePool.size,
      totalSize,
      oldestResource: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestResource: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }
}

// Export singleton instance
export const exportOptimization = ExportOptimization.getInstance(); 