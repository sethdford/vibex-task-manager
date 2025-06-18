# CLI Reference

Complete command-line interface reference for Vibex Task Manager.

## Overview

Vibex Task Manager provides a comprehensive CLI for task management, project setup, and AI-powered task analysis. The CLI supports both manual task management and AI-assisted operations.

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

The package provides three executable commands:

- **`vibex-task-manager`** - Main CLI for task management
- **`vibex-task-manager-mcp`** - MCP server for AI editor integration  
- **`vibex`** - Alias for the MCP server

---

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
```

---

## Project Setup Commands

### init
Initialize a new Vibex Task Manager project.

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
--dry-run                        Preview changes without executing
--aliases                        Add shell aliases (tm, vibex-task-manager)
```

**Examples:**
```bash
# Interactive initialization
vibex-task-manager init

# Non-interactive with options
vibex-task-manager init -n "My Project" -d "A sample project" -y

# Preview initialization
vibex-task-manager init --dry-run
```

### migrate
Migrate existing project to new .taskmanager directory structure.

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

### models
Manage AI model configurations.

```bash
vibex-task-manager models [options]
```

**Options:**
```
--set-main <model_id>      Set primary model for task generation
--set-research <model_id>  Set model for research operations
--set-fallback <model_id>  Set fallback model
--setup                    Interactive model configuration
--openrouter              Show OpenRouter models
--ollama                  Show Ollama models
--bedrock                 Show AWS Bedrock models
-f, --file <file>         Configuration file path
```

**Examples:**
```bash
# Interactive setup
vibex-task-manager models --setup

# Set specific models
vibex-task-manager models --set-main claude-3-5-sonnet-20241022

# List available models
vibex-task-manager models --bedrock
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
vibex-task-manager generate -f my-tasks.json -o task-files
```

---

## Task Management Commands

### list
Display all tasks with their current status.

```bash
vibex-task-manager list [options]
```

**Options:**
```
-f, --file <file>     Tasks file path
-r, --report <file>   Complexity report file path
-s, --status <status> Filter by status
--with-subtasks       Show subtasks for each task
```

**Status Values:** `pending`, `in-progress`, `completed`, `blocked`, `cancelled`

**Examples:**
```bash
# List all tasks
vibex-task-manager list

# Filter by status
vibex-task-manager list -s pending

# Include subtasks
vibex-task-manager list --with-subtasks
```

### show
Display detailed information about a specific task.

```bash
vibex-task-manager show <id> [options]
```

**Arguments:**
```
<id>             Task ID to display (required)
```

**Options:**
```
-i, --id <id>        Alternative way to specify task ID
-s, --status <status> Filter subtasks by status
-f, --file <file>    Tasks file path
-r, --report <file>  Complexity report file path
```

**Examples:**
```bash
# Show task details
vibex-task-manager show 5

# Show with filtered subtasks
vibex-task-manager show 5 -s pending
```

### add-task
Add a new task using AI or manual input.

```bash
vibex-task-manager add-task [options]
```

**Options:**
```
-f, --file <file>            Tasks file path
-p, --prompt <prompt>        Task description for AI generation (required for AI)
-t, --title <title>          Task title (for manual creation)
-d, --description <desc>     Task description (for manual creation)
--details <details>          Implementation details
--dependencies <ids>         Comma-separated dependency IDs
--priority <priority>        Task priority (low, medium, high)
-r, --research              Use AI research for enhanced creation
```

**Priority Values:** `low`, `medium`, `high`

**Examples:**
```bash
# AI-generated task
vibex-task-manager add-task -p "Implement user authentication with JWT"

# Manual task creation
vibex-task-manager add-task -t "Setup Database" -d "Configure PostgreSQL"

# Task with dependencies and priority
vibex-task-manager add-task -p "User dashboard" --dependencies "1,2" --priority high
```

### update-task
Update a specific task with new information.

```bash
vibex-task-manager update-task [options]
```

**Options:**
```
-i, --id <id>         Task ID to update (required)
-p, --prompt <text>   Update context/prompt (required)
-r, --research        Use AI research for enhanced updates
-f, --file <file>     Tasks file path
```

**Examples:**
```bash
# Update task with AI analysis
vibex-task-manager update-task -i 5 -p "Add OAuth integration"

# Research-enhanced update
vibex-task-manager update-task -i 5 -p "Security best practices" -r
```

### update
Bulk update multiple tasks starting from a specific ID.

```bash
vibex-task-manager update [options]
```

**Options:**
```
--from <id>          Starting task ID for bulk update (required)
-p, --prompt <text>  Update context/prompt (required)
-r, --research       Use AI research for enhanced updates
-f, --file <file>    Tasks file path
```

**Examples:**
```bash
# Update tasks starting from ID 10
vibex-task-manager update --from 10 -p "Add error handling"

# Research-enhanced bulk update
vibex-task-manager update --from 5 -p "Performance optimization" -r
```

### set-status
Update task status.

```bash
vibex-task-manager set-status [options]
vibex-task-manager mark [options]      # Alias
vibex-task-manager set [options]       # Alias
```

**Options:**
```
-i, --id <id>         Task ID to update (required)
-s, --status <status> New status (required)
-f, --file <file>     Tasks file path
```

**Examples:**
```bash
# Mark task as in-progress
vibex-task-manager set-status -i 5 -s in-progress

# Using alias
vibex-task-manager mark -i 5 -s completed
```

### remove-task
Permanently delete a task or subtask.

```bash
vibex-task-manager remove-task [options]
```

**Options:**
```
-i, --id <ids>       Task/subtask ID(s) to remove (required)
-f, --file <file>    Tasks file path
-y, --yes            Skip confirmation prompt
```

**Examples:**
```bash
# Remove single task
vibex-task-manager remove-task -i 5

# Remove multiple tasks
vibex-task-manager remove-task -i "5,7,9" -y
```

### move
Move a task to a new position.

```bash
vibex-task-manager move [options]
```

**Options:**
```
--from <id>          Source task ID (required)
--to <id>            Target position ID (required)
-f, --force          Force move even if dependencies break
--backup             Create backup before moving
--cleanup            Clean up after move
-y, --yes            Skip confirmation prompts
--dry-run            Preview move without executing
-f, --file <file>    Tasks file path
```

**Examples:**
```bash
# Move task to new position
vibex-task-manager move --from 5 --to 2

# Preview move
vibex-task-manager move --from 5 --to 2 --dry-run
```

---

## Subtask Management Commands

### add-subtask
Add a subtask to an existing task.

```bash
vibex-task-manager add-subtask [options]
```

**Options:**
```
-f, --file <file>        Tasks file path
-p, --parent <id>        Parent task ID (required)
-i, --task-id <id>       Convert existing task to subtask
-t, --title <title>      Title for new subtask
-d, --description <text> Description for new subtask
--details <text>         Implementation details
--dependencies <ids>     Comma-separated dependency IDs
-s, --status <status>    Status for new subtask (default: pending)
--skip-generate          Skip regenerating task files
```

**Examples:**
```bash
# Add new subtask
vibex-task-manager add-subtask -p 5 -t "Setup routing" -d "Configure Express routes"

# Convert existing task to subtask
vibex-task-manager add-subtask -p 5 -i 8

# Subtask with dependencies
vibex-task-manager add-subtask -p 5 -t "API tests" --dependencies "5.1,5.2"
```

### update-subtask
Update a subtask with additional information.

```bash
vibex-task-manager update-subtask [options]
```

**Options:**
```
-i, --id <id>         Subtask ID (parentId.subtaskId format) (required)
-p, --prompt <text>   Update context/prompt (required)
-r, --research        Use AI research for enhanced updates
```

**Examples:**
```bash
# Update subtask
vibex-task-manager update-subtask -i 5.2 -p "Add validation middleware"

# Research-enhanced update
vibex-task-manager update-subtask -i 5.2 -p "Security considerations" -r
```

### remove-subtask
Remove a subtask from its parent task.

```bash
vibex-task-manager remove-subtask [options]
```

**Options:**
```
-f, --file <file>        Tasks file path
-i, --id <id>            Subtask ID (parentId.subtaskId format) (required)
-c, --convert            Convert subtask to standalone task
--skip-generate          Skip regenerating task files
```

**Examples:**
```bash
# Remove subtask
vibex-task-manager remove-subtask -i 5.2

# Convert subtask to task
vibex-task-manager remove-subtask -i 5.2 -c
```

### clear-subtasks
Remove all subtasks from specified tasks.

```bash
vibex-task-manager clear-subtasks [options]
```

**Options:**
```
-f, --file <file>    Tasks file path
-i, --id <ids>       Task ID(s) to clear subtasks from
--from <id>          Starting task ID in range
--to <id>            Ending task ID in range
--all                Clear subtasks from all tasks
```

**Examples:**
```bash
# Clear subtasks from specific task
vibex-task-manager clear-subtasks -i 5

# Clear from range
vibex-task-manager clear-subtasks --from 5 --to 10

# Clear all subtasks
vibex-task-manager clear-subtasks --all
```

---

## Task Analysis Commands

### analyze-complexity
Analyze task complexity and generate recommendations.

```bash
vibex-task-manager analyze-complexity [options]
```

**Options:**
```
-o, --output <file>      Output complexity report file
-m, --model <model>      AI model for analysis
-t, --threshold <number> Complexity threshold for recommendations
-f, --file <file>        Tasks file path
-r, --research          Use AI research for enhanced analysis
```

**Examples:**
```bash
# Basic complexity analysis
vibex-task-manager analyze-complexity

# Custom threshold and output
vibex-task-manager analyze-complexity -t 7 -o complexity.json

# Research-enhanced analysis
vibex-task-manager analyze-complexity -r
```

### complexity-report
Display the complexity analysis report.

```bash
vibex-task-manager complexity-report [options]
```

**Options:**
```
-f, --file <file>    Complexity report file path
```

**Examples:**
```bash
# Show default report
vibex-task-manager complexity-report

# Show custom report
vibex-task-manager complexity-report -f my-complexity.json
```

### expand
Break down tasks into detailed subtasks.

```bash
vibex-task-manager expand [options]
```

**Options:**
```
-i, --id <id>        Task ID to expand
-a, --all            Expand all pending tasks
-n, --num <number>   Number of subtasks to generate (default: 5)
-r, --research       Use AI research for enhanced expansion
-p, --prompt <text>  Additional context for expansion
-f, --force          Force expansion even if subtasks exist
--file <file>        Tasks file path
```

**Examples:**
```bash
# Expand specific task
vibex-task-manager expand -i 5

# Expand with more subtasks
vibex-task-manager expand -i 5 -n 8

# Expand all pending tasks
vibex-task-manager expand -a -r

# Expand with custom context
vibex-task-manager expand -i 5 -p "Focus on security aspects"
```

### next
Find the next task to work on based on dependencies.

```bash
vibex-task-manager next [options]
```

**Options:**
```
-f, --file <file>     Tasks file path
-r, --report <file>   Complexity report file path
```

**Examples:**
```bash
# Find next task
vibex-task-manager next

# Use custom complexity report
vibex-task-manager next -r my-complexity.json
```

---

## Dependency Management Commands

### add-dependency
Add a dependency relationship between tasks.

```bash
vibex-task-manager add-dependency [options]
```

**Options:**
```
-i, --id <id>         Task ID to add dependency to (required)
-d, --depends-on <id> Task ID that becomes a dependency (required)
-f, --file <file>     Tasks file path
```

**Examples:**
```bash
# Add dependency (task 5 depends on task 3)
vibex-task-manager add-dependency -i 5 -d 3
```

### remove-dependency
Remove a dependency relationship.

```bash
vibex-task-manager remove-dependency [options]
```

**Options:**
```
-i, --id <id>         Task ID to remove dependency from (required)
-d, --depends-on <id> Dependency task ID to remove (required)
-f, --file <file>     Tasks file path
```

**Examples:**
```bash
# Remove dependency
vibex-task-manager remove-dependency -i 5 -d 3
```

### validate-dependencies
Check for invalid dependencies without fixing them.

```bash
vibex-task-manager validate-dependencies [options]
```

**Options:**
```
-f, --file <file>    Tasks file path
```

**Examples:**
```bash
# Validate dependencies
vibex-task-manager validate-dependencies
```

### fix-dependencies
Automatically fix invalid dependencies.

```bash
vibex-task-manager fix-dependencies [options]
```

**Options:**
```
-f, --file <file>    Tasks file path
```

**Examples:**
```bash
# Fix dependencies
vibex-task-manager fix-dependencies
```

---

## Documentation Commands

### sync-readme
Synchronize task list to README.md.

```bash
vibex-task-manager sync-readme [options]
```

**Options:**
```
-f, --file <file>     Tasks file path
--with-subtasks       Include subtasks in README
-s, --status <status> Filter tasks by status
```

**Examples:**
```bash
# Basic README sync
vibex-task-manager sync-readme

# Include subtasks
vibex-task-manager sync-readme --with-subtasks

# Only pending tasks
vibex-task-manager sync-readme -s pending
```

---

## Development Commands

### dev
Run the development script directly.

```bash
vibex-task-manager dev [args...]
```

**Examples:**
```bash
# Run dev script
vibex-task-manager dev

# Pass arguments to dev script
vibex-task-manager dev --test --verbose
```

---

## Configuration Files

### Project Configuration
- **`.taskmanager/config.json`** - AI models and project settings
- **`tasks.json`** - Task data storage
- **`task-complexity-report.json`** - Complexity analysis results
- **`prd.txt`** - Product Requirements Document

### Configuration Format
```json
{
  "models": {
    "main": {
      "provider": "anthropic",
      "modelId": "claude-3-5-sonnet-20241022",
      "maxTokens": 4096,
      "temperature": 0.3
    },
    "research": {
      "provider": "aws-bedrock",
      "modelId": "anthropic.claude-3-opus-20240229-v1:0",
      "maxTokens": 8192,
      "temperature": 0.5
    }
  },
  "global": {
    "logLevel": "info",
    "debug": false,
    "defaultSubtasks": 5,
    "defaultPriority": "medium"
  }
}
```

---

## Common Usage Patterns

### New Project Setup
```bash
# Initialize project
vibex-task-manager init -n "My Project"

# Configure AI models
vibex-task-manager models --setup

# Parse requirements
vibex-task-manager parse-prd requirements.md

# Analyze complexity
vibex-task-manager analyze-complexity
```

### Daily Workflow
```bash
# Check next task
vibex-task-manager next

# Work on task (mark as in-progress)
vibex-task-manager set-status -i 5 -s in-progress

# Update with progress
vibex-task-manager update-task -i 5 -p "Added validation logic"

# Complete task
vibex-task-manager set-status -i 5 -s completed
```

### Task Breakdown
```bash
# Expand complex task
vibex-task-manager expand -i 8 -n 6

# Add manual subtask
vibex-task-manager add-subtask -p 8 -t "Write tests"

# Clear and re-expand
vibex-task-manager clear-subtasks -i 8
vibex-task-manager expand -i 8 -p "Focus on security"
```

### Dependency Management
```bash
# Add dependencies
vibex-task-manager add-dependency -i 5 -d 3
vibex-task-manager add-dependency -i 5 -d 4

# Validate dependencies
vibex-task-manager validate-dependencies

# Fix issues automatically
vibex-task-manager fix-dependencies
```

---

## Error Handling

### Common Error Messages

#### Task Not Found
```
Error: Task with ID 123 not found
Available task IDs: 1, 2, 3, 4, 5
```

#### Invalid Status
```
Error: Invalid status 'invalid-status'
Valid statuses: pending, in-progress, completed, blocked, cancelled
```

#### Circular Dependency
```
Error: Adding dependency would create a circular reference
Cycle detected: 1 → 3 → 5 → 1
```

#### Missing Configuration
```
Error: No AI model configured
Run: vibex-task-manager models --setup
```

### Exit Codes
- **0** - Success
- **1** - General error
- **2** - Invalid arguments
- **3** - File not found
- **4** - Configuration error
- **5** - AI service error

---

## Tips and Best Practices

### Performance Optimization
```bash
# Use research sparingly (slower but higher quality)
vibex-task-manager add-task -p "Complex feature" -r

# Batch operations when possible
vibex-task-manager expand -a  # Expand all at once

# Use dry-run for planning
vibex-task-manager migrate --dry-run
```

### File Management
```bash
# Work with custom files
vibex-task-manager list -f backup-tasks.json

# Create backups before major changes
cp tasks.json tasks-backup.json
vibex-task-manager migrate --backup
```

### Debugging
```bash
# Enable debug output
DEBUG=1 vibex-task-manager expand -i 5

# Test mode (preview without execution)  
TEST_MODE=1 vibex-task-manager remove-task -i 5
```

### Shell Aliases
Add to your shell profile (`.bashrc`, `.zshrc`):
```bash
alias tm='vibex-task-manager'
alias tml='vibex-task-manager list'
alias tmn='vibex-task-manager next'
alias tms='vibex-task-manager show'
```

---

This CLI reference provides comprehensive documentation for all Vibex Task Manager commands, enabling efficient task management and AI-powered project planning.