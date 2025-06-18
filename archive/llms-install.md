# Vibex Task Manager Installation Guide

This guide helps AI assistants install and configure Vibex Task Manager for users in their development projects.

## What is Vibex Task Manager?

Vibex Task Manager is an AI-driven task management system powered exclusively by AWS Bedrock. It helps break down projects into manageable tasks, track dependencies, and maintain development momentum through structured, AI-enhanced planning using Claude and Amazon Titan models.

## Installation Steps

### Step 1: Add MCP Configuration

Add the following configuration to the user's MCP settings file (`.cursor/mcp.json` for Cursor, or equivalent for other editors):

```json
{
	"mcpServers": {
		"vibex-task-manager": {
			"command": "npx",
			"args": ["-y", "--package=vibex-task-manager", "vibex-task-manager"],
			"env": {
				"AWS_PROFILE": "user_aws_profile_name",
				"AWS_DEFAULT_REGION": "us-east-1"
			}
		}
	}
}
```

### Step 2: AWS Requirements

Inform the user they need:

- **AWS Account** with Bedrock access
- **AWS Credentials** configured (AWS CLI, environment variables, or IAM roles)
- **Bedrock Model Access** enabled for:
  - **Anthropic Claude models** (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
  - **Amazon Titan models** (optional, for variety)

### Step 3: Configure AWS Credentials

Help the user set up AWS credentials using one of these methods:

#### Option A: AWS CLI (Recommended)
```bash
aws configure
```

#### Option B: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-1
```

#### Option C: IAM Roles (for EC2/Lambda)
AWS automatically uses IAM roles when available.

### Step 4: Enable Bedrock Model Access

Guide the user to:

1. Open AWS Console → Navigate to Bedrock service
2. Click "Model access" in the left sidebar
3. Request access to:
   - Anthropic Claude models
   - Amazon Titan models (optional)
4. Wait for approval (usually instant)

### Step 5: Initialize Project

After MCP configuration and AWS setup, run:

```
Initialize vibex-task-manager in my project
```

## Supported AWS Bedrock Models

### Anthropic Claude Models (Recommended)
- `us.anthropic.claude-3-7-sonnet-20250219-v1:0` - **Claude 4 (3.7)** - Latest and most capable
- `anthropic.claude-3-5-sonnet-20241022-v2:0` - Claude 3.5 Sonnet (latest)
- `anthropic.claude-3-opus-20240229-v1:0` - Best for complex reasoning
- `anthropic.claude-3-sonnet-20240229-v1:0` - Balanced performance
- `anthropic.claude-3-haiku-20240307-v1:0` - Fast and efficient

### Amazon Titan Models
- `amazon.titan-text-premier-v1:0` - AWS native, high quality
- `amazon.titan-text-express-v1` - AWS native, fast

## AWS Bedrock Regions

Bedrock is available in these regions:
- `us-east-1` (N. Virginia) - **Recommended**
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)
- `ap-northeast-1` (Tokyo)

## Troubleshooting

**If AI commands fail:**

- Verify AWS credentials are properly configured
- Ensure Bedrock model access is enabled in AWS console
- Check that your AWS region supports Bedrock
- Verify IAM permissions include Bedrock access

**If initialization fails:**

- Ensure the AWS profile exists and is valid
- Check that AWS CLI is installed and configured
- Verify the specified AWS region supports Bedrock

## CLI Fallback

Vibex Task Manager is also available via CLI commands, by installing with `npm install vibex-task-manager@latest` in a terminal. Running `vibex-task-manager help` will show all available commands, which offer a 1:1 experience with the MCP server. As the AI agent, you should refer to the system prompts and rules provided to you to identify Vibex Task Manager-specific rules that help you understand how and when to use it.

## Next Steps

Once installed, users can:

- Create new tasks with `add-task` or parse a PRD (scripts/prd.txt) into tasks with `parse-prd`
- Set up model preferences with `models` tool
- Expand tasks into subtasks with `expand-all` and `expand-task`
- Track progress and dependencies through the task management system

## Migration from task-master-ai

If the user is migrating from the old task-master-ai:

1. **Update MCP Configuration:** Replace `task-master-ai` with `vibex-task-manager`
2. **Replace API Keys:** Remove old API keys, add AWS credentials
3. **Run Migration:** Use `vibex-task-manager migrate` to update existing projects
4. **Enable Bedrock:** Set up AWS Bedrock model access

## Key Benefits

- ✅ **Enterprise Security:** AWS-grade security and compliance
- ✅ **Cost Optimization:** Pay-per-use pricing with AWS Bedrock
- ✅ **Global Scale:** AWS infrastructure worldwide
- ✅ **Latest Models:** Access to Claude 3.5 Sonnet and other cutting-edge models
- ✅ **Simplified Setup:** One cloud provider, consistent configuration

---

For detailed configuration options, see the [Configuration Guide](docs/configuration.md).