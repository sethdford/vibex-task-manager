# Configuration

Vibex Task Manager uses AWS Bedrock for all AI operations and provides flexible configuration options.

## Configuration Methods

### 1. **`.taskmanager/config.json` File (Recommended)**

This JSON file stores all configuration settings, including AWS Bedrock model selections, parameters, logging levels, and project defaults.

- **Location:** Created in the `.taskmanager/` directory when you run `vibex-task-manager models --setup` or `vibex-task-manager init`
- **Management:** Use the `vibex-task-manager models --setup` command to interactively create and manage this file
- **Manual editing:** Possible but not recommended unless you understand the structure

**Example Structure:**
```json
{
  "models": {
    "main": {
      "provider": "bedrock",
      "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "maxTokens": 64000,
      "temperature": 0.2
    },
    "research": {
      "provider": "bedrock",
      "modelId": "anthropic.claude-3-haiku-20240307-v1:0",
      "maxTokens": 64000,
      "temperature": 0.1
    },
    "fallback": {
      "provider": "bedrock",
      "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
      "maxTokens": 64000,
      "temperature": 0.2
    }
  },
  "global": {
    "logLevel": "info",
    "debug": false,
    "defaultSubtasks": 5,
    "defaultPriority": "medium",
    "projectName": "Your Project Name",
    "bedrockBaseURL": "https://bedrock-runtime.us-east-1.amazonaws.com"
  }
}
```

### 2. **AWS Credentials Configuration**

Vibex Task Manager requires AWS credentials to access Bedrock. Configure them using one of these methods:

#### AWS CLI (Recommended)
```bash
aws configure
```
This creates `~/.aws/credentials` and `~/.aws/config` files.

#### Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=us-east-1
export AWS_PROFILE=your-profile-name  # Optional
```

#### IAM Roles (For EC2/Lambda)
AWS automatically uses IAM roles when available. No additional configuration needed.

### 3. **Environment File (`.env`)**

You can also set AWS configuration in a `.env` file in your project root:

```env
# AWS Configuration
AWS_PROFILE=your-profile
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Optional: Custom Bedrock endpoint
BEDROCK_BASE_URL=https://bedrock-runtime.us-east-1.amazonaws.com

# Logging
LOG_LEVEL=info
DEBUG=false
```

## Supported AWS Bedrock Models

### Anthropic Claude Models
- `us.anthropic.claude-3-7-sonnet-20250219-v1:0` - **Claude 4 (3.7)** - Latest and most capable (SWE score: 0.5)
- `anthropic.claude-3-5-sonnet-20241022-v2:0` - Claude 3.5 Sonnet (latest version)
- `anthropic.claude-3-5-sonnet-20240620-v1:0` - Claude 3.5 Sonnet (June 2024)
- `anthropic.claude-3-opus-20240229-v1:0` - Best for complex reasoning
- `anthropic.claude-3-sonnet-20240229-v1:0` - Balanced performance
- `anthropic.claude-3-haiku-20240307-v1:0` - Fast and efficient
- `anthropic.claude-instant-v1` - Legacy, fast model

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

## Model Access Setup

Before using Vibex Task Manager, you must enable model access in AWS Bedrock:

1. **Open AWS Console** → Navigate to Bedrock service
2. **Model Access** → Click "Model access" in the left sidebar
3. **Request Access** → Enable access for:
   - Anthropic Claude models
   - Amazon Titan models
4. **Wait for Approval** → Some models may require approval (usually instant)

## Configuration Commands

### Interactive Setup
```bash
# Set up models interactively
vibex-task-manager models --setup

# Or via MCP
# Use the "models" tool in your editor
```

### Direct Model Configuration
```bash
# Set main model to Claude 4
vibex-task-manager models --set-main=us.anthropic.claude-3-7-sonnet-20250219-v1:0

# Set research model
vibex-task-manager models --set-research=anthropic.claude-3-haiku-20240307-v1:0

# Set fallback model
vibex-task-manager models --set-fallback=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### View Current Configuration
```bash
# Show all models
vibex-task-manager models

# Show specific model
vibex-task-manager models --show-main
vibex-task-manager models --show-research
vibex-task-manager models --show-fallback
```

## AWS IAM Permissions

Your AWS user/role needs these permissions for Bedrock:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:model/anthropic.claude-*",
        "arn:aws:bedrock:*:*:model/amazon.titan-*"
      ]
    }
  ]
}
```

## Migration from task-master-ai

If you're migrating from the old task-master-ai:

### 1. Update Package
```bash
npm uninstall task-master-ai
npm install vibex-task-manager
```

### 2. Update MCP Configuration

**Before (task-master-ai):**
```json
{
  "mcpServers": {
    "vibex-task-manager-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-...",
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

**After (vibex-task-manager):**
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

### 3. Migrate Configuration File
```bash
# This will update your .taskmanager/config.json to use Bedrock models
vibex-task-manager migrate
```

## Troubleshooting

### Common Issues

**"Access denied" errors:**
- Verify AWS credentials are configured correctly
- Check IAM permissions include Bedrock access
- Ensure model access is enabled in Bedrock console

**"Model not found" errors:**
- Verify the model ID is correct and supported
- Check that model access is enabled for that specific model
- Ensure you're using the correct AWS region

**"Invalid region" errors:**
- Bedrock is not available in all AWS regions
- Use a supported region like `us-east-1`

### Debug Mode
Enable debug logging to troubleshoot issues:

```bash
# Environment variable
export DEBUG=true

# Or in .env file
DEBUG=true

# Or in config.json
{
  "global": {
    "debug": true
  }
}
```

### Test Configuration
```bash
# Test your Bedrock connection
vibex-task-manager models --test

# Test specific model
vibex-task-manager models --test-main
```

## Advanced Configuration

### Custom Bedrock Endpoint
If you need a custom Bedrock endpoint:

```json
{
  "global": {
    "bedrockBaseURL": "https://bedrock-runtime.custom-region.amazonaws.com"
  }
}
```

### Model Parameters
Fine-tune model behavior:

```json
{
  "models": {
    "main": {
      "provider": "bedrock",
      "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "maxTokens": 32000,     // Reduce for faster responses
      "temperature": 0.1      // Lower for more consistent output
    }
  }
}
```

### Project-Specific Settings
```json
{
  "global": {
    "projectName": "My AI Project",
    "defaultSubtasks": 3,           // Fewer subtasks for simpler projects
    "defaultPriority": "high",      // Default task priority
    "logLevel": "debug"             // More verbose logging
  }
}
```

---

For more help, see the [Tutorial](tutorial.md) or [Examples](examples.md).