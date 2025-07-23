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
import { useSprintContext } from "@/components/sprint-context"

type QualityScore = "yes" | "no" | "partial" | "na"

interface MetricsFormData {
  plannedItems: number
  estimatedPoints: number
  carryForwardPoints: number
  committedBufferPoints: number
  completedBufferPoints: number
  testCoverage: number
  sprintNumber: string
  completedTotalPoints: number
  completedAdjustedPoints: number
  qualityChecklist: {
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
}

const initialFormData: MetricsFormData = {
  plannedItems: 0,
  estimatedPoints: 0,
  carryForwardPoints: 0,
  committedBufferPoints: 0,
  completedBufferPoints: 0,
  testCoverage: 0,
  sprintNumber: "",
  completedTotalPoints: 0,
  completedAdjustedPoints: 0,
  qualityChecklist: {
    sprintCommitment: "no",
    velocity: "no",
    testCoverage: "no",
    testAutomation: "no",
    uiUxStandards: "no",
    internationalFirst: "no",
    mobileResponsive: "no",
    featurePermissions: "no",
    releaseNotes: "no",
    howToVideos: "na",
  },
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
        plannedItems: state.metrics.plannedItems,
        estimatedPoints: state.metrics.estimatedPoints,
        carryForwardPoints: state.metrics.carryForwardPoints,
        committedBufferPoints: state.metrics.committedBufferPoints,
        completedBufferPoints: state.metrics.completedBufferPoints,
        testCoverage: state.metrics.testCoverage,
        sprintNumber: state.metrics.sprintNumber,
        completedTotalPoints: state.metrics.completedTotalPoints,
        completedAdjustedPoints: state.metrics.completedAdjustedPoints,
        qualityChecklist: { ...state.metrics.qualityChecklist },
      })
    }
  }, [state.metrics])

  // Auto-populate sprint number from selected sprint
  useEffect(() => {
    if (state.selectedSprint && !formData.sprintNumber) {
      setFormData((prev) => ({
        ...prev,
        sprintNumber: state.selectedSprint?.name || "",
      }))
    }
  }, [state.selectedSprint, formData.sprintNumber])

  const handleInputChange = (field: keyof Omit<MetricsFormData, "qualityChecklist">, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setIsSaved(false)
  }

  const handleQualityChange = (field: keyof MetricsFormData["qualityChecklist"], value: QualityScore) => {
    setFormData((prev) => ({
      ...prev,
      qualityChecklist: {
        ...prev.qualityChecklist,
        [field]: value,
      },
    }))
    setIsSaved(false)
  }

  const calculateOverallScore = (): number => {
    const scores = Object.entries(formData.qualityChecklist)
      .map(([_, value]) => {
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

  const handleSave = () => {
    const metricsData = {
      ...formData,
      plannedItems: Number(formData.plannedItems),
      estimatedPoints: Number(formData.estimatedPoints),
      carryForwardPoints: Number(formData.carryForwardPoints),
      committedBufferPoints: Number(formData.committedBufferPoints),
      completedBufferPoints: Number(formData.completedBufferPoints),
      testCoverage: Number(formData.testCoverage),
      completedTotalPoints: Number(formData.completedTotalPoints),
      completedAdjustedPoints: Number(formData.completedAdjustedPoints),
    }

    dispatch({ type: "SET_METRICS", payload: metricsData })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const overallScore = calculateOverallScore()
  const isFormValid = formData.sprintNumber.trim() !== ""

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
              <Label htmlFor="sprintNumber">Sprint Number *</Label>
              <Input
                id="sprintNumber"
                value={formData.sprintNumber}
                onChange={(e) => handleInputChange("sprintNumber", e.target.value)}
                placeholder="e.g., 2.2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plannedItems">Sprint Backlog (Planned)</Label>
              <Input
                id="plannedItems"
                type="number"
                value={formData.plannedItems}
                onChange={(e) => handleInputChange("plannedItems", Number.parseInt(e.target.value) || 0)}
                placeholder="Number of planned items"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedPoints">Sprint Backlog (Estimated)</Label>
              <Input
                id="estimatedPoints"
                type="number"
                value={formData.estimatedPoints}
                onChange={(e) => handleInputChange("estimatedPoints", Number.parseInt(e.target.value) || 0)}
                placeholder="Estimated story points"
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
                value={formData.testCoverage}
                onChange={(e) => handleInputChange("testCoverage", Number.parseFloat(e.target.value) || 0)}
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
                  value={formData.qualityChecklist[item.key as keyof typeof formData.qualityChecklist]}
                  onValueChange={(value: QualityScore) =>
                    handleQualityChange(item.key as keyof typeof formData.qualityChecklist, value)
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
                Based on {Object.values(formData.qualityChecklist).filter((v) => v !== "na").length} applicable
                standards
              </div>
              <div className="text-xs text-muted-foreground">Yes: 100% • Partial: 50% • No: 0%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
