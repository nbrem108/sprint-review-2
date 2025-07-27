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


export class DigestExportRenderer implements ExportRenderer {
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
      this.updateProgress(onProgress, {
        current: 0,
        total: 100,
        stage: 'preparing',
        message: 'Preparing digest export...',
        percentage: 0
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      await this.addCompanyLogo(doc);

      await this.generateDigestContent(
        doc,
        presentation,
        allIssues,
        upcomingIssues,
        sprintMetrics,
        options,
        onProgress
      );

      const pdfBlob = doc.output('blob');
      const fileName = this.generateFileName(presentation);

      this.updateProgress(onProgress, {
        current: 100,
        total: 100,
        stage: 'finalizing',
        message: 'Finalizing digest export...',
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
      console.error('❌ Digest export failed:', error);
      throw new Error(`Digest export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      doc.text('Sprint Review Digest', logoX + logoWidth + 15, logoY + 10);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Command Alkon', logoX, logoY + 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sprint Review Digest', logoX + 120, logoY + 12);
    }
  }
  private addSectionHeader(doc: jsPDF, title: string, x: number, y: number, fontSize = FONT_SIZES.sectionHeader): number {
    doc.setTextColor(
      COLORS.brandBlue[0],
      COLORS.brandBlue[1],
      COLORS.brandBlue[2]
    );
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x, y);
    return y + 10;
  }

  private estimateTextHeight(lineCount: number, lineHeight: number): number {
    return lineCount * lineHeight + 5;
  }

  private startNewPageWithHeader(doc: jsPDF, title: string, margin: number): number {
    doc.addPage();
    return this.addSectionHeader(doc, `${title} (continued)`, margin, 40);
  }

  private async generateDigestContent(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    let yPosition = 40; // Start below the header (increased for larger header)
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // 1. Sprint Summary Table (Quick Overview)
    yPosition = this.addSprintSummaryTable(doc, presentation, allIssues, sprintMetrics, yPosition, margin, contentWidth);

    // 2. Project Name and Sprint Name
    yPosition = this.addHeaderSection(doc, presentation, yPosition, margin, contentWidth);

    // 3. Table of Contents
    yPosition = this.addTableOfContents(doc, presentation, yPosition, margin, contentWidth);

    // 4. Sprint Summary
    const sprintOverviewSlide = presentation.slides.find(slide => 
      slide.type === 'summary' && slide.title.toLowerCase().includes('overview')
    );
    const summaryContent = sprintOverviewSlide ? 
      (typeof sprintOverviewSlide.content === 'string' ? sprintOverviewSlide.content : JSON.stringify(sprintOverviewSlide.content)) :
      'No sprint summary available';
    yPosition = this.addSprintSummary(doc, summaryContent, pageHeight, margin, contentWidth, yPosition);

    // 5. Detailed Demo Story Summaries
    yPosition = this.addDemoStoriesSection(doc, presentation, allIssues, yPosition, margin, contentWidth);

    // 6. Next Sprint Preview Summary
    yPosition = this.addNextSprintSection(doc, presentation, yPosition, margin, contentWidth);

    // 7. Sprint Metrics (copy-paste friendly tables)
    yPosition = this.addMetricsSection(doc, sprintMetrics, allIssues, yPosition, margin, contentWidth);

    // 7. Footer
    this.addFooter(doc, presentation);
  }

  private addSprintSummaryTable(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    // Section header
    doc.setTextColor(21, 44, 83);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprint Overview', margin, yPosition);
    
    yPosition += 8;
    
    // Calculate sprint health metrics
    const totalIssues = allIssues.length;
    const completedIssues = allIssues.filter(issue => isIssueCompleted(issue.status)).length;
    const totalStoryPoints = allIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const completedStoryPoints = allIssues
      .filter(issue => isIssueCompleted(issue.status))
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    
    const sprintHealthPercentage = sprintMetrics && sprintMetrics.estimatedPoints > 0 
      ? Math.round((sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100)
      : totalStoryPoints > 0 
        ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
        : 0;

    // Create summary table (2x3 structure - no status row)
    const summaryData = [
      ['Story Count', 'Story Points', 'Sprint Health'],
      [totalIssues.toString(), totalStoryPoints.toString(), `${sprintHealthPercentage}%`]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [221, 79, 38], // Command Alkon orange
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      margin: { left: margin, right: margin }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    return yPosition;
  }

  private addHeaderSection(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setTextColor(21, 44, 83); // Command Alkon blue
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprint Review Digest', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 12;
    
    // Sprint details with better formatting
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sprint: ${presentation.metadata.sprintName}`, margin, yPosition);
    
    yPosition += 8;
    
    // Additional sprint info if available
    const sprintSlide = presentation.slides.find(slide => slide.type === 'title');
    if (sprintSlide && typeof sprintSlide.content === 'string') {
      const sprintInfo = this.extractSprintInfo(sprintSlide.content);
      if (sprintInfo.period) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Period: ${sprintInfo.period}`, margin, yPosition);
        yPosition += 6;
      }
    }
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    
    yPosition += 20;
    
    return yPosition;
  }

  private addSprintSummary(doc: jsPDF, summary: string, pageHeight: number, margin: number, contentWidth: number, yPosition: number): number {
    doc.setFontSize(14);
    doc.setTextColor(30, 50, 100);
    doc.text('Sprint Summary', margin, yPosition);
    yPosition += 10;
  
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
  
    const cleanContent = this.forceBreakLongWords(this.cleanMarkdownContent(summary));
    const lines = doc.splitTextToSize(cleanContent, contentWidth);
    const lineHeight = 5;
  
    // Loop through lines and paginate as needed
    for (let i = 0; i < lines.length; i++) {
      const remainingLines = lines.length - i;
      const availableLines = Math.floor((pageHeight - yPosition - 30) / lineHeight);
  
      if (remainingLines > availableLines) {
        const slice = lines.slice(i, i + availableLines);
        doc.text(slice, margin, yPosition);
        doc.addPage();
        yPosition = 40;
        i += availableLines - 1;
      } else {
        const slice = lines.slice(i);
        doc.text(slice, margin, yPosition);
        yPosition += slice.length * lineHeight + 10;
        break;
      }
    }
  
    return yPosition;
  }
  

  private addDemoStoriesSection(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Section header
    doc.setTextColor(21, 44, 83);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Demo Stories', margin, yPosition);
    
    yPosition += 10;
    
    // Get demo story slides
    const demoStorySlides = presentation.slides.filter(slide => slide.type === 'demo-story');
    
    if (demoStorySlides.length === 0) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.text('No demo stories available', margin, yPosition);
      yPosition += 15;
      return yPosition;
    }
    
    for (const slide of demoStorySlides) {
      const issue = allIssues.find(i => i.id === slide.storyId);
      if (!issue) continue;
      
      // Check if we need a new page for story header
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 40;
      }
      
      // Story header (H3 style)
      doc.setTextColor(221, 79, 38); // Command Alkon orange
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`${issue.key}: ${issue.summary}`, margin, yPosition);
      
      yPosition += 8;
      
      // Story details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Assignee: ${issue.assignee || 'Unassigned'} | Points: ${issue.storyPoints || 'Not estimated'} | Status: ${issue.status}`, margin, yPosition);
      
      yPosition += 6;
      
      // Story content with pagination
      const content = typeof slide.content === 'string' ? slide.content : 'No content available';
      const cleanContent = this.forceBreakLongWords(this.cleanMarkdownContent(content));
      
      // Add a brief summary if content is too long
      const maxContentLength = 500;
      const displayContent = cleanContent.length > maxContentLength 
        ? cleanContent.substring(0, maxContentLength) + '... (Content truncated for digest format)'
        : cleanContent;
      
      const lines = doc.splitTextToSize(displayContent, contentWidth);
      const lineHeight = 4;
      
      // Loop through lines and paginate as needed
      for (let i = 0; i < lines.length; i++) {
        const remainingLines = lines.length - i;
        const availableLines = Math.floor((pageHeight - yPosition - 30) / lineHeight);
        
        if (remainingLines > availableLines && availableLines > 0) {
          const slice = lines.slice(i, i + availableLines);
          doc.text(slice, margin, yPosition);
          doc.addPage();
          yPosition = 40;
          
          // Re-add story header on new page
          doc.setTextColor(221, 79, 38);
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.text(`${issue.key}: ${issue.summary} (continued)`, margin, yPosition);
          yPosition += 8;
          
          i += availableLines - 1;
        } else {
          const slice = lines.slice(i);
          doc.text(slice, margin, yPosition);
          yPosition += slice.length * lineHeight + 12;
          break;
        }
      }
    }
    
    return yPosition;
  }

  private addNextSprintSection(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Section header
    doc.setTextColor(21, 44, 83);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Sprint Preview', margin, yPosition);
    
    yPosition += 10;
    
    // Find upcoming sprint slide
    const upcomingSprintSlide = presentation.slides.find(slide => 
      slide.type === 'summary' && slide.title.toLowerCase().includes('upcoming')
    );
    
    if (upcomingSprintSlide) {
      const content = typeof upcomingSprintSlide.content === 'string' 
        ? upcomingSprintSlide.content 
        : JSON.stringify(upcomingSprintSlide.content);
      
      const cleanContent = this.forceBreakLongWords(this.cleanMarkdownContent(content));
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const lines = doc.splitTextToSize(cleanContent, contentWidth);
      const lineHeight = 5;
      
      // Loop through lines and paginate as needed
      for (let i = 0; i < lines.length; i++) {
        const remainingLines = lines.length - i;
        const availableLines = Math.floor((pageHeight - yPosition - 30) / lineHeight);
        
        if (remainingLines > availableLines && availableLines > 0) {
          const slice = lines.slice(i, i + availableLines);
          doc.text(slice, margin, yPosition);
          doc.addPage();
          yPosition = 40;
          
          // Re-add section header on new page
          doc.setTextColor(21, 44, 83);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Next Sprint Preview (continued)', margin, yPosition);
          yPosition += 10;
          
          i += availableLines - 1;
        } else {
          const slice = lines.slice(i);
          doc.text(slice, margin, yPosition);
          yPosition += slice.length * lineHeight + 15;
          break;
        }
      }
    } else {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.text('No upcoming sprint information available', margin, yPosition);
      yPosition += 15;
    }
    
    return yPosition;
  }

  private addMetricsSection(
    doc: jsPDF,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[],
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 40;
    }
    
    // Section header
    doc.setTextColor(21, 44, 83);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Sprint Metrics', margin, yPosition);
    
    yPosition += 10;
    
    if (!sprintMetrics) {
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.text('No metrics available for this sprint', margin, yPosition);
      return yPosition + 15;
    }
    
    // Key Metrics Table
    const keyMetricsData = [
      ['Metric', 'Value', 'Target', 'Status'],
      ['Completed Story Points', sprintMetrics.completedTotalPoints.toString(), sprintMetrics.estimatedPoints.toString(), this.getStatusText(sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints)],
      ['Velocity Achievement', `${((sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100).toFixed(1)}%`, '100%', this.getStatusText(sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints)],
      ['Test Coverage', `${sprintMetrics.testCoverage}%`, '80%', this.getStatusText(sprintMetrics.testCoverage / 100)],
      ['Planned Items', sprintMetrics.plannedItems.toString(), 'N/A', 'N/A']
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [keyMetricsData[0]],
      body: keyMetricsData.slice(1),
      theme: 'grid',
      headStyles: {
        fillColor: [21, 44, 83],
        textColor: 255,
        fontStyle: 'bold'
      },
      pageBreak: 'auto',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 60 }, // column 1 narrower
        2: { halign: 'right' } // align numeric cells
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Quality Metrics Table
    if (sprintMetrics.qualityChecklist) {
      const qualityData = [['Quality Item', 'Status']];
      Object.entries(sprintMetrics.qualityChecklist).forEach(([item, status]) => {
        qualityData.push([item, status.toUpperCase()]);
      });
      
      autoTable(doc, {
        startY: yPosition,
        head: [qualityData[0]],
        body: qualityData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [221, 79, 38],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Epic Breakdown Table
    const epicBreakdown = this.getEpicBreakdown(allIssues);
    if (epicBreakdown.length > 0) {
      const epicData = [['Epic', 'Completed', 'Total', 'Points', 'Completion %']];
      epicBreakdown.forEach(epic => {
        epicData.push([
          epic.name,
          epic.completed.toString(),
          epic.total.toString(),
          epic.completedPoints.toString(),
          `${epic.percent}%`
        ]);
      });
      
      autoTable(doc, {
        startY: yPosition,
        head: [epicData[0]],
        body: epicData.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [21, 44, 83],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    return yPosition;
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
      doc.text(`Generated by Sprint Review Generator | ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    }
  }

  private forceBreakLongWords(text: string): string {
    return text.replace(/(\\S{40,})/g, '$1\\n');
  }

  private cleanMarkdownContent(content: string): string {
    return content
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/[-*+] /g, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/_/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private getStatusText(ratio: number): string {
    if (ratio >= 0.9) return '✅ Excellent';
    if (ratio >= 0.75) return '✅ Good';
    if (ratio >= 0.6) return '⚠️ Fair';
    return '❌ Needs Improvement';
  }

  private getEpicBreakdown(allIssues: Issue[]): Array<{
    name: string;
    completed: number;
    total: number;
    completedPoints: number;
    totalPoints: number;
    percent: number;
  }> {
    const epicGroups = new Map<string, Issue[]>();
    
    allIssues.forEach(issue => {
      const epic = issue.epicName || 'No Epic';
      if (!epicGroups.has(epic)) {
        epicGroups.set(epic, []);
      }
      epicGroups.get(epic)!.push(issue);
    });

    const breakdown: Array<{
      name: string;
      completed: number;
      total: number;
      completedPoints: number;
      totalPoints: number;
      percent: number;
    }> = [];

    epicGroups.forEach((issues, epic) => {
      const completed = issues.filter(issue => isIssueCompleted(issue.status)).length;
      const totalPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      const completedPoints = issues
        .filter(issue => isIssueCompleted(issue.status))
        .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
      
      breakdown.push({
        name: epic,
        completed,
        total: issues.length,
        completedPoints,
        totalPoints,
        percent: issues.length > 0 ? Math.round((completed / issues.length) * 100) : 0
      });
    });

    return breakdown;
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
    return `Sprint_Review_Digest_${sprintName}_${timestamp}.pdf`;
  }

  private extractSprintInfo(content: string): { period?: string; team?: string } {
    const periodMatch = content.match(/Sprint Period:\s*([^\n]+)/);
    const teamMatch = content.match(/Team:\s*([^\n]+)/);
    
    return {
      period: periodMatch ? periodMatch[1].trim() : undefined,
      team: teamMatch ? teamMatch[1].trim() : undefined
    };
  }

  private addTableOfContents(
    doc: jsPDF,
    presentation: GeneratedPresentation,
    yPosition: number,
    margin: number,
    contentWidth: number
  ): number {
    // Section header
    doc.setTextColor(21, 44, 83);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, yPosition);
    
    yPosition += 10;
    
    // Define sections
    const sections = [
      { title: 'Sprint Summary', page: 1 },
      { title: 'Demo Stories', page: 1 },
      { title: 'Next Sprint Preview', page: 1 },
      { title: 'Sprint Metrics', page: 1 }
    ];
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    sections.forEach((section, index) => {
      const lineY = yPosition + (index * 6);
      doc.text(section.title, margin, lineY);
      
      // Add dots and page number
      const dots = '.'.repeat(Math.floor((contentWidth - 30) / 3));
      doc.text(dots, margin + 80, lineY);
      doc.text(section.page.toString(), margin + contentWidth - 10, lineY, { align: 'right' });
    });
    
    yPosition += (sections.length * 6) + 15;
    
    return yPosition;
  }
} 