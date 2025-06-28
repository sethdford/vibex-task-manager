export declare class BedrockClient {
  static getDefaultModels(): {
    primary: string;
    smallFast: string;
  };
  
  static convertModelNameToBedrockId(modelName: string): string;
  
  static validateModel(modelId: string): void;
  
  constructor(config?: any);
  
  generateText(options: any): Promise<any>;
}

export declare const CLAUDE_MODELS: Record<string, any>;
export type ClaudeModelId = string; 