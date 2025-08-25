# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Implementation Guide Compliance

**MANDATORY**: All development work MUST follow the detailed implementation guide:
- **Primary Reference**: `/backroom-implementation-guide.md` 
- **Status**: This is the AUTHORITATIVE development process document
- **Requirement**: ALWAYS consult this guide BEFORE any implementation work
- **Compliance**: Every step must match the guide's exact specifications

### Implementation Guide Enforcement:
1. **Research Requirements**: All code patterns must reference official documentation per the guide
2. **Testing Requirements**: Minimum 80% test coverage with specific test types outlined
3. **Documentation Requirements**: Specific file formats and locations are mandated
4. **Git Workflow**: Commit messages must follow the guide's specified format
5. **Agent Communication**: Inter-agent protocols are defined and must be followed

**NEVER deviate from the implementation guide without explicit approval.**

## Development Commands

### Core Development Workflow
```bash
# Navigate to the main project directory
cd backroom-leeds-website

# Development server
npm run dev          # Start Next.js development server on port 3000

# Build and production
npm run build        # Build production application
npm start           # Start production server
npm run lint         # Run ESLint for code quality

# Testing (currently not configured)
npm test            # No test framework configured yet
```

### Working Directory
The main codebase is located in `backroom-leeds-website/` - this is where all development work should be focused.

## Project Structure & Reference Materials

### Root Directory Organization
```
site-simpler-tables/
├── agents/                     # 🤖 AI agent configurations for specialized tasks
├── backroom-leeds-website/     # 🏗️ Main Next.js application
│   ├── research/              # 🔍 Market research & venue intelligence
│   └── [src, docs, tests...]  # Core application files
├── backroom-tech-spec.md      # 📋 Complete technical specifications
├── CLAUDE.md                  # 📝 This development guide
└── [other project files]
```

### Reference Materials for Development

#### 📋 Implementation Guide (`/backroom-implementation-guide.md`) - PRIMARY REFERENCE
**MOST IMPORTANT**: Comprehensive step-by-step implementation guide containing:
- **Phase Structure**: 5 detailed implementation phases with specific deliverables
- **Agent Responsibilities**: Clear role definitions and communication protocols
- **Documentation Requirements**: Exact file paths, formats, and content specifications
- **Testing Strategy**: Unit, integration, and E2E test requirements with coverage targets
- **Git Workflow**: Specific commit message formats and branching strategies
- **Error Handling Protocol**: Detailed procedures for documenting and resolving issues
- **Progress Tracking**: Daily standup formats and milestone tracking requirements

**CRITICAL**: This guide overrides any conflicting information in other documents.

#### 🤖 AI Agent Configurations (`/agents/`)
Specialized agent configurations for domain-specific development tasks:
- **Research Agent**: Official documentation research and validation
- **Architecture Agent**: System design and technical planning
- **Development Agent**: Code implementation with test creation
- **Testing Agent**: Test execution and validation
- **Documentation Agent**: Project documentation maintenance

**Usage**: Follow implementation guide agent protocols for task assignment and communication.

#### 🔍 Market Research & Intelligence (`/backroom-leeds-website/research/`)
Comprehensive venue and market intelligence for informed development decisions:
- **Market Analysis**: Leeds nightlife landscape, speakeasy trends, customer demographics
- **Competitive Intelligence**: Competitor analysis, pricing strategies, digital presence
- **Customer Insights**: Behavior patterns, booking preferences, user experience data
- **Technical Benchmarks**: Technology stack comparisons, performance metrics

**Usage**: Reference for feature requirements, UX decisions, and business logic implementation. Contains real market data to inform booking system design and venue operations.

#### 📋 Technical Specifications (`/backroom-tech-spec.md`)
Complete technical specification document containing:
- **Database Schema**: Table structures, relationships, constraints
- **API Endpoints**: RESTful API design with authentication flows
- **Payment Integration**: Stripe implementation details and webhook handling
- **Authentication**: 2FA implementation with role-based access control
- **Real-time Features**: WebSocket events and Supabase subscriptions

**Usage**: Primary reference for all technical implementation decisions. Contains exact specifications for booking system, admin dashboard, and venue management features.

#### 🎭 Venue-Specific Information
Located throughout the project structure, containing real venue data:
- **Table Configuration**: 16 tables across upstairs/downstairs with capacity constraints
- **Event Information**: Weekly events (LA FIESTA, SHHH!, NOSTALGIA) with DJ lineups
- **Drinks Packages**: Actual pricing and package configurations (£170-£580 range)
- **Venue Layout**: Floor plans and seating arrangements for booking system
- **Business Rules**: Real operating constraints (2-table limit, 48-hour cancellation policy)

**Usage**: Essential for accurate booking system logic, pricing calculations, and venue-specific user experience.

## High-Level Architecture

### Project Overview
This is **The Backroom Leeds** - a prohibition-themed nightclub website with integrated table booking system. The project implements a comprehensive venue management platform with real-time booking capabilities.

### Technology Stack
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS 4.1 with custom speakeasy theme
- **Backend**: Next.js API routes (planned integration with Supabase)
- **Database**: PostgreSQL via Supabase (planned)
- **Authentication**: NextAuth.js with 2FA (planned)
- **Payment Processing**: Stripe integration (planned)

### Core Architecture Pattern
```
src/
├── app/                    # Next.js 15 App Router
│   ├── globals.css        # Global styles with prohibition theme
│   ├── layout.tsx         # Root layout with font optimization
│   └── page.tsx           # Homepage with speakeasy design
├── components/            # React components (atomic design)
│   ├── ui/               # Base UI components (shadcn/ui style)
│   ├── molecules/        # Combined UI components
│   ├── organisms/        # Complex feature components
│   └── templates/        # Page layout templates
├── lib/                  # Utility libraries and API clients
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

### Design System
The project uses a **prohibition-era speakeasy theme** with:
- **Color Palette**: Speakeasy noir, burgundy, gold, copper, champagne
- **Typography**: Bebas Neue (headlines), Playfair Display (subheadings), Inter (body), Great Vibes (decorative)
- **Components**: Art Deco styling with vintage hover effects and geometric borders
- **Accessibility**: WCAG 2.1 AA compliance built into design system

### Key Features (Planned Implementation)
1. **Table Booking System**
   - Real-time availability checking
   - Multi-step booking flow with payments
   - QR code generation for check-ins
   - Waitlist management

2. **Admin Dashboard**
   - Role-based access (Super Admin, Manager, Door Staff)
   - Booking management with check-in system
   - Event management with image uploads
   - Automated reporting (daily/weekly)

3. **Event Management**
   - Weekly recurring events (LA FIESTA, SHHH!, NOSTALGIA)
   - Integration with Fatsoma ticketing
   - Artist/DJ profile management

### Configuration Files
- `tailwind.config.js` - Custom speakeasy color palette and design tokens
- `tsconfig.json` - TypeScript configuration with path mapping (`@/*` → `./src/*`)
- `next.config.js` - Basic Next.js configuration with App Router experimental flag
- `package.json` - Dependencies including Next.js 15, React 19, Tailwind CSS

### Development Patterns
- **Component Structure**: Atomic design methodology (atoms → molecules → organisms → templates)
- **Styling Approach**: Tailwind utility-first with custom CSS layers for Art Deco components
- **Type Safety**: Strict TypeScript with comprehensive type definitions
- **Performance**: Next.js optimization with font loading, image optimization planned

### Key Business Logic
- **Table Management**: 16 tables across upstairs/downstairs floors with capacity constraints
- **Booking Rules**: Max 2 tables per customer, 48-hour cancellation policy
- **Payment Flow**: £50 deposit system with remaining balance due on arrival
- **User Roles**: Three-tier admin system with granular permissions

## Important Notes

### 🚨 IMPLEMENTATION GUIDE COMPLIANCE - MANDATORY
- **PRIMARY REFERENCE**: `/backroom-implementation-guide.md` - ALWAYS consult FIRST before any work
- **Exact Specifications**: Follow the guide's precise documentation formats, file locations, and naming conventions
- **Testing Requirements**: Implement ALL testing levels specified (unit, integration, E2E) with minimum 80% coverage
- **Research Validation**: Every code pattern MUST reference official documentation sources
- **Agent Protocols**: Use specified inter-agent communication formats and workflows
- **Error Documentation**: Follow the guide's error handling and resolution protocols
- **Git Workflow**: Use exact commit message formats and progress tracking specified

### Development Context
- **Development Priority**: Main codebase is in `backroom-leeds-website/` directory
- **Technical Specifications**: Consult `backroom-tech-spec.md` for technical requirements (secondary to implementation guide)
- **Real Data Available**: Use venue-specific information and research data for authentic implementation
- **Current State**: Phase 1 (Research & Planning) completed - proceeding to Phase 2 (Project Setup & Configuration)

## 📋 Implementation Guide Workflow Reminders

### Before Any Development Task:
1. **ALWAYS** read the relevant section in `/backroom-implementation-guide.md` first
2. Follow the guide's exact specifications for file locations and formats
3. Use the specified agent communication protocols
4. Implement ALL required testing levels with specified coverage
5. Document using the guide's exact templates and formats

### Key Implementation Guide Requirements:
- **Documentation**: Create files in exact locations specified (e.g., `/docs/research/`, `/docs/architecture/`)
- **Testing**: Minimum 80% coverage with unit, integration, and E2E tests
- **Git Commits**: Use specific format with research sources and test results
- **Agent Communication**: Follow defined message formats and protocols
- **Error Handling**: Document all errors with resolution logs per the guide's protocol

**The implementation guide is the single source of truth for all development processes.**