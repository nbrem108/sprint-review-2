"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

interface Project {
  id: string
  key: string
  name: string
  boards?: Board[]
  boardId?: string // kept for backward-compat single-board case
}

// New board type
interface Board {
  id: string
  name: string
  type: string // scrum | kanban | simple
}

interface Sprint {
  id: string
  name: string
  state: "active" | "closed" | "future"
  startDate?: string
  endDate?: string
  boardId: string
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

export interface SprintMetrics {
  // Sprint Planning Metrics
  sprintBacklogPlanned: number // How many sprints planned (usually 1)
  sprintBacklogEstimated: number // How many sprints estimated out (typically 3-4)
  sprintStoryPointCommitment: number // Story points committed to current sprint
  
  // Work Item Metrics
  plannedItems: number
  estimatedPoints: number
  carryForwardPoints: number
  committedBufferPoints: number
  completedBufferPoints: number
  testCoverage: number
  sprintNumber: string
  completedTotalPoints: number
  completedAdjustedPoints: number
  
  // Enhanced metrics fields
  sprintStartDate?: string
  sprintEndDate?: string
  teamSize?: number
  defectCount?: number
  defectResolutionRate?: number
  averageCycleTime?: number
  sprintGoal?: string
  retrospectiveNotes?: string
  boardId?: string
  
  // Velocity and performance metrics
  velocity?: number
  velocityTarget?: number
  velocityAchievement?: number
  efficiencyScore?: number
  qualityScore?: number
  qualityChecklist: {
    sprintCommitment: "yes" | "no" | "partial" | "na"
    velocity: "yes" | "no" | "partial" | "na"
    testCoverage: "yes" | "no" | "partial" | "na"
    testAutomation: "yes" | "no" | "partial" | "na"
    uiUxStandards: "yes" | "no" | "partial" | "na"
    internationalFirst: "yes" | "no" | "partial" | "na"
    mobileResponsive: "yes" | "no" | "partial" | "na"
    featurePermissions: "yes" | "no" | "partial" | "na"
    releaseNotes: "yes" | "no" | "partial" | "na"
    howToVideos: "yes" | "no" | "partial" | "na"
  }
}

// Historical sprint data for comparison
export interface HistoricalSprintData {
  sprintId: string
  sprintName: string
  sprintNumber: string
  startDate: string
  endDate: string
  metrics: SprintMetrics
  createdAt: string
  updatedAt: string
}

// Sprint comparison data structure
export interface SprintComparison {
  currentSprint: SprintMetrics | null
  previousSprint1: SprintMetrics | null
  previousSprint2: SprintMetrics | null
  comparisonMetrics: {
    velocityTrend: number // percentage change
    qualityTrend: number // percentage change
    completionRateTrend: number // percentage change
    teamPerformanceTrend: number // percentage change
  }
}

// Trend analysis data
export interface SprintTrends {
  velocityHistory: Array<{ sprint: string; velocity: number; date: string }>
  qualityHistory: Array<{ sprint: string; qualityScore: number; date: string }>
  completionHistory: Array<{ sprint: string; completionRate: number; date: string }>
  teamPerformanceHistory: Array<{ sprint: string; efficiencyScore: number; date: string }>
}

interface CorporateSlide {
  id: string
  filename: string
  blobUrl: string
  localUrl: string
  title: string
  position: "intro" | "meeting-guidelines" | "section-break" | "outro" | "custom"
  order: number
  isActive: boolean
  uploadedAt: string
}

interface SprintState {
  selectedProject: Project | null
  selectedBoard: Board | null
  selectedSprint: Sprint | null
  upcomingSprint: Sprint | null
  issues: Issue[]
  upcomingIssues: Issue[]
  demoStories: string[]
  demoStoryScreenshots: Record<string, string> // Base64 encoded screenshots
  metrics: SprintMetrics | null
  // Historical data and comparison
  historicalSprints: HistoricalSprintData[]
  sprintComparison: SprintComparison | null
  sprintTrends: SprintTrends | null
  summaries: {
    currentSprint?: string
    upcomingSprint?: string
    demoStories?: Record<string, string>
  }
  additionalSlides: File[]
  corporateSlides: CorporateSlide[]
  generatedPresentation: GeneratedPresentation | null
  loading: {
    projects: boolean
    sprints: boolean
    issues: boolean
    summaries: boolean
    historicalData: boolean
  }
  currentTab: "setup" | "demo-stories" | "metrics" | "other-slides" | "corporate-slides" | "summaries" | "presentation"
  sessionId: string
  lastSaved: string | null
}

// Add GeneratedPresentation interface
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

// Add PresentationSlide interface
interface PresentationSlide {
  id: string
  title: string
  content: string
  type: "title" | "summary" | "metrics" | "demo-story" | "custom" | "corporate" | "qa"
  order: number
  corporateSlideUrl?: string
  storyId?: string
}

type SprintAction =
  | { type: "SET_PROJECT"; payload: Project }
  | { type: "SET_BOARD"; payload: Board }
  | { type: "SET_SPRINT"; payload: Sprint }
  | { type: "SET_UPCOMING_SPRINT"; payload: Sprint | null }
  | { type: "SET_ISSUES"; payload: Issue[] }
  | { type: "SET_UPCOMING_ISSUES"; payload: Issue[] }
  | { type: "TOGGLE_DEMO_STORY"; payload: string }
  | { type: "ADD_DEMO_SCREENSHOT"; payload: { storyId: string; screenshot: string } }
  | { type: "REMOVE_DEMO_SCREENSHOT"; payload: string }
  | { type: "SET_METRICS"; payload: SprintMetrics }
  | { type: "SET_HISTORICAL_SPRINTS"; payload: HistoricalSprintData[] }
  | { type: "SET_SPRINT_COMPARISON"; payload: SprintComparison | null }
  | { type: "SET_SPRINT_TRENDS"; payload: SprintTrends | null }
  | { type: "SAVE_HISTORICAL_SPRINT"; payload: HistoricalSprintData }
  | { type: "SET_SUMMARIES"; payload: SprintState["summaries"] }
  | { type: "ADD_SLIDE"; payload: File }
  | { type: "REMOVE_SLIDE"; payload: number }
  | { type: "SET_CORPORATE_SLIDES"; payload: CorporateSlide[] }
  | { type: "SET_GENERATED_PRESENTATION"; payload: GeneratedPresentation | null }
  | { type: "SET_LOADING"; payload: { key: keyof SprintState["loading"]; value: boolean } }
  | { type: "SET_TAB"; payload: SprintState["currentTab"] }
  | { type: "RESET_SPRINT_DATA" }
  | { type: "LOAD_FROM_STORAGE"; payload: Partial<SprintState> }
  | { type: "CLEAR_SESSION" }

// persistence helpers
const STORAGE_KEY = "sprint-review-session"
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000 // 24h
const generateSessionId = () => {
  // Use a stable session ID to avoid hydration mismatches
  if (typeof window === 'undefined') {
    return 'session-server-side'
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2,9)}`
}

// Utility function to ensure corporate slides are unique by ID
const deduplicateCorporateSlides = (slides: CorporateSlide[]): CorporateSlide[] => {
  const seenIds = new Set<string>()
  const seenUrls = new Set<string>()
  const result: CorporateSlide[] = []
  
  for (const slide of slides) {
    // Check for duplicate IDs
    if (seenIds.has(slide.id)) {
      continue
    }
    
    // Check for duplicate URLs (for default slides)
    if (slide.localUrl && seenUrls.has(slide.localUrl)) {
      continue
    }
    
    seenIds.add(slide.id)
    if (slide.localUrl) {
      seenUrls.add(slide.localUrl)
    }
    result.push(slide)
  }
  
  return result
}

const serializeStateForStorage = (state: SprintState) => ({
  selectedProject: state.selectedProject,
  selectedBoard: state.selectedBoard,
  selectedSprint: state.selectedSprint,
  upcomingSprint: state.upcomingSprint,
  issues: state.issues,
  upcomingIssues: state.upcomingIssues,
  demoStories: state.demoStories,
  demoStoryScreenshots: state.demoStoryScreenshots,
  metrics: state.metrics,
  historicalSprints: state.historicalSprints,
  sprintComparison: state.sprintComparison,
  sprintTrends: state.sprintTrends,
  summaries: state.summaries,
  corporateSlides: state.corporateSlides,
  generatedPresentation: state.generatedPresentation,
  currentTab: state.currentTab,
  sessionId: state.sessionId,
  lastSaved: new Date().toISOString(),
})

const loadStateFromStorage = (): Partial<SprintState> | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.lastSaved && Date.now() - new Date(parsed.lastSaved).getTime() > SESSION_TIMEOUT) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

const saveStateToStorage = (state: SprintState) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeStateForStorage(state)))
  } catch {}
}

const initialState: SprintState = {
  selectedProject: null,
  selectedBoard: null,
  selectedSprint: null,
  upcomingSprint: null,
  issues: [],
  upcomingIssues: [],
  demoStories: [],
  demoStoryScreenshots: {},
  metrics: null,
  historicalSprints: [],
  sprintComparison: null,
  sprintTrends: null,
  summaries: {},
  additionalSlides: [],
  corporateSlides: [
    {
      id: "default-intro",
      filename: "intro.png",
      blobUrl: "",
      localUrl: "/corporate-slides/intro.png",
      title: "Introduction",
      position: "intro",
      order: 0,
      isActive: true,
      uploadedAt: new Date().toISOString(),
    },
    {
      id: "default-guidelines",
      filename: "guidelines.png",
      blobUrl: "",
      localUrl: "/corporate-slides/guidelines.png",
      title: "Meeting Guidelines",
      position: "meeting-guidelines",
      order: 1,
      isActive: true,
      uploadedAt: new Date().toISOString(),
    },
    {
      id: "default-demo-separator",
      filename: "demo_separator.png",
      blobUrl: "",
      localUrl: "/corporate-slides/demo_separator.png",
      title: "Demo Separator",
      position: "section-break",
      order: 2,
      isActive: true,
      uploadedAt: new Date().toISOString(),
    },
    {
      id: "default-blank-template",
      filename: "blank_template.png",
      blobUrl: "",
      localUrl: "/corporate-slides/blank_template.png",
      title: "Blank Template",
      position: "custom",
      order: 3,
      isActive: true,
      uploadedAt: new Date().toISOString(),
    },
  ],
  generatedPresentation: null,
  loading: {
    projects: false,
    sprints: false,
    issues: false,
    summaries: false,
    historicalData: false,
  },
  currentTab: "setup",
  sessionId: generateSessionId(),
  lastSaved: null,
}

function sprintReducer(state: SprintState, action: SprintAction): SprintState {
  let newState: SprintState

  switch (action.type) {
    case "SET_PROJECT":
      newState = {
        ...state,
        selectedProject: action.payload,
        selectedSprint: null,
        upcomingSprint: null,
        issues: [],
        upcomingIssues: [],
        demoStories: [],
        demoStoryScreenshots: {},
        metrics: null,
        summaries: {},
      }
      break
    case "SET_BOARD":
      newState = {
        ...state,
        selectedBoard: action.payload,
        selectedSprint: null,
        upcomingSprint: null,
        issues: [],
        upcomingIssues: [],
        demoStories: [],
        demoStoryScreenshots: {},
        metrics: null,
        summaries: {},
      }
      break
    case "SET_SPRINT":
      newState = {
        ...state,
        selectedSprint: action.payload,
        issues: [],
        demoStories: [],
        demoStoryScreenshots: {},
        summaries: {},
      }
      break
    case "SET_UPCOMING_SPRINT":
      newState = {
        ...state,
        upcomingSprint: action.payload,
        upcomingIssues: [],
      }
      break
    case "SET_ISSUES":
      newState = { ...state, issues: action.payload }
      break
    case "SET_UPCOMING_ISSUES":
      newState = { ...state, upcomingIssues: action.payload }
      break
    case "TOGGLE_DEMO_STORY":
      newState = {
        ...state,
        demoStories: state.demoStories.includes(action.payload)
          ? state.demoStories.filter((id) => id !== action.payload)
          : [...state.demoStories, action.payload],
      }
      break
    case "ADD_DEMO_SCREENSHOT":
      newState = {
        ...state,
        demoStoryScreenshots: {
          ...state.demoStoryScreenshots,
          [action.payload.storyId]: action.payload.screenshot,
        },
      }
      break
    case "REMOVE_DEMO_SCREENSHOT":
      const { [action.payload]: _, ...newScreenshots } = state.demoStoryScreenshots
      newState = { ...state, demoStoryScreenshots: newScreenshots }
      break
    case "SET_METRICS":
      newState = { ...state, metrics: action.payload }
      break
    case "SET_HISTORICAL_SPRINTS":
      newState = { ...state, historicalSprints: action.payload }
      break
    case "SET_SPRINT_COMPARISON":
      newState = { ...state, sprintComparison: action.payload }
      break
    case "SET_SPRINT_TRENDS":
      newState = { ...state, sprintTrends: action.payload }
      break
    case "SAVE_HISTORICAL_SPRINT":
      newState = {
        ...state,
        historicalSprints: [
          ...state.historicalSprints.filter(s => s.sprintId !== action.payload.sprintId),
          action.payload
        ]
      }
      break
    case "SET_SUMMARIES":
      newState = { ...state, summaries: { ...state.summaries, ...action.payload } }
      break
    case "ADD_SLIDE":
      newState = { ...state, additionalSlides: [...state.additionalSlides, action.payload] }
      break
    case "REMOVE_SLIDE":
      newState = {
        ...state,
        additionalSlides: state.additionalSlides.filter((_, index) => index !== action.payload),
      }
      break
    case "SET_CORPORATE_SLIDES":
      newState = { ...state, corporateSlides: deduplicateCorporateSlides(action.payload) }
      break
    case "SET_GENERATED_PRESENTATION":
      newState = { ...state, generatedPresentation: action.payload }
      break
    case "RESET_SPRINT_DATA":
      newState = {
        ...state,
        selectedSprint: null,
        upcomingSprint: null,
        issues: [],
        upcomingIssues: [],
        demoStories: [],
        demoStoryScreenshots: {},
        metrics: null,
        sprintComparison: null,
        summaries: {},
        additionalSlides: [],
      }
      break
    case "SET_LOADING":
      newState = { ...state, loading: { ...state.loading, [action.payload.key]: action.payload.value } }
      break
    case "SET_TAB":
      newState = { ...state, currentTab: action.payload }
      break
    case "LOAD_FROM_STORAGE":
      // Ensure corporate slides don't get duplicated by merging properly
      const storedCorporateSlides = action.payload.corporateSlides || []
      const mergedCorporateSlides = storedCorporateSlides.length > 0 
        ? deduplicateCorporateSlides(storedCorporateSlides)
        : state.corporateSlides
      
      newState = { 
        ...state, 
        ...action.payload,
        corporateSlides: mergedCorporateSlides
      }
      break
    case "CLEAR_SESSION":
      if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY)
      newState = { ...initialState, sessionId: generateSessionId() }
      break
    default:
      return state
  }

  // auto-save except during load
  if (typeof window !== "undefined" && action.type !== "LOAD_FROM_STORAGE" && action.type !== "SET_LOADING") {
    setTimeout(() => saveStateToStorage(newState!), 0)
  }

  return newState!
}

interface SprintContextValue {
  state: SprintState
  dispatch: React.Dispatch<SprintAction>
  clearSession: () => void
  exportSession: () => string
  importSession: (data: string) => boolean
}

const SprintContext = createContext<SprintContextValue | null>(null)

export function SprintProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sprintReducer, initialState)

  useEffect(() => {
    const stored = loadStateFromStorage()
    if (stored) {
      // Ensure we don't lose the default corporate slides when loading from storage
      const hasDefaultSlides = stored.corporateSlides?.some(slide => slide.id.startsWith("default-"))
      if (!hasDefaultSlides) {
        stored.corporateSlides = [...initialState.corporateSlides, ...(stored.corporateSlides || [])]
      }
      dispatch({ type: "LOAD_FROM_STORAGE", payload: stored })
    }
  }, [])

  // Ensure corporate slides are always deduplicated
  useEffect(() => {
    if (state.corporateSlides.length > 0) {
      const deduplicated = deduplicateCorporateSlides(state.corporateSlides)
      if (deduplicated.length !== state.corporateSlides.length) {
        dispatch({ type: "SET_CORPORATE_SLIDES", payload: deduplicated })
      }
    }
  }, [state.corporateSlides.length])

  const clearSession = () => dispatch({ type: "CLEAR_SESSION" })

  const exportSession = () => JSON.stringify(serializeStateForStorage(state), null, 2)

  const importSession = (data: string) => {
    try {
      dispatch({ type: "LOAD_FROM_STORAGE", payload: JSON.parse(data) })
      return true
    } catch {
      return false
    }
  }

  return (
    <SprintContext.Provider value={{ state, dispatch, clearSession, exportSession, importSession }}>
      {children}
    </SprintContext.Provider>
  )
}

export function useSprintContext() {
  const context = useContext(SprintContext)
  if (!context) {
    throw new Error("useSprintContext must be used within a SprintProvider")
  }
  return context
}
