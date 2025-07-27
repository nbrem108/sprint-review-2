export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bugfix' | 'technical' | 'documentation' | 'ui';
  priority: 'high' | 'medium' | 'low';
  breaking?: boolean;
  features?: string[];
  improvements?: string[];
  bugfixes?: string[];
  technical?: string[];
  documentation?: string[];
  ui?: string[];
}

export interface ReleaseNotesConfig {
  currentVersion: string;
  releases: ReleaseNote[];
  showOnStartup: boolean;
  lastReadVersion?: string;
}

export const CURRENT_VERSION = '1.0.0';

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.0.0',
    date: 'December 2024',
    title: 'First Official Release - Sprint Review Generator',
    description: '🎉 Welcome to Sprint Review Generator v1.0.0! This is the first official release of our comprehensive tool designed to streamline the creation of professional sprint review presentations.',
    category: 'feature',
    priority: 'high',
    features: [
      'Complete application foundation with React 19 and TypeScript',
      'Jira Cloud integration for real-time sprint data',
      'AI-powered content generation with OpenAI integration',
      'Multi-format export system (Advanced Digest, Executive Summary, Sprint Digest, Markdown)',
      'Professional presentation mode with full-screen experience',
      'Corporate branding with Command Alkon logo integration',
      'Comprehensive tab-based workflow with real-time validation'
    ],
    improvements: [
      'Advanced export system with audience-specific formats',
      'Quality assurance and performance monitoring',
      'Comprehensive error handling and recovery',
      'Intelligent caching and memory management',
      'Full keyboard navigation and screen reader support'
    ],
    ui: [
      'Responsive design optimized for desktop, tablet, and mobile',
      'Professional slide layouts with consistent branding',
      'Interactive elements with clickable navigation',
      'Real-time validation and feedback systems',
      'Accessible design with proper contrast and navigation'
    ],
    technical: [
      'Next.js 15 full-stack framework with API routes',
      'jsPDF for professional document creation',
      'Advanced image and document processing',
      'Context-based state management with optimistic updates',
      'Comprehensive TypeScript implementation'
    ],
    documentation: [
      'Comprehensive release notes and feature breakdown',
      'Complete API documentation and integration guides',
      'Implementation guides for logo integration',
      'User guides for setup and usage instructions',
      'Changelog with version history tracking'
    ]
  }
];

export const getLatestRelease = (): ReleaseNote | null => {
  return RELEASE_NOTES.length > 0 ? RELEASE_NOTES[0] : null;
};

export const getReleaseByVersion = (version: string): ReleaseNote | null => {
  return RELEASE_NOTES.find(release => release.version === version) || null;
};

export const hasUnreadReleases = (lastReadVersion?: string): boolean => {
  if (!lastReadVersion) return true;
  
  const latestRelease = getLatestRelease();
  if (!latestRelease) return false;
  
  return latestRelease.version !== lastReadVersion;
};

export const getReleaseNotesConfig = (): ReleaseNotesConfig => {
  return {
    currentVersion: CURRENT_VERSION,
    releases: RELEASE_NOTES,
    showOnStartup: true,
    lastReadVersion: undefined
  };
}; 