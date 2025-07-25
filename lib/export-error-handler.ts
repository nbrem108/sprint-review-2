/**
 * Export Error Handling & Recovery System
 * Provides robust error handling, retry mechanisms, and user-friendly error reporting
 */

import { ExportResult, ExportOptions, GeneratedPresentation } from './export-service';

export interface ExportError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
  retryCount: number;
  timestamp: string;
  context?: any;
}

export interface ErrorRecoveryStrategy {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  backoffMultiplier: number;
  timeout: number; // in milliseconds
}

export interface ErrorReport {
  errors: ExportError[];
  totalErrors: number;
  recoverableErrors: number;
  unrecoverableErrors: number;
  lastError?: ExportError;
  successRate: number;
  timestamp: string;
}

export class ExportErrorHandler {
  private static instance: ExportErrorHandler;
  private errorHistory: ExportError[] = [];
  private recoveryStrategy: ErrorRecoveryStrategy = {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    timeout: 30000
  };

  public static getInstance(): ExportErrorHandler {
    if (!ExportErrorHandler.instance) {
      ExportErrorHandler.instance = new ExportErrorHandler();
    }
    return ExportErrorHandler.instance;
  }

  /**
   * Handle export errors with recovery strategies
   */
  async handleExportError(
    error: Error,
    context: {
      presentation: GeneratedPresentation;
      options: ExportOptions;
      attempt: number;
      format: string;
    }
  ): Promise<ExportError> {
    const exportError = this.createExportError(error, context);
    
    // Add to error history
    this.errorHistory.push(exportError);
    
    // Log error for debugging
    console.error(`❌ Export error (attempt ${context.attempt}):`, {
      code: exportError.code,
      message: exportError.message,
      format: context.format,
      recoverable: exportError.recoverable
    });

    // Check if we should retry
    if (exportError.recoverable && context.attempt < this.recoveryStrategy.maxRetries) {
      await this.delay(this.calculateRetryDelay(context.attempt));
      return exportError;
    }

    // If not recoverable or max retries reached, throw the error
    throw new Error(this.getUserFriendlyMessage(exportError));
  }

  /**
   * Create a structured export error
   */
  private createExportError(
    error: Error,
    context: {
      presentation: GeneratedPresentation;
      options: ExportOptions;
      attempt: number;
      format: string;
    }
  ): ExportError {
    const errorCode = this.categorizeError(error);
    const isRecoverable = this.isRecoverableError(errorCode);
    
    return {
      code: errorCode,
      message: error.message,
      details: this.getErrorDetails(error, context),
      recoverable: isRecoverable,
      retryCount: context.attempt,
      timestamp: new Date().toISOString(),
      context: {
        format: context.format,
        quality: context.options.quality,
        slideCount: context.presentation.slides.length
      }
    };
  }

  /**
   * Categorize errors for better handling
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('network')) {
      return 'NETWORK_TIMEOUT';
    }
    
    if (message.includes('memory') || message.includes('out of memory')) {
      return 'MEMORY_ERROR';
    }
    
    if (message.includes('permission') || message.includes('access denied')) {
      return 'PERMISSION_ERROR';
    }
    
    if (message.includes('format') || message.includes('unsupported')) {
      return 'FORMAT_ERROR';
    }
    
    if (message.includes('renderer') || message.includes('render')) {
      return 'RENDERER_ERROR';
    }
    
    if (message.includes('asset') || message.includes('image')) {
      return 'ASSET_ERROR';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine if an error is recoverable
   */
  private isRecoverableError(errorCode: string): boolean {
    const recoverableErrors = [
      'NETWORK_TIMEOUT',
      'MEMORY_ERROR',
      'RENDERER_ERROR',
      'ASSET_ERROR'
    ];
    
    return recoverableErrors.includes(errorCode);
  }

  /**
   * Get detailed error information
   */
  private getErrorDetails(
    error: Error,
    context: {
      presentation: GeneratedPresentation;
      options: ExportOptions;
      attempt: number;
      format: string;
    }
  ): string {
    return `Format: ${context.format}, Quality: ${context.options.quality}, Slides: ${context.presentation.slides.length}, Attempt: ${context.attempt}`;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    return this.recoveryStrategy.retryDelay * Math.pow(this.recoveryStrategy.backoffMultiplier, attempt - 1);
  }

  /**
   * Delay execution for retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: ExportError): string {
    const messages: Record<string, string> = {
      'NETWORK_TIMEOUT': 'The export is taking longer than expected. Please try again.',
      'MEMORY_ERROR': 'The export requires more memory than available. Try reducing the quality or number of slides.',
      'PERMISSION_ERROR': 'Permission denied. Please check your file system permissions.',
      'FORMAT_ERROR': 'The selected export format is not supported or has an error.',
      'RENDERER_ERROR': 'There was an issue generating the export. Please try again.',
      'ASSET_ERROR': 'Some images or assets could not be processed. The export may be incomplete.',
      'VALIDATION_ERROR': 'The presentation data is invalid. Please regenerate the presentation.',
      'UNKNOWN_ERROR': 'An unexpected error occurred during export. Please try again.'
    };

    return messages[error.code] || messages['UNKNOWN_ERROR'];
  }

  /**
   * Get comprehensive error report
   */
  getErrorReport(): ErrorReport {
    const totalErrors = this.errorHistory.length;
    const recoverableErrors = this.errorHistory.filter(e => e.recoverable).length;
    const unrecoverableErrors = totalErrors - recoverableErrors;
    const lastError = this.errorHistory[this.errorHistory.length - 1];
    
    // Calculate success rate (assuming successful exports don't create errors)
    // This is a simplified calculation - in a real system you'd track successful exports too
    const successRate = totalErrors === 0 ? 100 : Math.max(0, 100 - (totalErrors * 10));

    return {
      errors: [...this.errorHistory],
      totalErrors,
      recoverableErrors,
      unrecoverableErrors,
      lastError,
      successRate,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Set recovery strategy
   */
  setRecoveryStrategy(strategy: Partial<ErrorRecoveryStrategy>): void {
    this.recoveryStrategy = { ...this.recoveryStrategy, ...strategy };
  }

  /**
   * Get current recovery strategy
   */
  getRecoveryStrategy(): ErrorRecoveryStrategy {
    return { ...this.recoveryStrategy };
  }

  /**
   * Validate export options to prevent errors
   */
  validateExportOptions(
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check presentation validity
    if (!presentation || !presentation.slides || presentation.slides.length === 0) {
      errors.push('Presentation is empty or invalid');
    }

    // Check format validity
    const validFormats = ['pdf', 'html', 'markdown', 'executive', 'digest'];
    if (!validFormats.includes(options.format)) {
      errors.push(`Invalid export format: ${options.format}`);
    }

    // Check quality settings
    if (options.quality && !['low', 'medium', 'high'].includes(options.quality)) {
      errors.push(`Invalid quality setting: ${options.quality}`);
    }

    // Check file size limits
    const estimatedSize = this.estimateFileSize(presentation, options);
    if (estimatedSize > 50 * 1024 * 1024) { // 50MB limit
      errors.push('Estimated file size exceeds 50MB limit');
    }

    // Check slide count limits
    if (presentation.slides.length > 100) {
      errors.push('Presentation has too many slides (max 100)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Estimate file size based on presentation and options
   */
  private estimateFileSize(
    presentation: GeneratedPresentation,
    options: ExportOptions
  ): number {
    let baseSize = presentation.slides.length * 1024; // 1KB per slide base
    
    // Add size for images
    const imageSlides = presentation.slides.filter(slide => slide.corporateSlideUrl);
    baseSize += imageSlides.length * 2 * 1024 * 1024; // 2MB per image
    
    // Adjust for quality
    if (options.quality === 'high') {
      baseSize *= 1.5;
    } else if (options.quality === 'low') {
      baseSize *= 0.7;
    }
    
    // Adjust for format
    switch (options.format) {
      case 'pdf':
        baseSize *= 1.2;
        break;
      case 'html':
        baseSize *= 1.1;
        break;
      case 'markdown':
        baseSize *= 0.3;
        break;
      case 'executive':
        baseSize *= 0.8;
        break;
      case 'digest':
        baseSize *= 0.9;
        break;
    }
    
    return Math.round(baseSize);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByFormat: Record<string, number>;
    averageRetryCount: number;
    recoveryRate: number;
  } {
    const errorsByCode: Record<string, number> = {};
    const errorsByFormat: Record<string, number> = {};
    let totalRetries = 0;

    this.errorHistory.forEach(error => {
      // Count by error code
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      
      // Count by format
      const format = error.context?.format || 'unknown';
      errorsByFormat[format] = (errorsByFormat[format] || 0) + 1;
      
      // Sum retry counts
      totalRetries += error.retryCount;
    });

    const totalErrors = this.errorHistory.length;
    const recoverableErrors = this.errorHistory.filter(e => e.recoverable).length;

    return {
      totalErrors,
      errorsByCode,
      errorsByFormat,
      averageRetryCount: totalErrors > 0 ? totalRetries / totalErrors : 0,
      recoveryRate: totalErrors > 0 ? (recoverableErrors / totalErrors) * 100 : 0
    };
  }

  /**
   * Suggest recovery actions based on error
   */
  suggestRecoveryActions(error: ExportError): string[] {
    const suggestions: string[] = [];

    switch (error.code) {
      case 'NETWORK_TIMEOUT':
        suggestions.push('Check your internet connection');
        suggestions.push('Try again in a few minutes');
        suggestions.push('Use a lower quality setting');
        break;
      
      case 'MEMORY_ERROR':
        suggestions.push('Close other applications to free up memory');
        suggestions.push('Reduce the number of slides');
        suggestions.push('Use a lower quality setting');
        suggestions.push('Try exporting in smaller batches');
        break;
      
      case 'PERMISSION_ERROR':
        suggestions.push('Check file system permissions');
        suggestions.push('Try saving to a different location');
        suggestions.push('Run the application as administrator');
        break;
      
      case 'FORMAT_ERROR':
        suggestions.push('Try a different export format');
        suggestions.push('Update the application');
        suggestions.push('Contact support if the issue persists');
        break;
      
      case 'RENDERER_ERROR':
        suggestions.push('Try refreshing the page');
        suggestions.push('Clear browser cache');
        suggestions.push('Try a different browser');
        break;
      
      case 'ASSET_ERROR':
        suggestions.push('Check that all images are accessible');
        suggestions.push('Try removing problematic images');
        suggestions.push('Use a different export format');
        break;
      
      case 'VALIDATION_ERROR':
        suggestions.push('Regenerate the presentation');
        suggestions.push('Check that all required data is present');
        suggestions.push('Try with a simpler presentation');
        break;
      
      default:
        suggestions.push('Try again');
        suggestions.push('Contact support if the issue persists');
    }

    return suggestions;
  }
}

// Export singleton instance
export const exportErrorHandler = ExportErrorHandler.getInstance(); 