// Avatar reutilizável: mostra a foto do usuário; sem foto, mostra as iniciais
// dos dois primeiros nomes num círculo azul.
export function initialsFromName(name?: string | null): string {
  if (!name) return '?';
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
  title?: string;
}

export function Avatar({ name, src, size = 24, title }: AvatarProps) {
  const tip = title ?? (name || undefined);
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        title={tip}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '1px solid rgba(0,102,255,0.35)', flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      title={tip}
      style={{
        width: size, height: size, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,102,255,0.18)', border: '1px solid rgba(0,102,255,0.35)',
        color: '#4D94FF', fontWeight: 700, fontSize: Math.round(size * 0.42),
        flexShrink: 0, lineHeight: 1,
      }}
    >
      {initialsFromName(name)}
    </div>
  );
}
