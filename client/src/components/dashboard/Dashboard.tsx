import { useState } from 'react';
import type { Stats, StatsFilter, Priority } from '../../types';
import { PRIORITIES } from '../../types';
import { api } from '../../api';

interface DashboardProps {
  stats: Stats | null;
  tvMode?: boolean;
}

const PERIOD_OPTIONS = [
  { id: 'all',   label: 'Todos',  emoji: '🌐' },
  { id: 'today', label: 'Hoje',   emoji: '☀️' },
  { id: 'week',  label: 'Semana', emoji: '📅' },
  { id: 'month', label: 'Mês',    emoji: '🗓️' },
  { id: 'year',  label: 'Ano',    emoji: '📆' },
] as const;

function buildStatCards(s: Stats) {
  return [
    { label: 'Total de Demandas',   value: s.total,              color: '#4D94FF', emoji: '📊', bg: 'rgba(0,102,255,0.1)'  },
    { label: 'Demandas Abertas',    value: s.abertas,            color: '#4D94FF', emoji: '📋', bg: 'rgba(0,102,255,0.1)'  },
    { label: 'Em Andamento',        value: s.emAndamento,        color: '#A78BFA', emoji: '⚙️', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Concluídas Total',    value: s.concluidas,         color: '#4ADE80', emoji: '✅', bg: 'rgba(34,197,94,0.1)'  },
    { label: 'Concluídas Hoje',     value: s.concluidasHoje,     color: '#4ADE80', emoji: '🎯', bg: 'rgba(34,197,94,0.1)'  },
    { label: 'Concluídas na Semana',value: s.concluidasSemana,   color: '#22D3EE', emoji: '📈', bg: 'rgba(6,182,212,0.1)'  },
    { label: 'Concluídas no Mês',   value: s.concluidasMes,      color: '#22D3EE', emoji: '📅', bg: 'rgba(6,182,212,0.1)'  },
    { label: 'Tempo Médio',         value: `${s.tempoMedioResolucao}d`, color: '#FCD34D', emoji: '⏱', bg: 'rgba(234,179,8,0.1)' },
  ];
}

export default function Dashboard({ stats, tvMode }: DashboardProps) {
  const [filter, setFilter]           = useState<StatsFilter>({ period: 'all' });
  const [filteredStats, setFiltered]  = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(false);

  const S = filteredStats ?? stats;

  const applyFilter = async () => {
    setLoading(true);
    try { setFiltered(await api.getStats(filter)); }
    finally { setLoading(false); }
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

  const cards = buildStatCards(S);

  return (
    <div className="h-full overflow-y-auto">
      <div style={{ padding: tvMode ? '24px 28px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: tvMode ? '20px' : '14px' }}>

        {/* ── Filter bar ── */}
        <div
          className="rounded-2xl"
          style={{
            background: 'rgba(21,25,34,0.88)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '14px 18px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Period tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {PERIOD_OPTIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setFilter(prev => ({ ...prev, period: p.id }))}
                className={`period-tab ${filter.period === p.id ? 'active' : ''}`}
                style={{ fontSize: tvMode ? '0.9rem' : '0.8rem', padding: tvMode ? '8px 16px' : '6px 12px' }}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          {/* Selects */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter.responsavel ?? ''}
              onChange={e => setFilter(prev => ({ ...prev, responsavel: e.target.value || undefined }))}
              className="select-premium"
              style={{ minWidth: '150px', height: '36px', fontSize: '0.8rem', padding: '0 32px 0 12px' }}
            >
              <option value="">👤 Todos responsáveis</option>
              {stats?.porResponsavel.map(r => (
                <option key={r.responsavel} value={r.responsavel}>{r.responsavel}</option>
              ))}
            </select>
            <select
              value={filter.categoria ?? ''}
              onChange={e => setFilter(prev => ({ ...prev, categoria: e.target.value || undefined }))}
              className="select-premium"
              style={{ minWidth: '150px', height: '36px', fontSize: '0.8rem', padding: '0 32px 0 12px' }}
            >
              <option value="">📂 Todas categorias</option>
              {stats?.porCategoria.map(c => (
                <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
              ))}
            </select>
            <select
              value={filter.prioridade ?? ''}
              onChange={e => setFilter(prev => ({ ...prev, prioridade: (e.target.value || undefined) as Priority | undefined }))}
              className="select-premium"
              style={{ minWidth: '150px', height: '36px', fontSize: '0.8rem', padding: '0 32px 0 12px' }}
            >
              <option value="">🎯 Todas prioridades</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <button
            onClick={applyFilter}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
            style={{ height: '36px', padding: '0 18px', fontSize: '0.8rem', gap: '6px' }}
          >
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Filtrando…</>
              : <>🔍 Aplicar</>
            }
          </button>

          {/* Export */}
          <div className="ml-auto flex gap-1.5">
            {(['csv', 'excel', 'pdf'] as const).map(fmt => (
              <a
                key={fmt}
                href={api.exportUrl(fmt)}
                className="btn-secondary"
                style={{ height: '36px', padding: '0 12px', fontSize: '0.75rem', gap: '5px' }}
              >
                ⬇️ {fmt.toUpperCase()}
              </a>
            ))}
          </div>
        </div>

        {/* ── Stat Cards Grid ── */}
        <div className={`grid gap-3 ${tvMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
          {cards.map((card, i) => (
            <div
              key={i}
              className="stat-card-glow rounded-2xl cursor-default"
              style={{
                '--glow-color': card.bg,
                background: 'rgba(21,25,34,0.9)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
                padding: tvMode ? '20px 20px' : '16px 18px',
                animationDelay: `${i * 0.05}s`,
              } as React.CSSProperties}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: card.bg, border: `1px solid ${card.color}25`, fontSize: '1.1rem' }}
                >
                  {card.emoji}
                </div>
              </div>
              <div
                className="font-bold leading-none mb-1.5 tabular-nums animate-number-count"
                style={{
                  fontSize: tvMode ? '3rem' : '2.25rem',
                  color: card.color,
                  textShadow: `0 0 24px ${card.color}45`,
                }}
              >
                {card.value}
              </div>
              <p
                className="font-medium"
                style={{ fontSize: tvMode ? '0.85rem' : '0.75rem', color: 'rgba(255,255,255,0.45)' }}
              >
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Charts Row 1 ── */}
        <div className={`grid gap-3 ${tvMode ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
          <PremiumBarChart title="Por Responsável" emoji="👤" color="#4D94FF"
            data={S.porResponsavel.map(r => ({ label: r.responsavel, value: r.count }))}
            tvMode={tvMode} />
          <PremiumBarChart title="Por Categoria" emoji="📂" color="#A78BFA"
            data={S.porCategoria.map(c => ({ label: c.categoria, value: c.count }))}
            tvMode={tvMode} />
          <PremiumBarChart title="Por Prioridade" emoji="🎯" color="#FCD34D"
            data={S.porPrioridade.map(p => ({
              label: p.prioridade, value: p.count,
              customColor: p.prioridade === 'Urgente' ? '#F87171'
                         : p.prioridade === 'Alta'    ? '#FB923C'
                         : p.prioridade === 'Média'   ? '#FCD34D'
                         : '#4ADE80',
            }))}
            tvMode={tvMode} />
        </div>

        {/* ── Charts Row 2 ── */}
        <div className={`grid gap-3 ${tvMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
          <PremiumBarChart title="Criadas por Dia (30 dias)" emoji="📥" color="#4D94FF"
            data={S.criadasPorDia.map(d => ({ label: d.dia.slice(5), value: d.count }))}
            tvMode={tvMode} />
          <PremiumBarChart title="Concluídas por Dia (30 dias)" emoji="✅" color="#4ADE80"
            data={S.concluidasPorDia.map(d => ({ label: d.dia.slice(5), value: d.count }))}
            tvMode={tvMode} />
        </div>

        {/* ── Ranking ── */}
        <div className={`grid gap-3 ${tvMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
          <RankingPanel
            title="Ranking por Responsável"
            emoji="🏆"
            data={S.porResponsavel.sort((a, b) => b.count - a.count)}
            labelKey="responsavel"
            tvMode={tvMode}
          />
          <RankingPanel
            title="Ranking por Categoria"
            emoji="📂"
            data={S.porCategoria.sort((a, b) => b.count - a.count)}
            labelKey="categoria"
            tvMode={tvMode}
          />
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PremiumBarChart
══════════════════════════════════════ */
function PremiumBarChart({
  title, emoji, data, color, tvMode,
}: {
  title: string;
  emoji: string;
  data: { label: string; value: number; customColor?: string }[];
  color: string;
  tvMode?: boolean;
}) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'rgba(21,25,34,0.88)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        padding: tvMode ? '18px 18px' : '14px 16px',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}28`, fontSize: '1rem' }}
        >
          {emoji}
        </div>
        <h3
          className="font-bold"
          style={{ fontSize: tvMode ? '0.95rem' : '0.82rem', color: 'rgba(255,255,255,0.85)' }}
        >
          {title}
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Sem dados</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {data.slice(0, 8).map((item, i) => {
            const pct = Math.round((item.value / max) * 100);
            const barColor = item.customColor ?? color;
            return (
              <div key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="truncate font-medium"
                    style={{
                      fontSize: tvMode ? '0.8rem' : '0.72rem',
                      color: 'rgba(255,255,255,0.65)',
                      maxWidth: '65%',
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-bold tabular-nums"
                    style={{ fontSize: tvMode ? '0.85rem' : '0.75rem', color: barColor }}
                  >
                    {item.value}
                  </span>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ height: tvMode ? '7px' : '5px', background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full chart-bar"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${barColor}, ${barColor}99)`,
                      boxShadow: `0 0 8px ${barColor}40`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   RankingPanel
══════════════════════════════════════ */
const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#FCD34D', '#94A3B8', '#FB923C'];

function RankingPanel({
  title, emoji, data, labelKey, tvMode,
}: {
  title: string;
  emoji: string;
  data: { [key: string]: string | number }[];
  labelKey: string;
  tvMode?: boolean;
}) {
  const max = Math.max(...data.map(d => d.count as number), 1);

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'rgba(21,25,34,0.88)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        padding: tvMode ? '18px 18px' : '14px 16px',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.22)', fontSize: '1rem' }}
        >
          {emoji}
        </div>
        <h3
          className="font-bold"
          style={{ fontSize: tvMode ? '0.95rem' : '0.82rem', color: 'rgba(255,255,255,0.85)' }}
        >
          {title}
        </h3>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Sem dados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 6).map((item, i) => {
            const pct = Math.round(((item.count as number) / max) * 100);
            const medal = MEDALS[i] ?? `${i + 1}`;
            const rankColor = RANK_COLORS[i] ?? '#4D94FF';
            return (
              <div
                key={i}
                className="ranking-row"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Rank */}
                <span
                  className="shrink-0 w-7 text-center font-bold"
                  style={{ fontSize: tvMode ? '1.1rem' : '0.95rem' }}
                >
                  {medal}
                </span>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span
                      className="truncate font-semibold"
                      style={{ fontSize: tvMode ? '0.85rem' : '0.75rem', color: 'rgba(255,255,255,0.8)' }}
                    >
                      {item[labelKey] as string}
                    </span>
                    <span
                      className="font-bold tabular-nums shrink-0"
                      style={{ fontSize: tvMode ? '0.85rem' : '0.75rem', color: rankColor }}
                    >
                      {item.count as number}
                    </span>
                  </div>
                  <div
                    className="rounded-full overflow-hidden"
                    style={{ height: '4px', background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full chart-bar"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${rankColor}, ${rankColor}88)`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
