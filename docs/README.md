# Vibex Task Manager Documentation

Welcome to the comprehensive documentation for Vibex Task Manager - an AI-powered task management system using AWS Bedrock exclusively.

## 🚀 Quick Start

New to Vibex Task Manager? Start here:

1. **[Installation Guide](getting-started/installation.md)** - Get up and running quickly
2. **[AWS Setup Guide](getting-started/aws-setup.md)** - Configure AWS Bedrock integration
3. **[Tutorial](getting-started/tutorial.md)** - Step-by-step walkthrough
4. **[Auto-Detection](getting-started/auto-detection.md)** - Automatic AWS model detection

## 📚 Documentation Structure

### 🎯 Getting Started
Essential guides for new users:

- **[Installation Guide](getting-started/installation.md)** - All installation methods (MCP, CLI, npm)
- **[AWS Setup Guide](getting-started/aws-setup.md)** - AWS Bedrock configuration and troubleshooting
- **[Tutorial](getting-started/tutorial.md)** - Complete walkthrough with examples
- **[Auto-Detection](getting-started/auto-detection.md)** - Automatic AWS model discovery

### 🛠️ Usage Guides
Day-to-day usage and configuration:

- **[CLI Reference](usage/cli-reference.md)** - Complete command-line interface documentation
- **[Configuration Guide](usage/configuration.md)** - Project and global configuration options
- **[Task Structure](usage/task-structure.md)** - Understanding tasks, subtasks, and dependencies
- **[Examples](usage/examples.md)** - Real-world usage examples and workflows

### 🔗 Integration
Connect with your development environment:

- **[MCP Tools Reference](integration/mcp-tools.md)** - Model Context Protocol integration
- **[Platform Integrations](integration/platform-integrations.md)** - Editor and IDE integrations
- **[Integration Examples](integration/integration-examples.md)** - Practical integration scenarios

### 📖 Reference
Technical references and APIs:

- **[API Reference](reference/api-reference.md)** - Programming interfaces and APIs
- **[TypeScript API](reference/typescript-api.md)** - TypeScript definitions and usage
- **[Migration Guide](reference/migration-guide.md)** - Migrating from other task managers
- **[Troubleshooting](reference/troubleshooting.md)** - Common issues and solutions
- **[Licensing](reference/licensing.md)** - License information and compliance

### ⚡ Advanced Topics
Advanced features and customization:

- **[Agent Coordination](advanced/coordination.md)** - Multi-agent collaboration patterns
- **[Memory System](advanced/memory-system.md)** - Context preservation and pattern learning

## 🎯 Common Use Cases

### For Individual Developers
- **Project Planning**: Break down large projects into manageable tasks
- **Progress Tracking**: Monitor development progress with intelligent insights
- **Research Integration**: Store and reuse AI research findings
- **Dependency Management**: Handle complex task relationships

### For AI Agents
- **Coordination**: Work together on complex projects without conflicts
- **Context Sharing**: Maintain shared understanding across sessions
- **Pattern Learning**: Improve efficiency through experience
- **Research Collaboration**: Share and build upon research findings

### For Teams
- **Task Distribution**: Coordinate work across multiple agents/developers
- **Progress Visibility**: Track project status and bottlenecks
- **Knowledge Sharing**: Build and maintain project knowledge base
- **Quality Assurance**: Implement review workflows and quality gates

## 🚀 Key Features

### ✨ AI-Powered Task Management
- **Smart Task Generation**: Generate tasks from PRDs using Claude models
- **Intelligent Expansion**: Break down complex tasks into subtasks
- **Complexity Analysis**: Automatic task complexity assessment
- **Research Integration**: AI-powered research with context awareness

### 🔒 AWS Bedrock Integration
- **Zero Configuration**: Automatic model detection and setup
- **Enterprise Security**: AWS-grade security and compliance
- **Cost Optimization**: Pay-per-use pricing with AWS Bedrock
- **Global Scale**: AWS infrastructure worldwide

### 🤖 Multi-Agent Coordination
- **Conflict Prevention**: Intelligent task allocation and status management
- **Context Preservation**: Maintain project knowledge across sessions
- **Pattern Learning**: Improve efficiency through experience
- **Research Collaboration**: Share findings and insights

### 📊 Advanced Analytics
- **Progress Tracking**: Real-time project progress monitoring
- **Complexity Insights**: Task complexity trends and patterns
- **Performance Metrics**: Completion rates and efficiency analysis
- **Dependency Visualization**: Task relationship mapping

## 🛠️ Installation Options

### MCP Integration (Recommended)
Perfect for AI-powered editors like Cursor, Claude Code, and VS Code:

```json
{
  "mcpServers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["-y", "--package=vibex-task-manager", "vibex-task-manager"],
      "env": {
        "AWS_PROFILE": "your-profile",
        "AWS_DEFAULT_REGION": "us-east-1"
      }
    }
  }
}
```

### Global CLI Installation
For command-line usage:

```bash
npm install -g vibex-task-manager
vibex-task-manager --help
```

### Project Dependency
For project-specific usage:

```bash
npm install vibex-task-manager
npx vibex-task-manager init
```

## 🎯 Quick Commands

### Essential Commands
```bash
# Initialize new project
vibex-task-manager init

# Parse PRD into tasks
vibex-task-manager parse-prd requirements.md

# List all tasks
vibex-task-manager list

# Get next recommended task
vibex-task-manager next

# Update task status
vibex-task-manager set-status --id 5 --status done
```

### AI-Powered Commands
```bash
# Expand task into subtasks
vibex-task-manager expand --id 5 --research

# Update task with AI assistance
vibex-task-manager update-task --id 3 --prompt "Add security features"

# Perform AI research
vibex-task-manager research --query "API security best practices"

# Analyze task complexity
vibex-task-manager analyze --research
```

## 🔧 Configuration

### AWS Setup
1. **Configure AWS credentials** (AWS CLI, environment variables, or IAM roles)
2. **Enable Bedrock access** in AWS Console
3. **Request model access** for Claude models
4. **Test connection** with `vibex-task-manager config detect`

### Project Configuration
- **Auto-detection**: Automatic AWS model discovery
- **Custom models**: Set specific Claude models for different use cases
- **Research settings**: Configure AI research capabilities
- **Memory settings**: Customize context preservation

## 🆘 Getting Help

### Documentation
- **[Troubleshooting Guide](reference/troubleshooting.md)** - Common issues and solutions
- **[FAQ](reference/troubleshooting.md#frequently-asked-questions)** - Frequently asked questions
- **[Migration Guide](reference/migration-guide.md)** - Migrating from other tools

### Support Channels
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and references
- **Examples**: Real-world usage patterns and workflows

### Community
- **Best Practices**: Learn from community experiences
- **Integration Examples**: See how others use Vibex Task Manager
- **Agent Coordination**: Multi-agent collaboration patterns

## 🚀 What's Next?

1. **[Install Vibex Task Manager](getting-started/installation.md)** using your preferred method
2. **[Set up AWS Bedrock](getting-started/aws-setup.md)** for AI capabilities
3. **[Follow the tutorial](getting-started/tutorial.md)** to learn the basics
4. **[Explore examples](usage/examples.md)** for your specific use case
5. **[Configure advanced features](advanced/)** as needed

## 📋 Documentation Index

### By User Type

#### **New Users**
1. [Installation Guide](getting-started/installation.md)
2. [AWS Setup Guide](getting-started/aws-setup.md)
3. [Tutorial](getting-started/tutorial.md)
4. [Examples](usage/examples.md)

#### **Daily Users**
1. [CLI Reference](usage/cli-reference.md)
2. [Configuration Guide](usage/configuration.md)
3. [Task Structure](usage/task-structure.md)
4. [Troubleshooting](reference/troubleshooting.md)

#### **Advanced Users**
1. [Agent Coordination](advanced/coordination.md)
2. [Memory System](advanced/memory-system.md)
3. [API Reference](reference/api-reference.md)
4. [TypeScript API](reference/typescript-api.md)

#### **Integrators**
1. [MCP Tools Reference](integration/mcp-tools.md)
2. [Platform Integrations](integration/platform-integrations.md)
3. [Integration Examples](integration/integration-examples.md)
4. [API Reference](reference/api-reference.md)

### By Topic

#### **Setup & Configuration**
- [Installation Guide](getting-started/installation.md)
- [AWS Setup Guide](getting-started/aws-setup.md)
- [Configuration Guide](usage/configuration.md)
- [Auto-Detection](getting-started/auto-detection.md)

#### **Usage & Workflows**
- [Tutorial](getting-started/tutorial.md)
- [CLI Reference](usage/cli-reference.md)
- [Examples](usage/examples.md)
- [Task Structure](usage/task-structure.md)

#### **Integration & APIs**
- [MCP Tools Reference](integration/mcp-tools.md)
- [Platform Integrations](integration/platform-integrations.md)
- [API Reference](reference/api-reference.md)
- [TypeScript API](reference/typescript-api.md)

#### **Advanced Features**
- [Agent Coordination](advanced/coordination.md)
- [Memory System](advanced/memory-system.md)
- [Integration Examples](integration/integration-examples.md)

#### **Support & Reference**
- [Claude 4 Support](reference/claude-4-support.md)
- [Troubleshooting](reference/troubleshooting.md)
- [Migration Guide](reference/migration-guide.md)
- [Licensing](reference/licensing.md)

---

**Ready to get started?** Begin with the [Installation Guide](getting-started/installation.md) and transform your project management with AI-powered task management!
