/**
 * AWS Bedrock Client for Claude Model Integration
 * Provides TypeScript-first interface for AWS Bedrock with Claude models
 */

import {
	BedrockRuntimeClient,
	InvokeModelCommand,
	InvokeModelWithResponseStreamCommand,
	BedrockRuntimeClientConfig
} from '@aws-sdk/client-bedrock-runtime';
import { fromIni } from '@aws-sdk/credential-providers';
import { z } from 'zod';

// Claude model definitions
export const CLAUDE_MODELS = {
	// Claude 4 Models - Latest and most capable
	'claude-opus-4-20250514': {
		id: 'anthropic.claude-opus-4-20250514-v1:0',
		name: 'Claude Opus 4',
		maxTokens: 8192,
		contextWindow: 200000,
		inputCostPer1K: 0.075,
		outputCostPer1K: 0.375
	},
	'claude-sonnet-4-20250514': {
		id: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
		name: 'Claude Sonnet 4 (Inference Profile)',
		maxTokens: 8192,
		contextWindow: 200000,
		inputCostPer1K: 0.015,
		outputCostPer1K: 0.075
	},

	// Claude 3.7 Sonnet
	'claude-3-7-sonnet-20250219': {
		id: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
		name: 'Claude 3.7 Sonnet',
		maxTokens: 8192,
		contextWindow: 200000,
		inputCostPer1K: 0.003,
		outputCostPer1K: 0.015
	},

	// Claude 3.5 Sonnet
	'claude-3-5-sonnet-20241022': {
		id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
		name: 'Claude 3.5 Sonnet',
		maxTokens: 8192,
		contextWindow: 200000,
		inputCostPer1K: 0.003,
		outputCostPer1K: 0.015
	},
	'claude-3-5-sonnet-20240620': {
		id: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
		name: 'Claude 3.5 Sonnet (June)',
		maxTokens: 8192,
		contextWindow: 200000,
		inputCostPer1K: 0.003,
		outputCostPer1K: 0.015
	},
	'claude-3-5-haiku-20241022': {
		id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
		name: 'Claude 3.5 Haiku',
		maxTokens: 8192,
		contextWindow: 200000,
		inputCostPer1K: 0.0008,
		outputCostPer1K: 0.004
	},

	// Claude 3 Opus
	'claude-3-opus-20240229': {
		id: 'anthropic.claude-3-opus-20240229-v1:0',
		name: 'Claude 3 Opus',
		maxTokens: 4096,
		contextWindow: 200000,
		inputCostPer1K: 0.015,
		outputCostPer1K: 0.075
	},

	// Claude 3 Sonnet
	'claude-3-sonnet-20240229': {
		id: 'anthropic.claude-3-sonnet-20240229-v1:0',
		name: 'Claude 3 Sonnet',
		maxTokens: 8192,
		contextWindow: 200000,
		inputCostPer1K: 0.003,
		outputCostPer1K: 0.015
	},

	// Claude 3 Haiku
	'claude-3-haiku-20240307': {
		id: 'anthropic.claude-3-haiku-20240307-v1:0',
		name: 'Claude 3 Haiku',
		maxTokens: 4096,
		contextWindow: 200000,
		inputCostPer1K: 0.00025,
		outputCostPer1K: 0.00125
	},

	// Claude v2 Models
	'claude-v2': {
		id: 'anthropic.claude-v2',
		name: 'Claude v2',
		maxTokens: 4096,
		contextWindow: 100000,
		inputCostPer1K: 0.008,
		outputCostPer1K: 0.024
	},
	'claude-v2-1': {
		id: 'anthropic.claude-v2:1',
		name: 'Claude v2.1',
		maxTokens: 4096,
		contextWindow: 200000,
		inputCostPer1K: 0.008,
		outputCostPer1K: 0.024
	},

	// Claude Instant (Legacy)
	'claude-instant-v1': {
		id: 'anthropic.claude-instant-v1',
		name: 'Claude Instant v1',
		maxTokens: 4096,
		contextWindow: 100000,
		inputCostPer1K: 0.0008,
		outputCostPer1K: 0.0024
	}
} as const;

export type ClaudeModelId = keyof typeof CLAUDE_MODELS;

// Message schemas
const MessageSchema = z.object({
	role: z.enum(['user', 'assistant']),
	content: z.string()
});

const BedrockRequestSchema = z.object({
	anthropic_version: z.string().default('bedrock-2023-05-31'),
	max_tokens: z.number().min(1).max(200000),
	messages: z.array(MessageSchema),
	temperature: z.number().min(0).max(1).optional(),
	top_p: z.number().min(0).max(1).optional(),
	top_k: z.number().min(1).max(500).optional(),
	stop_sequences: z.array(z.string()).optional(),
	system: z.string().optional()
});

const BedrockResponseSchema = z.object({
	id: z.string(),
	type: z.literal('message'),
	role: z.literal('assistant'),
	content: z.array(
		z.object({
			type: z.literal('text'),
			text: z.string()
		})
	),
	model: z.string(),
	stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence']),
	stop_sequence: z.string().nullable().optional(),
	usage: z.object({
		input_tokens: z.number(),
		output_tokens: z.number()
	})
});

export type Message = z.infer<typeof MessageSchema>;
export type BedrockRequest = z.infer<typeof BedrockRequestSchema>;
export type BedrockResponse = z.infer<typeof BedrockResponseSchema>;

export interface BedrockClientConfig {
	region?: string;
	profile?: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	sessionToken?: string;
	endpoint?: string;
	maxRetries?: number;
	timeout?: number;
	retryDelay?: number;
	exponentialBackoff?: boolean;
}

export interface GenerateTextOptions {
	model: ClaudeModelId;
	messages: Message[];
	system?: string;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
	topK?: number;
	stopSequences?: string[];
}

export interface GenerateObjectOptions<T> extends GenerateTextOptions {
	schema: z.ZodSchema<T>;
	objectName?: string;
}

export interface StreamOptions extends GenerateTextOptions {
	onChunk?: (chunk: string) => void;
	onComplete?: (fullText: string) => void;
	onError?: (error: Error) => void;
}

export interface UsageMetrics {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	estimatedCost: number;
}

export interface GenerationResult {
	text: string;
	usage: UsageMetrics;
	model: string;
	stopReason: string;
	id: string;
}

export interface ObjectGenerationResult<T> extends GenerationResult {
	object: T;
}

export class BedrockClientError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
		public readonly statusCode?: number,
		public readonly modelId?: string
	) {
		super(message);
		this.name = 'BedrockClientError';
	}
}

export class BedrockClient {
	private client: BedrockRuntimeClient;
	private config: BedrockClientConfig;

	constructor(config: BedrockClientConfig = {}) {
		this.config = {
			region: 'us-east-1',
			maxRetries: 3,
			timeout: 120000, // 2 minutes
			retryDelay: 1000, // 1 second base delay
			exponentialBackoff: true,
			...config
		};

		const clientConfig: BedrockRuntimeClientConfig = {
			region: this.config.region,
			maxAttempts: this.config.maxRetries
		};

		// Set up credentials
		let credentials;
		if (this.config.accessKeyId && this.config.secretAccessKey) {
			credentials = {
				accessKeyId: this.config.accessKeyId,
				secretAccessKey: this.config.secretAccessKey,
				sessionToken: this.config.sessionToken
			};
		} else {
			credentials = fromIni({ profile: this.config.profile });
		}

		if (this.config.endpoint) {
			clientConfig.endpoint = this.config.endpoint;
		}

		this.client = new BedrockRuntimeClient(clientConfig);
	}

	/**
	 * List available Claude models
	 */
	static getAvailableModels(): Array<{
		id: ClaudeModelId;
		name: string;
		maxTokens: number;
		contextWindow: number;
		inputCostPer1K: number;
		outputCostPer1K: number;
	}> {
		return Object.entries(CLAUDE_MODELS).map(([key, model]) => ({
			id: key as ClaudeModelId,
			name: model.name,
			maxTokens: model.maxTokens,
			contextWindow: model.contextWindow,
			inputCostPer1K: model.inputCostPer1K,
			outputCostPer1K: model.outputCostPer1K
		}));
	}

	/**
	 * Validate model ID
	 */
	static validateModel(modelId: string): modelId is ClaudeModelId {
		return modelId in CLAUDE_MODELS;
	}

	/**
	 * Generate text using Claude model
	 */
	async generateText(options: GenerateTextOptions): Promise<GenerationResult> {
		const {
			model,
			messages,
			system,
			maxTokens,
			temperature,
			topP,
			topK,
			stopSequences
		} = options;

		if (!BedrockClient.validateModel(model)) {
			throw new BedrockClientError(
				`Invalid model ID: ${model}`,
				'INVALID_MODEL'
			);
		}

		const modelConfig = CLAUDE_MODELS[model];
		const requestTokens = maxTokens || Math.min(4096, modelConfig.maxTokens);

		const request: BedrockRequest = {
			anthropic_version: 'bedrock-2023-05-31',
			max_tokens: requestTokens,
			messages,
			...(system && { system }),
			...(temperature !== undefined && { temperature }),
			...(topP !== undefined && { top_p: topP }),
			...(topK !== undefined && { top_k: topK }),
			...(stopSequences && { stop_sequences: stopSequences })
		};

		// Validate request
		const validatedRequest = BedrockRequestSchema.parse(request);

		return this.withRetry(async () => {
			const command = new InvokeModelCommand({
				modelId: modelConfig.id,
				contentType: 'application/json',
				accept: 'application/json',
				body: JSON.stringify(validatedRequest)
			});

			const response = await this.client.send(command);

			if (!response.body) {
				throw new BedrockClientError('Empty response body', 'EMPTY_RESPONSE');
			}

			const responseText = new TextDecoder().decode(response.body);
			const responseData = JSON.parse(responseText);

			// Validate response
			const validatedResponse = BedrockResponseSchema.parse(responseData);

			const text = validatedResponse.content[0]?.text || '';
			const usage = this.calculateUsage(validatedResponse.usage, modelConfig);

			return {
				text,
				usage,
				model: validatedResponse.model,
				stopReason: validatedResponse.stop_reason,
				id: validatedResponse.id
			};
		}, `Generate text with model ${model}`);
	}

	/**
	 * Generate structured object using JSON schema
	 */
	async generateObject<T>(
		options: GenerateObjectOptions<T>
	): Promise<ObjectGenerationResult<T>> {
		const { schema, objectName = 'object', ...textOptions } = options;

		// Create system prompt for JSON generation
		const systemPrompt = `You must respond with valid JSON that matches this schema. ${
			textOptions.system ? `\n\nAdditional context: ${textOptions.system}` : ''
		}

Return only valid JSON for the ${objectName}. Do not include any explanations or additional text.

Schema requirements:
- Must be valid JSON
- Must match the expected structure exactly
- All required fields must be present`;

		const result = await this.generateText({
			...textOptions,
			system: systemPrompt
		});

		try {
			// Extract JSON from response (handle potential markdown formatting)
			let jsonText = result.text.trim();

			// Remove markdown code blocks if present
			if (jsonText.startsWith('```json')) {
				jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
			} else if (jsonText.startsWith('```')) {
				jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
			}

			const parsedObject = JSON.parse(jsonText);
			const validatedObject = schema.parse(parsedObject);

			return {
				...result,
				object: validatedObject
			};
		} catch (parseError) {
			throw new BedrockClientError(
				`Failed to parse JSON response: ${parseError instanceof Error ? (parseError as Error).message : 'Unknown error'}`,
				'JSON_PARSE_ERROR'
			);
		}
	}

	/**
	 * Stream text generation
	 */
	async streamText(options: StreamOptions): Promise<GenerationResult> {
		const { model, onChunk, onComplete, onError, ...generateOptions } = options;

		if (!BedrockClient.validateModel(model)) {
			throw new BedrockClientError(
				`Invalid model ID: ${model}`,
				'INVALID_MODEL'
			);
		}

		const modelConfig = CLAUDE_MODELS[model];
		const requestTokens =
			generateOptions.maxTokens || Math.min(4096, modelConfig.maxTokens);

		const request: BedrockRequest = {
			anthropic_version: 'bedrock-2023-05-31',
			max_tokens: requestTokens,
			messages: generateOptions.messages,
			...(generateOptions.system && { system: generateOptions.system }),
			...(generateOptions.temperature !== undefined && {
				temperature: generateOptions.temperature
			}),
			...(generateOptions.topP !== undefined && {
				top_p: generateOptions.topP
			}),
			...(generateOptions.topK !== undefined && {
				top_k: generateOptions.topK
			}),
			...(generateOptions.stopSequences && {
				stop_sequences: generateOptions.stopSequences
			})
		};

		const validatedRequest = BedrockRequestSchema.parse(request);

		try {
			const command = new InvokeModelWithResponseStreamCommand({
				modelId: modelConfig.id,
				contentType: 'application/json',
				accept: 'application/json',
				body: JSON.stringify(validatedRequest)
			});

			const response = await this.client.send(command);

			if (!response.body) {
				throw new BedrockClientError('Empty response body', 'EMPTY_RESPONSE');
			}

			let fullText = '';
			let finalUsage: UsageMetrics | null = null;
			let finalId = '';
			let finalStopReason = '';

			for await (const chunk of response.body) {
				if (chunk.chunk?.bytes) {
					const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
					const chunkData = JSON.parse(chunkText);

					if (
						chunkData.type === 'content_block_delta' &&
						chunkData.delta?.text
					) {
						const deltaText = chunkData.delta.text;
						fullText += deltaText;
						onChunk?.(deltaText);
					} else if (chunkData.type === 'message_stop') {
						// Final message data
						if (chunkData.usage) {
							finalUsage = this.calculateUsage(chunkData.usage, modelConfig);
						}
						finalStopReason = chunkData.stop_reason || 'end_turn';
					}
				}
			}

			const result: GenerationResult = {
				text: fullText,
				usage: finalUsage || {
					inputTokens: 0,
					outputTokens: 0,
					totalTokens: 0,
					estimatedCost: 0
				},
				model: modelConfig.id,
				stopReason: finalStopReason,
				id: finalId
			};

			onComplete?.(fullText);
			return result;
		} catch (error) {
			const bedrockError =
				error instanceof BedrockClientError
					? error
					: new BedrockClientError(
							`Streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`,
							'STREAMING_ERROR'
						);

			onError?.(bedrockError);
			throw bedrockError;
		}
	}

	/**
	 * Test connection to Bedrock
	 */
	async testConnection(modelId?: ClaudeModelId): Promise<boolean> {
		try {
			// Use provided model or fallback to a commonly available one
			const testModel = modelId || 'claude-instant-v1';

			const result = await this.generateText({
				model: testModel,
				messages: [{ role: 'user', content: 'Hello' }],
				maxTokens: 10
			});

			return Boolean(result.text);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Test access to a specific model by making a minimal API call
	 */
	async testModelAccess(modelId: ClaudeModelId): Promise<boolean> {
		try {
			const modelInfo = CLAUDE_MODELS[modelId];
			if (!modelInfo) return false;

			const request: BedrockRequest = {
				anthropic_version: 'bedrock-2023-05-31',
				max_tokens: 10,
				messages: [{ role: 'user', content: 'Hi' }]
			};

			const command = new InvokeModelCommand({
				modelId: modelInfo.id,
				contentType: 'application/json',
				accept: 'application/json',
				body: JSON.stringify(request)
			});

			await this.client.send(command);
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
	 * Get accessible models by testing each one
	 */
	async getAccessibleModels(): Promise<ClaudeModelId[]> {
		const accessibleModels: ClaudeModelId[] = [];

		// Test each model for access
		for (const modelId of Object.keys(CLAUDE_MODELS) as ClaudeModelId[]) {
			const hasAccess = await this.testModelAccess(modelId);
			if (hasAccess) {
				accessibleModels.push(modelId);
			}
		}

		return accessibleModels;
	}

	/**
	 * Get the best available model for a given use case
	 */
	async getBestAvailableModel(
		preference: 'performance' | 'cost' | 'balanced' = 'balanced'
	): Promise<ClaudeModelId | null> {
		const accessibleModels = await this.getAccessibleModels();

		if (accessibleModels.length === 0) {
			return null;
		}

		// Sort models based on preference
		const sortedModels = accessibleModels.sort((a, b) => {
			const modelA = CLAUDE_MODELS[a];
			const modelB = CLAUDE_MODELS[b];

			switch (preference) {
				case 'performance':
					// Prefer newer models and higher max tokens
					if (a.includes('claude-4') && !b.includes('claude-4')) return -1;
					if (!a.includes('claude-4') && b.includes('claude-4')) return 1;
					return modelB.maxTokens - modelA.maxTokens;

				case 'cost':
					// Prefer lower cost models
					return modelA.outputCostPer1K - modelB.outputCostPer1K;

				case 'balanced':
				default:
					// Prefer models with good performance/cost ratio
					const ratioA = modelA.maxTokens / modelA.outputCostPer1K;
					const ratioB = modelB.maxTokens / modelB.outputCostPer1K;
					return ratioB - ratioA;
			}
		});

		return sortedModels[0];
	}

	/**
	 * Generate text with automatic fallback to accessible models
	 */
	async generateTextWithFallback(
		options: GenerateTextOptions
	): Promise<GenerationResult> {
		// First try the requested model
		try {
			return await this.generateText(options);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message.toLowerCase() : '';

			// If it's an access error, try to find an alternative
			if (
				errorMessage.includes('access denied') ||
				errorMessage.includes("don't have access") ||
				errorMessage.includes("on-demand throughput isn't supported") ||
				errorMessage.includes('inference profile')
			) {
				console.log(
					`Model ${options.model} not accessible, trying alternatives...`
				);

				// Get accessible models
				const accessibleModels = await this.getAccessibleModels();

				if (accessibleModels.length === 0) {
					throw new BedrockClientError(
						'No accessible Claude models found. Please check your AWS Bedrock permissions.',
						'NO_ACCESSIBLE_MODELS'
					);
				}

				// Try the best available model
				const fallbackModel = await this.getBestAvailableModel('balanced');
				if (fallbackModel) {
					console.log(`Using fallback model: ${fallbackModel}`);
					return await this.generateText({
						...options,
						model: fallbackModel
					});
				}
			}

			// Re-throw the original error if we can't find a fallback
			throw error;
		}
	}

	/**
	 * Retry wrapper with exponential backoff
	 */
	private async withRetry<T>(
		operation: () => Promise<T>,
		operationName: string
	): Promise<T> {
		let lastError: Error;

		for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;

				// Don't retry on certain errors
				if (this.isNonRetryableError(error)) {
					throw new BedrockClientError(
						`${operationName} failed: ${lastError.message}`,
						'NON_RETRYABLE_ERROR',
						undefined,
						undefined
					);
				}

				// If this was the last attempt, throw the error
				if (attempt === this.config.maxRetries) {
					throw new BedrockClientError(
						`${operationName} failed after ${this.config.maxRetries} attempts: ${lastError.message}`,
						'MAX_RETRIES_EXCEEDED',
						undefined,
						undefined
					);
				}

				// Calculate delay for next attempt
				const baseDelay = this.config.retryDelay!;
				const delay = this.config.exponentialBackoff
					? baseDelay * Math.pow(2, attempt - 1)
					: baseDelay;

				// Add jitter to avoid thundering herd
				const jitter = Math.random() * 0.1 * delay;
				const totalDelay = delay + jitter;

				console.warn(
					`${operationName} attempt ${attempt} failed: ${lastError.message}. Retrying in ${Math.round(totalDelay)}ms...`
				);

				// Wait before next attempt
				await new Promise((resolve) => setTimeout(resolve, totalDelay));
			}
		}

		throw lastError!;
	}

	/**
	 * Check if error should not be retried
	 */
	private isNonRetryableError(error: unknown): boolean {
		if (error instanceof Error) {
			const message = error.message.toLowerCase();

			// Authentication/authorization errors
			if (
				message.includes('unauthorized') ||
				message.includes('forbidden') ||
				message.includes('access denied') ||
				message.includes('invalid credentials')
			) {
				return true;
			}

			// Invalid input errors
			if (
				message.includes('validation') ||
				message.includes('invalid') ||
				message.includes('malformed')
			) {
				return true;
			}

			// Model not found or unavailable
			if (
				message.includes('model not found') ||
				message.includes('model not available') ||
				message.includes("don't have access to the model") ||
				message.includes("on-demand throughput isn't supported") ||
				message.includes('inference profile')
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Calculate usage metrics and costs
	 */
	private calculateUsage(
		usage: { input_tokens?: number; output_tokens?: number },
		modelConfig: (typeof CLAUDE_MODELS)[ClaudeModelId]
	): UsageMetrics {
		const inputTokens = usage.input_tokens || 0;
		const outputTokens = usage.output_tokens || 0;
		const inputCost = (inputTokens / 1000) * modelConfig.inputCostPer1K;
		const outputCost = (outputTokens / 1000) * modelConfig.outputCostPer1K;

		return {
			inputTokens,
			outputTokens,
			totalTokens: inputTokens + outputTokens,
			estimatedCost: inputCost + outputCost
		};
	}

	/**
	 * Create a chat completion helper
	 */
	async chat(options: {
		model: ClaudeModelId;
		messages: Message[];
		system?: string;
		maxTokens?: number;
		temperature?: number;
	}): Promise<string> {
		const result = await this.generateText(options);
		return result.text;
	}

	/**
	 * Get model information
	 */
	static getModelInfo(modelId: ClaudeModelId) {
		return CLAUDE_MODELS[modelId];
	}

	/**
	 * Estimate cost for a request
	 */
	static estimateCost(
		modelId: ClaudeModelId,
		inputTokens: number,
		outputTokens: number
	): number {
		const model = CLAUDE_MODELS[modelId];
		const inputCost = (inputTokens / 1000) * model.inputCostPer1K;
		const outputCost = (outputTokens / 1000) * model.outputCostPer1K;
		return inputCost + outputCost;
	}

	/**
	 * Count tokens (approximate)
	 */
	static estimateTokens(text: string): number {
		// Rough approximation: ~4 characters per token for English text
		return Math.ceil(text.length / 4);
	}

	/**
	 * Get default model configuration based on Claude Code documentation
	 */
	static getDefaultModels() {
		return {
			// Use environment variables if set, otherwise fall back to defaults
			// For Bedrock, we need to convert from Claude Code model names to Bedrock model IDs
			primary: process.env.ANTHROPIC_MODEL ? 
				BedrockClient.convertModelNameToBedrockId(process.env.ANTHROPIC_MODEL) : 
				'claude-3-5-sonnet-20241022',
			smallFast: process.env.ANTHROPIC_SMALL_FAST_MODEL ? 
				BedrockClient.convertModelNameToBedrockId(process.env.ANTHROPIC_SMALL_FAST_MODEL) : 
				'claude-3-5-haiku-20241022'
		};
	}

	/**
	 * Convert Claude Code model names to Bedrock model IDs
	 */
	static convertModelNameToBedrockId(modelName: string): ClaudeModelId {
		// Handle both quoted and unquoted model names
		const cleanModelName = modelName.replace(/['"]/g, '');
		
		// If it's already a Bedrock model ID or our internal key, return as-is
		if (cleanModelName in CLAUDE_MODELS) {
			return cleanModelName as ClaudeModelId;
		}
		
		// Handle Bedrock inference profile format (e.g., us.anthropic.claude-opus-4-20250514-v1:0)
		if (cleanModelName.includes('anthropic.claude') || cleanModelName.includes('us.anthropic.claude')) {
			// Extract the model part from the Bedrock ARN/ID
			const modelMatch = cleanModelName.match(/claude-([^-]+)-([^-]+)-([^-:]+)/);
			if (modelMatch) {
				const [, tier, version, date] = modelMatch;
				const modelKey = `claude-${tier}-${version}-${date}`;
				if (modelKey in CLAUDE_MODELS) {
					return modelKey as ClaudeModelId;
				}
			}
		}
		
		// Default fallback
		console.warn(`Unknown model name: ${cleanModelName}, falling back to claude-3-5-sonnet-20241022`);
		return 'claude-3-5-sonnet-20241022';
	}
}

// Export for convenience
export { z };
export default BedrockClient;
