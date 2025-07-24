"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Target, TrendingUp, BarChart3, Users, Calendar, User, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"
import Image from "next/image"
import { marked } from 'marked';

interface PresentationSlide {
  id: string
  title: string
  content: string | {
    accomplishments?: string
    businessValue?: string
    userImpact?: string
  }
  type: "title" | "summary" | "metrics" | "demo-story" | "custom" | "corporate" | "review-legend"
  order: number
  corporateSlideUrl?: string // Add this for corporate slides
  storyId?: string // Add the specific story ID for demo story slides
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

interface EpicGroup {
  epicKey: string
  epicName: string
  epicColor: string
  issues: Issue[]
  totalStoryPoints: number
  completedStoryPoints: number
  completionRate: number
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

interface SlideRendererProps {
  slide: PresentationSlide
  allIssues: Issue[]
  upcomingIssues: Issue[]
  sprintMetrics?: SprintMetrics | null
  isFullscreen?: boolean
}

// Background wrapper component with PowerPoint-like sizing
function SlideBackground({ children, className = "", isFullscreen = false }: { children: React.ReactNode; className?: string; isFullscreen?: boolean }) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Company Logo - positioned in bottom right corner */}
      <div className="absolute bottom-4 right-4 z-20">
        <img 
          src="/company-logos/CommandAlkon_Logo_Primary_White.svg" 
          alt="Command Alkon" 
          className={`${isFullscreen ? 'h-8 w-auto' : 'h-6 w-auto'} opacity-80 hover:opacity-100 transition-opacity`}
        />
      </div>
      
      {/* Content overlay with improved contrast and responsive padding */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  )
}

export function SlideRenderer({ slide, allIssues, upcomingIssues, sprintMetrics, isFullscreen }: SlideRendererProps) {
  // PowerPoint-like slide sizing: 16:9 aspect ratio
  // Standard mode: 960x540px (scaled down for better UX)
  // Fullscreen mode: full screen with maintained aspect ratio
  
  // Enhanced container sizing based on mode - Better fullscreen utilization
  const containerClass = isFullscreen
    ? "w-full h-full p-3 sm:p-4 lg:p-6 xl:p-8 flex flex-col justify-center min-h-0"
    : "slide-container mx-auto my-2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center min-h-0 shadow-lg border border-gray-200 rounded-lg bg-white"

  // Enhanced typography scaling based on mode - Better fullscreen optimization
  const titleClass = isFullscreen 
    ? "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold mb-3 sm:mb-4 lg:mb-6 xl:mb-8 text-center leading-tight" 
    : "text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-center leading-tight"

  // Enhanced content scaling based on mode - Better readability in fullscreen
  const contentClass = isFullscreen 
    ? "text-base sm:text-lg lg:text-xl xl:text-2xl leading-relaxed" 
    : "text-xs sm:text-sm lg:text-base leading-relaxed"

  // Responsive behavior testing
  const { isMobile, isTablet, isDesktop } = useResponsiveTest();

  // Responsive fallbacks for edge cases
  const mobileFallback = isMobile ? "overflow-y-auto max-h-full" : "";
  const tabletFallback = isTablet ? "overflow-x-hidden" : "";
  const desktopFallback = isDesktop ? "overflow-visible" : "";

  switch (slide.type) {
    case "title":
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <TitleSlide slide={slide} containerClass={containerClass} titleClass={titleClass} />
        </SlideBackground>
      )

    case "summary":
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <SummarySlide
            slide={slide}
            containerClass={containerClass}
            titleClass={titleClass}
            contentClass={contentClass}
            allIssues={allIssues}
            isFullscreen={isFullscreen}
          />
        </SlideBackground>
      )

    case "metrics":
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <MetricsSlide
            slide={slide}
            containerClass={containerClass}
            titleClass={titleClass}
            sprintMetrics={sprintMetrics}
            allIssues={allIssues}
            isFullscreen={isFullscreen}
          />
        </SlideBackground>
      )

    case "demo-story":
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <DemoStorySlide
            slide={slide}
            issues={allIssues}
            containerClass={containerClass}
            isFullscreen={isFullscreen}
          />
        </SlideBackground>
      )

    case "corporate":
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <CorporateSlide
            slide={slide}
            containerClass={containerClass}
            isFullscreen={isFullscreen}
          />
        </SlideBackground>
      )

    case "review-legend":
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <ReviewLegend
            sprintMetrics={sprintMetrics}
            issues={allIssues}
            isFullscreen={isFullscreen}
          />
        </SlideBackground>
      )

    case "custom":
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <CustomSlide slide={slide} containerClass={containerClass} titleClass={titleClass} />
        </SlideBackground>
      )

    default:
      return (
        <SlideBackground isFullscreen={isFullscreen}>
          <DefaultSlide
            slide={slide}
            containerClass={containerClass}
            titleClass={titleClass}
            contentClass={contentClass}
          />
        </SlideBackground>
      )
  }
}

function TitleSlide({ slide, containerClass, titleClass }: any) {
  return (
    <div className={`${containerClass} relative overflow-hidden`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 flex flex-col h-full overflow-hidden">
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <img 
              src="/company-logos/CommandAlkon_Logo_Primary_CMYK.svg" 
              alt="Command Alkon" 
              className="h-12 w-auto"
            />
          </div>
        </div>
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 min-h-0 flex flex-col justify-center items-center p-8 text-center overflow-y-auto max-h-[calc(100vh-10rem)]">
          <h1 className={`${titleClass} text-gray-900 font-extrabold tracking-tight mb-8`}>
            {slide.title}
          </h1>
          
          <div className="max-w-4xl mx-auto w-full">
            <div className="prose max-w-full break-words">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mb-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-medium text-gray-700 mb-3">{children}</h3>,
                  p: ({ children }) => <p className="text-base text-gray-600 mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">{children}</ul>,
                  li: ({ children }) => <li className="text-base text-gray-600">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                  em: ({ children }) => <em className="text-gray-600 italic">{children}</em>,
                }}
              >
                {slide.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 text-center text-sm text-gray-500 flex-shrink-0">
          Generated by Sprint Review Deck Generator
        </div>
      </div>
    </div>
  )
}

function SummarySlide({ slide, containerClass, titleClass, contentClass, allIssues, isFullscreen }: any) {
  return (
    <div className={`${containerClass} relative overflow-hidden`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 flex flex-col h-full overflow-hidden">
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <img 
              src="/company-logos/CommandAlkon_Logo_Primary_CMYK.svg" 
              alt="Command Alkon" 
              className="h-8 w-auto"
            />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
          <div className="flex-shrink-0 mb-4 sm:mb-6 lg:mb-8">
            <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>
              {slide.title || "Sprint Summary"}
            </h2>
            <div className="h-1 sm:h-1.5 lg:h-2 w-20 sm:w-24 lg:w-32 xl:w-40 bg-gradient-to-r from-ca-blue-600 to-ca-indigo-600 rounded-full"></div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Content Area - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-10rem)]">
              <div className="prose max-w-full break-words">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2 sm:mb-3">{children}</h3>,
                    p: ({ children }) => <p className={`${contentClass} text-gray-700 mb-3 sm:mb-4`}>{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside text-gray-700 mb-4 sm:mb-6 space-y-1 sm:space-y-2">{children}</ul>,
                    li: ({ children }) => <li className={`${contentClass} text-gray-700`}>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                    em: ({ children }) => <em className="text-gray-600 italic">{children}</em>,
                  }}
                >
                  {slide.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Epic Breakdown Section - Enhanced responsive */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8 flex-shrink-0 px-4 sm:px-6 lg:px-8 overflow-hidden">
              <EpicBreakdown issues={allIssues} isFullscreen={isFullscreen} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricsSlide({ slide, containerClass, titleClass, sprintMetrics, allIssues, isFullscreen }: any) {
  if (!sprintMetrics) {
    return (
      <div className={`${containerClass} relative overflow-hidden`}>
        {/* Enhanced overlay for better text readability */}
        <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
        
        <div className="relative z-20 flex flex-col h-full overflow-hidden">
          {/* Header with Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1"></div>
            <div className="flex items-center space-x-4">
              <img 
                src="/company-logos/CommandAlkon_Logo_Primary_CMYK.svg" 
                alt="Command Alkon" 
                className="h-8 w-auto"
              />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center overflow-y-auto max-h-[calc(100vh-10rem)]">
            <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>Sprint Metrics</h2>
            <div className="text-lg sm:text-xl text-gray-600 bg-gray-50 rounded-lg p-4">No metrics data available</div>
          </div>
        </div>
      </div>
    )
  }

  const completedIssues = allIssues.filter((issue: Issue) => issue.status === "Done")
  const completionRate = allIssues.length > 0 ? Math.round((completedIssues.length / allIssues.length) * 100) : 0

  const qualityScore = calculateQualityScore(sprintMetrics.qualityChecklist)

  return (
    <div className={`${containerClass} relative overflow-hidden`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 flex flex-col h-full overflow-hidden">
        {/* Header with Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <img 
              src="/company-logos/CommandAlkon_Logo_Primary_CMYK.svg" 
              alt="Command Alkon" 
              className="h-8 w-auto"
            />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
          <div className="flex-shrink-0 mb-4 sm:mb-6 lg:mb-8 text-center">
            <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>Sprint Metrics & Performance</h2>
            <div className="h-1 sm:h-1.5 lg:h-2 w-20 sm:w-24 lg:w-32 xl:w-40 bg-gradient-to-r from-ca-blue-600 to-ca-indigo-600 rounded-full mx-auto"></div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 flex-shrink-0">
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-ca-blue-50 to-ca-indigo-50 rounded-lg border border-ca-blue-200">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ca-blue-600 mb-2">{sprintMetrics.plannedItems}</div>
                <div className="text-sm sm:text-base text-ca-blue-700 font-medium">Planned Items</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-2">{sprintMetrics.completedTotalPoints}</div>
                <div className="text-sm sm:text-base text-green-700 font-medium">Completed Points</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-ca-orange-50 to-amber-50 rounded-lg border border-ca-orange-200">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ca-orange-600 mb-2">{sprintMetrics.testCoverage}%</div>
                <div className="text-sm sm:text-base text-ca-orange-700 font-medium">Test Coverage</div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-ca-indigo-50 to-purple-50 rounded-lg border border-ca-indigo-200">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ca-indigo-600 mb-2">{qualityScore}%</div>
                <div className="text-sm sm:text-base text-ca-indigo-700 font-medium">Quality Score</div>
              </div>
            </div>

            {/* Quality Checklist - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-10rem)]">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Quality Standards Achievement</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {Object.entries(sprintMetrics.qualityChecklist).map(([key, value]) => (
                  <div key={key} className="text-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-2">
                      {value === "yes" ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 bg-green-200 rounded-full mx-auto"></div>
                      ) : value === "partial" ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 bg-yellow-200 rounded-full mx-auto"></div>
                      ) : (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 bg-red-200 rounded-full mx-auto"></div>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm lg:text-base text-gray-600 capitalize font-medium break-words">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Demo Story Slide Component
const DemoStorySlide: React.FC<{ slide: PresentationSlide; issues: Issue[]; containerClass: string; isFullscreen?: boolean }> = ({ slide, issues, containerClass, isFullscreen }) => {
  const [imageError, setImageError] = useState(false);
  
  // Enhanced content processing with fallbacks and better organization
  const processContent = (content: string) => {
    if (!content || content.trim() === '') {
      return { hasContent: false, processedContent: '', sections: [] };
    }
    
    // Clean up markdown and handle special characters
    let processed = content
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .trim();
    
    // Parse content into sections for better organization
    const sections = processed.split(/\n(?=#+\s)/).map(section => {
      const lines = section.trim().split('\n');
      const title = lines[0].replace(/^#+\s*/, '');
      const content = lines.slice(1).join('\n').trim();
      return { title, content };
    }).filter(section => section.title && section.content);
    
    return { hasContent: true, processedContent: processed, sections };
  };

  // Enhanced demo summary processing for 4-line format
  const processDemoSummary = (content: string) => {
    if (!content || content.trim() === '') {
      return { lines: [], hasContent: false };
    }
    
    const lines = content
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 4); // Ensure max 4 lines
    
    return { lines, hasContent: lines.length > 0 };
  };

  // Handle both old string format and new structured format
  let accomplishments, businessValue, userImpact;
  
  if (typeof slide.content === 'string') {
    // Old format - parse the markdown content to extract sections
    const content = slide.content;
    accomplishments = processContent(content);
    businessValue = { hasContent: false, processedContent: '', sections: [] };
    userImpact = { hasContent: false, processedContent: '', sections: [] };
  } else {
    // New structured format
    const content = slide.content;
    accomplishments = processContent(content?.accomplishments || '');
    businessValue = processContent(content?.businessValue || '');
    userImpact = processContent(content?.userImpact || '');
  }

  // Enhanced issue details with fallbacks - now uses specific story
  const getIssueDetails = () => {
    if (!issues || issues.length === 0) {
      return null;
    }

    const issue = issues.find(i => i.id === slide.storyId) || issues[0]; // Use specific story or fallback
    
    // Enhanced epic information handling
    const epicKey = issue.epicKey || (issue.epicName && /^[A-Z]+-\d+$/.test(issue.epicName) ? issue.epicName : undefined);
    const epicName = issue.epicName || issue.epicKey || 'No Epic';
    const epicDisplay = epicKey && epicName && epicKey !== epicName ? `${epicKey}: ${epicName}` : epicName;
    
    return {
      assignee: issue.assignee || 'Unassigned',
      issueKey: issue.key || 'N/A',
      storyPoints: issue.storyPoints || 0,
      type: issue.issueType || 'Story',
      epic: epicDisplay,
      summary: issue.summary || 'No summary available'
    };
  };

  const issueDetails = getIssueDetails();
  const demoSummary = processDemoSummary(typeof slide.content === 'string' ? slide.content : '');

  // Enhanced responsive typography classes
  const titleClass = isFullscreen 
    ? "text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 sm:mb-4 lg:mb-6"
    : "text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3";

  const subtitleClass = isFullscreen
    ? "text-sm sm:text-base lg:text-lg xl:text-xl font-semibold text-white mb-2 sm:mb-3 lg:mb-4"
    : "text-sm sm:text-base lg:text-lg font-semibold text-white mb-2 sm:mb-3";

  const contentClass = isFullscreen
    ? "text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed"
    : "text-xs sm:text-sm lg:text-base leading-relaxed";

  const cardTitleClass = isFullscreen
    ? "text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-white mb-2 sm:mb-3 lg:mb-4"
    : "text-sm sm:text-base lg:text-lg font-semibold text-white mb-2 sm:mb-3";

  const cardContentClass = isFullscreen
    ? "text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed"
    : "text-xs sm:text-sm lg:text-base leading-relaxed";

  const demoLineClass = isFullscreen
    ? "text-base sm:text-lg lg:text-xl xl:text-2xl font-medium text-white leading-tight"
    : "text-sm sm:text-base lg:text-lg font-medium text-white leading-tight";

  return (
    <div className={`${containerClass} relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden`}>
      
      {/* Company Logo - positioned in top right corner for demo slides */}
      <div className="absolute top-4 right-4 z-30">
        <img 
          src="/company-logos/CommandAlkon_Logo_Primary_White.svg" 
          alt="Command Alkon" 
          className={`${isFullscreen ? 'h-8 w-auto' : 'h-6 w-auto'} opacity-90 hover:opacity-100 transition-opacity`}
        />
      </div>
      
      {/* Content Container - Enhanced responsive padding */}
      <div className={`relative z-10 flex flex-col h-full ${isFullscreen ? 'p-4 sm:p-6 lg:p-8 xl:p-10' : 'p-4 sm:p-6 lg:p-8'} overflow-hidden`}>
        {/* Header */}
        <div className="flex-shrink-0 mb-4 sm:mb-6 lg:mb-8">
          <h1 className={titleClass}>
            Demo Story
          </h1>
          <div className="h-1 sm:h-1.5 lg:h-2 w-20 sm:w-24 lg:w-32 xl:w-40 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Demo Summary Section - Enhanced for 4-line format */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-shrink-0 mb-4">
              <h2 className={subtitleClass}>
                {issueDetails?.issueKey}: {issueDetails?.summary}
              </h2>
            </div>
            
            {/* Demo Summary Content */}
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              {demoSummary.hasContent ? (
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {demoSummary.lines.map((line, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={demoLineClass}>
                          {line}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className={`${contentClass} text-gray-300`}>
                    No demo summary available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Issue Details Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20">
              <h3 className={`${cardTitleClass} text-white mb-4`}>
                Story Details
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className={`${contentClass} text-gray-300 font-medium`}>Assignee:</span>
                  <p className={`${contentClass} text-white`}>{issueDetails?.assignee}</p>
                </div>
                
                <div>
                  <span className={`${contentClass} text-gray-300 font-medium`}>Story Points:</span>
                  <p className={`${contentClass} text-white`}>{issueDetails?.storyPoints || 'Not estimated'}</p>
                </div>
                
                <div>
                  <span className={`${contentClass} text-gray-300 font-medium`}>Type:</span>
                  <p className={`${contentClass} text-white`}>{issueDetails?.type}</p>
                </div>
                
                <div>
                  <span className={`${contentClass} text-gray-300 font-medium`}>Epic:</span>
                  <p className={`${contentClass} text-white`}>{issueDetails?.epic}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function CustomSlide({ slide, containerClass, titleClass }: any) {
  return (
    <div className={`${containerClass} relative overflow-hidden`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 h-full flex flex-col overflow-hidden">
        <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
          <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>{slide.title}</h2>
          <div className="w-12 sm:w-14 lg:w-16 h-1 bg-ca-blue-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
          {slide.corporateSlideUrl ? (
            <div className="max-w-full max-h-full w-full h-full flex items-center justify-center">
              <img
                src={slide.corporateSlideUrl}
                alt={slide.title}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm max-w-full max-h-[90vh] overflow-y-auto">
                <div className="text-gray-700 mb-3 text-sm font-semibold text-center">Image Loading Error</div>
                <div className="text-xs text-gray-600 leading-relaxed text-center break-words">
                  Unable to load the uploaded image.
                  <br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    Please check the image file in the Additional Slides section.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-full max-h-full w-full h-full flex items-center justify-center">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm max-w-full max-h-[90vh] overflow-y-auto">
                <div className="text-gray-700 mb-3 text-sm font-semibold text-center">Custom Slide Content</div>
                <div className="text-xs text-gray-600 leading-relaxed text-center break-words">
                  This slide would display the uploaded image content from the Additional Slides section.
                  <br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    Upload images in the "Additional Slides" tab to see them here.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DefaultSlide({ slide, containerClass, titleClass, contentClass }: any) {
  return (
    <div className={`${containerClass} relative overflow-hidden`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 space-y-4 sm:space-y-6 lg:space-y-8 overflow-hidden">
        <div className="text-center flex-shrink-0">
          <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>{slide.title}</h2>
          <div className="w-12 sm:w-14 lg:w-16 h-1 bg-ca-blue-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        <div className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none ${contentClass} overflow-y-auto max-h-[calc(100vh-10rem)]`}>
          <div className="prose max-w-full break-words">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6 border-b border-gray-200 pb-2 break-words">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-3 lg:mb-4 mt-6 sm:mt-7 lg:mt-8 text-ca-blue-700 break-words">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg sm:text-lg lg:text-xl font-medium text-gray-700 mb-2 sm:mb-2 lg:mb-3 mt-4 sm:mt-5 lg:mt-6 break-words">{children}</h3>,
                ul: ({ children }) => <ul className="space-y-1 sm:space-y-1.5 lg:space-y-2 ml-4 sm:ml-5 lg:ml-6">{children}</ul>,
                li: ({ children }) => (
                  <li className="flex items-start space-x-2">
                    <span className="text-ca-blue-600 mt-1 font-bold">•</span>
                    <span className="text-gray-800 break-words">{children}</span>
                  </li>
                ),
                p: ({ children }) => <p className="mb-3 sm:mb-3 lg:mb-4 text-gray-700 leading-relaxed break-words">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-gray-900 break-words">{children}</strong>,
                em: ({ children }) => <em className="text-gray-600 italic break-words">{children}</em>,
              }}
            >
              {slide.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculateQualityScore(checklist: Record<string, string>): number {
  type Score = 0 | 0.5 | 1;
  
  const validScores = Object.values(checklist)
    .map((value): Score | null => {
      switch (value) {
        case "yes":
          return 1
        case "partial":
          return 0.5
        case "no":
          return 0
        case "na":
        default:
          return null
      }
    })
    .filter((score): score is Score => score !== null)

  if (validScores.length === 0) return 0
  
  const total = validScores.reduce((sum, score) => sum + score, 0 as number)
  return Math.round((total / validScores.length) * 100)
}

function CorporateSlide({ slide, containerClass, isFullscreen }: any) {
  return (
    <div className={`${containerClass} relative overflow-hidden`}>
      {/* Corporate slide image */}
      {slide.corporateSlideUrl && (
        <img
          src={slide.corporateSlideUrl}
          alt={slide.title || "Corporate Slide"}
          className="w-full h-full object-cover max-h-[90vh]"
        />
      )}
      
      {/* Company Logo overlay - positioned in bottom right corner */}
      <div className="absolute bottom-4 right-4 z-20">
        <img 
          src="/company-logos/CommandAlkon_Logo_Primary_White.svg" 
          alt="Command Alkon" 
          className={`${isFullscreen ? 'h-8 w-auto' : 'h-6 w-auto'} opacity-80 hover:opacity-100 transition-opacity drop-shadow-lg`}
        />
      </div>
      
      {/* Optional title overlay */}
      {slide.title && (
        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 max-w-[calc(100%-2rem)]">
          <h3 className="text-white text-sm font-medium break-words">{slide.title}</h3>
        </div>
      )}
    </div>
  )
}

// Test function for epic breakdown with various data scenarios
function testEpicBreakdown() {
  // Test scenario 1: Empty issues array
  const emptyIssues: Issue[] = [];
  
  // Test scenario 2: Issues without epics
  const noEpicIssues: Issue[] = [
    {
      id: "1",
      key: "PROJ-1",
      summary: "Test story without epic",
      status: "Done",
      assignee: "John Doe",
      storyPoints: 5,
      issueType: "Story",
      isSubtask: false
    },
    {
      id: "2",
      key: "PROJ-2",
      summary: "Test bug without epic",
      status: "In Progress",
      assignee: "Jane Smith",
      storyPoints: 3,
      issueType: "Bug",
      isSubtask: false
    }
  ];

  // Test scenario 3: Issues with epics
  const epicIssues: Issue[] = [
    {
      id: "3",
      key: "PROJ-3",
      summary: "Epic 1 story",
      status: "Done",
      assignee: "John Doe",
      storyPoints: 8,
      issueType: "Story",
      isSubtask: false,
      epicKey: "EPIC-1",
      epicName: "User Authentication",
      epicColor: "#3b82f6"
    },
    {
      id: "4",
      key: "PROJ-4",
      summary: "Epic 1 bug",
      status: "Done",
      assignee: "Jane Smith",
      storyPoints: 2,
      issueType: "Bug",
      isSubtask: false,
      epicKey: "EPIC-1",
      epicName: "User Authentication",
      epicColor: "#3b82f6"
    },
    {
      id: "5",
      key: "PROJ-5",
      summary: "Epic 2 story",
      status: "In Progress",
      assignee: "Bob Wilson",
      storyPoints: 13,
      issueType: "Story",
      isSubtask: false,
      epicKey: "EPIC-2",
      epicName: "Payment Integration",
      epicColor: "#f59e0b"
    }
  ];

  // Test scenario 4: Mixed scenarios
  const mixedIssues: Issue[] = [
    ...noEpicIssues,
    ...epicIssues,
    {
      id: "6",
      key: "PROJ-6",
      summary: "Zero story points issue",
      status: "To Do",
      assignee: "Alice Brown",
      storyPoints: 0,
      issueType: "Task",
      isSubtask: false,
      epicKey: "EPIC-3",
      epicName: "Documentation",
      epicColor: "#10b981"
    }
  ];

  console.log("Epic Breakdown Test Results:");
  console.log("1. Empty issues:", emptyIssues.length === 0 ? "PASS" : "FAIL");
  console.log("2. No epic issues:", noEpicIssues.length === 2 ? "PASS" : "FAIL");
  console.log("3. Epic issues:", epicIssues.length === 3 ? "PASS" : "FAIL");
  console.log("4. Mixed issues:", mixedIssues.length === 6 ? "PASS" : "FAIL");
  
  return { emptyIssues, noEpicIssues, epicIssues, mixedIssues };
}

// Epic breakdown component
function EpicBreakdown({ issues, isFullscreen }: { issues: Issue[]; isFullscreen?: boolean }) {
  // Filter out invalid issues and add debugging
  const validIssues = issues.filter(issue => 
    issue && 
    issue.id && 
    issue.key && 
    issue.summary && 
    issue.issueType
  );

  // Debug logging for epic information
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 EpicBreakdown - Issues with epic info:', validIssues.map(issue => ({
      key: issue.key,
      epicKey: issue.epicKey,
      epicName: issue.epicName,
      hasEpic: !!(issue.epicKey || issue.epicName)
    })));
  }

  // Group issues by epic with improved logic
  const epicGroups = validIssues.reduce((groups: EpicGroup[], issue) => {
    // Determine epic information with fallbacks
    const epicKey = issue.epicKey || (issue.epicName && /^[A-Z]+-\d+$/.test(issue.epicName) ? issue.epicName : undefined);
    const epicName = issue.epicName || issue.epicKey || 'No Epic';
    
    // Handle issues without epic or with invalid epic data
    if (!epicKey && !issue.epicName) {
      // Handle issues without epic
      const noEpicGroup = groups.find(g => g.epicKey === 'no-epic');
      if (noEpicGroup) {
        noEpicGroup.issues.push(issue);
        noEpicGroup.totalStoryPoints += issue.storyPoints || 0;
        if (issue.status === 'Done') {
          noEpicGroup.completedStoryPoints += issue.storyPoints || 0;
        }
      } else {
        groups.push({
          epicKey: 'no-epic',
          epicName: 'No Epic',
          epicColor: '#6b7280',
          issues: [issue],
          totalStoryPoints: issue.storyPoints || 0,
          completedStoryPoints: issue.status === 'Done' ? (issue.storyPoints || 0) : 0,
          completionRate: 0
        });
      }
    } else {
      // Use epicKey if available, otherwise use epicName as the key
      const groupKey = epicKey || `name-${epicName}`;
      const existingGroup = groups.find(g => g.epicKey === groupKey);
      if (existingGroup) {
        existingGroup.issues.push(issue);
        existingGroup.totalStoryPoints += issue.storyPoints || 0;
        if (issue.status === 'Done') {
          existingGroup.completedStoryPoints += issue.storyPoints || 0;
        }
      } else {
        groups.push({
          epicKey: groupKey,
          epicName: epicName,
          epicColor: issue.epicColor || '#3b82f6',
          issues: [issue],
          totalStoryPoints: issue.storyPoints || 0,
          completedStoryPoints: issue.status === 'Done' ? (issue.storyPoints || 0) : 0,
          completionRate: 0
        });
      }
    }
    return groups;
  }, []);

  // Calculate completion rates and additional statistics
  epicGroups.forEach(group => {
    group.completionRate = group.totalStoryPoints > 0 
      ? Math.round((group.completedStoryPoints / group.totalStoryPoints) * 100) 
      : 0;
  });

  // Sort by completion rate (descending), then by epic name
  epicGroups.sort((a, b) => {
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }
    return a.epicName.localeCompare(b.epicName);
  });

  // Calculate overall sprint statistics
  const totalIssues = validIssues.length;
  const completedIssues = validIssues.filter(i => i.status === 'Done').length;
  const totalStoryPoints = validIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const completedStoryPoints = validIssues
    .filter(i => i.status === 'Done')
    .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const overallCompletionRate = totalStoryPoints > 0 
    ? Math.round((completedStoryPoints / totalStoryPoints) * 100) 
    : 0;

  // Handle empty or invalid data
  if (validIssues.length === 0) {
    return (
      <div className="text-center text-gray-600 py-4">
        <div className="text-sm sm:text-base">No valid issues data available</div>
      </div>
    );
  }

  if (epicGroups.length === 0) {
    return (
      <div className="text-center text-gray-600 py-4">
        <div className="text-sm sm:text-base">No epic data available</div>
      </div>
    );
  }

  const gridClass = isFullscreen 
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
    : "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4";

  return (
    <div className="space-y-2 sm:space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center border-b border-ca-blue-600 pb-1">
        Epic Breakdown
      </h3>
      
      {/* Overall Sprint Statistics - Ultra Compact */}
      <div className="bg-gradient-to-br from-ca-blue-50 via-ca-indigo-50 to-ca-blue-100 rounded-lg p-2 border border-ca-blue-200 shadow-sm">
        <h4 className="text-xs font-bold text-ca-blue-900 mb-1 text-center">Sprint Overview</h4>
        <div className="grid grid-cols-4 gap-1">
          <div className="text-center bg-white/60 rounded p-1">
            <div className="text-xs font-bold text-ca-blue-600">{totalIssues}</div>
            <div className="text-xs text-ca-blue-700 font-medium">Total</div>
          </div>
          <div className="text-center bg-white/60 rounded p-1">
            <div className="text-xs font-bold text-green-600">{completedIssues}</div>
            <div className="text-xs text-green-700 font-medium">Done</div>
          </div>
          <div className="text-center bg-white/60 rounded p-1">
            <div className="text-xs font-bold text-ca-orange-600">{totalStoryPoints}</div>
            <div className="text-xs text-ca-orange-700 font-medium">Points</div>
          </div>
          <div className="text-center bg-white/60 rounded p-1">
            <div className="text-xs font-bold text-ca-indigo-600">{overallCompletionRate}%</div>
            <div className="text-xs text-ca-indigo-700 font-medium">Complete</div>
          </div>
        </div>
      </div>
      
      {/* Epic Groups - Ultra Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {epicGroups.slice(0, 4).map((group) => (
          <div 
            key={group.epicKey}
            className="bg-white rounded p-2 border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.epicColor }}
                ></div>
                <h4 className="font-bold text-gray-900 text-xs truncate">
                  {group.epicName}
                </h4>
              </div>
              <div className="text-xs text-ca-blue-600 font-medium bg-ca-blue-50 px-1 py-0.5 rounded flex-shrink-0">
                {group.issues.length}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Points:</span>
                <span className="font-bold text-ca-orange-600">
                  {group.completedStoryPoints}/{group.totalStoryPoints}
                </span>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Complete:</span>
                <span className={`font-bold ${group.completionRate >= 80 ? 'text-green-600' : group.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {group.completionRate}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${
                    group.completionRate >= 80 ? 'bg-green-500' : 
                    group.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${group.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        {epicGroups.length > 4 && (
          <div className="col-span-full text-center text-xs text-gray-500 py-1">
            +{epicGroups.length - 4} more epics
          </div>
        )}
      </div>
    </div>
  );
}

// Test function for Review Legend
function testReviewLegend() {
  const testIssues: Issue[] = [
    {
      id: "1",
      key: "PROJ-1",
      summary: "Feature A Implementation",
      status: "Done",
      assignee: "John Doe",
      storyPoints: 5,
      issueType: "Story",
      isSubtask: false,
      epicKey: "EPIC-1",
      epicName: "User Management",
      epicColor: "#3b82f6"
    },
    {
      id: "2",
      key: "PROJ-2",
      summary: "Bug Fix for Login",
      status: "Done",
      assignee: "Jane Smith",
      storyPoints: 3,
      issueType: "Bug",
      isSubtask: false,
      epicKey: "EPIC-1",
      epicName: "User Management",
      epicColor: "#3b82f6"
    },
    {
      id: "3",
      key: "PROJ-3",
      summary: "API Integration",
      status: "In Progress",
      assignee: "Bob Johnson",
      storyPoints: 8,
      issueType: "Story",
      isSubtask: false,
      epicKey: "EPIC-2",
      epicName: "Data Processing",
      epicColor: "#10b981"
    },
    {
      id: "4",
      key: "PROJ-4",
      summary: "Performance Optimization",
      status: "To Do",
      assignee: "Alice Brown",
      storyPoints: 13,
      issueType: "Story",
      isSubtask: false,
      epicKey: "EPIC-3",
      epicName: "System Performance",
      epicColor: "#f59e0b"
    }
  ];

  const testMetrics: SprintMetrics = {
    plannedItems: 4,
    estimatedPoints: 29,
    carryForwardPoints: 0,
    committedBufferPoints: 5,
    completedBufferPoints: 3,
    testCoverage: 85,
    sprintNumber: "Sprint 15",
    completedTotalPoints: 8,
    completedAdjustedPoints: 8,
    qualityChecklist: {
      "Code Review": "yes",
      "Unit Tests": "yes",
      "Integration Tests": "partial",
      "Documentation": "yes",
      "Security Review": "no"
    }
  };

  return { testIssues, testMetrics };
}

// Review Legend Component
const ReviewLegend: React.FC<{ 
  sprintMetrics?: SprintMetrics | null; 
  issues: Issue[]; 
  isFullscreen?: boolean 
}> = ({ sprintMetrics, issues, isFullscreen }) => {
  // Enhanced error handling and edge cases
  const safeIssues = Array.isArray(issues) ? issues : [];
  const totalIssues = safeIssues.length;
  const completedIssues = safeIssues.filter(issue => issue.status === 'Done').length;
  const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
  
  // Calculate epic breakdown for legend with enhanced error handling
  const epicStats = safeIssues.reduce((acc, issue) => {
    const epicKey = issue.epicKey || 'No Epic';
    const epicName = issue.epicName || 'No Epic';
    const epicColor = issue.epicColor || '#6b7280';
    
    if (!acc[epicKey]) {
      acc[epicKey] = {
        name: epicName,
        color: epicColor,
        total: 0,
        completed: 0,
        storyPoints: 0
      };
    }
    
    acc[epicKey].total++;
    if (issue.status === 'Done') {
      acc[epicKey].completed++;
    }
    acc[epicKey].storyPoints += issue.storyPoints || 0;
    
    return acc;
  }, {} as Record<string, { name: string; color: string; total: number; completed: number; storyPoints: number }>);

  // Calculate quality score if metrics available
  const qualityScore = sprintMetrics?.qualityChecklist 
    ? calculateQualityScore(sprintMetrics.qualityChecklist)
    : null;

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Template */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/corporate-slides/blank_template.png"
          alt="Slide background"
          fill
          className="object-cover"
          priority
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
          }}
        />
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full p-6 lg:p-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            Sprint Review Legend
          </h1>
          <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Sprint Overview */}
          <div className="space-y-4 sm:space-y-6">
            {/* Sprint Metrics Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Sprint Overview
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Total Issues:</span>
                  <p className="text-white font-medium">{totalIssues}</p>
                </div>
                <div>
                  <span className="text-gray-300">Completed:</span>
                  <p className="text-white font-medium">{completedIssues}</p>
                </div>
                <div>
                  <span className="text-gray-300">Completion Rate:</span>
                  <p className="text-white font-medium">{completionRate}%</p>
                </div>
                {sprintMetrics && (
                  <div>
                    <span className="text-gray-300">Story Points:</span>
                    <p className="text-white font-medium">{sprintMetrics.completedTotalPoints}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quality Indicators */}
            {qualityScore !== null && (
              <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-emerald-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                  Quality Score
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-white">{Math.round(qualityScore * 100)}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${qualityScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Epic Legend */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-400" />
                Epic Breakdown
              </h3>
              <div className="space-y-3">
                {Object.keys(epicStats).length > 0 ? (
                  Object.entries(epicStats).map(([epicKey, stats]) => (
                    <div key={epicKey} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div className="flex items-center space-x-2 sm:space-x-3 min-h-[44px]">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stats.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{stats.name}</p>
                      <p className="text-gray-400 text-xs">{stats.completed}/{stats.total} issues</p>
                    </div>
                  </div>
                      <div className="text-right">
                        <p className="text-white font-medium text-sm">{stats.storyPoints} pts</p>
                        <p className="text-gray-400 text-xs">
                          {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Target className="w-8 h-8 mx-auto mb-2" />
                    <p>No epic data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Legend Key */}
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                Legend Key
              </h3>
              <div className="space-y-3 sm:space-y-2 text-sm">
                <div className="flex items-center space-x-2 min-h-[32px]">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white">Completed</span>
                </div>
                <div className="flex items-center space-x-2 min-h-[32px]">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white">In Progress</span>
                </div>
                <div className="flex items-center space-x-2 min-h-[32px]">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white">Blocked</span>
                </div>
                <div className="flex items-center space-x-2 min-h-[32px]">
                  <div className="w-3 h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
                  <span className="text-white">Not Started</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Responsive testing utilities
function useResponsiveTest() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, isTablet, isDesktop };
}

// Enhanced responsive container with testing and touch-friendly interactions
function ResponsiveContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { isMobile, isTablet, isDesktop } = useResponsiveTest();
  
  const responsiveClasses = isMobile 
    ? "p-3 text-xs touch-manipulation" 
    : isTablet 
    ? "p-4 text-sm touch-manipulation" 
    : "p-6 text-base";

  return (
    <div className={`${responsiveClasses} ${className}`}>
      {children}
    </div>
  );
}
