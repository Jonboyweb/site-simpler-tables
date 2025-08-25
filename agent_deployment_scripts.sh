#!/bin/bash
# setup-agents.sh - Initialize The Backroom Leeds AI Agent Team

echo "🎭 Setting up The Backroom Leeds AI Agent Team..."

# Create project structure
mkdir -p backroom-leeds-website/{agents,research,architecture,src,tests,docs}
cd backroom-leeds-website

# Initialize Claude Code project
echo "📦 Initializing Claude Code project..."
claude-code init --template nextjs-typescript --name "backroom-leeds-website"

# Copy agent configuration files to agents directory
echo "🤖 Setting up agent configurations..."

# Research Agent Setup
claude-code agent create \
  --name "backroom-research-agent" \
  --model "claude-sonnet-4-20250514" \
  --config "./agents/research-agent.json" \
  --working-dir "./research" \
  --enable-beta-features \
  --context-window 1000000

# Architecture Agent Setup  
claude-code agent create \
  --name "backroom-architecture-agent" \
  --model "claude-opus-4-1-20250805" \
  --config "./agents/architecture-agent.json" \
  --working-dir "./architecture" \
  --depends-on "backroom-research-agent" \
  --extended-reasoning

# Development Agent Setup
claude-code agent create \
  --name "backroom-development-agent" \
  --model "claude-sonnet-4-20250514" \
  --config "./agents/development-agent.json" \
  --working-dir "./src" \
  --depends-on "backroom-architecture-agent" \
  --enable-beta-features \
  --context-window 1000000

# Testing Agent Setup
claude-code agent create \
  --name "backroom-testing-agent" \
  --model "claude-3-5-haiku-20241022" \
  --config "./agents/testing-agent.json" \
  --working-dir "./tests" \
  --depends-on "backroom-development-agent" \
  --high-volume-mode

# Documentation Agent Setup
claude-code agent create \
  --name "backroom-documentation-agent" \
  --model "claude-3-5-haiku-20241022" \
  --config "./agents/documentation-agent.json" \
  --working-dir "./docs" \
  --depends-on "backroom-development-agent,backroom-testing-agent" \
  --fast-generation

echo "✅ Agent team setup complete!"

# Create workflow orchestration
claude-code workflow create \
  --config "./workflow-config.json" \
  --name "backroom-development-workflow"

echo "🔄 Workflow created successfully!"

echo "🚀 Ready to start development!"
echo "   Run: './run-phase-1.sh' to begin Research Phase"

# run-phase-1.sh - Research Phase
#!/bin/bash
echo "🔍 Starting Research Phase for The Backroom Leeds..."

# Research Phase Tasks
echo "📚 Researching Next.js 15.5 features..."
claude-code run \
  --agent backroom-research-agent \
  --task "research_nextjs_15_5_features" \
  --context "Focus on App Router, Server Components, and API Routes for nightclub booking system"

echo "📊 Researching Supabase real-time capabilities..."
claude-code run \
  --agent backroom-research-agent \
  --task "research_supabase_realtime_bookings" \
  --context "Real-time table availability, Row Level Security, and 2FA authentication"

echo "💳 Researching Stripe Payment Intents..."
claude-code run \
  --agent backroom-research-agent \
  --task "research_stripe_payment_intents" \
  --context "£50 deposits, PCI compliance, UK payment processing requirements"

echo "📱 Researching mobile optimization..."
claude-code run \
  --agent backroom-research-agent \
  --task "research_mobile_optimization" \
  --context "68% mobile traffic, Core Web Vitals, mobile-first booking flow"

echo "⚖️ Researching UK GDPR compliance..."
claude-code run \
  --agent backroom-research-agent \
  --task "research_uk_gdpr_compliance" \
  --context "Customer data handling, booking information, right to deletion"

echo "🎵 Researching nightclub booking patterns..."
claude-code run \
  --agent backroom-research-agent \
  --task "research_nightclub_booking_patterns" \
  --context "Table booking systems, event management, late-night operations"

# Validate research completeness
claude-code validate --phase research --agent backroom-research-agent

echo "✅ Research Phase complete!"
echo "   Research findings saved to ./research/"
echo "   Run: './run-phase-2.sh' to start Architecture Phase"

# run-phase-2.sh - Architecture Phase
#!/bin/bash
echo "🏗️ Starting Architecture Phase for The Backroom Leeds..."

# Architecture Phase Tasks
echo "📐 Designing booking system architecture..."
claude-code run \
  --agent backroom-architecture-agent \
  --task "design_booking_system_architecture" \
  --context "16 tables, real-time availability, concurrent booking prevention"

echo "🗄️ Creating database schema with RLS..."
claude-code run \
  --agent backroom-architecture-agent \
  --task "create_database_schema_with_rls" \
  --context "Tables, bookings, events, users, payments with row-level security"

echo "👥 Designing admin dashboard hierarchy..."
claude-code run \
  --agent backroom-architecture-agent \
  --task "design_admin_dashboard_hierarchy" \
  --context "Super Admin, Manager, Staff roles with specific permissions"

echo "💰 Planning payment processing flow..."
claude-code run \
  --agent backroom-architecture-agent \
  --task "plan_payment_processing_flow" \
  --context "£50 deposits, Stripe integration, refund handling, PCI compliance"

echo "⚡ Designing real-time availability system..."
claude-code run \
  --agent backroom-architecture-agent \
  --task "design_real_time_availability_system" \
  --context "WebSocket connections, optimistic locking, conflict resolution"

echo "🔒 Creating security architecture..."
claude-code run \
  --agent backroom-architecture-agent \
  --task "create_security_architecture" \
  --context "2FA, role-based access, API security, data encryption"

# Validate architecture decisions
claude-code validate --phase architecture --agent backroom-architecture-agent

echo "✅ Architecture Phase complete!"
echo "   Architecture documents saved to ./architecture/"
echo "   Run: './run-phase-3.sh' to start Development Phase"

# run-phase-3.sh - Development Phase
#!/bin/bash
echo "💻 Starting Development Phase for The Backroom Leeds..."

echo "🏗️ Setting up Next.js project structure..."
claude-code run \
  --agent backroom-development-agent \
  --task "setup_nextjs_project_structure" \
  --context "Next.js 15.5, TypeScript, Tailwind CSS, prohibition theme setup"

echo "🔐 Implementing Supabase auth with 2FA..."
claude-code run \
  --agent backroom-development-agent \
  --task "implement_supabase_auth_with_2fa" \
  --context "TOTP 2FA, role-based access, session management"

echo "📅 Creating table booking system..."
claude-code run \
  --agent backroom-development-agent \
  --task "create_table_booking_system" \
  --context "16 tables, real-time availability, mobile-optimized booking flow"

echo "💳 Implementing Stripe payment processing..."
claude-code run \
  --agent backroom-development-agent \
  --task "implement_stripe_payment_processing" \
  --context "£50 deposits, Payment Intents API, PCI compliance, webhooks"

echo "📊 Building admin dashboard..."
claude-code run \
  --agent backroom-development-agent \
  --task "build_admin_dashboard" \
  --context "Multi-tier access, booking management, revenue reporting"

echo "🎉 Creating event management system..."
claude-code run \
  --agent backroom-development-agent \
  --task "create_event_management_system" \
  --context "LA FIESTA, SHHH!, NOSTALGIA events, Fatsoma integration"

echo "🎭 Implementing prohibition theme design..."
claude-code run \
  --agent backroom-development-agent \
  --task "implement_prohibition_theme_design" \
  --context "Art Deco design, noir colors, gold accents, mobile-first responsive"

echo "📱 Optimizing mobile performance..."
claude-code run \
  --agent backroom-development-agent \
  --task "optimize_mobile_performance" \
  --context "Core Web Vitals >90, load time <2s, mobile booking UX"

# Validate development progress
claude-code validate --phase development --agent backroom-development-agent

echo "✅ Development Phase complete!"
echo "   Source code saved to ./src/"
echo "   Run: './run-phase-4.sh' to start Testing Phase"

# run-phase-4.sh - Testing Phase
#!/bin/bash
echo "🧪 Starting Testing Phase for The Backroom Leeds..."

echo "📋 Creating booking system tests..."
claude-code run \
  --agent backroom-testing-agent \
  --task "create_booking_system_tests" \
  --context "Unit tests, integration tests, concurrent booking scenarios"

echo "🔒 Testing payment processing security..."
claude-code run \
  --agent backroom-testing-agent \
  --task "test_payment_processing_security" \
  --context "Stripe test mode, PCI compliance validation, error handling"

echo "📱 Validating mobile performance..."
claude-code run \
  --agent backroom-testing-agent \
  --task "validate_mobile_performance" \
  --context "Lighthouse testing, Core Web Vitals, mobile usability"

echo "👥 Testing concurrent booking scenarios..."
claude-code run \
  --agent backroom-testing-agent \
  --task "test_concurrent_booking_scenarios" \
  --context "Multiple users booking same table, race conditions, data consistency"

echo "🛡️ Security penetration testing..."
claude-code run \
  --agent backroom-testing-agent \
  --task "security_penetration_testing" \
  --context "SQL injection, XSS, CSRF, authentication bypass attempts"

echo "♿ Accessibility compliance testing..."
claude-code run \
  --agent backroom-testing-agent \
  --task "accessibility_compliance_testing" \
  --context "WCAG 2.1 compliance, screen reader compatibility, keyboard navigation"

# Generate test reports
claude-code test-report --agent backroom-testing-agent --format pdf

echo "✅ Testing Phase complete!"
echo "   Test reports saved to ./tests/"
echo "   Run: './run-phase-5.sh' for Documentation Phase"

# run-phase-5.sh - Documentation Phase
#!/bin/bash
echo "📚 Starting Documentation Phase for The Backroom Leeds..."

echo "👤 Creating user documentation..."
claude-code run \
  --agent backroom-documentation-agent \
  --task "create_user_documentation" \
  --context "Customer booking guide, mobile-focused instructions, troubleshooting"

echo "👨‍💼 Writing admin training materials..."
claude-code run \
  --agent backroom-documentation-agent \
  --task "write_admin_training_materials" \
  --context "Dashboard usage, booking management, staff training procedures"

echo "🔌 Documenting API endpoints..."
claude-code run \
  --agent backroom-documentation-agent \
  --task "document_api_endpoints" \
  --context "REST API documentation, authentication, request/response examples"

echo "🚀 Creating deployment guide..."
claude-code run \
  --agent backroom-documentation-agent \
  --task "create_deployment_guide" \
  --context "Vercel deployment, environment variables, database setup"

echo "🔧 Writing maintenance procedures..."
claude-code run \
  --agent backroom-documentation-agent \
  --task "write_maintenance_procedures" \
  --context "Backup procedures, monitoring, troubleshooting, updates"

# Generate final project report
claude-code project-report --format pdf --output "./Backroom_Leeds_Project_Complete.pdf"

echo "✅ Documentation Phase complete!"
echo "   Documentation saved to ./docs/"
echo "🎉 The Backroom Leeds website development complete!"

# monitor-agents.sh - Monitoring and Progress Tracking
#!/bin/bash
echo "📊 The Backroom Leeds - Agent Monitoring Dashboard"

# Check overall project status
echo "🔍 Overall Project Status:"
claude-code status --project backroom-leeds-website

# Monitor individual agent progress
echo "📚 Research Agent Status:"
claude-code logs --agent backroom-research-agent --last 24h

echo "🏗️ Architecture Agent Status:"
claude-code logs --agent backroom-architecture-agent --last 24h

echo "💻 Development Agent Status:"
claude-code logs --agent backroom-development-agent --last 24h

echo "🧪 Testing Agent Status:"
claude-code logs --agent backroom-testing-agent --last 24h

echo "📚 Documentation Agent Status:"
claude-code logs --agent backroom-documentation-agent --last 24h

# Generate progress report
claude-code report --format markdown --output "./progress-report.md"

echo "📈 Progress report generated: ./progress-report.md"

# Quality gate validation
echo "✅ Running quality gates..."
claude-code validate --all-phases --project backroom-leeds-website

echo "📊 Monitoring complete!"
