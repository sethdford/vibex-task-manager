/**
 * AWS Bedrock Model Auto-Detection Utility
 * Automatically detects available Claude models in AWS Bedrock and configures defaults
 */

import {
	BedrockClient as AWSBedrockClient,
	ListFoundationModelsCommand,
	FoundationModelSummary
} from '@aws-sdk/client-bedrock';
import { fromIni, fromEnv } from '@aws-sdk/credential-providers';
import { BedrockClientConfig } from './bedrock-client.js';
import {
	BEDROCK_MODELS,
	BedrockModelId,
	BedrockModelInfo,
	findModelByBedrockId,
	MODEL_RECOMMENDATIONS,
	getClaudeModels
} from './bedrock-models.js';

export interface DetectedModel {
	modelId: BedrockModelId;
	bedrockId: string;
	modelInfo: BedrockModelInfo;
	isAvailable: boolean;
	region: string;
}

export interface AutoDetectResult {
	available: DetectedModel[];
	unavailable: DetectedModel[];
	recommendations: {
		main: BedrockModelId | null;
		research: BedrockModelId | null;
		fallback: BedrockModelId | null;
	};
	hasCredentials: boolean;
	error?: string;
}

export class BedrockAutoDetect {
	private client: AWSBedrockClient | null = null;
	private config: BedrockClientConfig;

	constructor(config: BedrockClientConfig = {}) {
		this.config = {
			region: config.region || process.env.AWS_REGION || 'us-east-1',
			...config
		};
	}

	/**
	 * Initialize AWS Bedrock client
	 */
	private async initializeClient(): Promise<AWSBedrockClient | null> {
		if (this.client) {
			return this.client;
		}

		try {
			const clientConfig: any = {
				region: this.config.region
			};

			// Set up credentials using a robust chain
			const credentialProvider = () => {
				if (this.config.accessKeyId && this.config.secretAccessKey) {
					return Promise.resolve({
						accessKeyId: this.config.accessKeyId,
						secretAccessKey: this.config.secretAccessKey,
						sessionToken: this.config.sessionToken
					});
				}
				// This will check env vars, and then the profile from ~/.aws/credentials
				return fromIni({ profile: this.config.profile })();
			};

			clientConfig.credentials = await credentialProvider();

			// A simple check to see if credentials exist
			if (!clientConfig.credentials?.accessKeyId) {
				throw new Error('AWS credentials could not be found.');
			}

			this.client = new AWSBedrockClient(clientConfig);
			return this.client;
		} catch (error) {
			// console.debug('Failed to initialize Bedrock client:', error);
			return null;
		}
	}

	/**
	 * Check if AWS credentials are available
	 */
	async hasValidCredentials(): Promise<boolean> {
		try {
			const client = await this.initializeClient();
			if (!client) return false;

			// Try to list models - this will fail if credentials are invalid
			const command = new ListFoundationModelsCommand({
				byProvider: 'Anthropic'
			});

			await client.send(command);
			return true;
		} catch (error) {
			// Check if it's a credentials error vs other errors
			const errorMessage =
				error instanceof Error ? error.message.toLowerCase() : '';
			if (
				errorMessage.includes('credentials') ||
				errorMessage.includes('unauthorized') ||
				errorMessage.includes('access denied')
			) {
				return false;
			}
			// If it's a different error (like network), we might have valid credentials
			// but can't connect - return true to allow fallback behavior
			return true;
		}
	}

	/**
	 * List available foundation models from AWS Bedrock
	 */
	private async listAvailableModels(): Promise<FoundationModelSummary[]> {
		try {
			const client = await this.initializeClient();
			if (!client) return [];

			const command = new ListFoundationModelsCommand({
				byProvider: 'Anthropic'
			});

			const response = await client.send(command);
			return response.modelSummaries || [];
		} catch (error) {
			console.debug('Failed to list Bedrock models:', error);
			return [];
		}
	}

	/**
	 * Auto-detect available models and recommend configuration
	 */
	async detectModels(testAccess: boolean = false): Promise<AutoDetectResult> {
		const result: AutoDetectResult = {
			available: [],
			unavailable: [],
			recommendations: {
				main: null,
				research: null,
				fallback: null
			},
			hasCredentials: false
		};

		// Check credentials first
		result.hasCredentials = await this.hasValidCredentials();

		if (!result.hasCredentials) {
			result.error =
				'No valid AWS credentials found. Please configure AWS credentials for Bedrock access.';
			return this.getFallbackRecommendations(result);
		}

		try {
			// Get available models from AWS
			const awsModels = await this.listAvailableModels();
			const availableBedrockIds = new Set(awsModels.map((m) => m.modelId));

			// Check each Claude model against available models
			const claudeModels = getClaudeModels();

			for (const [modelId, modelInfo] of claudeModels) {
				const isListed = availableBedrockIds.has(modelInfo.id);

				// If testing access, also check if we can actually invoke the model
				let isAccessible = isListed;
				if (testAccess && isListed) {
					isAccessible = await this.testModelAccess(modelId);
				}

				const detected: DetectedModel = {
					modelId,
					bedrockId: modelInfo.id,
					modelInfo,
					isAvailable: isAccessible,
					region: this.config.region || 'us-east-1'
				};

				if (detected.isAvailable) {
					result.available.push(detected);
				} else {
					result.unavailable.push(detected);
				}
			}

			// Make recommendations based on available models
			result.recommendations = this.recommendModels(result.available);

			// If no models available, provide fallback recommendations
			if (result.available.length === 0) {
				const accessMessage = testAccess
					? 'No Claude models are accessible in your AWS Bedrock region. You may need to request access to specific models or try a different region.'
					: 'No Claude models found in your AWS Bedrock region. You may need to request access or try a different region.';
				result.error = accessMessage;
				return this.getFallbackRecommendations(result);
			}
		} catch (error) {
			result.error = `Failed to detect models: ${error instanceof Error ? error.message : 'Unknown error'}`;
			return this.getFallbackRecommendations(result);
		}

		return result;
	}

	/**
	 * Recommend models based on availability and performance
	 */
	private recommendModels(
		availableModels: DetectedModel[]
	): AutoDetectResult['recommendations'] {
		if (availableModels.length === 0) {
			return { main: null, research: null, fallback: null };
		}

		// Sort by SWE score (performance) descending
		const sortedByPerformance = [...availableModels].sort(
			(a, b) => (b.modelInfo.swe_score || 0) - (a.modelInfo.swe_score || 0)
		);

		// Sort by cost (ascending)
		const sortedByCost = [...availableModels].sort(
			(a, b) => a.modelInfo.outputCostPer1K - b.modelInfo.outputCostPer1K
		);

		const recommendations: AutoDetectResult['recommendations'] = {
			main: null,
			research: null,
			fallback: null
		};

		// Find best available models for each role
		const modelIds = availableModels.map((m) => m.modelId);

		// Main model: Prefer Claude 4 via inference profile, then models with ON_DEMAND support
		if (modelIds.includes('claude-sonnet-4-20250514')) {
			recommendations.main = 'claude-sonnet-4-20250514';
		} else if (modelIds.includes('claude-3-5-sonnet-20240620')) {
			recommendations.main = 'claude-3-5-sonnet-20240620';
		} else if (modelIds.includes('claude-3-haiku-20240307')) {
			recommendations.main = 'claude-3-haiku-20240307';
		} else if (modelIds.includes('claude-3-sonnet-20240229')) {
			recommendations.main = 'claude-3-sonnet-20240229';
		} else if (modelIds.includes('claude-v2-1')) {
			recommendations.main = 'claude-v2-1';
		} else if (modelIds.includes('claude-v2')) {
			recommendations.main = 'claude-v2';
		} else if (modelIds.includes('claude-3-5-sonnet-20241022')) {
			recommendations.main = 'claude-3-5-sonnet-20241022';
		} else if (sortedByPerformance.length > 0) {
			recommendations.main = sortedByPerformance[0].modelId;
		}

		// Research model: Prefer ON_DEMAND models, then performance
		// Start with models that work immediately
		if (
			modelIds.includes('claude-3-5-sonnet-20240620') &&
			recommendations.main !== 'claude-3-5-sonnet-20240620'
		) {
			recommendations.research = 'claude-3-5-sonnet-20240620';
		} else if (modelIds.includes('claude-3-opus-20240229')) {
			recommendations.research = 'claude-3-opus-20240229';
		} else if (
			modelIds.includes('claude-3-sonnet-20240229') &&
			recommendations.main !== 'claude-3-sonnet-20240229'
		) {
			recommendations.research = 'claude-3-sonnet-20240229';
		} else if (
			modelIds.includes('claude-v2-1') &&
			recommendations.main !== 'claude-v2-1'
		) {
			recommendations.research = 'claude-v2-1';
		} else if (
			modelIds.includes('claude-v2') &&
			recommendations.main !== 'claude-v2'
		) {
			recommendations.research = 'claude-v2';
		} else if (
			recommendations.main &&
			modelIds.includes('claude-sonnet-4-20250514')
		) {
			// If we didn't use Claude Sonnet 4 for main, use it for research
			recommendations.research = 'claude-sonnet-4-20250514';
		} else if (sortedByPerformance.length > 0) {
			// Use the best performing model that's not already the main model
			const researchModel = sortedByPerformance.find(
				(m) => m.modelId !== recommendations.main
			);
			recommendations.research = researchModel?.modelId || recommendations.main;
		}

		// Fallback model: Most cost-effective but still capable
		if (modelIds.includes('claude-3-haiku-20240307')) {
			recommendations.fallback = 'claude-3-haiku-20240307';
		} else if (modelIds.includes('claude-v2-1')) {
			recommendations.fallback = 'claude-v2-1';
		} else if (modelIds.includes('claude-v2')) {
			recommendations.fallback = 'claude-v2';
		} else if (sortedByCost.length > 0) {
			recommendations.fallback = sortedByCost[0].modelId;
		}

		return recommendations;
	}

	/**
	 * Get fallback recommendations when detection fails
	 */
	private getFallbackRecommendations(
		result: AutoDetectResult
	): AutoDetectResult {
		// Use models that support ON_DEMAND access by default, with Claude v2 as backup
		result.recommendations = {
			main: 'claude-v2-1',
			research: 'claude-v2-1',
			fallback: 'claude-v2'
		};

		return result;
	}

	/**
	 * Test specific model availability
	 */
	async testModelAvailability(modelId: BedrockModelId): Promise<boolean> {
		try {
			const modelInfo = BEDROCK_MODELS[modelId];
			if (!modelInfo) return false;

			const awsModels = await this.listAvailableModels();
			return awsModels.some((m) => m.modelId === modelInfo.id);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Test actual model access by making a real API call
	 * This checks if the user has invoke permissions, not just list permissions
	 */
	async testModelAccess(modelId: BedrockModelId): Promise<boolean> {
		try {
			const modelInfo = BEDROCK_MODELS[modelId];
			if (!modelInfo) return false;

			const client = await this.initializeClient();
			if (!client) return false;

			// Import BedrockRuntimeClient for actual model invocation
			const { BedrockRuntimeClient, InvokeModelCommand } = await import(
				'@aws-sdk/client-bedrock-runtime'
			);

			const runtimeClient = new BedrockRuntimeClient({
				region: this.config.region,
				credentials: client.config.credentials
			});

			// Make a minimal test request
			const testRequest = {
				anthropic_version: 'bedrock-2023-05-31',
				max_tokens: 10,
				messages: [{ role: 'user', content: 'Hi' }]
			};

			const command = new InvokeModelCommand({
				modelId: modelInfo.id,
				contentType: 'application/json',
				accept: 'application/json',
				body: JSON.stringify(testRequest)
			});

			await runtimeClient.send(command);
			return true;
		} catch (error) {
			// Check if it's an access error vs other errors
			const errorMessage =
				error instanceof Error ? error.message.toLowerCase() : '';
			if (
				errorMessage.includes('access denied') ||
				errorMessage.includes("don't have access") ||
				errorMessage.includes("on-demand throughput isn't supported") ||
				errorMessage.includes('inference profile')
			) {
				return false;
			}
			// For other errors (like throttling), assume the model is accessible
			return true;
		}
	}

	/**
	 * Get actually accessible models by testing invoke permissions
	 */
	async getAccessibleModels(): Promise<DetectedModel[]> {
		const result = await this.detectModels();
		if (!result.hasCredentials || result.available.length === 0) {
			return [];
		}

		const accessibleModels: DetectedModel[] = [];

		// Test each available model for actual access
		for (const model of result.available) {
			const hasAccess = await this.testModelAccess(model.modelId);
			if (hasAccess) {
				accessibleModels.push({
					...model,
					isAvailable: true
				});
			}
		}

		return accessibleModels;
	}

	/**
	 * Get region-specific model availability
	 */
	async getRegionalAvailability(
		regions: string[]
	): Promise<Map<string, DetectedModel[]>> {
		const regionalAvailability = new Map<string, DetectedModel[]>();

		for (const region of regions) {
			const detector = new BedrockAutoDetect({ ...this.config, region });
			const result = await detector.detectModels();
			regionalAvailability.set(region, result.available);
		}

		return regionalAvailability;
	}

	/**
	 * Quick setup helper - detects and returns best configuration
	 */
	static async quickSetup(config?: BedrockClientConfig): Promise<{
		mainModel: BedrockModelId | null;
		researchModel: BedrockModelId | null;
		fallbackModel: BedrockModelId | null;
		region: string;
		hasCredentials: boolean;
		availableModels: string[];
		error?: string;
	}> {
		const detector = new BedrockAutoDetect(config);
		const result = await detector.detectModels();

		return {
			mainModel: result.recommendations.main,
			researchModel: result.recommendations.research,
			fallbackModel: result.recommendations.fallback,
			region: config?.region || process.env.AWS_REGION || 'us-east-1',
			hasCredentials: result.hasCredentials,
			availableModels: result.available.map((m) => m.modelId),
			error: result.error
		};
	}
}

export default BedrockAutoDetect;
