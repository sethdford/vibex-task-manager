/**
 * tools/complexity-report.js
 * Tool for displaying the complexity analysis report
 */
import { MCPTool } from './utils.js';

import { z } from 'zod';
import {
	handleApiResult,
	createErrorResponse,
	withNormalizedProjectRoot,
	apiResultToCommandResult
} from './utils.js';
import { complexityReportDirect } from '../core/vibex-task-manager-core.js';
import { COMPLEXITY_REPORT_FILE } from '../../../src/constants/paths.js';
import { findComplexityReportPath } from '../core/utils/path-utils.js';
import { createLogger } from '../core/logger.js';

/**
 * Register the complexityReport tool with the MCP server
 * @param {Object} server - FastMCP server instance
 */
export function registerComplexityReportTool(server: any): void {
		const tool: MCPTool = {
		
		name: 'complexity_report',
		description: 'Display the complexity analysis report in a readable format',
		parameters: z.object({
			file: z
				.string()
				.optional()
				.describe(
					`Path to the report file (default: ${COMPLEXITY_REPORT_FILE})`
				),
			projectRoot: z
				.string()
				.describe('The directory of the project. Must be an absolute path.')
		}),
		execute: withNormalizedProjectRoot(async (args, { log, session }) => {
			const wrappedLogger = createLogger(log);
			try {
				wrappedLogger.info(`Getting complexity report with args: ${JSON.stringify(args)}`);

				const reportPath = findComplexityReportPath(args, wrappedLogger);

				const result = await complexityReportDirect(
					{ ...args, reportPath },
					log // Pass original logger
				);

				return handleApiResult(apiResultToCommandResult(result), log, 'Error getting complexity report');
			} catch (error) {
				wrappedLogger.error(`Error in complexity-report tool: ${(error as Error).message}`);
				return createErrorResponse((error as Error).message);
			}
		})
	};

	server.addTool(tool);
}
