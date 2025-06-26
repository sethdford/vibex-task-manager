/**
 * tools/add-dependency.js
 * Tool for adding a dependency to a task
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	MCPToolResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	apiResultToCommandResult,
	createSuccessResponse,
	InputLogger,
	Logger
} from './utils.js';
import { addDependencyDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the addDependency tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerAddDependencyTool(server: any): void {
	const tool: MCPTool = {
		name: 'add_dependency',
		description: 'Add a dependency relationship between two tasks',
		parameters: z.object({
			id: z.string().describe('ID of task that will depend on another task'),
			dependsOn: z
				.string()
				.describe('ID of task that will become a dependency'),
			file: z.string().optional().describe('Path to the tasks file'),
			projectRoot: z.string().optional().describe('The project root directory.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(
					`Adding dependency for task ${args.id} to depend on ${args.dependsOn}`
				);

				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						wrappedLogger
					);
				} catch (error) {
					wrappedLogger.error(
						`Error finding tasks.json: ${(error as Error).message}`
					);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

				const result = await addDependencyDirect(
					{
						tasksJsonPath,
						id: args.id,
						dependsOn: args.dependsOn
					},
					log // Pass original logger
				);

				if (result.success) {
					wrappedLogger.info(
						`Successfully added dependency: ${result.data?.message || 'Done'}`
					);
				} else {
					wrappedLogger.error(
						`Failed to add dependency: ${result.error?.message || 'Unknown error'}`
					);
				}

				const commandResult = apiResultToCommandResult(result);
				if (commandResult.success) {
					return createSuccessResponse(
						commandResult.data || commandResult.stdout
					);
				} else {
					const errorMessage =
						commandResult.error ||
						commandResult.stderr ||
						'Unknown error occurred';
					const errorPrefix = 'Error adding dependency';
					wrappedLogger.error(`${errorPrefix}: ${errorMessage}`);
					return createErrorResponse(`${errorPrefix}: ${errorMessage}`);
				}
			} catch (error) {
				wrappedLogger.error(
					`Error in addDependency tool: ${(error as Error).message}`
				);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
