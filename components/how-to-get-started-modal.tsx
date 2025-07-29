"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  BookOpen, 
  Settings, 
  Target, 
  BarChart3, 
  FileText, 
  Image, 
  Presentation, 
  Download,
  CheckCircle,
  Clock,
  Users,
  Key,
  ExternalLink,
  ArrowRight,
  Play,
  Lightbulb
} from 'lucide-react'

interface HowToGetStartedModalProps {
  children: React.ReactNode
}

export function HowToGetStartedModal({ children }: HowToGetStartedModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            How to Get Started
          </DialogTitle>
          <DialogDescription className="text-lg">
            A comprehensive guide to setting up and using the Sprint Review Generator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Prerequisites Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                What You'll Need
              </CardTitle>
              <CardDescription>
                Gather these items before starting your sprint review presentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Sprint Information</h4>
                      <p className="text-sm text-muted-foreground">
                        • Completed sprint with issues<br/>
                        • Sprint metrics and velocity data<br/>
                        • Epic and story information
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Team Input</h4>
                      <p className="text-sm text-muted-foreground">
                        • Demo story selections<br/>
                        • Screenshots of key features<br/>
                        • Quality checklist responses
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Ready to Use</h4>
                      <p className="text-sm text-muted-foreground">
                        • Jira access already configured<br/>
                        • Corporate branding included<br/>
                        • Templates and assets ready
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Play className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Quick Start</h4>
                      <p className="text-sm text-muted-foreground">
                        • Just select your project and sprint<br/>
                        • Everything else is pre-configured<br/>
                        • Start creating immediately
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-Step Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-600" />
                Step-by-Step Process
              </CardTitle>
              <CardDescription>
                Follow these steps to create your sprint review presentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Select Your Sprint
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Simply choose your project, board, and sprint. Everything is pre-configured and ready to use.
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Choose project and board
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Select active sprint
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Issues load automatically
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Demo Stories Selection
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose which stories to highlight in your demo. Add screenshots and prepare content for presentation.
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Select key stories for demo
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Upload screenshots
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Review story summaries
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Metrics & Quality
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure sprint metrics and complete the quality checklist. This data will be included in your presentation.
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Enter sprint metrics
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Complete quality checklist
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Review epic breakdown
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Corporate Branding (Optional)
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Corporate branding is already included. You can optionally add additional slides or customize the presentation.
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Branding already configured
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Optional: Add custom slides
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Optional: Customize positioning
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-semibold">
                    5
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Presentation className="h-4 w-4" />
                      Generate & Present
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Generate your presentation and export it in your preferred format. Present directly or share with stakeholders.
                    </p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Generate presentation
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Preview in fullscreen mode
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Export in preferred format
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-600" />
                Export Options
              </CardTitle>
              <CardDescription>
                Choose the right export format for your audience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Advanced Digest (PDF)
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Technical audience - support, implementation, external customers
                    </p>
                    <Badge variant="secondary" className="mt-2">Detailed</Badge>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Executive Summary (HTML)
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Executive stakeholders with copy-paste functionality
                    </p>
                    <Badge variant="secondary" className="mt-2">High-level</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Sprint Digest (PDF)
                    </h4>
                    <p className="text-sm text-purple-700 mt-1">
                      General sprint overview with comprehensive metrics
                    </p>
                    <Badge variant="secondary" className="mt-2">Comprehensive</Badge>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-900 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Markdown Export
                    </h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Developer-friendly documentation format
                    </p>
                    <Badge variant="secondary" className="mt-2">Technical</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Tips & Best Practices
              </CardTitle>
              <CardDescription>
                Make the most of your sprint review presentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Before You Start</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure your sprint is complete in Jira</li>
                    <li>• Gather screenshots of key features</li>
                    <li>• Review sprint metrics with your team</li>
                    <li>• Everything else is pre-configured!</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">During Creation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Select 3-5 key stories for demo</li>
                    <li>• Use high-quality screenshots</li>
                    <li>• Complete all quality checklist items</li>
                    <li>• Preview presentation before exporting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex justify-center pt-4">
            <Button className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Start Your First Sprint Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 