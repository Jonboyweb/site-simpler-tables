# The Backroom Leeds - AI Agent Team Configuration

## 🎭 Overview
This directory contains the AI agent configurations for developing The Backroom Leeds nightclub website. The agents work together in a coordinated workflow to research, design, develop, test, and document the complete web application.

## 🤖 Agent Team

### 1. Research Agent
- **Model**: Claude Sonnet 4 (1M token context)
- **Role**: Technical research specialist
- **Focus**: Documentation research, best practices, compliance requirements
- **Output**: Research findings in ./research/

### 2. Architecture Agent  
- **Model**: Claude Opus 4.1 (200K context, extended reasoning)
- **Role**: System architect
- **Focus**: Scalable architecture design, database schema, API structure
- **Output**: Architecture specifications in ./architecture/

### 3. Development Agent
- **Model**: Claude Sonnet 4 (1M context, 64K output)
- **Role**: Full-stack developer
- **Focus**: Implementation of booking system, admin dashboard, payment processing
- **Output**: Source code in ./src/

### 4. Testing Agent
- **Model**: Claude Haiku 3.5 (optimized for speed)
- **Role**: QA engineer
- **Focus**: Comprehensive testing suite, security validation, performance testing
- **Output**: Test suites and reports in ./tests/

### 5. Documentation Agent
- **Model**: Claude Haiku 3.5 (fast generation)
- **Role**: Technical writer
- **Focus**: User guides, API documentation, deployment guides
- **Output**: Documentation in ./docs/

## 🚀 Getting Started

### Setup
```bash
# Run the setup script to initialize the agent team
./setup-agents.sh
```

### Running Development Phases

Execute phases in order:

```bash
# Phase 1: Research & Discovery (2 days)
./run-phase-1.sh

# Phase 2: Architecture Design (2 days)
./run-phase-2.sh

# Phase 3: Core Development (6 days)
./run-phase-3.sh

# Phase 4: Testing & QA (2 days)
./run-phase-4.sh

# Phase 5: Documentation & Deployment (2 days)
./run-phase-5.sh
```

### Monitoring Progress
```bash
# Check agent status and progress
./monitor-agents.sh
```

## 📁 Directory Structure
```
agents/
├── research-agent.json        # Research agent configuration
├── architecture-agent.json    # Architecture agent configuration
├── development-agent.json     # Development agent configuration
├── testing-agent.json         # Testing agent configuration
├── documentation-agent.json   # Documentation agent configuration
├── workflow-config.json       # Workflow orchestration configuration
├── environment-config.json    # Environment variables configuration
├── setup-agents.sh           # Main setup script
├── run-phase-1.sh           # Research phase script
├── run-phase-2.sh           # Architecture phase script
├── run-phase-3.sh           # Development phase script
├── run-phase-4.sh           # Testing phase script
├── run-phase-5.sh           # Documentation phase script
├── monitor-agents.sh        # Monitoring dashboard script
└── README.md               # This file
```

## 🎯 Project Context

**The Backroom Leeds** - Prohibition-themed nightclub website
- **Location**: 50a Call Lane, Leeds LS1 6DT
- **Capacity**: 500 people
- **Tables**: 16 (10 upstairs, 6 downstairs)
- **Key Features**:
  - Real-time table booking system
  - Multi-tier admin dashboard
  - Payment processing (£50 deposits)
  - Event management
  - Mobile-first design (68% mobile traffic)

## 📊 Success Metrics
- **Performance**: Core Web Vitals >90, Load time <2s
- **Testing**: 95% code coverage
- **Security**: PCI compliance, UK GDPR compliance
- **Mobile**: Optimized for 68% mobile traffic

## 🔧 Environment Configuration
The `environment-config.json` file contains placeholder configurations for:
- Supabase (database & auth)
- Stripe (payment processing)
- SendGrid (email notifications)
- NextAuth (authentication)

Update these values with actual credentials before deployment.

## 📝 Notes
- Agents are configured to work sequentially with dependencies
- Each phase builds upon the previous phase's outputs
- Scripts are currently placeholders for actual agent commands
- Customize commands based on your actual AI/automation tools

## 🤝 Contributing
When modifying agent configurations:
1. Update the corresponding JSON configuration file
2. Test the changes with a single phase first
3. Document any new requirements or dependencies
4. Update this README with relevant changes