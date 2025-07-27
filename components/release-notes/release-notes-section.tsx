'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getLatestRelease, hasUnreadReleases, type ReleaseNote } from './release-notes-config'

interface ReleaseNotesSectionProps {
  lastReadVersion?: string;
  onMarkAsRead?: (version: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'feature':
      return '🚀'
    case 'improvement':
      return '✨'
    case 'bugfix':
      return '🐛'
    case 'technical':
      return '🔧'
    case 'documentation':
      return '📚'
    case 'ui':
      return '🎨'
    default:
      return '📋'
  }
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'feature':
      return 'New Features'
    case 'improvement':
      return 'Improvements'
    case 'bugfix':
      return 'Bug Fixes'
    case 'technical':
      return 'Technical Updates'
    case 'documentation':
      return 'Documentation'
    case 'ui':
      return 'UI/UX Enhancements'
    default:
      return 'Updates'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function ReleaseNotesSection({ lastReadVersion, onMarkAsRead }: ReleaseNotesSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const latestRelease = getLatestRelease()
  const hasUnread = hasUnreadReleases(lastReadVersion)

  if (!latestRelease) {
    return null
  }

  const handleMarkAsRead = () => {
    onMarkAsRead?.(latestRelease.version)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-semibold">Release Notes</CardTitle>
            <Badge variant="secondary" className="text-xs">
              v{latestRelease.version}
            </Badge>
            {hasUnread && (
              <Badge variant="destructive" className="text-xs">
                New
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsRead}
                className="text-xs"
              >
                Mark as Read
              </Button>
            )}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Released: {latestRelease.date}</span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>{getCategoryLabel(latestRelease.category)}</span>
          </span>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Release Description */}
              <div className="text-sm text-gray-700 leading-relaxed">
                {latestRelease.description}
              </div>

              {/* Features */}
              {latestRelease.features && latestRelease.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{getCategoryIcon('feature')}</span>
                    <span>New Features</span>
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {latestRelease.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <span className="text-ca-blue-600 mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {latestRelease.improvements && latestRelease.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{getCategoryIcon('improvement')}</span>
                    <span>Improvements</span>
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {latestRelease.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* UI/UX Enhancements */}
              {latestRelease.ui && latestRelease.ui.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{getCategoryIcon('ui')}</span>
                    <span>UI/UX Enhancements</span>
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {latestRelease.ui.map((enhancement, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{enhancement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Updates */}
              {latestRelease.technical && latestRelease.technical.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{getCategoryIcon('technical')}</span>
                    <span>Technical Updates</span>
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {latestRelease.technical.map((update, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{update}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Documentation */}
              {latestRelease.documentation && latestRelease.documentation.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                    <span>{getCategoryIcon('documentation')}</span>
                    <span>Documentation</span>
                  </h4>
                  <ul className="space-y-1 ml-6">
                    {latestRelease.documentation.map((doc, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Priority Badge */}
              <div className="flex items-center space-x-2 pt-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(latestRelease.priority)}`}
                >
                  {latestRelease.priority} Priority
                </Badge>
                {latestRelease.breaking && (
                  <Badge variant="destructive" className="text-xs">
                    Breaking Changes
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open('/release-notes', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Full Release Notes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    // Show version information
                    alert(`Current Version: ${latestRelease.version}\nRelease Date: ${latestRelease.date}\n\nThis is the first official release of Sprint Review Generator!`);
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Version Info
                </Button>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
} 