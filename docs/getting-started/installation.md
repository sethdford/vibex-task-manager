# Installation Guide

This guide covers all methods for installing and setting up Vibex Task Manager in your development environment.

## Overview

Vibex Task Manager is an AI-powered task management system that uses AWS Bedrock exclusively. It integrates seamlessly with MCP-compatible editors like Cursor AI, Claude Code, and VS Code.

## Prerequisites

Before installation, ensure you have:

- **Node.js** 18+ installed
- **AWS Account** with Bedrock access
- **MCP-compatible editor** (Cursor, Claude Code, VS Code, etc.)

## Installation Methods

### Method 1: MCP Integration (Recommended)

This method integrates Vibex Task Manager directly into your AI-powered editor.

#### For Cursor & Windsurf

Add to your `.cursor/mcp.json` file:

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

#### For VS Code

Add to your MCP configuration:

```json
{
  "servers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["-y", "--package=vibex-task-manager", "vibex-task-manager"],
      "env": {
        "AWS_PROFILE": "your-aws-profile", 
        "AWS_DEFAULT_REGION": "us-east-1"
      }
    }
  },
  "type": "mcp"
}
```

#### For Claude Code

Add to your Claude configuration:

```json
{
  "tools": {
    "vibex-task-manager": {
      "type": "mcp",
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

> 🔑 **Replace `your-aws-profile`** with your actual AWS profile name and set your preferred region.

### Method 2: Global CLI Installation

Install Vibex Task Manager globally for command-line usage:

```bash
# Install globally
npm install -g vibex-task-manager

# Verify installation
vibex-task-manager --version

# Get help
vibex-task-manager --help
```

### Method 3: Local Project Installation

Install as a project dependency:

```bash
# Install as dependency
npm install vibex-task-manager

# Install as dev dependency
npm install --save-dev vibex-task-manager

# Use via npx
npx vibex-task-manager --help
```

### Method 4: Direct from Source

For development or latest features:

```bash
# Clone repository
git clone https://github.com/sethdford/vibex-task-manager.git
cd vibex-task-manager

# Install dependencies
npm install

# Build project
npm run build

# Link globally (optional)
npm link
```

## Post-Installation Setup

### 1. Configure AWS Credentials

Choose your preferred method:

#### AWS CLI (Recommended)
```bash
# Install AWS CLI
# macOS: brew install awscli
# Windows: Download from AWS website
# Linux: sudo apt install awscli

# Configure credentials
aws configure
```

#### Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

#### AWS Profile
```bash
# Configure specific profile
aws configure --profile vibex-task-manager

# Use in environment
export AWS_PROFILE=vibex-task-manager
```

### 2. Enable AWS Bedrock Access

Follow the [AWS Setup Guide](aws-setup.md) to:

1. Enable Bedrock model access in AWS Console
2. Request access to Claude models
3. Verify model availability

### 3. Initialize Your First Project

#### Via MCP (in your editor's AI chat)
```
Initialize vibex-task-manager in my project
```

#### Via CLI
```bash
# Navigate to your project directory
cd your-project

# Initialize with auto-detection
vibex-task-manager init

# Initialize with custom name
vibex-task-manager init --name="My Project"
```

## Verification

### Test MCP Integration

In your editor's AI chat, try:
```
List available vibex-task-manager tools
```

### Test CLI Installation

```bash
# Check version
vibex-task-manager --version

# Test AWS connection
vibex-task-manager config detect

# Get help
vibex-task-manager --help
```

### Test AWS Integration

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Test auto-detection
vibex-task-manager config detect
```

## Supported Environments

### Operating Systems
- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Windows** (10/11)
- ✅ **Linux** (Ubuntu, Debian, CentOS, etc.)

### Node.js Versions
- ✅ **Node.js 18.x** (LTS)
- ✅ **Node.js 20.x** (LTS)
- ✅ **Node.js 22.x** (Current)

### Editors with MCP Support
- ✅ **Cursor** (recommended)
- ✅ **Claude Code**
- ✅ **VS Code** (with MCP extension)
- ✅ **Windsurf**
- ✅ **Any MCP-compatible editor**

## AWS Bedrock Models

### Supported Models
- **Claude 3.5 Sonnet** - Latest and most capable
- **Claude 3 Opus** - Best for complex reasoning
- **Claude 3 Sonnet** - Balanced performance
- **Claude 3 Haiku** - Fast and efficient
- **Amazon Titan Text** - AWS native models

### Recommended Regions
1. **us-east-1** (N. Virginia) - Most models available
2. **us-west-2** (Oregon) - Good alternative
3. **eu-west-1** (Ireland) - European users
4. **ap-southeast-2** (Sydney) - Asia-Pacific users

## Troubleshooting

### Common Installation Issues

#### NPM Permission Errors
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm

# Or use nvm for Node.js management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

#### MCP Configuration Issues
- Ensure JSON syntax is valid
- Check file paths are correct
- Verify environment variables are set
- Restart your editor after configuration changes

#### AWS Credential Issues
```bash
# Check AWS configuration
aws configure list

# Test credentials
aws sts get-caller-identity

# Check environment variables
echo $AWS_PROFILE
echo $AWS_DEFAULT_REGION
```

### Getting Help

If you encounter issues:

1. **Check the logs**: Enable debug mode with `--debug` flag
2. **Verify AWS setup**: Follow the [AWS Setup Guide](aws-setup.md)
3. **Test step-by-step**: Use the verification commands above
4. **Check documentation**: See [Troubleshooting Guide](../troubleshooting.md)

## Migration from task-master-ai

If you're migrating from the old `task-master-ai`:

### 1. Update MCP Configuration
Replace `task-master-ai` with `vibex-task-manager` in your MCP config.

### 2. Replace API Keys
- Remove old API keys (OpenAI, Anthropic, etc.)
- Add AWS credentials instead

### 3. Run Migration Command
```bash
vibex-task-manager migrate
```

### 4. Update Project Structure
The migration command will update your project to use the new structure.

## Next Steps

Once installation is complete:

1. **Follow the tutorial**: [Getting Started Tutorial](tutorial.md)
2. **Configure AWS**: [AWS Setup Guide](aws-setup.md)
3. **Learn the CLI**: [CLI Reference](../usage/cli-reference.md)
4. **See examples**: [Usage Examples](../usage/examples.md)

## Benefits of Vibex Task Manager

- 🎯 **Zero-Configuration**: Auto-detects AWS models
- 🔒 **Enterprise Security**: AWS-grade security and compliance
- 💰 **Cost Optimization**: Pay-per-use AWS Bedrock pricing
- 🌍 **Global Scale**: AWS infrastructure worldwide
- 🚀 **Latest Models**: Access to Claude 3.5 Sonnet and cutting-edge models
- 🔧 **Simplified Setup**: Single cloud provider, consistent configuration

---

**Need more help?** Check our [Configuration Guide](../usage/configuration.md) or [Troubleshooting Guide](../troubleshooting.md). 