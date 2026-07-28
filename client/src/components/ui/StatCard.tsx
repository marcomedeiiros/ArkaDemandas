interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
  large?: boolean;
}

export default function StatCard({ label, value, color = '#0066FF', icon, large }: StatCardProps) {
  return (
    <div
      className="stat-card-glow rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default"
      style={{
        '--glow-color': `${color}10`,
        background: 'rgba(21,25,34,0.85)',
        border: '1px solid rgba(35,45,63,0.8)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        padding: large ? '24px' : '16px',
      } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`font-medium ${large ? 'text-base' : 'text-sm'}`}
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          {label}
        </span>
        {icon && (
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>{icon}</span>
        )}
      </div>
      <div
        className={`font-bold leading-none ${large ? 'text-4xl' : 'text-3xl'}`}
        style={{ color, textShadow: `0 0 20px ${color}50` }}
      >
        {value}
      </div>
    </div>
  );
}
