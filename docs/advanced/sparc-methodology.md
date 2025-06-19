# SPARC Methodology

The **SPARC** methodology is a structured, five-phase workflow integrated into Vibex Task Manager to tackle complex tasks with the assistance of AI. It ensures a systematic approach to problem-solving, from initial definition to final validation.

The five phases are:
1.  **S**pecification: Define clear requirements and acceptance criteria.
2.  **P**seudocode: Design the high-level logic and flow.
3.  **A**rchitecture: Define the components, data structures, and agent roles.
4.  **R**efinement: Develop and test the solution iteratively.
5.  **C**ompletion: Validate that the final solution meets all requirements.

## How It Works

When you enable SPARC for a task, Vibex Task Manager creates a structured workflow. You can then use the `vibex-task-manager sparc` commands to move through the phases. At each step, you can leverage AI (powered by your configured Bedrock models) to generate artifacts like requirements documents, pseudocode, architectural diagrams, and test cases.

## CLI Commands

All SPARC-related commands are available under the `vibex-task-manager sparc` subcommand.

### `sparc enable <taskId>`
Enables the SPARC methodology for a specific task. This initializes the SPARC data structure for the task.

```bash
vibex-task-manager sparc enable 12
```

### `sparc disable <taskId>`
Disables and removes all SPARC data from a task.

```bash
vibex-task-manager sparc disable 12
```

### `sparc progress <taskId>`
Shows the current status of the SPARC workflow for a task, including the current phase and the status of all five phases.

```bash
vibex-task-manager sparc progress 12
```

### `sparc advance <taskId> <phase>`
Advances the task to the specified phase (`specification`, `pseudocode`, `architecture`, `refinement`, or `completion`).

```bash
vibex-task-manager sparc advance 12 pseudocode
```

### AI Generation Commands
These commands use AI to generate artifacts for the current or specified phase.

-   **`sparc generate-requirements <taskId>`**
    Generates a list of detailed requirements for the `Specification` phase.

-   **`sparc generate-pseudocode <taskId>`**
    Generates agent coordination logic and a task flow diagram for the `Pseudocode` phase.

-   **`sparc generate-architecture <taskId>`**
    Generates a description of the swarm structure and defines agent roles for the `Architecture` phase.

-   **`sparc generate-tests <taskId>`**
    Generates a list of test cases for the `Refinement` phase.

### `sparc validate <taskId>`
Runs a series of checks to validate the `Completion` phase, ensuring all previous phases are complete and build/test validations have passed.

```bash
vibex-task-manager sparc validate 12
```

## Example Workflow

Here is a complete example of using the SPARC methodology on a task.

```bash
# Start with a complex task (ID: 15)
vibex-task-manager show 15

# 1. Enable SPARC
vibex-task-manager sparc enable 15

# 2. Specification Phase
vibex-task-manager sparc advance 15 specification
vibex-task-manager sparc generate-requirements 15
# Review and manually edit requirements if needed

# 3. Pseudocode Phase
vibex-task-manager sparc advance 15 pseudocode
vibex-task-manager sparc generate-pseudocode 15
# Review and refine the generated logic

# 4. Architecture Phase
vibex-task-manager sparc advance 15 architecture
vibex-task-manager sparc generate-architecture 15
# Review the proposed architecture

# 5. Refinement Phase
vibex-task-manager sparc advance 15 refinement
vibex-task-manager sparc generate-tests 15
# Begin implementation, using the generated tests in a TDD approach

# 6. Completion Phase
vibex-task-manager sparc advance 15 completion
# Manually update the task's SPARC data to reflect build/test status
# For example: updateSparcPhase(15, 'completion', { buildValidation: true })

# 7. Validate
vibex-task-manager sparc validate 15
``` 