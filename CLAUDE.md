# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- No test framework is currently configured - tests will need to be set up
- Database integration with Supabase is planned but not yet implemented
- Payment processing with Stripe is specified but not yet integrated
- The current implementation focuses on the frontend presentation layer