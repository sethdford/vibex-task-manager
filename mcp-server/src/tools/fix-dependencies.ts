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
import { createLogger } from '../core/logger.js';

/**
 * Register the fixDependencies tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerFixDependenciesTool(server: any): void {
	const tool: MCPTool = {
		name: 'fix_dependencies',
		description: 'Fix invalid dependencies in tasks automatically',
		parameters: z.object({
			file: z.string().optional().describe('Path to the tasks file'),
			projectRoot: z.string().optional().describe('The project root directory.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info('Fixing dependencies...');

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

				const result = await fixDependenciesDirect(
					{ tasksJsonPath },
					log // Pass original logger
				);

				if (result.success) {
					wrappedLogger.info(
						`Successfully fixed dependencies: ${result.data?.message}`
					);
				} else {
					wrappedLogger.error(`Failed to fix dependencies: ${result.error}`);
				}

				return handleApiResult(
					apiResultToCommandResult(result),
					log,
					'Error fixing dependencies'
				);
			} catch (error) {
				wrappedLogger.error(
					`Error in fix-dependencies tool: ${(error as Error).message}`
				);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
