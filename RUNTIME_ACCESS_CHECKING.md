# Runtime Model Access Checking

This document describes the runtime model access checking feature that ensures the Vibex Task Manager automatically detects and uses only the AWS Bedrock models that users actually have access to.

## Problem Solved

Previously, the system would:
- List all available models in AWS Bedrock
- Assume all listed models were accessible
- Fail with access denied errors when trying to use models requiring special permissions (like Claude 4 models that need INFERENCE_PROFILE access)
- Force users to manually configure models they could actually use

## Solution Overview

The new runtime access checking system:
- **Tests actual model access** by making real API calls to each model
- **Automatically falls back** to accessible models when requested models are unavailable
- **Intelligently recommends** the best available models based on actual access
- **Gracefully handles** different types of access errors
- **Auto-configures** the system with working models

## Key Features

### 1. Runtime Access Testing

**BedrockClient Methods:**
- `testModelAccess(modelId)` - Tests if a specific model can be invoked
- `getAccessibleModels()` - Returns all models the user can actually use
- `getBestAvailableModel(preference)` - Gets the best model based on performance/cost/balanced criteria

### 2. Automatic Fallback

**BedrockClient Method:**
- `generateTextWithFallback(options)` - Automatically tries alternatives if the requested model fails

### 3. Enhanced Auto-Detection

**BedrockAutoDetect Method:**
- `detectModels(testAccess = false)` - Now supports actual access testing

### 4. Auto-Configuration

**ConfigService Method:**
- `autoConfigureModels(options)` - Automatically configures with accessible models

## CLI Commands

### New Commands

**`config auto-configure`** - Automatically configure with accessible models
```bash
vibex-task-manager config auto-configure --project-name "My Project"
```

### Enhanced Commands

**`config auto-update`** - Now supports runtime access testing
```bash
# Test actual access (slower but accurate)
vibex-task-manager config auto-update --test-access

# Dry run to see what would change
vibex-task-manager config auto-update --test-access --dry-run
```

## Benefits

1. **Zero Configuration Failures** - System always uses models that work
2. **Automatic Optimization** - Always uses the best available models
3. **Graceful Degradation** - Continues working even when preferred models aren't available
4. **User-Friendly** - No need to manually figure out which models work
5. **Future-Proof** - Automatically adapts as user's access changes
6. **Transparent** - Clear reporting of what models are accessible and why 