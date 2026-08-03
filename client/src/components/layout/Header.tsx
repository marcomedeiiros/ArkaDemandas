import { Fragment, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Bell, BellRing, AlertTriangle, Clock } from 'lucide-react';
import { useClock } from '../../hooks/useClock';
import { Icon, type IconName } from '../ui/Icon';
import type { Demand } from '../../types';

// Dias entre o prazo e hoje (negativo = atrasada).
function daysDiff(prazo: string | null): number {
  if (!prazo) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(prazo + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function NotifItem({ demand, overdue }: { demand: Demand; overdue?: boolean }) {
  const color = overdue ? '#F87171' : '#FCD34D';
  const diff = daysDiff(demand.prazo);
  const label = overdue
    ? `Atrasada há ${Math.abs(diff)} dia(s)`
    : diff <= 0 ? 'Vence hoje' : `Vence em ${diff} dia(s)`;
  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors">
      <div className="mt-0.5 shrink-0" style={{ color }}>
        {overdue ? <AlertTriangle size={15} /> : <Clock size={15} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{demand.titulo}</div>
        <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{demand.cliente}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

// Sigla com as iniciais dos dois primeiros nomes (ex.: "Marco Medeiros" → "MM")
function initialsFromName(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? parts[1][0] : '';
  return (first + second).toUpperCase() || '?';
}

export interface ColumnStat {
  id: string;
  label: string;
  color: string;
  icon: IconName;
  count: number;
}

interface HeaderProps {
  columnStats: ColumnStat[];
  tvMode: boolean;
  onToggleTv: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
  overdueDemands?: Demand[];
  dueSoonDemands?: Demand[];
  userName?: string;
  avatarUrl?: string | null;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { id: 'kanban', label: 'Kanban', icon: 'clipboard' as const },
  { id: 'dashboard', label: 'Dashboard', icon: 'barChart' as const },
  { id: 'colaboradores', label: 'Colaboradores', icon: 'user' as const },
];

interface StatPillProps {
  icon: IconName;
  value: number | string;
  label: string;
  color: string;
  urgent?: boolean;
  tvMode: boolean;
}

function StatPill({ icon, value, label, color, urgent, tvMode }: StatPillProps) {
  return (
    <div
      className={`header-stat group cursor-default ${urgent ? 'header-stat-urgent' : ''}`}
      style={{ minWidth: tvMode ? '72px' : '58px' }}
    >
      <Icon name={icon} size={tvMode ? 16 : 14} style={{ color }} />
      <span
        className={`font-bold tabular-nums leading-none ${tvMode ? 'text-xl' : 'text-sm'}`}
        style={{ color, textShadow: `0 0 12px ${color}50` }}
      >
        {value}
      </span>
      <span
        className={`leading-none font-medium ${tvMode ? 'text-xs' : 'text-[9px]'}`}
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        {label}
      </span>
    </div>
  );
}

export default function Header({ columnStats, tvMode, onToggleTv, activeView, onViewChange, overdueDemands = [], dueSoonDemands = [], userName, avatarUrl, onLogout }: HeaderProps) {
  const { time, date } = useClock();
  const navigate = useNavigate();
  const initials = initialsFromName(userName);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [notifOpen]);

  return (
    <header
      className="shrink-0 relative z-20 animate-fade-in-down"
      style={{
        background: 'rgba(12,15,20,0.97)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.55)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #0066FF 25%, #1E40AF 50%, #0066FF 75%, transparent 100%)',
        }}
      />

      <div
        className="flex items-center justify-between gap-4"
        style={{ padding: tvMode ? '0 28px' : '0 20px', height: tvMode ? '72px' : '58px' }}
      >
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ARKA TECNOLOGIA"
              style={{
                height: tvMode ? '44px' : '32px',
                width: 'auto',
                filter: 'brightness(0) invert(1)',
              }}
            />
          </div>

          <div
            className="hidden md:block"
            style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)' }}
          />

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`nav-pill ${activeView === item.id ? 'active' : ''}`}
                style={tvMode ? { fontSize: '0.95rem', padding: '8px 18px' } : {}}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {columnStats.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 flex-1 justify-center overflow-hidden">
            {columnStats.map((c, i) => (
              <Fragment key={c.id}>
                {i > 0 && <div className="stat-divider" />}
                <StatPill icon={c.icon} value={c.count} label={c.label} color={c.color} tvMode={tvMode} />
              </Fragment>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <div
            className="text-right rounded-xl px-4 py-2"           
          >
            <div
              className="font-bold tabular-nums text-white leading-none tracking-widest"
              style={{
                fontSize: tvMode ? '2.2rem' : '1.35rem',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.04em',
                textShadow: '0 0 20px rgba(0,102,255,0.3)',
              }}
            >
              {time}
            </div>
            <div
              className="capitalize mt-0.5 font-medium"
              style={{
                fontSize: tvMode ? '0.8rem' : '0.65rem',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.02em',
              }}
            >
              {date}
            </div>
          </div>

          {/* Sino de notificações (demandas atrasadas / vencendo) */}
          {!tvMode && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                title="Notificações"
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: overdueDemands.length > 0 ? '#F87171' : 'rgba(255,255,255,0.45)',
                }}
              >
                {overdueDemands.length > 0 ? <BellRing size={17} className="animate-pulse" /> : <Bell size={16} />}
                {overdueDemands.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ fontSize: '0.6rem', background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.7)' }}
                  >
                    {overdueDemands.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl z-50 animate-fade-in-scale overflow-hidden"
                  style={{ background: 'rgba(18,22,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', width: '320px', maxWidth: '90vw' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <Bell size={14} /> Notificações
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {overdueDemands.length} atrasada(s) · {dueSoonDemands.length} vencendo
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {overdueDemands.length === 0 && dueSoonDemands.length === 0 ? (
                      <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Nenhuma demanda atrasada 🎉
                      </p>
                    ) : (
                      <>
                        {overdueDemands.map(d => <NotifItem key={d.id} demand={d} overdue />)}
                        {dueSoonDemands.map(d => <NotifItem key={d.id} demand={d} />)}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            id="btn-tv-mode"
            onClick={onToggleTv}
            title={tvMode ? 'Sair do modo TV' : 'Ativar Modo TV'}
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200"
            style={tvMode ? {
              background: 'rgba(0,102,255,0.15)',
              border: '1px solid rgba(0,102,255,0.35)',
              color: '#4D94FF',
              boxShadow: '0 0 16px rgba(0,102,255,0.2)',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            <Icon name="monitor" size={tvMode ? 20 : 16} />
            <span className="hidden xl:inline" style={{ fontSize: tvMode ? '0.9rem' : '0.8rem' }}>
              {tvMode ? 'Sair TV' : 'Modo TV'}
            </span>
          </button>

          {/* Usuário logado + menu */}
          {onLogout && (
            <div className="relative pl-2 ml-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2 rounded-xl pr-2 pl-1 py-1 transition-all hover:bg-white/5"
                title={userName}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName || 'Usuário'}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: '1px solid rgba(0,102,255,0.35)' }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: 'rgba(0,102,255,0.18)', border: '1px solid rgba(0,102,255,0.35)', color: '#4D94FF' }}
                  >
                    {initials}
                  </div>
                )}
                {userName && (
                  <span className="hidden xl:inline font-medium text-sm max-w-[120px] truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {userName}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl py-1 z-50 animate-fade-in-scale"
                  style={{ background: 'rgba(18,22,30,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: '200px' }}
                >
                  <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-sm font-semibold text-white truncate">{userName}</div>
                    <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>Minha conta</div>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/configuracoes'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    <Settings size={15} /> Configurações
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  <button
                    onClick={() => { setMenuOpen(false); setSaindo(true); setTimeout(() => onLogout?.(), 900); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-red-500/10 transition-colors"
                    style={{ color: '#F87171' }}
                  >
                    <LogOut size={15} /> Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aviso "Saindo…" via portal no body para ficar centralizado na tela
          inteira (o header tem backdrop-filter, que prenderia o "fixed" a ele). */}
      {saindo && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 p-6 animate-fade-in"
          style={{ background: 'rgba(8,10,14,0.94)', backdropFilter: 'blur(8px)' }}
        >
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">Saindo…</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Redirecionando para o login</p>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
