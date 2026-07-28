import type { Priority } from '../types';

export function getPriorityColor(priority: Priority): string {
  const map: Record<Priority, string> = {
    Baixa: '#22C55E',
    Média: '#EAB308',
    Alta: '#F97316',
    Urgente: '#EF4444',
  };
  return map[priority];
}

export function getPriorityLabel(priority: Priority): string {
  const map: Record<Priority, string> = {
    Baixa: '🟢 BAIXA',
    Média: '🟡 MÉDIA',
    Alta: '🟠 ALTA',
    Urgente: '🔴 URGENTE',
  };
  return map[priority];
}

export function getPriorityBgClass(priority: Priority): string {
  const map: Record<Priority, string> = {
    Baixa: 'bg-priority-baixa/20 text-priority-baixa border-priority-baixa/30',
    Média: 'bg-priority-media/20 text-priority-media border-priority-media/30',
    Alta: 'bg-priority-alta/20 text-priority-alta border-priority-alta/30',
    Urgente: 'bg-priority-urgente/20 text-priority-urgente border-priority-urgente/30',
  };
  return map[priority];
}

export function getDeadlineStatus(prazo: string | null): 'overdue' | 'warning' | 'ok' | 'none' {
  if (!prazo) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(prazo + 'T00:00:00');
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 3) return 'warning';
  return 'ok';
}

export function getActionColor(action: string): string {
  const map: Record<string, string> = {
    criada: '#0066FF',
    editada: '#8B5CF6',
    excluida: '#EF4444',
    movida: '#F59E0B',
    concluida: '#22C55E',
    reaberta: '#06B6D4',
  };
  return map[action] || '#666';
}

export function getActionEmoji(action: string): string {
  const map: Record<string, string> = {
    criada: '🆕',
    editada: '✏️',
    excluida: '🗑️',
    movida: '🔄',
    concluida: '✅',
    reaberta: '🔁',
  };
  return map[action] || '•';
}
