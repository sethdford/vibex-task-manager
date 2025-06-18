/**
 * Direct function wrapper for clearSubtasks
 */

import { Logger } from '../../../../src/types/index.js';
import { clearSubtasks } from '../../../../scripts/modules/task-manager.js';
import {
	enableSilentMode,
	disableSilentMode
} from '../../../../scripts/modules/utils.js';
import fs from 'fs';
import { AnyLogger, createLogger } from '../logger.js';

interface ClearSubtasksArgs {
	tasksJsonPath: string;
	id?: string;
	all?: boolean;
}

/**
 * Clear subtasks from specified tasks
 * @param {Object} args - Function arguments
 * @param {string} args.tasksJsonPath - Explicit path to the tasks.json file.
 * @param {string} [args.id] - Task IDs (comma-separated) to clear subtasks from
 * @param {boolean} [args.all] - Clear subtasks from all tasks
 * @param {Object} log - Logger object
 * @returns {Promise<{success: boolean, data?: Object, error?: {code: string, message: string}}>}
 */
export async function clearSubtasksDirect(
	args: ClearSubtasksArgs,
	log: AnyLogger
) {
	const wrappedLogger = createLogger(log);
	try {
		wrappedLogger.info(`Clearing subtasks with args: ${JSON.stringify(args)}`);
		const { tasksJsonPath, id, all } = args;

		// Check if tasksJsonPath was provided
		if (!tasksJsonPath) {
			wrappedLogger.error('clearSubtasksDirect called without tasksJsonPath');
			return {
				success: false,
				error: {
					code: 'MISSING_ARGUMENT',
					message: 'tasksJsonPath is required'
				}
			};
		}

		// Either id or all must be provided
		if (!id && !all) {
			return {
				success: false,
				error: {
					code: 'INPUT_VALIDATION_ERROR',
					message:
						'Either task IDs with id parameter or all parameter must be provided'
				}
			};
		}

		// Use provided path
		const tasksPath = tasksJsonPath;

		// Check if tasks.json exists
		if (!fs.existsSync(tasksPath)) {
			return {
				success: false,
				error: {
					code: 'FILE_NOT_FOUND_ERROR',
					message: `Tasks file not found at ${tasksPath}`
				}
			};
		}

		let taskIdsString: string;
		let taskIdArray: (string | number)[];

		if (all) {
			const data = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
			taskIdArray = data.tasks.map((t: any) => t.id);
			taskIdsString = taskIdArray.join(',');
		} else {
			taskIdsString = args.id!;
			taskIdArray = taskIdsString.split(',').map((i) => i.trim());
		}

		wrappedLogger.info(`Clearing subtasks from tasks: ${taskIdsString}`);

		// Enable silent mode to prevent console logs from interfering with JSON response
		enableSilentMode();

		// Call the core function
		await clearSubtasks(tasksPath, taskIdsString);

		// Restore normal logging
		disableSilentMode();

		// Read the updated data to provide a summary
		const updatedData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

		// Build a summary of what was done
		const clearedTasksCount = taskIdArray.length;
		const taskSummary = taskIdArray.map((id) => {
			const numId = typeof id === 'string' ? parseInt(id.trim(), 10) : id;
			const task = updatedData.tasks.find((t: any) => t.id === numId);
			return task
				? { id: numId, title: task.title }
				: { id: numId, title: 'Task not found' };
		});

		return {
			success: true,
			data: {
				message: `Successfully cleared subtasks from ${clearedTasksCount} task(s)`,
				tasksCleared: taskSummary
			}
		};
	} catch (error) {
		// Make sure to restore normal logging even if there's an error
		disableSilentMode();

		wrappedLogger.error(`Error in clearSubtasksDirect: ${(error as Error).message}`);
		return {
			success: false,
			error: {
				code: 'CLEAR_SUBTASKS_FAILED',
				message: (error as Error).message
			}
		};
	}
}
