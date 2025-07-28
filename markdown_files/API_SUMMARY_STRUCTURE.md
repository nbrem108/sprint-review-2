# API Summary Structure

## Overview
The sprint review system now has three distinct API endpoints, each serving a specific purpose in the presentation generation process.

## API Endpoints

### 1. Current Sprint Summary (`/api/generate-summaries/current-sprint`)
**Purpose:** Full comprehensive summary for the entire sprint

**What it includes:**
- **All stories** from the sprint (not just demo stories)
- **Complete sprint statistics** (completed, in progress, not started)
- **Epic breakdown** with progress tracking
- **Comprehensive overview** of sprint performance

**Sections generated:**
- **Sprint Overview** - High-level sprint statistics and progress
- **Key Accomplishments** - Major completed work and achievements
- **Work in Progress** - Ongoing work and current status
- **Sprint Insights** - Analysis and learnings from the sprint

**Use case:** Main sprint review slide that gives stakeholders a complete picture of the sprint's performance and progress.

### 2. Demo Stories Summary (`/api/generate-summaries/demo-stories`)
**Purpose:** Individual and detailed summaries with user impact for specific demo stories

**What it includes:**
- **Selected demo stories only** (user-selected for presentation)
- **Detailed individual summaries** for each story
- **Focus on accomplishments and user value**
- **Business impact and user experience details**

**Content focus:**
- What was accomplished
- Value delivered to users
- Business impact
- Technical achievements

**Use case:** Individual demo story slides that showcase specific features or improvements in detail.

### 3. Upcoming Sprint Summary (`/api/generate-summaries/upcoming-sprint`)
**Purpose:** Full summary for the entire following sprint

**What it includes:**
- **All planned issues** for the upcoming sprint
- **Sprint planning overview**
- **Feature and deliverable identification**
- **Success criteria** (if available)

**Sections generated:**
- **Sprint Overview** - General nature of upcoming work
- **Key Features & Deliverables** - Identifiable feature work and enhancements
- **Success Criteria** - Expected outcomes and success measures

**Use case:** Sprint planning slide that communicates upcoming work to stakeholders.

## Data Flow

```
Sprint Data → Current Sprint Summary (All Issues)
     ↓
Demo Story Selection → Demo Stories Summary (Selected Issues)
     ↓
Upcoming Sprint Data → Upcoming Sprint Summary (All Planned Issues)
```

## Epic Information Integration

All three APIs now include epic information when available:
- **Epic names and keys** are included in issue details
- **Epic breakdown** is provided in current sprint summary
- **Epic grouping** helps organize and present information logically

## Key Differences

| Aspect | Current Sprint | Demo Stories | Upcoming Sprint |
|--------|---------------|--------------|-----------------|
| **Scope** | All sprint issues | Selected demo stories | All planned issues |
| **Focus** | Comprehensive overview | Individual details | Planning and preparation |
| **Sections** | 4 sections (Overview, Accomplishments, WIP, Insights) | Individual story summaries | 3 sections (Overview, Features, Success) |
| **Detail Level** | High-level summary | Detailed individual | Planning-focused |
| **Epic Integration** | Epic breakdown included | Epic info per story | Epic info per issue |

## Usage in Presentations

1. **Current Sprint Summary** → Main sprint review slide
2. **Demo Stories Summary** → Individual demo story slides
3. **Upcoming Sprint Summary** → Sprint planning slide

This structure ensures that:
- Stakeholders get a complete picture of sprint performance
- Demo presentations focus on specific achievements
- Planning information is clearly communicated
- Epic information is consistently utilized across all summaries 