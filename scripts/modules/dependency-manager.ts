/**
 * dependency-manager.js
 * Manages task dependencies and relationships
 */

import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';

import {
	log,
	readJSON,
	writeJSON,
	formatTaskId,
	findCycles,
	isSilentMode
} from './utils.js';
import { taskExists } from './task-manager.js';

import { displayBanner } from './ui.js';

import { generateTaskFiles } from './task-manager.js';

// Define types for tasks and subtasks to help with type checking
type Task = {
	id: number;
	title: string;
	description: string;
	status: string;
	dependencies: (string | number)[];
	subtasks?: Subtask[];
};

type Subtask = {
	id: number;
	title: string;
	description: string;
	status: string;
	dependencies: (string | number)[];
};

type TaskOrSubtask = Task | Subtask;

type DependencyIssue = {
	type: 'self' | 'missing' | 'circular';
	taskId: string | number;
	dependencyId?: string | number;
	message: string;
};

/**
 * Add a dependency to a task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number|string} taskId - ID of the task to add dependency to
 * @param {number|string} dependencyId - ID of the task to add as dependency
 */
async function addDependency(tasksPath: string, taskId: number | string, dependencyId: number | string) {
	log('info', `Adding dependency ${dependencyId} to task ${taskId}...`);

	const data = readJSON(tasksPath);
	if (!data || !data.tasks) {
		log('error', 'No valid tasks found in tasks.json');
		process.exit(1);
	}

	// Format the task and dependency IDs correctly
	const formattedTaskId =
		typeof taskId === 'string' && taskId.includes('.')
			? taskId
			: parseInt(String(taskId), 10);

	const formattedDependencyId = formatTaskId(String(dependencyId));

	// Check if the dependency task or subtask actually exists
	if (!taskExists(data.tasks, formattedDependencyId)) {
		log(
			'error',
			`Dependency target ${formattedDependencyId} does not exist in tasks.json`
		);
		process.exit(1);
	}

	// Find the task to update
	let targetTask: TaskOrSubtask | null = null;
	let isSubtask = false;

	if (typeof formattedTaskId === 'string' && formattedTaskId.includes('.')) {
		// Handle dot notation for subtasks (e.g., "1.2")
		const [parentId, subtaskId] = formattedTaskId
			.split('.')
			.map((id) => parseInt(id, 10));
		const parentTask = data.tasks.find((t: Task) => t.id === parentId);

		if (!parentTask) {
			log('error', `Parent task ${parentId} not found.`);
			process.exit(1);
		}

		if (!parentTask.subtasks) {
			log('error', `Parent task ${parentId} has no subtasks.`);
			process.exit(1);
		}

		targetTask = parentTask.subtasks.find((s) => s.id === subtaskId);
		isSubtask = true;

		if (!targetTask) {
			log('error', `Subtask ${formattedTaskId} not found.`);
			process.exit(1);
		}
	} else {
		// Regular task (not a subtask)
		targetTask = data.tasks.find((t: Task) => t.id === formattedTaskId);

		if (!targetTask) {
			log('error', `Task ${formattedTaskId} not found.`);
			process.exit(1);
		}
	}

	// Initialize dependencies array if it doesn't exist
	if (!targetTask.dependencies) {
		targetTask.dependencies = [];
	}

	// Check if dependency already exists
	if (
		targetTask.dependencies.some((d) => {
			// Convert both to strings for comparison to handle both numeric and string IDs
			return String(d) === String(formattedDependencyId);
		})
	) {
		log(
			'warn',
			`Dependency ${formattedDependencyId} already exists in task ${formattedTaskId}.`
		);
		return;
	}

	// Check if the task is trying to depend on itself - compare full IDs (including subtask parts)
	if (String(formattedTaskId) === String(formattedDependencyId)) {
		log('error', `Task ${formattedTaskId} cannot depend on itself.`);
		process.exit(1);
	}

	// For subtasks of the same parent, we need to make sure we're not treating it as a self-dependency
	// Check if we're dealing with subtasks with the same parent task
	let isSelfDependency = false;

	if (
		typeof formattedTaskId === 'string' &&
		typeof formattedDependencyId === 'string' &&
		formattedTaskId.includes('.') &&
		formattedDependencyId.includes('.')
	) {
		const [taskParentId] = formattedTaskId.split('.');
		const [depParentId] = formattedDependencyId.split('.');

		// Only treat it as a self-dependency if both the parent ID and subtask ID are identical
		isSelfDependency = formattedTaskId === formattedDependencyId;

		// Log for debugging
		log(
			'debug',
			`Adding dependency between subtasks: ${formattedTaskId} depends on ${formattedDependencyId}`
		);
		log(
			'debug',
			`Parent IDs: ${taskParentId} and ${depParentId}, Self-dependency check: ${isSelfDependency}`
		);
	}

	if (isSelfDependency) {
		log('error', `Subtask ${formattedTaskId} cannot depend on itself.`);
		process.exit(1);
	}

	// Check for circular dependencies
	let dependencyChain = [formattedTaskId];
	if (
		!isCircularDependency(data.tasks, formattedDependencyId, dependencyChain as (string | number)[])
	) {
		// Add the dependency
		targetTask.dependencies.push(formattedDependencyId);

		// Sort dependencies numerically or by parent task ID first, then subtask ID
		targetTask.dependencies.sort((a, b) => {
			if (typeof a === 'number' && typeof b === 'number') {
				return a - b;
			} else if (typeof a === 'string' && typeof b === 'string') {
				const [aParent, aChild] = a.split('.').map(Number);
				const [bParent, bChild] = b.split('.').map(Number);
				return aParent !== bParent ? aParent - bParent : aChild - bChild;
			} else if (typeof a === 'number') {
				return -1; // Numbers come before strings
			} else {
				return 1; // Strings come after numbers
			}
		});

		// Save changes
		writeJSON(tasksPath, data);
		log(
			'success',
			`Added dependency ${formattedDependencyId} to task ${formattedTaskId}`
		);

		// Display a more visually appealing success message
		if (!isSilentMode()) {
			console.log(
				boxen(
					chalk.green(`Successfully added dependency:\n\n`) +
						`Task ${chalk.bold(formattedTaskId)} now depends on ${chalk.bold(formattedDependencyId)}`,
					{
						padding: 1,
						borderColor: 'green',
						borderStyle: 'round',
						margin: { top: 1 }
					}
				)
			);
		}

		// Generate updated task files
		await generateTaskFiles(tasksPath, path.dirname(tasksPath));

		log('info', 'Task files regenerated with updated dependencies.');
	} else {
		log(
			'error',
			`Cannot add dependency ${formattedDependencyId} to task ${formattedTaskId} as it would create a circular dependency.`
		);
		process.exit(1);
	}
}

/**
 * Remove a dependency from a task
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number|string} taskId - ID of the task to remove dependency from
 * @param {number|string} dependencyId - ID of the task to remove as dependency
 */
async function removeDependency(tasksPath: string, taskId: number | string, dependencyId: number | string) {
	log('info', `Removing dependency ${dependencyId} from task ${taskId}...`);

	// Read tasks file
	const data = readJSON(tasksPath);
	if (!data || !data.tasks) {
		log('error', 'No valid tasks found.');
		process.exit(1);
	}

	// Format IDs
	const formattedTaskId = formatTaskId(String(taskId));
	const formattedDependencyId = formatTaskId(String(dependencyId));

	let taskFound = false;
	let dependencyFound = false;
	let taskFileRegenerated = false;

	// Find the task or subtask and remove the dependency
	data.tasks.forEach((task: Task) => {
		if (String(task.id) === String(formattedTaskId)) {
			taskFound = true;
			if (task.dependencies) {
				const initialLength = task.dependencies.length;
				task.dependencies = task.dependencies.filter(
					(d) => String(d) !== String(formattedDependencyId)
				);
				if (task.dependencies.length < initialLength) {
					dependencyFound = true;
				}
			}
		} else if (task.subtasks) {
			task.subtasks.forEach((subtask) => {
				if (String(subtask.id) === String(formattedTaskId)) {
					taskFound = true;
					if (subtask.dependencies) {
						const initialLength = subtask.dependencies.length;
						subtask.dependencies = subtask.dependencies.filter(
							(d) => String(d) !== String(formattedDependencyId)
						);
						if (subtask.dependencies.length < initialLength) {
							dependencyFound = true;
						}
					}
				}
			});
		}
	});

	if (!taskFound) {
		log('error', `Task ${formattedTaskId} not found.`);
		process.exit(1);
	}

	if (!dependencyFound) {
		log(
			'warn',
			`Dependency ${formattedDependencyId} not found in task ${formattedTaskId}.`
		);
		return;
	}

	// Save changes and regenerate files
	writeJSON(tasksPath, data);
	log(
		'success',
		`Removed dependency ${formattedDependencyId} from task ${formattedTaskId}.`
	);

	if (!isSilentMode()) {
		console.log(
			boxen(
				chalk.green(
					`Successfully removed dependency ${chalk.bold(
						formattedDependencyId
					)} from task ${chalk.bold(formattedTaskId)}.`
				),
				{ padding: 1, borderColor: 'green', margin: { top: 1 } }
			)
		);
	}

	await generateTaskFiles(tasksPath, path.dirname(tasksPath));
	log('info', 'Task files regenerated.');
}

/**
 * Check for circular dependencies
 * @param {Array} tasks - All tasks
 * @param {number|string} taskId - The ID of the task to check
 * @param {Array} chain - The dependency chain being checked
 * @returns {boolean} - True if circular, false otherwise
 */
function isCircularDependency(tasks: Task[], taskId: string | number, chain: (string | number)[] = []): boolean {
	const currentTaskId = formatTaskId(String(taskId));
	const newChain = [...chain, currentTaskId];

	// Find the task or subtask
	const task = tasks.find((t) => formatTaskId(String(t.id)) === currentTaskId);
	let dependencies: (string | number)[] = [];

	if (task) {
		dependencies = task.dependencies || [];
	} else {
		for (const parentTask of tasks) {
			if (parentTask.subtasks) {
				const subtask = parentTask.subtasks.find(
					(s) => formatTaskId(String(s.id)) === currentTaskId
				);
				if (subtask) {
					dependencies = subtask.dependencies || [];
					break;
				}
			}
		}
	}

	if (!dependencies.length) {
		return false;
	}

	for (const depId of dependencies) {
		const formattedDepId = formatTaskId(String(depId));
		if (newChain.includes(formattedDepId)) {
			log(
				'warn',
				`Circular dependency detected: ${newChain.join(' -> ')} -> ${formattedDepId}`
			);
			return true;
		}
		if (isCircularDependency(tasks, formattedDepId, newChain)) {
			return true;
		}
	}

	return false;
}

/**
 * Validate all task dependencies.
 * @param {Array} tasks - The list of all tasks
 * @returns {Array} - A list of dependency issues found.
 */
function validateTaskDependencies(tasks: Task[]): { issues: DependencyIssue[]; valid: boolean } {
	const issues: DependencyIssue[] = [];

	tasks.forEach((task) => {
		if (!task.dependencies) return;

		task.dependencies.forEach((depId) => {
			const dependencyExists = taskExists(tasks, depId);
			if (!dependencyExists) {
				issues.push({
					type: 'missing',
					taskId: task.id,
					dependencyId: depId,
					message: `Dependency '${depId}' does not exist.`
				});
			}

			if (String(task.id) === String(depId)) {
				issues.push({
					type: 'self',
					taskId: task.id,
					dependencyId: depId,
					message: 'Task cannot depend on itself.'
				});
			}
		});

		// Check for circular dependencies involving this task
		if (isCircularDependency(tasks, String(task.id))) {
			issues.push({
				type: 'circular',
				taskId: task.id,
				message: `Task is part of a circular dependency.`
			});
		}

		if (task.subtasks) {
			task.subtasks.forEach((subtask) => {
				if (!subtask.dependencies) return;

				subtask.dependencies.forEach((depId) => {
					const dependencyExists = taskExists(tasks, depId);
					if (!dependencyExists) {
						issues.push({
							type: 'missing',
							taskId: subtask.id,
							dependencyId: depId,
							message: `Dependency '${depId}' does not exist.`
						});
					}

					if (String(subtask.id) === String(depId)) {
						issues.push({
							type: 'self',
							taskId: subtask.id,
							dependencyId: depId,
							message: 'Subtask cannot depend on itself.'
						});
					}
				});

				// Check for circular dependencies involving this subtask
				if (isCircularDependency(tasks, String(subtask.id))) {
					issues.push({
						type: 'circular',
						taskId: subtask.id,
						message: `Subtask is part of a circular dependency.`
					});
				}
			});
		}
	});

	return {
		issues,
		valid: issues.length === 0
	};
}

/**
 * Removes duplicate dependencies from all tasks and subtasks.
 * @param {object} tasksData - The object containing all tasks
 * @returns {object} - The modified tasks data
 */
function removeDuplicateDependencies(tasksData) {
	if (!tasksData || !tasksData.tasks) return tasksData;

	tasksData.tasks.forEach((task) => {
		if (task.dependencies) {
			task.dependencies = [...new Set(task.dependencies)];
		}
		if (task.subtasks) {
			task.subtasks.forEach((subtask) => {
				if (subtask.dependencies) {
					subtask.dependencies = [...new Set(subtask.dependencies)];
				}
			});
		}
	});

	return tasksData;
}

/**
 * Removes dependencies on subtasks from parent tasks if both exist.
 * This helps avoid redundant dependencies.
 * @param {object} tasksData - The object containing all tasks
 * @returns {object} - The modified tasks data
 */
function cleanupSubtaskDependencies(tasksData) {
	if (!tasksData || !tasksData.tasks) return tasksData;

	tasksData.tasks.forEach((task) => {
		if (task.dependencies && task.subtasks) {
			const subtaskIds = new Set(task.subtasks.map((s) => s.id));
			task.dependencies = task.dependencies.filter(
				(depId) => !subtaskIds.has(depId as number)
			);
		}
	});

	return tasksData;
}

/**
 * Validate and report dependency issues for all tasks.
 * @param {string} tasksPath - Path to the tasks.json file
 */
async function validateDependenciesCommand(tasksPath: string, options = {}) {
	const data = readJSON(tasksPath);
	if (!data || !data.tasks) {
		log('error', 'No valid tasks found in tasks.json');
		process.exit(1);
	}

	if (!isSilentMode()) {
		displayBanner();
	}
	log('info', 'Running dependency validation...');

	const validationResult = validateTaskDependencies(data.tasks);

	if (validationResult.valid) {
		log('success', 'No dependency issues found.');
		if (!isSilentMode()) {
			console.log(
				boxen(chalk.green('✅ All dependencies are valid.'), {
					padding: 1,
					borderColor: 'green',
					margin: 1
				})
			);
		}
	} else {
		log('error', `Found ${validationResult.issues.length} dependency issues:`);

		const errorMessages = validationResult.issues.map((issue) => {
			let errorMsg = `  [${issue.type.toUpperCase()}] Task ${issue.taskId}: ${issue.message}`;
			if (issue.dependencyId) {
				errorMsg += ` (Dependency: ${issue.dependencyId})`;
			}
			return chalk.red(errorMsg);
		});

		if (!isSilentMode()) {
			console.log(
				boxen(
					[
						chalk.yellow.bold('Dependency Issues Detected'),
						...errorMessages,
						'',
						chalk.cyan(
							'Run `vibex-task-manager fix-dependencies` to attempt to resolve these issues.'
						)
					].join('\n'),
					{ padding: 1, borderColor: 'red', margin: 1 }
				)
			);
		} else {
			errorMessages.forEach((msg) => console.log(msg));
		}
		process.exit(1); // Exit with error if issues are found
	}
}

/**
 * Counts all dependencies across all tasks and subtasks.
 * @param {Array} tasks - A list of tasks.
 * @returns {number} The total count of dependencies.
 */
function countAllDependencies(tasks: Task[]): number {
	if (!tasks) return 0;

	let count = 0;
	tasks.forEach((task) => {
		if (task.dependencies) {
			count += task.dependencies.length;
		}
		if (task.subtasks) {
			task.subtasks.forEach((subtask) => {
				if (subtask.dependencies) {
					count += subtask.dependencies.length;
				}
			});
		}
	});

	return count;
}

/**
 * Automatically fix dependency issues.
 * @param {string} tasksPath - Path to the tasks.json file
 */
async function fixDependenciesCommand(tasksPath: string, options = {}) {
	if (!isSilentMode()) {
		displayBanner();
	}
	log('info', 'Attempting to automatically fix dependency issues...');

	const data = readJSON(tasksPath);
	if (!data || !data.tasks) {
		log('error', 'No valid tasks found.');
		process.exit(1);
	}

	const issues = validateTaskDependencies(data.tasks).issues;
	let changesMade = false;

	if (issues.length === 0) {
		log('success', 'No dependency issues to fix.');
		if (!isSilentMode()) {
			console.log(
				boxen(chalk.green('✅ No issues found.'), {
					padding: 1,
					borderColor: 'green',
					margin: 1
				})
			);
		}
		return;
	}

	const missingDeps = issues.filter((issue) => issue.type === 'missing');
	const selfDeps = issues.filter((issue) => issue.type === 'self');
	const circularDeps = issues.filter((issue) => issue.type === 'circular');

	// Fix missing dependencies by removing them
	if (missingDeps.length > 0) {
		log('info', `Removing ${missingDeps.length} missing dependencies...`);
		missingDeps.forEach((issue) => {
			data.tasks.forEach((task: Task) => {
				if (String(task.id) === String(issue.taskId)) {
					task.dependencies = task.dependencies.filter(
						(depId) => String(depId) !== String(issue.dependencyId)
					);
					changesMade = true;
					log(
						'info',
						`Removed missing dependency '${issue.dependencyId}' from task ${issue.taskId}`
					);
				}
				if (task.subtasks) {
					task.subtasks.forEach((subtask) => {
						if (String(subtask.id) === String(issue.taskId)) {
							subtask.dependencies = subtask.dependencies.filter(
								(depId) => String(depId) !== String(issue.dependencyId)
							);
							changesMade = true;
							log(
								'info',
								`Removed missing dependency '${issue.dependencyId}' from subtask ${issue.taskId}`
							);
						}
					});
				}
			});
		});
	}

	// Fix self-dependencies by removing them
	if (selfDeps.length > 0) {
		log('info', `Removing ${selfDeps.length} self-dependencies...`);
		selfDeps.forEach((issue) => {
			data.tasks.forEach((task: Task) => {
				if (String(task.id) === String(issue.taskId)) {
					task.dependencies = task.dependencies.filter(
						(depId) => String(depId) !== String(issue.dependencyId)
					);
					changesMade = true;
					log(
						'info',
						`Removed self-dependency from task ${issue.taskId}`
					);
				}
				if (task.subtasks) {
					task.subtasks.forEach((subtask) => {
						if (String(subtask.id) === String(issue.taskId)) {
							subtask.dependencies = subtask.dependencies.filter(
								(depId) => String(depId) !== String(issue.dependencyId)
							);
							changesMade = true;
							log(
								'info',
								`Removed self-dependency from subtask ${issue.taskId}`
							);
						}
					});
				}
			});
		});
	}

	// For circular dependencies, we can't safely fix them automatically.
	// We will just report them.
	if (circularDeps.length > 0) {
		log(
			'warn',
			'Circular dependencies detected. These must be resolved manually.'
		);
		circularDeps.forEach((issue) => {
			log('warn', `  - Task ${issue.taskId}: ${issue.message}`);
		});
	}

	if (changesMade) {
		writeJSON(tasksPath, data);
		log('success', 'Successfully fixed dependency issues.');

		if (!isSilentMode()) {
			console.log(
				boxen(chalk.green('✅ Dependency issues have been fixed.'), {
					padding: 1,
					borderColor: 'green',
					margin: 1
				})
			);
		}

		await generateTaskFiles(tasksPath, path.dirname(tasksPath));
		log('info', 'Task files regenerated.');
	} else {
		log('info', 'No automatic fixes could be applied.');
	}
}

/**
 * Validates dependencies and relationships for subtasks within a parent task.
 * @param {object} parentTask - The parent task object.
 * @returns {Array} - A list of issues found.
 */
function validateSubtaskDependencies(parentTask: Task): DependencyIssue[] {
	const issues: DependencyIssue[] = [];
	if (!parentTask.subtasks || parentTask.subtasks.length === 0) {
		return issues;
	}

	const subtaskIds = new Set(parentTask.subtasks.map((s) => s.id));

	parentTask.subtasks.forEach((subtask) => {
		if (subtask.dependencies) {
			subtask.dependencies.forEach((depId) => {
				// Check that dependencies are other subtasks within the same parent
				if (!subtaskIds.has(depId as number)) {
					issues.push({
						type: 'missing',
						taskId: subtask.id,
						dependencyId: depId,
						message: 'Subtask dependency must be another subtask of the same parent.'
					});
				}
			});
		}
	});

	// 2. Check for circular dependencies within the subtask graph
	const subtaskGraph = new Map<string, string[]>();
	if (parentTask.subtasks) {
		for (const subtask of parentTask.subtasks) {
			const subtaskId = `${parentTask.id}.${subtask.id}`;
			const dependencies =
				subtask.dependencies?.map((d) =>
					typeof d === 'number' ? d.toString() : d
				) || [];
			subtaskGraph.set(subtaskId, dependencies);
		}
	}

	for (const subtask of parentTask.subtasks || []) {
		const subtaskId = `${parentTask.id}.${subtask.id}`;
		const cycle = findCycles(subtaskId, subtaskGraph);
		if (cycle.length > 0) {
			issues.push({
				type: 'circular',
				taskId: subtaskId,
				message: `Circular dependency detected in subtasks of task ${
					parentTask.id
				}: ${cycle.join(' -> ')}`
			});
		}
	}

	return issues;
}

/**
 * Ensures that for any given parent task, there is at least one subtask with no dependencies.
 * This prevents a situation where all subtasks depend on each other, making them impossible to start.
 * @param {object} tasksData - The object containing all tasks.
 * @returns {object} - The modified tasks data.
 */
function ensureAtLeastOneIndependentSubtask(tasksData) {
	if (!tasksData || !tasksData.tasks) return tasksData;

	tasksData.tasks.forEach((task) => {
		if (task.subtasks && task.subtasks.length > 0) {
			const hasIndependentSubtask = task.subtasks.some(
				(s) => !s.dependencies || s.dependencies.length === 0
			);

			if (!hasIndependentSubtask) {
				// If no subtask is independent, we make the first one independent
				// This is a simple fix; a more complex one could be implemented if needed
				log(
					'warn',
					`No independent subtask found for parent task ${task.id}. Making the first subtask independent.`
				);
				task.subtasks[0].dependencies = [];
			}
		}
	});

	return tasksData;
}

/**
 * A comprehensive function to validate and fix all dependency types.
 * @param {object} tasksData - The tasks data object.
 * @param {string|null} tasksPath - Path to tasks.json, if it needs to be written.
 * @returns {object} - The processed tasks data.
 */
function validateAndFixDependencies(tasksData, tasksPath = null) {
	let data = removeDuplicateDependencies(tasksData);
	data = cleanupSubtaskDependencies(data);
	data = ensureAtLeastOneIndependentSubtask(data);

	// Re-validate all dependencies after fixes
	const finalIssues = validateTaskDependencies(data.tasks).issues;
	if (finalIssues.length > 0) {
		log('warn', 'Some dependency issues remain after automatic fixing:');
		finalIssues.forEach((issue) => {
			log(
				'warn',
				`- [${issue.type}] Task ${issue.taskId}: ${issue.message}`
			);
		});
	} else {
		log('success', 'All dependency issues resolved.');
	}

	if (tasksPath) {
		writeJSON(tasksPath, data);
	}

	return data;
}

// Export the functions
export {
	addDependency,
	removeDependency,
	isCircularDependency,
	validateTaskDependencies,
	removeDuplicateDependencies,
	cleanupSubtaskDependencies,
	validateDependenciesCommand,
	countAllDependencies,
	fixDependenciesCommand,
	validateSubtaskDependencies,
	validateAndFixDependencies
};
