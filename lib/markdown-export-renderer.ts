/**
 * Markdown Export Renderer
 * Generates structured markdown with metadata for RAG system integration
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

export class MarkdownExportRenderer implements ExportRenderer {
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
        total: presentation.slides.length + 1,
        stage: 'preparing',
        message: 'Preparing markdown export...',
        percentage: 0
      });

      // Generate markdown content
      const markdownContent = await this.generateMarkdownContent(
        presentation,
        allIssues,
        upcomingIssues,
        sprintMetrics,
        options,
        onProgress
      );

      // Create blob
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const fileName = this.generateFileName(presentation);

      // Update progress
      this.updateProgress(onProgress, {
        current: presentation.slides.length + 1,
        total: presentation.slides.length + 1,
        stage: 'finalizing',
        message: 'Finalizing markdown export...',
        percentage: 100
      });

      return {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'markdown',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: Date.now() - startTime,
          quality: options.quality || 'medium'
        }
      };

    } catch (error) {
      console.error('❌ Markdown export failed:', error);
      throw new Error(`Markdown export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateMarkdownContent(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    let markdown = '';

    // Add metadata header
    markdown += this.generateMetadataHeader(presentation, sprintMetrics);

    // Add executive summary
    markdown += this.generateExecutiveSummary(presentation, sprintMetrics, allIssues);

    // Add sprint overview
    markdown += this.generateSprintOverview(presentation, sprintMetrics, allIssues);

    // Add slides content
    markdown += await this.generateSlidesContent(
      presentation.slides,
      allIssues,
      upcomingIssues,
      sprintMetrics,
      options,
      onProgress
    );

    // Add detailed issue breakdown
    markdown += this.generateIssueBreakdown(allIssues, upcomingIssues);

    // Add metrics analysis
    if (sprintMetrics) {
      markdown += this.generateMetricsAnalysis(sprintMetrics, allIssues);
    }

    // Add footer
    markdown += this.generateFooter(presentation);

    return markdown;
  }

  private generateMetadataHeader(
    presentation: GeneratedPresentation,
    sprintMetrics: SprintMetrics | null | undefined
  ): string {
    const timestamp = new Date().toISOString();
    const generatedDate = new Date(presentation.createdAt).toLocaleDateString();

    return `---
title: "${presentation.title}"
sprint: "${presentation.metadata.sprintName}"
generated: "${timestamp}"
created: "${generatedDate}"
total_slides: ${presentation.metadata.totalSlides}
demo_stories_count: ${presentation.metadata.demoStoriesCount}
custom_slides_count: ${presentation.metadata.customSlidesCount}
has_metrics: ${presentation.metadata.hasMetrics}
sprint_number: "${sprintMetrics?.sprintNumber || 'N/A'}"
completed_points: ${sprintMetrics?.completedTotalPoints || 0}
estimated_points: ${sprintMetrics?.estimatedPoints || 0}
test_coverage: ${sprintMetrics?.testCoverage || 0}
format: "markdown"
version: "1.0"
---

# ${presentation.title}

**Generated:** ${generatedDate}  
**Sprint:** ${presentation.metadata.sprintName}  
**Total Slides:** ${presentation.metadata.totalSlides}

---

`;
  }

  private generateExecutiveSummary(
    presentation: GeneratedPresentation,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[]
  ): string {
    const completedIssues = allIssues.filter(issue => issue.status.toLowerCase().includes('done'));
    const totalStoryPoints = allIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const completedStoryPoints = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const velocity = sprintMetrics ? (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints * 100) : 0;

    return `## Executive Summary

### Key Metrics
- **Sprint Velocity:** ${velocity.toFixed(1)}% (${completedStoryPoints}/${totalStoryPoints} story points)
- **Completed Issues:** ${completedIssues.length}/${allIssues.length} (${((completedIssues.length / allIssues.length) * 100).toFixed(1)}%)
- **Test Coverage:** ${sprintMetrics?.testCoverage || 0}%
- **Demo Stories:** ${presentation.metadata.demoStoriesCount}

### Sprint Performance
${this.getSprintPerformanceSummary(sprintMetrics, allIssues)}

### Business Impact
${this.getBusinessImpactSummary(allIssues)}

---

`;
  }

  private generateSprintOverview(
    presentation: GeneratedPresentation,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[]
  ): string {
    const epicBreakdown = this.getEpicBreakdown(allIssues);
    const issueTypeBreakdown = this.getIssueTypeBreakdown(allIssues);

    return `## Sprint Overview

### Epic Breakdown
${epicBreakdown}

### Issue Type Distribution
${issueTypeBreakdown}

### Team Performance
${this.getTeamPerformanceSummary(allIssues)}

---

`;
  }

  private async generateSlidesContent(
    slides: PresentationSlide[],
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    let slidesContent = '## Presentation Content\n\n';

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // Update progress
      this.updateProgress(onProgress, {
        current: i + 1,
        total: slides.length + 1,
        stage: 'rendering',
        message: `Rendering slide ${i + 1} of ${slides.length}...`,
        percentage: Math.round(((i + 1) / (slides.length + 1)) * 100)
      });

      slidesContent += this.renderSlideMarkdown(slide, allIssues, upcomingIssues, sprintMetrics, i + 1);
    }

    return slidesContent;
  }

  private renderSlideMarkdown(
    slide: PresentationSlide,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    slideNumber: number
  ): string {
    let markdown = `### Slide ${slideNumber}: ${slide.title}\n\n`;

    switch (slide.type) {
      case 'title':
        markdown += this.renderTitleSlideMarkdown(slide);
        break;
      case 'summary':
        markdown += this.renderSummarySlideMarkdown(slide);
        break;
      case 'metrics':
        markdown += this.renderMetricsSlideMarkdown(slide, sprintMetrics, allIssues);
        break;
      case 'demo-story':
        markdown += this.renderDemoStorySlideMarkdown(slide, allIssues);
        break;
      case 'corporate':
        markdown += this.renderCorporateSlideMarkdown(slide);
        break;
      default:
        markdown += this.renderDefaultSlideMarkdown(slide);
    }

    markdown += '\n---\n\n';
    return markdown;
  }

  private renderTitleSlideMarkdown(slide: PresentationSlide): string {
    return `**Slide Type:** Title Slide

${slide.title}

Welcome to the Sprint Review Presentation.

`;
  }

  private renderSummarySlideMarkdown(slide: PresentationSlide): string {
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content);
    return `**Slide Type:** Summary Slide

${content}

`;
  }

  private renderMetricsSlideMarkdown(
    slide: PresentationSlide,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[]
  ): string {
    if (!sprintMetrics) {
      return `**Slide Type:** Metrics Slide

No metrics available for this sprint.

`;
    }

    return `**Slide Type:** Metrics Slide

### Key Performance Indicators
- **Completed Story Points:** ${sprintMetrics.completedTotalPoints}/${sprintMetrics.estimatedPoints}
- **Velocity Achievement:** ${((sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100).toFixed(1)}%
- **Test Coverage:** ${sprintMetrics.testCoverage}%
- **Planned Items:** ${sprintMetrics.plannedItems}

### Quality Metrics
${this.formatQualityChecklist(sprintMetrics.qualityChecklist)}

`;
  }

  private renderDemoStorySlideMarkdown(slide: PresentationSlide, allIssues: Issue[]): string {
    const issue = allIssues.find(i => i.id === slide.storyId);
    if (!issue) {
      return `**Slide Type:** Demo Story Slide

Story not found.

`;
    }

    const content = typeof slide.content === 'string' ? slide.content : 'No content available';

    return `**Slide Type:** Demo Story Slide

### Story Details
- **Issue Key:** ${issue.key}
- **Summary:** ${issue.summary}
- **Assignee:** ${issue.assignee || 'Unassigned'}
- **Story Points:** ${issue.storyPoints || 'Not estimated'}
- **Status:** ${issue.status}
- **Epic:** ${issue.epicName || 'No epic'}
${issue.releaseNotes ? `- **Release Notes:** ${issue.releaseNotes}` : ''}

### Story Content
${content}

`;
  }

  private renderCorporateSlideMarkdown(slide: PresentationSlide): string {
    return `**Slide Type:** Corporate Slide

${slide.corporateSlideUrl ? `Corporate slide image: ${slide.corporateSlideUrl}` : 'No corporate slide image available'}

`;
  }

  private renderDefaultSlideMarkdown(slide: PresentationSlide): string {
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content);
    return `**Slide Type:** Custom Slide

${content}

`;
  }

  private generateIssueBreakdown(allIssues: Issue[], upcomingIssues: Issue[]): string {
    return `## Detailed Issue Breakdown

### Completed Issues
${this.formatIssuesList(allIssues.filter(issue => issue.status.toLowerCase().includes('done')))}

### In Progress Issues
${this.formatIssuesList(allIssues.filter(issue => !issue.status.toLowerCase().includes('done')))}

### Upcoming Issues
${this.formatIssuesList(upcomingIssues)}

`;
  }

  private generateMetricsAnalysis(sprintMetrics: SprintMetrics, allIssues: Issue[]): string {
    const velocity = (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100;
    const efficiencyScore = this.calculateEfficiencyScore(sprintMetrics, allIssues);

    return `## Metrics Analysis

### Velocity Analysis
- **Target Velocity:** ${sprintMetrics.estimatedPoints} story points
- **Actual Velocity:** ${sprintMetrics.completedTotalPoints} story points
- **Velocity Achievement:** ${velocity.toFixed(1)}%
- **Efficiency Score:** ${efficiencyScore.toFixed(1)}%

### Quality Analysis
${this.analyzeQualityMetrics(sprintMetrics)}

### Recommendations
${this.generateRecommendations(sprintMetrics, allIssues)}

`;
  }

  private generateFooter(presentation: GeneratedPresentation): string {
    return `## Document Information

This document was automatically generated by the Sprint Review Deck Generator.

**Document ID:** ${presentation.id}  
**Generated:** ${new Date().toISOString()}  
**Version:** 1.0

---

*End of Sprint Review Document*
`;
  }

  // Helper methods

  private getSprintPerformanceSummary(sprintMetrics: SprintMetrics | null | undefined, allIssues: Issue[]): string {
    if (!sprintMetrics) return 'No metrics available for this sprint.';

    const velocity = (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100;
    const status = velocity >= 90 ? 'Excellent' : velocity >= 75 ? 'Good' : velocity >= 60 ? 'Fair' : 'Needs Improvement';

    return `- **Performance Status:** ${status}
- **Velocity:** ${velocity.toFixed(1)}%
- **Test Coverage:** ${sprintMetrics.testCoverage}%
- **Quality Score:** ${this.calculateQualityScore(sprintMetrics)}%`;
  }

  private getBusinessImpactSummary(allIssues: Issue[]): string {
    const completedIssues = allIssues.filter(issue => issue.status.toLowerCase().includes('done'));
    const highValueIssues = completedIssues.filter(issue => (issue.storyPoints || 0) >= 8);

    return `- **High-Value Deliverables:** ${highValueIssues.length} issues
- **User Stories Completed:** ${completedIssues.filter(issue => issue.issueType === 'Story').length}
- **Bug Fixes:** ${completedIssues.filter(issue => issue.issueType === 'Bug').length}
- **Technical Debt:** ${completedIssues.filter(issue => issue.issueType === 'Technical task').length}`;
  }

  private getEpicBreakdown(allIssues: Issue[]): string {
    const epicGroups = new Map<string, Issue[]>();
    
    allIssues.forEach(issue => {
      const epic = issue.epicName || 'No Epic';
      if (!epicGroups.has(epic)) {
        epicGroups.set(epic, []);
      }
      epicGroups.get(epic)!.push(issue);
    });

    let breakdown = '';
    epicGroups.forEach((issues, epic) => {
      const completed = issues.filter(issue => issue.status.toLowerCase().includes('done')).length;
      const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      breakdown += `- **${epic}:** ${completed}/${issues.length} issues (${totalPoints} points)\n`;
    });

    return breakdown || 'No epic breakdown available.';
  }

  private getIssueTypeBreakdown(allIssues: Issue[]): string {
    const typeGroups = new Map<string, Issue[]>();
    
    allIssues.forEach(issue => {
      const type = issue.issueType;
      if (!typeGroups.has(type)) {
        typeGroups.set(type, []);
      }
      typeGroups.get(type)!.push(issue);
    });

    let breakdown = '';
    typeGroups.forEach((issues, type) => {
      const completed = issues.filter(issue => issue.status.toLowerCase().includes('done')).length;
      breakdown += `- **${type}:** ${completed}/${issues.length} issues\n`;
    });

    return breakdown;
  }

  private getTeamPerformanceSummary(allIssues: Issue[]): string {
    const assigneeGroups = new Map<string, Issue[]>();
    
    allIssues.forEach(issue => {
      const assignee = issue.assignee || 'Unassigned';
      if (!assigneeGroups.has(assignee)) {
        assigneeGroups.set(assignee, []);
      }
      assigneeGroups.get(assignee)!.push(issue);
    });

    let summary = '';
    assigneeGroups.forEach((issues, assignee) => {
      const completed = issues.filter(issue => issue.status.toLowerCase().includes('done')).length;
      const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      summary += `- **${assignee}:** ${completed}/${issues.length} issues (${totalPoints} points)\n`;
    });

    return summary;
  }

  private formatIssuesList(issues: Issue[]): string {
    if (issues.length === 0) return 'No issues in this category.\n\n';

    let formatted = '';
    issues.forEach(issue => {
      formatted += `- **${issue.key}:** ${issue.summary} (${issue.storyPoints || 0} points, ${issue.status})\n`;
    });
    formatted += '\n';

    return formatted;
  }

  private formatQualityChecklist(checklist: Record<string, "yes" | "no" | "partial" | "na">): string {
    let formatted = '';
    Object.entries(checklist).forEach(([item, status]) => {
      const statusIcon = status === 'yes' ? '✅' : status === 'partial' ? '⚠️' : status === 'no' ? '❌' : '➖';
      formatted += `- ${statusIcon} **${item}:** ${status.toUpperCase()}\n`;
    });
    return formatted;
  }

  private calculateEfficiencyScore(sprintMetrics: SprintMetrics, allIssues: Issue[]): number {
    const velocity = (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100;
    const qualityScore = this.calculateQualityScore(sprintMetrics);
    const completionRate = (allIssues.filter(issue => issue.status.toLowerCase().includes('done')).length / allIssues.length) * 100;
    
    return (velocity * 0.4 + qualityScore * 0.3 + completionRate * 0.3);
  }

  private calculateQualityScore(sprintMetrics: SprintMetrics): number {
    const checklist = sprintMetrics.qualityChecklist;
    const totalItems = Object.keys(checklist).length;
    const yesCount = Object.values(checklist).filter(status => status === 'yes').length;
    const partialCount = Object.values(checklist).filter(status => status === 'partial').length;
    
    return ((yesCount + (partialCount * 0.5)) / totalItems) * 100;
  }

  private analyzeQualityMetrics(sprintMetrics: SprintMetrics): string {
    const qualityScore = this.calculateQualityScore(sprintMetrics);
    const testCoverage = sprintMetrics.testCoverage;

    let analysis = '';
    analysis += `- **Overall Quality Score:** ${qualityScore.toFixed(1)}%\n`;
    analysis += `- **Test Coverage:** ${testCoverage}%\n`;
    
    if (qualityScore >= 80) {
      analysis += '- **Quality Status:** Excellent - High standards maintained\n';
    } else if (qualityScore >= 60) {
      analysis += '- **Quality Status:** Good - Minor improvements needed\n';
    } else {
      analysis += '- **Quality Status:** Needs Improvement - Focus on quality required\n';
    }

    return analysis;
  }

  private generateRecommendations(sprintMetrics: SprintMetrics, allIssues: Issue[]): string {
    const velocity = (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100;
    const qualityScore = this.calculateQualityScore(sprintMetrics);
    const recommendations: string[] = [];

    if (velocity < 75) {
      recommendations.push('Consider reducing sprint scope or improving estimation accuracy');
    }
    if (qualityScore < 70) {
      recommendations.push('Implement additional quality gates and review processes');
    }
    if (sprintMetrics.testCoverage < 80) {
      recommendations.push('Increase test coverage through additional unit and integration tests');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue current practices - performance is on track');
    }

    return recommendations.map(rec => `- ${rec}`).join('\n');
  }

  private generateFileName(presentation: GeneratedPresentation): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sprintName = presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Sprint_Review_${sprintName}_${timestamp}.md`;
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