#!/usr/bin/env node

/**
 * Test AWS Bedrock Auto-Detection
 * This script tests the auto-detection functionality locally
 */

import BedrockAutoDetect from './dist/src/core/bedrock-auto-detect.js';
import chalk from 'chalk';

async function testAutoDetection() {
  console.log(chalk.blue('🧪 Testing Vibex Task Manager AWS Bedrock Auto-Detection...\n'));

  try {
    // Test with default settings
    console.log(chalk.yellow('1. Testing with default settings...'));
    const detector = new BedrockAutoDetect();
    const result = await detector.detectModels();

    if (result.error) {
      console.log(chalk.red(`   ❌ ${result.error}`));
    } else {
      console.log(chalk.green(`   ✓ Detected ${result.available.length} models`));
      console.log(`   ✓ Has credentials: ${result.hasCredentials}`);
      if (result.recommendations.main) {
        console.log(`   ✓ Recommended main model: ${result.recommendations.main}`);
      }
    }

    // Test quick setup
    console.log(chalk.yellow('\n2. Testing quick setup helper...'));
    const quickConfig = await BedrockAutoDetect.quickSetup();
    console.log(chalk.green('   ✓ Quick setup completed'));
    console.log(`   Main model: ${quickConfig.mainModel || 'None'}`);
    console.log(`   Research model: ${quickConfig.researchModel || 'None'}`);
    console.log(`   Fallback model: ${quickConfig.fallbackModel || 'None'}`);
    console.log(`   Available models: ${quickConfig.availableModels.length}`);

    // Test with specific region
    console.log(chalk.yellow('\n3. Testing with specific region (us-west-2)...'));
    const westDetector = new BedrockAutoDetect({ region: 'us-west-2' });
    const westResult = await westDetector.detectModels();
    console.log(chalk.green(`   ✓ Detected ${westResult.available.length} models in us-west-2`));

    // Display results summary
    console.log(chalk.blue('\n📊 Auto-Detection Summary:'));
    if (result.available.length > 0) {
      console.log(chalk.green('\n✅ Available models:'));
      result.available.forEach(model => {
        console.log(`   - ${model.modelId} (${model.modelInfo.name})`);
      });
    }

    if (result.unavailable.length > 0) {
      console.log(chalk.yellow('\n⚠️  Unavailable models:'));
      result.unavailable.forEach(model => {
        console.log(`   - ${model.modelId} (${model.modelInfo.name})`);
      });
    }

    if (!result.hasCredentials) {
      console.log(chalk.red('\n❌ No AWS credentials detected'));
      console.log(chalk.yellow('   Configure AWS credentials to enable auto-detection:'));
      console.log(chalk.yellow('   - Run: aws configure'));
      console.log(chalk.yellow('   - Or set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'));
    }

    console.log(chalk.green('\n✅ Auto-detection test completed!'));

  } catch (error) {
    console.error(chalk.red('❌ Auto-detection test failed:'), error.message);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the test
testAutoDetection().catch(console.error);