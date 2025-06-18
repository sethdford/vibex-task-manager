# AWS Bedrock Setup Guide

## 🎯 Zero-Configuration Auto-Detection

Vibex Task Manager features **automatic AWS Bedrock model detection**! When you initialize a project, it will:

1. **Detect your AWS credentials** automatically
2. **Scan for available Claude models** in your region  
3. **Configure optimal models** based on availability and use case
4. **Fall back gracefully** if Bedrock isn't accessible

### Quick Test Auto-Detection

```bash
# Test auto-detection in your current region
vibex-task-manager config detect

# Test in a specific region  
vibex-task-manager config detect --region us-west-2

# Initialize with auto-detection (default behavior)
vibex-task-manager init
```

## Prerequisites

### AWS Account Requirements
- **AWS Account** with Bedrock access
- **AWS Credentials** configured (AWS CLI, environment variables, or IAM roles)
- **Bedrock Model Access** enabled for the models you want to use

### Supported AWS Bedrock Models
- **Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`) - Latest and most capable
- **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`) - Best for complex reasoning
- **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`) - Balanced performance
- **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`) - Fast and efficient
- **Amazon Titan Text** (`amazon.titan-text-premier-v1:0`) - AWS native model

## Step 1: Configure AWS Credentials

Choose one of the following methods to configure your AWS credentials:

### Option A: AWS CLI (Recommended)
```bash
# Install AWS CLI if not already installed
# macOS: brew install awscli
# Windows: Download from AWS website
# Linux: sudo apt install awscli

# Configure credentials
aws configure
```

You'll be prompted for:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key  
- **Default region**: `us-east-1` (recommended for Claude models)
- **Default output format**: `json`

### Option B: Environment Variables
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### Option C: IAM Roles (For EC2/Lambda)
AWS will automatically use IAM roles when available - no configuration needed.

### Option D: AWS Profile
```bash
# Configure a specific profile
aws configure --profile vibex-task-manager

# Use the profile in your shell
export AWS_PROFILE=vibex-task-manager
```

## Step 2: Enable Bedrock Model Access

**You must manually enable access to Claude models in the AWS Bedrock console:**

### Access the AWS Bedrock Console
1. **Open AWS Bedrock Console**: https://console.aws.amazon.com/bedrock/
2. **Select Region**: Make sure you're in **us-east-1** (or your preferred region)
3. **Navigate to Model Access**: Click **"Model access"** in the left sidebar

### Request Access to Models
1. **Click "Manage model access"** or **"Modify model access"**
2. **Enable access for these models**:
   - ✅ **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)
   - ✅ **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - ✅ **Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20240620-v1:0`)
   - ✅ **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`) [optional]
3. **Submit Request**: Click **"Request model access"**
4. **Wait for Approval**: Most Claude models are **approved immediately**

### Verify Model Access
```bash
# Check which models you have access to
aws bedrock list-foundation-models --region us-east-1 \
  --query 'modelSummaries[?contains(modelId, `claude`)].{ModelId:modelId,Name:modelName,Status:modelLifecycle.status}' \
  --output table
```

## Step 3: Test Your Setup

### Test AWS Credentials
```bash
# Verify AWS credentials are working
aws sts get-caller-identity
```

### Test Bedrock Access
```bash
# Test basic Bedrock access
aws bedrock list-foundation-models --region us-east-1
```

### Test Vibex Task Manager Integration
```bash
# Test auto-detection
vibex-task-manager config detect

# Initialize a test project
mkdir bedrock-test && cd bedrock-test
vibex-task-manager init --name="Bedrock Test"

# Test model configuration
vibex-task-manager models

# Test adding a task
vibex-task-manager add-task --prompt="Create a simple hello world application"
```

## Alternative: Amazon Titan Models

If you want to test immediately without waiting for Claude access, Amazon Titan models are usually available by default:

```bash
# Test with Amazon Titan
aws bedrock invoke-model \
    --region us-east-1 \
    --model-id amazon.titan-text-express-v1 \
    --content-type application/json \
    --accept application/json \
    --body '{"inputText": "Hello, world!", "textGenerationConfig": {"maxTokenCount": 50}}' \
    output.txt && cat output.txt
```

## Troubleshooting

### Common Issues

#### 1. "You don't have access to the model"
**Solution**: Enable model access in AWS Bedrock console (Step 2 above)

#### 2. "Could not load credentials"  
**Solutions**:
- Run `aws configure` to set up credentials
- Check environment variables are set correctly
- Verify IAM permissions for Bedrock access

#### 3. "Invocation of model ID with on-demand throughput isn't supported"
**Solution**: Use inference profile IDs instead of direct model IDs
- Use: `us.anthropic.claude-3-haiku-20240307-v1:0`
- Instead of: `anthropic.claude-3-haiku-20240307-v1:0`

#### 4. Region-specific issues
**Solutions**:
- Ensure Claude models are available in your region
- Try `us-east-1` which has the most model availability
- Use `vibex-task-manager config detect --region us-east-1` to test

### Debugging Commands

```bash
# Check AWS configuration
aws configure list

# Test AWS credentials
aws sts get-caller-identity

# List available regions for Bedrock
aws bedrock list-foundation-models --query 'modelSummaries[0].modelArn' --output text | cut -d: -f4

# Check model access status
aws bedrock list-foundation-models --region us-east-1 \
  --query 'modelSummaries[?contains(modelId, `anthropic`)].{ModelId:modelId,Name:modelName}' \
  --output table
```

## Regional Considerations

### Recommended Regions for Claude Models
1. **us-east-1** (N. Virginia) - Most models available
2. **us-west-2** (Oregon) - Good alternative
3. **eu-west-1** (Ireland) - European users
4. **ap-southeast-2** (Sydney) - Asia-Pacific users

### Check Model Availability by Region
```bash
# Check what's available in different regions
for region in us-east-1 us-west-2 eu-west-1; do
  echo "=== $region ==="
  aws bedrock list-foundation-models --region $region \
    --query 'modelSummaries[?contains(modelId, `claude`)].modelId' \
    --output text
done
```

## Security Best Practices

### IAM Permissions
Create a minimal IAM policy for Bedrock access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:ListFoundationModels"
            ],
            "Resource": "*"
        }
    ]
}
```

### Environment Isolation
- Use separate AWS profiles for different environments
- Consider using IAM roles instead of access keys in production
- Rotate access keys regularly

## Next Steps

Once your AWS Bedrock setup is complete:

1. **Initialize your project**: `vibex-task-manager init`
2. **Follow the tutorial**: [Getting Started Tutorial](tutorial.md)
3. **Explore examples**: [Usage Examples](../usage/examples.md)
4. **Configure advanced features**: [Configuration Guide](../usage/configuration.md)

## Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude Models Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html) 