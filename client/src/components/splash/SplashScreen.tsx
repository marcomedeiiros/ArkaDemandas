import { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase,    setPhase]    = useState<'entering' | 'visible' | 'leaving'>('entering');
  const [progress, setProgress] = useState(0);

  // Stable ref so the effect never re-runs when the parent re-renders
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        const step = prev < 70 ? 2 : prev < 90 ? 1.5 : 1;
        return Math.min(prev + step, 100);
      });
    }, 48);

    const leaveTimer    = setTimeout(() => setPhase('leaving'),          2900);
    const completeTimer = setTimeout(() => onCompleteRef.current(),      3500);

    return () => {
      clearInterval(interval);
      clearTimeout(leaveTimer);
      clearTimeout(completeTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once only onComplete is accessed via ref

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: '#0F1115',
        opacity: phase === 'leaving' ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
      }}
    >

      {/* ── Tech SVG background ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.04 }}
        viewBox="0 0 1920 1080"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Horizontal rails */}
        <line x1="0"    y1="540" x2="720"  y2="540" stroke="#0066FF" strokeWidth="1"/>
        <line x1="1200" y1="540" x2="1920" y2="540" stroke="#0066FF" strokeWidth="1"/>
        {/* Vertical rails */}
        <line x1="960" y1="0"   x2="960" y2="420" stroke="#0066FF" strokeWidth="1"/>
        <line x1="960" y1="660" x2="960" y2="1080" stroke="#0066FF" strokeWidth="1"/>
        {/* Corner connectors */}
        <line x1="200"  y1="200" x2="500"  y2="200" stroke="#0066FF" strokeWidth="0.6"/>
        <line x1="500"  y1="200" x2="500"  y2="350" stroke="#0066FF" strokeWidth="0.6"/>
        <line x1="1420" y1="200" x2="1720" y2="200" stroke="#0066FF" strokeWidth="0.6"/>
        <line x1="1420" y1="200" x2="1420" y2="350" stroke="#0066FF" strokeWidth="0.6"/>
        <line x1="200"  y1="880" x2="500"  y2="880" stroke="#0066FF" strokeWidth="0.6"/>
        <line x1="500"  y1="880" x2="500"  y2="730" stroke="#0066FF" strokeWidth="0.6"/>
        <line x1="1420" y1="880" x2="1720" y2="880" stroke="#0066FF" strokeWidth="0.6"/>
        <line x1="1420" y1="880" x2="1420" y2="730" stroke="#0066FF" strokeWidth="0.6"/>
        {/* Junction dots */}
        <circle cx="720"  cy="540" r="3" fill="#0066FF"/>
        <circle cx="1200" cy="540" r="3" fill="#0066FF"/>
        <circle cx="960"  cy="420" r="3" fill="#0066FF"/>
        <circle cx="960"  cy="660" r="3" fill="#0066FF"/>
        <circle cx="500"  cy="200" r="2" fill="#0066FF"/>
        <circle cx="1420" cy="200" r="2" fill="#0066FF"/>
        <circle cx="500"  cy="880" r="2" fill="#0066FF"/>
        <circle cx="1420" cy="880" r="2" fill="#0066FF"/>
        {/* Outer rectangle frame */}
        <rect x="720" y="420" width="480" height="240" rx="8"
          stroke="#0066FF" strokeWidth="0.5" strokeDasharray="6 4"/>
      </svg>

      {/* ── Ambient glow orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full animate-pulse-soft"
          style={{
            width: '700px', height: '700px',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse at center, rgba(0,102,255,0.09) 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '1100px', height: '1100px',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse at center, rgba(30,64,175,0.05) 0%, transparent 60%)',
            animation: 'pulseSoft 5s ease-in-out infinite',
          }}
        />
        {/* Side accent blobs */}
        <div style={{
          position: 'absolute', top: '20%', left: '5%',
          width: '300px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(0,102,255,0.04) 0%, transparent 70%)',
          animation: 'pulseSoft 6s ease-in-out 1s infinite',
        }}/>
        <div style={{
          position: 'absolute', bottom: '15%', right: '5%',
          width: '280px', height: '280px',
          background: 'radial-gradient(ellipse, rgba(30,64,175,0.04) 0%, transparent 70%)',
          animation: 'pulseSoft 7s ease-in-out 2s infinite',
        }}/>
      </div>

      {/* ── Main content ── */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{ gap: '28px', animation: 'fadeInUp 0.9s ease-out forwards' }}
      >

        {/* Logo */}
        <div style={{ animation: 'fadeInScale 0.85s ease-out 0.1s both' }}>
          <img
            src="/logo.png"
            alt="ARKA TECNOLOGIA"
            style={{
              width: '340px',
              maxWidth: '70vw',
              height: 'auto',
              filter: 'brightness(0) invert(1) drop-shadow(0 0 32px rgba(0,102,255,0.25))',
            }}
          />
        </div>

        {/* Horizontal accent line */}
        <div
          style={{
            width: '180px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #0066FF, transparent)',
            animation: 'fadeIn 1s ease-out 0.4s both',
          }}
        />

        {/* Greeting */}
        <p
          style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.45rem)',
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            lineHeight: 1.65,
            fontWeight: 500,
            maxWidth: '480px',
            padding: '0 20px',
            animation: 'fadeInUp 0.85s ease-out 0.5s both',
          }}
        >
          Olá, técnicos da{' '}
          <span
            style={{
              fontWeight: 700,
              color: '#4D94FF',
              textShadow: '0 0 28px rgba(0,102,255,0.6)',
            }}
          >
            ARKA Tecnologia
          </span>
          ,<br />
          tenham um ótimo dia! 🚀
        </p>

        {/* Progress bar container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.7s ease-out 0.85s both',
            width: '260px',
          }}
        >
          {/* Bar track */}
          <div
            style={{
              width: '100%',
              height: '3px',
              background: 'rgba(255,255,255,0.07)',
              borderRadius: '99px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #0066FF, #4D94FF)',
                boxShadow: '0 0 14px rgba(0,102,255,0.6)',
                borderRadius: '99px',
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          {/* Percentage */}
          <span
            style={{
              fontSize: '0.72rem',
              color: 'rgba(255,255,255,0.28)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            CARREGANDO {progress}%
          </span>
        </div>

        {/* Dots */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            animation: 'fadeIn 0.6s ease-out 1.1s both',
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#0066FF',
                boxShadow: '0 0 8px rgba(0,102,255,0.6)',
                animation: `bounceSub 1.4s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Footer branding ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 1s ease-out 1.2s both',
        }}
      >
        <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.15)' }}/>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', fontWeight: 600 }}>
          SISTEMA DE GESTÃO DE DEMANDAS
        </span>
        <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.15)' }}/>
      </div>
    </div>
  );
}
