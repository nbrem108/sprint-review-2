/**
 * PDF Export Renderer
 * Generates high-quality PDF exports with proper text rendering and searchability
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
import { assetEmbedder } from './asset-embedder';

export class PDFExportRenderer implements ExportRenderer {
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
        total: presentation.slides.length + 2,
        stage: 'preparing',
        message: 'Preparing PDF export...',
        percentage: 0
      });

      // Create PDF document
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Add company branding
      await this.addCompanyBranding(doc, pageWidth, pageHeight);

      // Generate slides
      await this.generateSlides(
        doc,
        presentation.slides,
        allIssues,
        upcomingIssues,
        sprintMetrics,
        options,
        onProgress
      );

      // Add table of contents
      await this.addTableOfContents(doc, presentation.slides, pageWidth, pageHeight);

      // Add metadata
      this.addDocumentMetadata(doc, presentation, sprintMetrics);

      // Generate blob
      const blob = doc.output('blob');
      const fileName = this.generateFileName(presentation);

      // Update progress
      this.updateProgress(onProgress, {
        current: presentation.slides.length + 2,
        total: presentation.slides.length + 2,
        stage: 'finalizing',
        message: 'Finalizing PDF export...',
        percentage: 100
      });

      return {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'pdf',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: Date.now() - startTime,
          quality: options.quality || 'medium'
        }
      };

    } catch (error) {
      console.error('❌ PDF export failed:', error);
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async addCompanyBranding(doc: jsPDF, pageWidth: number, pageHeight: number): Promise<void> {
    // Add company logo to header
    try {
      // For now, we'll add text-based branding
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246); // Blue color
      doc.text('Command Alkon', pageWidth - 30, 15, { align: 'right' });
      
      // Add footer line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
    } catch (error) {
      console.warn('⚠️ Failed to add company branding:', error);
    }
  }

  private async generateSlides(
    doc: jsPDF,
    slides: PresentationSlide[],
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // Update progress
      this.updateProgress(onProgress, {
        current: i + 1,
        total: slides.length + 2,
        stage: 'rendering',
        message: `Rendering slide ${i + 1} of ${slides.length}...`,
        percentage: Math.round(((i + 1) / (slides.length + 2)) * 100)
      });

      // Add new page for each slide (except first)
      if (i > 0) {
        doc.addPage();
      }

      // Render slide content
      await this.renderSlide(doc, slide, allIssues, upcomingIssues, sprintMetrics, options, i + 1);

             // Add page number
       this.addPageNumber(doc, i + 1, slides.length, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
    }
  }

  private async renderSlide(
    doc: jsPDF,
    slide: PresentationSlide,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    slideNumber: number
  ): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add slide title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55); // Dark gray
    doc.text(slide.title, pageWidth / 2, 40, { align: 'center' });

    // Add slide number
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray
    doc.text(`Slide ${slideNumber}`, pageWidth / 2, 55, { align: 'center' });

    // Render slide content based on type
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
      case 'qa':
        await this.renderQASlide(doc, slide, pageWidth, pageHeight);
        break;
      case 'quarterly-plan':
        await this.renderCorporateSlide(doc, slide, pageWidth, pageHeight);
        break;
      case 'executive':
        await this.renderExecutiveSlide(doc, slide, sprintMetrics, allIssues, pageWidth, pageHeight);
        break;
      default:
        await this.renderDefaultSlide(doc, slide, pageWidth, pageHeight);
    }
  }

  private async renderTitleSlide(doc: jsPDF, slide: PresentationSlide, pageWidth: number, pageHeight: number): Promise<void> {
    // Center the title content
    const centerY = pageHeight / 2;
    
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(slide.title, pageWidth / 2, centerY - 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Sprint Review Presentation', pageWidth / 2, centerY + 10, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Generated by Sprint Review Deck Generator', pageWidth / 2, centerY + 30, { align: 'center' });
  }

  private async renderSummarySlide(doc: jsPDF, slide: PresentationSlide, pageWidth: number, pageHeight: number): Promise<void> {
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content);
    
    // Split content into lines that fit the page
    const maxWidth = pageWidth - 40;
    const lines = doc.splitTextToSize(content, maxWidth);
    
    // Calculate starting position
    const lineHeight = 8;
    const startY = 80;
    const maxLines = Math.floor((pageHeight - startY - 40) / lineHeight);
    
    // Render content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      doc.text(lines[i], 20, startY + (i * lineHeight));
    }
    
    // Add note if content was truncated
    if (lines.length > maxLines) {
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text(`... (content truncated, ${lines.length - maxLines} more lines)`, 20, pageHeight - 30);
    }
  }

  private async renderMetricsSlide(
    doc: jsPDF,
    slide: PresentationSlide,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[],
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    if (!sprintMetrics) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('No metrics available for this sprint', pageWidth / 2, pageHeight / 2, { align: 'center' });
      return;
    }

    const startY = 80;
    const lineHeight = 12;
    let currentY = startY;

    // Key metrics section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Key Performance Indicators', 20, currentY);
    currentY += lineHeight + 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    // Velocity
    const velocity = (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100;
    doc.text(`Velocity: ${velocity.toFixed(1)}% (${sprintMetrics.completedTotalPoints}/${sprintMetrics.estimatedPoints} points)`, 20, currentY);
    currentY += lineHeight;

    // Test coverage
    doc.text(`Test Coverage: ${sprintMetrics.testCoverage}%`, 20, currentY);
    currentY += lineHeight;

    // Planned items
    doc.text(`Planned Items: ${sprintMetrics.plannedItems}`, 20, currentY);
    currentY += lineHeight;

    // Quality metrics
    currentY += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Quality Checklist', 20, currentY);
    currentY += lineHeight;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    Object.entries(sprintMetrics.qualityChecklist).forEach(([item, status]) => {
      const statusIcon = status === 'yes' ? '✓' : status === 'partial' ? '~' : status === 'no' ? '✗' : '-';
      doc.text(`${statusIcon} ${item}: ${status.toUpperCase()}`, 30, currentY);
      currentY += lineHeight - 2;
    });
  }

  private async renderDemoStorySlide(
    doc: jsPDF,
    slide: PresentationSlide,
    allIssues: Issue[],
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    const issue = allIssues.find(i => i.id === slide.storyId);
    if (!issue) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('Story not found', pageWidth / 2, pageHeight / 2, { align: 'center' });
      return;
    }

    const startY = 80;
    const lineHeight = 12;
    let currentY = startY;

    // Story title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(`${issue.key}: ${issue.summary}`, 20, currentY);
    currentY += lineHeight + 5;

    // Story details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    doc.text(`Assignee: ${issue.assignee || 'Unassigned'}`, 20, currentY);
    currentY += lineHeight;

    doc.text(`Story Points: ${issue.storyPoints || 'Not estimated'}`, 20, currentY);
    currentY += lineHeight;

    doc.text(`Status: ${issue.status}`, 20, currentY);
    currentY += lineHeight;

    doc.text(`Epic: ${issue.epicName || 'No epic'}`, 20, currentY);
    currentY += lineHeight;

    // Release notes if available
    if (issue.releaseNotes) {
      currentY += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Release Notes:', 20, currentY);
      currentY += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const releaseNotesLines = doc.splitTextToSize(issue.releaseNotes, pageWidth - 40);
      releaseNotesLines.forEach((line: string) => {
        doc.text(line, 30, currentY);
        currentY += lineHeight - 2;
      });
    }

    // Story content
    const content = typeof slide.content === 'string' ? slide.content : 'No content available';
    if (content && content !== 'No content available') {
      currentY += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Story Content:', 20, currentY);
      currentY += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(content, pageWidth - 40);
      contentLines.forEach((line: string) => {
        doc.text(line, 30, currentY);
        currentY += lineHeight - 2;
      });
    }
  }

  private async renderCorporateSlide(doc: jsPDF, slide: PresentationSlide, pageWidth: number, pageHeight: number): Promise<void> {
    if (slide.corporateSlideUrl) {
      try {
        // Embed the image using the asset embedder
        const embeddedImage = await assetEmbedder.embedImage(slide.corporateSlideUrl);
        
        if (embeddedImage) {
          // Calculate image dimensions to fit within page bounds with padding
          const padding = 20;
          const maxWidth = pageWidth - (padding * 2);
          const maxHeight = pageHeight - (padding * 2);
          
          // Add the embedded image to the PDF
          doc.addImage(
            embeddedImage,
            'JPEG', // or 'PNG' based on the image type
            padding,
            padding,
            maxWidth,
            maxHeight,
            undefined,
            'FAST'
          );
          
          console.log(`✅ Embedded corporate slide image: ${slide.corporateSlideUrl}`);
        } else {
          // Fallback to placeholder text if embedding fails
          doc.setFontSize(16);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(156, 163, 175);
          doc.text('Corporate Slide Image', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
          doc.text(`(Image: ${slide.corporateSlideUrl})`, pageWidth / 2, pageHeight / 2, { align: 'center' });
        }
      } catch (error) {
        console.warn('⚠️ Failed to render corporate slide image:', error);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(156, 163, 175);
        doc.text('Corporate slide image could not be rendered', pageWidth / 2, pageHeight / 2, { align: 'center' });
      }
    } else {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('No corporate slide image available', pageWidth / 2, pageHeight / 2, { align: 'center' });
    }
  }

  private async renderQASlide(doc: jsPDF, slide: PresentationSlide, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      // Embed the Q&A slide image
      const embeddedImage = await assetEmbedder.embedImage('/corporate-slides/q_and_a_slide.jpg');
      
      if (embeddedImage) {
        // Calculate image dimensions to fit within page bounds with padding
        const padding = 20;
        const maxWidth = pageWidth - (padding * 2);
        const maxHeight = pageHeight - (padding * 2);
        
        // Add the embedded image to the PDF
        doc.addImage(
          embeddedImage,
          'JPEG',
          padding,
          padding,
          maxWidth,
          maxHeight,
          undefined,
          'FAST'
        );
        
        console.log(`✅ Embedded Q&A slide image`);
      } else {
        // Fallback to text-based Q&A slide
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Questions & Discussion', pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text('Thank you for your attention!', pageWidth / 2, pageHeight / 2, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Generated by Sprint Review Deck Generator', pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
      }
    } catch (error) {
      console.warn('⚠️ Failed to render Q&A slide image:', error);
      // Fallback to text-based Q&A slide
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Questions & Discussion', pageWidth / 2, pageHeight / 2 - 40, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Thank you for your attention!', pageWidth / 2, pageHeight / 2, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Generated by Sprint Review Deck Generator', pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
    }
  }

  private async renderExecutiveSlide(
    doc: jsPDF,
    slide: PresentationSlide,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[],
    pageWidth: number,
    pageHeight: number
  ): Promise<void> {
    if (!sprintMetrics) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('No metrics available for executive summary', pageWidth / 2, pageHeight / 2, { align: 'center' });
      return;
    }

    const startY = 80;
    const lineHeight = 12;
    let currentY = startY;

    // Executive Summary Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Executive Summary', pageWidth / 2, currentY, { align: 'center' });
    currentY += lineHeight + 10;

    // Key Metrics Grid
    const completedIssues = allIssues.filter(issue => issue.status === 'Done' || issue.status === 'Closed');
    const completionRate = allIssues.length > 0 ? (completedIssues.length / allIssues.length) * 100 : 0;
    const velocity = (sprintMetrics.completedTotalPoints / sprintMetrics.estimatedPoints) * 100;
    const qualityScore = this.calculateQualityScore(sprintMetrics.qualityChecklist);
    const efficiencyScore = Math.round((velocity + qualityScore + completionRate) / 3);

    // Metrics in a grid layout
    const metrics = [
      { label: 'Velocity', value: `${velocity.toFixed(1)}%`, color: [59, 130, 246] },
      { label: 'Quality', value: `${qualityScore}%`, color: [34, 197, 94] },
      { label: 'Completion', value: `${completionRate.toFixed(1)}%`, color: [168, 85, 247] },
      { label: 'Efficiency', value: `${efficiencyScore}%`, color: [249, 115, 22] }
    ];

    const gridStartX = 30;
    const gridWidth = (pageWidth - 60) / 2;
    const gridHeight = 40;

    metrics.forEach((metric, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = gridStartX + (col * gridWidth);
      const y = currentY + (row * (gridHeight + 10));

      // Metric box
      doc.setFillColor(248, 250, 252);
      doc.rect(x, y, gridWidth - 10, gridHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(x, y, gridWidth - 10, gridHeight, 'S');

      // Metric value
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      doc.text(metric.value, x + (gridWidth - 10) / 2, y + 15, { align: 'center' });

      // Metric label
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(metric.label, x + (gridWidth - 10) / 2, y + 30, { align: 'center' });
    });

    currentY += 100;

    // Sprint Metrics Comparison Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Sprint Metrics Comparison', 30, currentY);
    currentY += lineHeight + 5;

    // Table headers
    const tableHeaders = ['Sprint', 'Committed', 'Completed', 'Velocity', 'Quality'];
    const tableX = 30;
    const tableWidth = pageWidth - 60;
    const colWidth = tableWidth / 5;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(59, 130, 246);
    
    tableHeaders.forEach((header, index) => {
      const x = tableX + (index * colWidth);
      doc.rect(x, currentY - 5, colWidth, 15, 'F');
      doc.text(header, x + colWidth / 2, currentY + 3, { align: 'center' });
    });

    currentY += 15;

    // Current sprint data
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    doc.setFillColor(239, 246, 255);

    const currentSprintData = [
      'Current Sprint',
      sprintMetrics.estimatedPoints.toString(),
      sprintMetrics.completedTotalPoints.toString(),
      `${velocity.toFixed(1)}%`,
      `${qualityScore}%`
    ];

    currentSprintData.forEach((data, index) => {
      const x = tableX + (index * colWidth);
      doc.rect(x, currentY - 5, colWidth, 15, 'F');
      doc.text(data, x + colWidth / 2, currentY + 3, { align: 'center' });
    });

    currentY += 25;

    // Business Impact Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Business Impact', 30, currentY);
    currentY += lineHeight + 5;

    const highValueItems = completedIssues.filter(issue => (issue.storyPoints || 0) >= 8).length;
    const bugFixes = completedIssues.filter(issue => issue.issueType === 'Bug').length;
    const technicalDebt = completedIssues.filter(issue => issue.issueType === 'Technical task').length;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    doc.text(`• High-Value Items: ${highValueItems}`, 30, currentY);
    currentY += lineHeight;
    doc.text(`• Bug Fixes: ${bugFixes}`, 30, currentY);
    currentY += lineHeight;
    doc.text(`• Technical Debt: ${technicalDebt}`, 30, currentY);
  }

  private calculateQualityScore(checklist: Record<string, "yes" | "no" | "partial" | "na">): number {
    const totalItems = Object.keys(checklist).length;
    const yesCount = Object.values(checklist).filter(status => status === 'yes').length;
    const partialCount = Object.values(checklist).filter(status => status === 'partial').length;
    
    return Math.round(((yesCount + (partialCount * 0.5)) / totalItems) * 100);
  }

  private async renderDefaultSlide(doc: jsPDF, slide: PresentationSlide, pageWidth: number, pageHeight: number): Promise<void> {
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content);
    
    // Split content into lines that fit the page
    const maxWidth = pageWidth - 40;
    const lines = doc.splitTextToSize(content, maxWidth);
    
    // Calculate starting position
    const lineHeight = 8;
    const startY = 80;
    const maxLines = Math.floor((pageHeight - startY - 40) / lineHeight);
    
    // Render content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      doc.text(lines[i], 20, startY + (i * lineHeight));
    }
    
    // Add note if content was truncated
    if (lines.length > maxLines) {
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text(`... (content truncated, ${lines.length - maxLines} more lines)`, 20, pageHeight - 30);
    }
  }

  private async addTableOfContents(doc: jsPDF, slides: PresentationSlide[], pageWidth: number, pageHeight: number): Promise<void> {
    // Insert TOC as the first page
    doc.insertPage(1);
    
    const startY = 80;
    const lineHeight = 12;
    let currentY = startY;

    // TOC title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Table of Contents', pageWidth / 2, currentY, { align: 'center' });
    currentY += lineHeight + 10;

    // TOC entries
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    slides.forEach((slide, index) => {
      const slideNumber = index + 2; // +2 because we inserted TOC page
      doc.text(`${slideNumber}. ${slide.title}`, 20, currentY);
      currentY += lineHeight;
    });

    // Add page number
    this.addPageNumber(doc, 1, slides.length + 1, pageWidth, pageHeight);
  }

  private addDocumentMetadata(doc: jsPDF, presentation: GeneratedPresentation, sprintMetrics: SprintMetrics | null | undefined): void {
    // Add document properties
    doc.setProperties({
      title: presentation.title,
      subject: `Sprint Review - ${presentation.metadata.sprintName}`,
      author: 'Sprint Review Deck Generator',
      creator: 'Sprint Review Deck Generator',
      keywords: 'sprint review, agile, metrics, presentation'
    });
  }

  private addPageNumber(doc: jsPDF, currentPage: number, totalPages: number, pageWidth: number, pageHeight: number): void {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  private generateFileName(presentation: GeneratedPresentation): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sprintName = presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Sprint_Review_${sprintName}_${timestamp}.pdf`;
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