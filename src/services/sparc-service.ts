/**
 * SPARC Methodology Service
 * Handles the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology
 * for AI-powered task management and development workflows
 */

import { Task, SparcStatus, SparcMethodology } from '../types/core.js';
import BedrockClient, { ClaudeModelId } from '../core/bedrock-client.js';
import { getBedrockModel, getBestModelForTaskCapability } from '../core/bedrock-models.js';
import { ConfigService } from './config-service.js';
import { z } from 'zod';

type TaskGetter = (id: number) => Promise<Task>;
type TaskUpdater = (task: Task) => Promise<Task>;
type TaskPartialUpdater = (id: number, updates: Partial<Task>) => Promise<Task>;

export class SparcService {
  private bedrockClient: BedrockClient;
  private configService: ConfigService;

  constructor(bedrockClient: BedrockClient, configService: ConfigService) {
    this.bedrockClient = bedrockClient;
    this.configService = configService;
  }

  /**
   * Enable SPARC methodology for a task
   */
  async enableSparc(taskId: number, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<Task> {
    const sparc: SparcMethodology = {
      enabled: true,
      currentPhase: 'specification',
      phases: {
        specification: {
          status: 'in-progress',
          requirements: [],
        },
        pseudocode: {
          status: 'pending',
        },
        architecture: {
          status: 'pending',
        },
        refinement: {
          status: 'pending',
        },
        completion: {
          status: 'pending',
        },
      },
      metadata: {
        startedAt: new Date().toISOString(),
      },
    };

    return updateTask(taskId, { sparc });
  }

  /**
   * Disable SPARC methodology for a task
   */
  async disableSparc(taskId: number, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<Task> {
    const task = await getTask(taskId);
    const { sparc, ...rest } = task; // Effectively removes sparc
    
    // This is a bit of a workaround for the type system.
    // We create a new object without sparc and then update.
    const updates: Partial<Task> = { ...rest, sparc: undefined };
    // since we are removing, we need to set it to undefined.
    return updateTask(taskId, {sparc: undefined});
  }

  /**
   * Advance to a specific SPARC phase
   */
  async advancePhase(taskId: number, targetPhase: SparcStatus, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<Task> {
    const task = await getTask(taskId);
    if (!task.sparc?.enabled) {
      throw new Error('SPARC methodology is not enabled for this task');
    }

    const phaseOrder = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
    const currentPhaseIndex = phaseOrder.indexOf(task.sparc.currentPhase || 'specification');
    const targetPhaseIndex = phaseOrder.indexOf(targetPhase);

    if (targetPhaseIndex < currentPhaseIndex) {
      throw new Error(`Cannot move backwards in SPARC phases. Current: ${task.sparc.currentPhase}, Target: ${targetPhase}`);
    }

    const updatedSparc = { ...task.sparc };
    
    // Mark current phase as done
    if (updatedSparc.currentPhase) {
      const currentPhaseName = updatedSparc.currentPhase;
      const currentPhase = updatedSparc.phases[currentPhaseName];
      if (currentPhase) {
        currentPhase.status = 'done';
        currentPhase.completedAt = new Date().toISOString();
      }
    }

    // Update current phase and mark target phase as in-progress
    updatedSparc.currentPhase = targetPhase;
    const targetPhaseObj = updatedSparc.phases[targetPhase];
    if(targetPhaseObj){
      targetPhaseObj.status = 'in-progress';
    } else {
        // if the phase doesn't exist, create it
        (updatedSparc.phases as any)[targetPhase] = { status: 'in-progress' };
    }
    
    if (updatedSparc.metadata) {
      updatedSparc.metadata.completedPhases = targetPhaseIndex + 1;
    }

    return updateTask(taskId, { sparc: updatedSparc });
  }

  async getProgress(taskId: number, getTask: TaskGetter): Promise<any> {
    const task = await getTask(taskId);
    if (!task.sparc) {
      throw new Error('SPARC is not enabled for this task');
    }
    const phaseOrder = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
    const completedPhases = Object.values(task.sparc.phases).filter(p => p.status === 'done').length;
    const progress = (completedPhases / phaseOrder.length) * 100;

    return {
      currentPhase: task.sparc.currentPhase,
      progress: progress,
      phases: task.sparc.phases,
    };
  }

  /**
   * Generate SPARC requirements using AI
   */
  async generateRequirements(taskId: number, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<any> {
    const task = await getTask(taskId);
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcRequirementsPrompt(task);
    
    const response = await this.bedrockClient.generateTextWithFallback({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    const parsed = this.parseJsonResponse(response.text, z.object({ requirements: z.array(z.string()) }));
    const requirements = parsed?.requirements || this.extractRequirementsFromText(response.text);

    const updatedSparc = { ...task.sparc! };
    updatedSparc.phases.specification.requirements = requirements;
    updatedSparc.phases.specification.status = 'done';
    updatedSparc.phases.specification.completedAt = new Date().toISOString();
    
    await updateTask(taskId, { sparc: updatedSparc });
    
    return { requirements };
  }

  /**
   * Generate SPARC pseudocode using AI
   */
  async generatePseudocode(taskId: number, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<any> {
    const task = await getTask(taskId);
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcPseudocodePrompt(task);
    
    const response = await this.bedrockClient.generateTextWithFallback({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    const parsed = this.parseJsonResponse(response.text, z.object({ agentCoordination: z.string(), taskFlow: z.string() }));
    
    if (parsed) {
      const updatedSparc = { ...task.sparc! };
      updatedSparc.phases.pseudocode.agentCoordination = parsed.agentCoordination;
      updatedSparc.phases.pseudocode.taskFlow = parsed.taskFlow;
      updatedSparc.phases.pseudocode.status = 'done';
      updatedSparc.phases.pseudocode.completedAt = new Date().toISOString();
      await updateTask(taskId, { sparc: updatedSparc });
      return parsed;
    }
    
    throw new Error('Failed to parse pseudocode from AI response');
  }

  /**
   * Generate SPARC architecture using AI
   */
  async generateArchitecture(taskId: number, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<any> {
    const task = await getTask(taskId);
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcArchitecturePrompt(task);
    
    const response = await this.bedrockClient.generateTextWithFallback({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    const schema = z.object({
      swarmStructure: z.string().optional(),
      agentRoles: z.array(z.object({
        role: z.string(),
        responsibilities: z.array(z.string()),
        dependencies: z.array(z.string()),
      })).optional(),
    });

    const parsed = this.parseJsonResponse(response.text, schema);

    if (parsed) {
      const updatedSparc = { ...task.sparc! };
      updatedSparc.phases.architecture.swarmStructure = parsed.swarmStructure;
      updatedSparc.phases.architecture.agentRoles = parsed.agentRoles;
      updatedSparc.phases.architecture.status = 'done';
      updatedSparc.phases.architecture.completedAt = new Date().toISOString();
      await updateTask(taskId, { sparc: updatedSparc });
      return parsed;
    }
    
    throw new Error('Failed to parse architecture from AI response');
  }

  /**
   * Generate SPARC test cases using AI
   */
  async generateTests(taskId: number, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<any> {
    const task = await getTask(taskId);
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcTestsPrompt(task);
    
    const response = await this.bedrockClient.generateTextWithFallback({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    const parsed = this.parseJsonResponse(response.text, z.object({ testCases: z.array(z.string()) }));
    const testCases = parsed?.testCases || this.extractTestCasesFromText(response.text);

    const updatedSparc = { ...task.sparc! };
    updatedSparc.phases.refinement.testCases = testCases;
    updatedSparc.phases.refinement.status = 'done';
    updatedSparc.phases.refinement.completedAt = new Date().toISOString();
    
    await updateTask(taskId, { sparc: updatedSparc });

    return { testCases };
  }

  /**
   * Validate SPARC completion
   */
  async validateCompletion(taskId: number, getTask: TaskGetter, updateTask: TaskPartialUpdater): Promise<{ success: boolean; report: any }> {
    let task = await getTask(taskId);
    if (!task.sparc?.enabled) {
      return {
        success: false,
        report: { issues: ['SPARC methodology is not enabled'], testResults: [] },
      };
    }
    
    // Mark the completion phase as done, since we are validating it.
    const updatedSparc = { ...task.sparc };
    if (updatedSparc.phases.completion) {
      updatedSparc.phases.completion.status = 'done';
      updatedSparc.phases.completion.completedAt = new Date().toISOString();
      task = await updateTask(taskId, { sparc: updatedSparc });
    }

    const issues: string[] = [];
    const report: any = {
      phases: {},
      issues: [],
      overallStatus: 'incomplete',
    };

    const phaseOrder = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
    for (const phaseName of phaseOrder) {
      const phase = task.sparc.phases[phaseName as keyof typeof task.sparc.phases];
      if (phase?.status !== 'done') {
        issues.push(`Phase '${phaseName}' is not complete. Current status: ${phase?.status}`);
      }
      report.phases[phaseName] = {
        status: phase?.status,
        completedAt: phase?.completedAt,
      };
    }
    
    report.issues = issues;

    if (issues.length === 0) {
      report.overallStatus = 'complete';
      return { success: true, report };
    } else {
      return { success: false, report };
    }
  }

  /**
   * Get SPARC progress for a task
   */
  getSparcProgress(task: Task): { currentPhase: SparcStatus; progress: number; phases: Record<string, unknown> } {
    if (!task.sparc?.enabled) {
      return {
        currentPhase: 'specification',
        progress: 0,
        phases: {},
      };
    }

    const phases = task.sparc.phases;
    const completedPhases = Object.values(phases).filter(phase => phase.status === 'done').length;
    const progress = (completedPhases / 5) * 100;

    return {
      currentPhase: task.sparc.currentPhase || 'specification',
      progress,
      phases,
    };
  }

  // Private helper methods

  private async getModelForOperation(operation: 'canGenerateSubtasks' | 'canAnalyzeComplexity' | 'canParsePRD'): Promise<ClaudeModelId> {
    const config = await this.configService.getConfig();
    const configuredModel = config.models?.main?.modelId as ClaudeModelId;
    
    if (configuredModel) {
      const modelInfo = getBedrockModel(configuredModel);
      if (modelInfo.taskCapabilities?.[operation]) {
        return configuredModel;
      }
    }
    
    return 'claude-instant-v1';
  }

  private buildSparcRequirementsPrompt(task: Task): string {
    return `Generate SPARC methodology requirements for the following task. Your response MUST be a valid JSON object with a single key "requirements" that contains an array of strings.

Task: ${task.title}
Description: ${task.description}
${task.details ? `Details: ${task.details}` : ''}

Example Response:
{
  "requirements": [
    "Requirement 1: The system shall...",
    "Requirement 2: The build swarm must..."
  ]
}

Focus on:
- Functional requirements for the build/test fix swarm
- Technical specifications
- Performance requirements
- Security requirements
- Integration requirements
- Test criteria for validation`;
  }

  private buildSparcPseudocodePrompt(task: Task): string {
    return `Generate SPARC methodology pseudocode for the following task. Your response MUST be a valid JSON object with two keys: "agentCoordination" and "taskFlow".

Task: ${task.title}
Description: ${task.description}
${task.details ? `Details: ${task.details}` : ''}

Example Response:
{
  "agentCoordination": "Agents will communicate via a central message queue...",
  "taskFlow": "1. Task received\\n2. Agent assigned\\n3. ..."
}

Focus on:
- Agent communication patterns
- Task distribution and assignment
- Error handling and recovery
- Coordination mechanisms
- Flow control and sequencing`;
  }

  private buildSparcArchitecturePrompt(task: Task): string {
    return `
<Task>
Analyze the task below and generate a SPARC architecture plan.
Title: ${task.title}
Description: ${task.description}
Requirements:
${task.sparc?.phases.specification.requirements?.join('\n- ') || 'N/A'}

Produce a JSON object with two keys: "swarmStructure" (a string describing the high-level architecture) and "agentRoles" (an array of objects).
Each agent role object must have:
- "role": A string defining the agent's title.
- "responsibilities": An array of strings describing what the agent does.
- "dependencies": An array of strings listing the other agent roles this role depends on.

Example JSON structure:
{
  "swarmStructure": "A hierarchical swarm with a central coordinator.",
  "agentRoles": [
    {
      "role": "Coordinator Agent",
      "responsibilities": ["Orchestrate the workflow", "Manage state"],
      "dependencies": ["Worker Agent", "Logging Agent"]
    }
  ]
}

Return ONLY the JSON object.
</Task>
`;
  }

  private buildSparcTestsPrompt(task: Task): string {
    return `Generate SPARC methodology test cases for the following task. Your response MUST be a valid JSON object with a single key "testCases" that contains an array of strings.

Task: ${task.title}
Description: ${task.description}
${task.details ? `Details: ${task.details}` : ''}

Example Response:
{
  "testCases": [
    "Test Case 1: Verify agent communication...",
    "Test Case 2: Test error handling..."
  ]
}

Focus on:
- Unit tests for individual components
- Integration tests for agent coordination
- System tests for end-to-end functionality
- Performance tests
- Error handling tests
- Edge case scenarios`;
  }

  private extractRequirementsFromText(text: string): string[] {
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.requirements)) {
            return parsed.requirements;
        }
    } catch (e) {
        // ignore
    }

    // Simple extraction of requirements from text
    const lines = text.split('\n');
    const requirements: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        requirements.push(trimmed.substring(1).trim());
      } else if (trimmed.match(/^\d+\./)) {
        requirements.push(trimmed.replace(/^\d+\.\s*/, ''));
      }
    }
    
    return requirements.filter(req => req.length > 0);
  }

  private extractTestCasesFromText(text: string): string[] {
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.testCases)) {
            return parsed.testCases;
        }
    } catch (e) {
        // ignore
    }
    // Simple extraction of test cases from text
    return this.extractRequirementsFromText(text);
  }

  private parseJsonResponse<T>(jsonString: string, schema: z.ZodSchema<T>): T | null {
    try {
      const cleanedJsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      return schema.parse(JSON.parse(cleanedJsonString));
    } catch (error) {
      try {
        // Attempt to fix common JSON errors
        const fixedJson = jsonString
          .replace(/```json/g, '').replace(/```/g, '').trim()
          .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
          .replace(/([{\[,])\s*'/g, '$1"') // single to double quotes
          .replace(/'\s*([}\]:,])/g, '"$1') // single to double quotes
          .replace(/:\s*NaN/g, ': "NaN"') // handle NaN
          .replace(/:\s*Infinity/g, ': "Infinity"') // handle Infinity
          .replace(/:\s*-Infinity/g, ': "-Infinity"');
        
        return schema.parse(JSON.parse(fixedJson));
      } catch (e) {
        return null;
      }
    }
  }
} 