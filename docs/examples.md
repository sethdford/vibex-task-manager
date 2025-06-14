# Example Cursor AI Interactions

Here are some common interactions with Cursor AI when using Vibex Task Manager:

## Starting a new project (with Auto-Detection!)

```
Initialize vibex-task-manager in my project
```

**What happens automatically (v0.17.3+):**
- ✅ Detects your AWS credentials
- ✅ Scans for available Claude models in your region
- ✅ Configures optimal model selection
- ✅ Sets up your project with zero manual configuration

If you need to manually check available models:
```
Can you detect what AWS Bedrock models I have access to?
```

## Parsing a PRD

```
I've just initialized a new project with Claude Vibex Task Manager. I have a PRD at .vibex-task-manager/docs/prd.txt.
Can you help me parse it and set up the initial tasks?
```

## Working on tasks

```
What's the next task I should work on? Please consider dependencies and priorities.
```

## Implementing a specific task

```
I'd like to implement task 4. Can you help me understand what needs to be done and how to approach it?
```

## Managing subtasks

```
I need to regenerate the subtasks for task 3 with a different approach. Can you help me clear and regenerate them?
```

## Handling changes

```
I've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks to reflect this change?
```

## Completing work

```
I've finished implementing the authentication system described in task 2. All tests are passing.
Please mark it as complete and tell me what I should work on next.
```

## Reorganizing tasks

```
I think subtask 5.2 would fit better as part of task 7. Can you move it there?
```

(Agent runs: `vibex-task-manager move --from=5.2 --to=7.3`)

```
Task 8 should actually be a subtask of task 4. Can you reorganize this?
```

(Agent runs: `vibex-task-manager move --from=8 --to=4.1`)

```
I just merged the main branch and there's a conflict in tasks.json. My teammates created tasks 10-15 on their branch while I created tasks 10-12 on my branch. Can you help me resolve this by moving my tasks?
```

(Agent runs:

```bash
vibex-task-manager move --from=10 --to=16
vibex-task-manager move --from=11 --to=17
vibex-task-manager move --from=12 --to=18
```

)

## Analyzing complexity

```
Can you analyze the complexity of our tasks to help me understand which ones need to be broken down further?
```

## Viewing complexity report

```
Can you show me the complexity report in a more readable format?
```

### Breaking Down Complex Tasks

```
Task 5 seems complex. Can you break it down into subtasks?
```

(Agent runs: `vibex-task-manager expand --id=5`)

```
Please break down task 5 using research-backed generation.
```

(Agent runs: `vibex-task-manager expand --id=5 --research`)

### Updating Tasks with Research

```
We need to update task 15 based on the latest React Query v5 changes. Can you research this and update the task?
```

(Agent runs: `vibex-task-manager update-task --id=15 --prompt="Update based on React Query v5 changes" --research`)

### Adding Tasks with Research

```
Please add a new task to implement user profile image uploads using Cloudinary, research the best approach.
```

(Agent runs: `vibex-task-manager add-task --prompt="Implement user profile image uploads using Cloudinary" --research`)
