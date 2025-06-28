import { z } from 'zod';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicGenerateOptions {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AnthropicResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

// Anthropic model pricing (as of the documentation)
const ANTHROPIC_PRICING = {
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 }, // per 1M tokens
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
} as const;

export class AnthropicClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com';

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY || '';
    if (options?.baseUrl) {
      this.baseUrl = options.baseUrl;
    }

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for Anthropic API access');
    }
  }

  async generateText(options: AnthropicGenerateOptions): Promise<AnthropicResponse> {
    const { model, messages, system, maxTokens = 4096, temperature = 0.7 } = options;

    const requestBody = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
      ...(system && { system })
    };

    try {
      const response = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
      }

      const data = await response.json() as {
        content?: Array<{ type: string; text: string }>;
        usage?: {
          input_tokens: number;
          output_tokens: number;
        };
      };
      
      // Extract text content from response
      const textContent = data.content?.find((c) => c.type === 'text')?.text || '';
      
      // Calculate usage and cost
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;
      
      const pricing = ANTHROPIC_PRICING[model as keyof typeof ANTHROPIC_PRICING] || 
                     ANTHROPIC_PRICING['claude-3-5-sonnet-20241022']; // fallback
      
      const estimatedCost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000;

      return {
        text: textContent,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCost
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to generate text with Anthropic API: ${String(error)}`);
    }
  }

  async generateTextWithFallback(options: AnthropicGenerateOptions): Promise<AnthropicResponse> {
    const defaultModels = AnthropicClient.getDefaultModels();
    const models = [
      options.model,
      defaultModels.primary,  // Use configured primary model
      defaultModels.smallFast // Use configured small/fast model
    ];

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        return await this.generateText({ ...options, model });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Model ${model} failed, trying next fallback...`);
      }
    }

    throw lastError || new Error('All Anthropic models failed');
  }

  // Get the default model configuration based on Claude Code documentation
  static getDefaultModels() {
    return {
      // Use environment variables if set, otherwise fall back to defaults
      primary: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      smallFast: process.env.ANTHROPIC_SMALL_FAST_MODEL || 'claude-3-5-haiku-20241022'
    };
  }

  // Check if API key is configured
  static isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }
} 