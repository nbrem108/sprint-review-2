"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Presentation,
  FileDown,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  FileText,
  ImageIcon,
  Calendar,
  Target,
  BarChart3,
  Trash2,
  RefreshCw,
  FileCode,
  TrendingUp,
  TestTube,
  Zap,
  MessageSquare,
  ChevronDown,
  Crown,
} from "lucide-react"
import { useSprintContext } from "@/components/sprint-context"
import { useToast } from "@/hooks/use-toast"
import { PresentationMode } from "@/components/presentation/presentation-mode"
import { getEpicBreakdown, type EpicBreakdown, isIssueCompleted } from "@/lib/utils"
import { calculateQualityScore } from "@/lib/utils"
import { ExportProgressModal } from '../export/export-progress-modal'
import { ExportOptionsPanel } from '../export/export-options-panel'
import { CacheManagementDashboard } from '../export/cache-management-dashboard'
import { TestingDashboard } from '../export/testing-dashboard'
import { ExportOptions, ExportProgress, ExportResult } from '@/lib/export-service'
import { QualityReport } from '@/lib/export-quality-assurance'
import { ExportError } from '@/lib/export-error-handler'
import { exportService } from '@/lib/export-service'
import { OptimizationDashboard } from '../export/optimization-dashboard';

interface PresentationSlide {
  id: string
  title: string
  content: string
  type: "title" | "summary" | "metrics" | "demo-story" | "custom" | "corporate" | "qa" | "executive" | "quarterly-plan"
  order: number
  corporateSlideUrl?: string
  storyId?: string // Add the specific story ID for demo story slides
}

interface GeneratedPresentation {
  id: string
  title: string
  slides: PresentationSlide[]
  createdAt: string
  metadata: {
    sprintName: string
    totalSlides: number
    hasMetrics: boolean
    demoStoriesCount: number
    customSlidesCount: number
  }
}

// Utility function to safely convert any content to string
function safeContentToString(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  
  if (content === null || content === undefined) {
    return '';
  }
  
  if (typeof content === 'object') {
    // Handle ADF objects
    if (content.type === 'doc' && Array.isArray(content.content)) {
      return content.content.map((node: any) => {
        if (node.type === 'paragraph' && node.content) {
          return node.content.map((child: any) => child.text || '').join('');
        }
        return '';
      }).join('\n\n');
    }
    
    // Handle other objects by converting to JSON string
    try {
      return JSON.stringify(content);
    } catch {
      return '[Object content]';
    }
  }
  
  return String(content);
}

export function PresentationTab() {
  const { state, dispatch } = useSprintContext()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingDigest, setIsExportingDigest] = useState(false)
  const [isExportingAdvancedDigest, setIsExportingAdvancedDigest] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  
  // Enhanced export state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 'medium',
    includeImages: true,
    compression: true,
    interactive: true
  })
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    current: 0,
    total: 100,
    stage: 'preparing',
    message: '',
    percentage: 0
  })
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null)
  const [exportError, setExportError] = useState<ExportError | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [showCacheDashboard, setShowCacheDashboard] = useState(false)
  const [showTestingDashboard, setShowTestingDashboard] = useState(false)
  const [showOptimizationDashboard, setShowOptimizationDashboard] = useState(false)

  // Use the persisted presentation from context
  const presentation = state.generatedPresentation

  // Check if we have enough data to generate presentation
  const canGenerate = state.selectedSprint && state.issues.length > 0
  const hasSummaries =
    state.summaries.currentSprint ||
    state.summaries.upcomingSprint ||
    (state.summaries.demoStories && Object.keys(state.summaries.demoStories).length > 0)
  const hasMetrics = state.metrics !== null
  const hasDemoStories = state.demoStories.length > 0

  const generatePresentation = async () => {
    if (!canGenerate) return

    setIsGenerating(true)

    try {
      // Simulate presentation generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const slides: PresentationSlide[] = []
      let slideOrder = 0

      // Get active corporate slides
      const activeIntroSlides = state.corporateSlides
        .filter(s => (s.position === "intro" || s.position === "meeting-guidelines") && s.isActive)
        .sort((a, b) => a.order - b.order)

      // Add intro corporate slides first
      for (const slide of activeIntroSlides) {
        slides.push({
          id: `corporate-${slide.id}`,
          title: slide.title,
          content: "",
          type: "corporate",
          order: slideOrder,
          corporateSlideUrl: slide.localUrl
        })
        slideOrder++
      }

      // Title slide
      slides.push({
        id: `slide-${slideOrder}`,
        title: `${state.selectedSprint!.name} Sprint Review`,
        content: `# ${state.selectedProject?.name || 'Project'} Sprint Review

**Sprint Period:** ${state.selectedSprint!.startDate || "N/A"} - ${state.selectedSprint!.endDate || "N/A"}

**Team Performance Overview**
- Total Issues: ${state.issues.length}
- Completed Issues: ${state.issues.filter((i) => isIssueCompleted(i.status || "")).length}
- Demo Stories: ${state.demoStories.length}

**Prepared by:** Sprint Review Generator
**Date:** ${new Date().toLocaleDateString()}`,
        type: "title",
        order: slideOrder,
      })
      slideOrder++

      // Quarterly Plan slide
      if (state.quarterlyPlanSlide) {
        slides.push({
          id: `quarterly-plan-${slideOrder}`,
          title: "Quarterly Plan (Q3 Epics)",
          content: "",
          type: "quarterly-plan",
          order: slideOrder,
          corporateSlideUrl: `data:${state.quarterlyPlanSlide.type};base64,${state.quarterlyPlanSlide.data}`
        })
        slideOrder++
      }

      // Sprint Overview slide
      if (state.summaries.currentSprint) {
        slides.push({
          id: `slide-${slideOrder}`,
          title: "Sprint Overview",
          content: state.summaries.currentSprint,
          type: "summary",
          order: slideOrder,
        })
        slideOrder++
      }



      // Sprint Metrics slide
      if (hasMetrics && state.metrics) {
        const epicBreakdown: EpicBreakdown[] = getEpicBreakdown(state.issues);
        const epicBreakdownContent = epicBreakdown.map((epic: EpicBreakdown) => 
          `### ${epic.name}
- Stories: ${epic.completed}/${epic.total} (${epic.percent}% complete)
- Points: ${epic.completedPoints}/${epic.totalPoints} (${epic.percentPoints}% complete)`
        ).join('\n\n');

        slides.push({
          id: `slide-${slideOrder}`,
          title: "Sprint Metrics & Epic Progress",
          content: `# Sprint Metrics

## Quality Metrics
${Object.entries(state.metrics.qualityChecklist)
  .map(([key, value]) => `- ${key}: ${value === "yes" ? "✅" : value === "no" ? "❌" : value === "partial" ? "⚠️" : "ℹ️"}`)
  .join("\n")}

## Epic Progress
${epicBreakdownContent}

## Overall Progress
- Story Points: ${state.metrics.completedTotalPoints}/${state.metrics.estimatedPoints} (${Math.round((state.metrics.completedTotalPoints / state.metrics.estimatedPoints) * 100)}%)
- Quality Score: ${calculateQualityScore(state.metrics.qualityChecklist)}%
${calculateQualityScore(state.metrics.qualityChecklist) >= 80 
  ? "✅ Sprint quality meets standards" 
  : "❌ Sprint quality needs attention"}`,
          type: "metrics",
          order: slideOrder,
        });
        slideOrder++
      }

      // Demo Stories slides
      if (hasDemoStories && state.summaries.demoStories) {
        // Demo Stories Overview
        slides.push({
          id: `slide-${slideOrder}`,
          title: "Demo Stories Overview",
          content: `# Demo Stories Overview

**Selected for Demo:** ${state.demoStories.length} stories

${state.demoStories
  .map((storyId) => {
    const story = state.issues.find((i) => i.id === storyId)
    return story
      ? `## ${story.key}: ${story.summary}
- **Status:** ${story.status}
- **Type:** ${story.issueType}
- **Points:** ${story.storyPoints || "Not estimated"}
- **Assignee:** ${story.assignee || "Unassigned"}`
      : ""
  })
  .join("\n\n")}`,
          type: "summary",
          order: slideOrder,
        })
        slideOrder++

        // Individual demo story slides
        for (const storyId of state.demoStories) {
          const story = state.issues.find((i) => i.id === storyId)
          const summary = state.summaries.demoStories[storyId]

          if (story && summary) {
            // Ensure all story fields are safely converted to strings
            const safeStoryContent = `# ${story.key}: ${safeContentToString(story.summary)}

${safeContentToString(summary)}

## Story Details
- **Status:** ${safeContentToString(story.status)}
- **Type:** ${safeContentToString(story.issueType)}
- **Points:** ${story.storyPoints ? safeContentToString(story.storyPoints) : "Not estimated"}
- **Assignee:** ${story.assignee ? safeContentToString(story.assignee) : "Unassigned"}
- **Epic:** ${story.epicName ? safeContentToString(story.epicName) : "No epic"}

${story.description ? `## Description
${safeContentToString(story.description)}` : ''}

${story.releaseNotes ? `## Release Notes
${safeContentToString(story.releaseNotes)}` : ''}`

            slides.push({
              id: `slide-${slideOrder}`,
              title: `Demo: ${story.key}`,
              content: safeStoryContent,
              type: "demo-story",
              order: slideOrder,
              storyId: storyId, // Add the specific story ID
            })
            slideOrder++
          }
        }

        // Add demo separator immediately after the last demo story
        const demoSeparators = state.corporateSlides
          .filter(s => s.position === "section-break" && s.isActive)
          .sort((a, b) => a.order - b.order)

        if (demoSeparators.length > 0) {
          slides.push({
            id: `corporate-${demoSeparators[0].id}`,
            title: demoSeparators[0].title,
            content: "",
            type: "corporate",
            order: slideOrder,
            corporateSlideUrl: demoSeparators[0].localUrl
          })
          slideOrder++
        }
      }

      // Upcoming Sprint slide
      if (state.summaries.upcomingSprint) {
        slides.push({
          id: `slide-${slideOrder}`,
          title: "Upcoming Sprint Planning",
          content: state.summaries.upcomingSprint,
          type: "summary",
          order: slideOrder,
        })
        slideOrder++
      }



      // Q&A slide
      slides.push({
        id: `slide-${slideOrder}`,
        title: "Questions & Discussion",
        content: `# Questions & Discussion

## Thank you for your attention!

**Sprint Summary:**
- ✅ ${state.issues.filter((i) => i.status === "Done").length} items completed
- 🎯 ${state.demoStories.length} stories demonstrated
- 📊 ${hasMetrics ? `${calculateQualityScore(state.metrics!.qualityChecklist)}% quality score` : "Metrics available"}

**Next Steps:**
- Sprint retrospective
- ${state.upcomingSprint ? `Planning for ${state.upcomingSprint.name}` : "Upcoming sprint planning"}
- Continuous improvement initiatives

---
*Generated by Sprint Review Deck Generator*`,
        type: "qa",
        order: slideOrder,
      })
      slideOrder++

      // Custom slides from uploads
      for (let i = 0; i < state.additionalSlides.length; i++) {
        const slide = state.additionalSlides[i];
        const imageUrl = `data:${slide.type};base64,${slide.data}`;
        
        slides.push({
          id: `additional-slide-${slideOrder}`,
          title: slide.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          content: "",
          type: "corporate",
          order: slideOrder,
          corporateSlideUrl: imageUrl
        })
        slideOrder++
      }

      // Add outro corporate slides
      const outroSlides = state.corporateSlides
        .filter(s => s.position === "outro" && s.isActive)
        .sort((a, b) => a.order - b.order)

      for (const slide of outroSlides) {
        slides.push({
          id: `corporate-${slide.id}`,
          title: slide.title,
          content: "",
          type: "corporate",
          order: slideOrder,
          corporateSlideUrl: slide.localUrl
        })
        slideOrder++
      }

      // Executive Performance Dashboard (final slide)
      if (hasMetrics && state.metrics) {
        slides.push({
          id: `slide-${slideOrder}`,
          title: "Executive Performance Dashboard",
          content: `# Executive Performance Dashboard

## Sprint Performance Overview
- **Sprint:** ${state.selectedSprint!.name}
- **Period:** ${state.selectedSprint!.startDate || "N/A"} - ${state.selectedSprint!.endDate || "N/A"}
- **Team Performance:** Comprehensive metrics and business impact analysis

## Key Metrics
- **Velocity Achievement:** ${Math.round((state.metrics.completedTotalPoints / state.metrics.estimatedPoints) * 100)}%
- **Quality Score:** ${calculateQualityScore(state.metrics.qualityChecklist)}%
- **Completion Rate:** ${Math.round((state.issues.filter((i) => isIssueCompleted(i.status || "")).length / state.issues.length) * 100)}%

## Business Impact
- High-value deliverables completed
- User experience improvements
- System stability enhancements
- Technical debt reduction

## Strategic Insights
- Performance trends and patterns
- Risk assessment and mitigation
- Recommendations for next sprint`,
          type: "executive",
          order: slideOrder,
        });
        slideOrder++
      }

      const generatedPresentation: GeneratedPresentation = {
        id: `presentation-${Date.now()}`,
        title: `${state.selectedSprint!.name} Sprint Review`,
        slides,
        createdAt: new Date().toISOString(),
        metadata: {
          sprintName: state.selectedSprint!.name,
          totalSlides: slides.length,
          hasMetrics,
          demoStoriesCount: state.demoStories.length,
          customSlidesCount: state.additionalSlides.length,
        },
      }

      dispatch({ type: "SET_GENERATED_PRESENTATION", payload: generatedPresentation })
      setIsGenerating(false)

      toast({
        title: "Presentation Generated",
        description: `Created ${slides.length} slides for ${state.selectedSprint!.name}`,
      })
    } catch (error) {
      console.error("Presentation generation error:", error)
      setIsGenerating(false)
      toast({
        title: "Generation Failed",
        description: "Failed to generate presentation. Please try again.",
        variant: "destructive",
      })
    }
  }





  const exportToMarkdown = async () => {
    if (!presentation) return

    setIsExporting(true)
    try {
      // Call API endpoint for Markdown export
      const response = await fetch('/api/export/markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues: state.issues,
          upcomingIssues: state.upcomingIssues,
          sprintMetrics: state.metrics,
          options: { format: 'markdown' }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export Markdown')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${presentation.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Markdown Export",
        description: "Markdown exported successfully!",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export Markdown. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportDigest = async () => {
    if (!presentation) {
      toast({
        title: "No presentation available",
        description: "Please generate a presentation first.",
        variant: "destructive",
      })
      return
    }

    setIsExportingDigest(true)
    try {
      // Call API endpoint for Digest export
      const response = await fetch('/api/export/digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues: state.issues,
          upcomingIssues: state.upcomingIssues || [],
          sprintMetrics: state.metrics,
          options: { format: 'digest', quality: 'high' }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export Digest')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Sprint_Review_Digest_${presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Digest Export",
        description: "Sprint review digest exported successfully!",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export digest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExportingDigest(false)
    }
  }

  const exportAdvancedDigest = async () => {
    if (!presentation) {
      toast({
        title: "No presentation available",
        description: "Please generate a presentation first.",
        variant: "destructive",
      })
      return
    }

    setIsExportingAdvancedDigest(true)
    try {
      // Call API endpoint for Advanced Digest export
      const response = await fetch('/api/generate-advanced-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues: state.issues,
          upcomingIssues: state.upcomingIssues || [],
          sprintMetrics: state.metrics,
          options: { format: 'advanced-digest', quality: 'high' },
          demoStoryScreenshots: state.demoStoryScreenshots,
          additionalData: {
            selectedProject: state.selectedProject,
            selectedBoard: state.selectedBoard,
            selectedSprint: state.selectedSprint,
            upcomingSprint: state.upcomingSprint,
            sprintComparison: state.sprintComparison,
            sprintTrends: state.sprintTrends,
            summaries: state.summaries,
            corporateSlides: state.corporateSlides,
            additionalSlides: state.additionalSlides,
            quarterlyPlanSlide: state.quarterlyPlanSlide
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export Advanced Digest')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Advanced_Sprint_Review_Digest_${presentation.metadata.sprintName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Advanced Digest Export",
        description: "Advanced sprint review digest exported successfully!",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export advanced digest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExportingAdvancedDigest(false)
    }
  }

  const exportExecutiveMetrics = async () => {
    if (!presentation) {
      toast({
        title: "No presentation available",
        description: "Please generate a presentation first.",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      // Call API endpoint for executive summary export
      const response = await fetch('/api/export/executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues: state.issues,
          upcomingIssues: state.upcomingIssues || [],
          sprintMetrics: state.metrics,
          options: { format: 'executive', quality: 'high' }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export executive summary')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Executive_Summary_${presentation.metadata.sprintName}_${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Executive Summary Export",
        description: "Executive summary exported successfully!",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export executive summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const clearPresentation = () => {
    dispatch({ type: "SET_GENERATED_PRESENTATION", payload: null })
    setCurrentSlideIndex(0)
    toast({
      title: "Presentation Cleared",
      description: "Generated presentation has been cleared.",
    })
  }

  // Enhanced export functions
  const handleExport = async () => {
    if (!presentation) {
      toast({
        title: "No presentation to export",
        description: "Please generate a presentation first.",
        variant: "destructive",
      })
      return
    }

    setShowExportModal(true)
    setExportError(null)
    setExportResult(null)
    setQualityReport(null)

    try {
      const result = await exportService.export(
        presentation,
        state.issues,
        state.upcomingIssues || [],
        state.metrics,
        exportOptions,
        (progress) => {
          setExportProgress(progress)
        }
      )

      setExportResult(result)
      
      // Get quality report
      try {
        const qualityReport = await import('@/lib/export-quality-assurance').then(
          module => module.exportQualityAssurance.validateExport(result, presentation, exportOptions)
        )
        setQualityReport(qualityReport)
      } catch (error) {
        console.warn('Quality check failed:', error)
      }

      // Download the file
      exportService.downloadFile(result)

      toast({
        title: "Export successful",
        description: `${exportOptions.format.toUpperCase()} has been downloaded successfully.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      setExportError({
        code: 'EXPORT_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred during export.',
        details: 'Export process failed',
        recoverable: true,
        retryCount: 0,
        timestamp: new Date().toISOString()
      })
      
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred during export.",
        variant: "destructive",
      })
    }
  }

  const handleRetryExport = () => {
    setExportError(null)
    handleExport()
  }

  const handleDownload = (result: ExportResult) => {
    exportService.downloadFile(result)
  }

  const openExportOptions = () => {
    setShowExportOptions(true)
  }

  const openCacheDashboard = () => {
    setShowCacheDashboard(true)
  }

  const openTestingDashboard = () => {
    setShowTestingDashboard(true)
  }

  const openOptimizationDashboard = () => {
    setShowOptimizationDashboard(true)
  }

  const calculateQualityScore = (checklist: Record<string, string>): number => {
    const scores: number[] = []
    
    Object.values(checklist).forEach((value) => {
      switch (value) {
        case "yes":
          scores.push(1)
          break
        case "partial":
          scores.push(0.5)
          break
        case "no":
          scores.push(0)
          break
        case "na":
          // Skip NA values
          break
        default:
          scores.push(0)
          break
      }
    })

    if (scores.length === 0) return 0
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return Math.round(average * 100)
  }

  const formatQualityKey = (key: string): string => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
  }

  const formatQualityValue = (value: string): string => {
    switch (value) {
      case "yes":
        return "✅ Yes"
      case "partial":
        return "⚠️ Partial"
      case "no":
        return "❌ No"
      case "na":
        return "➖ N/A"
      default:
        return value
    }
  }

  const nextSlide = () => {
    if (presentation && currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index)
  }

  if (!canGenerate) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Presentation</h2>
          <p className="text-muted-foreground">Generate and export your sprint review presentation</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium">Prerequisites Required</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Please complete the following steps before generating your presentation:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  {!state.selectedSprint && <li>• Select a sprint</li>}
                  {state.issues.length === 0 && <li>• Load sprint issues</li>}
                  {!hasSummaries && <li>• Generate AI summaries</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isPreviewMode && presentation) {
    return (
      <PresentationMode
        slides={presentation.slides}
        allIssues={state.issues}
        upcomingIssues={state.upcomingIssues}
        sprintMetrics={state.metrics}
        corporateSlides={state.corporateSlides}
        demoStoryScreenshots={state.demoStoryScreenshots}
        onClose={() => setIsPreviewMode(false)}
      />
    )
  }

  return (
    <div className="space-y-6 max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Presentation</h2>
          <p className="text-muted-foreground">
            {presentation 
              ? `Generated presentation for ${state.selectedSprint?.name} (${presentation.metadata.totalSlides} slides)`
              : `Generate and export your sprint review presentation for ${state.selectedSprint?.name}`
            }
          </p>
        </div>
        {!presentation && (
          <Button onClick={generatePresentation} disabled={isGenerating || !hasSummaries} className="gap-2">
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Presentation className="h-4 w-4" />}
            Generate Presentation
          </Button>
        )}
        {presentation && (
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsPreviewMode(true)} 
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-4 w-4" />
              Go Live
            </Button>
            <Button onClick={generatePresentation} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate
            </Button>
          </div>
        )}
      </div>

      {/* Prerequisites Check */}
      <Card>
        <CardHeader>
          <CardTitle>Presentation Readiness</CardTitle>
          <CardDescription>Check your presentation components and data completeness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">Sprint Data</div>
                <div className="text-sm text-muted-foreground">{state.issues.length} issues loaded</div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <div className="font-medium">AI Summaries</div>
                <div className="text-sm text-muted-foreground">{hasSummaries ? "Generated" : "Not generated"}</div>
              </div>
              {hasSummaries ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <div className="font-medium">Sprint Metrics</div>
                <div className="text-sm text-muted-foreground">{hasMetrics ? "Configured" : "Optional"}</div>
              </div>
              {hasMetrics ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
            </div>

            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <div className="font-medium">Demo Stories</div>
                <div className="text-sm text-muted-foreground">{state.demoStories.length} selected</div>
              </div>
              {hasDemoStories ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Presentation */}
      {presentation && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Presentation className="h-5 w-5" />
                  {presentation.title}
                  <Badge variant="secondary">{presentation.metadata.totalSlides} slides</Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => setIsPreviewMode(true)} 
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="h-4 w-4" />
                    Go Live
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <FileDown className="h-4 w-4" />
                        Export
                        <ChevronDown className="h-4 w-4 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={exportAdvancedDigest}
                        disabled={isExportingAdvancedDigest}
                        className="gap-2 cursor-pointer"
                      >
                        {isExportingAdvancedDigest ? (
                          <Loader2 className="h-4 w-4 animate-spin opacity-60" />
                        ) : (
                          <TrendingUp className="h-4 w-4 opacity-60" />
                        )}
                        Advanced Digest
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={exportExecutiveMetrics}
                        disabled={isExporting}
                        className="gap-2 cursor-pointer"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 animate-spin opacity-60" />
                        ) : (
                          <TrendingUp className="h-4 w-4 opacity-60" />
                        )}
                        Executive Summary
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={exportDigest}
                        disabled={isExportingDigest}
                        className="gap-2 cursor-pointer"
                      >
                        {isExportingDigest ? (
                          <Loader2 className="h-4 w-4 animate-spin opacity-60" />
                        ) : (
                          <FileText className="h-4 w-4 opacity-60" />
                        )}
                        Sprint Digest
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem 
                        onClick={exportToMarkdown}
                        disabled={isExporting}
                        className="gap-2 cursor-pointer"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 animate-spin opacity-60" />
                        ) : (
                          <FileText className="h-4 w-4 opacity-60" />
                        )}
                        Markdown Export
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openTestingDashboard}
                    className="gap-2 bg-transparent"
                  >
                    <TestTube className="h-4 w-4" />
                    Testing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openOptimizationDashboard}
                    className="gap-2 bg-transparent"
                  >
                    <Zap className="h-4 w-4" />
                    Optimization
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearPresentation}
                    disabled={isGenerating}
                    className="gap-2 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generatePresentation}
                    disabled={isGenerating}
                    className="gap-2 bg-transparent"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Regenerate
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Generated on {new Date(presentation.createdAt).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{presentation.metadata.totalSlides}</div>
                  <div className="text-sm text-muted-foreground">Total Slides</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{presentation.metadata.demoStoriesCount}</div>
                  <div className="text-sm text-muted-foreground">Demo Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {presentation.metadata.hasMetrics ? "✓" : "–"}
                  </div>
                  <div className="text-sm text-muted-foreground">Metrics Included</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{presentation.metadata.customSlidesCount}</div>
                  <div className="text-sm text-muted-foreground">Custom Slides</div>
                </div>
              </div>

              {/* Slide Thumbnails */}
              <div className="space-y-4">
                <h4 className="font-medium">Slide Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {presentation.slides.map((slide, index) => (
                    <Card
                      key={slide.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => goToSlide(index)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            Slide {index + 1}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {slide.type === "title" && <Presentation className="h-3 w-3" />}
                            {slide.type === "summary" && <FileText className="h-3 w-3" />}
                            {slide.type === "metrics" && <BarChart3 className="h-3 w-3" />}
                            {slide.type === "demo-story" && <Target className="h-3 w-3" />}
                            {slide.type === "custom" && <ImageIcon className="h-3 w-3" />}
                            {slide.type === "corporate" && <Presentation className="h-3 w-3" />}
                            {slide.type === "qa" && <MessageSquare className="h-3 w-3" />}
                            {slide.type === "quarterly-plan" && <Calendar className="h-3 w-3" />}
                            {slide.type === "executive" && <Crown className="h-3 w-3" />}
                          </div>
                        </div>
                        <CardTitle className="text-sm truncate">{slide.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-muted-foreground line-clamp-3">
                          {slide.content.substring(0, 100)}...
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Generation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Presentation Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">For Best Results:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Generate AI summaries first for rich content</li>
                <li>• Complete sprint metrics for detailed analysis</li>
                <li>• Select meaningful demo stories to showcase</li>
                <li>• Add custom slides for additional context</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Presentation Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Full-screen presentation mode</li>
                <li>• PDF export for sharing</li>
                <li>• Professional slide formatting</li>
                <li>• Automatic slide generation from data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Export UI Components */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Export Configuration</h3>
              <Button variant="outline" size="sm" onClick={() => setShowExportOptions(false)}>
                Close
              </Button>
            </div>
            <ExportOptionsPanel
              options={exportOptions}
              onOptionsChange={setExportOptions}
              onExport={handleExport}
              isExporting={isExporting}
              estimatedFileSize={presentation ? presentation.slides.length * 1024 * 1024 : undefined}
              estimatedTime={presentation ? presentation.slides.length * 2 : undefined}
            />
          </div>
        </div>
      )}

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        progress={exportProgress}
        result={exportResult || undefined}
        qualityReport={qualityReport || undefined}
        error={exportError || undefined}
        onRetry={handleRetryExport}
        onDownload={handleDownload}
        options={exportOptions}
      />

      {/* Cache Management Dashboard */}
      <CacheManagementDashboard
        isOpen={showCacheDashboard}
        onClose={() => setShowCacheDashboard(false)}
      />

      {/* Testing Dashboard */}
      {presentation && (
        <TestingDashboard
          isOpen={showTestingDashboard}
          onClose={() => setShowTestingDashboard(false)}
          presentation={presentation}
          options={exportOptions}
        />
      )}

      {/* Optimization Dashboard */}
      {presentation && (
        <OptimizationDashboard
          isOpen={showOptimizationDashboard}
          onClose={() => setShowOptimizationDashboard(false)}
          presentation={presentation}
          options={exportOptions}
        />
      )}
    </div>
  )
}
