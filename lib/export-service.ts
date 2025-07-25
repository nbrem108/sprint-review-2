import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { exportQualityAssurance } from './export-quality-assurance';
import { exportErrorHandler } from './export-error-handler';
import { exportCache } from './export-cache';

// Enhanced types for export functionality
export interface ExportOptions {
  format: 'pdf' | 'html' | 'markdown' | 'metrics' | 'executive' | 'digest' | 'advanced-digest';
  quality?: 'low' | 'medium' | 'high';
  includeImages?: boolean;
  executiveFormat?: boolean;
  fileName?: string;
  compression?: boolean;
  interactive?: boolean;
  batchSize?: number;
  progressive?: boolean;
}

export interface ExportProgress {
  current: number;
  total: number;
  stage: 'preparing' | 'rendering' | 'processing' | 'finalizing';
  message: string;
  percentage: number;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  fileSize: number;
  format: string;
  metadata: {
    slideCount: number;
    processingTime: number;
    quality: string;
  };
}

export interface PresentationSlide {
  id: string;
  title: string;
  content: string | {
    type: string;
    data: any;
  };
  type: "title" | "summary" | "metrics" | "demo-story" | "custom" | "corporate";
  order: number;
  corporateSlideUrl?: string;
  storyId?: string;
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  status: string;
  assignee?: string;
  storyPoints?: number;
  issueType: string;
  isSubtask: boolean;
  epicKey?: string;
  epicName?: string;
  epicColor?: string;
  releaseNotes?: string;
}

export interface SprintMetrics {
  plannedItems: number;
  estimatedPoints: number;
  carryForwardPoints: number;
  committedBufferPoints: number;
  completedBufferPoints: number;
  testCoverage: number;
  sprintNumber: string;
  completedTotalPoints: number;
  completedAdjustedPoints: number;
  qualityChecklist: Record<string, "yes" | "no" | "partial" | "na">;
}

export interface GeneratedPresentation {
  id: string;
  title: string;
  slides: PresentationSlide[];
  createdAt: string;
  metadata: {
    sprintName: string;
    totalSlides: number;
    hasMetrics: boolean;
    demoStoriesCount: number;
    customSlidesCount: number;
  };
}

// Format-specific renderer interfaces
export interface ExportRenderer {
  render(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult>;
}

export interface AssetEmbedder {
  embedImage(url: string): Promise<string>;
  embedCSS(css: string): string;
  embedFont(fontFamily: string, fontUrl: string): Promise<string>;
  getEmbeddedAssets(): Map<string, string>;
}

// Export configuration
export interface ExportConfig {
  quality: 'low' | 'medium' | 'high';
  compression: boolean;
  interactive: boolean;
  includeImages: boolean;
  maxFileSize: number; // in MB
  timeout: number; // in seconds
}

export class ExportService {
  private static instance: ExportService;
  private renderers: Map<string, ExportRenderer> = new Map();
  private assetEmbedder: AssetEmbedder;
  private config: ExportConfig;
  private cache: Map<string, ExportResult> = new Map();

  private constructor() {
    this.config = {
      quality: 'medium',
      compression: true,
      interactive: true,
      includeImages: true,
      maxFileSize: 10,
      timeout: 30000
    };
    // Initialize asset embedder
    this.assetEmbedder = {} as AssetEmbedder;
    
    // Register default renderers
    this.registerDefaultRenderers();
  }

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Register a format-specific renderer
   */
  public registerRenderer(format: string, renderer: ExportRenderer): void {
    this.renderers.set(format, renderer);
  }

  /**
   * Register default renderers
   */
  private registerDefaultRenderers(): void {
    // Import and register renderers (client-side only)
    if (typeof window !== 'undefined') {
      import('../components/export/html-export-renderer').then(({ HTMLExportRenderer }) => {
        this.registerRenderer('html', new HTMLExportRenderer());
      });
    }
    
    import('./markdown-export-renderer').then(({ MarkdownExportRenderer }) => {
      this.registerRenderer('markdown', new MarkdownExportRenderer());
    });
    
    import('./pdf-export-renderer').then(({ PDFExportRenderer }) => {
      this.registerRenderer('pdf', new PDFExportRenderer());
    });
    
    import('./executive-export-renderer').then(({ ExecutiveExportRenderer }) => {
      this.registerRenderer('executive', new ExecutiveExportRenderer());
    });
    
    // Register digest renderer (server-side only)
    if (typeof window === 'undefined') {
      import('./digest-export-renderer').then(({ DigestExportRenderer }) => {
        this.registerRenderer('digest', new DigestExportRenderer());
      });
      
      // Register advanced digest renderer (server-side only)
      import('./advanced-digest-renderer').then(({ AdvancedDigestExportRenderer }) => {
        this.registerRenderer('advanced-digest', new AdvancedDigestExportRenderer());
      });
    }
    
    console.log('📝 Registered default renderers: html, markdown, pdf, executive, digest, advanced-digest');
  }

  /**
   * Set export configuration
   */
  public setConfig(config: Partial<ExportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ExportConfig {
    return { ...this.config };
  }

  /**
   * Main export method with progress tracking
   */
  async export(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const startTime = Date.now();
    let attempt = 1;
    
    try {
      // Validate inputs
      this.validateExportInputs(presentation, options);

      // Validate export options with error handler
      const validation = exportErrorHandler.validateExportOptions(presentation, options);
      if (!validation.valid) {
        throw new Error(`Export validation failed: ${validation.errors.join(', ')}`);
      }

      // Check cache first
      const cacheKey = exportCache.generateCacheKey(presentation, options);
      const cachedResult = exportCache.get(cacheKey);
      if (cachedResult) {
        console.log('🚀 Cache hit for export');
        return cachedResult;
      }

      // Update progress
      this.updateProgress(onProgress, {
        current: 0,
        total: 100,
        stage: 'preparing',
        message: 'Preparing export...',
        percentage: 0
      });

      // Get the appropriate renderer
      const renderer = this.renderers.get(options.format);
      if (!renderer) {
        throw new Error(`No renderer found for format: ${options.format}`);
      }

      // Merge options with config
      const mergedOptions: ExportOptions = {
        ...this.config,
        ...options
      };

      // Execute export with retry logic
      let result: ExportResult;
      while (attempt <= 3) {
        try {
          result = await renderer.render(
            presentation,
            allIssues,
            upcomingIssues,
            sprintMetrics,
            mergedOptions,
            onProgress
          );
          break; // Success, exit retry loop
        } catch (error) {
          const exportError = await exportErrorHandler.handleExportError(
            error instanceof Error ? error : new Error(String(error)),
            {
              presentation,
              options: mergedOptions,
              attempt,
              format: options.format
            }
          );
          
          if (attempt >= 3 || !exportError.recoverable) {
            throw error; // Re-throw if max retries reached or not recoverable
          }
          
          attempt++;
          console.log(`🔄 Retrying export (attempt ${attempt}/3)...`);
        }
      }

      // Add metadata
      result!.metadata.processingTime = Date.now() - startTime;
      result!.metadata.slideCount = presentation.slides.length;
      result!.metadata.quality = options.quality || 'medium';

      // Cache the result
      exportCache.set(cacheKey, result!, presentation, mergedOptions);

      // Perform quality assurance
      const qualityReport = await exportQualityAssurance.validateExport(
        result!,
        presentation,
        mergedOptions
      );

      if (!qualityReport.passed) {
        console.warn('⚠️ Export quality check failed:', qualityReport.recommendations);
      }

      // Update progress
      this.updateProgress(onProgress, {
        current: 100,
        total: 100,
        stage: 'finalizing',
        message: 'Export completed successfully',
        percentage: 100
      });

      return result!;

    } catch (error) {
      console.error('❌ Export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export to PDF format
   */
  async exportToPDF(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions = { format: 'pdf' },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    return this.export(presentation, allIssues, upcomingIssues, sprintMetrics, options, onProgress);
  }

  /**
   * Export to HTML format
   */
  async exportToHTML(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions = { format: 'html' },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    return this.export(presentation, allIssues, upcomingIssues, sprintMetrics, options, onProgress);
  }

  /**
   * Export to Markdown format
   */
  async exportToMarkdown(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions = { format: 'markdown' },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    return this.export(presentation, allIssues, upcomingIssues, sprintMetrics, options, onProgress);
  }

  /**
   * Export executive metrics
   */
  async exportExecutiveMetrics(
    sprintMetrics: SprintMetrics,
    allIssues: Issue[],
    options: ExportOptions = { format: 'executive' },
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    // Create a minimal presentation for executive metrics
    const presentation: GeneratedPresentation = {
      id: 'executive-metrics',
      title: 'Executive Metrics Dashboard',
      slides: [],
      createdAt: new Date().toISOString(),
      metadata: {
        sprintName: 'Executive Summary',
        totalSlides: 1,
        hasMetrics: true,
        demoStoriesCount: 0,
        customSlidesCount: 0
      }
    };

    return this.export(presentation, allIssues, [], sprintMetrics, options, onProgress);
  }

  /**
   * Download file to user's device
   */
  downloadFile(result: ExportResult): void {
    try {
      saveAs(result.blob, result.fileName);
      console.log(`✅ File downloaded: ${result.fileName} (${this.formatFileSize(result.fileSize)})`);
    } catch (error) {
      console.error('❌ Download failed:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Generate file name for export
   */
  generateFileName(presentation: GeneratedPresentation, format: string, executiveFormat?: boolean): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sprintName = presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_');
    const formatExt = this.getFormatExtension(format);
    
    if (executiveFormat) {
      return `Executive_Metrics_${sprintName}_${timestamp}.${formatExt}`;
    }
    
    return `Sprint_Review_${sprintName}_${timestamp}.${formatExt}`;
  }

  /**
   * Clear export cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Export cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  // Private helper methods

  private validateExportInputs(presentation: GeneratedPresentation, options: ExportOptions): void {
    if (!presentation || !presentation.slides || presentation.slides.length === 0) {
      throw new Error('Invalid presentation: no slides found');
    }

    if (!options.format) {
      throw new Error('Export format is required');
    }

    if (presentation.slides.length > 50) {
      console.warn('⚠️ Large presentation detected: export may take longer than usual');
    }
  }

  private generateCacheKey(presentation: GeneratedPresentation, options: ExportOptions): string {
    const key = `${presentation.id}_${options.format}_${options.quality}_${options.interactive}_${presentation.slides.length}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  private updateProgress(
    onProgress: ((progress: ExportProgress) => void) | undefined,
    progress: ExportProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  private getFormatExtension(format: string): string {
    const extensions: Record<string, string> = {
      'pdf': 'pdf',
      'html': 'html',
      'markdown': 'md',
      'metrics': 'html',
      'executive': 'html'
    };
    return extensions[format] || 'html';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance(); 

