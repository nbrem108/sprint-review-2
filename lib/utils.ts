import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Issue } from './summary-types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to check if an issue is completed
export function isIssueCompleted(status: string): boolean {
  const completedStatuses = ["done", "closed", "resolved"];
  return completedStatuses.some(completedStatus => 
    status?.toLowerCase().includes(completedStatus)
  );
}

export interface EpicBreakdown {
  name: string
  total: number
  completed: number
  totalPoints: number
  completedPoints: number
  percent: number
  percentPoints: number
}

export function getEpicBreakdown(issues: Issue[]): EpicBreakdown[] {
  const byEpic: Record<string, { name: string; issues: Issue[] }> = {};
  
  for (const issue of issues) {
    // Use epicKey if available, otherwise fallback to "No Epic"
    const epicKey = issue.epicKey ?? "No Epic";
    if (!byEpic[epicKey]) {
      byEpic[epicKey] = {
        name: issue.epicName || (epicKey === "No Epic" ? "Other" : epicKey),
        issues: [],
      };
    }
    byEpic[epicKey].issues.push(issue);
  }

  // Convert to array and aggregate metrics
  return Object.values(byEpic).map((epic) => {
    const total = epic.issues.length;
    const completed = epic.issues.filter(i => isIssueCompleted(i.status || "")).length;
    
    const totalPoints = epic.issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    const completedPoints = epic.issues
      .filter(i => isIssueCompleted(i.status || ""))
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const percentPoints = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    
    return {
      name: epic.name,
      total,
      completed,
      totalPoints,
      completedPoints,
      percent,
      percentPoints,
    };
  });
}

type QualityValue = "yes" | "no" | "partial" | "na";

export function calculateQualityScore(checklist: Record<string, QualityValue>): number {
  const scores = {
    yes: 1,
    partial: 0.5,
    no: 0,
    na: null,
  };

  const items = Object.values(checklist).filter((value): value is Exclude<QualityValue, "na"> => 
    value !== "na"
  );

  if (items.length === 0) return 0;

  const totalScore = items.reduce((sum, value) => sum + scores[value], 0);
  return Math.round((totalScore / items.length) * 100);
}
