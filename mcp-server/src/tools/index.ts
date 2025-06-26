/**
 * tools/index.ts
 * Export all Vibex Task Manager CLI tools for MCP server
 */

import { registerListTasksTool } from './get-tasks.js';
import logger from '../logger.js';
import { registerSetTaskStatusTool } from './set-task-status.js';
import { registerParsePRDTool } from './parse-prd.js';
import { registerUpdateTool } from './update.js';
import { registerUpdateTaskTool } from './update-task.js';
import { registerUpdateSubtaskTool } from './update-subtask.js';
import { registerGenerateTool } from './generate.js';
import { registerShowTaskTool } from './get-task.js';
import { registerNextTaskTool } from './next-task.js';
import { registerRemoveSubtaskTool } from './remove-subtask.js';
import { registerAnalyzeProjectComplexityTool } from './analyze.js';
import { registerClearSubtasksTool } from './clear-subtasks.js';
import { registerRemoveDependencyTool } from './remove-dependency.js';
import { registerValidateDependenciesTool } from './validate-dependencies.js';
import { registerFixDependenciesTool } from './fix-dependencies.js';
import { registerComplexityReportTool } from './complexity-report.js';
import { registerAddDependencyTool } from './add-dependency.js';
import { registerRemoveTaskTool } from './remove-task.js';
import { registerModelsTool } from './models.js';
// // import { registerMoveTaskTool } from './move-task.js';
// // // import { registerCopyTagTool } from './copy-tag.js';

// Type for MCP server instance with tool registration
interface MCPServer {
	addTool: (tool: any) => void;
	// Add other methods as needed
}

/**
 * Register all Vibex Task Manager tools with the MCP server
 */
export function registerVibexTaskManagerTools(server: MCPServer): void {
	try {
		// Register each tool in a logical workflow order

		// Group 1: Initialization & Setup
		// // registerInitializeProjectTool(server); // DELETED
		registerModelsTool(server);
		registerParsePRDTool(server);

		// Group 2: Task Listing & Viewing
		registerListTasksTool(server);
		registerShowTaskTool(server);
		registerNextTaskTool(server);
		registerComplexityReportTool(server);

		// Group 3: Task Management
		// // registerAddTaskTool(server); // DELETED
		registerUpdateTaskTool(server);
		registerRemoveTaskTool(server);
		// // // registerMoveTaskTool(server); // DELETED
		registerSetTaskStatusTool(server);

		// Group 4: Subtask Management
		// // registerAddSubtaskTool(server); // DELETED
		registerUpdateSubtaskTool(server);
		registerRemoveSubtaskTool(server);
		registerClearSubtasksTool(server);

		// Group 5: Task Expansion & Analysis
		// // registerExpandTaskTool(server); // DELETED
		// // registerExpandAllTool(server); // DELETED
		registerAnalyzeProjectComplexityTool(server);

		// Group 6: Dependency Management
		registerAddDependencyTool(server);
		registerRemoveDependencyTool(server);
		// registerMoveTaskTool(server);
		// // registerCopyTagTool(server);
		registerClearSubtasksTool(server);
		registerValidateDependenciesTool(server);
		registerFixDependenciesTool(server);

		// Group 7: Code Generation & Updates
		registerGenerateTool(server);
		registerUpdateTool(server);

		logger.info(
			`✅ All ${getTotalToolCount()} Task Manager tools registered successfully`
		);
		logger.info(
			'📋 Available commands: list-tasks, show-task, add-task, update-task, parse-prd, etc.'
		);
		logger.info('🔍 For specific help, use the tool with --help parameter');
	} catch (error) {
		logger.error('Failed to register Task Manager tools:', error);
		throw error;
	}
}

/**
 * Get the total count of registered tools
 */
function getTotalToolCount(): number {
	// This should match the number of registerXXXTool calls
	return 20;
}

// Export individual registration functions for testing or selective loading
export {
	registerListTasksTool,
	registerSetTaskStatusTool,
	registerParsePRDTool,
	registerUpdateTool,
	registerUpdateTaskTool,
	registerUpdateSubtaskTool,
	registerGenerateTool,
	registerShowTaskTool,
	registerNextTaskTool,
	// // registerExpandTaskTool, // DELETED
	// // registerAddTaskTool, // DELETED
	// // registerAddSubtaskTool, // DELETED
	registerRemoveSubtaskTool,
	registerAnalyzeProjectComplexityTool,
	registerClearSubtasksTool,
	// // registerExpandAllTool, // DELETED
	registerRemoveDependencyTool,
	registerValidateDependenciesTool,
	registerFixDependenciesTool,
	registerComplexityReportTool,
	registerAddDependencyTool,
	registerRemoveTaskTool,
	// // registerInitializeProjectTool, // DELETED
	registerModelsTool
	// // registerMoveTaskTool, // DELETED
	// // registerCopyTagTool, // DELETED
};
