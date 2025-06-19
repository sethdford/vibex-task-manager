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
  async enableSparcMethodology(task: Task): Promise<Task> {
    const sparc: SparcMethodology = {
      enabled: true,
      currentPhase: 'specification',
      phases: {
        specification: {
          status: 'pending',
          requirements: [],
          swarmDefinition: undefined,
          testCriteria: [],
        },
        pseudocode: {
          status: 'pending',
          agentCoordination: undefined,
          taskFlow: undefined,
          coordinationPattern: undefined,
        },
        architecture: {
          status: 'pending',
          swarmStructure: undefined,
          agentRoles: [],
        },
        refinement: {
          status: 'pending',
          tddApproach: undefined,
          testCases: [],
          deploymentPlan: undefined,
        },
        completion: {
          status: 'pending',
          buildValidation: false,
          testResults: [],
          validationReport: undefined,
        },
      },
      metadata: {
        startedAt: new Date().toISOString(),
        totalPhases: 5,
        completedPhases: 0,
        methodology: 'sparc',
      },
    };

    return {
      ...task,
      sparc,
    };
  }

  /**
   * Disable SPARC methodology for a task
   */
  async disableSparcMethodology(task: Task): Promise<Task> {
    const { sparc, ...taskWithoutSparc } = task;
    return taskWithoutSparc;
  }

  /**
   * Advance to a specific SPARC phase
   */
  async advanceSparcPhase(task: Task, targetPhase: SparcStatus): Promise<Task> {
    if (!task.sparc?.enabled) {
      throw new Error('SPARC methodology is not enabled for this task');
    }

    const phaseOrder = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
    const currentPhaseIndex = phaseOrder.indexOf(task.sparc.currentPhase || 'specification');
    const targetPhaseIndex = phaseOrder.indexOf(targetPhase);

    if (targetPhaseIndex < currentPhaseIndex) {
      throw new Error(`Cannot move backwards in SPARC phases. Current: ${task.sparc.currentPhase}, Target: ${targetPhase}`);
    }

    // Mark current phase as done
    if (task.sparc.currentPhase) {
      const currentPhase = task.sparc.phases[task.sparc.currentPhase as keyof typeof task.sparc.phases];
      if (currentPhase) {
        currentPhase.status = 'done';
        currentPhase.completedAt = new Date().toISOString();
      }
    }

    // Update current phase and mark target phase as in-progress
    const updatedSparc = {
      ...task.sparc,
      currentPhase: targetPhase,
      phases: {
        ...task.sparc.phases,
        [targetPhase]: {
          ...task.sparc.phases[targetPhase as keyof typeof task.sparc.phases],
          status: 'in-progress',
        },
      },
      metadata: {
        ...task.sparc.metadata,
        completedPhases: targetPhaseIndex + 1,
      },
    };

    return {
      ...task,
      sparc: updatedSparc,
    };
  }

  /**
   * Generate SPARC requirements using AI
   */
  async generateSparcRequirements(task: Task): Promise<string[]> {
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcRequirementsPrompt(task);
    
    const response = await this.bedrockClient.generateText({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    const parsed = this.parseJsonResponse(response.text, z.object({ requirements: z.array(z.string()) }));
    return parsed?.requirements || this.extractRequirementsFromText(response.text);
  }

  /**
   * Generate SPARC pseudocode using AI
   */
  async generateSparcPseudocode(task: Task): Promise<{ coordination: string; taskFlow: string }> {
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcPseudocodePrompt(task);
    
    const response = await this.bedrockClient.generateText({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    console.log('Raw AI Response for Pseudocode:', response.text);

    const parsed = this.parseJsonResponse(response.text, z.object({ agentCoordination: z.string(), taskFlow: z.string() }));
    
    if (parsed) {
      return {
        coordination: parsed.agentCoordination,
        taskFlow: parsed.taskFlow,
      };
    }
    
    return {
      coordination: 'Error parsing AI response',
      taskFlow: 'Error parsing AI response',
    };
  }

  /**
   * Generate SPARC architecture using AI
   */
  async generateSparcArchitecture(task: Task): Promise<{ structure: string; roles: Array<{ role: string; responsibilities: string[] }> }> {
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcArchitecturePrompt(task);
    
    const response = await this.bedrockClient.generateText({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    console.log('Raw AI Response for Architecture:', response.text);

    const schema = z.object({
      swarmStructure: z.string().optional(),
      agentRoles: z.array(z.object({
        role: z.string(),
        responsibilities: z.array(z.string()),
      })).optional(),
    });

    const parsed = this.parseJsonResponse(response.text, schema);

    if (parsed) {
      return {
        structure: parsed.swarmStructure || '',
        roles: parsed.agentRoles?.map(r => ({ role: r.role || '', responsibilities: r.responsibilities || [] })) || [],
      };
    }
    
    return {
      structure: 'Error parsing AI response',
      roles: [],
    };
  }

  /**
   * Generate SPARC test cases using AI
   */
  async generateSparcTests(task: Task): Promise<string[]> {
    const model = await this.getModelForOperation('canAnalyzeComplexity');
    const prompt = this.buildSparcTestsPrompt(task);
    
    const response = await this.bedrockClient.generateText({
      model,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2048,
      temperature: 0.3,
    });

    const parsed = this.parseJsonResponse(response.text, z.object({ testCases: z.array(z.string()) }));
    return parsed?.testCases || this.extractTestCasesFromText(response.text);
  }

  /**
   * Validate SPARC completion
   */
  async validateSparcCompletion(task: Task): Promise<{ isValid: boolean; issues: string[]; testResults: Array<{ testName: string; status: 'pass' | 'fail' | 'skipped' }> }> {
    if (!task.sparc?.enabled) {
      return {
        isValid: false,
        issues: ['SPARC methodology is not enabled'],
        testResults: [],
      };
    }

    const issues: string[] = [];
    const testResults: Array<{ testName: string; status: 'pass' | 'fail' | 'skipped' }> = [];

    // Check if all phases are completed
    const phases = task.sparc.phases;
    for (const [phaseName, phase] of Object.entries(phases)) {
      if (phase.status !== 'done') {
        issues.push(`Phase ${phaseName} is not completed (status: ${phase.status})`);
        testResults.push({
          testName: `${phaseName} completion`,
          status: 'fail',
        });
      } else {
        testResults.push({
          testName: `${phaseName} completion`,
          status: 'pass',
        });
      }
    }

    // Check build validation
    if (phases.completion.buildValidation) {
      testResults.push({
        testName: 'Build validation',
        status: 'pass',
      });
    } else {
      issues.push('Build validation failed');
      testResults.push({
        testName: 'Build validation',
        status: 'fail',
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      testResults,
    };
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
    return `Generate SPARC methodology architecture for the following task. Your response MUST be a valid JSON object with two keys: "swarmStructure" and "agentRoles".

Task: ${task.title}
Description: ${task.description}
${task.details ? `Details: ${task.details}` : ''}

Example Response:
{
  "swarmStructure": "A hierarchical swarm with a master agent and multiple worker agents...",
  "agentRoles": [
    {
      "role": "Master Agent",
      "responsibilities": ["Task assignment", "Result aggregation"]
    }
  ]
}

Focus on:
- Swarm topology and organization
- Agent roles and responsibilities
- Data flow and communication
- Scalability considerations
- Fault tolerance mechanisms`;
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