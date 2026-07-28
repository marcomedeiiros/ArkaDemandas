import { useClock } from '../../hooks/useClock';
import { Icon } from '../ui/Icon';
import type { Stats } from '../../types';

interface HeaderProps {
  stats: Stats | null;
  tvMode: boolean;
  onToggleTv: () => void;
  activeView: string;
  onViewChange: (view: string) => void;
}

const NAV_ITEMS = [
  { id: 'kanban', label: 'Kanban', icon: 'clipboard' as const },
  { id: 'dashboard', label: 'Dashboard', icon: 'barChart' as const },
  { id: 'historico', label: 'Histórico', icon: 'history' as const },
];

interface StatPillProps {
  icon: 'clipboard' | 'activity' | 'flame' | 'checkCircle' | 'calendarDays';
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

export default function Header({ stats, tvMode, onToggleTv, activeView, onViewChange }: HeaderProps) {
  const { time, date } = useClock();

  const urgentes = stats
    ? stats.total - stats.abertas - stats.emAndamento - stats.concluidas
    : 0;

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

        {stats && (
          <div className="hidden lg:flex items-center gap-1.5 flex-1 justify-center">
            <StatPill icon="clipboard" value={stats.abertas} label="Abertas" color="#4D94FF" tvMode={tvMode} />
            <div className="stat-divider" />
            <StatPill icon="activity" value={stats.emAndamento} label="Andamento" color="#A78BFA" tvMode={tvMode} />
            <div className="stat-divider" />
            <StatPill icon="flame" value={urgentes < 0 ? 0 : urgentes} label="Aguardando" color="#F59E0B" tvMode={tvMode} />
            <div className="stat-divider" />
            <StatPill icon="checkCircle" value={stats.concluidasHoje} label="Hoje" color="#4ADE80" tvMode={tvMode} />
            <div className="stat-divider" />
            <StatPill icon="calendarDays" value={stats.concluidasSemana} label="Semana" color="#22D3EE" tvMode={tvMode} />
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <div
            className="text-right rounded-xl px-4 py-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
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
        </div>
      </div>
    </header>
  );
}
