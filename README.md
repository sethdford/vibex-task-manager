# Vibex Task Manager [![GitHub stars](https://img.shields.io/github/stars/vibex/vibex-task-manager?style=social)](https://github.com/vibex/vibex-task-manager/stargazers)

[![CI](https://github.com/vibex/vibex-task-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/vibex/vibex-task-manager/actions/workflows/ci.yml) [![npm version](https://badge.fury.io/js/vibex-task-manager.svg)](https://badge.fury.io/js/vibex-task-manager) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[![NPM Downloads](https://img.shields.io/npm/d18m/vibex-task-manager?style=flat)](https://www.npmjs.com/package/vibex-task-manager) [![NPM Downloads](https://img.shields.io/npm/dm/vibex-task-manager?style=flat)](https://www.npmjs.com/package/vibex-task-manager) [![NPM Downloads](https://img.shields.io/npm/dw/vibex-task-manager?style=flat)](https://www.npmjs.com/package/vibex-task-manager)

## AI-Powered Task Management for Development Teams


A task management system for AI-driven development using AWS Bedrock, designed to work seamlessly with Cursor AI and other MCP-compatible editors.

## ⚡ What's New

**Vibex Task Manager** is the next evolution of task management for AI development, now powered exclusively by **AWS Bedrock**. This provides:

- 🔒 **Enterprise Security**: AWS-grade security and compliance
- 🌍 **Global Scale**: AWS infrastructure worldwide
- 💰 **Cost Optimization**: Pay-per-use pricing with AWS Bedrock
- 🚀 **Latest Models**: Access to Claude 3.5 Sonnet, Claude 3 Opus, and Amazon Titan models
- 🔧 **Simplified Setup**: One cloud provider, consistent configuration

## Documentation

For more detailed information, check out the documentation in the `docs` directory:

- [Configuration Guide](docs/configuration.md) - Set up AWS credentials and customize Vibex Task Manager
- [Tutorial](docs/tutorial.md) - Step-by-step guide to getting started
- [Command Reference](docs/command-reference.md) - Complete list of all available commands
- [Task Structure](docs/task-structure.md) - Understanding the task format and features
- [Example Interactions](docs/examples.md) - Common AI interaction examples
- [Migration Guide](docs/migration-guide.md) - Guide to migrating to the new project structure

## Requirements

Vibex Task Manager uses AWS Bedrock for all AI operations. You'll need:

### AWS Prerequisites
- **AWS Account** with Bedrock access
- **AWS Credentials** configured (AWS CLI, environment variables, or IAM roles)
- **Bedrock Model Access** enabled for the models you want to use

### Supported Models
- **Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`) - Latest and most capable
- **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`) - Best for complex reasoning
- **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`) - Balanced performance
- **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`) - Fast and efficient
- **Amazon Titan Text** (`amazon.titan-text-premier-v1:0`) - AWS native model

## Quick Start

### Option 1: Using with Claude Code/Cursor AI (Recommended)

#### 1. Install via MCP

###### Cursor & Windsurf (`mcpServers`)

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

###### VS Code (`servers` + `type`)

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

> 🔑 Replace `your-aws-profile` with your AWS profile name and set your preferred region.

#### 2. Configure AWS Credentials

Make sure you have AWS credentials configured. You can do this via:

**AWS CLI:**
```bash
aws configure
```

**Environment Variables:**
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

**IAM Roles** (recommended for EC2/Lambda):
AWS will automatically use IAM roles when available.

#### 3. Enable Bedrock Model Access

In your AWS Console:
1. Go to AWS Bedrock service
2. Navigate to "Model access" in the left sidebar
3. Request access to the models you want to use:
   - Anthropic Claude models
   - Amazon Titan models

#### 4. Initialize Your Project

In your editor's AI chat pane, say:

```txt
Initialize vibex-task-manager in my project
```

#### 5. Start Building

You can now ask the AI to help you with tasks like:

```txt
Create a task for implementing user authentication
```

```txt
Parse my PRD and create a task list
```

[More examples on how to use Vibex Task Manager in chat](docs/examples.md)

### Option 2: Using Command Line

#### Installation

```bash
# Install globally
npm install -g vibex-task-manager

# OR install locally within your project
npm install vibex-task-manager
```

#### Configure AWS

```bash
# Configure AWS CLI (recommended)
aws configure

# OR set environment variables
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-1
```

#### Initialize a new project

```bash
# If installed globally
vibex-task-manager init

# If installed locally
npx vibex-task-manager init
```

This will prompt you for project details and set up a new project with the necessary files and structure.

#### Common Commands

```bash
# Initialize a new project
vibex-task-manager init

# Parse a PRD and generate tasks
vibex-task-manager parse-prd your-prd.txt

# List all tasks
vibex-task-manager list

# Show the next task to work on
vibex-task-manager next

# Generate task files
vibex-task-manager generate
```

## Troubleshooting

### If AWS Bedrock calls fail

- Verify your AWS credentials are properly configured
- Ensure you have enabled model access in AWS Bedrock console
- Check that your AWS region supports Bedrock
- Verify your IAM permissions include Bedrock access

### If `vibex-task-manager init` doesn't respond

Try running it with Node directly:

```bash
node node_modules/vibex-task-manager/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/vibex/vibex-task-manager.git
cd vibex-task-manager
node scripts/init.js
```

## AWS Bedrock Regions

AWS Bedrock is available in these regions:
- `us-east-1` (N. Virginia) - Recommended
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)
- `ap-northeast-1` (Tokyo)

Choose the region closest to you for best performance.

## Contributors

<a href="https://github.com/vibex/vibex-task-manager/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=vibex/vibex-task-manager" alt="Vibex Task Manager project contributors" />
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vibex/vibex-task-manager&type=Timeline)](https://www.star-history.com/#vibex/vibex-task-manager&Timeline)

## Licensing

Vibex Task Manager is licensed under the MIT License. This means you can:

✅ **Allowed**:
- Use Vibex Task Manager for any purpose (personal, commercial, academic)
- Modify the source code for your own needs
- Distribute modified versions
- Use in proprietary software

❌ **Not Allowed**:
- Sell Vibex Task Manager as a software product or service
- Offer Vibex Task Manager as a hosted service for others

## Security & Privacy

- **Local Processing**: All task data stays on your machine
- **AWS Bedrock**: AI calls are processed securely through AWS Bedrock
- **No Data Storage**: We don't store or log your tasks or code
- **Enterprise Ready**: Built on AWS infrastructure with enterprise-grade security

---

**Ready to supercharge your development workflow with AWS Bedrock?** 🚀

[Get Started](#quick-start) | [Documentation](docs/) | [Contributing](CONTRIBUTING.md)