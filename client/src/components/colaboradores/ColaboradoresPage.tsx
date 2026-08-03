import { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Mail, Briefcase, Activity, Calendar, Building2, Folder, Clock, ShieldCheck, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { Collaborator, ActivityLog, Demand, ColumnConfig } from '../../types';
import { ACTION_LABELS } from '../../types';
import { getActionColor, getPriorityColor, getPriorityLabel } from '../../utils/colors';
import { useIsAdmin, useCurrentUserName } from '../../context/UsersContext';

function roleInfo(role: string): { label: string; color: string } {
  return role === 'admin'
    ? { label: 'Supervisor', color: '#FBBF24' }
    : { label: 'Membro', color: '#94A3B8' };
}

function initials(name?: string): string {
  if (!name) return '?';
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}

function providerInfo(p: string): { label: string; color: string } {
  if (p === 'google') return { label: 'Gmail (Google)', color: '#EA4335' };
  if (p === 'microsoft') return { label: 'Hotmail (Microsoft)', color: '#00A4EF' };
  return { label: 'E-mail e senha', color: '#4D94FF' };
}

function fmt(dt: string): string {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dt: string): string {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ColaboradoresPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [demandsById, setDemandsById] = useState<Map<string, Demand>>(new Map());
  const [columnsById, setColumnsById] = useState<Map<string, ColumnConfig>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = useIsAdmin();
  const currentUserName = useCurrentUserName();

  const changeRole = async (id: string, role: 'admin' | 'member') => {
    try {
      const res = await fetch(`/api/auth/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      setCollaborators(prev => prev.map(c => (c.id === id ? { ...c, role } : c)));
    } catch {
      setError('Não foi possível alterar o papel');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, lRes, dRes, cRes] = await Promise.all([
        fetch('/api/auth/users'),
        fetch('/api/logs'),
        fetch('/api/demands'),
        fetch('/api/columns'),
      ]);
      if (!uRes.ok) throw new Error('Não foi possível carregar os colaboradores');
      const users: Collaborator[] = await uRes.json();
      const activity: ActivityLog[] = lRes.ok ? await lRes.json() : [];
      const demands: Demand[] = dRes.ok ? await dRes.json() : [];
      const columns: ColumnConfig[] = cRes.ok ? await cRes.json() : [];
      setCollaborators(users);
      setLogs(activity);
      setDemandsById(new Map(demands.map(d => [d.id, d])));
      setColumnsById(new Map(columns.map(c => [c.id, c])));
      setSelectedId(prev => prev ?? (users[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = collaborators.find(c => c.id === selectedId) || null;
  const selectedLogs = selected ? logs.filter(l => l.user === selected.name) : [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-5 max-w-[1500px] mx-auto w-full">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,102,255,0.14)', border: '1px solid rgba(0,102,255,0.28)' }}>
              <Users size={20} style={{ color: '#4D94FF' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Colaboradores</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {collaborators.length} conta(s) acompanhe o que cada um fez no painel
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="btn-secondary flex items-center gap-2"
            style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,380px)_1fr] gap-5">
            {/* Lista de colaboradores */}
            <div className="flex flex-col gap-3">
              {collaborators.map(c => {
                const pi = providerInfo(c.provider);
                const ri = roleInfo(c.role);
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="text-left rounded-2xl p-4 transition-all"
                    style={{
                      background: active ? 'rgba(0,102,255,0.1)' : 'rgba(21,25,34,0.88)',
                      border: `1px solid ${active ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: active ? '0 0 0 1px rgba(0,102,255,0.2)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} className="w-11 h-11 rounded-full object-cover shrink-0" style={{ border: '1px solid rgba(0,102,255,0.35)' }} />
                      ) : (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'rgba(0,102,255,0.18)', border: '1px solid rgba(0,102,255,0.35)', color: '#4D94FF' }}>
                          {initials(c.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate">{c.name}</div>
                        <div className="text-xs truncate flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          <Briefcase size={11} /> {c.cargo || 'Sem cargo'}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg shrink-0" style={{ background: 'rgba(0,102,255,0.12)', color: '#4D94FF' }}>
                        {c.actionCount} ações
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <span className="inline-flex items-center gap-1"><Mail size={11} /> {c.email}</span>
                      <span className="px-2 py-0.5 rounded-full" style={{ background: `${pi.color}20`, color: pi.color, border: `1px solid ${pi.color}45` }}>
                        {pi.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-semibold" style={{ background: `${ri.color}20`, color: ri.color, border: `1px solid ${ri.color}55` }}>
                        <ShieldCheck size={10} /> {ri.label}
                      </span>
                    </div>
                  </button>
                );
              })}
              {collaborators.length === 0 && (
                <div className="rounded-2xl p-6 text-center text-sm" style={{ background: 'rgba(21,25,34,0.88)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                  Nenhum colaborador ainda.
                </div>
              )}
            </div>

            {/* Detalhe / atividade do selecionado */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(21,25,34,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {selected ? (
                <>
                  <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {selected.avatar_url ? (
                      <img src={selected.avatar_url} alt={selected.name} className="w-12 h-12 rounded-full object-cover" style={{ border: '1px solid rgba(0,102,255,0.35)' }} />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: 'rgba(0,102,255,0.18)', border: '1px solid rgba(0,102,255,0.35)', color: '#4D94FF' }}>
                        {initials(selected.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-lg">{selected.name}</div>
                      <div className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{selected.cargo || 'Sem cargo'} · {selected.email}</div>
                    </div>
                  </div>

                  {/* Resumo */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <Info icon={<Calendar size={14} />} label="Conta criada" value={fmtDate(selected.created_at)} />
                    <Info icon={<Activity size={14} />} label="Ações no painel" value={String(selected.actionCount)} />
                    <Info icon={<ShieldCheck size={14} />} label="Papel" value={roleInfo(selected.role).label} />
                  </div>

                  {/* Ação de admin: promover/rebaixar (não permite alterar o próprio) */}
                  {isAdmin && selected.name !== currentUserName && (
                    <div className="mb-5">
                      <button
                        onClick={() => changeRole(selected.id, selected.role === 'admin' ? 'member' : 'admin')}
                        className="btn-secondary flex items-center gap-2"
                        style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem' }}
                      >
                        {selected.role === 'admin'
                          ? <><ArrowDownCircle size={15} /> Rebaixar para Membro</>
                          : <><ArrowUpCircle size={15} /> Tornar Supervisor</>}
                      </button>
                    </div>
                  )}

                  {/* Linha do tempo de atividades */}
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Activity size={15} style={{ color: '#4D94FF' }} /> Atividades no painel</h3>
                  {selectedLogs.length === 0 ? (
                    <p className="text-sm py-6 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Nenhuma atividade registrada ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-[56vh] overflow-y-auto pr-1">
                      {selectedLogs.map(log => {
                        const color = getActionColor(log.action);
                        const demand = demandsById.get(log.demand_id);
                        const bloco = demand ? columnsById.get(demand.status) : undefined;
                        const prioColor = demand ? getPriorityColor(demand.prioridade) : '#4D94FF';
                        return (
                          <div key={log.id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {/* Linha da ação */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color, border: `1px solid ${color}45` }}>
                                {ACTION_LABELS[log.action] ?? log.action}
                              </span>
                              <span className="font-mono text-xs" style={{ color: '#4D94FF' }}>{log.demand_id}</span>
                              <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>{fmt(log.created_at)}</span>
                            </div>

                            {/* Quadradinho da demanda (se ela ainda existe) */}
                            {demand ? (
                              <div className="mt-2 rounded-lg p-2.5" style={{ background: 'rgba(0,102,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-white text-sm truncate">{demand.titulo}</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${prioColor}22`, color: prioColor, border: `1px solid ${prioColor}55` }}>
                                    {getPriorityLabel(demand.prioridade)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs flex-wrap" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                  <span className="inline-flex items-center gap-1"><Building2 size={11} /> {demand.cliente}</span>
                                  <span className="inline-flex items-center gap-1"><Folder size={11} /> {demand.categoria}</span>
                                  {demand.prazo && <span className="inline-flex items-center gap-1"><Clock size={11} /> {fmtDate(demand.prazo)}</span>}
                                  {bloco && (
                                    <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: `${bloco.color}22`, color: '#fff', border: `1px solid ${bloco.color}55` }}>
                                      {bloco.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{log.details}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-center py-10" style={{ color: 'rgba(255,255,255,0.4)' }}>Selecione um colaborador.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{icon} {label}</div>
      <div className="font-bold text-white text-sm truncate">{value}</div>
    </div>
  );
}
