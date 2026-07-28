import type { LogAction } from '../types.js';

export interface ActivityLogModel {
  id: number;
  demand_id: string;
  action: LogAction;
  details: string;
  from_status: string | null;
  to_status: string | null;
  user: string;
  created_at: string;
}

export interface CreateActivityLogInput {
  demand_id: string;
  action: LogAction;
  details: string;
  from_status?: string | null;
  to_status?: string | null;
  user: string;
}
