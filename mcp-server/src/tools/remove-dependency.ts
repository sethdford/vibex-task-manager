/**
 * tools/remove-dependency.js
 * Tool for removing a dependency from a task
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	apiResultToCommandResult
} from './utils.js';
import { removeDependencyDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the removeDependency tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerRemoveDependencyTool(server: any): void {
	const tool: MCPTool = {
		name: 'remove_dependency',
		description: 'Remove a dependency from a task',
		parameters: z.object({
			id: z.string().describe('Task ID to remove dependency from'),
			dependsOn: z.string().describe('Task ID to remove as a dependency'),
			file: z
				.string()
				.optional()
				.describe(
					'Absolute path to the tasks file (default: tasks/tasks.json)'
				),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(
					`Removing dependency from task ${args.id}, dependency ${args.dependsOn}`
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

				const result = await removeDependencyDirect(
					{
						tasksJsonPath,
						id: args.id,
						dependsOn: args.dependsOn
					},
					log
				);

				if (result.success) {
					wrappedLogger.info(
						`Successfully removed dependency: ${result.data?.message}`
					);
				} else {
					wrappedLogger.error(`Failed to remove dependency: ${result.error}`);
				}

				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Error removing dependency'
				);
			} catch (error) {
				wrappedLogger.error(
					`Error in remove-dependency tool: ${(error as Error).message}`
				);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
