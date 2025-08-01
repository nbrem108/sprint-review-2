"use client"

import { useState, useEffect, useCallback } from "react"
import { SlideRenderer } from "./slide-renderer"
import { PresentationControls } from "./presentation-controls"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Minimize, X } from "lucide-react"
import { exportService, type ExportResult } from "@/lib/export-service"

interface PresentationSlide {
  id: string
  title: string
  content: string
  type: "title" | "summary" | "demo-story" | "custom" | "corporate" | "qa" | "executive" | "quarterly-plan"
  order: number
  corporateSlideUrl?: string
}

interface Issue {
  id: string
  key: string
  summary: string
  description?: string
  status: string
  assignee?: string
  storyPoints?: number
  issueType: string
  isSubtask: boolean
  epicKey?: string
  epicName?: string
  epicColor?: string
  releaseNotes?: string
}

interface SprintMetrics {
  plannedItems: number
  estimatedPoints: number
  carryForwardPoints: number
  committedBufferPoints: number
  completedBufferPoints: number
  testCoverage: number
  sprintNumber: string
  completedTotalPoints: number
  completedAdjustedPoints: number
  qualityChecklist: Record<string, "yes" | "no" | "partial" | "na">
}

interface CorporateSlide {
  id: string
  filename: string
  localUrl: string
  title: string
  position: "intro" | "meeting-guidelines" | "section-break" | "outro" | "custom"
  order: number
  isActive: boolean
}

interface PresentationModeProps {
  slides: PresentationSlide[]
  allIssues: Issue[]
  upcomingIssues: Issue[]
  sprintMetrics?: SprintMetrics | null
  corporateSlides?: CorporateSlide[]
  demoStoryScreenshots?: Record<string, string>
  onClose: () => void
}

export function PresentationMode({ 
  slides, 
  allIssues, 
  upcomingIssues, 
  sprintMetrics, 
  corporateSlides = [],
  demoStoryScreenshots = {},
  onClose 
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingMarkdown, setIsExportingMarkdown] = useState(false)
  const [isExportingDigest, setIsExportingDigest] = useState(false)
  const [isExportingAdvancedDigest, setIsExportingAdvancedDigest] = useState(false)
  const [isExportingExecutive, setIsExportingExecutive] = useState(false)

  // Function to get all slides in order
  const getAllSlides = useCallback(() => {
    // Since slides are now generated with correct order in presentation tab,
    // we just need to deduplicate and sort them
    const allSlidesArray = [...slides];
    
    // Deduplicate by ID to prevent React key errors
    const seenIds = new Set<string>();
    const deduplicatedSlides = allSlidesArray.filter(slide => {
      if (seenIds.has(slide.id)) {
        console.warn("Duplicate slide ID found and removed:", slide.id);
        return false;
      }
      seenIds.add(slide.id);
      return true;
    });
    
    return deduplicatedSlides.sort((a, b) => a.order - b.order);
  }, [slides]);

  // Use the combined slides
  const allSlides = getAllSlides();

  // Update slide navigation to use allSlides
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < allSlides.length - 1 ? prev + 1 : prev))
  }, [allSlides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
  }, [])

  // Fullscreen functions
  const enterFullscreen = async () => {
    try {
      const slideContainer = document.getElementById("slide-container")
      if (slideContainer?.requestFullscreen) {
        await slideContainer.requestFullscreen()
      }
    } catch (error) {
      console.error("Error entering fullscreen:", error)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error)
    }
  }

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => {
          if (prev < allSlides.length - 1) {
            return prev + 1
          } else {
            setIsPlaying(false)
            return prev
          }
        })
      }, 5000) // 5 seconds per slide

      return () => clearInterval(interval)
    }
  }, [isPlaying, allSlides.length])

  // Keyboard navigation
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (showShortcuts) return

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault()
          nextSlide()
          break
        case "ArrowLeft":
          e.preventDefault()
          prevSlide()
          break
        case "Escape":
          if (isFullscreen) {
            exitFullscreen()
          } else {
            onClose()
          }
          break
        case "f":
        case "F11":
          e.preventDefault()
          toggleFullscreen()
          break
        case "?":
          setShowShortcuts(true)
          break
        case "p":
          setIsPlaying(!isPlaying)
          break
      }
    },
    [nextSlide, prevSlide, isFullscreen, showShortcuts, isPlaying, onClose],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Export functions


  const exportMarkdown = async () => {
    setIsExportingMarkdown(true)
    try {
      // Create presentation object for export
      const presentation = {
        id: `presentation-${Date.now()}`,
        title: allSlides[0]?.title || 'Sprint Review',
        slides: allSlides,
        createdAt: new Date().toISOString(),
        metadata: {
          sprintName: allSlides[0]?.title || 'Sprint Review',
          totalSlides: allSlides.length,
          hasMetrics: !!sprintMetrics,
          demoStoriesCount: allSlides.filter(s => s.type === 'demo-story').length,
          customSlidesCount: allSlides.filter(s => s.type === 'corporate').length,
        },
      }

      // Call API endpoint for Markdown export
      const response = await fetch('/api/export/markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues,
          upcomingIssues,
          sprintMetrics,
          options: { format: 'markdown' }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export Markdown')
      }

      // Download the file
      const blob = await response.blob()
      const fileName = exportService.generateFileName(presentation, 'md')
      const result: ExportResult = {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'markdown',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: 0,
          quality: 'medium'
        }
      }
      exportService.downloadFile(result)

      console.log("Markdown export completed successfully")
    } catch (error) {
      console.error("Export error:", error)
      // You could add toast notification here
    } finally {
      setIsExportingMarkdown(false)
    }
  }

  const exportDigest = async () => {
    setIsExportingDigest(true)
    try {
      // Create presentation object for export
      const presentation = {
        id: `presentation-${Date.now()}`,
        title: allSlides[0]?.title || 'Sprint Review',
        slides: allSlides,
        createdAt: new Date().toISOString(),
        metadata: {
          sprintName: allSlides[0]?.title || 'Sprint Review',
          totalSlides: allSlides.length,
          hasMetrics: !!sprintMetrics,
          demoStoriesCount: allSlides.filter(s => s.type === 'demo-story').length,
          customSlidesCount: allSlides.filter(s => s.type === 'corporate').length,
        },
      }

      // Call API endpoint for Digest export
      const response = await fetch('/api/export/digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues,
          upcomingIssues,
          sprintMetrics,
          options: { format: 'digest', quality: 'high' },
          demoStoryScreenshots
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export Digest')
      }

      // Download the file
      const blob = await response.blob()
      const fileName = exportService.generateFileName(presentation, 'pdf')
      const result: ExportResult = {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'pdf',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: 0,
          quality: 'high'
        }
      }
      exportService.downloadFile(result)

      console.log("Digest export completed successfully")
    } catch (error) {
      console.error("Export error:", error)
      // You could add toast notification here
    } finally {
      setIsExportingDigest(false)
    }
  }

  const exportAdvancedDigest = async () => {
    setIsExportingAdvancedDigest(true)
    try {
      // Create presentation object for export
      const presentation = {
        id: `presentation-${Date.now()}`,
        title: allSlides[0]?.title || 'Sprint Review',
        slides: allSlides,
        createdAt: new Date().toISOString(),
        metadata: {
          sprintName: allSlides[0]?.title || 'Sprint Review',
          totalSlides: allSlides.length,
          hasMetrics: !!sprintMetrics,
          demoStoriesCount: allSlides.filter(s => s.type === 'demo-story').length,
          customSlidesCount: allSlides.filter(s => s.type === 'corporate').length,
        },
      }

      // Call API endpoint for Advanced Digest export
      const response = await fetch('/api/generate-advanced-digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues,
          upcomingIssues,
          sprintMetrics,
          options: { format: 'advanced-digest' },
          demoStoryScreenshots
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export Advanced Digest')
      }

      // Download the file
      const blob = await response.blob()
      const fileName = exportService.generateFileName(presentation, 'pdf')
      const result: ExportResult = {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'pdf',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: 0,
          quality: 'medium'
        }
      }
      exportService.downloadFile(result)

      console.log("Advanced Digest export completed successfully")
    } catch (error) {
      console.error("Export error:", error)
      // You could add toast notification here
    } finally {
      setIsExportingAdvancedDigest(false)
    }
  }

  const exportExecutive = async () => {
    setIsExportingExecutive(true)
    try {
      // Create presentation object for export
      const presentation = {
        id: `presentation-${Date.now()}`,
        title: allSlides[0]?.title || 'Sprint Review',
        slides: allSlides,
        createdAt: new Date().toISOString(),
        metadata: {
          sprintName: allSlides[0]?.title || 'Sprint Review',
          totalSlides: allSlides.length,
          hasMetrics: !!sprintMetrics,
          demoStoriesCount: allSlides.filter(s => s.type === 'demo-story').length,
          customSlidesCount: allSlides.filter(s => s.type === 'corporate').length,
        },
      }

      // Call API endpoint for Executive export
      const response = await fetch('/api/export/executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation,
          allIssues,
          upcomingIssues,
          sprintMetrics,
          options: { format: 'executive' }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to export Executive Summary')
      }

      // Download the file
      const blob = await response.blob()
      const fileName = exportService.generateFileName(presentation, 'html')
      const result: ExportResult = {
        blob,
        fileName,
        fileSize: blob.size,
        format: 'html',
        metadata: {
          slideCount: presentation.slides.length,
          processingTime: 0,
          quality: 'high'
        }
      }
      exportService.downloadFile(result)

      console.log("Executive Summary export completed successfully")
    } catch (error) {
      console.error("Export error:", error)
      // You could add toast notification here
    } finally {
      setIsExportingExecutive(false)
    }
  }



  if (allSlides.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Presentation Data</h3>
          <p className="text-gray-600">Generate slides first to view presentation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header Controls (only visible when not in fullscreen) */}
      {!isFullscreen && (
        <div className="bg-white border-b">
          <PresentationControls
            currentSlide={currentSlide}
            totalSlides={allSlides.length}
            isPlaying={isPlaying}
            isFullscreen={isFullscreen}
            isExporting={isExporting}
            isExportingMarkdown={isExportingMarkdown}
            isExportingDigest={isExportingDigest}
            isExportingAdvancedDigest={isExportingAdvancedDigest}
            isExportingExecutive={isExportingExecutive}
            onPrevSlide={prevSlide}
            onNextSlide={nextSlide}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onToggleFullscreen={toggleFullscreen}
            onExportMarkdown={exportMarkdown}
            onExportDigest={exportDigest}
            onExportAdvancedDigest={exportAdvancedDigest}
            onExportExecutive={exportExecutive}
            onShowShortcuts={() => setShowShortcuts(true)}
            onGoToSlide={goToSlide}
          />
        </div>
      )}

      {/* Close button (top-left when not fullscreen) */}
      {!isFullscreen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 bg-white/90 hover:bg-white"
        >
          <X className="w-4 h-4 mr-2" />
          Exit Presentation
        </Button>
      )}

      {/* Slide Content */}
      <div id="slide-container" className={`flex-1 relative overflow-hidden ${!isFullscreen ? 'bg-gray-50 slide-content-wrapper p-1 sm:p-2' : 'bg-black'}`}>
        <SlideRenderer
          slide={allSlides[currentSlide]}
          allIssues={allIssues}
          upcomingIssues={upcomingIssues}
          sprintMetrics={sprintMetrics}
          isFullscreen={isFullscreen}
        />

        {/* Fullscreen controls overlay - PowerPoint-like subtle controls */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-white text-xs px-2 font-medium">
              {currentSlide + 1} / {allSlides.length}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={currentSlide === allSlides.length - 1}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Exit fullscreen button - top right corner */}
        {isFullscreen && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={exitFullscreen} 
            className="absolute top-4 right-4 text-white hover:bg-white/20 h-8 w-8 p-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Auto-play indicator */}
        {isPlaying && (
          <div className={`absolute ${isFullscreen ? 'top-4 left-4' : 'bottom-4 left-4'} bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2 ${isFullscreen ? 'opacity-0 hover:opacity-100 transition-opacity duration-300' : ''}`}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Auto-playing</span>
          </div>
        )}
      </div>

      {/* Slide Thumbnails (bottom, hidden in fullscreen) */}
      {!isFullscreen && (
        <div className="bg-gray-100 border-t p-4">
          <div className="flex space-x-2 overflow-x-auto">
            {allSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-24 h-16 rounded border-2 transition-all ${
                  index === currentSlide
                    ? "border-blue-600 bg-blue-50 shadow-md"
                    : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm"
                }`}
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-xs">
                  <div className="font-medium text-gray-700">{index + 1}</div>
                  <div className="text-gray-500 truncate w-full px-1">
                    {slide.title.length > 12 ? `${slide.title.substring(0, 12)}...` : slide.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Next slide</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→ or Space</kbd>
              </div>
              <div className="flex justify-between">
                <span>Previous slide</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd>
              </div>
              <div className="flex justify-between">
                <span>Toggle fullscreen</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F or F11</kbd>
              </div>
              <div className="flex justify-between">
                <span>Toggle auto-play</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">P</kbd>
              </div>
              <div className="flex justify-between">
                <span>Exit presentation</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
              </div>
              <div className="flex justify-between">
                <span>Show this help</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
