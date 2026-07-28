import type { Request, Response } from 'express';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository.js';

export class ActivityLogController {
  private repo: ActivityLogRepository;

  constructor() {
    this.repo = new ActivityLogRepository();
  }

  getAll = (req: Request, res: Response) => {
    try {
      const { period, limit } = req.query;
      
      let logs;
      if (period && period !== 'all') {
        logs = this.repo.findByPeriod(period as any);
      } else if (limit) {
        logs = this.repo.findAll(parseInt(String(limit)));
      } else {
        logs = this.repo.findAll();
      }

      res.json(logs);
    } catch (error) {
      console.error('Error getting logs:', error);
      res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  };

  getByDemandId = (req: Request, res: Response) => {
    try {
      const { demandId } = req.params;
      const logs = this.repo.findByDemandId(demandId);
      res.json(logs);
    } catch (error) {
      console.error('Error getting demand logs:', error);
      res.status(500).json({ error: 'Erro ao buscar logs da demanda' });
    }
  };
}
