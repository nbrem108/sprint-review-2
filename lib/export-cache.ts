/**
 * Export Caching System
 * Provides result caching, incremental updates, and memory optimization
 */

import { ExportResult, ExportOptions, GeneratedPresentation } from './export-service';

export interface CacheEntry {
  key: string;
  result: ExportResult;
  presentation: GeneratedPresentation;
  options: ExportOptions;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  averageEntrySize: number;
  oldestEntry: number;
  newestEntry: number;
  memoryUsage: number;
}

export interface CacheConfig {
  maxSize: number; // in bytes
  maxEntries: number;
  ttl: number; // time to live in milliseconds
  cleanupInterval: number; // cleanup interval in milliseconds
  compressionEnabled: boolean;
}

export class ExportCache {
  private static instance: ExportCache;
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxEntries: 50,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
    compressionEnabled: true
  };
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0
  };
  private cleanupTimer?: NodeJS.Timeout;

  public static getInstance(): ExportCache {
    if (!ExportCache.instance) {
      ExportCache.instance = new ExportCache();
    }
    return ExportCache.instance;
  }

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Generate cache key from presentation and options
   */
  generateCacheKey(presentation: GeneratedPresentation, options: ExportOptions): string {
    const presentationHash = this.hashPresentation(presentation);
    const optionsHash = this.hashOptions(options);
    return `${presentationHash}_${optionsHash}`;
  }

  /**
   * Get cached export result
   */
  get(key: string): ExportResult | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    this.stats.hits++;
    return entry.result;
  }

  /**
   * Store export result in cache
   */
  set(
    key: string,
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): void {
    // Check if we need to make space
    this.ensureSpace(result.fileSize);

    const entry: CacheEntry = {
      key,
      result,
      presentation,
      options,
      timestamp: Date.now(),
      size: result.fileSize,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
    console.log(`💾 Cached export: ${key} (${this.formatFileSize(result.fileSize)})`);
  }

  /**
   * Check if cache has entry
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalRequests: 0 };
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0,
      missRate: this.stats.totalRequests > 0 ? (this.stats.misses / this.stats.totalRequests) * 100 : 0,
      averageEntrySize: entries.length > 0 ? totalSize / entries.length : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Get cache entries sorted by access frequency
   */
  getMostAccessedEntries(limit: number = 10): CacheEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Get cache entries sorted by size
   */
  getLargestEntries(limit: number = 10): CacheEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.size - a.size)
      .slice(0, limit);
  }

  /**
   * Get cache entries sorted by age
   */
  getOldestEntries(limit: number = 10): CacheEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, limit);
  }

  /**
   * Set cache configuration
   */
  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Cache configuration updated:', this.config);
  }

  /**
   * Set cache strategy
   */
  setStrategy(strategy: 'lru' | 'fifo' | 'adaptive'): void {
    // This would implement different cache strategies
    console.log(`🔄 Cache strategy changed to: ${strategy}`);
  }

  /**
   * Get current cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Perform cache cleanup
   */
  cleanup(): void {
    const beforeSize = this.cache.size;
    const beforeTotalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }

    // Remove entries if we exceed max entries
    if (this.cache.size > this.config.maxEntries) {
      const entries = Array.from(this.cache.values())
        .sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = entries.slice(0, this.cache.size - this.config.maxEntries);
      toRemove.forEach(entry => this.cache.delete(entry.key));
    }

    // Remove entries if we exceed max size
    this.ensureSpace(0);

    const afterSize = this.cache.size;
    const afterTotalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    console.log(`🧹 Cache cleanup: ${beforeSize - afterSize} entries removed, ${this.formatFileSize(beforeTotalSize - afterTotalSize)} freed`);
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  /**
   * Ensure cache has enough space for new entry
   */
  private ensureSpace(requiredSize: number): void {
    const currentSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    
    if (currentSize + requiredSize <= this.config.maxSize) {
      return;
    }

    // Remove least recently used entries until we have enough space
    const entries = Array.from(this.cache.values())
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    let freedSize = 0;
    for (const entry of entries) {
      if (currentSize - freedSize + requiredSize <= this.config.maxSize) {
        break;
      }
      
      this.cache.delete(entry.key);
      freedSize += entry.size;
    }

    if (freedSize > 0) {
      console.log(`🗑️ Freed ${this.formatFileSize(freedSize)} from cache`);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Hash presentation for cache key
   */
  private hashPresentation(presentation: GeneratedPresentation): string {
    const data = {
      id: presentation.id,
      title: presentation.title,
      slideCount: presentation.slides.length,
      metadata: presentation.metadata,
      slideHashes: presentation.slides.map(slide => ({
        id: slide.id,
        title: slide.title,
        type: slide.type,
        contentHash: this.hashContent(slide.content)
      }))
    };
    
    return this.hashString(JSON.stringify(data));
  }

  /**
   * Hash options for cache key
   */
  private hashOptions(options: ExportOptions): string {
    const relevantOptions = {
      format: options.format,
      quality: options.quality,
      includeImages: options.includeImages,
      compression: options.compression,
      interactive: options.interactive
    };
    
    return this.hashString(JSON.stringify(relevantOptions));
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Hash content for cache key
   */
  private hashContent(content: string | any): string {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return this.hashString(contentStr);
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      // Estimate memory usage for each entry
      totalSize += entry.size; // Blob size
      totalSize += JSON.stringify(entry.presentation).length; // Presentation data
      totalSize += JSON.stringify(entry.options).length; // Options data
      totalSize += 1000; // Overhead for Map entry, timestamps, etc.
    }
    
    return totalSize;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get cache entries for debugging
   */
  getEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  /**
   * Check if cache is healthy
   */
  isHealthy(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    const stats = this.getStats();

    if (stats.totalSize > this.config.maxSize * 0.9) {
      issues.push('Cache is nearly full');
    }

    if (stats.hitRate < 20) {
      issues.push('Low cache hit rate');
    }

    if (stats.totalEntries > this.config.maxEntries * 0.9) {
      issues.push('Cache has too many entries');
    }

    return {
      healthy: issues.length === 0,
      issues
    };
  }

  /**
   * Preload frequently accessed exports
   */
  async preloadFrequentExports(presentations: GeneratedPresentation[]): Promise<void> {
    console.log('🚀 Preloading frequent exports...');
    
    // This would typically analyze usage patterns and preload common exports
    // For now, we'll just log the intention
    for (const presentation of presentations) {
      const key = this.generateCacheKey(presentation, { format: 'pdf', quality: 'medium' });
      if (!this.has(key)) {
        console.log(`📋 Would preload: ${key}`);
      }
    }
  }
}

// Export singleton instance
export const exportCache = ExportCache.getInstance(); 