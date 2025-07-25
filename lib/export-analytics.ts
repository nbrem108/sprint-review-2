/**
 * Export Analytics System
 * Advanced analytics, usage tracking, and performance insights
 */

import { ExportResult, ExportOptions, GeneratedPresentation } from './export-service';

export interface ExportEvent {
  id: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  eventType: 'export_started' | 'export_completed' | 'export_failed' | 'export_cancelled';
  format: string;
  quality: string;
  slideCount: number;
  fileSize: number;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
  userAgent: string;
  ipAddress?: string;
}

export interface AnalyticsMetrics {
  totalExports: number;
  successfulExports: number;
  failedExports: number;
  averageProcessingTime: number;
  averageFileSize: number;
  mostPopularFormat: string;
  mostPopularQuality: string;
  averageSlideCount: number;
  successRate: number;
  peakUsageHour: number;
  peakUsageDay: string;
}

export interface UsagePattern {
  format: string;
  count: number;
  percentage: number;
  averageProcessingTime: number;
  averageFileSize: number;
  successRate: number;
}

export interface PerformanceTrend {
  date: string;
  averageProcessingTime: number;
  averageFileSize: number;
  successRate: number;
  totalExports: number;
}

export interface UserInsights {
  userId: string;
  totalExports: number;
  favoriteFormat: string;
  averageQuality: string;
  successRate: number;
  lastExportDate: string;
  exportFrequency: 'low' | 'medium' | 'high';
}

export class ExportAnalytics {
  private static instance: ExportAnalytics;
  private events: ExportEvent[] = [];
  private maxEvents: number = 10000;

  public static getInstance(): ExportAnalytics {
    if (!ExportAnalytics.instance) {
      ExportAnalytics.instance = new ExportAnalytics();
    }
    return ExportAnalytics.instance;
  }

  /**
   * Track export event
   */
  trackEvent(event: Omit<ExportEvent, 'id' | 'timestamp'>): void {
    const exportEvent: ExportEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now()
    };

    this.events.push(exportEvent);

    // Maintain event limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    console.log(`📊 Analytics event tracked: ${event.eventType} for ${event.format}`);
  }

  /**
   * Track export start
   */
  trackExportStart(
    format: string,
    quality: string,
    slideCount: number,
    sessionId: string,
    userId?: string
  ): string {
    const eventId = this.generateEventId();
    
    this.trackEvent({
      sessionId,
      userId,
      eventType: 'export_started',
      format,
      quality,
      slideCount,
      fileSize: 0,
      processingTime: 0,
      success: false,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side'
    });

    return eventId;
  }

  /**
   * Track export completion
   */
  trackExportComplete(
    eventId: string,
    result: ExportResult,
    processingTime: number,
    sessionId: string,
    userId?: string
  ): void {
    this.trackEvent({
      sessionId,
      userId,
      eventType: 'export_completed',
      format: result.format,
      quality: result.metadata.quality,
      slideCount: result.metadata.slideCount,
      fileSize: result.fileSize,
      processingTime,
      success: true,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side'
    });
  }

  /**
   * Track export failure
   */
  trackExportFailure(
    eventId: string,
    format: string,
    quality: string,
    slideCount: number,
    errorMessage: string,
    processingTime: number,
    sessionId: string,
    userId?: string
  ): void {
    this.trackEvent({
      sessionId,
      userId,
      eventType: 'export_failed',
      format,
      quality,
      slideCount,
      fileSize: 0,
      processingTime,
      success: false,
      errorMessage,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server-side'
    });
  }

  /**
   * Get analytics metrics
   */
  getMetrics(timeRange: 'day' | 'week' | 'month' | 'all' = 'all'): AnalyticsMetrics {
    const filteredEvents = this.filterEventsByTimeRange(timeRange);
    
    if (filteredEvents.length === 0) {
      return this.getEmptyMetrics();
    }

    const successfulExports = filteredEvents.filter(e => e.success);
    const failedExports = filteredEvents.filter(e => !e.success);
    
    const formatCounts = this.countByProperty(filteredEvents, 'format');
    const qualityCounts = this.countByProperty(filteredEvents, 'quality');
    const hourCounts = this.countByHour(filteredEvents);
    const dayCounts = this.countByDay(filteredEvents);

    return {
      totalExports: filteredEvents.length,
      successfulExports: successfulExports.length,
      failedExports: failedExports.length,
      averageProcessingTime: this.calculateAverage(filteredEvents, 'processingTime'),
      averageFileSize: this.calculateAverage(filteredEvents, 'fileSize'),
      mostPopularFormat: this.getMostPopular(formatCounts),
      mostPopularQuality: this.getMostPopular(qualityCounts),
      averageSlideCount: this.calculateAverage(filteredEvents, 'slideCount'),
      successRate: (successfulExports.length / filteredEvents.length) * 100,
      peakUsageHour: Number(this.getMostPopular(hourCounts)),
      peakUsageDay: this.getMostPopular(dayCounts)
    };
  }

  /**
   * Get usage patterns by format
   */
  getUsagePatterns(timeRange: 'day' | 'week' | 'month' | 'all' = 'all'): UsagePattern[] {
    const filteredEvents = this.filterEventsByTimeRange(timeRange);
    const formatGroups = this.groupByProperty(filteredEvents, 'format');
    
    const totalExports = filteredEvents.length;
    
    return Object.entries(formatGroups).map(([format, events]) => {
      const successfulEvents = events.filter(e => e.success);
      
      return {
        format,
        count: events.length,
        percentage: (events.length / totalExports) * 100,
        averageProcessingTime: this.calculateAverage(events, 'processingTime'),
        averageFileSize: this.calculateAverage(events, 'fileSize'),
        successRate: (successfulEvents.length / events.length) * 100
      };
    }).sort((a, b) => b.count - a.count);
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(days: number = 30): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = this.events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate.toISOString().split('T')[0] === dateStr;
      });
      
      if (dayEvents.length > 0) {
        const successfulEvents = dayEvents.filter(e => e.success);
        
        trends.push({
          date: dateStr,
          averageProcessingTime: this.calculateAverage(dayEvents, 'processingTime'),
          averageFileSize: this.calculateAverage(dayEvents, 'fileSize'),
          successRate: (successfulEvents.length / dayEvents.length) * 100,
          totalExports: dayEvents.length
        });
      } else {
        trends.push({
          date: dateStr,
          averageProcessingTime: 0,
          averageFileSize: 0,
          successRate: 0,
          totalExports: 0
        });
      }
    }
    
    return trends;
  }

  /**
   * Get user insights
   */
  getUserInsights(userId: string): UserInsights | null {
    const userEvents = this.events.filter(e => e.userId === userId);
    
    if (userEvents.length === 0) {
      return null;
    }
    
    const successfulEvents = userEvents.filter(e => e.success);
    const formatCounts = this.countByProperty(userEvents, 'format');
    const qualityCounts = this.countByProperty(userEvents, 'quality');
    
    const lastExport = userEvents.reduce((latest, event) => 
      event.timestamp > latest.timestamp ? event : latest
    );
    
    const exportFrequency = this.calculateExportFrequency(userEvents);
    
    return {
      userId,
      totalExports: userEvents.length,
      favoriteFormat: this.getMostPopular(formatCounts),
      averageQuality: this.getMostPopular(qualityCounts),
      successRate: (successfulEvents.length / userEvents.length) * 100,
      lastExportDate: new Date(lastExport.timestamp).toISOString(),
      exportFrequency
    };
  }

  /**
   * Get error analysis
   */
  getErrorAnalysis(timeRange: 'day' | 'week' | 'month' | 'all' = 'all'): {
    totalErrors: number;
    errorTypes: Record<string, number>;
    mostCommonError: string;
    errorRate: number;
  } {
    const filteredEvents = this.filterEventsByTimeRange(timeRange);
    const failedEvents = filteredEvents.filter(e => !e.success && e.errorMessage);
    
    const errorTypes: Record<string, number> = {};
    failedEvents.forEach(event => {
      const errorType = this.categorizeError(event.errorMessage!);
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });
    
    const mostCommonError = Object.entries(errorTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
    
    return {
      totalErrors: failedEvents.length,
      errorTypes,
      mostCommonError,
      errorRate: (failedEvents.length / filteredEvents.length) * 100
    };
  }

  /**
   * Get system health metrics
   */
  getSystemHealth(): {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    metrics: {
      successRate: number;
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
    };
    recommendations: string[];
  } {
    const recentEvents = this.events.filter(e => 
      Date.now() - e.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    if (recentEvents.length === 0) {
      return {
        overallHealth: 'good',
        metrics: {
          successRate: 100,
          averageResponseTime: 0,
          errorRate: 0,
          throughput: 0
        },
        recommendations: ['No recent activity to analyze']
      };
    }
    
    const successfulEvents = recentEvents.filter(e => e.success);
    const successRate = (successfulEvents.length / recentEvents.length) * 100;
    const averageResponseTime = this.calculateAverage(recentEvents, 'processingTime');
    const errorRate = 100 - successRate;
    const throughput = recentEvents.length / 24; // exports per hour
    
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    const recommendations: string[] = [];
    
    if (successRate >= 95 && averageResponseTime < 10000) {
      overallHealth = 'excellent';
    } else if (successRate >= 85 && averageResponseTime < 30000) {
      overallHealth = 'good';
    } else if (successRate >= 70 && averageResponseTime < 60000) {
      overallHealth = 'fair';
    } else {
      overallHealth = 'poor';
    }
    
    if (successRate < 90) {
      recommendations.push('Success rate is below target - investigate recent failures');
    }
    
    if (averageResponseTime > 30000) {
      recommendations.push('Average response time is high - consider optimization');
    }
    
    if (errorRate > 10) {
      recommendations.push('Error rate is elevated - review error patterns');
    }
    
    if (throughput < 1) {
      recommendations.push('Low throughput - consider performance improvements');
    }
    
    return {
      overallHealth,
      metrics: {
        successRate,
        averageResponseTime,
        errorRate,
        throughput
      },
      recommendations
    };
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Filter events by time range
   */
  private filterEventsByTimeRange(timeRange: 'day' | 'week' | 'month' | 'all'): ExportEvent[] {
    const now = Date.now();
    let cutoffTime: number;
    
    switch (timeRange) {
      case 'day':
        cutoffTime = now - 24 * 60 * 60 * 1000;
        break;
      case 'week':
        cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        return this.events;
    }
    
    return this.events.filter(event => event.timestamp >= cutoffTime);
  }

  /**
   * Count events by property
   */
  private countByProperty(events: ExportEvent[], property: keyof ExportEvent): Record<string, number> {
    const counts: Record<string, number> = {};
    events.forEach(event => {
      const value = String(event[property]);
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  /**
   * Group events by property
   */
  private groupByProperty(events: ExportEvent[], property: keyof ExportEvent): Record<string, ExportEvent[]> {
    const groups: Record<string, ExportEvent[]> = {};
    events.forEach(event => {
      const value = String(event[property]);
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(event);
    });
    return groups;
  }

  /**
   * Count events by hour
   */
  private countByHour(events: ExportEvent[]): Record<number, number> {
    const counts: Record<number, number> = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      counts[hour] = (counts[hour] || 0) + 1;
    });
    return counts;
  }

  /**
   * Count events by day
   */
  private countByDay(events: ExportEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    events.forEach(event => {
      const day = new Date(event.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      counts[day] = (counts[day] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get most popular value
   */
  private getMostPopular(counts: Record<string, number>): string {
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
  }

  /**
   * Calculate average of property
   */
  private calculateAverage(events: ExportEvent[], property: keyof ExportEvent): number {
    if (events.length === 0) return 0;
    const sum = events.reduce((acc, event) => acc + Number(event[property]), 0);
    return sum / events.length;
  }

  /**
   * Calculate export frequency
   */
  private calculateExportFrequency(events: ExportEvent[]): 'low' | 'medium' | 'high' {
    const daysSinceFirstExport = (Date.now() - Math.min(...events.map(e => e.timestamp))) / (24 * 60 * 60 * 1000);
    const exportsPerDay = events.length / Math.max(daysSinceFirstExport, 1);
    
    if (exportsPerDay >= 2) return 'high';
    if (exportsPerDay >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Categorize error message
   */
  private categorizeError(errorMessage: string): string {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('memory') || lowerError.includes('out of memory')) {
      return 'Memory Error';
    }
    if (lowerError.includes('timeout') || lowerError.includes('time out')) {
      return 'Timeout Error';
    }
    if (lowerError.includes('network') || lowerError.includes('connection')) {
      return 'Network Error';
    }
    if (lowerError.includes('permission') || lowerError.includes('access')) {
      return 'Permission Error';
    }
    if (lowerError.includes('format') || lowerError.includes('invalid')) {
      return 'Format Error';
    }
    
    return 'General Error';
  }

  /**
   * Get empty metrics
   */
  private getEmptyMetrics(): AnalyticsMetrics {
    return {
      totalExports: 0,
      successfulExports: 0,
      failedExports: 0,
      averageProcessingTime: 0,
      averageFileSize: 0,
      mostPopularFormat: 'None',
      mostPopularQuality: 'None',
      averageSlideCount: 0,
      successRate: 0,
      peakUsageHour: 0,
      peakUsageDay: 'None'
    };
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Get all events
   */
  getEvents(): ExportEvent[] {
    return [...this.events];
  }

  /**
   * Export analytics data
   */
  exportData(): {
    events: ExportEvent[];
    metrics: AnalyticsMetrics;
    usagePatterns: UsagePattern[];
    performanceTrends: PerformanceTrend[];
  } {
    return {
      events: this.getEvents(),
      metrics: this.getMetrics(),
      usagePatterns: this.getUsagePatterns(),
      performanceTrends: this.getPerformanceTrends()
    };
  }
}

// Export singleton instance
export const exportAnalytics = ExportAnalytics.getInstance(); 