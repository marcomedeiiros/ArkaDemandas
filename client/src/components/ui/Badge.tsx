interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export default function Badge({ children, color, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}
      style={color ? {
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}35`,
        boxShadow: `0 0 8px ${color}20`,
      } : undefined}
    >
      {children}
    </span>
  );
}
