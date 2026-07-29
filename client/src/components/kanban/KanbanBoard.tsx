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
  const [filterResponsavel, setFilterResponsavel] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const filtered = demands.filter(d => {
    const sLower = search.toLowerCase();
    const matchesSearch = !search || (
      d.id.toLowerCase().includes(sLower) ||
      d.cliente.toLowerCase().includes(sLower) ||
      d.responsavel.toLowerCase().includes(sLower) ||
      d.titulo.toLowerCase().includes(sLower) ||
      (d.descricao && d.descricao.toLowerCase().includes(sLower))
    );
    const matchesResp = !filterResponsavel || d.responsavel === filterResponsavel;
    const matchesCat = !filterCategoria || d.categoria === filterCategoria;
    const matchesPrio = !filterPrioridade || d.prioridade === filterPrioridade;
    return matchesSearch && matchesResp && matchesCat && matchesPrio;
  });

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

  const hasActiveFilters = Boolean(search || filterResponsavel || filterCategoria || filterPrioridade);

  const clearFilters = () => {
    setSearch('');
    setFilterResponsavel('');
    setFilterCategoria('');
    setFilterPrioridade('');
  };

  return (
    <div className="flex flex-col h-full">
      {!tvMode && (
        <div
          className="shrink-0 px-5 pt-3 pb-3 flex flex-wrap items-center justify-between gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,18,24,0.6)' }}
        >
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Icon
                name="search"
                size={15}
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: '12px', color: 'rgba(255,255,255,0.3)' }}
              />
              <input
                id="kanban-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por ID, título, cliente ou técnico..."
                className="input-premium"
                style={{
                  paddingLeft: '36px',
                  paddingRight: search ? '32px' : '12px',
                  fontSize: '0.82rem',
                  height: '38px',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 -translate-y-1/2 right-2.5 flex items-center justify-center w-5 h-5 rounded-full transition-all hover:bg-white/10"
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
                height: '38px',
                padding: '0 18px',
                fontSize: '0.85rem',
                gap: '8px',
              }}
            >
              <Icon name="plus" size={16} />
              Nova Demanda
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-secondary text-xs px-3 flex items-center gap-1 hover:text-white"
                style={{ height: '38px' }}
              >
                <Icon name="close" size={12} />
                Limpar
              </button>
            )}
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

        <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
          {activeDemand && (
            <div style={{ opacity: 0.94, transform: 'rotate(1deg) scale(1.02)', transformOrigin: 'top left' }}>
              <DemandCard demand={activeDemand} onEdit={() => {}} onDuplicate={() => {}} onDelete={() => {}} tvMode={tvMode} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
