import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { Ora } from 'ora';
import { Task, Subtask } from './types.js';

import {
	getStatusWithColor,
	startLoadingIndicator,
	stopLoadingIndicator,
	displayAiUsageSummary
} from '../ui.js';
import {
	log as consoleLog,
	readJSON,
	writeJSON,
	truncate,
	isSilentMode
} from '../utils.js';
import { generateTextService } from '../ai-services-unified.js';
import { getDebugFlag, getConfig } from '../config-manager.js';
import generateTaskFiles from './generate-task-files.js';

interface TasksData {
	tasks: Task[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
}

// Define interfaces for proper typing
interface UpdateSubtaskContext {
	session?: { env?: Record<string, string> };
	mcpLog?: {
		error: (...args: unknown[]) => void;
		info: (...args: unknown[]) => void;
		warn: (...args: unknown[]) => void;
		debug: (...args: unknown[]) => void;
	};
	projectRoot?: string;
}

/**
 * Update a subtask by appending additional timestamped information using the unified AI service.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {string} subtaskId - ID of the subtask to update in format "parentId.subtaskId"
 * @param {string} prompt - Prompt for generating additional information
 * @param {boolean} [useResearch=false] - Whether to use the research AI role.
 * @param {UpdateSubtaskContext} context - Context object containing session and mcpLog.
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json'). Automatically 'json' if mcpLog is present.
 * @returns {Promise<Subtask | null>} - The updated subtask or null if update failed.
 */
async function updateSubtaskById(
	tasksPath: string,
	subtaskId: string,
	prompt: string,
	useResearch = false,
	context: UpdateSubtaskContext = {},
	outputFormat: 'text' | 'json' = context.mcpLog ? 'json' : 'text'
): Promise<Subtask | null> {
	const { session, mcpLog, projectRoot } = context;
	const isMCP = !!mcpLog;

	// Report helper
	const report = (level: 'info' | 'warn' | 'error', ...args: unknown[]) => {
		if (isMCP && mcpLog) {
			if (typeof mcpLog[level] === 'function') {
				mcpLog[level](...args);
			} else {
				mcpLog.info(...args);
			}
		} else if (!isSilentMode()) {
			consoleLog(level, ...args);
		}
	};

	let loadingIndicator: Ora | null = null;

	try {
		report('info', `Updating subtask ${subtaskId} with prompt: "${prompt}"`);

		if (
			!subtaskId ||
			typeof subtaskId !== 'string' ||
			!subtaskId.includes('.')
		) {
			throw new Error(
				`Invalid subtask ID format: ${subtaskId}. Subtask ID must be in format "parentId.subtaskId"`
			);
		}

		if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
			throw new Error(
				'Prompt cannot be empty. Please provide context for the subtask update.'
			);
		}

		if (!fs.existsSync(tasksPath)) {
			throw new Error(`Tasks file not found at path: ${tasksPath}`);
		}

		const data: TasksData = readJSON(tasksPath) as TasksData;
		if (!data || !data.tasks) {
			throw new Error(
				`No valid tasks found in ${tasksPath}. The file may be corrupted or have an invalid format.`
			);
		}

		const [parentIdStr, subtaskIdStr] = subtaskId.split('.');
		const parentId = parseInt(parentIdStr, 10);
		const subtaskIdNum = parseInt(subtaskIdStr, 10);

		if (
			isNaN(parentId) ||
			parentId <= 0 ||
			isNaN(subtaskIdNum) ||
			subtaskIdNum <= 0
		) {
			throw new Error(
				`Invalid subtask ID format: ${subtaskId}. Both parent ID and subtask ID must be positive integers.`
			);
		}

		const parentTask = data.tasks.find((task) => task.id === parentId);
		if (!parentTask) {
			throw new Error(
				`Parent task with ID ${parentId} not found. Please verify the task ID and try again.`
			);
		}

		if (!parentTask.subtasks || !Array.isArray(parentTask.subtasks)) {
			throw new Error(`Parent task ${parentId} has no subtasks.`);
		}

		const subtaskIndex = parentTask.subtasks.findIndex(
			(st) => st.id === subtaskIdNum
		);
		if (subtaskIndex === -1) {
			throw new Error(
				`Subtask with ID ${subtaskId} not found. Please verify the subtask ID and try again.`
			);
		}

		const subtask: Subtask = parentTask.subtasks[subtaskIndex];

		if (outputFormat === 'text') {
			const table = new Table({
				head: [
					chalk.cyan.bold('ID'),
					chalk.cyan.bold('Title'),
					chalk.cyan.bold('Status')
				],
				colWidths: [10, 55, 15]
			});
			table.push([
				subtaskId,
				truncate(subtask.title, 52),
				getStatusWithColor(subtask.status)
			]);
			console.log(
				boxen(chalk.white.bold(`Updating Subtask #${subtaskId}`), {
					padding: 1,
					borderColor: 'blue',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 }
				})
			);
			console.log(table.toString());
			loadingIndicator = startLoadingIndicator(
				useResearch
					? 'Updating subtask with research...'
					: 'Updating subtask...'
			);
		}

		let generatedContentString = '';
		let newlyAddedSnippet = '';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let aiServiceResponse: any | null = null;

		try {
			const parentContext = {
				id: parentTask.id,
				title: parentTask.title
			};
			const prevSubtask =
				subtaskIndex > 0
					? {
							id: `${parentTask.id}.${
								parentTask.subtasks[subtaskIndex - 1].id
							}`,
							title: parentTask.subtasks[subtaskIndex - 1].title,
							status: parentTask.subtasks[subtaskIndex - 1].status
						}
					: null;
			const nextSubtask =
				subtaskIndex < parentTask.subtasks.length - 1
					? {
							id: `${parentTask.id}.${
								parentTask.subtasks[subtaskIndex + 1].id
							}`,
							title: parentTask.subtasks[subtaskIndex + 1].title,
							status: parentTask.subtasks[subtaskIndex + 1].status
						}
					: null;

			const contextString = `
Parent Task: ${JSON.stringify(parentContext)}
${prevSubtask ? `Previous Subtask: ${JSON.stringify(prevSubtask)}` : ''}
${nextSubtask ? `Next Subtask: ${JSON.stringify(nextSubtask)}` : ''}
Current Subtask Details (for context only):\n${subtask.details || '(No existing details)'}
`;

			const systemPrompt = `You are an AI assistant helping to update a subtask. You will be provided with the subtask's existing details, context about its parent and sibling tasks, and a user request string.

Your Goal: Based *only* on the user's request and all the provided context (including existing details if relevant to the request), GENERATE the new text content that should be added to the subtask's details.
Focus *only* on generating the substance of the update.

Output Requirements:
1. Return *only* the newly generated text content as a plain string. Do NOT return a JSON object or any other structured data.
2. Your string response should NOT include any of the subtask's original details, unless the user's request explicitly asks to rephrase, summarize, or directly modify existing text.
3. Do NOT include any timestamps, XML-like tags, markdown, or any other special formatting in your string response.
4. Ensure the generated text is concise yet complete for the update based on the user request. Avoid conversational fillers or explanations about what you are doing (e.g., do not start with "Okay, here's the update...").`;

			// Pass the existing subtask.details in the user prompt for the AI's context.
			const userPrompt = `Task Context:\n${contextString}\n\nUser Request: "${prompt}"\n\nBased on the User Request and all the Task Context (including current subtask details provided above), what is the new information or text that should be appended to this subtask's details? Return ONLY this new text as a plain string.`;

			const role = useResearch ? 'research' : 'main';
			report('info', `Using AI text service with role: ${role}`);

			aiServiceResponse = await generateTextService({
				prompt: userPrompt,
				systemPrompt: systemPrompt,
				role,
				session,
				projectRoot,
				maxRetries: 2,
				commandName: 'update-subtask',
				outputType: isMCP ? 'mcp' : 'cli'
			});

			if (
				aiServiceResponse &&
				aiServiceResponse.mainResult &&
				typeof aiServiceResponse.mainResult === 'string'
			) {
				generatedContentString = aiServiceResponse.mainResult;
			} else {
				generatedContentString = '';
				report(
					'warn',
					'AI service response did not contain expected text string.'
				);
			}

			if (outputFormat === 'text' && loadingIndicator) {
				stopLoadingIndicator(loadingIndicator);
				loadingIndicator = null;
			}
		} catch (aiError: unknown) {
			const errorMessage =
				aiError instanceof Error ? aiError.message : String(aiError);
			report('error', `AI service call failed: ${errorMessage}`);
			if (outputFormat === 'text' && loadingIndicator) {
				stopLoadingIndicator(loadingIndicator);
				loadingIndicator = null;
			}
			throw new Error(`AI service failed: ${errorMessage}`);
		}

		if (generatedContentString.trim()) {
			const timestamp = new Date().toISOString();
			newlyAddedSnippet = `\n\n--- UPDATED ${timestamp} ---\n${generatedContentString.trim()}`;
			subtask.details = (subtask.details || '') + newlyAddedSnippet;
		}

		parentTask.subtasks[subtaskIndex] = subtask;

		writeJSON(tasksPath, data);

		if (outputFormat === 'text') {
			displayAiUsageSummary(aiServiceResponse);
		}
		// In text mode, regenerate task files if config is set
		const config = getConfig();
		if (outputFormat === 'text' && config && (config as any).generateTaskFiles) {
			if (!projectRoot) {
				report(
					'warn',
					'Cannot generate task files: projectRoot is not defined.'
				);
			} else {
				await generateTaskFiles(projectRoot, parentTask.id.toString());
			}
		}
		if (outputFormat === 'text') {
			console.log(
				chalk.green.bold('\n✅ Subtask updated successfully.')
			);
			if (newlyAddedSnippet) {
				console.log(
					boxen(chalk.gray(newlyAddedSnippet.trim()), {
						padding: { top: 0, bottom: 0, left: 1, right: 1 },
						margin: { top: 1, bottom: 1 },
						borderColor: 'gray',
						borderStyle: 'round'
					})
				);
			}
		}

		report('info', `Subtask ${subtaskId} updated successfully.`);
		return subtask;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (outputFormat === 'text' && loadingIndicator) {
			stopLoadingIndicator(loadingIndicator);
		}
		report('error', `Error updating subtask: ${errorMessage}`);
		if (getDebugFlag()) {
			report('error', error instanceof Error ? error.stack : 'No stack trace');
		}
		return null;
	}
}

export default updateSubtaskById;
