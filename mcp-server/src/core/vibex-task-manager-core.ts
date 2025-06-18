/**
 * vibex-task-manager-core.ts
 * Central module that imports and re-exports all direct function implementations
 * for improved organization and maintainability.
 */

// Import direct function implementations
import { listTasksDirect } from './direct-functions/list-tasks.js';
import { getCacheStatsDirect } from './direct-functions/cache-stats.js';
// // import { parsePRDDirect } from './direct-functions/parse-prd.js';
import { updateTasksDirect } from './direct-functions/update-tasks.js';
import { updateTaskByIdDirect } from './direct-functions/update-task-by-id.js';
import { updateSubtaskByIdDirect } from './direct-functions/update-subtask-by-id.js';
import { generateTaskFilesDirect } from './direct-functions/generate-task-files.js';
import { setTaskStatusDirect } from './direct-functions/set-task-status.js';
import { showTaskDirect } from './direct-functions/show-task.js';
import { nextTaskDirect } from './direct-functions/next-task.js';
import { removeSubtaskDirect } from './direct-functions/remove-subtask.js';
import { analyzeTaskComplexityDirect } from './direct-functions/analyze-task-complexity.js';
import { clearSubtasksDirect } from './direct-functions/clear-subtasks.js';
import { removeDependencyDirect } from './direct-functions/remove-dependency.js';
import { validateDependenciesDirect } from './direct-functions/validate-dependencies.js';
import { fixDependenciesDirect } from './direct-functions/fix-dependencies.js';
import { complexityReportDirect } from './direct-functions/complexity-report.js';
import { addDependencyDirect } from './direct-functions/add-dependency.js';
import { removeTaskDirect } from './direct-functions/remove-task.js';
import { modelsDirect } from './direct-functions/models.js';

// Re-export utility functions
export { findTasksPath } from './utils/path-utils.js';

// Define function type for direct functions
type DirectFunction = (...args: any[]) => any;

// Use Map for potential future enhancements like introspection or dynamic dispatch
export const directFunctions = new Map<string, DirectFunction>([
	['listTasksDirect', listTasksDirect],
	['getCacheStatsDirect', getCacheStatsDirect],
	// ['parsePRDDirect', parsePRDDirect],
// 	['updateTasksDirect', updateTasksDirect],
	['updateTaskByIdDirect', updateTaskByIdDirect],
	['updateSubtaskByIdDirect', updateSubtaskByIdDirect],
	['generateTaskFilesDirect', generateTaskFilesDirect],
	['setTaskStatusDirect', setTaskStatusDirect],
	['showTaskDirect', showTaskDirect],
	['nextTaskDirect', nextTaskDirect],
	['removeSubtaskDirect', removeSubtaskDirect],
	['analyzeTaskComplexityDirect', analyzeTaskComplexityDirect],
	['clearSubtasksDirect', clearSubtasksDirect],
	['removeDependencyDirect', removeDependencyDirect],
	['validateDependenciesDirect', validateDependenciesDirect],
	['fixDependenciesDirect', fixDependenciesDirect],
	['complexityReportDirect', complexityReportDirect],
	['addDependencyDirect', addDependencyDirect],
	['removeTaskDirect', removeTaskDirect],
	['modelsDirect', modelsDirect]
]);

// Re-export all direct function implementations
export {
	listTasksDirect,
	getCacheStatsDirect,
	// parsePRDDirect,
// 	updateTasksDirect,
	updateTaskByIdDirect,
	updateSubtaskByIdDirect,
	generateTaskFilesDirect,
	setTaskStatusDirect,
	showTaskDirect,
	nextTaskDirect,
	removeSubtaskDirect,
	analyzeTaskComplexityDirect,
	clearSubtasksDirect,
	removeDependencyDirect,
	validateDependenciesDirect,
	fixDependenciesDirect,
	complexityReportDirect,
	addDependencyDirect,
	removeTaskDirect,
	modelsDirect
};
