/**
 * models.js
 * MCP tool for managing AI model configurations
 */
import {
	MCPTool } from './utils.js';

import {
	z } from 'zod';
import {
	apiResultToCommandResult,
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot
} from './utils.js';
import {
	modelsDirect } from '../core/vibex-task-manager-core.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the models tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerModelsTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'models',
		description:
			'Get information about available AI models or set model configurations. Run without arguments to get the current model configuration and API key status for the selected model providers.',
		parameters: z.object({
			setMain: z
				.string()
				.optional()
				.describe(
					'Set the primary model for task generation/updates. Model provider API key is required in the MCP config ENV.'
				),
			setResearch: z
				.string()
				.optional()
				.describe(
					'Set the model for research-backed operations. Model provider API key is required in the MCP config ENV.'
				),
			setFallback: z
				.string()
				.optional()
				.describe(
					'Set the model to use if the primary fails. Model provider API key is required in the MCP config ENV.'
				),
			listAvailableModels: z
				.boolean()
				.optional()
				.describe(
					'List all available models not currently in use. Input/output costs values are in dollars (3 is $3.00).'
				),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.'),
			openrouter: z
				.boolean()
				.optional()
				.describe('Indicates the set model ID is a custom OpenRouter model.'),
			ollama: z
				.boolean()
				.optional()
				.describe('Indicates the set model ID is a custom Ollama model.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(`Models tool execution with args: ${JSON.stringify(args)}`);

				const result = await modelsDirect(
					{
						...args
					},
					log, // Pass original logger
					{ session }
				);

				if (result.success) {
					wrappedLogger.info(`Models operation successful: ${result.data?.message}`);
				} else {
					wrappedLogger.error(
						`Models operation failed: ${result.error?.message || 'Unknown error'}`
					);
				}

				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Models operation failed'
				);
			} catch (error) {
				wrappedLogger.error(`Error in models tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
