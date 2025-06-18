# Vibex Task Manager Command Reference

Here's a comprehensive reference of all available commands:

## Parse PRD

```bash
# Parse a PRD file and generate tasks
vibex-task-manager parse-prd <prd-file.txt>

# Limit the number of tasks generated
vibex-task-manager parse-prd <prd-file.txt> --num-tasks=10
```

## List Tasks

```bash
# List all tasks
vibex-task-manager list

# List tasks with a specific status
vibex-task-manager list --status=<status>

# List tasks with subtasks
vibex-task-manager list --with-subtasks

# List tasks with a specific status and include subtasks
vibex-task-manager list --status=<status> --with-subtasks
```

## Show Next Task

```bash
# Show the next task to work on based on dependencies and status
vibex-task-manager next
```

## Show Specific Task

```bash
# Show details of a specific task
vibex-task-manager show <id>
# or
vibex-task-manager show --id=<id>

# View a specific subtask (e.g., subtask 2 of task 1)
vibex-task-manager show 1.2
```

## Update Tasks

```bash
# Update tasks from a specific ID and provide context
vibex-task-manager update --from=<id> --prompt="<prompt>"

# Update tasks using research role
vibex-task-manager update --from=<id> --prompt="<prompt>" --research
```

## Update a Specific Task

```bash
# Update a single task by ID with new information
vibex-task-manager update-task --id=<id> --prompt="<prompt>"

# Use research-backed updates
vibex-task-manager update-task --id=<id> --prompt="<prompt>" --research
```

## Update a Subtask

```bash
# Append additional information to a specific subtask
vibex-task-manager update-subtask --id=<parentId.subtaskId> --prompt="<prompt>"

# Example: Add details about API rate limiting to subtask 2 of task 5
vibex-task-manager update-subtask --id=5.2 --prompt="Add rate limiting of 100 requests per minute"

# Use research-backed updates
vibex-task-manager update-subtask --id=<parentId.subtaskId> --prompt="<prompt>" --research
```

Unlike the `update-task` command which replaces task information, the `update-subtask` command _appends_ new information to the existing subtask details, marking it with a timestamp. This is useful for iteratively enhancing subtasks while preserving the original content.

## Generate Task Files

```bash
# Generate individual task files from tasks.json
vibex-task-manager generate
```

## Set Task Status

```bash
# Set status of a single task
vibex-task-manager set-status --id=<id> --status=<status>

# Set status for multiple tasks
vibex-task-manager set-status --id=1,2,3 --status=<status>

# Set status for subtasks
vibex-task-manager set-status --id=1.1,1.2 --status=<status>
```

When marking a task as "done", all of its subtasks will automatically be marked as "done" as well.

## Expand Tasks

```bash
# Expand a specific task with subtasks
vibex-task-manager expand --id=<id> --num=<number>

# Expand with additional context
vibex-task-manager expand --id=<id> --prompt="<context>"

# Expand all pending tasks
vibex-task-manager expand --all

# Force regeneration of subtasks for tasks that already have them
vibex-task-manager expand --all --force

# Research-backed subtask generation for a specific task
vibex-task-manager expand --id=<id> --research

# Research-backed generation for all tasks
vibex-task-manager expand --all --research
```

## Clear Subtasks

```bash
# Clear subtasks from a specific task
vibex-task-manager clear-subtasks --id=<id>

# Clear subtasks from multiple tasks
vibex-task-manager clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
vibex-task-manager clear-subtasks --all
```

## Analyze Task Complexity

```bash
# Analyze complexity of all tasks
vibex-task-manager analyze-complexity

# Save report to a custom location
vibex-task-manager analyze-complexity --output=my-report.json

# Use a specific LLM model
vibex-task-manager analyze-complexity --model=claude-3-opus-20240229

# Set a custom complexity threshold (1-10)
vibex-task-manager analyze-complexity --threshold=6

# Use an alternative tasks file
vibex-task-manager analyze-complexity --file=custom-tasks.json

# Use Perplexity AI for research-backed complexity analysis
vibex-task-manager analyze-complexity --research
```

## View Complexity Report

```bash
# Display the task complexity analysis report
vibex-task-manager complexity-report

# View a report at a custom location
vibex-task-manager complexity-report --file=my-report.json
```

## Managing Task Dependencies

```bash
# Add a dependency to a task
vibex-task-manager add-dependency --id=<id> --depends-on=<id>

# Remove a dependency from a task
vibex-task-manager remove-dependency --id=<id> --depends-on=<id>

# Validate dependencies without fixing them
vibex-task-manager validate-dependencies

# Find and fix invalid dependencies automatically
vibex-task-manager fix-dependencies
```

## Move Tasks

```bash
# Move a task or subtask to a new position
vibex-task-manager move --from=<id> --to=<id>

# Examples:
# Move task to become a subtask
vibex-task-manager move --from=5 --to=7

# Move subtask to become a standalone task
vibex-task-manager move --from=5.2 --to=7

# Move subtask to a different parent
vibex-task-manager move --from=5.2 --to=7.3

# Reorder subtasks within the same parent
vibex-task-manager move --from=5.2 --to=5.4

# Move a task to a new ID position (creates placeholder if doesn't exist)
vibex-task-manager move --from=5 --to=25

# Move multiple tasks at once (must have the same number of IDs)
vibex-task-manager move --from=10,11,12 --to=16,17,18
```

## Add a New Task

```bash
# Add a new task using AI (main role)
vibex-task-manager add-task --prompt="Description of the new task"

# Add a new task using AI (research role)
vibex-task-manager add-task --prompt="Description of the new task" --research

# Add a task with dependencies
vibex-task-manager add-task --prompt="Description" --dependencies=1,2,3

# Add a task with priority
vibex-task-manager add-task --prompt="Description" --priority=high
```

## Initialize a Project

```bash
# Initialize a new project with automatic AWS Bedrock model detection (v0.17.3+)
vibex-task-manager init

# Skip auto-detection during init
vibex-task-manager init --skip-setup
```

**Note:** Starting with v0.17.3, `init` automatically detects and configures AWS Bedrock models!

## Configure AI Models

```bash
# Auto-detect available AWS Bedrock models (v0.17.3+)
vibex-task-manager config-detect

# Auto-detect with specific region
vibex-task-manager config-detect --region us-west-2

# Auto-detect with specific AWS profile
vibex-task-manager config-detect --profile production

# Auto-detect and apply configuration
vibex-task-manager config-detect --apply

# View current AI model configuration
vibex-task-manager models

# Set the primary model
vibex-task-manager models --set-main=anthropic.claude-3-5-sonnet-20241022-v2:0

# Set the research model
vibex-task-manager models --set-research=anthropic.claude-3-opus-20240229-v1:0

# Set the fallback model
vibex-task-manager models --set-fallback=anthropic.claude-3-haiku-20240307-v1:0

# Run interactive setup to configure models
vibex-task-manager models --setup

# Test model configuration
vibex-task-manager models --test
```

**Auto-Detection Feature (v0.17.3+):** The `config-detect` command automatically discovers available Claude models in your AWS Bedrock region and suggests optimal configuration. Configuration is stored in `.taskmanager/config.json` in your project root.
