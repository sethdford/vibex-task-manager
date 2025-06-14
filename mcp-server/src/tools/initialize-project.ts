import {
	z } from 'zod';
import {
	apiResultToCommandResult,
	createErrorResponse,
	handleApiResult,
	MCPTool,
	withNormalizedProjectRoot
} from './utils.js';
import {
	initializeProjectDirect } from '../core/vibex-task-manager-core.js';

export function registerInitializeProjectTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'initialize_project',
		description:
			'Initializes a new Task Manager project structure by calling the core initialization logic. Creates necessary folders and configuration files for Task Manager in the current directory.',
		parameters: z.object({
			skipInstall: z
				.boolean()
				.optional()
				.default(false)
				.describe(
					'Skip installing dependencies automatically. Never do this unless you are sure the project is already installed.'
				),
			addAliases: z
				.boolean()
				.optional()
				.default(false)
				.describe('Add shell aliases (tm, taskmaster) to shell config file.'),
			yes: z
				.boolean()
				.optional()
				.default(true)
				.describe(
					'Skip prompts and use default values. Always set to true for MCP tools.'
				),
			projectRoot: z
				.string()
				.describe(
					'The root directory for the project. ALWAYS SET THIS TO THE PROJECT ROOT DIRECTORY. IF NOT SET, THE TOOL WILL NOT WORK.'
				)
		}),
		execute: withNormalizedProjectRoot(async (args, context) => {
			const { log } = context;
			const session = context.session;

			try {
				log.info(
					`Executing initialize_project tool with args: ${JSON.stringify(args)}`
				);

				const result = await initializeProjectDirect(args, log, { session });

				return handleApiResult(apiResultToCommandResult(result), log, 'Initialization failed');
			} catch (error) {
				const errorMessage = `Project initialization tool failed: ${(error as Error).message || 'Unknown error'}`;
				log.error(errorMessage, error);
				return createErrorResponse(errorMessage, { details: error.stack });
			}
		})
	};

	server.addTool(tool);
}
