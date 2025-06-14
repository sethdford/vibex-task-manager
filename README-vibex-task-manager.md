# Vibex Task Manager

### Open Source Task Management System

A task management system for AI-driven development using AWS Bedrock, designed to work seamlessly with Cursor AI and other MCP-compatible editors.

## Requirements

- Node.js 18.0.0 or higher
- AWS Account with Bedrock access
- AWS Credentials configured (AWS CLI, environment variables, or IAM roles)
- Bedrock Model Access enabled for Claude and Amazon Titan models

## Configuration

Vibex Task Manager uses two primary configuration methods:

1.  **`.taskmanager/config.json` File (Project Root)**

    - Stores most settings: AI model selections (main, research, fallback), parameters (max tokens, temperature), logging level, default priority/subtasks, project name.
    - **Created and managed using `vibex-task-manager models --setup` CLI command or the `models` MCP tool.**
    - Do not edit manually unless you know what you are doing.

2.  **Environment Variables (`.env` file or MCP `env` block)**
    - Used **only** for **AWS Credentials** (e.g., `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`) and AWS profile configuration.
    - **For CLI:** Configure AWS CLI with `aws configure` or place credentials in a `.env` file in your project root.
    - **For MCP/Cursor:** Place AWS credentials in the `env` section of your `.cursor/mcp.json` (or other MCP config according to the AI IDE or client you use) file under the `vibex-task-manager` server definition.

**Important:** Settings like model choices, max tokens, temperature, and log level are **no longer configured via environment variables.** Use the `vibex-task-manager models` command or tool. Only AWS credentials are configured via environment variables or AWS CLI.

See the [Configuration Guide](docs/configuration.md) for full details.

## Installation

```bash
# Install globally
npm install -g vibex-task-manager

# OR install locally within your project
npm install vibex-task-manager
```

### Initialize a new project

```bash
# If installed globally
vibex-task-manager init

# If installed locally
npx vibex-task-manager init
```

This will prompt you for project details and set up a new project with the necessary files and structure.

### Important Notes

1. **ES Modules Configuration:**

   - This project uses ES Modules (ESM) instead of CommonJS.
   - This is set via `"type": "module"` in your package.json.
   - Use `import/export` syntax instead of `require()`.
   - Files should use `.js` or `.mjs` extensions.
   - To use a CommonJS module, either:
     - Rename it with `.cjs` extension
     - Use `await import()` for dynamic imports
   - If you need CommonJS throughout your project, remove `"type": "module"` from package.json, but Task Manager scripts expect ESM.

2. AWS Bedrock access must be enabled in your AWS account, with model access requested for the models you want to use.

## Quick Start with Global Commands

After installing the package globally, you can use these CLI commands from any directory:

```bash
# Initialize a new project
vibex-task-manager init

# Parse a PRD and generate tasks
vibex-task-manager parse-prd your-prd.txt

# List all tasks
vibex-task-manager list

# Show the next task to work on
vibex-task-manager next

# Generate task files
vibex-task-manager generate
```

## Troubleshooting

### If `vibex-task-manager init` doesn't respond:

Try running it with Node directly:

```bash
node node_modules/vibex-task-manager/scripts/init.js
```

Or clone the repository and run:

```bash
git clone https://github.com/vibex/vibex-task-manager.git
cd vibex-task-manager
node scripts/init.js
```

## Task Structure

Tasks in tasks.json have the following structure:

- `id`: Unique identifier for the task (Example: `1`)
- `title`: Brief, descriptive title of the task (Example: `"Initialize Repo"`)
- `description`: Concise description of what the task involves (Example: `"Create a new repository, set up initial structure."`)
- `status`: Current state of the task (Example: `"pending"`, `"done"`, `"deferred"`)
- `dependencies`: IDs of tasks that must be completed before this task (Example: `[1, 2]`)
  - Dependencies are displayed with status indicators (✅ for completed, ⏱️ for pending)
  - This helps quickly identify which prerequisite tasks are blocking work
- `priority`: Importance level of the task (Example: `"high"`, `"medium"`, `"low"`)
- `details`: In-depth implementation instructions (Example: `"Use GitHub client ID/secret, handle callback, set session token."`)
- `testStrategy`: Verification approach (Example: `"Deploy and call endpoint to confirm 'Hello World' response."`)
- `subtasks`: List of smaller, more specific tasks that make up the main task (Example: `[{"id": 1, "title": "Configure OAuth", ...}]`)

## Integrating with Cursor AI

Vibex Task Manager is designed to work seamlessly with [Cursor AI](https://www.cursor.so/) and other MCP-compatible editors, providing a structured workflow for AI-driven development using AWS Bedrock.

### Setup with Cursor

1. After initializing your project, open it in Cursor
2. The `.cursor/rules/dev_workflow.mdc` file is automatically loaded by Cursor, providing the AI with knowledge about the task management system
3. Place your PRD document in the `scripts/` directory (e.g., `scripts/prd.txt`)
4. Open Cursor's AI chat and switch to Agent mode

### Setting up MCP in Cursor

To enable enhanced task management capabilities directly within Cursor using the Model Control Protocol (MCP):

1. Go to Cursor settings
2. Navigate to the MCP section
3. Click on "Add New MCP Server"
4. Configure with the following details:
   - Name: "Vibex Task Manager"
   - Type: "Command"
   - Command: "npx -y vibex-task-manager"
5. Save the settings

Once configured, you can interact with Vibex Task Manager's task management commands directly through Cursor's interface, providing a more integrated experience with AWS Bedrock-powered AI.

### Initial Task Generation

In Cursor's AI chat, instruct the agent to generate tasks from your PRD:

```
Please use the vibex-task-manager parse-prd command to generate tasks from my PRD. The PRD is located at scripts/prd.txt.
```

The agent will execute:

```bash
vibex-task-manager parse-prd scripts/prd.txt
```

This will:

- Parse your PRD document
- Generate a structured `tasks.json` file with tasks, dependencies, priorities, and test strategies
- The agent will understand this process due to the Cursor rules

### Generate Individual Task Files

Next, ask the agent to generate individual task files:

```
Please generate individual task files from tasks.json
```

The agent will execute:

```bash
vibex-task-manager generate
```

This creates individual task files in the `tasks/` directory (e.g., `task_001.txt`, `task_002.txt`), making it easier to reference specific tasks.

## AI-Driven Development Workflow

The Cursor agent is pre-configured (via the rules file) to follow this workflow:

### 1. Task Discovery and Selection

Ask the agent to list available tasks:

```
What tasks are available to work on next?
```

The agent will:

- Run `vibex-task-manager list` to see all tasks
- Run `vibex-task-manager next` to determine the next task to work on
- Analyze dependencies to determine which tasks are ready to be worked on
- Prioritize tasks based on priority level and ID order
- Suggest the next task(s) to implement

### 2. Task Implementation

When implementing a task, the agent will:

- Reference the task's details section for implementation specifics
- Consider dependencies on previous tasks
- Follow the project's coding standards
- Create appropriate tests based on the task's testStrategy

You can ask:

```
Let's implement task 3. What does it involve?
```

### 3. Task Verification

Before marking a task as complete, verify it according to:

- The task's specified testStrategy
- Any automated tests in the codebase
- Manual verification if required

### 4. Task Completion

When a task is completed, tell the agent:

```
Task 3 is now complete. Please update its status.
```

The agent will execute:

```bash
vibex-task-manager set-status --id=3 --status=done
```

### 5. Handling Implementation Drift

If during implementation, you discover that:

- The current approach differs significantly from what was planned
- Future tasks need to be modified due to current implementation choices
- New dependencies or requirements have emerged

Tell the agent:

```
We've changed our approach. We're now using Express instead of Fastify. Please update all future tasks to reflect this change.
```

The agent will execute:

```bash
vibex-task-manager update --from=4 --prompt="Now we are using Express instead of Fastify."
```

This will rewrite or re-scope subsequent tasks in tasks.json while preserving completed work.

### 6. Breaking Down Complex Tasks

For complex tasks that need more granularity:

```
Task 5 seems complex. Can you break it down into subtasks?
```

The agent will execute:

```bash
vibex-task-manager expand --id=5 --num=3
```

You can provide additional context:

```
Please break down task 5 with a focus on security considerations.
```

The agent will execute:

```bash
vibex-task-manager expand --id=5 --prompt="Focus on security aspects"
```

You can also expand all pending tasks:

```
Please break down all pending tasks into subtasks.
```

The agent will execute:

```bash
vibex-task-manager expand --all
```

For research-backed subtask generation using Perplexity AI:

```
Please break down task 5 using research-backed generation.
```

The agent will execute:

```bash
vibex-task-manager expand --id=5 --research
```

## Command Reference

Here's a comprehensive reference of all available commands:

### Parse PRD

```bash
# Parse a PRD file and generate tasks
vibex-task-manager parse-prd <prd-file.txt>

# Limit the number of tasks generated
vibex-task-manager parse-prd <prd-file.txt> --num-tasks=10
```

### List Tasks

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

### Show Next Task

```bash
# Show the next task to work on based on dependencies and status
vibex-task-manager next
```

### Show Specific Task

```bash
# Show details of a specific task
vibex-task-manager show <id>
# or
vibex-task-manager show --id=<id>

# View a specific subtask (e.g., subtask 2 of task 1)
vibex-task-manager show 1.2
```

### Update Tasks

```bash
# Update tasks from a specific ID and provide context
vibex-task-manager update --from=<id> --prompt="<prompt>"
```

### Generate Task Files

```bash
# Generate individual task files from tasks.json
vibex-task-manager generate
```

### Set Task Status

```bash
# Set status of a single task
vibex-task-manager set-status --id=<id> --status=<status>

# Set status for multiple tasks
vibex-task-manager set-status --id=1,2,3 --status=<status>

# Set status for subtasks
vibex-task-manager set-status --id=1.1,1.2 --status=<status>
```

When marking a task as "done", all of its subtasks will automatically be marked as "done" as well.

### Expand Tasks

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

### Clear Subtasks

```bash
# Clear subtasks from a specific task
vibex-task-manager clear-subtasks --id=<id>

# Clear subtasks from multiple tasks
vibex-task-manager clear-subtasks --id=1,2,3

# Clear subtasks from all tasks
vibex-task-manager clear-subtasks --all
```

### Analyze Task Complexity

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

### View Complexity Report

```bash
# Display the task complexity analysis report
vibex-task-manager complexity-report

# View a report at a custom location
vibex-task-manager complexity-report --file=my-report.json
```

### Managing Task Dependencies

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

### Add a New Task

```bash
# Add a new task using AI
vibex-task-manager add-task --prompt="Description of the new task"

# Add a task with dependencies
vibex-task-manager add-task --prompt="Description" --dependencies=1,2,3

# Add a task with priority
vibex-task-manager add-task --prompt="Description" --priority=high
```

## Feature Details

### Analyzing Task Complexity

The `analyze-complexity` command:

- Analyzes each task using AI to assess its complexity on a scale of 1-10
- Recommends optimal number of subtasks based on configured DEFAULT_SUBTASKS
- Generates tailored prompts for expanding each task
- Creates a comprehensive JSON report with ready-to-use commands
- Saves the report to scripts/task-complexity-report.json by default

The generated report contains:

- Complexity analysis for each task (scored 1-10)
- Recommended number of subtasks based on complexity
- AI-generated expansion prompts customized for each task
- Ready-to-run expansion commands directly within each task analysis

### Viewing Complexity Report

The `complexity-report` command:

- Displays a formatted, easy-to-read version of the complexity analysis report
- Shows tasks organized by complexity score (highest to lowest)
- Provides complexity distribution statistics (low, medium, high)
- Highlights tasks recommended for expansion based on threshold score
- Includes ready-to-use expansion commands for each complex task
- If no report exists, offers to generate one on the spot

### Smart Task Expansion

The `expand` command automatically checks for and uses the complexity report:

When a complexity report exists:

- Tasks are automatically expanded using the recommended subtask count and prompts
- When expanding all tasks, they're processed in order of complexity (highest first)
- Research-backed generation is preserved from the complexity analysis
- You can still override recommendations with explicit command-line options

Example workflow:

```bash
# Generate the complexity analysis report with research capabilities
vibex-task-manager analyze-complexity --research

# Review the report in a readable format
vibex-task-manager complexity-report

# Expand tasks using the optimized recommendations
vibex-task-manager expand --id=8
# or expand all tasks
vibex-task-manager expand --all
```

### Finding the Next Task

The `next` command:

- Identifies tasks that are pending/in-progress and have all dependencies satisfied
- Prioritizes tasks by priority level, dependency count, and task ID
- Displays comprehensive information about the selected task:
  - Basic task details (ID, title, priority, dependencies)
  - Implementation details
  - Subtasks (if they exist)
- Provides contextual suggested actions:
  - Command to mark the task as in-progress
  - Command to mark the task as done
  - Commands for working with subtasks

### Viewing Specific Task Details

The `show` command:

- Displays comprehensive details about a specific task or subtask
- Shows task status, priority, dependencies, and detailed implementation notes
- For parent tasks, displays all subtasks and their status
- For subtasks, shows parent task relationship
- Provides contextual action suggestions based on the task's state
- Works with both regular tasks and subtasks (using the format taskId.subtaskId)

## Best Practices for AI-Driven Development

1. **Start with a detailed PRD**: The more detailed your PRD, the better the generated tasks will be.

2. **Review generated tasks**: After parsing the PRD, review the tasks to ensure they make sense and have appropriate dependencies.

3. **Analyze task complexity**: Use the complexity analysis feature to identify which tasks should be broken down further.

4. **Follow the dependency chain**: Always respect task dependencies - the Cursor agent will help with this.

5. **Update as you go**: If your implementation diverges from the plan, use the update command to keep future tasks aligned with your current approach.

6. **Break down complex tasks**: Use the expand command to break down complex tasks into manageable subtasks.

7. **Regenerate task files**: After any updates to tasks.json, regenerate the task files to keep them in sync.

8. **Communicate context to the agent**: When asking the Cursor agent to help with a task, provide context about what you're trying to achieve.

9. **Validate dependencies**: Periodically run the validate-dependencies command to check for invalid or circular dependencies.

## Example Cursor AI Interactions

### Starting a new project

```
I've just initialized a new project with Vibex Task Manager. I have a PRD at scripts/prd.txt.
Can you help me parse it and set up the initial tasks?
```

### Working on tasks

```
What's the next task I should work on? Please consider dependencies and priorities.
```

### Implementing a specific task

```
I'd like to implement task 4. Can you help me understand what needs to be done and how to approach it?
```

### Managing subtasks

```
I need to regenerate the subtasks for task 3 with a different approach. Can you help me clear and regenerate them?
```

### Handling changes

```
We've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks to reflect this change?
```

### Completing work

```
I've finished implementing the authentication system described in task 2. All tests are passing.
Please mark it as complete and tell me what I should work on next.
```

### Analyzing complexity

```
Can you analyze the complexity of our tasks to help me understand which ones need to be broken down further?
```

### Viewing complexity report

```
Can you show me the complexity report in a more readable format?
```
