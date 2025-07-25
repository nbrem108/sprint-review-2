"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Play,
  Pause,
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileBarChart,
  Loader2,
  HelpCircle,
  ChevronDown,
} from "lucide-react"

interface PresentationControlsProps {
  currentSlide: number
  totalSlides: number
  isPlaying: boolean
  isFullscreen: boolean
  isExporting: boolean
  isExportingMarkdown: boolean
  isExportingDigest: boolean
  isExportingAdvancedDigest: boolean
  onPrevSlide: () => void
  onNextSlide: () => void
  onTogglePlay: () => void
  onToggleFullscreen: () => void
  onExportHTML: () => void
  onExportMarkdown: () => void
  onExportPDF: () => void
  onExportDigest: () => void
  onExportAdvancedDigest: () => void
  onShowShortcuts: () => void
  onGoToSlide: (index: number) => void
}

export function PresentationControls({
  currentSlide,
  totalSlides,
  isPlaying,
  isFullscreen,
  isExporting,
  isExportingMarkdown,
  isExportingDigest,
  isExportingAdvancedDigest,
  onPrevSlide,
  onNextSlide,
  onTogglePlay,
  onToggleFullscreen,
  onExportHTML,
  onExportMarkdown,
  onExportPDF,
  onExportDigest,
  onExportAdvancedDigest,
  onShowShortcuts,
  onGoToSlide,
}: PresentationControlsProps) {
  return (
    <div className="bg-gray-50 border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Left: Navigation Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevSlide}
            disabled={currentSlide === 0}
            className="gap-2 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="gap-2 bg-transparent"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>

          <div className="mx-4 flex items-center space-x-2">
            <Badge variant="secondary" className="px-3 py-1">
              {currentSlide + 1} of {totalSlides}
            </Badge>
          </div>

          <Button variant="outline" size="sm" onClick={onTogglePlay} className="gap-2 bg-transparent">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>

        {/* Center: Slide Progress */}
        <div className="hidden md:flex items-center space-x-2 flex-1 max-w-md mx-8">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: View and Export Controls */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onShowShortcuts} className="gap-2 bg-transparent">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onToggleFullscreen} className="gap-2 bg-transparent">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-4 h-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={onExportPDF}
                className="gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 opacity-60" />
                PDF Export
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onExportHTML}
                disabled={isExporting}
                className="gap-2 cursor-pointer"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                ) : (
                  <FileCode className="w-4 h-4 opacity-60" />
                )}
                HTML Export
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onExportMarkdown}
                disabled={isExportingMarkdown}
                className="gap-2 cursor-pointer"
              >
                {isExportingMarkdown ? (
                  <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                ) : (
                  <FileText className="w-4 h-4 opacity-60" />
                )}
                Markdown Export
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onExportDigest}
                disabled={isExportingDigest}
                className="gap-2 cursor-pointer"
              >
                {isExportingDigest ? (
                  <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                ) : (
                  <FileText className="w-4 h-4 opacity-60" />
                )}
                Sprint Digest
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={onExportAdvancedDigest}
                disabled={isExportingAdvancedDigest}
                className="gap-2 cursor-pointer"
              >
                {isExportingAdvancedDigest ? (
                  <Loader2 className="w-4 h-4 animate-spin opacity-60" />
                ) : (
                  <FileBarChart className="w-4 h-4 opacity-60" />
                )}
                Advanced Digest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
