"use client"

import { useSprintContext } from "@/components/sprint-context"
import { SetupTab } from "@/components/tabs/setup-tab"
import { DemoStoriesTab } from "@/components/tabs/demo-stories-tab"
import { MetricsTab } from "@/components/tabs/metrics-tab"
import { SummariesTab } from "@/components/tabs/summaries-tab"
import { PresentationTab } from "@/components/tabs/presentation-tab"
import { OtherSlidesTab } from "@/components/tabs/other-slides-tab"
import { CorporateSlidesTab } from "@/components/tabs/corporate-slides-tab"

export function MainContent() {
  const { state } = useSprintContext()

  const renderCurrentTab = () => {
    switch (state.currentTab) {
      case "setup":
        return <SetupTab />
      case "demo-stories":
        return <DemoStoriesTab />
      case "metrics":
        return <MetricsTab />
      case "other-slides":
        return <OtherSlidesTab />
      case "corporate-slides":
        return <CorporateSlidesTab />
      case "summaries":
        return <SummariesTab />
      case "presentation":
        return <PresentationTab />
      default:
        return <SetupTab />
    }
  }

  return <div className="w-full">{renderCurrentTab()}</div>
}
