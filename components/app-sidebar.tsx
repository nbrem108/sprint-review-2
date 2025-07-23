"use client"

import { useState } from "react"
import { ChevronDown, FolderOpen, Calendar, Target, FileImage, FileText, Presentation, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useSprintContext } from "@/components/sprint-context"
import { ProjectSelector } from "@/components/project-selector"
import { SprintSelector } from "@/components/sprint-selector"
import { BoardSelector } from "@/components/board-selector"

export function AppSidebar() {
  const { state, dispatch } = useSprintContext()
  const [projectsOpen, setProjectsOpen] = useState(true)

  // Completion checks for all sections
  const isSetupComplete = !!(
    state.selectedProject &&
    (state.selectedBoard?.id || state.selectedProject.boardId) &&
    state.selectedSprint &&
    state.issues.length > 0
  )

  const isDemoStoriesComplete = state.demoStories.length > 0

  const isMetricsComplete = !!(
    state.metrics && state.metrics.sprintNumber && state.metrics.sprintNumber.trim() !== ""
  )

  const isOtherSlidesComplete = state.additionalSlides.length > 0

  const isCorporateSlidesComplete = state.corporateSlides.length > 0

  // More specific completion logic
  const isCurrentSprintSummaryComplete = !!state.summaries.currentSprint
  const isUpcomingSprintSummaryComplete = !!state.summaries.upcomingSprint
  const isDemoStoriesSummaryComplete = !!(
    state.summaries.demoStories && 
    Object.keys(state.summaries.demoStories).length > 0 &&
    // Ensure we have summaries for all selected demo stories
    state.demoStories.every(storyId => state.summaries.demoStories?.[storyId])
  )

  // AI Summaries section is complete if we have any meaningful summaries
  const isSummariesComplete = !!(
    isCurrentSprintSummaryComplete ||
    isUpcomingSprintSummaryComplete ||
    isDemoStoriesSummaryComplete
  )

  // Presentation is complete only if we have the essential components
  const isPresentationComplete = !!(
    isSetupComplete &&
    isDemoStoriesComplete &&
    isMetricsComplete &&
    // For presentation, we need demo story summaries if we have demo stories
    (state.demoStories.length === 0 || isDemoStoriesSummaryComplete)
  )

  const navigationItems = [
    {
      id: "setup",
      title: "Setup & Issues",
      icon: FolderOpen,
      description: "Configure project and sprint",
      isComplete: isSetupComplete,
      badge: state.issues.length > 0 ? state.issues.length : undefined,
    },
    {
      id: "demo-stories",
      title: "Demo Stories",
      icon: Target,
      description: "Select stories for demo",
      isComplete: isDemoStoriesComplete,
      badge: state.demoStories.length > 0 ? state.demoStories.length : undefined,
    },
    {
      id: "metrics",
      title: "Sprint Metrics",
      icon: Calendar,
      description: "Configure sprint metrics",
      isComplete: isMetricsComplete,
      badge: undefined,
    },
    {
      id: "other-slides",
      title: "Additional Slides",
      icon: FileImage,
      description: "Upload custom slides",
      isComplete: isOtherSlidesComplete,
      badge: state.additionalSlides.length > 0 ? state.additionalSlides.length : undefined,
    },
    {
      id: "corporate-slides",
      title: "Corporate Slides",
      icon: FileImage,
      description: "Manage corporate slide templates",
      isComplete: isCorporateSlidesComplete,
      badge: state.corporateSlides.length > 0 ? state.corporateSlides.length : undefined,
    },
    {
      id: "summaries",
      title: "AI Summaries",
      icon: FileText,
      description: "Generate content summaries",
      isComplete: isSummariesComplete,
      badge: undefined,
    },
    {
      id: "presentation",
      title: "Presentation",
      icon: Presentation,
      description: "View and export presentation",
      isComplete: isPresentationComplete,
      badge: undefined,
    },
  ] as const

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 border-r bg-background overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Sprint Review</h2>
          <p className="text-sm text-muted-foreground">Configure your presentation</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(navigationItems.filter(item => item.isComplete).length / navigationItems.length) * 100}%` 
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {navigationItems.filter(item => item.isComplete).length}/{navigationItems.length}
            </span>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Project Configuration Section */}
          <div className="space-y-4">
            <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto font-medium">
                  Project Configuration
                  <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <ProjectSelector />
                <BoardSelector />
                <SprintSelector />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Navigation Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Navigation</h3>
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={state.currentTab === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto p-3 relative"
                  onClick={() => dispatch({ type: "SET_TAB", payload: item.id })}
                >
                  <item.icon className="h-4 w-4 shrink-0 mr-3" />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="font-medium text-sm">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <Badge variant="secondary" className="shrink-0">
                        {item.badge}
                      </Badge>
                    )}
                    {item.isComplete && (
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground space-y-1">
            {state.selectedProject && (
              <div className="truncate">
                <span className="font-medium">Project:</span> {state.selectedProject.name}
              </div>
            )}
            {state.selectedSprint && (
              <div className="truncate">
                <span className="font-medium">Sprint:</span> {state.selectedSprint.name}
              </div>
            )}
            {state.issues.length > 0 && (
              <div>
                <span className="font-medium">Issues:</span> {state.issues.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
