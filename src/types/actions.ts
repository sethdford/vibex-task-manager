export type ActionType = 'edit_file' | 'run_command' | 'add_dependency' | 'create_task' | 'create_subtask';

export interface ActionRequest {
  type: ActionType;
  path?: string;
  content?: string;
  command?: string;
  packageName?: string;
  title?: string;
  description?: string;
  parent_id?: string | number;
  reasoning: string;
}

export interface ActionPlan {
  thought: string;
  actions: ActionRequest[];
} 