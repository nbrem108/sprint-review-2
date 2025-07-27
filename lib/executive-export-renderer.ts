/**
 * Executive Export Renderer
 * Generates decision-ready executive summaries with key metrics and business impact
 */

import { 
  ExportRenderer, 
  ExportResult, 
  ExportProgress, 
  ExportOptions,
  GeneratedPresentation,
  Issue,
  SprintMetrics,
  PresentationSlide
} from './export-service';

import { isIssueCompleted } from './utils'

export class ExecutiveExportRenderer implements ExportRenderer {
  async render(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      // Update progress
      this.updateProgress(onProgress, {
        current: 0,
        total: 3, // Executive summary typically has 3 main sections
        stage: 'preparing',
        message: 'Preparing executive summary...',
        percentage: 0
      });

      // Generate executive summary content
      const executiveContent = await this.generateExecutiveContent(
        presentation,
        allIssues,
        upcomingIssues,
        sprintMetrics,
        options,
        onProgress
      );

      // Create blob
      const blob = new Blob([executiveContent], { type: 'text/html' });
      const fileName = this.generateFileName(presentation);

      // Update progress
      this.updateProgress(onProgress, {
        current: 3,
        total: 3,
        stage: 'finalizing',
        message: 'Finalizing executive summary...',
        percentage: 100
      });

      return {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'executive',
        metadata: {
          slideCount: 1, // Executive summary is typically one comprehensive document
          processingTime: Date.now() - startTime,
          quality: options.quality || 'high'
        }
      };

    } catch (error) {
      console.error('❌ Executive export failed:', error);
      throw new Error(`Executive export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateExecutiveContent(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    // Update progress
    this.updateProgress(onProgress, {
      current: 1,
      total: 3,
      stage: 'rendering',
      message: 'Generating executive metrics...',
      percentage: 33
    });

    // Calculate executive metrics
    const executiveMetrics = this.calculateExecutiveMetrics(sprintMetrics, allIssues);
    const businessImpact = this.analyzeBusinessImpact(allIssues);
    const recommendations = this.generateRecommendations(sprintMetrics, allIssues);

    // Update progress
    this.updateProgress(onProgress, {
      current: 2,
      total: 3,
      stage: 'rendering',
      message: 'Analyzing business impact...',
      percentage: 66
    });

    // Generate HTML content
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Summary - ${presentation.metadata.sprintName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f8fafc;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            min-height: 100vh;
        }

        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        .content {
            padding: 3rem 2rem;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .metric-card {
            background: #f8fafc;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            border-left: 4px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }

        .metric-label {
            color: #6b7280;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-status {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .status-excellent { background: #dcfce7; color: #166534; }
        .status-good { background: #dbeafe; color: #1e40af; }
        .status-fair { background: #fef3c7; color: #92400e; }
        .status-poor { background: #fee2e2; color: #991b1b; }

        .section {
            margin-bottom: 3rem;
        }

        .section h2 {
            font-size: 1.8rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e5e7eb;
        }

        .impact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }

        .impact-item {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 3px solid #10b981;
        }

        .impact-item h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }

        .impact-item p {
            color: #6b7280;
            font-size: 0.9rem;
        }

        .recommendations {
            background: #f0f9ff;
            padding: 2rem;
            border-radius: 12px;
            border-left: 4px solid #0ea5e9;
        }

        .recommendations h3 {
            color: #0c4a6e;
            margin-bottom: 1rem;
        }

        .recommendations ul {
            list-style: none;
            padding: 0;
        }

        .recommendations li {
            padding: 0.75rem 0;
            border-bottom: 1px solid #e0f2fe;
            color: #0c4a6e;
        }

        .recommendations li:last-child {
            border-bottom: none;
        }

        .footer {
            background: #f8fafc;
            padding: 2rem;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .metrics-grid { grid-template-columns: 1fr; }
            .impact-grid { grid-template-columns: 1fr; }
            .content { padding: 2rem 1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Executive Summary</h1>
            <div class="subtitle">${presentation.metadata.sprintName} - ${new Date(presentation.createdAt).toLocaleDateString()}</div>
        </div>

        <div class="content">
            <!-- Key Performance Indicators -->
            <div class="section">
                <h2>Key Performance Indicators</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${executiveMetrics.velocity}%</div>
                        <div class="metric-label">Sprint Velocity</div>
                        <div class="metric-status status-${executiveMetrics.velocityStatus}">${executiveMetrics.velocityStatus.toUpperCase()}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${executiveMetrics.qualityScore}%</div>
                        <div class="metric-label">Quality Score</div>
                        <div class="metric-status status-${executiveMetrics.qualityStatus}">${executiveMetrics.qualityStatus.toUpperCase()}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${executiveMetrics.completionRate}%</div>
                        <div class="metric-label">Completion Rate</div>
                        <div class="metric-status status-${executiveMetrics.completionStatus}">${executiveMetrics.completionStatus.toUpperCase()}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${executiveMetrics.efficiencyScore}%</div>
                        <div class="metric-label">Overall Efficiency</div>
                        <div class="metric-status status-${executiveMetrics.efficiencyStatus}">${executiveMetrics.efficiencyStatus.toUpperCase()}</div>
                    </div>
                </div>
            </div>

            <!-- Business Impact -->
            <div class="section">
                <h2>Business Impact</h2>
                <div class="impact-grid">
                    <div class="impact-item">
                        <h3>High-Value Deliverables</h3>
                        <p>${businessImpact.highValueDeliverables} high-priority items completed, representing ${businessImpact.highValuePercentage}% of total story points.</p>
                    </div>
                    <div class="impact-item">
                        <h3>User Stories Completed</h3>
                        <p>${businessImpact.completedIssues} user stories delivered, improving user experience and product functionality.</p>
                    </div>
                    <div class="impact-item">
                        <h3>Bug Fixes</h3>
                        <p>${businessImpact.bugFixes} critical issues resolved, enhancing system stability and reliability.</p>
                    </div>
                    <div class="impact-item">
                        <h3>Technical Debt</h3>
                        <p>${businessImpact.technicalDebt} technical improvements implemented, strengthening codebase foundation.</p>
                    </div>
                </div>
            </div>

            <!-- Strategic Recommendations -->
            <div class="section">
                <h2>Strategic Recommendations</h2>
                <div class="recommendations">
                    <h3>Key Actions for Next Sprint</h3>
                    <ul>
                        ${recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated by Sprint Review Deck Generator | ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  private calculateExecutiveMetrics(sprintMetrics: SprintMetrics | null | undefined, allIssues: Issue[]): any {
    if (!sprintMetrics) {
      return {
        velocity: 0,
        velocityStatus: 'poor',
        qualityScore: 0,
        qualityStatus: 'poor',
        completionRate: 0,
        completionStatus: 'poor',
        efficiencyScore: 0,
        efficiencyStatus: 'poor'
      };
    }

    // Calculate velocity
    const velocity = Math.round((sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100);
    const velocityStatus = velocity >= 90 ? 'excellent' : velocity >= 75 ? 'good' : velocity >= 60 ? 'fair' : 'poor';

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(sprintMetrics.qualityChecklist);
    const qualityStatus = qualityScore >= 80 ? 'excellent' : qualityScore >= 60 ? 'good' : qualityScore >= 40 ? 'fair' : 'poor';

    // Calculate completion rate
    const completedIssues = allIssues.filter(issue => isIssueCompleted(issue.status));
    const completionRate = Math.round((completedIssues.length / allIssues.length) * 100);
    const completionStatus = completionRate >= 90 ? 'excellent' : completionRate >= 75 ? 'good' : completionRate >= 60 ? 'fair' : 'poor';

    // Calculate overall efficiency
    const efficiencyScore = Math.round((velocity + qualityScore + completionRate) / 3);
    const efficiencyStatus = efficiencyScore >= 80 ? 'excellent' : efficiencyScore >= 60 ? 'good' : efficiencyScore >= 40 ? 'fair' : 'poor';

    return {
      velocity,
      velocityStatus,
      qualityScore,
      qualityStatus,
      completionRate,
      completionStatus,
      efficiencyScore,
      efficiencyStatus
    };
  }

  private analyzeBusinessImpact(allIssues: Issue[]): any {
    const completedIssues = allIssues.filter(issue => isIssueCompleted(issue.status));
    const highValueIssues = completedIssues.filter(issue => (issue.storyPoints || 0) >= 8);
    const totalStoryPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const highValuePoints = highValueIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);

    return {
      highValueDeliverables: highValueIssues.length,
      highValuePercentage: totalStoryPoints > 0 ? Math.round((highValuePoints / totalStoryPoints) * 100) : 0,
      completedIssues: completedIssues.length,
      bugFixes: completedIssues.filter(issue => issue.issueType === 'Bug').length,
      technicalDebt: completedIssues.filter(issue => issue.issueType === 'Technical task').length
    };
  }

  private generateRecommendations(sprintMetrics: SprintMetrics | null | undefined, allIssues: Issue[]): string[] {
    const recommendations: string[] = [];

    if (!sprintMetrics) {
      recommendations.push('Implement sprint metrics tracking to improve visibility and decision-making');
      return recommendations;
    }

    const velocity = (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100;
    const qualityScore = this.calculateQualityScore(sprintMetrics.qualityChecklist);
    const completionRate = (allIssues.filter(issue => isIssueCompleted(issue.status)).length / allIssues.length) * 100;

    if (velocity < 75) {
      recommendations.push('Review sprint planning process to improve estimation accuracy and scope management');
    }

    if (qualityScore < 70) {
      recommendations.push('Strengthen quality gates and review processes to maintain high standards');
    }

    if (completionRate < 80) {
      recommendations.push('Analyze blockers and dependencies to improve sprint completion rates');
    }

    if (sprintMetrics.testCoverage < 80) {
      recommendations.push('Increase test coverage through additional unit and integration testing');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current practices - performance is on track');
    }

    return recommendations;
  }

  private calculateQualityScore(checklist: Record<string, "yes" | "no" | "partial" | "na">): number {
    const totalItems = Object.keys(checklist).length;
    const yesCount = Object.values(checklist).filter(status => status === 'yes').length;
    const partialCount = Object.values(checklist).filter(status => status === 'partial').length;
    
    return Math.round(((yesCount + (partialCount * 0.5)) / totalItems) * 100);
  }

  private generateFileName(presentation: GeneratedPresentation): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sprintName = presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Executive_Summary_${sprintName}_${timestamp}.html`;
  }

  private updateProgress(
    onProgress: ((progress: ExportProgress) => void) | undefined,
    progress: ExportProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }
} 