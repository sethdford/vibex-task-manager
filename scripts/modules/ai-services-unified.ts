/**
 * ai-services-unified.js
 * Centralized AI service layer using provider modules and config-manager.
 */

export interface AIServiceResponse {
	mainResult: string | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	telemetryData: Record<string, any> | null;
}

// --- Core Dependencies ---
import {
	getMainProvider,
	getMainModelId,
	getResearchProvider,
	getResearchModelId,
	getFallbackProvider,
	getFallbackModelId,
	getParametersForRole,
	getUserId,
	MODEL_MAP,
	getDebugFlag,
	getBaseUrlForRole,
	isApiKeySet,
	getBedrockBaseURL
} from './config-manager.js';
import { log, findProjectRoot, resolveEnvVariable } from './utils.js';

// Import provider classes
import { BedrockAIProvider } from '../../src/ai-providers/index.js';

// --- Type Definitions ---
interface Provider {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	generateText(params: any): Promise<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	streamText(params: any): Promise<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	generateObject(params: any): Promise<any>;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// --- Provider Instances ---
const PROVIDERS: { [key: string]: Provider } = {
	bedrock: new BedrockAIProvider()
};

// Helper function to get cost for a specific model
function _getCostForModel(providerName: string, modelId: string | null) {
	if (!modelId) return { inputCost: 0, outputCost: 0, currency: 'USD' };

	const providerMap = MODEL_MAP[providerName as keyof typeof MODEL_MAP];
	if (!providerMap) {
		log('warn', `Provider "${providerName}" not found. Cannot determine cost.`);
		return { inputCost: 0, outputCost: 0, currency: 'USD' };
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const modelData = providerMap.find((m: any) => m.id === modelId);
	if (!modelData || !modelData.cost_per_1m_tokens) {
		log('debug', `Cost data not found for "${modelId}". Assuming zero cost.`);
		return { inputCost: 0, outputCost: 0, currency: 'USD' };
	}

	const { input = 0, output = 0, currency = 'USD' } = modelData.cost_per_1m_tokens;
	return { inputCost: input, outputCost: output, currency };
}

// --- Configuration for Retries ---
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;

// Helper function to check if an error is retryable
function isRetryableError(error: unknown): boolean {
	if (error instanceof Error) {
		const errorMessage = error.message?.toLowerCase() || '';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const status = (error as any).status;
		return (
			errorMessage.includes('rate limit') ||
			errorMessage.includes('overloaded') ||
			errorMessage.includes('service temporarily unavailable') ||
			errorMessage.includes('timeout') ||
			errorMessage.includes('network error') ||
			status === 429 ||
			status >= 500
		);
	}
	return false;
}

/**
 * Internal helper to resolve the API key for a given provider.
 * @param {string} providerName - The name of the provider (lowercase).
 * @param {object|null} session - Optional MCP session object.
 * @param {string|null} projectRoot - Optional project root path for .env fallback.
 * @returns {string|null} The API key or null if not found/needed.
 * @throws {Error} If a required API key is missing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _resolveApiKey(providerName: string, session: any, projectRoot: string | null = null) {
	const keyMap: { [key: string]: string } = {
		bedrock: 'AWS_ACCESS_KEY_ID'
		// Only Bedrock is supported
	};

	const envVarName = keyMap[providerName];
	if (!envVarName) {
		throw new Error(
			`Unknown provider '${providerName}' for API key resolution.`
		);
	}

	const apiKey = resolveEnvVariable(envVarName, session, projectRoot);

	// Special handling for providers that can use alternative auth
	if (providerName === 'bedrock') {
		return apiKey || null;
	}

	if (!apiKey) {
		throw new Error(
			`Required API key ${envVarName} for provider '${providerName}' is not set in environment, session, or .env file.`
		);
	}
	return apiKey;
}

/**
 * Internal helper to attempt a provider-specific AI API call with retries.
 *
 * @param {function} providerApiFn - The specific provider function to call (e.g., generateAnthropicText).
 * @param {object} callParams - Parameters object for the provider function.
 * @param {string} providerName - Name of the provider (for logging).
 * @param {string} modelId - Specific model ID (for logging).
 * @param {string} attemptRole - The role being attempted (for logging).
 * @returns {Promise<object>} The result from the successful API call.
 * @throws {Error} If the call fails after all retries.
 */
async function _attemptProviderCallWithRetries(
	provider: Provider,
	serviceType: keyof Provider,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callParams: any,
	providerName: string,
	modelId: string,
	attemptRole: string
) {
	let retries = 0;
	const fnName = serviceType;

	while (retries <= MAX_RETRIES) {
		try {
			if (getDebugFlag()) {
				log(
					'info',
					`Attempt ${retries + 1}/${MAX_RETRIES + 1} calling ${fnName} (Provider: ${providerName}, Model: ${modelId}, Role: ${attemptRole})`
				);
			}

			// Call the appropriate method on the provider instance
			const result = await provider[serviceType](callParams);

			if (getDebugFlag()) {
				log(
					'info',
					`${fnName} succeeded for role ${attemptRole} (Provider: ${providerName}) on attempt ${retries + 1}`
				);
			}
			return result;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'An unknown error occurred';
			log(
				'warn',
				`Attempt ${retries + 1} failed for role ${attemptRole} (${fnName} / ${providerName}): ${message}`
			);

			if (isRetryableError(error) && retries < MAX_RETRIES) {
				retries++;
				const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retries - 1);
				log(
					'info',
					`Something went wrong on the provider side. Retrying in ${delay / 1000}s...`
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				log(
					'error',
					`Something went wrong on the provider side. Max retries reached for role ${attemptRole} (${fnName} / ${providerName}).`
				);
				throw error; // Re-throw the original error
			}
		}
	}
	// Should not be reached due to throw in the else block
	throw new Error(
		`Exhausted all retries for role ${attemptRole} (${fnName} / ${providerName})`
	);
}

/**
 * Base logic for unified service functions.
 * @param {string} serviceType - Type of service ('generateText', 'streamText', 'generateObject').
 * @param {object} params - Original parameters passed to the service function.
 * @param {string} params.role - The initial client role.
 * @param {object} [params.session=null] - Optional MCP session object.
 * @param {string} [params.projectRoot] - Optional project root path.
 * @param {string} params.commandName - Name of the command invoking the service.
 * @param {string} params.outputType - 'cli' or 'mcp'.
 * @param {string} [params.systemPrompt] - Optional system prompt.
 * @param {string} [params.prompt] - The prompt for the AI.
 * @param {string} [params.schema] - The Zod schema for the expected object.
 * @param {string} [params.objectName] - Name for object/tool.
 * @returns {Promise<any>} Result from the underlying provider call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function _unifiedServiceRunner(serviceType: keyof Provider, params: any): Promise<AIServiceResponse | null> {
	const {
		role: initialRole,
		session,
		projectRoot,
		systemPrompt,
		prompt,
		schema,
		objectName,
		commandName,
		outputType,
		...restApiParams
	} = params;
	if (getDebugFlag()) {
		log('info', `${serviceType}Service called`, {
			role: initialRole,
			commandName,
			outputType
		});
	}

	const effectiveProjectRoot = projectRoot || findProjectRoot() || process.cwd();
	const userId = getUserId(effectiveProjectRoot);
	const telemetryPayloads: (Record<string, unknown> | null)[] = [];

	const attemptSequence = [
		{
			role: initialRole,
			getProvider:
				initialRole === 'research' ? getResearchProvider : getMainProvider,
			getModelId:
				initialRole === 'research' ? getResearchModelId : getMainModelId,
			getBaseUrl: getBaseUrlForRole
		}
	];

	// Only add fallback if it's different from the primary and research roles
	const mainProvider = getMainProvider();
	const researchProvider = getResearchProvider();
	const fallbackProvider = getFallbackProvider();
	const fallbackModelId = getFallbackModelId();

	if (
		fallbackProvider &&
		fallbackModelId &&
		fallbackProvider !== mainProvider &&
		fallbackProvider !== researchProvider
	) {
		attemptSequence.push({
			role: 'fallback',
				getProvider: (explicitRoot?: string | null) => getFallbackProvider(explicitRoot) || '',
	getModelId: (explicitRoot?: string | null) => getFallbackModelId(explicitRoot) || '',
			getBaseUrl: getBaseUrlForRole
		});
	}

	for (const attempt of attemptSequence) {
		const providerName = attempt.getProvider();
		const modelId = attempt.getModelId();
		const baseUrl = attempt.getBaseUrl(attempt.role, effectiveProjectRoot);

		if (!providerName || !modelId) {
			log(
				'debug',
				`Skipping attempt for role '${attempt.role}' because provider or model is not configured.`
			);
			continue;
		}

		// For Bedrock, we don't check API keys but rely on AWS credential resolution
		if (providerName?.toLowerCase() !== 'bedrock') {
			if (!isApiKeySet(providerName, session, effectiveProjectRoot)) {
				log(
					'warn',
					`Skipping attempt for role '${attempt.role}' (${providerName}) due to missing API key.`
				);
				continue;
			}
		} else {
			// For Bedrock, log that we're using AWS credentials
			log('debug', `Using AWS credentials for Bedrock provider (role: ${attempt.role})`);
		}

		try {
			const provider = PROVIDERS[providerName];
			if (!provider) {
				throw new Error(`Provider implementation for '${providerName}' not found.`);
			}

			const messages: Message[] = [];
			if (systemPrompt) {
				messages.push({ role: 'system', content: systemPrompt });
			}
			if (prompt) {
				messages.push({ role: 'user', content: prompt });
			}

			const callParams = {
				...restApiParams,
				model: modelId,
				messages: messages,
				...(baseUrl && { baseURL: baseUrl }),
				...(schema && { schema: schema }),
				...(objectName && { objectName: objectName })
			};

			const result = await _attemptProviderCallWithRetries(
				provider,
				serviceType,
				callParams,
				providerName,
				modelId,
				attempt.role
			);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { text: mainResult = null, usage = {} } = (result || {}) as any;
			const { inputTokens = 0, outputTokens = 0 } = usage;

			if (userId) {
				const telemetryData = await logAiUsage({
					userId,
					commandName,
					providerName,
					modelId,
					inputTokens,
					outputTokens,
					outputType
				});
				telemetryPayloads.push(telemetryData);
			} else {
				log('debug', 'Skipping telemetry logging because no user ID was found.');
			}


			if (getDebugFlag()) {
				log('info', `Successfully executed ${serviceType} with role '${attempt.role}'`, { result, telemetryData: telemetryPayloads[telemetryPayloads.length - 1] });
			}

			return { mainResult, telemetryData: telemetryPayloads.length > 0 ? telemetryPayloads[telemetryPayloads.length -1] : null };
		} catch (error) {
			log(
				'error',
				`Service call failed for role '${attempt.role}' with provider '${providerName}'.`,
				error instanceof Error ? error.message : String(error)
			);
			// Don't re-throw here; loop to the next provider (fallback)
		}
	}

	log(
		'error',
		`All configured AI providers (${attemptSequence.map((a) => a.role).join(', ')}) failed for ${serviceType}.`
	);
	return null;
}

/**
 * Generates text using the configured AI services, with fallback logic.
 *
 * @param {object} params - The parameters for the text generation.
 * @param {'main'|'research'} params.role - The primary role to use ('main' or 'research').
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.systemPrompt] - An optional system prompt.
 * @param {object} [params.session=null] - Optional MCP session object.
 * @param {string} [params.projectRoot=null] - Optional project root path.
 * @param {string} params.commandName - Name of the command for telemetry.
 * @param {'cli'|'mcp'} params.outputType - Output type for telemetry.
 * @returns {Promise<AIServiceResponse|null>} An object containing the main result and telemetry data, or null if all services fail.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateTextService(params: any): Promise<AIServiceResponse | null> {
	return _unifiedServiceRunner('generateText', params);
}

/**
 * Streams text using the configured AI services, with fallback logic.
 * Note: Streaming results are handled by the provider and not returned directly here.
 *
 * @param {object} params - The parameters for the text streaming.
 * @param {'main'|'research'} params.role - The primary role to use.
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.systemPrompt] - An optional system prompt.
 * @param {object} [params.session=null] - Optional MCP session object.
 * @param {string} [params.projectRoot=null] - Optional project root path.
 * @param {string} params.commandName - Name of the command for telemetry.
 * @param {'cli'|'mcp'} params.outputType - Output type for telemetry.
 * @returns {Promise<AIServiceResponse|null>} An object containing telemetry data, or null if all services fail. The mainResult will be null for streams.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function streamTextService(params: any): Promise<AIServiceResponse | null> {
	return _unifiedServiceRunner('streamText', params);
}

/**
 * Generates a structured object using the configured AI services, with fallback logic.
 *
 * @param {object} params - The parameters for the object generation.
 * @param {'main'|'research'} params.role - The primary role to use.
 * @param {string} params.prompt - The user prompt.
 * @param {string} [params.systemPrompt] - An optional system prompt.
 * @param {z.ZodSchema<T>} params.schema - The Zod schema for the expected object.
 * @param {string} params.objectName - A name for the object/tool being generated.
 * @param {object} [params.session=null] - Optional MCP session object.
 * @param {string} [params.projectRoot=null] - Optional project root path.
 * @param {string} params.commandName - Name of the command for telemetry.
 * @param {'cli'|'mcp'} params.outputType - Output type for telemetry.
 * @returns {Promise<AIServiceResponse|null>} An object containing the generated object in mainResult and telemetry data, or null if all services fail.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateObjectService(params: any): Promise<AIServiceResponse | null> {
	return _unifiedServiceRunner('generateObject', params);
}

/**
 * Logs AI usage and calculates cost for telemetry.
 * This is an internal function and should not be exported.
 *
 * @returns {Promise<object|null>} Telemetry data object or null on failure.
 */
async function logAiUsage({
	userId,
	commandName,
	providerName,
	modelId,
	inputTokens,
	outputTokens,
	outputType
}: {
	userId: string;
	commandName: string;
	providerName: string;
	modelId: string | null;
	inputTokens: number;
	outputTokens: number;
	outputType: string;
}): Promise<Record<string, unknown> | null> {
	if (outputType !== 'cli') return null; // Only log for CLI usage for now
	if (!userId) {
		log('debug', 'Cannot log AI usage: User ID is not available.');
		return null;
	}
	// Ensure we don't log empty stats
	if (inputTokens === 0 && outputTokens === 0) {
		return null;
	}

	try {
		const { inputCost, outputCost, currency } = _getCostForModel(
			providerName,
			modelId
		);

		const telemetryData = {
			timestamp: new Date().toISOString(),
			userId,
			commandName,
			modelUsed: modelId,
			providerName,
			inputTokens,
			outputTokens,
			totalTokens: inputTokens + outputTokens,
			totalCost: (inputTokens / 1_000_000) * inputCost + (outputTokens / 1_000_000) * outputCost,
			currency: currency
		};

		if (getDebugFlag()) {
			log('info', 'AI Usage Telemetry:', telemetryData);
		}

		// In a real application, you would send this to your telemetry service
		// For now, we just return it
		return telemetryData;
	} catch (error) {
		log('warn', `Failed to log AI usage: ${error}`);
		return null;
	}
} 