#!/bin/bash
# setup-agents.sh - Initialize The Backroom Leeds AI Agent Team

echo "🎭 Setting up The Backroom Leeds AI Agent Team..."
echo "================================================"

# Check if we're in the right directory
if [ ! -d "backroom-leeds-website" ]; then
    echo "❌ Error: backroom-leeds-website directory not found!"
    echo "   Please ensure you're in the site-simpler-tables directory"
    exit 1
fi

# Create project structure
echo "📦 Creating project structure..."
mkdir -p backroom-leeds-website/{research,architecture,src,tests,docs}

# Copy agent configurations to the project
echo "🤖 Setting up agent configurations..."
if [ ! -d "backroom-leeds-website/agents" ]; then
    cp -r agents backroom-leeds-website/
    echo "   ✓ Agent configurations copied"
else
    echo "   ✓ Agent configurations already exist"
fi

# Make all scripts executable
echo "🔧 Making scripts executable..."
chmod +x agents/*.sh
echo "   ✓ All scripts are now executable"

# Display agent team information
echo ""
echo "📋 Agent Team Configuration:"
echo "----------------------------"
echo "1. Research Agent (Claude Sonnet 4)"
echo "   - 1M token context window"
echo "   - Focus: Technical documentation research"
echo ""
echo "2. Architecture Agent (Claude Opus 4.1)"
echo "   - 200K context, extended reasoning"
echo "   - Focus: System architecture design"
echo ""
echo "3. Development Agent (Claude Sonnet 4)"
echo "   - 1M token context, 64K output"
echo "   - Focus: Full-stack implementation"
echo ""
echo "4. Testing Agent (Claude Haiku 3.5)"
echo "   - Optimized for speed"
echo "   - Focus: Comprehensive testing"
echo ""
echo "5. Documentation Agent (Claude Haiku 3.5)"
echo "   - Fast generation"
echo "   - Focus: Technical documentation"
echo ""

echo "✅ Agent team setup complete!"
echo ""
echo "🚀 Ready to start development!"
echo "================================"
echo ""
echo "Available commands:"
echo "  ./agents/run-phase-1.sh  - Start Research Phase"
echo "  ./agents/run-phase-2.sh  - Start Architecture Phase"
echo "  ./agents/run-phase-3.sh  - Start Development Phase"
echo "  ./agents/run-phase-4.sh  - Start Testing Phase"
echo "  ./agents/run-phase-5.sh  - Start Documentation Phase"
echo "  ./agents/monitor-agents.sh - Monitor agent progress"
echo ""
echo "Run './agents/run-phase-1.sh' to begin the Research Phase"