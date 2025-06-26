import {
	BedrockRuntimeClient,
	InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { z } from 'zod';
import { log } from '../../scripts/modules/index.js';
import type { Message } from '../types/index.js';

interface DirectBedrockParams {
	modelId: string;
	messages: Message[];
	maxTokens?: number;
	temperature?: number;
	region?: string;
}

interface DirectGenerateObjectParams extends DirectBedrockParams {
	schema?: z.ZodSchema;
}

interface BedrockResponse {
	text: string;
	usage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

interface ObjectResponse {
	object: any;
	usage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

/**
 * Direct Bedrock API call that bypasses the AI SDK
 */
export async function directBedrockCall(
	params: DirectBedrockParams
): Promise<BedrockResponse> {
	const {
		modelId,
		messages,
		maxTokens,
		temperature,
		region = 'us-east-1'
	} = params;

	// Create Bedrock client
	const client = new BedrockRuntimeClient({
		region,
		credentials: fromNodeProviderChain()
	});

	// Format messages for Claude
	const systemMessage = messages.find((m) => m.role === 'system');
	const userMessages = messages.filter((m) => m.role !== 'system');

	// Build the prompt in Claude format
	let prompt = '';
	if (systemMessage) {
		prompt = systemMessage.content + '\n\n';
	}

	// Add conversation history
	for (const msg of userMessages) {
		if (msg.role === 'user') {
			prompt += `Human: ${msg.content}\n\n`;
		} else if (msg.role === 'assistant') {
			prompt += `Assistant: ${msg.content}\n\n`;
		}
	}
	prompt += 'Assistant:';

	// Prepare the request body based on model type
	let requestBody: any;
	if (modelId.includes('claude')) {
		requestBody = {
			prompt,
			max_tokens_to_sample: maxTokens || 4096,
			temperature: temperature || 0.7,
			top_p: 1,
			stop_sequences: ['\n\nHuman:']
		};
	} else {
		// For other models, adjust as needed
		requestBody = {
			inputText: prompt,
			textGenerationConfig: {
				maxTokenCount: maxTokens || 4096,
				temperature: temperature || 0.7,
				topP: 1,
				stopSequences: []
			}
		};
	}

	try {
		const command = new InvokeModelCommand({
			modelId,
			contentType: 'application/json',
			accept: 'application/json',
			body: JSON.stringify(requestBody)
		});

		const response = await client.send(command);
		const responseBody = JSON.parse(new TextDecoder().decode(response.body));

		// Extract text based on model response format
		let text: string;
		if (responseBody.completion) {
			// Claude format
			text = responseBody.completion;
		} else if (responseBody.results && responseBody.results[0]) {
			// Titan format
			text = responseBody.results[0].outputText;
		} else {
			throw new Error('Unknown response format from Bedrock');
		}

		// Calculate approximate token usage
		const inputTokens = Math.ceil(prompt.length / 4);
		const outputTokens = Math.ceil(text.length / 4);

		return {
			text,
			usage: {
				promptTokens: inputTokens,
				completionTokens: outputTokens,
				totalTokens: inputTokens + outputTokens
			}
		};
	} catch (error) {
		log('error', 'Direct Bedrock call failed:', error);
		throw new Error(`Bedrock API error: ${(error as Error).message}`);
	}
}

/**
 * Direct object generation using Bedrock without AI SDK
 */
export async function directGenerateObject(
	params: DirectGenerateObjectParams
): Promise<ObjectResponse> {
	const { schema, messages, ...restParams } = params;

	// Convert Zod schema to JSON schema description
	const schemaDescription = zodSchemaToJsonDescription(schema);

	// Modify messages to include JSON instructions
	const modifiedMessages = [...messages];
	const lastMessage = modifiedMessages[modifiedMessages.length - 1];

	if (lastMessage && lastMessage.role === 'user') {
		lastMessage.content = `${lastMessage.content}

Please respond with a valid JSON object that matches this exact structure:
${schemaDescription}

IMPORTANT: Your response must be ONLY the JSON object, with no additional text before or after. Do not include markdown code blocks or any explanation.`;
	}

	// Make the API call
	const result = await directBedrockCall({
		...restParams,
		messages: modifiedMessages
	});

	// Extract JSON from the response
	let jsonText = result.text.trim();

	// Remove markdown code blocks if present
	jsonText = jsonText.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '');
	jsonText = jsonText.replace(/^```\s*\n?/i, '').replace(/\n?```\s*$/i, '');

	// Parse the JSON
	let parsedObject: any;
	try {
		parsedObject = JSON.parse(jsonText);
	} catch (parseError) {
		// Try to extract JSON from the text
		const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			parsedObject = JSON.parse(jsonMatch[0]);
		} else {
			throw new Error(
				`Failed to parse JSON from response: ${jsonText.substring(0, 200)}...`
			);
		}
	}

	// Validate against schema if provided
	if (schema) {
		const validationResult = schema.safeParse(parsedObject);
		if (!validationResult.success) {
			log(
				'warn',
				'Generated object failed schema validation:',
				validationResult.error
			);
			// For now, we'll still return it but log the warning
		}
	}

	return {
		object: parsedObject,
		usage: result.usage
	};
}

/**
 * Convert Zod schema to human-readable JSON description
 */
function zodSchemaToJsonDescription(schema?: z.ZodSchema): string {
	if (!schema || !(schema as any)._def) return '{}';

	const def = (schema as any)._def;

	if (def.typeName === 'ZodObject') {
		const shape = def.shape();
		const obj: Record<string, any> = {};

		for (const [key, field] of Object.entries(shape)) {
			obj[key] = getFieldType(field as z.ZodSchema);
		}

		return JSON.stringify(obj, null, 2);
	}

	return '{}';
}

function getFieldType(field: z.ZodSchema): string {
	if (!field || !(field as any)._def) return 'any';

	const def = (field as any)._def;
	const description = def.description || '';

	switch (def.typeName) {
		case 'ZodString':
			return description || 'string';
		case 'ZodNumber':
			return description || 'number';
		case 'ZodBoolean':
			return description || 'boolean';
		case 'ZodArray':
			const innerType = (field as any)._def.type
				? getFieldType((field as any)._def.type)
				: 'any';
			return `[${innerType}]` + (description ? ` // ${description}` : '');
		case 'ZodEnum':
			const values = def.values.map((v: string) => `"${v}"`).join(' | ');
			return values + (description ? ` // ${description}` : '');
		case 'ZodOptional':
			const optionalType = getFieldType(def.innerType);
			return `${optionalType} (optional)`;
		default:
			return description || 'any';
	}
}
