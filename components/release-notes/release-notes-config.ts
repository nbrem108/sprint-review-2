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

export const CURRENT_VERSION = '2.0.0';

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '2.0.0',
    date: 'December 2024',
    title: 'Command Alkon Logo Integration & Enhanced Slide Layouts',
    description: 'Major update introducing professional branding and improved slide designs',
    category: 'feature',
    priority: 'high',
    features: [
      'Command Alkon logo integration across all slides',
      'Smart logo selection (CMYK/White variants)',
      'Enhanced slide layouts with professional headers',
      'Improved responsive design for all devices'
    ],
    improvements: [
      'Better visual hierarchy and content organization',
      'Faster slide rendering and performance',
      'Enhanced component reusability and maintainability',
      'Improved error handling and fallback options'
    ],
    ui: [
      'Professional header-footer layouts for title slides',
      'Enhanced content structure for summary slides',
      'Improved data visualization for metrics slides',
      'Non-intrusive logo overlays for demo story slides',
      'Subtle logo watermarks for corporate slides'
    ],
    technical: [
      'Modular component architecture',
      'Optimized image loading and caching',
      'Enhanced TypeScript implementation',
      'Centralized asset path configuration'
    ],
    documentation: [
      'Comprehensive logo implementation guide',
      'Release notes management plan',
      'Updated API documentation',
      'Enhanced setup and configuration guides'
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