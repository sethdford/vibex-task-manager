/**
 * src/ai-providers/index.ts
 * Central export point for AWS Bedrock AI provider
 */
export { BedrockAIProvider } from './bedrock.js';
export { BaseAIProvider } from './base-provider.js';
export { directGenerateObject, directBedrockCall } from './bedrock-direct.js';
export { generateObjectWorkaround } from './bedrock-workaround.js';
