"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Save, Calculator, CheckCircle, AlertCircle } from "lucide-react"
import { SprintComparisonTable } from "@/components/sprint-comparison-table"
import { enhanceSprintMetrics, createSprintComparisonFromJira } from "@/lib/sprint-comparison-utils"
import { useSprintContext, SprintMetrics } from "@/components/sprint-context"
import { fetchJiraSprints, fetchJiraSprintIssues } from "@/lib/jira-api"
import { isIssueCompleted } from '@/lib/utils'

type QualityScore = "yes" | "no" | "partial" | "na"

interface MetricsFormData {
  // Sprint Planning Metrics
  sprintBacklogPlanned: string
  sprintBacklogEstimated: string
  sprintStoryPointCommitment: string
  
  // Work Item Metrics
  plannedItems: string
  estimatedPoints: string
  carryForwardPoints: string
  committedBufferPoints: string
  completedBufferPoints: string
  testCoveragePercent: string
  completedTotalPoints: string
  completedAdjustedPoints: string
  
  // Enhanced metrics fields
  sprintStartDate: string
  sprintEndDate: string
  teamSize: string
  averageCycleTime: string
  sprintGoal: string
  retrospectiveNotes: string
  
  // Quality checklist
  sprintCommitment: QualityScore
  velocity: QualityScore
  testCoverage: QualityScore
  testAutomation: QualityScore
  uiUxStandards: QualityScore
  internationalFirst: QualityScore
  mobileResponsive: QualityScore
  featurePermissions: QualityScore
  releaseNotes: QualityScore
  howToVideos: QualityScore
}

const initialFormData: MetricsFormData = {
  // Sprint Planning Metrics
  sprintBacklogPlanned: "1",
  sprintBacklogEstimated: "3",
  sprintStoryPointCommitment: "",
  
  // Work Item Metrics
  plannedItems: "",
  estimatedPoints: "",
  carryForwardPoints: "0",
  committedBufferPoints: "0",
  completedBufferPoints: "0",
  testCoveragePercent: "0",
  completedTotalPoints: "",
  completedAdjustedPoints: "",
  
  // Enhanced metrics fields
  sprintStartDate: "",
  sprintEndDate: "",
  teamSize: "",
  averageCycleTime: "",
  sprintGoal: "",
  retrospectiveNotes: "",
  
  // Quality checklist
  sprintCommitment: "na",
  velocity: "na",
  testCoverage: "na",
  testAutomation: "na",
  uiUxStandards: "na",
  internationalFirst: "na",
  mobileResponsive: "na",
  featurePermissions: "na",
  releaseNotes: "na",
  howToVideos: "na",
}

const qualityItems = [
  { key: "sprintCommitment", label: "Sprint Commitment", description: "Met sprint commitment goals" },
  { key: "velocity", label: "Velocity", description: "Achieved velocity targets" },
  { key: "testCoverage", label: "Test Code Coverage", description: "Met coverage requirements" },
  { key: "testAutomation", label: "Test Automation", description: "Followed automation standards" },
  { key: "uiUxStandards", label: "UI/UX Standards", description: "Maintained design standards" },
  { key: "internationalFirst", label: "International First", description: "Met i18n requirements" },
  { key: "mobileResponsive", label: "Mobile Responsive", description: "Achieved mobile responsiveness" },
  { key: "featurePermissions", label: "Feature Permissions", description: "Implemented permission requirements" },
  { key: "releaseNotes", label: "Release Notes", description: "Created release documentation" },
  { key: "howToVideos", label: "How To Videos", description: "Created instructional videos" },
] as const

export function MetricsTab() {
  const { state, dispatch } = useSprintContext()
  const [formData, setFormData] = useState<MetricsFormData>(initialFormData)
  const [isSaved, setIsSaved] = useState(false)

  // Load existing metrics data
  useEffect(() => {
    if (state.metrics) {
      setFormData({
        // Sprint Planning Metrics
        sprintBacklogPlanned: String(state.metrics.sprintBacklogPlanned || "1"),
        sprintBacklogEstimated: String(state.metrics.sprintBacklogEstimated || "3"),
        sprintStoryPointCommitment: String(state.metrics.sprintStoryPointCommitment || ""),
        
        // Work Item Metrics
        plannedItems: String(state.metrics.plannedItems || ""),
        estimatedPoints: String(state.metrics.estimatedPoints || ""),
        carryForwardPoints: String(state.metrics.carryForwardPoints || "0"),
        committedBufferPoints: String(state.metrics.committedBufferPoints || "0"),
        completedBufferPoints: String(state.metrics.completedBufferPoints || "0"),
        testCoveragePercent: String(state.metrics.testCoverage || "0"),
        completedTotalPoints: String(state.metrics.completedTotalPoints || ""),
        completedAdjustedPoints: String(state.metrics.completedAdjustedPoints || ""),
        
        // Enhanced metrics fields
        sprintStartDate: state.metrics.sprintStartDate || "",
        sprintEndDate: state.metrics.sprintEndDate || "",
        teamSize: String(state.metrics.teamSize || ""),
        averageCycleTime: String(state.metrics.averageCycleTime || ""),
        sprintGoal: state.metrics.sprintGoal || "",
        retrospectiveNotes: state.metrics.retrospectiveNotes || "",
        
        // Quality checklist
        sprintCommitment: state.metrics.qualityChecklist?.sprintCommitment || "na",
        velocity: state.metrics.qualityChecklist?.velocity || "na",
        testCoverage: state.metrics.qualityChecklist?.testCoverage || "na",
        testAutomation: state.metrics.qualityChecklist?.testAutomation || "na",
        uiUxStandards: state.metrics.qualityChecklist?.uiUxStandards || "na",
        internationalFirst: state.metrics.qualityChecklist?.internationalFirst || "na",
        mobileResponsive: state.metrics.qualityChecklist?.mobileResponsive || "na",
        featurePermissions: state.metrics.qualityChecklist?.featurePermissions || "na",
        releaseNotes: state.metrics.qualityChecklist?.releaseNotes || "na",
        howToVideos: state.metrics.qualityChecklist?.howToVideos || "na",
      })
    }
  }, [state.metrics])

  // Auto-populate sprint data from selected sprint
  useEffect(() => {
    if (state.selectedSprint) {
      setFormData((prev) => ({
        ...prev,
        sprintStartDate: state.selectedSprint?.startDate || "",
        sprintEndDate: state.selectedSprint?.endDate || "",
        sprintGoal: "", // Sprint interface doesn't have goal property
      }))
    }
  }, [state.selectedSprint])

  const handleInputChange = (field: keyof Omit<MetricsFormData, "qualityChecklist">, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: String(value),
    }))
    setIsSaved(false)
  }

  const handleQualityChange = (field: keyof MetricsFormData, value: QualityScore) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setIsSaved(false)
  }

  const calculateOverallScore = (): number => {
    const qualityScores = [
      formData.sprintCommitment,
      formData.velocity,
      formData.testCoverage,
      formData.testAutomation,
      formData.uiUxStandards,
      formData.internationalFirst,
      formData.mobileResponsive,
      formData.featurePermissions,
      formData.releaseNotes,
      formData.howToVideos,
    ]

    const scores = qualityScores
      .map((value) => {
        switch (value) {
          case "yes":
            return 1
          case "partial":
            return 0.5
          case "no":
            return 0
          case "na":
            return null // N/A items don't count toward score
          default:
            return 0
        }
      })
      .filter((score) => score !== null) as number[]

    if (scores.length === 0) return 0
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return Math.round(average * 100)
  }

  const handleSave = async () => {
    const metricsData: SprintMetrics = {
      // Sprint Planning Metrics
      sprintBacklogPlanned: Number(formData.sprintBacklogPlanned),
      sprintBacklogEstimated: Number(formData.sprintBacklogEstimated),
      sprintStoryPointCommitment: Number(formData.sprintStoryPointCommitment),
      
      // Work Item Metrics
      plannedItems: Number(formData.plannedItems),
      estimatedPoints: Number(formData.estimatedPoints),
      carryForwardPoints: Number(formData.carryForwardPoints),
      committedBufferPoints: Number(formData.committedBufferPoints),
      completedBufferPoints: Number(formData.completedBufferPoints),
      testCoverage: Number(formData.testCoveragePercent),
      sprintNumber: state.selectedSprint?.name || "",
      completedTotalPoints: Number(formData.completedTotalPoints),
      completedAdjustedPoints: Number(formData.completedAdjustedPoints),
      
      // Enhanced metrics fields
      sprintStartDate: formData.sprintStartDate,
      sprintEndDate: formData.sprintEndDate,
      teamSize: Number(formData.teamSize) || undefined,
      averageCycleTime: Number(formData.averageCycleTime) || undefined,
      sprintGoal: formData.sprintGoal,
      retrospectiveNotes: formData.retrospectiveNotes,
      boardId: state.selectedBoard?.id,
      
      // Quality checklist
      qualityChecklist: {
        sprintCommitment: formData.sprintCommitment,
        velocity: formData.velocity,
        testCoverage: formData.testCoverage,
        testAutomation: formData.testAutomation,
        uiUxStandards: formData.uiUxStandards,
        internationalFirst: formData.internationalFirst,
        mobileResponsive: formData.mobileResponsive,
        featurePermissions: formData.featurePermissions,
        releaseNotes: formData.releaseNotes,
        howToVideos: formData.howToVideos,
      }
    }

    // Enhance metrics with calculated values
    const enhancedMetrics = enhanceSprintMetrics(metricsData)
    
    // Create sprint comparison using Jira API data if available
    let comparison = null
    if (state.selectedSprint && state.issues) {
      try {
        const boardId = state.selectedBoard?.id ?? state.selectedProject?.boardId
        if (boardId) {
          // Get all sprints for this board
          const allSprints = await fetchJiraSprints(Number.parseInt(boardId))
          
          // Load issues for closed sprints to create comparison
          const allSprintIssues: Record<string, any[]> = {}
          allSprintIssues[state.selectedSprint.id] = state.issues
          
          // Load issues for closed sprints (previous sprints)
          const closedSprints = allSprints.filter(s => s.state === "closed")
          for (const closedSprint of closedSprints.slice(0, 5)) { // Limit to 5 to avoid too many API calls
            try {
              const issues = await fetchJiraSprintIssues(Number.parseInt(closedSprint.id))
              allSprintIssues[closedSprint.id] = issues
            } catch (error) {
              console.warn(`Failed to load issues for sprint ${closedSprint.id}:`, error)
              allSprintIssues[closedSprint.id] = []
            }
          }
          
          // Convert Sprint to SafeJiraSprint format
          const safeSprint = {
            id: state.selectedSprint.id,
            name: state.selectedSprint.name,
            state: state.selectedSprint.state,
            startDate: state.selectedSprint.startDate || null,
            endDate: state.selectedSprint.endDate || null,
            boardId: state.selectedSprint.boardId,
            goal: undefined
          }
          
          // Create sprint comparison using Jira data
          comparison = createSprintComparisonFromJira(safeSprint, state.issues, allSprints, allSprintIssues)
        }
      } catch (error) {
        console.error("Failed to create sprint comparison:", error)
      }
    }

    dispatch({ type: "SET_METRICS", payload: enhancedMetrics })
    if (comparison) {
      dispatch({ type: "SET_SPRINT_COMPARISON", payload: comparison })
    }
    
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const overallScore = calculateOverallScore()
  const isFormValid = state.selectedSprint?.name !== undefined

  if (!state.selectedSprint) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sprint Metrics</h2>
          <p className="text-muted-foreground">Configure sprint performance metrics and quality standards</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Please select a sprint first to configure metrics
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sprint Metrics</h2>
          <p className="text-muted-foreground">Configure performance metrics for {state.selectedSprint.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="text-sm font-medium">Overall Score:</span>
            <Badge variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}>
              {overallScore}%
            </Badge>
          </div>
          <Button onClick={handleSave} disabled={!isFormValid} className="gap-2">
            {isSaved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {isSaved ? "Saved" : "Save Metrics"}
          </Button>
        </div>
      </div>

      {/* Sprint Planning Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Sprint Planning Metrics</CardTitle>
          <CardDescription>Quantitative metrics for sprint planning and execution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sprintNumber">Sprint Number</Label>
              <Input
                id="sprintNumber"
                value={state.selectedSprint?.name || ""}
                disabled
                placeholder="Auto-populated from selected sprint"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprintBacklogPlanned">Sprint Backlog (Planned)</Label>
              <Input
                id="sprintBacklogPlanned"
                type="number"
                value={formData.sprintBacklogPlanned}
                onChange={(e) => handleInputChange("sprintBacklogPlanned", Number.parseInt(e.target.value) || 0)}
                placeholder="Number of planned items"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprintBacklogEstimated">Sprint Backlog (Estimated)</Label>
              <Input
                id="sprintBacklogEstimated"
                type="number"
                value={formData.sprintBacklogEstimated}
                onChange={(e) => handleInputChange("sprintBacklogEstimated", Number.parseInt(e.target.value) || 0)}
                placeholder="Estimated story points"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprintStoryPointCommitment">Sprint Story Point Commitment</Label>
              <Input
                id="sprintStoryPointCommitment"
                type="number"
                value={formData.sprintStoryPointCommitment}
                onChange={(e) => handleInputChange("sprintStoryPointCommitment", Number.parseInt(e.target.value) || 0)}
                placeholder="Total story points committed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carryForwardPoints">Carry Forward Points</Label>
              <Input
                id="carryForwardPoints"
                type="number"
                value={formData.carryForwardPoints}
                onChange={(e) => handleInputChange("carryForwardPoints", Number.parseInt(e.target.value) || 0)}
                placeholder="Points from previous sprint"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="committedBufferPoints">Committed Buffer Points</Label>
              <Input
                id="committedBufferPoints"
                type="number"
                value={formData.committedBufferPoints}
                onChange={(e) => handleInputChange("committedBufferPoints", Number.parseInt(e.target.value) || 0)}
                placeholder="Buffer at sprint start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completedBufferPoints">Completed Buffer Points</Label>
              <Input
                id="completedBufferPoints"
                type="number"
                value={formData.completedBufferPoints}
                onChange={(e) => handleInputChange("completedBufferPoints", Number.parseInt(e.target.value) || 0)}
                placeholder="Buffer actually completed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testCoverage">Test Code Coverage (%)</Label>
              <Input
                id="testCoverage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.testCoveragePercent}
                onChange={(e) => handleInputChange("testCoveragePercent", Number.parseFloat(e.target.value) || 0)}
                placeholder="e.g., 94.93"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completedTotalPoints">Completed Total Points</Label>
              <Input
                id="completedTotalPoints"
                type="number"
                value={formData.completedTotalPoints}
                onChange={(e) => handleInputChange("completedTotalPoints", Number.parseInt(e.target.value) || 0)}
                placeholder="Total story points completed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completedAdjustedPoints">Completed Adjusted Points</Label>
              <Input
                id="completedAdjustedPoints"
                type="number"
                value={formData.completedAdjustedPoints}
                onChange={(e) => handleInputChange("completedAdjustedPoints", Number.parseInt(e.target.value) || 0)}
                placeholder="Adjusted for scope changes"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Sprint Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Sprint Metrics</CardTitle>
          <CardDescription>Additional metrics for comprehensive sprint analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sprintStartDate">Sprint Start Date</Label>
              <Input
                id="sprintStartDate"
                type="date"
                value={formData.sprintStartDate}
                onChange={(e) => handleInputChange("sprintStartDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprintEndDate">Sprint End Date</Label>
              <Input
                id="sprintEndDate"
                type="date"
                value={formData.sprintEndDate}
                onChange={(e) => handleInputChange("sprintEndDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size</Label>
              <Input
                id="teamSize"
                type="number"
                min="1"
                value={formData.teamSize}
                onChange={(e) => handleInputChange("teamSize", Number.parseInt(e.target.value) || 0)}
                placeholder="Number of team members"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageCycleTime">Average Cycle Time (days)</Label>
              <Input
                id="averageCycleTime"
                type="number"
                step="0.1"
                min="0"
                value={formData.averageCycleTime}
                onChange={(e) => handleInputChange("averageCycleTime", Number.parseFloat(e.target.value) || 0)}
                placeholder="e.g., 3.5"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sprintGoal">Sprint Goal</Label>
              <Input
                id="sprintGoal"
                value={formData.sprintGoal}
                onChange={(e) => handleInputChange("sprintGoal", e.target.value)}
                placeholder="What was the main goal of this sprint?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retrospectiveNotes">Retrospective Notes</Label>
              <textarea
                id="retrospectiveNotes"
                value={formData.retrospectiveNotes}
                onChange={(e) => handleInputChange("retrospectiveNotes", e.target.value)}
                placeholder="Key learnings and improvements from sprint retrospective"
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automatically Calculated Metrics */}
      {state.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Automatically Calculated Metrics</CardTitle>
            <CardDescription>Metrics calculated from your Jira sprint issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Defect Count</Label>
                <div className="text-2xl font-bold">
                  {state.issues.filter(issue => issue.issueType.toLowerCase() === 'bug').length}
                </div>
                <p className="text-xs text-muted-foreground">Bugs found in this sprint</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Defect Resolution Rate</Label>
                <div className="text-2xl font-bold">
                  {(() => {
                    const bugIssues = state.issues.filter(issue => issue.issueType.toLowerCase() === 'bug')
                    const resolvedBugs = bugIssues.filter(issue => isIssueCompleted(issue.status))
                    return bugIssues.length > 0 ? Math.round((resolvedBugs.length / bugIssues.length) * 100) : 0
                  })()}%
                </div>
                <p className="text-xs text-muted-foreground">Bugs resolved in this sprint</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Total Issues</Label>
                <div className="text-2xl font-bold">{state.issues.length}</div>
                <p className="text-xs text-muted-foreground">All issues in this sprint</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality & Standards Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Quality & Standards Checklist</CardTitle>
          <CardDescription>Evaluate sprint quality across key standards and practices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qualityItems.map((item, index) => (
            <div key={item.key}>
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <RadioGroup
                  value={formData[item.key as keyof MetricsFormData] as QualityScore}
                  onValueChange={(value: QualityScore) =>
                    handleQualityChange(item.key as keyof MetricsFormData, value)
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id={`${item.key}-yes`} />
                    <Label htmlFor={`${item.key}-yes`} className="text-green-700">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id={`${item.key}-partial`} />
                    <Label htmlFor={`${item.key}-partial`} className="text-yellow-700">
                      Partial
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id={`${item.key}-no`} />
                    <Label htmlFor={`${item.key}-no`} className="text-red-700">
                      No
                    </Label>
                  </div>
                  {item.key === "howToVideos" && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="na" id={`${item.key}-na`} />
                      <Label htmlFor={`${item.key}-na`} className="text-gray-500">
                        N/A
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
              {index < qualityItems.length - 1 && <Separator className="mt-6" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Sprint Score Summary
          </CardTitle>
          <CardDescription>Overall quality score based on standards checklist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-2xl font-bold flex items-center gap-2">
                {overallScore}%
                {overallScore >= 80 ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {overallScore >= 80
                  ? "Excellent sprint quality"
                  : overallScore >= 60
                    ? "Good sprint quality"
                    : "Needs improvement"}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">
                Based on {qualityItems.filter((item) => formData[item.key as keyof MetricsFormData] !== "na").length} applicable
                standards
              </div>
              <div className="text-xs text-muted-foreground">Yes: 100% • Partial: 50% • No: 0%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint Comparison Table */}
      {state.metrics && state.sprintComparison && (
        <SprintComparisonTable comparison={state.sprintComparison} />
      )}
    </div>
  )
}
