"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Target, TrendingUp, BarChart3, Users, Calendar } from "lucide-react"
import ReactMarkdown from "react-markdown"
import Image from "next/image"

interface PresentationSlide {
  id: string
  title: string
  content: string
  type: "title" | "summary" | "metrics" | "demo-story" | "custom" | "corporate"
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

export function SlideRenderer({ slide, allIssues, upcomingIssues, sprintMetrics, isFullscreen }: SlideRendererProps) {
  const containerClass = isFullscreen
    ? "w-full h-full p-12 flex flex-col justify-center"
    : "w-full h-full p-8 flex flex-col justify-center"

  const titleClass = isFullscreen ? "text-6xl font-bold mb-8 text-center" : "text-4xl font-bold mb-6 text-center"

  const contentClass = isFullscreen ? "text-2xl leading-relaxed" : "text-lg leading-relaxed"

  switch (slide.type) {
    case "title":
      return <TitleSlide slide={slide} containerClass={containerClass} titleClass={titleClass} />

    case "summary":
      return (
        <SummarySlide
          slide={slide}
          containerClass={containerClass}
          titleClass={titleClass}
          contentClass={contentClass}
        />
      )

    case "metrics":
      return (
        <MetricsSlide
          slide={slide}
          containerClass={containerClass}
          titleClass={titleClass}
          sprintMetrics={sprintMetrics}
          allIssues={allIssues}
          isFullscreen={isFullscreen}
        />
      )

    case "demo-story":
      return (
        <DemoStorySlide
          slide={slide}
          containerClass={containerClass}
          titleClass={titleClass}
          contentClass={contentClass}
          allIssues={allIssues}
        />
      )

    case "corporate":
      return (
        <CorporateSlide
          slide={slide}
          containerClass={containerClass}
          isFullscreen={isFullscreen}
        />
      )

    case "custom":
      return <CustomSlide slide={slide} containerClass={containerClass} titleClass={titleClass} />

    default:
      return (
        <DefaultSlide
          slide={slide}
          containerClass={containerClass}
          titleClass={titleClass}
          contentClass={contentClass}
        />
      )
  }
}

function TitleSlide({ slide, containerClass, titleClass }: any) {
  return (
    <div className={`${containerClass} bg-gradient-to-br from-blue-600 to-blue-800 text-white`}>
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className={titleClass}>{slide.title}</h1>
          <div className="w-24 h-1 bg-white/30 mx-auto rounded-full"></div>
        </div>

        <div className="prose prose-xl prose-invert max-w-none text-center">
          <ReactMarkdown>{slide.content}</ReactMarkdown>
        </div>

        <div className="flex justify-center items-center space-x-8 text-blue-100">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6" />
            <span>Sprint Review</span>
          </div>
          <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6" />
            <span>Team Presentation</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummarySlide({ slide, containerClass, titleClass, contentClass }: any) {
  return (
    <div className={containerClass}>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className={`${titleClass} text-gray-900`}>{slide.title}</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className={`prose prose-lg max-w-none ${contentClass}`}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6">{children}</h3>,
              ul: ({ children }) => <ul className="space-y-2 ml-6">{children}</ul>,
              li: ({ children }) => (
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{children}</span>
                </li>
              ),
              p: ({ children }) => <p className="mb-4 text-gray-700">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            }}
          >
            {slide.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

function MetricsSlide({ slide, containerClass, titleClass, sprintMetrics, allIssues, isFullscreen }: any) {
  if (!sprintMetrics) {
    return (
      <div className={containerClass}>
        <div className="text-center space-y-8">
          <h2 className={`${titleClass} text-gray-900`}>Sprint Metrics</h2>
          <div className="text-xl text-gray-600">No metrics data available</div>
        </div>
      </div>
    )
  }

  const completedIssues = allIssues.filter((issue: Issue) => issue.status === "Done")
  const completionRate = allIssues.length > 0 ? Math.round((completedIssues.length / allIssues.length) * 100) : 0

  const qualityScore = calculateQualityScore(sprintMetrics.qualityChecklist)

  const gridClass = isFullscreen ? "grid grid-cols-2 lg:grid-cols-4 gap-8" : "grid grid-cols-2 gap-6"
  const metricCardClass = isFullscreen ? "text-center p-6" : "text-center p-4"
  const metricValueClass = isFullscreen ? "text-4xl font-bold mb-2" : "text-3xl font-bold mb-2"
  const metricLabelClass = isFullscreen ? "text-lg text-gray-600" : "text-sm text-gray-600"

  return (
    <div className={containerClass}>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className={`${titleClass} text-gray-900`}>Sprint {sprintMetrics.sprintNumber} Metrics</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        {/* Key Metrics Grid */}
        <div className={gridClass}>
          <div className={metricCardClass}>
            <div className={`${metricValueClass} text-blue-600`}>{completionRate}%</div>
            <div className={metricLabelClass}>Completion Rate</div>
            <div className="flex justify-center mt-2">
              {completionRate >= 80 ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-500" />
              )}
            </div>
          </div>

          <div className={metricCardClass}>
            <div className={`${metricValueClass} text-green-600`}>{sprintMetrics.completedTotalPoints}</div>
            <div className={metricLabelClass}>Story Points</div>
            <div className="text-xs text-gray-500 mt-1">of {sprintMetrics.estimatedPoints} planned</div>
          </div>

          <div className={metricCardClass}>
            <div className={`${metricValueClass} text-purple-600`}>{sprintMetrics.testCoverage}%</div>
            <div className={metricLabelClass}>Test Coverage</div>
            <div className="flex justify-center mt-2">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
          </div>

          <div className={metricCardClass}>
            <div
              className={`${metricValueClass} ${qualityScore >= 80 ? "text-green-600" : qualityScore >= 60 ? "text-yellow-600" : "text-red-600"}`}
            >
              {qualityScore}%
            </div>
            <div className={metricLabelClass}>Quality Score</div>
            <div className="flex justify-center mt-2">
              <TrendingUp className="w-6 h-6 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Quality Standards Summary */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">Quality Standards Achievement</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(sprintMetrics.qualityChecklist)
              .slice(0, 10)
              .map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="mb-2">
                    {value === "yes" ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    ) : value === "partial" ? (
                      <Clock className="w-6 h-6 text-yellow-500 mx-auto" />
                    ) : value === "na" ? (
                      <div className="w-6 h-6 bg-gray-300 rounded-full mx-auto"></div>
                    ) : (
                      <div className="w-6 h-6 bg-red-200 rounded-full mx-auto"></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoStorySlide({ slide, containerClass, titleClass, contentClass, allIssues }: any) {
  // Extract story key from title if it's a demo story
  const storyKey = slide.title.includes(":") ? slide.title.split(":")[0].replace("Demo: ", "") : null
  const story = storyKey ? allIssues.find((issue: Issue) => issue.key === storyKey) : null

  return (
    <div className={containerClass}>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className={`${titleClass} text-gray-900`}>{slide.title}</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        {story && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Badge variant="outline" className="text-sm">
                {story.issueType}
              </Badge>
              <Badge className={story.status === "Done" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                {story.status}
              </Badge>
              {story.storyPoints && <Badge variant="secondary">{story.storyPoints} pts</Badge>}
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700 mb-2">{story.summary}</div>
              {story.assignee && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{story.assignee}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`prose prose-lg max-w-none ${contentClass}`}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-gray-900 mb-6">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-medium text-gray-700 mb-3 mt-6">{children}</h3>,
              ul: ({ children }) => <ul className="space-y-2 ml-6">{children}</ul>,
              li: ({ children }) => (
                <li className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <span>{children}</span>
                </li>
              ),
              p: ({ children }) => <p className="mb-4 text-gray-700">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            }}
          >
            {slide.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

function CustomSlide({ slide, containerClass, titleClass }: any) {
  return (
    <div className={containerClass}>
      <div className="space-y-8 text-center">
        <div>
          <h2 className={`${titleClass} text-gray-900`}>{slide.title}</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-lg p-8 max-w-2xl">
            <div className="text-gray-600 mb-4">Custom Slide Content</div>
            <div className="text-sm text-gray-500">
              In a real implementation, this would display the uploaded image content
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DefaultSlide({ slide, containerClass, titleClass, contentClass }: any) {
  return (
    <div className={containerClass}>
      <div className="space-y-8">
        <div className="text-center">
          <h2 className={`${titleClass} text-gray-900`}>{slide.title}</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <div className={`prose prose-lg max-w-none ${contentClass}`}>
          <ReactMarkdown>{slide.content}</ReactMarkdown>
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
  
  const total = validScores.reduce((sum, score) => sum + score, 0)
  return Math.round((total / validScores.length) * 100)
}

function CorporateSlide({ slide, containerClass, isFullscreen }: any) {
  if (!slide.corporateSlideUrl) {
    return (
      <div className={containerClass}>
        <div className="text-center text-gray-500">No corporate slide content available</div>
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
        />
      </div>
    </div>
  )
}
