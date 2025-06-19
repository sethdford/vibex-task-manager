# Vibex Task Manager

An AI-powered task management system designed for modern development workflows. Vibex Task Manager uses AWS Bedrock exclusively to provide intelligent task generation, complexity analysis, and multi-agent coordination capabilities.

## ✨ Key Features

- **🎯 Zero-Configuration AWS Integration**: Automatic model detection and setup
- **🤖 AI-Powered Task Management**: Generate and manage tasks with Claude models
- **🔬 SPARC Methodology**: A structured, AI-assisted workflow for complex problem-solving (**S**pecification, **P**seudocode, **A**rchitecture, **R**efinement, **C**ompletion).
- **🔗 MCP Integration**: Seamless integration with AI-powered editors (Cursor, Claude Code, VS Code)
- **📊 Intelligent Analysis**: Automatic task complexity assessment and recommendations
- **🤝 Multi-Agent Coordination**: Enable multiple AI agents to work together effectively
- **🔒 Enterprise Security**: AWS-grade security and compliance
- **💰 Cost Optimization**: Pay-per-use AWS Bedrock pricing

## 🚀 Quick Start

### 1. Install Vibex Task Manager

Choose your preferred installation method:

#### MCP Integration (Recommended for AI Editors)
Add to your `.cursor/mcp.json` or equivalent:

```json
{
  "mcpServers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["-y", "--package=vibex-task-manager", "vibex-task-manager"],
      "env": {
        "AWS_PROFILE": "your-aws-profile",
        "AWS_DEFAULT_REGION": "us-east-1"
      }
    }
  }
}
```

#### Global CLI Installation
```bash
npm install -g vibex-task-manager
```

#### Project Dependency
```bash
npm install vibex-task-manager
```

### 2. Configure AWS Bedrock

Ensure you have AWS credentials configured and Bedrock access enabled:

```bash
# Configure AWS credentials (if not already done)
aws configure

# Test AWS Bedrock connection and auto-detect models
vibex-task-manager config detect
```

### 3. Initialize Your Project

```bash
# Navigate to your project directory
cd your-project

# Initialize Vibex Task Manager with auto-detection
vibex-task-manager init

# Or initialize with custom settings
vibex-task-manager init --name "My Project" --description "Project description"
```

### 4. Start Managing Tasks

```bash
# Parse a PRD document into tasks
vibex-task-manager parse-prd requirements.md

# List all tasks
vibex-task-manager list

# Get the next recommended task
vibex-task-manager next

# Update a task with AI assistance
vibex-task-manager update-task --id 5 --prompt "Add authentication features"

# Set task status
vibex-task-manager set-status --id 5 --status done
```

## 📚 Documentation

### 🎯 **Getting Started**
- **[Installation Guide](docs/getting-started/installation.md)** - Complete installation instructions
- **[AWS Setup Guide](docs/getting-started/aws-setup.md)** - AWS Bedrock configuration
- **[Tutorial](docs/getting-started/tutorial.md)** - Step-by-step walkthrough
- **[Auto-Detection](docs/getting-started/auto-detection.md)** - Automatic AWS model discovery

### 🛠️ **Usage Guides**
- **[CLI Reference](docs/usage/cli-reference.md)** - Complete command documentation
- **[Configuration](docs/usage/configuration.md)** - Project and global settings
- **[Task Structure](docs/usage/task-structure.md)** - Understanding tasks and dependencies
- **[Examples](docs/usage/examples.md)** - Real-world usage patterns

### 🔗 **Integration**
- **[MCP Tools](docs/integration/mcp-tools.md)** - Model Context Protocol integration
- **[Platform Integrations](docs/integration/platform-integrations.md)** - Editor and IDE setup
- **[Integration Examples](docs/integration/integration-examples.md)** - Practical scenarios

### 📖 **Reference**
- **[API Reference](docs/reference/api-reference.md)** - Programming interfaces
- **[TypeScript API](docs/reference/typescript-api.md)** - TypeScript definitions
- **[Troubleshooting](docs/reference/troubleshooting.md)** - Common issues and solutions
- **[Migration Guide](docs/reference/migration-guide.md)** - Migrating from other tools

### ⚡ **Advanced**
- **[SPARC Methodology](docs/advanced/sparc-methodology.md)** - A structured workflow for complex tasks
- **[Agent Coordination](docs/advanced/coordination.md)** - Multi-agent collaboration
- **[Memory System](docs/advanced/memory-system.md)** - Context preservation and learning

## �� Common Use Cases

### Individual Developers
```bash
# Break down a large feature into manageable tasks
vibex-task-manager parse-prd feature-spec.md --num-tasks 15

# Get AI assistance for complex tasks
vibex-task-manager expand --id 5 --research --prompt "Focus on security aspects"

# Track progress and get recommendations
vibex-task-manager next
vibex-task-manager analyze --research
```

### AI Agent Teams
```bash
# Agent A: Claim and start working on a task
vibex-task-manager set-status --id 5 --status in-progress
vibex-task-manager update-task --id 5 --prompt "Implementing OAuth2 integration"

# Agent B: Find available work
vibex-task-manager next  # Gets next available task based on dependencies

# Agent C: Review and coordinate
vibex-task-manager list --status review
vibex-task-manager research --query "OAuth2 security best practices" --save-to 5.2
```

### Development Teams
```bash
# Project manager: Set up project structure
vibex-task-manager init --name "E-commerce Platform"
vibex-task-manager parse-prd requirements.md --research

# Developer: Work on assigned tasks
vibex-task-manager show 5  # Get detailed task information
vibex-task-manager update-task --id 5 --append --prompt "Progress update: API endpoints completed"

# Reviewer: Quality assurance workflow
vibex-task-manager set-status --id 5 --status review
vibex-task-manager update-task --id 5 --append --prompt "Code review complete, ready for deployment"
```

### Complex Problem-Solving with SPARC
```bash
# Enable SPARC for a complex task
vibex-task-manager sparc enable 7

# Generate requirements for the 'Specification' phase
vibex-task-manager sparc generate-requirements 7

# Advance to the 'Pseudocode' phase
vibex-task-manager sparc advance 7 pseudocode

# Generate pseudocode for the task
vibex-task-manager sparc generate-pseudocode 7

# ... continue through Architecture, Refinement, and Completion ...

# Validate the completed SPARC workflow
vibex-task-manager sparc validate 7
```

## 🚀 Why Vibex Task Manager?

### 🎯 **Zero-Configuration AI**
- Automatic AWS Bedrock model detection
- No API key management for multiple providers
- Intelligent model selection based on use case

### 🔒 **Enterprise-Ready**
- AWS-grade security and compliance
- Local data processing with cloud AI
- Granular access controls and audit trails

### 💰 **Cost-Effective**
- Pay-per-use AWS Bedrock pricing
- No subscription fees or monthly costs
- Transparent usage tracking

### 🤖 **AI-Agent Optimized**
- Built for multi-agent coordination
- Context preservation across sessions
- Intelligent conflict resolution

### 🌍 **Global Scale**
- AWS infrastructure worldwide
- Multi-region support
- High availability and performance

## 🛠️ Supported Environments

### Operating Systems
- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows (10/11)
- ✅ Linux (Ubuntu, Debian, CentOS, etc.)

### Node.js Versions
- ✅ Node.js 18.x (LTS)
- ✅ Node.js 20.x (LTS)
- ✅ Node.js 22.x (Current)

### AI Editors with MCP Support
- ✅ **Cursor** (recommended)
- ✅ **Claude Code**
- ✅ **VS Code** (with MCP extension)
- ✅ **Windsurf**
- ✅ Any MCP-compatible editor

### AWS Bedrock Models
- **Claude 3.5 Sonnet** - Latest and most capable
- **Claude 3 Opus** - Best for complex reasoning  
- **Claude 3 Sonnet** - Balanced performance
- **Claude 3 Haiku** - Fast and efficient

## 🔧 Configuration

### AWS Credentials
Configure AWS access using any of these methods:

```bash
# AWS CLI (recommended)
aws configure

# Environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_DEFAULT_REGION=us-east-1

# AWS Profile
export AWS_PROFILE=your-profile
```

### Project Configuration
Vibex Task Manager automatically creates a `.vibex/` directory with:

- **`config.json`** - Project settings and model configurations
- **`tasks/tasks.json`** - Task data and relationships
- **`docs/research/`** - AI research findings and cache
- **`reports/`** - Complexity analysis and metrics

## 📊 Example Workflows

### Project Initialization
```bash
# 1. Initialize with auto-detection
vibex-task-manager init

# 2. Parse requirements document
vibex-task-manager parse-prd requirements.md --num-tasks 20

# 3. Analyze and expand complex tasks
vibex-task-manager analyze --research
vibex-task-manager expand --all --force

# 4. Generate individual task files
vibex-task-manager generate
```

### Daily Development
```bash
# 1. Get next recommended task
vibex-task-manager next

# 2. Start working on task
vibex-task-manager set-status --id 5 --status in-progress

# 3. Get AI assistance as needed
vibex-task-manager research --query "React hooks best practices" --save-to 5.2
vibex-task-manager update-task --id 5 --prompt "Implemented custom hooks for state management"

# 4. Complete and move to next
vibex-task-manager set-status --id 5 --status done
vibex-task-manager next
```

### Team Coordination
```bash
# 1. Check team progress
vibex-task-manager list --format table

# 2. Review tasks needing attention
vibex-task-manager list --status review

# 3. Coordinate dependencies
vibex-task-manager validate-dependencies
vibex-task-manager add-dependency --id 7 --depends-on 5

# 4. Share research findings
vibex-task-manager research --query "API security checklist" --save-to-file
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/sethdford/vibex-task-manager.git
cd vibex-task-manager

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Link for local development
npm link
```

## 📄 License

This project is licensed under an extremely permissive MIT License that explicitly allows commercial use, repackaging, and selling. See the [LICENSE](LICENSE) file for details.

### Commercial Use Explicitly Permitted
- ✅ Use in commercial products
- ✅ Sell and redistribute
- ✅ Repackage and rebrand
- ✅ Integrate into proprietary software
- ✅ No attribution required in end products

## 🆘 Support

### Documentation
- **[Complete Documentation](docs/README.md)** - Comprehensive guides and references
- **[Troubleshooting Guide](docs/reference/troubleshooting.md)** - Common issues and solutions
- **[FAQ](docs/reference/troubleshooting.md#frequently-asked-questions)** - Frequently asked questions

### Community Support
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - Community Q&A and best practices
- **Examples** - Real-world usage patterns and workflows

### Enterprise Support
For enterprise deployments and custom integrations, contact us for professional support options.

## 🔄 Migration

### From task-master-ai
Migrating from the legacy `task-master-ai`? We've got you covered:

```bash
# Update MCP configuration
# Replace "task-master-ai" with "vibex-task-manager" in your MCP config

# Run migration command
vibex-task-manager migrate

# The migration will:
# - Convert old .taskmaster/ directories to .vibex/
# - Update configuration format
# - Preserve all task data and relationships
# - Migrate to AWS Bedrock models
```

See the [Migration Guide](docs/reference/migration-guide.md) for detailed instructions.

## 🚀 What's Next?

1. **[Install Vibex Task Manager](docs/getting-started/installation.md)** using your preferred method
2. **[Set up AWS Bedrock](docs/getting-started/aws-setup.md)** for AI capabilities  
3. **[Follow the tutorial](docs/getting-started/tutorial.md)** to learn the basics
4. **[Explore examples](docs/usage/examples.md)** for your specific use case
5. **[Configure advanced features](docs/advanced/)** as needed

---

**Transform your project management with AI-powered task management.** Get started with Vibex Task Manager today!