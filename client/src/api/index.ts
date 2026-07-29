import type { Demand, CreateDemandDTO, Stats, StatsFilter, ActivityLog, ColumnStatus } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Servidor não respondeu. Verifique se o backend está rodando.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  getDemands: (search?: string) =>
    request<Demand[]>(`/demands${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getDemand: (id: string) => request<Demand>(`/demands/${id}`),

  createDemand: (data: CreateDemandDTO) =>
    request<Demand>('/demands', { method: 'POST', body: JSON.stringify(data) }),

  updateDemand: (id: string, data: Partial<CreateDemandDTO & { status: ColumnStatus }>) =>
    request<Demand>(`/demands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteDemand: (id: string) =>
    request<{ success: boolean }>(`/demands/${id}`, { method: 'DELETE' }),

  moveDemand: (id: string, status: ColumnStatus) =>
    request<Demand>(`/demands/${id}/move`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getStats: (filter?: StatsFilter) => {
    const params = new URLSearchParams();
    if (filter?.period) params.set('period', filter.period);
    if (filter?.responsavel) params.set('responsavel', filter.responsavel);
    if (filter?.categoria) params.set('categoria', filter.categoria);
    if (filter?.prioridade) params.set('prioridade', filter.prioridade);
    const qs = params.toString();
    return request<Stats>(`/stats${qs ? `?${qs}` : ''}`);
  },

  getLogs: (period?: string) =>
    request<ActivityLog[]>(`/logs${period ? `?period=${period}` : ''}`),

  getMetaValues: () =>
    request<{ responsaveis: string[]; categorias: string[] }>('/demands/meta/values'),

  exportUrl: (format: 'csv' | 'excel' | 'pdf') => `${BASE}/export/${format}`,
};
