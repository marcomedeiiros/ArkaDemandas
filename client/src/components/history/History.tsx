import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { ActivityLog, Stats } from '../../types';
import { ACTION_LABELS } from '../../types';
import { getActionColor, getActionEmoji } from '../../utils/colors';
import { formatDateTime } from '../../utils/dates';

interface HistoryProps {
  stats: Stats | null;
  tvMode?: boolean;
}

const PERIODS = [
  { id: 'all',   label: 'Todos',  emoji: '🌐' },
  { id: 'today', label: 'Hoje',   emoji: '☀️' },
  { id: 'week',  label: 'Semana', emoji: '📅' },
  { id: 'month', label: 'Mês',    emoji: '🗓️' },
  { id: 'year',  label: 'Ano',    emoji: '📆' },
];

export default function History({ stats, tvMode }: HistoryProps) {
  const [logs,    setLogs]    = useState<ActivityLog[]>([]);
  const [period,  setPeriod]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    setLoading(true);
    api.getLogs(period === 'all' ? undefined : period)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [period]);

  const filtered = search
    ? logs.filter(l =>
        l.details.toLowerCase().includes(search.toLowerCase()) ||
        l.demand_id.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="h-full overflow-y-auto">
      <div style={{ padding: tvMode ? '24px 28px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── Summary Stats ── */}
        {stats && (
          <div className={`grid gap-3 ${tvMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
            {[
              { label: 'Total',      value: stats.total,              color: '#4D94FF', emoji: '📊', bg: 'rgba(0,102,255,0.1)'  },
              { label: 'Abertas',    value: stats.abertas,            color: '#4D94FF', emoji: '📋', bg: 'rgba(0,102,255,0.1)'  },
              { label: 'Concluídas', value: stats.concluidas,         color: '#4ADE80', emoji: '✅', bg: 'rgba(34,197,94,0.1)'  },
              { label: 'Tempo Médio',value: `${stats.tempoMedioResolucao}d`, color: '#FCD34D', emoji: '⏱', bg: 'rgba(234,179,8,0.1)' },
            ].map((c, i) => (
              <div
                key={i}
                className="stat-card-glow rounded-2xl flex items-center gap-4"
                style={{
                  '--glow-color': c.bg,
                  background: 'rgba(21,25,34,0.9)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 2px 14px rgba(0,0,0,0.32)',
                  padding: tvMode ? '16px 18px' : '12px 14px',
                } as React.CSSProperties}
              >
                <div
                  className="rounded-xl flex items-center justify-center shrink-0"
                  style={{ width: '40px', height: '40px', background: c.bg, border: `1px solid ${c.color}25`, fontSize: '1.2rem' }}
                >
                  {c.emoji}
                </div>
                <div>
                  <div
                    className="font-bold tabular-nums leading-none"
                    style={{ fontSize: tvMode ? '2rem' : '1.6rem', color: c.color, textShadow: `0 0 16px ${c.color}45` }}
                  >
                    {c.value}
                  </div>
                  <p
                    className="font-medium mt-0.5"
                    style={{ fontSize: tvMode ? '0.82rem' : '0.72rem', color: 'rgba(255,255,255,0.42)' }}
                  >
                    {c.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div
          className="rounded-2xl flex flex-wrap items-center gap-3"
          style={{
            background: 'rgba(21,25,34,0.88)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '12px 16px',
          }}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mr-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,102,255,0.12)', border: '1px solid rgba(0,102,255,0.22)', fontSize: '1rem' }}
            >
              🕒
            </div>
            <h2
              className="font-bold text-white"
              style={{ fontSize: tvMode ? '1.1rem' : '0.92rem' }}
            >
              Histórico de Ações
            </h2>
          </div>

          {/* Period tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`period-tab ${period === p.id ? 'active' : ''}`}
                style={{ fontSize: tvMode ? '0.85rem' : '0.76rem', padding: tvMode ? '7px 14px' : '5px 10px' }}
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="ml-auto relative" style={{ minWidth: '220px' }}>
            <svg
              className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.28)', width: '14px', height: '14px' }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar no histórico…"
              className="input-premium"
              style={{ paddingLeft: '34px', height: '36px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* ── Timeline ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.9rem' }}>Carregando histórico…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              📭
            </div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem', fontWeight: 500 }}>
              Nenhum registro encontrado
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl"
            style={{
              background: 'rgba(21,25,34,0.85)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: tvMode ? '20px 24px' : '14px 18px',
            }}
          >
            {/* Timeline header */}
            <div className="flex items-center gap-2 mb-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '1rem' }}>📜</span>
              <span
                className="font-semibold"
                style={{ fontSize: tvMode ? '0.9rem' : '0.78rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}
              >
                {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {/* Items */}
            <div style={{ position: 'relative' }}>
              {filtered.map((log, idx) => {
                const actionColor = getActionColor(log.action);
                const actionEmoji = getActionEmoji(log.action);
                const actionLabel = ACTION_LABELS[log.action as keyof typeof ACTION_LABELS] || log.action;

                return (
                  <div
                    key={log.id}
                    className="timeline-item"
                    style={{ animationDelay: `${idx * 0.025}s` }}
                  >
                    {/* Vertical line */}
                    {idx < filtered.length - 1 && (
                      <div className="timeline-line" />
                    )}

                    {/* Dot */}
                    <div
                      className="timeline-dot shrink-0"
                      style={{
                        background: `${actionColor}18`,
                        border: `2px solid ${actionColor}45`,
                        color: actionColor,
                        fontSize: tvMode ? '0.85rem' : '0.75rem',
                        width: tvMode ? '36px' : '30px',
                        height: tvMode ? '36px' : '30px',
                      }}
                    >
                      {actionEmoji}
                    </div>

                    {/* Card */}
                    <div className="timeline-card flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        {/* Left: badge + detail */}
                        <div className="flex items-start gap-2 flex-wrap min-w-0">
                          <span
                            className="action-badge shrink-0"
                            style={{
                              background: `${actionColor}14`,
                              border: `1px solid ${actionColor}30`,
                              color: actionColor,
                              fontSize: tvMode ? '0.78rem' : '0.68rem',
                            }}
                          >
                            {actionEmoji} {actionLabel}
                          </span>
                          <div className="min-w-0">
                            <p
                              className="font-medium text-white truncate"
                              style={{ fontSize: tvMode ? '0.92rem' : '0.8rem' }}
                            >
                              {log.details}
                            </p>
                            <div
                              className="flex items-center gap-2 mt-0.5 flex-wrap"
                              style={{ fontSize: tvMode ? '0.75rem' : '0.67rem', color: 'rgba(255,255,255,0.32)' }}
                            >
                              <span
                                className="font-mono font-semibold"
                                style={{ color: 'rgba(77,148,255,0.7)' }}
                              >
                                {log.demand_id}
                              </span>
                              {log.from_status && log.to_status && (
                                <span>
                                  {log.from_status}
                                  <span style={{ color: actionColor, margin: '0 4px' }}>→</span>
                                  {log.to_status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: timestamp */}
                        <span
                          className="shrink-0 font-medium tabular-nums"
                          style={{
                            fontSize: tvMode ? '0.75rem' : '0.65rem',
                            color: 'rgba(255,255,255,0.28)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
