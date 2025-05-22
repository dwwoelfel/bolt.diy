import type { Change } from 'diff';
import type { InstantDBToken } from './instantdb';

export type ActionType = 'file' | 'shell' | 'supabase' | 'instantdb';

export interface BaseAction {
  content: string;
}

export interface FileAction extends BaseAction {
  type: 'file';
  filePath: string;
}

export interface ShellAction extends BaseAction {
  type: 'shell';
}

export interface StartAction extends BaseAction {
  type: 'start';
}

export interface BuildAction extends BaseAction {
  type: 'build';
}

export interface SupabaseAction extends BaseAction {
  type: 'supabase';
  operation: 'migration' | 'query';
  filePath?: string;
  projectId?: string;
}

export interface BaseInstantDBAction extends BaseAction {
  type: 'instantdb';
  operation: 'create-app' | 'pull';
}

export interface InstantDBCreateAppAction extends BaseInstantDBAction {
  operation: 'create-app';
  schemaFilePath?: string;
  rulesFilePath?: string;
  appIdFilePath: string;
  appIdPlaceholderValue: string;
}

export interface InstantDBPullAction extends BaseInstantDBAction {
  operation: 'pull';
  token: InstantDBToken;
  appId: string;
}

export type InstantDBAction = InstantDBCreateAppAction | InstantDBPullAction;

export type BoltAction =
  | FileAction
  | ShellAction
  | StartAction
  | BuildAction
  | SupabaseAction
  | InstantDBAction
  | InstantDBPullAction;

export type BoltActionData = BoltAction | BaseAction;

export interface ActionAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'terminal' | 'preview'; // Add source to differentiate between terminal and preview errors
}

export interface SupabaseAlert {
  type: string;
  title: string;
  description: string;
  content: string;
  source?: 'supabase';
}

export interface DeployAlert {
  type: 'success' | 'error' | 'info';
  title: string;
  description: string;
  content?: string;
  url?: string;
  stage?: 'building' | 'deploying' | 'complete';
  buildStatus?: 'pending' | 'running' | 'complete' | 'failed';
  deployStatus?: 'pending' | 'running' | 'complete' | 'failed';
  source?: 'vercel' | 'netlify' | 'github';
}

export interface FileHistory {
  originalContent: string;
  lastModified: number;
  changes: Change[];
  versions: {
    timestamp: number;
    content: string;
  }[];

  // Novo campo para rastrear a origem das mudanças
  changeSource?: 'user' | 'auto-save' | 'external';
}
