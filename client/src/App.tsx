import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { X, ClipboardList, BarChart2, AlertTriangle, RefreshCw, Users as UsersIcon } from 'lucide-react';
import { useClock } from './hooks/useClock';
import SplashScreen from './components/splash/SplashScreen';
import Header from './components/layout/Header';
import KanbanBoard from './components/kanban/KanbanBoard';
import Dashboard from './components/dashboard/Dashboard';
import DemandModal from './components/modals/DemandModal';
import { useDemands } from './hooks/useDemands';
import { useStats } from './hooks/useStats';
import { useWebSocket } from './hooks/useWebSocket';
import { useColumns } from './hooks/useColumns';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/auth/LoginScreen';
import SettingsPage from './components/settings/SettingsPage';
import ColaboradoresPage from './components/colaboradores/ColaboradoresPage';
import { UsersProvider } from './context/UsersContext';
import { setApiUser } from './api';
import { getDeadlineStatus } from './utils/colors';
import { safeIconName } from './components/ui/Icon';
import type { Demand } from './types';

// Rotas <-> abas do topo/mobile
const VIEW_TO_PATH: Record<string, string> = {
  kanban: '/demandas',
  dashboard: '/dashboard',
  colaboradores: '/colaboradores',
};
const PATH_TO_VIEW: Record<string, string> = {
  '/demandas': 'kanban',
  '/dashboard': 'dashboard',
  '/colaboradores': 'colaboradores',
};

export default function App() {
  const [tvMode, setTvMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { demands, loading, error, fetchDemands, createDemand, updateDemand, deleteDemand, moveDemand, handleWsMessage: handleDemandWs } = useDemands();
  const { stats, refetch: refetchStats } = useStats();
  const { columns, createColumn, updateColumn, deleteColumn, handleWsMessage: handleColumnWs } = useColumns();
  const { user, loading: authLoading, isAuthenticated, oauthError, clearOauthError, justLoggedIn, clearJustLoggedIn, login, register, logout, updateProfile, changePassword, deleteAccount } = useAuth();
  const clock = useClock();

  const activeView = PATH_TO_VIEW[location.pathname] ?? 'kanban';

  // Contadores do topo derivados dos blocos reais (nome, cor, ícone e contagem
  // por status). Assim, se um bloco chama "123", o contador do topo mostra "123".
  const columnStats = columns.map(col => ({
    id: col.id,
    label: col.label,
    color: col.color,
    icon: safeIconName(col.icon),
    count: demands.filter(d => d.status === col.id).length,
  }));

  // Demandas atrasadas / vencendo usadas nas notificações (sino do topo).
  const overdueDemands = demands.filter(
    d => !d.data_conclusao && getDeadlineStatus(d.prazo) === 'overdue'
  );
  const dueSoonDemands = demands.filter(
    d => !d.data_conclusao && getDeadlineStatus(d.prazo) === 'warning'
  );

  // Modo TV / topo: só os blocos criados.
  const tvCounters = columnStats.map(c => ({ label: c.label, value: c.count, color: c.color }));

  const onWsMessage = useCallback((msg: { type: string; data: unknown }) => {
    handleDemandWs(msg);
    handleColumnWs(msg);
    refetchStats();
  }, [handleDemandWs, handleColumnWs, refetchStats]);

  useWebSocket(onWsMessage);

  // Atribui as ações de demandas ao colaborador logado (header X-User nos logs).
  useEffect(() => {
    setApiUser(user?.name);
  }, [user?.name]);

  useEffect(() => {
    if (tvMode) {
      document.documentElement.classList.add('tv-mode');
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.documentElement.classList.remove('tv-mode');
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [tvMode]);

  const handleEdit = useCallback((demand: Demand) => {
    setEditingDemand(demand);
    setModalOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    // Não permite criar demandas se não houver nenhum bloco/coluna.
    if (columns.length === 0) return;
    setEditingDemand(null);
    setModalOpen(true);
  }, [columns.length]);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      await fetch(`/api/demands/${id}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-User': user?.name || 'Sistema' },
      });
    } catch (err) {
      console.error('Error duplicating demand:', err);
    }
  }, [user?.name]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDemand(id);
    } catch (err) {
      console.error('Error deleting demand:', err);
    }
  }, [deleteDemand]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingDemand(null);
  }, []);

  // Após um login por formulário, vai para as demandas (o splash aparece antes).
  const handleLogin = useCallback(async (email: string, password: string) => {
    await login(email, password);
    navigate('/demandas');
  }, [login, navigate]);

  // Registro NÃO autentica: a própria LoginScreen exibe o pop-up e leva ao login.
  const handleRegister = useCallback(async (name: string, email: string, password: string, cargo?: string) => {
    await register(name, email, password, cargo);
  }, [register]);

  const goToView = useCallback((view: string) => {
    navigate(VIEW_TO_PATH[view] ?? '/demandas');
  }, [navigate]);

  // ── Validando sessão ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-arka-dark">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
        </div>
      </div>
    );
  }

  // ── Tela de boas-vindas: aparece logo DEPOIS de logar ───────────────────────
  if (isAuthenticated && justLoggedIn) {
    return <SplashScreen onComplete={clearJustLoggedIn} />;
  }

  // ── Não autenticado → rota de login ─────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <LoginScreen
              mode="login"
              onLogin={handleLogin}
              onRegister={handleRegister}
              oauthError={oauthError}
              onClearOauthError={clearOauthError}
            />
          }
        />
        <Route
          path="/cadastrar-conta"
          element={
            <LoginScreen
              mode="register"
              onLogin={handleLogin}
              onRegister={handleRegister}
              oauthError={oauthError}
              onClearOauthError={clearOauthError}
            />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ── Tela de erro de conexão ─────────────────────────────────────────────────
  if (error && demands.length === 0 && !loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-arka-dark gap-6 p-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertTriangle size={32} style={{ color: '#F87171' }} />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-xl mb-2">Não foi possível conectar ao servidor</p>
          <p className="text-white/40 text-sm max-w-sm">
            Verifique se o backend está rodando na porta 3001 e tente novamente.
          </p>
          <p
            className="mt-3 font-mono text-xs px-3 py-1.5 rounded-lg inline-block"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {error}
          </p>
        </div>
        <button
          onClick={fetchDemands}
          className="btn-primary flex items-center gap-2"
          style={{ height: '42px', padding: '0 24px' }}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  const showLoading = loading && demands.length === 0;

  const renderKanban = (tv: boolean) => (
    <KanbanBoard
      demands={demands}
      columns={columns}
      onMove={moveDemand}
      onEdit={handleEdit}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onCreate={handleCreate}
      onCreateColumn={createColumn}
      onUpdateColumn={updateColumn}
      onDeleteColumn={deleteColumn}
      tvMode={tv}
    />
  );

  return (
    <UsersProvider currentUserName={user?.name} currentUserRole={user?.role}>
    <div className={`h-screen flex flex-col bg-arka-dark ${tvMode ? 'tv-mode' : ''}`}>
      {!tvMode && (
        <Header
          columnStats={columnStats}
          tvMode={tvMode}
          onToggleTv={() => setTvMode(prev => !prev)}
          activeView={activeView}
          onViewChange={goToView}
          overdueDemands={overdueDemands}
          dueSoonDemands={dueSoonDemands}
          userName={user?.name}
          avatarUrl={user?.avatar_url}
          onLogout={logout}
        />
      )}

      {tvMode && (
        <div
          className="shrink-0 flex items-center justify-between px-6 py-3 gap-4"
          style={{
            background: 'rgba(12,15,20,0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <img
            src="/logo.png"
            alt="ARKA"
            style={{ height: '40px', filter: 'brightness(0) invert(1)' }}
          />

          {/* TV Mode Stat Counters: No card bg, neon glowing numbers, straight vertical bar | separators */}
          {tvCounters.length > 0 && (
            <div className="flex items-center justify-center flex-1 max-w-6xl mx-auto px-4">
              {tvCounters.map((card, i, arr) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center justify-center text-center px-3 xl:px-5">
                    <span
                      className="text-3xl xl:text-4xl font-extrabold tabular-nums leading-tight"
                      style={{
                        color: card.color,
                        textShadow: `0 0 16px ${card.color}, 0 0 32px ${card.color}80`,
                      }}
                    >
                      {card.value}
                    </span>
                    <span className="text-[11px] xl:text-xs font-semibold text-white/60 whitespace-nowrap mt-0.5 tracking-wide">
                      {card.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="h-8 xl:h-10 w-[1.5px] shrink-0"
                      style={{ background: 'rgba(255, 255, 255, 0.2)' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums text-white">{clock.time}</div>
              <div className="text-xs text-white/30 capitalize">{clock.date}</div>
            </div>
            <button
              onClick={() => setTvMode(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden">
        {tvMode ? (
          renderKanban(true)
        ) : showLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-arka-blue/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-arka-blue animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white/70 font-medium text-lg">Carregando demandas...</p>
                <p className="text-white/30 text-sm mt-1">Conectando ao servidor ARKA</p>
              </div>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/demandas" element={renderKanban(false)} />
            <Route path="/dashboard" element={<Dashboard stats={stats} />} />
            <Route path="/colaboradores" element={<ColaboradoresPage />} />
            <Route
              path="/configuracoes"
              element={
                <SettingsPage
                  user={user!}
                  onUpdateProfile={updateProfile}
                  onChangePassword={changePassword}
                  onDeleteAccount={deleteAccount}
                  onBack={() => navigate('/demandas')}
                />
              }
            />
            <Route path="*" element={<Navigate to="/demandas" replace />} />
          </Routes>
        )}
      </main>

      <DemandModal
        open={modalOpen}
        onClose={handleCloseModal}
        demand={editingDemand}
        onSave={createDemand}
        onUpdate={updateDemand}
        onDelete={deleteDemand}
      />

      {/* Mobile nav */}
      <nav
        className="md:hidden flex items-center justify-around py-2 shrink-0"
        style={{
          background: 'rgba(15,17,21,0.95)',
          borderTop: '1px solid rgba(35,45,63,0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {[
          { id: 'kanban',        label: 'Kanban',        Icon: ClipboardList },
          { id: 'dashboard',     label: 'Dashboard',     Icon: BarChart2     },
          { id: 'colaboradores', label: 'Equipe',        Icon: UsersIcon     },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => goToView(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeView === item.id ? 'text-arka-blue' : 'text-white/40'
            }`}
          >
            <item.Icon size={22} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
    </UsersProvider>
  );
}
