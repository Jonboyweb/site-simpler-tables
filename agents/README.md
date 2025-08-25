# 🤖 Agent Configurations

This directory contains specialized agent configurations for the Backroom Leeds website project.

## Available Agents

### Frontend Specialists
- **UI/UX Agent**: Component development, responsive design, accessibility
- **Design System Agent**: Prohibition-era theming, Art Deco patterns, visual consistency

### Backend Specialists  
- **API Agent**: Server-side logic, data management, integrations
- **Performance Agent**: Optimization, caching, monitoring

### Quality Assurance
- **Testing Agent**: E2E testing, unit tests, quality validation
- **Security Agent**: Vulnerability scanning, compliance checks

### Content & Documentation
- **Content Agent**: Copy writing, SEO optimization, venue information
- **Documentation Agent**: Technical docs, deployment guides, maintenance

## Configuration Structure

Each agent configuration includes:
- **Persona**: Specialized AI personality and expertise
- **Tools**: Preferred tool combinations and workflows
- **Context**: Domain-specific knowledge and patterns
- **Quality Gates**: Validation checkpoints and standards

## Usage

Agent configurations are automatically activated based on:
- Task complexity and domain
- File patterns and project structure
- Explicit agent selection via flags

Example:
```bash
# Auto-activate frontend agents for UI work
claude /ui "Create booking form component"

# Explicit agent selection
claude --agent ui-specialist /implement "Add mobile navigation"
```