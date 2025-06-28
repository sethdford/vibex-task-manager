import 'dotenv/config';
import { ProjectContext } from '../context/ProjectContext.js';
import { BedrockClient, CLAUDE_MODELS } from '../core/bedrock-client.js';
import { AnthropicClient } from '../core/anthropic-client.js';
import type { ClaudeModelId } from '../core/bedrock-client.js';
import { ActionPlan } from '../types/actions.js';

export interface ConversationResponse {
  output: string;
  actionPlan?: ActionPlan;
  actions?: Array<{
    description: string;
    result?: string;
  }>;
  suggestedNext?: string[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

export interface ConversationOptions {
  model?: string;
  verbose?: boolean;
  withTasks?: boolean;
  useClaudeCode?: boolean;
}

export class ConversationManager {
  private conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }> = [];
  
  private useClaudeCode: boolean = false;
  private useBedrock: boolean = false;

  constructor(projectContext: ProjectContext, options?: { useClaudeCode?: boolean }) {
    this.useClaudeCode = options?.useClaudeCode || false;
    // Check configuration as per Claude Code documentation
    this.useBedrock = process.env.CLAUDE_CODE_USE_BEDROCK === '1';
    
    // Validate configuration
    if (this.useBedrock) {
      // Validate Bedrock requirements
      if (!process.env.AWS_REGION) {
        throw new Error('AWS_REGION environment variable is required when CLAUDE_CODE_USE_BEDROCK=1');
      }
    } else {
      // Validate Anthropic API requirements
      if (!AnthropicClient.isConfigured()) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required when CLAUDE_CODE_USE_BEDROCK is not set');
      }
    }
  }

  async processInstruction(
    instruction: string,
    projectContext: ProjectContext,
    options: ConversationOptions
  ): Promise<ConversationResponse> {
    // Add user instruction to history
    this.conversationHistory.push({
      role: 'user',
      content: instruction,
      timestamp: new Date()
    });

    let response: ConversationResponse;

    if (options.useClaudeCode || this.useClaudeCode) {
      response = await this.processWithClaudeCode(instruction, projectContext, options);
    } else if (this.useBedrock) {
      response = await this.processWithBedrock(instruction, projectContext, options);
    } else {
      response = await this.processWithAnthropicAPI(instruction, projectContext, options);
    }

    // Add assistant response to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response.output,
      timestamp: new Date()
    });

    return response;
  }

  private async processWithClaudeCode(
    instruction: string,
    projectContext: ProjectContext,
    options: ConversationOptions
  ): Promise<ConversationResponse> {
    try {
      // Execute instruction via Claude Code
      const claudeResult = await this.executeClaudeCode(instruction, options);
      
      // Update task management if --with-tasks is enabled
      if (options.withTasks) {
        await this.updateTasksFromClaudeResult(claudeResult, projectContext);
      }
      
      return {
        output: claudeResult.output,
        actionPlan: claudeResult.actionPlan,
        actions: claudeResult.actions || [],
        suggestedNext: claudeResult.suggestedNext || []
      };
    } catch (error) {
      console.error('Claude Code execution failed, falling back to Bedrock:', error);
      return this.processWithBedrock(instruction, projectContext, options);
    }
  }

  private async executeClaudeCode(
    instruction: string, 
    options: ConversationOptions
  ): Promise<any> {
    // Dynamic import to avoid dependency issues if execa is not installed
    let execa;
    try {
      const execaModule = await import('execa');
      execa = execaModule.execa;
    } catch (error) {
      throw new Error('execa package required for Claude Code integration. Run: npm install execa');
    }

    // Check if Claude Code is available
    try {
      await execa('claude-code', ['--version'], { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Claude Code not found. Install with: npm install -g @anthropic-ai/claude-code');
    }

    // Build Claude Code command arguments
    const args = ['-p', instruction];
    
    if (options.model && options.model !== 'claude-3.5-sonnet') {
      args.push('--model', options.model);
    }
    
    if (options.verbose) {
      args.push('--verbose');
    }

    // Execute Claude Code
    const result = await execa('claude-code', args, {
      cwd: process.cwd(),
      stdio: 'pipe',
      timeout: 300000 // 5 minute timeout
    });

    return this.parseClaudeCodeOutput(result.stdout);
  }

  private parseClaudeCodeOutput(output: string): any {
    // Parse Claude Code output format
    // This is a simplified parser - real implementation would be more robust
    const lines = output.split('\n');
    const actions: Array<{ description: string; result?: string }> = [];
    const suggestedNext: string[] = [];
    
    let currentSection = '';
    let parsedOutput = '';
    
    for (const line of lines) {
      if (line.startsWith('## Actions Taken:')) {
        currentSection = 'actions';
        continue;
      } else if (line.startsWith('## Suggested Next Steps:')) {
        currentSection = 'suggestions';
        continue;
      } else if (line.startsWith('## ')) {
        currentSection = '';
      }
      
      if (currentSection === 'actions' && line.startsWith('- ')) {
        actions.push({
          description: line.substring(2),
          result: 'completed'
        });
      } else if (currentSection === 'suggestions' && line.startsWith('- ')) {
        suggestedNext.push(line.substring(2));
      } else if (!currentSection) {
        parsedOutput += line + '\n';
      }
    }

    // Extract and parse the action plan
    let actionPlan: ActionPlan | undefined = undefined;
    const planMatch = parsedOutput.match(/<plan>([\s\S]*?)<\/plan>/);
    if (planMatch && planMatch[1]) {
      try {
        const planActions = JSON.parse(planMatch[1].trim());
        actionPlan = {
          thought: 'The user wants to make changes.', // Placeholder thought
          actions: planActions
        };
      } catch (e) {
        console.warn('Could not parse action plan:', e);
      }
    }

    return {
      output: parsedOutput.trim() || output,
      actionPlan,
      actions,
      suggestedNext
    };
  }

  private async updateTasksFromClaudeResult(
    claudeResult: any,
    projectContext: ProjectContext
  ): Promise<void> {
    // Integration with vibex task management
    // This would call vibex-task-manager commands to update tasks based on Claude Code results
    
    if (claudeResult.actions && claudeResult.actions.length > 0) {
      // Create task updates based on actions taken
      for (const action of claudeResult.actions) {
        // This is a placeholder - real implementation would integrate with task management system
        console.log(`Task update: ${action.description}`);
      }
    }
  }

  private async processWithBedrock(
    instruction: string,
    projectContext: ProjectContext,
    options: ConversationOptions
  ): Promise<ConversationResponse> {
    try {
      const bedrockClient = new BedrockClient({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      const defaultModels = BedrockClient.getDefaultModels();
      
      // Use model from options, environment, or default
      const model = options.model || defaultModels.primary;

      // Validate model before use
      BedrockClient.validateModel(model);

      const systemMessage = this.buildSystemMessage(projectContext, options);

      // Build conversation messages
      const messages = [
        ...this.conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: instruction
        }
      ];

      // Generate response using Bedrock
      const result = await bedrockClient.generateText({
        model: model as ClaudeModelId,
        messages,
        system: systemMessage,
        maxTokens: 4096,
        temperature: 0.7
      });

      // Parse actions and suggestions from the response
      const parsedResult = this.parseBedrockResponse(result.text);

      // Update task management if --with-tasks is enabled
      if (options.withTasks) {
        await this.updateTasksFromBedrockResult(parsedResult, projectContext);
      }

      return {
        output: result.text,
        actionPlan: parsedResult.actionPlan,
        actions: parsedResult.actions,
        suggestedNext: parsedResult.suggestedNext,
        usage: {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          estimatedCost: result.usage.estimatedCost
        }
      };
    } catch (error) {
      console.error('Bedrock processing failed:', error);
      
      // Return a helpful error response
      return {
        output: `Error processing instruction with Bedrock: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check:\n1. AWS credentials are configured\n2. AWS_REGION environment variable is set\n3. Model access is enabled in Bedrock console\n4. Selected model is available in your region`,
        actionPlan: undefined,
        actions: [{
          description: 'Bedrock processing failed',
          result: 'error'
        }],
        suggestedNext: [
          'Check AWS credentials configuration',
          'Verify AWS_REGION environment variable',
          'Enable model access in Bedrock console',
          'Try a different model or region'
        ]
      };
    }
  }

  private buildSystemMessage(projectContext: ProjectContext, options: ConversationOptions): string {
    const structure = projectContext.getProjectStructure();
    const baseSystem = `You are an expert software developer and project manager. You help developers build high-quality software efficiently.

Project Context:
- Working Directory: ${structure?.root || 'Unknown'}
- Project Type: ${structure?.packageJson?.name ? 'Node.js Project' : 'Unknown'}
- Files: ${structure?.files.length || 0} files tracked
- Git Repository: ${structure?.gitStatus ? 'Yes' : 'No'}

Your responses should be:
1. Practical and actionable
2. Consider the project context
3. Provide specific next steps
4. Include relevant code examples when helpful

When making suggestions, consider the current project state and structure.`;

    if (options.withTasks) {
      return baseSystem + `\n\nTask Management Integration:
- You can suggest task updates based on your analysis
- Break down complex work into manageable tasks
- Consider dependencies between tasks
- Provide clear completion criteria`;
    }

    // Agentic mode prompt for all other cases
    return baseSystem + `\n\nAgentic Mode Instructions:
- You are in agentic mode. Your goal is to complete the user's request by formulating a plan of actions.
- First, think step-by-step about how to solve the request.
- Then, formulate a plan inside a <plan> XML block.
- First, break down the request into tasks and sub-tasks using 'create_task' and 'create_subtask' actions.
- Then, add actions to execute the work, like 'edit_file' or 'run_command'.
-
- Supported actions are: 'create_task', 'create_subtask', 'edit_file', 'run_command'.
- - For 'create_task', provide 'title' and 'description'.
- - For 'create_subtask', provide 'parent_id', 'title', and 'description'.
- - For 'edit_file', provide 'path' and 'content'.
- - For 'run_command', provide 'command'.
- Always provide a 'reasoning' for each action.
- After the <plan> block, explain the plan to the user.

Example:
User: "Create a hello world server in express"

Assistant:
I will create a new file named \`server.js\` and add the basic express server code. Then I will install express.

<plan>
[
  {
    "type": "create_task",
    "title": "Set up Express server",
    "description": "Create the main server file and add a hello world endpoint.",
    "reasoning": "This creates the primary task for this feature."
  },
  {
    "type": "edit_file",
    "path": "server.js",
    "content": "const express = require('express');\\nconst app = express();\\nconst port = 3000;\\n\\napp.get('/', (req, res) => {\\n  res.send('Hello World!');\\n});\\n\\napp.listen(port, () => {\\n  console.log('Example app listening at http://localhost:3000');\\n});",
    "reasoning": "This creates the main server file with a single endpoint."
  },
  {
    "type": "run_command",
    "command": "npm install express",
    "reasoning": "This installs the required express dependency."
  }
]
</plan>
`;
  }

  private parseBedrockResponse(response: string): {
    actions: Array<{ description: string; result?: string }>;
    suggestedNext: string[];
    actionPlan?: ActionPlan;
  } {
    const actions: Array<{ description: string; result?: string }> = [];
    const suggestedNext: string[] = [];

    // Look for action patterns in the response
    const actionPatterns = [
      /(?:I (?:will|would|can|should)|Let me|I'll) ([^.!?\n]+)/gi,
      /(?:Action|Step|Task):\s*([^.\n]+)/gi,
      /(?:Created|Modified|Updated|Added|Removed|Fixed) ([^.\n]+)/gi
    ];

    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        actions.push({
          description: match[1].trim(),
          result: 'suggested'
        });
      }
    }

    // Look for next step patterns
    const nextStepPatterns = [
      /(?:Next|Then|After|Subsequently),?\s*([^.!?\n]+)/gi,
      /(?:You (?:should|could|might)|Consider|Try) ([^.!?\n]+)/gi,
      /(?:Recommendation|Suggestion):\s*([^.\n]+)/gi
    ];

    for (const pattern of nextStepPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        suggestedNext.push(match[1].trim());
      }
    }

    // If no specific patterns found, extract general suggestions
    if (actions.length === 0 && suggestedNext.length === 0) {
      actions.push({
        description: 'Analyzed instruction and provided guidance',
        result: 'completed'
      });
      
      suggestedNext.push('Review the provided guidance and implement suggested changes');
    }

    // Extract and parse the action plan
    let actionPlan: ActionPlan | undefined = undefined;
    const planMatch = response.match(/<plan>([\s\S]*?)<\/plan>/);
    if (planMatch && planMatch[1]) {
      try {
        // Clean up the JSON string by fixing common issues
        let planContent = planMatch[1].trim();
        
        // Fix various JSON formatting issues that can occur with AI-generated content
        // Replace problematic content patterns that break JSON parsing
        
        // 1. Fix content strings that contain unescaped newlines
        planContent = planContent.replace(/"content":\s*"([^"]*?)\\n([^"]*?)"/g, (match, before, after) => {
          // Properly escape newlines in content strings
          const fixedContent = (before + '\\n' + after).replace(/\\n/g, '\\\\n');
          return `"content": "${fixedContent}"`;
        });
        
        // 2. More aggressive content fixing for multiline strings
        planContent = planContent.replace(/"content":\s*"([^"]*?)\n([^"]*?)"/g, (match, before, after) => {
          const fixedContent = (before + '\\n' + after).replace(/\n/g, '\\n');
          return `"content": "${fixedContent}"`;
        });
        
        // 3. Remove any trailing commas before closing brackets/braces
        planContent = planContent.replace(/,(\s*[}\]])/g, '$1');
        
        // Try to parse the cleaned JSON
        const planActions = JSON.parse(planContent);
        actionPlan = {
          thought: 'The user wants to make changes.', // Placeholder thought
          actions: planActions
        };
      } catch (e) {
        console.warn('Could not parse action plan:', e);
        
        // Try alternative parsing - extract actions manually using regex
        try {
          const actions: any[] = [];
          
          // Extract each action block manually
          const actionRegex = /\{\s*"type":\s*"([^"]+)"[^}]*\}/g;
          let match;
          
          while ((match = actionRegex.exec(planMatch[1])) !== null) {
            const actionBlock = match[0];
            
            // Extract individual fields manually to avoid JSON parsing issues
            const typeMatch = actionBlock.match(/"type":\s*"([^"]+)"/);
            const titleMatch = actionBlock.match(/"title":\s*"([^"]+)"/);
            const descMatch = actionBlock.match(/"description":\s*"([^"]+)"/);
            const pathMatch = actionBlock.match(/"path":\s*"([^"]+)"/);
            const commandMatch = actionBlock.match(/"command":\s*"([^"]+)"/);
            // Handle content field more carefully - it can span multiple lines and contain escaped quotes
            const contentMatch = actionBlock.match(/"content":\s*"((?:[^"\\]|\\.)*)"/s);
            const parentIdMatch = actionBlock.match(/"parent_id":\s*(\d+)/);
            
            if (typeMatch) {
              const action: any = { type: typeMatch[1] };
              
              if (titleMatch) action.title = titleMatch[1];
              if (descMatch) action.description = descMatch[1];
              if (pathMatch) action.path = pathMatch[1];
              if (commandMatch) action.command = commandMatch[1];
              if (parentIdMatch) action.parent_id = parseInt(parentIdMatch[1]);
              
              // Handle content field specially since it can contain complex strings
              if (contentMatch) {
                let content = contentMatch[1];
                // Unescape common escape sequences properly
                content = content.replace(/\\n/g, '\n')
                               .replace(/\\t/g, '\t')
                               .replace(/\\r/g, '\r')
                               .replace(/\\"/g, '"')
                               .replace(/\\'/g, "'")
                               .replace(/\\\\/g, '\\');
                action.content = content;
              }
              
              actions.push(action);
            }
          }
          
          if (actions.length > 0) {
            actionPlan = {
              thought: 'Manually parsed actions from plan',
              actions: actions
            };
          }
        } catch (altError) {
          console.warn('Manual parsing also failed:', altError);
        }
      }
    }

    return { actions, suggestedNext, actionPlan };
  }

  private async updateTasksFromBedrockResult(
    bedrockResult: { actions: Array<{ description: string; result?: string }> },
    projectContext: ProjectContext
  ): Promise<void> {
    // Integration with vibex task management system
    try {
      // Dynamic import to avoid circular dependencies
      const { updateTaskByIdDirect } = await import('../../mcp-server/src/core/direct-functions/update-task-by-id.js');
      const { listTasksDirect } = await import('../../mcp-server/src/core/direct-functions/list-tasks.js');

      // Create a simple logger for the task functions
      const logger = {
        info: (msg: string) => console.log(`[Task] ${msg}`),
        warn: (msg: string) => console.warn(`[Task] ${msg}`),
        error: (msg: string) => console.error(`[Task] ${msg}`),
        debug: (msg: string) => console.debug(`[Task] ${msg}`)
      };

      // Get current tasks to see if we should update any
      const structure = projectContext.getProjectStructure();
      const tasksJsonPath = structure?.root ? `${structure.root}/.taskmanager/tasks.json` : './tasks.json';
      
      const tasksResult = await listTasksDirect({
        tasksJsonPath,
        status: 'in-progress'
      }, logger);
      
      if (tasksResult.success && tasksResult.data?.tasks.length > 0 && bedrockResult.actions.length > 0) {
        // Find the most recent in-progress task
        const inProgressTask = tasksResult.data.tasks[0];
        
        if (inProgressTask) {
          // Add a note about the Bedrock analysis
          const updateNote = `Bedrock Analysis: ${bedrockResult.actions.map(a => a.description).join('; ')}`;
          
          await updateTaskByIdDirect({
            tasksJsonPath,
            id: inProgressTask.id,
            prompt: updateNote
          }, logger);
          
          console.log(`Updated task ${inProgressTask.id} with Bedrock analysis`);
        }
      }
    } catch (error) {
      console.debug('Task update failed (non-critical):', error);
    }
  }

  private async processWithAnthropicAPI(
    instruction: string,
    projectContext: ProjectContext,
    options: ConversationOptions
  ): Promise<ConversationResponse> {
    try {
      const anthropicClient = new AnthropicClient();
      const defaultModels = AnthropicClient.getDefaultModels();
      
      // Use model from options, environment, or default
      const model = options.model || defaultModels.primary;
      
      const systemMessage = this.buildSystemMessage(projectContext, options);
      
      // Build conversation messages
      const messages = [
        ...this.conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: instruction
        }
      ];

      const response = await anthropicClient.generateTextWithFallback({
        model,
        messages,
        system: systemMessage,
        maxTokens: 4096,
        temperature: 0.7
      });

      // Parse the response for actions and plans
      const parsed = this.parseBedrockResponse(response.text);
      
      return {
        output: response.text,
        actionPlan: parsed.actionPlan,
        actions: parsed.actions,
        suggestedNext: parsed.suggestedNext,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(`Anthropic API processing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getConversationHistory(): Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }> {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  exportHistory(): string {
    return JSON.stringify(this.conversationHistory, null, 2);
  }

  async importHistory(historyJson: string): Promise<void> {
    try {
      const history = JSON.parse(historyJson);
      this.conversationHistory = history.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      throw new Error('Invalid conversation history format');
    }
  }
} 