#!/usr/bin/env node

/**
 * Vibex Task Manager
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

/**
 * Vibex Task Manager
 * A task management system for AI-driven development using AWS Bedrock
 */

// This file serves as the main entry point for the package
// The primary functionality is provided through the CLI commands

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';
import { spawn, ChildProcess } from 'child_process';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Get package information
const packageJson = require('./package.json');

interface InitOptions {
	yes?: boolean;
	name?: string;
	description?: string;
	version?: string;
	author?: string;
	skipInstall?: boolean;
	dryRun?: boolean;
	aliases?: boolean;
}

// Export the path to the dev.js script for programmatic usage
export const devScriptPath = resolve(__dirname, './scripts/dev.js');

// Export a function to initialize a new project programmatically
export const initProject = async (options: InitOptions = {}): Promise<any> => {
	const init = await import('./scripts/init.js');
	return init.initializeProject(options);
};

// Export a function to run init as a CLI command
export const runInitCLI = async (options: InitOptions = {}): Promise<any> => {
	try {
		const init = await import('./scripts/init.js');
		const result = await init.initializeProject(options);
		return result;
	} catch (error) {
		console.error('Initialization failed:', (error as Error).message);
		if (process.env.DEBUG === 'true') {
			console.error('Debug stack trace:', (error as Error).stack);
		}
		throw error; // Re-throw to be handled by the command handler
	}
};

// Export version information
export const version: string = packageJson.version;

// CLI implementation
if (import.meta.url === `file://${process.argv[1]}`) {
	const program = new Command();

	program
		.name('vibex-task-manager')
		.description('Vibex Task Manager CLI')
		.version(version);

	program
		.command('init')
		.description('Initialize a new project')
		.option('-y, --yes', 'Skip prompts and use default values')
		.option('-n, --name <n>', 'Project name')
		.option('-d, --description <description>', 'Project description')
		.option('-v, --version <version>', 'Project version', '0.1.0')
		.option('-a, --author <author>', 'Author name')
		.option('--skip-install', 'Skip installing dependencies')
		.option('--dry-run', 'Show what would be done without making changes')
		.option('--aliases', 'Add shell aliases (tm, taskmaster)')
		.action(async (cmdOptions: InitOptions) => {
			try {
				await runInitCLI(cmdOptions);
			} catch (err) {
				console.error('Init failed:', (err as Error).message);
				process.exit(1);
			}
		});

	program
		.command('dev')
		.description('Run the dev.js script')
		.allowUnknownOption(true)
		.action(() => {
			const args = process.argv.slice(process.argv.indexOf('dev') + 1);
			const child: ChildProcess = spawn('node', [devScriptPath, ...args], {
				stdio: 'inherit',
				cwd: process.cwd()
			});

			child.on('close', (code: number | null) => {
				process.exit(code || 0);
			});
		});

	// Add shortcuts for common dev.js commands
	program
		.command('list')
		.description('List all tasks')
		.action(() => {
			const child: ChildProcess = spawn('node', [devScriptPath, 'list'], {
				stdio: 'inherit',
				cwd: process.cwd()
			});

			child.on('close', (code: number | null) => {
				process.exit(code || 0);
			});
		});

	program
		.command('next')
		.description('Show the next task to work on')
		.action(() => {
			const child: ChildProcess = spawn('node', [devScriptPath, 'next'], {
				stdio: 'inherit',
				cwd: process.cwd()
			});

			child.on('close', (code: number | null) => {
				process.exit(code || 0);
			});
		});

	program
		.command('generate')
		.description('Generate task files')
		.action(() => {
			const child: ChildProcess = spawn('node', [devScriptPath, 'generate'], {
				stdio: 'inherit',
				cwd: process.cwd()
			});

			child.on('close', (code: number | null) => {
				process.exit(code || 0);
			});
		});

	program.parse(process.argv);
}
