/**
 * Task Manager
 * Copyright (c) 2025 Vibex Task Manager Contributors
 *
 * This software is licensed under the MIT License.
 *
 * 1. You may not sell this software or offer it as a service.
 * 2. The origin of this software must not be misrepresented.
 * 3. Altered source versions must be plainly marked as such.
 *
 * For the full license text, see the LICENSE file in the root directory.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { isSilentMode } from './modules/utils.js';
import { execSync } from 'child_process';
import {
	EXAMPLE_PRD_FILE,
	TASKMANAGER_CONFIG_FILE,
	TASKMANAGER_TEMPLATES_DIR,
	TASKMANAGER_DIR,
	TASKMANAGER_TASKS_DIR,
	TASKMANAGER_DOCS_DIR,
	TASKMANAGER_REPORTS_DIR,
	ENV_EXAMPLE_FILE,
	GITIGNORE_FILE
} from '../src/constants/paths.js';

// Type definitions
interface LogLevels {
	debug: number;
	info: number;
	warn: number;
	error: number;
	success: number;
}

interface InitOptions {
	name?: string;
	description?: string;
	version?: string;
	author?: string;
	dryRun?: boolean;
	aliases?: boolean;
	yes?: boolean;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log levels
const LOG_LEVELS: LogLevels = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	success: 4
};

// Determine log level from environment variable or default to 'info'
const LOG_LEVEL = process.env.TASKMANAGER_LOG_LEVEL
	? LOG_LEVELS[process.env.TASKMANAGER_LOG_LEVEL.toLowerCase() as keyof LogLevels]
	: LOG_LEVELS.info; // Default to info

// Create a color gradient for the banner
const coolGradient = gradient(['#00b4d8', '#0077b6', '#03045e']);
const warmGradient = gradient(['#fb8b24', '#e36414', '#9a031e']);

// Display a fancy banner
function displayBanner(): void {
	if (isSilentMode()) return;

	console.clear();
	const bannerText = figlet.textSync('Task Manager AI', {
		font: 'Standard',
		horizontalLayout: 'default',
		verticalLayout: 'default'
	});

	console.log(coolGradient(bannerText));

	// Add creator credit line below the banner
	console.log(
		chalk.dim('Open Source Task Management')
	);

	console.log(
		boxen(chalk.white(`${chalk.bold('Initializing')} your new project`), {
			padding: 1,
			margin: { top: 0, bottom: 1 },
			borderStyle: 'round',
			borderColor: 'cyan'
		})
	);
}

// Logging function with icons and colors
function log(level: LogLevel, ...args: any[]): void {
	const icons = {
		debug: chalk.gray('🔍'),
		info: chalk.blue('ℹ️'),
		warn: chalk.yellow('⚠️'),
		error: chalk.red('❌'),
		success: chalk.green('✅')
	};

	if (LOG_LEVELS[level] >= LOG_LEVEL) {
		const icon = icons[level] || '';

		// Only output to console if not in silent mode
		if (!isSilentMode()) {
			if (level === 'error') {
				console.error(icon, chalk.red(...args));
			} else if (level === 'warn') {
				console.warn(icon, chalk.yellow(...args));
			} else if (level === 'success') {
				console.log(icon, chalk.green(...args));
			} else if (level === 'info') {
				console.log(icon, chalk.blue(...args));
			} else {
				console.log(icon, ...args);
			}
		}
	}

	// Write to debug log if DEBUG=true
	if (process.env.DEBUG === 'true') {
		const logMessage = `[${level.toUpperCase()}] ${args.join(' ')}\n`;
		fs.appendFileSync('init-debug.log', logMessage);
	}
}

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		log('info', `Created directory: ${dirPath}`);
	}
}

// Function to add shell aliases to the user's shell configuration
function addShellAliases(): boolean {
	const homeDir = process.env.HOME || process.env.USERPROFILE;
	let shellConfigFile;

	// Determine which shell config file to use
	if (process.env.SHELL?.includes('zsh')) {
		shellConfigFile = path.join(homeDir, '.zshrc');
	} else if (process.env.SHELL?.includes('bash')) {
		shellConfigFile = path.join(homeDir, '.bashrc');
	} else {
		log('warn', 'Could not determine shell type. Aliases not added.');
		return false;
	}

	try {
		// Check if file exists
		if (!fs.existsSync(shellConfigFile)) {
			log(
				'warn',
				`Shell config file ${shellConfigFile} not found. Aliases not added.`
			);
			return false;
		}

		// Check if aliases already exist
		const configContent = fs.readFileSync(shellConfigFile, 'utf8');
		if (configContent.includes("alias tm='vibex-task-manager'")) {
			log('info', 'Task Manager aliases already exist in shell config.');
			return true;
		}

		// Add aliases to the shell config file
		const aliasBlock = `
# Task Manager aliases added on ${new Date().toLocaleDateString()}
alias tm='vibex-task-manager'
alias taskmanager='vibex-task-manager'
`;

		fs.appendFileSync(shellConfigFile, aliasBlock);
		log('success', `Added Task Manager aliases to ${shellConfigFile}`);
		log(
			'info',
			`To use the aliases in your current terminal, run: source ${shellConfigFile}`
		);

		return true;
	} catch (error) {
		log('error', `Failed to add aliases: ${error.message}`);
		return false;
	}
}

// Function to copy a file from the package to the target directory
function copyTemplateFile(templateName: string, targetPath: string, replacements: Record<string, any> = {}): void {
	// Get the file content from the appropriate source directory
	let sourcePath;

	// Map template names to their actual source paths
	switch (templateName) {
		// case 'scripts_README.md':
		// 	sourcePath = path.join(__dirname, '..', 'assets', 'scripts_README.md');
		// 	break;
		case 'dev_workflow.mdc':
			sourcePath = path.join(
				__dirname,
				'..',
				'.cursor',
				'rules',
				'dev_workflow.mdc'
			);
			break;
		case 'taskmanager.mdc':
			sourcePath = path.join(
				__dirname,
				'..',
				'.cursor',
				'rules',
				'taskmanager.mdc'
			);
			break;
		case 'cursor_rules.mdc':
			sourcePath = path.join(
				__dirname,
				'..',
				'.cursor',
				'rules',
				'cursor_rules.mdc'
			);
			break;
		case 'self_improve.mdc':
			sourcePath = path.join(
				__dirname,
				'..',
				'.cursor',
				'rules',
				'self_improve.mdc'
			);
			break;
			// case 'README-vibex-task-manager.md':
			// 	sourcePath = path.join(__dirname, '..', 'README-vibex-task-manager.md');
			break;
		case 'windsurfrules':
			sourcePath = path.join(__dirname, '..', 'assets', '.windsurfrules');
			break;
		default:
			// For other files like env.example, gitignore, etc. that don't have direct equivalents
			sourcePath = path.join(__dirname, '..', 'assets', templateName);
	}

	// Check if the source file exists
	if (!fs.existsSync(sourcePath)) {
		// Fall back to templates directory for files that might not have been moved yet
		sourcePath = path.join(__dirname, '..', 'assets', templateName);
		if (!fs.existsSync(sourcePath)) {
			log('error', `Source file not found: ${sourcePath}`);
			return;
		}
	}

	let content = fs.readFileSync(sourcePath, 'utf8');

	// Replace placeholders with actual values
	Object.entries(replacements).forEach(([key, value]) => {
		const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
		content = content.replace(regex, value);
	});

	// Handle special files that should be merged instead of overwritten
	if (fs.existsSync(targetPath)) {
		const filename = path.basename(targetPath);

		// Handle .gitignore - append lines that don't exist
		if (filename === '.gitignore') {
			log('info', `${targetPath} already exists, merging content...`);
			const existingContent = fs.readFileSync(targetPath, 'utf8');
			const existingLines = new Set(
				existingContent.split('\n').map((line) => line.trim())
			);
			const newLines = content
				.split('\n')
				.filter((line) => !existingLines.has(line.trim()));

			if (newLines.length > 0) {
				// Add a comment to separate the original content from our additions
				const updatedContent = `${existingContent.trim()}\n\n# Added by Task Manager AI\n${newLines.join('\n')}`;
				fs.writeFileSync(targetPath, updatedContent);
				log('success', `Updated ${targetPath} with additional entries`);
			} else {
				log('info', `No new content to add to ${targetPath}`);
			}
			return;
		}

		// Handle .windsurfrules - append the entire content
		if (filename === '.windsurfrules') {
			log(
				'info',
				`${targetPath} already exists, appending content instead of overwriting...`
			);
			const existingContent = fs.readFileSync(targetPath, 'utf8');

			// Add a separator comment before appending our content
			const updatedContent = `${existingContent.trim()}\n\n# Added by Task Manager - Development Workflow Rules\n\n${content}`;
			fs.writeFileSync(targetPath, updatedContent);
			log('success', `Updated ${targetPath} with additional rules`);
			return;
		}

		// Handle README.md - offer to preserve or create a different file
		if (filename === 'README-vibex-task-manager.md') {
			log('info', `${targetPath} already exists`);
			// Create a separate README file specifically for this project
			const taskMasterReadmePath = path.join(
				path.dirname(targetPath),
				'README-vibex-task-manager.md'
			);
			fs.writeFileSync(taskMasterReadmePath, content);
			log(
				'success',
				`Created ${taskMasterReadmePath} (preserved original README-vibex-task-manager.md)`
			);
			return;
		}

		// For other files, warn and prompt before overwriting
		log('warn', `${targetPath} already exists, skipping.`);
		return;
	}

	// If the file doesn't exist, create it normally
	fs.writeFileSync(targetPath, content);
	log('info', `Created file: ${targetPath}`);
}

// Main function to initialize a new project (No longer needs isInteractive logic)
async function initializeProject(options: InitOptions = {}): Promise<{ dryRun?: boolean } | void> {
	// Receives options as argument
	// Only display banner if not in silent mode
	if (!isSilentMode()) {
		displayBanner();
	}

	// Debug logging only if not in silent mode
	// if (!isSilentMode()) {
	// 	console.log('===== DEBUG: INITIALIZE PROJECT OPTIONS RECEIVED =====');
	// 	console.log('Full options object:', JSON.stringify(options));
	// 	console.log('options.yes:', options.yes);
	// 	console.log('==================================================');
	// }

	const skipPrompts = options.yes || (options.name && options.description);

	// if (!isSilentMode()) {
	// 	console.log('Skip prompts determined:', skipPrompts);
	// }

	if (skipPrompts) {
		if (!isSilentMode()) {
			console.log('SKIPPING PROMPTS - Using defaults or provided values');
		}

		// Use provided options or defaults
		const projectName = options.name || 'vibex-task-manager-project';
		const projectDescription =
			options.description || 'A project managed with Task Manager AI';
		const projectVersion = options.version || '0.1.0';
		const authorName = options.author || 'Vibe coder';
		const dryRun = options.dryRun || false;
		const addAliases = options.aliases || false;

		if (dryRun) {
			log('info', 'DRY RUN MODE: No files will be modified');
			log('info', 'Would initialize Task Manager project');
			log('info', 'Would create/update necessary project files');
			if (addAliases) {
				log('info', 'Would add shell aliases for vibex-task-manager');
			}
			return {
				dryRun: true
			};
		}

		createProjectStructure(addAliases, dryRun, options);
	} else {
		// Interactive logic
		log('info', 'Required options not provided, proceeding with prompts.');
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		try {
			// Only prompt for shell aliases
			const addAliasesInput = await promptQuestion(
				rl,
				chalk.cyan(
					'Add shell aliases for vibex-task-manager? This lets you type "tm" instead of "vibex-task-manager" (Y/n): '
				)
			);
			const addAliasesPrompted = addAliasesInput.trim().toLowerCase() !== 'n';

			// Confirm settings...
			console.log('\nTask Manager Project settings:');
			console.log(
				chalk.blue(
					'Add shell aliases (so you can use "tm" instead of "vibex-task-manager"):'
				),
				chalk.white(addAliasesPrompted ? 'Yes' : 'No')
			);

			const confirmInput = await promptQuestion(
				rl,
				chalk.yellow('\nDo you want to continue with these settings? (Y/n): ')
			);
			const shouldContinue = confirmInput.trim().toLowerCase() !== 'n';
			rl.close();

			if (!shouldContinue) {
				log('info', 'Project initialization cancelled by user');
				process.exit(0);
				return;
			}

			const dryRun = options.dryRun || false;

			if (dryRun) {
				log('info', 'DRY RUN MODE: No files will be modified');
				log('info', 'Would initialize Task Manager project');
				log('info', 'Would create/update necessary project files');
				if (addAliasesPrompted) {
					log('info', 'Would add shell aliases for vibex-task-manager');
				}
				return {
					dryRun: true
				};
			}

			// Create structure using only necessary values
			createProjectStructure(addAliasesPrompted, dryRun, options);
		} catch (error) {
			rl.close();
			log('error', `Error during initialization process: ${error.message}`);
			process.exit(1);
		}
	}
}

// Helper function to promisify readline question
function promptQuestion(rl: readline.Interface, question: string): Promise<string> {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

// Function to create the project structure
function createProjectStructure(addAliases: boolean, dryRun: boolean, options: InitOptions): void {
	const targetDir = process.cwd();
	log('info', `Initializing project in ${targetDir}`);


	// Create directories
	ensureDirectoryExists(path.join(targetDir, '.cursor/rules'));

	// Create NEW .taskmanager directory structure (using constants)
	ensureDirectoryExists(path.join(targetDir, TASKMANAGER_DIR));
	ensureDirectoryExists(path.join(targetDir, TASKMANAGER_TASKS_DIR));
	ensureDirectoryExists(path.join(targetDir, TASKMANAGER_DOCS_DIR));
	ensureDirectoryExists(path.join(targetDir, TASKMANAGER_REPORTS_DIR));
	ensureDirectoryExists(path.join(targetDir, TASKMANAGER_TEMPLATES_DIR));

	// Setup MCP configuration for integration with Cursor
	setupMCPConfiguration(targetDir);

	// Copy template files with replacements
	const replacements = {
		year: new Date().getFullYear()
	};

	// Copy .env.example
	copyTemplateFile(
		'env.example',
		path.join(targetDir, ENV_EXAMPLE_FILE),
		replacements
	);

	// Copy config.json with project name to NEW location
	copyTemplateFile(
		'config.json',
		path.join(targetDir, TASKMANAGER_CONFIG_FILE),
		{
			...replacements
		}
	);

	// Copy .gitignore
	copyTemplateFile('gitignore', path.join(targetDir, GITIGNORE_FILE));

	// Copy dev_workflow.mdc
	copyTemplateFile(
		'dev_workflow.mdc',
		path.join(targetDir, '.cursor/rules/dev_workflow.mdc')
	);

	// Copy taskmanager.mdc
	copyTemplateFile(
		'taskmanager.mdc',
		path.join(targetDir, '.cursor/rules/taskmanager.mdc')
	);

	// Copy cursor_rules.mdc
	copyTemplateFile(
		'cursor_rules.mdc',
		path.join(targetDir, '.cursor/rules/cursor_rules.mdc')
	);

	// Copy self_improve.mdc
	copyTemplateFile(
		'self_improve.mdc',
		path.join(targetDir, '.cursor/rules/self_improve.mdc')
	);

	// Generate Roo rules from Cursor rules
	log('info', 'Generating Roo rules from Cursor rules...');

	// Copy .windsurfrules
	copyTemplateFile('windsurfrules', path.join(targetDir, '.windsurfrules'));


	// Copy example_prd.txt to NEW location
	copyTemplateFile('example_prd.txt', path.join(targetDir, EXAMPLE_PRD_FILE));

	// Initialize git repository if git is available
	try {
		if (!fs.existsSync(path.join(targetDir, '.git'))) {
			log('info', 'Initializing git repository...');
			execSync('git init', { stdio: 'ignore' });
			log('success', 'Git repository initialized');
		}
	} catch (error) {
		log('warn', 'Git not available, skipping repository initialization');
	}

	// Run npm install automatically
	const npmInstallOptions = {
		cwd: targetDir,
		// Default to inherit for interactive CLI, change if silent
		stdio: 'inherit'
	};

	if (isSilentMode()) {
		// If silent (MCP mode), suppress npm install output
		npmInstallOptions.stdio = 'ignore';
		log('info', 'Running npm install silently...'); // Log our own message
	} else {
		// Interactive mode, show the boxen message
		console.log(
			boxen(chalk.cyan('Installing dependencies...'), {
				padding: 0.5,
				margin: 0.5,
				borderStyle: 'round',
				borderColor: 'blue'
			})
		);
	}

	// === Add Model Configuration Step ===
	if (!isSilentMode() && !dryRun && !options?.yes) {
		console.log(
			boxen(chalk.cyan('Configuring AI Models...'), {
				padding: 0.5,
				margin: { top: 1, bottom: 0.5 },
				borderStyle: 'round',
				borderColor: 'blue'
			})
		);
		log(
			'info',
			'Running interactive model setup. Please select your preferred AI models.'
		);
		try {
			execSync('npx vibex-task-manager models --setup', {
				stdio: 'inherit',
				cwd: targetDir
			});
			log('success', 'AI Models configured.');
		} catch (error) {
			log('error', 'Failed to configure AI models:', error.message);
			log(
				'warn',
				'You may need to run "vibex-task-manager models --setup" manually.'
			);
		}
	} else if (isSilentMode() && !dryRun) {
		log('info', 'Skipping interactive model setup in silent (MCP) mode.');
		log(
			'warn',
			'Please configure AI models using "vibex-task-manager models --set-..." or the "models" MCP tool.'
		);
	} else if (dryRun) {
		log('info', 'DRY RUN: Skipping interactive model setup.');
	} else if (options?.yes) {
		log('info', 'Skipping interactive model setup due to --yes flag.');
		log(
			'info',
			'Default AI models will be used. You can configure different models later using "vibex-task-manager models --setup" or "vibex-task-manager models --set-..." commands.'
		);
	}
	// ====================================

	// Display success message
	if (!isSilentMode()) {
		console.log(
			boxen(
				`${warmGradient.multiline(
					figlet.textSync('Success!', { font: 'Standard' })
				)}\n${chalk.green('Project initialized successfully!')}`,
				{
					padding: 1,
					margin: 1,
					borderStyle: 'double',
					borderColor: 'green'
				}
			)
		);
	}

	// Display next steps in a nice box
	if (!isSilentMode()) {
		console.log(
			boxen(
				`${chalk.cyan.bold('Things you should do next:')}\n\n${chalk.white('1. ')}${chalk.yellow(
					'Configure AI models (if needed) and add API keys to `.env`'
				)}\n${chalk.white('   ├─ ')}${chalk.dim('Models: Use `vibex-task-manager models` commands')}\n${chalk.white('   └─ ')}${chalk.dim(
					'Keys: Add provider API keys to .env (or inside the MCP config file i.e. .cursor/mcp.json)'
				)}\n${chalk.white('2. ')}${chalk.yellow(
					'Discuss your idea with AI and ask for a PRD using example_prd.txt, and save it to scripts/PRD.txt'
				)}\n${chalk.white('3. ')}${chalk.yellow(
					'Ask Cursor Agent (or run CLI) to parse your PRD and generate initial tasks:'
				)}\n${chalk.white('   └─ ')}${chalk.dim('MCP Tool: ')}${chalk.cyan('parse_prd')}${chalk.dim(' | CLI: ')}${chalk.cyan('vibex-task-manager parse-prd scripts/prd.txt')}\n${chalk.white('4. ')}${chalk.yellow(
					'Ask Cursor to analyze the complexity of the tasks in your PRD using research'
				)}\n${chalk.white('   └─ ')}${chalk.dim('MCP Tool: ')}${chalk.cyan('analyze_project_complexity')}${chalk.dim(' | CLI: ')}${chalk.cyan('vibex-task-manager analyze-complexity')}\n${chalk.white('5. ')}${chalk.yellow(
					'Ask Cursor to expand all of your tasks using the complexity analysis'
				)}\n${chalk.white('6. ')}${chalk.yellow('Ask Cursor to begin working on the next task')}\n${chalk.white('7. ')}${chalk.yellow(
					'Add new tasks anytime using the add-task command or MCP tool'
				)}\n${chalk.white('8. ')}${chalk.yellow(
					'Ask Cursor to set the status of one or many tasks/subtasks at a time. Use the task id from the task lists.'
				)}\n${chalk.white('9. ')}${chalk.yellow(
					'Ask Cursor to update all tasks from a specific task id based on new learnings or pivots in your project.'
				)}\n${chalk.white('10. ')}${chalk.green.bold('Ship it!')}\n\n${chalk.dim(
					'* Review the README.md file to learn how to use other commands via Cursor Agent.'
				)}\n${chalk.dim(
					'* Use the vibex-task-manager command without arguments to see all available commands.'
				)}`,
				{
					padding: 1,
					margin: 1,
					borderStyle: 'round',
					borderColor: 'yellow',
					title: 'Getting Started',
					titleAlignment: 'center'
				}
			)
		);
	}
}

// Function to setup MCP configuration for Cursor integration
function setupMCPConfiguration(targetDir: string): void {
	const mcpDirPath = path.join(targetDir, '.cursor');
	const mcpJsonPath = path.join(mcpDirPath, 'mcp.json');

	log('info', 'Setting up MCP configuration for Cursor integration...');

	// Create .cursor directory if it doesn't exist
	ensureDirectoryExists(mcpDirPath);

	// New MCP config to be added - references the installed package
	const newMCPServer = {
		'vibex-task-manager-ai': {
			command: 'npx',
			args: ['-y', '--package=vibex-task-manager-ai', 'vibex-task-manager-ai'],
			env: {
				ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY_HERE',
				PERPLEXITY_API_KEY: 'PERPLEXITY_API_KEY_HERE',
				OPENAI_API_KEY: 'OPENAI_API_KEY_HERE',
				GOOGLE_API_KEY: 'GOOGLE_API_KEY_HERE',
				XAI_API_KEY: 'XAI_API_KEY_HERE',
				OPENROUTER_API_KEY: 'OPENROUTER_API_KEY_HERE',
				MISTRAL_API_KEY: 'MISTRAL_API_KEY_HERE',
				AZURE_OPENAI_API_KEY: 'AZURE_OPENAI_API_KEY_HERE',
				OLLAMA_API_KEY: 'OLLAMA_API_KEY_HERE'
			}
		}
	};

	// Check if mcp.json already existsimage.png
	if (fs.existsSync(mcpJsonPath)) {
		log(
			'info',
			'MCP configuration file already exists, checking for existing vibex-task-manager-mcp...'
		);
		try {
			// Read existing config
			const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));

			// Initialize mcpServers if it doesn't exist
			if (!mcpConfig.mcpServers) {
				mcpConfig.mcpServers = {};
			}

			// Check if any existing server configuration already has vibex-task-manager-mcp in its args
			const hasMCPString = Object.values(mcpConfig.mcpServers).some(
				(server: any) =>
					server.args &&
					server.args.some(
						(arg: any) =>
							typeof arg === 'string' && arg.includes('vibex-task-manager-ai')
					)
			);

			if (hasMCPString) {
				log(
					'info',
					'Found existing vibex-task-manager-ai MCP configuration in mcp.json, leaving untouched'
				);
				return; // Exit early, don't modify the existing configuration
			}

			// Add the vibex-task-manager-ai server if it doesn't exist
			if (!mcpConfig.mcpServers['vibex-task-manager-ai']) {
				mcpConfig.mcpServers['vibex-task-manager-ai'] =
					newMCPServer['vibex-task-manager-ai'];
				log(
					'info',
					'Added vibex-task-manager-ai server to existing MCP configuration'
				);
			} else {
				log(
					'info',
					'vibex-task-manager-ai server already configured in mcp.json'
				);
			}

			// Write the updated configuration
			fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 4));
			log('success', 'Updated MCP configuration file');
		} catch (error) {
			log('error', `Failed to update MCP configuration: ${error.message}`);
			// Create a backup before potentially modifying
			const backupPath = `${mcpJsonPath}.backup-${Date.now()}`;
			if (fs.existsSync(mcpJsonPath)) {
				fs.copyFileSync(mcpJsonPath, backupPath);
				log('info', `Created backup of existing mcp.json at ${backupPath}`);
			}

			// Create new configuration
			const newMCPConfig = {
				mcpServers: newMCPServer
			};

			fs.writeFileSync(mcpJsonPath, JSON.stringify(newMCPConfig, null, 4));
			log(
				'warn',
				'Created new MCP configuration file (backup of original file was created if it existed)'
			);
		}
	} else {
		// If mcp.json doesn't exist, create it
		const newMCPConfig = {
			mcpServers: newMCPServer
		};

		fs.writeFileSync(mcpJsonPath, JSON.stringify(newMCPConfig, null, 4));
		log('success', 'Created MCP configuration file for Cursor integration');
	}

	// Add note to console about MCP integration
	log(
		'info',
		'MCP server will use the installed vibex-task-manager-ai package'
	);
}

// Ensure necessary functions are exported
export { initializeProject, log }; // Only export what's needed by commands.js
