"use client"

import React from 'react';
import { 
  ExportRenderer, 
  ExportResult, 
  ExportProgress, 
  ExportOptions,
  GeneratedPresentation,
  Issue,
  SprintMetrics,
  PresentationSlide
} from '@/lib/export-service';

// Asset embedder class
class AssetEmbedder {
  private embeddedAssets: Map<string, string> = new Map();

  async embedImage(url: string): Promise<string> {
    if (this.embeddedAssets.has(url)) {
      return this.embeddedAssets.get(url)!;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      this.embeddedAssets.set(url, base64);
      return base64;
    } catch (error) {
      console.warn('Failed to embed image:', url, error);
      return '';
    }
  }

  embedCSS(css: string): string {
    return css;
  }

  async embedFont(fontFamily: string, fontUrl: string): Promise<string> {
    return fontUrl;
  }

  getEmbeddedAssets(): Map<string, string> {
    return new Map(this.embeddedAssets);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export class HTMLExportRenderer implements ExportRenderer {
  private assetEmbedder: AssetEmbedder;

  constructor() {
    this.assetEmbedder = new AssetEmbedder();
  }

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
        message: 'Preparing HTML export...',
        percentage: 0
      });

      // Generate HTML content
      const htmlContent = await this.generateHTMLContent(
        presentation,
        allIssues,
        upcomingIssues,
        sprintMetrics,
        options,
        onProgress
      );

      // Create blob
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const fileName = this.generateFileName(presentation);

      // Update progress
      this.updateProgress(onProgress, {
        current: presentation.slides.length + 2,
        total: presentation.slides.length + 2,
        stage: 'finalizing',
        message: 'Finalizing HTML export...',
        percentage: 100
      });

      return {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'html',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: Date.now() - startTime,
          quality: options.quality || 'medium'
        }
      };

    } catch (error) {
      console.error('❌ HTML export failed:', error);
      throw new Error(`HTML export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateHTMLContent(
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
      total: presentation.slides.length + 2,
      stage: 'rendering',
      message: 'Generating HTML structure...',
      percentage: Math.round((1 / (presentation.slides.length + 2)) * 100)
    });

    // Generate CSS
    const css = this.generateCSS(options);

    // Generate JavaScript
    const js = this.generateJavaScript(options);

    // Generate slides HTML
    const slidesHTML = await this.generateSlidesHTML(
      presentation.slides,
      allIssues,
      upcomingIssues,
      sprintMetrics,
      options,
      onProgress
    );

    // Generate navigation
    const navigation = this.generateNavigation(presentation.slides);

    // Combine everything into a self-contained HTML file
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${presentation.title}</title>
    <style>
        ${css}
    </style>
</head>
<body>
    <div class="presentation-container">
        <!-- Header -->
        <header class="presentation-header">
            <div class="header-content">
                <h1>${presentation.title}</h1>
                <div class="presentation-meta">
                    <span>Sprint: ${presentation.metadata.sprintName}</span>
                    <span>Generated: ${new Date(presentation.createdAt).toLocaleDateString()}</span>
                    <span>Slides: ${presentation.metadata.totalSlides}</span>
                </div>
            </div>
            <div class="company-logo">
                <img src="/company-logos/CommandAlkon_Logo_Primary_CMYK.svg" alt="Command Alkon" />
            </div>
        </header>

        <!-- Navigation -->
        ${navigation}

        <!-- Slides Container -->
        <main class="slides-container">
            ${slidesHTML}
        </main>

        <!-- Footer -->
        <footer class="presentation-footer">
            <div class="footer-content">
                <span>Generated by Sprint Review Deck Generator</span>
                <span class="page-info">Page <span id="current-page">1</span> of <span id="total-pages">${presentation.slides.length}</span></span>
            </div>
        </footer>
    </div>

    <script>
        ${js}
    </script>
</body>
</html>`;

    return html;
  }

  private generateCSS(options: ExportOptions): string {
    return `
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }

        /* Presentation container */
        .presentation-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Header */
        .presentation-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-content h1 {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .presentation-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .company-logo img {
            height: 40px;
            width: auto;
        }

        /* Navigation */
        .presentation-navigation {
            background: #f1f5f9;
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .nav-controls {
            display: flex;
            justify-content: center;
            gap: 1rem;
            align-items: center;
        }

        .nav-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            transition: background-color 0.2s;
        }

        .nav-button:hover {
            background: #2563eb;
        }

        .nav-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }

        .slide-indicator {
            font-size: 0.875rem;
            color: #6b7280;
        }

        /* Slides container */
        .slides-container {
            flex: 1;
            position: relative;
            overflow: hidden;
        }

        .slide {
            display: none;
            padding: 2rem;
            min-height: 500px;
        }

        .slide.active {
            display: block;
        }

        /* Slide content styles */
        .slide-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #3b82f6;
        }

        .slide-content {
            font-size: 1rem;
            line-height: 1.7;
            color: #374151;
        }

        /* Footer */
        .presentation-footer {
            background: #f8fafc;
            padding: 1rem 2rem;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
            color: #6b7280;
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .presentation-header {
                flex-direction: column;
                text-align: center;
                gap: 1rem;
            }

            .presentation-meta {
                flex-direction: column;
                gap: 0.5rem;
            }

            .nav-controls {
                flex-wrap: wrap;
            }

            .slide {
                padding: 1rem;
            }
        }

        /* Print styles */
        @media print {
            .presentation-navigation,
            .presentation-footer {
                display: none;
            }

            .slide {
                display: block !important;
                page-break-after: always;
                min-height: auto;
            }

            .slide:last-child {
                page-break-after: avoid;
            }
        }
    `;
  }

  private generateJavaScript(options: ExportOptions): string {
    return `
        // Presentation navigation
        let currentSlideIndex = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            showSlide(0);
            updateNavigation();
        });

        // Navigation functions
        function showSlide(index) {
            if (index < 0 || index >= totalSlides) return;
            
            // Hide all slides
            slides.forEach(slide => slide.classList.remove('active'));
            
            // Show current slide
            slides[index].classList.add('active');
            currentSlideIndex = index;
            
            // Update navigation
            updateNavigation();
        }

        function nextSlide() {
            showSlide(currentSlideIndex + 1);
        }

        function prevSlide() {
            showSlide(currentSlideIndex - 1);
        }

        function updateNavigation() {
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const currentPage = document.getElementById('current-page');
            const totalPages = document.getElementById('total-pages');
            
            if (prevBtn) prevBtn.disabled = currentSlideIndex === 0;
            if (nextBtn) nextBtn.disabled = currentSlideIndex === totalSlides - 1;
            if (currentPage) currentPage.textContent = currentSlideIndex + 1;
            if (totalPages) totalPages.textContent = totalSlides;
        }

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'Home':
                    e.preventDefault();
                    showSlide(0);
                    break;
                case 'End':
                    e.preventDefault();
                    showSlide(totalSlides - 1);
                    break;
            }
        });
    `;
  }

  private async generateSlidesHTML(
    slides: PresentationSlide[],
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<string> {
    let slidesHTML = '';

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      
      // Update progress
      this.updateProgress(onProgress, {
        current: i + 2,
        total: slides.length + 2,
        stage: 'rendering',
        message: `Rendering slide ${i + 1} of ${slides.length}...`,
        percentage: Math.round(((i + 2) / (slides.length + 2)) * 100)
      });

      // Generate slide HTML based on type
      const slideHTML = await this.renderSlideHTML(slide, allIssues, upcomingIssues, sprintMetrics, options);
      
      slidesHTML += `
        <div class="slide" id="slide-${i}">
          <div class="slide-title">${slide.title}</div>
          <div class="slide-content">
            ${slideHTML}
          </div>
        </div>
      `;
    }

    return slidesHTML;
  }

  private async renderSlideHTML(
    slide: PresentationSlide,
    allIssues: Issue[],
    upcomingIssues: Issue[],
    sprintMetrics: SprintMetrics | null | undefined,
    options: ExportOptions
  ): Promise<string> {
    switch (slide.type) {
      case 'title':
        return this.renderTitleSlideHTML(slide);
      case 'summary':
        return this.renderSummarySlideHTML(slide);
      case 'metrics':
        return this.renderMetricsSlideHTML(slide, sprintMetrics, allIssues);
      case 'demo-story':
        return this.renderDemoStorySlideHTML(slide, allIssues);
      case 'corporate':
        return this.renderCorporateSlideHTML(slide);
      case 'qa':
        return this.renderQASlideHTML(slide);
      default:
        return this.renderDefaultSlideHTML(slide);
    }
  }

  private renderTitleSlideHTML(slide: PresentationSlide): string {
    return `
      <div class="title-slide">
        <h2>${slide.title}</h2>
        <p>Welcome to the Sprint Review Presentation</p>
      </div>
    `;
  }

  private renderSummarySlideHTML(slide: PresentationSlide): string {
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content);
    return `
      <div class="summary-slide">
        <div class="markdown-content">
          ${this.markdownToHTML(content)}
        </div>
      </div>
    `;
  }

  private renderMetricsSlideHTML(
    slide: PresentationSlide,
    sprintMetrics: SprintMetrics | null | undefined,
    allIssues: Issue[]
  ): string {
    if (!sprintMetrics) {
      return '<p>No metrics available</p>';
    }

    return `
      <div class="metrics-slide">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${sprintMetrics.completedTotalPoints}</div>
            <div class="metric-label">Completed Points</div>
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
    `;
  }

  private renderDemoStorySlideHTML(slide: PresentationSlide, allIssues: Issue[]): string {
    const issue = allIssues.find(i => i.id === slide.storyId);
    if (!issue) {
      return '<p>Story not found</p>';
    }

    return `
      <div class="demo-story-slide">
        <h3>${issue.key}: ${issue.summary}</h3>
        <div class="story-details">
          <p><strong>Assignee:</strong> ${issue.assignee || 'Unassigned'}</p>
          <p><strong>Story Points:</strong> ${issue.storyPoints || 'Not estimated'}</p>
          <p><strong>Status:</strong> ${issue.status}</p>
        </div>
        <div class="story-content">
          ${typeof slide.content === 'string' ? this.markdownToHTML(slide.content) : 'No content available'}
        </div>
      </div>
    `;
  }

  private async renderCorporateSlideHTML(slide: PresentationSlide): Promise<string> {
    if (slide.corporateSlideUrl) {
      try {
        // Embed the image using the asset embedder
        const embeddedImage = await this.assetEmbedder.embedImage(slide.corporateSlideUrl);
        
        if (embeddedImage) {
          return `
            <div class="corporate-slide">
              <img src="data:image/jpeg;base64,${embeddedImage}" alt="Corporate slide" style="max-width: 100%; max-height: 100%; object-fit: contain; padding: 20px;" />
            </div>
          `;
        } else {
          // Fallback to original URL if embedding fails
          return `
            <div class="corporate-slide">
              <img src="${slide.corporateSlideUrl}" alt="Corporate slide" style="max-width: 100%; max-height: 100%; object-fit: contain; padding: 20px;" />
            </div>
          `;
        }
      } catch (error) {
        console.warn('Failed to embed corporate slide image:', error);
        return `
          <div class="corporate-slide">
            <img src="${slide.corporateSlideUrl}" alt="Corporate slide" style="max-width: 100%; max-height: 100%; object-fit: contain; padding: 20px;" />
          </div>
        `;
      }
    }
    return '<p>No corporate slide image available</p>';
  }

  private renderDefaultSlideHTML(slide: PresentationSlide): string {
    const content = typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content);
    return `
      <div class="default-slide">
        <div class="markdown-content">
          ${this.markdownToHTML(content)}
        </div>
      </div>
    `;
  }

  private renderQASlideHTML(slide: PresentationSlide): string {
    return `
      <div class="qa-slide">
        <div class="qa-content">
          <h2>Questions & Discussion</h2>
          <p>Thank you for your attention!</p>
          <div class="qa-summary">
            <p><strong>Sprint Summary:</strong></p>
            <ul>
              <li>✅ Items completed</li>
              <li>🎯 Stories demonstrated</li>
              <li>📊 Quality metrics</li>
            </ul>
          </div>
          <div class="qa-next-steps">
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Sprint retrospective</li>
              <li>Upcoming sprint planning</li>
              <li>Continuous improvement initiatives</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private generateNavigation(slides: PresentationSlide[]): string {
    return `
      <nav class="presentation-navigation">
        <div class="nav-controls">
          <button id="prev-btn" class="nav-button" onclick="prevSlide()">Previous</button>
          <span class="slide-indicator">
            <span id="current-page">1</span> / <span id="total-pages">${slides.length}</span>
          </span>
          <button id="next-btn" class="nav-button" onclick="nextSlide()">Next</button>
        </div>
      </nav>
    `;
  }

  private generateFileName(presentation: GeneratedPresentation): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sprintName = presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_');
    return `Sprint_Review_${sprintName}_${timestamp}.html`;
  }

  private markdownToHTML(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^(.+)$/gm, '<p>$1</p>');
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