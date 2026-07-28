import { queryAll } from '../database.js';
import type { DemandModel } from '../models/Demand.model.js';
import type { StatsFilter } from '../types.js';

export interface Stats {
  total: number;
  abertas: number;
  concluidas: number;
  emAndamento: number;
  concluidasHoje: number;
  concluidasSemana: number;
  concluidasMes: number;
  concluidasAno: number;
  tempoMedioResolucao: number;
  porResponsavel: Array<{ responsavel: string; count: number }>;
  porCategoria: Array<{ categoria: string; count: number }>;
  porPrioridade: Array<{ prioridade: string; count: number }>;
  criadasPorDia: Array<{ dia: string; count: number }>;
  concluidasPorDia: Array<{ dia: string; count: number }>;
}

export class StatsService {
  getStats(filter?: StatsFilter): Stats {
    let demands = queryAll<DemandModel>('SELECT * FROM demands');

    // Apply filters
    if (filter?.responsavel) {
      demands = demands.filter(d => d.responsavel === filter.responsavel);
    }
    if (filter?.categoria) {
      demands = demands.filter(d => d.categoria === filter.categoria);
    }
    if (filter?.prioridade) {
      demands = demands.filter(d => d.prioridade === filter.prioridade);
    }

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));

    if (filter?.period) {
      const startDate = 
        filter.period === 'today' ? today :
        filter.period === 'week' ? weekAgo :
        filter.period === 'month' ? monthAgo :
        filter.period === 'year' ? yearAgo :
        null;

      if (startDate) {
        demands = demands.filter(d => new Date(d.created_at) >= startDate);
      }
    }

    const concluidas = demands.filter(d => d.status === 'concluidas');
    const concluidasHoje = concluidas.filter(d => 
      new Date(d.data_conclusao || 0) >= today
    );
    const concluidasSemana = concluidas.filter(d => 
      new Date(d.data_conclusao || 0) >= weekAgo
    );
    const concluidasMes = concluidas.filter(d => 
      new Date(d.data_conclusao || 0) >= monthAgo
    );
    const concluidasAno = concluidas.filter(d => 
      new Date(d.data_conclusao || 0) >= yearAgo
    );

    // Tempo médio de resolução
    const tempos = concluidas
      .filter(d => d.data_conclusao)
      .map(d => {
        const inicio = new Date(d.data_criacao).getTime();
        const fim = new Date(d.data_conclusao!).getTime();
        return Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
      });

    const tempoMedioResolucao = tempos.length > 0
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : 0;

    // Agrupamentos
    const porResponsavel = this.groupBy(demands, 'responsavel');
    const porCategoria = this.groupBy(demands, 'categoria');
    const porPrioridade = this.groupBy(demands, 'prioridade');

    // Criadas e concluídas por dia (últimos 30 dias)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const criadasPorDia = last30Days.map(dia => ({
      dia,
      count: demands.filter(d => d.data_criacao === dia).length,
    }));

    const concluidasPorDia = last30Days.map(dia => ({
      dia,
      count: demands.filter(d => d.data_conclusao === dia).length,
    }));

    return {
      total: demands.length,
      abertas: demands.filter(d => d.status !== 'concluidas').length,
      concluidas: concluidas.length,
      emAndamento: demands.filter(d => d.status === 'em_andamento').length,
      concluidasHoje: concluidasHoje.length,
      concluidasSemana: concluidasSemana.length,
      concluidasMes: concluidasMes.length,
      concluidasAno: concluidasAno.length,
      tempoMedioResolucao,
      porResponsavel,
      porCategoria,
      porPrioridade,
      criadasPorDia,
      concluidasPorDia,
    };
  }

  private groupBy<T extends Record<string, any>>(
    items: T[],
    key: keyof T
  ): Array<{ [K in keyof T]: string } & { count: number }> {
    const grouped = items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([value, count]) => ({ [key]: value, count } as any))
      .sort((a, b) => b.count - a.count);
  }
}
