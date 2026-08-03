import { queryAll, queryOne, run } from '../database.js';
import type { DemandModel, CreateDemandInput, UpdateDemandInput } from '../models/Demand.model.js';
import type { ColumnStatus } from '../types.js';

export class DemandRepository {
  findAll(): DemandModel[] {
    return queryAll<DemandModel>(
      'SELECT * FROM demands ORDER BY created_at DESC'
    );
  }

  findById(id: string): DemandModel | undefined {
    return queryOne<DemandModel>(
      'SELECT * FROM demands WHERE id = ?',
      [id]
    );
  }

  findByStatus(status: ColumnStatus): DemandModel[] {
    return queryAll<DemandModel>(
      'SELECT * FROM demands WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
  }

  search(query: string): DemandModel[] {
    const searchTerm = `%${query}%`;
    return queryAll<DemandModel>(
      `SELECT * FROM demands 
       WHERE id LIKE ? OR titulo LIKE ? OR cliente LIKE ? OR responsavel LIKE ?
       ORDER BY created_at DESC`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
  }

  create(data: CreateDemandInput): DemandModel {
    const id = this.generateId();
    const now = new Date().toISOString();
    const dataCriacao = new Date().toISOString().split('T')[0];

    // A nova demanda entra na primeira coluna existente (menor order_index).
    // Antes o status era fixo em 'novas', o que fazia a demanda "sumir" quando
    // esse bloco tinha sido renomeado ou excluído (nenhuma coluna correspondia
    // ao status, então a demanda não aparecia em lugar nenhum).
    const firstColumn = queryOne<{ id: string }>(
      'SELECT id FROM columns ORDER BY order_index ASC LIMIT 1'
    );
    const status = firstColumn?.id ?? 'novas';

    run(
      `INSERT INTO demands (
        id, titulo, descricao, cliente, responsavel, categoria,
        prioridade, status, data_criacao, prazo, observacoes,
        criado_por, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.titulo,
        data.descricao || '',
        data.cliente,
        data.responsavel,
        data.categoria,
        data.prioridade,
        status,
        dataCriacao,
        data.prazo || null,
        '',
        data.criado_por,
        now,
        now,
      ]
    );

    return this.findById(id)!;
  }

  update(id: string, data: UpdateDemandInput): DemandModel | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.titulo !== undefined) {
      updates.push('titulo = ?');
      values.push(data.titulo);
    }
    if (data.descricao !== undefined) {
      updates.push('descricao = ?');
      values.push(data.descricao);
    }
    if (data.cliente !== undefined) {
      updates.push('cliente = ?');
      values.push(data.cliente);
    }
    if (data.responsavel !== undefined) {
      updates.push('responsavel = ?');
      values.push(data.responsavel);
    }
    if (data.categoria !== undefined) {
      updates.push('categoria = ?');
      values.push(data.categoria);
    }
    if (data.prioridade !== undefined) {
      updates.push('prioridade = ?');
      values.push(data.prioridade);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.prazo !== undefined) {
      updates.push('prazo = ?');
      values.push(data.prazo);
    }
    if (data.data_conclusao !== undefined) {
      updates.push('data_conclusao = ?');
      values.push(data.data_conclusao);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    run(
      `UPDATE demands SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  updateStatus(id: string, status: ColumnStatus): DemandModel | undefined {
    const data: UpdateDemandInput = { status };
    
    if (status === 'concluidas') {
      data.data_conclusao = new Date().toISOString().split('T')[0];
    } else {
      data.data_conclusao = null;
    }

    return this.update(id, data);
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;

    run('DELETE FROM demands WHERE id = ?', [id]);
    return true;
  }

  duplicate(id: string, criado_por: string): DemandModel | undefined {
    const original = this.findById(id);
    if (!original) return undefined;

    const newData: CreateDemandInput = {
      titulo: `${original.titulo} (Cópia)`,
      descricao: original.descricao,
      cliente: original.cliente,
      // Quem duplica vira o responsável e o dono da cópia (mesma pessoa).
      responsavel: criado_por,
      categoria: original.categoria,
      prioridade: original.prioridade,
      prazo: original.prazo,
      criado_por,
    };

    return this.create(newData);
  }

  private generateId(): string {
    const year = new Date().getFullYear();
    const existingIds = queryAll<{ id: string }>(
      'SELECT id FROM demands WHERE id LIKE ? ORDER BY id DESC LIMIT 1',
      [`ARKA-${year}-%`]
    );

    let nextNumber = 1;
    if (existingIds.length > 0) {
      const lastId = existingIds[0].id;
      const lastNumber = parseInt(lastId.split('-')[2]);
      nextNumber = lastNumber + 1;
    }

    return `ARKA-${year}-${String(nextNumber).padStart(5, '0')}`;
  }
}
