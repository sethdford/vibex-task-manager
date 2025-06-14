# Vibex Task Manager Tutorial

This tutorial will guide you through setting up and using Vibex Task Manager for AI-driven development.

## Initial Setup

There are two ways to set up Vibex Task Manager: using MCP (recommended) or via npm installation.

### Option 1: Using MCP (Recommended)

MCP (Model Control Protocol) provides the easiest way to get started with Vibex Task Manager directly in your editor.

1. **Install the package**

```bash
npm i -g vibex-task-manager
```

2. **Add the MCP config to your IDE/MCP Client** (Cursor is recommended, but it works with other clients):

```json
{
  "mcpServers": {
    "vibex-task-manager": {
      "command": "npx",
      "args": ["-y", "--package=vibex-task-manager", "vibex-task-manager"],
      "env": {
        "AWS_PROFILE": "your-aws-profile",
        "AWS_DEFAULT_REGION": "us-east-1"
      }
    }
  }
}
```

**IMPORTANT:** AWS credentials are _required_ to use Vibex Task Manager with AWS Bedrock. Configure them using:
- **AWS CLI:** Run `aws configure` to set up credentials
- **Environment Variables:** Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- **IAM Roles:** Automatic when running on EC2/Lambda

**To use AI commands in CLI** you MUST have AWS credentials configured
**To use AI commands in MCP** you MUST have AWS credentials in the mcp.json file or AWS CLI configured

Ensure you have enabled model access in AWS Bedrock console for Claude and Titan models.

3. **Enable the MCP** in your editor settings

4. **Prompt the AI** to initialize Vibex Task Manager:

```
Can you please initialize vibex-task-manager-ai into my project?
```

The AI will:

- Create necessary project structure
- Set up initial configuration files
- Guide you through the rest of the process

5. Place your PRD document in the `.vibex-task-manager/docs/` directory (e.g., `.vibex-task-manager/docs/prd.txt`)

6. **Use natural language commands** to interact with Vibex Task Manager:

```
Can you parse my PRD at .vibex-task-manager/docs/prd.txt?
What's the next task I should work on?
Can you help me implement task 3?
```

### Option 2: Manual Installation

If you prefer to use the command line interface directly:

```bash
# Install globally
npm install -g vibex-task-manager

# OR install locally within your project
npm install vibex-task-manager
```

Initialize a new project with **Automatic Model Detection** (New in v0.17.3!):

```bash
# If installed globally
vibex-task-manager init

# If installed locally
npx vibex-task-manager init
```

**During initialization, Vibex Task Manager will automatically:**
1. 🔍 Detect your AWS credentials
2. 🎯 Scan for available Claude models in your region
3. 💡 Configure optimal model selection
4. ✅ Set up your project with zero manual configuration

If AWS credentials aren't found, you'll receive helpful instructions on how to set them up. You can also run model detection manually:

```bash
# Manually detect available models
vibex-task-manager config-detect

# Detect in a specific region
vibex-task-manager config-detect --region us-west-2
```

## Common Commands

After setting up Vibex Task Manager, you can use these commands (either via AI prompts or CLI):

```bash
# Parse a PRD and generate tasks
vibex-task-manager parse-prd your-prd.txt

# List all tasks
vibex-task-manager list

# Show the next task to work on
vibex-task-manager next

# Generate task files
vibex-task-manager generate
```

## Setting up Cursor AI Integration

Vibex Task Manager is designed to work seamlessly with [Cursor AI](https://www.cursor.so/), providing a structured workflow for AI-driven development.

### Using Cursor with MCP (Recommended)

If you've already set up Vibex Task Manager with MCP in Cursor, the integration is automatic. You can simply use natural language to interact with Vibex Task Manager:

```
What tasks are available to work on next?
Can you analyze the complexity of our tasks?
I'd like to implement task 4. What does it involve?
```

### Manual Cursor Setup

If you're not using MCP, you can still set up Cursor integration:

1. After initializing your project, open it in Cursor
2. The `.cursor/rules/dev_workflow.mdc` file is automatically loaded by Cursor, providing the AI with knowledge about the task management system
3. Place your PRD document in the `.vibex-task-manager/docs/` directory (e.g., `.vibex-task-manager/docs/prd.txt`)
4. Open Cursor's AI chat and switch to Agent mode

### Alternative MCP Setup in Cursor

You can also set up the MCP server in Cursor settings:

1. Go to Cursor settings
2. Navigate to the MCP section
3. Click on "Add New MCP Server"
4. Configure with the following details:
   - Name: "Vibex Task Manager"
   - Type: "Command"
   - Command: "npx -y --package=vibex-task-manager-ai vibex-task-manager-ai"
5. Save the settings

Once configured, you can interact with Vibex Task Manager's task management commands directly through Cursor's interface, providing a more integrated experience.

## Initial Task Generation

In Cursor's AI chat, instruct the agent to generate tasks from your PRD:

```
Please use the vibex-task-manager parse-prd command to generate tasks from my PRD. The PRD is located at .vibex-task-manager/docs/prd.txt.
```

The agent will execute:

```bash
vibex-task-manager parse-prd .vibex-task-manager/docs/prd.txt
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
We've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks (from ID 4) to reflect this change?
```

The agent will execute:

```bash
vibex-task-manager update --from=4 --prompt="Now we are using MongoDB instead of PostgreSQL."

# OR, if research is needed to find best practices for MongoDB:
vibex-task-manager update --from=4 --prompt="Update to use MongoDB, researching best practices" --research
```

This will rewrite or re-scope subsequent tasks in tasks.json while preserving completed work.

### 6. Reorganizing Tasks

If you need to reorganize your task structure:

```
I think subtask 5.2 would fit better as part of task 7 instead. Can you move it there?
```

The agent will execute:

```bash
vibex-task-manager move --from=5.2 --to=7.3
```

You can reorganize tasks in various ways:

- Moving a standalone task to become a subtask: `--from=5 --to=7`
- Moving a subtask to become a standalone task: `--from=5.2 --to=7`
- Moving a subtask to a different parent: `--from=5.2 --to=7.3`
- Reordering subtasks within the same parent: `--from=5.2 --to=5.4`
- Moving a task to a new ID position: `--from=5 --to=25` (even if task 25 doesn't exist yet)
- Moving multiple tasks at once: `--from=10,11,12 --to=16,17,18` (must have same number of IDs, Taskmaster will look through each position)

When moving tasks to new IDs:

- The system automatically creates placeholder tasks for non-existent destination IDs
- This prevents accidental data loss during reorganization
- Any tasks that depend on moved tasks will have their dependencies updated
- When moving a parent task, all its subtasks are automatically moved with it and renumbered

This is particularly useful as your project understanding evolves and you need to refine your task structure.

### 7. Resolving Merge Conflicts with Tasks

When working with a team, you might encounter merge conflicts in your tasks.json file if multiple team members create tasks on different branches. The move command makes resolving these conflicts straightforward:

```
I just merged the main branch and there's a conflict with tasks.json. My teammates created tasks 10-15 while I created tasks 10-12 on my branch. Can you help me resolve this?
```

The agent will help you:

1. Keep your teammates' tasks (10-15)
2. Move your tasks to new positions to avoid conflicts:

```bash
# Move your tasks to new positions (e.g., 16-18)
vibex-task-manager move --from=10 --to=16
vibex-task-manager move --from=11 --to=17
vibex-task-manager move --from=12 --to=18
```

This approach preserves everyone's work while maintaining a clean task structure, making it much easier to handle task conflicts than trying to manually merge JSON files.

### 8. Breaking Down Complex Tasks

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

For research-backed subtask generation using the configured research model:

```
Please break down task 5 using research-backed generation.
```

The agent will execute:

```bash
vibex-task-manager expand --id=5 --research
```

## Example Cursor AI Interactions

### Starting a new project

```
I've just initialized a new project with Claude Vibex Task Manager. I have a PRD at .vibex-task-manager/docs/prd.txt.
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
