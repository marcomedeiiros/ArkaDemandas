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

export interface Stats {
  total: number;
  novas: number;
  emAndamento: number;
  aguardando: number;
  emRevisao: number;
  concluidas: number;
  abertas: number;
  hoje: number;
  semana: number;
  concluidasHoje: number;
  concluidasSemana: number;
  concluidasMes: number;
  concluidasAno: number;
  tempoMedioResolucao: number;
  tempoMedioAtendimento: number;
  taxaConclusao: number;
  porStatus: Array<{ status: string; count: number; label: string }>;
  porResponsavel: Array<{ responsavel: string; count: number }>;
  porCategoria: Array<{ categoria: string; count: number }>;
  porPrioridade: Array<{ prioridade: string; count: number }>;
  criadasPorDia: Array<{ dia: string; count: number }>;
  concluidasPorDia: Array<{ dia: string; count: number }>;
  criadasPorSemana: Array<{ semana: string; count: number }>;
  criadasPorMes: Array<{ mes: string; count: number }>;
  evolucaoDemandas: Array<{ dia: string; criadas: number; acumuladas: number }>;
  comparativoAbertasConcluidas: Array<{ dia: string; abertas: number; concluidas: number }>;
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

