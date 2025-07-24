'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CURRENT_VERSION } from './release-notes-config'

interface VersionBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function VersionBadge({ className = "", showLabel = true }: VersionBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-mono ${className}`}
      title={`Current version: ${CURRENT_VERSION}`}
    >
      {showLabel ? `v${CURRENT_VERSION}` : CURRENT_VERSION}
    </Badge>
  )
} 