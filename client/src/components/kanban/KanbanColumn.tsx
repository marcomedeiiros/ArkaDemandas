import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Demand, ColumnStatus } from '../../types';
import SortableDemandCard from './SortableDemandCard';
import { Icon, type IconName } from '../ui/Icon';

interface KanbanColumnProps {
  id: ColumnStatus;
  label: string;
  color: string;
  icon: IconName;
  demands: Demand[];
  onEdit: (demand: Demand) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  tvMode?: boolean;
}

export default function KanbanColumn({
  id, label, color, icon, demands, onEdit, onDuplicate, onDelete, tvMode,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className="kanban-column flex flex-col rounded-2xl overflow-hidden h-full kanban-column-inner"
      style={{
        background: isOver
          ? `linear-gradient(180deg, rgba(24,30,41,0.97) 0%, rgba(21,25,34,0.95) 100%)`
          : `linear-gradient(180deg, rgba(24,30,41,0.92) 0%, rgba(21,25,34,0.88) 100%)`,
        border: isOver
          ? `1px solid ${color}45`
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isOver
          ? `0 0 0 2px ${color}20, 0 12px 48px rgba(0,0,0,0.5)`
          : '0 4px 32px rgba(0,0,0,0.38)',
        backdropFilter: 'blur(12px)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
      }}
    >
      <div
        className="shrink-0 h-[4px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}88, ${color})`,
          boxShadow: `0 0 16px ${color}A0, 0 0 32px ${color}50`,
        }}
      />

      <div
        className="col-header shrink-0 flex items-center gap-2.5"
        style={{
          background: `linear-gradient(135deg, ${color}22 0%, ${color}0A 100%)`,
          borderBottom: `1px solid ${color}35`,
          boxShadow: `inset 0 1px 0 ${color}30, 0 4px 20px ${color}18`,
          padding: tvMode ? '14px 16px' : '12px 14px',
        }}
      >
        <div
          className="p-1.5 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}25`,
            border: `1px solid ${color}55`,
            boxShadow: `0 0 12px ${color}60`,
          }}
        >
          <Icon name={icon} size={tvMode ? 20 : 17} style={{ color, filter: `drop-shadow(0 0 6px ${color})` }} />
        </div>
        <h2
          className="font-bold flex-1 tracking-wide"
          style={{
            fontSize: tvMode ? '1.05rem' : '0.9rem',
            color: '#FFFFFF',
            letterSpacing: '0.03em',
            textShadow: `0 0 12px ${color}70`,
          }}
        >
          {label}
        </h2>
        <span
          className="font-extrabold tabular-nums"
          style={{
            background: `${color}30`,
            color: '#FFFFFF',
            border: `1px solid ${color}60`,
            borderRadius: '999px',
            padding: tvMode ? '4px 12px' : '3px 10px',
            fontSize: tvMode ? '0.88rem' : '0.75rem',
            boxShadow: `0 0 14px ${color}60`,
            textShadow: `0 0 8px ${color}`,
          }}
        >
          {demands.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto ${isOver ? 'drop-zone-active' : ''}`}
        style={{
          padding: tvMode ? '12px' : '10px',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: tvMode ? '12px' : '10px',
          background: isOver
            ? `radial-gradient(ellipse at center, ${color}06 0%, transparent 70%)`
            : 'transparent',
          transition: 'background 0.2s ease',
        }}
      >
        <SortableContext
          items={demands.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {demands.map(demand => (
            <SortableDemandCard
              key={demand.id}
              demand={demand}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              tvMode={tvMode}
            />
          ))}
        </SortableContext>

        {demands.length === 0 && (
          <div className="empty-column flex-1">
            <div
              className="flex flex-col items-center gap-3"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}15`,
                }}
              >
                <Icon name={icon} size={tvMode ? 28 : 24} style={{ color: `${color}40` }} />
              </div>
              <div className="text-center">
                <p
                  className="font-semibold"
                  style={{ fontSize: tvMode ? '0.9rem' : '0.78rem', color: 'rgba(255,255,255,0.28)' }}
                >
                  Nenhuma demanda
                </p>
                <p
                  style={{ fontSize: tvMode ? '0.78rem' : '0.68rem', color: 'rgba(255,255,255,0.15)', marginTop: '2px' }}
                >
                  nesta coluna
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="shrink-0 h-[2px] transition-all duration-200"
        style={{
          background: isOver
            ? `linear-gradient(90deg, transparent, ${color}80, transparent)`
            : 'transparent',
        }}
      />
    </div>
  );
}
