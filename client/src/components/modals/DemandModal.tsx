import { useState, useEffect } from 'react';
import {
  Pencil, FilePlus, X, Timer, Calendar as CalendarIcon,
  CheckCircle2, Trash2, Save, Monitor, Building2, User,
  Folder, Target, Clock, FileText,
} from 'lucide-react';
import type { Demand, CreateDemandDTO } from '../../types';
import { PRIORITIES } from '../../types';
import { formatDate, getTimeOpen } from '../../utils/dates';

interface DemandModalProps {
  open: boolean;
  onClose: () => void;
  demand?: Demand | null;
  onSave: (data: CreateDemandDTO) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<CreateDemandDTO>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_CONFIG = {
  Baixa:   { color: '#4ADE80', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)'  },
  Média:   { color: '#FCD34D', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)'  },
  Alta:    { color: '#FB923C', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  Urgente: { color: '#F87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
};

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

function Field({ label, icon, value, onChange, required, placeholder, type = 'text' }: FieldProps) {
  return (
    <div>
      <label className="field-label flex items-center gap-1.5">{icon} {label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="input-premium"
        style={{ height: '40px' }}
      />
    </div>
  );
}

export default function DemandModal({
  open, onClose, demand, onSave, onUpdate, onDelete,
}: DemandModalProps) {
  const [form, setForm] = useState<CreateDemandDTO>({
    titulo: '', descricao: '', cliente: '', responsavel: '',
    categoria: '', prioridade: 'Média', prazo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (demand) {
      setForm({
        titulo: demand.titulo, descricao: demand.descricao, cliente: demand.cliente,
        responsavel: demand.responsavel, categoria: demand.categoria,
        prioridade: demand.prioridade, prazo: demand.prazo ?? '',
      });
    } else {
      setForm({ titulo: '', descricao: '', cliente: '', responsavel: '',
        categoria: '', prioridade: 'Média', prazo: '' });
    }
  }, [demand, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, prazo: form.prazo || null };
      if (demand) await onUpdate(demand.id, data);
      else        await onSave(data);
      onClose();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!demand || !confirm('Tem certeza que deseja excluir esta demanda?')) return;
    setSaving(true);
    try { await onDelete(demand.id); onClose(); }
    finally { setSaving(false); }
  };

  const update = (field: keyof CreateDemandDTO, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  if (!open) return null;

  const pc = PRIORITY_CONFIG[form.prioridade];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-fade-in-scale rounded-2xl"
        style={{
          background: 'rgba(13,16,22,0.99)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,102,255,0.1)',
        }}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${pc.color}70, #0066FF, ${pc.color}70, transparent)`,
          }}
        />

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,102,255,0.14)', border: '1px solid rgba(0,102,255,0.28)' }}
            >
              {demand
                ? <Pencil size={18} style={{ color: '#4D94FF' }} />
                : <FilePlus size={18} style={{ color: '#4D94FF' }} />
              }
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {demand ? 'Editar Demanda' : 'Nova Demanda'}
              </h2>
              {demand && (
                <p
                  className="font-mono font-bold mt-0.5"
                  style={{ fontSize: '0.75rem', color: '#4D94FF' }}
                >
                  {demand.id}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Info bar (edit mode) ── */}
        {demand && (
          <div
            className="mx-6 mt-4 flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(0,102,255,0.07)', border: '1px solid rgba(0,102,255,0.18)' }}
          >
            <div className="flex items-center gap-2">
              <Timer size={13} style={{ color: 'rgba(255,255,255,0.38)' }} />
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>Tempo em aberto:</span>
              <span className="font-bold text-glow-blue" style={{ fontSize: '0.82rem' }}>
                {getTimeOpen(demand.data_criacao, demand.data_conclusao)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon size={13} style={{ color: 'rgba(255,255,255,0.38)' }} />
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)' }}>Criada:</span>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
                {formatDate(demand.data_criacao)}
              </span>
            </div>
            {demand.data_conclusao && (
              <div className="flex items-center gap-1.5">
                <span className="badge badge-green flex items-center gap-1" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={11} />
                  Concluída: {formatDate(demand.data_conclusao)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field
              label="Título"
              icon={<Monitor size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />}
              value={form.titulo} onChange={v => update('titulo', v)}
              required placeholder="Título da demanda"
            />
            <Field
              label="Cliente"
              icon={<Building2 size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />}
              value={form.cliente} onChange={v => update('cliente', v)}
              required placeholder="Nome do cliente"
            />
            <Field
              label="Responsável"
              icon={<User size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />}
              value={form.responsavel} onChange={v => update('responsavel', v)}
              required placeholder="Técnico responsável"
            />
            <Field
              label="Categoria"
              icon={<Folder size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />}
              value={form.categoria} onChange={v => update('categoria', v)}
              required placeholder="Categoria da demanda"
            />
          </div>

          {/* Priority + Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="field-label flex items-center gap-1.5">
                <Target size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
                Prioridade
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  const active = form.prioridade === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update('prioridade', p)}
                      className="rounded-xl font-semibold transition-all duration-200"
                      style={{
                        height: '38px',
                        fontSize: '0.82rem',
                        background: active ? cfg.bg                      : 'rgba(255,255,255,0.04)',
                        border:     active ? `1px solid ${cfg.border}`   : '1px solid rgba(255,255,255,0.07)',
                        color:      active ? cfg.color                   : 'rgba(255,255,255,0.38)',
                        boxShadow:  active ? `0 0 14px ${cfg.color}22`   : 'none',
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prazo */}
            <Field
              label="Prazo"
              icon={<Clock size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />}
              value={form.prazo ?? ''} onChange={v => update('prazo', v)}
              type="date"
            />
          </div>

          {/* Description */}
          <div>
            <label className="field-label flex items-center gap-1.5">
              <FileText size={13} style={{ color: 'rgba(255,255,255,0.45)' }} />
              Descrição
            </label>
            <textarea
              value={form.descricao}
              onChange={e => update('descricao', e.target.value)}
              rows={3}
              placeholder="Descreva detalhes da demanda…"
              className="input-premium resize-none"
              style={{ paddingTop: '10px', paddingBottom: '10px' }}
            />
          </div>



          {/* ── Actions ── */}
          <div
            className="flex items-center justify-between pt-3 gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {demand ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="btn-danger disabled:opacity-50 flex items-center gap-2"
                style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem' }}
              >
                <Trash2 size={15} />
                Excluir
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-60 flex items-center gap-2"
                style={{ height: '40px', padding: '0 22px', fontSize: '0.85rem' }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando…
                  </>
                ) : demand ? (
                  <><Save size={15} /> Salvar</>
                ) : (
                  <><FilePlus size={15} /> Criar Demanda</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
