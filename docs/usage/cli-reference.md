# CLI Reference

Complete command-line interface reference for Vibex Task Manager.

## Overview

Vibex Task Manager provides a comprehensive CLI for task management, project setup, and AI-powered task analysis. The CLI supports both manual task management and AI-assisted operations using AWS Bedrock.

## Installation & Setup

### Global Installation
```bash
npm install -g vibex-task-manager
```

### Local Installation
```bash
npm install vibex-task-manager
npx vibex-task-manager --help
```

### CLI Binaries

The package provides these executable commands:

- **`vibex-task-manager`** - Main CLI for task management
- **`vibex-task-manager-mcp`** - MCP server for AI editor integration  
- **`vibex`** - Alias for the MCP server

## Global Options

### Help and Version
```bash
vibex-task-manager --help          # Show help
vibex-task-manager --version       # Show version
vibex-task-manager <command> --help # Show command-specific help
```

### Environment Variables
```bash
DEBUG=1 vibex-task-manager <command>     # Enable debug output
TEST_MODE=1 vibex-task-manager <command> # Enable test mode (dry-run)
AWS_PROFILE=myprofile vibex-task-manager <command>  # Use specific AWS profile
AWS_DEFAULT_REGION=us-west-2 vibex-task-manager <command>  # Set AWS region
```

---

## Project Setup Commands

### init
Initialize a new Vibex Task Manager project with AWS Bedrock auto-detection.

```bash
vibex-task-manager init [options]
```

**Options:**
```
-n, --name <name>                Project name
-d, --description <description>  Project description
-v, --version <version>          Project version (default: 0.1.0)
-a, --author <author>            Author name
-y, --yes                        Skip prompts, use defaults
--skip-install                   Skip dependency installation
--skip-setup                     Skip AWS model auto-detection
--dry-run                        Preview changes without executing
--aliases                        Add shell aliases (tm, vibex-task-manager)
```

**Examples:**
```bash
# Interactive initialization with auto-detection
vibex-task-manager init

# Non-interactive with options
vibex-task-manager init -n "My Project" -d "A sample project" -y

# Skip AWS auto-detection
vibex-task-manager init --skip-setup

# Preview initialization
vibex-task-manager init --dry-run
```

### migrate
Migrate existing project to new .vibex directory structure.

```bash
vibex-task-manager migrate [options]
```

**Options:**
```
--from <id>      Starting task ID for migration
--to <id>        Ending task ID for migration
-f, --force      Force migration without confirmation
--backup         Create backup before migration
--cleanup        Clean up old files after migration
-y, --yes        Skip confirmation prompts
--dry-run        Preview migration changes
-f, --file <file> Configuration file path
```

**Examples:**
```bash
# Migrate entire project
vibex-task-manager migrate --backup

# Migrate specific task range
vibex-task-manager migrate --from 1 --to 10

# Preview migration
vibex-task-manager migrate --dry-run
```

---

## Configuration Commands

### models
Manage AWS Bedrock model configurations.

```bash
vibex-task-manager models [options]
```

**Options:**
```
--set-main <model_id>      Set primary model for task generation
--set-research <model_id>  Set model for research operations  
--set-fallback <model_id>  Set fallback model
--setup                    Interactive model configuration
--list                     List available models
--detect                   Auto-detect available AWS models
-f, --file <file>         Configuration file path
```

**Examples:**
```bash
# Interactive setup
vibex-task-manager models --setup

# Auto-detect available models
vibex-task-manager models --detect

# Set specific models
vibex-task-manager models --set-main claude-3-5-sonnet-20241022

# List available models
vibex-task-manager models --list
```

### config
Manage configuration settings.

```bash
vibex-task-manager config [subcommand] [options]
```

**Subcommands:**
```bash
# Show current configuration
vibex-task-manager config show [--summary]

# Interactive configuration setup  
vibex-task-manager config setup [options]

# Test AWS Bedrock connection
vibex-task-manager config test [--model <type>]

# List available Claude models
vibex-task-manager config models

# Auto-detect available AWS models
vibex-task-manager config detect [--region <region>] [--profile <profile>]
```

**Examples:**
```bash
# Show configuration summary
vibex-task-manager config show --summary

# Test main model connection
vibex-task-manager config test --model main

# Detect models in specific region
vibex-task-manager config detect --region us-west-2

# Setup with specific models
vibex-task-manager config setup --main-model claude-3-5-sonnet-20241022
```

---

## Task Generation Commands

### parse-prd
Parse Product Requirements Document and generate tasks.

```bash
vibex-task-manager parse-prd [file] [options]
```

**Arguments:**
```
[file]           Path to PRD file (markdown, text, or docx)
```

**Options:**
```
-i, --input <file>       Input PRD file path
-o, --output <file>      Output file path (default: tasks.json)
-n, --num-tasks <number> Number of tasks to generate (default: 10)
-f, --force              Skip confirmation when overwriting
--append                 Append to existing tasks
-r, --research           Use AI research for enhanced generation
```

**Examples:**
```bash
# Parse PRD file
vibex-task-manager parse-prd requirements.md

# Generate more tasks with research
vibex-task-manager parse-prd -i prd.txt -n 20 -r

# Append to existing tasks
vibex-task-manager parse-prd requirements.md --append
```

### add-task
Add a new task with AI assistance.

```bash
vibex-task-manager add-task [options]
```

**Options:**
```
-t, --title <title>          Task title
-d, --description <desc>     Task description
-p, --priority <priority>    Task priority (low|medium|high)
--depends-on <ids>          Comma-separated dependency IDs
--ai-prompt <prompt>        Use AI to generate task from prompt
--expand                    Auto-expand into subtasks
-r, --research              Use research capabilities
```

**Examples:**
```bash
# Add task manually
vibex-task-manager add-task -t "Setup Database" -d "Configure PostgreSQL"

# Generate task with AI
vibex-task-manager add-task --ai-prompt "Create user authentication system"

# Add with dependencies
vibex-task-manager add-task -t "Deploy API" --depends-on 1,2,3
```

### generate
Create individual task files from tasks.json.

```bash
vibex-task-manager generate [options]
```

**Options:**
```
-f, --file <file>    Input tasks file path
-o, --output <dir>   Output directory (default: tasks)
```

**Examples:**
```bash
# Generate task files
vibex-task-manager generate

# Custom input and output
vibex-task-manager generate -f custom-tasks.json -o task-files
```

---

## Task Management Commands

### list
List tasks with filtering options.

```bash
vibex-task-manager list [options]
```

**Options:**
```
-s, --status <status>     Filter by status
-p, --priority <priority> Filter by priority
--search <term>          Search tasks
--format <format>        Output format (table|json|markdown)
--limit <number>         Limit number of results
--with-subtasks          Include subtasks
```

**Examples:**
```bash
# List all tasks
vibex-task-manager list

# List pending tasks with subtasks
vibex-task-manager list --status pending --with-subtasks

# Search tasks
vibex-task-manager list --search "authentication"

# JSON output
vibex-task-manager list --format json
```

### show
Show detailed information about a specific task.

```bash
vibex-task-manager show <id> [options]
```

**Arguments:**
```
<id>             Task ID or subtask ID (e.g., 5 or 5.2)
```

**Options:**
```
--format <format>  Output format (table|json|markdown)
```

**Examples:**
```bash
# Show task details
vibex-task-manager show 5

# Show subtask details
vibex-task-manager show 5.2

# JSON output
vibex-task-manager show 5 --format json
```

### next
Get the next recommended task to work on.

```bash
vibex-task-manager next [options]
```

**Options:**
```
--include-in-progress    Include in-progress tasks
--max-complexity <num>   Maximum complexity threshold
```

**Examples:**
```bash
# Get next task recommendation
vibex-task-manager next

# Include in-progress tasks
vibex-task-manager next --include-in-progress

# Limit complexity
vibex-task-manager next --max-complexity 5
```

### update
Update multiple tasks from a specific ID with new context.

```bash
vibex-task-manager update --from <id> --prompt "<prompt>" [options]
```

**Options:**
```
--from <id>        Starting task ID (required)
--prompt <text>    Update context (required)
-r, --research     Use research-backed updates
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Update tasks from ID 5 onwards
vibex-task-manager update --from 5 --prompt "Add rate limiting requirements"

# Use research for updates
vibex-task-manager update --from 3 --prompt "Security considerations" --research
```

### update-task
Update a single task with new information.

```bash
vibex-task-manager update-task --id <id> --prompt "<prompt>" [options]
```

**Options:**
```
--id <id>          Task ID (required)
--prompt <text>    New information (required)
--append           Append instead of replacing
-r, --research     Use research-backed updates
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Update single task
vibex-task-manager update-task --id 5 --prompt "Add OAuth2 implementation"

# Append information
vibex-task-manager update-task --id 5 --prompt "Additional notes" --append

# Research-backed update
vibex-task-manager update-task --id 5 --prompt "Security review" --research
```

### update-subtask
Update a specific subtask with additional information.

```bash
vibex-task-manager update-subtask --id <parentId.subtaskId> --prompt "<prompt>" [options]
```

**Options:**
```
--id <id>          Subtask ID (required, format: parentId.subtaskId)
--prompt <text>    Additional information (required)
-r, --research     Use research-backed updates
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Update subtask (appends with timestamp)
vibex-task-manager update-subtask --id 5.2 --prompt "Add rate limiting of 100 requests per minute"

# Research-backed subtask update
vibex-task-manager update-subtask --id 3.1 --prompt "Security considerations" --research
```

### set-status
Update task or subtask status.

```bash
vibex-task-manager set-status --id <id> --status <status> [options]
```

**Options:**
```
--id <id>          Task/subtask ID or comma-separated list
--status <status>  New status (pending|in-progress|done|review|deferred|cancelled)
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Set single task status
vibex-task-manager set-status --id 5 --status done

# Set multiple tasks
vibex-task-manager set-status --id 1,2,3 --status in-progress

# Set subtask status
vibex-task-manager set-status --id 5.2 --status done
```

### remove
Remove a task or subtask.

```bash
vibex-task-manager remove <id> [options]
```

**Options:**
```
-f, --force       Skip confirmation
--confirm         Skip confirmation prompt
-f, --file <file> Custom tasks file
```

**Examples:**
```bash
# Remove task with confirmation
vibex-task-manager remove 5

# Force remove without confirmation
vibex-task-manager remove 5 --force

# Remove subtask
vibex-task-manager remove 5.2
```

---

## Task Analysis Commands

### analyze
Analyze task complexity and generate recommendations.

```bash
vibex-task-manager analyze [options]
```

**Options:**
```
--id <id>              Analyze specific task
--from <id>            Starting task ID for range
--to <id>              Ending task ID for range
--threshold <number>   Complexity threshold (1-10, default: 5)
--output <file>        Output report file
-r, --research         Use research-backed analysis
-f, --file <file>      Custom tasks file
```

**Examples:**
```bash
# Analyze all tasks
vibex-task-manager analyze

# Analyze specific task
vibex-task-manager analyze --id 5

# Analyze range with custom threshold
vibex-task-manager analyze --from 1 --to 10 --threshold 6

# Research-backed analysis
vibex-task-manager analyze --research
```

### complexity-report
Display the task complexity analysis report.

```bash
vibex-task-manager complexity-report [options]
```

**Options:**
```
-f, --file <file>  Custom report file path
```

**Examples:**
```bash
# Display default complexity report
vibex-task-manager complexity-report

# Display custom report
vibex-task-manager complexity-report --file my-report.json
```

### expand
Expand tasks into subtasks.

```bash
vibex-task-manager expand [options]
```

**Options:**
```
--id <id>              Expand specific task
--all                  Expand all pending tasks
--num <number>         Number of subtasks to generate
--force                Force regeneration of existing subtasks
--prompt <text>        Additional context for expansion
-r, --research         Use research-backed generation
-f, --file <file>      Custom tasks file
```

**Examples:**
```bash
# Expand specific task
vibex-task-manager expand --id 5 --num 5

# Expand all pending tasks
vibex-task-manager expand --all

# Force regeneration with research
vibex-task-manager expand --all --force --research

# Expand with context
vibex-task-manager expand --id 5 --prompt "Focus on security aspects"
```

---

## Dependency Management Commands

### add-dependency
Add a dependency relationship between tasks.

```bash
vibex-task-manager add-dependency --id <id> --depends-on <id> [options]
```

**Options:**
```
--id <id>          Task that will depend on another
--depends-on <id>  Task that will become a dependency
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Add dependency
vibex-task-manager add-dependency --id 5 --depends-on 3

# Task 5 will now depend on task 3
```

### remove-dependency
Remove a dependency relationship.

```bash
vibex-task-manager remove-dependency --id <id> --depends-on <id> [options]
```

**Options:**
```
--id <id>          Task to remove dependency from
--depends-on <id>  Dependency to remove
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Remove dependency
vibex-task-manager remove-dependency --id 5 --depends-on 3
```

### validate-dependencies
Check for dependency issues without making changes.

```bash
vibex-task-manager validate-dependencies [options]
```

**Options:**
```
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Validate all dependencies
vibex-task-manager validate-dependencies
```

### fix-dependencies
Automatically fix invalid dependencies.

```bash
vibex-task-manager fix-dependencies [options]
```

**Options:**
```
-f, --file <file>  Custom tasks file
```

**Examples:**
```bash
# Fix dependency issues
vibex-task-manager fix-dependencies
```

---

## Utility Commands

### clear-subtasks
Remove subtasks from specified tasks.

```bash
vibex-task-manager clear-subtasks [options]
```

**Options:**
```
--id <id>         Task IDs (comma-separated)
--all             Clear subtasks from all tasks
-f, --file <file> Custom tasks file
```

**Examples:**
```bash
# Clear subtasks from specific tasks
vibex-task-manager clear-subtasks --id 1,2,3

# Clear all subtasks
vibex-task-manager clear-subtasks --all
```

### move
Move a task or subtask to a new position.

```bash
vibex-task-manager move --from <id> --to <id> [options]
```

**Options:**
```
--from <id>       Source task/subtask ID
--to <id>         Destination task/subtask ID
-f, --file <file> Custom tasks file
```

**Examples:**
```bash
# Move task to become subtask
vibex-task-manager move --from 5 --to 7

# Move subtask to standalone task
vibex-task-manager move --from 7.2 --to 8
```

### export
Export tasks to different formats.

```bash
vibex-task-manager export [options]
```

**Options:**
```
-f, --format <format>  Export format (json|csv|markdown)
-o, --output <file>    Output file
--filter <status>      Filter by status
```

**Examples:**
```bash
# Export to JSON
vibex-task-manager export --format json --output tasks.json

# Export pending tasks to CSV
vibex-task-manager export --format csv --filter pending --output pending.csv

# Export to markdown
vibex-task-manager export --format markdown --output README.md
```

---

## Advanced Commands

### mcp
Start the MCP server for editor integration.

```bash
vibex-task-manager mcp [options]
```

**Options:**
```
--port <port>     Server port (default: 3000)
```

**Examples:**
```bash
# Start MCP server
vibex-task-manager mcp

# Start on custom port
vibex-task-manager mcp --port 8080
```

### research
Perform AI-powered research queries with project context.

```bash
vibex-task-manager research --query "<query>" [options]
```

**Options:**
```
--query <text>           Research query (required)
--task-ids <ids>         Include specific task context
--file-paths <paths>     Include file context
--save-to <taskId>       Save results to task/subtask
--save-to-file           Save to research directory
--detail-level <level>   Detail level (low|medium|high)
```

**Examples:**
```bash
# Research query
vibex-task-manager research --query "Best practices for API authentication"

# Research with task context
vibex-task-manager research --query "Security considerations" --task-ids 5,6,7

# Save research to task
vibex-task-manager research --query "Database optimization" --save-to 5.2
```

---

## Exit Codes

- **0** - Success
- **1** - General error
- **2** - Configuration error
- **3** - AWS/Bedrock error
- **4** - Task not found
- **5** - Dependency error
- **6** - File operation error

---

## Configuration Files

### Project Configuration
- `.vibex/config.json` - Main project configuration
- `.vibex/tasks/tasks.json` - Task data
- `.vibex/reports/` - Analysis reports

### Global Configuration
- `~/.vibex/config.json` - Global settings
- `~/.aws/credentials` - AWS credentials
- `~/.aws/config` - AWS configuration

---

## Environment Variables

```bash
# AWS Configuration
AWS_PROFILE=myprofile                    # AWS profile to use
AWS_DEFAULT_REGION=us-east-1            # Default AWS region
AWS_ACCESS_KEY_ID=key                   # AWS access key
AWS_SECRET_ACCESS_KEY=secret            # AWS secret key

# Debug and Testing
DEBUG=1                                 # Enable debug output
TEST_MODE=1                            # Enable test mode
VIBEX_CONFIG_PATH=/path/to/config      # Custom config path

# MCP Server
MCP_PORT=3000                          # MCP server port
MCP_HOST=localhost                     # MCP server host
```

---

## Common Workflows

### Initial Setup
```bash
# 1. Initialize project
vibex-task-manager init

# 2. Configure AWS models (auto-detected)
vibex-task-manager config detect

# 3. Parse PRD if available
vibex-task-manager parse-prd requirements.md

# 4. Generate task files
vibex-task-manager generate
```

### Daily Development
```bash
# 1. Get next task
vibex-task-manager next

# 2. Start working on task
vibex-task-manager set-status --id 5 --status in-progress

# 3. Update task with progress
vibex-task-manager update-task --id 5 --prompt "Implemented OAuth2 flow"

# 4. Mark as done
vibex-task-manager set-status --id 5 --status done
```

### Project Analysis
```bash
# 1. Analyze complexity
vibex-task-manager analyze --research

# 2. View report
vibex-task-manager complexity-report

# 3. Expand complex tasks
vibex-task-manager expand --all --force

# 4. Validate dependencies
vibex-task-manager validate-dependencies
```

---

For more examples and detailed usage, see the [Usage Examples](examples.md) and [Tutorial](../getting-started/tutorial.md). 