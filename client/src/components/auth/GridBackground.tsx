/**
 * Fundo minimalista de grade (quadrados sutis), estilo "blueprint" de T.I.
 * CSS puro e leve linhas finas que desvanecem nas bordas para dar profundidade,
 * com um leve movimento contínuo (uma célula a cada ciclo, sem "pulos").
 */
export default function GridBackground({ className }: { className?: string }) {
  const fade = 'radial-gradient(ellipse 85% 85% at 50% 38%, #000 35%, transparent 100%)';
  return (
    <div className={className} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Grade */}
      <div
        className="animate-grid-pan"
        style={{
          position: 'absolute',
          inset: '-56px',
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),' +
            'linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: fade,
          WebkitMaskImage: fade,
        }}
      />
      {/* Brilho azul central para dar profundidade à grade */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,102,255,0.06), transparent 70%)',
        }}
      />
    </div>
  );
}
