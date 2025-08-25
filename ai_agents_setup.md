# AI Agent Team Setup for The Backroom Leeds Website

## 1. Claude Code Installation & Setup

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Authenticate with your API key
claude-code auth login

# Initialize project
mkdir backroom-leeds-website
cd backroom-leeds-website
claude-code init --template nextjs-typescript
```

## 2. Agent Configuration Files

### agents/research-agent.json
```json
{
  "name": "Research Agent",
  "model": "claude-opus-4-20241029",
  "role": "technical_researcher",
  "system_prompt": "You are a technical research specialist. Research official documentation for Next.js 15.5, Supabase, Stripe Payment Intents, and TypeScript. Always validate against the latest documentation and flag any deprecated patterns.",
  "tools": ["web_search", "documentation_fetch"],
  "output_format": "markdown",
  "working_directory": "./research"
}
```

### agents/architecture-agent.json
```json
{
  "name": "Architecture Agent", 
  "model": "claude-opus-4-20241029",
  "role": "system_architect",
  "system_prompt": "You are a system architect specializing in Next.js applications. Design scalable, maintainable architecture based on research findings. Focus on component hierarchy, data flow, database schema, and API structure.",
  "depends_on": ["research-agent"],
  "tools": ["diagram_generator", "schema_validator"],
  "output_format": "structured_markdown",
  "working_directory": "./architecture"
}
```

### agents/development-agent.json
```json
{
  "name": "Development Agent",
  "model": "claude-opus-4-20241029", 
  "role": "full_stack_developer",
  "system_prompt": "You are a senior full-stack developer. Implement code based on architectural specifications using Next.js 15.5, TypeScript, Tailwind CSS, and Supabase. Write clean, well-documented code with proper error handling and TypeScript types.",
  "depends_on": ["architecture-agent"],
  "tools": ["code_generator", "type_checker", "lint_runner"],
  "output_format": "code_files",
  "working_directory": "./src"
}
```

### agents/testing-agent.json
```json
{
  "name": "Testing Agent",
  "model": "claude-sonnet-4-20250514",
  "role": "qa_engineer", 
  "system_prompt": "You are a QA engineer. Create and execute comprehensive tests including unit tests (Jest), integration tests, and performance validation. Document all issues and provide fixes.",
  "depends_on": ["development-agent"],
  "tools": ["test_runner", "performance_analyzer"],
  "output_format": "test_reports",
  "working_directory": "./tests"
}
```

### agents/documentation-agent.json
```json
{
  "name": "Documentation Agent",
  "model": "claude-sonnet-4-20250514",
  "role": "technical_writer",
  "system_prompt": "You are a technical documentation specialist. Maintain comprehensive project documentation, update progress tracking, and create deployment guides. Focus on clarity and completeness.",
  "depends_on": ["all"],
  "tools": ["markdown_generator", "progress_tracker"],
  "output_format": "documentation",
  "working_directory": "./docs"
}
```

## 3. Agent Orchestration Workflow

### main-workflow.yml
```yaml
name: Backroom Leeds Website Development
agents:
  - research-agent
  - architecture-agent  
  - development-agent
  - testing-agent
  - documentation-agent

workflow:
  phases:
    - name: "Research Phase"
      agents: [research-agent]
      tasks:
        - research_nextjs_15_5
        - research_supabase_auth
        - research_stripe_payments
        - research_mobile_optimization
      
    - name: "Architecture Phase" 
      agents: [architecture-agent]
      depends_on: [research-agent]
      tasks:
        - design_component_hierarchy
        - create_database_schema
        - design_api_structure
        - plan_authentication_flow
        
    - name: "Development Phase"
      agents: [development-agent]
      depends_on: [architecture-agent]
      tasks:
        - setup_project_structure
        - implement_booking_system
        - create_admin_dashboard
        - integrate_payment_processing
        
    - name: "Testing Phase"
      agents: [testing-agent]
      depends_on: [development-agent]
      tasks:
        - create_unit_tests
        - run_integration_tests
        - validate_performance
        - security_testing
        
    - name: "Documentation Phase"
      agents: [documentation-agent]
      depends_on: [testing-agent]
      tasks:
        - update_project_docs
        - create_deployment_guide
        - generate_api_documentation
```

## 4. Running the Agent Team

### Start Research Phase
```bash
# Initialize research tasks
claude-code run --agent research-agent --task "research_nextjs_15_5"
claude-code run --agent research-agent --task "research_supabase_auth" 
claude-code run --agent research-agent --task "research_stripe_payments"

# Research outputs will be saved to ./research/
```

### Execute Architecture Phase
```bash
# Run architecture design
claude-code run --agent architecture-agent --task "design_component_hierarchy"
claude-code run --agent architecture-agent --task "create_database_schema"

# Architecture files saved to ./architecture/
```

### Development Phase Execution
```bash
# Generate project structure
claude-code run --agent development-agent --task "setup_project_structure"

# Implement core features
claude-code run --agent development-agent --task "implement_booking_system" 
claude-code run --agent development-agent --task "create_admin_dashboard"

# Code files saved to ./src/
```

### Testing & Validation
```bash
# Run comprehensive testing
claude-code run --agent testing-agent --task "create_unit_tests"
claude-code run --agent testing-agent --task "run_integration_tests"

# Test reports saved to ./tests/
```

### Documentation Generation
```bash
# Generate final documentation
claude-code run --agent documentation-agent --task "update_project_docs"
claude-code run --agent documentation-agent --task "create_deployment_guide"

# Documentation saved to ./docs/
```

## 5. Agent Communication & State Management

### shared-state.json
```json
{
  "project_context": {
    "name": "The Backroom Leeds Website",
    "tech_stack": ["Next.js 15.5", "Supabase", "Stripe", "TypeScript"],
    "requirements": "./requirements/backroom-requirements.md"
  },
  "research_findings": {},
  "architecture_decisions": {},
  "development_progress": {},
  "test_results": {},
  "documentation_status": {}
}
```

## 6. Quality Gates & Checkpoints

### After Each Phase
```bash
# Validate research completeness
claude-code validate --phase research --criteria completeness

# Verify architecture decisions  
claude-code validate --phase architecture --criteria scalability

# Check code quality
claude-code validate --phase development --criteria quality

# Confirm test coverage
claude-code validate --phase testing --criteria coverage
```

## 7. Benefits of This Approach

1. **Specialized Expertise**: Each agent focuses on their core competency
2. **Quality Assurance**: Built-in validation at each phase
3. **Documentation**: Automatic documentation generation
4. **Consistency**: Standardized patterns across the codebase
5. **Efficiency**: Parallel processing where possible
6. **Maintainability**: Well-structured, documented code

## 8. Cost Optimization

- **Opus 4 for Complex Tasks**: Research, Architecture, Development
- **Sonnet 4 for Routine Tasks**: Testing, Documentation  
- **Estimated Cost**: ~$50-100 for full project (vs $500+ manual development time)
- **Time Savings**: 60-80% reduction in development time

## 9. Monitoring & Progress Tracking

```bash
# Check overall progress
claude-code status --project backroom-leeds

# View agent activity
claude-code logs --agent development-agent --last 24h

# Generate progress report
claude-code report --format pdf --output ./progress-report.pdf
```
