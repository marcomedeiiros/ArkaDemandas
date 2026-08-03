import type { Request, Response } from 'express';
import { queryAll, queryOne, run } from '../database.js';
import { broadcastWs } from '../websocket.js';

interface ColumnRow {
  id: string;
  label: string;
  color: string;
  icon: string;
  order_index: number;
  is_default: number;
  created_at: string;
}

function generateColumnId(): string {
  return 'col_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export class ColumnController {
  getAll = (_req: Request, res: Response) => {
    try {
      const columns = queryAll<ColumnRow>('SELECT * FROM columns ORDER BY order_index ASC');
      res.json(columns);
    } catch (error) {
      console.error('Error getting columns:', error);
      res.status(500).json({ error: 'Erro ao buscar blocos' });
    }
  };

  create = (req: Request, res: Response) => {
    try {
      const { label, color, icon } = req.body as { label: string; color: string; icon: string };

      if (!label || label.trim() === '') {
        return res.status(400).json({ error: 'Nome do bloco é obrigatório' });
      }

      const id = generateColumnId();
      const currentMax = queryOne<{ max_order: number }>('SELECT COALESCE(MAX(order_index), -1) as max_order FROM columns');
      const order_index = (currentMax?.max_order ?? -1) + 1;

      run(
        `INSERT INTO columns (id, label, color, icon, order_index, is_default) VALUES (?, ?, ?, ?, ?, 0)`,
        [id, label.trim(), color || '#0066FF', icon || 'clipboard', order_index]
      );

      const newCol = queryOne<ColumnRow>('SELECT * FROM columns WHERE id = ?', [id]);
      broadcastWs('columns_updated', { action: 'created', column: newCol });
      res.status(201).json(newCol);
    } catch (error) {
      console.error('Error creating column:', error);
      res.status(500).json({ error: 'Erro ao criar bloco' });
    }
  };

  update = (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { label, color, icon } = req.body as { label?: string; color?: string; icon?: string };

      const existing = queryOne<ColumnRow>('SELECT * FROM columns WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Bloco não encontrado' });
      }

      const updates: string[] = [];
      const values: unknown[] = [];

      if (label !== undefined && label.trim() !== '') {
        updates.push('label = ?');
        values.push(label.trim());
      }
      if (color !== undefined) {
        updates.push('color = ?');
        values.push(color);
      }
      if (icon !== undefined) {
        updates.push('icon = ?');
        values.push(icon);
      }

      if (updates.length === 0) {
        return res.json(existing);
      }

      values.push(id);
      run(`UPDATE columns SET ${updates.join(', ')} WHERE id = ?`, values);

      const updated = queryOne<ColumnRow>('SELECT * FROM columns WHERE id = ?', [id]);
      broadcastWs('columns_updated', { action: 'updated', column: updated });
      res.json(updated);
    } catch (error) {
      console.error('Error updating column:', error);
      res.status(500).json({ error: 'Erro ao atualizar bloco' });
    }
  };

  delete = (req: Request, res: Response) => {
    try {
      const id = req.params.id;

      const existing = queryOne<ColumnRow>('SELECT * FROM columns WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ error: 'Bloco não encontrado' });
      }

      // Move as demandas do bloco excluído para o primeiro bloco restante
      // (menor order_index). Antes ia sempre para 'novas', que podia nem
      // existir mais deixando as demandas "órfãs" e invisíveis.
      const now = new Date().toISOString();
      const fallback = queryOne<ColumnRow>(
        'SELECT * FROM columns WHERE id != ? ORDER BY order_index ASC LIMIT 1',
        [id]
      );
      if (fallback) {
        run(
          `UPDATE demands SET status = ?, updated_at = ? WHERE status = ?`,
          [fallback.id, now, id]
        );
      }

      run('DELETE FROM columns WHERE id = ?', [id]);

      broadcastWs('columns_updated', { action: 'deleted', columnId: id });
      res.json({ success: true, movedTo: fallback?.id ?? null });
    } catch (error) {
      console.error('Error deleting column:', error);
      res.status(500).json({ error: 'Erro ao excluir bloco' });
    }
  };
}
