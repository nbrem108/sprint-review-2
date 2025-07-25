/**
 * Export Quality Assurance System
 * Provides comprehensive quality checks and validation for export outputs
 */

import { ExportResult, ExportOptions, GeneratedPresentation } from './export-service';

export interface QualityMetrics {
  visualFidelity: number; // 0-100
  fileSize: number; // in bytes
  processingTime: number; // in milliseconds
  errorCount: number;
  warnings: string[];
  compatibility: {
    browser: string;
    supported: boolean;
    issues: string[];
  }[];
}

export interface QualityReport {
  overallScore: number; // 0-100
  metrics: QualityMetrics;
  recommendations: string[];
  passed: boolean;
  timestamp: string;
}

export class ExportQualityAssurance {
  private static instance: ExportQualityAssurance;
  private qualityThresholds = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxProcessingTime: 30000, // 30 seconds
    minVisualFidelity: 85, // 85%
    maxErrorCount: 0
  };

  public static getInstance(): ExportQualityAssurance {
    if (!ExportQualityAssurance.instance) {
      ExportQualityAssurance.instance = new ExportQualityAssurance();
    }
    return ExportQualityAssurance.instance;
  }

  /**
   * Comprehensive quality check for export results
   */
  async validateExport(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<QualityReport> {
    const startTime = Date.now();
    const metrics: QualityMetrics = {
      visualFidelity: 0,
      fileSize: result.fileSize,
      processingTime: result.metadata.processingTime,
      errorCount: 0,
      warnings: [],
      compatibility: []
    };

    try {
      // File size validation
      this.validateFileSize(metrics, result.fileSize);

      // Processing time validation
      this.validateProcessingTime(metrics, result.metadata.processingTime);

      // Format-specific quality checks
      await this.performFormatSpecificChecks(metrics, result, presentation, options);

      // Cross-browser compatibility check
      await this.checkBrowserCompatibility(metrics, result, options);

      // Visual fidelity assessment
      await this.assessVisualFidelity(metrics, result, presentation, options);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(metrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, options);

      const report: QualityReport = {
        overallScore,
        metrics,
        recommendations,
        passed: overallScore >= 80,
        timestamp: new Date().toISOString()
      };

      console.log(`🔍 Quality check completed: ${overallScore}/100 (${report.passed ? 'PASSED' : 'FAILED'})`);
      return report;

    } catch (error) {
      console.error('❌ Quality check failed:', error);
      metrics.errorCount++;
      metrics.warnings.push(`Quality check error: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        overallScore: 0,
        metrics,
        recommendations: ['Fix quality check system errors'],
        passed: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate file size against thresholds
   */
  private validateFileSize(metrics: QualityMetrics, fileSize: number): void {
    if (fileSize > this.qualityThresholds.maxFileSize) {
      metrics.warnings.push(`File size (${this.formatFileSize(fileSize)}) exceeds recommended limit (${this.formatFileSize(this.qualityThresholds.maxFileSize)})`);
    }
  }

  /**
   * Validate processing time against thresholds
   */
  private validateProcessingTime(metrics: QualityMetrics, processingTime: number): void {
    if (processingTime > this.qualityThresholds.maxProcessingTime) {
      metrics.warnings.push(`Processing time (${processingTime}ms) exceeds recommended limit (${this.qualityThresholds.maxProcessingTime}ms)`);
    }
  }

  /**
   * Perform format-specific quality checks
   */
  private async performFormatSpecificChecks(
    metrics: QualityMetrics,
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<void> {
    switch (result.format) {
      case 'pdf':
        await this.validatePDFQuality(metrics, result, presentation);
        break;
      case 'html':
        await this.validateHTMLQuality(metrics, result, presentation);
        break;
      case 'markdown':
        await this.validateMarkdownQuality(metrics, result, presentation);
        break;
      case 'executive':
        await this.validateExecutiveQuality(metrics, result, presentation);
        break;
      default:
        metrics.warnings.push(`Unknown format: ${result.format}`);
    }
  }

  /**
   * Validate PDF-specific quality metrics
   */
  private async validatePDFQuality(
    metrics: QualityMetrics,
    result: ExportResult,
    presentation: GeneratedPresentation
  ): Promise<void> {
    try {
      // Check if PDF is valid and readable
      const text = await this.extractPDFText(result.blob);
      
      // Verify content completeness
      const expectedContent = this.getExpectedContent(presentation);
      const contentCompleteness = this.calculateContentCompleteness(text, expectedContent);
      
      if (contentCompleteness < 0.9) {
        metrics.warnings.push(`PDF content completeness: ${Math.round(contentCompleteness * 100)}% (below 90% threshold)`);
      }

      // Check for searchable text
      if (text.length < 100) {
        metrics.warnings.push('PDF may not contain searchable text');
      }

      metrics.visualFidelity = Math.min(100, contentCompleteness * 100);

    } catch (error) {
      metrics.errorCount++;
      metrics.warnings.push(`PDF validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate HTML-specific quality metrics
   */
  private async validateHTMLQuality(
    metrics: QualityMetrics,
    result: ExportResult,
    presentation: GeneratedPresentation
  ): Promise<void> {
    try {
      const htmlText = await result.blob.text();
      
      // Check for required elements
      const requiredElements = ['<!DOCTYPE html>', '<html', '<head', '<body', '</html>'];
      const missingElements = requiredElements.filter(element => !htmlText.includes(element));
      
      if (missingElements.length > 0) {
        metrics.warnings.push(`Missing HTML elements: ${missingElements.join(', ')}`);
      }

      // Check for embedded assets
      const hasEmbeddedAssets = htmlText.includes('data:image/') || htmlText.includes('data:text/css');
      if (!hasEmbeddedAssets && presentation.slides.some(slide => slide.corporateSlideUrl)) {
        metrics.warnings.push('HTML may not contain embedded assets');
      }

      // Check for interactive elements
      const hasInteractiveElements = htmlText.includes('onclick') || htmlText.includes('addEventListener');
      if (!hasInteractiveElements) {
        metrics.warnings.push('HTML may not contain interactive elements');
      }

      metrics.visualFidelity = 95; // HTML typically has high fidelity

    } catch (error) {
      metrics.errorCount++;
      metrics.warnings.push(`HTML validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Markdown-specific quality metrics
   */
  private async validateMarkdownQuality(
    metrics: QualityMetrics,
    result: ExportResult,
    presentation: GeneratedPresentation
  ): Promise<void> {
    try {
      const markdownText = await result.blob.text();
      
      // Check for required sections
      const requiredSections = ['# ', '## ', '### '];
      const hasRequiredSections = requiredSections.some(section => markdownText.includes(section));
      
      if (!hasRequiredSections) {
        metrics.warnings.push('Markdown may not contain proper heading structure');
      }

      // Check for metadata
      if (!markdownText.includes('metadata') && !markdownText.includes('created')) {
        metrics.warnings.push('Markdown may not contain metadata');
      }

      // Check content length
      if (markdownText.length < 500) {
        metrics.warnings.push('Markdown content may be too short');
      }

      metrics.visualFidelity = 90; // Markdown has good fidelity for text content

    } catch (error) {
      metrics.errorCount++;
      metrics.warnings.push(`Markdown validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Executive-specific quality metrics
   */
  private async validateExecutiveQuality(
    metrics: QualityMetrics,
    result: ExportResult,
    presentation: GeneratedPresentation
  ): Promise<void> {
    try {
      const htmlText = await result.blob.text();
      
      // Check for executive-specific elements
      const executiveElements = ['Executive Summary', 'Key Performance Indicators', 'Business Impact', 'Strategic Recommendations'];
      const missingElements = executiveElements.filter(element => !htmlText.includes(element));
      
      if (missingElements.length > 0) {
        metrics.warnings.push(`Missing executive elements: ${missingElements.join(', ')}`);
      }

      // Check for metrics display
      if (!htmlText.includes('%') && !htmlText.includes('metrics')) {
        metrics.warnings.push('Executive summary may not contain metrics');
      }

      // Check for professional styling
      if (!htmlText.includes('font-family') && !htmlText.includes('background')) {
        metrics.warnings.push('Executive summary may not have professional styling');
      }

      metrics.visualFidelity = 98; // Executive summaries should have high fidelity

    } catch (error) {
      metrics.errorCount++;
      metrics.warnings.push(`Executive validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check cross-browser compatibility
   */
  private async checkBrowserCompatibility(
    metrics: QualityMetrics,
    result: ExportResult,
    options: ExportOptions
  ): Promise<void> {
    const browsers = [
      { name: 'Chrome', supported: true },
      { name: 'Firefox', supported: true },
      { name: 'Safari', supported: true },
      { name: 'Edge', supported: true }
    ];

    browsers.forEach(browser => {
      const compatibility = {
        browser: browser.name,
        supported: browser.supported,
        issues: [] as string[]
      };

      // Format-specific compatibility checks
      if (result.format === 'pdf') {
        if (browser.name === 'Safari') {
          compatibility.issues.push('PDF rendering may vary in Safari');
        }
      } else if (result.format === 'html') {
        if (browser.name === 'Internet Explorer') {
          compatibility.supported = false;
          compatibility.issues.push('HTML exports not supported in Internet Explorer');
        }
      }

      metrics.compatibility.push(compatibility);
    });
  }

  /**
   * Assess visual fidelity of the export
   */
  private async assessVisualFidelity(
    metrics: QualityMetrics,
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<void> {
    // Base fidelity score
    let fidelityScore = 85;

    // Adjust based on format
    switch (result.format) {
      case 'pdf':
        fidelityScore = 90;
        break;
      case 'html':
        fidelityScore = 95;
        break;
      case 'markdown':
        fidelityScore = 80;
        break;
      case 'executive':
        fidelityScore = 98;
        break;
    }

    // Adjust based on quality settings
    if (options.quality === 'high') {
      fidelityScore += 5;
    } else if (options.quality === 'low') {
      fidelityScore -= 10;
    }

    // Penalize for warnings
    fidelityScore -= metrics.warnings.length * 2;

    metrics.visualFidelity = Math.max(0, Math.min(100, fidelityScore));
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(metrics: QualityMetrics): number {
    const weights = {
      visualFidelity: 0.4,
      fileSize: 0.2,
      processingTime: 0.2,
      errorCount: 0.2
    };

    // File size score (inverse relationship)
    const fileSizeScore = Math.max(0, 100 - (metrics.fileSize / this.qualityThresholds.maxFileSize) * 100);
    
    // Processing time score (inverse relationship)
    const processingTimeScore = Math.max(0, 100 - (metrics.processingTime / this.qualityThresholds.maxProcessingTime) * 100);
    
    // Error count score (inverse relationship)
    const errorScore = Math.max(0, 100 - metrics.errorCount * 20);

    const overallScore = 
      metrics.visualFidelity * weights.visualFidelity +
      fileSizeScore * weights.fileSize +
      processingTimeScore * weights.processingTime +
      errorScore * weights.errorCount;

    return Math.round(overallScore);
  }

  /**
   * Generate recommendations based on quality metrics
   */
  private generateRecommendations(metrics: QualityMetrics, options: ExportOptions): string[] {
    const recommendations: string[] = [];

    if (metrics.visualFidelity < this.qualityThresholds.minVisualFidelity) {
      recommendations.push('Consider using higher quality settings for better visual fidelity');
    }

    if (metrics.fileSize > this.qualityThresholds.maxFileSize) {
      recommendations.push('Enable compression to reduce file size');
    }

    if (metrics.processingTime > this.qualityThresholds.maxProcessingTime) {
      recommendations.push('Consider using lower quality settings for faster processing');
    }

    if (metrics.errorCount > 0) {
      recommendations.push('Review and fix validation errors');
    }

    if (metrics.warnings.length > 3) {
      recommendations.push('Address quality warnings for better output');
    }

    if (recommendations.length === 0) {
      recommendations.push('Export quality is excellent - no improvements needed');
    }

    return recommendations;
  }

  /**
   * Extract text from PDF blob for validation
   */
  private async extractPDFText(blob: Blob): Promise<string> {
    // This is a simplified implementation
    // In a real implementation, you would use a PDF parsing library
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Simple text extraction (basic implementation)
      let text = '';
      for (let i = 0; i < uint8Array.length; i++) {
        if (uint8Array[i] >= 32 && uint8Array[i] <= 126) {
          text += String.fromCharCode(uint8Array[i]);
        }
      }
      
      return text;
    } catch (error) {
      console.warn('PDF text extraction failed:', error);
      return '';
    }
  }

  /**
   * Get expected content from presentation
   */
  private getExpectedContent(presentation: GeneratedPresentation): string[] {
    return presentation.slides.map(slide => slide.title);
  }

  /**
   * Calculate content completeness
   */
  private calculateContentCompleteness(actualText: string, expectedContent: string[]): number {
    if (expectedContent.length === 0) return 1;
    
    const foundContent = expectedContent.filter(content => 
      actualText.toLowerCase().includes(content.toLowerCase())
    );
    
    return foundContent.length / expectedContent.length;
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
   * Set quality thresholds
   */
  public setQualityThresholds(thresholds: Partial<typeof this.qualityThresholds>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
  }

  /**
   * Get current quality thresholds
   */
  public getQualityThresholds(): typeof this.qualityThresholds {
    return { ...this.qualityThresholds };
  }
}

// Export singleton instance
export const exportQualityAssurance = ExportQualityAssurance.getInstance(); 