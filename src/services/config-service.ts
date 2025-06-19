/**
 * Configuration Service with AWS Bedrock Model Management
 * TypeScript-first configuration management for Claude models
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import BedrockClient, { CLAUDE_MODELS, ClaudeModelId } from '../core/bedrock-client.js';
import { BedrockAutoDetect } from '../core/bedrock-auto-detect.js';
import {
  Config,
  BedrockModelConfig,
  GlobalConfig,
  IConfigService,
  ConfigurationError,
  DeepPartial,
  ValidationSchemas,
} from '../types/core.js';

export class ConfigService implements IConfigService {
  private projectRoot: string;
  private configFilePath: string;
  private globalConfigPath: string;
  private cache: Config | null = null;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.configFilePath = path.join(projectRoot, '.taskmanager', 'config.json');
    this.globalConfigPath = path.join(os.homedir(), '.taskmanager', 'global-config.json');
  }

  /**
   * Get current configuration with fallbacks
   */
  async getConfig(forceRefresh = false): Promise<Config> {
    if (this.cache && !forceRefresh) {
      return this.cache;
    }

    try {
      // Try to load project-specific config first
      await fs.access(this.configFilePath);
      const content = await fs.readFile(this.configFilePath, 'utf8');
      const config = JSON.parse(content);
      const validatedConfig = await this.validateConfig(config);
      
      this.cache = validatedConfig;
      return validatedConfig;
    } catch (error) {
      // Fallback to global config
      try {
        await fs.access(this.globalConfigPath);
        const content = await fs.readFile(this.globalConfigPath, 'utf8');
        const config = JSON.parse(content);
        const validatedConfig = await this.validateConfig(config);
        
        // Save as project config
        await this.saveConfig(validatedConfig);
        
        this.cache = validatedConfig;
        return validatedConfig;
      } catch (globalError) {
        // Return default config
        const defaultConfig = this.getDefaultConfig();
        await this.saveConfig(defaultConfig);
        
        this.cache = defaultConfig;
        return defaultConfig;
      }
    }
  }

  /**
   * Update configuration with partial updates
   */
  async updateConfig(updates: DeepPartial<Config>): Promise<Config> {
    const currentConfig = await this.getConfig();
    const mergedConfig = this.mergeConfig(currentConfig, updates);
    const validatedConfig = await this.validateConfig(mergedConfig);
    
    await this.saveConfig(validatedConfig);
    this.cache = validatedConfig;
    
    return validatedConfig;
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig(): Promise<Config> {
    const defaultConfig = this.getDefaultConfig();
    await this.saveConfig(defaultConfig);
    this.cache = defaultConfig;
    return defaultConfig;
  }

  /**
   * Validate configuration object
   */
  async validateConfig(config: unknown): Promise<Config> {
    try {
      const validatedConfig = ValidationSchemas.Config.parse(config);
      
      // Additional validation for model IDs
      await this.validateModelConfigs(validatedConfig);
      
      return validatedConfig;
    } catch (error) {
      throw new ConfigurationError(
        `Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'validation'
      );
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): Config {
    return {
      models: {
        main: {
          modelId: 'claude-3-5-sonnet-20240620',
          maxTokens: 8192,
          temperature: 0.3,
          region: 'us-east-1',
        },
        research: {
          modelId: 'claude-3-5-sonnet-20240620',
          maxTokens: 8192,
          temperature: 0.1,
          region: 'us-east-1',
        },
        fallback: {
          modelId: 'claude-3-haiku-20240307',
          maxTokens: 4096,
          temperature: 0.2,
          region: 'us-east-1',
        },
      },
      global: {
        logLevel: 'info',
        debug: false,
        defaultSubtasks: 5,
        defaultPriority: 'medium',
        dataDirectory: '.taskmanager',
        autoSave: true,
        autoBackup: true,
        maxBackups: 10,
      },
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get available Claude models
   */
  getAvailableModels(): Array<{
    id: ClaudeModelId;
    name: string;
    maxTokens: number;
    contextWindow: number;
    inputCostPer1K: number;
    outputCostPer1K: number;
  }> {
    return BedrockClient.getAvailableModels();
  }

  /**
   * Test model configuration
   */
  async testModelConfig(modelConfig: BedrockModelConfig): Promise<boolean> {
    try {
      const client = new BedrockClient({
        region: modelConfig.region,
        profile: modelConfig.profile,
        accessKeyId: modelConfig.accessKeyId,
        secretAccessKey: modelConfig.secretAccessKey,
        sessionToken: modelConfig.sessionToken,
      });

      return await client.testConnection(modelConfig.modelId as ClaudeModelId);
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-detect accessible models and set up configuration
   */
  async autoConfigureModels(options: {
    region?: string;
    profile?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    projectName?: string;
    testAccess?: boolean;
  } = {}): Promise<{
    config: Config;
    accessibleModels: string[];
    inaccessibleModels: string[];
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    // Initialize auto-detect with user's AWS config
    const autoDetect = new BedrockAutoDetect({
      region: options.region || 'us-east-1',
      profile: options.profile,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    });

    // Detect models with optional access testing
    const detectionResult = await autoDetect.detectModels(options.testAccess || false);
    
    if (!detectionResult.hasCredentials) {
      throw new ConfigurationError(
        'No valid AWS credentials found. Please configure AWS credentials for Bedrock access.',
        'credentials'
      );
    }

    if (detectionResult.available.length === 0) {
      throw new ConfigurationError(
        detectionResult.error || 'No accessible Claude models found in your AWS Bedrock region.',
        'no_models'
      );
    }

    // Get model recommendations
    const recommendations = detectionResult.recommendations;
    
    if (!recommendations.main) {
      throw new ConfigurationError(
        'Unable to recommend a main model. Please check your AWS Bedrock access.',
        'no_recommendations'
      );
    }

    // Create configuration with recommended models
    const config = this.getDefaultConfig();
    
    // Update AWS configuration for all models
    const awsConfig = {
      region: options.region || 'us-east-1',
      profile: options.profile,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    };

    // Configure main model
    config.models.main = {
      ...config.models.main,
      ...awsConfig,
      modelId: recommendations.main,
      maxTokens: Math.min(config.models.main.maxTokens, CLAUDE_MODELS[recommendations.main].maxTokens),
    };

    // Configure research model
    if (recommendations.research) {
      config.models.research = {
        ...config.models.research,
        ...awsConfig,
        modelId: recommendations.research,
        maxTokens: Math.min(config.models.research.maxTokens, CLAUDE_MODELS[recommendations.research].maxTokens),
      };
    } else {
      // Use main model for research if no separate research model available
      config.models.research = { ...config.models.main };
      warnings.push('No separate research model available, using main model for research tasks');
    }

    // Configure fallback model
    if (recommendations.fallback && config.models.fallback) {
      config.models.fallback = {
        ...config.models.fallback,
        ...awsConfig,
        modelId: recommendations.fallback,
        maxTokens: Math.min(config.models.fallback.maxTokens, CLAUDE_MODELS[recommendations.fallback].maxTokens),
      };
    } else if (config.models.fallback) {
      // Use main model as fallback if no separate fallback model available
      config.models.fallback = { ...config.models.main };
      warnings.push('No separate fallback model available, using main model as fallback');
    }

    // Update global configuration
    if (options.projectName) {
      config.global.projectName = options.projectName;
    }

    // Validate and save
    const validatedConfig = await this.validateConfig(config);
    await this.saveConfig(validatedConfig);
    
    this.cache = validatedConfig;

    return {
      config: validatedConfig,
      accessibleModels: detectionResult.available.map(m => m.modelId),
      inaccessibleModels: detectionResult.unavailable.map(m => m.modelId),
      warnings,
    };
  }

  /**
   * Set up initial configuration interactively
   */
  async setupConfiguration(options: {
    mainModel?: ClaudeModelId;
    researchModel?: ClaudeModelId;
    fallbackModel?: ClaudeModelId;
    region?: string;
    profile?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    projectName?: string;
  }): Promise<Config> {
    const config = this.getDefaultConfig();

    // Update model configurations and adjust maxTokens to match model capabilities
    if (options.mainModel) {
      config.models.main.modelId = options.mainModel;
      const mainModelInfo = CLAUDE_MODELS[options.mainModel];
      config.models.main.maxTokens = Math.min(config.models.main.maxTokens, mainModelInfo.maxTokens);
    }
    if (options.researchModel) {
      config.models.research.modelId = options.researchModel;
      const researchModelInfo = CLAUDE_MODELS[options.researchModel];
      config.models.research.maxTokens = Math.min(config.models.research.maxTokens, researchModelInfo.maxTokens);
    }
    if (options.fallbackModel && config.models.fallback) {
      config.models.fallback.modelId = options.fallbackModel;
      const fallbackModelInfo = CLAUDE_MODELS[options.fallbackModel];
      config.models.fallback.maxTokens = Math.min(config.models.fallback.maxTokens, fallbackModelInfo.maxTokens);
    }

    // Update AWS configuration for all models
    const awsConfig = {
      region: options.region || 'us-east-1',
      profile: options.profile,
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
    };

    config.models.main = { ...config.models.main, ...awsConfig };
    config.models.research = { ...config.models.research, ...awsConfig };
    if (config.models.fallback) {
      config.models.fallback = { ...config.models.fallback, ...awsConfig };
    }

    // Update global configuration
    if (options.projectName) {
      config.global.projectName = options.projectName;
    }

    // Validate and save
    const validatedConfig = await this.validateConfig(config);
    await this.saveConfig(validatedConfig);
    
    this.cache = validatedConfig;
    return validatedConfig;
  }

  /**
   * Get model-specific configuration
   */
  async getModelConfig(modelType: 'main' | 'research' | 'fallback'): Promise<BedrockModelConfig> {
    const config = await this.getConfig();
    const modelConfig = config.models[modelType];
    
    if (!modelConfig) {
      throw new ConfigurationError(`Model configuration for ${modelType} not found`);
    }
    
    return modelConfig;
  }

  /**
   * Update specific model configuration
   */
  async updateModelConfig(
    modelType: 'main' | 'research' | 'fallback',
    updates: Partial<BedrockModelConfig>
  ): Promise<Config> {
    const config = await this.getConfig();
    
    if (modelType === 'fallback' && !config.models.fallback) {
      config.models.fallback = {
        ...this.getDefaultConfig().models.fallback!,
        ...updates,
      };
    } else {
      config.models[modelType] = {
        ...config.models[modelType],
        ...updates,
      };
    }

    return this.updateConfig({ models: config.models });
  }

  /**
   * Get AWS credentials for a specific model
   */
  async getAwsCredentials(modelType: 'main' | 'research' | 'fallback' = 'main'): Promise<{
    region: string;
    profile?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
  }> {
    const modelConfig = await this.getModelConfig(modelType);
    
    return {
      region: modelConfig.region,
      profile: modelConfig.profile,
      accessKeyId: modelConfig.accessKeyId,
      secretAccessKey: modelConfig.secretAccessKey,
      sessionToken: modelConfig.sessionToken,
    };
  }

  /**
   * Check if configuration is complete and valid
   */
  async isConfigurationValid(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const config = await this.getConfig();
      
      // Check if models are configured
      if (!config.models.main.modelId) {
        errors.push('Main model is not configured');
      }
      
      if (!config.models.research.modelId) {
        warnings.push('Research model is not configured, will use main model');
      }

      // Test model connections
      const mainModelValid = await this.testModelConfig(config.models.main);
      if (!mainModelValid) {
        errors.push('Cannot connect to main model - check AWS credentials and permissions');
      }

      if (config.models.research.modelId) {
        const researchModelValid = await this.testModelConfig(config.models.research);
        if (!researchModelValid) {
          warnings.push('Cannot connect to research model - will fallback to main model');
        }
      }

      if (config.models.fallback) {
        const fallbackModelValid = await this.testModelConfig(config.models.fallback);
        if (!fallbackModelValid) {
          warnings.push('Cannot connect to fallback model');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
      };
    }
  }

  /**
   * Export configuration for backup
   */
  async exportConfig(): Promise<string> {
    const config = await this.getConfig();
    
    // Remove sensitive information for export
    const exportConfig = {
      ...config,
      models: {
        main: {
          ...config.models.main,
          accessKeyId: config.models.main.accessKeyId ? '[REDACTED]' : undefined,
          secretAccessKey: config.models.main.secretAccessKey ? '[REDACTED]' : undefined,
          sessionToken: config.models.main.sessionToken ? '[REDACTED]' : undefined,
        },
        research: {
          ...config.models.research,
          accessKeyId: config.models.research.accessKeyId ? '[REDACTED]' : undefined,
          secretAccessKey: config.models.research.secretAccessKey ? '[REDACTED]' : undefined,
          sessionToken: config.models.research.sessionToken ? '[REDACTED]' : undefined,
        },
        fallback: config.models.fallback ? {
          ...config.models.fallback,
          accessKeyId: config.models.fallback.accessKeyId ? '[REDACTED]' : undefined,
          secretAccessKey: config.models.fallback.secretAccessKey ? '[REDACTED]' : undefined,
          sessionToken: config.models.fallback.sessionToken ? '[REDACTED]' : undefined,
        } : undefined,
      },
    };

    return JSON.stringify(exportConfig, null, 2);
  }

  /**
   * Import configuration from backup
   */
  async importConfig(configJson: string): Promise<Config> {
    try {
      const importedConfig = JSON.parse(configJson);
      const validatedConfig = await this.validateConfig(importedConfig);
      
      await this.saveConfig(validatedConfig);
      this.cache = validatedConfig;
      
      return validatedConfig;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'import'
      );
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.cache = null;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async saveConfig(config: Config): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.configFilePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Update timestamps
    config.lastUpdated = new Date().toISOString();
    
    // Save to file
    await fs.writeFile(this.configFilePath, JSON.stringify(config, null, 2), 'utf8');
    
    // Also save as global config for future projects
    try {
      const globalDir = path.dirname(this.globalConfigPath);
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(this.globalConfigPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      // Ignore global save errors
    }
  }

  private mergeConfig(current: Config, updates: DeepPartial<Config>): Config {
    const merged = { ...current };

    if (updates.models) {
      merged.models = {
        main: { ...current.models.main, ...updates.models.main },
        research: { ...current.models.research, ...updates.models.research },
        fallback: updates.models.fallback 
          ? { ...current.models.fallback, ...updates.models.fallback }
          : current.models.fallback,
      };
    }

    if (updates.global) {
      merged.global = { ...current.global, ...updates.global };
    }

    if (updates.version) {
      merged.version = updates.version;
    }

    return merged;
  }

  private async validateModelConfigs(config: Config): Promise<void> {
    // Validate main model
    if (!BedrockClient.validateModel(config.models.main.modelId)) {
      throw new ConfigurationError(
        `Invalid main model ID: ${config.models.main.modelId}`,
        'main_model'
      );
    }

    // Validate research model
    if (!BedrockClient.validateModel(config.models.research.modelId)) {
      throw new ConfigurationError(
        `Invalid research model ID: ${config.models.research.modelId}`,
        'research_model'
      );
    }

    // Validate fallback model if present
    if (config.models.fallback && !BedrockClient.validateModel(config.models.fallback.modelId)) {
      throw new ConfigurationError(
        `Invalid fallback model ID: ${config.models.fallback.modelId}`,
        'fallback_model'
      );
    }

    // Validate token limits
    for (const [modelType, modelConfig] of Object.entries(config.models)) {
      if (!modelConfig) continue;
      
      const modelInfo = CLAUDE_MODELS[modelConfig.modelId as ClaudeModelId];
      if (modelConfig.maxTokens > modelInfo.maxTokens) {
        throw new ConfigurationError(
          `Max tokens for ${modelType} model (${modelConfig.maxTokens}) exceeds model limit (${modelInfo.maxTokens})`,
          `${modelType}_tokens`
        );
      }
    }

    // Validate temperature values
    for (const [modelType, modelConfig] of Object.entries(config.models)) {
      if (!modelConfig) continue;
      
      if (modelConfig.temperature < 0 || modelConfig.temperature > 1) {
        throw new ConfigurationError(
          `Temperature for ${modelType} model must be between 0 and 1`,
          `${modelType}_temperature`
        );
      }
    }
  }

  /**
   * Get configuration summary for display
   */
  async getConfigSummary(): Promise<{
    mainModel: string;
    researchModel: string;
    fallbackModel?: string;
    region: string;
    hasCredentials: boolean;
    projectName?: string;
    lastUpdated: string;
  }> {
    const config = await this.getConfig();
    
    return {
      mainModel: config.models.main.modelId,
      researchModel: config.models.research.modelId,
      fallbackModel: config.models.fallback?.modelId,
      region: config.models.main.region,
      hasCredentials: Boolean(
        config.models.main.accessKeyId || 
        config.models.main.profile ||
        process.env.AWS_ACCESS_KEY_ID ||
        process.env.AWS_PROFILE
      ),
      projectName: config.global.projectName,
      lastUpdated: config.lastUpdated || 'Unknown',
    };
  }

  /**
   * Get cost estimates for configured models
   */
  async getCostEstimates(): Promise<{
    mainModel: { inputCostPer1K: number; outputCostPer1K: number };
    researchModel: { inputCostPer1K: number; outputCostPer1K: number };
    fallbackModel?: { inputCostPer1K: number; outputCostPer1K: number };
  }> {
    const config = await this.getConfig();
    
    const getModelCosts = (modelId: string) => {
      const model = CLAUDE_MODELS[modelId as ClaudeModelId];
      return {
        inputCostPer1K: model.inputCostPer1K,
        outputCostPer1K: model.outputCostPer1K,
      };
    };

    return {
      mainModel: getModelCosts(config.models.main.modelId),
      researchModel: getModelCosts(config.models.research.modelId),
      fallbackModel: config.models.fallback 
        ? getModelCosts(config.models.fallback.modelId)
        : undefined,
    };
  }
}

export default ConfigService;