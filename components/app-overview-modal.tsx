'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Users, 
  Target, 
  FileText, 
  Presentation, 
  Zap, 
  CheckCircle,
  Lightbulb,
  BarChart3,
  Globe,
  Shield
} from 'lucide-react'

interface AppOverviewModalProps {
  children: React.ReactNode
}

export function AppOverviewModal({ children }: AppOverviewModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            What This App Solves
          </DialogTitle>
          <DialogDescription className="text-base">
            Transform your sprint data into professional presentations with AI-powered insights
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* For Users Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                For Users (Product Owners, BAs, Tech Leads)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Automates Sprint Review Creation</h4>
                    <p className="text-sm text-muted-foreground">
                      Transforms raw Jira sprint data into professional presentations in minutes instead of hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">AI-Powered Summaries</h4>
                    <p className="text-sm text-muted-foreground">
                      Generates intelligent sprint overviews, demo story summaries, and upcoming sprint planning using OpenAI
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Comprehensive Metrics</h4>
                    <p className="text-sm text-muted-foreground">
                      Provides velocity, quality scores, epic breakdowns, and performance analytics
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Demo Story Curation</h4>
                    <p className="text-sm text-muted-foreground">
                      Helps select and present key deliverables with automated story summaries
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Corporate Branding</h4>
                    <p className="text-sm text-muted-foreground">
                      Integrates company logos and templates for consistent professional appearance
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Audience Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-600" />
                For Audience (Customers, Support, Executives, Implementation)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Presentation className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Audience-Specific Formats</h4>
                    <div className="text-sm text-muted-foreground space-y-1 mt-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Advanced Digest</Badge>
                        <span>Technical details for support/implementation teams</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Executive Summary</Badge>
                        <span>High-level insights for C-level stakeholders with Smartsheet integration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Sprint Digest</Badge>
                        <span>General overview for project managers and team members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Markdown Export</Badge>
                        <span>Developer-friendly documentation</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Professional Communication</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensures consistent, branded presentations that effectively communicate sprint progress and business impact
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Presentation className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Live Presentation Mode</h4>
                    <p className="text-sm text-muted-foreground">
                      Full-screen presentations with keyboard navigation for engaging stakeholder meetings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Quality Assurance</h4>
                    <p className="text-sm text-muted-foreground">
                      Built-in validation ensures presentations meet corporate standards before distribution
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Benefits Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Lightbulb className="h-5 w-5" />
                Key Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Time Savings</h4>
                  <p className="text-sm text-blue-800">
                    Reduce sprint review preparation from hours to minutes
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Consistency</h4>
                  <p className="text-sm text-blue-800">
                    Standardized format across all sprint reviews
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Professional Quality</h4>
                  <p className="text-sm text-blue-800">
                    Executive-ready presentations with corporate branding
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">Audience Focus</h4>
                  <p className="text-sm text-blue-800">
                    Tailored content for different stakeholder groups
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 