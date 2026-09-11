export type JobType = 'http' | 'webhook' | 'noop';
export type ExecutionStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type TriggeredBy = 'manual' | 'scheduler' | 'retry';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Job {
  id: string;
  name: string;
  description?: string;
  jobType: JobType;
  config: Record<string, unknown>;
  cronExpression?: string;
  maxRetries: number;
  retryDelaySeconds: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  recentExecutions?: Execution[];
}

export interface Execution {
  id: string;
  jobId: string;
  jobName?: string;
  status: ExecutionStatus;
  attempt: number;
  triggeredBy: TriggeredBy;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  logs?: string;
  workerId?: string;
  createdAt: string;
}

export interface TokenResponse {
  token: string;
  user: User;
}