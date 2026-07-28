import { queryAll, run } from '../database.js';
import type { ActivityLogModel, CreateActivityLogInput } from '../models/ActivityLog.model.js';

export class ActivityLogRepository {
  findAll(limit?: number): ActivityLogModel[] {
    const sql = limit
      ? 'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?'
      : 'SELECT * FROM activity_logs ORDER BY created_at DESC';
    
    return limit 
      ? queryAll<ActivityLogModel>(sql, [limit])
      : queryAll<ActivityLogModel>(sql);
  }

  findByDemandId(demandId: string): ActivityLogModel[] {
    return queryAll<ActivityLogModel>(
      'SELECT * FROM activity_logs WHERE demand_id = ? ORDER BY created_at DESC',
      [demandId]
    );
  }

  findByPeriod(period: 'today' | 'week' | 'month' | 'year'): ActivityLogModel[] {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    return queryAll<ActivityLogModel>(
      'SELECT * FROM activity_logs WHERE created_at >= ? ORDER BY created_at DESC',
      [startDate.toISOString()]
    );
  }

  create(data: CreateActivityLogInput): void {
    run(
      `INSERT INTO activity_logs (
        demand_id, action, details, from_status, to_status, user, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.demand_id,
        data.action,
        data.details,
        data.from_status || null,
        data.to_status || null,
        data.user,
        new Date().toISOString(),
      ]
    );
  }

  deleteByDemandId(demandId: string): void {
    run('DELETE FROM activity_logs WHERE demand_id = ?', [demandId]);
  }
}
