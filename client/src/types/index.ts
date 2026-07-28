export type ColumnStatus = 'novas' | 'em_andamento' | 'aguardando' | 'em_revisao' | 'concluidas';
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type LogAction = 'criada' | 'editada' | 'excluida' | 'movida' | 'concluida' | 'reaberta';

export interface Demand {
  id: string;
  titulo: string;
  descricao: string;
  cliente: string;
  responsavel: string;
  categoria: string;
  prioridade: Priority;
  status: ColumnStatus;
  data_criacao: string;
  prazo: string | null;
  data_conclusao: string | null;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  demand_id: string;
  action: LogAction;
  details: string;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
}

export interface CreateDemandDTO {
  titulo: string;
  descricao?: string;
  cliente: string;
  responsavel: string;
  categoria: string;
  prioridade: Priority;
  prazo?: string | null;
  observacoes?: string;
}

export interface Stats {
  total: number;
  abertas: number;
  concluidas: number;
  emAndamento: number;
  concluidasHoje: number;
  concluidasSemana: number;
  concluidasMes: number;
  concluidasAno: number;
  tempoMedioResolucao: number;
  porResponsavel: { responsavel: string; count: number }[];
  porCategoria: { categoria: string; count: number }[];
  porPrioridade: { prioridade: string; count: number }[];
  criadasPorDia: { dia: string; count: number }[];
  concluidasPorDia: { dia: string; count: number }[];
}

export interface StatsFilter {
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
  responsavel?: string;
  categoria?: string;
  prioridade?: Priority;
}

export const COLUMNS: { id: ColumnStatus; label: string; color: string }[] = [
  { id: 'novas', label: 'Novas', color: '#0066FF' },
  { id: 'em_andamento', label: 'Em andamento', color: '#8B5CF6' },
  { id: 'aguardando', label: 'Aguardando', color: '#F59E0B' },
  { id: 'em_revisao', label: 'Em revisão', color: '#06B6D4' },
  { id: 'concluidas', label: 'Concluídas', color: '#22C55E' },
];

export const PRIORITIES: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

export const ACTION_LABELS: Record<LogAction, string> = {
  criada: 'Criada',
  editada: 'Editada',
  excluida: 'Excluída',
  movida: 'Movida',
  concluida: 'Concluída',
  reaberta: 'Reaberta',
};
