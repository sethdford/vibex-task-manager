/**
 * tools/validate-dependencies.js
 * Tool for validating task dependencies
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot
} from './utils.js';
import { validateDependenciesDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';

/**
 * Register the validateDependencies tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerValidateDependenciesTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'validate_dependencies',
		description:
			'Check tasks for dependency issues (like circular references or links to non-existent tasks) without making changes.',
		parameters: z.object({
			file: z.string().optional().describe('Absolute path to the tasks file'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Validating dependencies with args: ${JSON.stringify(args)}`);

				// Use args.projectRoot directly (guaranteed by withNormalizedProjectRoot)
				let tasksJsonPath;
				try {
					tasksJsonPath = findTasksPath(
						{ projectRoot: args.projectRoot, file: args.file },
						log
					);
				} catch (error) {
					log.error(`Error finding tasks.json: ${(error as Error).message}`);
					return createErrorResponse(
						`Failed to find tasks.json: ${(error as Error).message}`
					);
				}

				const result = await validateDependenciesDirect(
					{
						tasksJsonPath: tasksJsonPath
					},
					log
				);

				if (result.success) {
					log.info(
						`Successfully validated dependencies: ${result.data.message}`
					);
				} else {
					log.error(`Failed to validate dependencies: ${result.error}`);
				}

				return handleApiResult(result, log, 'Error validating dependencies');
			} catch (error) {
				log.error(`Error in validateDependencies tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
}
