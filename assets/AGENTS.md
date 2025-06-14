# Task Manager AI - Claude Code Integration Guide

## Essential Commands

### Core Workflow Commands

```bash
# Project Setup
vibex-task-manager init                                    # Initialize Task Manager in current project
vibex-task-manager parse-prd .taskmaster/docs/prd.txt      # Generate tasks from PRD document
vibex-task-manager models --setup                        # Configure AI models interactively

# Daily Development Workflow
vibex-task-manager list                                   # Show all tasks with status
vibex-task-manager next                                   # Get next available task to work on
vibex-task-manager show <id>                             # View detailed task information (e.g., vibex-task-manager show 1.2)
vibex-task-manager set-status --id=<id> --status=done    # Mark task complete

# Task Management
vibex-task-manager add-task --prompt="description" --research        # Add new task with AI assistance
vibex-task-manager expand --id=<id> --research --force              # Break task into subtasks
vibex-task-manager update-task --id=<id> --prompt="changes"         # Update specific task
vibex-task-manager update --from=<id> --prompt="changes"            # Update multiple tasks from ID onwards
vibex-task-manager update-subtask --id=<id> --prompt="notes"        # Add implementation notes to subtask

# Analysis & Planning
vibex-task-manager analyze-complexity --research          # Analyze task complexity
vibex-task-manager complexity-report                      # View complexity analysis
vibex-task-manager expand --all --research               # Expand all eligible tasks

# Dependencies & Organization
vibex-task-manager add-dependency --id=<id> --depends-on=<id>       # Add task dependency
vibex-task-manager move --from=<id> --to=<id>                       # Reorganize task hierarchy
vibex-task-manager validate-dependencies                            # Check for dependency issues
vibex-task-manager generate                                         # Update task markdown files (usually auto-called)
```

## Key Files & Project Structure

### Core Files

- `.taskmaster/tasks/tasks.json` - Main task data file (auto-managed)
- `.taskmaster/config.json` - AI model configuration (use `vibex-task-manager models` to modify)
- `.taskmaster/docs/prd.txt` - Product Requirements Document for parsing
- `.taskmaster/tasks/*.txt` - Individual task files (auto-generated from tasks.json)
- `.env` - API keys for CLI usage

### Claude Code Integration Files

- `CLAUDE.md` - Auto-loaded context for Claude Code (this file)
- `.claude/settings.json` - Claude Code tool allowlist and preferences
- `.claude/commands/` - Custom slash commands for repeated workflows
- `.mcp.json` - MCP server configuration (project-specific)

### Directory Structure

```
project/
├── .taskmaster/
│   ├── tasks/              # Task files directory
│   │   ├── tasks.json      # Main task database
│   │   ├── task-1.md      # Individual task files
│   │   └── task-2.md
│   ├── docs/              # Documentation directory
│   │   ├── prd.txt        # Product requirements
│   ├── reports/           # Analysis reports directory
│   │   └── task-complexity-report.json
│   ├── templates/         # Template files
│   │   └── example_prd.txt  # Example PRD template
│   └── config.json        # AI models & settings
├── .claude/
│   ├── settings.json      # Claude Code configuration
│   └── commands/         # Custom slash commands
├── .env                  # API keys
├── .mcp.json            # MCP configuration
└── CLAUDE.md            # This file - auto-loaded by Claude Code
```

## MCP Integration

Task Manager provides an MCP server that Claude Code can connect to. Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "vibex-task-manager-ai": {
      "command": "npx",
      "args": ["-y", "--package=vibex-task-manager-ai", "vibex-task-manager-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your_key_here",
        "PERPLEXITY_API_KEY": "your_key_here",
        "OPENAI_API_KEY": "OPENAI_API_KEY_HERE",
        "GOOGLE_API_KEY": "GOOGLE_API_KEY_HERE",
        "XAI_API_KEY": "XAI_API_KEY_HERE",
        "OPENROUTER_API_KEY": "OPENROUTER_API_KEY_HERE",
        "MISTRAL_API_KEY": "MISTRAL_API_KEY_HERE",
        "AZURE_OPENAI_API_KEY": "AZURE_OPENAI_API_KEY_HERE",
        "OLLAMA_API_KEY": "OLLAMA_API_KEY_HERE"
      }
    }
  }
}
```

### Essential MCP Tools

```javascript
help; // = shows available taskmaster commands
// Project setup
initialize_project; // = vibex-task-manager init
parse_prd; // = vibex-task-manager parse-prd

// Daily workflow
get_tasks; // = vibex-task-manager list
next_task; // = vibex-task-manager next
get_task; // = vibex-task-manager show <id>
set_task_status; // = vibex-task-manager set-status

// Task management
add_task; // = vibex-task-manager add-task
expand_task; // = vibex-task-manager expand
update_task; // = vibex-task-manager update-task
update_subtask; // = vibex-task-manager update-subtask
update; // = vibex-task-manager update

// Analysis
analyze_project_complexity; // = vibex-task-manager analyze-complexity
complexity_report; // = vibex-task-manager complexity-report
```

## Claude Code Workflow Integration

### Standard Development Workflow

#### 1. Project Initialization

```bash
# Initialize Task Manager
vibex-task-manager init

# Create or obtain PRD, then parse it
vibex-task-manager parse-prd .taskmaster/docs/prd.txt

# Analyze complexity and expand tasks
vibex-task-manager analyze-complexity --research
vibex-task-manager expand --all --research
```

If tasks already exist, another PRD can be parsed (with new information only!) using parse-prd with --append flag. This will add the generated tasks to the existing list of tasks..

#### 2. Daily Development Loop

```bash
# Start each session
vibex-task-manager next                           # Find next available task
vibex-task-manager show <id>                     # Review task details

# During implementation, check in code context into the tasks and subtasks
vibex-task-manager update-subtask --id=<id> --prompt="implementation notes..."

# Complete tasks
vibex-task-manager set-status --id=<id> --status=done
```

#### 3. Multi-Claude Workflows

For complex projects, use multiple Claude Code sessions:

```bash
# Terminal 1: Main implementation
cd project && claude

# Terminal 2: Testing and validation
cd project-test-worktree && claude

# Terminal 3: Documentation updates
cd project-docs-worktree && claude
```

### Custom Slash Commands

Create `.claude/commands/taskmaster-next.md`:

```markdown
Find the next available Task Manager task and show its details.

Steps:

1. Run `vibex-task-manager next` to get the next task
2. If a task is available, run `vibex-task-manager show <id>` for full details
3. Provide a summary of what needs to be implemented
4. Suggest the first implementation step
```

Create `.claude/commands/taskmaster-complete.md`:

```markdown
Complete a Task Manager task: $ARGUMENTS

Steps:

1. Review the current task with `vibex-task-manager show $ARGUMENTS`
2. Verify all implementation is complete
3. Run any tests related to this task
4. Mark as complete: `vibex-task-manager set-status --id=$ARGUMENTS --status=done`
5. Show the next available task with `vibex-task-manager next`
```

## Tool Allowlist Recommendations

Add to `.claude/settings.json`:

```json
{
  "allowedTools": [
    "Edit",
    "Bash(vibex-task-manager *)",
    "Bash(git commit:*)",
    "Bash(git add:*)",
    "Bash(npm run *)",
    "mcp__task_master_ai__*"
  ]
}
```

## Configuration & Setup

### API Keys Required

At least **one** of these API keys must be configured:

- `ANTHROPIC_API_KEY` (Claude models) - **Recommended**
- `PERPLEXITY_API_KEY` (Research features) - **Highly recommended**
- `OPENAI_API_KEY` (GPT models)
- `GOOGLE_API_KEY` (Gemini models)
- `MISTRAL_API_KEY` (Mistral models)
- `OPENROUTER_API_KEY` (Multiple models)
- `XAI_API_KEY` (Grok models)

An API key is required for any provider used across any of the 3 roles defined in the `models` command.

### Model Configuration

```bash
# Interactive setup (recommended)
vibex-task-manager models --setup

# Set specific models
vibex-task-manager models --set-main claude-3-5-sonnet-20241022
vibex-task-manager models --set-research perplexity-llama-3.1-sonar-large-128k-online
vibex-task-manager models --set-fallback gpt-4o-mini
```

## Task Structure & IDs

### Task ID Format

- Main tasks: `1`, `2`, `3`, etc.
- Subtasks: `1.1`, `1.2`, `2.1`, etc.
- Sub-subtasks: `1.1.1`, `1.1.2`, etc.

### Task Status Values

- `pending` - Ready to work on
- `in-progress` - Currently being worked on
- `done` - Completed and verified
- `deferred` - Postponed
- `cancelled` - No longer needed
- `blocked` - Waiting on external factors

### Task Fields

```json
{
  "id": "1.2",
  "title": "Implement user authentication",
  "description": "Set up JWT-based auth system",
  "status": "pending",
  "priority": "high",
  "dependencies": ["1.1"],
  "details": "Use bcrypt for hashing, JWT for tokens...",
  "testStrategy": "Unit tests for auth functions, integration tests for login flow",
  "subtasks": []
}
```

## Claude Code Best Practices with Task Manager

### Context Management

- Use `/clear` between different tasks to maintain focus
- This CLAUDE.md file is automatically loaded for context
- Use `vibex-task-manager show <id>` to pull specific task context when needed

### Iterative Implementation

1. `vibex-task-manager show <subtask-id>` - Understand requirements
2. Explore codebase and plan implementation
3. `vibex-task-manager update-subtask --id=<id> --prompt="detailed plan"` - Log plan
4. `vibex-task-manager set-status --id=<id> --status=in-progress` - Start work
5. Implement code following logged plan
6. `vibex-task-manager update-subtask --id=<id> --prompt="what worked/didn't work"` - Log progress
7. `vibex-task-manager set-status --id=<id> --status=done` - Complete task

### Complex Workflows with Checklists

For large migrations or multi-step processes:

1. Create a markdown PRD file describing the new changes: `touch task-migration-checklist.md` (prds can be .txt or .md)
2. Use Taskmaster to parse the new prd with `vibex-task-manager parse-prd --append` (also available in MCP)
3. Use Taskmaster to expand the newly generated tasks into subtasks. Consdier using `analyze-complexity` with the correct --to and --from IDs (the new ids) to identify the ideal subtask amounts for each task. Then expand them.
4. Work through items systematically, checking them off as completed
5. Use `vibex-task-manager update-subtask` to log progress on each task/subtask and/or updating/researching them before/during implementation if getting stuck

### Git Integration

Task Manager works well with `gh` CLI:

```bash
# Create PR for completed task
gh pr create --title "Complete task 1.2: User authentication" --body "Implements JWT auth system as specified in task 1.2"

# Reference task in commits
git commit -m "feat: implement JWT auth (task 1.2)"
```

### Parallel Development with Git Worktrees

```bash
# Create worktrees for parallel task development
git worktree add ../project-auth feature/auth-system
git worktree add ../project-api feature/api-refactor

# Run Claude Code in each worktree
cd ../project-auth && claude    # Terminal 1: Auth work
cd ../project-api && claude     # Terminal 2: API work
```

## Troubleshooting

### AI Commands Failing

```bash
# Check API keys are configured
cat .env                           # For CLI usage

# Verify model configuration
vibex-task-manager models

# Test with different model
vibex-task-manager models --set-fallback gpt-4o-mini
```

### MCP Connection Issues

- Check `.mcp.json` configuration
- Verify Node.js installation
- Use `--mcp-debug` flag when starting Claude Code
- Use CLI as fallback if MCP unavailable

### Task File Sync Issues

```bash
# Regenerate task files from tasks.json
vibex-task-manager generate

# Fix dependency issues
vibex-task-manager fix-dependencies
```

DO NOT RE-INITIALIZE. That will not do anything beyond re-adding the same Taskmaster core files.

## Important Notes

### AI-Powered Operations

These commands make AI calls and may take up to a minute:

- `parse_prd` / `vibex-task-manager parse-prd`
- `analyze_project_complexity` / `vibex-task-manager analyze-complexity`
- `expand_task` / `vibex-task-manager expand`
- `expand_all` / `vibex-task-manager expand --all`
- `add_task` / `vibex-task-manager add-task`
- `update` / `vibex-task-manager update`
- `update_task` / `vibex-task-manager update-task`
- `update_subtask` / `vibex-task-manager update-subtask`

### File Management

- Never manually edit `tasks.json` - use commands instead
- Never manually edit `.taskmaster/config.json` - use `vibex-task-manager models`
- Task markdown files in `tasks/` are auto-generated
- Run `vibex-task-manager generate` after manual changes to tasks.json

### Claude Code Session Management

- Use `/clear` frequently to maintain focused context
- Create custom slash commands for repeated Task Manager workflows
- Configure tool allowlist to streamline permissions
- Use headless mode for automation: `claude -p "vibex-task-manager next"`

### Multi-Task Updates

- Use `update --from=<id>` to update multiple future tasks
- Use `update-task --id=<id>` for single task updates
- Use `update-subtask --id=<id>` for implementation logging

### Research Mode

- Add `--research` flag for research-based AI enhancement
- Requires a research model API key like Perplexity (`PERPLEXITY_API_KEY`) in environment
- Provides more informed task creation and updates
- Recommended for complex technical tasks

---

_This guide ensures Claude Code has immediate access to Task Manager's essential functionality for agentic development workflows._
