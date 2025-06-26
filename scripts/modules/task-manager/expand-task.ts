import fs from 'fs';
import path from 'path';
import { z } from 'zod';

import { log, readJSON, writeJSON, isSilentMode } from '../utils.js';

import {
	startLoadingIndicator,
	stopLoadingIndicator,
	displayAiUsageSummary
} from '../ui.js';

import { generateTextService } from '../ai-services-unified.js';

import { getDefaultSubtasks, getDebugFlag } from '../config-manager.js';
import generateTaskFiles from './generate-task-files.js';
import { COMPLEXITY_REPORT_FILE } from '../../../src/constants/paths.js';

// Define interfaces for proper typing
interface Task {
	id: number;
	title: string;
	description: string;
	details?: string;
	subtasks?: Subtask[];
}

interface Subtask {
	id: number;
	title: string;
	description: string;
	dependencies: number[];
	details: string;
	status: string;
	testStrategy?: string;
}

interface ExpandTaskContext {
	session?: { env?: Record<string, string> };
	mcpLog?: {
		error: (...args: any[]) => void;
		info: (...args: any[]) => void;
		warn: (...args: any[]) => void;
		debug: (...args: any[]) => void;
	};
	projectRoot?: string;
}

// --- Zod Schemas (Keep from previous step) ---
const subtaskSchema = z
	.object({
		id: z
			.number()
			.int()
			.positive()
			.describe('Sequential subtask ID starting from 1'),
		title: z.string().min(5).describe('Clear, specific title for the subtask'),
		description: z
			.string()
			.min(10)
			.describe('Detailed description of the subtask'),
		dependencies: z
			.array(z.number().int())
			.describe('IDs of prerequisite subtasks within this expansion'),
		details: z.string().min(20).describe('Implementation details and guidance'),
		status: z
			.string()
			.describe(
				'The current status of the subtask (should be pending initially)'
			),
		testStrategy: z
			.string()
			.optional()
			.describe('Approach for testing this subtask')
	})
	.strict();
const subtaskArraySchema = z.array(subtaskSchema);
const subtaskWrapperSchema = z.object({
	subtasks: subtaskArraySchema.describe('The array of generated subtasks.')
});
// --- End Zod Schemas ---

/**
 * Generates the system prompt for the main AI role (e.g., Claude).
 * @param {number} subtaskCount - The target number of subtasks.
 * @returns {string} The system prompt.
 */
function generateMainSystemPrompt(subtaskCount: number): string {
	return `You are an AI assistant helping with task breakdown for software development.
You need to break down a high-level task into ${subtaskCount} specific subtasks that can be implemented one by one.

Subtasks should:
1. Be specific and actionable implementation steps
2. Follow a logical sequence
3. Each handle a distinct part of the parent task
4. Include clear guidance on implementation approach
5. Have appropriate dependency chains between subtasks (using the new sequential IDs)
6. Collectively cover all aspects of the parent task

For each subtask, provide:
- id: Sequential integer starting from the provided nextSubtaskId
- title: Clear, specific title
- description: Detailed description
- dependencies: Array of prerequisite subtask IDs (use the new sequential IDs)
- details: Implementation details
- testStrategy: Optional testing approach


Respond ONLY with a valid JSON object containing a single key "subtasks" whose value is an array matching the structure described. Do not include any explanatory text, markdown formatting, or code block markers.`;
}

/**
 * Generates the user prompt for the main AI role (e.g., Claude).
 * @param {Object} task - The parent task object.
 * @param {number} subtaskCount - The target number of subtasks.
 * @param {string} additionalContext - Optional additional context.
 * @param {number} nextSubtaskId - The starting ID for the new subtasks.
 * @returns {string} The user prompt.
 */
function generateMainUserPrompt(
	task: Task,
	subtaskCount: number,
	additionalContext: string,
	nextSubtaskId: number
): string {
	const contextPrompt = additionalContext
		? `\n\nAdditional context: ${additionalContext}`
		: '';
	const schemaDescription = `
{
  "subtasks": [
    {
      "id": ${nextSubtaskId}, // First subtask ID
      "title": "Specific subtask title",
      "description": "Detailed description",
      "dependencies": [], // e.g., [${nextSubtaskId + 1}] if it depends on the next
      "details": "Implementation guidance",
      "testStrategy": "Optional testing approach"
    },
    // ... (repeat for a total of ${subtaskCount} subtasks with sequential IDs)
  ]
}`;

	return `Break down this task into exactly ${subtaskCount} specific subtasks:

Task ID: ${task.id}
Title: ${task.title}
Description: ${task.description}
Current details: ${task.details || 'None'}
${contextPrompt}

Return ONLY the JSON object containing the "subtasks" array, matching this structure:
${schemaDescription}`;
}

/**
 * Generates the user prompt for the research AI role (e.g., Perplexity).
 * @param {Object} task - The parent task object.
 * @param {number} subtaskCount - The target number of subtasks.
 * @param {string} additionalContext - Optional additional context.
 * @param {number} nextSubtaskId - The starting ID for the new subtasks.
 * @returns {string} The user prompt.
 */
function generateResearchUserPrompt(
	task: Task,
	subtaskCount: number,
	additionalContext: string,
	nextSubtaskId: number
): string {
	const contextPrompt = additionalContext
		? `\n\nConsider this context: ${additionalContext}`
		: '';
	const schemaDescription = `
{
  "subtasks": [
    {
      "id": <number>, // Sequential ID starting from ${nextSubtaskId}
      "title": "<string>",
      "description": "<string>",
      "dependencies": [<number>], // e.g., [${nextSubtaskId + 1}]. If no dependencies, use an empty array [].
      "details": "<string>",
      "testStrategy": "<string>" // Optional
    },
    // ... (repeat for ${subtaskCount} subtasks)
  ]
}`;

	return `Analyze the following task and break it down into exactly ${subtaskCount} specific subtasks using your research capabilities. Assign sequential IDs starting from ${nextSubtaskId}.

Parent Task:
ID: ${task.id}
Title: ${task.title}
Description: ${task.description}
Current details: ${task.details || 'None'}
${contextPrompt}

CRITICAL: Respond ONLY with a valid JSON object containing a single key "subtasks". The value must be an array of the generated subtasks, strictly matching this structure:
${schemaDescription}

Important: For the 'dependencies' field, if a subtask has no dependencies, you MUST use an empty array, for example: "dependencies": []. Do not use null or omit the field.

Do not include ANY explanatory text, markdown, or code block markers. Just the JSON object.`;
}

/**
 * Parse subtasks from AI's text response. Includes basic cleanup.
 * @param {string} text - Response text from AI.
 * @param {number} startId - Starting subtask ID expected.
 * @param {number} expectedCount - Expected number of subtasks.
 * @param {number} parentTaskId - Parent task ID for context.
 * @param {Object} logger - Logging object (mcpLog or console log).
 * @returns {Array} Parsed and potentially corrected subtasks array.
 * @throws {Error} If parsing fails or JSON is invalid/malformed.
 */
function parseSubtasksFromText(
	text: string,
	startId: number,
	expectedCount: number,
	parentTaskId: number,
	logger: any
): Subtask[] {
	if (typeof text !== 'string') {
		logger.error(
			`AI response text is not a string. Received type: ${typeof text}, Value: ${text}`
		);
		throw new Error('AI response text is not a string.');
	}

	if (!text || text.trim() === '') {
		throw new Error('AI response text is empty after trimming.');
	}

	const originalTrimmedResponse = text.trim(); // Store the original trimmed response
	let jsonToParse = originalTrimmedResponse; // Initialize jsonToParse with it

	logger.debug(
		`Original AI Response for parsing (full length: ${jsonToParse.length}): ${jsonToParse.substring(0, 1000)}...`
	);

	// --- Pre-emptive cleanup for known AI JSON issues ---
	// Fix for "dependencies": , or "dependencies":,
	if (jsonToParse.includes('"dependencies":')) {
		const malformedPattern = /"dependencies":\s*,/g;
		if (malformedPattern.test(jsonToParse)) {
			logger.warn('Attempting to fix malformed "dependencies": , issue.');
			jsonToParse = jsonToParse.replace(
				malformedPattern,
				'"dependencies": [],'
			);
			logger.debug(
				`JSON after fixing "dependencies": ${jsonToParse.substring(0, 500)}...`
			);
		}
	}
	// --- End pre-emptive cleanup ---

	let parsedObject: { subtasks?: Subtask[] } | null = null;
	let primaryParseAttemptFailed = false;

	// --- Attempt 1: Simple Parse (with optional Markdown cleanup) ---
	logger.debug('Attempting simple parse...');
	try {
		// Check for markdown code block
		const codeBlockMatch = jsonToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		let contentToParseDirectly = jsonToParse;
		if (codeBlockMatch && codeBlockMatch[1]) {
			contentToParseDirectly = codeBlockMatch[1].trim();
			logger.debug('Simple parse: Extracted content from markdown code block.');
		} else {
			logger.debug(
				'Simple parse: No markdown code block found, using trimmed original.'
			);
		}

		parsedObject = JSON.parse(contentToParseDirectly);
		logger.debug('Simple parse successful!');

		// Quick check if it looks like our target object
		if (
			!parsedObject ||
			typeof parsedObject !== 'object' ||
			!Array.isArray(parsedObject.subtasks)
		) {
			logger.warn(
				'Simple parse succeeded, but result is not the expected {"subtasks": []} structure. Will proceed to advanced extraction.'
			);
			primaryParseAttemptFailed = true;
			parsedObject = null; // Reset parsedObject so we enter the advanced logic
		}
		// If it IS the correct structure, we'll skip advanced extraction.
	} catch (e: any) {
		logger.warn(
			`Simple JSON.parse failed. Error: ${e.message}. Will try more robust parsing methods.`
		);
		primaryParseAttemptFailed = true;
	}

	// --- Attempt 2: Handle cases where the AI returns a raw array instead of an object ---
	if (primaryParseAttemptFailed) {
		logger.debug(
			'Attempting parse assuming a raw array response (wrapping in {"subtasks": ...}).'
		);
		try {
			// This regex is a bit more robust in finding something that looks like the start of a JSON array.
			const arrayMatch = jsonToParse.match(/^\s*\[\s*\{/);
			if (arrayMatch) {
				const wrappedJson = `{"subtasks": ${jsonToParse}}`;
				parsedObject = JSON.parse(wrappedJson);
				logger.debug(
					'Successfully parsed after wrapping raw array in "subtasks" object.'
				);
			} else {
				throw new Error('Response does not appear to be a raw JSON array.');
			}
		} catch (e: any) {
			logger.warn(`Parsing as a raw array failed. Error: ${e.message}`);
		}
	}

	// --- Attempt 3: Regex to find the JSON object/array within the string ---
	if (!parsedObject) {
		logger.debug('Attempting to find JSON block using regex...');
		try {
			const jsonRegex = /{\s*"subtasks":\s*\[[\s\S]*?\]\s*}/;
			const match = jsonToParse.match(jsonRegex);
			if (match && match[0]) {
				parsedObject = JSON.parse(match[0]);
				logger.debug('Successfully parsed using regex to find JSON block.');
			} else {
				throw new Error('Regex could not find a valid JSON block.');
			}
		} catch (e: any) {
			logger.error(`All parsing attempts failed. Final error: ${e.message}`);
			// For debugging, log the response that failed all parsing attempts
			logger.debug(
				`Failed Response Details:
Original Length: ${originalTrimmedResponse.length}
Trimmed Length: ${jsonToParse.length}
Content (first 500 chars): ${jsonToParse.substring(0, 500)}...`
			);
			throw new Error(
				'Failed to parse a valid JSON object from the AI response.'
			);
		}
	}

	// --- Validation and Correction ---
	if (!parsedObject || !parsedObject.subtasks) {
		throw new Error(
			'Parsed JSON is invalid or does not contain a "subtasks" array.'
		);
	}

	let subtasks = parsedObject.subtasks;

	// Use Zod to validate the structure of the parsed subtasks
	try {
		subtasks = subtaskArraySchema.parse(subtasks) as any;
	} catch (e: any) {
		logger.error(`Zod validation failed: ${e.message}`);
		logger.debug(`Invalid subtasks object: ${JSON.stringify(subtasks)}`);
		throw new Error(
			`The AI response, while valid JSON, did not match the required subtask schema. ${e.message}`
		);
	}

	// --- Post-Parsing Correction and Validation ---
	const correctedSubtasks: Subtask[] = [];
	const existingIds = new Set();
	let nextId = startId;

	if (!Array.isArray(subtasks)) {
		throw new Error('Parsed "subtasks" property is not an array.');
	}

	for (const subtask of subtasks) {
		const correctedSubtask: Subtask = {
			id: subtask.id,
			title: subtask.title,
			description: subtask.description,
			dependencies: Array.isArray(subtask.dependencies)
				? subtask.dependencies
				: [],
			details: subtask.details || 'No details provided.',
			status: 'pending', // Always set to pending initially
			testStrategy: subtask.testStrategy
		};

		// 1. Correct IDs to be sequential
		if (correctedSubtask.id !== nextId) {
			logger.warn(
				`Correcting subtask ID from ${correctedSubtask.id} to ${nextId}.`
			);
			correctedSubtask.id = nextId;
		}

		// 2. Check for duplicate IDs after correction
		if (existingIds.has(correctedSubtask.id)) {
			logger.warn(
				`Duplicate subtask ID ${correctedSubtask.id} found after correction. Re-assigning.`
			);
			nextId++; // Get a new ID
			correctedSubtask.id = nextId;
		}
		existingIds.add(correctedSubtask.id);

		// 3. Validate dependencies to ensure they exist within the *newly created* set of subtasks
		const validDepIds = new Set(subtasks.map((st, index) => startId + index));
		correctedSubtask.dependencies = correctedSubtask.dependencies.filter(
			(depId) => {
				if (depId === correctedSubtask.id) {
					logger.warn(
						`Subtask ${correctedSubtask.id} cannot depend on itself. Removing dependency.`
					);
					return false;
				}
				if (!validDepIds.has(depId)) {
					logger.warn(
						`Dependency ID ${depId} for subtask ${correctedSubtask.id} is invalid (out of range). Removing.`
					);
					return false;
				}
				return true;
			}
		);

		correctedSubtasks.push(correctedSubtask);
		nextId++;
	}

	// Final check for expected count
	if (correctedSubtasks.length !== expectedCount) {
		logger.warn(
			`AI generated ${correctedSubtasks.length} subtasks, but ${expectedCount} were expected. The output will be used as-is, but this may indicate a model compliance issue.`
		);
	}

	return correctedSubtasks;
}

/**
 * Expand a task into subtasks using the unified AI service (generateTextService).
 * Appends new subtasks by default. Replaces existing subtasks if force=true.
 * Integrates complexity report to determine subtask count and prompt if available,
 * unless numSubtasks is explicitly provided.
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} taskId - Task ID to expand
 * @param {number | null | undefined} [numSubtasks] - Optional: Explicit target number of subtasks. If null/undefined, check complexity report or config default.
 * @param {boolean} [useResearch=false] - Whether to use the research AI role.
 * @param {string} [additionalContext=''] - Optional additional context.
 * @param {Object} context - Context object containing session and mcpLog.
 * @param {Object} [context.session] - Session object from MCP.
 * @param {Object} [context.mcpLog] - MCP logger object.
 * @param {boolean} [force=false] - If true, replace existing subtasks; otherwise, append.
 * @returns {Promise<Object>} The updated parent task object with new subtasks.
 * @throws {Error} If task not found, AI service fails, or parsing fails.
 */
async function expandTask(
	tasksPath: string,
	taskId: string,
	numSubtasks?: number,
	useResearch = false,
	additionalContext = '',
	context: ExpandTaskContext = {},
	force = false
) {
	let loadingIndicator;
	const isDebug = getDebugFlag();
	const mcpLog = context.mcpLog || console;
	const isSilent = isSilentMode();

	const report = (level: 'info' | 'warn' | 'error', message: string) => {
		if (context.mcpLog) {
			context.mcpLog[level](message);
		} else if (!isSilent) {
			log(level, message);
		}
	};

	try {
		if (!isSilent) {
			loadingIndicator = startLoadingIndicator(
				`Expanding task ${taskId}, please wait...`
			);
		}

		const data = readJSON(tasksPath);
		const task = data.tasks.find((t: Task) => t.id === parseInt(taskId, 10));

		if (!task) {
			throw new Error(`Task with ID ${taskId} not found.`);
		}

		// If subtasks already exist and force is false, exit
		if (task.subtasks && task.subtasks.length > 0 && !force) {
			stopLoadingIndicator(loadingIndicator);
			return {
				success: false,
				message: `Task ${taskId} already has subtasks. Use --force to overwrite.`,
				telemetryData: null
			};
		}

		const subtaskCount = numSubtasks || getDefaultSubtasks() || 5;
		const nextSubtaskId =
			task.subtasks && task.subtasks.length > 0
				? Math.max(...task.subtasks.map((st: Subtask) => st.id)) + 1
				: 1;

		report(
			'info',
			`Expanding task ${taskId} into ${subtaskCount} subtasks. Starting ID: ${nextSubtaskId}. Research mode: ${useResearch}`
		);

		let aiServiceResponse;
		let generatedSubtasks: Subtask[] = [];

		const systemPrompt = generateMainSystemPrompt(subtaskCount);
		const userPrompt = useResearch
			? generateResearchUserPrompt(
					task,
					subtaskCount,
					additionalContext,
					nextSubtaskId
				)
			: generateMainUserPrompt(
					task,
					subtaskCount,
					additionalContext,
					nextSubtaskId
				);

		const serviceOptions = {
			prompt: userPrompt,
			systemPrompt: systemPrompt,
			isJSONResponse: true,
			maxRetries: 3,
			schema: subtaskWrapperSchema,
			service: useResearch ? 'perplexity' : 'anthropic',
			model: useResearch ? 'perplexity-large' : 'claude-3-5-sonnet-20240620',
			temperature: useResearch ? 0.4 : 0.2, // Lower temp for structured output
			logger: mcpLog,
			projectRoot: context.projectRoot || process.cwd()
		};

		try {
			aiServiceResponse = await generateTextService(serviceOptions);

			if (!aiServiceResponse || !aiServiceResponse.mainResult) {
				throw new Error('AI service did not return a valid response object.');
			}

			// The unified service with Zod schema parsing should return a structured object.
			const parsedResult = subtaskWrapperSchema.safeParse(
				aiServiceResponse.mainResult
			);

			if (!parsedResult.success) {
				report(
					'error',
					`AI response failed Zod validation: ${parsedResult.error.message}`
				);
				// Attempt to re-parse from the raw response as a fallback
				if (typeof aiServiceResponse.mainResult === 'string') {
					report('warn', 'Attempting to re-parse raw string response.');
					generatedSubtasks = parseSubtasksFromText(
						aiServiceResponse.mainResult,
						nextSubtaskId,
						subtaskCount,
						task.id,
						mcpLog
					);
				} else {
					throw new Error(
						'AI response was not a valid JSON object and could not be parsed.'
					);
				}
			} else {
				generatedSubtasks = parsedResult.data.subtasks as any;
			}
		} catch (aiError: any) {
			stopLoadingIndicator(loadingIndicator);
			report('error', `AI service call failed: ${aiError.message}`);
			// Log additional details if available
			if (aiError.response) {
				report(
					'error',
					`Response details: ${JSON.stringify(aiError.response.data)}`
				);
			}
			throw aiError; // Re-throw to be caught by the outer try-catch
		}

		if (!generatedSubtasks || generatedSubtasks.length === 0) {
			throw new Error('AI failed to generate any subtasks.');
		}

		// Overwrite or initialize subtasks
		task.subtasks = generatedSubtasks.map((sub: any) => ({
			...sub,
			status: 'pending', // Ensure status is always pending
			dependencies: Array.isArray(sub.dependencies) ? sub.dependencies : []
		}));

		// Recalculate complexity and update task status if needed
		try {
			const complexityReportPath = path.join(
				context.projectRoot || process.cwd(),
				COMPLEXITY_REPORT_FILE
			);
			if (fs.existsSync(complexityReportPath)) {
				const complexityReport = readJSON(complexityReportPath);
				const taskComplexity = complexityReport.tasks.find(
					(t: any) => t.id === task.id
				);
				if (taskComplexity) {
					(task as any).complexity = taskComplexity.complexityScore;
				}
			}
		} catch (e: any) {
			report(
				'warn',
				`Could not read or apply complexity score from report: ${e.message}`
			);
		}

		writeJSON(tasksPath, data);

		// Regenerate individual task files
		await generateTaskFiles(tasksPath, path.dirname(tasksPath));

		stopLoadingIndicator(loadingIndicator);

		if (aiServiceResponse && aiServiceResponse.telemetryData) {
			displayAiUsageSummary(aiServiceResponse.telemetryData, 'cli');
		}

		return {
			success: true,
			message: `Task ${taskId} expanded into ${generatedSubtasks.length} subtasks.`,
			subtasks: generatedSubtasks,
			telemetryData: aiServiceResponse?.telemetryData
		};
	} catch (error: any) {
		stopLoadingIndicator(loadingIndicator);
		report('error', `Error expanding task ${taskId}: ${error.message}`);
		if (isDebug) {
			console.error(error); // Log the full error stack in debug mode
		}
		return {
			success: false,
			message: `Failed to expand task ${taskId}: ${error.message}`,
			telemetryData: null
		};
	}
}

export default expandTask;
