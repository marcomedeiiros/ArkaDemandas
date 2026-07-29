import { useState, useRef, useEffect } from 'react';
import type { Demand } from '../../types';
import { getPriorityColor, getPriorityLabel, getDeadlineStatus } from '../../utils/colors';
import { formatDate, getTimeOpen, getTimeOpenLabel } from '../../utils/dates';
import { Icon } from '../ui/Icon';

interface DemandCardProps {
  demand: Demand;
  onEdit: (demand: Demand) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  tvMode?: boolean;
}

export default function DemandCard({ demand, onEdit, onDuplicate, onDelete, tvMode }: DemandCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const deadlineStatus = getDeadlineStatus(demand.prazo);
  const isOverdue = deadlineStatus === 'overdue' && demand.status !== 'concluidas';
  const isWarning = deadlineStatus === 'warning' && demand.status !== 'concluidas';
  const priorityColor = getPriorityColor(demand.prioridade);
  const priorityLabel = getPriorityLabel(demand.prioridade);

  const deadlineIndicator = demand.prazo
    ? isOverdue ? { icon: 'alertTriangle' as const, label: 'Vencida', color: '#F87171' }
    : isWarning ? { icon: 'clock' as const, label: 'Próx. vencimento', color: '#FCD34D' }
    : { icon: 'checkCircle' as const, label: 'No prazo', color: '#4ADE80' }
    : null;

  const cardBg = isOverdue
    ? 'rgba(239,68,68,0.05)'
    : isWarning
    ? 'rgba(234,179,8,0.04)'
    : 'rgba(21,25,34,0.9)';

  const cardBorder = isOverdue
    ? 'rgba(239,68,68,0.28)'
    : isWarning
    ? 'rgba(234,179,8,0.22)'
    : 'rgba(255,255,255,0.07)';

  const fs = tvMode
    ? { id: '0.8rem', title: '1.05rem', meta: '0.85rem', foot: '0.78rem' }
    : { id: '0.72rem', title: '0.92rem', meta: '0.78rem', foot: '0.7rem' };

  const padding = tvMode ? '16px 16px 14px' : '14px 14px 12px';
  const minHeight = tvMode ? '280px' : '240px';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div
      className="demand-card relative rounded-2xl group"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        paddingLeft: '16px',
        minHeight,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 10px 40px rgba(0,0,0,0.6), 0 0 24px ${priorityColor}45, 0 0 0 1px ${priorityColor}60`;
        (e.currentTarget as HTMLElement).style.borderColor = `${priorityColor}80`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.4)';
        (e.currentTarget as HTMLElement).style.borderColor = cardBorder;
      }}
    >
      <div
        className="priority-stripe"
        style={{
          backgroundColor: priorityColor,
          boxShadow: `0 0 14px ${priorityColor}, 0 0 28px ${priorityColor}80`,
        }}
      />

      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at top left, ${priorityColor}15 0%, transparent 65%)` }}
      />

      <div className="relative" style={{ padding }}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="font-mono font-bold tracking-wide"
            style={{ fontSize: fs.id, color: '#4D94FF', letterSpacing: '0.05em', textShadow: '0 0 12px rgba(77,148,255,0.7)' }}
          >
            {demand.id}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-extrabold border"
              style={{
                fontSize: tvMode ? '0.72rem' : '0.64rem',
                background: `${priorityColor}25`,
                color: '#FFFFFF',
                borderColor: `${priorityColor}60`,
                boxShadow: `0 0 12px ${priorityColor}50`,
                textShadow: `0 0 6px ${priorityColor}`,
                letterSpacing: '0.03em',
              }}
            >
              {priorityLabel}
            </span>

            {!tvMode && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  <Icon name="moreVertical" size={14} />
                </button>

                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-xl py-1 z-50 animate-fade-in-scale"
                    style={{
                      background: 'rgba(18,22,30,0.98)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      minWidth: '140px',
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(demand); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: 'rgba(255,255,255,0.8)' }}
                    >
                      <Icon name="edit" size={14} />
                      Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(demand.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: 'rgba(255,255,255,0.8)' }}
                    >
                      <Icon name="copy" size={14} />
                      Duplicar
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); if (confirm('Excluir esta demanda?')) onDelete(demand.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 transition-colors"
                      style={{ color: '#F87171' }}
                    >
                      <Icon name="delete" size={14} />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="font-semibold text-white leading-snug mb-1.5 cursor-pointer"
          style={{ fontSize: fs.title }}
          onClick={() => onEdit(demand)}
        >
          {demand.titulo}
        </div>

        {demand.descricao && (
          <p
            className="line-clamp-2 text-xs font-normal mb-3 cursor-pointer leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={() => onEdit(demand)}
          >
            {demand.descricao}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon name="building" size={tvMode ? 15 : 14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <span
              className="truncate font-medium"
              style={{ fontSize: fs.meta, color: 'rgba(255,255,255,0.75)' }}
            >
              {demand.cliente}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Icon name="user" size={tvMode ? 15 : 14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <span
              className="truncate"
              style={{ fontSize: fs.meta, color: 'rgba(255,255,255,0.55)' }}
            >
              {demand.responsavel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Icon name="folder" size={tvMode ? 15 : 14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <span
              className="truncate"
              style={{ fontSize: fs.meta, color: 'rgba(255,255,255,0.42)' }}
            >
              {demand.categoria}
            </span>
          </div>
        </div>

        <div
          className="my-3"
          style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }}
        />

        <div className="flex items-center justify-between gap-2 mb-2">
          <div
            className="flex items-center gap-1.5"
            style={{ fontSize: fs.foot, color: 'rgba(255,255,255,0.35)' }}
          >
            <Icon name="calendar" size={12} />
            <span>{formatDate(demand.data_criacao)}</span>
          </div>

          {demand.prazo ? (
            <div
              className="flex items-center gap-1.5 font-semibold"
              style={{
                fontSize: fs.foot,
                color: isOverdue ? '#F87171' : isWarning ? '#FCD34D' : 'rgba(255,255,255,0.35)',
              }}
            >
              <Icon name="clock" size={12} />
              <span>{formatDate(demand.prazo)}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5"
              style={{ fontSize: fs.foot, color: 'rgba(255,255,255,0.28)' }}
            >
              <Icon name="clock" size={12} />
              <span>Aberta há {getTimeOpenLabel(demand.data_criacao)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            style={{ fontSize: fs.foot, color: 'rgba(255,255,255,0.28)' }}
          >
            {getTimeOpen(demand.data_criacao, demand.data_conclusao)}
          </span>

          {deadlineIndicator && (
            <span
              className="flex items-center gap-1 font-semibold"
              style={{ fontSize: fs.foot, color: deadlineIndicator.color }}
            >
              <Icon name={deadlineIndicator.icon} size={12} />
              {deadlineIndicator.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
