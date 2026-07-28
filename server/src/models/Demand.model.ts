import type { ColumnStatus, Priority } from '../types.js';

export interface DemandModel {
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
  criado_por: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDemandInput {
  titulo: string;
  descricao?: string;
  cliente: string;
  responsavel: string;
  categoria: string;
  prioridade: Priority;
  prazo?: string | null;
  observacoes?: string;
  criado_por: string;
}

export interface UpdateDemandInput extends Partial<Omit<CreateDemandInput, 'criado_por'>> {
  status?: ColumnStatus;
  data_conclusao?: string | null;
}
