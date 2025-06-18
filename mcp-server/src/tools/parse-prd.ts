/**
 * tools/parsePRD.js
 * Tool to parse PRD document and generate tasks
 */
import {
	MCPTool } from './utils.js';

import {
	z } from 'zod';
// // import { parsePRDDirect } from '../core/vibex-task-manager-core.js';
import {
	PRD_FILE,
	TASKMANAGER_DOCS_DIR,
	TASKMANAGER_TASKS_FILE
} from '../../../src/constants/paths.js';

/**
 * Register the parse_prd tool
 * @param {Object} server - FastMCP server instance
 */
export function registerParsePRDTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'parse_prd',
		description: `Parse a Product Requirements Document (PRD) text file to automatically generate initial tasks. Reinitializing the project is not necessary to run this tool. It is recommended to run parse-prd after initializing the project and creating/importing a prd.txt file in the project root's ${TASKMANAGER_DOCS_DIR} directory.`,
		parameters: z.object({
			input: z
				.string()
				.optional()
				.default(PRD_FILE)
				.describe('Absolute path to the PRD document file (.txt, .md, etc.)'),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.'),
			output: z
				.string()
				.optional()
				.describe(
					`Output path for tasks.json file (default: ${TASKMANAGER_TASKS_FILE})`
				),
			numTasks: z
				.string()
				.optional()
				.describe(
					'Approximate number of top-level tasks to generate (default: 10). As the agent, if you have enough information, ensure to enter a number of tasks that would logically scale with project complexity. Avoid entering numbers above 50 due to context window limitations.'
				),
			force: z
				.boolean()
				.optional()
				.default(false)
				.describe('Overwrite existing output file without prompting.'),
			research: z
				.boolean()
				.optional()
				.describe(
					'Enable Vibex Task Manager to use the research role for potentially more informed task generation. Requires appropriate API key.'
				),
			append: z
				.boolean()
				.optional()
				.describe('Append generated tasks to existing file.')
		}),
		execute: async (args, { log, session }) => {
			try {
				// This needs to be implemented based on core services
				// For now, we'll return a message.
				// const result = await parsePRDDirect(args.input, args.projectRoot);
				const message = `Parsing PRD not yet fully implemented in this version. Input: ${args.input}, Project Root: ${args.projectRoot}`;
				session.log({
					type: 'info',
					message
				});
				return {
					success: true,
					stdout: message,
				};
			} catch (e: any) {
				session.log({
					type: 'error',
					message: `Failed to parse PRD: ${e.message}`
				});
				return {
					success: false,
					stderr: `Failed to parse PRD: ${e.message}`
				};
			}
		}
	};

	server.addTool(tool);
}

/*
async function parsePRD(
  options: {
    file?: string;
    status?: string;
  }
) {
  throw new ApiError('Failed to read PRD file.', 500, e);
}
*/

async function getTasks(options: {
  file?: string;
  status?: string;
}) {
  // ... existing code ...
}
