import type { Request, Response } from 'express';
import { DemandService } from '../services/demandService.js';
import type { CreateDemandInput, UpdateDemandInput } from '../models/Demand.model.js';
import type { ColumnStatus } from '../types.js';
import { broadcastWs } from '../websocket.js';
import { queryOne } from '../database.js';
import { getSessionUser } from '../auth/session.js';
import type { DemandModel } from '../models/Demand.model.js';

export class DemandController {
  private service: DemandService;

  // Pode gerenciar (editar/duplicar/excluir): o criador OU um admin/supervisor.
  private isOwner(demand: DemandModel, req: Request): boolean {
    const user = getSessionUser(req);
    if (!user) return false;
    return user.role === 'admin' || demand.criado_por === user.name;
  }

  constructor() {
    this.service = new DemandService();
  }

  getAll = (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      
      const demands = search
        ? this.service.searchDemands(String(search))
        : this.service.getAllDemands();

      res.json(demands);
    } catch (error) {
      console.error('Error getting demands:', error);
      res.status(500).json({ error: 'Erro ao buscar demandas' });
    }
  };

  getById = (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const demand = this.service.getDemandById(id);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      res.json(demand);
    } catch (error) {
      console.error('Error getting demand:', error);
      res.status(500).json({ error: 'Erro ao buscar demanda' });
    }
  };

  create = (req: Request, res: Response) => {
    try {
      const user = getSessionUser(req)?.name || 'Sistema';
      // Responsável = técnico atribuído (do formulário) ou, se vazio, o criador.
      const responsavel = (req.body?.responsavel && String(req.body.responsavel).trim()) || user;
      const data: CreateDemandInput = {
        ...req.body,
        responsavel,
        criado_por: user,
      };

      if (!data.titulo || !data.cliente || !data.categoria || !data.prioridade) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      // Não permite criar demandas se não houver nenhum bloco/coluna.
      const columnCount = queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM columns');
      if (!columnCount || columnCount.count === 0) {
        return res.status(400).json({ error: 'Crie pelo menos um bloco antes de criar demandas' });
      }

      const demand = this.service.createDemand(data);
      broadcastWs('demand_created', demand);
      res.status(201).json(demand);
    } catch (error) {
      console.error('Error creating demand:', error);
      res.status(500).json({ error: 'Erro ao criar demanda' });
    }
  };

  update = (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const user = getSessionUser(req)?.name || 'Sistema';
      const data: UpdateDemandInput = req.body;

      const existing = this.service.getDemandById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }
      if (!this.isOwner(existing, req)) {
        return res.status(403).json({ error: 'Apenas quem criou a demanda pode editá-la' });
      }

      const demand = this.service.updateDemand(id, data, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      broadcastWs('demand_updated', demand);
      res.json(demand);
    } catch (error) {
      console.error('Error updating demand:', error);
      res.status(500).json({ error: 'Erro ao atualizar demanda' });
    }
  };

  updateStatus = (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { status } = req.body as { status: ColumnStatus };
      const user = getSessionUser(req)?.name || 'Sistema';

      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }

      const demand = this.service.moveDemand(id, status, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      broadcastWs('demand_moved', demand);
      res.json(demand);
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  };

  complete = (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const user = getSessionUser(req)?.name || 'Sistema';

      const demand = this.service.completeDemand(id, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      broadcastWs('demand_moved', demand);
      res.json(demand);
    } catch (error) {
      console.error('Error completing demand:', error);
      res.status(500).json({ error: 'Erro ao concluir demanda' });
    }
  };

  duplicate = (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const user = getSessionUser(req)?.name || 'Sistema';

      const existing = this.service.getDemandById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }
      if (!this.isOwner(existing, req)) {
        return res.status(403).json({ error: 'Apenas quem criou a demanda pode duplicá-la' });
      }

      const demand = this.service.duplicateDemand(id, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      broadcastWs('demand_created', demand);
      res.status(201).json(demand);
    } catch (error) {
      console.error('Error duplicating demand:', error);
      res.status(500).json({ error: 'Erro ao duplicar demanda' });
    }
  };

  delete = (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const user = getSessionUser(req)?.name || 'Sistema';

      const existing = this.service.getDemandById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }
      if (!this.isOwner(existing, req)) {
        return res.status(403).json({ error: 'Apenas quem criou a demanda pode excluí-la' });
      }

      const success = this.service.deleteDemand(id, user);

      if (!success) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      broadcastWs('demand_deleted', { id });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting demand:', error);
      res.status(500).json({ error: 'Erro ao excluir demanda' });
    }
  };
}
