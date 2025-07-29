# Sprint Review Generator v1.0.1

[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)](https://github.com/your-org/sprint-review-generator)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

> **Transform your sprint data into professional presentations with AI-powered insights**

The Sprint Review Generator is a comprehensive tool designed to streamline the creation of professional sprint review presentations. Built specifically for agile teams, this application transforms raw sprint data into polished, executive-ready presentations with AI-powered insights.

## 🚀 Features

### 📊 **Comprehensive Sprint Analysis**
- **Jira Integration**: Seamless connection to Jira for real-time sprint data
- **AI-Powered Summaries**: Intelligent generation of sprint overviews, demo story summaries, and upcoming sprint planning
- **Metrics Dashboard**: Complete sprint metrics including velocity, quality scores, and epic breakdowns
- **Demo Story Management**: Curated selection and presentation of key deliverables

### 🎯 **Professional Presentation Generation**
- **Multi-Format Export**: Advanced Digest (PDF), Executive Summary (HTML), Sprint Digest (PDF), and Markdown formats
- **Corporate Branding**: Command Alkon logo integration with professional slide layouts
- **Custom Slide Support**: Upload and integrate custom slides, quarterly plans, and corporate templates
- **Live Presentation Mode**: Full-screen presentation with keyboard navigation and auto-play

### 🔧 **Advanced Export System**
- **Audience-Specific Formats**: 
  - **Advanced Digest**: Technical audience (support, implementation, external customers)
  - **Executive Summary**: Executive stakeholders with copy-paste functionality for Smartsheet integration
  - **Sprint Digest**: General sprint overview with comprehensive metrics
  - **Markdown Export**: Developer-friendly documentation format
- **Quality Assurance**: Built-in export validation and optimization
- **Performance Monitoring**: Real-time export progress and error handling

## 🎯 Target Audiences

### **Primary Users**
- **Scrum Masters**: Sprint review facilitation and documentation
- **Product Managers**: Stakeholder communication and progress tracking
- **Development Teams**: Sprint retrospective and planning
- **Executives**: High-level performance insights and business impact

## 🛠️ Technology Stack

### **Frontend**
- **React 19**: Latest React with modern hooks and patterns
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first styling with custom design system
- **Radix UI**: Accessible, unstyled UI components

### **Backend**
- **Next.js 15**: Full-stack React framework with API routes
- **AI Integration**: OpenAI API for intelligent content generation
- **PDF Generation**: jsPDF for professional document creation
- **File Processing**: Advanced image and document handling

### **Integrations**
- **Jira Cloud**: Real-time sprint data integration
- **OpenAI API**: AI-powered content generation
- **Command Alkon**: Corporate branding and requirements

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Jira Cloud account with API access
- OpenAI API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/sprint-review-generator.git
   cd sprint-review-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
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

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Usage

### **First-Time Setup**

1. **Environment Configuration**: Set up Jira API credentials
2. **Project Selection**: Connect to your Jira project and board
3. **Sprint Loading**: Load current sprint data and issues
4. **AI Configuration**: Set up OpenAI API for summary generation
5. **Corporate Assets**: Upload company slides and templates

### **Workflow**

1. **Setup Tab**: Configure your project, board, and sprint
2. **Summaries Tab**: Generate AI-powered sprint summaries
3. **Metrics Tab**: Configure sprint metrics and quality standards
4. **Demo Stories Tab**: Select and curate demo stories
5. **Corporate Slides Tab**: Upload and manage company templates
6. **Presentation Tab**: Generate and export your presentation

### **Export Options**

- **Advanced Digest**: Technical teams, support, implementation, external customers
- **Executive Summary**: C-level executives, stakeholders, board members
- **Sprint Digest**: General team members, project managers
- **Markdown**: Developers, technical documentation

## 📚 Documentation

- **[Release Notes](./RELEASE_NOTES.md)**: Comprehensive feature breakdown and setup instructions
- **[API Documentation](./API_REFACTORING.md)**: Technical integration guides
- **[Implementation Guides](./LOGO_IMPLEMENTATION.md)**: Logo integration and component documentation
- **[Changelog](./CHANGELOG.md)**: Version history and changes

## 🔧 Development

### **Project Structure**
```
sprint-review-generator/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── tabs/             # Tab components
│   ├── presentation/     # Presentation components
│   ├── export/           # Export components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   ├── jira-api.ts       # Jira integration
│   ├── export-service.ts # Export functionality
│   └── utils.ts          # Utility functions
├── public/               # Static assets
│   └── company-logos/    # Corporate branding
└── styles/               # Additional styles
```

### **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode

# Type checking
npm run type-check   # Run TypeScript compiler
```

### **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues & Limitations

### **Current Limitations**
- **Jira Cloud Only**: Currently supports Jira Cloud (Jira Server support planned)
- **Single Sprint**: Focuses on one sprint at a time
- **PDF Export**: Limited to specific formats and layouts
- **AI Dependencies**: Requires OpenAI API for full functionality

### **Performance Considerations**
- **Large Sprints**: May experience slower loading with 100+ issues
- **Image Processing**: Large corporate slides may impact export speed
- **AI Generation**: Summary generation depends on API response times

## 🔮 Roadmap

### **v1.1.0 Planned Features**
- **Multi-Sprint Analysis**: Compare and analyze multiple sprints
- **Enhanced AI Models**: More sophisticated content generation
- **Additional Export Formats**: PowerPoint, Google Slides integration
- **Advanced Analytics**: Trend analysis and predictive insights

### **v1.2.0 Planned Features**
- **Team Collaboration**: Multi-user support and sharing
- **Custom Templates**: User-defined slide templates
- **Integration APIs**: Webhook support and third-party integrations
- **Mobile App**: Native mobile application

### **v2.0.0 Long-term Vision**
- **Enterprise Features**: SSO, advanced permissions, audit trails
- **AI-Powered Insights**: Predictive analytics and recommendations
- **Real-time Collaboration**: Live editing and commenting
- **Advanced Customization**: Full design system customization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### **Development Team**
- **Product Management**: Strategic vision and user research
- **Engineering**: Full-stack development and architecture
- **Design**: User experience and visual design
- **QA**: Testing and quality assurance

### **Open Source Contributors**
- **Next.js Team**: Framework and tooling
- **Radix UI**: Accessible component library
- **Tailwind CSS**: Utility-first styling
- **jsPDF**: PDF generation capabilities

### **Partners & Integrations**
- **Atlassian**: Jira API and integration support
- **OpenAI**: AI content generation capabilities
- **Command Alkon**: Corporate branding and requirements

## 📞 Support

### **Support Resources**
- **GitHub Issues**: [Bug reports and feature requests](https://github.com/your-org/sprint-review-generator/issues)
- **Documentation**: [Complete user and developer guides](./docs)
- **Community Forum**: [User discussions and best practices](https://github.com/your-org/sprint-review-generator/discussions)
- **Email Support**: Direct support for enterprise customers

---

## 🎊 Release Celebration

This v1.0.1 release builds upon the solid foundation of v1.0.0 with significant performance improvements and stability enhancements. From initial concept to production-ready application, this tool has been designed to transform how agile teams communicate their progress and achievements.

**Thank you to all users, contributors, and stakeholders who have supported this project from the beginning. Your feedback, testing, and enthusiasm have been invaluable in creating a tool that truly serves the agile community.**

---

**Happy Sprint Reviewing! 🚀** 