/**
 * ui.ts
 * User interface functions for the Task Manager CLI
 */

import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import ora, { Ora } from 'ora';
import Table from 'cli-table3';
import gradient from 'gradient-string';
import {
	log,
	findTaskById,
	readJSON,
	isSilentMode,
	FindTaskResult
} from '../utils/utils.js';
import { findNextTask, readComplexityReport } from './task-manager.js';
import { getProjectName } from './config-manager.js';
import { TASK_STATUS_OPTIONS } from '../constants/task-status.js';
import { TASKMANAGER_CONFIG_FILE } from '../constants/paths.js';
import { getTaskManagerVersion } from '../utils/getVersion.js';
import type {
	Task,
	ComplexityReport,
	FindNextTaskResult
} from '../types/index.js';

// Type definitions
export interface StatusBreakdown {
	'in-progress'?: number;
	pending?: number;
	blocked?: number;
	deferred?: number;
	cancelled?: number;
	review?: number;
	done?: number;
	completed?: number;
}

// Create a color gradient for the banner
const coolGradient = gradient(['#00b4d8', '#0077b6', '#03045e']);

/**
 * Display a fancy banner for the CLI
 */
export function displayBanner(): void {
	if (isSilentMode()) return;

	const bannerText = figlet.textSync('Task Manager', {
		font: 'Standard',
		horizontalLayout: 'default',
		verticalLayout: 'default'
	});

	console.log(coolGradient(bannerText));

	// Add creator credit line below the banner
	console.log(chalk.dim('Open Source Task Management'));

	// Read version directly from package.json
	const version = getTaskManagerVersion();

	console.log(
		boxen(
			chalk.white(
				`${chalk.bold('Version:')} ${version}   ${chalk.bold('Project:')} ${getProjectName(null)}`
			),
			{
				padding: 1,
				margin: { top: 0, bottom: 1 },
				borderStyle: 'round',
				borderColor: 'cyan'
			}
		)
	);
}

/**
 * Start a loading indicator with an animated spinner
 */
export function startLoadingIndicator(message: string): Ora | null {
	if (isSilentMode()) return null;

	const spinner = ora({
		text: message,
		color: 'cyan'
	}).start();

	return spinner;
}

/**
 * Stop a loading indicator (basic stop, no success/fail indicator)
 */
export function stopLoadingIndicator(spinner: Ora | null): void {
	if (spinner && typeof spinner.stop === 'function') {
		spinner.stop();
	}
}

/**
 * Complete a loading indicator with success (shows checkmark)
 */
export function succeedLoadingIndicator(
	spinner: Ora | null,
	message: string | null = null
): void {
	if (spinner && typeof spinner.succeed === 'function') {
		if (message) {
			spinner.succeed(message);
		} else {
			spinner.succeed();
		}
	}
}

/**
 * Complete a loading indicator with failure (shows X)
 */
export function failLoadingIndicator(
	spinner: Ora | null,
	message: string | null = null
): void {
	if (spinner && typeof spinner.fail === 'function') {
		if (message) {
			spinner.fail(message);
		} else {
			spinner.fail();
		}
	}
}

/**
 * Complete a loading indicator with warning (shows warning symbol)
 */
export function warnLoadingIndicator(
	spinner: Ora | null,
	message: string | null = null
): void {
	if (spinner && typeof spinner.warn === 'function') {
		if (message) {
			spinner.warn(message);
		} else {
			spinner.warn();
		}
	}
}

/**
 * Complete a loading indicator with info (shows info symbol)
 */
export function infoLoadingIndicator(
	spinner: Ora | null,
	message: string | null = null
): void {
	if (spinner && typeof spinner.info === 'function') {
		if (message) {
			spinner.info(message);
		} else {
			spinner.info();
		}
	}
}

/**
 * Create a colored progress bar
 */
export function createProgressBar(
	percent: number,
	length: number = 30,
	statusBreakdown: StatusBreakdown | null = null
): string {
	// Adjust the percent to treat deferred and cancelled as complete
	const effectivePercent = statusBreakdown
		? Math.min(
				100,
				percent +
					(statusBreakdown.deferred || 0) +
					(statusBreakdown.cancelled || 0)
			)
		: percent;

	// Calculate how many characters to fill for "true completion"
	const trueCompletedFilled = Math.round((percent * length) / 100);

	// Calculate how many characters to fill for "effective completion" (including deferred/cancelled)
	const effectiveCompletedFilled = Math.round(
		(effectivePercent * length) / 100
	);

	// The "deferred/cancelled" section (difference between true and effective)
	const deferredCancelledFilled =
		effectiveCompletedFilled - trueCompletedFilled;

	// Set the empty section (remaining after effective completion)
	const empty = length - effectiveCompletedFilled;

	// Determine color based on percentage for the completed section
	let completedColor: typeof chalk;
	if (percent < 25) {
		completedColor = chalk.red;
	} else if (percent < 50) {
		completedColor = chalk.hex('#FFA500'); // Orange
	} else if (percent < 75) {
		completedColor = chalk.yellow;
	} else if (percent < 100) {
		completedColor = chalk.green;
	} else {
		completedColor = chalk.hex('#006400'); // Dark green
	}

	// Create colored sections
	const completedSection = completedColor('█'.repeat(trueCompletedFilled));

	// Gray section for deferred/cancelled items
	const deferredCancelledSection = chalk.gray(
		'█'.repeat(deferredCancelledFilled)
	);

	// If we have a status breakdown, create a multi-colored remaining section
	let remainingSection = '';

	if (statusBreakdown && empty > 0) {
		// Status colors (matching the statusConfig colors in getStatusWithColor)
		const statusColors: Record<string, typeof chalk> = {
			pending: chalk.yellow,
			'in-progress': chalk.hex('#FFA500'), // Orange
			blocked: chalk.red,
			review: chalk.magenta
			// Deferred and cancelled are treated as part of the completed section
		};

		// Calculate proportions for each status
		const totalRemaining = Object.entries(statusBreakdown)
			.filter(
				([status]) =>
					!['deferred', 'cancelled', 'done', 'completed'].includes(status)
			)
			.reduce((sum, [_, val]) => sum + (val || 0), 0);

		// If no remaining tasks with tracked statuses, just use gray
		if (totalRemaining <= 0) {
			remainingSection = chalk.gray('░'.repeat(empty));
		} else {
			// Track how many characters we've added
			let addedChars = 0;

			// Add each status section proportionally
			for (const [status, percentage] of Object.entries(statusBreakdown)) {
				// Skip statuses that are considered complete
				if (['deferred', 'cancelled', 'done', 'completed'].includes(status))
					continue;

				// Calculate how many characters this status should fill
				const statusChars = Math.round(
					((percentage || 0) / totalRemaining) * empty
				);

				// Make sure we don't exceed the total length due to rounding
				const actualChars = Math.min(statusChars, empty - addedChars);

				// Add colored section for this status
				const colorFn = statusColors[status] || chalk.gray;
				remainingSection += colorFn('░'.repeat(actualChars));

				addedChars += actualChars;
			}

			// If we have any remaining space due to rounding, fill with gray
			if (addedChars < empty) {
				remainingSection += chalk.gray('░'.repeat(empty - addedChars));
			}
		}
	} else {
		// Default to gray for the empty section if no breakdown provided
		remainingSection = chalk.gray('░'.repeat(empty));
	}

	// Effective percentage text color should reflect the highest category
	const percentTextColor =
		percent === 100
			? chalk.hex('#006400') // Dark green for 100%
			: effectivePercent === 100
				? chalk.gray // Gray for 100% with deferred/cancelled
				: completedColor; // Otherwise match the completed color

	// Build the complete progress bar
	return `${completedSection}${deferredCancelledSection}${remainingSection} ${percentTextColor(`${effectivePercent.toFixed(0)}%`)}`;
}

/**
 * Get a colored status string based on the status value
 */
export function getStatusWithColor(
	status: string,
	forTable: boolean = false
): string {
	if (!status) {
		return chalk.gray('❓ unknown');
	}

	const statusConfig: Record<
		string,
		{ color: typeof chalk; icon: string; tableIcon: string }
	> = {
		done: { color: chalk.green, icon: '✓', tableIcon: '✓' },
		completed: { color: chalk.green, icon: '✓', tableIcon: '✓' },
		pending: { color: chalk.yellow, icon: '○', tableIcon: '⏱' },
		'in-progress': { color: chalk.hex('#FFA500'), icon: '🔄', tableIcon: '►' },
		deferred: { color: chalk.gray, icon: 'x', tableIcon: '⏱' },
		blocked: { color: chalk.red, icon: '!', tableIcon: '✗' },
		review: { color: chalk.magenta, icon: '?', tableIcon: '?' },
		cancelled: { color: chalk.gray, icon: '❌', tableIcon: 'x' }
	};

	const config = statusConfig[status.toLowerCase()] || {
		color: chalk.red,
		icon: '❌',
		tableIcon: '✗'
	};

	// Use simpler icons for table display to prevent border issues
	if (forTable) {
		// Use ASCII characters instead of Unicode for completely stable display
		const simpleIcons: Record<string, string> = {
			done: '✓',
			completed: '✓',
			pending: '○',
			'in-progress': '►',
			deferred: 'x',
			blocked: '!', // Using plain x character for better compatibility
			review: '?' // Using circled dot symbol
		};
		const simpleIcon = simpleIcons[status.toLowerCase()] || 'x';
		return config.color(`${simpleIcon} ${status}`);
	}

	return config.color(`${config.icon} ${status}`);
}

/**
 * Format dependencies list with status indicators
 */
export function formatDependenciesWithStatus(
	dependencies: number[] | undefined,
	allTasks: Task[],
	forConsole: boolean = false,
	complexityReport: ComplexityReport | null = null
): string {
	if (
		!dependencies ||
		!Array.isArray(dependencies) ||
		dependencies.length === 0
	) {
		return forConsole ? chalk.gray('None') : 'None';
	}

	const formattedDeps = dependencies.map((depId) => {
		const depIdStr = depId.toString(); // Ensure string format for display

		// Check if it's already a fully qualified subtask ID (like "22.1")
		if (depIdStr.includes('.')) {
			const [parentId, subtaskId] = depIdStr
				.split('.')
				.map((id) => parseInt(id, 10));

			// Find the parent task
			const parentTask = allTasks.find((t) => t.id === parentId);
			if (!parentTask || !parentTask.subtasks) {
				return forConsole
					? chalk.red(`${depIdStr} (Not found)`)
					: `${depIdStr} (Not found)`;
			}

			// Find the subtask
			const subtask = parentTask.subtasks.find((st) => st.id === subtaskId);
			if (!subtask) {
				return forConsole
					? chalk.red(`${depIdStr} (Not found)`)
					: `${depIdStr} (Not found)`;
			}

			// Format with status
			const status = subtask.status || 'pending';
			const isDone =
				status.toLowerCase() === 'done' || status.toLowerCase() === 'completed';
			const isInProgress = status.toLowerCase() === 'in-progress';

			if (forConsole) {
				if (isDone) {
					return chalk.green.bold(depIdStr);
				} else if (isInProgress) {
					return chalk.hex('#FFA500').bold(depIdStr);
				} else {
					return chalk.red.bold(depIdStr);
				}
			}

			// For plain text output (task files), return just the ID without any formatting or emoji
			return depIdStr;
		}

		// For regular task dependencies (not subtasks)
		// Convert string depId to number if needed
		const numericDepId =
			typeof depId === 'string' ? parseInt(depId, 10) : depId;

		// Look up the task using the numeric ID
		const depTaskResult = findTaskById(
			allTasks,
			numericDepId,
			complexityReport
		);
		const depTask = depTaskResult.task; // Access the task object from the result

		if (!depTask) {
			return forConsole
				? chalk.red(`${depIdStr} (Not found)`)
				: `${depIdStr} (Not found)`;
		}

		// Format with status
		const status = depTask.status || 'pending';
		const isDone =
			status.toLowerCase() === 'done' || status.toLowerCase() === 'completed';
		const isInProgress = status.toLowerCase() === 'in-progress';

		if (forConsole) {
			if (isDone) {
				return chalk.green.bold(depIdStr);
			} else if (isInProgress) {
				return chalk.yellow.bold(depIdStr);
			} else {
				return chalk.red.bold(depIdStr);
			}
		}

		// For plain text output (task files), return just the ID without any formatting or emoji
		return depIdStr;
	});

	return formattedDeps.join(', ');
}

/**
 * Display a comprehensive help guide
 */
export function displayHelp(): void {
	// Get terminal width - moved to top of function to make it available throughout
	const terminalWidth = process.stdout.columns || 100; // Default to 100 if can't detect

	console.log(
		boxen(chalk.white.bold('Task Manager CLI'), {
			padding: 1,
			borderColor: 'blue',
			borderStyle: 'round',
			margin: { top: 1, bottom: 1 }
		})
	);

	// Command categories
	const commandCategories = [
		{
			title: 'Project Setup & Configuration',
			color: 'blue',
			commands: [
				{
					name: 'init',
					args: '[--name=<name>] [--description=<desc>] [-y]',
					desc: 'Initialize a new project with Task Manager structure'
				},
				{
					name: 'models',
					args: '',
					desc: 'View current AI model configuration and available models'
				},
				{
					name: 'models --setup',
					args: '',
					desc: 'Run interactive setup to configure AI models'
				},
				{
					name: 'models --set-main',
					args: '<model_id>',
					desc: 'Set the primary model for task generation'
				},
				{
					name: 'models --set-research',
					args: '<model_id>',
					desc: 'Set the model for research operations'
				},
				{
					name: 'models --set-fallback',
					args: '<model_id>',
					desc: 'Set the fallback model (optional)'
				}
			]
		},
		{
			title: 'Task Generation',
			color: 'cyan',
			commands: [
				{
					name: 'parse-prd',
					args: '--input=<file.txt> [--num-tasks=10]',
					desc: 'Generate tasks from a PRD document'
				},
				{
					name: 'generate',
					args: '',
					desc: 'Create individual task files from tasks.json'
				}
			]
		},
		{
			title: 'Task Management',
			color: 'green',
			commands: [
				{
					name: 'list',
					args: '[--status=<status>] [--with-subtasks]',
					desc: 'List all tasks with their status'
				},
				{
					name: 'set-status',
					args: '--id=<id> --status=<status>',
					desc: `Update task status (${TASK_STATUS_OPTIONS.join(', ')})`
				},
				{
					name: 'sync-readme',
					args: '[--with-subtasks] [--status=<status>]',
					desc: 'Export tasks to README.md with professional formatting'
				},
				{
					name: 'update',
					args: '--from=<id> --prompt="<context>"',
					desc: 'Update multiple tasks based on new requirements'
				},
				{
					name: 'update-task',
					args: '--id=<id> --prompt="<context>"',
					desc: 'Update a single specific task with new information'
				},
				{
					name: 'update-subtask',
					args: '--id=<parentId.subtaskId> --prompt="<context>"',
					desc: 'Append additional information to a subtask'
				},
				{
					name: 'add-task',
					args: '--prompt="<text>" [--dependencies=<ids>] [--priority=<priority>]',
					desc: 'Add a new task using AI'
				},
				{
					name: 'remove-task',
					args: '--id=<id> [-y]',
					desc: 'Permanently remove a task or subtask'
				}
			]
		},
		{
			title: 'Subtask Management',
			color: 'yellow',
			commands: [
				{
					name: 'add-subtask',
					args: '--parent=<id> --title="<title>" [--description="<desc>"]',
					desc: 'Add a new subtask to a parent task'
				},
				{
					name: 'add-subtask',
					args: '--parent=<id> --task-id=<id>',
					desc: 'Convert an existing task into a subtask'
				},
				{
					name: 'remove-subtask',
					args: '--id=<parentId.subtaskId> [--convert]',
					desc: 'Remove a subtask (optionally convert to standalone task)'
				},
				{
					name: 'clear-subtasks',
					args: '--id=<id>',
					desc: 'Remove all subtasks from specified tasks'
				},
				{
					name: 'clear-subtasks --all',
					args: '',
					desc: 'Remove subtasks from all tasks'
				}
			]
		},
		{
			title: 'Task Analysis & Breakdown',
			color: 'magenta',
			commands: [
				{
					name: 'analyze-complexity',
					args: '[--research] [--threshold=5]',
					desc: 'Analyze tasks and generate expansion recommendations'
				},
				{
					name: 'complexity-report',
					args: '[--file=<path>]',
					desc: 'Display the complexity analysis report'
				},
				{
					name: 'expand',
					args: '--id=<id> [--num=5] [--research] [--prompt="<context>"]',
					desc: 'Break down tasks into detailed subtasks'
				},
				{
					name: 'expand --all',
					args: '[--force] [--research]',
					desc: 'Expand all pending tasks with subtasks'
				}
			]
		},
		{
			title: 'Task Navigation & Viewing',
			color: 'cyan',
			commands: [
				{
					name: 'next',
					args: '',
					desc: 'Show the next task to work on based on dependencies'
				},
				{
					name: 'show',
					args: '<id>',
					desc: 'Display detailed information about a specific task'
				}
			]
		},
		{
			title: 'Dependency Management',
			color: 'blue',
			commands: [
				{
					name: 'add-dependency',
					args: '--id=<id> --depends-on=<id>',
					desc: 'Add a dependency to a task'
				},
				{
					name: 'remove-dependency',
					args: '--id=<id> --depends-on=<id>',
					desc: 'Remove a dependency from a task'
				},
				{
					name: 'validate-dependencies',
					args: '',
					desc: 'Identify invalid dependencies without fixing them'
				},
				{
					name: 'fix-dependencies',
					args: '',
					desc: 'Fix invalid dependencies automatically'
				}
			]
		}
	];

	// Display each category
	commandCategories.forEach((category) => {
		console.log(
			boxen(
				chalk[
					category.color as 'blue' | 'cyan' | 'green' | 'yellow' | 'magenta'
				].bold(category.title),
				{
					padding: { left: 2, right: 2, top: 0, bottom: 0 },
					margin: { top: 1, bottom: 0 },
					borderColor: category.color,
					borderStyle: 'round'
				}
			)
		);

		// Calculate dynamic column widths - adjust ratios as needed
		const nameWidth = Math.max(25, Math.floor(terminalWidth * 0.2)); // 20% of width but min 25
		const argsWidth = Math.max(40, Math.floor(terminalWidth * 0.35)); // 35% of width but min 40
		const descWidth = Math.max(45, Math.floor(terminalWidth * 0.45) - 10); // 45% of width but min 45, minus some buffer

		const commandTable = new Table({
			colWidths: [nameWidth, argsWidth, descWidth],
			chars: {
				top: '',
				'top-mid': '',
				'top-left': '',
				'top-right': '',
				bottom: '',
				'bottom-mid': '',
				'bottom-left': '',
				'bottom-right': '',
				left: '',
				'left-mid': '',
				mid: '',
				'mid-mid': '',
				right: '',
				'right-mid': '',
				middle: ' '
			},
			style: { border: [], 'padding-left': 4 },
			wordWrap: true
		});

		category.commands.forEach((cmd) => {
			commandTable.push([
				`${chalk.yellow.bold(cmd.name)}${chalk.reset('')}`,
				`${chalk.white(cmd.args)}${chalk.reset('')}`,
				`${chalk.dim(cmd.desc)}${chalk.reset('')}`
			]);
		});

		console.log(commandTable.toString());
		console.log('');
	});

	// Display configuration section
	console.log(
		boxen(chalk.cyan.bold('Configuration'), {
			padding: { left: 2, right: 2, top: 0, bottom: 0 },
			margin: { top: 1, bottom: 0 },
			borderColor: 'cyan',
			borderStyle: 'round'
		})
	);

	// Get terminal width if not already defined
	const configTerminalWidth = terminalWidth || process.stdout.columns || 100;

	// Calculate dynamic column widths for config table
	const configKeyWidth = Math.max(30, Math.floor(configTerminalWidth * 0.25));
	const configDescWidth = Math.max(50, Math.floor(configTerminalWidth * 0.45));
	const configValueWidth = Math.max(
		30,
		Math.floor(configTerminalWidth * 0.3) - 10
	);

	const configTable = new Table({
		colWidths: [configKeyWidth, configDescWidth, configValueWidth],
		chars: {
			top: '',
			'top-mid': '',
			'top-left': '',
			'top-right': '',
			bottom: '',
			'bottom-mid': '',
			'bottom-left': '',
			'bottom-right': '',
			left: '',
			'left-mid': '',
			mid: '',
			'mid-mid': '',
			right: '',
			'right-mid': '',
			middle: ' '
		},
		style: { border: [], 'padding-left': 4 },
		wordWrap: true
	});

	configTable.push(
		[
			`${chalk.yellow(TASKMANAGER_CONFIG_FILE)}${chalk.reset('')}`,
			`${chalk.white('AI model configuration file (project root)')}${chalk.reset('')}`,
			`${chalk.dim('Managed by models cmd')}${chalk.reset('')}`
		],
		[
			`${chalk.yellow('API Keys (.env)')}${chalk.reset('')}`,
			`${chalk.white('API keys for AI providers (ANTHROPIC_API_KEY, etc.)')}${chalk.reset('')}`,
			`${chalk.dim('Required in .env file')}${chalk.reset('')}`
		],
		[
			`${chalk.yellow('MCP Keys (mcp.json)')}${chalk.reset('')}`,
			`${chalk.white('API keys for Cursor integration')}${chalk.reset('')}`,
			`${chalk.dim('Required in .cursor/')}${chalk.reset('')}`
		]
	);

	console.log(configTable.toString());
	console.log('');

	// Show helpful hints
	console.log(
		boxen(
			chalk.white.bold('Quick Start:') +
				'\n\n' +
				chalk.cyan('1. Create Project: ') +
				chalk.white('vibex-task-manager init') +
				'\n' +
				chalk.cyan('2. Setup Models: ') +
				chalk.white('vibex-task-manager models --setup') +
				'\n' +
				chalk.cyan('3. Parse PRD: ') +
				chalk.white('vibex-task-manager parse-prd --input=<prd-file>') +
				'\n' +
				chalk.cyan('4. List Tasks: ') +
				chalk.white('vibex-task-manager list') +
				'\n' +
				chalk.cyan('5. Find Next Task: ') +
				chalk.white('vibex-task-manager next'),
			{
				padding: 1,
				borderColor: 'yellow',
				borderStyle: 'round',
				margin: { top: 1 },
				width: Math.min(configTerminalWidth - 10, 100) // Limit width to terminal width minus padding, max 100
			}
		)
	);
}

/**
 * Get colored complexity score
 */
export function getComplexityWithColor(score: number): string {
	if (score <= 3) return chalk.green(`● ${score}`);
	if (score <= 6) return chalk.yellow(`● ${score}`);
	return chalk.red(`● ${score}`);
}

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
	if (!str) return '';
	if (str.length <= maxLength) return str;
	return str.substring(0, maxLength - 3) + '...';
}

/**
 * Display the next task to work on
 */
export async function displayNextTask(
	tasksPath: string,
	complexityReportPath: string | null = null
): Promise<void> {
	const data = readJSON(tasksPath);
	if (!data || !data.tasks) {
		log('error', 'No valid tasks found.');
		process.exit(1);
	}

	const complexityReport = readComplexityReport(complexityReportPath);
	const nextTask: FindNextTaskResult | null = findNextTask(
		data.tasks,
		complexityReport as any
	) as FindNextTaskResult | null;

	if (!nextTask) {
		console.log(
			boxen(
				chalk.yellow('No eligible tasks found!\n\n') +
					'All pending tasks have unsatisfied dependencies, or all tasks are completed.',
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'yellow',
					borderStyle: 'round',
					margin: { top: 1 }
				}
			)
		);
		return;
	}

	console.log(
		boxen(chalk.white.bold(`Next Task: #${nextTask.id} - ${nextTask.title}`), {
			padding: { top: 0, bottom: 0, left: 1, right: 1 },
			borderColor: 'blue',
			borderStyle: 'round',
			margin: { top: 1, bottom: 0 }
		})
	);

	const taskTable = new Table({
		style: {
			head: [],
			border: [],
			compact: true
		},
		chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
		colWidths: [15, Math.min(75, process.stdout.columns - 20 || 60)],
		wordWrap: true
	});

	const priorityColors: Record<string, typeof chalk> = {
		high: chalk.red.bold,
		medium: chalk.yellow,
		low: chalk.gray
	};
	const priorityColor =
		priorityColors[nextTask.priority || 'medium'] || chalk.white;

	taskTable.push(
		[chalk.cyan.bold('ID:'), nextTask.id.toString()],
		[chalk.cyan.bold('Title:'), nextTask.title],
		[
			chalk.cyan.bold('Priority:'),
			priorityColor(nextTask.priority || 'medium')
		],
		[
			chalk.cyan.bold('Dependencies:'),
			formatDependenciesWithStatus(
				nextTask.dependencies as number[],
				data.tasks,
				true,
				complexityReport as any
			)
		],
		[
			chalk.cyan.bold('Complexity:'),
			nextTask.complexityScore
				? getComplexityWithColor(nextTask.complexityScore)
				: chalk.gray('N/A')
		],
		[chalk.cyan.bold('Description:'), nextTask.description]
	);

	console.log(taskTable.toString());

	if (nextTask.details && nextTask.details.trim().length > 0) {
		console.log(
			boxen(
				chalk.white.bold('Implementation Details:') + '\n\n' + nextTask.details,
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'cyan',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 }
				}
			)
		);
	}

	const isSubtask = !!(nextTask as any).parentId;

	if (!isSubtask && nextTask.subtasks && nextTask.subtasks.length > 0) {
		console.log(
			boxen(chalk.white.bold('Subtasks'), {
				padding: { top: 0, bottom: 0, left: 1, right: 1 },
				margin: { top: 1, bottom: 0 },
				borderColor: 'magenta',
				borderStyle: 'round'
			})
		);

		const availableWidth = process.stdout.columns - 10 || 100;
		const idWidthPct = 8;
		const statusWidthPct = 15;
		const depsWidthPct = 25;
		const titleWidthPct = 100 - idWidthPct - statusWidthPct - depsWidthPct;

		const idWidth = Math.floor(availableWidth * (idWidthPct / 100));
		const statusWidth = Math.floor(availableWidth * (statusWidthPct / 100));
		const depsWidth = Math.floor(availableWidth * (depsWidthPct / 100));
		const titleWidth = Math.floor(availableWidth * (titleWidthPct / 100));

		const subtaskTable = new Table({
			head: [
				chalk.magenta.bold('ID'),
				chalk.magenta.bold('Status'),
				chalk.magenta.bold('Title'),
				chalk.magenta.bold('Deps')
			],
			colWidths: [idWidth, statusWidth, titleWidth, depsWidth],
			style: {
				head: [],
				border: [],
				compact: true
			},
			chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
			wordWrap: true
		});

		nextTask.subtasks.forEach((st) => {
			const statusColor: Record<string, typeof chalk> = {
				done: chalk.green,
				completed: chalk.green,
				pending: chalk.yellow,
				'in-progress': chalk.blue
			};
			const stColor = statusColor[st.status || 'pending'] || chalk.white;

			let subtaskDeps = 'None';
			if (st.dependencies && st.dependencies.length > 0) {
				const formattedDeps = st.dependencies.map((depId: any) => {
					if (typeof depId === 'number' && depId < 100) {
						const foundSubtask = nextTask.subtasks?.find(
							(subtask) => subtask.id === depId
						);
						if (foundSubtask) {
							const isDone =
								foundSubtask.status === 'done' ||
								foundSubtask.status === 'completed';
							const isInProgress = foundSubtask.status === 'in-progress';

							if (isDone) {
								return chalk.green.bold(`${nextTask.id}.${depId}`);
							} else if (isInProgress) {
								return chalk.hex('#FFA500').bold(`${nextTask.id}.${depId}`);
							} else {
								return chalk.red.bold(`${nextTask.id}.${depId}`);
							}
						}
						return chalk.red(`${nextTask.id}.${depId} (Not found)`);
					}
					return depId.toString();
				});

				subtaskDeps =
					formattedDeps.length === 1
						? formattedDeps[0]
						: formattedDeps.join(chalk.white(', '));
			}

			subtaskTable.push([
				`${nextTask.id}.${st.id}`,
				stColor(st.status || 'pending'),
				st.title,
				subtaskDeps
			]);
		});

		console.log(subtaskTable.toString());
	}

	if (!isSubtask && (!nextTask.subtasks || nextTask.subtasks.length === 0)) {
		console.log(
			boxen(
				chalk.yellow('No subtasks found. Consider breaking down this task:') +
					'\n' +
					chalk.white(
						`Run: ${chalk.cyan(`vibex-task-manager expand --id=${nextTask.id}`)}`
					),
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'yellow',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 }
				}
			)
		);
	}

	let suggestedActionsContent = chalk.white.bold('Suggested Actions:') + '\n';
	if (isSubtask) {
		const parentId = (nextTask as any).parentId;
		suggestedActionsContent +=
			`${chalk.cyan('1.')} Mark as in-progress: ${chalk.yellow(`vibex-task-manager set-status --id=${nextTask.id} --status=in-progress`)}\n` +
			`${chalk.cyan('2.')} Mark as done when completed: ${chalk.yellow(`vibex-task-manager set-status --id=${nextTask.id} --status=done`)}\n` +
			`${chalk.cyan('3.')} View parent task: ${chalk.yellow(`vibex-task-manager show --id=${parentId}`)}`;
	} else {
		suggestedActionsContent +=
			`${chalk.cyan('1.')} Mark as in-progress: ${chalk.yellow(`vibex-task-manager set-status --id=${nextTask.id} --status=in-progress`)}\n` +
			`${chalk.cyan('2.')} Mark as done when completed: ${chalk.yellow(`vibex-task-manager set-status --id=${nextTask.id} --status=done`)}\n` +
			(nextTask.subtasks && nextTask.subtasks.length > 0
				? `${chalk.cyan('3.')} Update subtask status: ${chalk.yellow(`vibex-task-manager set-status --id=${nextTask.id}.1 --status=done`)}`
				: `${chalk.cyan('3.')} Break down into subtasks: ${chalk.yellow(`vibex-task-manager expand --id=${nextTask.id}`)}`);
	}

	console.log(
		boxen(suggestedActionsContent, {
			padding: { top: 0, bottom: 0, left: 1, right: 1 },
			borderColor: 'green',
			borderStyle: 'round',
			margin: { top: 1 }
		})
	);
}

/**
 * Display a specific task by ID
 */
export async function displayTaskById(
	tasksPath: string,
	taskId: string | number,
	complexityReportPath: string | null = null,
	statusFilter: string | null = null
): Promise<void> {
	const data = readJSON(tasksPath);
	if (!data || !data.tasks) {
		log('error', 'No valid tasks found.');
		process.exit(1);
	}

	const complexityReport = readComplexityReport(complexityReportPath);
	const result = findTaskById(
		data.tasks,
		taskId,
		complexityReport as any,
		statusFilter as any
	) as FindTaskResult;

	const { task, originalSubtaskCount, originalSubtasks } = result;

	if (!task) {
		console.log(
			boxen(chalk.yellow(`Task with ID ${taskId} not found!`), {
				padding: { top: 0, bottom: 0, left: 1, right: 1 },
				borderColor: 'yellow',
				borderStyle: 'round',
				margin: { top: 1 }
			})
		);
		return;
	}

	// Handle subtask display
	const isSubtask = (task as any).isSubtask || (task as any).parentTask;
	if (isSubtask) {
		const parentTask = (task as any).parentTask;
		console.log(
			boxen(
				chalk.white.bold(
					`Subtask: #${parentTask.id}.${task.id} - ${task.title}`
				),
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'magenta',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 }
				}
			)
		);

		const subtaskTable = new Table({
			style: {
				head: [],
				border: [],
				compact: true
			},
			chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
			colWidths: [15, Math.min(75, process.stdout.columns - 20 || 60)],
			wordWrap: true
		});

		subtaskTable.push(
			[chalk.cyan.bold('ID:'), `${parentTask.id}.${task.id}`],
			[
				chalk.cyan.bold('Parent Task:'),
				`#${parentTask.id} - ${parentTask.title}`
			],
			[chalk.cyan.bold('Title:'), task.title],
			[
				chalk.cyan.bold('Status:'),
				getStatusWithColor((task.status || 'pending') as string, true)
			],
			[
				chalk.cyan.bold('Complexity:'),
				task.complexityScore
					? getComplexityWithColor(task.complexityScore)
					: chalk.gray('N/A')
			],
			[
				chalk.cyan.bold('Description:'),
				task.description || 'No description provided.'
			]
		);
		console.log(subtaskTable.toString());

		if (task.details && task.details.trim().length > 0) {
			console.log(
				boxen(
					chalk.white.bold('Implementation Details:') + '\n\n' + task.details,
					{
						padding: { top: 0, bottom: 0, left: 1, right: 1 },
						borderColor: 'cyan',
						borderStyle: 'round',
						margin: { top: 1, bottom: 0 }
					}
				)
			);
		}

		console.log(
			boxen(
				chalk.white.bold('Suggested Actions:') +
					'\n' +
					`${chalk.cyan('1.')} Mark as in-progress: ${chalk.yellow(`vibex-task-manager set-status --id=${parentTask.id}.${task.id} --status=in-progress`)}\n` +
					`${chalk.cyan('2.')} Mark as done when completed: ${chalk.yellow(`vibex-task-manager set-status --id=${parentTask.id}.${task.id} --status=done`)}\n` +
					`${chalk.cyan('3.')} View parent task: ${chalk.yellow(`vibex-task-manager show --id=${parentTask.id}`)}`,
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'green',
					borderStyle: 'round',
					margin: { top: 1 }
				}
			)
		);
		return;
	}

	// Display regular task
	console.log(
		boxen(chalk.white.bold(`Task: #${task.id} - ${task.title}`), {
			padding: { top: 0, bottom: 0, left: 1, right: 1 },
			borderColor: 'blue',
			borderStyle: 'round',
			margin: { top: 1, bottom: 0 }
		})
	);

	const taskTable = new Table({
		style: {
			head: [],
			border: [],
			compact: true
		},
		chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
		colWidths: [15, Math.min(75, process.stdout.columns - 20 || 60)],
		wordWrap: true
	});

	const priorityColors: Record<string, typeof chalk> = {
		high: chalk.red.bold,
		medium: chalk.yellow,
		low: chalk.gray
	};
	const priorityColor =
		priorityColors[task.priority || 'medium'] || chalk.white;

	taskTable.push(
		[chalk.cyan.bold('ID:'), task.id.toString()],
		[chalk.cyan.bold('Title:'), task.title],
		[
			chalk.cyan.bold('Status:'),
			getStatusWithColor(task.status || 'pending', true)
		],
		[chalk.cyan.bold('Priority:'), priorityColor(task.priority || 'medium')],
		[
			chalk.cyan.bold('Dependencies:'),
			formatDependenciesWithStatus(
				task.dependencies,
				data.tasks,
				true,
				complexityReport
			)
		],
		[
			chalk.cyan.bold('Complexity:'),
			task.complexityScore
				? getComplexityWithColor(task.complexityScore)
				: chalk.gray('N/A')
		],
		[chalk.cyan.bold('Description:'), task.description]
	);
	console.log(taskTable.toString());

	if (task.details && task.details.trim().length > 0) {
		console.log(
			boxen(
				chalk.white.bold('Implementation Details:') + '\n\n' + task.details,
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'cyan',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 }
				}
			)
		);
	}

	if (
		(task as any).testStrategy &&
		(task as any).testStrategy.trim().length > 0
	) {
		console.log(
			boxen(
				chalk.white.bold('Test Strategy:') +
					'\n\n' +
					(task as any).testStrategy,
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'cyan',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 }
				}
			)
		);
	}

	// Subtask display logic with filtering
	if (task.subtasks && task.subtasks.length > 0) {
		console.log(
			boxen(chalk.white.bold('Subtasks'), {
				padding: { top: 0, bottom: 0, left: 1, right: 1 },
				margin: { top: 1, bottom: 0 },
				borderColor: 'magenta',
				borderStyle: 'round'
			})
		);

		const availableWidth = process.stdout.columns - 10 || 100;
		const idWidthPct = 10;
		const statusWidthPct = 15;
		const depsWidthPct = 25;
		const titleWidthPct = 100 - idWidthPct - statusWidthPct - depsWidthPct;
		const idWidth = Math.floor(availableWidth * (idWidthPct / 100));
		const statusWidth = Math.floor(availableWidth * (statusWidthPct / 100));
		const depsWidth = Math.floor(availableWidth * (depsWidthPct / 100));
		const titleWidth = Math.floor(availableWidth * (titleWidthPct / 100));

		const subtaskTable = new Table({
			head: [
				chalk.magenta.bold('ID'),
				chalk.magenta.bold('Status'),
				chalk.magenta.bold('Title'),
				chalk.magenta.bold('Deps')
			],
			colWidths: [idWidth, statusWidth, titleWidth, depsWidth],
			style: {
				head: [],
				border: [],
				compact: true
			},
			chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
			wordWrap: true
		});

		task.subtasks.forEach((st) => {
			const statusColorMap: Record<string, typeof chalk> = {
				done: chalk.green,
				completed: chalk.green,
				pending: chalk.yellow,
				'in-progress': chalk.blue
			};
			const statusColor = statusColorMap[st.status || 'pending'] || chalk.white;

			let subtaskDeps = 'None';
			if (st.dependencies && st.dependencies.length > 0) {
				const formattedDeps = st.dependencies.map((depId: any) => {
					const sourceListForDeps = originalSubtasks || task.subtasks;
					const foundDepSubtask =
						typeof depId === 'number' && depId < 100
							? sourceListForDeps?.find((sub) => sub.id === depId)
							: null;

					if (foundDepSubtask) {
						const isDone =
							foundDepSubtask.status === 'done' ||
							foundDepSubtask.status === 'completed';
						const isInProgress = foundDepSubtask.status === 'in-progress';
						const color = isDone
							? chalk.green.bold
							: isInProgress
								? chalk.hex('#FFA500').bold
								: chalk.red.bold;
						return color(`${task.id}.${depId}`);
					} else if (typeof depId === 'number' && depId < 100) {
						return chalk.red(`${task.id}.${depId} (Not found)`);
					}
					return depId.toString();
				});

				subtaskDeps =
					formattedDeps.length === 1
						? formattedDeps[0]
						: formattedDeps.join(chalk.white(', '));
			}

			subtaskTable.push([
				`${task.id}.${st.id}`,
				statusColor(st.status || 'pending'),
				st.title,
				subtaskDeps
			]);
		});

		console.log(subtaskTable.toString());

		if (statusFilter && originalSubtaskCount !== null) {
			console.log(
				chalk.cyan(
					`  Filtered by status: ${chalk.bold(statusFilter)}. Showing ${chalk.bold(task.subtasks.length)} of ${chalk.bold(originalSubtaskCount)} subtasks.`
				)
			);
			console.log();
		}
	} else if (statusFilter && originalSubtaskCount === 0) {
		console.log(
			boxen(
				chalk.yellow(
					`No subtasks found matching status: ${statusFilter} (Task has no subtasks)`
				),
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					margin: { top: 1, bottom: 0 },
					borderColor: 'yellow',
					borderStyle: 'round'
				}
			)
		);
	} else if (
		statusFilter &&
		originalSubtaskCount !== null &&
		originalSubtaskCount > 0 &&
		task.subtasks?.length === 0
	) {
		console.log(
			boxen(
				chalk.yellow(
					`No subtasks found matching status: ${statusFilter} (out of ${originalSubtaskCount} total)`
				),
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					margin: { top: 1, bottom: 0 },
					borderColor: 'yellow',
					borderStyle: 'round'
				}
			)
		);
	} else if (
		!statusFilter &&
		(!originalSubtasks || originalSubtasks.length === 0)
	) {
		const actualSubtasks = originalSubtasks || task.subtasks;
		if (!actualSubtasks || actualSubtasks.length === 0) {
			console.log(
				boxen(
					chalk.yellow('No subtasks found. Consider breaking down this task:') +
						'\n' +
						chalk.white(
							`Run: ${chalk.cyan(`vibex-task-manager expand --id=${task.id}`)}`
						),
					{
						padding: { top: 0, bottom: 0, left: 1, right: 1 },
						borderColor: 'yellow',
						borderStyle: 'round',
						margin: { top: 1, bottom: 0 }
					}
				)
			);
		}
	}

	// Subtask progress display
	const subtasksForProgress = originalSubtasks || task.subtasks;

	if (subtasksForProgress && subtasksForProgress.length > 0) {
		const totalSubtasks = subtasksForProgress.length;
		const completedSubtasks = subtasksForProgress.filter(
			(st) => st.status === 'done' || st.status === 'completed'
		).length;

		const inProgressSubtasks = subtasksForProgress.filter(
			(st) => st.status === 'in-progress'
		).length;
		const pendingSubtasks = subtasksForProgress.filter(
			(st) => st.status === 'pending'
		).length;
		const blockedSubtasks = subtasksForProgress.filter(
			(st) => st.status === 'blocked'
		).length;
		const deferredSubtasks = subtasksForProgress.filter(
			(st) => st.status === 'deferred'
		).length;
		const cancelledSubtasks = subtasksForProgress.filter(
			(st) => st.status === 'cancelled'
		).length;

		const statusBreakdown: StatusBreakdown = {
			'in-progress': (inProgressSubtasks / totalSubtasks) * 100,
			pending: (pendingSubtasks / totalSubtasks) * 100,
			blocked: (blockedSubtasks / totalSubtasks) * 100,
			deferred: (deferredSubtasks / totalSubtasks) * 100,
			cancelled: (cancelledSubtasks / totalSubtasks) * 100
		};
		const completionPercentage = (completedSubtasks / totalSubtasks) * 100;

		const availableWidth = process.stdout.columns || 80;
		const boxPadding = 2;
		const boxBorders = 2;
		const percentTextLength = 5;
		const progressBarLength = Math.max(
			20,
			Math.min(
				60,
				availableWidth - boxPadding - boxBorders - percentTextLength - 35
			)
		);

		const statusCounts =
			`${chalk.green('✓ Done:')} ${completedSubtasks}  ${chalk.hex('#FFA500')('► In Progress:')} ${inProgressSubtasks}  ${chalk.yellow('○ Pending:')} ${pendingSubtasks}\n` +
			`${chalk.red('! Blocked:')} ${blockedSubtasks}  ${chalk.gray('⏱ Deferred:')} ${deferredSubtasks}  ${chalk.gray('✗ Cancelled:')} ${cancelledSubtasks}`;

		console.log(
			boxen(
				chalk.white.bold('Subtask Progress:') +
					'\n\n' +
					`${chalk.cyan('Completed:')} ${completedSubtasks}/${totalSubtasks} (${completionPercentage.toFixed(1)}%)\n` +
					`${statusCounts}\n` +
					`${chalk.cyan('Progress:')} ${createProgressBar(completionPercentage, progressBarLength, statusBreakdown)}`,
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: 'blue',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 },
					width: Math.min(availableWidth - 10, 100),
					textAlignment: 'left'
				}
			)
		);
	}

	// Suggested actions
	console.log(
		boxen(
			chalk.white.bold('Suggested Actions:') +
				'\n' +
				`${chalk.cyan('1.')} Mark as in-progress: ${chalk.yellow(`vibex-task-manager set-status --id=${task.id} --status=in-progress`)}\n` +
				`${chalk.cyan('2.')} Mark as done when completed: ${chalk.yellow(`vibex-task-manager set-status --id=${task.id} --status=done`)}\n` +
				(subtasksForProgress && subtasksForProgress.length > 0
					? `${chalk.cyan('3.')} Update subtask status: ${chalk.yellow(`vibex-task-manager set-status --id=${task.id}.1 --status=done`)}`
					: `${chalk.cyan('3.')} Break down into subtasks: ${chalk.yellow(`vibex-task-manager expand --id=${task.id}`)}`),
			{
				padding: { top: 0, bottom: 0, left: 1, right: 1 },
				borderColor: 'green',
				borderStyle: 'round',
				margin: { top: 1 }
			}
		)
	);
}

// Re-export helper functions from ui-helpers.ts
export {
	generateComplexityAnalysisPrompt,
	confirmTaskOverwrite,
	displayApiKeyStatus,
	displayModelConfiguration,
	displayAvailableModels,
	displayAiUsageSummary,
	displayComplexityReport
} from './ui-helpers.js';
