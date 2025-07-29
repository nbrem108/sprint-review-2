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
    onProgress?: (progress: ExportProgress) => void,
    additionalData?: {
      selectedProject?: { id: string; key: string; name: string } | null
      selectedBoard?: { id: string; name: string; type: string } | null
      selectedSprint?: { id: string; name: string; startDate?: string; endDate?: string } | null
      upcomingSprint?: { id: string; name: string; startDate?: string; endDate?: string } | null
      sprintComparison?: any
      sprintTrends?: any
      summaries?: {
        currentSprint?: string
        upcomingSprint?: string
        demoStories?: Record<string, string>
      }
      corporateSlides?: any[]
      additionalSlides?: any[]
      quarterlyPlanSlide?: any
    }
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
        onProgress,
        additionalData
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
    onProgress?: (progress: ExportProgress) => void,
    additionalData?: {
      selectedProject?: { id: string; key: string; name: string } | null
      selectedBoard?: { id: string; name: string; type: string } | null
      selectedSprint?: { id: string; name: string; startDate?: string; endDate?: string } | null
      upcomingSprint?: { id: string; name: string; startDate?: string; endDate?: string } | null
      sprintComparison?: any
      sprintTrends?: any
      summaries?: {
        currentSprint?: string
        upcomingSprint?: string
        demoStories?: Record<string, string>
      }
      corporateSlides?: any[]
      additionalSlides?: any[]
      quarterlyPlanSlide?: any
    }
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
            margin-bottom: 0.5rem;
        }

        .header .project-details {
            font-size: 0.9rem;
            opacity: 0.8;
            font-weight: 400;
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

        .quality-grid {
            margin-bottom: 2rem;
        }

        .quality-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }

        .quality-item {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 3px solid #3b82f6;
        }

        .quality-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .quality-header h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0;
        }

        .quality-status {
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .status-yes { background: #dcfce7; color: #166534; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-no { background: #fee2e2; color: #991b1b; }
        .status-na { background: #f3f4f6; color: #6b7280; }

        .quality-item p {
            color: #6b7280;
            font-size: 0.875rem;
            margin: 0;
        }

        .score-summary {
            margin-bottom: 2rem;
        }

        .score-card {
            background: #f8fafc;
            padding: 2rem;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .score-card.score-excellent { border-left-color: #10b981; }
        .score-card.score-good { border-left-color: #3b82f6; }
        .score-card.score-needs-improvement { border-left-color: #f59e0b; }

        .score-main {
            text-align: left;
        }

        .score-value {
            font-size: 3rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }

        .score-description {
            font-size: 1.1rem;
            font-weight: 600;
            color: #6b7280;
        }

        .score-details {
            text-align: right;
        }

        .score-details p {
            color: #6b7280;
            font-size: 0.875rem;
            margin: 0.25rem 0;
        }

        .copy-friendly-note {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }

        .copy-friendly-note p {
            margin: 0;
            color: #0c4a6e;
            font-size: 0.9rem;
        }

        .copy-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1.5rem;
        }

        .copy-section h3 {
            color: #374151;
            font-size: 1.1rem;
            margin-bottom: 1rem;
        }

        .copy-content {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 1rem;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            white-space: pre-wrap;
            margin-bottom: 1rem;
            max-height: 200px;
            overflow-y: auto;
        }

        .copy-button {
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 0.75rem 1.5rem;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .copy-button:hover {
            background: #2563eb;
        }

        .copy-button:active {
            background: #1d4ed8;
        }

        .footer {
            background: #f8fafc;
            padding: 2rem;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }

        .ai-summary {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }

        .summary-content {
            color: #0c4a6e;
            line-height: 1.7;
        }

        .summary-content h1,
        .summary-content h2,
        .summary-content h3,
        .summary-content h4,
        .summary-content h5,
        .summary-content h6 {
            color: #1e3a8a;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
        }

        .summary-content h1 { font-size: 1.5rem; }
        .summary-content h2 { font-size: 1.3rem; }
        .summary-content h3 { font-size: 1.1rem; }

        .summary-content p {
            margin-bottom: 1rem;
        }

        .summary-content strong {
            color: #1e3a8a;
            font-weight: 600;
        }

        .summary-content em {
            color: #0c4a6e;
            font-style: italic;
        }

        .summary-content code {
            background: #e0f2fe;
            color: #0c4a6e;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        .summary-content blockquote {
            border-left: 4px solid #0ea5e9;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: #0c4a6e;
        }

        .summary-content ul,
        .summary-content ol {
            margin: 1rem 0;
            padding-left: 1.5rem;
        }

        .summary-content li {
            margin-bottom: 0.5rem;
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
            <div class="subtitle">
                ${additionalData?.selectedProject?.name || 'Project'} - ${presentation.metadata.sprintName}
            </div>
            <div class="project-details">
                ${additionalData?.selectedProject?.key ? `Project Key: ${additionalData.selectedProject.key}` : ''}
                ${additionalData?.selectedBoard?.name ? ` | Board: ${additionalData.selectedBoard.name}` : ''}
                ${additionalData?.selectedSprint?.startDate && additionalData?.selectedSprint?.endDate ? 
                  ` | Sprint Period: ${additionalData.selectedSprint.startDate} - ${additionalData.selectedSprint.endDate}` : ''}
            </div>
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

            <!-- Quality & Standards Overview -->
            <div class="section">
                <h2>Quality & Standards Overview</h2>
                <div class="copy-friendly-note">
                    <p><strong>💡 Copy-friendly format below for Smartsheet integration</strong></p>
                </div>
                <div class="quality-grid">
                    ${this.generateQualityStandardsHTML(sprintMetrics)}
                </div>
                <div class="copy-section">
                    <h3>Copy-Paste Format for Smartsheet</h3>
                    <div class="copy-content" id="qualityCopyContent">
                        ${this.generateCopyFriendlyQualityText(sprintMetrics)}
                    </div>
                    <button class="copy-button" onclick="copyToClipboard('qualityCopyContent')">📋 Copy Quality Data</button>
                </div>
            </div>

            <!-- Sprint Score Summary -->
            <div class="section">
                <h2>Sprint Score Summary</h2>
                <div class="score-summary">
                    ${this.generateScoreSummaryHTML(sprintMetrics)}
                </div>
                <div class="copy-section">
                    <h3>Copy-Paste Format for Smartsheet</h3>
                    <div class="copy-content" id="scoreCopyContent">
                        ${this.generateCopyFriendlyScoreText(sprintMetrics)}
                    </div>
                    <button class="copy-button" onclick="copyToClipboard('scoreCopyContent')">📋 Copy Score Data</button>
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

            <!-- AI-Generated Sprint Summary -->
            ${additionalData?.summaries?.currentSprint ? `
            <div class="section">
                <h2>AI-Generated Sprint Summary</h2>
                <div class="ai-summary">
                    <div class="summary-content">
                        ${this.renderMarkdownToHTML(additionalData.summaries.currentSprint)}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- AI-Generated Upcoming Sprint Summary -->
            ${additionalData?.summaries?.upcomingSprint ? `
            <div class="section">
                <h2>Upcoming Sprint Planning</h2>
                <div class="ai-summary">
                    <div class="summary-content">
                        ${this.renderMarkdownToHTML(additionalData.summaries.upcomingSprint)}
                    </div>
                </div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>Generated by Sprint Review Deck Generator | ${new Date().toLocaleDateString()}</p>
        </div>
    </div>

    <script>
        function copyToClipboard(elementId) {
            const element = document.getElementById(elementId);
            const text = element.textContent || element.innerText;
            
            navigator.clipboard.writeText(text).then(function() {
                // Show success feedback
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copied!';
                button.style.background = '#10b981';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#3b82f6';
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy: ', err);
                alert('Copy failed. Please select and copy manually.');
            });
        }
    </script>
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

  private generateQualityStandardsHTML(sprintMetrics: SprintMetrics | null | undefined): string {
    if (!sprintMetrics?.qualityChecklist) {
      return '<p>No quality checklist data available</p>';
    }

    const qualityItems = [
      { key: 'sprintCommitment', label: 'Sprint Commitment', description: 'Met sprint commitment goals' },
      { key: 'velocity', label: 'Velocity', description: 'Achieved velocity targets' },
      { key: 'testCoverage', label: 'Test Code Coverage', description: 'Met coverage requirements' },
      { key: 'testAutomation', label: 'Test Automation', description: 'Followed automation standards' },
      { key: 'uiUxStandards', label: 'UI/UX Standards', description: 'Maintained design standards' },
      { key: 'internationalFirst', label: 'International First', description: 'Met i18n requirements' },
      { key: 'mobileResponsive', label: 'Mobile Responsive', description: 'Achieved mobile responsiveness' },
      { key: 'featurePermissions', label: 'Feature Permissions', description: 'Implemented permission requirements' },
      { key: 'releaseNotes', label: 'Release Notes', description: 'Created release documentation' },
      { key: 'howToVideos', label: 'How To Videos', description: 'Created instructional videos' }
    ];

    return `
      <div class="quality-items">
        ${qualityItems.map(item => {
          const value = sprintMetrics.qualityChecklist[item.key as keyof typeof sprintMetrics.qualityChecklist];
          let statusClass = '';
          let statusText = '';
          
          switch (value) {
            case 'yes':
              statusClass = 'status-yes';
              statusText = '✓ Yes';
              break;
            case 'partial':
              statusClass = 'status-partial';
              statusText = '⚠ Partial';
              break;
            case 'no':
              statusClass = 'status-no';
              statusText = '✗ No';
              break;
            case 'na':
              statusClass = 'status-na';
              statusText = 'N/A';
              break;
            default:
              statusClass = 'status-na';
              statusText = 'N/A';
          }
          
          return `
            <div class="quality-item">
              <div class="quality-header">
                <h4>${item.label}</h4>
                <span class="quality-status ${statusClass}">${statusText}</span>
              </div>
              <p>${item.description}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private generateScoreSummaryHTML(sprintMetrics: SprintMetrics | null | undefined): string {
    if (!sprintMetrics?.qualityChecklist) {
      return '<p>No quality data available for scoring</p>';
    }

    const overallScore = this.calculateQualityScore(sprintMetrics.qualityChecklist);
    const applicableItems = Object.values(sprintMetrics.qualityChecklist).filter(value => value !== 'na').length;
    
    let scoreClass = '';
    let scoreText = '';
    
    if (overallScore >= 80) {
      scoreClass = 'score-excellent';
      scoreText = 'Excellent sprint quality';
    } else if (overallScore >= 60) {
      scoreClass = 'score-good';
      scoreText = 'Good sprint quality';
    } else {
      scoreClass = 'score-needs-improvement';
      scoreText = 'Needs improvement';
    }

    return `
      <div class="score-card ${scoreClass}">
        <div class="score-main">
          <div class="score-value">${overallScore}%</div>
          <div class="score-description">${scoreText}</div>
        </div>
        <div class="score-details">
          <p>Based on ${applicableItems} applicable standards</p>
          <p>Yes: 100% • Partial: 50% • No: 0%</p>
        </div>
      </div>
    `;
  }

  private generateCopyFriendlyQualityText(sprintMetrics: SprintMetrics | null | undefined): string {
    if (!sprintMetrics?.qualityChecklist) {
      return 'No quality checklist data available';
    }

    const qualityItems = [
      { key: 'sprintCommitment', label: 'Sprint Commitment' },
      { key: 'velocity', label: 'Velocity' },
      { key: 'testCoverage', label: 'Test Code Coverage' },
      { key: 'testAutomation', label: 'Test Automation' },
      { key: 'uiUxStandards', label: 'UI/UX Standards' },
      { key: 'internationalFirst', label: 'International First' },
      { key: 'mobileResponsive', label: 'Mobile Responsive' },
      { key: 'featurePermissions', label: 'Feature Permissions' },
      { key: 'releaseNotes', label: 'Release Notes' },
      { key: 'howToVideos', label: 'How To Videos' }
    ];

    let copyText = 'QUALITY & STANDARDS CHECKLIST\n';
    copyText += '=============================\n\n';

    qualityItems.forEach(item => {
      const value = sprintMetrics.qualityChecklist[item.key as keyof typeof sprintMetrics.qualityChecklist];
      let statusText = '';
      
      switch (value) {
        case 'yes':
          statusText = '✓ YES';
          break;
        case 'partial':
          statusText = '⚠ PARTIAL';
          break;
        case 'no':
          statusText = '✗ NO';
          break;
        case 'na':
          statusText = 'N/A';
          break;
        default:
          statusText = 'N/A';
      }
      
      copyText += `${item.label}: ${statusText}\n`;
    });

    return copyText;
  }

  private generateCopyFriendlyScoreText(sprintMetrics: SprintMetrics | null | undefined): string {
    if (!sprintMetrics?.qualityChecklist) {
      return 'No quality data available for scoring';
    }

    const overallScore = this.calculateQualityScore(sprintMetrics.qualityChecklist);
    const applicableItems = Object.values(sprintMetrics.qualityChecklist).filter(value => value !== 'na').length;
    
    let scoreText = '';
    if (overallScore >= 80) {
      scoreText = 'EXCELLENT';
    } else if (overallScore >= 60) {
      scoreText = 'GOOD';
    } else {
      scoreText = 'NEEDS IMPROVEMENT';
    }

    let copyText = 'SPRINT SCORE SUMMARY\n';
    copyText += '===================\n\n';
    copyText += `Overall Quality Score: ${overallScore}%\n`;
    copyText += `Quality Status: ${scoreText}\n`;
    copyText += `Based on: ${applicableItems} applicable standards\n\n`;
    copyText += 'Scoring Method:\n';
    copyText += '- Yes: 100%\n';
    copyText += '- Partial: 50%\n';
    copyText += '- No: 0%\n';
    copyText += '- N/A: Not counted\n';

    return copyText;
  }

  private updateProgress(
    onProgress: ((progress: ExportProgress) => void) | undefined,
    progress: ExportProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  private renderMarkdownToHTML(markdown: string): string {
    if (!markdown) {
      return '';
    }

    // Simple markdown to HTML conversion for demonstration
    // In a real application, you'd use a proper markdown-to-HTML library
    const html = markdown
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
      .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
      .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
      .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gm, '<em>$1</em>')
      .replace(/`(.*)`/gm, '<code>$1</code>')
      .replace(/\n\n/gm, '</p><p>')
      .replace(/\n/gm, '<br>')
      .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');

    return html;
  }
} 