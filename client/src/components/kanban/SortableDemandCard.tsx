import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Demand } from '../../types';
import DemandCard from './DemandCard';

interface SortableDemandCardProps {
  demand: Demand;
  onEdit: (demand: Demand) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  tvMode?: boolean;
  statusLabel?: string;
  statusColor?: string;
}

export default function SortableDemandCard({ demand, onEdit, onDuplicate, onDelete, tvMode, statusLabel, statusColor }: SortableDemandCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: demand.id,
    data: { demand, status: demand.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DemandCard demand={demand} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} tvMode={tvMode} statusLabel={statusLabel} statusColor={statusColor} />
    </div>
  );
}
