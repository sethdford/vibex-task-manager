/**
 * tools/generate.js
 * Tool to generate individual task files from tasks.json
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot
} from './utils.js';
import { generateTaskFilesDirect } from '../core/vibex-task-manager-core.js';
import { findTasksPath } from '../core/utils/path-utils.js';
import path from 'path';

/**
 * Register the generate tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerGenerateTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'generate',
		description:
			'Generates individual task files in tasks/ directory based on tasks.json',
		parameters: z.object({
			file: z.string().optional().describe('Absolute path to the tasks file'),
			output: z
				.string()
				.optional()
				.describe('Output directory (default: same directory as tasks file)'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			try {
				log.info(`Generating task files with args: ${JSON.stringify(args)}`);

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

				const outputDir = args.output
					? path.resolve(args.projectRoot, args.output)
					: path.dirname(tasksJsonPath);

				const result = await generateTaskFilesDirect(
					{
						tasksJsonPath: tasksJsonPath,
						outputDir: outputDir
					},
					log
				);

				if (result.success) {
					log.info(`Successfully generated task files: ${result.data.message}`);
				} else {
					log.error(
						`Failed to generate task files: ${result.error?.message || 'Unknown error'}`
					);
				}

				return handleApiResult(result, log, 'Error generating task files');
			} catch (error) {
				log.error(`Error in generate tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
}
