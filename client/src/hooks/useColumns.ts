import { useState, useEffect, useCallback } from 'react';
import type { ColumnConfig } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useColumns() {
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchColumns = useCallback(async () => {
    try {
      const data = await request<ColumnConfig[]>('/columns');
      setColumns(data.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      console.error('Error fetching columns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const createColumn = useCallback(async (data: { label: string; color: string; icon: string }) => {
    try {
      const col = await request<ColumnConfig>('/columns', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      // Evita duplicação: o servidor também emite um evento WebSocket "created"
      // que pode chegar antes desta resposta HTTP e já ter inserido o bloco.
      setColumns(prev => {
        const exists = prev.some(c => c.id === col.id);
        const next = exists ? prev.map(c => (c.id === col.id ? col : c)) : [...prev, col];
        return next.sort((a, b) => a.order_index - b.order_index);
      });
      return col;
    } catch (err) {
      console.error('Error creating column:', err);
      throw err;
    }
  }, []);

  const updateColumn = useCallback(async (id: string, data: { label?: string; color?: string; icon?: string }) => {
    try {
      const col = await request<ColumnConfig>(`/columns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setColumns(prev => prev.map(c => c.id === id ? col : c));
      return col;
    } catch (err) {
      console.error('Error updating column:', err);
      throw err;
    }
  }, []);

  const deleteColumn = useCallback(async (id: string) => {
    try {
      await request<{ success: boolean }>(`/columns/${id}`, { method: 'DELETE' });
      setColumns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting column:', err);
      throw err;
    }
  }, []);

  const handleWsMessage = useCallback((msg: { type: string; data: unknown }) => {
    if (msg.type === 'columns_updated') {
      const payload = msg.data as { action: string; column?: ColumnConfig; columnId?: string };
      if (payload.action === 'created' && payload.column) {
        setColumns(prev => {
          const exists = prev.some(c => c.id === payload.column!.id);
          return exists ? prev : [...prev, payload.column!].sort((a, b) => a.order_index - b.order_index);
        });
      } else if (payload.action === 'updated' && payload.column) {
        setColumns(prev => prev.map(c => c.id === payload.column!.id ? payload.column! : c));
      } else if (payload.action === 'deleted' && payload.columnId) {
        setColumns(prev => prev.filter(c => c.id !== payload.columnId));
      }
    }
  }, []);

  return { columns, loading, fetchColumns, createColumn, updateColumn, deleteColumn, handleWsMessage };
}
