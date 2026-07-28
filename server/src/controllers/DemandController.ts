import type { Request, Response } from 'express';
import { DemandService } from '../services/DemandService.js';
import type { CreateDemandInput, UpdateDemandInput } from '../models/Demand.model.js';
import type { ColumnStatus } from '../types.js';

export class DemandController {
  private service: DemandService;

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
      const { id } = req.params;
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
      const user = req.headers['x-user'] as string || 'Sistema';
      const data: CreateDemandInput = {
        ...req.body,
        criado_por: user,
      };

      // Validação básica
      if (!data.titulo || !data.cliente || !data.responsavel || !data.categoria || !data.prioridade) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const demand = this.service.createDemand(data);
      res.status(201).json(demand);
    } catch (error) {
      console.error('Error creating demand:', error);
      res.status(500).json({ error: 'Erro ao criar demanda' });
    }
  };

  update = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.headers['x-user'] as string || 'Sistema';
      const data: UpdateDemandInput = req.body;

      const demand = this.service.updateDemand(id, data, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      res.json(demand);
    } catch (error) {
      console.error('Error updating demand:', error);
      res.status(500).json({ error: 'Erro ao atualizar demanda' });
    }
  };

  updateStatus = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: ColumnStatus };
      const user = req.headers['x-user'] as string || 'Sistema';

      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }

      const demand = this.service.moveDemand(id, status, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      res.json(demand);
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ error: 'Erro ao atualizar status' });
    }
  };

  complete = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.headers['x-user'] as string || 'Sistema';

      const demand = this.service.completeDemand(id, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      res.json(demand);
    } catch (error) {
      console.error('Error completing demand:', error);
      res.status(500).json({ error: 'Erro ao concluir demanda' });
    }
  };

  duplicate = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.headers['x-user'] as string || 'Sistema';

      const demand = this.service.duplicateDemand(id, user);

      if (!demand) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      res.status(201).json(demand);
    } catch (error) {
      console.error('Error duplicating demand:', error);
      res.status(500).json({ error: 'Erro ao duplicar demanda' });
    }
  };

  delete = (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.headers['x-user'] as string || 'Sistema';

      const success = this.service.deleteDemand(id, user);

      if (!success) {
        return res.status(404).json({ error: 'Demanda não encontrada' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting demand:', error);
      res.status(500).json({ error: 'Erro ao excluir demanda' });
    }
  };
}
