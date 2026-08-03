import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, LogIn, UserPlus, AlertTriangle, Eye, EyeOff, Check } from 'lucide-react';
import GridBackground from './GridBackground';

interface LoginScreenProps {
  mode?: 'login' | 'register';
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, cargo?: string) => Promise<void>;
  oauthError?: string | null;
  onClearOauthError?: () => void;
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_nao_configurado: 'O login com Google ainda não foi configurado no servidor.',
  microsoft_nao_configurado: 'O login com Microsoft ainda não foi configurado no servidor.',
  provedor_invalido: 'Provedor de login inválido.',
  sem_codigo: 'O provedor não retornou um código de autorização.',
  state_invalido: 'Sessão de login expirada. Tente novamente.',
  token_falhou: 'Não foi possível validar o login com o provedor.',
  sem_email: 'Não foi possível obter o e-mail da sua conta.',
  erro_interno: 'Erro interno ao concluir o login social.',
};

// ── Ícones de marca (inline) ─────────────────────────────────────────────────
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.5 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.6l6.6 5.6C41.9 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function MicrosoftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 23" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#7FBA00" d="M12 1h10v10H12z"/>
      <path fill="#00A4EF" d="M1 12h10v10H1z"/>
      <path fill="#FFB900" d="M12 12h10v10H12z"/>
    </svg>
  );
}

export default function LoginScreen({ mode = 'login', onLogin, onRegister, oauthError, onClearOauthError }: LoginScreenProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [cargo, setCargo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; microsoft: boolean }>({ google: false, microsoft: false });

  const isLogin = mode === 'login';

  // Descobre quais logins sociais já estão configurados no servidor (.env).
  useEffect(() => {
    fetch('/api/auth/providers')
      .then(r => r.json())
      .then(setProviders)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isLogin && !name.trim()) { setError('Informe seu nome'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('E-mail inválido'); return; }
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres'); return; }

    setSubmitting(true);
    try {
      if (isLogin) {
        setEntrando(true); // mostra o aviso "Entrando…"
        await new Promise(res => setTimeout(res, 700));
        await onLogin(email.trim(), password);
        // mantém o aviso até a tela transicionar para o painel
      } else {
        await onRegister(name.trim(), email.trim(), password, cargo.trim());
        setRegistered(true); // mostra o pop-up de sucesso (não faz login direto)
      }
    } catch (err) {
      setEntrando(false);
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setSubmitting(false);
    }
  };

  const social = (provider: 'google' | 'microsoft') => {
    onClearOauthError?.();
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const oauthMsg = oauthError ? (OAUTH_ERROR_MESSAGES[oauthError] || 'Não foi possível concluir o login social.') : null;

  return (
    <div
      className="h-screen w-full relative overflow-y-auto overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at top, #0d1622 0%, #080a0f 60%, #05070a 100%)' }}
    >
      {/* Fundos fixos (não rolam com o conteúdo) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,102,255,0.18), transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.14), transparent 70%)' }} />
        <GridBackground className="z-0" />
      </div>

      {/* Pop-up de conta criada */}
      {registered && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-fade-in" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} />
          <div
            className="relative w-full max-w-sm rounded-2xl animate-fade-in-scale overflow-hidden"
            style={{ background: 'rgba(13,16,22,0.99)', border: '1px solid rgba(34,197,94,0.25)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', padding: '28px' }}
          >
            <div className="h-[2px] absolute top-0 left-0 right-0" style={{ background: 'linear-gradient(90deg, transparent, #22C55E, transparent)' }} />
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Check size={28} style={{ color: '#4ADE80' }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Conta criada com sucesso!</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Agora faça login para acessar o painel.
              </p>
              <button
                onClick={() => { setRegistered(false); setPassword(''); navigate('/login'); }}
                className="btn-primary w-full flex items-center justify-center gap-2"
                style={{ height: '42px' }}
              >
                <LogIn size={16} /> Ir para o login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso "Entrando…" ao logar (portal no body para centralizar na tela) */}
      {entrando && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 p-6 animate-fade-in"
          style={{ background: 'rgba(8,10,14,0.94)', backdropFilter: 'blur(8px)' }}
        >
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">Entrando…</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Carregando seu painel</p>
          </div>
        </div>,
        document.body
      )}

      {/* Centralizador rolável em telas baixas o conteúdo rola em vez de cortar */}
      <div className="relative min-h-full flex items-center justify-center p-4 py-8">
      <div
        className="relative z-10 w-full max-w-md rounded-2xl animate-fade-in-scale overflow-hidden"
        style={{
          background: 'rgba(13,16,22,0.96)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(0,102,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          className="h-[3px] animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, #0066FF 20%, #00E0FF 50%, #0066FF 80%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />

        <div className="px-6 sm:px-8 pt-8 pb-7">
          {/* Logo + título */}
          <div className="flex flex-col items-center text-center mb-7">
            <img src="/logo.png" alt="ARKA" style={{ height: '40px', filter: 'brightness(0) invert(1)' }} className="mb-4" />
            <h1 className="text-xl font-bold text-white">{isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isLogin ? 'Entre para acessar o painel de demandas' : 'Preencha os dados para começar'}
            </p>
          </div>

          {/* Erro de login social */}
          {oauthMsg && (
            <div
              className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', color: '#FCD34D' }}
            >
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>{oauthMsg}</span>
            </div>
          )}

          {/* Botões sociais + divisor (apenas no login) */}
          {isLogin && (
          <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => social('google')}
              title={providers.google ? 'Entrar com Google' : 'Google ainda não configurado no servidor (.env)'}
              className="flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', opacity: providers.google ? 1 : 0.5 }}
            >
              <GoogleIcon /> Google
            </button>
            <button
              type="button"
              onClick={() => social('microsoft')}
              title={providers.microsoft ? 'Entrar com Microsoft' : 'Microsoft ainda não configurado no servidor (.env)'}
              className="flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', opacity: providers.microsoft ? 1 : 0.5 }}
            >
              <MicrosoftIcon /> Microsoft
            </button>
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>ou com e-mail</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.09)' }} />
          </div>
          </>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <>
                <FieldInput icon={<User size={15} />} type="text" placeholder="Seu nome" value={name} onChange={setName} autoFocus />
                <FieldInput icon={<Briefcase size={15} />} type="text" placeholder="Seu cargo (ex.: Técnico de TI)" value={cargo} onChange={setCargo} />
              </>
            )}
            <FieldInput icon={<Mail size={15} />} type="email" placeholder="suporte5@gmail.com" value={email} onChange={setEmail} autoFocus={isLogin} />
            <div className="relative">
              <FieldInput
                icon={<Lock size={15} />}
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={setPassword}
                paddingRight
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10 transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <p className="text-xs flex items-center gap-1.5" style={{ color: '#F87171' }}>
                <AlertTriangle size={13} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ height: '44px', fontSize: '0.9rem' }}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                <><LogIn size={16} /> Entrar</>
              ) : (
                <><UserPlus size={16} /> Criar conta</>
              )}
            </button>
          </form>

          {/* Alternar modo */}
          <div className="text-center mt-5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isLogin ? 'Ainda não tem conta?' : 'Já tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => { setError(''); navigate(isLogin ? '/cadastrar-conta' : '/login'); }}
              className="font-semibold transition-colors"
              style={{ color: '#4D94FF' }}
            >
              {isLogin ? 'Criar agora' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// Campo de input reutilizável com ícone à esquerda
function FieldInput({
  icon, type, placeholder, value, onChange, autoFocus, paddingRight,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  paddingRight?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="input-premium w-full"
        style={{ height: '44px', paddingLeft: '38px', paddingRight: paddingRight ? '40px' : '12px', fontSize: '0.88rem' }}
      />
    </div>
  );
}
