#!/usr/bin/env node
/**
 * Vibex Task Manager CLI - TypeScript with AWS Bedrock Integration
 * Main CLI entry point with comprehensive error handling
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { TaskService } from '../services/task-service.js';
import { ConfigService } from '../services/config-service.js';
import BedrockClient from '../core/bedrock-client.js';
import BedrockAutoDetect from '../core/bedrock-auto-detect.js';
import {
  Task,
  TaskStatus,
  Priority,
  Config,
  TaskNotFoundError,
  CircularDependencyError,
  ConfigurationError,
  AIServiceError,
} from '../types/core.js';

// Version from package.json
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const VERSION = packageJson.version || '1.0.0';

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message);
  if (process.env.DEBUG === '1') {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

class VibexCLI {
  private program: Command;
  private taskService: TaskService | null = null;
  private configService: ConfigService | null = null;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.program = new Command();
    this.setupCommands();
  }

  private async initializeServices(): Promise<void> {
    if (!this.configService) {
      this.configService = new ConfigService(this.projectRoot);
    }
    
    if (!this.taskService) {
      this.taskService = new TaskService(this.projectRoot, this.configService);
    }
  }

  private setupCommands(): void {
    this.program
      .name('vibex-task-manager')
      .description('AI-powered task management with AWS Bedrock integration')
      .version(VERSION);

    // Global options
    this.program
      .option('--debug', 'Enable debug output')
      .option('--project-root <path>', 'Project root directory', process.cwd())
      .hook('preAction', (thisCommand, actionCommand) => {
        if (thisCommand.opts().debug) {
          process.env.DEBUG = '1';
        }
        if (thisCommand.opts().projectRoot) {
          this.projectRoot = path.resolve(thisCommand.opts().projectRoot);
        }
      });

    // Setup commands
    this.setupInitCommands();
    this.setupConfigCommands();
    this.setupTaskCommands();
    this.setupAnalysisCommands();
    this.setupDependencyCommands();
    this.setupUtilityCommands();
  }

  private setupInitCommands(): void {
    this.program
      .command('init')
      .description('Initialize a new Vibex Task Manager project')
      .option('-n, --name <name>', 'Project name')
      .option('-d, --description <description>', 'Project description')
      .option('--skip-setup', 'Skip interactive model setup')
      .action(async (options) => {
        try {
          await this.handleInit(options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private setupConfigCommands(): void {
    const configCmd = this.program
      .command('config')
      .description('Manage configuration');

    configCmd
      .command('show')
      .description('Show current configuration')
      .option('--summary', 'Show summary only')
      .action(async (options) => {
        try {
          await this.handleConfigShow(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('setup')
      .description('Interactive configuration setup')
      .option('--main-model <model>', 'Main Claude model ID')
      .option('--research-model <model>', 'Research Claude model ID')
      .option('--fallback-model <model>', 'Fallback Claude model ID')
      .option('--region <region>', 'AWS region', 'us-east-1')
      .option('--profile <profile>', 'AWS profile')
      .action(async (options) => {
        try {
          await this.handleConfigSetup(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('test')
      .description('Test AWS Bedrock connection')
      .option('--model <type>', 'Model type to test (main|research|fallback)', 'main')
      .action(async (options) => {
        try {
          await this.handleConfigTest(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('models')
      .description('List available Claude models')
      .action(async () => {
        try {
          await this.handleConfigModels();
        } catch (error) {
          this.handleError(error);
        }
      });

    configCmd
      .command('detect')
      .description('Auto-detect available AWS Bedrock models')
      .option('--region <region>', 'AWS region to check', 'us-east-1')
      .option('--profile <profile>', 'AWS profile to use')
      .action(async (options) => {
        try {
          await this.handleConfigDetect(options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private setupTaskCommands(): void {
    // List tasks
    this.program
      .command('list')
      .alias('ls')
      .description('List tasks')
      .option('-s, --status <status>', 'Filter by status')
      .option('-p, --priority <priority>', 'Filter by priority')
      .option('--search <term>', 'Search tasks')
      .option('--format <format>', 'Output format (table|json|markdown)', 'table')
      .option('--limit <number>', 'Limit number of results', parseInt)
      .action(async (options) => {
        try {
          await this.handleList(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Show task
    this.program
      .command('show <id>')
      .description('Show task details')
      .option('--format <format>', 'Output format (table|json|markdown)', 'table')
      .action(async (id, options) => {
        try {
          await this.handleShow(parseInt(id), options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Add task
    this.program
      .command('add')
      .description('Add a new task')
      .option('-t, --title <title>', 'Task title')
      .option('-d, --description <description>', 'Task description')
      .option('-p, --priority <priority>', 'Task priority (low|medium|high)', 'medium')
      .option('--depends-on <ids>', 'Comma-separated dependency IDs')
      .option('--ai-prompt <prompt>', 'Use AI to generate task from prompt')
      .option('--expand', 'Auto-expand into subtasks')
      .action(async (options) => {
        try {
          await this.handleAdd(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Update task
    this.program
      .command('update <id>')
      .description('Update a task')
      .option('-t, --title <title>', 'New title')
      .option('-d, --description <description>', 'New description')
      .option('-s, --status <status>', 'New status')
      .option('-p, --priority <priority>', 'New priority')
      .option('--details <details>', 'Additional details')
      .action(async (id, options) => {
        try {
          await this.handleUpdate(parseInt(id), options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Remove task
    this.program
      .command('remove <id>')
      .alias('rm')
      .description('Remove a task')
      .option('-f, --force', 'Skip confirmation')
      .action(async (id, options) => {
        try {
          await this.handleRemove(parseInt(id), options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Set status
    this.program
      .command('status <id> <status>')
      .description('Update task status')
      .action(async (id, status, options) => {
        try {
          await this.handleSetStatus(parseInt(id), status as TaskStatus);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private setupAnalysisCommands(): void {
    // Analyze complexity
    this.program
      .command('analyze <id>')
      .description('Analyze task complexity')
      .option('--format <format>', 'Output format (table|json|markdown)', 'table')
      .action(async (id, options) => {
        try {
          await this.handleAnalyze(parseInt(id), options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Expand task
    this.program
      .command('expand <id>')
      .description('Expand task into subtasks')
      .option('-n, --num-subtasks <number>', 'Number of subtasks to generate', parseInt, 5)
      .option('--detail-level <level>', 'Detail level (basic|detailed|comprehensive)', 'detailed')
      .action(async (id, options) => {
        try {
          await this.handleExpand(parseInt(id), options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Next task
    this.program
      .command('next')
      .description('Get next recommended task')
      .option('--include-in-progress', 'Include in-progress tasks')
      .option('--max-complexity <number>', 'Maximum complexity threshold', parseInt)
      .action(async (options) => {
        try {
          await this.handleNext(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Parse PRD
    this.program
      .command('parse-prd <file>')
      .description('Parse Product Requirements Document')
      .option('--format <format>', 'Output format (table|json|markdown)', 'table')
      .action(async (file, options) => {
        try {
          await this.handleParsePRD(file, options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private setupDependencyCommands(): void {
    const depsCmd = this.program
      .command('deps')
      .description('Manage task dependencies');

    depsCmd
      .command('add <taskId> <dependsOn>')
      .description('Add dependency')
      .action(async (taskId, dependsOn) => {
        try {
          await this.handleAddDependency(parseInt(taskId), parseInt(dependsOn));
        } catch (error) {
          this.handleError(error);
        }
      });

    depsCmd
      .command('remove <taskId> <dependsOn>')
      .description('Remove dependency')
      .action(async (taskId, dependsOn) => {
        try {
          await this.handleRemoveDependency(parseInt(taskId), parseInt(dependsOn));
        } catch (error) {
          this.handleError(error);
        }
      });

    depsCmd
      .command('validate')
      .description('Validate all dependencies')
      .action(async () => {
        try {
          await this.handleValidateDependencies();
        } catch (error) {
          this.handleError(error);
        }
      });

    depsCmd
      .command('fix')
      .description('Fix dependency issues')
      .action(async () => {
        try {
          await this.handleFixDependencies();
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  private setupUtilityCommands(): void {
    // MCP server
    this.program
      .command('mcp')
      .description('Start MCP server')
      .option('--port <port>', 'Server port', parseInt, 3000)
      .action(async (options) => {
        try {
          await this.handleMcp(options);
        } catch (error) {
          this.handleError(error);
        }
      });

    // Export tasks
    this.program
      .command('export')
      .description('Export tasks')
      .option('-f, --format <format>', 'Export format (json|csv|markdown)', 'json')
      .option('-o, --output <file>', 'Output file')
      .action(async (options) => {
        try {
          await this.handleExport(options);
        } catch (error) {
          this.handleError(error);
        }
      });
  }

  // ============================================================================
  // Command Handlers
  // ============================================================================

  private async handleInit(options: any): Promise<void> {
    const taskManagerDir = path.join(this.projectRoot, '.taskmanager');
    
    // Check if already initialized
    try {
      await fs.access(taskManagerDir);
      console.log(chalk.yellow('Project already initialized.'));
      return;
    } catch {
      // Not initialized, continue
    }

    console.log(chalk.blue('Initializing Vibex Task Manager project...'));

    // Copy template files
    try {
      // Find the package root
      const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
      
      let templateDir = '';
      const possibleTemplatePaths = [
          path.join(packageRoot, 'assets', 'taskmanager-template'),
          path.join(process.cwd(), 'assets', 'taskmanager-template') // for local dev
      ];

      for (const p of possibleTemplatePaths) {
          try {
              await fs.access(p);
              templateDir = p;
              break;
          } catch (e) {
              // ignore
          }
      }

      if (!templateDir) {
          throw new Error(`Template directory not found. Looked in ${possibleTemplatePaths.join(' and ')}`);
      }
      
      console.log(chalk.dim(`Using template from: ${templateDir}`));
      
      const entries = await fs.readdir(templateDir, { withFileTypes: true });
      for (const entry of entries) {
          const srcPath = path.join(templateDir, entry.name);
          const destPath = path.join(this.projectRoot, entry.name);
          if (entry.name !== '.DS_Store') {
            await fs.cp(srcPath, destPath, { recursive: true });
          }
      }
      console.log(chalk.green('✓ Project structure created from template.'));

    } catch (error) {
        console.error(chalk.red('Failed to copy project template.'), error);
        process.exit(1);
    }

    // Initialize services
    await this.initializeServices();

    // Setup configuration
    if (!options.skipSetup) {
      console.log(chalk.blue('\nDetecting AWS Bedrock models...'));
      
      // Auto-detect available models
      const autoDetect = await BedrockAutoDetect.quickSetup({
        region: options.region || process.env.AWS_REGION || 'us-east-1',
        profile: options.profile || process.env.AWS_PROFILE,
      });

      if (autoDetect.hasCredentials) {
        if (autoDetect.availableModels.length > 0) {
          console.log(chalk.green(`✓ Found ${autoDetect.availableModels.length} available Claude models in AWS Bedrock`));
          console.log(chalk.dim(`Region: ${autoDetect.region}`));
          
          // Use auto-detected models
          const setupOptions = {
            mainModel: autoDetect.mainModel || options.mainModel,
            researchModel: autoDetect.researchModel || options.researchModel,
            fallbackModel: autoDetect.fallbackModel || options.fallbackModel,
            region: autoDetect.region,
            profile: options.profile,
          };
          
          console.log(chalk.blue('\nConfiguring with auto-detected models:'));
          console.log(`Main Model: ${chalk.green(setupOptions.mainModel || 'Not available')}`);
          console.log(`Research Model: ${chalk.green(setupOptions.researchModel || 'Not available')}`);
          console.log(`Fallback Model: ${chalk.green(setupOptions.fallbackModel || 'Not available')}`);
          
          await this.configService!.setupConfiguration(setupOptions);
        } else {
          console.log(chalk.yellow('⚠ No Claude models found in your AWS Bedrock region.'));
          console.log(chalk.yellow('Please request access to Claude models in the AWS Bedrock console.'));
          await this.handleConfigSetup({});
        }
      } else {
        console.log(chalk.yellow('⚠ AWS credentials not found or invalid.'));
        console.log(chalk.dim('Configure AWS credentials to enable automatic model detection.'));
        console.log(chalk.dim('Using default model configuration...'));
        await this.handleConfigSetup({});
      }
    }

    console.log(chalk.green('✓ Project initialized successfully!'));
    console.log(chalk.dim('Run "vibex-task-manager config show" to view configuration'));
  }

  private async handleConfigShow(options: any): Promise<void> {
    await this.initializeServices();
    
    if (options.summary) {
      const summary = await this.configService!.getConfigSummary();
      
      console.log(chalk.blue('Configuration Summary:'));
      console.log(`Main Model: ${chalk.green(summary.mainModel)}`);
      console.log(`Research Model: ${chalk.green(summary.researchModel)}`);
      if (summary.fallbackModel) {
        console.log(`Fallback Model: ${chalk.green(summary.fallbackModel)}`);
      }
      console.log(`Region: ${chalk.green(summary.region)}`);
      console.log(`Has Credentials: ${summary.hasCredentials ? chalk.green('Yes') : chalk.red('No')}`);
      if (summary.projectName) {
        console.log(`Project Name: ${chalk.green(summary.projectName)}`);
      }
      console.log(`Last Updated: ${chalk.dim(summary.lastUpdated)}`);
    } else {
      const config = await this.configService!.getConfig();
      console.log(JSON.stringify(config, null, 2));
    }
  }

  private async handleConfigSetup(options: any): Promise<void> {
    await this.initializeServices();

    // Check if we should auto-detect
    if (!options.mainModel && !options.researchModel && !options.fallbackModel) {
      console.log(chalk.blue('Detecting available AWS Bedrock models...'));
      
      const autoDetect = await BedrockAutoDetect.quickSetup({
        region: options.region || process.env.AWS_REGION || 'us-east-1',
        profile: options.profile || process.env.AWS_PROFILE,
      });

      if (autoDetect.hasCredentials && autoDetect.availableModels.length > 0) {
        console.log(chalk.green(`✓ Found ${autoDetect.availableModels.length} available Claude models`));
        console.log(chalk.dim(`Available models: ${autoDetect.availableModels.join(', ')}`));
        
        // Use auto-detected models if user didn't specify
        options.mainModel = options.mainModel || autoDetect.mainModel;
        options.researchModel = options.researchModel || autoDetect.researchModel;
        options.fallbackModel = options.fallbackModel || autoDetect.fallbackModel;
        options.region = options.region || autoDetect.region;
      } else if (!autoDetect.hasCredentials) {
        console.log(chalk.yellow('⚠ AWS credentials not configured'));
        console.log(chalk.dim('Using default model configuration...'));
      } else {
        console.log(chalk.yellow('⚠ No Claude models found in your region'));
        console.log(chalk.dim('Using default model configuration...'));
      }
    }

    console.log(chalk.blue('\nAvailable Claude Models:'));
    const models = BedrockClient.getAvailableModels();
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${chalk.green(model.id)} - ${model.name}`);
      console.log(`   Context: ${model.contextWindow.toLocaleString()} tokens`);
      console.log(`   Cost: $${model.inputCostPer1K}/1K input, $${model.outputCostPer1K}/1K output`);
      console.log();
    });

    const setupOptions = {
      mainModel: options.mainModel || 'claude-3-5-sonnet-20241022',
      researchModel: options.researchModel || 'claude-3-opus-20240229',
      fallbackModel: options.fallbackModel || 'claude-3-haiku-20240307',
      region: options.region || 'us-east-1',
      profile: options.profile,
    };

    console.log(chalk.blue('Setting up configuration with:'));
    console.log(`Main Model: ${chalk.green(setupOptions.mainModel)}`);
    console.log(`Research Model: ${chalk.green(setupOptions.researchModel)}`);
    console.log(`Fallback Model: ${chalk.green(setupOptions.fallbackModel)}`);
    console.log(`Region: ${chalk.green(setupOptions.region)}`);

    const config = await this.configService!.setupConfiguration(setupOptions);
    
    console.log(chalk.green('✓ Configuration saved successfully!'));
    console.log(chalk.yellow('Note: Ensure your AWS credentials are configured for Bedrock access.'));
  }

  private async handleConfigTest(options: any): Promise<void> {
    await this.initializeServices();

    const modelType = options.model as 'main' | 'research' | 'fallback';
    console.log(chalk.blue(`Testing ${modelType} model connection...`));

    const modelConfig = await this.configService!.getModelConfig(modelType);
    const isValid = await this.configService!.testModelConfig(modelConfig);

    if (isValid) {
      console.log(chalk.green(`✓ ${modelType} model connection successful!`));
    } else {
      console.log(chalk.red(`✗ ${modelType} model connection failed.`));
      console.log(chalk.yellow('Check your AWS credentials and Bedrock permissions.'));
      process.exit(1);
    }
  }

  private async handleConfigModels(): Promise<void> {
    const models = BedrockClient.getAvailableModels();
    
    console.log(chalk.blue('Available Claude Models:'));
    console.log();
    
    models.forEach(model => {
      console.log(`${chalk.green(model.id)}`);
      console.log(`  Name: ${model.name}`);
      console.log(`  Max Tokens: ${model.maxTokens.toLocaleString()}`);
      console.log(`  Context Window: ${model.contextWindow.toLocaleString()}`);
      console.log(`  Input Cost: $${model.inputCostPer1K}/1K tokens`);
      console.log(`  Output Cost: $${model.outputCostPer1K}/1K tokens`);
      console.log();
    });
  }

  private async handleConfigDetect(options: any): Promise<void> {
    console.log(chalk.blue('Detecting available AWS Bedrock models...'));
    console.log(chalk.dim(`Region: ${options.region}`));
    if (options.profile) {
      console.log(chalk.dim(`Profile: ${options.profile}`));
    }
    console.log();

    const detector = new BedrockAutoDetect({
      region: options.region,
      profile: options.profile,
    });

    const result = await detector.detectModels();

    if (!result.hasCredentials) {
      console.log(chalk.red('✗ AWS credentials not found or invalid'));
      console.log(chalk.yellow('Please configure AWS credentials to access Bedrock.'));
      console.log();
      console.log('You can configure credentials using:');
      console.log('  - AWS CLI: aws configure');
      console.log('  - Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
      console.log('  - IAM role (when running on AWS)');
      return;
    }

    if (result.error) {
      console.log(chalk.red(`✗ Error: ${result.error}`));
    }

    if (result.available.length > 0) {
      console.log(chalk.green(`✓ Found ${result.available.length} available Claude models:`));
      console.log();
      
      result.available.forEach(model => {
        console.log(`  ${chalk.green('✓')} ${chalk.bold(model.modelId)}`);
        console.log(`     ${model.modelInfo.name}`);
        console.log(`     Context: ${model.modelInfo.contextWindow.toLocaleString()} tokens`);
        console.log(`     Cost: $${model.modelInfo.inputCostPer1K}/1K input, $${model.modelInfo.outputCostPer1K}/1K output`);
        console.log();
      });
    } else {
      console.log(chalk.yellow('⚠ No Claude models found in this region'));
      console.log('Please ensure you have requested access to Claude models in the AWS Bedrock console.');
    }

    if (result.unavailable.length > 0) {
      console.log(chalk.dim(`\nUnavailable models (${result.unavailable.length}):`));
      result.unavailable.forEach(model => {
        console.log(`  ${chalk.red('✗')} ${model.modelId} - ${model.modelInfo.name}`);
      });
    }

    if (result.recommendations.main || result.recommendations.research || result.recommendations.fallback) {
      console.log(chalk.blue('\nRecommended configuration:'));
      if (result.recommendations.main) {
        console.log(`  Main Model: ${chalk.green(result.recommendations.main)}`);
      }
      if (result.recommendations.research) {
        console.log(`  Research Model: ${chalk.green(result.recommendations.research)}`);
      }
      if (result.recommendations.fallback) {
        console.log(`  Fallback Model: ${chalk.green(result.recommendations.fallback)}`);
      }
      
      console.log();
      console.log(chalk.dim('To apply these recommendations, run:'));
      console.log(chalk.dim('  vibex-task-manager config setup'));
    }
  }

  private async handleList(options: any): Promise<void> {
    await this.initializeServices();

    const filter: any = {};
    if (options.status) filter.status = options.status;
    if (options.priority) filter.priority = options.priority;
    if (options.search) filter.search = options.search;

    const queryOptions: any = { filter };
    if (options.limit) {
      queryOptions.pagination = { page: 1, limit: options.limit };
    }

    const result = await this.taskService!.getTasks(queryOptions);

    if (result.tasks.length === 0) {
      console.log(chalk.yellow('No tasks found.'));
      return;
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      this.displayTasksTable(result.tasks);
      
      if (result.hasMore) {
        console.log(chalk.dim(`\nShowing ${result.tasks.length} of ${result.totalCount} tasks`));
      }
    }
  }

  private async handleShow(id: number, options: any): Promise<void> {
    await this.initializeServices();

    const task = await this.taskService!.getTask(id);

    if (options.format === 'json') {
      console.log(JSON.stringify(task, null, 2));
    } else {
      this.displayTaskDetails(task);
    }
  }

  private async handleAdd(options: any): Promise<void> {
    await this.initializeServices();

    // Import the actual add-task module (default export)
    const addTask = (await import('../../scripts/modules/task-manager/add-task.js')).default;
    
    const tasksPath = path.join(this.projectRoot, '.taskmanager', 'tasks', 'tasks.json');
    
    let result: any;

    if (options.aiPrompt) {
      // Use AI to generate task
      console.log(chalk.blue('Generating task with AI...'));
      
      const dependencies = options.dependsOn ? options.dependsOn.split(',').map(Number) : [];
      const context = {
        projectRoot: this.projectRoot,
        commandName: 'add-task',
        outputType: 'cli'
      };
      
      // Call the actual add-task module with AI prompt
      result = await addTask(
        tasksPath,
        options.aiPrompt, // prompt
        dependencies,
        options.priority || 'medium',
        context,
        'text', // outputFormat
        null, // manualTaskData
        false // useResearch - could be made configurable
      );
      
      console.log(chalk.green(`✓ Task created: #${result.newTaskId}`));
      
      // Show the created task
      const listTasks = (await import('../../scripts/modules/task-manager/list-tasks.js')).default;
      const tasksData = await listTasks(tasksPath, 'all', null, false, 'json');
      const createdTask = tasksData.tasks.find((t: any) => t.id === result.newTaskId);
      if (createdTask) {
        this.displayTaskDetails(createdTask as Task);
      }
      
      if (options.expand && result.newTaskId) {
        console.log(chalk.blue('Expanding task into subtasks...'));
        const expandTask = (await import('../../scripts/modules/task-manager/expand-task.js')).default;
        await expandTask(tasksPath, result.newTaskId, 5, false, '', context);
        
        // Show updated task with subtasks
        const updatedTasksData = await listTasks(tasksPath, 'all', null, false, 'json');
        const expandedTask = updatedTasksData.tasks.find((t: any) => t.id === result.newTaskId);
        if (expandedTask) {
          console.log(chalk.blue('\nExpanded task with subtasks:'));
          this.displayTaskDetails(expandedTask as Task);
        }
      }
    } else {
      // Manual task creation
      if (!options.title || !options.description) {
        console.error(chalk.red('Error: Title and description are required for manual task creation.'));
        console.error(chalk.dim('Use --ai-prompt to generate a task with AI, or provide both --title and --description.'));
        process.exit(1);
      }

      const dependencies = options.dependsOn ? options.dependsOn.split(',').map(Number) : [];
      const context = {
        projectRoot: this.projectRoot,
        commandName: 'add-task',
        outputType: 'cli'
      };
      
      const manualTaskData = {
        title: options.title,
        description: options.description,
        priority: options.priority || 'medium',
        dependencies
      };
      
      // Call add-task module with manual data
      result = await addTask(
        tasksPath,
        '', // no prompt for manual creation
        dependencies,
        options.priority || 'medium',
        context,
        'text', // outputFormat
        manualTaskData, // manualTaskData
        false // useResearch
      );
      
      console.log(chalk.green(`✓ Task created: #${result.newTaskId}`));
      
      // Show the created task
      const listTasks = (await import('../../scripts/modules/task-manager/list-tasks.js')).default;
      const tasksData = await listTasks(tasksPath, 'all', null, false, 'json');
      const createdTask = tasksData.tasks.find((t: any) => t.id === result.newTaskId);
      if (createdTask) {
        this.displayTaskDetails(createdTask as Task);
      }
    }
  }

  private async handleUpdate(id: number, options: any): Promise<void> {
    await this.initializeServices();

    const updates: any = {};
    if (options.title) updates.title = options.title;
    if (options.description) updates.description = options.description;
    if (options.status) updates.status = options.status;
    if (options.priority) updates.priority = options.priority;
    if (options.details) updates.details = options.details;

    const task = await this.taskService!.updateTask(id, updates);

    console.log(chalk.green(`✓ Task #${id} updated`));
    this.displayTaskDetails(task);
  }

  private async handleRemove(id: number, options: any): Promise<void> {
    await this.initializeServices();

    if (!options.force) {
      const task = await this.taskService!.getTask(id);
      console.log(`Are you sure you want to remove task #${id}: "${task.title}"?`);
      console.log(chalk.red('This action cannot be undone.'));
      // In a real implementation, you'd prompt for confirmation
      console.log(chalk.yellow('Use --force to skip this confirmation.'));
      return;
    }

    await this.taskService!.deleteTask(id);
    console.log(chalk.green(`✓ Task #${id} removed`));
  }

  private async handleSetStatus(id: number, status: TaskStatus): Promise<void> {
    await this.initializeServices();

    const task = await this.taskService!.setTaskStatus(id, status);
    console.log(chalk.green(`✓ Task #${id} status updated to: ${status}`));
  }

  private async handleAnalyze(id: number, options: any): Promise<void> {
    await this.initializeServices();

    console.log(chalk.blue(`Analyzing task #${id} complexity...`));
    
    const analysis = await this.taskService!.analyzeComplexity(id);

    if (options.format === 'json') {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      console.log(chalk.blue(`\nComplexity Analysis for Task #${analysis.taskId}:`));
      console.log(`Title: ${chalk.green(analysis.taskTitle)}`);
      console.log(`Complexity Score: ${chalk.yellow(analysis.complexityScore)}/10`);
      console.log(`Risk Level: ${chalk.red(analysis.riskLevel)}`);
      console.log(`Estimated Hours: ${chalk.cyan(analysis.estimatedHours)}`);
      console.log(`Confidence: ${chalk.dim((analysis.confidence * 100).toFixed(1))}%`);
      
      if (analysis.factors.length > 0) {
        console.log('\nComplexity Factors:');
        analysis.factors.forEach(factor => {
          console.log(`  • ${factor}`);
        });
      }
      
      if (analysis.recommendations.length > 0) {
        console.log('\nRecommendations:');
        analysis.recommendations.forEach(rec => {
          console.log(`  • ${rec}`);
        });
      }
      
      console.log(`\nReasoning: ${analysis.reasoning}`);
    }
  }

  private async handleExpand(id: number, options: any): Promise<void> {
    await this.initializeServices();

    console.log(chalk.blue(`Expanding task #${id} into subtasks...`));
    
    const subtasks = await this.taskService!.expandTask(id, {
      maxSubtasks: options.numSubtasks,
      detailLevel: options.detailLevel,
    });

    console.log(chalk.green(`✓ Generated ${subtasks.length} subtasks:`));
    
    subtasks.forEach((subtask, index) => {
      console.log(`\n${index + 1}. ${chalk.green(subtask.title)}`);
      console.log(`   ${subtask.description}`);
      console.log(`   Priority: ${subtask.priority}, Status: ${subtask.status}`);
      if (subtask.estimatedHours) {
        console.log(`   Estimated Hours: ${subtask.estimatedHours}`);
      }
    });
  }

  private async handleNext(options: any): Promise<void> {
    await this.initializeServices();

    const criteria: any = {
      includeInProgress: options.includeInProgress || false,
      maxComplexity: options.maxComplexity,
    };

    const result = await this.taskService!.getNextTask(criteria);

    if (!result.recommendation) {
      console.log(chalk.yellow('No recommended tasks available.'));
      
      if (result.blockedTasks.length > 0) {
        console.log(chalk.dim('\nBlocked tasks:'));
        result.blockedTasks.slice(0, 3).forEach(blocked => {
          console.log(`  • Task #${blocked.task.id}: ${blocked.task.title}`);
          console.log(`    ${chalk.red(blocked.reason)}`);
        });
      }
      return;
    }

    const rec = result.recommendation;
    console.log(chalk.green(`🎯 Recommended Next Task:`));
    console.log(`\nTask #${rec.task.id}: ${chalk.green(rec.task.title)}`);
    console.log(`Description: ${rec.task.description}`);
    console.log(`Priority: ${rec.task.priority}`);
    console.log(`Score: ${chalk.yellow((rec.score * 100).toFixed(1))}%`);
    
    if (rec.reasoning.length > 0) {
      console.log('\nWhy this task:');
      rec.reasoning.forEach(reason => {
        console.log(`  • ${reason}`);
      });
    }

    if (result.alternatives.length > 0) {
      console.log(chalk.dim('\nAlternatives:'));
      result.alternatives.slice(0, 3).forEach((alt, index) => {
        console.log(`  ${index + 1}. Task #${alt.task.id}: ${alt.task.title} (${(alt.score * 100).toFixed(1)}%)`);
      });
    }
  }

  private async handleParsePRD(file: string, options: any): Promise<void> {
    await this.initializeServices();

    const filePath = path.resolve(file);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      console.log(chalk.blue('Parsing PRD and generating tasks...'));
      
      const analysis = await this.taskService!.generateTasksFromPRD(content);

      if (options.format === 'json') {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        console.log(chalk.green(`\nPRD Analysis: ${analysis.projectName}`));
        console.log(`Overview: ${analysis.overview}`);
        console.log(`Estimated Complexity: ${analysis.estimatedComplexity}/10`);
        console.log(`Estimated Duration: ${analysis.estimatedDuration}`);
        
        console.log(chalk.blue(`\nGenerated ${analysis.tasks.length} tasks:`));
        
        analysis.tasks.forEach((task, index) => {
          console.log(`\n${index + 1}. ${chalk.green(task.title)}`);
          console.log(`   ${task.description}`);
          console.log(`   Priority: ${task.priority}, Complexity: ${task.complexity}/10`);
          if (task.estimatedHours) {
            console.log(`   Estimated Hours: ${task.estimatedHours}`);
          }
        });
      }
    } catch (error) {
      throw new Error(`Failed to read PRD file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleAddDependency(taskId: number, dependsOn: number): Promise<void> {
    await this.initializeServices();
    
    await this.taskService!.addDependency(taskId, dependsOn);
    console.log(chalk.green(`✓ Added dependency: Task #${taskId} now depends on Task #${dependsOn}`));
  }

  private async handleRemoveDependency(taskId: number, dependsOn: number): Promise<void> {
    await this.initializeServices();
    
    await this.taskService!.removeDependency(taskId, dependsOn);
    console.log(chalk.green(`✓ Removed dependency: Task #${taskId} no longer depends on Task #${dependsOn}`));
  }

  private async handleValidateDependencies(): Promise<void> {
    await this.initializeServices();
    
    const validation = await this.taskService!.validateDependencies();

    if (validation.isValid) {
      console.log(chalk.green('✓ All dependencies are valid!'));
    } else {
      console.log(chalk.red(`✗ Found ${validation.errors.length} dependency issues:`));
      
      validation.errors.forEach(error => {
        console.log(`  • ${error.message}`);
      });

      if (validation.warnings.length > 0) {
        console.log(chalk.yellow(`\nWarnings (${validation.warnings.length}):`));
        validation.warnings.forEach(warning => {
          console.log(`  • ${warning.message}`);
        });
      }

      console.log(chalk.dim('\nRun "vibex-task-manager deps fix" to automatically resolve issues.'));
    }
  }

  private async handleFixDependencies(): Promise<void> {
    await this.initializeServices();
    
    console.log(chalk.blue('Fixing dependency issues...'));
    
    const result = await this.taskService!.fixDependencies();

    if (result.isValid) {
      console.log(chalk.green('✓ All dependency issues fixed!'));
    } else {
      console.log(chalk.yellow('Some issues remain:'));
      result.errors.forEach(error => {
        console.log(`  • ${error.message}`);
      });
    }
  }

  private async handleMcp(options: any): Promise<void> {
    console.log(chalk.blue('Starting MCP server...'));
    console.log(chalk.dim('This would start the Model Context Protocol server'));
    console.log(chalk.dim('Implementation depends on your MCP server setup'));
    // Implementation would start the actual MCP server
  }

  private async handleExport(options: any): Promise<void> {
    await this.initializeServices();

    const { tasks } = await this.taskService!.getTasks();
    
    let output: string;
    const format = options.format || 'json';

    switch (format) {
      case 'json':
        output = JSON.stringify(tasks, null, 2);
        break;
      case 'csv':
        output = this.tasksToCSV(tasks);
        break;
      case 'markdown':
        output = this.tasksToMarkdown(tasks);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    if (options.output) {
      await fs.writeFile(options.output, output, 'utf8');
      console.log(chalk.green(`✓ Tasks exported to ${options.output}`));
    } else {
      console.log(output);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private displayTasksTable(tasks: Task[]): void {
    console.log(chalk.blue('\nTasks:'));
    console.log('━'.repeat(80));
    
    tasks.forEach(task => {
      const statusColor = this.getStatusColor(task.status);
      const priorityIcon = this.getPriorityIcon(task.priority);
      
      console.log(`${chalk.dim('#' + task.id.toString().padStart(3))} ${priorityIcon} ${statusColor(task.status.padEnd(12))} ${task.title}`);
      
      if (task.dependencies.length > 0) {
        console.log(`${' '.repeat(5)} ${chalk.dim('Depends on:')} ${task.dependencies.join(', ')}`);
      }
      
      if (task.subtasks && task.subtasks.length > 0) {
        const completedSubtasks = task.subtasks.filter(s => s.status === 'done').length;
        console.log(`${' '.repeat(5)} ${chalk.dim('Subtasks:')} ${completedSubtasks}/${task.subtasks.length} done`);
      }
    });
  }

  private displayTaskDetails(task: Task): void {
    console.log(`\n${chalk.blue('Task #' + task.id)}`);
    console.log(`Title: ${chalk.green(task.title)}`);
    console.log(`Description: ${task.description}`);
    console.log(`Status: ${this.getStatusColor(task.status)(task.status)}`);
    console.log(`Priority: ${task.priority}`);
    
    if (task.dependencies.length > 0) {
      console.log(`Dependencies: ${task.dependencies.join(', ')}`);
    }
    
    if (task.details) {
      console.log(`Details: ${task.details}`);
    }
    
    if (task.testStrategy) {
      console.log(`Test Strategy: ${task.testStrategy}`);
    }
    
    if (task.estimatedHours) {
      console.log(`Estimated Hours: ${task.estimatedHours}`);
    }
    
    if (task.complexity) {
      console.log(`Complexity: ${task.complexity}/10`);
    }
    
    if (task.subtasks && task.subtasks.length > 0) {
      console.log(`\nSubtasks (${task.subtasks.length}):`);
      task.subtasks.forEach((subtask, index) => {
        const statusColor = this.getStatusColor(subtask.status);
        console.log(`  ${index + 1}. ${statusColor(subtask.status.padEnd(12))} ${subtask.title}`);
      });
    }
  }

  private getStatusColor(status: TaskStatus): (text: string) => string {
    switch (status) {
      case 'pending': return chalk.gray;
      case 'in-progress': return chalk.blue;
      case 'done': return chalk.green;
      case 'review': return chalk.yellow;
      case 'deferred': return chalk.magenta;
      case 'cancelled': return chalk.red;
      default: return chalk.dim;
    }
  }

  private getPriorityIcon(priority: Priority): string {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  }

  private tasksToCSV(tasks: Task[]): string {
    const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Dependencies', 'Created', 'Updated'];
    const rows = tasks.map(task => [
      task.id.toString(),
      `"${task.title.replace(/"/g, '""')}"`,
      `"${task.description.replace(/"/g, '""')}"`,
      task.status,
      task.priority,
      task.dependencies.join(';'),
      task.created || '',
      task.updated || '',
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private tasksToMarkdown(tasks: Task[]): string {
    let md = '# Tasks\n\n';
    
    tasks.forEach(task => {
      md += `## Task #${task.id}: ${task.title}\n\n`;
      md += `**Status:** ${task.status}\n`;
      md += `**Priority:** ${task.priority}\n\n`;
      md += `${task.description}\n\n`;
      
      if (task.dependencies.length > 0) {
        md += `**Dependencies:** ${task.dependencies.join(', ')}\n\n`;
      }
      
      if (task.subtasks && task.subtasks.length > 0) {
        md += `### Subtasks\n\n`;
        task.subtasks.forEach((subtask, index) => {
          const checkbox = subtask.status === 'done' ? '[x]' : '[ ]';
          md += `${index + 1}. ${checkbox} ${subtask.title}\n`;
        });
        md += '\n';
      }
      
      md += '---\n\n';
    });
    
    return md;
  }

  private handleError(error: unknown): void {
    if (error instanceof TaskNotFoundError) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (error.details?.availableIds && Array.isArray(error.details.availableIds)) {
        console.error(chalk.dim(`Available task IDs: ${error.details.availableIds.join(', ')}`));
      }
    } else if (error instanceof CircularDependencyError) {
      console.error(chalk.red(`Error: ${error.message}`));
      console.error(chalk.dim('Use "vibex-task-manager deps fix" to resolve this issue.'));
    } else if (error instanceof ConfigurationError) {
      console.error(chalk.red(`Configuration Error: ${error.message}`));
      console.error(chalk.dim('Run "vibex-task-manager config setup" to configure the system.'));
    } else if (error instanceof AIServiceError) {
      console.error(chalk.red(`AI Service Error: ${error.message}`));
      console.error(chalk.dim('Check your AWS Bedrock configuration and credentials.'));
    } else if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
      if (process.env.DEBUG === '1') {
        console.error(chalk.dim(error.stack));
      }
    } else {
      console.error(chalk.red('An unknown error occurred'));
      if (process.env.DEBUG === '1') {
        console.error(error);
      }
    }
    
    process.exit(1);
  }

  public run(): void {
    this.program.parse();
  }
}

// Main execution
const cli = new VibexCLI();
cli.run();

export default VibexCLI;