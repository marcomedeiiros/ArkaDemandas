import { DemandRepository } from '../repositories/DemandRepository.js';
import { ActivityLogRepository } from '../repositories/ActivityLogRepository.js';
import type { DemandModel, CreateDemandInput, UpdateDemandInput } from '../models/Demand.model.js';
import type { ColumnStatus } from '../types.js';
import { COLUMN_LABELS } from '../types.js';

export class DemandService {
  private demandRepo: DemandRepository;
  private logRepo: ActivityLogRepository;

  constructor() {
    this.demandRepo = new DemandRepository();
    this.logRepo = new ActivityLogRepository();
  }

  getAllDemands(): DemandModel[] {
    return this.demandRepo.findAll();
  }

  getDemandById(id: string): DemandModel | undefined {
    return this.demandRepo.findById(id);
  }

  searchDemands(query: string): DemandModel[] {
    return this.demandRepo.search(query);
  }

  createDemand(data: CreateDemandInput): DemandModel {
    const demand = this.demandRepo.create(data);

    this.logRepo.create({
      demand_id: demand.id,
      action: 'criada',
      details: `Demanda "${demand.titulo}" criada`,
      user: data.criado_por,
    });

    return demand;
  }

  updateDemand(id: string, data: UpdateDemandInput, user: string): DemandModel | undefined {
    const existing = this.demandRepo.findById(id);
    if (!existing) return undefined;

    const updated = this.demandRepo.update(id, data);
    if (!updated) return undefined;

    this.logRepo.create({
      demand_id: id,
      action: 'editada',
      details: `Demanda "${updated.titulo}" foi editada`,
      user,
    });

    return updated;
  }

  moveDemand(id: string, newStatus: ColumnStatus, user: string): DemandModel | undefined {
    const existing = this.demandRepo.findById(id);
    if (!existing) return undefined;

    if (existing.status === newStatus) return existing;

    const updated = this.demandRepo.updateStatus(id, newStatus);
    if (!updated) return undefined;

    const fromLabel = COLUMN_LABELS[existing.status];
    const toLabel = COLUMN_LABELS[newStatus];

    const action = newStatus === 'concluidas' 
      ? 'concluida' 
      : existing.status === 'concluidas'
      ? 'reaberta'
      : 'movida';

    this.logRepo.create({
      demand_id: id,
      action,
      details: `Demanda movida de "${fromLabel}" para "${toLabel}"`,
      from_status: fromLabel,
      to_status: toLabel,
      user,
    });

    return updated;
  }

  completeDemand(id: string, user: string): DemandModel | undefined {
    return this.moveDemand(id, 'concluidas', user);
  }

  reopenDemand(id: string, newStatus: ColumnStatus, user: string): DemandModel | undefined {
    const existing = this.demandRepo.findById(id);
    if (!existing || existing.status !== 'concluidas') return undefined;

    return this.moveDemand(id, newStatus, user);
  }

  duplicateDemand(id: string, user: string): DemandModel | undefined {
    const duplicated = this.demandRepo.duplicate(id, user);
    if (!duplicated) return undefined;

    this.logRepo.create({
      demand_id: duplicated.id,
      action: 'criada',
      details: `Demanda criada como cópia de ${id}`,
      user,
    });

    return duplicated;
  }

  deleteDemand(id: string, user: string): boolean {
    const existing = this.demandRepo.findById(id);
    if (!existing) return false;

    const logEntry = {
      demand_id: id,
      action: 'excluida' as const,
      details: `Demanda "${existing.titulo}" foi excluída`,
      user,
    };

    this.logRepo.deleteByDemandId(id);

    this.logRepo.create(logEntry);

    return this.demandRepo.delete(id);
  }
}
