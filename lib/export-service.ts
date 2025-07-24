import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Types for export functionality
export interface ExportOptions {
  format: 'pdf' | 'html' | 'markdown' | 'metrics';
  quality?: 'low' | 'medium' | 'high';
  includeImages?: boolean;
  executiveFormat?: boolean;
  fileName?: string;
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

export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export presentation to PDF format
   */
  async exportToPDF(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions = { format: 'pdf' }
  ): Promise<Blob> {
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add company logo to each page
      const logoUrl = '/company-logos/CommandAlkon_Logo_Primary_CMYK.svg';
      
      // Process each slide
      for (let i = 0; i < presentation.slides.length; i++) {
        const slide = presentation.slides[i];
        
        // Add new page for each slide (except first)
        if (i > 0) {
          doc.addPage();
        }
        
        // Add slide title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(slide.title, pageWidth / 2, 30, { align: 'center' });
        
        // Add slide content based on type
        await this.renderSlideContent(doc, slide, allIssues, upcomingIssues, sprintMetrics, pageWidth, pageHeight);
        
        // Add company logo
        this.addCompanyLogo(doc, logoUrl, pageWidth, pageHeight);
        
        // Add page number
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${i + 1} of ${presentation.slides.length}`, pageWidth - 20, pageHeight - 10);
      }
      
      return doc.output('blob');
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to generate PDF export');
    }
  }

  /**
   * Export presentation to HTML format
   */
  async exportToHTML(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions = { format: 'html' }
  ): Promise<Blob> {
    try {
      const htmlContent = this.generateHTMLContent(presentation, allIssues, upcomingIssues, sprintMetrics, options);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      return blob;
    } catch (error) {
      console.error('HTML export error:', error);
      throw new Error('Failed to generate HTML export');
    }
  }

  /**
   * Export presentation to Markdown format
   */
  async exportToMarkdown(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions = { format: 'markdown' }
  ): Promise<Blob> {
    try {
      const markdownContent = this.generateMarkdownContent(presentation, allIssues, upcomingIssues, sprintMetrics, options);
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      return blob;
    } catch (error) {
      console.error('Markdown export error:', error);
      throw new Error('Failed to generate Markdown export');
    }
  }

  /**
   * Export executive metrics only
   */
  async exportExecutiveMetrics(
    sprintMetrics: SprintMetrics,
    allIssues: Issue[],
    options: ExportOptions = { format: 'metrics', executiveFormat: true }
  ): Promise<Blob> {
    try {
      const executiveContent = this.generateExecutiveMetricsContent(sprintMetrics, allIssues, options);
      const blob = new Blob([executiveContent], { type: 'text/html' });
      return blob;
    } catch (error) {
      console.error('Executive metrics export error:', error);
      throw new Error('Failed to generate executive metrics export');
    }
  }

  /**
   * Download file to user's device
   */
  downloadFile(blob: Blob, fileName: string): void {
    saveAs(blob, fileName);
  }

  /**
   * Generate file name based on presentation and format
   */
  generateFileName(presentation: GeneratedPresentation, format: string, executiveFormat?: boolean): string {
    const baseName = presentation.title.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (executiveFormat) {
      return `${baseName}_Executive_Metrics_${timestamp}.${format}`;
    }
    
    return `${baseName}_${timestamp}.${format}`;
  }

  // Private helper methods
  private async renderSlideContent(
    doc: jsPDF,
    slide: PresentationSlide,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    pageWidth: number | undefined,
    pageHeight: number | undefined
  ): Promise<void> {
    // Implementation will be added based on slide type
    switch (slide.type) {
      case 'title':
        await this.renderTitleSlide(doc, slide, pageWidth, pageHeight);
        break;
      case 'summary':
        await this.renderSummarySlide(doc, slide, pageWidth, pageHeight);
        break;
      case 'metrics':
        await this.renderMetricsSlide(doc, slide, sprintMetrics, allIssues, pageWidth, pageHeight);
        break;
      case 'demo-story':
        await this.renderDemoStorySlide(doc, slide, allIssues, pageWidth, pageHeight);
        break;
      case 'corporate':
        await this.renderCorporateSlide(doc, slide, pageWidth, pageHeight);
        break;
      default:
        await this.renderDefaultSlide(doc, slide, pageWidth, pageHeight);
    }
  }

  private async renderTitleSlide(doc: jsPDF, slide: PresentationSlide, pageWidth?: number, pageHeight?: number): Promise<void> {
    // Title slide rendering logic
    if (pageWidth && pageHeight) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Sprint Review Presentation', pageWidth / 2, pageHeight / 2, { align: 'center' });
    }
  }

  private async renderSummarySlide(doc: jsPDF, slide: PresentationSlide, pageWidth?: number, pageHeight?: number): Promise<void> {
    // Summary slide rendering logic
    if (pageWidth && pageHeight) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content);
      doc.text(content.substring(0, 200) + '...', 20, 60);
    }
  }

  private async renderMetricsSlide(
    doc: jsPDF,
    slide: PresentationSlide,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[] | undefined,
    pageWidth: number | undefined,
    pageHeight: number | undefined
  ): Promise<void> {
    // Metrics slide rendering logic
    if (pageWidth && pageHeight && sprintMetrics) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Sprint Metrics', 20, 60);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Completed Points: ${sprintMetrics.completedTotalPoints}/${sprintMetrics.estimatedPoints}`, 20, 80);
      doc.text(`Test Coverage: ${sprintMetrics.testCoverage}%`, 20, 95);
    }
  }

  private async renderDemoStorySlide(doc: jsPDF, slide: PresentationSlide, allIssues: Issue[] | undefined, pageWidth: number | undefined, pageHeight: number | undefined): Promise<void> {
    // Demo story slide rendering logic
    if (pageWidth && pageHeight) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Demo Story', 20, 60);
    }
  }

  private async renderCorporateSlide(doc: jsPDF, slide: PresentationSlide, pageWidth?: number, pageHeight?: number): Promise<void> {
    // Corporate slide rendering logic
    if (pageWidth && pageHeight) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Corporate Slide', 20, 60);
    }
  }

  private async renderDefaultSlide(doc: jsPDF, slide: PresentationSlide, pageWidth?: number, pageHeight?: number): Promise<void> {
    // Default slide rendering logic
    if (pageWidth && pageHeight) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Slide Content', 20, 60);
    }
  }

  private addCompanyLogo(doc: jsPDF, logoUrl: string, pageWidth: number, pageHeight: number): void {
    // Add company logo to bottom right corner
    // Implementation will be added when we have logo handling
  }

  private generateHTMLContent(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions
  ): string {
    // HTML content generation logic
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${presentation.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .slide { page-break-after: always; margin-bottom: 40px; }
            .slide:last-child { page-break-after: avoid; }
            h1 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            h2 { color: #374151; font-size: 20px; margin-bottom: 15px; }
            p { color: #6b7280; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${presentation.title}</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>Total Slides: ${presentation.metadata.totalSlides}</p>
        </body>
      </html>
    `;
  }

  private generateMarkdownContent(
    presentation: GeneratedPresentation,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics?: SprintMetrics | null,
    options: ExportOptions
  ): string {
    // Markdown content generation logic
    let markdown = `# ${presentation.title}\n\n`;
    markdown += `**Generated:** ${new Date().toISOString()}\n`;
    markdown += `**Sprint:** ${presentation.metadata.sprintName}\n`;
    markdown += `**Total Slides:** ${presentation.metadata.totalSlides}\n\n`;
    
    // Add slides content
    presentation.slides.forEach((slide, index) => {
      markdown += `## Slide ${index + 1}: ${slide.title}\n\n`;
      if (typeof slide.content === 'string') {
        markdown += slide.content + '\n\n';
      }
    });
    
    return markdown;
  }

  private generateExecutiveMetricsContent(
    sprintMetrics: SprintMetrics,
    allIssues: Issue[],
    options: ExportOptions
  ): string {
    // Executive metrics content generation logic
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Executive Metrics - ${sprintMetrics.sprintNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #1f2937; font-size: 32px; margin-bottom: 30px; text-align: center; }
            .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
            .metric-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #3b82f6; }
            .metric-value { font-size: 36px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
            .metric-label { color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Executive Metrics Summary</h1>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${sprintMetrics.completedTotalPoints}</div>
                <div class="metric-label">Completed Story Points</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${sprintMetrics.testCoverage}%</div>
                <div class="metric-label">Test Coverage</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${sprintMetrics.plannedItems}</div>
                <div class="metric-label">Planned Items</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Export singleton instance
export const exportService = ExportService.getInstance(); 