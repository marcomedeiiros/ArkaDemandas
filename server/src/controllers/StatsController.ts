import type { Request, Response } from 'express';
import { StatsService } from '../services/StatsService.js';
import type { StatsFilter } from '../types.js';

export class StatsController {
  private service: StatsService;

  constructor() {
    this.service = new StatsService();
  }

  getStats = (req: Request, res: Response) => {
    try {
      const filter: StatsFilter = {
        period: req.query.period as any,
        responsavel: req.query.responsavel as string,
        categoria: req.query.categoria as string,
        prioridade: req.query.prioridade as any,
      };

      const stats = this.service.getStats(filter);
      res.json(stats);
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  };
}
