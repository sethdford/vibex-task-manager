import { BedrockModelId } from '../../src/core/bedrock-models.js';
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
interface ModelConfig {
    provider: string;
    modelId: string;
    maxTokens: number;
    temperature: number;
}
interface FallbackModelConfig extends Omit<ModelConfig, 'provider' | 'modelId'> {
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
declare let MODEL_MAP: ModelMap;
declare const VALID_PROVIDERS: string[];
declare class ConfigurationError extends Error {
    constructor(message: string);
}
/**
 * Gets the current configuration, loading it if necessary.
 * Handles MCP initialization context gracefully.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @param {boolean} forceReload - Force reloading the config file.
 * @returns {object} The loaded configuration object.
 */
declare function getConfig(explicitRoot?: string | null, forceReload?: boolean): Config;
/**
 * Validates if a provider name is in the list of supported providers.
 * @param {string} providerName The name of the provider.
 * @returns {boolean} True if the provider is valid, false otherwise.
 */
declare function validateProvider(providerName: string): boolean;
/**
 * Optional: Validates if a modelId is known for a given provider based on MODEL_MAP.
 * This is a non-strict validation; an unknown model might still be valid.
 * @param {string} providerName The name of the provider.
 * @param {string} modelId The model ID.
 * @returns {boolean} True if the modelId is in the map for the provider, false otherwise.
 */
declare function validateProviderModelCombination(providerName: string, modelId: string): boolean;
declare function getMainProvider(explicitRoot?: string | null): string;
declare function getMainModelId(explicitRoot?: string | null): string;
declare function getMainMaxTokens(explicitRoot?: string | null): number;
declare function getMainTemperature(explicitRoot?: string | null): number;
declare function getResearchProvider(explicitRoot?: string | null): string;
declare function getResearchModelId(explicitRoot?: string | null): string;
declare function getResearchMaxTokens(explicitRoot?: string | null): number;
declare function getResearchTemperature(explicitRoot?: string | null): number;
declare function getFallbackProvider(explicitRoot?: string | null): string | undefined;
declare function getFallbackModelId(explicitRoot?: string | null): string | undefined;
declare function getFallbackMaxTokens(explicitRoot?: string | null): number;
declare function getFallbackTemperature(explicitRoot?: string | null): number;
declare function getLogLevel(explicitRoot?: string | null): LogLevel;
declare function getDebugFlag(explicitRoot?: string | null): boolean;
declare function getDefaultSubtasks(explicitRoot?: string | null): number;
declare function getDefaultNumTasks(explicitRoot?: string | null): number;
declare function getDefaultPriority(explicitRoot?: string | null): Priority;
declare function getProjectName(explicitRoot?: string | null): string;
declare function getBedrockBaseURL(explicitRoot?: string | null): string | undefined;
/**
 * Gets the Google Cloud project ID for Vertex AI from configuration
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string|null} The project ID or null if not configured
 */
declare function getVertexProjectId(explicitRoot?: string | null): string | undefined;
/**
 * Gets the Google Cloud location for Vertex AI from configuration
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string} The location or default value of "us-central1"
 */
declare function getVertexLocation(explicitRoot?: string | null): string | undefined;
/**
 * Gets model parameters (maxTokens, temperature) for a specific role,
 * considering model-specific overrides from supported-models.json.
 * @param {string} role - The role ('main', 'research', 'fallback').
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {{maxTokens: number, temperature: number}}
 */
declare function getParametersForRole(role: 'main' | 'research' | 'fallback', explicitRoot?: string | null): {
    provider: string;
    modelId: string;
    maxTokens: number;
    temperature: number;
} | {
    bedrockBaseURL: string;
    provider: string;
    modelId: string;
    maxTokens: number;
    temperature: number;
} | {
    vertexProjectId: string;
    vertexLocation: string;
    provider: string;
    modelId: string;
    maxTokens: number;
    temperature: number;
};
/**
 * Checks if the API key for a given provider is set, either in environment variables,
 * or for MCP, checks the session.
 * @param {string} providerName - The name of the provider (e.g., 'openai', 'anthropic').
 * @param {object|null} session - The MCP session object (optional).
 * @param {string|null} projectRoot - The project root path (optional).
 * @returns {boolean} True if the key is considered set, false otherwise.
 */
declare function isApiKeySet(providerName: string, session?: any, projectRoot?: string | null): boolean;
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
declare function getMcpApiKeyStatus(providerName: string, projectRoot: string | null): {
    isSet: boolean;
    source: string | null;
    value: string | null;
};
/**
 * Returns a structured map of all supported models, categorized by provider.
 * This is the raw data from the JSON file.
 * @returns {ModelMap}
 */
declare function getAvailableModels(): ModelMap;
/**
 * Writes the configuration object to the file.
 * @param {Object} config The configuration object to write.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {boolean} True if successful, false otherwise.
 */
declare function writeConfig(config: Config, explicitRoot?: string | null): boolean;
/**
 * Checks if a configuration file exists at the project root (new or legacy location)
 * @param {string|null} explicitRoot - Optional explicit path to the project root
 * @returns {boolean} True if the file exists, false otherwise
 */
declare function isConfigFilePresent(explicitRoot?: string | null): boolean;
/**
 * Gets the user ID from the configuration.
 * @param {string|null} explicitRoot - Optional explicit path to the project root.
 * @returns {string|null} The user ID or null if not found.
 */
declare function getUserId(explicitRoot?: string | null): string | null;
/**
 * Gets a list of all provider names defined in the MODEL_MAP.
 * @returns {string[]} An array of provider names.
 */
declare function getAllProviders(): string[];
declare function getBaseUrlForRole(role: 'main' | 'research' | 'fallback', explicitRoot?: string | null): string | undefined;
/**
 * Discover available models at runtime
 */
export declare function discoverAvailableModels(region?: string): Promise<{
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
}>;
/**
 * Update configuration with discovered models
 */
export declare function updateConfigWithDiscoveredModels(config: Config, discoveredModels: Awaited<ReturnType<typeof discoverAvailableModels>>): Promise<Config>;
export { getConfig, writeConfig, ConfigurationError, isConfigFilePresent, validateProvider, validateProviderModelCombination, VALID_PROVIDERS, MODEL_MAP, getAvailableModels, getMainProvider, getMainModelId, getMainMaxTokens, getMainTemperature, getResearchProvider, getResearchModelId, getResearchMaxTokens, getResearchTemperature, getFallbackProvider, getFallbackModelId, getFallbackMaxTokens, getFallbackTemperature, getBaseUrlForRole, getLogLevel, getDebugFlag, getDefaultNumTasks, getDefaultSubtasks, getDefaultPriority, getProjectName, getBedrockBaseURL, getParametersForRole, getUserId, isApiKeySet, getMcpApiKeyStatus, getAllProviders, getVertexProjectId, getVertexLocation };
//# sourceMappingURL=config-manager.d.ts.map