# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Available Commands

### Development Commands
- `npm run dev` - Start development server (Next.js 15)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (build ignores linting errors)

### Testing
- No specific test framework configured - check with user before implementing tests

## Environment Configuration

Required environment variables in `.env.local`:
```env
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript + Next.js 15 + Tailwind CSS
- **UI Components**: Radix UI with shadcn/ui components
- **State Management**: React Context + useReducer (SprintContext)
- **AI Integration**: OpenAI API via @ai-sdk/openai
- **PDF Generation**: jsPDF + html2canvas
- **File Handling**: @vercel/blob for uploads, file-saver for downloads

### Core Architecture Patterns

**State Management (`components/sprint-context.tsx`)**
- Centralized state using React Context + useReducer
- Auto-saves state to localStorage with 24h session timeout
- Handles projects, sprints, issues, metrics, presentations, and corporate slides
- Deduplication logic for corporate slides to prevent conflicts

**API Structure (`app/api/`)**
- RESTful API routes in Next.js App Router
- Jira integration endpoints for projects, sprints, and issues
- Export endpoints for different presentation formats (PDF, HTML, Markdown)
- AI-powered summary generation endpoints

**Component Organization**
- **`components/tabs/`** - Main application tabs (setup, metrics, summaries, etc.)
- **`components/presentation/`** - Presentation mode and slide rendering
- **`components/export/`** - Export functionality and progress tracking
- **`components/ui/`** - Reusable UI components (shadcn/ui)

**Export System (`lib/export-*.ts`)**
- Multiple export formats: Advanced Digest, Executive Summary, Sprint Digest, Markdown
- Quality assurance, caching, error handling, and optimization systems
- Progressive rendering with real-time progress tracking

### Key Data Models

**Sprint State Structure**
- Project/Board/Sprint hierarchy with multi-board support
- Issues with demo story selection and screenshot attachment
- Comprehensive metrics with quality checklists
- Historical sprint data for trend analysis
- Corporate slide management with position-based ordering

**Presentation Generation**
- Slide-based structure with multiple content types
- Corporate slide integration with Command Alkon branding
- Export optimization with compression and quality controls

## Important Implementation Notes

### Jira Integration
- Uses server-side API calls with proper authentication
- Implements caching and request optimization
- Handles both Jira Cloud API responses with type validation
- Sprint data includes epic information and release notes

### AI Content Generation
- OpenAI integration for sprint summaries and demo story descriptions
- Batch processing for multiple summaries
- Structured prompts for consistent output format

### Corporate Branding
- Command Alkon logo integration with proper positioning
- Default corporate slides with customizable templates
- Brand color scheme defined in Tailwind config

### Performance Optimizations
- Export caching system to prevent redundant processing
- Progressive rendering for large presentations
- Image optimization with configurable quality settings
- Request timeout and concurrency limits for Jira API

## Development Workflow

### Planning and Task Management
Based on Cursor rules in `.cursor/rules/`:
1. **Understand and propose a plan** - Research codebase and draft implementation plan
2. **Accept adjustments** - Revise plan based on feedback
3. **Generate task list** - Create actionable tasks with specific file paths

### Code Conventions
- TypeScript with strict typing throughout
- Tailwind CSS for styling with custom design system
- shadcn/ui component patterns
- Server-side API calls for external integrations
- Error boundaries and proper error handling

### Configuration Notes
- Next.js config ignores TypeScript and ESLint build errors for CI/CD
- Images are unoptimized for compatibility
- Custom Tailwind theme includes Command Alkon brand colors

## File Structure Patterns

- **`app/`** - Next.js app router with API routes and pages
- **`components/`** - React components organized by feature
- **`lib/`** - Utility functions, API clients, and business logic
- **`hooks/`** - Custom React hooks
- **`public/`** - Static assets including company logos and corporate slides
- **`tasks/`** - Development task lists and implementation plans