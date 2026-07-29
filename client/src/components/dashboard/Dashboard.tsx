import { useState } from 'react';
import {
  Globe, Sun, CalendarDays, Calendar, TrendingUp,
  Filter, Download, Clock, CheckCircle2,
} from 'lucide-react';
import type { Stats, StatsFilter } from '../../types';
import { api } from '../../api';
import { exportDashboardPdf } from '../../utils/pdfExport';
import {
  ChartCard,
  StatusDoughnutChart,
  CreatedPerDayChart,
  CreatedPerWeekChart,
  CreatedPerMonthChart,
  CompletionGaugeChart,
  EvolutionChart,
  ComparisonChart,
} from './ChartComponents';

interface DashboardProps {
  stats: Stats | null;
}

const PERIOD_OPTIONS = [
  { id: 'all',   label: 'Todos',  Icon: Globe },
  { id: 'today', label: 'Hoje',   Icon: Sun },
  { id: 'week',  label: 'Semana', Icon: CalendarDays },
  { id: 'month', label: 'Mês',    Icon: Calendar },
  { id: 'year',  label: 'Ano',    Icon: TrendingUp },
] as const;

export default function Dashboard({ stats }: DashboardProps) {
  const [filter, setFilter]          = useState<StatsFilter>({ period: 'all' });
  const [filteredStats, setFiltered] = useState<Stats | null>(null);
  const [loading, setLoading]        = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const S = filteredStats ?? stats;

  const handlePeriodChange = async (period: StatsFilter['period']) => {
    setFilter({ period });
    setLoading(true);
    try {
      const data = await api.getStats({ period });
      setFiltered(data);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfExport = async () => {
    setExportingPdf(true);
    try {
      const currentOpt = PERIOD_OPTIONS.find(p => p.id === filter.period);
      await exportDashboardPdf(S, currentOpt?.label || 'Todos');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!S) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '1rem' }}>Carregando estatísticas…</p>
      </div>
    </div>
  );

  // Top Minimalist Stat Cards (No icons, Big number on top, text below)
  const topCards = [
    { label: 'Novas',             value: S.novas,       color: '#0066FF' },
    { label: 'Em andamento',      value: S.emAndamento, color: '#8B5CF6' },
    { label: 'Aguardando',        value: S.aguardando,  color: '#F59E0B' },
    { label: 'Em revisão',        value: S.emRevisao,   color: '#06B6D4' },
    { label: 'Concluídas',        value: S.concluidas,  color: '#22C55E' },
    { label: 'Hoje',              value: S.hoje,        color: '#60A5FA' },
    { label: 'Semana',            value: S.semana,      color: '#A78BFA' },
    { label: 'Total de demandas', value: S.total,       color: '#F43F5E' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-[1700px] mx-auto w-full" id="dashboard-container">

        {/* ── Responsive Professional Toolbar ── */}
        <div
          className="rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 w-full"
          style={{
            background: 'rgba(21,25,34,0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Period selector tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white/40 flex items-center gap-1.5 mr-1">
              <Filter size={14} className="text-arka-blue" /> Período:
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {PERIOD_OPTIONS.map(p => {
                const isActive = filter.period === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePeriodChange(p.id)}
                    disabled={loading}
                    className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-arka-blue text-white shadow-lg shadow-blue-500/25 border border-blue-400/30'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    <p.Icon size={14} />
                    {p.label}
                  </button>
                );
              })}
            </div>
            {loading && (
              <div className="w-4 h-4 border-2 border-arka-blue/30 border-t-arka-blue rounded-full animate-spin ml-2" />
            )}
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <span className="text-xs font-semibold text-white/40 hidden md:inline mr-1">
              Exportar:
            </span>
            <a
              href={api.exportUrl('csv')}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all duration-200"
            >
              <Download size={13} className="text-arka-blue" />
              CSV
            </a>
            <a
              href={api.exportUrl('excel')}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all duration-200"
            >
              <Download size={13} className="text-arka-blue" />
              EXCEL
            </a>
            <button
              onClick={handlePdfExport}
              disabled={exportingPdf}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 transition-all duration-200 shadow-lg shadow-blue-500/10"
            >
              {exportingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={13} className="text-blue-400" />
                  PDF (Com Gráficos)
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Top Minimalist Stat Cards Grid (8 Cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {topCards.map((card, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-[#151922]/90 shadow-md hover:border-white/20 transition-all duration-200"
              style={{ minHeight: '96px' }}
            >
              <span
                className="text-3xl font-extrabold tabular-nums tracking-tight mb-1"
                style={{
                  color: card.color,
                  textShadow: `0 0 14px ${card.color}70`,
                }}
              >
                {card.value}
              </span>
              <span className="text-xs font-semibold text-white/50 truncate max-w-full text-center">
                {card.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── SLA & Performance Summary Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#151922]/80 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="text-amber-400" size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400 tabular-nums">{S.tempoMedioResolucao} dias</div>
              <div className="text-xs text-white/40">Tempo médio de resolução</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#151922]/80 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Clock className="text-blue-400" size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400 tabular-nums">{S.tempoMedioAtendimento}h</div>
              <div className="text-xs text-white/40">Tempo médio de atendimento</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#151922]/80 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-emerald-400" size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">{S.taxaConclusao}%</div>
              <div className="text-xs text-white/40">Taxa de conclusão geral</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#151922]/80 border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="text-indigo-400" size={22} />
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-400 tabular-nums">{S.abertas}</div>
              <div className="text-xs text-white/40">Demandas ativas / abertas</div>
            </div>
          </div>
        </div>

        {/* ── Main Chart Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chart 1: Demandas por Status (Doughnut) */}
          <ChartCard title="Demandas por Status" subtitle="Distribuição por etapa do Help Desk">
            <StatusDoughnutChart data={S.porStatus} />
          </ChartCard>

          {/* Chart 2: Demandas Criadas por Dia (Line Chart) */}
          <ChartCard title="Demandas Criadas por Dia" subtitle="Histórico dos últimos 30 dias">
            <CreatedPerDayChart data={S.criadasPorDia} />
          </ChartCard>

          {/* Chart 3: Taxa de Conclusão (Gauge Chart) */}
          <ChartCard title="Taxa de Conclusão" subtitle="Proporção de chamados resolvidos">
            <CompletionGaugeChart rate={S.taxaConclusao} concluidas={S.concluidas} total={S.total} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 4: Demandas Criadas por Semana (Bar Chart) */}
          <ChartCard title="Demandas Criadas por Semana" subtitle="Volume nas últimas 8 semanas">
            <CreatedPerWeekChart data={S.criadasPorSemana} />
          </ChartCard>

          {/* Chart 5: Demandas Criadas por Mês (Bar Chart) */}
          <ChartCard title="Demandas Criadas por Mês" subtitle="Comparativo mensal">
            <CreatedPerMonthChart data={S.criadasPorMes} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 6: Evolução das Demandas (Acumulado) */}
          <ChartCard title="Evolução das Demandas" subtitle="Acumulado vs. novas entradas">
            <EvolutionChart data={S.evolucaoDemandas} />
          </ChartCard>

          {/* Chart 7: Comparativo Abertas x Concluídas */}
          <ChartCard title="Comparativo Abertas vs. Concluídas" subtitle="Desempenho diário de fechamento">
            <ComparisonChart data={S.comparativoAbertasConcluidas} />
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
