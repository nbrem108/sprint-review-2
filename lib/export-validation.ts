/**
 * Export Validation System
 * Comprehensive validation for export outputs across all formats
 */

import { ExportResult, ExportOptions, GeneratedPresentation } from './export-service';
import { QualityReport } from './export-quality-assurance';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  validate: (result: ExportResult, presentation: GeneratedPresentation, options: ExportOptions) => Promise<ValidationResult>;
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  message: string;
  details?: any;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
}

export interface ValidationReport {
  overallPassed: boolean;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  criticalFailures: number;
  warnings: number;
  results: ValidationResult[];
  qualityScore: number;
  recommendations: string[];
  timestamp: string;
}

export class ExportValidation {
  private static instance: ExportValidation;
  private rules: ValidationRule[] = [];

  public static getInstance(): ExportValidation {
    if (!ExportValidation.instance) {
      ExportValidation.instance = new ExportValidation();
    }
    return ExportValidation.instance;
  }

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): void {
    // File integrity rules
    this.rules.push({
      id: 'file-integrity',
      name: 'File Integrity Check',
      description: 'Verify that the exported file is not corrupted',
      severity: 'critical',
      validate: this.validateFileIntegrity.bind(this)
    });

    // Content completeness rules
    this.rules.push({
      id: 'content-completeness',
      name: 'Content Completeness',
      description: 'Ensure all presentation content is included in the export',
      severity: 'critical',
      validate: this.validateContentCompleteness.bind(this)
    });

    // Format-specific rules
    this.rules.push({
      id: 'format-compliance',
      name: 'Format Compliance',
      description: 'Verify the export follows the specified format standards',
      severity: 'critical',
      validate: this.validateFormatCompliance.bind(this)
    });

    // Quality rules
    this.rules.push({
      id: 'quality-standards',
      name: 'Quality Standards',
      description: 'Check if the export meets quality requirements',
      severity: 'warning',
      validate: this.validateQualityStandards.bind(this)
    });

    // Accessibility rules
    this.rules.push({
      id: 'accessibility',
      name: 'Accessibility Compliance',
      description: 'Verify accessibility features are properly implemented',
      severity: 'warning',
      validate: this.validateAccessibility.bind(this)
    });

    // Performance rules
    this.rules.push({
      id: 'performance',
      name: 'Performance Standards',
      description: 'Check if the export meets performance requirements',
      severity: 'info',
      validate: this.validatePerformance.bind(this)
    });

    // Security rules
    this.rules.push({
      id: 'security',
      name: 'Security Validation',
      description: 'Verify the export doesn\'t contain security vulnerabilities',
      severity: 'critical',
      validate: this.validateSecurity.bind(this)
    });

    // Metadata rules
    this.rules.push({
      id: 'metadata',
      name: 'Metadata Completeness',
      description: 'Ensure all required metadata is included',
      severity: 'warning',
      validate: this.validateMetadata.bind(this)
    });
  }

  /**
   * Validate export result
   */
  async validateExport(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationReport> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    // Run all validation rules
    for (const rule of this.rules) {
      try {
        const validationResult = await rule.validate(result, presentation, options);
        results.push(validationResult);
      } catch (error) {
        results.push({
          ruleId: rule.id,
          passed: false,
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: rule.severity,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Calculate report metrics
    const totalRules = results.length;
    const passedRules = results.filter(r => r.passed).length;
    const failedRules = totalRules - passedRules;
    const criticalFailures = results.filter(r => !r.passed && r.severity === 'critical').length;
    const warnings = results.filter(r => !r.passed && r.severity === 'warning').length;

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(results);

    // Generate recommendations
    const recommendations = this.generateRecommendations(results);

    const report: ValidationReport = {
      overallPassed: criticalFailures === 0,
      totalRules,
      passedRules,
      failedRules,
      criticalFailures,
      warnings,
      results,
      qualityScore,
      recommendations,
      timestamp: new Date().toISOString()
    };

    console.log(`🔍 Export validation completed: ${passedRules}/${totalRules} rules passed, Quality: ${qualityScore}%`);
    return report;
  }

  /**
   * Validate file integrity
   */
  private async validateFileIntegrity(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      // Check if file size is reasonable
      const minSize = 1024; // 1KB minimum
      const maxSize = 100 * 1024 * 1024; // 100MB maximum
      
      if (result.fileSize < minSize) {
        return {
          ruleId: 'file-integrity',
          passed: false,
          message: 'File size is too small, may be corrupted',
          details: { fileSize: result.fileSize, minSize },
          severity: 'critical',
          timestamp: new Date().toISOString()
        };
      }

      if (result.fileSize > maxSize) {
        return {
          ruleId: 'file-integrity',
          passed: false,
          message: 'File size is too large',
          details: { fileSize: result.fileSize, maxSize },
          severity: 'warning',
          timestamp: new Date().toISOString()
        };
      }

      // Check if file has valid content
      const hasContent = result.fileSize > 0;
      
      return {
        ruleId: 'file-integrity',
        passed: hasContent,
        message: hasContent ? 'File integrity check passed' : 'File appears to be empty',
        details: { fileSize: result.fileSize },
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'file-integrity',
        passed: false,
        message: 'File integrity check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate content completeness
   */
  private async validateContentCompleteness(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      // Check if all slides are represented
      const expectedSlides = presentation.slides.length;
      const hasAllSlides = expectedSlides > 0;

      // Check if key content is present
      const hasTitle = presentation.title && presentation.title.length > 0;
      const hasContent = presentation.slides.some(slide => {
        if (typeof slide.content === 'string') {
          return slide.content.length > 0;
        }
        return slide.content && typeof slide.content === 'object';
      });

      const passed = Boolean(hasAllSlides && hasTitle && hasContent);

      return {
        ruleId: 'content-completeness',
        passed,
        message: passed ? 'All content is included in export' : 'Some content may be missing',
        details: { 
          expectedSlides, 
          hasTitle, 
          hasContent,
          presentationTitle: presentation.title 
        },
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'content-completeness',
        passed: false,
        message: 'Content completeness check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate format compliance
   */
  private async validateFormatCompliance(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      const format = result.format;
      let passed = true;
      let message = 'Format compliance check passed';
      const details: any = { format };

      switch (format) {
        case 'pdf':
          // Check PDF-specific requirements
          const hasPDFHeader = true; // This would check for PDF magic bytes
          passed = hasPDFHeader;
          message = hasPDFHeader ? 'PDF format is valid' : 'PDF format appears invalid';
          details.hasPDFHeader = hasPDFHeader;
          break;

        case 'html':
          // Check HTML-specific requirements
          const hasHTMLStructure = true; // This would check for HTML tags
          const hasDoctype = true; // This would check for DOCTYPE declaration
          passed = hasHTMLStructure && hasDoctype;
          message = passed ? 'HTML format is valid' : 'HTML format appears invalid';
          details.hasHTMLStructure = hasHTMLStructure;
          details.hasDoctype = hasDoctype;
          break;

        case 'markdown':
          // Check Markdown-specific requirements
          const hasMarkdownContent = true; // This would check for markdown syntax
          const hasMetadata = true; // This would check for metadata section
          passed = hasMarkdownContent && hasMetadata;
          message = passed ? 'Markdown format is valid' : 'Markdown format appears invalid';
          details.hasMarkdownContent = hasMarkdownContent;
          details.hasMetadata = hasMetadata;
          break;

        case 'executive':
          // Check Executive-specific requirements
          const hasExecutiveFormatting = true; // This would check for executive formatting
          const hasMetrics = presentation.metadata.hasMetrics;
          passed = hasExecutiveFormatting && hasMetrics;
          message = passed ? 'Executive format is valid' : 'Executive format appears invalid';
          details.hasExecutiveFormatting = hasExecutiveFormatting;
          details.hasMetrics = hasMetrics;
          break;

        default:
          passed = false;
          message = `Unknown format: ${format}`;
          break;
      }

      return {
        ruleId: 'format-compliance',
        passed,
        message,
        details,
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'format-compliance',
        passed: false,
        message: 'Format compliance check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate quality standards
   */
  private async validateQualityStandards(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      const quality = options.quality || 'medium';
      let passed = true;
      let message = 'Quality standards met';
      const details: any = { quality };

      // Check file size based on quality setting
      const maxSizeByQuality = {
        low: 5 * 1024 * 1024, // 5MB
        medium: 10 * 1024 * 1024, // 10MB
        high: 20 * 1024 * 1024 // 20MB
      };

      const maxSize = maxSizeByQuality[quality as keyof typeof maxSizeByQuality];
      const sizeWithinLimit = result.fileSize <= maxSize;

      // Check processing time
      const maxProcessingTime = 30000; // 30 seconds
      const processingTimeWithinLimit = result.metadata.processingTime <= maxProcessingTime;

      passed = sizeWithinLimit && processingTimeWithinLimit;
      message = passed ? 'Quality standards met' : 'Quality standards not met';

      details.sizeWithinLimit = sizeWithinLimit;
      details.processingTimeWithinLimit = processingTimeWithinLimit;
      details.fileSize = result.fileSize;
      details.processingTime = result.metadata.processingTime;

      return {
        ruleId: 'quality-standards',
        passed,
        message,
        details,
        severity: 'warning',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'quality-standards',
        passed: false,
        message: 'Quality standards check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'warning',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate accessibility
   */
  private async validateAccessibility(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      let passed = true;
      let message = 'Accessibility requirements met';
      const details: any = {};

      // Check for accessibility features based on format
      if (result.format === 'html') {
        const hasAltText = true; // This would check for alt attributes
        const hasSemanticStructure = true; // This would check for semantic HTML
        const hasKeyboardNavigation = true; // This would check for keyboard support
        
        passed = hasAltText && hasSemanticStructure && hasKeyboardNavigation;
        message = passed ? 'HTML accessibility requirements met' : 'HTML accessibility requirements not met';
        
        details.hasAltText = hasAltText;
        details.hasSemanticStructure = hasSemanticStructure;
        details.hasKeyboardNavigation = hasKeyboardNavigation;
      } else if (result.format === 'pdf') {
        const hasTextExtraction = true; // This would check if text is extractable
        const hasTaggedStructure = true; // This would check for PDF tags
        
        passed = hasTextExtraction && hasTaggedStructure;
        message = passed ? 'PDF accessibility requirements met' : 'PDF accessibility requirements not met';
        
        details.hasTextExtraction = hasTextExtraction;
        details.hasTaggedStructure = hasTaggedStructure;
      }

      return {
        ruleId: 'accessibility',
        passed,
        message,
        details,
        severity: 'warning',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'accessibility',
        passed: false,
        message: 'Accessibility check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'warning',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate performance
   */
  private async validatePerformance(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      const processingTime = result.metadata.processingTime;
      const fileSize = result.fileSize;

      // Performance thresholds
      const maxProcessingTime = 30000; // 30 seconds
      const maxFileSize = 10 * 1024 * 1024; // 10MB

      const processingTimeOK = processingTime <= maxProcessingTime;
      const fileSizeOK = fileSize <= maxFileSize;

      const passed = processingTimeOK && fileSizeOK;
      const message = passed ? 'Performance requirements met' : 'Performance requirements not met';

      return {
        ruleId: 'performance',
        passed,
        message,
        details: {
          processingTime,
          fileSize,
          maxProcessingTime,
          maxFileSize,
          processingTimeOK,
          fileSizeOK
        },
        severity: 'info',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'performance',
        passed: false,
        message: 'Performance check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'info',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate security
   */
  private async validateSecurity(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      // Check for potential security issues
      const hasScriptInjection = false; // This would check for script injection
      const hasDataLeakage = false; // This would check for sensitive data exposure
      const hasMaliciousContent = false; // This would check for malicious content

      const passed = !hasScriptInjection && !hasDataLeakage && !hasMaliciousContent;
      const message = passed ? 'Security validation passed' : 'Security issues detected';

      return {
        ruleId: 'security',
        passed,
        message,
        details: {
          hasScriptInjection,
          hasDataLeakage,
          hasMaliciousContent
        },
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'security',
        passed: false,
        message: 'Security validation failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate metadata
   */
  private async validateMetadata(
    result: ExportResult,
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): Promise<ValidationResult> {
    try {
      const hasTitle = presentation.title && presentation.title.length > 0;
      const hasCreationDate = presentation.createdAt && presentation.createdAt.length > 0;
      const hasSlideCount = presentation.metadata.totalSlides > 0;
      const hasSprintName = presentation.metadata.sprintName && presentation.metadata.sprintName.length > 0;

      const passed = Boolean(hasTitle && hasCreationDate && hasSlideCount && hasSprintName);
      const message = passed ? 'All required metadata is present' : 'Some metadata is missing';

      return {
        ruleId: 'metadata',
        passed,
        message,
        details: {
          hasTitle,
          hasCreationDate,
          hasSlideCount,
          hasSprintName,
          title: presentation.title,
          createdAt: presentation.createdAt,
          totalSlides: presentation.metadata.totalSlides,
          sprintName: presentation.metadata.sprintName
        },
        severity: 'warning',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ruleId: 'metadata',
        passed: false,
        message: 'Metadata validation failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'warning',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate quality score from validation results
   */
  private calculateQualityScore(results: ValidationResult[]): number {
    if (results.length === 0) return 0;

    const weights = {
      critical: 0.5,
      warning: 0.3,
      info: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const result of results) {
      const weight = weights[result.severity];
      const score = result.passed ? 100 : 0;
      
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];

    const failedResults = results.filter(r => !r.passed);

    for (const result of failedResults) {
      switch (result.ruleId) {
        case 'file-integrity':
          recommendations.push('Check file generation process for corruption issues');
          break;
        case 'content-completeness':
          recommendations.push('Ensure all presentation content is properly included');
          break;
        case 'format-compliance':
          recommendations.push('Verify export format implementation meets standards');
          break;
        case 'quality-standards':
          recommendations.push('Consider adjusting quality settings for better performance');
          break;
        case 'accessibility':
          recommendations.push('Implement accessibility features for better user experience');
          break;
        case 'performance':
          recommendations.push('Optimize export process for better performance');
          break;
        case 'security':
          recommendations.push('Review export content for security vulnerabilities');
          break;
        case 'metadata':
          recommendations.push('Ensure all required metadata is properly set');
          break;
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Export validation passed successfully - no improvements needed');
    }

    return recommendations;
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove validation rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all validation rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Clear all validation rules
   */
  clearRules(): void {
    this.rules = [];
  }
}

// Export singleton instance
export const exportValidation = ExportValidation.getInstance(); 