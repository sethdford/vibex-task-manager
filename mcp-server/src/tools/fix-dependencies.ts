/**
 * tools/fix-dependencies.js
 * Tool for automatically fixing invalid task dependencies
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
	fixDependenciesDirect } from '../core/vibex-task-manager-core.js';
import {
	findTasksPath } from '../core/utils/path-utils.js';

/**
 * Register the fixDependencies tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerFixDependenciesTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'fix_dependencies',
		description: 'Fix invalid dependencies in tasks automatically',
		parameters: z.object({
			file: z.string().optional().describe('Absolute path to the tasks file'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Fixing dependencies with args: ${JSON.stringify(args)}`);

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

				const result = await fixDependenciesDirect(
					{
						tasksJsonPath: tasksJsonPath
					},
					log
				);

				if (result.success) {
					log.info(`Successfully fixed dependencies: ${result.data.message}`);
				} else {
					log.error(`Failed to fix dependencies: ${result.error}`);
				}

				return handleApiResult(apiResultToCommandResult(result), log, 'Error fixing dependencies');
			} catch (error) {
				log.error(`Error in fixDependencies tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
