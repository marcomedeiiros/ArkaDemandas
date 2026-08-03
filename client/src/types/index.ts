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
  criado_por: string;
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
  user: string | null;
  created_at: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  provider: string;
  avatar_url: string | null;
  cargo: string | null;
  role: string;
  created_at: string;
  actionCount: number;
}

export interface CreateDemandDTO {
  titulo: string;
  descricao?: string;
  cliente: string;
  // Responsável é definido automaticamente pelo servidor (usuário logado).
  responsavel?: string;
  categoria: string;
  prioridade: Priority;
  prazo?: string | null;
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
  porStatus: { status: string; count: number; label: string; color: string }[];
  porResponsavel: { responsavel: string; count: number }[];
  porCategoria: { categoria: string; count: number }[];
  porPrioridade: { prioridade: string; count: number }[];
  criadasPorDia: { dia: string; count: number }[];
  concluidasPorDia: { dia: string; count: number }[];
  criadasPorSemana: { semana: string; count: number }[];
  criadasPorMes: { mes: string; count: number }[];
  evolucaoDemandas: { dia: string; criadas: number; acumuladas: number }[];
  comparativoAbertasConcluidas: { dia: string; abertas: number; concluidas: number }[];
}

export interface StatsFilter {
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
  responsavel?: string;
  categoria?: string;
  prioridade?: Priority;
}

export interface ColumnConfig {
  id: string;
  label: string;
  color: string;
  icon: string;
  order_index: number;
  is_default: number;
}

export const PRIORITIES: Priority[] = ['Baixa', 'Média', 'Alta', 'Urgente'];

export const ACTION_LABELS: Record<LogAction, string> = {
  criada: 'Criada',
  editada: 'Editada',
  excluida: 'Excluída',
  movida: 'Movida',
  concluida: 'Concluída',
  reaberta: 'Reaberta',
};
