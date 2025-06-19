import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { log, findProjectRoot, resolveEnvVariable } from '../utils/utils.js';
import { LEGACY_CONFIG_FILE } from '../constants/paths.js';
import { findConfigPath } from '../utils/path-utils.js';
import type { Config, ModelConfig, GlobalConfig, Priority } from '../types/index.js';

// Calculate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Model map interface
interface ModelDefinition {
  id: string;
  max_tokens?: number;
  swe_score?: number | null;
  cost_per_1m_tokens?: {
    input: number | null;
    output: number | null;
  } | null;
  allowed_roles?: string[];
}

interface ModelMap {
  [provider: string]: ModelDefinition[];
}

// Load supported models from JSON file using the calculated __dirname
let MODEL_MAP: ModelMap;
try {
  const supportedModelsRaw = fs.readFileSync(
    path.join(__dirname, '../../scripts/modules/supported-models.json'),
    'utf-8'
  );
  MODEL_MAP = JSON.parse(supportedModelsRaw);
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
      		modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0', // Claude 3.5 Sonnet (ON_DEMAND supported)
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
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Claude 3.5 Sonnet as fallback
      maxTokens: 64000, // Default parameters if fallback IS configured
      temperature: 0.2
    }
  },
  global: {
    logLevel: 'info',
    debug: false,
    defaultSubtasks: 5,
    defaultPriority: 'medium' as Priority,
    projectName: 'Vibex Task Manager',
    bedrockBaseURL: 'https://bedrock-runtime.us-east-1.amazonaws.com'
  }
};

// --- Internal Config Loading ---
let loadedConfig: Config | null = null;
let loadedConfigRoot: string | null = null; // Track which root loaded the config

// Custom Error for configuration issues
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function _loadAndValidateConfig(explicitRoot: string | null = null): Config {
  const defaults = DEFAULTS; // Use the defined defaults
  let rootToUse = explicitRoot;
  // Track config source for debugging
  // let _configSource = explicitRoot
  //   ? `explicit root (${explicitRoot})`
  //   : 'defaults (no root provided yet)';

  // ---> If no explicit root, TRY to find it <---
  if (!rootToUse) {
    rootToUse = findProjectRoot();
    if (rootToUse) {
      // _configSource = `found root (${rootToUse})`;
    } else {
      // No root found, return defaults immediately
      return defaults;
    }
  }
  // ---> End find project root logic <---

  // --- Find configuration file using centralized path utility ---
  const configPath = findConfigPath(null, { projectRoot: rootToUse });
  let config: Config = { ...defaults }; // Start with a deep copy of defaults
  // Track if config file exists

  if (configPath) {
    // Config file exists
    const isLegacy = configPath.endsWith(LEGACY_CONFIG_FILE);

    try {
      const rawData = fs.readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(rawData);

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
      // _configSource = `file (${configPath})`; // Update source info

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
        config.models.fallback.provider = undefined as any;
        config.models.fallback.modelId = undefined as any;
      }
    } catch (error) {
      // Use console.error for actual errors during parsing
      console.error(
        chalk.red(
          `Error reading or parsing ${configPath}: ${(error as Error).message}. Using default configuration.`
        )
      );
      config = { ...defaults }; // Reset to defaults on parse error
      // _configSource = `defaults (parse error at ${configPath})`;
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
    config = { ...defaults };
    // _configSource = `defaults (no config file found at ${rootToUse})`;
  }

  return config;
}

/**
 * Gets the current configuration, loading it if necessary.
 * Handles MCP initialization context gracefully.
 */
export function getConfig(explicitRoot: string | null = null, forceReload = false): Config {
  // Determine if a reload is necessary
  const needsLoad =
    !loadedConfig ||
    forceReload ||
    (explicitRoot !== null && explicitRoot !== loadedConfigRoot);

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
 */
export function validateProvider(providerName: string): boolean {
  return VALID_PROVIDERS.includes(providerName);
}

/**
 * Optional: Validates if a modelId is known for a given provider based on MODEL_MAP.
 * This is a non-strict validation; an unknown model might still be valid.
 */
export function validateProviderModelCombination(providerName: string, modelId: string): boolean {
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

function getModelConfigForRole(role: keyof Config['models'], explicitRoot: string | null = null): ModelConfig {
  const config = getConfig(explicitRoot);
  const roleConfig = config?.models?.[role];
  if (!roleConfig) {
    log(
      'warn',
      `No model configuration found for role: ${role}. Returning default.`
    );
    return DEFAULTS.models[role] || {} as ModelConfig;
  }
  return roleConfig;
}

export function getMainProvider(explicitRoot: string | null = null): string {
  return getModelConfigForRole('main', explicitRoot).provider;
}

export function getMainModelId(explicitRoot: string | null = null): string {
  return getModelConfigForRole('main', explicitRoot).modelId;
}

export function getMainMaxTokens(explicitRoot: string | null = null): number {
  // Directly return value from config (which includes defaults)
  return getModelConfigForRole('main', explicitRoot).maxTokens;
}

export function getMainTemperature(explicitRoot: string | null = null): number {
  // Directly return value from config
  return getModelConfigForRole('main', explicitRoot).temperature;
}

export function getResearchProvider(explicitRoot: string | null = null): string {
  return getModelConfigForRole('research', explicitRoot).provider;
}

export function getResearchModelId(explicitRoot: string | null = null): string {
  return getModelConfigForRole('research', explicitRoot).modelId;
}

export function getResearchMaxTokens(explicitRoot: string | null = null): number {
  // Directly return value from config
  return getModelConfigForRole('research', explicitRoot).maxTokens;
}

export function getResearchTemperature(explicitRoot: string | null = null): number {
  // Directly return value from config
  return getModelConfigForRole('research', explicitRoot).temperature;
}

export function getFallbackProvider(explicitRoot: string | null = null): string {
  // Directly return value from config (will be undefined if not set)
  return getModelConfigForRole('fallback', explicitRoot).provider;
}

export function getFallbackModelId(explicitRoot: string | null = null): string {
  // Directly return value from config
  return getModelConfigForRole('fallback', explicitRoot).modelId;
}

export function getFallbackMaxTokens(explicitRoot: string | null = null): number {
  // Directly return value from config
  return getModelConfigForRole('fallback', explicitRoot).maxTokens;
}

export function getFallbackTemperature(explicitRoot: string | null = null): number {
  // Directly return value from config
  return getModelConfigForRole('fallback', explicitRoot).temperature;
}

// --- Global Settings Getters ---

function getGlobalConfig(explicitRoot: string | null = null): GlobalConfig {
  const config = getConfig(explicitRoot);
  // Ensure global defaults are applied if global section is missing
  return { ...DEFAULTS.global, ...(config?.global || {}) };
}

export function getLogLevel(explicitRoot: string | null = null): string {
  // Directly return value from config
  return getGlobalConfig(explicitRoot).logLevel.toLowerCase();
}

export function getDebugFlag(explicitRoot: string | null = null): boolean {
  // Directly return value from config, ensure boolean
  return getGlobalConfig(explicitRoot).debug === true;
}

export function getDefaultSubtasks(explicitRoot: string | null = null): number {
  // Directly return value from config, ensure integer
  const val = getGlobalConfig(explicitRoot).defaultSubtasks;
  const parsedVal = parseInt(val.toString(), 10);
  return Number.isNaN(parsedVal) ? DEFAULTS.global.defaultSubtasks : parsedVal;
}

export function getDefaultNumTasks(explicitRoot: string | null = null): number {
  const val = (getGlobalConfig(explicitRoot) as any).defaultNumTasks;
  const parsedVal = parseInt(val, 10);
  return Number.isNaN(parsedVal) ? 5 : parsedVal;
}

export function getDefaultPriority(explicitRoot: string | null = null): Priority {
  // Directly return value from config
  return getGlobalConfig(explicitRoot).defaultPriority;
}

export function getProjectName(explicitRoot: string | null = null): string | undefined {
  // Directly return value from config
  return getGlobalConfig(explicitRoot).projectName;
}



export function getBedrockBaseURL(explicitRoot: string | null = null): string | undefined {
  // Directly return value from config
  return getGlobalConfig(explicitRoot).bedrockBaseURL;
}



/**
 * Gets model parameters (maxTokens, temperature) for a specific role,
 * considering model-specific overrides from supported-models.json.
 */
export function getParametersForRole(
  role: keyof Config['models'],
  explicitRoot: string | null = null
): { maxTokens: number; temperature: number } {
  const roleConfig = getModelConfigForRole(role, explicitRoot);
  const roleMaxTokens = roleConfig.maxTokens;
  const roleTemperature = roleConfig.temperature;
  const modelId = roleConfig.modelId;
  const providerName = roleConfig.provider;

  let effectiveMaxTokens = roleMaxTokens; // Start with the role's default

  try {
    // Find the model definition in MODEL_MAP
    const providerModels = MODEL_MAP[providerName];
    if (providerModels && Array.isArray(providerModels)) {
      const modelDefinition = providerModels.find((m) => m.id === modelId);

      // Check if a model-specific max_tokens is defined and valid
      if (
        modelDefinition &&
        typeof modelDefinition.max_tokens === 'number' &&
        modelDefinition.max_tokens > 0
      ) {
        const modelSpecificMaxTokens = modelDefinition.max_tokens;
        // Use the minimum of the role default and the model specific limit
        effectiveMaxTokens = Math.min(roleMaxTokens, modelSpecificMaxTokens);
        log(
          'debug',
          `Applying model-specific max_tokens (${modelSpecificMaxTokens}) for ${modelId}. Effective limit: ${effectiveMaxTokens}`
        );
      } else {
        log(
          'debug',
          `No valid model-specific max_tokens override found for ${modelId}. Using role default: ${roleMaxTokens}`
        );
      }
    } else {
      log(
        'debug',
        `No model definitions found for provider ${providerName} in MODEL_MAP. Using role default maxTokens: ${roleMaxTokens}`
      );
    }
  } catch (lookupError) {
    log(
      'warn',
      `Error looking up model-specific max_tokens for ${modelId}: ${(lookupError as Error).message}. Using role default: ${roleMaxTokens}`
    );
    // Fallback to role default on error
    effectiveMaxTokens = roleMaxTokens;
  }

  return {
    maxTokens: effectiveMaxTokens,
    temperature: roleTemperature
  };
}

/**
 * Checks if the API key for a given provider is set in the environment.
 * Checks process.env first, then session.env if session is provided, then .env file if projectRoot provided.
 */
export function isApiKeySet(
  providerName: string,
  session: any = null,
  projectRoot: string | null = null
): boolean {
  // Define the expected environment variable name for each provider
  // Bedrock uses AWS credentials, not API keys
  if (providerName?.toLowerCase() === 'bedrock') {
    // AWS SDK handles credential resolution from multiple sources:
    // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    // 2. AWS credentials file (~/.aws/credentials)
    // 3. AWS config file (~/.aws/config with profiles)
    // 4. EC2/ECS instance metadata
    // 5. IAM roles
    // We'll return true and let the SDK handle credential resolution
    return true;
  }

  const keyMap: Record<string, string> = {
    bedrock: 'AWS_ACCESS_KEY_ID'
    // Only Bedrock is supported
  };

  const providerKey = providerName?.toLowerCase();
  if (!providerKey || !keyMap[providerKey]) {
    log('warn', `Unknown provider name: ${providerName} in isApiKeySet check.`);
    return false;
  }

  const envVarName = keyMap[providerKey];
  const apiKeyValue = resolveEnvVariable(envVarName, session, projectRoot);

  // Check if the key exists, is not empty, and is not a placeholder
  return Boolean(
    apiKeyValue &&
    apiKeyValue.trim() !== '' &&
    !/YOUR_.*_API_KEY_HERE/.test(apiKeyValue) && // General placeholder check
    !apiKeyValue.includes('KEY_HERE')
  ); // Another common placeholder pattern
}

/**
 * Checks the API key status within .cursor/mcp.json for a given provider.
 * Reads the mcp.json file, finds the taskmanager-ai server config, and checks the relevant env var.
 */
export function getMcpApiKeyStatus(providerName: string, projectRoot: string | null = null): boolean {
  const rootDir = projectRoot || findProjectRoot(); // Use existing root finding
  if (!rootDir) {
    console.warn(
      chalk.yellow('Warning: Could not find project root to check mcp.json.')
    );
    return false; // Cannot check without root
  }
  const mcpConfigPath = path.join(rootDir, '.cursor', 'mcp.json');

  if (!fs.existsSync(mcpConfigPath)) {
    // console.warn(chalk.yellow('Warning: .cursor/mcp.json not found.'));
    return false; // File doesn't exist
  }

  try {
    const mcpConfigRaw = fs.readFileSync(mcpConfigPath, 'utf-8');
    const mcpConfig = JSON.parse(mcpConfigRaw);

    const mcpEnv = mcpConfig?.mcpServers?.['taskmanager-ai']?.env;
    if (!mcpEnv) {
      // console.warn(chalk.yellow('Warning: Could not find taskmanager-ai env in mcp.json.'));
      return false; // Structure missing
    }

    let apiKeyToCheck = null;

    switch (providerName) {
      case 'bedrock':
        // Bedrock uses AWS credentials, not API keys in MCP
        return true;
      default:
        return false; // Only Bedrock is supported
    }

    	return !!apiKeyToCheck && !/KEY_HERE$/.test(apiKeyToCheck || '');
  } catch (error) {
    console.error(
      chalk.red(`Error reading or parsing .cursor/mcp.json: ${(error as Error).message}`)
    );
    return false;
  }
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  swe_score?: number | null;
  cost_per_1m_tokens?: {
    input: number | null;
    output: number | null;
  } | null;
  allowed_roles?: string[];
}

/**
 * Gets a list of available models based on the MODEL_MAP.
 */
export function getAvailableModels(): AvailableModel[] {
  const available: AvailableModel[] = [];
  for (const [provider, models] of Object.entries(MODEL_MAP)) {
    if (models.length > 0) {
      models.forEach((modelObj) => {
        // Basic name generation - can be improved
        const modelId = modelObj.id;
        const sweScore = modelObj.swe_score;
        const cost = modelObj.cost_per_1m_tokens;
        const allowedRoles = modelObj.allowed_roles || ['main', 'fallback'];
        const nameParts = modelId
          .split('-')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
        // Handle specific known names better if needed
        let name = nameParts.join(' ');
        if (modelId === 'claude-3.5-sonnet-20240620')
          name = 'Claude 3.5 Sonnet';
        		if (modelId === 'claude-sonnet-4-20250514')
          name = 'Claude 3.7 Sonnet';
        if (modelId === 'gpt-4o') name = 'GPT-4o';
        if (modelId === 'gpt-4-turbo') name = 'GPT-4 Turbo';
        if (modelId === 'sonar-pro') name = 'Perplexity Sonar Pro';
        if (modelId === 'sonar-mini') name = 'Perplexity Sonar Mini';

        available.push({
          id: modelId,
          name: name,
          provider: provider,
          swe_score: sweScore,
          cost_per_1m_tokens: cost,
          allowed_roles: allowedRoles
        });
      });
    } else {
      // For providers with empty lists, maybe add a placeholder or skip
      available.push({
        id: `[${provider}-any]`,
        name: `Any (${provider})`,
        provider: provider
      });
    }
  }
  return available;
}

/**
 * Writes the configuration object to the file.
 */
export function writeConfig(config: Config, explicitRoot: string | null = null): boolean {
  // ---> Determine root path reliably <---
  let rootPath = explicitRoot;
  if (explicitRoot === null || explicitRoot === undefined) {
    // Logic matching _loadAndValidateConfig
    const foundRoot = findProjectRoot(); // *** Explicitly call findProjectRoot ***
    if (!foundRoot) {
      console.error(
        chalk.red(
          'Error: Could not determine project root. Configuration not saved.'
        )
      );
      return false;
    }
    rootPath = foundRoot!;
  }
  // ---> End determine root path logic <---

  // Use new config location: .taskmanager/config.json
  const taskmanagerDir = path.join(rootPath!, '.taskmanager');
  const configPath = path.join(taskmanagerDir, 'config.json');

  try {
    // Ensure .taskmanager directory exists
    if (!fs.existsSync(taskmanagerDir)) {
      fs.mkdirSync(taskmanagerDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    loadedConfig = config; // Update the cache after successful write
    return true;
  } catch (error) {
    console.error(
      chalk.red(
        `Error writing configuration to ${configPath}: ${(error as Error).message}`
      )
    );
    return false;
  }
}

/**
 * Checks if a configuration file exists at the project root (new or legacy location)
 */
export function isConfigFilePresent(explicitRoot: string | null = null): boolean {
  return findConfigPath(null, { projectRoot: explicitRoot || undefined }) !== null;
}

/**
 * Gets the user ID from the configuration.
 */
export function getUserId(explicitRoot: string | null = null): string {
  const config = getConfig(explicitRoot);
  if (!config.global) {
    config.global = {} as GlobalConfig; // Ensure global object exists
  }
  if (!config.global.userId) {
    config.global.userId = '1234567890';
    // Attempt to write the updated config.
    // It's important that writeConfig correctly resolves the path
    // using explicitRoot, similar to how getConfig does.
    const success = writeConfig(config, explicitRoot);
    if (!success) {
      // Log an error or handle the failure to write,
      // though for now, we'll proceed with the in-memory default.
      log(
        'warn',
        'Failed to write updated configuration with new userId. Please let the developers know.'
      );
    }
  }
  return config.global.userId;
}

/**
 * Gets a list of all provider names defined in the MODEL_MAP.
 */
export function getAllProviders(): string[] {
  return Object.keys(MODEL_MAP || {});
}

export function getBaseUrlForRole(
  role: keyof Config['models'],
  explicitRoot: string | null = null
): string | undefined {
  const roleConfig = getModelConfigForRole(role, explicitRoot);
  return roleConfig && typeof (roleConfig as any).baseURL === 'string'
    ? (roleConfig as any).baseURL
    : undefined;
}

// Export additional constants
export { VALID_PROVIDERS, MODEL_MAP };