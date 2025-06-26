/**
 * Path constants for Task Manager application
 */

// .taskmanager directory structure paths
export const TASKMANAGER_DIR = '.taskmanager';
export const TASKMANAGER_TASKS_DIR = '.taskmanager/tasks';
export const TASKMANAGER_DOCS_DIR = '.taskmanager/docs';
export const TASKMANAGER_REPORTS_DIR = '.taskmanager/reports';
export const TASKMANAGER_TEMPLATES_DIR = '.taskmanager/templates';

// Task Manager configuration files
export const TASKMANAGER_CONFIG_FILE = '.taskmanager/config.json';
export const LEGACY_CONFIG_FILE = '.taskmanagerconfig';

// Task Manager report files
export const COMPLEXITY_REPORT_FILE =
	'.taskmanager/reports/task-complexity-report.json';
export const LEGACY_COMPLEXITY_REPORT_FILE =
	'scripts/task-complexity-report.json';

// Task Manager PRD file paths
export const PRD_FILE = '.taskmanager/docs/prd.txt';
export const LEGACY_PRD_FILE = 'scripts/prd.txt';

// Task Manager template files
export const EXAMPLE_PRD_FILE = '.taskmanager/templates/example_prd.txt';
export const LEGACY_EXAMPLE_PRD_FILE = 'scripts/example_prd.txt';

// Task Manager task file paths
export const TASKMANAGER_TASKS_FILE = '.taskmanager/tasks/tasks.json';
export const LEGACY_TASKS_FILE = 'tasks/tasks.json';

// General project files (not Task Manager specific but commonly used)
export const ENV_EXAMPLE_FILE = '.env.example';
export const GITIGNORE_FILE = '.gitignore';

// Task file naming pattern
export const TASK_FILE_PREFIX = 'task_';
export const TASK_FILE_EXTENSION = '.txt';

/**
 * Project markers used to identify a vibex-task-manager project root
 * These files/directories indicate that a directory is a Task Manager project
 */
export const PROJECT_MARKERS = [
	'.taskmanager', // New taskmanager directory
	LEGACY_CONFIG_FILE, // .taskmanagerconfig
	'tasks.json', // Generic tasks file
	LEGACY_TASKS_FILE, // tasks/tasks.json (legacy location)
	TASKMANAGER_TASKS_FILE, // .taskmanager/tasks/tasks.json (new location)
	'.git', // Git repository
	'.svn' // SVN repository
];
