import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Demand, ColumnStatus } from '../../types';
import { COLUMNS } from '../../types';
import KanbanColumn from './KanbanColumn';
import DemandCard from './DemandCard';
import { Icon } from '../ui/Icon';

interface KanbanBoardProps {
  demands: Demand[];
  onMove: (id: string, status: ColumnStatus) => void;
  onEdit: (demand: Demand) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  tvMode?: boolean;
}

const COLUMN_ICONS: Record<ColumnStatus, 'clipboard' | 'activity' | 'clock' | 'target' | 'checkCircle'> = {
  novas: 'clipboard',
  em_andamento: 'activity',
  aguardando: 'clock',
  em_revisao: 'target',
  concluidas: 'checkCircle',
};

export default function KanbanBoard({
  demands, onMove, onEdit, onDuplicate, onDelete, onCreate, tvMode,
}: KanbanBoardProps) {
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);
  const [search, setSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filtered = search
    ? demands.filter(d =>
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.cliente.toLowerCase().includes(search.toLowerCase()) ||
        d.responsavel.toLowerCase().includes(search.toLowerCase()) ||
        d.titulo.toLowerCase().includes(search.toLowerCase())
      )
    : demands;

  const getColumnDemands = (status: ColumnStatus) =>
    filtered.filter(d => d.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const demand = demands.find(d => d.id === event.active.id);
    if (demand) setActiveDemand(demand);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDemand(null);
    const { active, over } = event;
    if (!over) return;
    const demandId = active.id as string;
    const demand = demands.find(d => d.id === demandId);
    if (!demand) return;
    let targetStatus: ColumnStatus | null = null;
    if (COLUMNS.some(c => c.id === over.id)) {
      targetStatus = over.id as ColumnStatus;
    } else {
      const overDemand = demands.find(d => d.id === over.id);
      if (overDemand) targetStatus = overDemand.status;
    }
    if (targetStatus && targetStatus !== demand.status) {
      onMove(demandId, targetStatus);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {!tvMode && (
        <div
          className="shrink-0 px-5 pt-3 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 relative" style={{ maxWidth: '520px' }}>
              <Icon
                name="search"
                size={tvMode ? 18 : 15}
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: '14px', color: 'rgba(255,255,255,0.28)' }}
              />
              <input
                id="kanban-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por ID, cliente, responsável ou título..."
                className="input-premium"
                style={{
                  paddingLeft: '40px',
                  paddingRight: search ? '36px' : '14px',
                  fontSize: tvMode ? '0.95rem' : '0.84rem',
                  height: tvMode ? '46px' : '40px',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center justify-center w-5 h-5 rounded-full transition-all hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <Icon name="close" size={12} />
                </button>
              )}
            </div>

            <button
              id="btn-nova-demanda"
              onClick={onCreate}
              className="btn-primary shrink-0"
              style={{
                height: tvMode ? '46px' : '40px',
                padding: tvMode ? '0 28px' : '0 20px',
                fontSize: tvMode ? '1rem' : '0.875rem',
                gap: '8px',
              }}
            >
              <Icon name="plus" size={18} />
              Nova Demanda
            </button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{ padding: tvMode ? '16px 20px 20px' : '12px 16px 16px' }}
        >
          <div
            className="flex gap-3 h-full"
            style={{ minWidth: 'max-content' }}
          >
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                color={col.color}
                icon={COLUMN_ICONS[col.id]}
                demands={getColumnDemands(col.id)}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                tvMode={tvMode}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
          {activeDemand && (
            <div style={{ opacity: 0.92, transform: 'rotate(1.5deg) scale(1.02)', transformOrigin: 'top left' }}>
              <DemandCard demand={activeDemand} onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}} tvMode={tvMode} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
