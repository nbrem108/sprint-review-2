'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ReleaseNotesPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Application
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Release Notes</h1>
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              v1.0.0
            </Badge>
            <Badge variant="default" className="text-lg px-4 py-2 bg-green-600">
              First Official Release
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground">
            December 2024
          </p>
        </div>

        {/* Welcome Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🎉 Welcome to Sprint Review Generator v1.0.0!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">
              This is the first official release of the Sprint Review Generator - a comprehensive tool designed to streamline the creation of professional sprint review presentations. Built specifically for agile teams, this application transforms raw sprint data into polished, executive-ready presentations with AI-powered insights.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              🚀 Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">📊 Comprehensive Sprint Analysis</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Jira Integration for real-time sprint data</li>
                  <li>• AI-Powered Summaries with intelligent generation</li>
                  <li>• Metrics Dashboard with velocity and quality scores</li>
                  <li>• Demo Story Management for curated presentations</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">🎯 Professional Presentation Generation</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Multi-Format Export (PDF, HTML, Markdown)</li>
                  <li>• Corporate Branding with Command Alkon logos</li>
                  <li>• Custom Slide Support for templates</li>
                  <li>• Live Presentation Mode with full-screen experience</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              🔧 Advanced Export System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Audience-Specific Formats:</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Advanced Digest</h4>
                    <p className="text-sm text-blue-700">Technical audience (support, implementation, external customers)</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Executive Summary</h4>
                    <p className="text-sm text-green-700">Executive stakeholders with copy-paste functionality</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">Sprint Digest</h4>
                    <p className="text-sm text-purple-700">General sprint overview with comprehensive metrics</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900">Markdown Export</h4>
                    <p className="text-sm text-orange-700">Developer-friendly documentation format</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Technical Features:</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Quality Assurance with built-in validation</li>
                  <li>• Performance Monitoring with real-time progress</li>
                  <li>• Error Handling with comprehensive recovery</li>
                  <li>• Optimized file generation and processing</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              🛠️ Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Frontend</h3>
                <ul className="space-y-1 text-sm">
                  <li>• React 19 with modern hooks</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Tailwind CSS for styling</li>
                  <li>• Radix UI for accessibility</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Backend</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Next.js 15 full-stack framework</li>
                  <li>• OpenAI API integration</li>
                  <li>• jsPDF for document creation</li>
                  <li>• Advanced file processing</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Integrations</h3>
                <ul className="space-y-1 text-sm">
                  <li>• Jira Cloud API</li>
                  <li>• OpenAI GPT models</li>
                  <li>• Command Alkon branding</li>
                  <li>• Corporate asset management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Target Audiences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              🎯 Target Audiences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Primary Users</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Scrum Masters:</strong> Sprint review facilitation</li>
                  <li>• <strong>Product Managers:</strong> Stakeholder communication</li>
                  <li>• <strong>Development Teams:</strong> Sprint retrospective</li>
                  <li>• <strong>Executives:</strong> High-level performance insights</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Use Cases</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Sprint review presentations</li>
                  <li>• Executive reporting</li>
                  <li>• Team retrospectives</li>
                  <li>• Stakeholder updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              🔮 Future Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">v1.1.0 Planned Features</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Multi-Sprint Analysis</li>
                  <li>• Enhanced AI Models</li>
                  <li>• Additional Export Formats</li>
                  <li>• Advanced Analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">v1.2.0 Planned Features</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Team Collaboration</li>
                  <li>• Custom Templates</li>
                  <li>• Integration APIs</li>
                  <li>• Mobile App</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">v2.0.0 Long-term Vision</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Enterprise Features</li>
                  <li>• AI-Powered Insights</li>
                  <li>• Real-time Collaboration</li>
                  <li>• Advanced Customization</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support & Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              📚 Support & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Available Documentation</h3>
                <ul className="space-y-2 text-sm">
                  <li>• User Guide and setup instructions</li>
                  <li>• API Documentation and integration guides</li>
                  <li>• Component Library documentation</li>
                  <li>• Troubleshooting guides</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Support Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>• GitHub Issues for bug reports</li>
                  <li>• Community forum discussions</li>
                  <li>• Email support for enterprise</li>
                  <li>• Comprehensive documentation site</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 pt-8 border-t">
          <p className="text-muted-foreground">
            This v1.0.0 release represents a significant milestone in the Sprint Review Generator project.
          </p>
          <p className="text-sm text-muted-foreground">
            Thank you to all users, contributors, and stakeholders who have supported this project from the beginning.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/">
              <Button variant="outline">
                Return to Application
              </Button>
            </Link>
            <Button 
              variant="outline"
              onClick={() => window.open('https://github.com/your-org/sprint-review-generator', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 