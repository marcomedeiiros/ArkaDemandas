import { Router, Request, Response } from 'express';
import * as demandService from '../services/demandService.js';
import type { ColumnStatus, StatsFilter } from '../types.js';

export const demandsRouter = Router();

demandsRouter.get('/', (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  res.json(demandService.getAllDemands(search));
});

demandsRouter.get('/meta/values', (_req: Request, res: Response) => {
  res.json(demandService.getDistinctValues());
});

demandsRouter.get('/:id', (req: Request, res: Response) => {
  const demand = demandService.getDemandById(req.params.id);
  if (!demand) return res.status(404).json({ error: 'Demanda não encontrada' });
  res.json(demand);
});

demandsRouter.post('/', (req: Request, res: Response) => {
  try {
    const demand = demandService.createDemand(req.body);
    req.app.locals.broadcast({ type: 'demand_created', data: demand });
    res.status(201).json(demand);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar demanda', details: String(err) });
  }
});

demandsRouter.put('/:id', (req: Request, res: Response) => {
  const demand = demandService.updateDemand(req.params.id, req.body);
  if (!demand) return res.status(404).json({ error: 'Demanda não encontrada' });
  req.app.locals.broadcast({ type: 'demand_updated', data: demand });
  res.json(demand);
});

demandsRouter.delete('/:id', (req: Request, res: Response) => {
  const deleted = demandService.deleteDemand(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Demanda não encontrada' });
  req.app.locals.broadcast({ type: 'demand_deleted', data: { id: req.params.id } });
  res.json({ success: true });
});

demandsRouter.patch('/:id/move', (req: Request, res: Response) => {
  const { status } = req.body as { status: ColumnStatus };
  const demand = demandService.moveDemand(req.params.id, status);
  if (!demand) return res.status(404).json({ error: 'Demanda não encontrada' });
  req.app.locals.broadcast({ type: 'demand_moved', data: demand });
  res.json(demand);
});

export const statsRouter = Router();

statsRouter.get('/', (req: Request, res: Response) => {
  const filter: StatsFilter = {
    period: req.query.period as StatsFilter['period'],
    responsavel: req.query.responsavel as string,
    categoria: req.query.categoria as string,
    prioridade: req.query.prioridade as StatsFilter['prioridade'],
  };
  res.json(demandService.getStats(filter));
});

export const logsRouter = Router();

logsRouter.get('/', (req: Request, res: Response) => {
  const filter: StatsFilter = {
    period: req.query.period as StatsFilter['period'],
  };
  res.json(demandService.getLogs(filter));
});
