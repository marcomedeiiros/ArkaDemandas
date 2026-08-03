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
import type { Demand, ColumnStatus, ColumnConfig } from '../../types';
import KanbanColumn from './KanbanColumn';
import DemandCard from './DemandCard';
import ColumnModal from '../modals/ColumnModal';
import { Icon } from '../ui/Icon';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  demands: Demand[];
  columns: ColumnConfig[];
  onMove: (id: string, status: ColumnStatus) => void;
  onEdit: (demand: Demand) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onCreateColumn: (data: { label: string; color: string; icon: string }) => Promise<unknown>;
  onUpdateColumn: (id: string, data: { label?: string; color?: string; icon?: string }) => Promise<unknown>;
  onDeleteColumn: (id: string) => Promise<void>;
  tvMode?: boolean;
}

export default function KanbanBoard({
  demands, columns, onMove, onEdit, onDuplicate, onDelete, onCreate,
  onCreateColumn, onUpdateColumn, onDeleteColumn, tvMode,
}: KanbanBoardProps) {
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);
  const [search, setSearch] = useState('');
  const [filterResponsavel, setFilterResponsavel] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');

  // Column modal state
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<ColumnConfig | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

  const getColumnDemands = (columnId: string) =>
    filtered.filter(d => d.status === columnId);

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
    let targetStatus: string | null = null;
    const allColumnIds = columns.map(c => c.id);
    if (allColumnIds.includes(over.id as string)) {
      targetStatus = over.id as string;
    } else {
      const overDemand = demands.find(d => d.id === over.id);
      if (overDemand) targetStatus = overDemand.status;
    }
    if (targetStatus && targetStatus !== demand.status) {
      onMove(demandId, targetStatus as ColumnStatus);
    }
  };

  const hasActiveFilters = Boolean(search || filterResponsavel || filterCategoria || filterPrioridade);
  const noColumns = columns.length === 0;

  const clearFilters = () => {
    setSearch('');
    setFilterResponsavel('');
    setFilterCategoria('');
    setFilterPrioridade('');
  };

  const handleOpenNewColumnModal = () => {
    setEditingColumn(null);
    setColumnModalOpen(true);
  };

  const handleEditColumn = (column: ColumnConfig) => {
    setEditingColumn(column);
    setColumnModalOpen(true);
  };

  const handleDeleteColumn = (column: ColumnConfig) => {
    setDeletingColumn(column);
    setConfirmDeleteOpen(true);
  };

  const handleSaveColumn = async (data: { label: string; color: string; icon: string }) => {
    if (editingColumn) {
      await onUpdateColumn(editingColumn.id, data);
    } else {
      await onCreateColumn(data);
    }
    setColumnModalOpen(false);
    setEditingColumn(null);
  };

  const handleConfirmDeleteColumn = async () => {
    if (!deletingColumn) return;
    try {
      await onDeleteColumn(deletingColumn.id);
    } catch (e) {
      console.error('Error deleting column:', e);
    }
    setConfirmDeleteOpen(false);
    setDeletingColumn(null);
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
              disabled={noColumns}
              title={noColumns ? 'Crie pelo menos um bloco antes de criar demandas' : undefined}
              className="btn-primary shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
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
            {noColumns && (
              <span
                className="text-xs flex items-center gap-1.5 shrink-0"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <Icon name="alertTriangle" size={13} style={{ color: '#FBBF24' }} />
                Crie um bloco primeiro
              </span>
            )}
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
            className="flex gap-3 h-full items-start"
            style={{ minWidth: 'max-content' }}
          >
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                demands={getColumnDemands(col.id)}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onEditColumn={handleEditColumn}
                onDeleteColumn={handleDeleteColumn}
                tvMode={tvMode}
              />
            ))}

            {/* Add new column button */}
            {!tvMode && (
              <div className="flex-shrink-0 h-full flex items-center pl-1">
                <button
                  id="btn-novo-bloco"
                  onClick={handleOpenNewColumnModal}
                  className="flex flex-col items-center gap-2 transition-all duration-200 group"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  title="Adicionar novo bloco"
                >
                  {/* Round circle with + */}
                  <div
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '2px dashed rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.3)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0,102,255,0.12)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,102,255,0.5)';
                      (e.currentTarget as HTMLElement).style.color = '#4D94FF';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 0 18px rgba(0,102,255,0.25)';
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    }}
                  >
                    <Plus size={20} />
                  </div>
                  {/* Label below */}
                  <span
                    className="font-semibold group-hover:text-white/60 transition-colors"
                    style={{
                      fontSize: '0.68rem',
                      color: 'rgba(255,255,255,0.28)',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Novo bloco
                  </span>
                </button>
              </div>
            )}

          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
          {activeDemand && (() => {
            const activeCol = columns.find(c => c.id === activeDemand.status);
            return (
              <div style={{ opacity: 0.94, transform: 'rotate(1deg) scale(1.02)', transformOrigin: 'top left' }}>
                <DemandCard
                  demand={activeDemand}
                  onEdit={() => {}}
                  onDuplicate={() => {}}
                  onDelete={() => {}}
                  tvMode={tvMode}
                  statusLabel={activeCol?.label}
                  statusColor={activeCol?.color}
                />
              </div>
            );
          })()}
        </DragOverlay>
      </DndContext>

      {/* Column Modal */}
      <ColumnModal
        open={columnModalOpen}
        onClose={() => { setColumnModalOpen(false); setEditingColumn(null); }}
        column={editingColumn}
        onSave={handleSaveColumn}
      />

      {/* Confirm delete column dialog */}
      {confirmDeleteOpen && deletingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => { setConfirmDeleteOpen(false); setDeletingColumn(null); }}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl animate-fade-in-scale"
            style={{
              background: 'rgba(13,16,22,0.99)',
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
              padding: '28px',
            }}
          >
            <div className="h-[2px] absolute top-0 left-0 right-0 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)' }} />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <Icon name="delete" size={18} style={{ color: '#F87171' }} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Excluir bloco?</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Tem certeza que deseja excluir o bloco{' '}
              <span className="font-bold text-white">"{deletingColumn.label}"</span>?
            </p>
            {(() => {
              const fallback = columns.find(c => c.id !== deletingColumn.id);
              return (
                <p className="text-xs mb-6 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
                  {fallback
                    ? <>⚠️ Todas as demandas neste bloco serão movidas para <strong>{fallback.label}</strong>.</>
                    : <>⚠️ Este é o último bloco. Ao excluí-lo você não conseguirá criar novas demandas até criar outro bloco.</>}
                </p>
              );
            })()}
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmDeleteOpen(false); setDeletingColumn(null); }}
                className="btn-secondary flex-1"
                style={{ height: '40px', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteColumn}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
                style={{ height: '40px', fontSize: '0.85rem' }}
              >
                <Icon name="delete" size={14} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
