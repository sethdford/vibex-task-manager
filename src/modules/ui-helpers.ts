/**
 * ui-helpers.ts
 * Helper functions for the UI module
 */

import chalk from 'chalk';
import {
	AvailableModel,
	TelemetryData,
	ApiKeyStatusReport,
	ConfigData,
	TasksData,
	ComplexityReport
} from '../types/index.js';
import { getDefaultSubtasks } from './config-manager.js';
import {
	TASKMANAGER_CONFIG_FILE,
	TASKMANAGER_TASKS_FILE
} from '../constants/paths.js';
import { isSilentMode, log, truncate } from '../utils/utils.js';
import { analyzeTaskComplexity } from './task-manager.js';
import fs from 'fs';
import boxen from 'boxen';
import Table from 'cli-table3';

/**
 * Generate a prompt for complexity analysis
 */
export function generateComplexityAnalysisPrompt(tasksData: TasksData): string {
	const defaultSubtasks = getDefaultSubtasks(null);
	return `Analyze the complexity of the following tasks and provide recommendations for subtask breakdown:

${tasksData.tasks
	.map(
		(task) => `
Task ID: ${task.id}
Title: ${task.title}
Description: ${task.description}
Details: ${task.details}
Dependencies: ${JSON.stringify(task.dependencies || [])}
Priority: ${task.priority || 'medium'}
`
	)
	.join('\n---\n')}

Analyze each task and return a JSON array with the following structure for each task:
[
  {
    "taskId": number,
    "taskTitle": string,
    "complexityScore": number (1-10),
    "recommendedSubtasks": number (${Math.max(3, defaultSubtasks - 1)}-${Math.min(8, defaultSubtasks + 2)}),
    "expansionPrompt": string (a specific prompt for generating good subtasks),
    "reasoning": string (brief explanation of your assessment)
  },
  ...
]

IMPORTANT: Make sure to include an analysis for EVERY task listed above, with the correct taskId matching each task's ID.
`;
}

/**
 * Confirm overwriting existing tasks.json file
 */
export async function confirmTaskOverwrite(
	_tasksPath: string
): Promise<boolean> {
	console.log(
		boxen(
			chalk.yellow(
				"It looks like you've already generated tasks for this project.\n"
			) +
				chalk.yellow(
					'Executing this command will overwrite any existing tasks.'
				),
			{
				padding: 1,
				borderColor: 'yellow',
				borderStyle: 'round',
				margin: { top: 1 }
			}
		)
	);

	const readline = await import('readline');
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	const answer = await new Promise<string>((resolve) => {
		rl.question(
			chalk.cyan('Are you sure you wish to continue? (y/N): '),
			resolve
		);
	});
	rl.close();

	return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * Display API key status for different providers
 */
export function displayApiKeyStatus(statusReport: ApiKeyStatusReport[]): void {
	if (!statusReport || statusReport.length === 0) {
		console.log(chalk.yellow('No API key status information available.'));
		return;
	}

	const table = new Table({
		head: [
			chalk.cyan('Provider'),
			chalk.cyan('CLI Auth'),
			chalk.cyan('MCP Auth')
		],
		colWidths: [15, 20, 25],
		chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
	});

	statusReport.forEach(({ provider, cli, mcp }) => {
		let cliStatus: string, mcpStatus: string;

		if (provider.toLowerCase() === 'bedrock') {
			cliStatus = cli
				? chalk.green('✅ AWS Configured')
				: chalk.blue('ℹ️ Use AWS CLI');
			mcpStatus = mcp
				? chalk.green('✅ AWS Configured')
				: chalk.blue('ℹ️ Use AWS CLI');
		} else {
			cliStatus = cli ? chalk.green('✅ Found') : chalk.red('❌ Missing');
			mcpStatus = mcp ? chalk.green('✅ Found') : chalk.red('❌ Missing');
		}

		const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
		table.push([providerName, cliStatus, mcpStatus]);
	});

	console.log(chalk.bold('\n🔑 Authentication Status:'));
	console.log(table.toString());
	console.log(
		chalk.gray(
			`  Note: Some providers may require additional endpoint configuration in ${TASKMANAGER_CONFIG_FILE}.`
		)
	);
}

/**
 * Format SWE score with tertile stars
 */
export function formatSweScoreWithTertileStars(
	score: number | null,
	allModels: AvailableModel[]
): string {
	if (score === null || score === undefined || score <= 0) return 'N/A';
	const formattedPercentage = `${(score * 100).toFixed(1)}%`;

	const validScores = allModels
		.map((m) => m.sweScore)
		.filter((s) => s !== null && s !== undefined && s > 0) as number[];
	const sortedScores = [...validScores].sort((a, b) => b - a);
	const n = sortedScores.length;
	let stars = chalk.gray('☆☆☆');

	if (n > 0) {
		const topThirdIndex = Math.max(0, Math.floor(n / 3) - 1);
		const midThirdIndex = Math.max(0, Math.floor((2 * n) / 3) - 1);
		if (score >= sortedScores[topThirdIndex]) stars = chalk.yellow('★★★');
		else if (score >= sortedScores[midThirdIndex])
			stars = chalk.yellow('★★') + chalk.gray('☆');
		else stars = chalk.yellow('★') + chalk.gray('☆☆');
	}
	return `${formattedPercentage} ${stars}`;
}

/**
 * Format cost information
 */
export function formatCost(costObj: AvailableModel['cost']): string {
	if (!costObj) return 'N/A';
	if (costObj.input === 0 && costObj.output === 0) {
		return chalk.green('Free');
	}
	const formatSingleCost = (costValue: number | null) => {
		if (costValue === null || costValue === undefined) return 'N/A';
		const isInteger = Number.isInteger(costValue);
		return `$${costValue.toFixed(isInteger ? 0 : 2)}`;
	};
	return `${formatSingleCost(costObj.input)} in, ${formatSingleCost(costObj.output)} out`;
}

/**
 * Display currently configured active models
 */
export function displayModelConfiguration(
	configData: ConfigData,
	allAvailableModels: AvailableModel[] = []
): void {
	console.log(chalk.cyan.bold('\nActive Model Configuration:'));
	const active = configData.activeModels;
	const activeTable = new Table({
		head: ['Role', 'Provider', 'Model ID', 'SWE Score', 'Cost ($/1M tkns)'].map(
			(h) => chalk.cyan.bold(h)
		),
		colWidths: [10, 14, 30, 18, 20],
		style: { head: ['cyan', 'bold'] }
	});

	activeTable.push([
		chalk.white('Main'),
		active.main.provider,
		active.main.modelId,
		formatSweScoreWithTertileStars(
			active.main.sweScore ?? null,
			allAvailableModels
		),
		formatCost(active.main.cost)
	]);
	activeTable.push([
		chalk.white('Research'),
		active.research.provider,
		active.research.modelId,
		formatSweScoreWithTertileStars(
			active.research.sweScore ?? null,
			allAvailableModels
		),
		formatCost(active.research.cost)
	]);
	if (active.fallback && active.fallback.provider && active.fallback.modelId) {
		activeTable.push([
			chalk.white('Fallback'),
			active.fallback.provider,
			active.fallback.modelId,
			formatSweScoreWithTertileStars(
				active.fallback.sweScore ?? null,
				allAvailableModels
			),
			formatCost(active.fallback.cost)
		]);
	} else {
		activeTable.push([
			chalk.white('Fallback'),
			chalk.gray('-'),
			chalk.gray('(Not Set)'),
			chalk.gray('-'),
			chalk.gray('-')
		]);
	}
	console.log(activeTable.toString());
}

/**
 * Display available models not currently configured
 */
export function displayAvailableModels(
	availableModels: AvailableModel[]
): void {
	if (!availableModels || availableModels.length === 0) {
		console.log(
			chalk.gray('\n(No other models available or all are configured)')
		);
		return;
	}

	console.log(chalk.cyan.bold('\nOther Available Models:'));
	const availableTable = new Table({
		head: ['Provider', 'Model ID', 'SWE Score', 'Cost ($/1M tkns)'].map((h) =>
			chalk.cyan.bold(h)
		),
		colWidths: [15, 40, 18, 25],
		style: { head: ['cyan', 'bold'] }
	});

	availableModels.forEach((model) => {
		availableTable.push([
			model.provider,
			model.modelId,
			formatSweScoreWithTertileStars(model.sweScore ?? null, availableModels),
			formatCost(model.cost)
		]);
	});
	console.log(availableTable.toString());

	console.log(
		boxen(
			chalk.white.bold('Next Steps:') +
				'\n' +
				chalk.cyan(
					`1. Set main model: ${chalk.yellow('vibex-task-manager models --set-main <model_id>')}`
				) +
				'\n' +
				chalk.cyan(
					`2. Set research model: ${chalk.yellow('vibex-task-manager models --set-research <model_id>')}`
				) +
				'\n' +
				chalk.cyan(
					`3. Set fallback model: ${chalk.yellow('vibex-task-manager models --set-fallback <model_id>')}`
				) +
				'\n' +
				chalk.cyan(
					`4. Run interactive setup: ${chalk.yellow('vibex-task-manager models --setup')}`
				) +
				'\n' +
				chalk.cyan(
					`5. Use custom openrouter models: ${chalk.yellow('vibex-task-manager models --openrouter --set-main|research|fallback <model_id>')}`
				),
			{
				padding: 1,
				borderColor: 'yellow',
				borderStyle: 'round',
				margin: { top: 1 }
			}
		)
	);
}

/**
 * Display AI usage telemetry summary
 */
export function displayAiUsageSummary(
	telemetryData: TelemetryData,
	outputType: string = 'cli'
): void {
	if (
		(outputType !== 'cli' && outputType !== 'text') ||
		!telemetryData ||
		isSilentMode()
	) {
		return;
	}

	const {
		modelUsed,
		providerName,
		inputTokens,
		outputTokens,
		totalTokens,
		totalCost,
		commandName
	} = telemetryData;

	let summary = chalk.bold.blue('AI Usage Summary:') + '\n';
	summary += chalk.gray(`  Command: ${commandName}\n`);
	summary += chalk.gray(`  Provider: ${providerName}\n`);
	summary += chalk.gray(`  Model: ${modelUsed}\n`);
	summary += chalk.gray(
		`  Tokens: ${totalTokens} (Input: ${inputTokens}, Output: ${outputTokens})\n`
	);
	summary += chalk.gray(`  Est. Cost: $${totalCost.toFixed(6)}`);

	console.log(
		boxen(summary, {
			padding: 1,
			margin: { top: 1 },
			borderColor: 'blue',
			borderStyle: 'round',
			title: '💡 Telemetry',
			titleAlignment: 'center'
		})
	);
}

/**
 * Display the complexity analysis report
 */
export async function displayComplexityReport(
	reportPath: string
): Promise<void> {
	if (!fs.existsSync(reportPath)) {
		console.log(
			boxen(
				chalk.yellow(`No complexity report found at ${reportPath}\n\n`) +
					'Would you like to generate one now?',
				{
					padding: 1,
					borderColor: 'yellow',
					borderStyle: 'round',
					margin: { top: 1 }
				}
			)
		);

		const readline = require('readline').createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const answer = await new Promise<string>((resolve) => {
			readline.question(
				chalk.cyan('Generate complexity report? (y/n): '),
				resolve
			);
		});
		readline.close();

		if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
			console.log(chalk.blue('Generating complexity report...'));
			const tasksPath = TASKMANAGER_TASKS_FILE;
			if (!fs.existsSync(tasksPath)) {
				console.error(
					'❌ No tasks.json file found. Please run "vibex-task-manager init" or create a tasks.json file.'
				);
				return;
			}

			await analyzeTaskComplexity({
				output: reportPath,
				research: false,
				file: tasksPath
			});
			return displayComplexityReport(reportPath);
		} else {
			console.log(chalk.yellow('Report generation cancelled.'));
			return;
		}
	}

	let report: ComplexityReport;
	try {
		report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
	} catch (error: any) {
		log('error', `Error reading complexity report: ${error.message}`);
		return;
	}

	console.log(
		boxen(chalk.white.bold('Task Complexity Analysis Report'), {
			padding: 1,
			borderColor: 'blue',
			borderStyle: 'round',
			margin: { top: 1, bottom: 1 }
		})
	);

	const metaTable = new Table({
		style: {
			head: [],
			border: [],
			compact: true
		},
		chars: {
			mid: '',
			'left-mid': '',
			'mid-mid': '',
			'right-mid': ''
		},
		colWidths: [20, 50]
	});

	metaTable.push(
		[
			chalk.cyan.bold('Generated:'),
			new Date(report.meta.generatedAt).toLocaleString()
		],
		[chalk.cyan.bold('Tasks Analyzed:'), report.meta.tasksAnalyzed.toString()],
		[
			chalk.cyan.bold('Threshold Score:'),
			report.meta.thresholdScore.toString()
		],
		[chalk.cyan.bold('Project:'), report.meta.projectName],
		[
			chalk.cyan.bold('Research-backed:'),
			report.meta.usedResearch ? 'Yes' : 'No'
		]
	);

	console.log(metaTable.toString());

	const sortedTasks = [...report.complexityAnalysis].sort(
		(a, b) => b.complexityScore - a.complexityScore
	);

	const tasksNeedingExpansion = sortedTasks.filter(
		(task) => task.complexityScore >= report.meta.thresholdScore
	);
	const simpleTasks = sortedTasks.filter(
		(task) => task.complexityScore < report.meta.thresholdScore
	);

	const complexityDistribution = [0, 0, 0];
	sortedTasks.forEach((task) => {
		if (task.complexityScore < 5) complexityDistribution[0]++;
		else if (task.complexityScore < 8) complexityDistribution[1]++;
		else complexityDistribution[2]++;
	});

	const percentLow = Math.round(
		(complexityDistribution[0] / sortedTasks.length) * 100
	);
	const percentMedium = Math.round(
		(complexityDistribution[1] / sortedTasks.length) * 100
	);
	const percentHigh = Math.round(
		(complexityDistribution[2] / sortedTasks.length) * 100
	);

	console.log(
		boxen(
			chalk.white.bold('Complexity Distribution\n\n') +
				`${chalk.green.bold('Low (1-4):')} ${complexityDistribution[0]} tasks (${percentLow}%)\n` +
				`${chalk.yellow.bold('Medium (5-7):')} ${complexityDistribution[1]} tasks (${percentMedium}%)\n` +
				`${chalk.red.bold('High (8-10):')} ${complexityDistribution[2]} tasks (${percentHigh}%)`,
			{
				padding: 1,
				borderColor: 'cyan',
				borderStyle: 'round',
				margin: { top: 1, bottom: 1 }
			}
		)
	);

	const terminalWidth = process.stdout.columns || 100;
	const idWidth = 12;
	const titleWidth = Math.floor(terminalWidth * 0.25);
	const scoreWidth = 8;
	const subtasksWidth = 8;
	const commandWidth =
		terminalWidth - idWidth - titleWidth - scoreWidth - subtasksWidth - 10;

	const complexTable = new Table({
		head: [
			chalk.yellow.bold('ID'),
			chalk.yellow.bold('Title'),
			chalk.yellow.bold('Score'),
			chalk.yellow.bold('Subtasks'),
			chalk.yellow.bold('Expansion Command')
		],
		colWidths: [idWidth, titleWidth, scoreWidth, subtasksWidth, commandWidth],
		style: { head: [], border: [] },
		wordWrap: true,
		wrapOnWordBoundary: true
	});

	const getComplexityWithColor = (score: number): string => {
		if (score <= 3) return chalk.green(`● ${score}`);
		if (score <= 6) return chalk.yellow(`● ${score}`);
		return chalk.red(`● ${score}`);
	};

	tasksNeedingExpansion.forEach((task) => {
		const expansionCommand = `vibex-task-manager expand --id=${task.taskId} --num=${task.recommendedSubtasks}${task.expansionPrompt ? ` --prompt="${task.expansionPrompt}"` : ''}`;

		complexTable.push([
			task.taskId.toString(),
			truncate(task.taskTitle, titleWidth - 3),
			getComplexityWithColor(task.complexityScore),
			task.recommendedSubtasks.toString(),
			chalk.cyan(expansionCommand)
		]);
	});

	console.log(complexTable.toString());

	if (simpleTasks.length > 0) {
		console.log(
			boxen(chalk.green.bold(`Simple Tasks (${simpleTasks.length})`), {
				padding: { left: 2, right: 2, top: 0, bottom: 0 },
				margin: { top: 1, bottom: 0 },
				borderColor: 'green',
				borderStyle: 'round'
			})
		);

		const simpleTable = new Table({
			head: [
				chalk.green.bold('ID'),
				chalk.green.bold('Title'),
				chalk.green.bold('Score'),
				chalk.green.bold('Reasoning')
			],
			colWidths: [5, 40, 8, 50],
			style: { head: [], border: [] }
		});

		simpleTasks.forEach((task) => {
			simpleTable.push([
				task.taskId.toString(),
				truncate(task.taskTitle, 37),
				getComplexityWithColor(task.complexityScore),
				truncate(task.reasoning, 47)
			]);
		});

		console.log(simpleTable.toString());
	}

	console.log(
		boxen(
			chalk.white.bold('Suggested Actions:') +
				'\n\n' +
				`${chalk.cyan('1.')} Expand all complex tasks: ${chalk.yellow('vibex-task-manager expand --all')}\n` +
				`${chalk.cyan('2.')} Expand a specific task: ${chalk.yellow('vibex-task-manager expand --id=<id>')}\n` +
				`${chalk.cyan('3.')} Regenerate with research: ${chalk.yellow('vibex-task-manager analyze-complexity --research')}`,
			{
				padding: 1,
				borderColor: 'cyan',
				borderStyle: 'round',
				margin: { top: 1 }
			}
		)
	);
}
