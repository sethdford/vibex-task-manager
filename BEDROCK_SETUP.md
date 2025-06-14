# AWS Bedrock Setup Guide for Vibex Task Manager

## 🎯 Auto-Detection Feature

Vibex Task Manager now includes **automatic model detection**! When you initialize a project, it will:

1. **Detect your AWS credentials** automatically
2. **Scan for available Claude models** in your region
3. **Configure optimal models** based on what's available
4. **Fall back gracefully** if Bedrock isn't accessible

### Quick Test

```bash
# Test auto-detection in your current region
vibex-task-manager config detect

# Test in a specific region
vibex-task-manager config detect --region us-west-2

# Initialize with auto-detection (default)
vibex-task-manager init
```

## Current Status
✅ **AWS CLI configured and working**  
✅ **AWS Bedrock service accessible**  
✅ **Vibex Task Manager Bedrock provider code working**  
✅ **Auto-detection of available models**  
❌ **Claude model access not enabled** (needs manual setup)

## Required Setup Steps

### 1. Enable Claude Model Access in AWS Console

**You need to manually enable access to Claude models in the AWS Bedrock console:**

1. **Go to AWS Bedrock Console**:
   - Open: https://console.aws.amazon.com/bedrock/
   - Make sure you're in the **us-east-1** region

2. **Navigate to Model Access**:
   - In the left sidebar, click on **"Model access"**
   - You'll see a list of available foundation models

3. **Request Access to Claude Models**:
   - Look for **Anthropic** models in the list
   - Click **"Manage model access"** or **"Modify model access"**
   - Enable access for these models:
     - ✅ **Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)
     - ✅ **Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`) 
     - ✅ **Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20240620-v1:0`)
     - ✅ **Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`) [optional]

4. **Submit Request**:
   - Click **"Request model access"**
   - For most Claude models, access is **granted immediately**
   - Some models may require justification for use case

5. **Verify Access**:
   - Wait a few minutes for the access to propagate
   - The status should change from "Not available" to "Available"

### 2. Alternative: Use Amazon Titan Models (No approval needed)

If you want to test immediately without waiting for Claude access:

```bash
# Test with Amazon Titan (usually available by default)
aws bedrock invoke-model \\
    --region us-east-1 \\
    --model-id amazon.titan-text-express-v1 \\
    --content-type application/json \\
    --accept application/json \\
    --body '{"inputText": "Hello, world!", "textGenerationConfig": {"maxTokenCount": 50}}' \\
    output.txt && cat output.txt
```

## Testing After Setup

Once you've enabled Claude model access, test the integration:

```bash
# Run our test script
node test-bedrock-provider.js
```

You should see:
```
🧪 Testing Vibex Task Manager Bedrock Provider...
📍 Using AWS region: us-east-1
👤 Using AWS profile: default
✅ Bedrock provider initialized
🔄 Testing with model: anthropic.claude-3-haiku-20240307-v1:0
📝 AI Response: Vibex Task Manager AWS Bedrock test successful!
📊 Token Usage:
  - Input tokens: 28
  - Output tokens: 12
  - Total tokens: 40
🎉 SUCCESS: Vibex Task Manager AWS Bedrock integration is working correctly!
```

## Testing the CLI

Once models are working, test the CLI:

```bash
# Set up a test project
mkdir bedrock-test && cd bedrock-test

# Initialize the project
vibex-task-manager init --name="Bedrock Test" -y

# Test model configuration
vibex-task-manager models

# Test adding a task
vibex-task-manager add-task --prompt="Create a simple hello world application"
```

## Troubleshooting

### Common Issues:

1. **"You don't have access to the model"**
   - ✅ **Solution**: Enable model access in AWS Bedrock console (step 1 above)

2. **"Could not load credentials"**
   - ✅ **Solution**: Run `aws configure` to set up credentials

3. **"Invocation of model ID ... with on-demand throughput isn't supported"**
   - ✅ **Solution**: Use inference profile IDs instead of direct model IDs
   - Example: Use `us.anthropic.claude-3-haiku-20240307-v1:0` instead of `anthropic.claude-3-haiku-20240307-v1:0`

### Model Access Status Check:

```bash
# Check which models you have access to
aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?contains(modelId, `claude`)].{ModelId:modelId,Name:modelName,Status:modelLifecycle.status}' --output table
```

## Next Steps

1. **Enable Claude model access** in AWS Console (manual step required)
2. **Test the integration** with our test script
3. **Update supported-models.json** if needed to reflect available models
4. **Test full Vibex Task Manager functionality**

---

**Need Help?**
- AWS Bedrock Documentation: https://docs.aws.amazon.com/bedrock/
- Claude Models: https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html