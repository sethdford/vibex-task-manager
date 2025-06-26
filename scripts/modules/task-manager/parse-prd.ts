import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import { z } from 'zod';

import {
	log,
	writeJSON,
	enableSilentMode,
	disableSilentMode,
	isSilentMode,
	readJSON,
	findTaskById
} from '../utils.js';

import { generateObjectService } from '../ai-services-unified.js';
import { getDebugFlag } from '../config-manager.js';
import generateTaskFiles from './generate-task-files.js';
import { displayAiUsageSummary } from '../ui.js';
import { Task, TasksData } from './types.js';

// Define the Zod schema for a SINGLE task object
const prdSingleTaskSchema = z.object({
	id: z.number().int().positive(),
	title: z.string().min(1),
	description: z.string().min(1),
	details: z.string().optional().default(''),
	testStrategy: z.string().optional().default(''),
	priority: z.enum(['high', 'medium', 'low']).default('medium'),
	dependencies: z.array(z.number().int().positive()).optional().default([]),
	status: z.string().optional().default('pending')
});

// Define the Zod schema for the ENTIRE expected AI response object
const prdResponseSchema = z.object({
	tasks: z.array(prdSingleTaskSchema),
	metadata: z.object({
		projectName: z.string(),
		totalTasks: z.number(),
		sourceFile: z.string(),
		generatedAt: z.string()
	})
});

type GeneratedTasks = z.infer<typeof prdResponseSchema>;

interface AITaskGenerationResponse {
	mainResult: GeneratedTasks | null;
	telemetryData: any; // Define a more specific type if possible
}

interface ParsePRDOptions {
	force?: boolean;
	append?: boolean;
	research?: boolean;
	reportProgress?: Function;
	mcpLog?: any;
	session?: any;
	projectRoot?: string;
}

/**
 * Parse a PRD file and generate tasks
 * @param {string} prdPath - Path to the PRD file
 * @param {string} tasksPath - Path to the tasks.json file
 * @param {number} numTasks - Number of tasks to generate
 * @param {ParsePRDOptions} options - Additional options
 * @param {string} [outputFormat='text'] - Output format ('text' or 'json').
 */
async function parsePRD(
	prdPath: string,
	tasksPath: string,
	numTasks: number,
	options: ParsePRDOptions = {}
) {
	const {
		reportProgress,
		mcpLog,
		session,
		projectRoot,
		force = false,
		append = false,
		research = false
	} = options;
	const isMCP = !!mcpLog;
	const outputFormat = isMCP ? 'json' : 'text';

	const logFn = mcpLog
		? mcpLog
		: {
				// Wrapper for CLI
				info: (...args) => log('info', ...args),
				warn: (...args) => log('warn', ...args),
				error: (...args) => log('error', ...args),
				debug: (...args) => log('debug', ...args),
				success: (...args) => log('success', ...args)
			};

	// Create custom reporter using logFn
	const report = (
		message: string,
		level: 'info' | 'warn' | 'error' | 'debug' | 'success' = 'info'
	) => {
		// Check logFn directly
		if (logFn && typeof logFn[level] === 'function') {
			logFn[level](message);
		} else if (!isSilentMode() && outputFormat === 'text') {
			// Fallback to original log only if necessary and in CLI text mode
			log(level, message);
		}
	};

	report(
		`Parsing PRD file: ${prdPath}, Force: ${force}, Append: ${append}, Research: ${research}`
	);

	let existingTasks: Task[] = [];
	let nextId = 1;
	let aiServiceResponse: AITaskGenerationResponse | null = null;

	try {
		// Handle file existence and overwrite/append logic
		if (fs.existsSync(tasksPath)) {
			if (append) {
				report(
					`Append mode enabled. Reading existing tasks from ${tasksPath}`,
					'info'
				);
				const existingData = readJSON(tasksPath) as TasksData; // Use readJSON utility
				if (existingData && Array.isArray(existingData.tasks)) {
					existingTasks = existingData.tasks;
					if (existingTasks.length > 0) {
						nextId = Math.max(...existingTasks.map((t) => t.id || 0)) + 1;
						report(
							`Found ${existingTasks.length} existing tasks. Next ID will be ${nextId}.`,
							'info'
						);
					}
				} else {
					report(
						`Could not read existing tasks from ${tasksPath} or format is invalid. Proceeding without appending.`,
						'warn'
					);
					existingTasks = []; // Reset if read fails
				}
			} else if (!force) {
				// Not appending and not forcing overwrite
				const overwriteError = new Error(
					`Output file ${tasksPath} already exists. Use --force to overwrite or --append.`
				);
				report(overwriteError.message, 'error');
				if (outputFormat === 'text') {
					console.error(chalk.red(overwriteError.message));
					process.exit(1);
				} else {
					throw overwriteError;
				}
			} else {
				// Force overwrite is true
				report(
					`Force flag enabled. Overwriting existing file: ${tasksPath}`,
					'info'
				);
			}
		}

		report(`Reading PRD content from ${prdPath}`, 'info');
		const prdContent = fs.readFileSync(prdPath, 'utf8');
		if (!prdContent) {
			throw new Error(`Input file ${prdPath} is empty or could not be read.`);
		}

		// Research-specific enhancements to the system prompt
		const researchPromptAddition = research
			? `\nBefore breaking down the PRD into tasks, you will:
1. Research and analyze the latest technologies, libraries, frameworks, and best practices that would be appropriate for this project
2. Identify any potential technical challenges, security concerns, or scalability issues not explicitly mentioned in the PRD without discarding any explicit requirements or going overboard with complexity -- always aim to provide the most direct path to implementation, avoiding over-engineering or roundabout approaches
3. Consider current industry standards and evolving trends relevant to this project (this step aims to solve LLM hallucinations and out of date information due to training data cutoff dates)
4. Evaluate alternative implementation approaches and recommend the most efficient path
5. Include specific library versions, helpful APIs, and concrete implementation guidance based on your research
6. Always aim to provide the most direct path to implementation, avoiding over-engineering or roundabout approaches

Your task breakdown should incorporate this research, resulting in more detailed implementation guidance, more accurate dependency mapping, and more precise technology recommendations than would be possible from the PRD text alone, while maintaining all explicit requirements and best practices and all details and nuances of the PRD.`
			: '';

		// Base system prompt for PRD parsing
		const systemPrompt = `You are an AI assistant specialized in analyzing Product Requirements Documents (PRDs) and generating a structured, logically ordered, dependency-aware and sequenced list of development tasks in JSON format.${researchPromptAddition}

Analyze the provided PRD content and generate approximately ${numTasks} top-level development tasks. If the complexity or the level of detail of the PRD is high, generate more tasks relative to the complexity of the PRD
Each task should represent a logical unit of work needed to implement the requirements and focus on the most direct and effective way to implement the requirements without unnecessary complexity or overengineering. Include pseudo-code, implementation details, and test strategy for each task. Find the most up to date information to implement each task.
Assign sequential IDs starting from ${nextId}. Infer title, description, details, and test strategy for each task based *only* on the PRD content.
Set status to 'pending', dependencies to an empty array [], and priority to 'medium' initially for all tasks.
Respond ONLY with a valid JSON object containing a single key "tasks", where the value is an array of task objects adhering to the provided Zod schema. Do not include any explanation or markdown formatting.

Each task should follow this JSON structure:
{
	"id": number,
	"title": string,
	"description": string,
	"status": "pending",
	"dependencies": number[] (IDs of tasks this depends on),
	"priority": "high" | "medium" | "low",
	"details": string (implementation details),
	"testStrategy": string (validation approach)
}

Guidelines:
1. Unless complexity warrants otherwise, create exactly ${numTasks} tasks, numbered sequentially starting from ${nextId}
2. Each task should be atomic and focused on a single responsibility following the most up to date best practices and standards
3. Order tasks logically - consider dependencies and implementation sequence
4. Early tasks should focus on setup, core functionality first, then advanced features
5. Include clear validation/testing approach for each task
6. Set appropriate dependency IDs (a task can only depend on tasks with lower IDs, potentially including existing tasks with IDs less than ${nextId} if applicable)
7. Assign priority (high/medium/low) based on criticality and dependency order
8. Include detailed implementation guidance in the "details" field${research ? ', with specific libraries and version recommendations based on your research' : ''}
9. If the PRD contains specific requirements for libraries, database schemas, frameworks, tech stacks, or any other implementation details, STRICTLY ADHERE to these requirements in your task breakdown and do not discard them under any circumstance
10. Focus on filling in any gaps left by the PRD or areas that aren't fully specified, while preserving all explicit requirements
11. Always aim to provide the most direct path to implementation, avoiding over-engineering or roundabout approaches${research ? '\n12. For each task, include specific, actionable guidance based on current industry standards and best practices discovered through research' : ''}`;

		// Build user prompt with PRD content
		const userPrompt = `Here's the Product Requirements Document (PRD) to break down into approximately ${numTasks} tasks, starting IDs from ${nextId}:${research ? '\n\nRemember to thoroughly research current best practices and technologies before task breakdown to provide specific, actionable implementation details.' : ''}\n\n${prdContent}\n\n

		Return your response in this format:
{
    "tasks": [
        {
            "id": 1,
            "title": "Setup Project Repository",
            "description": "...",
            ...
        },
        ...
    ],
    "metadata": {
        "projectName": "PRD Implementation",
        "totalTasks": ${numTasks},
        "sourceFile": "${prdPath}",
        "generatedAt": "YYYY-MM-DD"
    }
}`;

		// Call the unified AI service
		report(
			`Calling AI service to generate tasks from PRD${research ? ' with research-backed analysis' : ''}...`,
			'info'
		);

		// Call generateObjectService with the CORRECT schema and additional telemetry params
		let aiServiceResponse: any = null;
		aiServiceResponse = await generateObjectService({
			role: research ? 'research' : 'main', // Use research role if flag is set
			session: session,
			projectRoot: projectRoot,
			schema: prdResponseSchema,
			objectName: 'tasks_data',
			systemPrompt: systemPrompt,
			prompt: userPrompt,
			commandName: 'parse-prd',
			outputType: isMCP ? 'mcp' : 'cli'
		});

		// Create the directory if it doesn't exist
		const tasksDir = path.dirname(tasksPath);
		if (!fs.existsSync(tasksDir)) {
			fs.mkdirSync(tasksDir, { recursive: true });
		}
		logFn.success(
			`Successfully parsed PRD via AI service${research ? ' with research-backed analysis' : ''}.`
		);

		let generatedData: GeneratedTasks | null = null;

		if (aiServiceResponse?.mainResult) {
			// Check if the mainResult has the tasks property directly
			if (
				typeof aiServiceResponse.mainResult === 'object' &&
				aiServiceResponse.mainResult !== null &&
				'tasks' in aiServiceResponse.mainResult
			) {
				generatedData = aiServiceResponse.mainResult;
			}
			// This handles a nested object structure which might occur.
			else if (
				typeof (aiServiceResponse.mainResult as any).object === 'object' &&
				(aiServiceResponse.mainResult as any).object !== null &&
				'tasks' in (aiServiceResponse.mainResult as any).object
			) {
				generatedData = (aiServiceResponse.mainResult as any).object;
			}
		}

		if (!generatedData || !Array.isArray(generatedData.tasks)) {
			throw new Error(
				'AI service did not return a valid "tasks" array. Please check the AI response.'
			);
		}

		report(
			`Successfully received and parsed ${generatedData.tasks.length} tasks from AI.`,
			'info'
		);

		// Process and validate new tasks, ensuring they have the correct nextId
		const processedNewTasks: Task[] = generatedData.tasks.map(
			(task: any, index) => {
				const newId = nextId + index;

				// Validate dependencies: ensure they refer to existing or newly created tasks
				const validDependencies = (task.dependencies || []).filter((depId) => {
					// Check against existing tasks
					const existsInOld = existingTasks.some((t) => t.id === depId);
					// Check against other new tasks (must have a lower ID)
					const existsInNew = depId >= nextId && depId < newId;

					if (!existsInOld && !existsInNew) {
						report(
							`Task "${task.title}" has an invalid dependency: ID ${depId} does not exist. Removing.`,
							'warn'
						);
						return false;
					}
					return true;
				});

				return {
					...task,
					id: newId,
					status: 'pending', // Explicitly set status
					dependencies: validDependencies,
					subtasks: [] // Initialize with empty subtasks array
				};
			}
		);

		const finalTasks = append
			? [...existingTasks, ...processedNewTasks]
			: processedNewTasks;
		const finalData = { tasks: finalTasks };

		writeJSON(tasksPath, finalData);
		report(
			`Successfully saved ${processedNewTasks.length} new tasks to ${tasksPath}`,
			'success'
		);

		await generateTaskFiles(tasksPath, path.dirname(tasksPath));

		if (outputFormat === 'text' && !isSilentMode()) {
			console.log(
				boxen(
					chalk.green(
						`✅ Success! Generated ${processedNewTasks.length} tasks from ${path.basename(
							prdPath
						)}.\n\nRun ${chalk.cyan(
							`vibex-task-manager list`
						)} to see the new tasks.`
					),
					{ padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' }
				)
			);
		}
		if (aiServiceResponse && aiServiceResponse.telemetryData) {
			displayAiUsageSummary(aiServiceResponse.telemetryData, 'cli');
		}

		return {
			success: true,
			message: `Generated ${processedNewTasks.length} tasks.`,
			tasksPath,
			telemetryData: aiServiceResponse?.telemetryData
		};
	} catch (error: any) {
		report(`Error parsing PRD: ${error.message}`, 'error');
		if (outputFormat === 'text' && !isSilentMode()) {
			console.error(chalk.red(`Error: ${error.message}`));
		}
		// Re-throw for MCP or return error object
		if (isMCP) {
			throw error;
		} else {
			process.exit(1);
		}
	} finally {
		// Ensure silent mode is disabled
		disableSilentMode();
	}
}

export default parsePRD;
