import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ExportRenderer, 
  ExportResult, 
  ExportProgress, 
  ExportOptions,
  GeneratedPresentation,
  Issue,
  SprintMetrics
} from './export-service';
import * as fs from 'fs';
import * as path from 'path';
import { ChartGenerator, SprintChartData, VelocityChartData } from './chart-generator';
import { isIssueCompleted } from './utils'

const COLORS = {
  brandBlue: [21, 44, 83],
  brandOrange: [221, 79, 38],
  grayText: [100, 100, 100]
};

const FONT_SIZES = {
  title: 20,
  sectionHeader: 16,
  body: 11,
  small: 8,
  table: 10
};

// AI Prompt Templates
const AI_PROMPTS = {
  executiveSummary: `
You are a senior project manager creating an executive summary for a sprint review digest.

Context:
- Sprint: {sprintName}
- Project: {projectName}
- Team Performance: {teamPerformance}
- Key Metrics: {keyMetrics}

Create a compelling 2-3 paragraph executive summary that includes:
1. Key achievements and business impact
2. Sprint health and velocity insights
3. Risk assessment and mitigation
4. Strategic alignment with business goals

Tone: Professional, data-driven, business-focused
Focus on business value and strategic impact.
`,

  demoStoryContent: `
You are a technical writer creating demo story content for an executive audience.

Story Context:
- Issue Key: {issueKey}
- Summary: {issueSummary}
- Assignee: {assignee}
- Story Points: {storyPoints}
- Status: {status}
- Content: {content}
- Screenshot Available: {hasScreenshot}

Create compelling content that:
1. Explains the business value and user impact
2. Highlights technical achievements
3. Connects to strategic objectives
4. Uses the screenshot context if available
5. Maintains executive-level readability

Tone: Professional, technical but accessible
Length: 2-3 paragraphs
`,

  sprintAnalysis: `
You are a senior project manager analyzing sprint performance.

Sprint Data:
- Sprint: {sprintName}
- Metrics: {metrics}
- Issues: {issues}
- Velocity: {velocity}
- Quality: {quality}

Provide insights on:
1. Velocity trends and capacity analysis
2. Quality metrics and technical debt assessment
3. Team collaboration and process effectiveness
4. Risk factors and mitigation strategies
5. Recommendations for improvement

Tone: Analytical, data-driven, actionable
Focus on trends, patterns, and actionable insights.
`,

  strategicInsights: `
You are a strategic advisor providing insights for upcoming sprint planning.

Context:
- Current Sprint: {currentSprint}
- Upcoming Issues: {upcomingIssues}
- Team Capacity: {teamCapacity}
- Strategic Goals: {strategicGoals}

Provide strategic insights on:
1. Priority alignment and resource allocation
2. Risk assessment and dependency management
3. Capacity planning and team scaling
4. Strategic initiatives and business impact
5. Recommendations for executive decisions

Tone: Strategic, forward-looking, decision-focused
Focus on business impact and strategic alignment.
`,

  actionItems: `
You are a senior project manager creating action items and recommendations.

Sprint Context:
- Performance: {performance}
- Issues: {issues}
- Metrics: {metrics}
- Team Feedback: {teamFeedback}

Generate actionable recommendations for:
1. Executive decisions needed
2. Process improvements
3. Resource allocation requests
4. Risk mitigation actions
5. Strategic initiatives

Format each item as:
- Action: [Specific action needed]
- Owner: [Who should take action]
- Timeline: [When action is needed]
- Impact: [Business impact of action]

Tone: Actionable, specific, business-focused
Focus on concrete next steps and decisions.
`
};

export class AdvancedDigestExportRenderer implements ExportRenderer {
  private contentCache: Map<string, string> = new Map();
  private chartCache: Map<string, Buffer> = new Map();
  async render(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void,
    demoStoryScreenshots?: Record<string, string>,
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
      this.updateProgress(onProgress, {
        current: 0,
        total: 100,
        stage: 'preparing',
        message: 'Preparing advanced digest export...',
        percentage: 0
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      await this.addCompanyLogo(doc);

      await this.generateAdvancedDigestContent(
        doc,
        presentation,
        allIssues,
        upcomingIssues,
        sprintMetrics,
        options,
        onProgress,
        demoStoryScreenshots,
        additionalData
      );

      const pdfBlob = doc.output('blob');
      const fileName = this.generateFileName(presentation);

      this.updateProgress(onProgress, {
        current: 100,
        total: 100,
        stage: 'finalizing',
        message: 'Finalizing advanced digest export...',
        percentage: 100
      });

      return {
        blob: pdfBlob,
        fileName,
        fileSize: pdfBlob.size,
        format: 'pdf',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: Date.now() - startTime,
          quality: options.quality || 'medium'
        }
      };
    } catch (error) {
      console.error('❌ Advanced Digest export failed:', error);
      throw new Error(`Advanced Digest export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getLogoBase64(): Promise<string | null> {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'company-logos', 'CommandAlkon_Logo_Primary_Inverted.png');
      const imageBuffer = fs.readFileSync(logoPath);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Could not read logo file:', error);
      return null;
    }
  }

  private async addCompanyLogo(doc: jsPDF): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(
      COLORS.brandBlue[0],
      COLORS.brandBlue[1],
      COLORS.brandBlue[2]
    );
    doc.rect(0, 0, pageWidth, 35, 'F');

    const logoBase64 = await this.getLogoBase64();
    const logoX = 20, logoY = 8, logoWidth = 60, logoHeight = 20;

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Advanced Sprint Review Digest', logoX + logoWidth + 15, logoY + 10);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Command Alkon', logoX, logoY + 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Advanced Sprint Review Digest', logoX + 120, logoY + 12);
    }
  }

  private async generateAdvancedDigestContent(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void,
    demoStoryScreenshots?: Record<string, string>,
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
  ): Promise<void> {
    let yPosition = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Update progress
    this.updateProgress(onProgress, { 
      stage: 'processing', 
      current: 0,
      total: 100,
      percentage: 0,
      message: 'Generating table of contents...' 
    });

    // Add table of contents for longer digests
    const totalPages = this.estimateTotalPages(presentation, allIssues, sprintMetrics);
    if (totalPages > 3) {
      yPosition = this.addTableOfContents(doc, yPosition, margin, contentWidth);
    }

    this.updateProgress(onProgress, { 
      stage: 'processing', 
      current: 10,
      total: 100,
      percentage: 10,
      message: 'Adding current sprint summary...' 
    });
    
    // Add current sprint summary if available
    if (additionalData?.summaries?.currentSprint) {
      yPosition = await this.addSprintSummary(doc, additionalData.summaries.currentSprint, yPosition, margin, contentWidth);
    }
    
    this.updateProgress(onProgress, { 
      stage: 'processing', 
      current: 40,
      total: 100,
      percentage: 40,
      message: 'Adding detailed demos...' 
    });
    
    yPosition = await this.addDetailedDemos(doc, presentation, allIssues, yPosition, margin, contentWidth, demoStoryScreenshots, additionalData);
    
    this.updateProgress(onProgress, { 
      stage: 'processing', 
      current: 80,
      total: 100,
      percentage: 80,
      message: 'Adding upcoming sprint...' 
    });
    
    // Add upcoming sprint summary if available
    if (additionalData?.summaries?.upcomingSprint) {
      yPosition = await this.addUpcomingSprintSummary(doc, additionalData.summaries.upcomingSprint, yPosition, margin, contentWidth);
    }
    
    this.updateProgress(onProgress, { 
      stage: 'processing', 
      current: 90,
      total: 100,
      percentage: 90,
      message: 'Finalizing document...' 
    });

    this.updateProgress(onProgress, { 
      stage: 'finalizing', 
      current: 100,
      total: 100,
      percentage: 100,
      message: 'Finalizing document...' 
    });

    this.addFooter(doc, presentation);
  }



  private async addDetailedDemos(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    yPosition: number,
    margin: number,
    contentWidth: number,
    demoStoryScreenshots?: Record<string, string>,
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
  ): Promise<number> {
    const demoImages = this.extractDemoImages(presentation, allIssues, demoStoryScreenshots);
    const demoStorySlides = presentation.slides.filter(slide => slide.type === 'demo-story');
    const pageHeight = doc.internal.pageSize.getHeight();
    
    if (demoStorySlides.length === 0) {
      doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
      doc.setFontSize(FONT_SIZES.sectionHeader);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Demos', margin, yPosition);
      
      yPosition += 15;
      
      doc.setTextColor(COLORS.grayText[0], COLORS.grayText[1], COLORS.grayText[2]);
      doc.setFontSize(FONT_SIZES.body);
      doc.setFont('helvetica', 'normal');
      doc.text('No demo stories available for this sprint.', margin, yPosition);
      
      return yPosition + 20;
    }

    // Section header
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Demos', margin, yPosition);
    
    yPosition += 15;

    for (const slide of demoStorySlides) {
      const issue = allIssues.find(i => i.id === slide.storyId);
      if (!issue) continue;

      // Check if we need a page break before starting a new story
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 40;
      }

      // Story header - concise title
      doc.setTextColor(COLORS.brandOrange[0], COLORS.brandOrange[1], COLORS.brandOrange[2]);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      
      const storyTitle = `${issue.key}: ${issue.summary}`;
      const titleLines = doc.splitTextToSize(storyTitle, contentWidth);
      
      doc.text(titleLines, margin, yPosition);
      yPosition += (titleLines.length * 5) + 8;

      // Get AI-generated summary if available - use concise version
      const demoSummary = additionalData?.summaries?.demoStories?.[slide.storyId || ''] || '';
      
      // Generate concise AI content for this story
      const aiContent = await this.generateAIContent('demoStoryContent', {
        issueKey: issue.key,
        issueSummary: issue.summary,
        assignee: issue.assignee || 'Unassigned',
        storyPoints: issue.storyPoints || 'Not estimated',
        status: issue.status,
        content: demoSummary || (typeof slide.content === 'string' ? slide.content : 'No content available'),
        hasScreenshot: demoImages.has(slide.storyId || '')
      });

      // Add concise AI-generated content with markdown rendering
      yPosition = this.renderMarkdownContent(doc, aiContent, yPosition, margin, contentWidth);
      
      yPosition += 8;

      // Add screenshot if available - smaller size for better flow
      const screenshot = demoImages.get(slide.storyId || '');
      if (screenshot && this.isValidImageData(screenshot)) {
        try {
          const imageWidth = 60; // Smaller image
          const imageHeight = 45;
          
          // Check if image fits on current page
          if (yPosition + imageHeight > pageHeight - 50) {
            doc.addPage();
            yPosition = 40;
          }
          
          // Determine image format and add accordingly
          const imageFormat = this.getImageFormat(screenshot);
          doc.addImage(screenshot, imageFormat, margin, yPosition, imageWidth, imageHeight);
          yPosition += imageHeight + 10; // Less spacing
        } catch (error) {
          console.warn('Failed to add screenshot:', error);
          // Continue without the image
        }
      }
    }
    
    return yPosition;
  }

  private async addSprintAnalysis(
    doc: jsPDF,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[],
    yPosition: number,
    margin: number,
    contentWidth: number,
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
  ): Promise<number> {
    // Generate AI content
    const velocity = sprintMetrics ? `${sprintMetrics.completedTotalPoints} story points` : 'not available';
    const quality = sprintMetrics ? `${sprintMetrics.testCoverage}% test coverage` : 'not available';
    
    const aiContent = await this.generateAIContent('sprintAnalysis', {
      sprintName: 'Current Sprint',
      metrics: sprintMetrics ? JSON.stringify(sprintMetrics) : 'not available',
      issues: `${allIssues.length} total issues`,
      velocity,
      quality
    });

    // Add section header
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprint Performance Analysis', margin, yPosition);
    
    yPosition += 15;
    
    // Add AI-generated content with markdown rendering
    yPosition = this.renderMarkdownContent(doc, aiContent, yPosition, margin, contentWidth);
    
    yPosition += 20;

    // Add upcoming sprint summary if available
    if (additionalData?.summaries?.upcomingSprint) {
      yPosition = await this.addUpcomingSprintSummary(doc, additionalData.summaries.upcomingSprint, yPosition, margin, contentWidth);
    }
    
    return yPosition;
  }

  private async addSprintSummary(
    doc: jsPDF,
    sprintSummary: string,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a page break
    if (yPosition > pageHeight - 150) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Add section header
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprint Summary', margin, yPosition);
    yPosition += 15;
    
    // Add description
    doc.setTextColor(COLORS.grayText[0], COLORS.grayText[1], COLORS.grayText[2]);
    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    doc.text('AI-generated summary of the current sprint performance and achievements', margin, yPosition);
    yPosition += 15;
    
    // Add sprint content with markdown rendering
    yPosition = this.renderMarkdownContent(doc, sprintSummary, yPosition, margin, contentWidth);
    
    return yPosition + 20;
  }

  private async addUpcomingSprintSummary(
    doc: jsPDF,
    upcomingSprintSummary: string,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a page break
    if (yPosition > pageHeight - 150) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Add section header
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Upcoming Sprint Summary', margin, yPosition);
    yPosition += 15;
    
    // Add description
    doc.setTextColor(COLORS.grayText[0], COLORS.grayText[1], COLORS.grayText[2]);
    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    doc.text('AI-generated summary of the upcoming sprint planning and objectives', margin, yPosition);
    yPosition += 15;
    
    // Add upcoming sprint content with markdown rendering
    yPosition = this.renderMarkdownContent(doc, upcomingSprintSummary, yPosition, margin, contentWidth);
    
    return yPosition + 20;
  }

  private renderMarkdownContent(
    doc: jsPDF,
    markdownContent: string,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = yPosition;
    
    // Split content into lines
    const lines = markdownContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we need a page break
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 40;
      }
      
      // Handle different markdown elements
      if (line.startsWith('### ')) {
        // Level 3 heading
        const headingText = line.substring(4);
        doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
        doc.setFontSize(FONT_SIZES.sectionHeader);
        doc.setFont('helvetica', 'bold');
        
        const headingLines = doc.splitTextToSize(headingText, contentWidth);
        doc.text(headingLines, margin, currentY);
        currentY += (headingLines.length * 6) + 8;
        
      } else if (line.startsWith('- **') && line.includes(':**')) {
        // Bold list item with colon
        const parts = line.split(':**');
        const boldPart = parts[0].substring(4); // Remove "- **"
        const regularPart = parts.slice(1).join(':**');
        
        // Render bold part
        doc.setTextColor(COLORS.brandOrange[0], COLORS.brandOrange[1], COLORS.brandOrange[2]);
        doc.setFontSize(FONT_SIZES.body);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${boldPart}:`, margin, currentY);
        
        // Calculate position for regular text
        const boldWidth = doc.getTextWidth(`• ${boldPart}:`);
        const regularX = margin + boldWidth + 2;
        
        // Render regular part
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const regularLines = doc.splitTextToSize(regularPart, contentWidth - boldWidth - 2);
        doc.text(regularLines, regularX, currentY);
        currentY += (regularLines.length * 5) + 8;
        
      } else if (line.startsWith('- ')) {
        // Regular list item
        const listText = line.substring(2);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(FONT_SIZES.body);
        doc.setFont('helvetica', 'normal');
        
        const listLines = doc.splitTextToSize(`• ${listText}`, contentWidth);
        doc.text(listLines, margin, currentY);
        currentY += (listLines.length * 5) + 4;
        
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        const boldText = line.substring(2, line.length - 2);
        doc.setTextColor(COLORS.brandOrange[0], COLORS.brandOrange[1], COLORS.brandOrange[2]);
        doc.setFontSize(FONT_SIZES.body);
        doc.setFont('helvetica', 'bold');
        
        const boldLines = doc.splitTextToSize(boldText, contentWidth);
        doc.text(boldLines, margin, currentY);
        currentY += (boldLines.length * 5) + 4;
        
      } else if (line.length > 0) {
        // Regular paragraph text
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(FONT_SIZES.body);
        doc.setFont('helvetica', 'normal');
        
        const textLines = doc.splitTextToSize(line, contentWidth);
        doc.text(textLines, margin, currentY);
        currentY += (textLines.length * 5) + 4;
        
      } else {
        // Empty line - add spacing
        currentY += 6;
      }
    }
    
    return currentY;
  }

  private async addSprintComparison(
    doc: jsPDF,
    sprintComparison: any,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a page break
    if (yPosition > pageHeight - 150) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Add section header
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprint Comparison & Trends', margin, yPosition);
    yPosition += 15;
    
    // Add comparison metrics
    if (sprintComparison.comparisonMetrics) {
      const metrics = sprintComparison.comparisonMetrics;
      const metricItems = [
        { label: 'Velocity Trend', value: metrics.velocityTrend, color: metrics.velocityTrend >= 0 ? [16, 185, 129] : [239, 68, 68] },
        { label: 'Quality Trend', value: metrics.qualityTrend, color: metrics.qualityTrend >= 0 ? [16, 185, 129] : [239, 68, 68] },
        { label: 'Completion Trend', value: metrics.completionRateTrend, color: metrics.completionRateTrend >= 0 ? [16, 185, 129] : [239, 68, 68] },
        { label: 'Team Performance', value: metrics.teamPerformanceTrend, color: metrics.teamPerformanceTrend >= 0 ? [16, 185, 129] : [239, 68, 68] }
      ];
      
      // Create comparison box
      const boxWidth = contentWidth;
      const boxHeight = 30;
      
      // Box background
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, yPosition, boxWidth, boxHeight, 'F');
      
      // Box border
      doc.setDrawColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
      doc.rect(margin, yPosition, boxWidth, boxHeight);
      
      // Metrics content
      const metricWidth = boxWidth / metricItems.length;
      const startY = yPosition + 8;
      
      metricItems.forEach((metric, index) => {
        const x = margin + (index * metricWidth) + (metricWidth / 2);
        const trendIcon = metric.value >= 0 ? '↗' : '↘';
        const trendText = `${trendIcon} ${Math.abs(metric.value)}%`;
        
        // Metric value
        doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.setFontSize(FONT_SIZES.body);
        doc.setFont('helvetica', 'bold');
        doc.text(trendText, x, startY, { align: 'center' });
        
        // Metric label
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(FONT_SIZES.small);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, x, startY + 12, { align: 'center' });
      });
      
      yPosition += boxHeight + 15;
    }
    
    return yPosition;
  }







  private async addPerformanceCharts(
    doc: jsPDF,
    sprintMetrics: SprintMetrics,
    allIssues: Issue[],
    yPosition: number,
    margin: number,
    contentWidth: number
  ): Promise<number> {
    try {
      // Check if we need a page break
      const pageHeight = doc.internal.pageSize.getHeight();
      if (yPosition > pageHeight - 150) {
        doc.addPage();
        yPosition = 40;
      }

      // Add charts section header
      doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
      doc.setFontSize(FONT_SIZES.sectionHeader);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Visualizations', margin, yPosition);
      yPosition += 15;

      // Generate epic breakdown chart
      const epicData = this.generateEpicChartData(allIssues);
      if (epicData.labels.length > 0) {
        const epicChartBuffer = await ChartGenerator.generateEpicBreakdownChart(epicData);
        const epicChartBase64 = `data:image/png;base64,${epicChartBuffer.toString('base64')}`;
        
        // Add chart to PDF
        const chartWidth = Math.min(contentWidth, 120);
        const chartHeight = (chartWidth * 0.8);
        doc.addImage(epicChartBase64, 'PNG', margin, yPosition, chartWidth, chartHeight);
        yPosition += chartHeight + 20;
      }

      // Generate team performance radar chart
      const teamData = this.generateTeamPerformanceData(sprintMetrics, allIssues);
      const teamChartBuffer = await ChartGenerator.generateTeamPerformanceChart(teamData);
      const teamChartBase64 = `data:image/png;base64,${teamChartBuffer.toString('base64')}`;
      
      // Add chart to PDF
      const chartWidth = Math.min(contentWidth, 120);
      const chartHeight = (chartWidth * 1.0);
      doc.addImage(teamChartBase64, 'PNG', margin, yPosition, chartWidth, chartHeight);
      yPosition += chartHeight + 20;

    } catch (error) {
      console.warn('Failed to generate charts:', error);
      // Continue without charts if generation fails
    }

    return yPosition;
  }

  private generateEpicChartData(allIssues: Issue[]): SprintChartData {
    const epicMap = new Map<string, number>();
    
    allIssues.forEach(issue => {
      const epicName = issue.epicName || 'No Epic';
      const points = issue.storyPoints || 0;
      epicMap.set(epicName, (epicMap.get(epicName) || 0) + points);
    });

    const labels = Array.from(epicMap.keys());
    const data = Array.from(epicMap.values());

    return {
      labels,
      datasets: [{
        label: 'Story Points by Epic',
        data
      }]
    };
  }

  private generateTeamPerformanceData(sprintMetrics: SprintMetrics, allIssues: Issue[]): SprintChartData {
    const completedIssues = allIssues.filter(issue => 
      isIssueCompleted(issue.status)
    ).length;
    const completionRate = allIssues.length > 0 ? (completedIssues / allIssues.length) * 100 : 0;
    const velocityRate = sprintMetrics.estimatedPoints > 0 ? 
      (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100 : 0;

    return {
      labels: ['Velocity', 'Completion Rate', 'Quality', 'Team Collaboration', 'Process Efficiency'],
      datasets: [{
        label: 'Team Performance',
        data: [
          Math.min(velocityRate, 100),
          completionRate,
          sprintMetrics.testCoverage,
          85, // Placeholder for team collaboration
          90  // Placeholder for process efficiency
        ]
      }]
    };
  }

  private async addStrategicInsights(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    upcomingIssues: Issue[],
    yPosition: number,
    margin: number,
    contentWidth: number
  ): Promise<number> {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a page break before section
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Generate AI content
    const teamCapacity = upcomingIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    
    const aiContent = await this.generateAIContent('strategicInsights', {
      currentSprint: presentation.metadata.sprintName,
      upcomingIssues: `${upcomingIssues.length} issues planned`,
      teamCapacity: `${teamCapacity} story points`,
      strategicGoals: 'Business objectives and user value delivery'
    });

    // Add section header
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Strategic Insights', margin, yPosition);
    
    yPosition += 15;
    
    // Add AI-generated content with overflow protection
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(aiContent, contentWidth);
    
    // Process content line by line with page break handling
    let currentY = yPosition;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we need a page break
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 40;
      }
      
      doc.text(line, margin, currentY);
      currentY += 5;
    }
    
    return currentY + 20;
  }

  private addActionItems(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a page break before section
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Generate AI content for action items
    const aiContent = this.generateActionItemsContent({
      sprintName: presentation.metadata.sprintName,
      issues: allIssues
    });
    
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Items & Recommendations', margin, yPosition);
    
    yPosition += 15;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(aiContent, contentWidth);
    
    // Process content line by line with page break handling
    let currentY = yPosition;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we need a page break
      if (currentY > pageHeight - 50) {
        doc.addPage();
        currentY = 40;
      }
      
      doc.text(line, margin, currentY);
      currentY += 5;
    }
    
    return currentY + 20;
  }

  private addFooter(doc: jsPDF, presentation: GeneratedPresentation): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
      
      // Footer text
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by Advanced Sprint Review Generator | ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    }
  }

  private async generateAIContent(
    promptType: keyof typeof AI_PROMPTS,
    context: Record<string, any>
  ): Promise<string> {
    try {
      // Check cache first for performance optimization
      const cacheKey = this.generateCacheKey(promptType, context);
      if (this.contentCache.has(cacheKey)) {
        return this.contentCache.get(cacheKey)!;
      }

      // For now, we'll use a simple template-based approach
      // In a production environment, this would call an AI API
      let prompt = AI_PROMPTS[promptType];
      
      // Replace placeholders with actual context
      Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
      
      // Simple content generation based on prompt type
      let generatedContent: string;
      switch (promptType) {
        case 'executiveSummary':
          generatedContent = this.generateExecutiveSummaryContent(context);
          break;
        case 'demoStoryContent':
          generatedContent = this.generateDemoStoryContent(context);
          break;
        case 'sprintAnalysis':
          generatedContent = this.generateSprintAnalysisContent(context);
          break;
        case 'strategicInsights':
          generatedContent = this.generateStrategicInsightsContent(context);
          break;
        case 'actionItems':
          generatedContent = this.generateActionItemsContent(context);
          break;
        default:
          generatedContent = 'AI content generation will be implemented in production.';
      }

      // Cache the generated content for future use
      this.contentCache.set(cacheKey, generatedContent);
      return generatedContent;
    } catch (error) {
      console.warn('AI content generation failed:', error);
      return 'Content generation temporarily unavailable.';
    }
  }

  private generateExecutiveSummaryContent(context: Record<string, any>): string {
    const { sprintName, projectName, teamPerformance, keyMetrics } = context;
    
    return `The ${sprintName} sprint for ${projectName} demonstrated strong team performance with ${teamPerformance}. Key achievements include significant progress on core deliverables and improved velocity metrics.

Sprint health indicators show ${keyMetrics}, reflecting the team's commitment to quality and timely delivery. Risk factors have been effectively managed through proactive communication and adaptive planning.

Strategic alignment remains strong with business objectives, ensuring continued value delivery and stakeholder satisfaction. The team's collaborative approach and technical excellence position us well for upcoming sprint commitments.`;
  }

  private generateDemoStoryContent(context: Record<string, any>): string {
    const { issueKey, issueSummary, assignee, storyPoints, status } = context;
    
    return `**${issueKey}** - ${issueSummary}

This ${storyPoints}-point story was completed by ${assignee} and delivers ${status === 'Done' ? 'successful' : 'ongoing'} implementation of key functionality. The feature enhances user experience and aligns with our technical standards.

**Key Impact:** Improved user workflow and system performance.`;
  }

  private generateSprintAnalysisContent(context: Record<string, any>): string {
    const { sprintName, velocity, quality } = context;
    
    return `Velocity analysis for ${sprintName} shows consistent team performance with ${velocity} story points completed. This demonstrates strong capacity planning and execution capabilities.

Quality metrics indicate ${quality} standards are being maintained, with comprehensive testing and code review processes ensuring high deliverable standards. Technical debt remains manageable through proactive refactoring efforts.

Team collaboration continues to improve, with effective communication channels and knowledge sharing practices. Process effectiveness is evidenced by reduced cycle times and improved predictability in sprint planning.`;
  }

  private generateStrategicInsightsContent(context: Record<string, any>): string {
    const { currentSprint, upcomingIssues, teamCapacity } = context;
    
    return `Building on the success of ${currentSprint}, upcoming sprint planning shows strong alignment with strategic priorities. The team's capacity of ${teamCapacity} story points provides a solid foundation for continued delivery excellence.

Priority alignment ensures that high-value features receive appropriate resource allocation, while dependency management strategies minimize potential blockers. Risk assessment indicates manageable challenges with clear mitigation plans in place.

Strategic initiatives remain on track, with clear business impact metrics and stakeholder alignment. The team's proven delivery capability positions us well for scaling initiatives and meeting ambitious business objectives.`;
  }

  private generateActionItemsContent(context: Record<string, any>): string {
    return `**Executive Decisions Needed:**
- Action: Review and approve resource allocation for upcoming sprint
- Owner: Product Manager
- Timeline: End of current week
- Impact: Ensures optimal team capacity and delivery planning

**Process Improvements:**
- Action: Implement enhanced sprint retrospective process
- Owner: Scrum Master
- Timeline: Next sprint planning
- Impact: Improved team velocity and quality metrics

**Resource Allocation:**
- Action: Allocate additional development resources for critical features
- Owner: Engineering Manager
- Timeline: Immediate
- Impact: Accelerated delivery of high-priority business features`;
  }

  private extractDemoImages(
    presentation: GeneratedPresentation, 
    allIssues: Issue[], 
    demoStoryScreenshots?: Record<string, string>
  ): Map<string, string> {
    const demoImages = new Map<string, string>();
    
    // Look for demo story slides that might have embedded images
    const demoStorySlides = presentation.slides.filter(slide => slide.type === 'demo-story');
    
    demoStorySlides.forEach(slide => {
      if (slide.storyId) {
        // Use real screenshots if available, otherwise fallback to placeholder
        const realScreenshot = demoStoryScreenshots?.[slide.storyId];
        if (realScreenshot) {
          demoImages.set(slide.storyId, realScreenshot);
        } else {
          demoImages.set(slide.storyId, this.getPlaceholderImage());
        }
      }
    });
    
    return demoImages;
  }

  private getPlaceholderImage(): string {
    // Return a simple placeholder image as base64
    // In production, this would be actual screenshots from demo stories
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4NyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gU3RvcnkgU2NyZWVuc2hvdDwvdGV4dD48L3N2Zz4=';
  }

  private isValidImageData(imageData: string): boolean {
    try {
      // Check if it's a valid base64 data URL
      if (!imageData.startsWith('data:image/')) {
        return false;
      }
      
      // Check if the base64 data is not empty
      const base64Data = imageData.split(',')[1];
      if (!base64Data || base64Data.length < 100) {
        return false;
      }
      
      // Try to decode a small portion to validate
      const buffer = Buffer.from(base64Data.substring(0, 100), 'base64');
      return buffer.length > 0;
    } catch (error) {
      return false;
    }
  }

  private getImageFormat(imageData: string): string {
    try {
      // Extract format from data URL
      const match = imageData.match(/data:image\/([^;]+)/);
      if (match && match[1]) {
        const format = match[1].toUpperCase();
        // jsPDF supports: JPEG, PNG, WEBP
        if (['JPEG', 'JPG', 'PNG', 'WEBP'].includes(format)) {
          return format === 'JPG' ? 'JPEG' : format;
        }
      }
      // Default to JPEG if format is unknown
      return 'JPEG';
    } catch (error) {
      return 'JPEG';
    }
  }

  private estimateTotalPages(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined
  ): number {
    // Estimate pages based on content complexity
    let estimatedPages = 1; // Title page
    
    // Executive summary: 1 page
    estimatedPages += 1;
    
    // Demo stories: 1-2 pages per story
    const demoStories = presentation.slides.filter(slide => slide.type === 'demo-story');
    estimatedPages += demoStories.length * 1.5;
    
    // Sprint analysis with charts: 1-2 pages
    if (sprintMetrics) {
      estimatedPages += 1.5;
    }
    
    // Strategic insights: 1 page
    estimatedPages += 1;
    
    // Action items: 1 page
    estimatedPages += 1;
    
    return Math.ceil(estimatedPages);
  }

  private addTableOfContents(
    doc: jsPDF,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    // Add TOC header
    doc.setTextColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.setFontSize(FONT_SIZES.sectionHeader);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, yPosition);
    
    // Add decorative line
    doc.setDrawColor(COLORS.brandBlue[0], COLORS.brandBlue[1], COLORS.brandBlue[2]);
    doc.line(margin, yPosition + 2, margin + 80, yPosition + 2);
    
    yPosition += 20;
    
    // Add TOC items
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(FONT_SIZES.body);
    doc.setFont('helvetica', 'normal');
    
    const tocItems = [
      { title: 'Executive Summary', page: 2 },
      { title: 'Demo Stories with Visual Context', page: 3 },
      { title: 'Sprint Performance Analysis', page: 4 },
      { title: 'Strategic Insights', page: 5 },
      { title: 'Action Items & Recommendations', page: 6 }
    ];
    
    tocItems.forEach((item, index) => {
      const itemText = `${item.title}  ${item.page}`;
      doc.text(itemText, margin, yPosition + (index * 8));
    });
    
    return yPosition + (tocItems.length * 8) + 20;
  }

  private calculateQualityScore(qualityChecklist: Record<string, string>): number {
    const scores = Object.values(qualityChecklist).map(value => {
      switch (value) {
        case 'yes': return 100;
        case 'partial': return 50;
        case 'no': return 0;
        case 'na': return 100; // Not applicable counts as good
        default: return 0;
      }
    });
    
    return scores.length > 0 ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) : 0;
  }

  private calculateTeamPerformance(allIssues: Issue[]): string {
    const totalIssues = allIssues.length;
    const completedIssues = allIssues.filter(issue => 
      isIssueCompleted(issue.status)
    ).length;
    const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
    
    return `${completionRate}% completion rate with ${completedIssues} of ${totalIssues} issues completed`;
  }

  private formatKeyMetrics(sprintMetrics: SprintMetrics | null | undefined): string {
    if (!sprintMetrics) {
      return 'metrics not available';
    }
    
    const velocity = sprintMetrics.completedTotalPoints;
    const target = sprintMetrics.estimatedPoints;
    const velocityPercentage = target > 0 ? Math.round((velocity / target) * 100) : 0;
    
    return `${velocity} story points completed (${velocityPercentage}% of target), ${sprintMetrics.testCoverage}% test coverage`;
  }

  private updateProgress(
    onProgress: ((progress: ExportProgress) => void) | undefined,
    progress: ExportProgress
  ): void {
    if (onProgress) onProgress(progress);
  }

  private generateFileName(presentation: GeneratedPresentation): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sprintName = presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Advanced_Sprint_Review_Digest_${sprintName}_${timestamp}.pdf`;
  }

  private generateCacheKey(promptType: string, context: Record<string, any>): string {
    const contextString = JSON.stringify(context);
    return `${promptType}_${Buffer.from(contextString).toString('base64').substring(0, 32)}`;
  }

  private clearCache(): void {
    this.contentCache.clear();
    this.chartCache.clear();
  }

  private getCacheStats(): { contentSize: number; chartSize: number } {
    return {
      contentSize: this.contentCache.size,
      chartSize: this.chartCache.size
    };
  }
} 