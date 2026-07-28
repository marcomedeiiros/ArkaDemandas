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

export interface UpdateDemandDTO extends Partial<CreateDemandDTO> {
  status?: ColumnStatus;
}

export interface StatsFilter {
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
  responsavel?: string;
  categoria?: string;
  prioridade?: Priority;
}

export const COLUMN_LABELS: Record<ColumnStatus, string> = {
  novas: 'Novas',
  em_andamento: 'Em andamento',
  aguardando: 'Aguardando',
  em_revisao: 'Em revisão',
  concluidas: 'Concluídas',
};
