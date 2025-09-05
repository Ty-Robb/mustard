# Argentic Monorepo Setup Guide

## Overview

This guide documents the transformation of the Mustard project into Argentic - a monorepo containing Pipit (a strategic discovery platform) and future Vici applications. Pipit will feature an AI consultant named "Ethan" who guides organizations through a comprehensive discovery process, generating living dashboards and strategic documents.

## Vision

### The Discovery Framework
![Discovery Process](discovery-framework.png)

The platform guides organizations through 6 strategic stages:
1. **VALUES** - Core values, competencies assessment
2. **VISION** - Vision statement, marketing alignment
3. **ASSESSMENT** - Business strategy, SWOT analysis, brand assessment
4. **OBJECTIVES** - Balanced scorecard, marketing strategy
5. **STRATEGY** - Market requirements, product planning, brand strategy
6. **MEASURE** - Marketing budget, KPIs, metrics dashboard

### Key Features
- **AI Consultant "Ethan"**: Conversational interface guiding through discovery
- **Living Dashboard**: Dynamic tracking of KPIs and strategic objectives
- **Content Generation**: AI-powered creation of marketing materials and documents
- **RAG per Organization**: Personalized context and memory for each client
- **Continuous Optimization**: Ongoing strategic advice and plan adjustments

## Project Structure

```
argentic/                    # Monorepo root
├── apps/
│   ├── pipit/              # Strategic discovery platform (from Mustard)
│   ├── admin/              # Admin dashboard (future)
│   └── ...                 # Other future Vici apps
├── packages/
│   ├── ui/                 # Shared UI components
│   ├── ai/                 # Shared AI services
│   ├── database/           # Shared database utilities
│   ├── auth/               # Shared authentication
│   ├── discovery/          # Discovery flow logic
│   ├── ethan/              # AI consultant persona
│   └── config/             # Shared configuration
├── turbo.json              # Turborepo configuration
├── package.json            # Root package.json
├── pnpm-workspace.yaml     # pnpm workspace config
└── README.md               # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm (install with `npm install -g pnpm`)
- Git
- GitHub account

### Step 1: Create Argentic Monorepo

```bash
# Create and navigate to project directory
mkdir argentic
cd argentic

# Initialize git
git init

# Initialize pnpm
pnpm init

# Create directory structure
mkdir -p apps/pipit packages/{ui,ai,database,auth,discovery,ethan,config}
```

### Step 2: Copy Mustard to Pipit

```bash
# Copy all Mustard files to apps/pipit (excluding .git)
cp -r /Users/nicola-janerobb/mustard/* apps/pipit/
cp -r /Users/nicola-janerobb/mustard/.[^.]* apps/pipit/ 2>/dev/null || true

# Remove .git folder if it exists
rm -rf apps/pipit/.git
```

### Step 3: Configure Monorepo

#### Root package.json
```json
{
  "name": "argentic",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "latest",
    "@types/node": "^20.19.11",
    "typescript": "^5"
  },
  "packageManager": "pnpm@8.15.0"
}
```

#### pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

#### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Step 4: Update Pipit Configuration

#### apps/pipit/package.json
Update the following fields:
```json
{
  "name": "@argentic/pipit",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 3000",
    "build": "next build --turbopack",
    "start": "next start -p 3000",
    "lint": "next lint"
  }
}
```

### Step 5: Install Dependencies

```bash
# From argentic root
pnpm install

# Install Turborepo
pnpm add -D turbo -w
```

### Step 6: Initialize Git Repository

```bash
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Argentic monorepo with Pipit platform"

# Create repository on GitHub named "argentic"
# Then add remote and push
git remote add origin https://github.com/YOUR_USERNAME/argentic.git
git branch -M main
git push -u origin main
```

## Transformation Plan

### Phase 1: Initial Setup (Week 1)
- [x] Fork Mustard into Argentic monorepo structure
- [ ] Remove Bible-specific features
- [ ] Update branding and naming
- [ ] Set up development environment

### Phase 2: Core Adaptations (Week 2-3)
- [ ] Transform LMS into Discovery Flow Manager
- [ ] Create Ethan AI consultant persona
- [ ] Implement organization-level data isolation
- [ ] Set up RAG infrastructure per organization

### Phase 3: Discovery Implementation (Week 4-5)
- [ ] Implement 6-stage discovery process
- [ ] Create stage-specific AI prompts
- [ ] Build progress tracking system
- [ ] Develop document generation templates

### Phase 4: Dashboard Development (Week 6-7)
- [ ] Transform discovery outputs into dashboard widgets
- [ ] Implement KPI tracking and monitoring
- [ ] Add real-time updates and alerts
- [ ] Create AI-powered insights engine

### Phase 5: Content Generation (Week 8)
- [ ] Build content generation templates
- [ ] Implement marketing material creation
- [ ] Add document export functionality
- [ ] Create content library system

### Phase 6: Polish & Launch (Week 9-10)
- [ ] User testing and feedback
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment setup

## Key Components to Adapt

### From Mustard → To Pipit

| Mustard Component | Pipit Adaptation | Purpose |
|-------------------|------------------|---------|
| Bible API | Business Data APIs | External data sources |
| Bible Chat | Ethan Consultant | AI-guided discovery |
| LMS System | Discovery Flow | Stage progression |
| Quiz System | Assessment Tools | Business evaluation |
| Reading Plans | Strategic Plans | Actionable roadmaps |
| Presentations | Business Documents | Deliverables |
| Activity Tracker | KPI Dashboard | Performance monitoring |
| Export System | Report Generation | Document creation |

### Components to Remove
- All Bible-specific components (`/components/bible/*`)
- Bible vectorization scripts
- Bible API integrations
- Religious content references

### Components to Add
- Organization management system
- Multi-tenant data isolation
- Business-focused AI prompts
- Strategic dashboard widgets
- Marketing content templates

## Environment Configuration

### Update .env.example
```env
# Database
MONGODB_URI=mongodb://localhost:27017/argentic

# Firebase (keep existing)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# AI Services
GEMINI_API_KEY=
VERTEX_AI_PROJECT_ID=
VERTEX_AI_LOCATION=

# Payments (keep existing)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Pipit
```

## Development Workflow

### Running the Development Server
```bash
# From argentic root
pnpm dev

# Or run specific app
cd apps/pipit && pnpm dev
```

### Building for Production
```bash
# From argentic root
pnpm build
```

### Adding Shared Packages
```bash
# Example: Creating shared UI package
cd packages/ui
pnpm init
# Add components from apps/pipit/components/ui
```

## Next Steps

1. **Immediate Actions**:
   - Set up the monorepo structure
   - Copy Mustard code to Pipit
   - Remove Bible-specific features
   - Update branding

2. **Short-term Goals**:
   - Define Ethan's personality and conversation style
   - Map discovery stages to chat flows
   - Create initial dashboard mockups

3. **Long-term Vision**:
   - Multiple apps in the monorepo
   - Shared component library
   - Unified design system
   - Scalable architecture

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Next.js App Router](https://nextjs.org/docs/app)
- Original Mustard Repository: https://github.com/Ty-Robb/mustard.git

## Support

For questions or issues during setup:
1. Check this documentation
2. Review the original Mustard codebase
3. Consult the framework documentation
4. Create issues in the Argentic repository

---

**Note**: This guide is a living document. Update it as the project evolves and new decisions are made.
