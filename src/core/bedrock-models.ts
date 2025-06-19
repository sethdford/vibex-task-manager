/**
 * AWS Bedrock Model Definitions
 * Complete list of supported models for AWS Bedrock including Claude and Titan
 */

export interface BedrockModelInfo {
  id: string;
  name: string;
  provider: 'anthropic' | 'amazon';
  maxTokens: number;
  contextWindow: number;
  inputCostPer1K: number;
  outputCostPer1K: number;
  supportsTools?: boolean;
  isStreaming?: boolean;
  isClaude?: boolean;
  swe_score?: number;
  taskCapabilities?: {
    canGenerateSubtasks: boolean;
    canAnalyzeComplexity: boolean;
    canParsePRD: boolean;
    maxSubtasksPerTask: number;
  };
}

// All AWS Bedrock Models
export const BEDROCK_MODELS = {
  // Claude 4 (3.7) Models
  'claude-3-7-sonnet-20250219': {
    id: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
    name: 'Claude 4 (3.7) Sonnet',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.5,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: true,
      canParsePRD: true,
      maxSubtasksPerTask: 20
    }
  },
  
  // Claude 4 Models
  'claude-opus-4-20250514': {
    id: 'anthropic.claude-opus-4-20250514-v1:0',
    name: 'Claude Opus 4',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.55,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: true,
      canParsePRD: true,
      maxSubtasksPerTask: 25
    }
  },
  'claude-sonnet-4-20250514': {
    id: 'anthropic.claude-sonnet-4-20250514-v1:0',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.52,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: true,
      canParsePRD: true,
      maxSubtasksPerTask: 20
    }
  },
  
  // Claude 3.5 Models
  'claude-3-5-sonnet-20241022': {
    id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet (Latest)',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.49,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: true,
      canParsePRD: true,
      maxSubtasksPerTask: 15
    }
  },
  'claude-3-5-sonnet-20240620': {
    id: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    name: 'Claude 3.5 Sonnet (June 2024)',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.49,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: true,
      canParsePRD: true,
      maxSubtasksPerTask: 15
    }
  },
  
  // Claude 3 Models
  'claude-3-opus-20240229': {
    id: 'anthropic.claude-3-opus-20240229-v1:0',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 32000,
    contextWindow: 200000,
    inputCostPer1K: 0.015,
    outputCostPer1K: 0.075,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.4,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: true,
      canParsePRD: true,
      maxSubtasksPerTask: 15
    }
  },
  'claude-3-sonnet-20240229': {
    id: 'anthropic.claude-3-sonnet-20240229-v1:0',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.003,
    outputCostPer1K: 0.015,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.39,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: true,
      canParsePRD: true,
      maxSubtasksPerTask: 12
    }
  },
  'claude-3-haiku-20240307': {
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.00025,
    outputCostPer1K: 0.00125,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.26,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: false,
      canParsePRD: false,
      maxSubtasksPerTask: 8
    }
  },
  
  // Claude Legacy Models
  'claude-instant-v1': {
    id: 'anthropic.claude-instant-v1',
    name: 'Claude Instant v1',
    provider: 'anthropic',
    maxTokens: 32000,
    contextWindow: 100000,
    inputCostPer1K: 0.0008,
    outputCostPer1K: 0.0024,
    supportsTools: false,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.15,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: false,
      canParsePRD: false,
      maxSubtasksPerTask: 5
    }
  },
  
  // Amazon Titan Models
  'titan-text-premier-v1': {
    id: 'amazon.titan-text-premier-v1:0',
    name: 'Amazon Titan Text Premier',
    provider: 'amazon',
    maxTokens: 32000,
    contextWindow: 32000,
    inputCostPer1K: 0.0005,
    outputCostPer1K: 0.0015,
    supportsTools: false,
    isStreaming: true,
    isClaude: false,
    swe_score: 0.2,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: false,
      canParsePRD: false,
      maxSubtasksPerTask: 6
    }
  },
  'titan-text-express-v1': {
    id: 'amazon.titan-text-express-v1',
    name: 'Amazon Titan Text Express',
    provider: 'amazon',
    maxTokens: 8000,
    contextWindow: 8000,
    inputCostPer1K: 0.0002,
    outputCostPer1K: 0.0006,
    supportsTools: false,
    isStreaming: true,
    isClaude: false,
    swe_score: 0.15,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: false,
      canParsePRD: false,
      maxSubtasksPerTask: 4
    }
  },
  
  // Claude 3.5 Haiku
  'claude-3-5-haiku-20241022': {
    id: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    maxTokens: 64000,
    contextWindow: 200000,
    inputCostPer1K: 0.001,
    outputCostPer1K: 0.005,
    supportsTools: true,
    isStreaming: true,
    isClaude: true,
    swe_score: 0.35,
    taskCapabilities: {
      canGenerateSubtasks: true,
      canAnalyzeComplexity: false,
      canParsePRD: false,
      maxSubtasksPerTask: 10
    }
  },
} as const satisfies Record<string, BedrockModelInfo>;

export type BedrockModelId = keyof typeof BEDROCK_MODELS;

// Helper functions
export function getBedrockModel(modelId: BedrockModelId): BedrockModelInfo {
  return BEDROCK_MODELS[modelId];
}

export function getClaudeModels(): Array<[BedrockModelId, BedrockModelInfo]> {
  return Object.entries(BEDROCK_MODELS).filter(
    ([_, model]) => model.isClaude
  ) as Array<[BedrockModelId, BedrockModelInfo]>;
}

export function getTitanModels(): Array<[BedrockModelId, BedrockModelInfo]> {
  return Object.entries(BEDROCK_MODELS).filter(
    ([_, model]) => model.provider === 'amazon'
  ) as Array<[BedrockModelId, BedrockModelInfo]>;
}

export function getAllBedrockModels(): Array<[BedrockModelId, BedrockModelInfo]> {
  return Object.entries(BEDROCK_MODELS) as Array<[BedrockModelId, BedrockModelInfo]>;
}

export function findModelByBedrockId(bedrockId: string): [BedrockModelId, BedrockModelInfo] | undefined {
  const entry = Object.entries(BEDROCK_MODELS).find(
    ([_, model]) => model.id === bedrockId
  );
  return entry as [BedrockModelId, BedrockModelInfo] | undefined;
}

// Check if a model supports a specific feature
export function modelSupportsFeature(
  modelId: BedrockModelId,
  feature: 'tools' | 'streaming'
): boolean {
  const model = BEDROCK_MODELS[modelId];
  if (feature === 'tools') return model.supportsTools ?? false;
  if (feature === 'streaming') return model.isStreaming ?? false;
  return false;
}

// Get model by capability
export function getBestModelForBudget(maxCostPer1KTokens: number): BedrockModelId | null {
  const affordableModels = Object.entries(BEDROCK_MODELS)
    .filter(([_, model]) => 
      model.outputCostPer1K <= maxCostPer1KTokens && 
      model.isClaude
    )
    .sort((a, b) => (b[1].swe_score ?? 0) - (a[1].swe_score ?? 0));
    
  return affordableModels[0]?.[0] as BedrockModelId || null;
}

// Model recommendations by use case
export const MODEL_RECOMMENDATIONS = {
  // Best performance (Claude 4)
  bestPerformance: 'claude-3-7-sonnet-20250219' as BedrockModelId,
  
  // Best value (good performance, reasonable cost)
  bestValue: 'claude-3-5-sonnet-20241022' as BedrockModelId,
  
  // Best for long context
  bestLongContext: 'claude-3-7-sonnet-20250219' as BedrockModelId,
  
  // Most cost-effective
  mostCostEffective: 'claude-3-haiku-20240307' as BedrockModelId,
  
  // Best for complex reasoning
  bestComplexReasoning: 'claude-3-opus-20240229' as BedrockModelId,
  
  // Fastest response time
  fastestResponse: 'claude-3-haiku-20240307' as BedrockModelId,
  
  // Best non-Claude option
  bestNonClaude: 'titan-text-premier-v1' as BedrockModelId,
};

// Export utility to validate if a model ID exists
export function isValidBedrockModel(modelId: string): modelId is BedrockModelId {
  return modelId in BEDROCK_MODELS;
}

// Export utility to get model cost estimate
export function estimateModelCost(
  modelId: BedrockModelId,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const model = BEDROCK_MODELS[modelId];
  const inputCost = (inputTokens / 1000) * model.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * model.outputCostPer1K;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

export function getBestModelForTaskCapability(
  capability: keyof BedrockModelInfo['taskCapabilities'],
  maxCostPer1KTokens?: number
): BedrockModelId | null {
  const models = Object.entries(BEDROCK_MODELS) as Array<[BedrockModelId, BedrockModelInfo]>;
  
  // Filter models by capability
  const capableModels = models.filter(([_, model]) => 
    model.taskCapabilities?.[capability] === true
  );

  if (capableModels.length === 0) {
    return null;
  }

  // If cost constraint provided, filter by cost
  if (maxCostPer1KTokens !== undefined) {
    const affordableModels = capableModels.filter(([_, model]) => 
      model.outputCostPer1K <= maxCostPer1KTokens
    );
    
    if (affordableModels.length === 0) {
      return null;
    }

    // Return the most capable affordable model (highest swe_score)
    return affordableModels.reduce((best, current) => 
      (current[1].swe_score || 0) > (best[1].swe_score || 0) ? current : best
    )[0];
  }

  // Return the most capable model (highest swe_score)
  return capableModels.reduce((best, current) => 
    (current[1].swe_score || 0) > (best[1].swe_score || 0) ? current : best
  )[0];
}