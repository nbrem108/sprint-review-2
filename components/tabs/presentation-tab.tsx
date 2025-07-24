"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { useSprintContext } from "@/components/sprint-context"
import { useToast } from "@/hooks/use-toast"
import { PresentationMode } from "@/components/presentation/presentation-mode"
import { getEpicBreakdown, type EpicBreakdown } from "@/lib/utils"
import { calculateQualityScore } from "@/lib/utils"

interface PresentationSlide {
  id: string
  title: string
  content: string
  type: "title" | "summary" | "metrics" | "demo-story" | "custom" | "corporate"
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

export function PresentationTab() {
  const { state, dispatch } = useSprintContext()
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

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
          order: slideOrder++,
          corporateSlideUrl: slide.localUrl
        })
      }

      // Title slide
      slides.push({
        id: `slide-${slideOrder}`,
        title: `${state.selectedSprint!.name} Sprint Review`,
        content: `# ${state.selectedSprint!.name} Sprint Review

**Sprint Period:** ${state.selectedSprint!.startDate || "N/A"} - ${state.selectedSprint!.endDate || "N/A"}

**Team Performance Overview**
- Total Issues: ${state.issues.length}
- Completed Issues: ${state.issues.filter((i) => i.status === "Done").length}
- Demo Stories: ${state.demoStories.length}

**Prepared by:** Sprint Review Generator
**Date:** ${new Date().toLocaleDateString()}`,
        type: "title",
        order: slideOrder++,
      })

      // Sprint Overview slide
      if (state.summaries.currentSprint) {
        slides.push({
          id: `slide-${slideOrder}`,
          title: "Sprint Overview",
          content: state.summaries.currentSprint,
          type: "summary",
          order: slideOrder++,
        })
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
          order: slideOrder++,
        });
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
          order: slideOrder++,
        })

        // Individual demo story slides
        for (const storyId of state.demoStories) {
          const story = state.issues.find((i) => i.id === storyId)
          const summary = state.summaries.demoStories[storyId]

          if (story && summary) {
            slides.push({
              id: `slide-${slideOrder}`,
              title: `Demo: ${story.key}`,
              content: summary,
              type: "demo-story",
              order: slideOrder++,
              storyId: storyId, // Add the specific story ID
            })
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
            order: slideOrder++,
            corporateSlideUrl: demoSeparators[0].localUrl
          })
        }
      }

      // Upcoming Sprint slide
      if (state.summaries.upcomingSprint) {
        slides.push({
          id: `slide-${slideOrder}`,
          title: "Upcoming Sprint Planning",
          content: state.summaries.upcomingSprint,
          type: "summary",
          order: slideOrder++,
        })
      }

      // Custom slides from uploads
      for (let i = 0; i < state.additionalSlides.length; i++) {
        const file = state.additionalSlides[i];
        const imageUrl = URL.createObjectURL(file);
        
        slides.push({
          id: `additional-slide-${slideOrder}`,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          content: "",
          type: "corporate",
          order: slideOrder++,
          corporateSlideUrl: imageUrl
        })
      }

      // Closing slide
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
        type: "summary",
        order: slideOrder++,
      })

      // Add outro corporate slides at the end
      const outroSlides = state.corporateSlides
        .filter(s => s.position === "outro" && s.isActive)
        .sort((a, b) => a.order - b.order)

      for (const slide of outroSlides) {
        slides.push({
          id: `corporate-${slide.id}`,
          title: slide.title,
          content: "",
          type: "corporate",
          order: slideOrder++,
          corporateSlideUrl: slide.localUrl
        })
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

  const exportToPDF = async () => {
    if (!presentation) return

    setIsExporting(true)
    try {
      // Simulate PDF export
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Exporting PDF...")
      toast({
        title: "PDF Export",
        description: "PDF export functionality coming soon!",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
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

  const calculateQualityScore = (checklist: Record<string, string>): number => {
    const scores = Object.values(checklist)
      .map((value) => {
        switch (value) {
          case "yes":
            return 1
          case "partial":
            return 0.5
          case "no":
            return 0
          case "na":
            return null
          default:
            return 0
        }
      })
      .filter((score): score is number => score !== null)

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
            <Button variant="outline" onClick={() => setIsPreviewMode(true)} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
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
                  <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(true)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="gap-2 bg-transparent"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    Export PDF
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
    </div>
  )
}
