/**
 * models.ts
 * Core functionality for managing AI model configurations
 */

import https from 'https';
import {
	getMainModelId,
	getResearchModelId,
	getFallbackModelId,
	getAvailableModels,
	getMainProvider,
	getResearchProvider,
	getFallbackProvider,
	isApiKeySet,
	getMcpApiKeyStatus,
	getConfig,
	writeConfig,
	isConfigFilePresent,
	getAllProviders
} from '../config-manager.js';
import { findConfigPath } from '../../../src/utils/path-utils.js';
import { log } from '../utils.js';

// Type definitions
interface OpenRouterModel {
	id: string;
	name?: string;
	context_length?: number;
	pricing?: {
		prompt?: string;
		completion?: string;
	};
}


interface ModelData {
	id: string;
	provider?: string;
	swe_score?: number;
	cost_per_1m_tokens?: number;
	allowed_roles?: string[];
}

interface ModelConfiguration {
	provider: string;
	modelId: string;
	sweScore: number | null;
	cost: number | null;
	keyStatus: {
		cli: boolean;
		mcp: boolean;
	};
}

interface APIResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
	};
}

interface ModelOptions {
	session?: { env?: Record<string, string> };
	mcpLog?: {
		error: (...args: any[]) => void;
		info: (...args: any[]) => void;
		warn: (...args: any[]) => void;
		debug: (...args: any[]) => void;
	};
	projectRoot?: string;
	providerHint?: string;
}

type ModelRole = 'main' | 'research' | 'fallback';

/**
 * Fetches the list of models from OpenRouter API.
 * @returns A promise that resolves with the list of model IDs or null if fetch fails.
 */
function fetchOpenRouterModels(): Promise<OpenRouterModel[] | null> {
	return new Promise((resolve) => {
		const options = {
			hostname: 'openrouter.ai',
			path: '/api/v1/models',
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		};

		const req = https.request(options, (res) => {
			let data = '';
			res.on('data', (chunk) => {
				data += chunk;
			});
			res.on('end', () => {
				if (res.statusCode === 200) {
					try {
						const parsedData = JSON.parse(data);
						resolve(parsedData.data || []); // Return the array of models
					} catch (e) {
						console.error('Error parsing OpenRouter response:', e);
						resolve(null); // Indicate failure
					}
				} else {
					console.error(
						`OpenRouter API request failed with status code: ${res.statusCode}`
					);
					resolve(null); // Indicate failure
				}
			});
		});

		req.on('error', (e) => {
			console.error('Error fetching OpenRouter models:', e);
			resolve(null); // Indicate failure
		});
		req.end();
	});
}


/**
 * Get the current model configuration
 * @param options - Options for the operation
 * @returns RESTful response with current model configuration
 */
async function getModelConfiguration(options: ModelOptions = {}): Promise<APIResponse<{ activeModels: { main: ModelConfiguration; research: ModelConfiguration; fallback: ModelConfiguration | null }; message: string }>> {
	const { mcpLog, projectRoot, session } = options;

	const report = (level, ...args) => {
		if (mcpLog && typeof mcpLog[level] === 'function') {
			mcpLog[level](...args);
		}
	};

	if (!projectRoot) {
		throw new Error('Project root is required but not found.');
	}

	// Use centralized config path finding instead of hardcoded path
	const configPath = findConfigPath(null, { projectRoot });
	const configExists = isConfigFilePresent(projectRoot);

	log(
		'debug',
		`Checking for config file using findConfigPath, found: ${configPath}`
	);
	log(
		'debug',
		`Checking config file using isConfigFilePresent(), exists: ${configExists}`
	);

	if (!configExists) {
		throw new Error(
			'The configuration file is missing. Run "vibex-task-manager models --setup" to create it.'
		);
	}

	try {
		// Get current settings - these should use the config from the found path automatically
		const mainProvider = getMainProvider(projectRoot);
		const mainModelId = getMainModelId(projectRoot);
		const researchProvider = getResearchProvider(projectRoot);
		const researchModelId = getResearchModelId(projectRoot);
		const fallbackProvider = getFallbackProvider(projectRoot);
		const fallbackModelId = getFallbackModelId(projectRoot);

		// Check API keys
		const mainCliKeyOk = isApiKeySet(mainProvider, session, projectRoot);
		const mainMcpKeyOk = getMcpApiKeyStatus(mainProvider, projectRoot);
		const researchCliKeyOk = isApiKeySet(
			researchProvider,
			session,
			projectRoot
		);
		const researchMcpKeyOk = getMcpApiKeyStatus(researchProvider, projectRoot);
		const fallbackCliKeyOk = fallbackProvider
			? isApiKeySet(fallbackProvider, session, projectRoot)
			: true;
		const fallbackMcpKeyOk = fallbackProvider
			? getMcpApiKeyStatus(fallbackProvider, projectRoot)
			: true;

		// Get available models to find detailed info
		const availableModels = getAvailableModels();

		// Find model details
		const mainModelData = availableModels.find((m) => m.id === mainModelId);
		const researchModelData = availableModels.find(
			(m) => m.id === researchModelId
		);
		const fallbackModelData = fallbackModelId
			? availableModels.find((m) => m.id === fallbackModelId)
			: null;

		// Return structured configuration data
		return {
			success: true,
			data: {
				activeModels: {
					main: {
						provider: mainProvider,
						modelId: mainModelId,
						sweScore: mainModelData?.swe_score || null,
						cost: mainModelData?.cost_per_1m_tokens || null,
						keyStatus: {
							cli: mainCliKeyOk,
							mcp: mainMcpKeyOk
						}
					},
					research: {
						provider: researchProvider,
						modelId: researchModelId,
						sweScore: researchModelData?.swe_score || null,
						cost: researchModelData?.cost_per_1m_tokens || null,
						keyStatus: {
							cli: researchCliKeyOk,
							mcp: researchMcpKeyOk
						}
					},
					fallback: fallbackProvider
						? {
								provider: fallbackProvider,
								modelId: fallbackModelId,
								sweScore: fallbackModelData?.swe_score || null,
								cost: fallbackModelData?.cost_per_1m_tokens || null,
								keyStatus: {
									cli: fallbackCliKeyOk,
									mcp: fallbackMcpKeyOk
								}
							}
						: null
				},
				message: 'Successfully retrieved current model configuration'
			}
		};
	} catch (error) {
		report('error', `Error getting model configuration: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'CONFIG_ERROR',
				message: error.message
			}
		};
	}
}

/**
 * Get all available models not currently in use
 * @param options - Options for the operation
 * @returns RESTful response with available models
 */
async function getAvailableModelsList(options: ModelOptions = {}): Promise<APIResponse<{ models: Array<{ provider: string; modelId: string; sweScore: number | null; cost: number | null; allowedRoles: string[] }>; message: string }>> {
	const { mcpLog, projectRoot } = options;

	const report = (level, ...args) => {
		if (mcpLog && typeof mcpLog[level] === 'function') {
			mcpLog[level](...args);
		}
	};

	if (!projectRoot) {
		throw new Error('Project root is required but not found.');
	}

	// Use centralized config path finding instead of hardcoded path
	const configPath = findConfigPath(null, { projectRoot });
	const configExists = isConfigFilePresent(projectRoot);

	log(
		'debug',
		`Checking for config file using findConfigPath, found: ${configPath}`
	);
	log(
		'debug',
		`Checking config file using isConfigFilePresent(), exists: ${configExists}`
	);

	if (!configExists) {
		throw new Error(
			'The configuration file is missing. Run "vibex-task-manager models --setup" to create it.'
		);
	}

	try {
		// Get all available models
		const allAvailableModels = getAvailableModels();

		if (!allAvailableModels || allAvailableModels.length === 0) {
			return {
				success: true,
				data: {
					models: [],
					message: 'No available models found'
				}
			};
		}

		// Get currently used model IDs
		const mainModelId = getMainModelId(projectRoot);
		const researchModelId = getResearchModelId(projectRoot);
		const fallbackModelId = getFallbackModelId(projectRoot);

		// Filter out placeholder models and active models
		const activeIds = [mainModelId, researchModelId, fallbackModelId].filter(
			Boolean
		);
		const otherAvailableModels = allAvailableModels.map((model) => ({
			provider: model.provider || 'N/A',
			modelId: model.id,
			sweScore: model.swe_score || null,
			cost: model.cost_per_1m_tokens || null,
			allowedRoles: model.allowed_roles || []
		}));

		return {
			success: true,
			data: {
				models: otherAvailableModels,
				message: `Successfully retrieved ${otherAvailableModels.length} available models`
			}
		};
	} catch (error) {
		report('error', `Error getting available models: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'MODELS_LIST_ERROR',
				message: error.message
			}
		};
	}
}

/**
 * Update a specific model in the configuration
 * @param role - The model role to update ('main', 'research', 'fallback')
 * @param modelId - The model ID to set for the role
 * @param options - Options for the operation
 * @returns RESTful response with result of update operation
 */
async function setModel(role: ModelRole, modelId: string, options: ModelOptions = {}): Promise<APIResponse<{ role: string; provider: string; modelId: string; message: string; warning?: string }>> {
	const { mcpLog, projectRoot, providerHint } = options;

	const report = (level, ...args) => {
		if (mcpLog && typeof mcpLog[level] === 'function') {
			mcpLog[level](...args);
		}
	};

	if (!projectRoot) {
		throw new Error('Project root is required but not found.');
	}

	// Use centralized config path finding instead of hardcoded path
	const configPath = findConfigPath(null, { projectRoot });
	const configExists = isConfigFilePresent(projectRoot);

	log(
		'debug',
		`Checking for config file using findConfigPath, found: ${configPath}`
	);
	log(
		'debug',
		`Checking config file using isConfigFilePresent(), exists: ${configExists}`
	);

	if (!configExists) {
		throw new Error(
			'The configuration file is missing. Run "vibex-task-manager models --setup" to create it.'
		);
	}

	// Validate role
	if (!['main', 'research', 'fallback'].includes(role)) {
		return {
			success: false,
			error: {
				code: 'INVALID_ROLE',
				message: `Invalid role: ${role}. Must be one of: main, research, fallback.`
			}
		};
	}

	// Validate model ID
	if (typeof modelId !== 'string' || modelId.trim() === '') {
		return {
			success: false,
			error: {
				code: 'INVALID_MODEL_ID',
				message: `Invalid model ID: ${modelId}. Must be a non-empty string.`
			}
		};
	}

	try {
		const availableModels = getAvailableModels();
		const currentConfig = getConfig(projectRoot);
		let determinedProvider = null; // Initialize provider
		let warningMessage = null;

		// Find the model data in internal list initially to see if it exists at all
		const modelData = availableModels.find((m) => m.id === modelId);

		// Determine provider logic

		if (providerHint) {
			// Hint provided (--openrouter or --bedrock flag used)
			if (modelData && modelData.provider === providerHint) {
				// Found internally AND provider matches the hint
				determinedProvider = providerHint;
				report(
					'info',
					`Model ${modelId} found internally with matching provider hint ${determinedProvider}.`
				);
			} else {
				// Either not found internally, OR found but under a DIFFERENT provider than hinted.
				// Proceed with custom logic based ONLY on the hint.
				if (providerHint === 'openrouter') {
					// Check OpenRouter ONLY because hint was openrouter
					report('info', `Checking OpenRouter for ${modelId} (as hinted)...`);
					const openRouterModels = await fetchOpenRouterModels();

					if (
						openRouterModels &&
						openRouterModels.some((m) => m.id === modelId)
					) {
						determinedProvider = 'openrouter';

						// Check if this is a free model (ends with :free)
						if (modelId.endsWith(':free')) {
							warningMessage = `Warning: OpenRouter free model '${modelId}' selected. Free models have significant limitations including lower context windows, reduced rate limits, and may not support advanced features like tool_use. Consider using the paid version '${modelId.replace(':free', '')}' for full functionality.`;
						} else {
							warningMessage = `Warning: Custom OpenRouter model '${modelId}' set. This model is not officially validated by Taskmaster and may not function as expected.`;
						}

						report('warn', warningMessage);
					} else {
						// Hinted as OpenRouter but not found in live check
						throw new Error(
							`Model ID "${modelId}" not found in the live OpenRouter model list. Please verify the ID and ensure it's available on OpenRouter.`
						);
					}
				} else if (providerHint === 'bedrock') {
					// Set provider without model validation since Bedrock models are managed by AWS
					determinedProvider = 'bedrock';
					warningMessage = `Warning: Custom Bedrock model '${modelId}' set. Please ensure the model ID is valid and accessible in your AWS account.`;
					report('warn', warningMessage);
				} else {
					// Invalid provider hint
					throw new Error(`Invalid provider hint received: ${providerHint}`);
				}
			}
		} else {
			// No hint provided (flags not used)
			if (modelData) {
				// Found internally, use the provider from the internal list
				determinedProvider = modelData.provider;
				report(
					'info',
					`Model ${modelId} found internally with provider ${determinedProvider}.`
				);
			} else {
				// Model not found and no provider hint was given
				return {
					success: false,
					error: {
						code: 'MODEL_NOT_FOUND_NO_HINT',
						message: `Model ID "${modelId}" not found in Taskmaster's supported models. If this is a custom model, please specify the provider using --openrouter or --bedrock.`
					}
				};
			}
		}

		// End of logic

		// At this point, we should have a determinedProvider if the model is valid (internally or custom)
		if (!determinedProvider) {
			// This case acts as a safeguard
			return {
				success: false,
				error: {
					code: 'PROVIDER_UNDETERMINED',
					message: `Could not determine the provider for model ID "${modelId}".`
				}
			};
		}

		// Update configuration
		currentConfig.models[role] = {
			...currentConfig.models[role], // Keep existing params like maxTokens
			provider: determinedProvider,
			modelId: modelId
		};

		// Write updated configuration
		const writeResult = writeConfig(currentConfig, projectRoot);
		if (!writeResult) {
			return {
				success: false,
				error: {
					code: 'CONFIG_WRITE_ERROR',
					message: 'Error writing updated configuration to configuration file'
				}
			};
		}

		const successMessage = `Successfully set ${role} model to ${modelId} (Provider: ${determinedProvider})`;
		report('info', successMessage);

		return {
			success: true,
			data: {
				role,
				provider: determinedProvider,
				modelId,
				message: successMessage,
				warning: warningMessage // Include warning in the response data
			}
		};
	} catch (error) {
		report('error', `Error setting ${role} model: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'SET_MODEL_ERROR',
				message: error.message
			}
		};
	}
}

/**
 * Get API key status for all known providers.
 * @param options - Options for the operation
 * @returns RESTful response with API key status report
 */
async function getApiKeyStatusReport(options: ModelOptions = {}): Promise<APIResponse<{ report: Array<{ provider: string; cli: boolean; mcp: boolean }>; message: string }>> {
	const { mcpLog, projectRoot, session } = options;
	const report = (level, ...args) => {
		if (mcpLog && typeof mcpLog[level] === 'function') {
			mcpLog[level](...args);
		}
	};

	try {
		const providers = getAllProviders();
		const providersToCheck = providers; // Check all providers that require API keys
		const statusReport = providersToCheck.map((provider) => {
			// Use provided projectRoot for MCP status check
			const cliOk = isApiKeySet(provider, session, projectRoot); // Pass session and projectRoot for CLI check
			const mcpOk = getMcpApiKeyStatus(provider, projectRoot);
			return {
				provider,
				cli: cliOk,
				mcp: mcpOk
			};
		});

		report('info', 'Successfully generated API key status report.');
		return {
			success: true,
			data: {
				report: statusReport,
				message: 'API key status report generated.'
			}
		};
	} catch (error) {
		report('error', `Error generating API key status report: ${error.message}`);
		return {
			success: false,
			error: {
				code: 'API_KEY_STATUS_ERROR',
				message: error.message
			}
		};
	}
}

export {
	getModelConfiguration,
	getAvailableModelsList,
	setModel,
	getApiKeyStatusReport
};
