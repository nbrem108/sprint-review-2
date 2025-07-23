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
}

interface Issue {
  id: string
  key: string
  summary: string
  status: string
  assignee?: string
  storyPoints?: number
  issueType: string
  isSubtask: boolean
  epicKey?: string
  epicName?: string
  epicColor?: string
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
  
  // Container sizing based on mode
  const containerClass = isFullscreen
    ? "w-full h-full p-3 sm:p-6 lg:p-8 xl:p-12 flex flex-col justify-center min-h-0"
    : "slide-container mx-auto my-2 p-4 sm:p-6 lg:p-8 flex flex-col justify-center min-h-0 shadow-lg border border-gray-200 rounded-lg bg-white"

  // Typography scaling based on mode
  const titleClass = isFullscreen 
    ? "text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold mb-3 sm:mb-4 lg:mb-6 xl:mb-8 text-center leading-tight" 
    : "text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4 text-center leading-tight"

  // Content scaling based on mode
  const contentClass = isFullscreen 
    ? "text-sm sm:text-base lg:text-lg xl:text-2xl leading-relaxed" 
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
    <div className={`${containerClass} relative`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
      
      <div className="relative z-20 text-center space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          <h1 className={`${titleClass} text-white drop-shadow-lg font-extrabold tracking-tight`}>{slide.title}</h1>
          <div className="w-16 sm:w-20 lg:w-24 h-1 bg-white/80 mx-auto rounded-full shadow-sm"></div>
        </div>

        <div className="prose prose-sm sm:prose-lg lg:prose-xl prose-invert max-w-none text-center">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="text-white/95 drop-shadow-md leading-relaxed">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-white drop-shadow-md">{children}</strong>,
              em: ({ children }) => <em className="text-white/90 italic drop-shadow-md">{children}</em>,
            }}
          >
            {slide.content}
          </ReactMarkdown>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-8 text-white/95">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 drop-shadow-sm" />
            <span className="text-sm sm:text-base font-medium">Sprint Review</span>
          </div>
          <div className="hidden sm:block w-2 h-2 bg-white/80 rounded-full shadow-sm"></div>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 drop-shadow-sm" />
            <span className="text-sm sm:text-base font-medium">Team Presentation</span>
          </div>
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
      
      <div className="relative z-20 h-full flex flex-col">
        <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
          <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>{slide.title}</h2>
          <div className="w-12 sm:w-14 lg:w-16 h-1 bg-ca-blue-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {/* Summary Content - Compact */}
          <div className="flex-1 min-h-0 overflow-y-auto mb-3 sm:mb-4">
            <div className={`prose prose-sm sm:prose-base max-w-none ${contentClass} slide-content slide-overflow`}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 border-b border-gray-200 pb-1 slide-readable">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 mt-3 sm:mt-4 text-ca-blue-700 slide-readable">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-700 mb-1 sm:mb-2 mt-2 sm:mt-3 slide-readable">{children}</h3>,
                  ul: ({ children }) => <ul className="space-y-1 ml-3 sm:ml-4">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start space-x-2">
                      <span className="text-ca-blue-600 mt-1 font-bold text-xs">•</span>
                      <span className="text-gray-800 text-sm slide-readable">{children}</span>
                    </li>
                  ),
                  p: ({ children }) => <p className="mb-2 sm:mb-3 text-gray-700 leading-relaxed text-sm slide-readable">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="text-gray-600 italic">{children}</em>,
                }}
              >
                {slide.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Epic Breakdown Section - Compact version */}
          <div className="border-t border-gray-200 pt-3 flex-shrink-0">
            <EpicBreakdown issues={allIssues} isFullscreen={isFullscreen} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricsSlide({ slide, containerClass, titleClass, sprintMetrics, allIssues, isFullscreen }: any) {
  if (!sprintMetrics) {
    return (
      <div className={`${containerClass} relative`}>
        {/* Enhanced overlay for better text readability */}
        <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
        
        <div className="relative z-20 text-center space-y-4 sm:space-y-6 lg:space-y-8">
          <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>Sprint Metrics</h2>
          <div className="text-lg sm:text-xl text-gray-600 bg-gray-50 rounded-lg p-4">No metrics data available</div>
        </div>
      </div>
    )
  }

  const completedIssues = allIssues.filter((issue: Issue) => issue.status === "Done")
  const completionRate = allIssues.length > 0 ? Math.round((completedIssues.length / allIssues.length) * 100) : 0

  const qualityScore = calculateQualityScore(sprintMetrics.qualityChecklist)

  // Responsive grid classes
  const gridClass = isFullscreen 
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8" 
    : "grid grid-cols-2 gap-2 sm:gap-3"
  
  // Responsive metric card classes with enhanced styling
  const metricCardClass = isFullscreen 
    ? "text-center p-3 sm:p-4 lg:p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow" 
    : "text-center p-2 sm:p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
  
  // Responsive metric value classes
  const metricValueClass = isFullscreen 
    ? "text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2" 
    : "text-lg sm:text-xl font-bold mb-1"
  
  // Responsive metric label classes
  const metricLabelClass = isFullscreen 
    ? "text-sm sm:text-base lg:text-lg text-gray-600 font-medium" 
    : "text-xs sm:text-sm text-gray-600 font-medium"

  return (
    <div className={`${containerClass} relative`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="text-center">
          <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>Sprint {sprintMetrics.sprintNumber} Metrics</h2>
          <div className="w-12 sm:w-14 lg:w-16 h-1 bg-ca-blue-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        {/* Key Metrics Grid */}
        <div className={gridClass}>
          <div className={metricCardClass}>
            <div className={`${metricValueClass} text-ca-blue-600`}>{completionRate}%</div>
            <div className={metricLabelClass}>Completion Rate</div>
            <div className="flex justify-center mt-1 sm:mt-2">
              {completionRate >= 80 ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-500 drop-shadow-sm" />
              ) : (
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-500 drop-shadow-sm" />
              )}
            </div>
          </div>

          <div className={metricCardClass}>
            <div className={`${metricValueClass} text-ca-orange-600`}>{sprintMetrics.completedTotalPoints}</div>
            <div className={metricLabelClass}>Story Points</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">of {sprintMetrics.estimatedPoints} planned</div>
          </div>

          <div className={metricCardClass}>
            <div className={`${metricValueClass} text-ca-indigo-600`}>{sprintMetrics.testCoverage}%</div>
            <div className={metricLabelClass}>Test Coverage</div>
            <div className="flex justify-center mt-1 sm:mt-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-ca-indigo-500 drop-shadow-sm" />
            </div>
          </div>

          <div className={metricCardClass}>
            <div
              className={`${metricValueClass} ${qualityScore >= 80 ? "text-green-600" : qualityScore >= 60 ? "text-yellow-600" : "text-red-600"}`}
            >
              {qualityScore}%
            </div>
            <div className={metricLabelClass}>Quality Score</div>
            <div className="flex justify-center mt-1 sm:mt-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-500 drop-shadow-sm" />
            </div>
          </div>
        </div>

        {/* Quality Standards Summary */}
        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 lg:p-4 border border-gray-200">
          <h3 className="text-sm sm:text-base font-bold mb-2 sm:mb-3 text-center text-gray-900">Quality Standards Achievement</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2">
            {Object.entries(sprintMetrics.qualityChecklist)
              .slice(0, 10)
              .map(([key, value]) => (
                <div key={key} className="text-center bg-white rounded-lg p-1 sm:p-2 shadow-sm">
                  <div className="mb-1">
                    {value === "yes" ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mx-auto drop-shadow-sm" />
                    ) : value === "partial" ? (
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 mx-auto drop-shadow-sm" />
                    ) : value === "na" ? (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-200 rounded-full mx-auto"></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 capitalize font-medium">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                </div>
              ))}
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

  // Enhanced issue details with fallbacks
  const getIssueDetails = () => {
    if (!issues || issues.length === 0) {
      return null;
    }

    const issue = issues[0]; // Primary issue for demo story
    return {
      assignee: issue.assignee || 'Unassigned',
      issueKey: issue.key || 'N/A',
      storyPoints: issue.storyPoints || 0,
      type: issue.issueType || 'Story',
      epic: issue.epicName || 'No Epic',
      summary: issue.summary || 'No summary available'
    };
  };

  const issueDetails = getIssueDetails();

  return (
    <div className={`${containerClass} relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden`}>
      
      {/* Content Container - Adjusted for PowerPoint-like sizing */}
      <div className="relative z-10 flex flex-col h-full p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-3 sm:mb-4 flex-shrink-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
            Demo Story
          </h1>
          <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Issue Details & Accomplishments */}
          <div className="flex flex-col space-y-4 sm:space-y-5">
            {/* Issue Details Card - Compact */}
            {issueDetails && (
              <div className="bg-black/50 backdrop-blur-lg rounded-xl p-3 sm:p-4 border border-white/40 flex-shrink-0">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-400" />
                  Issue Details
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-300 text-xs">Assignee:</span>
                    <p className="text-white font-medium slide-content slide-overflow">{issueDetails.assignee}</p>
                  </div>
                  <div>
                    <span className="text-gray-300 text-xs">Issue Key:</span>
                    <p className="text-white font-medium">{issueDetails.issueKey}</p>
                  </div>
                  <div>
                    <span className="text-gray-300 text-xs">Story Points:</span>
                    <p className="text-white font-medium">{issueDetails.storyPoints}</p>
                  </div>
                  <div>
                    <span className="text-gray-300 text-xs">Type:</span>
                    <p className="text-white font-medium">{issueDetails.type}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-300 text-xs">Epic:</span>
                    <p className="text-white font-medium slide-content slide-overflow">{issueDetails.epic}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-300 text-xs">Summary:</span>
                    <p className="text-white font-medium text-xs leading-tight slide-content slide-overflow">{issueDetails.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Accomplishments - Organized Content */}
            {accomplishments.hasContent && (
              <div className="bg-gradient-to-br from-blue-600/50 to-cyan-600/50 backdrop-blur-lg rounded-xl p-3 sm:p-4 border border-blue-500/60 flex-1 min-h-0">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                  Accomplishments
                </h3>
                <div className="h-full overflow-y-auto">
                  {accomplishments.sections.length > 0 ? (
                    <div className="space-y-3">
                      {accomplishments.sections.slice(0, 4).map((section, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-2 sm:p-3">
                          <h4 className="text-xs sm:text-sm font-semibold text-blue-200 mb-1">
                            {section.title}
                          </h4>
                          <div className="text-xs sm:text-sm text-white leading-relaxed slide-content slide-overflow">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: marked(section.content.slice(0, 200) + (section.content.length > 200 ? '...' : '')) 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-white leading-relaxed slide-content slide-overflow">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: marked(accomplishments.processedContent) 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Business Value & User Impact */}
          <div className="flex flex-col space-y-4 sm:space-y-5">
            {/* Business Value */}
            {businessValue.hasContent && (
              <div className="bg-gradient-to-br from-emerald-600/50 to-teal-600/50 backdrop-blur-lg rounded-xl p-3 sm:p-4 border border-emerald-500/60 flex-1 min-h-0">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-emerald-400" />
                  Business Value
                </h3>
                <div className="h-full overflow-y-auto">
                  {businessValue.sections.length > 0 ? (
                    <div className="space-y-3">
                      {businessValue.sections.slice(0, 3).map((section, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-2 sm:p-3">
                          <h4 className="text-xs sm:text-sm font-semibold text-emerald-200 mb-1">
                            {section.title}
                          </h4>
                          <div className="text-xs sm:text-sm text-white leading-relaxed slide-content slide-overflow">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: marked(section.content.slice(0, 150) + (section.content.length > 150 ? '...' : '')) 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-white leading-relaxed slide-content slide-overflow">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: marked(businessValue.processedContent) 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Impact */}
            {userImpact.hasContent && (
              <div className="bg-gradient-to-br from-purple-600/50 to-pink-600/50 backdrop-blur-lg rounded-xl p-3 sm:p-4 border border-purple-500/60 flex-1 min-h-0">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-400" />
                  User Impact
                </h3>
                <div className="h-full overflow-y-auto">
                  {userImpact.sections.length > 0 ? (
                    <div className="space-y-3">
                      {userImpact.sections.slice(0, 3).map((section, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-2 sm:p-3">
                          <h4 className="text-xs sm:text-sm font-semibold text-purple-200 mb-1">
                            {section.title}
                          </h4>
                          <div className="text-xs sm:text-sm text-white leading-relaxed slide-content slide-overflow">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: marked(section.content.slice(0, 150) + (section.content.length > 150 ? '...' : '')) 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-white leading-relaxed slide-content slide-overflow">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: marked(userImpact.processedContent) 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fallback for empty content */}
            {!accomplishments.hasContent && !businessValue.hasContent && !userImpact.hasContent && (
              <div className="bg-black/50 backdrop-blur-lg rounded-xl p-3 sm:p-4 border border-white/40 flex items-center justify-center h-32">
                <div className="text-center text-gray-400">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">No demo content available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function CustomSlide({ slide, containerClass, titleClass }: any) {
  return (
    <div className={`${containerClass} relative`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 h-full flex flex-col">
        <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
          <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>{slide.title}</h2>
          <div className="w-12 sm:w-14 lg:w-16 h-1 bg-ca-blue-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          {slide.corporateSlideUrl ? (
            <div className="max-w-full max-h-full">
              <img
                src={slide.corporateSlideUrl}
                alt={slide.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="text-gray-700 mb-3 text-sm font-semibold text-center">Image Loading Error</div>
                <div className="text-xs text-gray-600 leading-relaxed text-center">
                  Unable to load the uploaded image.
                  <br />
                  <span className="text-xs text-gray-500 mt-2 block">
                    Please check the image file in the Additional Slides section.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-full max-h-full">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
                <div className="text-gray-700 mb-3 text-sm font-semibold text-center">Custom Slide Content</div>
                <div className="text-xs text-gray-600 leading-relaxed text-center">
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
    <div className={`${containerClass} relative`}>
      {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-white/95 rounded-lg shadow-sm"></div>
      
      <div className="relative z-20 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="text-center">
          <h2 className={`${titleClass} text-gray-900 font-extrabold tracking-tight`}>{slide.title}</h2>
          <div className="w-12 sm:w-14 lg:w-16 h-1 bg-ca-blue-600 mx-auto rounded-full shadow-sm"></div>
        </div>

        <div className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none ${contentClass}`}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6 border-b border-gray-200 pb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-3 lg:mb-4 mt-6 sm:mt-7 lg:mt-8 text-ca-blue-700">{children}</h2>,
              h3: ({ children }) => <h3 className="text-lg sm:text-lg lg:text-xl font-medium text-gray-700 mb-2 sm:mb-2 lg:mb-3 mt-4 sm:mt-5 lg:mt-6">{children}</h3>,
              ul: ({ children }) => <ul className="space-y-1 sm:space-y-1.5 lg:space-y-2 ml-4 sm:ml-5 lg:ml-6">{children}</ul>,
              li: ({ children }) => (
                <li className="flex items-start space-x-2">
                  <span className="text-ca-blue-600 mt-1 font-bold">•</span>
                  <span className="text-gray-800">{children}</span>
                </li>
              ),
              p: ({ children }) => <p className="mb-3 sm:mb-3 lg:mb-4 text-gray-700 leading-relaxed">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="text-gray-600 italic">{children}</em>,
            }}
          >
            {slide.content}
          </ReactMarkdown>
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
  const [imageError, setImageError] = useState(false)

  if (!slide.corporateSlideUrl) {
    return (
      <div className={containerClass}>
        <div className="text-center text-gray-500">No corporate slide content available</div>
      </div>
    )
  }

  if (imageError) {
    return (
      <div className={containerClass}>
        <div className="text-center">
          <div className="text-gray-500 mb-4">Failed to load image</div>
          <div className="text-sm text-gray-400">URL: {slide.corporateSlideUrl}</div>
          <div className="text-sm text-gray-400">Title: {slide.title}</div>
          {/* Show a fallback for demo separator */}
          {slide.title === "Demo Separator" && (
            <div className="mt-8 p-8 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-gray-700 mb-4">Demo Stories</div>
              <div className="text-gray-600">This section contains the demo stories for this sprint review.</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${containerClass} p-0`}>
      <div className="relative w-full h-full">
        <Image
          src={slide.corporateSlideUrl}
          alt={slide.title || "Corporate slide"}
          fill
          className="object-contain"
          priority
          sizes="100vw"
          onError={() => {
            console.error("Failed to load corporate slide:", slide.corporateSlideUrl)
            setImageError(true)
          }}
          onLoad={() => {
            if (process.env.NODE_ENV === "development") {
              console.log("Successfully loaded corporate slide:", slide.corporateSlideUrl)
            }
          }}
        />
      </div>
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
  // Validate input
  if (!Array.isArray(issues)) {
    return (
      <div className="text-center text-gray-600 py-4">
        <div className="text-sm sm:text-base">Invalid issues data provided</div>
      </div>
    );
  }

  // Filter out invalid issues
  const validIssues = issues.filter(issue => 
    issue && 
    typeof issue === 'object' && 
    issue.id && 
    issue.key && 
    issue.summary && 
    issue.status && 
    issue.issueType
  );

  // Group issues by epic
  const epicGroups = validIssues.reduce((groups: EpicGroup[], issue) => {
    // Handle issues without epic or with invalid epic data
    if (!issue.epicKey || !issue.epicName || issue.epicKey.trim() === '' || issue.epicName.trim() === '') {
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
      const existingGroup = groups.find(g => g.epicKey === issue.epicKey);
      if (existingGroup) {
        existingGroup.issues.push(issue);
        existingGroup.totalStoryPoints += issue.storyPoints || 0;
        if (issue.status === 'Done') {
          existingGroup.completedStoryPoints += issue.storyPoints || 0;
        }
      } else {
        groups.push({
          epicKey: issue.epicKey,
          epicName: issue.epicName,
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
            className="bg-white rounded p-2 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.epicColor }}
                ></div>
                <h4 className="font-bold text-gray-900 text-xs truncate">
                  {group.epicName}
                </h4>
              </div>
              <div className="text-xs text-ca-blue-600 font-medium bg-ca-blue-50 px-1 py-0.5 rounded">
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
