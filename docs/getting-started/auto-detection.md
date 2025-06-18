# AWS Bedrock Auto-Detection Guide

Vibex Task Manager includes intelligent auto-detection of AWS Bedrock models to simplify your setup process.

## How It Works

When you initialize a project or set up configuration, Vibex Task Manager will:

1. **Check AWS Credentials**
   - Validates AWS access keys, profiles, or IAM roles
   - Tests connectivity to AWS Bedrock service

2. **Scan Available Models**
   - Lists all foundation models in your region
   - Filters for Claude/Anthropic models you have access to

3. **Smart Model Selection**
   - **Main Model**: Prioritizes Claude 4 (3.7) Sonnet or Claude 3.5 Sonnet
   - **Research Model**: Selects Claude 3 Opus for complex reasoning
   - **Fallback Model**: Chooses Claude 3 Haiku for cost-effective operations

4. **Graceful Fallback**
   - If no credentials: Uses default configuration
   - If no models found: Prompts to enable access
   - If region issue: Suggests alternative regions

## Commands

### Initialize with Auto-Detection

```bash
# Default behavior - auto-detects and configures
vibex-task-manager init

# Skip auto-detection
vibex-task-manager init --skip-setup
```

### Manual Detection

```bash
# Detect in current region
vibex-task-manager config detect

# Detect in specific region
vibex-task-manager config detect --region eu-west-1

# Detect with specific profile
vibex-task-manager config detect --profile production
```

### Configuration Setup

```bash
# Auto-detect during setup (if no models specified)
vibex-task-manager config setup

# Override with specific models
vibex-task-manager config setup --main-model claude-3-7-sonnet-20250219
```

## Example Output

### Successful Detection

```
🔍 Detecting available AWS Bedrock models...
Region: us-east-1

✓ Found 4 available Claude models:

  ✓ claude-3-7-sonnet-20250219
     Claude 4 (3.7) Sonnet
     Context: 200,000 tokens
     Cost: $0.003/1K input, $0.015/1K output

  ✓ claude-3-5-sonnet-20241022
     Claude 3.5 Sonnet (Latest)
     Context: 200,000 tokens
     Cost: $0.003/1K input, $0.015/1K output

  ✓ claude-3-opus-20240229
     Claude 3 Opus
     Context: 200,000 tokens
     Cost: $0.015/1K input, $0.075/1K output

  ✓ claude-3-haiku-20240307
     Claude 3 Haiku
     Context: 200,000 tokens
     Cost: $0.00025/1K input, $0.00125/1K output

Recommended configuration:
  Main Model: claude-3-7-sonnet-20250219
  Research Model: claude-3-opus-20240229
  Fallback Model: claude-3-haiku-20240307
```

### No Models Available

```
⚠ AWS credentials not found or invalid
Please configure AWS credentials to access Bedrock.

You can configure credentials using:
  - AWS CLI: aws configure
  - Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
  - IAM role (when running on AWS)
```

## Troubleshooting

### AWS Credentials Not Found

1. Run `aws configure` to set up credentials
2. Or set environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   export AWS_REGION=us-east-1
   ```

### No Models Found

1. Check AWS Bedrock console for your region
2. Request access to Claude models:
   - Go to AWS Bedrock → Model access
   - Enable Anthropic models
   - Wait for approval (usually instant)

### Wrong Region

Some regions may not have all models. Try:
- `us-east-1` (N. Virginia) - Most models
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)

## Benefits

1. **Zero Configuration**: Works out of the box with AWS credentials
2. **Optimal Performance**: Automatically selects best available models
3. **Cost Awareness**: Considers pricing in recommendations
4. **Region Aware**: Detects models specific to your AWS region
5. **Fallback Ready**: Gracefully handles missing models or credentials

## API Usage

For programmatic access:

```javascript
import BedrockAutoDetect from 'vibex-task-manager/core/bedrock-auto-detect';

// Quick setup
const config = await BedrockAutoDetect.quickSetup({
  region: 'us-east-1',
  profile: 'default'
});

console.log('Available models:', config.availableModels);
console.log('Recommended main model:', config.mainModel);

// Detailed detection
const detector = new BedrockAutoDetect({ region: 'us-east-1' });
const result = await detector.detectModels();

console.log('Available:', result.available);
console.log('Recommendations:', result.recommendations);
```

## Best Practices

1. **Run Detection First**: Always check what's available before configuring
2. **Use Profiles**: For multiple AWS accounts, use named profiles
3. **Check Regions**: Different regions have different model availability
4. **Monitor Costs**: Auto-detection shows pricing to help budget
5. **Update Regularly**: New models are added frequently

## Security

- Credentials are never stored in configuration files
- Uses standard AWS SDK credential chain
- Respects IAM permissions and policies
- No external API calls beyond AWS

## Future Enhancements

- Multi-region detection for optimal latency
- Cost optimization recommendations
- Performance benchmarking of available models
- Automatic fallback to alternative providers