import { useState, useEffect } from 'react';
import { X, Layers, Check } from 'lucide-react';
import type { ColumnConfig } from '../../types';
import { Icon, type IconName } from '../ui/Icon';

interface ColumnModalProps {
  open: boolean;
  onClose: () => void;
  column?: ColumnConfig | null;
  onSave: (data: { label: string; color: string; icon: string }) => Promise<void>;
}

const PRESET_COLORS = [
  '#0066FF', '#8B5CF6', '#F59E0B', '#06B6D4', '#22C55E',
  '#F43F5E', '#FB923C', '#A78BFA', '#34D399', '#60A5FA',
  '#EC4899', '#14B8A6', '#FBBF24', '#818CF8', '#4ADE80',
];

const ICON_OPTIONS: { name: IconName; label: string }[] = [
  { name: 'clipboard',   label: 'Clipboard' },
  { name: 'activity',    label: 'Atividade' },
  { name: 'clock',       label: 'Relógio' },
  { name: 'target',      label: 'Alvo' },
  { name: 'checkCircle', label: 'Concluído' },
  { name: 'folder',      label: 'Pasta' },
  { name: 'user',        label: 'Usuário' },
  { name: 'building',    label: 'Empresa' },
  { name: 'calendar',    label: 'Calendário' },
  { name: 'alertTriangle', label: 'Alerta' },
  { name: 'barChart',    label: 'Gráfico' },
  { name: 'history',     label: 'Histórico' },
  { name: 'monitor',     label: 'Monitor' },
  { name: 'search',      label: 'Busca' },
  { name: 'flame',       label: 'Urgente' },
];

export default function ColumnModal({ open, onClose, column, onSave }: ColumnModalProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('clipboard');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (column) {
      setLabel(column.label);
      setColor(column.color);
      setIcon(column.icon);
    } else {
      setLabel('');
      setColor(PRESET_COLORS[0]);
      setIcon('clipboard');
    }
    setError('');
  }, [column, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ label: label.trim(), color, icon });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar bloco';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

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
        className="relative w-full max-w-md animate-fade-in-scale rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13,16,22,0.99)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px ${color}20`,
        }}
      >
        {/* Top accent */}
        <div
          className="h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}90, ${color}, ${color}90, transparent)` }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}40` }}
            >
              <Layers size={18} style={{ color }} />
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {column ? 'Editar Bloco' : 'Novo Bloco'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-5">
          {/* Name */}
          <div>
            <label className="field-label flex items-center gap-1.5 mb-1.5" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Nome do Bloco
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ex: Em Homologação"
              maxLength={40}
              className="input-premium"
              style={{ height: '42px' }}
              autoFocus
            />
            {error && (
              <p className="mt-1.5 text-xs" style={{ color: '#F87171' }}>{error}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="field-label flex items-center gap-1.5 mb-2" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Cor do Bloco
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg transition-all duration-150 flex items-center justify-center shrink-0"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 2px rgba(255,255,255,0.9), 0 0 12px ${c}` : 'none',
                    transform: color === c ? 'scale(1.18)' : 'scale(1)',
                  }}
                >
                  {color === c && <Check size={12} style={{ color: '#fff', strokeWidth: 3 }} />}
                </button>
              ))}
              {/* Custom color input */}
              <label className="w-7 h-7 rounded-lg border border-dashed cursor-pointer flex items-center justify-center transition-all hover:border-white/40"
                style={{ borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', position: 'relative' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>+</span>
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="field-label flex items-center gap-1.5 mb-2" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(opt => (
                <button
                  key={opt.name}
                  type="button"
                  title={opt.label}
                  onClick={() => setIcon(opt.name)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
                  style={{
                    background: icon === opt.name ? `${color}25` : 'rgba(255,255,255,0.04)',
                    border: icon === opt.name ? `1px solid ${color}60` : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: icon === opt.name ? `0 0 10px ${color}40` : 'none',
                    transform: icon === opt.name ? 'scale(1.12)' : 'scale(1)',
                  }}
                >
                  <Icon
                    name={opt.name}
                    size={18}
                    style={{ color: icon === opt.name ? color : 'rgba(255,255,255,0.55)' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: `${color}10`, border: `1px solid ${color}25` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `${color}25`, border: `1px solid ${color}50`, boxShadow: `0 0 8px ${color}40` }}
            >
              <Icon name={icon as IconName} size={16} style={{ color }} />
            </div>
            <span className="font-bold text-white flex-1" style={{ fontSize: '0.9rem' }}>
              {label || 'Nome do bloco'}
            </span>
            <span
              className="font-bold px-2.5 py-0.5 rounded-full text-white"
              style={{ background: `${color}30`, border: `1px solid ${color}60`, fontSize: '0.72rem', boxShadow: `0 0 10px ${color}50` }}
            >
              0
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
              disabled={saving || !label.trim()}
              className="btn-primary disabled:opacity-60 flex items-center gap-2"
              style={{ height: '40px', padding: '0 22px', fontSize: '0.85rem', background: color, borderColor: color }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando…
                </>
              ) : (
                column ? '✓ Salvar alterações' : '+ Criar bloco'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
