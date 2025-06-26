import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { log, findProjectRoot, resolveEnvVariable } from './utils.js';
import { LEGACY_CONFIG_FILE } from '../../src/constants/paths.js';
import { findConfigPath } from '../../src/utils/path-utils.js';
import { BedrockAutoDetect } from '../../src/core/bedrock-auto-detect.js';
import {
	getBedrockModel,
	BedrockModelId
} from '../../src/core/bedrock-models.js';

// Calculate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load supported models from JSON file using the calculated __dirname
interface SupportedModel {
	id: string;
	swe_score?: number;
	cost_per_1m_tokens?: {
		input: number;
		output: number;
		currency: string;
	};
	allowed_roles?: string[];
	max_tokens?: number;
	supports_tools?: boolean;
}

interface ModelMap {
	[provider: string]: SupportedModel[];
}

// --- Configuration-related Type Definitions ---
interface ModelConfig {
	provider: string;
	modelId: string;
	maxTokens: number;
	temperature: number;
}

// Fallback can have missing provider/modelId
interface FallbackModelConfig
	extends Omit<ModelConfig, 'provider' | 'modelId'> {
	provider?: string;
	modelId?: string;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';
type Priority = 'high' | 'medium' | 'low';

interface GlobalConfig {
	logLevel: LogLevel;
	debug: boolean;
	defaultSubtasks: number;
	defaultPriority: Priority;
	projectName: string;
	bedrockBaseURL: string;
	vertexProjectId?: string;
	vertexLocation?: string;
}

interface Config {
	models: {
		main: ModelConfig;
		research: ModelConfig;
		fallback: FallbackModelConfig;
	};
	global: GlobalConfig;
}

// Utility type for deep partials
type DeepPartial<T> = T extends object
	? {
			[P in keyof T]?: DeepPartial<T[P]>;
		}
	: T;
// --- End Type Definitions ---

let MODEL_MAP: ModelMap;
try {
	const supportedModelsRaw = fs.readFileSync(
		path.join(__dirname, 'supported-models.json'),
		'utf-8'
	);
	MODEL_MAP = JSON.parse(supportedModelsRaw) as ModelMap;
} catch (error) {
	console.error(
		chalk.red(
			'FATAL ERROR: Could not load supported-models.json. Please ensure the file exists and is valid JSON.'
		),
		error
	);
	MODEL_MAP = {}; // Default to empty map on error to avoid crashing, though functionality will be limited
	process.exit(1); // Exit if models can't be loaded
}

// Define valid providers dynamically from the loaded MODEL_MAP
const VALID_PROVIDERS = Object.keys(MODEL_MAP || {});

// Default configuration values (used if config file is missing or incomplete)
const DEFAULTS: Config = {
	models: {
		main: {
			provider: 'bedrock',
			modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
			maxTokens: 64000,
			temperature: 0.2
		},
		research: {
			provider: 'bedrock',
			modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
			maxTokens: 64000,
			temperature: 0.1
		},
		fallback: {
			// No default fallback provider/model initially
			provider: 'bedrock',
			modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
			maxTokens: 64000, // Default parameters if fallback IS configured
			temperature: 0.2
		}
	},
	global: {
		logLevel: 'info',
		debug: false,
		defaultSubtasks: 5,
		defaultPriority: 'medium',
		projectName: 'Task Manager',
		bedrockBaseURL: 'https://bedrock.us-east-1.amazonaws.com'
	}
};

// --- Internal Config Loading ---
let loadedConfig: Config | null = null;
let loadedConfigRoot: string | null = null; // Track which root loaded the config

// Custom Error for configuration issues
class ConfigurationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigurationError';
	}
}

function _loadAndValidateConfig(explicitRoot: string | null = null): Config {
	const defaults = DEFAULTS; // Use the defined defaults
	let rootToUse = explicitRoot;
	let configSource = explicitRoot
		? `explicit root (${explicitRoot})`
		: 'defaults (no root provided yet)';

	// ---> If no explicit root, TRY to find it <---
	if (!rootToUse) {
		rootToUse = findProjectRoot();
		if (rootToUse) {
			configSource = `found root (${rootToUse})`;
		} else {
			// No root found, return defaults immediately
			return defaults;
		}
	}
	// ---> End find project root logic <---

	// --- Find configuration file using centralized path utility ---
	const configPath = findConfigPath(null, { projectRoot: rootToUse });
	let config: Config = structuredClone(defaults); // Start with a deep copy of defaults
	let configExists = false;

	if (configPath) {
		configExists = true;
		const isLegacy = configPath.endsWith(LEGACY_CONFIG_FILE);

		try {
			const rawData = fs.readFileSync(configPath, 'utf-8');
			const parsedConfig = JSON.parse(rawData) as DeepPartial<Config>;

			// Deep merge parsed config onto defaults
			config = {
				models: {
					main: { ...defaults.models.main, ...parsedConfig?.models?.main },
					research: {
						...defaults.models.research,
						...parsedConfig?.models?.research
					},
					fallback:
						parsedConfig?.models?.fallback?.provider &&
						parsedConfig?.models?.fallback?.modelId
							? { ...defaults.models.fallback, ...parsedConfig.models.fallback }
							: { ...defaults.models.fallback }
				},
				global: { ...defaults.global, ...parsedConfig?.global }
			};
			configSource = `file (${configPath})`; // Update source info

			// Issue deprecation warning if using legacy config file
			if (isLegacy) {
				console.warn(
					chalk.yellow(
						`⚠️  DEPRECATION WARNING: Found configuration in legacy location '${configPath}'. Please migrate to .taskmanager/config.json. Run 'vibex-task-manager migrate' to automatically migrate your project.`
					)
				);
			}

			// --- Validation (Warn if file content is invalid) ---
			// Use log.warn for consistency
			if (!validateProvider(config.models.main.provider)) {
				console.warn(
					chalk.yellow(
						`Warning: Invalid main provider "${config.models.main.provider}" in ${configPath}. Falling back to default.`
					)
				);
				config.models.main = { ...defaults.models.main };
			}
			if (!validateProvider(config.models.research.provider)) {
				console.warn(
					chalk.yellow(
						`Warning: Invalid research provider "${config.models.research.provider}" in ${configPath}. Falling back to default.`
					)
				);
				config.models.research = { ...defaults.models.research };
			}
			if (
				config.models.fallback?.provider &&
				!validateProvider(config.models.fallback.provider)
			) {
				console.warn(
					chalk.yellow(
						`Warning: Invalid fallback provider "${config.models.fallback.provider}" in ${configPath}. Fallback model configuration will be ignored.`
					)
				);
				config.models.fallback.provider = undefined;
				config.models.fallback.modelId = undefined;
			}
		} catch (error: any) {
			// Use console.error for actual errors during parsing
			console.error(
				chalk.red(
					`Error reading or parsing ${configPath}: ${error.message}. Using default configuration.`
				)
			);
			config = structuredClone(defaults); // Reset to defaults on parse error
			configSource = `defaults (parse error at ${configPath})`;
		}
	} else {
		// Config file doesn't exist at the determined rootToUse.
		if (explicitRoot) {
			// Only warn if an explicit root was *expected*.
			console.warn(
				chalk.yellow(
					`Warning: Configuration file not found at provided project root (${explicitRoot}). Using default configuration. Run 'vibex-task-manager models --setup' to configure.`
				)
			);
		} else {
			console.warn(
				chalk.yellow(
					`Warning: Configuration file not found at derived root (${rootToUse}). Using defaults.`
				)
			);
		}
		// Keep config as defaults
		config = structuredClone(defaults);
		configSource = `defaults (no config file found at ${rootToUse})`;
	}

	return config;
}

/**
 * Gets the current configuration, loading it if necessary.
 * Handles MCP initialization context gracefully.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @param {boolean} forceReload - Force reloading the config file.
 * @returns {object} The loaded configuration object.
 */
function getConfig(
	explicitRoot: string | null = null,
	forceReload: boolean = false
): Config {
	// Determine if a reload is necessary
	const needsLoad =
		!loadedConfig ||
		forceReload ||
		(explicitRoot && explicitRoot !== loadedConfigRoot);

	if (needsLoad) {
		const newConfig = _loadAndValidateConfig(explicitRoot); // _load handles null explicitRoot

		// Only update the global cache if loading was forced or if an explicit root
		// was provided (meaning we attempted to load a specific project's config).
		// We avoid caching the initial default load triggered without an explicitRoot.
		if (forceReload || explicitRoot) {
			loadedConfig = newConfig;
			loadedConfigRoot = explicitRoot; // Store the root used for this loaded config
		}
		return newConfig; // Return the newly loaded/default config
	}

	// If no load was needed, return the cached config
	return loadedConfig || DEFAULTS;
}

/**
 * Validates if a provider name is in the list of supported providers.
 * @param {string} providerName The name of the provider.
 * @returns {boolean} True if the provider is valid, false otherwise.
 */
function validateProvider(providerName: string) {
	return VALID_PROVIDERS.includes(providerName);
}

/**
 * Optional: Validates if a modelId is known for a given provider based on MODEL_MAP.
 * This is a non-strict validation; an unknown model might still be valid.
 * @param {string} providerName The name of the provider.
 * @param {string} modelId The model ID.
 * @returns {boolean} True if the modelId is in the map for the provider, false otherwise.
 */
function validateProviderModelCombination(
	providerName: string,
	modelId: string
) {
	// Only allow bedrock providers since we only support AWS Bedrock
	if (!validateProvider(providerName)) {
		return false;
	}
	// If provider isn't even in our map, we can't validate the model
	if (!MODEL_MAP[providerName]) {
		return false; // Strict validation - only allow known providers
	}
	// If the provider is known, check if the model is in its list OR if the list is empty (meaning accept any)
	return (
		MODEL_MAP[providerName].length === 0 ||
		// Use .some() to check the 'id' property of objects in the array
		MODEL_MAP[providerName].some((modelObj) => modelObj.id === modelId)
	);
}

// --- Role-Specific Getters ---

function getModelConfigForRole(
	role: string,
	explicitRoot: string | null = null
) {
	const config = getConfig(explicitRoot);
	if (!config) return null;

	switch (role) {
		case 'main':
			return config.models.main;
		case 'research':
			return config.models.research;
		case 'fallback':
			return config.models.fallback;
		default:
			// log.warn(`Unknown model role: ${role}. Falling back to 'main' config.`);
			return config.models.main; // Default to main if role is unknown
	}
}

function getMainProvider(explicitRoot: string | null = null): string {
	return getConfig(explicitRoot).models.main.provider;
}

function getMainModelId(explicitRoot: string | null = null): string {
	return getConfig(explicitRoot).models.main.modelId;
}

function getMainMaxTokens(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).models.main.maxTokens;
}

function getMainTemperature(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).models.main.temperature;
}

function getResearchProvider(explicitRoot: string | null = null): string {
	return getConfig(explicitRoot).models.research.provider;
}

function getResearchModelId(explicitRoot: string | null = null): string {
	return getConfig(explicitRoot).models.research.modelId;
}

function getResearchMaxTokens(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).models.research.maxTokens;
}

function getResearchTemperature(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).models.research.temperature;
}

function getFallbackProvider(
	explicitRoot: string | null = null
): string | undefined {
	return getConfig(explicitRoot).models.fallback.provider;
}

function getFallbackModelId(
	explicitRoot: string | null = null
): string | undefined {
	return getConfig(explicitRoot).models.fallback.modelId;
}

function getFallbackMaxTokens(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).models.fallback.maxTokens;
}

function getFallbackTemperature(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).models.fallback.temperature;
}

// --- Global Settings Getters ---

function getGlobalConfig(explicitRoot: string | null = null): GlobalConfig {
	return getConfig(explicitRoot).global;
}

function getLogLevel(explicitRoot: string | null = null): LogLevel {
	return getConfig(explicitRoot).global.logLevel;
}

function getDebugFlag(explicitRoot: string | null = null): boolean {
	return getConfig(explicitRoot).global.debug;
}

function getDefaultSubtasks(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).global.defaultSubtasks;
}

function getDefaultNumTasks(explicitRoot: string | null = null): number {
	return getConfig(explicitRoot).global.defaultSubtasks;
}

function getDefaultPriority(explicitRoot: string | null = null): Priority {
	return getConfig(explicitRoot).global.defaultPriority;
}

function getProjectName(explicitRoot: string | null = null): string {
	return getConfig(explicitRoot).global.projectName;
}

// Azure and Ollama support removed - only Bedrock is supported

function getBedrockBaseURL(
	explicitRoot: string | null = null
): string | undefined {
	const config = getConfig(explicitRoot);
	// Prioritize environment variable, then config file, then default
	return (
		process.env.BEDROCK_BASE_URL ?? config.global.bedrockBaseURL ?? undefined
	);
}

/**
 * Gets the Google Cloud project ID for Vertex AI from configuration
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string|null} The project ID or null if not configured
 */
function getVertexProjectId(
	explicitRoot: string | null = null
): string | undefined {
	const config = getConfig(explicitRoot);
	// This property is not part of the defined GlobalConfig, so we handle it as potentially undefined.
	// To fix this long-term, 'vertexProjectId' should be added to the GlobalConfig interface.
	return (
		resolveEnvVariable('VERTEX_PROJECT_ID') ??
		config.global.vertexProjectId ??
		undefined
	);
}

/**
 * Gets the Google Cloud location for Vertex AI from configuration
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string} The location or default value of "us-central1"
 */
function getVertexLocation(
	explicitRoot: string | null = null
): string | undefined {
	const config = getConfig(explicitRoot);
	// This property is not part of the defined GlobalConfig, so we handle it as potentially undefined.
	// To fix this long-term, 'vertexLocation' should be added to the GlobalConfig interface.
	return (
		resolveEnvVariable('VERTEX_LOCATION') ??
		config.global.vertexLocation ??
		undefined
	);
}

/**
 * Gets model parameters (maxTokens, temperature) for a specific role,
 * considering model-specific overrides from supported-models.json.
 * @param {string} role - The role ('main', 'research', 'fallback').
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {{maxTokens: number, temperature: number}}
 */
function getParametersForRole(
	role: 'main' | 'research' | 'fallback',
	explicitRoot: string | null = null
) {
	const config = getConfig(explicitRoot);
	const modelConfig = getModelConfigForRole(role, explicitRoot);

	if (!modelConfig || !modelConfig.provider) {
		return null; // Can't get params if base model config is invalid
	}

	const { provider, modelId, maxTokens, temperature } = modelConfig;
	const commonParams = { provider, modelId, maxTokens, temperature };

	// Add provider-specific parameters
	switch (provider) {
		case 'bedrock':
			return {
				...commonParams,
				bedrockBaseURL: getBedrockBaseURL(explicitRoot)
			};
		case 'google': // Gemini
			return {
				...commonParams,
				vertexProjectId: getVertexProjectId(explicitRoot),
				vertexLocation: getVertexLocation(explicitRoot)
			};
		// Cases for 'openai', 'anthropic', 'openrouter' if they need specific params
		default:
			return commonParams;
	}
}

/**
 * Checks if the API key for a given provider is set, either in environment variables,
 * or for MCP, checks the session.
 * @param {string} providerName - The name of the provider (e.g., 'openai', 'anthropic').
 * @param {object|null} session - The MCP session object (optional).
 * @param {string|null} projectRoot - The project root path (optional).
 * @returns {boolean} True if the key is considered set, false otherwise.
 */
function isApiKeySet(
	providerName: string,
	session: any = null,
	projectRoot: string | null = null
): boolean {
	if (!providerName) return false;

	const upperProvider = providerName.toUpperCase();
	const envVarName = `${upperProvider}_API_KEY`;

	// 1. Check environment variable first (e.g., OPENAI_API_KEY)
	if (process.env[envVarName] && process.env[envVarName] !== 'YOUR_..._KEY') {
		return true;
	}

	// 2. Check for AWS credentials if provider is bedrock
	if (
		providerName.toLowerCase() === 'bedrock' &&
		(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_SESSION_TOKEN)
	) {
		return true;
	}

	// 3. Check MCP session if provided
	if (session && projectRoot) {
		try {
			const status = getMcpApiKeyStatus(providerName, projectRoot);
			return status.isSet;
		} catch (lookupError: any) {
			log(
				'warn',
				`Could not determine API key status for '${providerName}' via MCP: ${lookupError.message}`
			);
			return false; // Fail safe if MCP check fails
		}
	}

	return false;
}

/**
 * Specifically for MCP, determines if an API key is set by checking the .mcp/
 * directory for the corresponding environment file.
 *
 * This function provides a more detailed status object compared to `isApiKeySet`.
 *
 * @param {string} providerName - The name of the provider.
 * @param {string|null} projectRoot - The project root.
 * @returns {{isSet: boolean, source: string|null, value: string|null}}
 *          An object indicating if the key is set, its source (e.g., 'env_file'),
 *          and the key value itself (or a placeholder).
 */
function getMcpApiKeyStatus(
	providerName: string,
	projectRoot: string | null
): { isSet: boolean; source: string | null; value: string | null } {
	const root = projectRoot || findProjectRoot();
	if (!root) {
		return {
			isSet: false,
			source: null,
			value: 'Project root not found.'
		};
	}

	const envFileName = `.${providerName.toLowerCase()}.env`;
	const envFilePath = path.join(root, '.mcp', envFileName);

	if (fs.existsSync(envFilePath)) {
		const content = fs.readFileSync(envFilePath, 'utf-8');
		const keyVar = `${providerName.toUpperCase()}_API_KEY`;
		const match = content.match(new RegExp(`^${keyVar}=(.*)$`, 'm'));

		if (match && match[1] && match[1].trim()) {
			const keyValue = match[1].trim();
			// Avoid returning placeholder keys
			if (!keyValue.startsWith('YOUR_')) {
				return { isSet: true, source: 'env_file', value: keyValue };
			}
		}
	}

	// Default fallback if no valid key found in the .env file
	return { isSet: false, source: null, value: null };
}

/**
 * Returns a structured map of all supported models, categorized by provider.
 * This is the raw data from the JSON file.
 * @returns {ModelMap}
 */
function getAvailableModels(): ModelMap {
	return MODEL_MAP;
}

/**
 * Writes the configuration object to the file.
 * @param {Object} config The configuration object to write.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {boolean} True if successful, false otherwise.
 */
function writeConfig(config: Config, explicitRoot: string | null = null) {
	const projectRoot = explicitRoot || findProjectRoot();
	if (!projectRoot) {
		throw new ConfigurationError(
			'Cannot write config: Project root not found.'
		);
	}

	const configDir = path.join(projectRoot, '.taskmanager');
	const configPath = path.join(configDir, 'config.json');

	try {
		// Ensure the .taskmanager directory exists
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir, { recursive: true });
		}

		// Write the file
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
		log('info', `Configuration saved to ${configPath}`);

		// Force a reload of the cached config on next getConfig call
		getConfig(projectRoot, true);
		return true;
	} catch (error: any) {
		throw new ConfigurationError(
			`Failed to write configuration to ${configPath}: ${error.message}`
		);
	}
}

/**
 * Checks if a configuration file exists at the project root (new or legacy location)
 * @param {string|null} explicitRoot - Optional explicit path to the project root
 * @returns {boolean} True if the file exists, false otherwise
 */
function isConfigFilePresent(explicitRoot: string | null = null) {
	const configPath = findConfigPath(null, {
		projectRoot: explicitRoot || undefined
	});
	return !!configPath;
}

/**
 * Gets the user ID from the configuration.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string|null} The user ID or null if not found.
 */
function getUserId(explicitRoot: string | null = null): string | null {
	const projectRoot = explicitRoot || findProjectRoot();
	if (!projectRoot) {
		return null; // Cannot store user ID without a project context
	}

	const configDir = path.join(projectRoot, '.taskmanager');
	const userIdPath = path.join(configDir, '.user_id');

	try {
		if (fs.existsSync(userIdPath)) {
			return fs.readFileSync(userIdPath, 'utf-8').trim();
		} else {
			// Generate a new user ID using a simple random string
			const newUserId =
				Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15);

			// Ensure directory exists
			if (!fs.existsSync(configDir)) {
				fs.mkdirSync(configDir, { recursive: true });
			}
			fs.writeFileSync(userIdPath, newUserId, 'utf-8');
			return newUserId;
		}
	} catch (error: any) {
		log('error', `Could not get or create user ID: ${error.message}`);
		return null;
	}
}

/**
 * Gets a list of all provider names defined in the MODEL_MAP.
 * @returns {string[]} An array of provider names.
 */
function getAllProviders() {
	return VALID_PROVIDERS;
}

function getBaseUrlForRole(
	role: 'main' | 'research' | 'fallback',
	explicitRoot: string | null = null
): string | undefined {
	const params = getParametersForRole(role, explicitRoot);
	if (!params) return undefined;

	switch (params.provider) {
		case 'bedrock':
			return (params as any).bedrockBaseURL;
		// Add other providers if they have a concept of a base URL
		default:
			return undefined;
	}
}

/**
 * Discover available models at runtime
 */
export async function discoverAvailableModels(region?: string): Promise<{
	available: Array<{
		modelId: BedrockModelId;
		name: string;
		maxTokens: number;
		contextWindow: number;
		inputCostPer1K: number;
		outputCostPer1K: number;
		taskCapabilities: {
			canGenerateSubtasks: boolean;
			canAnalyzeComplexity: boolean;
			canParsePRD: boolean;
			maxSubtasksPerTask: number;
		};
	}>;
	unavailable: Array<{
		modelId: BedrockModelId;
		name: string;
		reason: string;
	}>;
	recommendations: {
		main: BedrockModelId | null;
		research: BedrockModelId | null;
		fallback: BedrockModelId | null;
	};
	hasCredentials: boolean;
	error?: string;
}> {
	const detector = new BedrockAutoDetect({ region });
	const result = await detector.detectModels();

	const available = result.available.map((model) => ({
		modelId: model.modelId,
		name: model.modelInfo.name,
		maxTokens: model.modelInfo.maxTokens,
		contextWindow: model.modelInfo.contextWindow,
		inputCostPer1K: model.modelInfo.inputCostPer1K,
		outputCostPer1K: model.modelInfo.outputCostPer1K,
		taskCapabilities: model.modelInfo.taskCapabilities || {
			canGenerateSubtasks: false,
			canAnalyzeComplexity: false,
			canParsePRD: false,
			maxSubtasksPerTask: 0
		}
	}));

	const unavailable = result.unavailable.map((model) => ({
		modelId: model.modelId,
		name: model.modelInfo.name,
		reason: 'Not available in current AWS region/account'
	}));

	return {
		available,
		unavailable,
		recommendations: result.recommendations,
		hasCredentials: result.hasCredentials,
		error: result.error
	};
}

/**
 * Update configuration with discovered models
 */
export async function updateConfigWithDiscoveredModels(
	config: Config,
	discoveredModels: Awaited<ReturnType<typeof discoverAvailableModels>>
): Promise<Config> {
	const updatedConfig = { ...config };

	// Update main model if current one is not available
	if (
		discoveredModels.recommendations.main &&
		!discoveredModels.available.find(
			(m) => m.modelId === config.models.main.modelId
		)
	) {
		updatedConfig.models.main.modelId = discoveredModels.recommendations.main;
		log(
			'info',
			`Updated main model to: ${discoveredModels.recommendations.main}`
		);
	}

	// Update research model if current one is not available
	if (
		discoveredModels.recommendations.research &&
		!discoveredModels.available.find(
			(m) => m.modelId === config.models.research.modelId
		)
	) {
		updatedConfig.models.research.modelId =
			discoveredModels.recommendations.research;
		log(
			'info',
			`Updated research model to: ${discoveredModels.recommendations.research}`
		);
	}

	// Update fallback model if current one is not available
	if (
		discoveredModels.recommendations.fallback &&
		!discoveredModels.available.find(
			(m) => m.modelId === config.models.fallback.modelId
		)
	) {
		updatedConfig.models.fallback.modelId =
			discoveredModels.recommendations.fallback;
		log(
			'info',
			`Updated fallback model to: ${discoveredModels.recommendations.fallback}`
		);
	}

	return updatedConfig;
}

export {
	// Core config access
	getConfig,
	writeConfig,
	ConfigurationError,
	isConfigFilePresent,
	// Validation
	validateProvider,
	validateProviderModelCombination,
	VALID_PROVIDERS,
	MODEL_MAP,
	getAvailableModels,
	// Role-specific getters (No env var overrides)
	getMainProvider,
	getMainModelId,
	getMainMaxTokens,
	getMainTemperature,
	getResearchProvider,
	getResearchModelId,
	getResearchMaxTokens,
	getResearchTemperature,
	getFallbackProvider,
	getFallbackModelId,
	getFallbackMaxTokens,
	getFallbackTemperature,
	getBaseUrlForRole,
	// Global setting getters (No env var overrides)
	getLogLevel,
	getDebugFlag,
	getDefaultNumTasks,
	getDefaultSubtasks,
	getDefaultPriority,
	getProjectName,
	getBedrockBaseURL,
	getParametersForRole,
	getUserId,
	// API Key Checkers (still relevant)
	isApiKeySet,
	getMcpApiKeyStatus,
	// ADD: Function to get all provider names
	getAllProviders,
	getVertexProjectId,
	getVertexLocation
};
