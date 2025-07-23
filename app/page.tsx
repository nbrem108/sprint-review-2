"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"
import { SprintProvider } from "@/components/sprint-context"

export default function SprintReviewApp() {
  return (
    <SprintProvider>
      <div className="min-h-screen bg-background">
        {/* Main Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-6">
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold">Sprint Review Deck Generator</h1>
              <p className="text-sm text-muted-foreground">
                Create professional sprint review presentations from your Jira data
              </p>
            </div>
          </div>
        </header>

        {/* Layout Container */}
        <div className="flex">
          {/* Fixed Left Sidebar */}
          <AppSidebar />

          {/* Main Content Area */}
          <main className="flex-1 ml-80 p-6">
            <MainContent />
          </main>
        </div>
      </div>
    </SprintProvider>
  )
}
