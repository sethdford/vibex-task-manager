import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { BaseAIProvider } from './base-provider.js';
import { directGenerateObject, directBedrockCall } from './bedrock-direct.js';
import { log } from '../../scripts/modules/index.js';
export class BedrockAIProvider extends BaseAIProvider {
    constructor() {
        super();
        this.name = 'Bedrock';
    }
    /**
     * Override auth validation - Bedrock uses AWS credentials instead of API keys
     */
    validateAuth(params) {
        // Bedrock uses AWS credentials, not API keys
    }
    /**
     * Creates and returns a Bedrock client instance.
     * See https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html
     * for AWS SDK environment variables and configuration options.
     */
    getClient(params) {
        try {
            const { profile = process.env.AWS_PROFILE || 'default', region = process.env.AWS_DEFAULT_REGION || 'us-east-1', baseURL } = params;
            const credentialProvider = fromNodeProviderChain({ profile });
            return createAmazonBedrock({
                region,
                credentialProvider,
                ...(baseURL && { baseURL })
            });
        }
        catch (error) {
            this.handleError('client initialization', error);
        }
    }
    /**
     * Override generateObject to use workaround for Bedrock's tool use issues
     */
    async generateObject(params) {
        try {
            this.validateParams(params);
            this.validateMessages(params.messages);
            if (!params.schema) {
                throw new Error('Schema is required for object generation');
            }
            log('debug', `Generating ${this.name} object with workaround for model: ${params.modelId}`);
            // Use direct Bedrock API call instead of AI SDK
            const result = await directGenerateObject({
                modelId: params.modelId,
                messages: params.messages,
                schema: params.schema,
                maxTokens: params.maxTokens,
                temperature: params.temperature,
                region: params.region || process.env.AWS_DEFAULT_REGION || 'us-east-1'
            });
            log('debug', `${this.name} generateObject (direct API) completed successfully for model: ${params.modelId}`);
            return result;
        }
        catch (error) {
            this.handleError('object generation', error);
        }
    }
    /**
     * Override generateText to use direct Bedrock API
     */
    async generateText(params) {
        try {
            this.validateParams(params);
            this.validateMessages(params.messages);
            log('debug', `Generating ${this.name} text with direct API for model: ${params.modelId}`);
            const result = await directBedrockCall({
                modelId: params.modelId,
                messages: params.messages,
                maxTokens: params.maxTokens,
                temperature: params.temperature,
                region: params.region || process.env.AWS_DEFAULT_REGION || 'us-east-1'
            });
            log('debug', `${this.name} generateText (direct API) completed successfully for model: ${params.modelId}`);
            return {
                text: result.text,
                usage: {
                    inputTokens: result.usage?.promptTokens,
                    outputTokens: result.usage?.completionTokens,
                    totalTokens: result.usage?.totalTokens
                }
            };
        }
        catch (error) {
            this.handleError('text generation', error);
        }
    }
}
