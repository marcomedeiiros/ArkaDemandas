import { queryAll } from '../database.js';
import type { DemandModel } from '../models/Demand.model.js';
import type { Stats, StatsFilter } from '../types.js';

export type { Stats };

export class StatsService {
  getStats(filter?: StatsFilter): Stats {
    let demands = queryAll<DemandModel>('SELECT * FROM demands');
    const allActivityLogs = queryAll<{ demand_id: string; action: string; to_status: string | null; created_at: string }>(
      'SELECT demand_id, action, to_status, created_at FROM activity_logs ORDER BY created_at ASC'
    );

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
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

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

    const novas = demands.filter(d => d.status === 'novas').length;
    const emAndamento = demands.filter(d => d.status === 'em_andamento').length;
    const aguardando = demands.filter(d => d.status === 'aguardando').length;
    const emRevisao = demands.filter(d => d.status === 'em_revisao').length;
    const concluidasList = demands.filter(d => d.status === 'concluidas');
    const concluidas = concluidasList.length;
    const abertas = demands.length - concluidas;

    const hoje = demands.filter(d => {
      const dDate = new Date(d.data_criacao || d.created_at);
      return dDate >= today;
    }).length;

    const semana = demands.filter(d => {
      const dDate = new Date(d.data_criacao || d.created_at);
      return dDate >= weekAgo;
    }).length;

    const concluidasHoje = concluidasList.filter(d => 
      new Date(d.data_conclusao || d.updated_at || 0) >= today
    ).length;

    const concluidasSemana = concluidasList.filter(d => 
      new Date(d.data_conclusao || d.updated_at || 0) >= weekAgo
    ).length;

    const concluidasMes = concluidasList.filter(d => 
      new Date(d.data_conclusao || d.updated_at || 0) >= monthAgo
    ).length;

    const concluidasAno = concluidasList.filter(d => 
      new Date(d.data_conclusao || d.updated_at || 0) >= yearAgo
    ).length;

    const temposResolucao = concluidasList
      .filter(d => d.data_conclusao || d.updated_at)
      .map(d => {
        const inicio = new Date(d.data_criacao || d.created_at).getTime();
        const fim = new Date(d.data_conclusao || d.updated_at).getTime();
        const diff = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
      });

    const tempoMedioResolucao = temposResolucao.length > 0
      ? Math.round(temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length)
      : 0;

    const temposAtendimento: number[] = [];
    demands.forEach(d => {
      const firstMove = allActivityLogs.find(l => l.demand_id === d.id && (l.to_status === 'em_andamento' || l.action === 'movida'));
      if (firstMove) {
        const criacao = new Date(d.created_at).getTime();
        const atendimento = new Date(firstMove.created_at).getTime();
        const horas = Math.max(0.5, Math.round((atendimento - criacao) / (1000 * 60 * 60)));
        temposAtendimento.push(horas);
      }
    });

    const tempoMedioAtendimento = temposAtendimento.length > 0
      ? Math.round((temposAtendimento.reduce((a, b) => a + b, 0) / temposAtendimento.length) * 10) / 10
      : (demands.length > 0 ? 1.5 : 0);

    const total = demands.length;
    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    // Distribuição por bloco/coluna real (dinâmico), respeitando os filtros
    // já aplicados em `demands`. Antes era fixo nos 5 status padrão.
    const columns = queryAll<{ id: string; label: string; color: string; order_index: number }>(
      'SELECT id, label, color, order_index FROM columns ORDER BY order_index ASC'
    );
    const porStatus = columns.map(col => ({
      status: col.id,
      label: col.label,
      color: col.color,
      count: demands.filter(d => d.status === col.id).length,
    }));

    const porResponsavel = this.groupBy(demands, 'responsavel');
    const porCategoria = this.groupBy(demands, 'categoria');
    const porPrioridade = this.groupBy(demands, 'prioridade');

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    const criadasPorDia = last30Days.map(dia => ({
      dia,
      count: demands.filter(d => (d.data_criacao === dia || d.created_at.startsWith(dia))).length,
    }));

    const concluidasPorDia = last30Days.map(dia => ({
      dia,
      count: demands.filter(d => (d.data_conclusao === dia || (d.status === 'concluidas' && d.updated_at.startsWith(dia)))).length,
    }));

    // Criadas por Semana (últimas 8 semanas)
    const criadasPorSemana = Array.from({ length: 8 }, (_, i) => {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);

      const count = demands.filter(d => {
        const dt = new Date(d.data_criacao || d.created_at);
        return dt >= startDate && dt <= endDate;
      }).length;

      const semLabel = `Sem ${8 - i}`;
      return { semana: semLabel, count };
    }).reverse();

    // Criadas por Mês (últimos 6 meses)
    const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const criadasPorMes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth();
      const count = demands.filter(dm => {
        const dt = new Date(dm.data_criacao || dm.created_at);
        return dt.getFullYear() === mYear && dt.getMonth() === mMonth;
      }).length;
      return { mes: `${monthsNames[mMonth]}/${String(mYear).slice(2)}`, count };
    });

    // Evolução das demandas (Acumuladas por dia nos últimos 30 dias)
    let acumulado = 0;
    const evolucaoDemandas = last30Days.map(dia => {
      const criadasNoDia = demands.filter(d => (d.data_criacao === dia || d.created_at.startsWith(dia))).length;
      acumulado += criadasNoDia;
      return {
        dia,
        criadas: criadasNoDia,
        acumuladas: acumulado,
      };
    });

    // Comparativo entre demandas abertas e concluídas por dia
    const comparativoAbertasConcluidas = last30Days.map(dia => {
      const criadas = demands.filter(d => (d.data_criacao === dia || d.created_at.startsWith(dia))).length;
      const conc = demands.filter(d => (d.data_conclusao === dia || (d.status === 'concluidas' && d.updated_at.startsWith(dia)))).length;
      return {
        dia,
        abertas: criadas,
        concluidas: conc,
      };
    });

    return {
      total,
      novas,
      emAndamento,
      aguardando,
      emRevisao,
      concluidas,
      abertas,
      hoje,
      semana,
      concluidasHoje,
      concluidasSemana,
      concluidasMes,
      concluidasAno,
      tempoMedioResolucao,
      tempoMedioAtendimento,
      taxaConclusao,
      porStatus,
      porResponsavel,
      porCategoria,
      porPrioridade,
      criadasPorDia,
      concluidasPorDia,
      criadasPorSemana,
      criadasPorMes,
      evolucaoDemandas,
      comparativoAbertasConcluidas,
    };
  }

  private groupBy<T extends Record<string, any>>(
    items: T[],
    key: keyof T
  ): Array<{ [K in keyof T]: string } & { count: number }> {
    const grouped = items.reduce((acc, item) => {
      const value = String(item[key] || 'Não atribuído');
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([value, count]) => ({ [key]: value, count } as any))
      .sort((a, b) => b.count - a.count);
  }
}
